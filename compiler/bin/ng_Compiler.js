class CmdParams  {
  constructor() {
    this.flags = {};
    this.params = {};
    this.values = [];
  }
  hasParam (name) {
    return ( typeof(this.params[name] ) != "undefined" && this.params.hasOwnProperty(name) );
  };
  getParam (name) {
    return this.params[name];
  };
  collect () {
    let cnt = (process.argv.length - 2);
    let i = 0;
    while (cnt > 0) {
      const argStr = process.argv[ 2 + i];
      const firstC = argStr.charCodeAt(0 );
      if ( firstC == (45) ) {
        const pS = argStr.substring(1, (argStr.length) );
        const parts = pS.split("=");
        if ( (parts.length) == 1 ) {
          const flag = parts[0];
          this.flags[flag] = true;
        } else {
          const name = parts[0];
          parts.splice(0, 1).pop();
          const value = parts.join("=");
          this.params[name] = value;
        }
      } else {
        this.values.push(argStr);
      }
      cnt = cnt - 1;
      i = i + 1;
    };
  };
  toDictionary () {
    let res = {};
    try {
      let values_1 = {};
      const keyList = Object.keys(this.flags);
      for ( let index = 0; index < keyList.length; index++) {
        var keyname = keyList[index];
        const item = (this.flags[keyname]);
        values_1[keyname] = item;
      };
      res["flags"] = values_1;
      let values_2 = {};
      const keyList_1 = Object.keys(this.params);
      for ( let index_1 = 0; index_1 < keyList_1.length; index_1++) {
        var keyname_1 = keyList_1[index_1];
        const item_1 = (this.params[keyname_1]);
        values_2[keyname_1] = item_1;
      };
      res["params"] = values_2;
      let values_3 = [];
      for ( let i = 0; i < this.values.length; i++) {
        var item_2 = this.values[i];
        values_3.push(item_2);
      };
      res["values"] = values_3;
    } catch(e) {
    }
    return res;
  };
}
CmdParams.fromDictionary = async function(dict) {
  const obj = new CmdParams();
  try {
    const values = (dict["flags"] instanceof Object ) ? dict ["flags"] : undefined ;
    if ( (typeof(values) !== "undefined" && values != null )  ) {
      const theObjflags = values;
      const obj_keys = Object.keys(theObjflags);
      await operatorsOf.forEach_12(obj_keys, ((item, index) => { 
        const v = typeof(theObjflags [item]) === "undefined" ? undefined :(theObjflags [item]) ;
        if ( (typeof(v) !== "undefined" && v != null )  ) {
          obj.flags[item] = v;
        }
      }));
    }
    const values_1 = (dict["params"] instanceof Object ) ? dict ["params"] : undefined ;
    if ( (typeof(values_1) !== "undefined" && values_1 != null )  ) {
      const theObjparams = values_1;
      const obj_keys_1 = Object.keys(theObjparams);
      await operatorsOf.forEach_12(obj_keys_1, ((item, index) => { 
        const v_1 = (typeof (theObjparams [item]) != "string" ) ? undefined : theObjparams [item] 
        ;
        if ( (typeof(v_1) !== "undefined" && v_1 != null )  ) {
          obj.params[item] = v_1;
        }
      }));
    }
    const values_2 = (dict["values"] instanceof Array ) ? dict ["values"] : undefined ;
    if ( (typeof(values_2) !== "undefined" && values_2 != null )  ) {
      const arr = values_2;
      operatorsOfJSONArrayObject_58.forEach_59(arr, ((item, index) => { 
        if( typeof(item) === 'string' ) /* union case for string */ {
          var oo = item;
          obj.values.push(oo);
        };
      }));
    }
  } catch(e) {
  }
  return obj;
};
class test_cmdparams  {
  constructor() {
  }
  run () {
    const prms = new CmdParams();
    prms.collect();
    console.log("--- params ----");
    const pNames = Object.keys(prms.params);
    for ( let i = 0; i < pNames.length; i++) {
      var v = pNames[i];
      console.log((v + " = ") + ((prms.params[v])));
    };
    console.log("--- flags ----");
    const flagNames = Object.keys(prms.flags);
    for ( let i_1 = 0; i_1 < flagNames.length; i_1++) {
      var v_1 = flagNames[i_1];
      console.log(v_1);
    };
    console.log("--- values ----");
    for ( let i_2 = 0; i_2 < prms.values.length; i_2++) {
      var v_2 = prms.values[i_2];
      console.log(v_2);
    };
  };
}
class InputFSFolder  {
  constructor() {
    this.name = "";
    this.data = "";
    this.is_folder = true;
    this.base64bin = false;
    this.folders = [];
    this.files = [];
  }
  forTree (cb) {
    cb(this);
    operatorsOf.forEach_2(this.folders, ((item, index) => { 
      item.forTree(cb);
    }));
  };
  toDictionary () {
    let res = {};
    try {
      res["name"] = this.name;
      res["data"] = this.data;
      res["is_folder"] = this.is_folder;
      res["base64bin"] = this.base64bin;
      let values = [];
      for ( let i = 0; i < this.folders.length; i++) {
        var item = this.folders[i];
        const obj = item.toDictionary();
        values.push(obj);
      };
      res["folders"] = values;
      let values_1 = [];
      for ( let i_1 = 0; i_1 < this.files.length; i_1++) {
        var item_1 = this.files[i_1];
        const obj_1 = item_1.toDictionary();
        values_1.push(obj_1);
      };
      res["files"] = values_1;
    } catch(e) {
    }
    return res;
  };
}
InputFSFolder.fromDictionary = async function(dict) {
  const obj = new InputFSFolder();
  try {
    const v = (typeof (dict ["name"]) != "string" ) ? undefined : dict ["name"] 
    ;
    if ( (typeof(v) !== "undefined" && v != null )  ) {
      obj.name = v;
    }
    const v_1 = (typeof (dict ["data"]) != "string" ) ? undefined : dict ["data"] 
    ;
    if ( (typeof(v_1) !== "undefined" && v_1 != null )  ) {
      obj.data = v_1;
    }
    const v_2 = typeof(dict ["is_folder"]) === "undefined" ? undefined :(dict ["is_folder"]) ;
    if ( (typeof(v_2) !== "undefined" && v_2 != null )  ) {
      obj.is_folder = v_2;
    }
    const v_3 = typeof(dict ["base64bin"]) === "undefined" ? undefined :(dict ["base64bin"]) ;
    if ( (typeof(v_3) !== "undefined" && v_3 != null )  ) {
      obj.base64bin = v_3;
    }
    const values = (dict["folders"] instanceof Array ) ? dict ["folders"] : undefined ;
    if ( (typeof(values) !== "undefined" && values != null )  ) {
      const arr = values;
      await operatorsOf_58.forEach_59(arr, (async (item, index) => { 
        if( item instanceof Object ) /* union case */ {
          var oo = item;
          const newObj = await InputFSFolder.fromDictionary(oo);
          obj.folders.push(newObj);
        };
      }));
    }
    const values_1 = (dict["files"] instanceof Array ) ? dict ["files"] : undefined ;
    if ( (typeof(values_1) !== "undefined" && values_1 != null )  ) {
      const arr_1 = values_1;
      await operatorsOf_58.forEach_59(arr_1, ((item, index) => { 
        if( item instanceof Object ) /* union case */ {
          var oo_1 = item;
          const newObj_1 = InputFSFile.fromDictionary(oo_1);
          obj.files.push(newObj_1);
        };
      }));
    }
  } catch(e) {
  }
  return obj;
};
class InputFSFile  {
  constructor() {
    this.name = "";
    this.data = "";
    this.is_folder = false;
    this.base64bin = false;
  }
  toDictionary () {
    let res = {};
    try {
      res["name"] = this.name;
      res["data"] = this.data;
      res["is_folder"] = this.is_folder;
      res["base64bin"] = this.base64bin;
    } catch(e) {
    }
    return res;
  };
}
InputFSFile.fromDictionary = function(dict) {
  const obj = new InputFSFile();
  try {
    const v = (typeof (dict ["name"]) != "string" ) ? undefined : dict ["name"] 
    ;
    if ( (typeof(v) !== "undefined" && v != null )  ) {
      obj.name = v;
    }
    const v_1 = (typeof (dict ["data"]) != "string" ) ? undefined : dict ["data"] 
    ;
    if ( (typeof(v_1) !== "undefined" && v_1 != null )  ) {
      obj.data = v_1;
    }
    const v_2 = typeof(dict ["is_folder"]) === "undefined" ? undefined :(dict ["is_folder"]) ;
    if ( (typeof(v_2) !== "undefined" && v_2 != null )  ) {
      obj.is_folder = v_2;
    }
    const v_3 = typeof(dict ["base64bin"]) === "undefined" ? undefined :(dict ["base64bin"]) ;
    if ( (typeof(v_3) !== "undefined" && v_3 != null )  ) {
      obj.base64bin = v_3;
    }
  } catch(e) {
  }
  return obj;
};
class InputEnv  {
  constructor() {
    this.use_real = false;
    this.envVars = {};
  }
  toDictionary () {
    let res = {};
    try {
      res["use_real"] = this.use_real;
      if ( (typeof(this.filesystem) !== "undefined" && this.filesystem != null )  ) {
        res["filesystem"] = ((this.filesystem)).toDictionary();
      }
      let values = {};
      const keyList = Object.keys(this.envVars);
      for ( let index = 0; index < keyList.length; index++) {
        var keyname = keyList[index];
        const item = (this.envVars[keyname]);
        values[keyname] = item;
      };
      res["envVars"] = values;
      if ( (typeof(this.commandLine) !== "undefined" && this.commandLine != null )  ) {
        res["commandLine"] = ((this.commandLine)).toDictionary();
      }
    } catch(e) {
    }
    return res;
  };
}
InputEnv.fromDictionary = async function(dict) {
  const obj = new InputEnv();
  try {
    const v = typeof(dict ["use_real"]) === "undefined" ? undefined :(dict ["use_real"]) ;
    if ( (typeof(v) !== "undefined" && v != null )  ) {
      obj.use_real = v;
    }
    const theValue = (dict["filesystem"] instanceof Object ) ? dict ["filesystem"] : undefined ;
    if ( (typeof(theValue) !== "undefined" && theValue != null )  ) {
      const newObj = await InputFSFolder.fromDictionary((theValue));
      obj.filesystem = newObj;
    }
    const values = (dict["envVars"] instanceof Object ) ? dict ["envVars"] : undefined ;
    if ( (typeof(values) !== "undefined" && values != null )  ) {
      const theObjenvVars = values;
      const obj_keys = Object.keys(theObjenvVars);
      await operatorsOf.forEach_12(obj_keys, ((item, index) => { 
        const v_1 = (typeof (theObjenvVars [item]) != "string" ) ? undefined : theObjenvVars [item] 
        ;
        if ( (typeof(v_1) !== "undefined" && v_1 != null )  ) {
          obj.envVars[item] = v_1;
        }
      }));
    }
    const theValue_1 = (dict["commandLine"] instanceof Object ) ? dict ["commandLine"] : undefined ;
    if ( (typeof(theValue_1) !== "undefined" && theValue_1 != null )  ) {
      const newObj_1 = await CmdParams.fromDictionary((theValue_1));
      obj.commandLine = newObj_1;
    }
  } catch(e) {
  }
  return obj;
};
class test_input_filesystem  {
  constructor() {
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
  };
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
  };
  addEvent (name, e) {
    if ( (( typeof(this.events[name] ) != "undefined" && this.events.hasOwnProperty(name) )) == false ) {
      this.events[name] = new RangerParamEventList();
    }
    const list = (this.events[name]);
    list.list.push(e);
  };
  fireEvent (name, from) {
    if ( ( typeof(this.events[name] ) != "undefined" && this.events.hasOwnProperty(name) ) ) {
      const list = (this.events[name]);
      for ( let i = 0; i < list.list.length; i++) {
        var ev = list.list[i];
        ev.callback(from);
      };
    }
  };
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
    this.double_value = 0.0;     /** note: unused */
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
    this.is_register = false;
    this.ref_cnt = 0;
    this.init_cnt = 0;
    this.set_cnt = 0;
    this.return_cnt = 0;
    this.prop_assign_cnt = 0;     /** note: unused */
    this.value_type = 0;
    this.has_default = false;     /** note: unused */
    this.isThis = false;     /** note: unused */
    this.is_immutable = false;
    this.is_static = false;     /** note: unused */
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
    this.git_doc = "";
    this.has_events = false;
  }
  addEvent (name, e) {
    if ( this.has_events == false ) {
      this.eMap = new RangerParamEventMap();
      this.has_events = true;
    }
    this.eMap.addEvent(name, e);
  };
  changeStrength (newStrength, lifeTime, changer) {
    const entry = new RangerRefForce();
    entry.strength = newStrength;
    entry.lifetime = lifeTime;
    entry.changer = changer;
    this.ownerHistory.push(entry);
  };
  isFunction () {
    return false;
  };
  isProperty () {
    return true;
  };
  isClass () {
    return false;
  };
  isOperator () {
    return false;
  };
  doesInherit () {
    return false;
  };
  isAllocatedType () {
    if ( (typeof(this.nameNode) !== "undefined" && this.nameNode != null )  ) {
      if ( this.nameNode.eval_type != 0 ) {
        if ( this.nameNode.eval_type == 6 ) {
          return true;
        }
        if ( this.nameNode.eval_type == 7 ) {
          return true;
        }
        if ( (((((this.nameNode.eval_type == 15) || (this.nameNode.eval_type == 14)) || (this.nameNode.eval_type == 4)) || (this.nameNode.eval_type == 2)) || (this.nameNode.eval_type == 5)) || (this.nameNode.eval_type == 3) ) {
          return false;
        }
        if ( this.nameNode.eval_type == 13 ) {
          return false;
        }
        return true;
      }
      if ( this.nameNode.eval_type == 13 ) {
        return false;
      }
      if ( this.nameNode.value_type == 11 ) {
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
  };
  moveRefTo (nodeToMove, target, ctx) {
    const b_disable_errors = true;
    if ( nodeToMove.ref_change_done ) {
      return;
    }
    if ( false == target.isAllocatedType() ) {
      return;
    }
    if ( false == this.isAllocatedType() ) {
      return;
    }
    nodeToMove.ref_change_done = true;
    const other_s = target.getStrength();
    const my_s = this.getStrength();
    let my_lifetime = this.getLifetime();
    const other_lifetime = target.getLifetime();
    let a_lives = false;
    let b_lives = false;
    const tmp_var = this.nameNode.hasFlag("temp");
    if ( (typeof(target.nameNode) !== "undefined" && target.nameNode != null )  ) {
      if ( target.nameNode.hasFlag("lives") ) {
        my_lifetime = 2;
        b_lives = true;
      }
    }
    if ( (typeof(this.nameNode) !== "undefined" && this.nameNode != null )  ) {
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
        this.changeStrength(0, lt, nodeToMove);
      } else {
        if ( my_s == 0 ) {
          if ( tmp_var == false ) {
            if ( false == b_disable_errors ) {
              ctx.addError(nodeToMove, "Can not move a weak reference to a strong target.");
              console.log("can not move weak refs to strong target:");
              this.debugRefChanges();
            }
          }
        } else {
          if ( false == b_disable_errors ) {
            ctx.addError(nodeToMove, "Can not move immutable reference to a strong target, evald type " + this.nameNode.eval_type_name);
          }
        }
      }
    } else {
      if ( a_lives || b_lives ) {
      } else {
        if ( (my_lifetime < other_lifetime) && (this.return_cnt == 0) ) {
          if ( this.nameNode.hasFlag("returnvalue") == false ) {
            if ( false == b_disable_errors ) {
              ctx.addError(nodeToMove, "Can not create a weak reference if target has longer lifetime than original, current lifetime == " + my_lifetime);
            }
          }
        }
      }
    }
  };
  originalStrength () {
    const __len = this.ownerHistory.length;
    if ( __len > 0 ) {
      const firstEntry = this.ownerHistory[0];
      return firstEntry.strength;
    }
    return 1;
  };
  getLifetime () {
    const __len = this.ownerHistory.length;
    if ( __len > 0 ) {
      const lastEntry = this.ownerHistory[(__len - 1)];
      return lastEntry.lifetime;
    }
    return 1;
  };
  getStrength () {
    const __len = this.ownerHistory.length;
    if ( __len > 0 ) {
      const lastEntry = this.ownerHistory[(__len - 1)];
      return lastEntry.strength;
    }
    return 1;
  };
  debugRefChanges () {
    console.log(("variable " + this.name) + " ref history : ");
    for ( let i = 0; i < this.ownerHistory.length; i++) {
      var h = this.ownerHistory[i];
      console.log(((" => change to " + h.strength) + " by ") + h.changer.getCode());
    };
  };
  pointsToObject (ctx) {
    if ( (typeof(this.nameNode) !== "undefined" && this.nameNode != null )  ) {
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
      };
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
        };
        return is_object;
      }
      if ( this.nameNode.value_type == 11 ) {
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
        };
        if ( ctx.isEnumDefined(this.nameNode.type_name) ) {
          return false;
        }
        return is_object_1;
      }
    }
    return false;
  };
  isObject () {
    if ( (typeof(this.nameNode) !== "undefined" && this.nameNode != null )  ) {
      if ( this.nameNode.value_type == 11 ) {
        if ( false == this.nameNode.isPrimitive() ) {
          return true;
        }
      }
    }
    return false;
  };
  isArray () {
    if ( (typeof(this.nameNode) !== "undefined" && this.nameNode != null )  ) {
      if ( this.nameNode.value_type == 6 ) {
        return true;
      }
    }
    return false;
  };
  isHash () {
    if ( (typeof(this.nameNode) !== "undefined" && this.nameNode != null )  ) {
      if ( this.nameNode.value_type == 7 ) {
        return true;
      }
    }
    return false;
  };
  isPrimitive () {
    if ( (typeof(this.nameNode) !== "undefined" && this.nameNode != null )  ) {
      return this.nameNode.isPrimitive();
    }
    return false;
  };
  getRefTypeName () {
    switch (this.refType ) { 
      case 0 : 
        return "NoType";
      case 1 : 
        return "Weak";
    };
    return "";
  };
  getVarTypeName () {
    switch (this.refType ) { 
      case 0 : 
        return "NoType";
      case 1 : 
        return "This";
    };
    return "";
  };
  getTypeName () {
    const s = this.nameNode.type_name;
    return s;
  };
}
class RangerAppFunctionDesc  extends RangerAppParamDesc {
  constructor() {
    super()
    this.name = "";
    this.ref_cnt = 0;
    this.params = [];
    this.is_method = false;     /** note: unused */
    this.is_static = false;
    this.is_lambda = false;
    this.is_unsed = false;
    this.is_called_from_main = false;
    this.refType = 0;
    this.call_graph_done = false;     /** note: unused */
    this.isCalling = [];
    this.isCalledBy = [];
    this.isUsingClasses = [];
    this.isDirectlyUsingClasses = [];
    this.myLambdas = [];
  }
  addCallTo (m) {
    if ( (m.isCalledBy.indexOf(this)) < 0 ) {
      m.isCalledBy.push(this);
      this.isCalling.push(m);
    }
  };
  addIndirectClassUsage (m, ctx) {
    if ( (this.isUsingClasses.indexOf(m)) < 0 ) {
      this.isUsingClasses.push(m);
      operatorsOf.forEach_11(m.variables, ((item, index) => { 
        const nn = item.nameNode;
        if ( ctx.isDefinedClass(nn.type_name) ) {
          const cc = ctx.findClass(nn.type_name);
          this.addIndirectClassUsage(cc, ctx);
        }
        if ( ctx.isDefinedClass(nn.array_type) ) {
          const cc_1 = ctx.findClass(nn.array_type);
          this.addIndirectClassUsage(cc_1, ctx);
        }
      }));
    }
  };
  addClassUsage (m, ctx) {
    if ( (this.isUsingClasses.indexOf(m)) < 0 ) {
      this.isUsingClasses.push(m);
      this.isDirectlyUsingClasses.push(m);
      operatorsOf.forEach_11(m.variables, ((item, index) => { 
        const nn = item.nameNode;
        if ( ctx.isDefinedClass(nn.type_name) ) {
          const cc = ctx.findClass(nn.type_name);
          this.addIndirectClassUsage(cc, ctx);
        }
        if ( ctx.isDefinedClass(nn.array_type) ) {
          const cc_1 = ctx.findClass(nn.array_type);
          this.addIndirectClassUsage(cc_1, ctx);
        }
      }));
    } else {
      if ( (this.isDirectlyUsingClasses.indexOf(m)) < 0 ) {
        this.isDirectlyUsingClasses.push(m);
      }
    }
  };
  async forOtherVersions (ctx, cb) {
    if ( typeof(this.container_class) === "undefined" ) {
      return;
    }
    const f = this;
    const cc = f.container_class;
    await operatorsOf.forEach_12(cc.extends_classes, ((item, index) => { 
      const otherClass = ctx.findClass(item);
      if ( otherClass.hasMethod(f.name) ) {
        const m = otherClass.findMethod(f.name);
        cb(m);
      }
    }));
    const root = ctx.getRoot();
    await operatorsOf_13.forEach_14(root.definedClasses, ((item, index) => { 
      if ( (item.extends_classes.indexOf(f.container_class.name)) >= 0 ) {
        if ( item.hasMethod(f.name) ) {
          const m_1 = item.findMethod(f.name);
          cb(m_1);
        }
      }
    }));
  };
  isFunction () {
    return true;
  };
  isClass () {
    return false;
  };
  isProperty () {
    return false;
  };
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
class RangerTraitParams  {
  constructor() {
    this.param_names = [];
    this.values = {};
  }
}
class RangerAppClassDesc  extends RangerAppParamDesc {
  constructor() {
    super()
    this.name = "";
    this.is_system = false;
    this.compiledName = "";
    this.systemNames = {};
    this.systemNodes = {};
    this.is_interface = false;
    this.is_system_union = false;
    this.is_template = false;
    this.is_serialized = false;
    this.is_trait = false;
    this.is_operator_class = false;
    this.is_generic_instance = false;
    this.is_union = false;
    this.is_used_by_main = false;
    this.is_not_used = false;     /** note: unused */
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
    this.trait_params = {};
    this.is_union_of = [];
    this.contr_writers = [];     /** note: unused */
    this.is_inherited = false;
  }
  isClass () {
    return true;
  };
  isProperty () {
    return false;
  };
  doesInherit () {
    return this.is_inherited;
  };
  isNormalClass () {
    const special = ((((this.is_operator_class || this.is_trait) || this.is_system) || this.is_generic_instance) || this.is_system_union) || this.is_union;
    return special == false;
  };
  hasTrait (class_name, ctx) {
    let res;
    for ( let i = 0; i < this.consumes_traits.length; i++) {
      var c_name = this.consumes_traits[i];
      const c = ctx.findClass(c_name);
      if ( c_name == class_name ) {
        res = c;
        return res;
      }
    };
    return res;
  };
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
    };
    for ( let i_1 = 0; i_1 < this.consumes_traits.length; i_1++) {
      var c_name_1 = this.consumes_traits[i_1];
      const c_1 = ctx.findClass(c_name_1);
      if ( c_1.isSameOrParentClass(class_name, ctx) ) {
        return true;
      }
    };
    for ( let i_2 = 0; i_2 < this.implements_interfaces.length; i_2++) {
      var i_name = this.implements_interfaces[i_2];
      const c_2 = ctx.findClass(i_name);
      if ( c_2.isSameOrParentClass(class_name, ctx) ) {
        return true;
      }
    };
    for ( let i_3 = 0; i_3 < this.is_union_of.length; i_3++) {
      var i_name_1 = this.is_union_of[i_3];
      if ( ctx.isDefinedClass(i_name_1) ) {
        const c_3 = ctx.findClass(i_name_1);
        if ( c_3.isSameOrParentClass(class_name, ctx) ) {
          return true;
        }
      } else {
      }
    };
    return false;
  };
  hasOwnMethod (m_name) {
    if ( ( typeof(this.defined_methods[m_name] ) != "undefined" && this.defined_methods.hasOwnProperty(m_name) ) ) {
      return true;
    }
    return false;
  };
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
    };
    return false;
  };
  findMethod (f_name) {
    let res;
    const vNames = Object.keys(this.method_variants);
    for ( let i = 0; i < vNames.length; i++) {
      var mname = vNames[i];
      if ( mname == f_name ) {
        const list = (this.method_variants[mname]);
        res = list.variants[0];
        return res;
      }
    };
    for ( let i_1 = 0; i_1 < this.extends_classes.length; i_1++) {
      var cname = this.extends_classes[i_1];
      const cDesc = this.ctx.findClass(cname);
      if ( cDesc.hasMethod(f_name) ) {
        return cDesc.findMethod(f_name);
      }
    };
    return res;
  };
  hasStaticMethod (m_name) {
    return ( typeof(this.defined_static_methods[m_name] ) != "undefined" && this.defined_static_methods.hasOwnProperty(m_name) );
  };
  findStaticMethod (f_name) {
    let e;
    for ( let i = 0; i < this.static_methods.length; i++) {
      var m = this.static_methods[i];
      if ( m.name == f_name ) {
        e = m;
        return e;
      }
    };
    for ( let i_1 = 0; i_1 < this.extends_classes.length; i_1++) {
      var cname = this.extends_classes[i_1];
      const cDesc = this.ctx.findClass(cname);
      if ( cDesc.hasStaticMethod(f_name) ) {
        return cDesc.findStaticMethod(f_name);
      }
    };
    return e;
  };
  findVariable (f_name) {
    let e;
    for ( let i = 0; i < this.variables.length; i++) {
      var m = this.variables[i];
      if ( m.name == f_name ) {
        e = m;
        return e;
      }
    };
    for ( let i_1 = 0; i_1 < this.extends_classes.length; i_1++) {
      var cname = this.extends_classes[i_1];
      const cDesc = this.ctx.findClass(cname);
      return cDesc.findVariable(f_name);
    };
    return e;
  };
  addParentClass (p_name) {
    this.extends_classes.push(p_name);
  };
  async createVariable (node, ctx, wr) {
    try {
      const parser = ctx.getParser();
      const s = node.getVRefAt(1);
      const vDef = node.children[1];
      const p = new RangerAppParamDesc();
      if ( vDef.has_type_annotation ) {
        await parser.CheckTypeAnnotationOf(vDef, ctx, wr);
      }
      if ( s != ctx.transformWord(s) ) {
      }
      const currC = this;
      if ( currC.is_immutable ) {
        vDef.setFlag("weak");
        if ( vDef.value_type == 6 ) {
          const initNode = node.newExpressionNode();
          (initNode).push(node.newVRefNode("new"));
          const tDef = node.newVRefNode("Vector");
          const vAnn = node.newExpressionNode();
          (vAnn).push(node.newVRefNode(vDef.array_type));
          tDef.has_vref_annotation = true;
          tDef.vref_annotation = vAnn;
          (initNode).push(tDef);
          node.children[2] = initNode;
          vDef.value_type = 11;
          vDef.type_name = "Vector";
          const tAnn = node.newExpressionNode();
          (tAnn).push(node.newVRefNode(vDef.array_type));
          vDef.has_type_annotation = true;
          vDef.type_annotation = tAnn;
          await parser.CheckTypeAnnotationOf(vDef, ctx, wr);
          await parser.CheckVRefTypeAnnotationOf(tDef, ctx, wr);
        }
        if ( vDef.value_type == 7 ) {
          const initNode_1 = node.newExpressionNode();
          (initNode_1).push(node.newVRefNode("new"));
          const tDef_1 = node.newVRefNode("Map");
          const vAnn_1 = node.newExpressionNode();
          (vAnn_1).push(node.newVRefNode(vDef.key_type));
          (vAnn_1).push(node.newVRefNode(vDef.array_type));
          tDef_1.has_vref_annotation = true;
          tDef_1.vref_annotation = vAnn_1;
          (initNode_1).push(tDef_1);
          node.children[2] = initNode_1;
          vDef.value_type = 11;
          vDef.type_name = "Map";
          const tAnn_1 = node.newExpressionNode();
          (tAnn_1).push(node.newVRefNode(vDef.key_type));
          (tAnn_1).push(node.newVRefNode(vDef.array_type));
          vDef.has_type_annotation = true;
          vDef.type_annotation = tAnn_1;
          await parser.CheckTypeAnnotationOf(vDef, ctx, wr);
          await parser.CheckVRefTypeAnnotationOf(tDef_1, ctx, wr);
        }
      }
      p.name = s;
      p.value_type = vDef.value_type;
      p.node = node;
      p.is_class_variable = true;
      p.varType = 8;
      p.node = node;
      p.nameNode = vDef;
      vDef.hasParamDesc = true;
      vDef.ownParamDesc = p;
      vDef.paramDesc = p;
      node.hasParamDesc = true;
      node.paramDesc = p;
      if ( vDef.hasFlag("weak") ) {
        p.changeStrength(0, 2, p.nameNode);
      } else {
        p.changeStrength(2, 2, p.nameNode);
      }
      if ( (node.children.length) > 2 ) {
        p.set_cnt = 1;
        p.init_cnt = 1;
        p.def_value = node.children[2];
        p.is_optional = false;
        if ( p.def_value.value_type == 4 ) {
          vDef.type_name = "string";
        }
        if ( p.def_value.value_type == 3 ) {
          vDef.type_name = "int";
        }
        if ( p.def_value.value_type == 2 ) {
          vDef.type_name = "double";
        }
        if ( p.def_value.value_type == 5 ) {
          vDef.type_name = "boolean";
        }
        const valueNode = node.children[2];
        if ( (valueNode.children.length) > 0 ) {
          const fc = valueNode.getFirst();
          if ( fc.vref == "new" ) {
            const second = valueNode.getSecond();
            await parser.CheckVRefTypeAnnotationOf(second, ctx, wr);
          }
        }
      } else {
        p.is_optional = true;
        if ( false == ((vDef.value_type == 6) || (vDef.value_type == 7)) ) {
          vDef.setFlag("optional");
        }
      }
      currC.addVariable(p);
      const subCtx = currC.ctx;
      subCtx.defineVariable(p.name, p);
      p.is_class_variable = true;
    } catch(e) {
      ctx.addError(node, "Could not add variable into class " + this.name);
    }
  };
  addVariable (desc) {
    this.variables.push(desc);
    desc.propertyClass = this;
  };
  addMethod (desc) {
    this.defined_methods[desc.name] = true;
    this.methods.push(desc);
    const defVs = this.method_variants[desc.name];
    if ( typeof(defVs) === "undefined" ) {
      const new_v = new RangerAppMethodVariants();
      this.method_variants[desc.name] = new_v;
      this.defined_variants.push(desc.name);
      new_v.variants.push(desc);
    } else {
      const new_v2 = defVs;
      new_v2.variants.push(desc);
    }
    desc.container_class = this;
  };
  addStaticMethod (desc) {
    this.defined_static_methods[desc.name] = true;
    this.static_methods.push(desc);
    if ( desc.name == "main" ) {
      const nn = desc.nameNode;
      if ( nn.has_vref_annotation == false ) {
        const vAnn = this.node.newExpressionNode();
        nn.has_vref_annotation = true;
        nn.vref_annotation = vAnn;
      }
      nn.vref_annotation.children.push(nn.vref_annotation.newVRefNode("main"));
    }
  };
}
class RangerTypeClass  {
  constructor() {
    this.name = "";
    this.compiledName = "";     /** note: unused */
    this.value_type = 0;
    this.implements_traits = [];     /** note: unused */
    this.implements_interfaces = [];     /** note: unused */
    this.extends_classes = [];     /** note: unused */
    this.belongs_to_union = [];     /** note: unused */
    this.is_empty = false;
    this.is_primitive = false;
    this.is_mutable = false;     /** note: unused */
    this.is_optional = false;     /** note: unused */
    this.is_union = false;     /** note: unused */
    this.is_trait = false;     /** note: unused */
    this.is_class = false;
    this.is_system = false;
    this.is_interface = false;     /** note: unused */
    this.is_generic = false;     /** note: unused */
    this.is_lambda = false;
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
  };
  getLine (sp) {
    let cnt = 0;
    for ( let i = 0; i < this.lines.length; i++) {
      var str = this.lines[i];
      cnt = cnt + ((str.length) + 1);
      if ( cnt > sp ) {
        return i;
      }
    };
    return -1;
  };
  getColumnStr (sp) {
    let cnt = 0;
    let last_col = 0;
    for ( let i = 0; i < this.lines.length; i++) {
      var str = this.lines[i];
      cnt = cnt + ((str.length) + 1);
      if ( cnt > sp ) {
        let ll = sp - last_col;
        let ss = "";
        while (ll > 0) {
          ss = ss + " ";
          ll = ll - 1;
        };
        return ss;
      }
      last_col = cnt;
    };
    return "";
  };
  getColumn (sp) {
    let cnt = 0;
    let last_col = 0;
    for ( let i = 0; i < this.lines.length; i++) {
      var str = this.lines[i];
      cnt = cnt + ((str.length) + 1);
      if ( cnt > sp ) {
        return sp - last_col;
      }
      last_col = cnt;
    };
    return -1;
  };
}
class CodeNodeLiteral  {
  constructor() {
    this.expression = false;
    this.vref = "";
    this.is_block_node = false;
    this.type_name = "";
    this.key_type = "";
    this.array_type = "";
    this.ns = [];
    this.has_vref_annotation = false;
    this.has_type_annotation = false;
    this.parsed_type = 0;
    this.value_type = 0;
    this.double_value = 0.0;
    this.string_value = "";
    this.int_value = 0;
    this.boolean_value = false;
    this.props = {};
    this.prop_keys = [];
    this.comments = [];
    this.children = [];
    this.attrs = [];
  }
  toDictionary () {
    let res = {};
    try {
      res["expression"] = this.expression;
      res["vref"] = this.vref;
      res["is_block_node"] = this.is_block_node;
      res["type_name"] = this.type_name;
      res["key_type"] = this.key_type;
      res["array_type"] = this.array_type;
      let values = [];
      for ( let i = 0; i < this.ns.length; i++) {
        var item = this.ns[i];
        values.push(item);
      };
      res["ns"] = values;
      res["has_vref_annotation"] = this.has_vref_annotation;
      if ( (typeof(this.vref_annotation) !== "undefined" && this.vref_annotation != null )  ) {
        res["vref_annotation"] = ((this.vref_annotation)).toDictionary();
      }
      res["has_type_annotation"] = this.has_type_annotation;
      if ( (typeof(this.type_annotation) !== "undefined" && this.type_annotation != null )  ) {
        res["type_annotation"] = ((this.type_annotation)).toDictionary();
      }
      res["parsed_type"] = this.parsed_type;
      res["value_type"] = this.value_type;
      res["double_value"] = this.double_value;
      res["string_value"] = this.string_value;
      res["int_value"] = this.int_value;
      res["boolean_value"] = this.boolean_value;
      if ( (typeof(this.expression_value) !== "undefined" && this.expression_value != null )  ) {
        res["expression_value"] = ((this.expression_value)).toDictionary();
      }
      let values_1 = {};
      const keyList = Object.keys(this.props);
      for ( let index = 0; index < keyList.length; index++) {
        var keyname = keyList[index];
        const item_1 = (this.props[keyname]);
        const obj = item_1.toDictionary();
        values_1[keyname] = obj;
      };
      res["props"] = values_1;
      let values_2 = [];
      for ( let i_1 = 0; i_1 < this.prop_keys.length; i_1++) {
        var item_2 = this.prop_keys[i_1];
        values_2.push(item_2);
      };
      res["prop_keys"] = values_2;
      let values_3 = [];
      for ( let i_2 = 0; i_2 < this.comments.length; i_2++) {
        var item_3 = this.comments[i_2];
        const obj_1 = item_3.toDictionary();
        values_3.push(obj_1);
      };
      res["comments"] = values_3;
      let values_4 = [];
      for ( let i_3 = 0; i_3 < this.children.length; i_3++) {
        var item_4 = this.children[i_3];
        const obj_2 = item_4.toDictionary();
        values_4.push(obj_2);
      };
      res["children"] = values_4;
      let values_5 = [];
      for ( let i_4 = 0; i_4 < this.attrs.length; i_4++) {
        var item_5 = this.attrs[i_4];
        const obj_3 = item_5.toDictionary();
        values_5.push(obj_3);
      };
      res["attrs"] = values_5;
    } catch(e) {
    }
    return res;
  };
}
CodeNodeLiteral.fromDictionary = async function(dict) {
  const obj = new CodeNodeLiteral();
  try {
    const v = typeof(dict ["expression"]) === "undefined" ? undefined :(dict ["expression"]) ;
    if ( (typeof(v) !== "undefined" && v != null )  ) {
      obj.expression = v;
    }
    const v_1 = (typeof (dict ["vref"]) != "string" ) ? undefined : dict ["vref"] 
    ;
    if ( (typeof(v_1) !== "undefined" && v_1 != null )  ) {
      obj.vref = v_1;
    }
    const v_2 = typeof(dict ["is_block_node"]) === "undefined" ? undefined :(dict ["is_block_node"]) ;
    if ( (typeof(v_2) !== "undefined" && v_2 != null )  ) {
      obj.is_block_node = v_2;
    }
    const v_3 = (typeof (dict ["type_name"]) != "string" ) ? undefined : dict ["type_name"] 
    ;
    if ( (typeof(v_3) !== "undefined" && v_3 != null )  ) {
      obj.type_name = v_3;
    }
    const v_4 = (typeof (dict ["key_type"]) != "string" ) ? undefined : dict ["key_type"] 
    ;
    if ( (typeof(v_4) !== "undefined" && v_4 != null )  ) {
      obj.key_type = v_4;
    }
    const v_5 = (typeof (dict ["array_type"]) != "string" ) ? undefined : dict ["array_type"] 
    ;
    if ( (typeof(v_5) !== "undefined" && v_5 != null )  ) {
      obj.array_type = v_5;
    }
    const values = (dict["ns"] instanceof Array ) ? dict ["ns"] : undefined ;
    if ( (typeof(values) !== "undefined" && values != null )  ) {
      const arr = values;
      await operatorsOf_58.forEach_59(arr, ((item, index) => { 
        if( typeof(item) === 'string' ) /* union case for string */ {
          var oo = item;
          obj.ns.push(oo);
        };
      }));
    }
    const v_6 = typeof(dict ["has_vref_annotation"]) === "undefined" ? undefined :(dict ["has_vref_annotation"]) ;
    if ( (typeof(v_6) !== "undefined" && v_6 != null )  ) {
      obj.has_vref_annotation = v_6;
    }
    const theValue = (dict["vref_annotation"] instanceof Object ) ? dict ["vref_annotation"] : undefined ;
    if ( (typeof(theValue) !== "undefined" && theValue != null )  ) {
      const newObj = await CodeNodeLiteral.fromDictionary((theValue));
      obj.vref_annotation = newObj;
    }
    const v_7 = typeof(dict ["has_type_annotation"]) === "undefined" ? undefined :(dict ["has_type_annotation"]) ;
    if ( (typeof(v_7) !== "undefined" && v_7 != null )  ) {
      obj.has_type_annotation = v_7;
    }
    const theValue_1 = (dict["type_annotation"] instanceof Object ) ? dict ["type_annotation"] : undefined ;
    if ( (typeof(theValue_1) !== "undefined" && theValue_1 != null )  ) {
      const newObj_1 = await CodeNodeLiteral.fromDictionary((theValue_1));
      obj.type_annotation = newObj_1;
    }
    const v_8 = isNaN( parseFloat(dict ["double_value"]) ) ? undefined : parseFloat(dict ["double_value"]) 
    ;
    if ( (typeof(v_8) !== "undefined" && v_8 != null )  ) {
      obj.double_value = v_8;
    }
    const v_9 = (typeof (dict ["string_value"]) != "string" ) ? undefined : dict ["string_value"] 
    ;
    if ( (typeof(v_9) !== "undefined" && v_9 != null )  ) {
      obj.string_value = v_9;
    }
    const v_10 = isNaN( parseInt(dict ["int_value"]) ) ? undefined : parseInt(dict ["int_value"]) 
    ;
    if ( (typeof(v_10) !== "undefined" && v_10 != null )  ) {
      obj.int_value = v_10;
    }
    const v_11 = typeof(dict ["boolean_value"]) === "undefined" ? undefined :(dict ["boolean_value"]) ;
    if ( (typeof(v_11) !== "undefined" && v_11 != null )  ) {
      obj.boolean_value = v_11;
    }
    const theValue_2 = (dict["expression_value"] instanceof Object ) ? dict ["expression_value"] : undefined ;
    if ( (typeof(theValue_2) !== "undefined" && theValue_2 != null )  ) {
      const newObj_2 = await CodeNodeLiteral.fromDictionary((theValue_2));
      obj.expression_value = newObj_2;
    }
    const values_1 = (dict["props"] instanceof Object ) ? dict ["props"] : undefined ;
    if ( (typeof(values_1) !== "undefined" && values_1 != null )  ) {
      const theObjprops = values_1;
      const obj_keys = Object.keys(theObjprops);
      await operatorsOf.forEach_12(obj_keys, (async (item, index) => { 
        const theValue_3 = (theObjprops[item] instanceof Object ) ? theObjprops [item] : undefined ;
        if ( (typeof(theValue_3) !== "undefined" && theValue_3 != null )  ) {
          const newObj_3 = await CodeNodeLiteral.fromDictionary((theValue_3));
          obj.props[item] = newObj_3;
        }
      }));
    }
    const values_2 = (dict["prop_keys"] instanceof Array ) ? dict ["prop_keys"] : undefined ;
    if ( (typeof(values_2) !== "undefined" && values_2 != null )  ) {
      const arr_1 = values_2;
      await operatorsOf_58.forEach_59(arr_1, ((item, index) => { 
        if( typeof(item) === 'string' ) /* union case for string */ {
          var oo_1 = item;
          obj.prop_keys.push(oo_1);
        };
      }));
    }
    const values_3 = (dict["comments"] instanceof Array ) ? dict ["comments"] : undefined ;
    if ( (typeof(values_3) !== "undefined" && values_3 != null )  ) {
      const arr_2 = values_3;
      await operatorsOf_58.forEach_59(arr_2, (async (item, index) => { 
        if( item instanceof Object ) /* union case */ {
          var oo_2 = item;
          const newObj_4 = await CodeNodeLiteral.fromDictionary(oo_2);
          obj.comments.push(newObj_4);
        };
      }));
    }
    const values_4 = (dict["children"] instanceof Array ) ? dict ["children"] : undefined ;
    if ( (typeof(values_4) !== "undefined" && values_4 != null )  ) {
      const arr_3 = values_4;
      await operatorsOf_58.forEach_59(arr_3, (async (item, index) => { 
        if( item instanceof Object ) /* union case */ {
          var oo_3 = item;
          const newObj_5 = await CodeNodeLiteral.fromDictionary(oo_3);
          obj.children.push(newObj_5);
        };
      }));
    }
    const values_5 = (dict["attrs"] instanceof Array ) ? dict ["attrs"] : undefined ;
    if ( (typeof(values_5) !== "undefined" && values_5 != null )  ) {
      const arr_4 = values_5;
      await operatorsOf_58.forEach_59(arr_4, (async (item, index) => { 
        if( item instanceof Object ) /* union case */ {
          var oo_4 = item;
          const newObj_6 = await CodeNodeLiteral.fromDictionary(oo_4);
          obj.attrs.push(newObj_6);
        };
      }));
    }
  } catch(e) {
  }
  return obj;
};
class CodeNode  {
  constructor(source, start, end) {
    this.sp = 0;
    this.ep = 0;
    this.row = 0;
    this.col = 0;     /** note: unused */
    this.has_operator = false;
    this.disabled_node = false;
    this.op_index = 0;
    this.is_array_literal = false;
    this.is_system_class = false;
    this.is_plugin = false;
    this.is_direct_method_call = false;
    this.mutable_def = false;
    this.expression = false;
    this.vref = "";
    this.is_block_node = false;
    this.infix_operator = false;
    this.infix_subnode = false;
    this.has_lambda = false;
    this.has_lambda_call = false;
    this.has_call = false;
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
    this.double_value = 0.0;
    this.string_value = "";
    this.int_value = 0;
    this.boolean_value = false;
    this.props = {};
    this.prop_keys = [];
    this.comments = [];
    this.children = [];
    this.attrs = [];
    this.appGUID = "";
    this.register_name = "";
    this.register_expressions = [];
    this.after_expression = [];     /** note: unused */
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
    this.is_part_of_chain = false;
    this.methodChain = [];
    this.register_set = false;
    this.did_walk = false;     /** note: unused */
    this.reg_compiled_name = "";
    this.tag = "";
    this.matched_type = "";
    this.sp = start;
    this.ep = end;
    this.code = source;
  }
  childCnt () {
    return this.children.length;
  };
  getChild (index) {
    let res;
    if ( (index >= 0) && ((this.children.length) > index) ) {
      res = this.children[index];
    }
    return res;
  };
  chlen () {
    return this.children.length;
  };
  async forTree (callback) {
    for ( let i = 0; i < this.children.length; i++) {
      var ch = this.children[i];
      await callback(ch, i);
      await ch.forTree(callback);
    };
  };
  parallelTree (otherTree, callback) {
    const left_cnt = this.children.length;
    const right_cnt = otherTree.children.length;
    const cnt = (left_cnt < right_cnt) ? right_cnt : left_cnt;
    let i = 0;
    while (i < cnt) {
      let left;
      let right;
      if ( i < left_cnt ) {
        left = this.children[i];
      }
      if ( i < right_cnt ) {
        right = otherTree.children[i];
      }
      callback(left, right, i);
      if ( ((typeof(left) !== "undefined" && left != null ) ) && ((typeof(right) !== "undefined" && right != null ) ) ) {
        if ( (left.children.length) > 0 ) {
          left.parallelTree(right, callback);
        }
      }
      i = i + 1;
    };
  };
  async walkTreeUntil (callback) {
    for ( let i = 0; i < this.children.length; i++) {
      var ch = this.children[i];
      if ( await callback(ch, i) ) {
        await ch.walkTreeUntil(callback);
      }
    };
  };
  getParsedString () {
    return this.code.code.substring(this.sp, this.ep );
  };
  getFilename () {
    return this.code.filename;
  };
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
    };
    return res;
  };
  hasFlag (flagName) {
    if ( false == this.has_vref_annotation ) {
      return false;
    }
    for ( let i = 0; i < this.vref_annotation.children.length; i++) {
      var ch = this.vref_annotation.children[i];
      if ( ch.vref == flagName ) {
        return true;
      }
    };
    return false;
  };
  setFlag (flagName) {
    if ( false == this.has_vref_annotation ) {
      this.vref_annotation = new CodeNode(this.code, this.sp, this.ep);
    }
    if ( this.hasFlag(flagName) ) {
      return;
    }
    const flag = new CodeNode(this.code, this.sp, this.ep);
    flag.vref = flagName;
    flag.value_type = 11;
    flag.parsed_type = flag.value_type;
    this.vref_annotation.children.push(flag);
    this.has_vref_annotation = true;
  };
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
    };
    return s;
  };
  getLine () {
    return this.code.getLine(this.sp);
  };
  getLineString (line_index) {
    return this.code.getLineString(line_index);
  };
  getColStartString () {
    return this.code.getColumnStr(this.sp);
  };
  getLineAsString () {
    const idx = this.getLine();
    const line_name_idx = idx + 1;
    return (((this.getFilename() + ", line ") + line_name_idx) + " : ") + this.code.getLineString(idx);
  };
  getSource () {
    if ( this.ep > this.sp ) {
      const start = this.sp;
      const end = this.ep;
      return this.code.code.substring(start, end );
    }
    return "";
  };
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
  };
  isPrimitive () {
    switch (this.value_type ) { 
      case 2 : 
        return true;
      case 4 : 
        return true;
      case 3 : 
        return true;
      case 5 : 
        return true;
      case 14 : 
        return true;
      case 15 : 
        return true;
      case 13 : 
        return true;
    };
    return false;
  };
  getFirst () {
    return this.children[0];
  };
  getSecond () {
    return this.children[1];
  };
  getThird () {
    return this.children[2];
  };
  isSecondExpr () {
    if ( (this.children.length) > 1 ) {
      const second = this.children[1];
      if ( second.expression ) {
        return true;
      }
    }
    return false;
  };
  getOperator () {
    const s = "";
    if ( (this.children.length) > 0 ) {
      const fc = this.children[0];
      if ( fc.value_type == 11 ) {
        return fc.vref;
      }
    }
    return s;
  };
  getVRefAt (idx) {
    const s = "";
    if ( (this.children.length) > idx ) {
      const fc = this.children[idx];
      return fc.vref;
    }
    return s;
  };
  getStringAt (idx) {
    const s = "";
    if ( (this.children.length) > idx ) {
      const fc = this.children[idx];
      if ( fc.value_type == 4 ) {
        return fc.string_value;
      }
    }
    return s;
  };
  hasExpressionProperty (name) {
    const ann = this.props[name];
    if ( (typeof(ann) !== "undefined" && ann != null )  ) {
      return ann.expression;
    }
    return false;
  };
  getExpressionProperty (name) {
    const ann = this.props[name];
    if ( (typeof(ann) !== "undefined" && ann != null )  ) {
      return ann;
    }
    return ann;
  };
  hasIntProperty (name) {
    const ann = this.props[name];
    if ( (typeof(ann) !== "undefined" && ann != null )  ) {
      const fc = ann.children[0];
      if ( fc.value_type == 3 ) {
        return true;
      }
    }
    return false;
  };
  getIntProperty (name) {
    const ann = this.props[name];
    if ( (typeof(ann) !== "undefined" && ann != null )  ) {
      const fc = ann.children[0];
      if ( fc.value_type == 3 ) {
        return fc.int_value;
      }
    }
    return 0;
  };
  hasDoubleProperty (name) {
    const ann = this.props[name];
    if ( (typeof(ann) !== "undefined" && ann != null )  ) {
      if ( ann.value_type == 2 ) {
        return true;
      }
    }
    return false;
  };
  getDoubleProperty (name) {
    const ann = this.props[name];
    if ( (typeof(ann) !== "undefined" && ann != null )  ) {
      if ( ann.value_type == 2 ) {
        return ann.double_value;
      }
    }
    return 0.0;
  };
  setStringProperty (name, value) {
    this.props[name] = CodeNode.newStr(value);
  };
  hasStringProperty (name) {
    if ( false == (( typeof(this.props[name] ) != "undefined" && this.props.hasOwnProperty(name) )) ) {
      return false;
    }
    const ann = this.props[name];
    if ( (typeof(ann) !== "undefined" && ann != null )  ) {
      if ( ann.value_type == 4 ) {
        return true;
      }
    }
    return false;
  };
  getStringProperty (name) {
    const ann = this.props[name];
    if ( (typeof(ann) !== "undefined" && ann != null )  ) {
      if ( ann.value_type == 4 ) {
        return ann.string_value;
      }
    }
    return "";
  };
  hasBooleanProperty (name) {
    const ann = this.props[name];
    if ( (typeof(ann) !== "undefined" && ann != null )  ) {
      if ( ann.value_type == 5 ) {
        return true;
      }
    }
    return false;
  };
  getBooleanProperty (name) {
    const ann = this.props[name];
    if ( (typeof(ann) !== "undefined" && ann != null )  ) {
      if ( ann.value_type == 5 ) {
        return ann.boolean_value;
      }
    }
    return false;
  };
  isFirstTypeVref (vrefName) {
    if ( (this.children.length) > 0 ) {
      const fc = this.children[0];
      if ( fc.value_type == 11 ) {
        return true;
      }
    }
    return false;
  };
  isFirstVref (vrefName) {
    if ( (this.children.length) > 0 ) {
      const fc = this.children[0];
      if ( fc.vref == vrefName ) {
        return true;
      }
    }
    return false;
  };
  getString () {
    return this.code.code.substring(this.sp, this.ep );
  };
  walk () {
    switch (this.value_type ) { 
      case 2 : 
        console.log("Double : " + this.double_value);
        break;
      case 4 : 
        console.log("String : " + this.string_value);
        break;
    };
    if ( this.expression ) {
      console.log("(");
    } else {
      console.log(this.code.code.substring(this.sp, this.ep ));
    }
    for ( let i = 0; i < this.children.length; i++) {
      var item = this.children[i];
      item.walk();
    };
    if ( this.expression ) {
      console.log(")");
    }
  };
  isParsedAsPrimitive () {
    return TTypes.isPrimitive(this.parsed_type);
  };
  isPrimitiveType () {
    return TTypes.isPrimitive(TTypes.nameToValue(this.type_name));
  };
  isAPrimitiveType () {
    return TTypes.isPrimitive(TTypes.nameToValue(this.array_type));
  };
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
      case 11 : 
        wr.out(this.vref, false);
        if ( (this.type_name.length) > 0 ) {
          wr.out(":" + this.type_name, false);
        }
        break;
      case 7 : 
        wr.out(this.vref, false);
        wr.out((((":[" + this.key_type) + ":") + this.array_type) + "]", false);
        break;
      case 6 : 
        wr.out(this.vref, false);
        wr.out((":[" + this.array_type) + "]", false);
        break;
      case 17 : 
        wr.out("(fn--> ", false);
        for ( let i = 0; i < this.children.length; i++) {
          var ch = this.children[i];
          ch.writeCode(wr);
        };
        wr.out(")", false);
        break;
      default: 
        if ( this.expression ) {
          wr.out("(", false);
          for ( let i_1 = 0; i_1 < this.children.length; i_1++) {
            var ch_1 = this.children[i_1];
            if ( i_1 > 0 ) {
              wr.out(" ", false);
            }
            ch_1.writeCode(wr);
          };
          wr.out(")", false);
        } else {
          if ( this.is_block_node ) {
            wr.out("{", true);
            for ( let i_2 = 0; i_2 < this.children.length; i_2++) {
              var ch_2 = this.children[i_2];
              ch_2.writeCode(wr);
            };
            wr.out("}", true);
          } else {
            wr.out("<unknown>", false);
            wr.out("{", true);
            for ( let i_3 = 0; i_3 < this.children.length; i_3++) {
              var ch_3 = this.children[i_3];
              ch_3.writeCode(wr);
            };
            wr.out("}", true);
          }
        }
        break;
    };
  };
  createChainTarget () {
    const chCnt = this.children.length;
    if ( chCnt > 2 ) {
      const fc = this.getFirst();
      if ( fc.vref == "def" ) {
        this.chainTarget = this.getThird();
      }
      if ( fc.vref == "=" ) {
        this.chainTarget = this.getThird();
      }
    }
  };
  inferDefExpressionTypeFromValue (node) {
    const cn = node.children[1];
    const nodeValue = node.children[2];
    if ( (typeof(cn.expression_value) !== "undefined" && cn.expression_value != null )  ) {
      cn.value_type = 17;
      cn.parsed_type = 17;
      cn.has_vref_annotation = true;
    }
    if ( nodeValue.eval_type == 17 ) {
      if ( (typeof(nodeValue.expression_value) !== "undefined" && nodeValue.expression_value != null )  ) {
        cn.expression_value = nodeValue.expression_value.copy();
      } else {
        if ( typeof(node.expression_value) === "undefined" ) {
          const copyOf = nodeValue.rebuildWithType(new RangerArgMatch(), false);
          copyOf.children.pop();
          cn.expression_value = copyOf;
        }
      }
      cn.value_type = 17;
    }
  };
  inferDefTypeFromValue (node) {
    const cn = node.children[1];
    const nodeValue = node.children[2];
    cn.value_type = nodeValue.eval_type;
    cn.type_name = nodeValue.eval_type_name;
    cn.array_type = nodeValue.eval_array_type;
    cn.key_type = nodeValue.eval_key_type;
    if ( nodeValue.eval_type == 17 ) {
      if ( (typeof(nodeValue.expression_value) !== "undefined" && nodeValue.expression_value != null )  ) {
        cn.expression_value = nodeValue.expression_value.copy();
      } else {
        if ( typeof(node.expression_value) === "undefined" ) {
          const copyOf = nodeValue.rebuildWithType(new RangerArgMatch(), false);
          copyOf.children.pop();
          cn.expression_value = copyOf;
        }
      }
      cn.type_name = "";
    }
  };
  getCode () {
    const wr = new CodeWriter();
    this.writeCode(wr);
    return wr.getCode();
  };
  async cleanNode () {
    const cp = this;
    cp.evalTypeClass = undefined;
    cp.lambda_ctx = undefined;
    cp.nsp.length = 0;
    cp.eval_type = 0;
    cp.eval_type_name = "";
    cp.eval_key_type = "";
    cp.eval_array_type = "";
    cp.eval_function = undefined;
    cp.flow_done = false;
    cp.ref_change_done = false;
    cp.eval_type_node = undefined;
    cp.didReturnAtIndex = -1;
    cp.hasVarDef = false;
    cp.hasClassDescription = false;
    cp.hasNewOper = false;
    cp.clDesc = undefined;
    cp.hasFnCall = false;
    cp.fnDesc = undefined;
    cp.hasParamDesc = false;
    cp.paramDesc = undefined;
    cp.ownParamDesc = undefined;
    cp.evalCtx = undefined;
    cp.evalState = undefined;
    cp.operator_node = undefined;
    cp.flow_ctx = undefined;
    cp.is_part_of_chain = false;
    cp.methodChain.length = 0;
    cp.chainTarget = undefined;
    cp.tag = "";
    cp.has_operator = false;
    cp.disabled_node = false;
    cp.op_index = 0;
    cp.is_array_literal = false;
    cp.is_system_class = false;
    cp.is_plugin = false;
    cp.mutable_def = false;
    cp.has_lambda = false;
    cp.has_lambda_call = false;
    cp.has_call = false;
    cp.type_type = this.type_type;
    cp.value_type = this.parsed_type;
    await operatorsOf.forEach_15(cp.children, (async (item, index) => { 
      await item.cleanNode();
    }));
  };
  async cleanCopy () {
    const match = new RangerArgMatch();
    const cp = this.rebuildWithType(match, false);
    await cp.cleanNode();
    return cp;
  };
  copy () {
    const match = new RangerArgMatch();
    const cp = this.rebuildWithType(match, false);
    cp.register_expressions = operatorsOf.clone_46(this.register_expressions);
    return cp;
  };
  clone () {
    const match = new RangerArgMatch();
    const cp = this.cloneWithType(match, false);
    return cp;
  };
  push (node) {
    this.children.push(node);
    node.parent = this;
  };
  add (node) {
    this.children.push(node);
    node.parent = this;
  };
  newVRefNode (name) {
    const newNode = new CodeNode(this.code, this.sp, this.ep);
    newNode.vref = name;
    newNode.value_type = 11;
    newNode.parsed_type = 11;
    newNode.ns = name.split(".");
    return newNode;
  };
  newStringNode (name) {
    const newNode = new CodeNode(this.code, this.sp, this.ep);
    newNode.string_value = name;
    newNode.value_type = 4;
    newNode.parsed_type = 11;
    return newNode;
  };
  newExpressionNode () {
    const newNode = new CodeNode(this.code, this.sp, this.ep);
    newNode.expression = true;
    return newNode;
  };
  getChildrenFrom (otherNode) {
    this.children.length = 0;
    for ( let i = 0; i < otherNode.children.length; i++) {
      var ch = otherNode.children[i];
      (this).push(ch);
      ch.parent = this;
    };
    otherNode.children.length = 0;
  };
  cloneWithType (match, changeVref) {
    const newNode = new CodeNode(this.code, this.sp, this.ep);
    if ( ( typeof(match.nodes[this.vref] ) != "undefined" && match.nodes.hasOwnProperty(this.vref) ) ) {
      const ast = (match.nodes[this.vref]);
      return ast.rebuildWithType(match, true);
    }
    newNode.has_operator = this.has_operator;
    newNode.op_index = this.op_index;
    newNode.mutable_def = this.mutable_def;
    newNode.expression = this.expression;
    newNode.register_name = this.register_name;
    newNode.operator_node = this.operator_node;
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
    newNode.parsed_type = this.parsed_type;
    newNode.copyEvalResFrom(this);
    newNode.register_expressions = operatorsOf.clone_46(this.register_expressions);
    if ( this.has_vref_annotation ) {
      newNode.has_vref_annotation = true;
      const ann = this.vref_annotation;
      newNode.vref_annotation = ann.cloneWithType(match, true);
    }
    if ( this.has_type_annotation ) {
      newNode.has_type_annotation = true;
      const t_ann = this.type_annotation;
      newNode.type_annotation = t_ann.cloneWithType(match, true);
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
    };
    newNode.string_value = this.string_value;
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
      case 17 : 
        if ( (typeof(this.expression_value) !== "undefined" && this.expression_value != null )  ) {
          newNode.expression_value = this.expression_value.cloneWithType(match, changeVref);
        }
        break;
    };
    for ( let i_1 = 0; i_1 < this.prop_keys.length; i_1++) {
      var key = this.prop_keys[i_1];
      newNode.prop_keys.push(key);
      const oldp = this.props[key];
      const np = oldp.cloneWithType(match, changeVref);
      newNode.props[key] = np;
    };
    for ( let i_2 = 0; i_2 < this.children.length; i_2++) {
      var ch = this.children[i_2];
      const newCh = ch.cloneWithType(match, changeVref);
      newCh.parent = newNode;
      newNode.children.push(newCh);
    };
    for ( let i_3 = 0; i_3 < this.attrs.length; i_3++) {
      var ch_1 = this.attrs[i_3];
      const newCh_1 = ch_1.rebuildWithType(match, changeVref);
      newNode.attrs.push(newCh_1);
    };
    return newNode;
  };
  rebuildWithType (match, changeVref) {
    const newNode = new CodeNode(this.code, this.sp, this.ep);
    if ( ( typeof(match.nodes[this.vref] ) != "undefined" && match.nodes.hasOwnProperty(this.vref) ) ) {
      const ast = (match.nodes[this.vref]);
      if ( ast == this ) {
        const tmp = this;
        return tmp;
      }
      const newNode_2 = ast.rebuildWithType(match, true);
      match.builtNodes[this.vref] = newNode_2;
      return newNode_2;
    }
    newNode.has_operator = this.has_operator;
    newNode.op_index = this.op_index;
    newNode.mutable_def = this.mutable_def;
    newNode.expression = this.expression;
    newNode.register_name = this.register_name;
    newNode.reg_compiled_name = this.reg_compiled_name;
    newNode.operator_node = this.operator_node;
    newNode.matched_type = this.matched_type;
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
    newNode.parsed_type = this.parsed_type;
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
    };
    newNode.string_value = this.string_value;
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
      case 17 : 
        if ( (typeof(this.expression_value) !== "undefined" && this.expression_value != null )  ) {
          newNode.expression_value = this.expression_value.rebuildWithType(match, changeVref);
        }
        break;
    };
    for ( let i_1 = 0; i_1 < this.prop_keys.length; i_1++) {
      var key = this.prop_keys[i_1];
      newNode.prop_keys.push(key);
      const oldp = this.props[key];
      const np = oldp.rebuildWithType(match, changeVref);
      newNode.props[key] = np;
    };
    for ( let i_2 = 0; i_2 < this.children.length; i_2++) {
      var ch = this.children[i_2];
      const newCh = ch.rebuildWithType(match, changeVref);
      newCh.parent = newNode;
      newNode.children.push(newCh);
    };
    for ( let i_3 = 0; i_3 < this.attrs.length; i_3++) {
      var ch_1 = this.attrs[i_3];
      const newCh_1 = ch_1.rebuildWithType(match, changeVref);
      newNode.attrs.push(newCh_1);
    };
    return newNode;
  };
  buildTypeSignatureUsingMatch (match) {
    const tName = match.getTypeName(this.type_name);
    switch (tName ) { 
      case "double" : 
        return "double";
      case "string" : 
        return "string";
      case "integer" : 
        return "int";
      case "boolean" : 
        return "boolean";
    };
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
  };
  buildTypeSignature () {
    if ( this.hasFlag("keyword") ) {
      return this.vref + "::keyword";
    }
    if ( TTypes.isPrimitive(this.value_type) ) {
      return TTypes.valueAsString(this.value_type);
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
    if ( this.value_type == 17 ) {
      const fnNode = this.expression_value.getFirst();
      const argNode = this.expression_value.getSecond();
      s = (s + "(_:") + fnNode.buildTypeSignature();
      s = ((s + " (") + (operatorsOf.map_47(argNode.children, ((item, index) => { 
        return "_:" + item.buildTypeSignature();
      })).join(" "))) + "))";
      return s;
    }
    s = this.type_name;
    return s;
  };
  getVRefSignatureWithMatch (match) {
    if ( this.has_vref_annotation ) {
      const nn = this.vref_annotation.rebuildWithType(match, true);
      return "@" + nn.getCode();
    }
    return "";
  };
  getVRefSignature () {
    if ( this.has_vref_annotation ) {
      return "@" + this.vref_annotation.getCode();
    }
    return "";
  };
  getTypeSignatureWithMatch (match) {
    if ( this.has_type_annotation ) {
      const nn = this.type_annotation.rebuildWithType(match, true);
      return "@" + nn.getCode();
    }
    return "";
  };
  getTypeSignature () {
    if ( this.has_type_annotation ) {
      return "@" + this.type_annotation.getCode();
    }
    return "";
  };
  typeNameAsType (ctx) {
    if ( (this.value_type == 17) || (this.eval_type == 17) ) {
      return 17;
    }
    const conv = TTypes.nameToValue(this.type_name);
    if ( conv != 0 ) {
      return conv;
    }
    if ( true == this.expression ) {
      return 17;
    }
    if ( this.value_type == 11 ) {
      if ( ctx.isEnumDefined(this.type_name) ) {
        return 13;
      }
      if ( ctx.isDefinedClass(this.type_name) ) {
        return 10;
      }
    }
    return this.value_type;
  };
  copyEvalResFrom (node) {
    if ( node.hasParamDesc ) {
      this.hasParamDesc = node.hasParamDesc;
      this.paramDesc = node.paramDesc;
    }
    if ( (typeof(node.evalTypeClass) !== "undefined" && node.evalTypeClass != null )  ) {
      this.evalTypeClass = node.evalTypeClass;
    }
    this.eval_type = node.eval_type;
    this.eval_type_name = node.eval_type_name;
    if ( (typeof(node.operator_node) !== "undefined" && node.operator_node != null )  ) {
      const nn = node.operator_node.children[1];
      if ( nn.hasFlag("optional") ) {
        this.setFlag("optional");
      }
      if ( nn.hasFlag("immutable") ) {
        this.setFlag("immutable");
      }
    } else {
      if ( node.hasFlag("optional") ) {
        this.setFlag("optional");
      }
      if ( node.hasFlag("immutable") ) {
        this.setFlag("immutable");
      }
    }
    this.eval_key_type = node.eval_key_type;
    this.eval_array_type = node.eval_array_type;
    if ( node.value_type == 7 ) {
      this.eval_type = 7;
    }
    if ( node.value_type == 6 ) {
      this.eval_type = 6;
    }
    if ( node.value_type == 17 ) {
      this.eval_type = 17;
      this.eval_function = node.eval_function;
    }
  };
  defineNodeTypeTo (node, ctx) {
    if ( (node.value_type == 17) || (node.eval_type == 17) ) {
      return;
    }
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
        node.value_type = 14;
        node.eval_type = 14;
        node.eval_type_name = "char";
        break;
      case "charbuffer" : 
        node.value_type = 15;
        node.eval_type = 15;
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
          node.value_type = 17;
          node.eval_type = 17;
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
        if ( this.value_type == 13 ) {
          node.value_type = 13;
          node.eval_type = 13;
          node.eval_type_name = this.type_name;
        }
        if ( this.value_type == 11 ) {
          if ( ctx.isEnumDefined(this.type_name) ) {
            node.value_type = 13;
            node.eval_type = 13;
            node.eval_type_name = this.type_name;
          }
          if ( ctx.isDefinedClass(this.type_name) ) {
            node.value_type = 10;
            node.eval_type = 10;
            node.eval_type_name = this.type_name;
          }
        }
        break;
    };
  };
  ifNoTypeSetToVoid () {
    if ( (((this.type_name.length) == 0) && ((this.key_type.length) == 0)) && ((this.array_type.length) == 0) ) {
      this.type_name = "void";
    }
  };
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
      if ( node.value_type == 17 ) {
        if ( typeof(this.expression_value) === "undefined" ) {
          const copyOf = node.rebuildWithType(new RangerArgMatch(), false);
          copyOf.children.pop();
          this.expression_value = copyOf;
        }
      }
      return true;
    }
    return false;
  };
}
CodeNode.vref1 = function(name) {
  const code = new SourceCode(name);
  const newNode = new CodeNode(code, 0, name.length);
  newNode.vref = name;
  newNode.value_type = 11;
  newNode.parsed_type = 11;
  newNode.ns = name.split(".");
  return newNode;
};
CodeNode.vref2 = function(name, typeName) {
  const code = new SourceCode(name);
  const newNode = new CodeNode(code, 0, name.length);
  newNode.vref = name;
  newNode.type_name = typeName;
  newNode.value_type = 11;
  newNode.parsed_type = 11;
  newNode.ns = name.split(".");
  return newNode;
};
CodeNode.newStr = function(name) {
  const code = new SourceCode("");
  const newNode = new CodeNode(code, 0, 0);
  newNode.string_value = name;
  newNode.value_type = 4;
  newNode.parsed_type = 4;
  return newNode;
};
CodeNode.newBool = function(value) {
  const code = new SourceCode("");
  const newNode = new CodeNode(code, 0, 0);
  newNode.boolean_value = value;
  newNode.value_type = 5;
  newNode.parsed_type = 5;
  return newNode;
};
CodeNode.newInt = function(value) {
  const code = new SourceCode("");
  const newNode = new CodeNode(code, 0, 0);
  newNode.int_value = value;
  newNode.value_type = 3;
  newNode.parsed_type = 3;
  return newNode;
};
CodeNode.newDouble = function(value) {
  const code = new SourceCode("");
  const newNode = new CodeNode(code, 0, 0);
  newNode.double_value = value;
  newNode.value_type = 2;
  newNode.parsed_type = 2;
  return newNode;
};
CodeNode.op = function(opName) {
  const code = new SourceCode("");
  const newNode = new CodeNode(code, 0, 0);
  newNode.expression = true;
  const opNode = CodeNode.vref1(opName);
  newNode.children.push(opNode);
  return newNode;
};
CodeNode.op2 = function(opName, param1) {
  const code = new SourceCode("");
  const newNode = new CodeNode(code, 0, 0);
  newNode.expression = true;
  const opNode = CodeNode.vref1(opName);
  newNode.children.push(opNode);
  newNode.children.push(param1);
  return newNode;
};
CodeNode.op3 = function(opName, list) {
  const code = new SourceCode("");
  const newNode = new CodeNode(code, 0, 0);
  newNode.expression = true;
  const opNode = CodeNode.vref1(opName);
  newNode.children.push(opNode);
  for ( let i = 0; i < list.length; i++) {
    var item = list[i];
    newNode.children.push(item);
  };
  return newNode;
};
CodeNode.fromList = function(list) {
  const code = new SourceCode("");
  const newNode = new CodeNode(code, 0, 0);
  newNode.expression = true;
  for ( let i = 0; i < list.length; i++) {
    var item = list[i];
    newNode.children.push(item);
    item.parent = newNode;
  };
  return newNode;
};
CodeNode.expressionNode = function() {
  const code = new SourceCode("");
  const newNode = new CodeNode(code, 0, 0);
  newNode.expression = true;
  return newNode;
};
CodeNode.blockNode = function() {
  const code = new SourceCode("");
  const newNode = new CodeNode(code, 0, 0);
  newNode.is_block_node = true;
  newNode.expression = true;
  return newNode;
};
CodeNode.blockFromList = function(list) {
  const code = new SourceCode("");
  const newNode = new CodeNode(code, 0, 0);
  newNode.is_block_node = true;
  newNode.expression = true;
  for ( let i = 0; i < list.length; i++) {
    var item = list[i];
    newNode.children.push(item);
    item.parent = newNode;
  };
  return newNode;
};
class TypeCounts  {
  constructor() {
    this.b_counted = false;
    this.interface_cnt = 0;
    this.operator_cnt = 0;
    this.immutable_cnt = 0;
    this.register_cnt = 0;
    this.opfn_cnt = 0;
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
    this.values[n] = this.cnt;
    this.cnt = this.cnt + 1;
  };
}
class OpFindResult  {
  constructor() {
    this.did_find = false;     /** note: unused */
  }
}
class RangerOperatorList  {
  constructor() {
    this.items = [];
  }
}
class RangerNodeList  {
  constructor() {
    this.items = [];
  }
}
class ContextTransaction  {
  constructor() {
    this.name = "";
    this.desc = "";
    this.ended = false;
    this.failed = false;     /** note: unused */
    this.mutations = [];     /** note: unused */
    this.children = [];
  }
}
class ContextTransactionMutation  {
  constructor() {
  }
}
class RangerRegisteredPlugin  {
  constructor() {
    this.name = "";
    this.features = [];
  }
}
class RangerAppWriterContext  {
  constructor() {
    this.op_list = {};
    this.intRootCounter = 1;     /** note: unused */
    this.targetLangName = "";
    this.defined_imports = [];     /** note: unused */
    this.already_imported = {};
    this.is_function = false;
    this.class_level_context = false;
    this.function_level_context = false;
    this.in_main = false;
    this.is_block = false;     /** note: unused */
    this.is_lambda = false;
    this.is_capturing = false;
    this.is_catch_block = false;
    this.is_try_block = false;
    this.captured_variables = [];
    this.has_block_exited = false;     /** note: unused */
    this.in_expression = false;     /** note: unused */
    this.expr_stack = [];
    this.expr_restart = false;
    this.expr_restart_block = false;
    this.in_method = false;     /** note: unused */
    this.method_stack = [];
    this.typeNames = [];     /** note: unused */
    this.typeClasses = {};
    this.in_class = false;
    this.in_static_method = false;
    this.thisName = "this";
    this.definedEnums = {};
    this.definedInterfaces = {};     /** note: unused */
    this.definedInterfaceList = [];     /** note: unused */
    this.definedClasses = {};
    this.definedClassList = [];
    this.definedTasks = {};     /** note: unused */
    this.templateClassNodes = {};
    this.templateClassList = [];
    this.classSignatures = {};
    this.classToSignature = {};
    this.templateClasses = {};     /** note: unused */
    this.classStaticWriters = {};
    this.localVariables = {};
    this.localVarNames = [];
    this.contextFlags = {};
    this.settings = {};
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
    this.staticClassBodies = [];
    this.pluginSpecificOperators = {};
    this.viewClassBody = {};
    this.appPages = {};
    this.appServices = {};
    this.opNs = [];
    this.langFilePath = "";     /** note: unused */
    this.libraryPaths = [];
    this.outputPath = "";     /** note: unused */
    this.counters = new TypeCounts();
    this.pluginNodes = {};
    this.typedNodes = {};
    this.registered_plugins = [];
    this.opFnsList = {};
    this.test_compile = [];
    this.activeTransaction = [];
    this.transactions = [];
    this.rootFile = "--not-defined--";
  }
  getEnv () {
    const root = this.getRoot();
    return root.env;
  };
  setTestCompile () {
    this.test_compile.push(true);
  };
  unsetTestCompile () {
    this.test_compile.pop();
  };
  isTestCompile () {
    if ( (this.test_compile.length) > 0 ) {
      return true;
    }
    if ( (typeof(this.parent) !== "undefined" && this.parent != null )  ) {
      return this.parent.isTestCompile();
    }
    return false;
  };
  addOpFn (name, code) {
    if ( false == (( typeof(this.opFnsList[name] ) != "undefined" && this.opFnsList.hasOwnProperty(name) )) ) {
      this.opFnsList[name] = CodeNode.expressionNode();
    }
    const rootNode = (this.opFnsList[name]);
    rootNode.children.push(code);
  };
  async getOpFns (name) {
    let rv = [];
    if ( ( typeof(this.opFnsList[name] ) != "undefined" && this.opFnsList.hasOwnProperty(name) ) ) {
      const ol = (this.opFnsList[name]);
      await operatorsOf.forEach_15(ol.children, ((item, index) => { 
        const tmp = item;
        rv.push(tmp);
      }));
    }
    if ( (typeof(this.parent) !== "undefined" && this.parent != null )  ) {
      const list2 = await this.parent.getOpFns(name);
      await operatorsOf.forEach_15(list2, ((item, index) => { 
        const tmp_1 = item;
        rv.push(tmp_1);
      }));
    }
    return rv;
  };
  getLastBlockOp () {
    if ( this.isTestCompile() ) {
      let cn;
      cn = CodeNode.expressionNode();
      return cn;
    }
    if ( (typeof(this.lastBlockOp) !== "undefined" && this.lastBlockOp != null )  ) {
      return this.lastBlockOp;
    }
    if ( (typeof(this.parent) !== "undefined" && this.parent != null )  ) {
      return this.parent.getLastBlockOp();
    }
    return this.lastBlockOp;
  };
  removePluginOp (name) {
    const root = this.getRoot();
    root.pluginSpecificOperators[name] = false;
  };
  isPluginOp (node) {
    if ( (node.children.length) > 0 ) {
      const fc = node.getFirst();
      if ( (fc.ns.length) > 0 ) {
        const firstNS = fc.ns[0];
        const root = this.getRoot();
        if ( ( typeof(root.pluginSpecificOperators[firstNS] ) != "undefined" && root.pluginSpecificOperators.hasOwnProperty(firstNS) ) ) {
          return (root.pluginSpecificOperators[firstNS]);
        }
      }
    }
    return false;
  };
  addPlugin (p) {
    const root = this.getRoot();
    root.registered_plugins.push(p);
  };
  findPluginsFor (featureName) {
    let res = [];
    for ( let i = 0; i < this.registered_plugins.length; i++) {
      var p = this.registered_plugins[i];
      if ( (p.features.indexOf(featureName)) >= 0 ) {
        res.push(p.name);
      }
    };
    return res;
  };
  addTypeClass (name) {
    const root = this.getRoot();
    if ( false == (( typeof(root.typeClasses[name] ) != "undefined" && root.typeClasses.hasOwnProperty(name) )) ) {
      const newClass = new RangerTypeClass();
      root.typeClasses[name] = newClass;
      return newClass;
    }
    return (root.typeClasses[name]);
  };
  getTypeClass (name) {
    const root = this.getRoot();
    return root.typeClasses[name];
  };
  getParser () {
    if ( typeof(this.parser) === "undefined" ) {
      if ( (typeof(this.parent) !== "undefined" && this.parent != null )  ) {
        return this.parent.getParser();
      }
    }
    return this.parser;
  };
  getCompiler () {
    if ( typeof(this.compiler) === "undefined" ) {
      if ( (typeof(this.parent) !== "undefined" && this.parent != null )  ) {
        return this.parent.getCompiler();
      }
    }
    return this.compiler;
  };
  async getTypedNodes (name) {
    const root = this.getRoot();
    let res = [];
    const list = root.typedNodes[name];
    if ( (typeof(list) !== "undefined" && list != null )  ) {
      await operatorsOf.forEach_15(list.items, ((item, index) => { 
        const tmp = item;
        res.push(tmp);
      }));
    }
    return res;
  };
  addTypedNode (name, op) {
    const root = this.getRoot();
    if ( ( typeof(root.typedNodes[name] ) != "undefined" && root.typedNodes.hasOwnProperty(name) ) ) {
      const orig_list = (root.typedNodes[name]);
      orig_list.items.push(op);
    } else {
      const new_list = new RangerNodeList();
      new_list.items.push(op);
      root.typedNodes[name] = new_list;
    }
  };
  async getPluginNodes (name) {
    const root = this.getRoot();
    let res = [];
    const list = root.pluginNodes[name];
    if ( (typeof(list) !== "undefined" && list != null )  ) {
      await operatorsOf.forEach_15(list.items, ((item, index) => { 
        const tmp = item;
        res.push(tmp);
      }));
    }
    return res;
  };
  addPluginNode (name, op) {
    const root = this.getRoot();
    if ( ( typeof(root.pluginNodes[name] ) != "undefined" && root.pluginNodes.hasOwnProperty(name) ) ) {
      const orig_list = (root.pluginNodes[name]);
      orig_list.items.push(op);
    } else {
      const new_list = new RangerNodeList();
      new_list.items.push(op);
      root.pluginNodes[name] = new_list;
    }
  };
  addOperator (op) {
    const root = this.getRoot();
    if ( (op.name.length) > 0 ) {
      if ( ( typeof(root.op_list[op.name] ) != "undefined" && root.op_list.hasOwnProperty(op.name) ) ) {
        const orig_list = (root.op_list[op.name]);
        orig_list.items.push(op);
      } else {
        const new_list = new RangerOperatorList();
        new_list.items.push(op);
        root.op_list[op.name] = new_list;
      }
    }
  };
  async getAllOperators () {
    const root = this.getRoot();
    let res = [];
    await operatorsOf_13.forEach_16(root.op_list, (async (item, index) => { 
      await operatorsOf.forEach_17(item.items, ((item, index) => { 
        const tmp = item;
        res.push(tmp);
      }));
    }));
    return res;
  };
  getOperatorsOf (name) {
    const root = this.getRoot();
    let res = [];
    const list = root.op_list[name];
    if ( (typeof(list) !== "undefined" && list != null )  ) {
      return operatorsOf.clone_18(list.items);
    }
    return res;
  };
  async initOpList () {
    const root = this.getRoot();
    if ( (typeof(root.operators) !== "undefined" && root.operators != null )  ) {
      const op = root.operators;
      await op.initializeOpCache();
      const foo = await op.getOperators("+");
      if ( (foo.length) > 0 ) {
        await operatorsOf_13.forEach_19(op.opHash, (async (item, index) => { 
          const op_name = index;
          await operatorsOf.forEach_15(item.list, ((item, index) => { 
            /** unused:  const fc = item.getFirst()   **/ 
            const nameNode = item.getSecond();
            const args = item.getThird();
            const newOp = new RangerAppOperatorDesc();
            newOp.name = op_name;
            newOp.node = item;
            newOp.nameNode = nameNode;
            newOp.op_params = args.children;
            if ( (args.children.length) > 0 ) {
              newOp.firstArg = args.children[0];
            }
            this.addOperator(newOp);
          }));
        }));
      }
    } else {
    }
  };
  incLambdaCnt () {
    const root = this.getRoot();
    root.counters.interface_cnt = root.counters.interface_cnt + 1;
  };
  createNewRegName () {
    const root = this.findFunctionCtx();
    root.counters.register_cnt = root.counters.register_cnt + 1;
    return "__REGx" + root.counters.register_cnt;
  };
  createNewOpFnName () {
    const root = this.findFunctionCtx();
    root.counters.opfn_cnt = root.counters.opfn_cnt + 1;
    return "__tmpOpFn" + root.counters.opfn_cnt;
  };
  isTryBlock () {
    if ( this.expr_restart ) {
      return false;
    }
    if ( this.is_try_block ) {
      return true;
    }
    if ( (typeof(this.parent) !== "undefined" && this.parent != null )  ) {
      return this.parent.isTryBlock();
    }
    return false;
  };
  isCatchBlock () {
    if ( this.expr_restart ) {
      return false;
    }
    if ( this.is_catch_block ) {
      return true;
    }
    if ( (typeof(this.parent) !== "undefined" && this.parent != null )  ) {
      return this.parent.isCatchBlock();
    }
    return false;
  };
  async pushAndCollectAst (rootNode, wr) {
    const myParser = new RangerFlowParser();
    await myParser.CollectMethods(rootNode, this, wr);
  };
  async pushAndCompileAst (rootNode, wr) {
    const myParser = new RangerFlowParser();
    await myParser.CollectMethods(rootNode, this, wr);
    await myParser.StartWalk(rootNode, this, wr);
  };
  pushAst (source_code, node, wr) {
    const code = new SourceCode(source_code);
    code.filename = "dynamically_generated";
    const parser_1 = new RangerLispParser(code);
    parser_1.parse(this.hasCompilerFlag("no-op-transform"));
    if ( typeof(parser_1.rootNode) != "undefined" ) {
      const root = parser_1.rootNode;
      node.children.push(root);
    }
  };
  async pushAndCollectCode (source_code, wr) {
    const code = new SourceCode(source_code);
    code.filename = "dynamically_generated";
    const parser_1 = new RangerLispParser(code);
    parser_1.parse(this.hasCompilerFlag("no-op-transform"));
    if ( typeof(parser_1.rootNode) != "undefined" ) {
      const root = parser_1.rootNode;
      const myParser = new RangerFlowParser();
      const rootCtx = this.getRoot();
      await myParser.CollectMethods(root, rootCtx, wr);
    }
  };
  async pushCode (source_code, wr) {
    const code = new SourceCode(source_code);
    code.filename = "dynamically_generated";
    const parser_1 = new RangerLispParser(code);
    parser_1.parse(this.hasCompilerFlag("no-op-transform"));
    if ( typeof(parser_1.rootNode) != "undefined" ) {
      const root = parser_1.rootNode;
      const myParser = new RangerFlowParser();
      const rootCtx = this.getRoot();
      await myParser.CollectMethods(root, rootCtx, wr);
      await myParser.StartWalk(root, rootCtx, wr);
    }
  };
  addViewClassBody (name, classDef) {
    const root = this.getRoot();
    root.viewClassBody[name] = classDef;
  };
  addPage (name, classDef) {
    const root = this.getRoot();
    root.appPages[name] = classDef;
  };
  addService (name, classDef) {
    const root = this.getRoot();
    root.appServices[name] = classDef;
  };
  getViewClass (s_name) {
    let res;
    if ( ( typeof(this.viewClassBody[s_name] ) != "undefined" && this.viewClassBody.hasOwnProperty(s_name) ) ) {
      res = this.viewClassBody[s_name];
      return res;
    }
    if ( typeof(this.parent) === "undefined" ) {
      return res;
    }
    return this.parent.getViewClass(s_name);
  };
  addOpNs (n) {
    this.opNs.push(n);
  };
  removeOpNs (n) {
    const idx = this.opNs.indexOf(n);
    if ( idx >= 0 ) {
      this.opNs.splice(idx, 1).pop();
    }
  };
  inLambda () {
    if ( this.is_lambda ) {
      return true;
    }
    if ( (typeof(this.parent) !== "undefined" && this.parent != null )  ) {
      return this.parent.inLambda();
    }
    return false;
  };
  async variableTypeUsage () {
    let res = {};
    let cc = this;
    while ((typeof(cc) !== "undefined" && cc != null ) ) {
      await operatorsOf_13.forEach_20(cc.localVariables, ((item, index) => { 
        if ( (typeof(item.nameNode) !== "undefined" && item.nameNode != null )  ) {
          res[item.nameNode.type_name] = true;
          res[item.nameNode.key_type] = true;
          res[item.nameNode.array_type] = true;
        }
      }));
      cc = cc.parent;
    };
    return Object.keys(res);
  };
  async writeContextVars (wr) {
    await operatorsOf_13.forEach_20(this.localVariables, (async (item, index) => { 
      wr.out(("def " + index) + ":", false);
      if ( (typeof(item.nameNode) !== "undefined" && item.nameNode != null )  ) {
        const r = new RangerRangerClassWriter();
        await r.writeTypeDef(item.nameNode, this, wr);
      }
      wr.out(("(" + item.compiledName) + ")", false);
      wr.out("", true);
    }));
  };
  async writeContextInfo (wr) {
    let cList = [];
    let c = this;
    cList.push(c);
    while ((typeof(c.parent) !== "undefined" && c.parent != null ) ) {
      c = c.parent;
      cList.push(c);
    };
    let idx = cList.length;
    let cnt = idx;
    while (idx > 0) {
      idx = idx - 1;
      wr.out("{", true);
      wr.indent(1);
      const cc = cList[idx];
      await cc.writeContextVars(wr);
    };
    while (cnt > 0) {
      wr.indent(-1);
      wr.out("}", true);
      cnt = cnt - 1;
    };
  };
  async getContextInfo () {
    const wr = new CodeWriter();
    await this.writeContextInfo(wr);
    return wr.getCode();
  };
  isCapturing () {
    if ( this.is_capturing ) {
      return true;
    }
    if ( typeof(this.parent) != "undefined" ) {
      return this.parent.isCapturing();
    }
    return false;
  };
  forkWithOps (opNode) {
    const ops = this.getOperatorDef();
    const new_ops = ops.fork(opNode);
    const new_ctx = this.fork();
    new_ctx.operators = new_ops;
    return new_ctx;
  };
  getOperatorDef () {
    if ( (typeof(this.operators) !== "undefined" && this.operators != null )  ) {
      return this.operators;
    }
    if ( (typeof(this.parent) !== "undefined" && this.parent != null )  ) {
      return this.parent.getOperatorDef();
    }
    const nothingFound = new RangerActiveOperators();
    return nothingFound;
  };
  async getOperators (name) {
    const root = this.getRoot();
    let cc = this;
    let opNamespace = [];
    if ( (this.opNs.length) > 0 ) {
      for ( let i = 0; i < this.opNs.length; i++) {
        var nsName = this.opNs[i];
        opNamespace.push(nsName);
      };
    }
    while ((typeof(cc.parent) !== "undefined" && cc.parent != null ) ) {
      cc = cc.parent;
      if ( (cc.opNs.length) > 0 ) {
        for ( let i_1 = 0; i_1 < cc.opNs.length; i_1++) {
          var nsName_1 = cc.opNs[i_1];
          opNamespace.push(nsName_1);
        };
      }
    };
    if ( (typeof(root.operators) !== "undefined" && root.operators != null )  ) {
      const op = root.operators;
      let listOfOps = [];
      let handled = {};
      for ( let i_2 = 0; i_2 < opNamespace.length; i_2++) {
        var ss = opNamespace[i_2];
        if ( ( typeof(handled[ss] ) != "undefined" && handled.hasOwnProperty(ss) ) ) {
          continue;
        }
        handled[ss] = true;
        const nsOps = await op.getOperators(((ss + ".") + name));
        for ( let i_3 = 0; i_3 < nsOps.length; i_3++) {
          var ns_op = nsOps[i_3];
          listOfOps.push(ns_op);
        };
      };
      const plainOps = await op.getOperators(name);
      for ( let i_4 = 0; i_4 < plainOps.length; i_4++) {
        var ppn = plainOps[i_4];
        listOfOps.push(ppn);
      };
      let cc_2;
      cc_2 = this;
      while ((typeof(cc_2) !== "undefined" && cc_2 != null ) ) {
        if ( (typeof(cc_2.operatorFunction) !== "undefined" && cc_2.operatorFunction != null )  ) {
          const opFn = cc_2.operatorFunction;
          const suggestedOp = await opFn(name);
          await operatorsOf.forEach_15(suggestedOp.children, ((item, index) => { 
            listOfOps.splice(0, 0, item.copy());
          }));
        }
        cc_2 = cc_2.parent;
      };
      return listOfOps;
    }
    let nothingFound = [];
    return nothingFound;
  };
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
  };
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
  };
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
  };
  transformOpNameWord (input_word) {
    const __len = input_word.length;
    let i = 0;
    let res = "";
    while (i < __len) {
      const cc = input_word.charCodeAt(i );
      if ( ((cc >= (97)) && (cc <= (122))) || ((cc >= (65)) && (cc <= (89))) ) {
        res = res + (String.fromCharCode(cc));
      } else {
        res = (res + "c") + cc;
      }
      i = i + 1;
    };
    return res;
  };
  transformWord (input_word) {
    switch (input_word ) { 
      case "map" : 
        return "_map";
      default: 
        break;
    };
    const root = this.getRoot();
    root.initReservedWords();
    if ( ( typeof(this.refTransform[input_word] ) != "undefined" && this.refTransform.hasOwnProperty(input_word) ) ) {
      return (this.refTransform[input_word]);
    }
    return input_word;
  };
  initReservedWords () {
    if ( (typeof(this.reservedWords) !== "undefined" && this.reservedWords != null )  ) {
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
    };
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
          this.refTransform[word.vref] = transform.vref;
        };
      }
    };
    return true;
  };
  initStdCommands () {
    if ( (typeof(this.stdCommands) !== "undefined" && this.stdCommands != null )  ) {
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
    };
    /** unused:  let cmds   **/ 
    const langNodes = lang.children[1];
    for ( let i_1 = 0; i_1 < langNodes.children.length; i_1++) {
      var lch = langNodes.children[i_1];
      const fc_1 = lch.getFirst();
      if ( fc_1.vref == "commands" ) {
        /** unused:  const n = lch.getSecond()   **/ 
        this.stdCommands = lch.getSecond();
      }
    };
    return true;
  };
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
        return (cl.systemNames[operatorsOfRangerAppWriterContext_21.getTargetLang_22(this)]);
      }
    }
    return typeName;
  };
  isPrimitiveType (typeName) {
    if ( (((((typeName == "double") || (typeName == "string")) || (typeName == "int")) || (typeName == "char")) || (typeName == "charbuffer")) || (typeName == "boolean") ) {
      return true;
    }
    return false;
  };
  isDefinedType (typeName) {
    if ( typeName == "Any" ) {
      return true;
    }
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
  };
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
        if ( this.isDefinedType(node.key_type) == false ) {
          this.addError(node, "Unknown type for map keys: " + node.key_type);
        }
        return false;
      }
    }
    if ( this.isEnumDefined(node.type_name) ) {
      return true;
    }
    if ( this.isDefinedType(node.type_name) ) {
      return true;
    } else {
      if ( node.value_type == 17 ) {
      } else {
        this.addError(node, (("Unknown type: " + node.type_name) + " type ID : ") + node.value_type);
      }
    }
    return false;
  };
  findOperator (node) {
    const root = this.getRoot();
    root.initStdCommands();
    if ( (typeof(node.operator_node) !== "undefined" && node.operator_node != null )  ) {
      return node.operator_node;
    }
    return root.stdCommands.children[node.op_index];
  };
  getStdCommands () {
    const root = this.getRoot();
    root.initStdCommands();
    return root.stdCommands;
  };
  async findOperatorsWithName (name) {
    let res = [];
    await operatorsOf.forEach_15((this.getStdCommands()).children, ((item, index) => { 
      if ( item.isFirstVref(name) ) {
        res.push(item);
      }
    }));
    return res;
  };
  findClassWithSign (node) {
    const root = this.getRoot();
    const tplArgs = node.vref_annotation;
    const sign = node.vref + tplArgs.getCode();
    const theName = root.classSignatures[sign];
    return this.findClass((theName));
  };
  createSignature (origClass, classSig) {
    if ( ( typeof(this.classSignatures[classSig] ) != "undefined" && this.classSignatures.hasOwnProperty(classSig) ) ) {
      return (this.classSignatures[classSig]);
    }
    let ii = 1;
    let sigName = (origClass + "V") + ii;
    while (( typeof(this.classToSignature[sigName] ) != "undefined" && this.classToSignature.hasOwnProperty(sigName) )) {
      ii = ii + 1;
      sigName = (origClass + "V") + ii;
    };
    this.classToSignature[sigName] = classSig;
    this.classSignatures[classSig] = sigName;
    return sigName;
  };
  async createStaticMethod (withName, currC, nameNode, argsNode, fnBody, parser, wr) {
    const s = withName;
    const m = new RangerAppFunctionDesc();
    m.name = s;
    m.compiledName = this.transformWord(s);
    m.node = nameNode;
    m.nameNode = nameNode;
    const rCtx = this.getRoot();
    m.fnCtx = rCtx.fork();
    m.is_static = true;
    m.nameNode.ifNoTypeSetToVoid();
    const args = argsNode;
    m.fnBody = fnBody;
    await parser.CheckTypeAnnotationOf(m.nameNode, rCtx, wr);
    for ( let ii = 0; ii < args.children.length; ii++) {
      var arg = args.children[ii];
      if ( arg.hasFlag("noeval") ) {
        continue;
      }
      const p = new RangerAppParamDesc();
      p.name = arg.vref;
      if ( p.name == "self" ) {
        p.compiledName = "__self";
      }
      p.value_type = arg.value_type;
      p.node = arg;
      p.init_cnt = 1;
      p.nameNode = arg;
      await parser.CheckTypeAnnotationOf(arg, rCtx, wr);
      p.refType = 1;
      p.varType = 4;
      m.params.push(p);
      arg.hasParamDesc = true;
      arg.paramDesc = p;
      arg.eval_type = arg.value_type;
      arg.eval_type_name = arg.type_name;
      if ( arg.hasFlag("strong") ) {
        p.changeStrength(1, 1, p.nameNode);
      } else {
        arg.setFlag("lives");
        p.changeStrength(0, 1, p.nameNode);
      }
    };
    currC.addStaticMethod(m);
    return m;
  };
  canUseTypeInference (nameNode) {
    const b_allow_ti = this.hasCompilerFlag("allowti");
    let b_multitype = false;
    if ( b_allow_ti ) {
      let t_name = nameNode.type_name;
      if ( (nameNode.eval_type_name.length) > 0 ) {
        t_name = nameNode.eval_type_name;
      }
      if ( this.isDefinedClass(t_name) ) {
        const cc = this.findClass(t_name);
        b_multitype = ((((cc.is_union || cc.is_system) || cc.is_system_union) || cc.is_trait) || cc.is_inherited) || ((cc.extends_classes.length) > 0);
      }
    }
    return b_allow_ti && (false == b_multitype);
  };
  createOpStaticClass (name) {
    const nameWillBe = "operatorsOf" + name;
    let str = "";
    let i = 0;
    const __len = nameWillBe.length;
    while (i < __len) {
      const c = nameWillBe.charCodeAt(i );
      if ( c == (".".charCodeAt(0)) ) {
        str = str + "_";
      } else {
        str = str + (nameWillBe.substring(i, (i + 1) ));
      }
      i = i + 1;
    };
    if ( this.isDefinedClass(str) ) {
      return this.findClass(str);
    }
    const tpl_code = ("class " + str) + " {\n}";
    const code = new SourceCode(tpl_code);
    code.filename = str + ".ranger";
    const parser_1 = new RangerLispParser(code);
    parser_1.parse(false);
    const classRoot = parser_1.rootNode.children[0];
    const classNameNode = classRoot.getSecond();
    classNameNode.vref = str;
    const new_class = new RangerAppClassDesc();
    new_class.name = str;
    new_class.compiledName = str;
    new_class.is_operator_class = true;
    new_class.nameNode = classNameNode;
    new_class.classNode = classRoot;
    const subCtx = this.fork();
    subCtx.setCurrentClass(new_class);
    new_class.ctx = subCtx;
    const root = this.getRoot();
    root.addClass(str, new_class);
    classNameNode.clDesc = new_class;
    this.staticClassBodies.push(classRoot);
    return new_class;
  };
  async createTraitInstanceClass (traitName, instanceName, initParams, flowParser, wr) {
    let res;
    const ctx = this.fork();
    if ( this.isDefinedClass(instanceName) ) {
      return res;
    }
    if ( this.isDefinedClass(traitName) == false ) {
      this.addError(initParams, "Could not find the trait " + traitName);
      return res;
    }
    const tpl_code = ("class " + instanceName) + " {\n}";
    const code = new SourceCode(tpl_code);
    code.filename = instanceName + ".ranger";
    const parser_1 = new RangerLispParser(code);
    parser_1.parse(false);
    const classRoot = parser_1.rootNode.children[0];
    const classNameNode = classRoot.getSecond();
    classNameNode.vref = instanceName;
    const new_class = new RangerAppClassDesc();
    new_class.name = instanceName;
    new_class.compiledName = instanceName;
    new_class.nameNode = classNameNode;
    new_class.node = classRoot;
    new_class.classNode = classRoot;
    new_class.is_generic_instance = true;
    new_class.consumes_traits.push(traitName);
    const root = this.getRoot();
    new_class.ctx = root.fork();
    root.addClass(instanceName, new_class);
    classNameNode.clDesc = new_class;
    const cl = new_class;
    const t = this.findClass(traitName);
    const traitClassDef = t.node;
    const name = t.name;
    const t_2 = ctx.findClass(name);
    if ( (t_2.extends_classes.length) > 0 ) {
      ctx.addError(traitClassDef, ("Can not join trait " + name) + " because it is inherited. Currently on base classes can be used as traits.");
      return res;
    }
    if ( t_2.has_constructor ) {
      ctx.addError(traitClassDef, ("Can not join trait " + name) + " because it has a constructor function");
    } else {
      const origBody = cl.node.children[2];
      const match = new RangerArgMatch();
      const params = t_2.node.getExpressionProperty("params");
      const traitParams = new RangerTraitParams();
      if ( (typeof(params) !== "undefined" && params != null )  ) {
        for ( let i = 0; i < params.children.length; i++) {
          var typeName = params.children[i];
          let set_value = "";
          if ( (initParams.children.length) > i ) {
            const pArg = initParams.children[i];
            match.add(typeName.vref, pArg.vref, ctx);
            set_value = pArg.vref;
          } else {
            match.add(typeName.vref, instanceName, ctx);
            set_value = instanceName;
          }
          traitParams.param_names.push(typeName.vref);
          traitParams.values[typeName.vref] = set_value;
        };
        cl.trait_params[name] = traitParams;
      } else {
        match.add("T", cl.name, ctx);
      }
      ctx.setCurrentClass(cl);
      const traitClass = t_2;
      for ( let i_1 = 0; i_1 < traitClass.variables.length; i_1++) {
        var pvar = traitClass.variables[i_1];
        const ccopy = pvar.node.rebuildWithType(match, true);
        await flowParser.WalkCollectMethods(ccopy, ctx, wr);
        origBody.children.push(ccopy);
      };
      for ( let i_2 = 0; i_2 < traitClass.defined_variants.length; i_2++) {
        var fnVar = traitClass.defined_variants[i_2];
        const mVs = traitClass.method_variants[fnVar];
        for ( let i_3 = 0; i_3 < mVs.variants.length; i_3++) {
          var variant = mVs.variants[i_3];
          const ccopy_1 = variant.node.rebuildWithType(match, true);
          await flowParser.WalkCollectMethods(ccopy_1, ctx, wr);
          origBody.children.push(ccopy_1);
        };
      };
      res = new_class;
      /** unused:  const rootCtx = this.getRoot()   **/ 
      await flowParser.WalkNode(new_class.node, ctx, wr);
    }
    return res;
  };
  createOperator (fromNode) {
    const root = this.getRoot();
    if ( root.initStdCommands() ) {
      root.stdCommands.children.push(fromNode);
    }
  };
  findClassMethod (cname, fname) {
    let res;
    if ( this.isDefinedClass(cname) ) {
      const cl = this.findClass(cname);
      for ( let i = 0; i < cl.defined_variants.length; i++) {
        var fnVar = cl.defined_variants[i];
        if ( fnVar == fname ) {
          const mVs = cl.method_variants[fnVar];
          for ( let i_1 = 0; i_1 < mVs.variants.length; i_1++) {
            var variant = mVs.variants[i_1];
            res = variant;
            return res;
          };
        }
      };
    }
    return res;
  };
  getFileWriter (path, fileName) {
    const root = this.getRoot();
    const fs = root.fileSystem;
    const file = fs.getFile(path, fileName);
    let wr;
    wr = file.getWriter();
    return wr;
  };
  addTodo (node, descr) {
    const e = new RangerAppTodo();
    e.description = descr;
    e.todonode = node;
    const root = this.getRoot();
    root.todoList.push(e);
  };
  setThisName (the_name) {
    const root = this.getRoot();
    root.thisName = the_name;
  };
  getThisName () {
    const root = this.getRoot();
    return root.thisName;
  };
  printLogs (logName) {
  };
  log (node, logName, descr) {
  };
  addMessage (node, descr) {
    const e = new RangerCompilerMessage();
    e.description = descr;
    e.node = node;
    const root = this.getRoot();
    root.compilerMessages.push(e);
  };
  errCnt () {
    const root = this.getRoot();
    return root.compilerErrors.length;
  };
  addError (targetnode, descr) {
    const e = new RangerCompilerMessage();
    e.description = descr;
    e.node = targetnode;
    const root = this.getRoot();
    root.compilerErrors.push(e);
  };
  addParserError (targetnode, descr) {
    const e = new RangerCompilerMessage();
    e.description = descr;
    e.node = targetnode;
    const root = this.getRoot();
    root.parserErrors.push(e);
  };
  addTemplateClass (name, node) {
    const root = this.getRoot();
    root.templateClassList.push(name);
    root.templateClassNodes[name] = node;
  };
  hasTemplateNode (name) {
    const root = this.getRoot();
    return ( typeof(root.templateClassNodes[name] ) != "undefined" && root.templateClassNodes.hasOwnProperty(name) );
  };
  findTemplateNode (name) {
    const root = this.getRoot();
    return (root.templateClassNodes[name]);
  };
  setStaticWriter (className, writer) {
    const root = this.getRoot();
    root.classStaticWriters[className] = writer;
  };
  getStaticWriter (className) {
    const root = this.getRoot();
    return (root.classStaticWriters[className]);
  };
  isEnumDefined (n) {
    if ( ( typeof(this.definedEnums[n] ) != "undefined" && this.definedEnums.hasOwnProperty(n) ) ) {
      return true;
    }
    if ( typeof(this.parent) === "undefined" ) {
      return false;
    }
    return this.parent.isEnumDefined(n);
  };
  getEnum (n) {
    let res;
    if ( ( typeof(this.definedEnums[n] ) != "undefined" && this.definedEnums.hasOwnProperty(n) ) ) {
      res = this.definedEnums[n];
      return res;
    }
    if ( (typeof(this.parent) !== "undefined" && this.parent != null )  ) {
      return this.parent.getEnum(n);
    }
    return res;
  };
  isVarDefined (name) {
    if ( ( typeof(this.localVariables[name] ) != "undefined" && this.localVariables.hasOwnProperty(name) ) ) {
      return true;
    }
    if ( typeof(this.parent) === "undefined" ) {
      return false;
    }
    return this.parent.isVarDefined(name);
  };
  setFlag (name, value) {
    this.contextFlags[name] = value;
  };
  getFlag (name) {
    if ( ( typeof(this.contextFlags[name] ) != "undefined" && this.contextFlags.hasOwnProperty(name) ) ) {
      return (this.contextFlags[name]);
    }
    if ( (typeof(this.parent) !== "undefined" && this.parent != null )  ) {
      return this.parent.getFlag(name);
    }
    return false;
  };
  setSetting (name, value) {
    this.settings[name] = value;
  };
  hasSetting (name) {
    if ( ( typeof(this.settings[name] ) != "undefined" && this.settings.hasOwnProperty(name) ) ) {
      return true;
    }
    if ( (typeof(this.parent) !== "undefined" && this.parent != null )  ) {
      return this.parent.hasSetting(name);
    }
    return false;
  };
  getSetting (name) {
    if ( ( typeof(this.settings[name] ) != "undefined" && this.settings.hasOwnProperty(name) ) ) {
      return (this.settings[name]);
    }
    if ( (typeof(this.parent) !== "undefined" && this.parent != null )  ) {
      return this.parent.getSetting(name);
    }
    return "";
  };
  setCompilerFlag (name, value) {
    const root = this.getRoot();
    root.compilerFlags[name] = value;
  };
  hasCompilerFlag (s_name) {
    if ( ( typeof(this.compilerFlags[s_name] ) != "undefined" && this.compilerFlags.hasOwnProperty(s_name) ) ) {
      return (this.compilerFlags[s_name]);
    }
    if ( typeof(this.parent) === "undefined" ) {
      return false;
    }
    return this.parent.hasCompilerFlag(s_name);
  };
  setCompilerSetting (name, value) {
    const root = this.getRoot();
    root.compilerSettings[name] = value;
  };
  getCompilerSetting (s_name) {
    if ( ( typeof(this.compilerSettings[s_name] ) != "undefined" && this.compilerSettings.hasOwnProperty(s_name) ) ) {
      return (this.compilerSettings[s_name]);
    }
    if ( typeof(this.parent) === "undefined" ) {
      return "";
    }
    return this.parent.getCompilerSetting(s_name);
  };
  hasCompilerSetting (s_name) {
    if ( ( typeof(this.compilerSettings[s_name] ) != "undefined" && this.compilerSettings.hasOwnProperty(s_name) ) ) {
      return true;
    }
    if ( typeof(this.parent) === "undefined" ) {
      return false;
    }
    return this.parent.hasCompilerSetting(s_name);
  };
  getVariableDef (name) {
    if ( ( typeof(this.localVariables[name] ) != "undefined" && this.localVariables.hasOwnProperty(name) ) ) {
      return (this.localVariables[name]);
    }
    if ( typeof(this.parent) === "undefined" ) {
      const tmp = new RangerAppParamDesc();
      return tmp;
    }
    return this.parent.getVariableDef(name);
  };
  findFunctionCtx () {
    if ( this.is_function ) {
      return this;
    }
    if ( typeof(this.parent) === "undefined" ) {
      return this;
    }
    return this.parent.findFunctionCtx();
  };
  getFnVarCnt (name) {
    const fnCtx = this.findFunctionCtx();
    let ii = 0;
    if ( ( typeof(fnCtx.defCounts[name] ) != "undefined" && fnCtx.defCounts.hasOwnProperty(name) ) ) {
      ii = (fnCtx.defCounts[name]);
      ii = 1 + ii;
    } else {
      fnCtx.defCounts[name] = ii;
      return 0;
    }
    let scope_has = this.isVarDefined(((name + "_") + ii));
    while (scope_has) {
      ii = 1 + ii;
      scope_has = this.isVarDefined(((name + "_") + ii));
    };
    fnCtx.defCounts[name] = ii;
    return ii;
  };
  debugVars () {
    console.log("--- context vars ---");
    for ( let i = 0; i < this.localVarNames.length; i++) {
      var na = this.localVarNames[i];
      console.log("var => " + na);
    };
    if ( (typeof(this.parent) !== "undefined" && this.parent != null )  ) {
      this.parent.debugVars();
    }
  };
  getVarTotalCnt (name) {
    const fnCtx = this;
    let ii = 0;
    if ( ( typeof(fnCtx.defCounts[name] ) != "undefined" && fnCtx.defCounts.hasOwnProperty(name) ) ) {
      ii = (fnCtx.defCounts[name]);
    }
    if ( (typeof(fnCtx.parent) !== "undefined" && fnCtx.parent != null )  ) {
      ii = ii + fnCtx.parent.getVarTotalCnt(name);
    }
    if ( this.isVarDefined(name) ) {
      ii = ii + 1;
    }
    return ii;
  };
  getFnVarCnt2 (name) {
    const fnCtx = this;
    let ii = 0;
    if ( ( typeof(fnCtx.defCounts[name] ) != "undefined" && fnCtx.defCounts.hasOwnProperty(name) ) ) {
      ii = (fnCtx.defCounts[name]);
      ii = 1 + ii;
      fnCtx.defCounts[name] = ii;
    } else {
      fnCtx.defCounts[name] = 1;
    }
    if ( (typeof(fnCtx.parent) !== "undefined" && fnCtx.parent != null )  ) {
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
    };
    return ii;
  };
  getFnVarCnt3 (name) {
    const classLevel = this.findMethodLevelContext();
    const fnCtx = this;
    let ii = 0;
    if ( ( typeof(fnCtx.defCounts[name] ) != "undefined" && fnCtx.defCounts.hasOwnProperty(name) ) ) {
      ii = (fnCtx.defCounts[name]);
      fnCtx.defCounts[name] = ii + 1;
    } else {
      fnCtx.defCounts[name] = 1;
    }
    if ( classLevel.isVarDefined(name) ) {
      ii = ii + 1;
    }
    let scope_has = this.isVarDefined(((name + "_") + ii));
    while (scope_has) {
      ii = 1 + ii;
      scope_has = this.isVarDefined(((name + "_") + ii));
    };
    return ii;
  };
  isMemberVariable (name) {
    if ( this.isVarDefined(name) ) {
      const vDef = this.getVariableDef(name);
      if ( vDef.varType == 8 ) {
        return true;
      }
    }
    return false;
  };
  defineVariable (name, desc) {
    let cnt = 0;
    const fnLevel = this.findMethodLevelContext();
    if ( false == (((desc.varType == 8) || (desc.varType == 4)) || (desc.varType == 10)) ) {
      cnt = fnLevel.getFnVarCnt3(name);
    }
    if ( 0 == cnt ) {
      switch (name ) { 
        case "self" : 
          desc.compiledName = "__self";
          break;
        case "process" : 
          desc.compiledName = "_process";
          break;
        case "len" : 
          desc.compiledName = "__len";
          break;
        default: 
          desc.compiledName = name;
          break;
      };
    } else {
      desc.compiledName = (name + "_") + cnt;
    }
    if ( desc.varType == 8 ) {
    }
    this.localVariables[name] = desc;
    this.localVarNames.push(name);
  };
  isDefinedClass (name) {
    if ( ( typeof(this.definedClasses[name] ) != "undefined" && this.definedClasses.hasOwnProperty(name) ) ) {
      return true;
    } else {
      if ( (typeof(this.parent) !== "undefined" && this.parent != null )  ) {
        return this.parent.isDefinedClass(name);
      }
    }
    return false;
  };
  getRoot () {
    if ( typeof(this.parent) === "undefined" ) {
      return this;
    }
    return this.parent.getRoot();
  };
  getClasses () {
    let list = [];
    for ( let i = 0; i < this.definedClassList.length; i++) {
      var n = this.definedClassList[i];
      list.push((this.definedClasses[n]));
    };
    return list;
  };
  addClass (name, desc) {
    const root = this.getRoot();
    if ( ( typeof(root.definedClasses[name] ) != "undefined" && root.definedClasses.hasOwnProperty(name) ) ) {
    } else {
      root.definedClasses[name] = desc;
      root.definedClassList.push(name);
    }
  };
  findClass (name) {
    const root = this.getRoot();
    return (root.definedClasses[name]);
  };
  hasClass (name) {
    const root = this.getRoot();
    return ( typeof(root.definedClasses[name] ) != "undefined" && root.definedClasses.hasOwnProperty(name) );
  };
  getCurrentMethod () {
    if ( (typeof(this.currentMethod) !== "undefined" && this.currentMethod != null )  ) {
      return this.currentMethod;
    }
    if ( (typeof(this.parent) !== "undefined" && this.parent != null )  ) {
      return this.parent.getCurrentMethod();
    }
    return new RangerAppFunctionDesc();
  };
  setCurrentClass (cc) {
    this.in_class = true;
    this.currentClass = cc;
  };
  disableCurrentClass () {
    if ( this.in_class ) {
      this.in_class = false;
    }
    if ( (typeof(this.parent) !== "undefined" && this.parent != null )  ) {
      this.parent.disableCurrentClass();
    }
  };
  hasCurrentClass () {
    if ( this.in_class && ((typeof(this.currentClass) !== "undefined" && this.currentClass != null ) ) ) {
      return true;
    }
    if ( (typeof(this.parent) !== "undefined" && this.parent != null )  ) {
      return this.parent.hasCurrentClass();
    }
    return false;
  };
  getCurrentClass () {
    const non = this.currentClass;
    if ( this.in_class && ((typeof(non) !== "undefined" && non != null ) ) ) {
      return non;
    }
    if ( (typeof(this.parent) !== "undefined" && this.parent != null )  ) {
      return this.parent.getCurrentClass();
    }
    return non;
  };
  restartExpressionLevel () {
    this.expr_restart = true;
  };
  newBlock () {
    this.expr_restart_block = true;
  };
  isInExpression () {
    if ( (this.expr_stack.length) > 0 ) {
      return true;
    }
    if ( (((typeof(this.parent) !== "undefined" && this.parent != null ) ) && (this.expr_restart_block == false)) && (this.expr_restart == false) ) {
      return this.parent.isInExpression();
    }
    return false;
  };
  expressionLevel () {
    const level = this.expr_stack.length;
    if ( (((typeof(this.parent) !== "undefined" && this.parent != null ) ) && (this.expr_restart == false)) && (this.expr_restart_block == false) ) {
      return level + this.parent.expressionLevel();
    }
    return level;
  };
  setInExpr () {
    this.expr_stack.push(true);
  };
  unsetInExpr () {
    this.expr_stack.pop();
  };
  getErrorCount () {
    let cnt = this.compilerErrors.length;
    if ( typeof(this.parent) != "undefined" ) {
      cnt = cnt + this.parent.getErrorCount();
    }
    return cnt;
  };
  isInStatic () {
    if ( this.in_static_method ) {
      return true;
    }
    if ( typeof(this.parent) != "undefined" ) {
      return this.parent.isInStatic();
    }
    return false;
  };
  isInMain () {
    if ( this.in_main ) {
      return true;
    }
    if ( typeof(this.parent) != "undefined" ) {
      return this.parent.isInMain();
    }
    return false;
  };
  isInMethod () {
    if ( (this.method_stack.length) > 0 ) {
      return true;
    }
    if ( (typeof(this.parent) !== "undefined" && this.parent != null )  ) {
      return this.parent.isInMethod();
    }
    return false;
  };
  setInMethod () {
    this.method_stack.push(true);
  };
  unsetInMethod () {
    this.method_stack.pop();
  };
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
  };
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
  };
  fork () {
    const new_ctx = new RangerAppWriterContext();
    new_ctx.parent = this;
    return new_ctx;
  };
  getRootFile () {
    const root = this.getRoot();
    return root.rootFile;
  };
  setRootFile (file_name) {
    const root = this.getRoot();
    root.rootFile = file_name;
  };
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
      this.import_list[import_name] = import_name;
      this.import_names.push(import_name);
    }
  };
  rewrite (newString) {
    this.writer.rewrite(newString);
  };
  testCreateWriter () {
    return new CodeWriter();
  };
  getImports () {
    return this.import_names;
  };
  getWriter () {
    this.writer.ownerFile = this;
    return this.writer;
  };
  getCode () {
    return this.writer.getCode();
  };
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
    };
    const new_file = new CodeFile(path, name);
    new_file.fileSystem = this;
    this.files.push(new_file);
    return new_file;
  };
  mkdir (path) {
    const parts = path.split("/");
    let curr_path = "";
    for ( let i = 0; i < parts.length; i++) {
      var p = parts[i];
      curr_path = (curr_path + p) + "/";
      if ( false == (require("fs").existsSync( curr_path )) ) {
        require("fs").mkdirSync( curr_path);
      }
    };
  };
  saveTo (path, verbose) {
    console.log("Saving results to path : " + path);
    for ( let idx = 0; idx < this.files.length; idx++) {
      var file = this.files[idx];
      const file_path = (path + "/") + file.path_name;
      this.mkdir(file_path);
      if ( verbose ) {
        console.log((("Writing to file " + file_path) + "/") + file.name);
      }
      const file_content = file.getCode();
      if ( (file_content.length) > 0 ) {
        require("fs").writeFileSync( file_path + "/"  + file.name.trim(), file_content);
      }
    };
  };
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
  };
}
class CodeWriter  {
  constructor() {
    this.tagName = "";     /** note: unused */
    this.codeStr = "";     /** note: unused */
    this.currentLine = "";
    this.tabStr = "  ";
    this.nlStr = "\n";
    this.lineNumber = 1;     /** note: unused */
    this.indentAmount = 0;
    this.compiledTags = {};
    this.tags = {};
    this.slices = [];
    this.forks = [];
    this.tagOffset = 0;     /** note: unused */
    this.had_nl = true;     /** note: unused */
    const new_slice = new CodeSlice();
    this.slices.push(new_slice);
    this.current_slice = new_slice;
  }
  rewrite (newString) {
    this.slices.length = 0;
    this.forks.length = 0;
    this.currentLine = "";
    const new_slice = new CodeSlice();
    this.slices.push(new_slice);
    new_slice.code = newString;
    this.current_slice = new_slice;
  };
  getFilesystem () {
    if ( typeof(this.ownerFile) === "undefined" ) {
      if ( (typeof(this.parent) !== "undefined" && this.parent != null )  ) {
        return this.parent.getFilesystem();
      }
      return new CodeFileSystem();
    }
    const fs = this.ownerFile.fileSystem;
    return fs;
  };
  getFileWriter (path, fileName) {
    if ( typeof(this.ownerFile) === "undefined" ) {
      if ( (typeof(this.parent) !== "undefined" && this.parent != null )  ) {
        return this.parent.getFileWriter(path, fileName);
      }
    }
    const fs = this.ownerFile.fileSystem;
    const file = fs.getFile(path, fileName);
    const wr = file.getWriter();
    return wr;
  };
  getImports () {
    let p = this;
    while ((typeof(p.ownerFile) === "undefined") && ((typeof(p.parent) !== "undefined" && p.parent != null ) )) {
      p = p.parent;
    };
    if ( (typeof(p.ownerFile) !== "undefined" && p.ownerFile != null )  ) {
      const f = p.ownerFile;
      return f.import_names;
    }
    let nothing = [];
    return nothing;
  };
  addImport (name) {
    if ( (typeof(this.ownerFile) !== "undefined" && this.ownerFile != null )  ) {
      this.ownerFile.addImport(name);
    } else {
      if ( (typeof(this.parent) !== "undefined" && this.parent != null )  ) {
        this.parent.addImport(name);
      }
    }
  };
  indent (delta) {
    this.indentAmount = this.indentAmount + delta;
    if ( this.indentAmount < 0 ) {
      this.indentAmount = 0;
    }
  };
  addIndent () {
    let i = 0;
    if ( 0 == (this.currentLine.length) ) {
      while (i < this.indentAmount) {
        this.currentLine = this.currentLine + this.tabStr;
        i = i + 1;
      };
    }
  };
  createTag (name) {
    const new_writer = new CodeWriter();
    const new_slice = new CodeSlice();
    this.tags[name] = this.slices.length;
    this.slices.push(new_slice);
    new_slice.writer = new_writer;
    new_writer.indentAmount = this.indentAmount;
    const new_active_slice = new CodeSlice();
    this.slices.push(new_active_slice);
    this.current_slice = new_active_slice;
    new_writer.parent = this;
    return new_writer;
  };
  getTag (name) {
    if ( ( typeof(this.tags[name] ) != "undefined" && this.tags.hasOwnProperty(name) ) ) {
      const idx = (this.tags[name]);
      const slice = this.slices[idx];
      return slice.writer;
    } else {
      if ( (typeof(this.parent) !== "undefined" && this.parent != null )  ) {
        return this.parent.getTag(name);
      }
    }
    return this;
  };
  hasTag (name) {
    if ( ( typeof(this.tags[name] ) != "undefined" && this.tags.hasOwnProperty(name) ) ) {
      return true;
    } else {
      if ( (typeof(this.parent) !== "undefined" && this.parent != null )  ) {
        return this.parent.hasTag(name);
      }
    }
    return false;
  };
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
  };
  newline () {
    if ( (this.currentLine.length) > 0 ) {
      this.out("", true);
    }
  };
  line_end (str) {
    if ( (this.currentLine.length) > 0 ) {
      if ( (str.charCodeAt(0)) != (this.currentLine.charCodeAt(((this.currentLine.length) - 1) )) ) {
        this.out(str, false);
      }
    }
  };
  writeSlice (str, newLine) {
    this.addIndent();
    this.currentLine = this.currentLine + str;
    if ( newLine ) {
      this.current_slice.code = (this.current_slice.code + this.currentLine) + this.nlStr;
      this.currentLine = "";
    }
  };
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
      };
    }
  };
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
      };
    }
  };
  getCode () {
    let res = "";
    for ( let idx = 0; idx < this.slices.length; idx++) {
      var slice = this.slices[idx];
      res = res + slice.getCode();
    };
    res = res + this.currentLine;
    return res;
  };
}
CodeWriter.emptyWithFS = function() {
  const wr = new CodeWriter();
  const file = new CodeFile(".", "emptyFile.txt");
  file.writer = wr;
  file.fileSystem = new CodeFileSystem();
  wr.ownerFile = file;
  return wr;
};
class RangerLispParser  {
  constructor(code_module) {
    this.__len = 0;
    this.i = 0;
    this.last_line_start = 0;     /** note: unused */
    this.current_line_index = 0;
    this.parents = [];
    this.paren_cnt = 0;
    this.get_op_pred = 0;     /** note: unused */
    this.had_error = false;
    this.disableOperators = false;
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
  };
  parse_raw_annotation () {
    let sp = this.i;
    let ep = this.i;
    this.i = this.i + 1;
    sp = this.i;
    ep = this.i;
    if ( this.i < this.__len ) {
      const a_node2 = new CodeNode(this.code, sp, ep);
      a_node2.expression = true;
      a_node2.row = this.current_line_index;
      this.curr_node = a_node2;
      this.parents.push(a_node2);
      this.i = this.i + 1;
      this.paren_cnt = this.paren_cnt + 1;
      this.parse(false);
      return a_node2;
    } else {
    }
    return new CodeNode(this.code, sp, ep);
  };
  skip_space (is_block_parent) {
    const s = this.buff;
    let did_break = false;
    if ( this.i >= this.__len ) {
      return true;
    }
    let c = s.charCodeAt(this.i );
    /** unused:  const bb = c == (46)   **/ 
    while ((this.i < this.__len) && (c <= 32)) {
      if ( c < 8 ) {
        this.i = this.__len;
        return true;
      }
      if ( is_block_parent && ((c == 10) || (c == 13)) ) {
        this.end_expression();
        this.current_line_index = this.current_line_index + 1;
        did_break = true;
        break;
      }
      let had_break = false;
      while (((this.i < this.__len) && (c == 10)) || (c == 13)) {
        had_break = true;
        this.i = this.i + 1;
        if ( this.i >= this.__len ) {
          return true;
        }
        c = s.charCodeAt(this.i );
        if ( (c == 10) || (c == 13) ) {
        }
      };
      if ( had_break ) {
        this.current_line_index = this.current_line_index + 1;
      } else {
        this.i = 1 + this.i;
        if ( this.i >= this.__len ) {
          return true;
        }
        c = s.charCodeAt(this.i );
      }
    };
    return did_break;
  };
  end_expression () {
    this.i = 1 + this.i;
    if ( this.i >= this.__len ) {
      return false;
    }
    this.paren_cnt = this.paren_cnt - 1;
    if ( this.paren_cnt < 0 ) {
      console.log("Parser error ) mismatch");
    }
    this.parents.pop();
    if ( (typeof(this.curr_node) !== "undefined" && this.curr_node != null )  ) {
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
  };
  getOperator (disabled) {
    if ( disabled ) {
      return 0;
    }
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
      case 47 : 
        this.i = this.i + 1;
        return 14;
      case 37 : 
        this.i = this.i + 1;
        return 14;
      case 43 : 
        this.i = this.i + 1;
        return 13;
      case 45 : 
        this.i = this.i + 1;
        return 13;
      case 60 : 
        if ( c2 == (61) ) {
          this.i = this.i + 2;
          return 11;
        }
        this.i = this.i + 1;
        return 11;
      case 62 : 
        if ( c2 == (61) ) {
          this.i = this.i + 2;
          return 11;
        }
        this.i = this.i + 1;
        return 11;
      case 33 : 
        if ( c2 == (61) ) {
          this.i = this.i + 2;
          return 10;
        }
        return 0;
      case 61 : 
        if ( c2 == (61) ) {
          this.i = this.i + 2;
          return 10;
        }
        this.i = this.i + 1;
        return 3;
      case 38 : 
        if ( c2 == (38) ) {
          this.i = this.i + 2;
          return 6;
        }
        return 0;
      case 124 : 
        if ( c2 == (124) ) {
          this.i = this.i + 2;
          return 5;
        }
        return 0;
      default: 
        break;
    };
    return 0;
  };
  isOperator (disabled) {
    if ( disabled ) {
      return 0;
    }
    const s = this.buff;
    if ( (this.i - 2) > this.__len ) {
      return 0;
    }
    const c = s.charCodeAt(this.i );
    const c2 = s.charCodeAt((this.i + 1) );
    switch (c ) { 
      case 42 : 
        return 1;
      case 47 : 
        return 14;
      case 43 : 
        return 13;
      case 37 : 
        return 14;
      case 45 : 
        return 13;
      case 60 : 
        if ( c2 == (61) ) {
          return 11;
        }
        return 11;
      case 62 : 
        if ( c2 == (61) ) {
          return 11;
        }
        return 11;
      case 33 : 
        if ( c2 == (61) ) {
          return 10;
        }
        return 0;
      case 61 : 
        if ( c2 == (61) ) {
          return 10;
        }
        return 3;
      case 38 : 
        if ( c2 == (38) ) {
          return 6;
        }
        return 0;
      case 124 : 
        if ( c2 == (124) ) {
          return 5;
        }
        return 0;
      default: 
        break;
    };
    return 0;
  };
  getOperatorPred (str, disabled) {
    if ( disabled ) {
      return 0;
    }
    switch (str ) { 
      case "<" : 
        return 11;
      case ">" : 
        return 11;
      case "<=" : 
        return 11;
      case ">=" : 
        return 11;
      case "==" : 
        return 10;
      case "!=" : 
        return 10;
      case "=" : 
        return 3;
      case "&&" : 
        return 6;
      case "||" : 
        return 5;
      case "+" : 
        return 13;
      case "-" : 
        return 13;
      case "%" : 
        return 14;
      case "*" : 
        return 14;
      case "/" : 
        return 14;
      default: 
        break;
    };
    return 0;
  };
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
  };
  parse_attributes () {
    const s = this.buff;
    let last_i = 0;
    const do_break = false;
    /** unused:  const attr_name = ""   **/ 
    let sp = this.i;
    let ep = this.i;
    let c = 0;
    let cc1 = 0;
    let cc2 = 0;
    cc1 = s.charCodeAt(this.i );
    while (this.i < this.__len) {
      last_i = this.i;
      while ((this.i < this.__len) && ((s.charCodeAt(this.i )) <= 32)) {
        this.i = 1 + this.i;
      };
      cc1 = s.charCodeAt(this.i );
      cc2 = s.charCodeAt((this.i + 1) );
      if ( this.i >= this.__len ) {
        break;
      }
      if ( cc1 == (62) ) {
        return do_break;
      }
      if ( (cc1 == (47)) && (cc2 == (62)) ) {
        this.i = 2 + this.i;
        return true;
      }
      sp = this.i;
      ep = this.i;
      c = s.charCodeAt(this.i );
      while ((this.i < this.__len) && ((((((c >= 65) && (c <= 90)) || ((c >= 97) && (c <= 122))) || ((c >= 48) && (c <= 57))) || (c == (95))) || (c == (45)))) {
        this.i = 1 + this.i;
        c = s.charCodeAt(this.i );
      };
      this.i = this.i - 1;
      const an_sp = sp;
      const an_ep = this.i;
      c = s.charCodeAt(this.i );
      while ((this.i < this.__len) && (c != (61))) {
        this.i = 1 + this.i;
        c = s.charCodeAt(this.i );
      };
      if ( c == (61) ) {
        this.i = 1 + this.i;
      }
      while ((this.i < this.__len) && ((s.charCodeAt(this.i )) <= 32)) {
        this.i = 1 + this.i;
      };
      if ( this.i >= this.__len ) {
        break;
      }
      c = s.charCodeAt(this.i );
      if ( c == (123) ) {
        const cNode = this.curr_node;
        const new_attr = new CodeNode(this.code, sp, ep);
        new_attr.value_type = 21;
        new_attr.parsed_type = new_attr.value_type;
        new_attr.vref = s.substring(an_sp, (an_ep + 1) );
        new_attr.string_value = s.substring(sp, ep );
        this.curr_node.attrs.push(new_attr);
        this.curr_node = new_attr;
        this.paren_cnt = this.paren_cnt + 1;
        const new_qnode = new CodeNode(this.code, this.i, this.i);
        new_qnode.expression = true;
        this.insert_node(new_qnode);
        this.parents.push(new_qnode);
        this.curr_node = new_qnode;
        this.i = 1 + this.i;
        this.parse(false);
        this.curr_node = cNode;
        continue;
      }
      if ( (c == 34) || (c == (39)) ) {
        this.i = this.i + 1;
        sp = this.i;
        ep = this.i;
        c = s.charCodeAt(this.i );
        while (((this.i < this.__len) && (c != 34)) && (c != (39))) {
          this.i = 1 + this.i;
          c = s.charCodeAt(this.i );
        };
        ep = this.i;
        if ( (this.i < this.__len) && (ep > sp) ) {
          const new_attr_1 = new CodeNode(this.code, sp, ep);
          new_attr_1.value_type = 21;
          new_attr_1.parsed_type = new_attr_1.value_type;
          new_attr_1.vref = s.substring(an_sp, (an_ep + 1) );
          new_attr_1.string_value = s.substring(sp, ep );
          this.curr_node.attrs.push(new_attr_1);
        }
        this.i = 1 + this.i;
      }
      if ( last_i == this.i ) {
        this.i = 1 + this.i;
      }
    };
    return do_break;
  };
  parseXML () {
    const s = this.buff;
    let c = 0;
    /** unused:  const next_c = 0   **/ 
    /** unused:  const fc = 0   **/ 
    /** unused:  let new_node   **/ 
    let sp = this.i;
    let ep = this.i;
    let last_i = 0;
    let cc1 = 0;
    let cc2 = 0;
    let tag_depth = 0;
    while (this.i < this.__len) {
      last_i = this.i;
      if ( this.i >= (this.__len - 1) ) {
        break;
      }
      cc1 = s.charCodeAt(this.i );
      cc2 = s.charCodeAt((this.i + 1) );
      if ( cc1 == (123) ) {
        const cNode = this.curr_node;
        this.paren_cnt = this.paren_cnt + 1;
        const new_qnode = new CodeNode(this.code, this.i, this.i);
        new_qnode.expression = true;
        this.insert_node(new_qnode);
        this.parents.push(new_qnode);
        this.curr_node = new_qnode;
        this.i = 1 + this.i;
        this.parse(false);
        this.curr_node = cNode;
        continue;
      }
      if ( cc1 == (62) ) {
        this.i = this.i + 1;
        cc1 = s.charCodeAt(this.i );
        cc2 = s.charCodeAt((this.i + 1) );
        continue;
      }
      if ( ((47) == cc1) && (cc2 == (62)) ) {
        tag_depth = tag_depth - 1;
        this.i = this.i + 2;
        if ( tag_depth <= 0 ) {
          this.parents.pop();
          const p_cnt = this.parents.length;
          const last_parent = this.parents[(p_cnt - 1)];
          this.curr_node = last_parent;
          return;
        }
        continue;
      }
      if ( this.i >= this.__len ) {
        break;
      }
      if ( ((60) == cc1) && (cc2 == (47)) ) {
        tag_depth = tag_depth - 1;
        this.i = this.i + 2;
        sp = this.i;
        ep = this.i;
        c = s.charCodeAt(this.i );
        while (((this.i < this.__len) && (c > 32)) && (c != (62))) {
          this.i = 1 + this.i;
          c = s.charCodeAt(this.i );
        };
        ep = this.i;
        this.parents.pop();
        const p_cnt_1 = this.parents.length;
        const last_parent_1 = this.parents[(p_cnt_1 - 1)];
        this.curr_node = last_parent_1;
        if ( tag_depth <= 0 ) {
          return;
        }
        continue;
      }
      if ( cc1 == (60) ) {
        this.i = this.i + 1;
        sp = this.i;
        ep = this.i;
        c = s.charCodeAt(this.i );
        while (((this.i < this.__len) && (c != (62))) && (((((((c >= 65) && (c <= 90)) || ((c >= 97) && (c <= 122))) || ((c >= 48) && (c <= 57))) || (c == 95)) || (c == 46)) || (c == 64))) {
          this.i = 1 + this.i;
          c = s.charCodeAt(this.i );
        };
        tag_depth = tag_depth + 1;
        ep = this.i;
        const new_tag = s.substring(sp, ep );
        if ( typeof(this.curr_node) === "undefined" ) {
          const new_rnode = new CodeNode(this.code, sp, ep);
          new_rnode.vref = new_tag;
          new_rnode.value_type = 19;
          new_rnode.parsed_type = new_rnode.value_type;
          this.rootNode = new_rnode;
          this.parents.push(new_rnode);
          this.curr_node = new_rnode;
        } else {
          const new_node_2 = new CodeNode(this.code, sp, ep);
          new_node_2.vref = new_tag;
          new_node_2.value_type = 19;
          new_node_2.parsed_type = new_node_2.value_type;
          this.curr_node.children.push(new_node_2);
          new_node_2.parent = this.curr_node;
          this.parents.push(new_node_2);
          this.curr_node = new_node_2;
        }
        if ( this.parse_attributes() ) {
          this.parents.pop();
          const p_cnt_2 = this.parents.length;
          const last_parent_2 = this.parents[(p_cnt_2 - 1)];
          this.curr_node = last_parent_2;
          tag_depth = tag_depth - 1;
          if ( tag_depth <= 0 ) {
            return;
          }
          continue;
        }
        continue;
      }
      if ( (typeof(this.curr_node) !== "undefined" && this.curr_node != null )  ) {
        sp = this.i;
        ep = this.i;
        c = s.charCodeAt(this.i );
        while (((this.i < this.__len) && (c != (60))) && (c != (123))) {
          this.i = 1 + this.i;
          c = s.charCodeAt(this.i );
        };
        ep = this.i;
        if ( ep > sp ) {
          const new_node_3 = new CodeNode(this.code, sp, ep);
          new_node_3.string_value = s.substring(sp, ep );
          new_node_3.value_type = 20;
          new_node_3.parsed_type = new_node_3.value_type;
          this.curr_node.children.push(new_node_3);
          new_node_3.parent = this.curr_node;
        }
      }
      if ( last_i == this.i ) {
        this.i = 1 + this.i;
      }
    };
  };
  parse (disable_ops) {
    const s = this.buff;
    let c = s.charCodeAt(0 );
    /** unused:  const next_c = 0   **/ 
    let fc = 0;
    let new_node;
    let sp = 0;
    let ep = 0;
    let last_i = 0;
    let had_lf = false;
    let disable_ops_set = disable_ops;
    while (this.i < this.__len) {
      if ( (typeof(this.curr_node) !== "undefined" && this.curr_node != null )  ) {
        if ( this.curr_node.value_type == 21 ) {
          return;
        }
        if ( this.curr_node.value_type == 19 ) {
          return;
        }
      }
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
      if ( (typeof(this.curr_node) !== "undefined" && this.curr_node != null )  ) {
        if ( (typeof(this.curr_node.parent) !== "undefined" && this.curr_node.parent != null )  ) {
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
        if ( (60) == c ) {
          if ( (this.i + 1) < this.__len ) {
            const next_c_2 = s.charCodeAt((this.i + 1) );
            if ( ((65) < next_c_2) && ((122) > next_c_2) ) {
              /** unused:  const spos = this.i   **/ 
              this.parseXML();
              this.i = this.i + 1;
              continue;
            }
          }
          if ( this.i > 0 ) {
            const prev_c = s.charCodeAt((this.i - 1) );
            if ( (62) == prev_c ) {
            }
          }
        }
        if ( c == 59 ) {
          sp = this.i + 1;
          while ((this.i < this.__len) && ((s.charCodeAt(this.i )) > 31)) {
            this.i = 1 + this.i;
          };
          if ( this.i >= this.__len ) {
            break;
          }
          new_node = new CodeNode(this.code, sp, this.i);
          new_node.parsed_type = 12;
          new_node.value_type = 12;
          new_node.string_value = s.substring(sp, this.i );
          this.curr_node.comments.push(new_node);
          continue;
        }
        if ( this.i < (this.__len - 1) ) {
          fc = s.charCodeAt((this.i + 1) );
          if ( (c == 40) || (c == (123)) ) {
            this.paren_cnt = this.paren_cnt + 1;
            if ( typeof(this.curr_node) === "undefined" ) {
              this.rootNode = new CodeNode(this.code, this.i, this.i);
              this.curr_node = this.rootNode;
              this.curr_node.expression = true;
              this.parents.push(this.curr_node);
            } else {
              const new_qnode = new CodeNode(this.code, this.i, this.i);
              new_qnode.expression = true;
              this.insert_node(new_qnode);
              this.parents.push(new_qnode);
              this.curr_node = new_qnode;
            }
            if ( c == (123) ) {
              this.curr_node.is_block_node = true;
            }
            this.i = 1 + this.i;
            this.parse(disable_ops_set);
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
          };
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
        const str_limit = fc;
        const b_had_str = ((fc == 34) || (fc == 96)) || (fc == 39);
        if ( b_had_str ) {
          sp = this.i + 1;
          ep = sp;
          c = s.charCodeAt(this.i );
          let must_encode = false;
          while (this.i < this.__len) {
            this.i = 1 + this.i;
            c = s.charCodeAt(this.i );
            if ( c == str_limit ) {
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
          };
          ep = this.i;
          if ( this.i < this.__len ) {
            let encoded_str = "";
            if ( must_encode ) {
              const subs = s.substring(sp, ep );
              const orig_str = subs;
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
                  };
                  ii = ii + 2;
                } else {
                  encoded_str = encoded_str + (orig_str.substring(ii, (1 + ii) ));
                  ii = ii + 1;
                }
              };
            } else {
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
          };
          ep = this.i;
          if ( (this.i < this.__len) && (ep > sp) ) {
            const a_node2 = new CodeNode(this.code, sp, ep);
            const a_name = s.substring(sp, ep );
            if ( a_name == "noinfix" ) {
              disable_ops_set = true;
            }
            a_node2.expression = true;
            this.curr_node = a_node2;
            this.parents.push(a_node2);
            this.i = this.i + 1;
            this.paren_cnt = this.paren_cnt + 1;
            this.parse(disable_ops_set);
            let use_first = false;
            if ( 1 == (a_node2.children.length) ) {
              const ch1 = a_node2.children[0];
              use_first = ch1.isPrimitive();
            }
            if ( use_first ) {
              const theNode = a_node2.children.splice(0, 1).pop();
              this.curr_node.props[a_name] = theNode;
            } else {
              this.curr_node.props[a_name] = a_node2;
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
            this.parse(disable_ops_set);
            continue;
          }
        }
        let op_c = 0;
        op_c = this.getOperator(disable_ops_set);
        let last_was_newline = false;
        if ( op_c > 0 ) {
        } else {
          while ((((((this.i < this.__len) && ((s.charCodeAt(this.i )) > 32)) && (c != 58)) && (c != 40)) && (c != 41)) && (c != (125))) {
            if ( this.i > sp ) {
              const is_opchar = this.isOperator(disable_ops_set);
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
          };
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
        };
        if ( (false == disable_ops_set) && (c == (58)) ) {
          this.i = this.i + 1;
          while ((this.i < this.__len) && ((s.charCodeAt(this.i )) <= 32)) {
            this.i = 1 + this.i;
          };
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
            new_expr_node_1.parsed_type = 17;
            new_expr_node_1.value_type = 17;
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
            };
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
                console.log("--> parsed ARRAY TYPE annotation");
              }
              this.i = 1 + this.i;
              continue;
            }
          }
          let had_type_ann = false;
          while ((this.i < this.__len) && operatorsOfchar_23.isc95notc95limiter_24(c)) {
            this.i = 1 + this.i;
            c = s.charCodeAt(this.i );
            if ( c == (64) ) {
              had_type_ann = true;
              break;
            }
          };
          if ( this.i < this.__len ) {
            vt_ep = this.i;
            /** unused:  const type_name_2 = s.substring(vt_sp, vt_ep )   **/ 
            const new_ref_node = new CodeNode(this.code, sp, ep);
            new_ref_node.vref = s.substring(sp, ep );
            new_ref_node.ns = ns_list;
            new_ref_node.parsed_type = 11;
            new_ref_node.value_type = 11;
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
            new_vref_node.parsed_type = 11;
            new_vref_node.value_type = 11;
            new_vref_node.ns = ns_list;
            new_vref_node.parent = this.curr_node;
            const op_pred = this.getOperatorPred(new_vref_node.vref, disable_ops_set);
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
                  this.curr_node.parsed_type = this.curr_node.value_type;
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
                  };
                  for ( let i2 = 0; i2 < keep_nodes.children.length; i2++) {
                    var keep = keep_nodes.children[i2];
                    this.curr_node.children.push(keep);
                  };
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
                    };
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
          if ( (typeof(this.curr_node) !== "undefined" && this.curr_node != null )  ) {
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
    };
  };
}
class RangerArgMatch  {
  constructor() {
    this._debug = false;
    this.matched = {};
    this.nodes = {};
    this.builtNodes = {};
    this.matchedLambdas = {};
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
      if ( callArg.is_part_of_chain ) {
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
      if ( arg.hasFlag("keyword") ) {
        if ( callArg.vref == arg.vref ) {
          continue;
        } else {
          all_matched = false;
          break;
        }
      }
      if ( arg.isPrimitiveType() ) {
        if ( (callArg.value_type == 17) || (callArg.eval_type == 17) ) {
          all_matched = false;
          break;
        }
      }
      let call_arg_immutable = false;
      if ( callArg.hasParamDesc ) {
        const pa = callArg.paramDesc;
        if ( (typeof(pa.nameNode) !== "undefined" && pa.nameNode != null )  ) {
          const b_immutable = pa.nameNode.hasFlag("immutable");
          if ( arg.hasFlag("immutable") != b_immutable ) {
            all_matched = false;
          }
          call_arg_immutable = b_immutable;
        } else {
          call_arg_immutable = pa.is_immutable;
        }
      }
      if ( callArg.hasFlag("immutable") ) {
        call_arg_immutable = true;
      }
      if ( arg.hasFlag("immutable") ) {
        if ( false == call_arg_immutable ) {
          all_matched = false;
          break;
        }
      }
      if ( true ) {
        if ( (arg.type_name == "block") || arg.hasFlag("block") ) {
          if ( callArg.is_block_node ) {
            continue;
          } else {
            all_matched = false;
          }
        }
      }
      if ( arg.hasFlag("mutable") ) {
        if ( callArg.hasParamDesc ) {
          const pa_1 = callArg.paramDesc;
          const b = pa_1.nameNode.hasFlag("mutable");
          if ( b == false ) {
            missed_args.push("was mutable");
            all_matched = false;
          }
        } else {
          all_matched = false;
        }
      }
      if ( arg.hasFlag("union") ) {
        if ( ctx.isDefinedClass(callArg.eval_type_name) ) {
          const cc = ctx.findClass(callArg.eval_type_name);
          if ( (cc.is_union == false) && (cc.is_system_union == false) ) {
            all_matched = false;
          }
        } else {
          all_matched = false;
        }
      }
      if ( arg.hasFlag("optional") ) {
        if ( callArg.hasParamDesc ) {
          const pa_2 = callArg.paramDesc;
          const b_1 = pa_2.nameNode.hasFlag("optional");
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
          if ( callArg.is_block_node ) {
          } else {
            all_matched = false;
          }
        }
      }
      if ( (arg.value_type != 7) && (arg.value_type != 6) ) {
        if ( (typeof(callArg.paramDesc) !== "undefined" && callArg.paramDesc != null )  ) {
          if ( ((typeof(callArg.paramDesc.nameNode) !== "undefined" && callArg.paramDesc.nameNode != null ) ) && ((typeof(callArg.paramDesc.nameNode.expression_value) !== "undefined" && callArg.paramDesc.nameNode.expression_value != null ) ) ) {
            this.matched[arg.type_name] = "";
            this.matchedLambdas[arg.type_name] = callArg.paramDesc.nameNode.expression_value;
            continue;
          }
        }
        if ( callArg.eval_type == 13 ) {
          if ( arg.type_name == "enum" ) {
            continue;
          }
        }
        if ( this._debug ) {
          console.log("-> trying to add type " + arg.type_name);
        }
        if ( false == this.add(arg.type_name, callArg.eval_type_name, ctx) ) {
          all_matched = false;
          return all_matched;
        }
      }
      if ( arg.value_type == 6 ) {
        if ( false == this.add_atype(arg.array_type, callArg.eval_array_type, ctx) ) {
          all_matched = false;
        }
      }
      if ( arg.value_type == 7 ) {
        if ( false == this.add(arg.key_type, callArg.eval_key_type, ctx) ) {
          all_matched = false;
        }
        if ( false == this.add_atype(arg.array_type, callArg.eval_array_type, ctx) ) {
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
    };
    return all_matched;
  };
  force_add (tplKeyword, typeName, ctx) {
    this.matched[tplKeyword] = typeName;
  };
  addNode (name, node) {
    this.nodes[name] = node;
  };
  add (tplKeyword, typeName, ctx) {
    switch (tplKeyword ) { 
      case "string" : 
        return true;
      case "int" : 
        return true;
      case "double" : 
        return true;
      case "boolean" : 
        return true;
      case "enum" : 
        return true;
      case "char" : 
        return true;
      case "charbuffer" : 
        return true;
    };
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
    this.matched[tplKeyword] = typeName;
    return true;
  };
  add_atype (tplKeyword, typeName, ctx) {
    switch (tplKeyword ) { 
      case "string" : 
        return true;
      case "int" : 
        return true;
      case "double" : 
        return true;
      case "boolean" : 
        return true;
      case "enum" : 
        return true;
      case "char" : 
        return true;
      case "charbuffer" : 
        return true;
    };
    if ( (tplKeyword.length) > 1 ) {
      return true;
    }
    if ( ( typeof(this.matched[tplKeyword] ) != "undefined" && this.matched.hasOwnProperty(tplKeyword) ) ) {
      const s = (this.matched[tplKeyword]);
      if ( this.areEqualATypes(s, typeName, ctx) ) {
        return true;
      }
      if ( s == typeName ) {
        return true;
      } else {
        return false;
      }
    }
    this.matched[tplKeyword] = typeName;
    return true;
  };
  doesDefsMatch (arg, node, ctx) {
    if ( node.value_type == 13 ) {
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
        case "block" : 
          return node.expression;
        case "arguments" : 
          return node.expression;
        case "keyword" : 
          return node.eval_type == 11;
        case "T.name" : 
          return node.eval_type_name == t_name;
      };
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
  };
  doesMatch (arg, node, ctx) {
    if ( node.value_type == 13 ) {
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
        case "block" : 
          return node.expression;
        case "arguments" : 
          return node.expression;
        case "keyword" : 
          return node.eval_type == 11;
        case "T.name" : 
          return node.eval_type_name == t_name;
      };
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
  };
  areEqualTypes (type1, type2, ctx) {
    let t_name = type1;
    if ( ( typeof(this.matched[type1] ) != "undefined" && this.matched.hasOwnProperty(type1) ) ) {
      t_name = (this.matched[type1]);
    }
    switch (t_name ) { 
      case "string" : 
        return type2 == "string";
      case "int" : 
        return type2 == "int";
      case "double" : 
        return type2 == "double";
      case "boolean" : 
        return type2 == "boolean";
      case "enum" : 
        return type2 == "enum";
      case "char" : 
        return type2 == "char";
      case "charbuffer" : 
        return type2 == "charbuffer";
    };
    if ( ctx.isDefinedClass(t_name) && ctx.isDefinedClass(type2) ) {
      const c1 = ctx.findClass(t_name);
      const c2 = ctx.findClass(type2);
      const trait1 = c1.hasTrait(type2, ctx);
      if ( (c2.is_union == true) && (c1.is_union == false) ) {
        return false;
      }
      if ( (c2.is_system_union == true) && (c1.is_system_union == false) ) {
        return false;
      }
      if ( (typeof(trait1) !== "undefined" && trait1 != null )  ) {
        this.force_add(type2, c1.name, ctx);
        if ( ( typeof(c1.trait_params[type2] ) != "undefined" && c1.trait_params.hasOwnProperty(type2) ) ) {
          const pms = (c1.trait_params[type2]);
          for ( let i = 0; i < pms.param_names.length; i++) {
            var pn = pms.param_names[i];
            const pn_value = (pms.values[pn]);
            this.add(pn, pn_value, ctx);
          };
        }
      }
      const trait1_1 = c2.hasTrait(t_name, ctx);
      if ( (typeof(trait1_1) !== "undefined" && trait1_1 != null )  ) {
        this.force_add(t_name, c2.name, ctx);
        if ( ( typeof(c2.trait_params[t_name] ) != "undefined" && c2.trait_params.hasOwnProperty(t_name) ) ) {
          const pms_1 = (c2.trait_params[t_name]);
          for ( let i_1 = 0; i_1 < pms_1.param_names.length; i_1++) {
            var pn_1 = pms_1.param_names[i_1];
            const pn_value_1 = (pms_1.values[pn_1]);
            this.add(pn_1, pn_value_1, ctx);
          };
        } else {
        }
      }
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
  };
  areEqualATypes (type1, type2, ctx) {
    let t_name = type1;
    if ( ( typeof(this.matched[type1] ) != "undefined" && this.matched.hasOwnProperty(type1) ) ) {
      t_name = (this.matched[type1]);
    }
    switch (t_name ) { 
      case "string" : 
        return type2 == "string";
      case "int" : 
        return type2 == "int";
      case "double" : 
        return type2 == "double";
      case "boolean" : 
        return type2 == "boolean";
      case "enum" : 
        return type2 == "enum";
      case "char" : 
        return type2 == "char";
      case "charbuffer" : 
        return type2 == "charbuffer";
    };
    if ( ctx.isDefinedClass(t_name) && ctx.isDefinedClass(type2) ) {
      const c1 = ctx.findClass(t_name);
      const c2 = ctx.findClass(type2);
      const trait1 = c1.hasTrait(type2, ctx);
      if ( (c2.is_union == true) && (c1.is_union == false) ) {
        return false;
      }
      if ( (c2.is_system_union == true) && (c1.is_system_union == false) ) {
        return false;
      }
      if ( (typeof(trait1) !== "undefined" && trait1 != null )  ) {
        this.force_add(type2, c1.name, ctx);
        if ( ( typeof(c1.trait_params[type2] ) != "undefined" && c1.trait_params.hasOwnProperty(type2) ) ) {
          const pms = (c1.trait_params[type2]);
          for ( let i = 0; i < pms.param_names.length; i++) {
            var pn = pms.param_names[i];
            const pn_value = (pms.values[pn]);
            this.add(pn, pn_value, ctx);
          };
        }
      }
      const trait1_1 = c2.hasTrait(t_name, ctx);
      if ( (typeof(trait1_1) !== "undefined" && trait1_1 != null )  ) {
        this.force_add(t_name, c2.name, ctx);
        if ( ( typeof(c2.trait_params[t_name] ) != "undefined" && c2.trait_params.hasOwnProperty(t_name) ) ) {
          const pms_1 = (c2.trait_params[t_name]);
          for ( let i_1 = 0; i_1 < pms_1.param_names.length; i_1++) {
            var pn_1 = pms_1.param_names[i_1];
            const pn_value_1 = (pms_1.values[pn_1]);
            this.add(pn_1, pn_value_1, ctx);
          };
        } else {
        }
      }
      if ( c1.isSameOrParentClass(type2, ctx) ) {
        return true;
      }
      if ( c2.isSameOrParentClass(t_name, ctx) ) {
        return true;
      }
    } else {
    }
    return t_name == type2;
  };
  getTypeName (n) {
    let t_name = n;
    if ( ( typeof(this.matched[t_name] ) != "undefined" && this.matched.hasOwnProperty(t_name) ) ) {
      t_name = (this.matched[t_name]);
    }
    if ( 0 == (t_name.length) ) {
      return "";
    }
    return t_name;
  };
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
        return 16;
      case "block" : 
        return 16;
      case "arguments" : 
        return 16;
      case "string" : 
        return 4;
      case "int" : 
        return 3;
      case "char" : 
        return 14;
      case "charbuffer" : 
        return 15;
      case "boolean" : 
        return 5;
      case "double" : 
        return 2;
      case "enum" : 
        return 13;
    };
    return 10;
  };
  setRvBasedOn (arg, node) {
    if ( arg.hasFlag("optional") ) {
      node.setFlag("optional");
    }
    if ( arg.hasFlag("immutable") ) {
      node.setFlag("immutable");
    }
    if ( (arg.value_type != 7) && (arg.value_type != 6) ) {
      if ( ( typeof(this.matchedLambdas[arg.type_name] ) != "undefined" && this.matchedLambdas.hasOwnProperty(arg.type_name) ) ) {
        const lam = this.matchedLambdas[arg.type_name];
        node.eval_type = 17;
        node.expression_value = lam.copy();
        return true;
      }
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
  };
}
class DictNode  {
  constructor() {
    this.is_property = false;
    this.is_property_value = false;
    this.vref = "";
    this.value_type = 6;
    this.double_value = 0.0;
    this.int_value = 0;
    this.string_value = "";
    this.boolean_value = false;
    this.children = [];
    this.objects = {};
    this.dict_keys = [];
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
      };
      ii = 1 + ii;
    };
    return encoded_str;
  };
  addString (key, value) {
    if ( this.value_type == 6 ) {
      const v = new DictNode();
      v.string_value = value;
      v.value_type = 3;
      v.vref = key;
      v.is_property = true;
      this.dict_keys.push(key);
      this.objects[key] = v;
    }
  };
  addDouble (key, value) {
    if ( this.value_type == 6 ) {
      const v = new DictNode();
      v.double_value = value;
      v.value_type = 1;
      v.vref = key;
      v.is_property = true;
      this.dict_keys.push(key);
      this.objects[key] = v;
    }
  };
  addInt (key, value) {
    if ( this.value_type == 6 ) {
      const v = new DictNode();
      v.int_value = value;
      v.value_type = 2;
      v.vref = key;
      v.is_property = true;
      this.dict_keys.push(key);
      this.objects[key] = v;
    }
  };
  addBoolean (key, value) {
    if ( this.value_type == 6 ) {
      const v = new DictNode();
      v.boolean_value = value;
      v.value_type = 4;
      v.vref = key;
      v.is_property = true;
      this.dict_keys.push(key);
      this.objects[key] = v;
    }
  };
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
      this.dict_keys.push(key);
      this.objects[key] = p;
      return v;
    }
    return v;
  };
  setObject (key, value) {
    if ( this.value_type == 6 ) {
      const p = new DictNode();
      p.value_type = 6;
      p.vref = key;
      p.is_property = true;
      value.is_property_value = true;
      value.vref = key;
      p.object_value = value;
      this.dict_keys.push(key);
      this.objects[key] = p;
    }
  };
  addArray (key) {
    let v;
    if ( this.value_type == 6 ) {
      v = new DictNode();
      v.value_type = 5;
      v.vref = key;
      v.is_property = true;
      this.dict_keys.push(key);
      this.objects[key] = v;
      return v;
    }
    return v;
  };
  push (obj) {
    if ( this.value_type == 5 ) {
      this.children.push(obj);
    }
  };
  getDoubleAt (index) {
    if ( index < (this.children.length) ) {
      const k = this.children[index];
      return k.double_value;
    }
    return 0.0;
  };
  getStringAt (index) {
    if ( index < (this.children.length) ) {
      const k = this.children[index];
      return k.string_value;
    }
    return "";
  };
  getIntAt (index) {
    if ( index < (this.children.length) ) {
      const k = this.children[index];
      return k.int_value;
    }
    return 0;
  };
  getBooleanAt (index) {
    if ( index < (this.children.length) ) {
      const k = this.children[index];
      return k.boolean_value;
    }
    return false;
  };
  getString (key) {
    let res;
    if ( ( typeof(this.objects[key] ) != "undefined" && this.objects.hasOwnProperty(key) ) ) {
      const k = this.objects[key];
      res = k.string_value;
    }
    return res;
  };
  getDouble (key) {
    let res;
    if ( ( typeof(this.objects[key] ) != "undefined" && this.objects.hasOwnProperty(key) ) ) {
      const k = this.objects[key];
      res = k.double_value;
    }
    return res;
  };
  getInt (key) {
    let res;
    if ( ( typeof(this.objects[key] ) != "undefined" && this.objects.hasOwnProperty(key) ) ) {
      const k = this.objects[key];
      res = k.int_value;
    }
    return res;
  };
  getBoolean (key) {
    let res;
    if ( ( typeof(this.objects[key] ) != "undefined" && this.objects.hasOwnProperty(key) ) ) {
      const k = this.objects[key];
      res = k.boolean_value;
    }
    return res;
  };
  getArray (key) {
    let res;
    if ( ( typeof(this.objects[key] ) != "undefined" && this.objects.hasOwnProperty(key) ) ) {
      const obj = this.objects[key];
      if ( obj.is_property ) {
        res = obj.object_value;
      }
    }
    return res;
  };
  getArrayAt (index) {
    let res;
    if ( index < (this.children.length) ) {
      res = this.children[index];
    }
    return res;
  };
  getObject (key) {
    let res;
    if ( ( typeof(this.objects[key] ) != "undefined" && this.objects.hasOwnProperty(key) ) ) {
      const obj = this.objects[key];
      if ( obj.is_property ) {
        res = obj.object_value;
      }
    }
    return res;
  };
  getObjectAt (index) {
    let res;
    if ( index < (this.children.length) ) {
      res = this.children[index];
    }
    return res;
  };
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
      };
      str = str + "]";
      return str;
    }
    if ( this.value_type == 6 ) {
      let str_1 = "";
      if ( this.is_property ) {
        return ((("\"" + this.vref) + "\"") + ":") + this.object_value.stringify();
      } else {
        str_1 = "{";
        for ( let i_1 = 0; i_1 < this.dict_keys.length; i_1++) {
          var key = this.dict_keys[i_1];
          if ( i_1 > 0 ) {
            str_1 = str_1 + ",";
          }
          const item_1 = this.objects[key];
          str_1 = str_1 + item_1.stringify();
        };
        str_1 = str_1 + "}";
        return str_1;
      }
    }
    return "";
  };
}
DictNode.createEmptyObject = function() {
  const v = new DictNode();
  v.value_type = 6;
  return v;
};
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
  };
  createWRWriter (pvar, nn, ctx, wr) {
    wr.out("def key@(lives):DictNode (new DictNode())", true);
    wr.out(("key.addString(\"n\" \"" + pvar.name) + "\")", true);
    if ( nn.value_type == 6 ) {
      if ( this.isSerializedClass(nn.array_type, ctx) ) {
        wr.out(("def values:DictNode (obj_keys.addArray(\"" + pvar.compiledName) + "\"))", true);
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
        wr.out(("def values:DictNode (obj_keys.addObject(\"" + pvar.compiledName) + "\"))", true);
        wr.out(("for this." + pvar.compiledName) + " keyname {", true);
        wr.indent(1);
        wr.out(("def item:DictNode (unwrap (get this." + pvar.compiledName) + " keyname))", true);
        wr.out("def obj@(lives):DictNode (item.serializeToDict())", true);
        wr.out("values.setObject( obj )", true);
        wr.indent(-1);
        wr.out("}", true);
      }
      if ( nn.key_type == "string" ) {
        wr.out(("def values:DictNode (obj_keys.addObject(\"" + pvar.compiledName) + "\"))", true);
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
        if ( nn.value_type == 13 ) {
          wr.out(("values.addInt(keyname (unwrap (get this." + pvar.compiledName) + " keyname)))", true);
        }
        wr.indent(-1);
        wr.out("}", true);
        return;
      }
      return;
    }
    if ( nn.type_name == "string" ) {
      wr.out(((("obj_keys.addString(\"" + pvar.compiledName) + "\" (this.") + pvar.compiledName) + "))", true);
      return;
    }
    if ( nn.type_name == "double" ) {
      wr.out(((("obj_keys.addDouble(\"" + pvar.compiledName) + "\" (this.") + pvar.compiledName) + "))", true);
      return;
    }
    if ( nn.type_name == "int" ) {
      wr.out(((("obj_keys.addInt(\"" + pvar.compiledName) + "\" (this.") + pvar.compiledName) + "))", true);
      return;
    }
    if ( nn.type_name == "boolean" ) {
      wr.out(((("obj_keys.addBoolean(\"" + pvar.compiledName) + "\" (this.") + pvar.compiledName) + "))", true);
      return;
    }
    if ( nn.value_type == 13 ) {
      wr.out(((("obj_keys.addInt(\"" + pvar.compiledName) + "\" (this.") + pvar.compiledName) + "))", true);
      return;
    }
    if ( this.isSerializedClass(nn.type_name, ctx) ) {
      wr.out(("def value@(lives):DictNode (this." + pvar.compiledName) + ".serializeToDict())", true);
      wr.out(("obj_keys.setObject(\"" + pvar.compiledName) + "\" value)", true);
    }
  };
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
    wr.out("def obj_keys:DictNode (res.addObject(\"data\"))", true);
    if ( (cl.extends_classes.length) > 0 ) {
      for ( let i = 0; i < cl.extends_classes.length; i++) {
        var pName = cl.extends_classes[i];
        const pC = ctx.findClass(pName);
        for ( let i_1 = 0; i_1 < pC.variables.length; i_1++) {
          var pvar = pC.variables[i_1];
          declaredVariable[pvar.name] = true;
          const nn = pvar.nameNode;
          if ( nn.isPrimitive() ) {
            wr.out("; extended ", true);
            wr.out("def key@(lives):DictNode (new DictNode())", true);
            wr.out(("key.addString(\"n\" \"" + pvar.name) + "\")", true);
            wr.out(("key.addString(\"t\" \"" + pvar.value_type) + "\")", true);
            wr.out("obj_keys.push(key)", true);
          }
        };
      };
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
    };
    wr.out("return res", true);
    wr.indent(-1);
    wr.out("}", true);
    wr.indent(-1);
    wr.out("}", true);
  };
  createWRWriter2 (pvar, nn, ctx, wr) {
    if ( nn.value_type == 6 ) {
      if ( this.isSerializedClass(nn.array_type, ctx) ) {
        wr.out("def values:JSONArrayObject (json_array)", true);
        wr.out(((("for this." + pvar.compiledName) + " item:") + nn.array_type) + " i {", true);
        wr.indent(1);
        wr.out("def obj@(lives):JSONDataObject (item.toDictionary())", true);
        wr.out("push values obj", true);
        wr.indent(-1);
        wr.out("}", true);
        wr.out(("set res  \"" + pvar.name) + "\" values ", true);
      } else {
        wr.out("def values:JSONArrayObject (json_array)", true);
        wr.out(((("for this." + pvar.compiledName) + " item:") + nn.array_type) + " i {", true);
        wr.indent(1);
        wr.out("push values item", true);
        wr.indent(-1);
        wr.out("}", true);
        wr.out(("set res  \"" + pvar.name) + "\" values ", true);
      }
      return;
    }
    if ( nn.value_type == 7 ) {
      if ( this.isSerializedClass(nn.array_type, ctx) ) {
        wr.out("def values:JSONDataObject (json_object)", true);
        wr.out(("def keyList (keys this." + pvar.compiledName) + ")", true);
        wr.out("for keyList keyname:string index {", true);
        wr.indent(1);
        wr.out(("def item (unwrap (get this." + pvar.compiledName) + " keyname))", true);
        if ( ctx.isDefinedClass(nn.array_type) ) {
          wr.out("def obj@(lives):JSONDataObject (item.toDictionary())", true);
          wr.out("set values keyname obj ", true);
        } else {
          wr.out("set values keyname item ", true);
        }
        wr.indent(-1);
        wr.out("}", true);
        wr.out(("set res  \"" + pvar.name) + "\" values ", true);
      } else {
        if ( ctx.isDefinedClass(nn.array_type) == false ) {
          wr.out("def values:JSONDataObject (json_object)", true);
          wr.out(("def keyList (keys this." + pvar.compiledName) + ")", true);
          wr.out("for keyList keyname:string index {", true);
          wr.indent(1);
          wr.out(("def item (unwrap (get this." + pvar.compiledName) + " keyname))", true);
          wr.out("set values keyname item ", true);
          wr.indent(-1);
          wr.out("}", true);
          wr.out(("set res  \"" + pvar.name) + "\" values ", true);
        }
      }
      return;
    }
    if ( nn.hasFlag("optional") ) {
      if ( ctx.isDefinedClass(nn.type_name) == false ) {
        wr.out(((("set res  \"" + pvar.name) + "\" (unwrap this.") + pvar.compiledName) + ") ", true);
      } else {
        wr.out(((("set res  \"" + pvar.name) + "\" (call (unwrap this.") + pvar.compiledName) + ") toDictionary ()) ", true);
      }
    } else {
      if ( ctx.isDefinedClass(nn.type_name) == false ) {
        wr.out(((("set res  \"" + pvar.name) + "\" (this.") + pvar.compiledName) + ") ", true);
      } else {
        wr.out(((("set res  \"" + pvar.name) + "\" (this.") + pvar.compiledName) + ".toDictionary()) ", true);
      }
    }
  };
  createWRReader2 (pvar, nn, ctx, wr) {
    if ( nn.value_type == 6 ) {
      if ( this.isSerializedClass(nn.array_type, ctx) ) {
        wr.out(("def values:JSONArrayObject (getArray dict \"" + pvar.name) + "\")", true);
        wr.out("if(!null? values) {", true);
        wr.indent(1);
        wr.out("def arr (unwrap values)", true);
        wr.out("arr.forEach({", true);
        wr.indent(1);
        wr.out("case item oo:JSONDataObject {", true);
        wr.indent(1);
        wr.out(("def newObj (" + nn.array_type) + ".fromDictionary(oo))", true);
        wr.out(("push obj." + pvar.name) + " newObj", true);
        wr.indent(-1);
        wr.out("}", true);
        wr.indent(-1);
        wr.out("})", true);
        wr.indent(-1);
        wr.out("}", true);
      } else {
        wr.out(("def values:JSONArrayObject (getArray dict \"" + pvar.name) + "\")", true);
        wr.out("if(!null? values) {", true);
        wr.indent(1);
        wr.out("def arr (unwrap values)", true);
        wr.out("arr.forEach({", true);
        wr.indent(1);
        wr.out(("case item oo:" + nn.array_type) + " {", true);
        wr.indent(1);
        wr.out(("push obj." + pvar.name) + " oo", true);
        wr.indent(-1);
        wr.out("}", true);
        wr.indent(-1);
        wr.out("})", true);
        wr.indent(-1);
        wr.out("}", true);
      }
      return;
    }
    if ( nn.value_type == 7 ) {
      if ( this.isSerializedClass(nn.array_type, ctx) ) {
        wr.out(("def values (getObject dict \"" + pvar.name) + "\")", true);
        wr.out("if(!null? values) {", true);
        wr.indent(1);
        wr.out(("def theObj" + pvar.name) + " (unwrap values)", true);
        wr.out(("def obj_keys (keys theObj" + pvar.name) + ")", true);
        wr.out("obj_keys.forEach({", true);
        wr.indent(1);
        if ( ctx.isDefinedClass(nn.array_type) ) {
          wr.out(("def theValue (getObject theObj" + pvar.name) + " item ) ", true);
          wr.out("if(!null? theValue) {", true);
          wr.indent(1);
          wr.out(("def newObj@(lives) (" + nn.array_type) + ".fromDictionary((unwrap theValue)))", true);
          wr.out(("set obj." + pvar.name) + " item newObj ", true);
          wr.indent(-1);
          wr.out("}", true);
        } else {
        }
        wr.indent(-1);
        wr.out("})", true);
        wr.indent(-1);
        wr.out("}", true);
      } else {
        wr.out(("def values (getObject dict \"" + pvar.name) + "\")", true);
        wr.out("if(!null? values) {", true);
        wr.indent(1);
        wr.out(("def theObj" + pvar.name) + " (unwrap values)", true);
        wr.out(("def obj_keys (keys theObj" + pvar.name) + ")", true);
        wr.out("obj_keys.forEach({", true);
        wr.indent(1);
        if ( ctx.isDefinedClass(nn.array_type) ) {
        } else {
          switch (nn.array_type ) { 
            case "string" : 
              wr.out(("def v (getStr theObj" + pvar.name) + " item)", true);
              wr.out("if(!null? v) {", true);
              wr.indent(1);
              wr.out(("set obj." + pvar.name) + " item (unwrap v) ", true);
              wr.indent(-1);
              wr.out("}", true);
              break;
            case "int" : 
              wr.out(("def v (getInt theObj" + pvar.name) + " item)", true);
              wr.out("if(!null? v) {", true);
              wr.indent(1);
              wr.out(("set obj." + pvar.name) + " item (unwrap v) ", true);
              wr.indent(-1);
              wr.out("}", true);
              break;
            case "double" : 
              wr.out(("def v (getDouble theObj" + pvar.name) + " item)", true);
              wr.out("if(!null? v) {", true);
              wr.indent(1);
              wr.out(("set obj." + pvar.name) + " item (unwrap v) ", true);
              wr.indent(-1);
              wr.out("}", true);
              break;
            case "boolean" : 
              wr.out(("def v (getBoolean theObj" + pvar.name) + " item)", true);
              wr.out("if(!null? v) {", true);
              wr.indent(1);
              wr.out(("set obj." + pvar.name) + " item (unwrap v) ", true);
              wr.indent(-1);
              wr.out("}", true);
              break;
          };
        }
        wr.indent(-1);
        wr.out("})", true);
        wr.indent(-1);
        wr.out("}", true);
      }
      return;
    }
    switch (nn.type_name ) { 
      case "string" : 
        wr.out(("def v (getStr dict \"" + pvar.name) + "\")", true);
        wr.out("if(!null? v) {", true);
        wr.indent(1);
        wr.out(("obj." + pvar.name) + " = (unwrap v) ", true);
        wr.indent(-1);
        wr.out("}", true);
        break;
      case "int" : 
        wr.out(("def v (getInt dict \"" + pvar.name) + "\")", true);
        wr.out("if(!null? v) {", true);
        wr.indent(1);
        wr.out(("obj." + pvar.name) + " = (unwrap v) ", true);
        wr.indent(-1);
        wr.out("}", true);
        break;
      case "double" : 
        wr.out(("def v (getDouble dict \"" + pvar.name) + "\")", true);
        wr.out("if(!null? v) {", true);
        wr.indent(1);
        wr.out(("obj." + pvar.name) + " = (unwrap v) ", true);
        wr.indent(-1);
        wr.out("}", true);
        break;
      case "boolean" : 
        wr.out(("def v (getBoolean dict \"" + pvar.name) + "\")", true);
        wr.out("if(!null? v) {", true);
        wr.indent(1);
        wr.out(("obj." + pvar.name) + " = (unwrap v) ", true);
        wr.indent(-1);
        wr.out("}", true);
        break;
    };
    if ( ctx.isDefinedClass(nn.type_name) ) {
      wr.out(("def theValue (getObject dict \"" + pvar.name) + "\") ", true);
      wr.out("if(!null? theValue) {", true);
      wr.indent(1);
      wr.out(("def newObj@(lives) (" + nn.type_name) + ".fromDictionary((unwrap theValue)))", true);
      wr.out(("obj." + pvar.name) + " = newObj ", true);
      wr.indent(-1);
      wr.out("}", true);
    } else {
    }
    if ( nn.value_type == 13 ) {
      wr.out(("def v (getInt dict \"" + pvar.name) + "\")", true);
      wr.out("if(!null? v) {", true);
      wr.indent(1);
      wr.out(("obj." + pvar.name) + " = (unwrap v) ", true);
      wr.indent(-1);
      wr.out("}", true);
    }
  };
  createJSONSerializerFn2 (cl, ctx, wr) {
    const use_exceptions = operatorsOf_21.getTargetLang_22(ctx) != "swift3";
    let declaredVariable = {};
    wr.out(("extension " + cl.name) + " {", true);
    wr.indent(1);
    wr.out(("static fn fromDictionary@(strong):" + cl.name) + " (dict:JSONDataObject) {", true);
    wr.indent(1);
    wr.out(((("def obj:" + cl.name) + " (new ") + cl.name) + "())", true);
    if ( use_exceptions ) {
      wr.out("try {", true);
      wr.indent(1);
    }
    for ( let i = 0; i < cl.variables.length; i++) {
      var pvar = cl.variables[i];
      if ( ( typeof(declaredVariable[pvar.name] ) != "undefined" && declaredVariable.hasOwnProperty(pvar.name) ) ) {
        continue;
      }
      const nn = pvar.nameNode;
      this.createWRReader2(pvar, nn, ctx, wr);
    };
    if ( use_exceptions ) {
      wr.indent(-1);
      wr.out("} {", true);
      wr.out("}", true);
    }
    wr.out("return obj", true);
    wr.indent(-1);
    wr.out("}", true);
    wr.newline();
    wr.out("fn toDictionary:JSONDataObject () {", true);
    wr.indent(1);
    wr.out("def res:JSONDataObject (json_object)", true);
    if ( use_exceptions ) {
      wr.out("try {", true);
      wr.indent(1);
    }
    if ( (cl.extends_classes.length) > 0 ) {
      for ( let i_1 = 0; i_1 < cl.extends_classes.length; i_1++) {
        var pName = cl.extends_classes[i_1];
        const pC = ctx.findClass(pName);
        for ( let i_2 = 0; i_2 < pC.variables.length; i_2++) {
          var pvar_1 = pC.variables[i_2];
          declaredVariable[pvar_1.name] = true;
          /** unused:  const nn_1 = pvar_1.nameNode   **/ 
        };
      };
    }
    for ( let i_3 = 0; i_3 < cl.variables.length; i_3++) {
      var pvar_2 = cl.variables[i_3];
      if ( ( typeof(declaredVariable[pvar_2.name] ) != "undefined" && declaredVariable.hasOwnProperty(pvar_2.name) ) ) {
        continue;
      }
      const nn_2 = pvar_2.nameNode;
      if ( nn_2.hasFlag("optional") ) {
        wr.out("; optional variable", true);
        wr.out(("if (!null? this." + pvar_2.compiledName) + ") {", true);
        wr.indent(1);
        this.createWRWriter2(pvar_2, nn_2, ctx, wr);
        wr.indent(-1);
        wr.out("}", true);
        continue;
      }
      wr.out("; not extended ", true);
      this.createWRWriter2(pvar_2, nn_2, ctx, wr);
    };
    if ( use_exceptions ) {
      wr.indent(-1);
      wr.out("} {", true);
      wr.indent(1);
      wr.out("", true);
      wr.indent(-1);
      wr.out("}", true);
    }
    wr.out("return res", true);
    wr.indent(-1);
    wr.out("}", true);
    wr.indent(-1);
    wr.out("}", true);
  };
}
class RangerImmutableExtension  {
  constructor() {
  }
  typeDefOf (p) {
    const nn = p.nameNode;
    if ( p.value_type == 6 ) {
      return ("[" + nn.array_type) + "]";
    }
    if ( p.value_type == 7 ) {
      return ((("[" + nn.key_type) + ":") + nn.array_type) + "]";
    }
    if ( nn.value_type == 6 ) {
      return ("[" + nn.array_type) + "]";
    }
    if ( nn.value_type == 7 ) {
      return ((("[" + nn.key_type) + ":") + nn.array_type) + "]";
    }
    return nn.type_name;
  };
  createImmutableExtension (cl, ctx, wr) {
    let declaredVariable = {};
    wr.out(("extension " + cl.name) + " {", true);
    wr.indent(1);
    if ( (cl.extends_classes.length) > 0 ) {
      for ( let i = 0; i < cl.extends_classes.length; i++) {
        var pName = cl.extends_classes[i];
        const pC = ctx.findClass(pName);
        for ( let i_1 = 0; i_1 < pC.variables.length; i_1++) {
          var pvar = pC.variables[i_1];
          declaredVariable[pvar.name] = true;
          /** unused:  const nn = pvar.nameNode   **/ 
        };
      };
    }
    wr.out(("fn __CopySelf:" + cl.name) + " () {", true);
    wr.indent(1);
    wr.out(("def res (new " + cl.name) + ")", true);
    for ( let ii = 0; ii < cl.variables.length; ii++) {
      var ivar = cl.variables[ii];
      wr.out((("res." + ivar.compiledName) + " = this.") + ivar.compiledName, true);
    };
    wr.out("return res", true);
    wr.indent(-1);
    wr.out("}", true);
    for ( let i_2 = 0; i_2 < cl.variables.length; i_2++) {
      var pvar_1 = cl.variables[i_2];
      if ( ( typeof(declaredVariable[pvar_1.name] ) != "undefined" && declaredVariable.hasOwnProperty(pvar_1.name) ) ) {
        continue;
      }
      /** unused:  const nn_1 = pvar_1.nameNode   **/ 
      if ( true ) {
        wr.out(((((((("fn set_" + pvar_1.name) + ":") + cl.name) + " (new_value_of_") + pvar_1.name) + ":") + this.typeDefOf(pvar_1)) + ") {", true);
        wr.indent(1);
        wr.out("def res (this.__CopySelf())", true);
        for ( let ii_1 = 0; ii_1 < cl.variables.length; ii_1++) {
          var ivar_1 = cl.variables[ii_1];
          if ( ivar_1 == pvar_1 ) {
            wr.out((("res." + pvar_1.compiledName) + " = new_value_of_") + pvar_1.name, true);
          }
        };
        wr.out("return res", true);
        wr.indent(-1);
        wr.out("}", true);
      } else {
      }
    };
    wr.indent(-1);
    wr.out("}", true);
  };
}
class RangerServiceBuilder  {
  constructor() {
  }
  createOpStaticClass (ctx, name) {
    const nameWillBe = name;
    let str = "";
    let i = 0;
    const __len = nameWillBe.length;
    while (i < __len) {
      const c = nameWillBe.charCodeAt(i );
      if ( c == (".".charCodeAt(0)) ) {
        str = str + "_";
      } else {
        str = str + (nameWillBe.substring(i, (i + 1) ));
      }
      i = i + 1;
    };
    if ( ctx.isDefinedClass(str) ) {
      return ctx.findClass(str);
    }
    const tpl_code = ("class " + str) + " {\r\n}";
    const code = new SourceCode(tpl_code);
    code.filename = str + ".ranger";
    const parser = new RangerLispParser(code);
    parser.parse(false);
    const classRoot = parser.rootNode.children[0];
    const classNameNode = classRoot.getSecond();
    classNameNode.vref = str;
    const new_class = new RangerAppClassDesc();
    new_class.name = str;
    new_class.is_operator_class = true;
    new_class.nameNode = classNameNode;
    new_class.classNode = classRoot;
    const subCtx = ctx.fork();
    subCtx.setCurrentClass(new_class);
    new_class.ctx = subCtx;
    const root = ctx.getRoot();
    root.addClass(str, new_class);
    classNameNode.clDesc = new_class;
    root.staticClassBodies.push(classRoot);
    return new_class;
  };
  async CreateServices (parser, ctx, orig_wr) {
    if ( ctx.hasCompilerFlag("client") || ctx.hasCompilerSetting("client") ) {
      console.log("--> could create Client services for Java here...");
      const root = ctx.getRoot();
      const cl = this.createOpStaticClass(ctx, "RangerAppService");
      console.log("created " + cl.name);
      await operatorsOf_13.forEach_25(root.appServices, ((item, index) => { 
        console.log(" - service " + index);
      }));
    }
  };
}
class RangerAppOperatorDesc  extends RangerAppParamDesc {
  constructor() {
    super()
    this.name = "";
    this.ref_cnt = 0;     /** note: unused */
    this.op_params = [];
  }
  isOperator () {
    return true;
  };
  isProperty () {
    return false;
  };
}
class TFiles  {
  constructor() {
  }
}
TFiles.searchEnv = function(env, paths, fileName) {
  for ( let i = 0; i < paths.length; i++) {
    var path = paths[i];
    if ( operatorsOf_8.filec95exists_9(env, path, fileName) ) {
      return path;
    }
  };
  return "";
};
TFiles.search = function(paths, fileName) {
  for ( let i = 0; i < paths.length; i++) {
    var path = paths[i];
    if ( require("fs").existsSync(path + "/" + fileName ) ) {
      return path;
    }
  };
  return "";
};
class TTypes  {
  constructor() {
  }
}
TTypes.nameToValue = function(name) {
  switch (name ) { 
    case "double" : 
      return 2;
    case "int" : 
      return 3;
    case "string" : 
      return 4;
    case "boolean" : 
      return 5;
    case "char" : 
      return 14;
    case "charbuffer" : 
      return 15;
  };
  return 0;
};
TTypes.isPrimitive = function(valueType) {
  switch (valueType ) { 
    case 2 : 
      return true;
    case 4 : 
      return true;
    case 3 : 
      return true;
    case 5 : 
      return true;
    case 14 : 
      return true;
    case 15 : 
      return true;
    case 13 : 
      return true;
  };
  return false;
};
TTypes.valueAsString = function(valueType) {
  switch (valueType ) { 
    case 2 : 
      return "double";
    case 4 : 
      return "string";
    case 3 : 
      return "int";
    case 5 : 
      return "boolean";
    case 14 : 
      return "char";
    case 15 : 
      return "charbuffer";
    case 0 : 
      return "<no type>";
    case 1 : 
      return "<invalid type>";
    case 6 : 
      return "[]";
    case 7 : 
      return "[:]";
    case 8 : 
      return "ImmutableArray";
    case 9 : 
      return "ImmutableHash";
    case 10 : 
      return "Object";
    case 11 : 
      return "VRef";
    case 13 : 
      return "Enum";
    case 12 : 
      return "Comment";
    case 16 : 
      return "Expression";
    case 17 : 
      return "ExpressionType";
    case 18 : 
      return "Lambda";
    case 19 : 
      return "XMLNode";
    case 20 : 
      return "XMLText";
    case 21 : 
      return "XMLAttr";
    case 22 : 
      return "XMLAttr";
    case 23 : 
      return "Dictionary";
    case 24 : 
      return "Any";
    case 25 : 
      return "Class";
    case 26 : 
      return "GenericClass";
    case 27 : 
      return "ClassRef";
    case 28 : 
      return "Method";
    case 29 : 
      return "ClassVar";
    case 30 : 
      return "ClassVar";
    case 31 : 
      return "Literal";
    case 32 : 
      return "Quasiliteral";
    case 33 : 
      return "Null";
    case 34 : 
      return "ArrayLiteral";
    default: 
      return "InvalidValueTypeEnum";
      break;
  };
  return "";
};
TTypes.baseTypeAsEval = function(node, ctx, wr) {
  const vType = node.value_type;
  node.eval_type = vType;
  if ( TTypes.isPrimitive(node.value_type) ) {
    node.eval_type_name = TTypes.valueAsString(node.value_type);
  } else {
    const vType_2 = node.type_name;
    node.eval_type_name = vType_2;
  }
  const vType1 = node.array_type;
  const vType2 = node.key_type;
  node.eval_array_type = vType1;
  node.eval_key_type = vType2;
};
class ClassJoinPoint  {
  constructor() {
  }
}
class WalkLater  {
  constructor() {
  }
}
class RangerFlowParser  {
  constructor() {
    this.hasRootPath = false;     /** note: unused */
    this.rootPath = "";     /** note: unused */
    this._debug = false;     /** note: unused */
    this.collectWalkAtEnd = [];     /** note: unused */
    this.walkAlso = [];
    this.serializedClasses = [];
    this.immutableClasses = [];
    this.classesWithTraits = [];
    this.collectedIntefaces = [];
    this.definedInterfaces = {};     /** note: unused */
    this.signatureCnt = 0;
    this.argSignatureCnt = 0;     /** note: unused */
    this.mainCnt = 0;
    this.isDefinedSignature = {};
    this.isDefinedArgSignature = {};
    this.extendedClasses = {};
    this.allNewRNodes = [];     /** note: unused */
    this.infinite_recursion = false;
    this.match_types = {};
  }
  async WalkNodeChildren (node, ctx, wr) {
    if ( node.hasStringProperty("todo") ) {
      ctx.addTodo(node, node.getStringProperty("todo"));
    }
    if ( node.expression ) {
      let is_chaining = false;
      let last_is_assign = false;
      let chainRoot;
      let innerNode;
      let assignNode;
      let newNode;
      const ch_len = node.children.length;
      for ( let i = 0; i < node.children.length; i++) {
        var item = node.children[i];
        let did_find = false;
        if ( (item.children.length) > 0 ) {
          const fc = item.getFirst();
          const name = fc.vref;
          if ( ((name.length) > 0) && ((name.charCodeAt(0 )) == (".".charCodeAt(0))) ) {
            did_find = true;
            if ( i > 0 ) {
              const last_line = node.children[(i - 1)];
              if ( is_chaining == false ) {
                last_line.createChainTarget();
                is_chaining = true;
                if ( (typeof(last_line.chainTarget) !== "undefined" && last_line.chainTarget != null )  ) {
                  chainRoot = last_line.chainTarget;
                  innerNode = last_line.chainTarget;
                  assignNode = last_line;
                  last_is_assign = true;
                } else {
                  chainRoot = last_line;
                  innerNode = last_line;
                }
              }
              const method_name = name.substring(1, (name.length) );
              const mArgs = item.getSecond();
              if ( last_is_assign ) {
                assignNode.children.push(fc.copy());
                assignNode.children.push(mArgs.copy());
              } else {
                newNode = node.newExpressionNode();
                newNode.add(node.newVRefNode("call"));
                newNode.add(innerNode.copy());
                newNode.add(node.newVRefNode(method_name));
                newNode.add(mArgs.copy());
                innerNode = newNode;
              }
              item.is_part_of_chain = true;
            }
          }
        }
        if ( (did_find == false) || (i == (ch_len - 1)) ) {
          if ( is_chaining && (last_is_assign == false) ) {
            chainRoot.getChildrenFrom(innerNode);
            chainRoot.tag = "chainroot";
          }
          is_chaining = false;
          last_is_assign = false;
        }
      };
      for ( let i_1 = 0; i_1 < node.children.length; i_1++) {
        var item_1 = node.children[i_1];
        if ( ctx.expressionLevel() == 0 ) {
          ctx.lastBlockOp = item_1;
        }
        item_1.parent = node;
        await this.WalkNode(item_1, ctx, wr);
        node.copyEvalResFrom(item_1);
      };
    }
  };
  async WalkNode (node, ctx, wr) {
    /** unused:  const line_index = node.getLine()   **/ 
    if ( node.flow_done ) {
      return true;
    }
    if ( ctx.isPluginOp(node) ) {
      return true;
    }
    node.flow_ctx = ctx;
    node.flow_done = true;
    this.lastProcessedNode = node;
    if ( node.hasStringProperty("todo") ) {
      ctx.addTodo(node, node.getStringProperty("todo"));
    }
    if ( node.is_part_of_chain ) {
      return true;
    }
    if ( node.isPrimitive() ) {
      if ( ctx.expressionLevel() == 0 ) {
        if ( false == ctx.hasCompilerFlag("voidexpr") ) {
          ctx.addError(node, "Primitive element at top level!");
        }
      }
      this.WriteScalarValue(node, ctx, wr);
      return true;
    }
    if ( ((node.value_type == 11) || (node.value_type == 7)) || (node.value_type == 6) ) {
      await this.WriteVRef(node, ctx, wr);
      return true;
    }
    if ( node.value_type == 12 ) {
      return true;
    }
    if ( (node.register_name.length) > 0 ) {
      if ( ctx.isVarDefined(node.register_name) ) {
        const regInfo = ctx.getVariableDef(node.register_name);
        if ( (typeof(regInfo.nameNode) !== "undefined" && regInfo.nameNode != null )  ) {
          node.copyEvalResFrom(regInfo.nameNode);
          return true;
        } else {
        }
      } else {
      }
      return true;
    }
    if ( node.value_type == 19 ) {
      const fc = node;
      if ( fc.value_type == 19 ) {
        const opBody = CodeNode.blockNode();
        const opTpl = CodeNode.fromList([CodeNode.vref1("defn"), CodeNode.vref1("tmp_create"), CodeNode.expressionNode()]);
        let currCnt = 1;
        let walk_xml = ((xmlNode, regName) => { 
        });
        walk_xml = (async (xmlNode, regName) => { 
          const rootClassDef = ctx.findClass(xmlNode.vref);
          if ( rootClassDef.is_system ) {
            opBody.children.push(CodeNode.fromList([CodeNode.vref1("def"), CodeNode.vref1(regName), CodeNode.fromList([CodeNode.vref1("create"), CodeNode.vref1(xmlNode.vref)])]));
            await operatorsOf.forEach_15(xmlNode.attrs, ((item, index) => { 
              if ( (item.children.length) > 0 ) {
                const fc_1 = item.children[0];
                opBody.children.push(CodeNode.fromList([CodeNode.vref1("attr"), CodeNode.vref1(regName), CodeNode.vref1(item.vref), fc_1.copy()]));
                return;
              }
              if ( (item.string_value.length) > 0 ) {
                opBody.children.push(CodeNode.fromList([CodeNode.vref1("attr"), CodeNode.vref1(regName), CodeNode.vref1(item.vref), CodeNode.newStr(item.string_value)]));
              }
            }));
            await operatorsOf.forEach_15(xmlNode.children, (async (item, index) => { 
              if ( item.value_type != 19 ) {
                if ( item.expression ) {
                  const itemCopy = item.copy();
                  const theNode = item;
                  ctx.setTestCompile();
                  await this.WalkNode(itemCopy, ctx, wr);
                  ctx.unsetTestCompile();
                  if ( ctx.hasClass(itemCopy.eval_array_type) ) {
                    /** unused:  const paramClassDef = ctx.findClass(itemCopy.eval_array_type)   **/ 
                    /** unused:  const chNode = item   **/ 
                    const t = CodeNode.vref1("tmp");
                    t.setFlag("temp");
                    opBody.children.push(CodeNode.fromList([CodeNode.vref1("forEach"), theNode.copy(), CodeNode.blockFromList([CodeNode.fromList([CodeNode.vref1("def"), t, CodeNode.vref1("item")]), CodeNode.fromList([CodeNode.vref1("push"), CodeNode.vref1(regName), CodeNode.vref1("tmp")])])]));
                  } else {
                    if ( ctx.hasClass(itemCopy.eval_type_name) ) {
                      opBody.children.push(CodeNode.fromList([CodeNode.vref1("push"), CodeNode.vref1(regName), theNode.copy()]));
                    }
                  }
                } else {
                }
              }
              if ( item.value_type == 19 ) {
                if ( ctx.hasClass(item.vref) ) {
                  /** unused:  const paramClassDef_1 = ctx.findClass(item.vref)   **/ 
                  const chNode_1 = item;
                  currCnt = currCnt + 1;
                  const regN = "r" + currCnt;
                  await walk_xml(chNode_1, regN);
                  opBody.children.push(CodeNode.fromList([CodeNode.vref1("push"), CodeNode.vref1(regName), CodeNode.vref1(regN)]));
                }
              }
            }));
          } else {
            const match = new RangerArgMatch();
            opBody.children.push(CodeNode.fromList([CodeNode.vref1("def"), CodeNode.vref1(regName), CodeNode.fromList([CodeNode.vref1("new"), CodeNode.vref1(xmlNode.vref)])]));
            await operatorsOf.forEach_15(xmlNode.attrs, ((item, index) => { 
              if ( (item.children.length) > 0 ) {
                const fc_2 = item.children[0];
                opBody.children.push(CodeNode.fromList([CodeNode.vref1("="), CodeNode.vref1(((regName + ".") + item.vref)), fc_2.copy()]));
                return;
              }
              if ( (item.string_value.length) > 0 ) {
                opBody.children.push(CodeNode.fromList([CodeNode.vref1("="), CodeNode.vref1(((regName + ".") + item.vref)), CodeNode.newStr(item.string_value)]));
              }
              if ( item.parsed_type == 3 ) {
                opBody.children.push(CodeNode.fromList([CodeNode.vref1("="), CodeNode.vref1(((regName + ".") + item.vref)), CodeNode.newInt(item.int_value)]));
              }
            }));
            await operatorsOf.forEach_15(xmlNode.children, (async (item, index) => { 
              if ( item.value_type != 19 ) {
                if ( item.expression ) {
                  const itemCopy_1 = item.copy();
                  const theNode_1 = item;
                  ctx.setTestCompile();
                  await this.WalkNode(itemCopy_1, ctx, wr);
                  ctx.unsetTestCompile();
                  if ( ctx.hasClass(itemCopy_1.eval_array_type) ) {
                    /** unused:  const paramClassDef_2 = ctx.findClass(itemCopy_1.eval_array_type)   **/ 
                    /** unused:  const chNode_2 = item   **/ 
                    operatorsOf.forEach_11(rootClassDef.variables, ((item, index) => { 
                      if ( match.areEqualATypes(item.nameNode.array_type, itemCopy_1.eval_array_type, ctx) ) {
                        const t_1 = CodeNode.vref1("tmp");
                        t_1.setFlag("temp");
                        opBody.children.push(CodeNode.fromList([CodeNode.vref1("forEach"), theNode_1.copy(), CodeNode.blockFromList([CodeNode.fromList([CodeNode.vref1("def"), t_1, CodeNode.vref1("item")]), CodeNode.fromList([CodeNode.vref1("push"), CodeNode.vref1(((regName + ".") + item.name)), CodeNode.vref1("tmp")])])]));
                      }
                    }));
                  } else {
                    console.log("could not find class" + itemCopy_1.eval_array_type);
                  }
                }
              }
              if ( item.value_type == 19 ) {
                if ( ctx.hasClass(item.vref) ) {
                  const paramClassDef_3 = ctx.findClass(item.vref);
                  const chNode_3 = item;
                  operatorsOf.forEach_11(rootClassDef.variables, ((item, index) => { 
                    if ( match.areEqualATypes(item.nameNode.array_type, chNode_3.vref, ctx) ) {
                      currCnt = currCnt + 1;
                      const regN_1 = "r" + currCnt;
                      walk_xml(chNode_3, regN_1);
                      if ( paramClassDef_3.is_immutable ) {
                        opBody.children.push(CodeNode.fromList([CodeNode.vref1("="), CodeNode.vref1(((regName + ".") + item.name)), CodeNode.fromList([CodeNode.vref1("push"), CodeNode.vref1(((regName + ".") + item.name)), CodeNode.vref1(regN_1)])]));
                      } else {
                        opBody.children.push(CodeNode.fromList([CodeNode.vref1("push"), CodeNode.vref1(((regName + ".") + item.name)), CodeNode.vref1(regN_1)]));
                      }
                    }
                  }));
                }
              }
            }));
          }
        });
        await walk_xml(fc, "r1");
        opBody.children.push(CodeNode.fromList([CodeNode.vref1("ret"), CodeNode.vref1("r1")]));
        opTpl.children.push(opBody);
        node.value_type = 0;
        node.getChildrenFrom(CodeNode.fromList([CodeNode.vref1("tmp_create")]));
        node.value_type = 0;
        node.expression = true;
        await this.TransformOpFn([opTpl], node, ctx, wr);
        return true;
      }
    }
    if ( (node.children.length) > 0 ) {
      const fc_3 = node.getFirst();
      if ( (fc_3.ns.length) > 1 ) {
        if ( (fc_3.ns[0]) == "plugin" ) {
          if ( node.is_plugin ) {
            return true;
          }
          node.is_plugin = true;
          const pName = fc_3.ns[1];
          ctx.addPluginNode(pName, node);
          return true;
        }
      }
    }
    if ( (node.children.length) == 1 ) {
      const fc_4 = node.children[0];
      if ( ctx.isVarDefined(fc_4.vref) ) {
        fc_4.parent = node;
        if ( (typeof(fc_4.evalCtx) !== "undefined" && fc_4.evalCtx != null )  ) {
          await this.WalkNode(fc_4, fc_4.evalCtx, wr);
        } else {
          await this.WalkNode(fc_4, ctx, wr);
        }
        node.copyEvalResFrom(fc_4);
        return true;
      }
    }
    const skip_if = ["Extends", "operator", "extends", "operators", "systemclass", "systemunion", "union", "flag", "trait", "enum", "Import"];
    if ( (node.children.length) > 0 ) {
      const fc_5 = node.children[0];
      if ( (skip_if.indexOf(fc_5.vref)) >= 0 ) {
        return true;
      }
      if ( fc_5.vref == "#" ) {
        const fnCtx = ctx.findFunctionCtx();
        await this.DefineArrowOpFn(node, fnCtx, wr);
        node.value_type = 11;
        node.expression = false;
        node.is_block_node = false;
        node.ns.length = 0;
        node.ns.push(node.vref);
        node.children.length = 0;
        node.paramDesc = undefined;
        node.hasParamDesc = false;
        return true;
      } else {
        if ( fc_5.expression && ((fc_5.children.length) > 0) ) {
          const exprFc = fc_5.children[0];
          if ( exprFc.vref == "#" ) {
            await this.DefineArrowOpFn(fc_5, ctx, wr);
          }
        }
      }
      let b_found = true;
      const opFn = await ctx.getOpFns(fc_5.vref);
      if ( (opFn.length) > 0 ) {
        await this.TransformOpFn(opFn, node, ctx, wr);
        return true;
      }
      switch (fc_5.vref ) { 
        case "page" : 
          const sc = node.getSecond();
          ctx.addPage(sc.vref, node);
          break;
        case "def" : 
          await operatorsOfRangerFlowParser_26.EnterVarDef_27(this, node, ctx, wr);
          break;
        case "var" : 
          await operatorsOf_26.EnterVarDef_27(this, node, ctx, wr);
          break;
        case "let" : 
          await operatorsOf_26.EnterVarDef_27(this, node, ctx, wr);
          break;
        case "property" : 
          await this.GetProperty(node, ctx, wr);
          break;
        case "CreateClass" : 
          await this.EnterClass(node, ctx, wr);
          break;
        case "class" : 
          await this.EnterClass(node, ctx, wr);
          break;
        case "defn" : 
          this.DefineOpFn(node, ctx, wr);
          break;
        case "fn" : 
          if ( ctx.isInMethod() ) {
            await this.EnterLambdaMethod(node, ctx, wr);
          } else {
            await this.EnterMethod(node, ctx, wr);
          }
          break;
        case "sfn" : 
          await this.EnterStaticMethod(node, ctx, wr);
          break;
        case "static" : 
          await this.EnterStaticMethod(node, ctx, wr);
          break;
        case "=" : 
          await this.cmdAssign(node, ctx, wr);
          break;
        case "constructor" : 
          await this.Constructor(node, ctx, wr);
          break;
        case "Constructor" : 
          await this.Constructor(node, ctx, wr);
          break;
        case "new" : 
          await this.cmdNew(node, ctx, wr);
          break;
        case "[]" : 
          await this.cmdArray(node, ctx, wr);
          break;
        case "call" : 
          await this.cmdCall(node, ctx, wr);
          break;
        case "fun" : 
          await this.EnterLambdaMethod(node, ctx, wr);
          break;
        case "extension" : 
          await this.EnterClass(node, ctx, wr);
          break;
        case "service" : 
          try {
            const sc_1 = node.getSecond();
            const params = node.getThird();
            ctx.addService(sc_1.vref, node);
            const paramClass = params.getFirst();
            const rvClassDef = ctx.findClass(sc_1.type_name);
            const paramClassDef_4 = ctx.findClass(paramClass.type_name);
            node.appGUID = (sc_1.vref + "_") + (require('crypto').createHash('sha256').update((rvClassDef.node.getCode() + paramClassDef_4.node.getCode())).digest('hex'));
          } catch(e) {
            ctx.addError(node, "invalid service definition");
          }
          break;
        default: 
          b_found = false;
          break;
      };
      if ( b_found ) {
        return true;
      }
    }
    if ( await this.matchNode(node, ctx, wr) ) {
      return true;
    }
    if ( (node.children.length) > 0 ) {
      const fc_6 = node.children[0];
      if ( fc_6.expression && ((node.children.length) == 2) ) {
        const sec = node.getSecond();
        if ( ((sec.vref.length) > 0) && ((sec.vref[0]) == ".") ) {
          await this.WalkNode(fc_6, ctx, wr);
          if ( ((fc_6.eval_type_name.length) > 0) && ctx.isDefinedClass(fc_6.eval_type_name) ) {
            const parts = (sec.vref.substring(1, (sec.vref.length) )).split(".");
            let method_name = parts[0];
            let classDesc = ctx.findClass(fc_6.eval_type_name);
            /** unused:  const objExpr = fc_6.copy()   **/ 
            let calledItem = CodeNode.fromList([CodeNode.vref1("property"), fc_6.copy(), CodeNode.vref1(method_name)]);
            await operatorsOf.forEach_12(parts, ((item, index) => { 
              if ( index > 0 ) {
                try {
                  const p = classDesc.findVariable(method_name);
                  classDesc = ctx.findClass(p.nameNode.type_name);
                  calledItem = CodeNode.fromList([CodeNode.vref1("property"), calledItem.copy(), CodeNode.vref1(item)]);
                  method_name = item;
                } catch(e) {
                  ctx.addError(sec, "invalid property");
                }
              }
            }));
            const m = classDesc.findVariable(method_name);
            if ( (typeof(m) !== "undefined" && m != null )  ) {
              node.getChildrenFrom(calledItem);
              node.flow_done = false;
              await this.WalkNode(node, ctx, wr);
              return true;
            }
            const m_1 = classDesc.findMethod(method_name);
            if ( (typeof(m_1) !== "undefined" && m_1 != null )  ) {
              node.getChildrenFrom(calledItem);
              node.flow_done = false;
              await this.transformMethodToLambda(node, m_1, ctx, wr);
              return true;
            }
          }
        }
      }
      if ( fc_6.expression && ((node.children.length) == 3) ) {
        const sec_1 = node.getSecond();
        const third = node.getThird();
        if ( ((sec_1.vref.length) > 0) && ((sec_1.vref[0]) == ".") ) {
          await this.WalkNode(fc_6, ctx, wr);
          const parts_1 = (sec_1.vref.substring(1, (sec_1.vref.length) )).split(".");
          const method_name_1 = parts_1[((parts_1.length) - 1)];
          let classDesc_1 = ctx.findClass(fc_6.eval_type_name);
          /** unused:  const objExpr_1 = fc_6.copy()   **/ 
          let calledItem_1 = fc_6.copy();
          await operatorsOf.forEach_12(parts_1, ((item, index) => { 
            if ( index < ((parts_1.length) - 1) ) {
              try {
                calledItem_1 = CodeNode.fromList([CodeNode.vref1("property"), calledItem_1.copy(), CodeNode.vref1(item)]);
                const p_1 = classDesc_1.findVariable(item);
                classDesc_1 = ctx.findClass(p_1.nameNode.type_name);
              } catch(e) {
                ctx.addError(sec_1, "invalid property " + item);
              }
            }
          }));
          const calledItem_2 = CodeNode.fromList([CodeNode.vref1("call"), calledItem_1, CodeNode.vref1(method_name_1), third.copy()]);
          node.getChildrenFrom(calledItem_2);
          node.flow_done = false;
          await this.WalkNode(node, ctx, wr);
          return true;
        }
      }
      if ( fc_6.value_type == 11 ) {
        let was_called = true;
        switch (fc_6.vref ) { 
          case "Enum" : 
            was_called = true;
            break;
          default: 
            was_called = false;
            break;
        };
        if ( was_called ) {
          return true;
        }
        if ( (node.children.length) > 1 ) {
          if ( await this.cmdLocalCall(node, ctx, wr) ) {
            return true;
          }
        }
      }
    }
    if ( node.expression ) {
      for ( let i = 0; i < node.children.length; i++) {
        var item = node.children[i];
        if ( ctx.expressionLevel() == 0 ) {
          ctx.lastBlockOp = item;
        }
        item.parent = node;
        if ( (typeof(item.evalCtx) !== "undefined" && item.evalCtx != null )  ) {
          await this.WalkNode(item, item.evalCtx, wr);
        } else {
          await this.WalkNode(item, ctx, wr);
        }
        node.copyEvalResFrom(item);
        if ( (i == 0) && ((node.children.length) == 2) ) {
          if ( (item.eval_type == 28) && ((typeof(item.paramDesc) !== "undefined" && item.paramDesc != null ) ) ) {
            const pDesc = item.paramDesc;
            const mDesc = pDesc;
            node.eval_type = mDesc.nameNode.value_type;
            node.eval_type_name = mDesc.nameNode.type_name;
            node.eval_array_type = mDesc.nameNode.array_type;
            node.eval_key_type = mDesc.nameNode.eval_key_type;
            node.is_direct_method_call = true;
            return true;
          }
        }
        if ( (((typeof(item.expression_value) !== "undefined" && item.expression_value != null ) ) || (item.value_type == 17)) || (item.eval_type == 17) ) {
          if ( (i == 0) && ((node.children.length) == 2) ) {
            node.has_lambda_call = true;
            const second = node.children[1];
            ctx.setInExpr();
            await this.WalkNode(second, ctx, wr);
            ctx.unsetInExpr();
            if ( (typeof(item.expression_value) !== "undefined" && item.expression_value != null )  ) {
              const lambdaNode = item.expression_value;
              const nn = lambdaNode.children[0];
              node.eval_type = nn.typeNameAsType(ctx);
              node.eval_type_name = nn.type_name;
              node.eval_array_type = nn.array_type;
              node.eval_key_type = nn.key_type;
              if ( node.eval_type == 17 ) {
                node.expression_value = nn.expression_value.copy();
              }
              if ( nn.hasFlag("optional") ) {
                node.setFlag("optional");
              }
              await this.testLambdaCallArgs(lambdaNode, second, ctx, wr);
            }
            break;
          }
        }
      };
      return true;
    }
    ctx.addError(node, "Could not understand this part");
    return true;
  };
  getVoidNameSignature () {
    const s = "void";
    if ( ( typeof(this.isDefinedSignature[s] ) != "undefined" && this.isDefinedSignature.hasOwnProperty(s) ) ) {
      const cc = (this.isDefinedSignature[s]);
      return "void_" + cc;
    }
    this.signatureCnt = this.signatureCnt + 1;
    this.isDefinedSignature[s] = this.signatureCnt;
    return "void_" + this.signatureCnt;
  };
  getNameSignature (node) {
    const s = node.type_name + node.buildTypeSignature();
    if ( ( typeof(this.isDefinedSignature[s] ) != "undefined" && this.isDefinedSignature.hasOwnProperty(s) ) ) {
      const cc = (this.isDefinedSignature[s]);
      if ( cc == 1 ) {
        return node.type_name;
      }
      return "_" + cc;
    }
    this.signatureCnt = this.signatureCnt + 1;
    this.isDefinedSignature[s] = this.signatureCnt;
    if ( this.signatureCnt == 1 ) {
      return node.type_name;
    }
    return (node.type_name + "_") + this.signatureCnt;
  };
  getArgsSignature (node) {
    let exp_s = "";
    for ( let i = 0; i < node.children.length; i++) {
      var arg = node.children[i];
      exp_s = exp_s + arg.buildTypeSignature();
      exp_s = exp_s + ",";
    };
    if ( ( typeof(this.isDefinedArgSignature[exp_s] ) != "undefined" && this.isDefinedArgSignature.hasOwnProperty(exp_s) ) ) {
      const cc = (this.isDefinedArgSignature[exp_s]);
      if ( cc == 1 ) {
        return "";
      }
      return "_" + cc;
    }
    this.signatureCnt = this.signatureCnt + 1;
    this.isDefinedArgSignature[exp_s] = this.signatureCnt;
    if ( this.signatureCnt == 1 ) {
      return "";
    }
    return "_" + this.signatureCnt;
  };
  getThisName () {
    return "this";
  };
  async GetProperty (node, ctx, wr) {
    if ( (node.children.length) != 3 ) {
      ctx.addError(node, "Invalid property descriptor");
      return;
    }
    const obj = node.getSecond();
    const prop = node.getThird();
    await this.WalkNode(obj, ctx, wr);
    if ( ctx.isDefinedClass(obj.eval_type_name) ) {
      try {
        const currC = ctx.findClass(obj.eval_type_name);
        const varDef = currC.findVariable(prop.vref);
        if ( (typeof(varDef) !== "undefined" && varDef != null )  ) {
          prop.flow_done = true;
          prop.eval_type = 11;
          node.hasParamDesc = true;
          node.ownParamDesc = varDef;
          node.paramDesc = varDef;
          varDef.ref_cnt = 1 + varDef.ref_cnt;
          const vNameNode = varDef.nameNode;
          if ( (typeof(vNameNode) !== "undefined" && vNameNode != null )  ) {
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
          return;
        }
        const mDef = currC.findMethod(prop.vref);
        if ( (typeof(mDef) !== "undefined" && mDef != null )  ) {
          node.eval_type = 28;
          node.hasParamDesc = true;
          node.ownParamDesc = mDef;
          node.paramDesc = mDef;
          mDef.ref_cnt = 1 + mDef.ref_cnt;
          return;
        }
        ctx.addError(node, "Did not find property from class " + currC.name);
      } catch(e) {
        ctx.addError(node, "Not valid property access");
      }
    } else {
      ctx.addError(obj, "Can not access property of a non-class value");
    }
  };
  async WriteVRef (node, ctx, wr) {
    if ( node.vref == "_" ) {
      return;
    }
    if ( node.vref == "#" ) {
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
        node.eval_type = 13;
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
      node.eval_type = 10;
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
      if ( (typeof(vDef) !== "undefined" && vDef != null )  ) {
        node.hasParamDesc = true;
        node.ownParamDesc = vDef;
        node.paramDesc = vDef;
        vDef.ref_cnt = 1 + vDef.ref_cnt;
        const vNameNode = vDef.nameNode;
        if ( ctx.isDefinedClass(node.type_name) ) {
          const m = ctx.getCurrentMethod();
          m.addClassUsage(ctx.findClass(node.type_name), ctx);
        }
        if ( ctx.isDefinedClass(node.eval_type_name) ) {
          const m_1 = ctx.getCurrentMethod();
          m_1.addClassUsage(ctx.findClass(node.eval_type_name), ctx);
        }
        if ( (typeof(vNameNode) !== "undefined" && vNameNode != null )  ) {
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
      } else {
        ctx.addError(node, "Undefined variable");
      }
    } else {
      let class_or_this = rootObjName == this.getThisName();
      if ( ctx.isDefinedClass(rootObjName) ) {
        class_or_this = true;
        node.eval_type = 25;
        node.eval_type_name = rootObjName;
        const m_2 = ctx.getCurrentMethod();
        m_2.addClassUsage(ctx.findClass(rootObjName), ctx);
      }
      if ( ctx.hasTemplateNode(rootObjName) ) {
        class_or_this = true;
      }
      if ( false == class_or_this ) {
        const udesc = ctx.getCurrentClass();
        const desc = udesc;
        const opList = await ctx.getOpFns(node.vref);
        if ( ((((opList.length) > 0) || (node.vref == "fun")) || (node.vref == "fn")) || node.hasFlag("keyword") ) {
        } else {
          ctx.addError(node, (((("WriteVREF -> Undefined variable " + node.vref) + " in class ") + desc.name) + " node : ") + node.getCode());
          ctx.addError(node, (((("WriteVREF -> Undefined variable " + rootObjName) + " in class ") + desc.name) + " node : ") + node.parent.getCode());
          if ( (typeof(node.parent.parent) !== "undefined" && node.parent.parent != null )  ) {
            ctx.addError(node, (((("WriteVREF -> Undefined variable " + rootObjName) + " in class ") + desc.name) + " node : ") + node.parent.parent.getCode());
          }
        }
      }
      return;
    }
  };
  async EnterFn (node, ctx, wr, callback) {
    try {
      if ( (node.children.length) < 4 ) {
        ctx.addError(node, "Function has too few arguments");
        return;
      }
      /** unused:  let nameNode   **/ 
      let idx = 0;
      await operatorsOf.forEach_15(node.children, ((item, index) => { 
        if ( item.vref == "static" ) {
          idx = idx + 1;
        }
      }));
      const currClass = ctx.getCurrentClass();
      if ( typeof(currClass) === "undefined" ) {
        ctx.addError(node, "Current class was not defined when entering method");
        return;
      }
      await callback(node, ctx, wr, node.children[(idx + 1)], node.children[(idx + 2)], node.children[(idx + 3)], currClass);
    } catch(e) {
      ctx.addError(node, "Error parsing function " + (( e.toString())));
    }
  };
  async Constructor (node, ctx, wr) {
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
    };
    await this.WalkNodeChildren(fnBody, subCtx, wr);
    subCtx.unsetInMethod();
    if ( fnBody.didReturnAtIndex >= 0 ) {
      ctx.addError(node, "constructor should not return any values!");
    }
    for ( let i_1 = 0; i_1 < subCtx.localVarNames.length; i_1++) {
      var n = subCtx.localVarNames[i_1];
      const p = subCtx.localVariables[n];
      if ( p.set_cnt > 0 ) {
        if ( p.is_immutable ) {
          ctx.addError(node, "Immutable variable was assigned a value");
        }
        const defNode = p.node;
        defNode.setFlag("mutable");
        const nNode = p.nameNode;
        nNode.setFlag("mutable");
      }
    };
  };
  WriteScalarValue (node, ctx, wr) {
    TTypes.baseTypeAsEval(node, ctx, wr);
    node.evalTypeClass = TFactory.new_scalar_signature(node, ctx, wr);
  };
  async cmdNew (node, ctx, wr) {
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
    const b_template = false;
    let expects_error = false;
    const err_cnt = ctx.getErrorCount();
    if ( node.hasBooleanProperty("error") ) {
      expects_error = true;
    }
    if ( obj.has_vref_annotation ) {
      await this.CheckVRefTypeAnnotationOf(obj, ctx, wr);
    }
    await this.WalkNode(obj, ctx, wr);
    for ( let i = 0; i < params.children.length; i++) {
      var arg = params.children[i];
      ctx.setInExpr();
      await this.WalkNode(arg, ctx, wr);
      ctx.unsetInExpr();
    };
    node.eval_type = 10;
    node.eval_type_name = obj.vref;
    if ( b_template == false ) {
      currC = ctx.findClass(obj.vref);
      const currM = ctx.getCurrentMethod();
      currM.addClassUsage(currC, ctx);
    }
    node.hasNewOper = true;
    node.clDesc = currC;
    const fnDescr = currC.constructor_fn;
    if ( (typeof(fnDescr) !== "undefined" && fnDescr != null )  ) {
      if ( (fnDescr.params.length) > (params.children.length) ) {
        ctx.addError(node, "Not enough arguments for class constructor " + fnDescr.node.getLineAsString());
        return;
      }
      for ( let i_1 = 0; i_1 < fnDescr.params.length; i_1++) {
        var param = fnDescr.params[i_1];
        let has_default = false;
        if ( param.nameNode.hasFlag("default") ) {
          has_default = true;
        }
        if ( param.nameNode.hasFlag("keyword") ) {
          continue;
        }
        if ( (params.children.length) <= i_1 ) {
          if ( has_default ) {
            continue;
          }
          ctx.addError(node, "Missing arguments for function");
          ctx.addError(param.nameNode, "To fix the previous error: Check original function declaration");
        }
        const argNode = params.children[i_1];
        if ( false == await this.areEqualTypes((param.nameNode), argNode, ctx, wr) ) {
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
      };
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
  };
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
        };
        for ( let i_1 = 0; i_1 < copyOf.children.length; i_1++) {
          var ch = copyOf.children[i_1];
          item.children.push(ch);
        };
      }
      res.push(item);
    };
    return res;
  };
  transformParams2 (list, fnArgs, ctx) {
    let res = [];
    for ( let i = 0; i < list.length; i++) {
      var item = list[i];
      if ( item.is_block_node ) {
        console.log("Transforming --> " + item.getCode());
        /** unused:  const newNode = new CodeNode(item.code, item.sp, item.ep)   **/ 
        const nn = fnArgs[i];
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
        };
        for ( let i_1 = 0; i_1 < copyOf.children.length; i_1++) {
          var ch = copyOf.children[i_1];
          item.children.push(ch);
        };
      }
      res.push(item);
    };
    return res;
  };
  async CreateCTTI (node, ctx, orig_wr) {
    const root = ctx.getRoot();
    const wr = new CodeWriter();
    await operatorsOf_13.forEach_14(root.definedClasses, ((item, index) => { 
      if ( item.isNormalClass() ) {
        wr.raw(((("\n      operators {\n        class_name _:string ( " + item.name) + "@(keyword) ) {\n          templates {\n            * ( '\"") + item.name) + "\"' )\n          }\n        }\n      }    \n          ", true);
      }
    }));
    await root.pushAndCollectCode(wr.getCode(), orig_wr);
  };
  async CreateRTTI (node, ctx, orig_wr) {
    const root = ctx.getRoot();
    const wr = new CodeWriter();
    wr.out("operator type:void all {", true);
    wr.indent(1);
    wr.out("fn rtti_get_classes:[string] () {", true);
    wr.indent(1);
    wr.out("return ([] ", false);
    await operatorsOf_13.forEach_14(root.definedClasses, ((item, index) => { 
      if ( item.isNormalClass() ) {
        wr.out(("'" + item.name) + "' ", false);
      }
    }));
    wr.out(")", true);
    wr.indent(-1);
    wr.out("}", true);
    wr.out("fn rtti_get_fields:[RTTIClassField] (className:string) {", true);
    wr.indent(1);
    wr.out("def fields:[RTTIClassField]", true);
    await operatorsOf_13.forEach_14(root.definedClasses, ((item, index) => { 
      if ( item.isNormalClass() ) {
        wr.out(("if(className == '" + item.name) + "') {", true);
        wr.indent(1);
        operatorsOf.forEach_11(item.variables, ((item, index) => { 
          wr.out("def f (new RTTIClassField)", true);
          wr.out(("f.name = `" + item.compiledName) + "`", true);
          wr.out(("f.type_name = `" + item.nameNode.type_name) + "`", true);
          wr.out("push fields f", true);
        }));
        wr.indent(-1);
        wr.out("}", true);
      }
    }));
    wr.out("return fields", true);
    wr.indent(-1);
    wr.out("}", true);
    wr.indent(-1);
    wr.out("}", true);
    await root.pushAndCollectCode(wr.getCode(), orig_wr);
  };
  async SolveAsyncFuncs (node, ctx, wr) {
    const root = ctx.getRoot();
    await operatorsOf_13.forEach_14(root.definedClasses, (async (item, index) => { 
      await operatorsOf.forEach_29(item.static_methods, (async (item, index) => { 
        /** unused:  const thisFn = item   **/ 
        let set_async = ((f) => { 
        });
        let visited = [];
        set_async = (async (f) => { 
          if ( (visited.indexOf(f)) >= 0 ) {
            return;
          }
          visited.push(f);
          if ( (typeof(f.nameNode) !== "undefined" && f.nameNode != null )  ) {
            f.nameNode.setFlag("async");
          }
          await operatorsOf.forEach_29(f.isCalledBy, ((item, index) => { 
            set_async(item);
          }));
          if ( (typeof(f.insideFn) !== "undefined" && f.insideFn != null )  ) {
            await set_async(f.insideFn);
          }
        });
        if ( (typeof(item.nameNode) !== "undefined" && item.nameNode != null )  ) {
          if ( item.nameNode.hasFlag("async") ) {
            await operatorsOf.forEach_29(item.isCalledBy, ((item, index) => { 
              set_async(item);
            }));
            await item.forOtherVersions(ctx, ((item) => { 
              set_async(item);
            }));
            if ( (typeof(item.insideFn) !== "undefined" && item.insideFn != null )  ) {
              await set_async(item.insideFn);
            }
          }
        }
        await operatorsOf.forEach_29(item.myLambdas, (async (item, index) => { 
          if ( (typeof(item.nameNode) !== "undefined" && item.nameNode != null )  ) {
            if ( item.nameNode.hasFlag("async") ) {
              await operatorsOf.forEach_29(item.isCalledBy, ((item, index) => { 
                set_async(item);
              }));
              if ( (typeof(item.insideFn) !== "undefined" && item.insideFn != null )  ) {
                await set_async(item.insideFn);
              }
            }
          }
        }));
      }));
      await operatorsOf_13.forEach_30(item.method_variants, (async (item, index) => { 
        await operatorsOf.forEach_29(item.variants, (async (item, index) => { 
          /** unused:  const thisFn_1 = item   **/ 
          let set_async_1 = ((f) => { 
          });
          let visited_1 = [];
          set_async_1 = (async (f) => { 
            if ( (visited_1.indexOf(f)) >= 0 ) {
              return;
            }
            visited_1.push(f);
            if ( (typeof(f.nameNode) !== "undefined" && f.nameNode != null )  ) {
              f.nameNode.setFlag("async");
            }
            await f.forOtherVersions(ctx, ((item) => { 
              set_async_1(item);
            }));
            await operatorsOf.forEach_29(f.isCalledBy, ((item, index) => { 
              set_async_1(item);
            }));
            if ( (typeof(f.insideFn) !== "undefined" && f.insideFn != null )  ) {
              await set_async_1(f.insideFn);
            }
          });
          if ( (typeof(item.nameNode) !== "undefined" && item.nameNode != null )  ) {
            if ( item.nameNode.hasFlag("async") ) {
              await operatorsOf.forEach_29(item.isCalledBy, ((item, index) => { 
                set_async_1(item);
              }));
              await item.forOtherVersions(ctx, ((item) => { 
                set_async_1(item);
              }));
              if ( (typeof(item.insideFn) !== "undefined" && item.insideFn != null )  ) {
                await set_async_1(item.insideFn);
              }
            }
          }
          await operatorsOf.forEach_29(item.myLambdas, (async (item, index) => { 
            if ( (typeof(item.nameNode) !== "undefined" && item.nameNode != null )  ) {
              if ( item.nameNode.hasFlag("async") ) {
                await operatorsOf.forEach_29(item.isCalledBy, ((item, index) => { 
                  set_async_1(item);
                }));
                if ( (typeof(item.insideFn) !== "undefined" && item.insideFn != null )  ) {
                  await set_async_1(item.insideFn);
                }
              }
            }
          }));
        }));
      }));
    }));
    let notUsedFunctionCnt = 0;
    await operatorsOf_13.forEach_14(root.definedClasses, (async (item, index) => { 
      await operatorsOf_13.forEach_30(item.method_variants, (async (item, index) => { 
        await operatorsOf.forEach_29(item.variants, ((item, index) => { 
          if ( (item.isCalledBy.length) == 0 ) {
            if ( (typeof(item.container_class) !== "undefined" && item.container_class != null )  ) {
              const cc = item.container_class;
              if ( ((cc.extends_classes.length) > 0) || cc.is_inherited ) {
                const eC = cc.extends_classes[0];
                ctx.findClass(eC);
              } else {
                notUsedFunctionCnt = notUsedFunctionCnt + 1;
                item.is_unsed = true;
              }
            }
          }
        }));
      }));
    }));
    const add_dce_fn = (async (theFn) => { 
      let set_called = ((f) => { 
      });
      set_called = (async (f) => { 
        if ( f.is_called_from_main ) {
          return;
        }
        f.is_called_from_main = true;
        operatorsOf.forEach_31(f.isUsingClasses, ((item, index) => { 
          item.is_used_by_main = true;
          if ( (typeof(item.constructor_fn) !== "undefined" && item.constructor_fn != null )  ) {
            set_called(item.constructor_fn);
          }
        }));
        await f.forOtherVersions(ctx, ((item) => { 
          set_called(item);
        }));
        await operatorsOf.forEach_29(f.isCalling, ((item, index) => { 
          set_called(item);
        }));
        await operatorsOf.forEach_29(f.myLambdas, ((item, index) => { 
          set_called(item);
        }));
        if ( (typeof(f.container_class) !== "undefined" && f.container_class != null )  ) {
          if ( (typeof(f.container_class.constructor_fn) !== "undefined" && f.container_class.constructor_fn != null )  ) {
            await set_called(f.container_class.constructor_fn);
          }
        }
      });
      await set_called(theFn);
    });
    let use_dce = false;
    if ( ctx.hasCompilerFlag("dead4main") ) {
      let mainFn;
      await operatorsOf_13.forEach_14(root.definedClasses, ((item, index) => { 
        const cl = item;
        for ( let i = 0; i < cl.static_methods.length; i++) {
          var variant = cl.static_methods[i];
          ctx.disableCurrentClass();
          if ( variant.nameNode.hasFlag("main") && (variant.nameNode.code.filename == ctx.getRootFile()) ) {
            mainFn = variant;
            mainFn.addClassUsage(cl, ctx);
          }
        };
      }));
      if ( (typeof(mainFn) !== "undefined" && mainFn != null )  ) {
        await add_dce_fn(mainFn);
        use_dce = true;
      }
    }
    if ( ctx.hasCompilerSetting("dceclass") ) {
      const dc = ctx.getCompilerSetting("dceclass");
      console.log("DCE : " + dc);
      await operatorsOf_13.forEach_14(root.definedClasses, (async (item, index) => { 
        const cl_1 = item;
        if ( cl_1.name == dc ) {
          use_dce = true;
          cl_1.is_used_by_main = true;
          for ( let i_1 = 0; i_1 < cl_1.static_methods.length; i_1++) {
            var variant_1 = cl_1.static_methods[i_1];
            await add_dce_fn(variant_1);
          };
          await operatorsOf_13.forEach_30(item.method_variants, (async (item, index) => { 
            await operatorsOf.forEach_29(item.variants, ((item, index) => { 
              add_dce_fn(item);
            }));
          }));
        }
      }));
    }
    if ( use_dce ) {
      const verbose = ctx.hasCompilerFlag("verbose");
      await operatorsOf_13.forEach_14(root.definedClasses, (async (item, index) => { 
        if ( (item.is_used_by_main == false) && verbose ) {
          console.log("class not used by main : " + item.name);
        }
        item.static_methods = operatorsOf.filter_32(item.static_methods, ((item, index) => { 
          const cc_1 = item.container_class;
          if ( item.is_called_from_main == false ) {
            if ( verbose ) {
              console.log((("removing as dead " + item.name) + " from ") + cc_1.name);
            }
          }
          return item.is_called_from_main;
        }));
        await operatorsOf_13.forEach_30(item.method_variants, ((item, index) => { 
          item.variants = operatorsOf.filter_32(item.variants, ((item, index) => { 
            const cc_2 = item.container_class;
            if ( item.is_called_from_main == false ) {
              if ( verbose ) {
                console.log((("removing as dead " + item.name) + " from ") + cc_2.name);
              }
            }
            return item.is_called_from_main;
          }));
        }));
      }));
    }
    if ( ctx.hasCompilerFlag("deadcode") ) {
      await operatorsOf_13.forEach_14(root.definedClasses, (async (item, index) => { 
        await operatorsOf_13.forEach_30(item.method_variants, ((item, index) => { 
          item.variants = operatorsOf.filter_32(item.variants, ((item, index) => { 
            return item.is_unsed == false;
          }));
        }));
      }));
    }
  };
  async cmdCall (node, ctx, wr) {
    const obj = node.getSecond();
    const method = node.getThird();
    const callArgs = node.children[3];
    const possible_cmd = method.vref;
    const altVersion = node.newExpressionNode();
    const origCopy = node.copy();
    altVersion.add(node.newVRefNode(possible_cmd));
    altVersion.add(obj.copy());
    for ( let i = 0; i < callArgs.children.length; i++) {
      var ca = callArgs.children[i];
      altVersion.add(ca.copy());
    };
    altVersion.parent = node;
    node.getChildrenFrom(altVersion);
    if ( await this.stdParamMatch(node, ctx, wr, false) ) {
      return true;
    } else {
      node.getChildrenFrom(origCopy);
    }
    const obj_2 = node.getSecond();
    const method_2 = node.getThird();
    const callArgs_2 = node.children[3];
    await this.WalkNode(obj_2, ctx, wr);
    if ( ctx.isDefinedClass(obj_2.eval_type_name) ) {
      const cl = ctx.findClass(obj_2.eval_type_name);
      const m = cl.findMethod(method_2.vref);
      if ( (typeof(m) !== "undefined" && m != null )  ) {
        node.has_call = true;
        const currM = ctx.getCurrentMethod();
        currM.addCallTo(m);
        ctx.setInExpr();
        for ( let i_1 = 0; i_1 < callArgs_2.children.length; i_1++) {
          var callArg = callArgs_2.children[i_1];
          await this.WalkNode(callArg, ctx, wr);
        };
        ctx.unsetInExpr();
        const nn = m.nameNode;
        node.eval_type = nn.typeNameAsType(ctx);
        node.eval_type_name = nn.type_name;
        node.eval_array_type = nn.array_type;
        node.eval_key_type = nn.key_type;
        if ( m.nameNode.hasFlag("throws") ) {
          if ( false == ctx.isTryBlock() ) {
            ctx.addError(obj_2, ("The method " + m.name) + " potentially throws an exception, try { } block is required");
          }
        }
        if ( nn.value_type == 17 ) {
          node.expression_value = nn.expression_value.copy();
        }
        if ( nn.hasFlag("optional") ) {
          node.setFlag("optional");
        }
        return true;
      } else {
        ctx.addError(node, (("Class " + obj_2.eval_type_name) + " does not have method ") + method_2.vref);
        return false;
      }
    } else {
      ctx.addError(node, "can not call non-class type");
    }
    return true;
  };
  async matchLambdaArgs (n1, n2, ctx, wr) {
    const chLen1 = n1.children.length;
    const chLen2 = n2.children.length;
    if ( chLen1 < 2 ) {
      ctx.addError(n1, "Invalid Lambda definition, missing args or return value");
      ctx.addError(n2, "^ Invalid Lambda definition, missing args or return value");
      return false;
    }
    if ( chLen2 < 2 ) {
      ctx.addError(n1, "Invalid Lambda definition, missing args or return value");
      ctx.addError(n2, "^ Invalid Lambda definition, missing args or return value");
      return false;
    }
    const rv1 = n1.getFirst();
    const args1 = n1.getSecond();
    const rv2 = n2.getFirst();
    const args2 = n2.getSecond();
    const rvExpr1 = n1.newExpressionNode();
    (rvExpr1).push(rv1.copy());
    const rvExpr2 = n2.newExpressionNode();
    (rvExpr2).push(rv2.copy());
    const argsExpr1 = args1.copy();
    const argsExpr2 = args2.copy();
    let all_matched = true;
    if ( (argsExpr1.children.length) != (argsExpr2.children.length) ) {
      ctx.addError(n2, "Invalid parameter count for the lambda expression");
      return false;
    }
    await operatorsOf.forEach_15(argsExpr1.children, (async (item, index) => { 
      const item2 = argsExpr2.children[index];
      if ( item2.value_type != item.value_type ) {
        all_matched = false;
      }
      if ( item2.type_name != item.type_name ) {
        all_matched = false;
      }
      if ( item2.array_type != item.array_type ) {
        all_matched = false;
      }
      if ( item2.key_type != item.key_type ) {
        all_matched = false;
      }
      if ( all_matched && (item.value_type == 17) ) {
        if ( false == await this.matchLambdaArgs((item.expression_value), (item2.expression_value), ctx, wr) ) {
          all_matched = false;
        }
      }
    }));
    if ( all_matched == false ) {
      ctx.addError(n2, "Invalid lambda argument types");
      return false;
    }
    await operatorsOf.forEach_15(rvExpr1.children, (async (item, index) => { 
      const item2_1 = rvExpr2.children[index];
      if ( item2_1.value_type != item.value_type ) {
        all_matched = false;
      }
      if ( item2_1.type_name != item.type_name ) {
        all_matched = false;
      }
      if ( item2_1.array_type != item.array_type ) {
        all_matched = false;
      }
      if ( item2_1.key_type != item.key_type ) {
        all_matched = false;
      }
      if ( all_matched && (item.value_type == 17) ) {
        if ( false == await this.matchLambdaArgs((item.expression_value), (item2_1.expression_value), ctx, wr) ) {
          all_matched = false;
        }
      }
    }));
    if ( all_matched == false ) {
      ctx.addError(n2, "Invalid lambda return value type");
      return false;
    }
    return true;
  };
  async testLambdaCallArgs (lambda_expression, callParams, ctx, wr) {
    /** unused:  const lambdaDef = lambda_expression.children[0]   **/ 
    const lambdaArgs = lambda_expression.children[1];
    let all_matched = true;
    if ( (callParams.children.length) != (lambdaArgs.children.length) ) {
      ctx.addError(callParams, "Invalid parameter count for the lambda expression ");
      ctx.addError(callParams, " ^ expected : " + lambdaArgs.getCode());
      all_matched = false;
    }
    await operatorsOf.forEach_15(lambdaArgs.children, ((item, index) => { 
      const item2 = callParams.children[index];
      if ( item2.eval_type_name != item.type_name ) {
        if ( item.type_name != "Any" ) {
          ctx.addError(item2, "Argument of wrong type given for the lambda parameter " + index);
          all_matched = false;
        }
      }
      if ( item2.eval_array_type != item.array_type ) {
        ctx.addError(item2, "Argument of wrong type given for the lambda parameter " + index);
        all_matched = false;
      }
      if ( item2.eval_key_type != item.key_type ) {
        ctx.addError(item2, "Argument of wrong type given for the lambda parameter " + index);
        all_matched = false;
      }
    }));
    if ( all_matched == false ) {
      ctx.addError(callParams, "Invalid types for lambda call");
    }
    return all_matched;
  };
  async cmdLocalCall (node, ctx, wr) {
    const fnNode = node.getFirst();
    const udesc = ctx.getCurrentClass();
    const desc = udesc;
    let expects_error = false;
    const err_cnt = ctx.getErrorCount();
    if ( node.hasBooleanProperty("error") ) {
      expects_error = true;
    }
    const chlen = node.children.length;
    if ( chlen > 2 ) {
      let i = 2;
      /** unused:  const chainRoot = node   **/ 
      let innerNode;
      const newNode = node.newExpressionNode();
      const sc = node.getSecond();
      newNode.add(fnNode.copy());
      newNode.add(sc.copy());
      innerNode = newNode;
      let chain_cnt = 0;
      let b_valid = true;
      while (i < (chlen - 1)) {
        const fc = node.children[i];
        const args = node.children[(i + 1)];
        const name = fc.vref;
        if ( ((name.length) > 0) && ((name.charCodeAt(0 )) == (".".charCodeAt(0))) ) {
          const method_name = name.substring(1, (name.length) );
          const newNode_1 = node.newExpressionNode();
          newNode_1.add(node.newVRefNode("call"));
          newNode_1.add(innerNode.copy());
          newNode_1.add(node.newVRefNode(method_name));
          newNode_1.add(args.copy());
          innerNode = newNode_1;
          chain_cnt = chain_cnt + 1;
        } else {
          b_valid = false;
        }
        i = i + 2;
      };
      if ( b_valid && (chain_cnt > 0) ) {
        node.getChildrenFrom(innerNode);
        node.tag = "chainroot";
        node.flow_done = false;
        await this.WalkNode(node, ctx, wr);
        return true;
      }
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
      if ( (typeof(vFnDef) !== "undefined" && vFnDef != null )  ) {
        if ( vFnDef.nameNode.hasFlag("throws") ) {
          if ( false == ctx.isTryBlock() ) {
            ctx.addError(node, ("The method " + vFnDef.name) + " potentially throws an exception, try { } block is required");
          }
        }
        const currM = ctx.getCurrentMethod();
        currM.addCallTo(vFnDef);
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
        await this.WalkNode(fnNode, subCtx, wr);
        const callParams = node.children[1];
        let keyword_cnt = 0;
        operatorsOf.forEach_11(vFnDef.params, ((item, index) => { 
          if ( item.nameNode.hasFlag("keyword") ) {
            keyword_cnt = keyword_cnt + 1;
            (callParams.children[index]).setFlag("keyword");
          }
        }));
        const nodeList = this.transformParams(callParams.children, vFnDef.params, subCtx);
        if ( ctx.hasCompilerFlag("dbg") ) {
          console.log("Local: " + vFnDef.name);
        }
        for ( let i_1 = 0; i_1 < nodeList.length; i_1++) {
          var arg = nodeList[i_1];
          ctx.setInExpr();
          let was_lambda = false;
          if ( arg.isFirstVref("fun") ) {
            arg.flow_done = false;
            await arg.forTree(((item, i) => { 
              item.flow_done = false;
            }));
            was_lambda = true;
          }
          await this.WalkNode(arg, subCtx, wr);
          if ( was_lambda ) {
            const currM_1 = ctx.getCurrentMethod();
            if ( (typeof(arg.lambdaFnDesc) !== "undefined" && arg.lambdaFnDesc != null )  ) {
              vFnDef.addCallTo(arg.lambdaFnDesc);
              currM_1.addCallTo(vFnDef);
              currM_1.myLambdas.push(arg.lambdaFnDesc);
              vFnDef.myLambdas.push(arg.lambdaFnDesc);
            }
            await arg.forTree(((item, i) => { 
              if ( (typeof(item.lambdaFnDesc) !== "undefined" && item.lambdaFnDesc != null )  ) {
                item.lambdaFnDesc.insideFn = currM_1;
              }
              if ( (typeof(item.fnDesc) !== "undefined" && item.fnDesc != null )  ) {
                if ( (typeof(arg.lambdaFnDesc) !== "undefined" && arg.lambdaFnDesc != null )  ) {
                  arg.lambdaFnDesc.addCallTo(item.fnDesc);
                }
                vFnDef.addCallTo(item.fnDesc);
              }
            }));
          }
          ctx.unsetInExpr();
          if ( (vFnDef.params.length) > i_1 ) {
            const fnArg = vFnDef.params[i_1];
            const callArgP = arg.paramDesc;
            if ( (typeof(callArgP) !== "undefined" && callArgP != null )  ) {
              callArgP.moveRefTo(node, fnArg, ctx);
            }
          }
        };
        const cp_len = (callParams.children.length) - keyword_cnt;
        if ( cp_len > (vFnDef.params.length) ) {
          const lastCallParam = callParams.children[(cp_len - 1)];
          ctx.addError(lastCallParam, "Too many arguments for function");
          ctx.addError(vFnDef.nameNode, "NOTE: To fix the previous error: Check original function declaration which was");
        }
        for ( let i_2 = 0; i_2 < vFnDef.params.length; i_2++) {
          var param = vFnDef.params[i_2];
          if ( (callParams.children.length) <= i_2 ) {
            if ( param.nameNode.hasFlag("default") ) {
              continue;
            }
            ctx.addError(node, "Missing arguments for function");
            ctx.addError(param.nameNode, "NOTE: To fix the previous error: Check original function declaration which was");
            break;
          }
          if ( param.nameNode.hasFlag("keyword") ) {
            continue;
          }
          const argNode = callParams.children[i_2];
          if ( false == await this.areEqualTypes((param.nameNode), argNode, ctx, wr) ) {
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
        };
        const nn = vFnDef.nameNode;
        node.eval_type = nn.typeNameAsType(ctx);
        node.eval_type_name = nn.type_name;
        node.eval_array_type = nn.array_type;
        node.eval_key_type = nn.key_type;
        if ( node.eval_type == 17 ) {
          node.expression_value = nn.expression_value.copy();
        }
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
      if ( fnDescr.nameNode.hasFlag("throws") ) {
        if ( false == ctx.isTryBlock() ) {
          ctx.addError(node, ("The method " + fnDescr.name) + " potentially throws an exception, try { } block is required");
        }
      }
      const currM_2 = ctx.getCurrentMethod();
      currM_2.addCallTo(fnDescr);
      if ( ctx.hasCompilerFlag("dbg") ) {
        console.log("Local 2 : " + fnDescr.name);
      }
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
      await this.WalkNode(fnNode, subCtx_1, wr);
      for ( let i_3 = 0; i_3 < node.children.length; i_3++) {
        var arg_1 = node.children[i_3];
        if ( i_3 < 1 ) {
          continue;
        }
        ctx.setInExpr();
        await this.WalkNode(arg_1, subCtx_1, wr);
        ctx.unsetInExpr();
      };
      for ( let i_4 = 0; i_4 < fnDescr.params.length; i_4++) {
        var param_1 = fnDescr.params[i_4];
        if ( (node.children.length) <= (i_4 + 1) ) {
          ctx.addError(node, "Argument was not defined");
          break;
        }
        const argNode_1 = node.children[(i_4 + 1)];
        if ( false == await this.areEqualTypes((param_1.nameNode), argNode_1, ctx, wr) ) {
          ctx.addError(argNode_1, (("ERROR, invalid argument type for " + desc.name) + " method ") + fnDescr.name);
        }
      };
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
      if ( d.nameNode.hasFlag("optional") ) {
        ctx.addError(node, "Can not call optional lambda function, unwrap the function first!");
      }
      if ( d.nameNode.value_type == 17 ) {
        const cnNode1 = node.children[0];
        await this.WalkNode(cnNode1, ctx, wr);
        /** unused:  const lambdaDefArgs = d.nameNode.expression_value.children[1]   **/ 
        const callParams_1 = node.children[1];
        for ( let i_5 = 0; i_5 < callParams_1.children.length; i_5++) {
          var arg_2 = callParams_1.children[i_5];
          ctx.setInExpr();
          await this.WalkNode(arg_2, ctx, wr);
          ctx.unsetInExpr();
        };
        await this.testLambdaCallArgs(d.nameNode.expression_value, callParams_1, ctx, wr);
        const lambdaDef = d.nameNode.expression_value.children[0];
        node.has_lambda_call = true;
        node.eval_type = lambdaDef.typeNameAsType(ctx);
        node.eval_type_name = lambdaDef.type_name;
        node.eval_array_type = lambdaDef.array_type;
        node.eval_key_type = lambdaDef.key_type;
        if ( node.eval_type == 17 ) {
          if ( (typeof(lambdaDef.expression_value) !== "undefined" && lambdaDef.expression_value != null )  ) {
            node.expression_value = lambdaDef.expression_value.copy();
          }
        }
        return true;
      }
    }
    return false;
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
  };
  transformImmutableAssigment (node) {
    const target = node.getSecond();
    const assign_value = node.getThird();
    const root = node.newExpressionNode();
    root.add(node.newVRefNode("="));
    root.add(node.newVRefNode((target.ns[0])));
    let i = 1;
    const cnt = target.ns.length;
    /** unused:  const valueExpression = node.newExpressionNode()   **/ 
    let obj_ref = target.ns[0];
    let currentParent = root;
    while (i < cnt) {
      const callExpr = node.newExpressionNode();
      callExpr.add(node.newVRefNode("call"));
      callExpr.add(node.newVRefNode(obj_ref));
      const next_ref = target.ns[i];
      const set_ref = "set_" + next_ref;
      callExpr.add(node.newVRefNode(set_ref));
      i = i + 1;
      if ( i < cnt ) {
        obj_ref = (obj_ref + ".") + next_ref;
        const paramsNode = node.newExpressionNode();
        paramsNode.add(callExpr);
        currentParent.add(paramsNode);
        currentParent = callExpr;
      } else {
        const callParams = node.newExpressionNode();
        callParams.add(assign_value.copy());
        callExpr.add(callParams);
        const paramsNode_1 = node.newExpressionNode();
        paramsNode_1.add(callExpr.copy());
        currentParent.add(paramsNode_1);
      }
    };
    return root;
  };
  async cmdAssign (node, ctx, wr) {
    const target = node.getSecond();
    await this.WalkNode(target, ctx, wr);
    if ( target.hasParamDesc ) {
      if ( (typeof(target.paramDesc.propertyClass) !== "undefined" && target.paramDesc.propertyClass != null )  ) {
        const nn = target.paramDesc.propertyClass.nameNode;
        if ( nn.hasFlag("immutable") ) {
          let do_transform = false;
          const propC = target.paramDesc.propertyClass;
          const currC = ctx.getCurrentClass();
          if ( (currC) == (propC) ) {
            if ( (target.ns[0]) == "this" ) {
              do_transform = true;
            }
          } else {
            do_transform = true;
          }
          if ( do_transform ) {
            const n1 = node.getSecond();
            const n2 = node.getThird();
            await this.WalkNode(n1, ctx, wr);
            ctx.setInExpr();
            await this.WalkNode(n2, ctx, wr);
            ctx.unsetInExpr();
            await this.convertToUnion(n1.eval_type_name, n2, ctx, wr);
            this.shouldBeEqualTypes(n1, n2, ctx, "Can not assign variable.");
            const immAss = this.transformImmutableAssigment(node);
            node.getChildrenFrom(immAss);
            await this.cmdAssign(node, ctx, wr);
            return;
          }
        }
      }
    }
    /** unused:  const chlen = node.children.length   **/ 
    wr.newline();
    const n1_1 = node.getSecond();
    const n2_1 = node.getThird();
    await this.WalkNode(n1_1, ctx, wr);
    ctx.setInExpr();
    await this.WalkNode(n2_1, ctx, wr);
    ctx.unsetInExpr();
    if ( n1_1.hasParamDesc ) {
      n1_1.paramDesc.ref_cnt = n1_1.paramDesc.ref_cnt + 1;
      n1_1.paramDesc.set_cnt = n1_1.paramDesc.set_cnt + 1;
    }
    if ( n2_1.hasParamDesc ) {
      n2_1.paramDesc.ref_cnt = n2_1.paramDesc.ref_cnt + 1;
    }
    if ( n2_1.hasFlag("optional") ) {
      if ( false == n1_1.hasFlag("optional") ) {
        ctx.addError(node, "Can not assign optional to non-optional type");
      }
    }
    await this.stdParamMatch(node, ctx, wr, true);
    await this.convertToUnion(n1_1.eval_type_name, n2_1, ctx, wr);
    this.shouldBeEqualTypes(n1_1, n2_1, ctx, "Can not assign variable.");
  };
  EnterTemplateClass (node, ctx, wr) {
  };
  async EnterClass (node, ctx, wr) {
    const body_index = node.chlen() - 1;
    if ( (node.children.length) != 3 ) {
      if ( node.chlen() == 5 ) {
      } else {
        ctx.addError(node, "Invalid class declaration");
        return;
      }
    }
    if ( node.hasBooleanProperty("trait") ) {
      return;
    }
    const cn = node.children[1];
    const cBody = node.children[body_index];
    const desc = ctx.findClass(cn.vref);
    const subCtx = desc.ctx;
    subCtx.setCurrentClass(desc);
    subCtx.class_level_context = true;
    for ( let i = 0; i < desc.variables.length; i++) {
      var p = desc.variables[i];
      const vNode = p.node;
      if ( (vNode.children.length) > 2 ) {
        const value = vNode.children[2];
        ctx.setInExpr();
        await this.WalkNode(value, ctx, wr);
        ctx.unsetInExpr();
      }
      p.is_class_variable = true;
      p.nameNode.eval_type = p.nameNode.typeNameAsType(ctx);
      p.nameNode.eval_type_name = p.nameNode.type_name;
    };
    for ( let i_1 = 0; i_1 < cBody.children.length; i_1++) {
      var fNode = cBody.children[i_1];
      if ( (fNode.isFirstVref("fn") || fNode.isFirstVref("constructor")) || fNode.isFirstVref("Constructor") ) {
        await this.WalkNode(fNode, subCtx, wr);
      }
    };
    for ( let i_2 = 0; i_2 < cBody.children.length; i_2++) {
      var fNode_1 = cBody.children[i_2];
      if ( fNode_1.isFirstVref("fn") || fNode_1.isFirstVref("PublicMethod") ) {
        await this.WalkNode(fNode_1, subCtx, wr);
      }
    };
    const staticCtx = ctx.fork();
    staticCtx.setCurrentClass(desc);
    for ( let i_3 = 0; i_3 < cBody.children.length; i_3++) {
      var fNode_2 = cBody.children[i_3];
      if ( (fNode_2.isFirstVref("sfn") || fNode_2.isFirstVref("StaticMethod")) || fNode_2.isFirstVref("static") ) {
        await this.WalkNode(fNode_2, staticCtx, wr);
      }
    };
    await operatorsOf.forEach_15(cBody.children, ((item, index) => { 
      try {
        if ( item.isFirstVref("doc") ) {
          const sc = item.getSecond();
          const fndesc = desc.findMethod(sc.vref);
          if ( typeof(fndesc) != "undefined" ) {
            const third = item.getThird();
            fndesc.git_doc = third.string_value;
          }
        }
      } catch(e) {
      }
    }));
    node.hasClassDescription = true;
    node.clDesc = desc;
    desc.classNode = node;
  };
  async walkFunctionBody (m, fnBody, ctx, subCtx, wr) {
    /** unused:  const prev_fnc = subCtx.function_level_context   **/ 
    /** unused:  const prev_isfn = subCtx.is_function   **/ 
    subCtx.function_level_context = true;
    subCtx.is_function = true;
    subCtx.currentMethod = m;
    for ( let i = 0; i < m.params.length; i++) {
      var v = m.params[i];
      if ( false == subCtx.isVarDefined(v.name) ) {
        subCtx.defineVariable(v.name, v);
      }
      v.nameNode.eval_type = v.nameNode.typeNameAsType(subCtx);
      v.nameNode.eval_type_name = v.nameNode.type_name;
      ctx.hadValidType(v.nameNode);
      if ( ctx.isDefinedClass(v.nameNode.type_name) ) {
        const cl = ctx.findClass(v.nameNode.type_name);
        m.addClassUsage(cl, ctx);
      }
      if ( ctx.isDefinedClass(v.nameNode.array_type) ) {
        const cl_1 = ctx.findClass(v.nameNode.array_type);
        m.addClassUsage(cl_1, ctx);
      }
    };
    subCtx.setInMethod();
    await this.WalkNodeChildren(fnBody, subCtx, wr);
    subCtx.unsetInMethod();
    if ( fnBody.didReturnAtIndex == -1 ) {
      if ( m.nameNode.type_name != "void" ) {
        if ( false == ctx.getFlag("in_task") ) {
          ctx.addError(m.nameNode, "Function does not return any values!");
        }
      }
    } else {
      if ( (m.nameNode.type_name == "void") || ((((m.nameNode.type_name.length) > 0) == false) && (((m.nameNode.array_type.length) > 0) == false)) ) {
        if ( false == ctx.getFlag("in_task") ) {
          const rvNode = fnBody.children[fnBody.didReturnAtIndex];
          if ( (rvNode.children.length) > 1 ) {
            ctx.addError(m.nameNode, "No return value type defined for a function which returns value");
            ctx.addError(rvNode, "Returning value from a function without set return value");
          }
        }
      }
    }
    for ( let i_1 = 0; i_1 < subCtx.localVarNames.length; i_1++) {
      var n = subCtx.localVarNames[i_1];
      const p = subCtx.localVariables[n];
      if ( p.set_cnt > 0 ) {
        if ( p.is_immutable ) {
          ctx.addError(p.nameNode, "Immutable variable was assigned a value");
        }
        const defNode = p.node;
        defNode.setFlag("mutable");
        const nNode = p.nameNode;
        nNode.setFlag("mutable");
      }
    };
  };
  async EnterMethod (node, ctx, wr) {
    await this.EnterFn(node, ctx, wr, (async (node, ctx, wr, nameNode, fnArgs, fnBody, desc) => { 
      const m = desc.findMethod(nameNode.vref);
      const subCtx = m.fnCtx;
      await this.walkFunctionBody(m, fnBody, ctx, subCtx, wr);
    }));
  };
  async EnterStaticMethod (node, ctx, wr) {
    await this.EnterFn(node, ctx, wr, (async (node, ctx, wr, nameNode, fnArgs, fnBody, desc) => { 
      const m = desc.findStaticMethod(nameNode.vref);
      const subCtx = ctx.fork();
      m.fnCtx = subCtx;
      subCtx.in_static_method = true;
      await this.walkFunctionBody(m, fnBody, ctx, subCtx, wr);
      subCtx.in_static_method = false;
    }));
  };
  async DefineArrowOpFn (node, ctx, wr) {
    const myName = ctx.createNewOpFnName();
    const argsNode = CodeNode.expressionNode();
    const fBody = node.copy();
    fBody.children.splice(0, 1);
    const opNode = CodeNode.fromList([CodeNode.vref1("defn"), CodeNode.vref1(myName), argsNode, fBody]);
    const setArg = ((idx) => { 
      let i = argsNode.children.length;
      while (i <= idx) {
        argsNode.children.push(CodeNode.vref1(((myName + "_arg") + i)));
        i = i + 1;
      };
    });
    await fBody.forTree((async (item, i) => { 
      await operatorsOf.forEach_15(item.attrs, (async (item, index) => { 
        await item.forTree(((item, i) => { 
          if ( (item.vref.length) > 0 ) {
            if ( item.vref == "_" ) {
              setArg(0);
              item.vref = myName + "_arg0";
            }
            const parts = item.vref.split("_");
            if ( (parts.length) == 2 ) {
              const rest = parts[1];
              const nbr = isNaN( parseInt(rest) ) ? undefined : parseInt(rest);
              if ( (typeof(nbr) !== "undefined" && nbr != null )  ) {
                const n = nbr;
                setArg(n - 1);
                item.vref = (myName + "_arg") + (n - 1);
              }
            }
          }
        }));
      }));
      if ( (item.vref.length) > 0 ) {
        if ( item.vref == "_" ) {
          await setArg(0);
          item.vref = myName + "_arg0";
        }
        const parts_1 = item.vref.split("_");
        if ( (parts_1.length) == 2 ) {
          const rest_1 = parts_1[1];
          const nbr_1 = isNaN( parseInt(rest_1) ) ? undefined : parseInt(rest_1);
          if ( (typeof(nbr_1) !== "undefined" && nbr_1 != null )  ) {
            const n_1 = nbr_1;
            await setArg(n_1 - 1);
            item.vref = (myName + "_arg") + (n_1 - 1);
          }
        }
      }
    }));
    ctx.addOpFn(myName, opNode);
    node.children.length = 0;
    node.vref = myName;
    node.expression = false;
  };
  DefineOpFn (node, ctx, wr) {
    if ( (node.children.length) < 4 ) {
      ctx.addError(node, "invalid operator function");
      return;
    }
    const fnName = node.children[1];
    if ( false == ((fnName.vref.length) > 0) ) {
      ctx.addError(node, "operator function has no name");
      return;
    }
    ctx.addOpFn(fnName.vref, node);
    node.disabled_node = true;
    node.flow_done = true;
  };
  async testCompile (opFn, node, ctx, wr) {
    /** unused:  const ok = false   **/ 
    const rootCtx = ctx.getRoot();
    /** unused:  const errCnt = rootCtx.compilerErrors.length   **/ 
    const opParams = opFn.children[2];
    const opBody = opFn.children[3];
    const xValue = node.copy();
    xValue.children.splice(0, 1);
    let regToArg = {};
    const am = new RangerArgMatch();
    opParams.parallelTree(xValue, ((left, right, i) => { 
      if ( ((typeof(left) !== "undefined" && left != null ) ) && ((typeof(right) !== "undefined" && right != null ) ) ) {
        if ( (left.vref.length) > 0 ) {
          const v = right;
          if ( v.expression ) {
            regToArg[left.vref] = right;
          }
          am.nodes[left.vref] = right;
        }
      }
    }));
    let opParamSet = {};
    let regParams = {};
    let regNames = {};
    if ( false == ((node.register_name.length) > 0) ) {
      await opBody.forTree((async (item, i) => { 
        if ( ( typeof(regToArg[item.vref] ) != "undefined" && regToArg.hasOwnProperty(item.vref) ) ) {
          if ( ( typeof(opParamSet[item.vref] ) != "undefined" && opParamSet.hasOwnProperty(item.vref) ) ) {
            if ( false == (( typeof(regParams[item.vref] ) != "undefined" && regParams.hasOwnProperty(item.vref) )) ) {
              const realArg = (regToArg[item.vref]);
              if ( (realArg.register_name.length) > 0 ) {
              } else {
                const regName = ctx.createNewRegName();
                regNames[item.vref] = regName;
                const argCopy = realArg.copy();
                const regExpr = CodeNode.fromList([CodeNode.vref1("def"), CodeNode.vref1(regName), argCopy]);
                await this.WalkNode(regExpr, ctx, wr);
                const regArg = regExpr.children[1];
                const realRegName = (((regExpr.children[1])).paramDesc).compiledName;
                regArg.paramDesc.set_cnt = 1;
                regArg.paramDesc.ref_cnt = 1;
                const BlockOP = ctx.getLastBlockOp();
                BlockOP.register_expressions.push(regExpr);
                realArg.register_name = regName;
                realArg.reg_compiled_name = realRegName;
              }
            }
            regParams[item.vref] = true;
          }
          opParamSet[item.vref] = true;
        }
      }));
    }
    /** unused:  const bodyCopy = opBody.copy()   **/ 
    const newNode = opBody.rebuildWithType(am, true);
    node.children.length = 0;
    await operatorsOf.forEach_15(newNode.children, ((item, index) => { 
      const tmp = item;
      node.children.push(tmp);
    }));
    node.flow_done = false;
    if ( opBody.is_block_node ) {
      console.log("Block -> " + opBody.getCode());
      const blockCtx = ctx.fork();
      blockCtx.newBlock();
      await this.WalkNode(node, blockCtx, wr);
    } else {
      await this.WalkNode(node, ctx, wr);
    }
    return am.builtNodes;
  };
  async TransformOpFn (opFnList, origNode, ctx, wr) {
    if ( this.infinite_recursion ) {
      return;
    }
    let ok = false;
    const rootCtx = ctx.getRoot();
    const errCnt = rootCtx.compilerErrors.length;
    const use_delta = true;
    let least_err_cnt = 99999;
    let least_errs = [];
    const depth = operatorsOfstring_33.transactionc95depth_34("TransformOpFn", ctx);
    if ( depth > 20 ) {
      ctx.addError(origNode, "Error: recursive operator function detected");
      this.infinite_recursion = true;
      return;
    }
    if ( (origNode.register_name.length) > 0 ) {
      if ( ctx.isVarDefined(origNode.register_name) ) {
        const regInfo = ctx.getVariableDef(origNode.register_name);
        if ( (typeof(regInfo.nameNode) !== "undefined" && regInfo.nameNode != null )  ) {
          origNode.copyEvalResFrom(regInfo.nameNode);
          return;
        } else {
        }
      } else {
      }
    }
    const fc = origNode.children[0];
    const myT = operatorsOf_33.startc95transaction_35("TransformOpFn", fc.vref, ctx);
    let newOps = [];
    let tryTypes = ["string", "int", "double", "boolean"];
    const codeStrHash = origNode.getSource();
    if ( ( typeof(this.match_types[codeStrHash] ) != "undefined" && this.match_types.hasOwnProperty(codeStrHash) ) ) {
      tryTypes.splice(0, 0, (this.match_types[codeStrHash]));
    }
    const cList = (ctx.getRoot()).getClasses().slice().reverse();
    operatorsOf.forEach_31(cList, ((item, index) => { 
      if ( item.isNormalClass() || item.is_system ) {
        if ( (codeStrHash.indexOf(item.name)) >= 0 ) {
          tryTypes.splice(0, 0, item.name);
        } else {
          tryTypes.push(item.name);
        }
      }
    }));
    await operatorsOf.forEach_15(opFnList, (async (item, index) => { 
      let had_v = false;
      await item.forTree(((item, i) => { 
        if ( ((item.array_type == "?") || (item.key_type == "?")) || (item.type_name == "?") ) {
          had_v = true;
        }
      }));
      if ( had_v ) {
        const opFn = item.copy();
        /** unused:  const opParams = opFn.children[2]   **/ 
        /** unused:  const opBody = opFn.children[3]   **/ 
        let typeName = "";
        await operatorsOf.forEach_12(tryTypes, (async (item, index) => { 
          const copyOfFn = opFn.copy();
          typeName = item;
          await copyOfFn.forTree(((item, i) => { 
            if ( item.array_type == "?" ) {
              item.array_type = typeName;
            }
            if ( item.key_type == "?" ) {
              item.key_type = typeName;
            }
            if ( item.type_name == "?" ) {
              item.type_name = typeName;
            }
          }));
          copyOfFn.matched_type = typeName;
          newOps.push(copyOfFn);
        }));
      }
    }));
    if ( (newOps.length) > 0 ) {
      await operatorsOf.forEach_15(newOps, ((item, index) => { 
        /** unused:  const tmp = item   **/ 
        opFnList.push(item);
      }));
    }
    const oNodeParams = origNode.children.length;
    operatorsOf.filter_36(opFnList, ((item, index) => { 
      const opParams_1 = item.children[2];
      return oNodeParams == ((opParams_1.children.length) - 1);
    }));
    await operatorsOf.forEach_15(opFnList, (async (item, index) => { 
      if ( ok ) {
        return;
      } else {
        const currentErrCnt = rootCtx.compilerErrors.length;
        const errDelta = currentErrCnt - errCnt;
        if ( errDelta > 0 ) {
          if ( errDelta < least_err_cnt ) {
            least_err_cnt = errDelta;
            let i = errCnt;
            least_errs.length = 0;
            while (i < currentErrCnt) {
              const tmp_1 = rootCtx.compilerErrors[i];
              least_errs.push(tmp_1);
              i = i + 1;
            };
          }
          let i_1 = errCnt;
          while (i_1 < currentErrCnt) {
            rootCtx.compilerErrors.pop();
            i_1 = i_1 + 1;
          };
        }
      }
      const originalOpFn = item;
      const node = origNode.copy();
      const opFn_1 = item;
      const opParams_2 = opFn_1.children[2];
      const opBody_1 = opFn_1.children[3];
      const xValue = node.copy();
      xValue.children.splice(0, 1);
      await opBody_1.forTree(((item, i) => { 
        if ( item.vref == "return" ) {
        }
      }));
      let regToArg = {};
      const am = new RangerArgMatch();
      opParams_2.parallelTree(xValue, ((left, right, i) => { 
        if ( ((typeof(left) !== "undefined" && left != null ) ) && ((typeof(right) !== "undefined" && right != null ) ) ) {
          if ( (left.vref.length) > 0 ) {
            const v = right;
            if ( v.expression ) {
              regToArg[left.vref] = right;
            }
            am.nodes[left.vref] = right;
          }
        }
      }));
      let opParamSet = {};
      let regParams = {};
      let regNames = {};
      const BlockOP = ctx.getLastBlockOp();
      let newDefNodes = [];
      let newRNodes = [];
      if ( false == ((node.register_name.length) > 0) ) {
        await opBody_1.forTree((async (item, i) => { 
          if ( ( typeof(regToArg[item.vref] ) != "undefined" && regToArg.hasOwnProperty(item.vref) ) ) {
            if ( ( typeof(opParamSet[item.vref] ) != "undefined" && opParamSet.hasOwnProperty(item.vref) ) ) {
              if ( false == (( typeof(regParams[item.vref] ) != "undefined" && regParams.hasOwnProperty(item.vref) )) ) {
                const realArg = (regToArg[item.vref]);
                if ( (realArg.register_name.length) > 0 ) {
                } else {
                  const regName = ctx.createNewRegName();
                  regNames[item.vref] = regName;
                  const argCopy = realArg.copy();
                  const regExpr = CodeNode.fromList([CodeNode.vref1("def"), CodeNode.vref1(regName), argCopy]);
                  const cnt = BlockOP.register_expressions.length;
                  await this.WalkNode(regExpr, ctx, wr);
                  const opCntDelta = (BlockOP.register_expressions.length) - cnt;
                  if ( use_delta && (opCntDelta > 0) ) {
                    const opCnt = BlockOP.register_expressions.length;
                    let i_2 = cnt;
                    while (i_2 < opCnt) {
                      const tmp_2 = BlockOP.register_expressions[i_2];
                      newRNodes.push(tmp_2);
                      i_2 = i_2 + 1;
                    };
                    i_2 = cnt;
                    while (i_2 < opCnt) {
                      BlockOP.register_expressions.pop();
                      i_2 = i_2 + 1;
                    };
                  }
                  const regArg = regExpr.children[1];
                  const realRegName = (((regExpr.children[1])).paramDesc).compiledName;
                  regArg.paramDesc.set_cnt = 1;
                  regArg.paramDesc.ref_cnt = 1;
                  if ( use_delta ) {
                    newRNodes.push(regExpr);
                  } else {
                    const BlockOP_1 = ctx.getLastBlockOp();
                    BlockOP_1.register_expressions.push(regExpr);
                  }
                  realArg.register_name = regName;
                  realArg.reg_compiled_name = realRegName;
                }
              }
              regParams[item.vref] = true;
            }
            opParamSet[item.vref] = true;
          }
        }));
      }
      const newNode = opBody_1.rebuildWithType(am, true);
      node.getChildrenFrom(newNode);
      node.flow_done = false;
      ctx.setTestCompile();
      if ( opBody_1.is_block_node ) {
        const blockCtx = ctx.fork();
        blockCtx.newBlock();
        await this.WalkNode(node, blockCtx, wr);
      } else {
        await this.WalkNode(node, ctx, wr);
      }
      if ( errCnt == (rootCtx.compilerErrors.length) ) {
        ctx.unsetTestCompile();
        if ( (originalOpFn.matched_type.length) > 0 ) {
          this.match_types[codeStrHash] = originalOpFn.matched_type;
        }
        if ( false == ctx.isTestCompile() ) {
          await operatorsOf.forEach_15(newDefNodes, ((item, index) => { 
            const tmp_3 = item;
            BlockOP.register_expressions.push(tmp_3);
          }));
          await operatorsOf.forEach_15(newRNodes, ((item, index) => { 
            const tmp_4 = item;
            BlockOP.register_expressions.push(tmp_4);
          }));
        }
        ok = true;
        const newNode_1 = opBody_1.rebuildWithType(am, true);
        origNode.getChildrenFrom(newNode_1);
        origNode.flow_done = false;
        if ( opBody_1.is_block_node ) {
          const blockCtx_1 = ctx.fork();
          blockCtx_1.newBlock();
          await this.WalkNode(origNode, blockCtx_1, wr);
          const lastLine = origNode.children[((origNode.children.length) - 1)];
          if ( (lastLine.isFirstVref("ret") || ((lastLine.eval_array_type.length) > 0)) || (((lastLine.eval_type_name.length) > 0) && (lastLine.eval_type_name != "void")) ) {
            const argVal = lastLine.children[1];
            await this.WalkNode(argVal, blockCtx_1, wr);
            origNode.copyEvalResFrom(argVal);
            const regName_1 = ctx.createNewRegName();
            regNames[item.vref] = regName_1;
            const argCopy_1 = argVal.copy();
            const nameNode = CodeNode.vref1(regName_1);
            nameNode.value_type = origNode.eval_type;
            nameNode.type_name = origNode.eval_type_name;
            nameNode.array_type = origNode.eval_array_type;
            nameNode.key_type = origNode.eval_key_type;
            if ( argVal.eval_type == 17 ) {
              if ( (typeof(argVal.expression_value) !== "undefined" && argVal.expression_value != null )  ) {
                nameNode.expression_value = argVal.expression_value.copy();
              } else {
                nameNode.expression_value = argVal.copy();
              }
            }
            nameNode.setFlag("unwrap");
            const regExpr_1 = CodeNode.fromList([CodeNode.vref1("def"), nameNode]);
            await this.WalkNode(regExpr_1, ctx, wr);
            const regArg_1 = regExpr_1.children[1];
            const realRegName_1 = (((regExpr_1.children[1])).paramDesc).compiledName;
            regArg_1.paramDesc.set_cnt = 1;
            regArg_1.paramDesc.ref_cnt = 1;
            const BlockOP_2 = ctx.getLastBlockOp();
            if ( false == ctx.isTestCompile() ) {
            }
            origNode.register_name = regName_1;
            origNode.reg_compiled_name = realRegName_1;
            lastLine.flow_done = false;
            lastLine.children.length = 0;
            lastLine.getChildrenFrom(CodeNode.fromList([CodeNode.vref1("="), CodeNode.vref1(regName_1), argCopy_1]));
            /** unused:  const regE = regExpr_1.children[1]   **/ 
            await this.WalkNode(lastLine, blockCtx_1, wr);
            const myBlock = CodeNode.expressionNode();
            myBlock.getChildrenFrom(origNode);
            if ( false == ctx.isTestCompile() ) {
              myBlock.children.splice(0, 0, regExpr_1);
              BlockOP_2.register_expressions.push(myBlock);
            }
            origNode.children.length = 0;
            origNode.flow_done = true;
          }
        } else {
          await this.WalkNode(origNode, ctx, wr);
          origNode.flow_done = true;
        }
      } else {
        ctx.unsetTestCompile();
      }
    }));
    /** unused:  const depth_2 = operatorsOf_33.transactionc95depth_34("TransformOpFn", ctx)   **/ 
    /** unused:  const errDelta_1 = (rootCtx.compilerErrors.length) - errCnt   **/ 
    const currentErrCnt_1 = rootCtx.compilerErrors.length;
    const errDelta_3 = currentErrCnt_1 - errCnt;
    if ( errDelta_3 > 0 ) {
      if ( errDelta_3 < least_err_cnt ) {
        let i_3 = errCnt;
        least_errs.length = 0;
        while (i_3 < currentErrCnt_1) {
          const tmp_5 = rootCtx.compilerErrors[i_3];
          least_errs.push(tmp_5);
          i_3 = i_3 + 1;
        };
      }
      let i_4 = errCnt;
      while (i_4 < currentErrCnt_1) {
        rootCtx.compilerErrors.pop();
        i_4 = i_4 + 1;
      };
    }
    if ( errDelta_3 > 0 ) {
      operatorsOf.forEach_37(least_errs, ((item, index) => { 
        const tmp_6 = item;
        rootCtx.compilerErrors.push(tmp_6);
      }));
      console.log("^ had errors...");
      ctx.addError(origNode, "Could not find suitable match for the operator node");
    }
    if ( this.infinite_recursion ) {
      ctx.addError(origNode, "Error: max recursiion depth of > 20 for inline operators detected");
    }
    operatorsOfContextTransaction_38.endc95transaction_39(myT);
  };
  async cmdArray (node, ctx, wr) {
    if ( (node.children.length) == 3 ) {
      const sc = node.getSecond();
      if ( ((sc.vref.length) > 0) && ((sc.type_name.length) > 0) ) {
        node.eval_array_type = sc.type_name;
        node.eval_type = 6;
        const items = node.getThird();
        let b_union = false;
        let union_types = [];
        if ( ctx.isDefinedClass(sc.type_name) ) {
          const cl = ctx.findClass(sc.type_name);
          if ( cl.is_union ) {
            b_union = true;
            union_types = cl.is_union_of;
          }
        }
        const arrayItems = node.newExpressionNode();
        for ( let i = 0; i < items.children.length; i++) {
          var it = items.children[i];
          const itemCopy = it.copy();
          await this.WalkNode(itemCopy, ctx, wr);
          if ( itemCopy.eval_type_name != sc.type_name ) {
            if ( b_union ) {
              if ( (union_types.indexOf(itemCopy.eval_type_name)) >= 0 ) {
              } else {
                ctx.addError(it, (itemCopy.eval_type_name + " is Not part of union ") + sc.type_name);
                break;
              }
            } else {
              ctx.addError(it, "The array type should be " + sc.type_name);
              break;
            }
          }
          arrayItems.children.push(itemCopy);
        };
        node.getChildrenFrom(arrayItems);
        node.is_array_literal = true;
        return;
      }
    }
    const arrayItems_1 = node.newExpressionNode();
    let types = [];
    for ( let i_1 = 0; i_1 < node.children.length; i_1++) {
      var it_1 = node.children[i_1];
      if ( i_1 == 0 ) {
        continue;
      }
      const itemCopy_1 = it_1.copy();
      await this.WalkNode(itemCopy_1, ctx, wr);
      if ( (types.indexOf(itemCopy_1.eval_type_name)) < 0 ) {
        types.push(itemCopy_1.eval_type_name);
      }
      arrayItems_1.children.push(itemCopy_1);
    };
    const typeCnt = types.length;
    if ( typeCnt == 0 ) {
      ctx.addError(node, "Invalid array types");
      return;
    }
    node.eval_type = 6;
    if ( (types.length) > 1 ) {
      node.eval_array_type = "Any";
    } else {
      node.eval_array_type = types[0];
    }
    node.is_array_literal = true;
    node.getChildrenFrom(arrayItems_1);
  };
  async EnterLambdaMethod (node, ctx, wr) {
    const args = node.children[1];
    const body = node.children[2];
    const subCtx = ctx.fork();
    if ( false == args.expression ) {
      ctx.addError(node, "Invalid anonymous function: second param should be an expression");
    }
    ctx.incLambdaCnt();
    subCtx.is_capturing = true;
    node.evalTypeClass = TFactory.new_lambda_signature(node, ctx, wr);
    const currM = ctx.getCurrentMethod();
    const cn = node.children[0];
    const m = new RangerAppFunctionDesc();
    m.name = "lambda";
    m.node = node;
    m.is_lambda = true;
    m.nameNode = node.children[0];
    m.insideFn = currM;
    subCtx.newBlock();
    currM.myLambdas.push(m);
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
      await this.CheckTypeAnnotationOf(arg, subCtx, wr);
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
    };
    /** unused:  const cnt = body.children.length   **/ 
    for ( let i = 0; i < body.children.length; i++) {
      var item = body.children[i];
      const tmp = item;
      subCtx.lastBlockOp = tmp;
      await this.WalkNode(item, subCtx, wr);
      if ( i == ((body.children.length) - 1) ) {
        if ( (item.children.length) > 0 ) {
          const fc = item.getFirst();
          if ( fc.vref != "return" ) {
            cn.type_name = "void";
          }
        }
      }
    };
    node.has_lambda = true;
    node.lambda_ctx = subCtx;
    node.eval_type = 17;
    node.eval_function = node;
    node.expression_value = node.copy();
    node.lambdaFnDesc = m;
    if ( ctx.isCapturing() ) {
      await operatorsOf.forEach_12(node.lambda_ctx.captured_variables, ((item, index) => { 
        if ( ctx.isVarDefined(item) ) {
          if ( ctx.isLocalToCapture(item) == false ) {
            ctx.addCapturedVariable(item);
          }
        }
      }));
    }
  };
  async CheckVRefTypeAnnotationOf (node, ctx, wr) {
    if ( node.has_vref_annotation ) {
      const tAnn = node.vref_annotation;
      if ( false == ctx.isDefinedClass(node.vref) ) {
        ctx.addError(node, ("Trait class " + node.vref) + " is not defined");
      } else {
        const testC = ctx.findClass(node.vref);
        if ( testC.is_trait ) {
          if ( testC.node.hasExpressionProperty("params") ) {
            /** unused:  const params = testC.node.getExpressionProperty("params")   **/ 
            /** unused:  const cnt = tAnn.children.length   **/ 
            let tstr = "";
            for ( let i = 0; i < tAnn.children.length; i++) {
              var ch = tAnn.children[i];
              await this.CheckVRefTypeAnnotationOf(ch, ctx, wr);
              tstr = (tstr + "_") + ch.vref;
            };
            const my_class_name = testC.name + tstr;
            const ann = tAnn;
            await ctx.createTraitInstanceClass(testC.name, my_class_name, ann, this, wr);
            node.vref = my_class_name;
            node.has_vref_annotation = false;
            return true;
          }
        }
      }
    }
    return false;
  };
  async CheckTypeAnnotationOf (node, ctx, wr) {
    if ( node.has_type_annotation ) {
      const tAnn = node.type_annotation;
      if ( false == ctx.isDefinedClass(node.type_name) ) {
        ctx.addError(node, ("Trait class " + node.type_name) + " is not defined");
      } else {
        const testC = ctx.findClass(node.type_name);
        if ( testC.is_trait ) {
          if ( testC.node.hasExpressionProperty("params") ) {
            /** unused:  const params = testC.node.getExpressionProperty("params")   **/ 
            /** unused:  const cnt = tAnn.children.length   **/ 
            let tstr = "";
            for ( let i = 0; i < tAnn.children.length; i++) {
              var ch = tAnn.children[i];
              await this.CheckVRefTypeAnnotationOf(ch, ctx, wr);
              tstr = (tstr + "_") + ch.vref;
            };
            const my_class_name = testC.name + tstr;
            const ann = tAnn;
            await ctx.createTraitInstanceClass(testC.name, my_class_name, ann, this, wr);
            node.type_name = my_class_name;
            node.has_type_annotation = false;
            return true;
          }
        }
      }
    }
    return false;
  };
  async matchNode (node, ctx, wr) {
    if ( 0 == (node.children.length) ) {
      return false;
    }
    const fc = node.getFirst();
    this.stdCommands = ctx.getStdCommands();
    const op_list = await ctx.getOperators(fc.vref);
    for ( let i = 0; i < op_list.length; i++) {
      var cmd = op_list[i];
      const cmdName = cmd.getFirst();
      if ( (cmdName.vref == fc.vref) && (false == ctx.isVarDefined(cmdName.vref)) ) {
        await this.stdParamMatch(node, ctx, wr, true);
        if ( (typeof(node.parent) !== "undefined" && node.parent != null )  ) {
        }
        return true;
      }
    };
    if ( ((fc.ns.length) > 1) && ((node.children.length) > 1) ) {
      const possible_cmd = fc.ns[((fc.ns.length) - 1)];
      const op_list_2 = await ctx.getOperators(possible_cmd);
      if ( (op_list_2.length) > 0 ) {
        const args = node.getSecond();
        const nn = fc.copy();
        nn.ns.pop();
        const objName = nn.ns.join(".");
        const newNode = node.newExpressionNode();
        newNode.add(node.newVRefNode("call"));
        newNode.add(node.newVRefNode(objName));
        newNode.add(node.newVRefNode(possible_cmd));
        newNode.add(args.copy());
        node.getChildrenFrom(newNode);
        if ( ctx.expressionLevel() == 0 ) {
          ctx.lastBlockOp = node;
        }
        node.flow_done = false;
        await this.WalkNode(node, ctx, wr);
        return true;
      }
    }
    return false;
  };
  async StartWalk (node, ctx, wr) {
    await this.WalkNode(node, ctx, wr);
    for ( let i = 0; i < this.walkAlso.length; i++) {
      var ch = this.walkAlso[i];
      await this.WalkNode(ch, ctx, wr);
    };
  };
  clearImports (node, ctx, wr) {
    if ( node.isFirstVref("Import") ) {
      node.expression = true;
      node.vref = "";
      node.children.pop();
      node.children.pop();
    } else {
      for ( let i = 0; i < node.children.length; i++) {
        var item = node.children[i];
        this.clearImports(item, ctx, wr);
      };
    }
  };
  async mergeImports (node, ctx, wr) {
    const envOpt = ctx.getEnv();
    if ( typeof(envOpt) === "undefined" ) {
      ctx.addError(node, "Environment not defined");
      return;
    }
    const env = envOpt;
    if ( node.isFirstVref("Import") ) {
      const fNameNode = node.children[1];
      const import_file = fNameNode.string_value;
      if ( ( typeof(ctx.already_imported[import_file] ) != "undefined" && ctx.already_imported.hasOwnProperty(import_file) ) ) {
        return;
      }
      let source_code = "";
      const ppList = ctx.findPluginsFor("import_loader");
      if ( (ppList.length) > 0 ) {
        try {
          await operatorsOf.forEach_12(ppList, ((item, index) => { 
            const plugin = require( item );
            const ss = ( (new plugin.Plugin () )["import_loader"] )( node, ctx , wr );
            if( typeof(ss) === 'string' ) /* union case for string */ {
              var str = ss;
              console.log("--> import  " + str);
              source_code = str;
            };
          }));
        } catch(e) {
        }
      }
      ctx.already_imported[import_file] = true;
      const rootCtx = ctx.getRoot();
      if ( (source_code.length) == 0 ) {
        const filePathIs = TFiles.searchEnv(env, rootCtx.libraryPaths, import_file);
        if ( operatorsOf_8.filec95exists_9(env, filePathIs, import_file) == false ) {
          if ( ctx.hasCompilerFlag("verbose") ) {
            console.log("import did not find the file: " + import_file);
          }
          ctx.addError(node, "Could not import file " + import_file);
          return;
        }
        if ( ctx.hasCompilerFlag("verbose") ) {
          console.log("importing " + import_file);
        }
        const c = await operatorsOf_8.readc95file_9(env, filePathIs, import_file);
        source_code = c;
      }
      const code = new SourceCode(source_code);
      code.filename = import_file;
      const parser = new RangerLispParser(code);
      parser.parse(ctx.hasCompilerFlag("no-op-transform"));
      node.expression = true;
      node.vref = "";
      node.children.pop();
      node.children.pop();
      if ( ctx.hasCompilerFlag("copysrc") ) {
        console.log("--> copying " + import_file);
        const fileWr = wr.getFileWriter(".", import_file);
        fileWr.raw(source_code, false);
      }
      const rn = parser.rootNode;
      await this.mergeImports(rn, ctx, wr);
      node.children.push(rn);
    } else {
      for ( let i = 0; i < node.children.length; i++) {
        var item = node.children[i];
        await this.mergeImports(item, ctx, wr);
      };
    }
  };
  async CollectMethods (node, ctx, wr) {
    await this.WalkCollectMethods(node, ctx, wr);
    let allTypes = [];
    const serviceBuilder = new RangerServiceBuilder();
    await serviceBuilder.CreateServices(this, ctx, wr);
    operatorsOf_13.forEach_40(this.extendedClasses, ((item, index) => { 
      const ch = ctx.findClass(index);
      const parent = ctx.findClass(item);
      ch.addParentClass(item);
      parent.is_inherited = true;
      operatorsOf.forEach_11(parent.variables, ((item, index) => { 
        ch.ctx.defineVariable(item.name, item);
      }));
    }));
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
        const traitParams = new RangerTraitParams();
        if ( ((typeof(params) !== "undefined" && params != null ) ) && ((typeof(initParams) !== "undefined" && initParams != null ) ) ) {
          for ( let i_1 = 0; i_1 < params.children.length; i_1++) {
            var typeName = params.children[i_1];
            const pArg = initParams.children[i_1];
            if ( 0 == (pArg.vref.length) ) {
              match.addNode(typeName.vref, pArg);
            } else {
              match.add(typeName.vref, pArg.vref, ctx);
            }
            traitParams.param_names.push(typeName.vref);
            traitParams.values[typeName.vref] = pArg.vref;
          };
          cl.trait_params[name] = traitParams;
        } else {
          match.add("T", cl.name, ctx);
        }
        ctx.setCurrentClass(cl);
        const traitClass = ctx.findClass(traitClassDef.vref);
        for ( let i_2 = 0; i_2 < traitClass.variables.length; i_2++) {
          var pvar = traitClass.variables[i_2];
          const ccopy = pvar.node.rebuildWithType(match, true);
          await this.WalkCollectMethods(ccopy, ctx, wr);
          origBody.children.push(ccopy);
        };
        for ( let i_3 = 0; i_3 < traitClass.defined_variants.length; i_3++) {
          var fnVar = traitClass.defined_variants[i_3];
          const mVs = traitClass.method_variants[fnVar];
          for ( let i_4 = 0; i_4 < mVs.variants.length; i_4++) {
            var variant = mVs.variants[i_4];
            const ccopy_1 = variant.node.rebuildWithType(match, true);
            await this.WalkCollectMethods(ccopy_1, ctx, wr);
            origBody.children.push(ccopy_1);
          };
        };
        for ( let i_5 = 0; i_5 < traitClass.static_methods.length; i_5++) {
          var variant_1 = traitClass.static_methods[i_5];
          const ccopy_2 = variant_1.node.rebuildWithType(match, true);
          await this.WalkCollectMethods(ccopy_2, ctx, wr);
          origBody.children.push(ccopy_2);
        };
      }
    };
    const cClassList = this.serializedClasses.slice().sort(((left, right) => { 
      let left_had = false;
      let right_had = false;
      operatorsOf.forEach_11(left.variables, ((item, index) => { 
        if ( (item.nameNode.type_name == right.name) || (item.nameNode.array_type == right.name) ) {
          left_had = true;
        }
      }));
      operatorsOf.forEach_11(right.variables, ((item, index) => { 
        if ( (item.nameNode.type_name == left.name) || (item.nameNode.array_type == left.name) ) {
          right_had = true;
        }
      }));
      if ( left_had ) {
        return 1;
      }
      if ( right_had ) {
        return -1;
      }
      return 0;
    }));
    for ( let i_6 = 0; i_6 < cClassList.length; i_6++) {
      var cl_1 = cClassList[i_6];
      cl_1.is_serialized = true;
      const ser = new RangerSerializeClass();
      const extWr = new CodeWriter();
      ser.createJSONSerializerFn2(cl_1, cl_1.ctx, extWr);
      const theCode = extWr.getCode();
      const code = new SourceCode(theCode);
      code.filename = "extension " + ctx.currentClass.name;
      const parser = new RangerLispParser(code);
      parser.parse(ctx.hasCompilerFlag("no-op-transform"));
      const rn = parser.rootNode;
      await this.WalkCollectMethods(rn, cl_1.ctx, wr);
      this.walkAlso.push(rn);
    };
    for ( let i_7 = 0; i_7 < this.immutableClasses.length; i_7++) {
      var cl_2 = this.immutableClasses[i_7];
      const ser_1 = new RangerImmutableExtension();
      const extWr_1 = new CodeWriter();
      ser_1.createImmutableExtension(cl_2, cl_2.ctx, extWr_1);
      const theCode_1 = extWr_1.getCode();
      const code_1 = new SourceCode(theCode_1);
      code_1.filename = "extension " + cl_2.name;
      const parser_1 = new RangerLispParser(code_1);
      parser_1.parse(ctx.hasCompilerFlag("no-op-transform"));
      const rn_1 = parser_1.rootNode;
      await this.WalkCollectMethods(rn_1, cl_2.ctx, wr);
      this.walkAlso.push(rn_1);
    };
    for ( let i_8 = 0; i_8 < ctx.definedClassList.length; i_8++) {
      var cname = ctx.definedClassList[i_8];
      allTypes.push(cname);
      const c = (ctx.definedClasses[cname]);
      if ( ((c.is_system || c.is_interface) || c.is_template) || c.is_trait ) {
        continue;
      }
      let varNames = {};
      for ( let i_9 = 0; i_9 < c.variables.length; i_9++) {
        var p = c.variables[i_9];
        ctx.hadValidType(p.nameNode);
        varNames[p.name] = true;
      };
      await operatorsOf_13.forEach_30(c.method_variants, (async (item, index) => { 
        await operatorsOf.forEach_29(item.variants, ((item, index) => { 
          if ( ( typeof(varNames[item.name] ) != "undefined" && varNames.hasOwnProperty(item.name) ) ) {
            ctx.addError(item.nameNode, "Class has defined method and variable of the same name.");
          }
        }));
      }));
    };
    for ( let i_10 = 0; i_10 < ctx.definedClassList.length; i_10++) {
      var cname_1 = ctx.definedClassList[i_10];
      allTypes.push(cname_1);
    };
    allTypes.push("int");
    allTypes.push("string");
    allTypes.push("boolean");
    allTypes.push("double");
    const Anynn = node.newVRefNode("Any");
    const rootCtx = ctx.getRoot();
    const new_class = new RangerAppClassDesc();
    new_class.name = "Any";
    new_class.nameNode = Anynn;
    rootCtx.addClass("Any", new_class);
    new_class.is_union = true;
    let did_push = {};
    for ( let i_11 = 0; i_11 < allTypes.length; i_11++) {
      var typeName_1 = allTypes[i_11];
      if ( ( typeof(did_push[typeName_1] ) != "undefined" && did_push.hasOwnProperty(typeName_1) ) ) {
        continue;
      }
      new_class.is_union_of.push(typeName_1);
      did_push[typeName_1] = true;
    };
    Anynn.clDesc = new_class;
  };
  async defineFunctionParam (method, arg, ctx, wr) {
    await this.CheckTypeAnnotationOf(arg, ctx, wr);
    const p = new RangerAppParamDesc();
    p.name = arg.vref;
    p.value_type = arg.value_type;
    p.node = arg;
    p.init_cnt = 1;
    p.nameNode = arg;
    p.refType = 1;
    p.varType = 4;
    method.params.push(p);
    arg.hasParamDesc = true;
    arg.paramDesc = p;
    arg.eval_type = arg.value_type;
    arg.eval_type_name = arg.type_name;
    if ( arg.hasFlag("strong") ) {
      p.changeStrength(1, 1, p.nameNode);
    } else {
      arg.setFlag("lives");
      p.changeStrength(0, 1, p.nameNode);
    }
  };
  spliceFunctionBody (startIndex, node, ctx, wr) {
    let block_index = startIndex;
    const ch_len = (node.children.length) - 1;
    if ( ch_len == startIndex ) {
      return node;
    }
    for ( let i = 0; i < node.children.length; i++) {
      var cb = node.children[i];
      if ( i > startIndex ) {
        if ( (cb.vref.length) > 0 ) {
          if ( ctx.hasCompilerFlag(cb.vref) && (i < ch_len) ) {
            block_index = i + 1;
          }
        }
      }
    };
    const copyOf = node.copy();
    while ((node.children.length) > (startIndex + 1)) {
      node.children.pop();
    };
    if ( block_index > startIndex ) {
      const replacer = copyOf.children[block_index];
      node.children.pop();
      node.children.push(replacer.copy());
    }
    return node;
  };
  async CreateFunctionObject (orig_node, ctx, wr) {
    const subCtx = ctx.fork();
    const node = this.spliceFunctionBody(3, orig_node, subCtx, wr);
    const cn = node.getSecond();
    /** unused:  const s = node.getVRefAt(1)   **/ 
    cn.ifNoTypeSetToVoid();
    const m = operatorsOfCodeNode_41.rc46funcdesc_42(node, ctx);
    subCtx.is_function = true;
    subCtx.currentMethod = m;
    m.fnCtx = subCtx;
    if ( cn.hasFlag("weak") ) {
      m.changeStrength(0, 1, node);
    } else {
      m.changeStrength(1, 1, node);
    }
    const args = node.children[2];
    m.fnBody = node.children[3];
    await this.CheckTypeAnnotationOf(m.nameNode, ctx, wr);
    for ( let ii = 0; ii < args.children.length; ii++) {
      var arg = args.children[ii];
      await this.CheckTypeAnnotationOf(arg, subCtx, wr);
      const p2 = new RangerAppParamDesc();
      p2.name = arg.vref;
      p2.value_type = arg.value_type;
      p2.node = arg;
      p2.nameNode = arg;
      p2.init_cnt = 1;
      p2.refType = 1;
      p2.initRefType = 1;
      p2.debugString = "--> collected ";
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
    };
    return m;
  };
  async WalkCollectMethods (node, ctx, wr) {
    let find_more = true;
    if ( (node.children.length) > 0 ) {
      const fc = node.getFirst();
      if ( (fc.ns.length) > 1 ) {
        if ( (fc.ns[0]) == "plugin" ) {
          if ( node.is_plugin ) {
            return;
          }
          node.is_plugin = true;
          const pName = fc.ns[1];
          ctx.addPluginNode(pName, node);
          return;
        }
      }
    }
    if ( node.isFirstVref("defn") ) {
      return;
    }
    if ( node.isFirstVref("flag") ) {
      return;
    }
    if ( node.isFirstVref("page") ) {
      return;
    }
    if ( node.isFirstVref("service") ) {
      return;
    }
    if ( node.isFirstVref("operator") ) {
      const opRef = node.children[0];
      const nameNode = node.getSecond();
      /** unused:  const opClassName = nameNode.vref   **/ 
      if ( nameNode.vref == "class" ) {
        const new_class = new RangerAppClassDesc();
        new_class.name = nameNode.type_name;
        new_class.nameNode = nameNode;
        nameNode.vref = nameNode.type_name;
        ctx.addClass(nameNode.vref, new_class);
        const cSig = TFactory.new_class_signature(nameNode, ctx, wr);
        cSig.is_system = true;
        new_class.is_system = true;
        nameNode.clDesc = new_class;
      }
      const b_is_void = (nameNode.type_name == "void") || nameNode.is_block_node;
      const langRef = CodeNode.vref1(operatorsOf_21.getTargetLang_22(ctx));
      if ( (opRef.type_name.length) > 0 ) {
        langRef.vref = opRef.type_name;
        console.log("OP type " + opRef.type_name);
      }
      const opLang = ((node.children.length) > 2) ? (node.children[2]) : langRef;
      const opsList = node.children[((node.children.length) - 1)];
      for ( let i = 0; i < opsList.children.length; i++) {
        var op = opsList.children[i];
        const fc_1 = op.getFirst();
        if ( fc_1.vref == "fn" ) {
          const nn = op.getSecond();
          const args = op.getThird();
          const opCode = op.children[3];
          const opN = new CodeNode(op.code, op.sp, op.ep);
          const opName = nn.copy();
          const opSig = nn.rebuildWithType(new RangerArgMatch(), false);
          const opArgs = args.rebuildWithType(new RangerArgMatch(), false);
          const opTpls = new CodeNode(op.code, op.sp, op.ep);
          opTpls.is_block_node = true;
          const opTemplatesMain = new CodeNode(op.code, op.sp, op.ep);
          const opTemplatesVRef = new CodeNode(op.code, op.sp, op.ep);
          const opTemplatesList = new CodeNode(op.code, op.sp, op.ep);
          opTemplatesVRef.vref = "templates";
          opTemplatesMain.children.push(opTemplatesVRef);
          opTemplatesMain.children.push(opTemplatesList);
          opTpls.children.push(opTemplatesMain);
          opN.children.push(opName);
          if ( nn.hasFlag("newcontext") ) {
            opName.setFlag("newcontext");
          }
          opSig.vref = nn.vref;
          opN.children.push(opSig);
          const opThisNode = nameNode.rebuildWithType(new RangerArgMatch(), false);
          opThisNode.vref = "self";
          if ( nameNode.hasFlag("mutates") ) {
            opThisNode.setFlag("mutates");
          }
          if ( nameNode.hasFlag("immutable") ) {
            opThisNode.setFlag("immutable");
          }
          if ( b_is_void ) {
          } else {
            opArgs.children.splice(0, 0, opThisNode);
          }
          opN.children.push(opArgs);
          opN.children.push(opTpls);
          if ( op.hasStringProperty("doc") ) {
            opN.setStringProperty("doc", op.getStringProperty("doc"));
          }
          const opCodeNode = opCode.rebuildWithType(new RangerArgMatch(), false);
          const actualCode = new CodeNode(opCode.code, op.sp, op.ep);
          const opLangDef = opLang.rebuildWithType(new RangerArgMatch(), false);
          if ( opLangDef.vref == "all" ) {
            opLangDef.vref = "*";
          }
          actualCode.children.push(opLangDef);
          actualCode.children.push(opCodeNode);
          if ( opLangDef.vref == "*" ) {
            if ( opCode.is_block_node == false ) {
              opSig.setFlag("macro");
            }
          }
          if ( nameNode.hasFlag("macro") ) {
            opSig.setFlag("macro");
          }
          if ( nn.hasFlag("pure") ) {
            opSig.setFlag("pure");
          }
          opTemplatesList.children.push(actualCode);
          ctx.createOperator(opN);
        }
      };
      return;
      const instances = node.getThird();
      const new_class_1 = new RangerAppClassDesc();
      new_class_1.name = nameNode.vref;
      new_class_1.nameNode = nameNode;
      ctx.addClass(nameNode.vref, new_class_1);
      new_class_1.is_system_union = true;
      for ( let i_1 = 0; i_1 < instances.children.length; i_1++) {
        var ch = instances.children[i_1];
        new_class_1.is_union_of.push(ch.vref);
      };
      nameNode.clDesc = new_class_1;
      return;
    }
    if ( node.isFirstVref("union") ) {
      const nameNode_1 = node.getSecond();
      const instances_1 = node.getThird();
      const new_class_2 = new RangerAppClassDesc();
      new_class_2.name = nameNode_1.vref;
      new_class_2.nameNode = nameNode_1;
      ctx.addClass(nameNode_1.vref, new_class_2);
      new_class_2.is_union = true;
      for ( let i_2 = 0; i_2 < instances_1.children.length; i_2++) {
        var ch_1 = instances_1.children[i_2];
        new_class_2.is_union_of.push(ch_1.vref);
      };
      nameNode_1.clDesc = new_class_2;
      return;
    }
    if ( node.isFirstVref("systemunion") ) {
      const nameNode_2 = node.getSecond();
      if ( ctx.isDefinedClass(nameNode_2.vref) ) {
        const cl = ctx.findClass(nameNode_2.vref);
        if ( cl.is_system == false ) {
          ctx.addError(node, "Only system classes can be systemunions");
        }
        cl.is_system_union = true;
        const instances_2 = node.getThird();
        for ( let i_3 = 0; i_3 < instances_2.children.length; i_3++) {
          var ch_2 = instances_2.children[i_3];
          cl.is_union_of.push(ch_2.vref);
        };
        return;
      }
      const nameNode_3 = node.getSecond();
      const instances_3 = node.getThird();
      const new_class_3 = new RangerAppClassDesc();
      new_class_3.name = nameNode_3.vref;
      new_class_3.nameNode = nameNode_3;
      ctx.addClass(nameNode_3.vref, new_class_3);
      new_class_3.is_system_union = true;
      for ( let i_4 = 0; i_4 < instances_3.children.length; i_4++) {
        var ch_3 = instances_3.children[i_4];
        new_class_3.is_union_of.push(ch_3.vref);
      };
      nameNode_3.clDesc = new_class_3;
      return;
    }
    if ( node.isFirstVref("systemclass") ) {
      const nameNode_4 = node.getSecond();
      if ( ctx.isDefinedClass(nameNode_4.vref) ) {
        const cl_1 = ctx.findClass(nameNode_4.vref);
        if ( cl_1.is_system_union == false ) {
          ctx.addError(node, "Class already defined and it was not a systemunion.");
        }
        cl_1.is_system = true;
        const instances_4 = node.getThird();
        for ( let i_5 = 0; i_5 < instances_4.children.length; i_5++) {
          var ch_4 = instances_4.children[i_5];
          const langName = ch_4.getFirst();
          const langClassName = ch_4.getSecond();
          cl_1.systemNodes[langName.vref] = ch_4;
          if ( (langClassName.vref.length) > 0 ) {
            cl_1.systemNames[langName.vref] = langClassName.vref;
          }
          if ( (langClassName.string_value.length) > 0 ) {
            cl_1.systemNames[langName.vref] = langClassName.string_value;
          }
        };
        return;
      }
      const instances_5 = node.getThird();
      const new_class_4 = new RangerAppClassDesc();
      new_class_4.name = nameNode_4.vref;
      new_class_4.nameNode = nameNode_4;
      ctx.addClass(nameNode_4.vref, new_class_4);
      new_class_4.is_system = true;
      for ( let i_6 = 0; i_6 < instances_5.children.length; i_6++) {
        var ch_5 = instances_5.children[i_6];
        const langName_1 = ch_5.getFirst();
        const langClassName_1 = ch_5.getSecond();
        new_class_4.systemNodes[langName_1.vref] = ch_5;
        if ( (langClassName_1.vref.length) > 0 ) {
          new_class_4.systemNames[langName_1.vref] = langClassName_1.vref;
        }
        if ( (langClassName_1.string_value.length) > 0 ) {
          new_class_4.systemNames[langName_1.vref] = langClassName_1.string_value;
        }
      };
      nameNode_4.is_system_class = true;
      nameNode_4.clDesc = new_class_4;
      return;
    }
    if ( node.isFirstVref("extends") ) {
      if ( (node.children.length) > 1 ) {
        const ee = node.getSecond();
        const currC = ctx.currentClass;
        currC.addParentClass(ee.vref);
        const ParentClass = ctx.findClass(ee.vref);
        ParentClass.is_inherited = true;
      }
      find_more = false;
    }
    if ( node.isFirstVref("Extends") ) {
      const extList = node.children[1];
      const currC_1 = ctx.currentClass;
      for ( let ii = 0; ii < extList.children.length; ii++) {
        var ee_1 = extList.children[ii];
        currC_1.addParentClass(ee_1.vref);
        const ParentClass_1 = ctx.findClass(ee_1.vref);
        ParentClass_1.is_inherited = true;
      };
    }
    if ( node.isFirstVref("constructor") || node.isFirstVref("Constructor") ) {
      const currC_2 = ctx.currentClass;
      const subCtx = currC_2.ctx.fork();
      currC_2.has_constructor = true;
      currC_2.constructor_node = node;
      const m = new RangerAppFunctionDesc();
      m.name = "Constructor";
      m.node = node;
      m.nameNode = node.children[0];
      m.fnBody = node.children[2];
      m.fnCtx = subCtx;
      const args_1 = node.children[1];
      for ( let ii_1 = 0; ii_1 < args_1.children.length; ii_1++) {
        var arg = args_1.children[ii_1];
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
      };
      currC_2.constructor_fn = m;
      find_more = false;
    }
    if ( node.isFirstVref("enum") ) {
      const fNameNode = node.children[1];
      const enumList = node.children[2];
      const new_enum = new RangerAppEnum();
      for ( let i_7 = 0; i_7 < enumList.children.length; i_7++) {
        var item = enumList.children[i_7];
        const fc_2 = item.getFirst();
        new_enum.add(fc_2.vref);
      };
      ctx.definedEnums[fNameNode.vref] = new_enum;
      find_more = false;
    }
    if ( node.isFirstVref("Enum") ) {
      const fNameNode_1 = node.children[1];
      const enumList_1 = node.children[2];
      const new_enum_1 = new RangerAppEnum();
      for ( let i_8 = 0; i_8 < enumList_1.children.length; i_8++) {
        var item_1 = enumList_1.children[i_8];
        new_enum_1.add(item_1.vref);
      };
      ctx.definedEnums[fNameNode_1.vref] = new_enum_1;
      find_more = false;
    }
    if ( node.isFirstVref("trait") ) {
      const s = node.getVRefAt(1);
      const classNameNode = node.getSecond();
      const new_class_5 = new RangerAppClassDesc();
      new_class_5.name = s;
      const subCtx_1 = ctx.fork();
      ctx.setCurrentClass(new_class_5);
      subCtx_1.setCurrentClass(new_class_5);
      new_class_5.ctx = subCtx_1;
      new_class_5.nameNode = classNameNode;
      ctx.addClass(s, new_class_5);
      new_class_5.classNode = node;
      new_class_5.node = node;
      new_class_5.is_trait = true;
    }
    if ( node.isFirstVref("CreateClass") || node.isFirstVref("class") ) {
      if ( (node.children.length) < 3 ) {
        ctx.addError(node, "Not enough arguments for creating a class");
        return;
      }
      const s_1 = node.getVRefAt(1);
      const classNameNode_1 = node.getSecond();
      const new_class_6 = new RangerAppClassDesc();
      new_class_6.name = s_1;
      new_class_6.compiledName = s_1;
      classNameNode_1.evalTypeClass = TFactory.new_class_signature(classNameNode_1, ctx, wr);
      const notOkNames = ["main"];
      if ( (notOkNames.indexOf(s_1)) >= 0 ) {
        ctx.addError(classNameNode_1, "Unfortunately this class name not allowed: " + s_1);
      }
      switch (s_1 ) { 
        case "_" : 
          new_class_6.compiledName = "utiltyClass";
          break;
      };
      const subCtx_2 = ctx.fork();
      ctx.setCurrentClass(new_class_6);
      subCtx_2.setCurrentClass(new_class_6);
      new_class_6.ctx = subCtx_2;
      new_class_6.nameNode = classNameNode_1;
      ctx.addClass(s_1, new_class_6);
      new_class_6.classNode = node;
      new_class_6.node = node;
      if ( node.hasBooleanProperty("trait") ) {
        new_class_6.is_trait = true;
      }
      if ( classNameNode_1.hasFlag("immutable") ) {
        this.immutableClasses.push(new_class_6);
        new_class_6.is_immutable = true;
      }
      const third = node.getThird();
      if ( third.vref == "extends" ) {
        if ( node.chlen() >= 4 ) {
          const extClass = node.children[3];
          if ( (extClass.vref.length) > 0 ) {
            this.extendedClasses[s_1] = extClass.vref;
          } else {
            ctx.addError(node, "Invalid classname given for the extends keyword");
          }
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
      for ( let i_9 = 0; i_9 < list.children.length; i_9++) {
        var cname = list.children[i_9];
        const extC = ctx.findClass(cname.vref);
        for ( let i_10 = 0; i_10 < extC.variables.length; i_10++) {
          var vv = extC.variables[i_10];
          const currC_3 = ctx.currentClass;
          const subCtx_3 = currC_3.ctx;
          subCtx_3.defineVariable(vv.name, vv);
        };
      };
      find_more = false;
    }
    if ( node.isFirstVref("def") || node.isFirstVref("let") ) {
      const s_3 = node.getVRefAt(1);
      const vDef = node.children[1];
      const p_1 = new RangerAppParamDesc();
      if ( vDef.has_type_annotation ) {
        await this.CheckTypeAnnotationOf(vDef, ctx, wr);
      }
      if ( s_3 != ctx.transformWord(s_3) ) {
      }
      const currC_4 = ctx.currentClass;
      if ( currC_4.is_immutable ) {
        vDef.setFlag("weak");
        if ( vDef.value_type == 6 ) {
          const initNode = node.newExpressionNode();
          (initNode).push(node.newVRefNode("new"));
          const tDef = node.newVRefNode("Vector");
          const vAnn = node.newExpressionNode();
          (vAnn).push(node.newVRefNode(vDef.array_type));
          tDef.has_vref_annotation = true;
          tDef.vref_annotation = vAnn;
          (initNode).push(tDef);
          node.children[2] = initNode;
          vDef.value_type = 11;
          vDef.type_name = "Vector";
          const tAnn = node.newExpressionNode();
          (tAnn).push(node.newVRefNode(vDef.array_type));
          vDef.has_type_annotation = true;
          vDef.type_annotation = tAnn;
          await this.CheckTypeAnnotationOf(vDef, ctx, wr);
          await this.CheckVRefTypeAnnotationOf(tDef, ctx, wr);
        }
        if ( vDef.value_type == 7 ) {
          const initNode_1 = node.newExpressionNode();
          (initNode_1).push(node.newVRefNode("new"));
          const tDef_1 = node.newVRefNode("Map");
          const vAnn_1 = node.newExpressionNode();
          (vAnn_1).push(node.newVRefNode(vDef.key_type));
          (vAnn_1).push(node.newVRefNode(vDef.array_type));
          tDef_1.has_vref_annotation = true;
          tDef_1.vref_annotation = vAnn_1;
          (initNode_1).push(tDef_1);
          node.children[2] = initNode_1;
          vDef.value_type = 11;
          vDef.type_name = "Map";
          const tAnn_1 = node.newExpressionNode();
          (tAnn_1).push(node.newVRefNode(vDef.key_type));
          (tAnn_1).push(node.newVRefNode(vDef.array_type));
          vDef.has_type_annotation = true;
          vDef.type_annotation = tAnn_1;
          await this.CheckTypeAnnotationOf(vDef, ctx, wr);
          await this.CheckVRefTypeAnnotationOf(tDef_1, ctx, wr);
        }
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
        const valueNode = node.children[2];
        if ( (valueNode.children.length) > 0 ) {
          const fc_3 = valueNode.getFirst();
          if ( fc_3.vref == "new" ) {
            const second = valueNode.getSecond();
            await this.CheckVRefTypeAnnotationOf(second, ctx, wr);
          }
        }
      } else {
        p_1.is_optional = true;
        if ( false == ((vDef.value_type == 6) || (vDef.value_type == 7)) ) {
          vDef.setFlag("optional");
        }
      }
      currC_4.addVariable(p_1);
      const subCtx_4 = currC_4.ctx;
      subCtx_4.defineVariable(p_1.name, p_1);
      p_1.is_class_variable = true;
      find_more = false;
    }
    if ( node.isFirstVref("operators") ) {
      const listOf = node.getSecond();
      for ( let i_11 = 0; i_11 < listOf.children.length; i_11++) {
        var item_2 = listOf.children[i_11];
        ctx.createOperator(item_2);
      };
      find_more = false;
    }
    if ( node.isFirstVref("Import") || node.isFirstVref("import") ) {
      const fNameNode_2 = node.children[1];
      const import_file = fNameNode_2.string_value;
      if ( ( typeof(ctx.already_imported[import_file] ) != "undefined" && ctx.already_imported.hasOwnProperty(import_file) ) ) {
        return;
      } else {
        ctx.already_imported[import_file] = true;
      }
      const envOpt = ctx.getEnv();
      if ( typeof(envOpt) === "undefined" ) {
        ctx.addError(node, "Environment not defined");
        return;
      }
      const env = envOpt;
      const rootCtx = ctx.getRoot();
      const filePathIs = TFiles.searchEnv(env, rootCtx.libraryPaths, import_file);
      if ( operatorsOf_8.filec95exists_9(env, filePathIs, import_file) == false ) {
        ctx.addError(node, "Could not import file " + import_file);
        return;
      }
      const c = await operatorsOf_8.readc95file_9(env, filePathIs, import_file);
      const code = new SourceCode(c);
      code.filename = import_file;
      const parser = new RangerLispParser(code);
      parser.parse(ctx.hasCompilerFlag("no-op-transform"));
      const rnode = parser.rootNode;
      await this.WalkCollectMethods(rnode, ctx, wr);
      find_more = false;
    }
    if ( node.isFirstVref("does") ) {
      const defName = node.getSecond();
      const currC_5 = ctx.currentClass;
      currC_5.consumes_traits.push(defName.vref);
      const joinPoint = new ClassJoinPoint();
      joinPoint.class_def = currC_5;
      joinPoint.node = node;
      this.classesWithTraits.push(joinPoint);
    }
    let b_is_main = false;
    if ( node.code.filename == ctx.getRootFile() ) {
      b_is_main = true;
    }
    if ( node.isFirstVref("static") ) {
      if ( node.chlen() < 5 ) {
        ctx.addError(node, "Invalid static function declaration");
        return;
      }
      node = this.spliceFunctionBody(4, node, ctx, wr);
      const s_4 = node.getVRefAt(2);
      if ( s_4 == "main" ) {
        if ( b_is_main ) {
          this.mainCnt = this.mainCnt + 1;
          if ( this.mainCnt > 1 ) {
            ctx.addError(node, "main function can be declared only once");
          }
        }
      }
      const currC_6 = ctx.currentClass;
      const m_1 = new RangerAppFunctionDesc();
      m_1.name = s_4;
      m_1.compiledName = ctx.transformWord(s_4);
      m_1.node = node;
      m_1.is_static = true;
      m_1.nameNode = node.children[2];
      m_1.nameNode.ifNoTypeSetToVoid();
      const args_2 = node.children[3];
      m_1.fnBody = node.children[4];
      await this.CheckTypeAnnotationOf(m_1.nameNode, ctx, wr);
      await operatorsOf.forEach_15(args_2.children, (async (item, index) => { 
        await this.defineFunctionParam(m_1, item, ctx, wr);
      }));
      currC_6.addStaticMethod(m_1);
      find_more = false;
      return;
    }
    if ( node.isFirstVref("StaticMethod") || node.isFirstVref("sfn") ) {
      node = this.spliceFunctionBody(3, node, ctx, wr);
      const s_5 = node.getVRefAt(1);
      const currC_7 = ctx.currentClass;
      const m_2 = new RangerAppFunctionDesc();
      m_2.name = s_5;
      m_2.compiledName = ctx.transformWord(s_5);
      m_2.node = node;
      m_2.is_static = true;
      m_2.nameNode = node.children[1];
      m_2.nameNode.ifNoTypeSetToVoid();
      const args_3 = node.children[2];
      m_2.fnBody = node.children[3];
      await this.CheckTypeAnnotationOf(m_2.nameNode, ctx, wr);
      await operatorsOf.forEach_15(args_3.children, (async (item, index) => { 
        await this.defineFunctionParam(m_2, item, ctx, wr);
      }));
      currC_7.addStaticMethod(m_2);
      find_more = false;
      if ( m_2.nameNode.hasFlag("main") ) {
        if ( b_is_main ) {
          this.mainCnt = this.mainCnt + 1;
          if ( this.mainCnt > 1 ) {
            ctx.addError(node, "main function can be declared only once");
          }
        }
      }
      return;
    }
    if ( node.isFirstVref("extension") ) {
      const s_6 = node.getVRefAt(1);
      const old_class = ctx.findClass(s_6);
      ctx.setCurrentClass(old_class);
    }
    if ( node.isFirstVref("PublicMethod") || node.isFirstVref("fn") ) {
      const currC_8 = ctx.currentClass;
      const fnObj = await operatorsOf_41.rc46func_43(node, (currC_8.ctx), wr);
      const cn = fnObj.nameNode;
      if ( currC_8.hasOwnMethod(fnObj.name) && (false == cn.hasFlag("override")) ) {
        ctx.addError(node, "Error: method of same name declared earlier. Overriding function declarations is not currently allowed!");
        return;
      }
      if ( cn.hasFlag("main") ) {
        ctx.addError(node, "Error: dynamic method declared as @(main). Use static 'sfn' instead of 'fn'.");
        return;
      }
      currC_8.addMethod(fnObj);
      find_more = false;
      return;
    }
    if ( find_more ) {
      for ( let i_12 = 0; i_12 < node.children.length; i_12++) {
        var item_3 = node.children[i_12];
        await this.WalkCollectMethods(item_3, ctx, wr);
      };
    }
    if ( node.hasBooleanProperty("serialize") ) {
      this.serializedClasses.push(ctx.currentClass);
    }
  };
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
            if ( (typeof(classDesc) !== "undefined" && classDesc != null )  ) {
              varFnDesc = classDesc.findMethod(strname);
              if ( typeof(varFnDesc) === "undefined" ) {
                varFnDesc = classDesc.findStaticMethod(strname);
                if ( typeof(varFnDesc) === "undefined" ) {
                  ctx.addError(obj, " function variable not found " + strname);
                }
              }
            }
          }
        };
        return varFnDesc;
      }
      const udesc = ctx.getCurrentClass();
      const currClass = udesc;
      varFnDesc = currClass.findMethod(obj.vref);
      if ( (typeof(varFnDesc) !== "undefined" && varFnDesc != null )  ) {
        if ( (typeof(varFnDesc.nameNode) !== "undefined" && varFnDesc.nameNode != null )  ) {
        } else {
          ctx.addError(obj, "Error, no description for called function: " + obj.vref);
        }
      }
      return varFnDesc;
    }
    return varFnDesc;
  };
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
              if ( classRefDesc.nameNode.hasFlag("optional") ) {
                if ( ctx.hasCompilerFlag("strict") ) {
                  if ( false == ctx.isTryBlock() ) {
                    ctx.addError(obj, "Optional automatically unwrapped outside try block");
                  }
                }
              }
              classRefDesc.ref_cnt = 1 + classRefDesc.ref_cnt;
              classDesc = ctx.findClass(classRefDesc.nameNode.type_name);
            }
          } else {
            if ( i < (cnt - 1) ) {
              varDesc = classDesc.findVariable(strname);
              if ( i > 0 ) {
                if ( varDesc.nameNode.hasFlag("optional") ) {
                  if ( ctx.hasCompilerFlag("strict") ) {
                    if ( false == ctx.isTryBlock() ) {
                      ctx.addError(obj, "Optional automatically unwrapped outside try block");
                    }
                  }
                }
              }
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
            if ( (typeof(classDesc) !== "undefined" && classDesc != null )  ) {
              varDesc = classDesc.findVariable(strname);
              if ( typeof(varDesc) === "undefined" ) {
                let classMethod = classDesc.findMethod(strname);
                if ( typeof(classMethod) === "undefined" ) {
                  classMethod = classDesc.findStaticMethod(strname);
                  if ( typeof(classMethod) === "undefined" ) {
                    ctx.addError(obj, "variable not found " + strname);
                  }
                }
                if ( (typeof(classMethod) !== "undefined" && classMethod != null )  ) {
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
        };
        return varDesc;
      }
      varDesc = ctx.getVariableDef(obj.vref);
      if ( (typeof(varDesc.nameNode) !== "undefined" && varDesc.nameNode != null )  ) {
      } else {
      }
      return varDesc;
    }
    const cc = ctx.getCurrentClass();
    return cc;
  };
  async convertToUnion (unionName, node, ctx, wr) {
    if ( ctx.isDefinedClass(unionName) ) {
      const c1 = ctx.findClass(unionName);
      if ( c1.is_union ) {
        if ( (node.type_name != c1.name) && (node.eval_type_name != c1.name) ) {
          const toEx = node.newExpressionNode();
          const toVref = node.newVRefNode("to");
          const argType = node.newVRefNode("_");
          const targetNode = node.copy();
          argType.type_name = unionName;
          (toEx).push(toVref);
          (toEx).push(argType);
          (toEx).push(targetNode);
          node.expression = true;
          node.flow_done = false;
          node.value_type = 0;
          node.getChildrenFrom(toEx);
          const wr_1 = new CodeWriter();
          await this.WalkNode(node, ctx, wr_1);
        }
      }
    }
  };
  async transformMethodToLambda (node, vFnDef, ctx, wr) {
    if ( vFnDef.isFunction() ) {
      const args = operatorsOf.map_44(vFnDef.params, ((item, index) => { 
        return item.nameNode.copy();
      }));
      const fnArg = vFnDef.nameNode.copy();
      fnArg.vref = "fn";
      const subNode = node.copy();
      subNode.flow_done = false;
      const argsExpr = operatorsOf.map_45(args, ((item, index) => { 
        return item.copy();
      }));
      if ( (((vFnDef.nameNode.type_name.length) > 0) && (vFnDef.nameNode.type_name != "void")) || ((vFnDef.nameNode.array_type.length) > 0) ) {
        const staticLambda = CodeNode.fromList([fnArg, CodeNode.fromList(args), CodeNode.blockFromList([CodeNode.fromList([CodeNode.vref1("return"), CodeNode.fromList([subNode, CodeNode.fromList(argsExpr)])])])]);
        node.getChildrenFrom(staticLambda);
      } else {
        const staticLambda_1 = CodeNode.fromList([fnArg, CodeNode.fromList(args), CodeNode.blockFromList([CodeNode.fromList([subNode, CodeNode.fromList(argsExpr)])])]);
        node.getChildrenFrom(staticLambda_1);
      }
      node.flow_done = false;
      node.expression = true;
      node.value_type = 0;
      node.vref = "";
      await this.WalkNode(node, ctx, wr);
    }
  };
  async areEqualTypes (n1, n2, ctx, wr) {
    if ( n1.eval_type == 17 ) {
      let n1Expr = n1.expression_value;
      let n2Expr = n2.expression_value;
      if ( typeof(n1Expr) === "undefined" ) {
        if ( (n1.hasParamDesc && ((typeof(n1.paramDesc.nameNode) !== "undefined" && n1.paramDesc.nameNode != null ) )) && ((typeof(n1.paramDesc.nameNode.expression_value) !== "undefined" && n1.paramDesc.nameNode.expression_value != null ) ) ) {
          n1Expr = n1.paramDesc.nameNode.expression_value;
        }
      }
      if ( typeof(n2Expr) === "undefined" ) {
        if ( (n2.hasParamDesc && ((typeof(n2.paramDesc.nameNode) !== "undefined" && n2.paramDesc.nameNode != null ) )) && ((typeof(n2.paramDesc.nameNode.expression_value) !== "undefined" && n2.paramDesc.nameNode.expression_value != null ) ) ) {
          n2Expr = n2.paramDesc.nameNode.expression_value;
        }
      }
      if ( ((typeof(n1Expr) !== "undefined" && n1Expr != null ) ) && ((typeof(n2Expr) !== "undefined" && n2Expr != null ) ) ) {
        return await this.matchLambdaArgs((n1Expr), (n2Expr), ctx, new CodeWriter());
      }
      if ( (typeof(n1Expr) !== "undefined" && n1Expr != null )  ) {
        const opList = await ctx.getOpFns(n2.vref);
        if ( (opList.length) > 0 ) {
          const newCall = CodeNode.fromList([CodeNode.vref1(n2.vref)]);
          const newExpr = CodeNode.blockNode();
          const proto = n1Expr.copy();
          const fc = proto.children[0];
          fc.vref = "fn";
          const eParams = n1Expr.children[1];
          await operatorsOf.forEach_15(eParams.children, ((item, index) => { 
            newCall.children.push(CodeNode.vref1(item.vref));
          }));
          if ( fc.type_name != "void" ) {
            newExpr.children.push(CodeNode.fromList([CodeNode.vref1("return"), newCall]));
          } else {
            newExpr.children.push(newCall);
          }
          proto.children.push(newExpr);
          n2.value_type = 0;
          n2.expression_value = proto.copy();
          n2.expression = true;
          n2.flow_done = false;
          n2.vref = "";
          n2.ns.length = 0;
          n2.getChildrenFrom(proto.copy());
          await this.WalkNode(n2, ctx, wr);
          n2.expression_value = proto;
          return await this.areEqualTypes(n1, n2, ctx, wr);
        }
      }
      if ( n2.eval_type == 28 ) {
        const pDesc = n2.paramDesc;
        await this.transformMethodToLambda(n2, pDesc, ctx, wr);
        return true;
      }
      const vFnDef = this.findFunctionDesc(n2, ctx, wr);
      if ( (typeof(vFnDef) !== "undefined" && vFnDef != null )  ) {
        await this.transformMethodToLambda(n2, vFnDef, ctx, wr);
        return true;
      }
      ctx.addError(n2, "Was not able to evaluate lambda expression types!");
      if ( (typeof(n1Expr) !== "undefined" && n1Expr != null )  ) {
        ctx.addError(n1, "^ " + n1Expr.getCode());
      } else {
        ctx.addError(n1, "^ expression_value not found (1)");
      }
      if ( (typeof(n2Expr) !== "undefined" && n2Expr != null )  ) {
        ctx.addError(n2, "^ " + n2Expr.getCode());
      } else {
        ctx.addError(n2, "^ expression_value not found (2)");
      }
      return false;
    }
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
          if ( c1.is_union ) {
            if ( c2.is_union == false ) {
              await this.convertToUnion(n1.eval_type_name, n2, ctx, new CodeWriter());
              if ( n2.eval_type_name == n1.eval_type_name ) {
                return true;
              } else {
                return false;
              }
            }
          }
          if ( c2.is_union != c1.is_union ) {
            ctx.addError(n1, "Can not convert union to type ");
            return false;
          }
          if ( (c2.is_union == true) && (c1.is_union == true) ) {
            ctx.addError(n1, (("Union types must be the same =>  " + n1.eval_type_name) + " <> ") + n2.eval_type_name);
            return false;
          }
          if ( c1.isSameOrParentClass(n2.eval_type_name, ctx) ) {
            return true;
          }
          if ( c2.isSameOrParentClass(n1.eval_type_name, ctx) ) {
            return true;
          }
        }
        if ( b_ok == false ) {
          if ( n1.eval_type_name == "Any" ) {
            await this.convertToUnion("Any", n2, ctx, new CodeWriter());
            if ( n2.eval_type_name == n1.eval_type_name ) {
              return true;
            } else {
              return false;
            }
          }
          return false;
        }
      }
    }
    return true;
  };
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
  };
  shouldBeExpression (n1, ctx, msg) {
    if ( n1.expression == false ) {
      ctx.addError(n1, msg);
    }
  };
  shouldHaveChildCnt (cnt, n1, ctx, msg) {
    if ( (n1.children.length) != cnt ) {
      ctx.addError(n1, msg);
    }
  };
  async findLanguageOper (details, ctx, opDef) {
    const langName = operatorsOf_21.getTargetLang_22(ctx);
    let rv;
    for ( let i = 0; i < details.children.length; i++) {
      var det = details.children[i];
      if ( (det.children.length) > 0 ) {
        const fc = det.children[0];
        if ( fc.vref == "templates" ) {
          const tplList = det.children[1];
          for ( let i_1 = 0; i_1 < tplList.children.length; i_1++) {
            var tpl = tplList.children[i_1];
            if ( tpl.hasExpressionProperty("flags") ) {
              const flagList = tpl.getExpressionProperty("flags");
              let b_matched = false;
              await operatorsOf.forEach_15(flagList.children, ((item, index) => { 
                b_matched = b_matched || ctx.hasCompilerFlag(item.vref);
              }));
              if ( b_matched == false ) {
                continue;
              }
            }
            const tplName = tpl.getFirst();
            if ( (tplName.vref != "*") && (tplName.vref != langName) ) {
              continue;
            }
            rv = tpl;
            return rv;
          };
          if ( langName == "ranger" ) {
            const opNameNode = opDef.getFirst();
            const opArgs = opDef.getThird();
            const rangerTpl = CodeNode.fromList([CodeNode.newStr((("(" + opNameNode.vref) + " "))]);
            let cnt = 1;
            await operatorsOf.forEach_15(opArgs.children, ((item, index) => { 
              if ( item.type_name == "block" ) {
                rangerTpl.children.push(CodeNode.fromList([CodeNode.vref1("block"), CodeNode.newInt(cnt)]));
              } else {
                rangerTpl.children.push(CodeNode.fromList([CodeNode.vref1("e"), CodeNode.newInt(cnt)]));
              }
              cnt = cnt + 1;
            }));
            rangerTpl.children.push(CodeNode.newStr(")"));
            rv = CodeNode.fromList([CodeNode.vref1("ranger"), rangerTpl]);
          }
        }
      }
    };
    return rv;
  };
  async buildMacro (langOper, args, ctx) {
    const subCtx = ctx.fork();
    const wr = new CodeWriter();
    const lcc = new LiveCompiler();
    lcc.langWriter = new RangerRangerClassWriter();
    lcc.langWriter.compiler = lcc;
    subCtx.targetLangName = "ranger";
    subCtx.restartExpressionLevel();
    const macroNode = langOper;
    const cmdList = macroNode.getSecond();
    if ( ctx.hasCompilerFlag("show-macros") ) {
      console.log((("Building macro " + macroNode.vref) + " : ") + cmdList.getCode());
      console.log("Arguments : " + args.getCode());
    }
    await lcc.walkCommandList(cmdList, args, subCtx, wr);
    const lang_str = wr.getCode();
    const lang_code = new SourceCode(lang_str);
    lang_code.filename = ("<macro " + macroNode.vref) + ">";
    const lang_parser = new RangerLispParser(lang_code);
    lang_parser.parse(ctx.hasCompilerFlag("no-op-transform"));
    const node = lang_parser.rootNode;
    if ( (args.register_expressions.length) > 0 ) {
      node.register_expressions = operatorsOf.clone_46(args.register_expressions);
    }
    await operatorsOf.forEach_15(args.children, (async (item, index) => { 
      await operatorsOf.forEach_15(item.register_expressions, ((item, index) => { 
        const re = item;
        node.register_expressions.push(re);
      }));
    }));
    return node;
  };
  async stdParamMatch (callArgs, inCtx, wr, require_all_match) {
    this.stdCommands = inCtx.getStdCommands();
    const callFnName = callArgs.getFirst();
    /** unused:  const cmds = this.stdCommands   **/ 
    let some_matched = false;
    /** unused:  const found_fn = false   **/ 
    let added_ns = "";
    /** unused:  let missed_args = []   **/ 
    let ctx = inCtx.fork();
    /** unused:  const lang_name = operatorsOf_21.getTargetLang_22(ctx)   **/ 
    let expects_error = false;
    const err_cnt = inCtx.getErrorCount();
    let arg_eval_start = 0;
    if ( callArgs.hasBooleanProperty("error") ) {
      expects_error = true;
    }
    if ( inCtx.expressionLevel() == 0 ) {
      inCtx.lastBlockOp = callArgs;
    } else {
    }
    /** unused:  const in_chain = false   **/ 
    const call_arg_cnt = callArgs.children.length;
    const op_list = await ctx.getOperators(callFnName.vref);
    for ( let main_index = 0; main_index < op_list.length; main_index++) {
      var ch = op_list[main_index];
      const fc = ch.getFirst();
      const nameNode = ch.getSecond();
      const args = ch.getThird();
      if ( inCtx.isVarDefined(fc.vref) ) {
        return false;
      }
      ctx.removeOpNs(added_ns);
      ctx.addOpNs(fc.vref);
      added_ns = fc.vref;
      /** unused:  const line_index = callArgs.getLine()   **/ 
      const callerArgCnt = call_arg_cnt - 1;
      const fnArgCnt = args.children.length;
      let has_eval_ctx = false;
      let is_macro = false;
      let plugin_name = "operator";
      let plugin_fn = "";
      let is_plugin = false;
      let is_pure = false;
      let is_static_fn = false;
      let static_fn_name = "";
      let static_class_name = "";
      let static_nameNode;
      if ( nameNode.hasFlag("newcontext") ) {
        ctx = inCtx.fork();
        has_eval_ctx = true;
      }
      const throws_exception = nameNode.hasFlag("throws");
      const is_async = nameNode.hasFlag("async");
      const expanding_node = nameNode.hasFlag("expands");
      if ( (callerArgCnt == fnArgCnt) || expanding_node ) {
        const details_list = ch.children[3];
        const langOper = await this.findLanguageOper(details_list, ctx, ch);
        if ( typeof(langOper) === "undefined" ) {
          continue;
        }
        is_pure = nameNode.hasFlag("pure");
        if ( langOper.hasBooleanProperty("macro") || nameNode.hasFlag("macro") ) {
          is_macro = true;
        }
        if ( langOper.hasStringProperty("plugin") ) {
          plugin_name = langOper.getStringProperty("plugin");
          is_plugin = true;
          const pluginFn = langOper.getStringProperty("fn");
          if ( (pluginFn.length) > 0 ) {
            plugin_fn = pluginFn;
            console.log("Function : " + plugin_fn);
          }
        }
        const codeDef = langOper.getSecond();
        const match = new RangerArgMatch();
        let last_walked = 0;
        let last_was_block = false;
        let walk_later = [];
        let not_enough_args = false;
        let blocksToWalkLater = [];
        if ( ch.hasExpressionProperty("flags") ) {
          const flagList = ch.getExpressionProperty("flags");
          let b_matched = false;
          await operatorsOf.forEach_15(flagList.children, ((item, index) => { 
            b_matched = b_matched || ctx.hasCompilerFlag(item.vref);
          }));
          if ( b_matched == false ) {
            continue;
          }
        }
        ctx.setInExpr();
        for ( let i = 0; i < args.children.length; i++) {
          var arg = args.children[i];
          if ( i < arg_eval_start ) {
            continue;
          }
          arg_eval_start = i;
          if ( (callArgs.children.length) <= (i + 1) ) {
            not_enough_args = true;
            break;
          }
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
          if ( arg.hasFlag("keyword") ) {
            if ( callArg.vref != arg.vref ) {
              not_enough_args = true;
            }
            continue;
          }
          if ( arg.hasFlag("noeval") ) {
            callArg.eval_type = callArg.value_type;
            callArg.eval_type_name = callArg.type_name;
            callArg.eval_array_type = callArg.array_type;
            callArg.eval_key_type = callArg.key_type;
            continue;
          }
          last_walked = i + 1;
          if ( arg.value_type == 17 ) {
            const opList = await ctx.getOpFns(callArg.vref);
            if ( (opList.length) > 0 ) {
              const signature = arg.expression_value.copy();
              /** unused:  const params = signature.children[1]   **/ 
            }
            if ( codeDef.is_block_node == false ) {
              const later = new WalkLater();
              later.arg = arg;
              later.callArg = callArg;
              walk_later.push(later);
            }
          } else {
            if ( (arg.type_name == "block") || arg.hasFlag("block") ) {
              if ( arg.hasFlag("try_block") ) {
                const tmpCtx = ctx.fork();
                tmpCtx.is_try_block = true;
                callArg.evalCtx = tmpCtx;
                tmpCtx.newBlock();
                await this.WalkNode(callArg, tmpCtx, wr);
              } else {
                const tmpCtx_1 = ctx.fork();
                tmpCtx_1.newBlock();
                callArg.evalCtx = tmpCtx_1;
                await this.WalkNode(callArg, tmpCtx_1, wr);
              }
              last_was_block = true;
            } else {
              ctx.setInExpr();
              await this.WalkNode(callArg, ctx, wr);
              ctx.unsetInExpr();
              if ( (arg.type_name.length) > 0 ) {
                await this.convertToUnion(arg.type_name, callArg, ctx, wr);
              }
              last_was_block = false;
            }
            if ( arg.hasFlag("mutates") ) {
              if ( callArg.hasParamDesc ) {
                if ( typeof(callArg.paramDesc) != "undefined" && ((typeof(callArg.paramDesc.propertyClass) !== "undefined" && callArg.paramDesc.propertyClass != null ) ) ) {
                  if ( callArg.paramDesc.propertyClass.nameNode.hasFlag("immutable") ) {
                    const propC = callArg.paramDesc.propertyClass;
                    const currC = ctx.getCurrentClass();
                    if ( (currC) != (propC) ) {
                      not_enough_args = true;
                    }
                  }
                }
              }
            }
          }
        };
        ctx.unsetInExpr();
        if ( not_enough_args ) {
          continue;
        }
        if ( expanding_node ) {
          for ( let i2 = 0; i2 < callArgs.children.length; i2++) {
            var caCh = callArgs.children[i2];
            if ( caCh.is_block_node ) {
              const tmpCtx_2 = ctx;
              caCh.evalCtx = tmpCtx_2;
              blocksToWalkLater.push(caCh);
              continue;
            }
            if ( i2 > last_walked ) {
              if ( last_was_block ) {
                const sCtx = ctx.forkWithOps((ch.children[3]));
                await this.WalkNode(caCh, sCtx, wr);
              } else {
                ctx.setInExpr();
                await this.WalkNode(caCh, ctx, wr);
                ctx.unsetInExpr();
              }
            }
          };
        }
        const all_matched = match.matchArguments(args, callArgs, ctx, 1);
        if ( all_matched ) {
          const expr_level = ctx.expressionLevel();
          let is_last = false;
          if ( (typeof(callArgs.parent) !== "undefined" && callArgs.parent != null )  ) {
            is_last = (callArgs.parent.children.length) == (1 + (callArgs.parent.children.indexOf(callArgs)));
          }
          if ( ((fc.vref == "if") && ctx.hasCompilerFlag("voidexpr")) && ((expr_level > 0) || is_last) ) {
            console.log("IF expr leve == " + ctx.expressionLevel());
            console.log(callArgs.getCode());
            const thenBlock = callArgs.children[2];
            const lastRow = thenBlock.children[((thenBlock.children.length) - 1)];
            console.log("Last row == " + lastRow.getCode());
            const BlockOP = ctx.getLastBlockOp();
            const regName = ctx.createNewRegName();
            const regExpr = CodeNode.fromList([CodeNode.vref1("def"), CodeNode.vref2(regName, lastRow.eval_type_name)]);
            callArgs.eval_type = lastRow.eval_type;
            callArgs.eval_type_name = lastRow.eval_type_name;
            const fnC = ctx.findFunctionCtx();
            await this.WalkNode(regExpr, fnC, wr);
            const realRegName = (((regExpr.children[1])).paramDesc).compiledName;
            let then_regs = false;
            if ( (lastRow.register_name.length) > 0 ) {
              const newLastRow = CodeNode.fromList([CodeNode.vref1("="), CodeNode.vref1(regName), CodeNode.vref1(lastRow.register_name)]);
              await this.WalkNode(newLastRow, ctx, wr);
              thenBlock.children.push(newLastRow);
              then_regs = true;
            } else {
              const vCopy = await lastRow.cleanCopy();
              lastRow.expression = true;
              lastRow.vref = "";
              lastRow.value_type = 0;
              lastRow.flow_done = false;
              lastRow.getChildrenFrom(CodeNode.fromList([CodeNode.vref1("="), CodeNode.vref1(regName), vCopy]));
              await this.WalkNode(lastRow, ctx, wr);
            }
            if ( (callArgs.children.length) == 4 ) {
              const elseBlock = callArgs.children[3];
              const lastRow_1 = elseBlock.children[((elseBlock.children.length) - 1)];
              if ( (lastRow_1.register_name.length) > 0 ) {
                const newLastRow_1 = CodeNode.fromList([CodeNode.vref1("="), CodeNode.vref1(regName), CodeNode.vref1(lastRow_1.register_name)]);
                await this.WalkNode(newLastRow_1, ctx, wr);
                elseBlock.children.push(newLastRow_1);
                then_regs = true;
              } else {
                const vCopy_1 = await lastRow_1.cleanCopy();
                lastRow_1.expression = true;
                lastRow_1.vref = "";
                lastRow_1.value_type = 0;
                lastRow_1.flow_done = false;
                lastRow_1.getChildrenFrom(CodeNode.fromList([CodeNode.vref1("="), CodeNode.vref1(regName), vCopy_1]));
                console.log(" lastRow value --> " + vCopy_1.getCode());
                await this.WalkNode(lastRow_1, ctx, wr);
              }
            }
            const tmp = (callArgs).clone();
            BlockOP.register_expressions.push(regExpr);
            BlockOP.register_expressions.push(tmp);
            callArgs.register_name = regName;
            callArgs.reg_compiled_name = realRegName;
            tmp.has_operator = true;
            tmp.op_index = main_index;
            tmp.operator_node = ch;
            return true;
          }
          if ( (fc.vref != "for") && ctx.hasCompilerFlag("new") ) {
            const opDef = langOper.getSecond();
            let opCnts = {};
            let regNames = {};
            let firstRef = {};
            await operatorsOf.forEach_15(args.children, (async (item, index) => { 
              const opArg = item;
              if ( opArg.hasFlag("loopcondition") ) {
                let loopBlock;
                await operatorsOf.forEach_15(args.children, ((item, index) => { 
                  if ( item.hasFlag("loopblock") ) {
                    const tmp_1 = callArgs.children[(index + 1)];
                    loopBlock = tmp_1;
                  }
                }));
                if ( typeof(loopBlock) === "undefined" ) {
                  ctx.addError(args, "Invalid operator: Loop condition without block ");
                  return;
                }
                const opName = index + 1;
                /** unused:  const item = callArgs.children[(index + 1)]   **/ 
                let regName_1 = "";
                const realArg = callArgs.children[opName];
                if ( (realArg.register_name.length) > 0 ) {
                  regName_1 = realArg.register_name;
                } else {
                  regName_1 = ctx.createNewRegName();
                }
                const argCopy = realArg.copy();
                const regExpr_1 = CodeNode.fromList([CodeNode.vref1("def"), CodeNode.vref1(regName_1), argCopy]);
                ctx.lastBlockOp = callArgs;
                await this.WalkNode(regExpr_1, ctx, wr);
                const realRegName_1 = (((regExpr_1.children[1])).paramDesc).compiledName;
                const regArg = regExpr_1.children[1];
                regArg.paramDesc.set_cnt = 1;
                regArg.paramDesc.ref_cnt = 1;
                const BlockOP_1 = ctx.getLastBlockOp();
                BlockOP_1.register_expressions.push(regExpr_1);
                realArg.register_name = regName_1;
                realArg.reg_compiled_name = realRegName_1;
                await operatorsOf.forEach_15(callArgs.children, (async (item, index) => { 
                  if ( item.is_block_node ) {
                    const argCopy_1 = realArg.copy();
                    argCopy_1.register_name = "";
                    await argCopy_1.forTree(((item, i) => { 
                      item.register_name = "";
                    }));
                    const eval_expr = CodeNode.fromList([CodeNode.vref1("="), CodeNode.vref1(regName_1), argCopy_1]);
                    /** unused:  const lastOp = loopBlock.children[((loopBlock.children.length) - 1)]   **/ 
                    ctx.lastBlockOp = eval_expr;
                    await this.WalkNode(eval_expr, ctx, wr);
                    item.children.push(eval_expr);
                  }
                }));
              }
            }));
            await operatorsOf.forEach_15(opDef.children, (async (item, index) => { 
              if ( item.isFirstVref("e") ) {
                if ( item.hasFlag("ignore") || item.hasFlag("noeval") ) {
                  return;
                }
                const opName_1 = (item.getSecond()).int_value;
                /** unused:  const opArg_1 = args.children[(opName_1 - 1)]   **/ 
                if ( ( typeof(opCnts[opName_1] ) != "undefined" && opCnts.hasOwnProperty(opName_1) ) ) {
                  let regName_2 = "";
                  const realArg_1 = callArgs.children[opName_1];
                  let just_vref = ((a) => { 
                  });
                  just_vref = ((a) => { 
                    if ( (a.vref.length) > 0 ) {
                      return true;
                    }
                    if ( TTypes.isPrimitive(a.value_type) ) {
                      return true;
                    }
                    if ( (a.children.length) == 1 ) {
                      return just_vref((a.children[0]));
                    }
                    return false;
                  });
                  if ( await just_vref(realArg_1) ) {
                    return;
                  }
                  if ( ( typeof(regNames[opName_1] ) != "undefined" && regNames.hasOwnProperty(opName_1) ) ) {
                    if ( (realArg_1.register_name.length) > 0 ) {
                      regName_2 = realArg_1.register_name;
                    } else {
                      regName_2 = (regNames[opName_1]);
                    }
                    realArg_1.register_name = regName_2;
                  } else {
                    if ( (realArg_1.register_name.length) > 0 ) {
                      regName_2 = realArg_1.register_name;
                    } else {
                      regName_2 = ctx.createNewRegName();
                      regNames[opName_1] = regName_2;
                      const argCopy_2 = realArg_1.copy();
                      const regExpr_2 = CodeNode.fromList([CodeNode.vref1("def"), CodeNode.vref1(regName_2), argCopy_2]);
                      await this.WalkNode(regExpr_2, ctx, wr);
                      const regArg_1 = regExpr_2.children[1];
                      const realRegName_2 = (((regExpr_2.children[1])).paramDesc).compiledName;
                      regArg_1.paramDesc.set_cnt = 1;
                      regArg_1.paramDesc.ref_cnt = 1;
                      const BlockOP_2 = ctx.getLastBlockOp();
                      BlockOP_2.register_expressions.push(regExpr_2);
                      realArg_1.register_name = regName_2;
                      realArg_1.reg_compiled_name = realRegName_2;
                    }
                  }
                } else {
                  opCnts[opName_1] = 1;
                  firstRef[opName_1] = item;
                }
              }
            }));
          }
        }
        if ( all_matched ) {
          if ( is_async ) {
            let activeFn = ctx.getCurrentMethod();
            if ( (typeof(activeFn.nameNode) !== "undefined" && activeFn.nameNode != null )  ) {
              activeFn.nameNode.setFlag("async");
            }
            while ((typeof(activeFn.insideFn) !== "undefined" && activeFn.insideFn != null ) ) {
              activeFn = activeFn.insideFn;
              if ( (typeof(activeFn.nameNode) !== "undefined" && activeFn.nameNode != null )  ) {
                activeFn.nameNode.setFlag("async");
              }
            };
          }
          if ( throws_exception ) {
            if ( false == ctx.isTryBlock() ) {
              const activeFn_1 = ctx.getCurrentMethod();
              if ( ((typeof(activeFn_1.nameNode) !== "undefined" && activeFn_1.nameNode != null ) ) && activeFn_1.nameNode.hasFlag("throws") ) {
              } else {
                ctx.addError(callArgs, ("The operator " + fc.vref) + " potentially throws an exception, try { } block is required");
              }
            }
          }
          for ( let i_1 = 0; i_1 < blocksToWalkLater.length; i_1++) {
            var b = blocksToWalkLater[i_1];
            const localFork = b.evalCtx.fork();
            await this.WalkNode(b, localFork, wr);
          };
          for ( let i_2 = 0; i_2 < walk_later.length; i_2++) {
            var later_1 = walk_later[i_2];
            const ca = later_1.callArg;
            const aa = later_1.arg;
            /** unused:  const newNode = new CodeNode(ca.code, ca.sp, ca.ep)   **/ 
            if ( (ca.is_block_node && (ca.isFirstVref("fn") == false)) && (ca.isFirstVref("fun") == false) ) {
              const fnDef = aa.expression_value;
              const copyOf = fnDef.rebuildWithType(match, false);
              const ffc = copyOf.children[0];
              ffc.vref = "fun";
              const itemCopy = ca.rebuildWithType(match, false);
              copyOf.children.push(itemCopy);
              let cnt = ca.children.length;
              while (cnt > 0) {
                ca.children.pop();
                cnt = cnt - 1;
              };
              for ( let i_3 = 0; i_3 < copyOf.children.length; i_3++) {
                var ch_1 = copyOf.children[i_3];
                ca.children.push(ch_1);
              };
            }
            const sCtx_1 = ctx.fork();
            sCtx_1.newBlock();
            await this.WalkNode(ca, sCtx_1, wr);
          };
        }
        let staticMethod;
        if ( codeDef.is_block_node && all_matched ) {
          const pure_transform = ctx.hasCompilerFlag("pure");
          if ( is_pure && pure_transform ) {
            const argDefs = CodeNode.blockFromList(operatorsOf.map_45(args.children, ((item, index) => { 
              const callArg_1 = callArgs.children[(index + 1)];
              const arg_1 = item;
              const vName = item.copy();
              /** unused:  const caCopy = callArg_1.copy()   **/ 
              const prms = this.transformParams2([callArg_1], [arg_1], ctx);
              const firstp = prms[0];
              const ad = CodeNode.op3("def", [vName, firstp]);
              return ad;
            })));
            const bodyStart = CodeNode.blockFromList([argDefs, codeDef]);
            const newCtx = ctx.fork();
            const bodyCopy = bodyStart.rebuildWithType(match, true);
            callArgs.flow_done = false;
            callArgs.getChildrenFrom(bodyCopy);
            await this.WalkNode(callArgs, newCtx, wr);
            return true;
          }
          let nSig = "";
          if ( (args.children.length) > 0 ) {
            const arg0 = args.getFirst();
            nSig = this.getNameSignature(arg0);
          } else {
            nSig = this.getVoidNameSignature();
          }
          const new_cl = ctx.createOpStaticClass(nSig);
          await this.WalkNode(new_cl.classNode, ctx, wr);
          const bodyCopy_1 = codeDef.rebuildWithType(match, true);
          const argsCopy = args.rebuildWithType(match, true);
          const nameCopy = nameNode.rebuildWithType(match, true);
          const sigN = ctx.transformOpNameWord(fc.vref);
          const argsSig = sigN + this.getArgsSignature(argsCopy);
          if ( false == new_cl.hasStaticMethod(argsSig) ) {
            const sMethod = await ctx.createStaticMethod(argsSig, new_cl, nameCopy, argsCopy, bodyCopy_1, this, wr);
            staticMethod = sMethod;
            const currM = ctx.getCurrentMethod();
            currM.addCallTo(sMethod);
            static_nameNode = nameCopy;
            const fCtx = sMethod.fnCtx;
            fCtx.currentMethod = sMethod;
            fCtx.is_function = true;
            const m = sMethod;
            fCtx.in_static_method = true;
            if ( nameCopy.hasFlag("weak") ) {
              m.changeStrength(0, 1, nameNode);
            } else {
              m.changeStrength(1, 1, nameNode);
            }
            fCtx.setInMethod();
            for ( let i_4 = 0; i_4 < m.params.length; i_4++) {
              var v = m.params[i_4];
              fCtx.defineVariable(v.name, v);
              v.nameNode.eval_type = v.nameNode.typeNameAsType(fCtx);
              v.nameNode.eval_type_name = v.nameNode.type_name;
            };
            await this.WalkNodeChildren(bodyCopy_1, fCtx, wr);
            fCtx.unsetInMethod();
            fCtx.in_static_method = false;
            fCtx.function_level_context = true;
            for ( let i_5 = 0; i_5 < fCtx.localVarNames.length; i_5++) {
              var n = fCtx.localVarNames[i_5];
              const p_1 = fCtx.localVariables[n];
              if ( p_1.set_cnt > 0 ) {
                if ( p_1.is_immutable ) {
                  ctx.addError(callArgs, "Immutable variable was assigned");
                }
                const defNode = p_1.node;
                defNode.setFlag("mutable");
                const nNode = p_1.nameNode;
                nNode.setFlag("mutable");
              }
            };
          } else {
            const sMethod_1 = new_cl.findStaticMethod(argsSig);
            static_nameNode = sMethod_1.nameNode;
            const currM_1 = ctx.getCurrentMethod();
            currM_1.addCallTo(sMethod_1);
            staticMethod = sMethod_1;
          }
          is_static_fn = true;
          static_fn_name = argsSig;
          static_class_name = new_cl.name;
        }
        if ( all_matched ) {
          if ( is_static_fn ) {
            const firstArg = callArgs.getFirst();
            firstArg.vref = (static_class_name + ".") + static_fn_name;
            firstArg.flow_done = false;
            firstArg.value_type = 11;
            firstArg.ns.length = 0;
            firstArg.ns.push(static_class_name);
            firstArg.ns.push(static_fn_name);
            const newArgs = new CodeNode(callArgs.code, callArgs.sp, callArgs.ep);
            for ( let i_6 = 0; i_6 < callArgs.children.length; i_6++) {
              var ca_1 = callArgs.children[i_6];
              if ( ca_1.is_part_of_chain ) {
                continue;
              }
              if ( i_6 > 0 ) {
                const arg_2 = args.children[(i_6 - 1)];
                if ( arg_2.hasFlag("noeval") ) {
                  continue;
                }
                newArgs.children.push(ca_1);
              }
            };
            let arg_len = callArgs.children.length;
            while (arg_len > 1) {
              callArgs.children.pop();
              arg_len = arg_len - 1;
            };
            callArgs.children.push(newArgs);
            callArgs.flow_done = false;
            await this.WalkNode(callArgs, ctx, wr);
            /** unused:  const currMM = ctx.getCurrentMethod()   **/ 
            for ( let i_7 = 0; i_7 < newArgs.children.length; i_7++) {
              var ca_2 = newArgs.children[i_7];
              if ( ca_2.eval_type == 17 ) {
                if ( (typeof(ca_2.lambdaFnDesc) !== "undefined" && ca_2.lambdaFnDesc != null )  ) {
                  if ( (typeof(staticMethod) !== "undefined" && staticMethod != null )  ) {
                    staticMethod.addCallTo(ca_2.lambdaFnDesc);
                    if ( ca_2.lambdaFnDesc.nameNode.hasFlag("async") ) {
                      staticMethod.nameNode.setFlag("async");
                    }
                  }
                }
              }
              await ca_2.forTree(((item, i) => { 
                if ( (typeof(item.fnDesc) !== "undefined" && item.fnDesc != null )  ) {
                  if ( (typeof(staticMethod) !== "undefined" && staticMethod != null )  ) {
                    staticMethod.addCallTo(item.fnDesc);
                  }
                }
              }));
            };
            match.setRvBasedOn(static_nameNode, callArgs);
            ctx.removeOpNs(added_ns);
            return true;
          }
          if ( is_plugin ) {
            try {
              const fileName = ((process.cwd()) + "/") + plugin_name;
              console.log("trying to load plugin: " + fileName);
              const plugin = require( fileName );
              ( (new plugin.Plugin () )[plugin_fn] )( callArgs, ctx , wr );
              callArgs.flow_done = false;
              await this.WalkNode(callArgs, ctx, wr);
              match.setRvBasedOn(nameNode, callArgs);
              ctx.removeOpNs(added_ns);
              console.log("plugin ready...");
            } catch(e) {
              ctx.addError(callArgs, "Plugin operator failed " + (( e.toString())));
            }
            return true;
          }
          if ( is_macro ) {
            const macroNode = await this.buildMacro(langOper, callArgs, ctx);
            let arg_len_1 = callArgs.children.length;
            while (arg_len_1 > 0) {
              callArgs.children.pop();
              arg_len_1 = arg_len_1 - 1;
            };
            callArgs.children.push(macroNode);
            macroNode.parent = callArgs;
            await this.WalkNode(macroNode, ctx, wr);
            match.setRvBasedOn(nameNode, callArgs);
            ctx.removeOpNs(added_ns);
            return true;
          }
          if ( nameNode.hasFlag("moves") ) {
            const moves_opt = nameNode.getFlag("moves");
            const moves = moves_opt;
            const ann = moves.vref_annotation;
            const from = ann.getFirst();
            const toItem = ann.getSecond();
            const cA = callArgs.children[from.int_value];
            const cA2 = callArgs.children[toItem.int_value];
            if ( cA.hasParamDesc ) {
              const pp = cA.paramDesc;
              const pp2 = cA2.paramDesc;
              pp.moveRefTo(callArgs, pp2, ctx);
            }
          }
          if ( nameNode.hasFlag("returns") ) {
            const activeFn_2 = ctx.getCurrentMethod();
            if ( (activeFn_2.nameNode.type_name != "void") || (activeFn_2.nameNode.value_type == 17) ) {
              if ( (callArgs.children.length) < 2 ) {
                ctx.addError(callArgs, " missing return value !!!");
              } else {
                const returnedValue = callArgs.children[1];
                let validated_returnvalue = false;
                if ( activeFn_2.nameNode.value_type == 17 ) {
                  validated_returnvalue = true;
                  const fnExpr = activeFn_2.nameNode.expression_value;
                  if ( typeof(fnExpr) === "undefined" ) {
                    ctx.addError(activeFn_2.nameNode, "returned anonymous function should have a method signature");
                  } else {
                    if ( (returnedValue.value_type != 17) && (returnedValue.eval_type != 17) ) {
                      ctx.addError(returnedValue, "Function should return anonymous function!");
                    } else {
                      if ( returnedValue.hasParamDesc && ((typeof(returnedValue.paramDesc.nameNode) !== "undefined" && returnedValue.paramDesc.nameNode != null ) ) ) {
                        const rExpr = returnedValue.paramDesc.nameNode.expression_value;
                        await this.matchLambdaArgs(fnExpr, rExpr, ctx, wr);
                      } else {
                        const rExpr_1 = returnedValue.expression_value;
                        await this.matchLambdaArgs(fnExpr, rExpr_1, ctx, wr);
                      }
                    }
                  }
                }
                if ( validated_returnvalue == false ) {
                  if ( match.doesMatch((activeFn_2.nameNode), returnedValue, ctx) == false ) {
                    if ( activeFn_2.nameNode.ifNoTypeSetToEvalTypeOf(returnedValue) ) {
                    } else {
                      ctx.addError(returnedValue, "invalid return value type!!! " + returnedValue.getCode());
                      ctx.addError(returnedValue, "^ code: " + returnedValue.getCode());
                      ctx.addError(activeFn_2.nameNode, "^ regarding to");
                      if ( returnedValue.eval_type == 28 ) {
                        ctx.addError(activeFn_2.nameNode, "^ which was a method");
                      }
                      ctx.addError(activeFn_2.nameNode, "^ value type = " + returnedValue.eval_type);
                    }
                  }
                }
                const argNode = activeFn_2.nameNode;
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
                if ( (typeof(pp_1) !== "undefined" && pp_1 != null )  ) {
                  pp_1.moveRefTo(callArgs, activeFn_2, ctx);
                }
              }
            }
            if ( typeof(callArgs.parent) === "undefined" ) {
              ctx.addError(callArgs, "did not have parent");
              console.log("no parent => " + callArgs.getCode());
            }
            callArgs.parent.didReturnAtIndex = callArgs.parent.children.indexOf(callArgs);
          }
          if ( nameNode.hasFlag("returns") == false ) {
            match.setRvBasedOn(nameNode, callArgs);
            callArgs.evalTypeClass = TFactory.new_def_signature(nameNode, ctx, wr);
          }
          if ( has_eval_ctx ) {
            const tmpCtx_3 = ctx;
            callArgs.evalCtx = tmpCtx_3;
          }
          const nodeP = callArgs.parent;
          if ( (typeof(nodeP) !== "undefined" && nodeP != null )  ) {
          } else {
          }
          /** unused:  const sig = nameNode.buildTypeSignatureUsingMatch(match)   **/ 
          some_matched = true;
          callArgs.has_operator = true;
          callArgs.op_index = main_index;
          callArgs.operator_node = ch;
          for ( let arg_index = 0; arg_index < args.children.length; arg_index++) {
            var arg_3 = args.children[arg_index];
            if ( arg_3.has_vref_annotation ) {
              const anns = arg_3.vref_annotation;
              for ( let i_8 = 0; i_8 < anns.children.length; i_8++) {
                var ann_1 = anns.children[i_8];
                if ( ann_1.vref == "mutates" ) {
                  const theArg = callArgs.children[(arg_index + 1)];
                  if ( theArg.hasParamDesc ) {
                    theArg.paramDesc.set_cnt = theArg.paramDesc.set_cnt + 1;
                  }
                }
              };
            }
          };
          break;
        }
      }
    };
    if ( (require_all_match == true) && (some_matched == false) ) {
      ctx.addError(callArgs, "Could not match argument types for " + callFnName.vref);
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
    ctx.removeOpNs(added_ns);
    return some_matched;
  };
}
class TFactory  {
  constructor() {
  }
}
TFactory.new_class_signature = function(node, ctx, wr) {
  const sig = node.vref;
  const tc = ctx.getTypeClass(sig);
  if ( typeof(tc) === "undefined" ) {
    const newTC = ctx.addTypeClass(sig);
    newTC.value_type = node.value_type;
    newTC.is_class = true;
    newTC.name = sig;
    return newTC;
  }
  return tc;
};
TFactory.new_lambda_signature = function(node, ctx, wr) {
  const sig = TFactory.lambdaSignature(node);
  const tc = ctx.getTypeClass(sig);
  if ( typeof(tc) === "undefined" ) {
    const newTC = ctx.addTypeClass(sig);
    newTC.value_type = node.value_type;
    newTC.is_lambda = true;
    newTC.name = sig;
    return newTC;
  }
  return tc;
};
TFactory.new_def_signature_from_simple_string = function(sig, ctx, wr) {
  const tc = ctx.getTypeClass(sig);
  if ( typeof(tc) === "undefined" ) {
    const newTC = ctx.addTypeClass(sig);
    newTC.is_primitive = TTypes.isPrimitive(TTypes.nameToValue(sig));
    newTC.value_type = TTypes.nameToValue(sig);
    newTC.name = sig;
    if ( ((sig.length) > 0) == false ) {
      newTC.is_empty = true;
    }
    return newTC;
  }
  return tc;
};
TFactory.sig = function(sig, ctx, wr) {
  return TFactory.new_def_signature_from_simple_string(sig, ctx, wr);
};
TFactory.new_def_signature = function(node, ctx, wr) {
  const sig = TFactory.baseSignature(node);
  const tc = ctx.getTypeClass(sig);
  if ( typeof(tc) === "undefined" ) {
    const newTC = ctx.addTypeClass(sig);
    newTC.value_type = node.value_type;
    newTC.is_primitive = TTypes.isPrimitive(node.value_type);
    if ( node.value_type == 17 ) {
      newTC.is_lambda = true;
    }
    if ( node.value_type == 6 ) {
      newTC.arrayType = TFactory.new_def_signature_from_simple_string(node.array_type, ctx, wr);
    }
    if ( node.value_type == 7 ) {
      newTC.keyType = TFactory.new_def_signature_from_simple_string(node.key_type, ctx, wr);
      newTC.arrayType = TFactory.new_def_signature_from_simple_string(node.array_type, ctx, wr);
    }
    newTC.name = sig;
    if ( ((sig.length) > 0) == false ) {
      newTC.is_empty = true;
    }
    return newTC;
  }
  return tc;
};
TFactory.new_scalar_signature = function(node, ctx, wr) {
  const sig = TFactory.baseSignature(node);
  const tc = ctx.getTypeClass(sig);
  if ( typeof(tc) === "undefined" ) {
    const newTC = ctx.addTypeClass(sig);
    newTC.is_primitive = true;
    newTC.value_type = node.value_type;
    newTC.name = sig;
    return newTC;
  }
  return tc;
};
TFactory.type_annotation = function(node) {
  if ( node.has_type_annotation ) {
    return ("@(" + TFactory.baseSignature((node.type_annotation))) + ")";
  }
  return "";
};
TFactory.lambdaSignature = function(node) {
  const fnNode = node.getFirst();
  const argNode = node.getSecond();
  let s = "";
  s = (s + "(_:") + TFactory.baseSignature(fnNode);
  s = ((s + " (") + (operatorsOf.map_47(argNode.children, ((item, index) => { 
    return "_:" + TFactory.baseSignature(item);
  })).join(" "))) + "))";
  return s;
};
TFactory.baseSignature = function(node) {
  if ( TTypes.isPrimitive(node.value_type) ) {
    return TTypes.valueAsString(node.value_type);
  }
  let s = "";
  if ( node.value_type == 6 ) {
    s = s + "[";
    s = s + node.array_type;
    s = s + "]";
    return s;
  }
  if ( node.value_type == 7 ) {
    s = s + "[";
    s = s + node.key_type;
    s = s + ":";
    s = s + node.array_type;
    s = s + "]";
    return s;
  }
  if ( node.value_type == 17 ) {
    const fnNode = node.expression_value.getFirst();
    const argNode = node.expression_value.getSecond();
    s = (s + "(_:") + TFactory.baseSignature(fnNode);
    s = ((s + " (") + (operatorsOf.map_47(argNode.children, ((item, index) => { 
      return "_:" + TFactory.baseSignature(item);
    })).join(" "))) + "))";
    return s;
  }
  s = node.type_name + TFactory.type_annotation(node);
  return s;
};
class CallChain  {
  constructor() {
    this.methodName = "";
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
    this.compFlags = {};
  }
  lineEnding () {
    return "";
  };
  async addSystemImport (cl, ctx, wr) {
    if ( cl.is_system ) {
      const langName = operatorsOf_21.getTargetLang_22(ctx);
      if ( ( typeof(cl.systemNodes[langName] ) != "undefined" && cl.systemNodes.hasOwnProperty(langName) ) ) {
        const sNode = (cl.systemNodes[langName]);
        if ( (sNode.children.length) > 2 ) {
          const impDefs = sNode.children[2];
          await impDefs.forTree(((item, i) => { 
            if ( item.isFirstVref("imp") ) {
              const name = item.getSecond();
              wr.addImport(name.string_value);
            }
          }));
        }
      }
    }
  };
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
      };
      ii = ii + 1;
    };
    return encoded_str_2;
  };
  async CustomOperator (node, ctx, wr) {
  };
  async WriteSetterVRef (node, ctx, wr) {
  };
  writeArrayTypeDef (node, ctx, wr) {
  };
  async WriteEnum (node, ctx, wr) {
    if ( node.eval_type == 13 ) {
      const rootObjName = node.ns[0];
      const e = ctx.getEnum(rootObjName);
      if ( (typeof(e) !== "undefined" && e != null )  ) {
        const enumName = node.ns[1];
        wr.out("" + ((e.values[enumName])), false);
      } else {
        if ( node.hasParamDesc ) {
          const pp = node.paramDesc;
          const nn = pp.nameNode;
          await this.WriteVRef(nn, ctx, wr);
        }
      }
    }
  };
  WriteScalarValue (node, ctx, wr) {
    switch (node.value_type ) { 
      case 2 : 
        const dd_str = "" + node.double_value;
        const ii_str = "" + (Math.floor( node.double_value));
        if ( dd_str == ii_str ) {
          wr.out(("" + node.double_value) + ".0", false);
        } else {
          wr.out("" + node.double_value, false);
        }
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
    };
  };
  getTypeString (type_string) {
    return type_string;
  };
  import_lib (lib_name, ctx, wr) {
    wr.addImport(lib_name);
  };
  getObjectTypeString (type_string, ctx) {
    switch (type_string ) { 
      case "int" : 
        return "Integer";
      case "string" : 
        return "String";
      case "chararray" : 
        return "byte[]";
      case "char" : 
        return "byte";
      case "boolean" : 
        return "Boolean";
      case "double" : 
        return "Double";
    };
    return type_string;
  };
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
    };
    if ( ctx.is_function ) {
      return;
    }
    if ( (typeof(ctx.parent) !== "undefined" && ctx.parent != null )  ) {
      this.release_local_vars(node, ctx.parent, wr);
    }
  };
  async WalkNode (node, ctx, wr) {
    await operatorsOf.forEach_15(node.children, ((item, index) => { 
      if ( (typeof(item.evalCtx) !== "undefined" && item.evalCtx != null )  ) {
        if ( operatorsOf_21.getTargetLang_22((item.evalCtx)) != operatorsOf_21.getTargetLang_22(ctx) ) {
          item.evalCtx.targetLangName = operatorsOf_21.getTargetLang_22(ctx);
        }
      }
    }));
    if ( (typeof(node.evalCtx) !== "undefined" && node.evalCtx != null )  ) {
      await this.compiler.WalkNode(node, node.evalCtx, wr);
    } else {
      await this.compiler.WalkNode(node, ctx, wr);
    }
  };
  async writeTypeDef (node, ctx, wr) {
    wr.out(node.type_name, false);
  };
  async writeRawTypeDef (node, ctx, wr) {
    await this.writeTypeDef(node, ctx, wr);
  };
  adjustType (tn) {
    return tn;
  };
  async WriteVRef (node, ctx, wr) {
    if ( node.eval_type == 13 ) {
      if ( (node.ns.length) > 1 ) {
        const rootObjName = node.ns[0];
        const enumName = node.ns[1];
        const e = ctx.getEnum(rootObjName);
        if ( (typeof(e) !== "undefined" && e != null )  ) {
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
      };
      return;
    }
    for ( let i_1 = 0; i_1 < node.ns.length; i_1++) {
      var part = node.ns[i_1];
      if ( i_1 > 0 ) {
        wr.out(".", false);
      }
      wr.out(this.adjustType(part), false);
    };
  };
  async writeVarDef (node, ctx, wr) {
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
        await this.WalkNode(value, ctx, wr);
        ctx.unsetInExpr();
        wr.out(";", true);
      } else {
        wr.out(";", true);
      }
    }
  };
  async CreateCallExpression (node, ctx, wr) {
    if ( node.has_call ) {
      const obj = node.getSecond();
      const method = node.getThird();
      const args = node.children[3];
      wr.out("(", false);
      ctx.setInExpr();
      await this.WalkNode(obj, ctx, wr);
      ctx.unsetInExpr();
      wr.out(").", false);
      wr.out(method.vref, false);
      wr.out("(", false);
      ctx.setInExpr();
      const pms = operatorsOf.filter_36(args.children, ((item, index) => { 
        if ( item.hasFlag("keyword") ) {
          return false;
        }
        return true;
      }));
      for ( let i = 0; i < pms.length; i++) {
        var arg = pms[i];
        if ( i > 0 ) {
          wr.out(", ", false);
        }
        await this.WalkNode(arg, ctx, wr);
      };
      ctx.unsetInExpr();
      wr.out(")", false);
      if ( ctx.expressionLevel() == 0 ) {
        wr.out(";", true);
      }
    }
  };
  async CreateMethodCall (node, ctx, wr) {
    const obj = node.getFirst();
    const args = node.getSecond();
    ctx.setInExpr();
    await this.WalkNode(obj, ctx, wr);
    ctx.unsetInExpr();
    wr.out("(", false);
    ctx.setInExpr();
    const pms = operatorsOf.filter_36(args.children, ((item, index) => { 
      if ( item.hasFlag("keyword") ) {
        return false;
      }
      return true;
    }));
    for ( let i = 0; i < pms.length; i++) {
      var arg = pms[i];
      if ( i > 0 ) {
        wr.out(", ", false);
      }
      await this.WalkNode(arg, ctx, wr);
    };
    ctx.unsetInExpr();
    wr.out(")", false);
  };
  async CreatePropertyGet (node, ctx, wr) {
    const obj = node.getSecond();
    const prop = node.getThird();
    wr.out("(", false);
    ctx.setInExpr();
    await this.WalkNode(obj, ctx, wr);
    ctx.unsetInExpr();
    wr.out(").", false);
    await this.WalkNode(prop, ctx, wr);
  };
  isPackaged (ctx) {
    const package_name = ctx.getCompilerSetting("package");
    if ( (package_name.length) > 0 ) {
      return true;
    }
    return false;
  };
  async CreateUnions (parser, ctx, orig_wr) {
  };
  async CreateServices (parser, ctx, orig_wr) {
  };
  async CreatePages (parser, ctx, orig_wr) {
  };
  async CreatePage (parser, node, ctx, orig_wr) {
    ctx.addError(node, "CreatePage not implemented for the build target");
  };
  async CreateLambdaCall (node, ctx, wr) {
    const fName = node.children[0];
    const args = node.children[1];
    ctx.setInExpr();
    await this.WalkNode(fName, ctx, wr);
    wr.out("(", false);
    for ( let i = 0; i < args.children.length; i++) {
      var arg = args.children[i];
      if ( i > 0 ) {
        wr.out(", ", false);
      }
      await this.WalkNode(arg, ctx, wr);
    };
    wr.out(")", false);
    ctx.unsetInExpr();
    if ( ctx.expressionLevel() == 0 ) {
      wr.out(";", true);
    }
  };
  async CreateLambda (node, ctx, wr) {
    const lambdaCtx = node.lambda_ctx;
    const args = node.children[1];
    const body = node.children[2];
    wr.out("(", false);
    for ( let i = 0; i < args.children.length; i++) {
      var arg = args.children[i];
      if ( i > 0 ) {
        wr.out(", ", false);
      }
      if ( arg.flow_done == false ) {
        await this.compiler.parser.WalkNode(arg, lambdaCtx, wr);
      }
      await this.WalkNode(arg, lambdaCtx, wr);
    };
    wr.out(")", false);
    wr.out(" => { ", true);
    wr.indent(1);
    lambdaCtx.restartExpressionLevel();
    for ( let i_1 = 0; i_1 < body.children.length; i_1++) {
      var item = body.children[i_1];
      await this.WalkNode(item, lambdaCtx, wr);
    };
    wr.newline();
    wr.indent(-1);
    wr.out("}", true);
  };
  async writeFnCall (node, ctx, wr) {
    if ( node.hasFnCall ) {
      const fc = node.getFirst();
      await this.WriteVRef(fc, ctx, wr);
      wr.out("(", false);
      const givenArgs = node.getSecond();
      ctx.setInExpr();
      let cnt = 0;
      for ( let i = 0; i < node.fnDesc.params.length; i++) {
        var arg = node.fnDesc.params[i];
        if ( arg.nameNode.hasFlag("keyword") ) {
          continue;
        }
        if ( cnt > 0 ) {
          wr.out(", ", false);
        }
        cnt = cnt + 1;
        if ( (givenArgs.children.length) <= i ) {
          const defVal = arg.nameNode.getFlag("default");
          if ( (typeof(defVal) !== "undefined" && defVal != null )  ) {
            const fc_1 = defVal.vref_annotation.getFirst();
            await this.WalkNode(fc_1, ctx, wr);
          } else {
            ctx.addError(node, "Default argument was missing");
          }
          continue;
        }
        const n = givenArgs.children[i];
        await this.WalkNode(n, ctx, wr);
      };
      ctx.unsetInExpr();
      wr.out(")", false);
      if ( (node.methodChain.length) > 0 ) {
        for ( let i_1 = 0; i_1 < node.methodChain.length; i_1++) {
          var cc = node.methodChain[i_1];
          wr.out("." + cc.methodName, false);
          wr.out("(", false);
          ctx.setInExpr();
          for ( let i_2 = 0; i_2 < cc.args.children.length; i_2++) {
            var arg_1 = cc.args.children[i_2];
            if ( i_2 > 0 ) {
              wr.out(", ", false);
            }
            await this.WalkNode(arg_1, ctx, wr);
          };
          ctx.unsetInExpr();
          wr.out(")", false);
        };
      }
      if ( ctx.expressionLevel() == 0 ) {
        wr.out(";", true);
      }
    }
  };
  async writeNewCall (node, ctx, wr) {
    if ( node.hasNewOper ) {
      const cl = node.clDesc;
      /** unused:  const fc = node.getSecond()   **/ 
      wr.out("new " + node.clDesc.name, false);
      wr.out("(", false);
      const constr = cl.constructor_fn;
      const givenArgs = node.getThird();
      if ( (typeof(constr) !== "undefined" && constr != null )  ) {
        for ( let i = 0; i < constr.params.length; i++) {
          var arg = constr.params[i];
          const n = givenArgs.children[i];
          if ( i > 0 ) {
            wr.out(", ", false);
          }
          if ( true || ((typeof(arg.nameNode) !== "undefined" && arg.nameNode != null ) ) ) {
            await this.WalkNode(n, ctx, wr);
          }
        };
      }
      wr.out(")", false);
    }
  };
  async writeInterface (cl, ctx, wr) {
  };
  async disabledVarDef (node, ctx, wr) {
  };
  async writeArrayLiteral (node, ctx, wr) {
    wr.out("[", false);
    await operatorsOf.forEach_15(node.children, (async (item, index) => { 
      if ( index > 0 ) {
        wr.out(", ", false);
      }
      await this.WalkNode(item, ctx, wr);
    }));
    wr.out("]", false);
  };
  async writeClass (node, ctx, wr) {
    const cl = node.clDesc;
    if ( typeof(cl) === "undefined" ) {
      return;
    }
    wr.out(("class " + cl.name) + " { ", true);
    wr.indent(1);
    for ( let i = 0; i < cl.variables.length; i++) {
      var pvar = cl.variables[i];
      wr.out(((("/* var " + pvar.name) + " => ") + pvar.nameNode.parent.getCode()) + " */ ", true);
    };
    for ( let i_1 = 0; i_1 < cl.static_methods.length; i_1++) {
      var pvar_1 = cl.static_methods[i_1];
      wr.out(("/* static " + pvar_1.name) + " */ ", true);
    };
    for ( let i_2 = 0; i_2 < cl.defined_variants.length; i_2++) {
      var fnVar = cl.defined_variants[i_2];
      const mVs = cl.method_variants[fnVar];
      for ( let i_3 = 0; i_3 < mVs.variants.length; i_3++) {
        var variant = mVs.variants[i_3];
        wr.out(("function " + variant.name) + "() {", true);
        wr.indent(1);
        wr.newline();
        const subCtx = ctx.fork();
        await this.WalkNode(variant.fnBody, subCtx, wr);
        wr.newline();
        wr.indent(-1);
        wr.out("}", true);
      };
    };
    wr.indent(-1);
    wr.out("}", true);
  };
}
class AndroidPageWriter  {
  constructor() {
  }
  BuildAST (code_string) {
    const lang_code = new SourceCode(code_string);
    lang_code.filename = "<AST>";
    const lang_parser = new RangerLispParser(lang_code);
    lang_parser.parse(false);
    const node = lang_parser.rootNode;
    return node;
  };
  async CreatePage (parser, node, ctx, orig_wr) {
    const sc = node.getSecond();
    const pageName = sc.vref;
    const wr = orig_wr.getFileWriter(".", (pageName + ".java"));
    wr.out("// created by AndroidPageWriter ", true);
    const package_name = ctx.getCompilerSetting("package");
    if ( (package_name.length) > 0 ) {
      wr.out(("package " + package_name) + ";", true);
    }
    const importFork = wr.fork();
    this.classWriter.import_lib("android.content.Context", ctx, wr);
    this.classWriter.import_lib("android.support.v7.app.AppCompatActivity", ctx, wr);
    this.classWriter.import_lib("android.widget.LinearLayout", ctx, wr);
    this.classWriter.import_lib("android.view.LayoutInflater", ctx, wr);
    this.classWriter.import_lib("android.os.Bundle", ctx, wr);
    this.classWriter.import_lib("android.support.v4.app.Fragment", ctx, wr);
    this.classWriter.import_lib("android.view.ViewGroup", ctx, wr);
    this.classWriter.import_lib("android.view.View", ctx, wr);
    const package_name_2 = ctx.getCompilerSetting("package");
    if ( this.classWriter.isPackaged(ctx) ) {
      this.classWriter.import_lib(package_name_2 + ".interfaces.*", ctx, wr);
      this.classWriter.import_lib(package_name_2 + ".operators.*", ctx, wr);
      this.classWriter.import_lib(package_name_2 + ".immutables.*", ctx, wr);
    }
    wr.out(("public class " + pageName) + " extends Fragment  {", true);
    wr.indent(1);
    wr.out("public JinxProcess mainProcess; ", true);
    wr.out("@Override ", true);
    wr.out("public void onDestroyView() { ", true);
    wr.indent(1);
    wr.out("super.onDestroyView(); ", true);
    wr.out("if( mainProcess != null) mainProcess.abort();", true);
    wr.indent(-1);
    wr.out("}", true);
    wr.out("@Override", true);
    wr.out("public View onCreateView(final LayoutInflater inflater, final ViewGroup container, final Bundle savedInstanceState) {", true);
    wr.indent(1);
    wr.out(("final View view = inflater.inflate(R.layout.activity_" + pageName) + ", container, false);", true);
    const fnBody = node.children[2];
    const subCtx = ctx.fork();
    subCtx.is_function = true;
    subCtx.in_static_method = true;
    subCtx.setInMethod();
    const rootCtx = subCtx.getRoot();
    const errCnt = rootCtx.compilerErrors.length;
    const copyOf = fnBody.copy();
    await parser.WalkNodeChildren(fnBody, subCtx, wr);
    subCtx.unsetInMethod();
    subCtx.in_static_method = false;
    subCtx.function_level_context = true;
    const errCnt2 = rootCtx.compilerErrors.length;
    let cnt = errCnt2 - errCnt;
    while (cnt > 0) {
      rootCtx.compilerErrors.pop();
      cnt = cnt - 1;
    };
    const preBody = fnBody.newExpressionNode();
    const mainBody = fnBody.newExpressionNode();
    const newBody = fnBody.newExpressionNode();
    let stdCode = fnBody.newExpressionNode();
    let stdBody = fnBody.newExpressionNode();
    let in_stdCode = false;
    let pushed_std = false;
    let first_lines = true;
    const pRef = fnBody.newVRefNode("process");
    const pName = fnBody.newStringNode(pageName);
    newBody.children.push(pRef);
    newBody.children.push(pName);
    if ( pageName != "notme" ) {
      await operatorsOf.forEach_15(fnBody.children, ((item, index) => { 
        if ( item.isFirstVref("ui") || (item.eval_type_name == "JinxProcess") ) {
          if ( in_stdCode ) {
            newBody.children.push(stdCode);
            in_stdCode = false;
          }
          first_lines = false;
        }
        if ( item.isFirstVref("ui") ) {
          first_lines = false;
          const taskNode = copyOf.children[index];
          const codeToRun = taskNode.getSecond();
          const uiNode = CodeNode.op2("task.call", CodeNode.blockFromList([CodeNode.op3("def", [CodeNode.vref1("uictx"), CodeNode.op2("unwrap", CodeNode.op3("get", [CodeNode.vref1("ctx.anyValues"), CodeNode.newStr("uicontext")]))]), CodeNode.op2("print", CodeNode.newStr("after this should be ui_thread")), CodeNode.op3("case", [CodeNode.vref1("uictx"), CodeNode.vref2("c", "UIContextHandle"), CodeNode.blockFromList([CodeNode.op3("ui_thread", [CodeNode.vref1("c"), codeToRun])])])]));
          newBody.children.push(uiNode);
          return;
        }
        if ( item.eval_type_name == "JinxProcess" ) {
          const taskNode_1 = copyOf.children[index];
          newBody.children.push(taskNode_1);
        } else {
          if ( first_lines ) {
            const tt = copyOf.children[index];
            preBody.children.push(tt);
          } else {
            if ( in_stdCode == false ) {
              stdCode = fnBody.newExpressionNode();
              stdCode.children.push(fnBody.newVRefNode("task.call"));
              const callBody = fnBody.newExpressionNode();
              callBody.is_block_node = true;
              const tryC = fnBody.newExpressionNode();
              const catchC = fnBody.newExpressionNode();
              catchC.is_block_node = true;
              tryC.children.push(fnBody.newVRefNode("try"));
              stdBody = fnBody.newExpressionNode();
              stdBody.is_block_node = true;
              tryC.children.push(stdBody);
              tryC.children.push(catchC);
              callBody.children.push(tryC);
              stdCode.children.push(callBody);
              in_stdCode = true;
              pushed_std = false;
            }
            const taskNode_2 = copyOf.children[index];
            stdBody.children.push(taskNode_2);
          }
        }
      }));
    }
    if ( in_stdCode ) {
      newBody.children.push(stdCode);
    }
    const ast = this.BuildAST("\r\n def ctx (new JinxProcessCtx)\r\n ctx.anyValues = (set ctx.anyValues \"view\" view)\r\n ctx.anyValues = (set ctx.anyValues \"uicontext\" (getUIContext))\r\n ctx.anyValues = (set ctx.anyValues \"process\" mainProcess)\r\n mainProcess.start(ctx)\r\n      ");
    await operatorsOf.forEach_15(ast.children, ((item, index) => { 
      const n = item;
      mainBody.children.push(n);
    }));
    const mainPN = fnBody.newVRefNode("mainProcess");
    mainPN.type_name = "JinxProcess";
    const p = new RangerAppParamDesc();
    p.name = "mainProcess";
    p.compiledName = "mainProcess";
    p.value_type = 11;
    p.node = mainPN;
    p.nameNode = mainPN;
    p.is_optional = false;
    p.init_cnt = 1;
    subCtx.defineVariable(p.name, p);
    const mainPN_2 = fnBody.newVRefNode("view");
    mainPN_2.type_name = "View";
    const p_2 = new RangerAppParamDesc();
    p_2.name = "view";
    p_2.compiledName = "view";
    p_2.value_type = 11;
    p_2.node = mainPN_2;
    p_2.nameNode = mainPN_2;
    p_2.is_optional = false;
    p_2.init_cnt = 1;
    subCtx.defineVariable(p_2.name, p_2);
    const mainPN_3 = fnBody.newVRefNode("ctx");
    mainPN_3.type_name = "JinxProcessCtx";
    const p_3 = new RangerAppParamDesc();
    p_3.name = "ctx";
    p_3.compiledName = "ctx";
    p_3.value_type = 11;
    p_3.node = mainPN_3;
    p_3.nameNode = mainPN_3;
    p_3.is_optional = false;
    p_3.init_cnt = 1;
    subCtx.defineVariable(p_3.name, p_3);
    subCtx.is_function = true;
    subCtx.in_static_method = true;
    subCtx.setInMethod();
    await parser.WalkNode(preBody, subCtx, wr);
    await parser.WalkNode(newBody, subCtx, wr);
    await parser.WalkNode(mainBody, subCtx, wr);
    subCtx.unsetInMethod();
    subCtx.in_static_method = false;
    subCtx.function_level_context = true;
    await this.classWriter.WalkNode(preBody, subCtx, wr);
    wr.out("mainProcess = (", false);
    subCtx.setInExpr();
    await this.classWriter.WalkNode(newBody, subCtx, wr);
    subCtx.unsetInExpr();
    wr.out(");", true);
    await this.classWriter.WalkNode(mainBody, subCtx, wr);
    wr.out("return view;", true);
    wr.indent(-1);
    wr.out("}", true);
    wr.indent(-1);
    wr.out("}", true);
    const import_list = wr.getImports();
    for ( let i = 0; i < import_list.length; i++) {
      var codeStr = import_list[i];
      importFork.out(("import " + codeStr) + ";", true);
    };
  };
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
    if ( (typeof(idx) !== "undefined" && idx != null )  ) {
      return "LambdaSignature" + (idx);
    }
    this.signature_cnt = this.signature_cnt + 1;
    this.signatures[s] = this.signature_cnt;
    return "LambdaSignature" + this.signature_cnt;
  };
  adjustType (tn) {
    if ( tn == "this" ) {
      return "this";
    }
    return tn;
  };
  async getObjectTypeString2 (type_string, ctx, wr) {
    switch (type_string ) { 
      case "int" : 
        return "Integer";
      case "string" : 
        return "String";
      case "charbuffer" : 
        return "byte[]";
      case "char" : 
        return "byte";
      case "boolean" : 
        return "Boolean";
      case "double" : 
        return "Double";
    };
    if ( ctx.isDefinedClass(type_string) ) {
      const cc = ctx.findClass(type_string);
      if ( cc.is_system ) {
        /** unused:  const current_sys = ctx   **/ 
        const sName = (cc.systemNames["java7"]);
        await this.addSystemImport(cc, ctx, wr);
        return sName;
      }
      if ( cc.is_union ) {
        return "Object";
      }
    }
    return type_string;
  };
  getTypeString (type_string) {
    switch (type_string ) { 
      case "int" : 
        return "Integer";
      case "string" : 
        return "String";
      case "charbuffer" : 
        return "byte[]";
      case "char" : 
        return "byte";
      case "boolean" : 
        return "Boolean";
      case "double" : 
        return "Double";
    };
    return type_string;
  };
  async writeTypeDef (node, ctx, wr) {
    let v_type = node.value_type;
    let t_name = node.type_name;
    let a_name = node.array_type;
    let k_name = node.key_type;
    if ( ((v_type == 10) || (v_type == 11)) || (v_type == 0) ) {
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
      switch (v_type ) { 
        case 17 : 
          const sig = this.buildLambdaSignature((node.expression_value));
          const iface_name = this.getSignatureInterface(sig);
          wr.out(iface_name, false);
          if ( this.isPackaged(ctx) ) {
            const package_name = ctx.getCompilerSetting("package");
            wr.addImport(package_name + ".interfaces.*");
          }
          if ( (( typeof(this.iface_created[iface_name] ) != "undefined" && this.iface_created.hasOwnProperty(iface_name) )) == false ) {
            const fnNode = node.expression_value.children[0];
            const args = node.expression_value.children[1];
            this.iface_created[iface_name] = true;
            let iface_dir = ".";
            if ( this.isPackaged(ctx) ) {
              iface_dir = "./interfaces/";
            }
            const utilWr = wr.getFileWriter(iface_dir, (iface_name + ".java"));
            if ( this.isPackaged(ctx) ) {
              const package_name_1 = ctx.getCompilerSetting("package");
              if ( (package_name_1.length) > 0 ) {
                utilWr.out(("package " + package_name_1) + ".interfaces;", true);
                utilWr.out(("import " + package_name_1) + ".*;", true);
              }
            }
            const importFork = utilWr.fork();
            utilWr.out(("public interface " + iface_name) + " { ", true);
            utilWr.indent(1);
            utilWr.out("public ", false);
            await this.writeTypeDef(fnNode, ctx, utilWr);
            utilWr.out(" run(", false);
            for ( let i = 0; i < args.children.length; i++) {
              var arg = args.children[i];
              if ( i > 0 ) {
                utilWr.out(", ", false);
              }
              utilWr.out(" final ", false);
              await this.writeTypeDef(arg, ctx, utilWr);
              utilWr.out(" ", false);
              utilWr.out(arg.vref, false);
            };
            utilWr.out(");", true);
            utilWr.indent(-1);
            utilWr.out("}", true);
            await operatorsOf.forEach_12(utilWr.getImports(), ((item, index) => { 
              importFork.out(("import " + item) + ";", true);
            }));
          }
          break;
        case 13 : 
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
        case 14 : 
          wr.out("byte", false);
          break;
        case 15 : 
          wr.out("byte[]", false);
          break;
        case 7 : 
          wr.out(((("HashMap<" + await this.getObjectTypeString2(k_name, ctx, wr)) + ",") + await this.getObjectTypeString2(a_name, ctx, wr)) + ">", false);
          wr.addImport("java.util.*");
          break;
        case 6 : 
          wr.out(("ArrayList<" + await this.getObjectTypeString2(a_name, ctx, wr)) + ">", false);
          wr.addImport("java.util.*");
          break;
        default: 
          if ( t_name == "void" ) {
            wr.out("void", false);
          } else {
            wr.out(await this.getObjectTypeString2(t_name, ctx, wr), false);
          }
          if ( ctx.isDefinedClass(t_name) ) {
            const cc = ctx.findClass(t_name);
            if ( cc.is_system ) {
              await this.addSystemImport(cc, ctx, wr);
            }
          }
          break;
      };
    } else {
      switch (v_type ) { 
        case 17 : 
          const sig_1 = this.buildLambdaSignature((node.expression_value));
          const iface_name_1 = this.getSignatureInterface(sig_1);
          wr.out(iface_name_1, false);
          /** unused:  const package_name_2 = ctx.getCompilerSetting("package")   **/ 
          if ( (( typeof(this.iface_created[iface_name_1] ) != "undefined" && this.iface_created.hasOwnProperty(iface_name_1) )) == false ) {
            const fnNode_1 = node.expression_value.children[0];
            const args_1 = node.expression_value.children[1];
            this.iface_created[iface_name_1] = true;
            let iface_dir_1 = ".";
            if ( this.isPackaged(ctx) ) {
              iface_dir_1 = "./interfaces/";
            }
            const utilWr_1 = wr.getFileWriter(iface_dir_1, (iface_name_1 + ".java"));
            if ( this.isPackaged(ctx) ) {
              const package_name_3 = ctx.getCompilerSetting("package");
              if ( (package_name_3.length) > 0 ) {
                utilWr_1.out(("package " + package_name_3) + ".interfaces;", true);
                utilWr_1.out(("import " + package_name_3) + ".*;", true);
              }
            }
            const importFork_1 = utilWr_1.fork();
            utilWr_1.out(("public interface " + iface_name_1) + " { ", true);
            utilWr_1.indent(1);
            utilWr_1.out("public ", false);
            await this.writeTypeDef(fnNode_1, ctx, utilWr_1);
            utilWr_1.out(" run(", false);
            for ( let i_1 = 0; i_1 < args_1.children.length; i_1++) {
              var arg_1 = args_1.children[i_1];
              if ( i_1 > 0 ) {
                utilWr_1.out(", ", false);
              }
              utilWr_1.out(" final ", false);
              await this.writeTypeDef(arg_1, ctx, utilWr_1);
              utilWr_1.out(" ", false);
              utilWr_1.out(arg_1.vref, false);
            };
            utilWr_1.out(");", true);
            utilWr_1.indent(-1);
            utilWr_1.out("}", true);
            await operatorsOf.forEach_12(utilWr_1.getImports(), ((item, index) => { 
              importFork_1.out(("import " + item) + ";", true);
            }));
          }
          break;
        case 13 : 
          wr.out("Integer", false);
          break;
        case 3 : 
          wr.out("Integer", false);
          break;
        case 2 : 
          wr.out("Double", false);
          break;
        case 14 : 
          wr.out("byte", false);
          break;
        case 15 : 
          wr.out("byte[]", false);
          break;
        case 4 : 
          wr.out("String", false);
          break;
        case 5 : 
          wr.out("Boolean", false);
          break;
        case 7 : 
          wr.out(((("HashMap<" + await this.getObjectTypeString2(k_name, ctx, wr)) + ",") + await this.getObjectTypeString2(a_name, ctx, wr)) + ">", false);
          wr.addImport("java.util.*");
          break;
        case 6 : 
          wr.out(("ArrayList<" + await this.getObjectTypeString2(a_name, ctx, wr)) + ">", false);
          wr.addImport("java.util.*");
          break;
        default: 
          let b_object_set = false;
          if ( ctx.isDefinedClass(t_name) ) {
            const cc_1 = ctx.findClass(t_name);
            if ( cc_1.is_union ) {
              wr.out("Object", false);
              b_object_set = true;
            }
            if ( cc_1.is_system ) {
              await this.addSystemImport(cc_1, ctx, wr);
              const sName = (cc_1.systemNames["java7"]);
              wr.out(sName, false);
              return;
            }
          }
          if ( b_object_set == false ) {
            if ( t_name == "void" ) {
              wr.out("void", false);
            } else {
              wr.out(this.getTypeString(t_name), false);
            }
          }
          break;
      };
    }
  };
  async WriteVRef (node, ctx, wr) {
    if ( node.vref == "this" ) {
      if ( ctx.inLambda() ) {
        const currC = ctx.getCurrentClass();
        wr.out(currC.name + ".this", false);
      } else {
        wr.out("this", false);
      }
      return;
    }
    if ( node.eval_type == 13 ) {
      if ( (node.ns.length) > 1 ) {
        const rootObjName = node.ns[0];
        const enumName = node.ns[1];
        const e = ctx.getEnum(rootObjName);
        if ( (typeof(e) !== "undefined" && e != null )  ) {
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
          let p_captured_mutable = ((p.set_cnt > 0) && p.is_captured) && (p.is_class_variable == false);
          if ( (p.nameNode.value_type == 7) || (p.nameNode.value_type == 6) ) {
            p_captured_mutable = false;
          }
          const part = node.ns[0];
          if ( part == "this" ) {
            if ( ctx.inLambda() ) {
              const currC_1 = ctx.getCurrentClass();
              wr.out(currC_1.name + ".this", false);
            } else {
              const currC_2 = ctx.getCurrentClass();
              wr.out(currC_2.name + ".this", false);
            }
            continue;
          }
          if ( p_captured_mutable ) {
            wr.out("[0]", false);
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
          }
        }
      };
      return;
    }
    if ( node.hasParamDesc ) {
      const p_1 = node.paramDesc;
      wr.out(p_1.compiledName, false);
      let p_captured_mutable_1 = ((p_1.set_cnt > 0) && p_1.is_captured) && (p_1.is_class_variable == false);
      if ( (p_1.nameNode.value_type == 7) || (p_1.nameNode.value_type == 6) ) {
        p_captured_mutable_1 = false;
      }
      if ( p_captured_mutable_1 ) {
        wr.out("[0]", false);
      }
      return;
    }
    for ( let i_1 = 0; i_1 < node.ns.length; i_1++) {
      var part_1 = node.ns[i_1];
      if ( i_1 > 0 ) {
        wr.out(".", false);
      }
      if ( part_1 == "this" ) {
        if ( ctx.inLambda() ) {
          const currC_3 = ctx.getCurrentClass();
          wr.out(currC_3.name + ".this", false);
          continue;
        }
      }
      wr.out(this.adjustType(part_1), false);
    };
  };
  async disabledVarDef (node, ctx, wr) {
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
        await this.WalkNode(value, ctx, wr);
        ctx.unsetInExpr();
      } else {
        let b_was_set = false;
        if ( nn.value_type == 6 ) {
          wr.out(" = new ", false);
          await this.writeTypeDef(p.nameNode, ctx, wr);
          wr.out("()", false);
          b_was_set = true;
        }
        if ( nn.value_type == 7 ) {
          wr.out(" = new ", false);
          await this.writeTypeDef(p.nameNode, ctx, wr);
          wr.out("()", false);
          b_was_set = true;
        }
        if ( (b_was_set == false) && nn.hasFlag("optional") ) {
          wr.out(" = null", false);
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
  };
  async writeVarDef (node, ctx, wr) {
    if ( node.hasParamDesc ) {
      const nn = node.children[1];
      const p = nn.paramDesc;
      let p_captured_mutable = ((p.set_cnt > 0) && p.is_captured) && (p.is_class_variable == false);
      if ( (nn.value_type == 7) || (nn.value_type == 6) ) {
        p_captured_mutable = false;
      }
      if ( (p.ref_cnt == 0) && (p.is_class_variable == false) ) {
        wr.out("/** unused:  ", false);
      }
      if ( (p.is_captured && (p.is_class_variable == false)) && ((nn.value_type == 7) || (nn.value_type == 6)) ) {
        wr.out("final ", false);
      } else {
        if ( (p_captured_mutable == false) && ((p.set_cnt > 0) || p.is_class_variable) ) {
          wr.out("", false);
        } else {
          wr.out("final ", false);
        }
      }
      await this.writeTypeDef(p.nameNode, ctx, wr);
      if ( p_captured_mutable ) {
        wr.out("[]", false);
      }
      wr.out(" ", false);
      wr.out(p.compiledName, false);
      if ( (node.children.length) > 2 ) {
        wr.out(" = ", false);
        ctx.setInExpr();
        const value = node.getThird();
        if ( p_captured_mutable ) {
          wr.out(" new ", false);
          await this.writeTypeDef(p.nameNode, ctx, wr);
          wr.out("[]{", false);
        }
        await this.WalkNode(value, ctx, wr);
        if ( p_captured_mutable ) {
          wr.out("}", false);
        }
        ctx.unsetInExpr();
      } else {
        if ( p_captured_mutable ) {
          wr.out(" = new ", false);
          await this.writeTypeDef(p.nameNode, ctx, wr);
          wr.out("[]{ null }", false);
        } else {
          let b_was_set = false;
          if ( nn.value_type == 6 ) {
            wr.out(" = new ", false);
            await this.writeTypeDef(p.nameNode, ctx, wr);
            wr.out("()", false);
            b_was_set = true;
          }
          if ( nn.value_type == 7 ) {
            wr.out(" = new ", false);
            await this.writeTypeDef(p.nameNode, ctx, wr);
            wr.out("()", false);
            b_was_set = true;
          }
          if ( (b_was_set == false) && nn.hasFlag("optional") ) {
            wr.out(" = null", false);
          }
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
  };
  async writeArgsDef (fnDesc, ctx, wr) {
    for ( let i = 0; i < fnDesc.params.length; i++) {
      var arg = fnDesc.params[i];
      if ( i > 0 ) {
        wr.out(",", false);
      }
      wr.out(" final ", false);
      await this.writeTypeDef(arg.nameNode, ctx, wr);
      wr.out((" " + arg.compiledName) + " ", false);
    };
  };
  async CustomOperator (node, ctx, wr) {
    const fc = node.getFirst();
    const cmd = fc.vref;
    if ( cmd == "return" ) {
      wr.newline();
      if ( (node.children.length) > 1 ) {
        const value = node.getSecond();
        wr.out("return ", false);
        ctx.setInExpr();
        await this.WalkNode(value, ctx, wr);
        ctx.unsetInExpr();
        wr.out(";", true);
      } else {
        wr.out("return;", true);
      }
    }
  };
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
    };
    exp_s = exp_s + ")";
    return exp_s;
  };
  async CreateLambdaCall (node, ctx, wr) {
    const fName = node.children[0];
    const givenArgs = node.children[1];
    let rv;
    let args;
    if ( (typeof(fName.expression_value) !== "undefined" && fName.expression_value != null )  ) {
      rv = fName.expression_value.children[0];
      args = fName.expression_value.children[1];
    } else {
      const param = ctx.getVariableDef(fName.vref);
      rv = param.nameNode.expression_value.children[0];
      args = param.nameNode.expression_value.children[1];
    }
    await this.WalkNode(fName, ctx, wr);
    wr.out(".run(", false);
    ctx.setInExpr();
    for ( let i = 0; i < args.children.length; i++) {
      var arg = args.children[i];
      const n = givenArgs.children[i];
      if ( i > 0 ) {
        wr.out(", ", false);
      }
      if ( arg.value_type != 0 ) {
        await this.WalkNode(n, ctx, wr);
      }
    };
    ctx.unsetInExpr();
    if ( ctx.expressionLevel() == 0 ) {
      wr.out(");", true);
    } else {
      wr.out(")", false);
    }
  };
  async writeArrayLiteral (node, ctx, wr) {
    wr.addImport("java.util.*");
    wr.out("new ArrayList<", false);
    wr.out(await this.getObjectTypeString2(node.eval_array_type, ctx, wr), false);
    wr.out(">(Arrays.asList( new ", false);
    wr.out(await this.getObjectTypeString2(node.eval_array_type, ctx, wr), false);
    wr.out("[] {", false);
    await operatorsOf.forEach_15(node.children, (async (item, index) => { 
      if ( index > 0 ) {
        wr.out(", ", false);
      }
      await this.WalkNode(item, ctx, wr);
    }));
    wr.out("}))", false);
  };
  async CreateLambda (node, ctx, wr) {
    const lambdaCtx = node.lambda_ctx;
    const fnNode = node.children[0];
    const args = node.children[1];
    const body = node.children[2];
    const sig = this.buildLambdaSignature(node);
    const iface_name = this.getSignatureInterface(sig);
    /** unused:  const package_name = ctx.getCompilerSetting("package")   **/ 
    if ( (( typeof(this.iface_created[iface_name] ) != "undefined" && this.iface_created.hasOwnProperty(iface_name) )) == false ) {
      this.iface_created[iface_name] = true;
      /** unused:  const utilWr = wr.getFileWriter("./interfaces/", (iface_name + ".java"))   **/ 
      let iface_dir = ".";
      if ( this.isPackaged(ctx) ) {
        iface_dir = "./interfaces/";
      }
      const utilWr_1 = wr.getFileWriter(iface_dir, (iface_name + ".java"));
      if ( this.isPackaged(ctx) ) {
        const package_name_2 = ctx.getCompilerSetting("package");
        if ( (package_name_2.length) > 0 ) {
          utilWr_1.out(("package " + package_name_2) + ".interfaces;", true);
          utilWr_1.out(("import " + package_name_2) + ".*;", true);
        }
      }
      const importFork = utilWr_1.fork();
      utilWr_1.out(("public interface " + iface_name) + " { ", true);
      utilWr_1.indent(1);
      utilWr_1.out("public ", false);
      await this.writeTypeDef(fnNode, ctx, utilWr_1);
      utilWr_1.out(" run(", false);
      for ( let i = 0; i < args.children.length; i++) {
        var arg = args.children[i];
        if ( i > 0 ) {
          utilWr_1.out(", ", false);
        }
        utilWr_1.out(" final ", false);
        await this.writeTypeDef(arg, lambdaCtx, utilWr_1);
        utilWr_1.out(" ", false);
        utilWr_1.out(arg.vref, false);
      };
      utilWr_1.out(");", true);
      utilWr_1.indent(-1);
      utilWr_1.out("}", true);
      await operatorsOf.forEach_12(utilWr_1.getImports(), ((item, index) => { 
        importFork.out(("import " + item) + ";", true);
      }));
    }
    wr.out(("new " + iface_name) + "() { ", true);
    wr.indent(1);
    wr.out("public ", false);
    await this.writeTypeDef(fnNode, ctx, wr);
    wr.out(" run(", false);
    for ( let i_1 = 0; i_1 < args.children.length; i_1++) {
      var arg_1 = args.children[i_1];
      if ( i_1 > 0 ) {
        wr.out(", ", false);
      }
      wr.out(" final ", false);
      await this.writeTypeDef(arg_1, lambdaCtx, wr);
      wr.out(" ", false);
      wr.out(arg_1.vref, false);
    };
    wr.out(") {", true);
    wr.indent(1);
    lambdaCtx.restartExpressionLevel();
    lambdaCtx.is_lambda = true;
    for ( let i_2 = 0; i_2 < body.children.length; i_2++) {
      var item = body.children[i_2];
      await this.WalkNode(item, lambdaCtx, wr);
    };
    wr.newline();
    for ( let i_3 = 0; i_3 < lambdaCtx.captured_variables.length; i_3++) {
      var cname = lambdaCtx.captured_variables[i_3];
      wr.out("// captured var " + cname, true);
    };
    wr.indent(-1);
    wr.out("}", true);
    wr.indent(-1);
    wr.out("}", false);
  };
  getCounters (ctx) {
    const root = ctx.getRoot();
    const counters = root.counters;
    if ( counters.b_counted == false ) {
      const list = Object.keys(root.definedClasses);
      for ( let i = 0; i < list.length; i++) {
        var name = list[i];
        if ( (name.indexOf("operatorsOf")) == 0 ) {
          counters.operator_cnt = counters.operator_cnt + 1;
        }
        if ( (name.indexOf("Map_")) == 0 ) {
          counters.immutable_cnt = counters.immutable_cnt + 1;
        }
        if ( (name.indexOf("Vector_")) == 0 ) {
          counters.immutable_cnt = counters.immutable_cnt + 1;
        }
      };
    }
    counters.b_counted = true;
    return counters;
  };
  async writeClass (node, ctx, orig_wr) {
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
          declaredVariable[pvar.name] = true;
        };
      };
    }
    let class_dir = ".";
    let package_end = "";
    if ( this.isPackaged(ctx) ) {
      if ( (cl.name.indexOf("operatorsOf")) == 0 ) {
        class_dir = "./operators/";
        package_end = ".operators";
      }
      if ( (cl.name.indexOf("Map_")) == 0 ) {
        class_dir = "./immutables/";
        package_end = ".immutables";
      }
      if ( (cl.name.indexOf("Vector_")) == 0 ) {
        class_dir = "./immutables/";
        package_end = ".immutables";
      }
    }
    const wr = orig_wr.getFileWriter(class_dir, (cl.name + ".java"));
    const package_name = ctx.getCompilerSetting("package");
    if ( this.isPackaged(ctx) ) {
      if ( (package_name.length) > 0 ) {
        wr.out((("package " + package_name) + package_end) + ";", true);
      }
    }
    const importFork = wr.fork();
    if ( this.isPackaged(ctx) ) {
      const counters = this.getCounters(ctx);
      if ( counters.interface_cnt > 0 ) {
        importFork.addImport(package_name + ".interfaces.*");
      }
      if ( counters.immutable_cnt > 0 ) {
        importFork.addImport(package_name + ".immutables.*");
      }
      if ( counters.operator_cnt > 0 ) {
        importFork.addImport(package_name + ".operators.*");
      }
      if ( (package_end.length) > 0 ) {
        importFork.addImport(package_name + ".*");
      }
    }
    for ( let i_2 = 0; i_2 < cl.capturedLocals.length; i_2++) {
      var dd = cl.capturedLocals[i_2];
      if ( dd.is_class_variable == false ) {
        if ( dd.set_cnt > 0 ) {
          if ( ctx.hasCompilerFlag("allow-mutate") ) {
          } else {
          }
        }
      }
    };
    wr.out("", true);
    wr.out("public class " + cl.name, false);
    if ( (cl.extends_classes.length) > 0 ) {
      wr.out(" extends ", false);
      for ( let i_3 = 0; i_3 < cl.extends_classes.length; i_3++) {
        var pName_1 = cl.extends_classes[i_3];
        wr.out(pName_1, false);
      };
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
      await this.writeVarDef(pvar_1.node, ctx, wr);
    };
    if ( cl.has_constructor ) {
      const constr = cl.constructor_fn;
      wr.out("", true);
      wr.out(cl.name + "(", false);
      await this.writeArgsDef(constr, ctx, wr);
      wr.out(" ) {", true);
      wr.indent(1);
      wr.newline();
      const subCtx = constr.fnCtx;
      subCtx.is_function = true;
      await this.WalkNode(constr.fnBody, subCtx, wr);
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
        ctx.setCompilerSetting("mainclass", cl.name);
        wr.out("public static void main(String [] args ) {", true);
      } else {
        wr.out("public static ", false);
        await this.writeTypeDef(variant.nameNode, ctx, wr);
        wr.out(" ", false);
        wr.out(variant.compiledName + "(", false);
        await this.writeArgsDef(variant, ctx, wr);
        wr.out(") {", true);
      }
      wr.indent(1);
      wr.newline();
      const subCtx_1 = variant.fnCtx;
      subCtx_1.is_function = true;
      await this.WalkNode(variant.fnBody, subCtx_1, wr);
      wr.newline();
      wr.indent(-1);
      wr.out("}", true);
    };
    for ( let i_6 = 0; i_6 < cl.defined_variants.length; i_6++) {
      var fnVar = cl.defined_variants[i_6];
      const mVs = cl.method_variants[fnVar];
      for ( let i_7 = 0; i_7 < mVs.variants.length; i_7++) {
        var variant_1 = mVs.variants[i_7];
        wr.out("", true);
        wr.out("public ", false);
        await this.writeTypeDef(variant_1.nameNode, ctx, wr);
        wr.out(" ", false);
        wr.out(variant_1.compiledName + "(", false);
        await this.writeArgsDef(variant_1, ctx, wr);
        wr.out(") {", true);
        wr.indent(1);
        wr.newline();
        const subCtx_2 = variant_1.fnCtx;
        subCtx_2.is_function = true;
        await this.WalkNode(variant_1.fnBody, subCtx_2, wr);
        wr.newline();
        wr.indent(-1);
        wr.out("}", true);
      };
    };
    wr.indent(-1);
    wr.out("}", true);
    const import_list = wr.getImports();
    for ( let i_8 = 0; i_8 < import_list.length; i_8++) {
      var codeStr = import_list[i_8];
      importFork.out(("import " + codeStr) + ";", true);
    };
  };
  async CreateServices (parser, ctx, orig_wr) {
    return;
  };
  async CreatePages (parser, ctx, orig_wr) {
    await operatorsOf_13.forEach_25(ctx.appPages, (async (item, index) => { 
      await this.CreatePage(parser, item, ctx, orig_wr);
    }));
  };
  async CreatePage (parser, node, ctx, orig_wr) {
    const writer = new AndroidPageWriter();
    writer.classWriter = this;
    await writer.CreatePage(parser, node, ctx, orig_wr);
  };
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
  };
  getObjectTypeString (type_string, ctx) {
    if ( ctx.isDefinedClass(type_string) ) {
      const cc = ctx.findClass(type_string);
      if ( cc.is_union ) {
        return "Any";
      }
      if ( cc.is_system ) {
        const sysName = cc.systemNames["swift3"];
        if ( (typeof(sysName) !== "undefined" && sysName != null )  ) {
          return sysName;
        } else {
          const node = new CodeNode(new SourceCode(""), 0, 0);
          ctx.addError(node, ("No system class " + type_string) + "defined for Swift ");
        }
      }
    }
    switch (type_string ) { 
      case "int" : 
        return "Int";
      case "string" : 
        return "String";
      case "charbuffer" : 
        return "[UInt8]";
      case "char" : 
        return "UInt8";
      case "boolean" : 
        return "Bool";
      case "double" : 
        return "Double";
    };
    return type_string;
  };
  getTypeString (type_string) {
    switch (type_string ) { 
      case "int" : 
        return "Int";
      case "string" : 
        return "String";
      case "charbuffer" : 
        return "[UInt8]";
      case "char" : 
        return "UInt8";
      case "boolean" : 
        return "Bool";
      case "double" : 
        return "Double";
    };
    return type_string;
  };
  async writeTypeDef (node, ctx, wr) {
    let v_type = node.value_type;
    let t_name = node.type_name;
    let a_name = node.array_type;
    let k_name = node.key_type;
    if ( ((v_type == 10) || (v_type == 11)) || (v_type == 0) ) {
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
      case 17 : 
        const rv = node.expression_value.children[0];
        const sec = node.expression_value.children[1];
        /** unused:  const fc = sec.getFirst()   **/ 
        wr.out("(", false);
        wr.out("(", false);
        for ( let i = 0; i < sec.children.length; i++) {
          var arg = sec.children[i];
          if ( i > 0 ) {
            wr.out(", ", false);
          }
          wr.out(" _ : ", false);
          await this.writeTypeDef(arg, ctx, wr);
        };
        wr.out(") -> ", false);
        await this.writeTypeDef(rv, ctx, wr);
        wr.out(")", false);
        break;
      case 13 : 
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
      case 14 : 
        wr.out("UInt8", false);
        break;
      case 15 : 
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
        if ( ctx.isDefinedClass(t_name) ) {
          const cc = ctx.findClass(t_name);
          if ( cc.is_union ) {
            wr.out("Any", false);
            if ( node.hasFlag("optional") ) {
              wr.out("?", false);
            }
            return;
          }
          if ( cc.is_system ) {
            const sysName = cc.systemNames["swift3"];
            if ( (typeof(sysName) !== "undefined" && sysName != null )  ) {
              wr.out(sysName, false);
            } else {
              ctx.addError(node, ("No system class " + t_name) + "defined for Swift ");
            }
            if ( node.hasFlag("optional") ) {
              wr.out("?", false);
            }
            return;
          }
        }
        wr.out(this.getTypeString(t_name), false);
        break;
    };
    if ( node.hasFlag("optional") ) {
      wr.out("?", false);
    }
  };
  async WriteEnum (node, ctx, wr) {
    if ( node.eval_type == 13 ) {
      const rootObjName = node.ns[0];
      const e = ctx.getEnum(rootObjName);
      if ( (typeof(e) !== "undefined" && e != null )  ) {
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
  };
  async WriteVRef (node, ctx, wr) {
    if ( node.vref == "this" ) {
      wr.out("self", false);
      return;
    }
    if ( node.eval_type == 13 ) {
      if ( (node.ns.length) > 1 ) {
        const rootObjName = node.ns[0];
        const enumName = node.ns[1];
        const e = ctx.getEnum(rootObjName);
        if ( (typeof(e) !== "undefined" && e != null )  ) {
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
          if ( (part != "this") && ctx.isMemberVariable(part) ) {
            const uc = ctx.getCurrentClass();
            const currC = uc;
            const up = currC.findVariable(part);
            if ( (typeof(up) !== "undefined" && up != null )  ) {
              if ( false == ctx.isInStatic() ) {
                wr.out("self.", false);
              }
            }
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
      };
      return;
    }
    if ( node.hasParamDesc ) {
      const p_1 = node.paramDesc;
      const part_1 = node.ns[0];
      if ( (part_1 != "this") && ctx.isMemberVariable(part_1) ) {
        const uc_1 = ctx.getCurrentClass();
        const currC_1 = uc_1;
        const up_1 = currC_1.findVariable(part_1);
        if ( (typeof(up_1) !== "undefined" && up_1 != null )  ) {
          if ( false == ctx.isInStatic() ) {
            wr.out("self.", false);
          }
        }
      }
      wr.out(p_1.compiledName, false);
      return;
    }
    for ( let i_1 = 0; i_1 < node.ns.length; i_1++) {
      var part_2 = node.ns[i_1];
      if ( i_1 == 0 ) {
        if ( (part_2 != "this") && ctx.isMemberVariable(part_2) ) {
          const uc_2 = ctx.getCurrentClass();
          const currC_2 = uc_2;
          const up_2 = currC_2.findVariable(part_2);
          if ( (typeof(up_2) !== "undefined" && up_2 != null )  ) {
            if ( false == ctx.isInStatic() ) {
              wr.out("self.", false);
            }
          }
        }
        if ( ctx.hasClass(part_2) ) {
          const classDesc = ctx.findClass(part_2);
          wr.out(classDesc.compiledName, false);
          continue;
        }
      }
      if ( i_1 > 0 ) {
        wr.out(".", false);
      }
      wr.out(this.adjustType(part_2), false);
    };
  };
  async writeVarDef (node, ctx, wr) {
    if ( node.hasParamDesc ) {
      const nn = node.children[1];
      const p = nn.paramDesc;
      if ( nn.hasFlag("optional") ) {
        if ( ((p.set_cnt == 1) && (p.ref_cnt == 2)) && (p.is_class_variable == false) ) {
          ctx.addError(node, "Optional variable is only set but never read.");
        }
      }
      if ( (p.ref_cnt == 0) && (p.is_class_variable == false) ) {
        wr.out("/** unused:  ", false);
      }
      if ( (p.set_cnt > 0) || p.is_class_variable ) {
        wr.out(("var " + p.compiledName) + " : ", false);
      } else {
        wr.out(("let " + p.compiledName) + " : ", false);
      }
      await this.writeTypeDef(p.nameNode, ctx, wr);
      if ( (node.children.length) > 2 ) {
        wr.out(" = ", false);
        ctx.setInExpr();
        const value = node.getThird();
        await this.WalkNode(value, ctx, wr);
        ctx.unsetInExpr();
      } else {
        if ( nn.value_type == 6 ) {
          wr.out(" = ", false);
          await this.writeTypeDef(p.nameNode, ctx, wr);
          wr.out("()", false);
        }
        if ( nn.value_type == 7 ) {
          wr.out(" = ", false);
          await this.writeTypeDef(p.nameNode, ctx, wr);
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
  };
  async writeArgsDef (fnDesc, ctx, wr) {
    for ( let i = 0; i < fnDesc.params.length; i++) {
      var arg = fnDesc.params[i];
      if ( i > 0 ) {
        wr.out(", ", false);
      }
      wr.out(arg.compiledName + " : ", false);
      const nn = arg.nameNode;
      if ( nn.value_type == 17 ) {
        wr.out("  @escaping  ", false);
      }
      await this.writeTypeDef(arg.nameNode, ctx, wr);
    };
  };
  async writeArgsDefWithLocals (fnDesc, localFnDesc, ctx, wr) {
    if ( (fnDesc.params.length) != (localFnDesc.params.length) ) {
      ctx.addError(localFnDesc.node, "Parameter count does not match with the function prototype");
      return;
    }
    for ( let i = 0; i < fnDesc.params.length; i++) {
      var arg = fnDesc.params[i];
      if ( i > 0 ) {
        wr.out(", ", false);
      }
      const local = localFnDesc.params[i];
      if ( local.name != arg.name ) {
        wr.out(arg.compiledName + " ", false);
      }
      wr.out(local.compiledName + " : ", false);
      const nn = arg.nameNode;
      if ( nn.hasFlag("strong") ) {
        if ( nn.value_type == 17 ) {
          wr.out("  @escaping  ", false);
        }
      }
      await this.writeTypeDef(arg.nameNode, ctx, wr);
    };
  };
  async CreateCallExpression (node, ctx, wr) {
    if ( node.has_call ) {
      const obj = node.getSecond();
      const method = node.getThird();
      const args = node.children[3];
      wr.out("(", false);
      ctx.setInExpr();
      await this.WalkNode(obj, ctx, wr);
      ctx.unsetInExpr();
      wr.out(").", false);
      wr.out(method.vref, false);
      wr.out("(", false);
      ctx.setInExpr();
      for ( let i = 0; i < args.children.length; i++) {
        var arg = args.children[i];
        if ( i > 0 ) {
          wr.out(", ", false);
        }
        if ( ctx.isDefinedClass(obj.eval_type_name) ) {
          const clDef = ctx.findClass(obj.eval_type_name);
          const clMethod = clDef.findMethod(method.vref);
          if ( (typeof(clMethod) !== "undefined" && clMethod != null )  ) {
            const mm = clMethod;
            const pDesc = mm.params[i];
            wr.out(pDesc.compiledName + " : ", false);
            await this.WalkNode(arg, ctx, wr);
            continue;
          }
        } else {
          ctx.addError(arg, "Could not find evaluated class for the call");
        }
        await this.WalkNode(arg, ctx, wr);
      };
      ctx.unsetInExpr();
      wr.out(")", false);
      if ( ctx.expressionLevel() == 0 ) {
        wr.out(";", true);
      }
    }
  };
  async writeFnCall (node, ctx, wr) {
    if ( node.hasFnCall ) {
      const fc = node.getFirst();
      const fnName = node.fnDesc.nameNode;
      if ( ctx.expressionLevel() == 0 ) {
        if ( fnName.type_name != "void" ) {
          wr.out("_ = ", false);
        }
      }
      await this.WriteVRef(fc, ctx, wr);
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
          if ( (typeof(defVal) !== "undefined" && defVal != null )  ) {
            const fc_1 = defVal.vref_annotation.getFirst();
            await this.WalkNode(fc_1, ctx, wr);
          } else {
            ctx.addError(node, "Default argument was missing");
          }
          continue;
        }
        const n = givenArgs.children[i];
        wr.out(arg.compiledName + " : ", false);
        await this.WalkNode(n, ctx, wr);
      };
      ctx.unsetInExpr();
      wr.out(")", false);
      if ( ctx.expressionLevel() == 0 ) {
        wr.newline();
      }
    }
  };
  async CreateLambdaCall (node, ctx, wr) {
    const fName = node.children[0];
    const givenArgs = node.children[1];
    let rv;
    let args;
    if ( (typeof(fName.expression_value) !== "undefined" && fName.expression_value != null )  ) {
      rv = fName.expression_value.children[0];
      args = fName.expression_value.children[1];
    } else {
      const param = ctx.getVariableDef(fName.vref);
      rv = param.nameNode.expression_value.children[0];
      args = param.nameNode.expression_value.children[1];
    }
    if ( ctx.expressionLevel() == 0 ) {
      if ( rv.type_name != "void" ) {
        wr.out("_ = ", false);
      }
    }
    ctx.setInExpr();
    await this.WalkNode(fName, ctx, wr);
    wr.out("(", false);
    for ( let i = 0; i < args.children.length; i++) {
      var arg = args.children[i];
      const n = givenArgs.children[i];
      if ( i > 0 ) {
        wr.out(", ", false);
      }
      if ( arg.value_type != 0 ) {
        await this.WalkNode(n, ctx, wr);
      }
    };
    ctx.unsetInExpr();
    wr.out(")", false);
    if ( ctx.expressionLevel() == 0 ) {
      wr.out(";", true);
    }
  };
  async CreateLambda (node, ctx, wr) {
    const lambdaCtx = node.lambda_ctx;
    const fnNode = node.children[0];
    const args = node.children[1];
    const body = node.children[2];
    wr.out("({ (", false);
    for ( let i = 0; i < args.children.length; i++) {
      var arg = args.children[i];
      if ( i > 0 ) {
        wr.out(", ", false);
      }
      wr.out(arg.vref, false);
    };
    wr.out(") ->  ", false);
    await this.writeTypeDef(fnNode, lambdaCtx, wr);
    wr.out(" in ", true);
    wr.indent(1);
    lambdaCtx.restartExpressionLevel();
    for ( let i_1 = 0; i_1 < body.children.length; i_1++) {
      var item = body.children[i_1];
      await this.WalkNode(item, lambdaCtx, wr);
    };
    wr.newline();
    for ( let i_2 = 0; i_2 < lambdaCtx.captured_variables.length; i_2++) {
      var cname = lambdaCtx.captured_variables[i_2];
      wr.out("// captured var " + cname, true);
    };
    wr.indent(-1);
    wr.out("})", false);
  };
  async writeNewCall (node, ctx, wr) {
    if ( node.hasNewOper ) {
      const cl = node.clDesc;
      /** unused:  const fc = node.getSecond()   **/ 
      wr.out(node.clDesc.name, false);
      wr.out("(", false);
      const constr = cl.constructor_fn;
      const givenArgs = node.getThird();
      if ( (typeof(constr) !== "undefined" && constr != null )  ) {
        for ( let i = 0; i < constr.params.length; i++) {
          var arg = constr.params[i];
          const n = givenArgs.children[i];
          if ( i > 0 ) {
            wr.out(", ", false);
          }
          wr.out(arg.name + " : ", false);
          await this.WalkNode(n, ctx, wr);
        };
      }
      wr.out(")", false);
    }
  };
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
    };
    return true;
  };
  async CustomOperator (node, ctx, wr) {
    const fc = node.getFirst();
    const cmd = fc.vref;
    if ( cmd == "switch" ) {
      const condition = node.getSecond();
      const case_nodes = node.getThird();
      wr.newline();
      wr.out("switch (", false);
      await this.WalkNode(condition, ctx, wr);
      wr.out(") {", true);
      wr.indent(1);
      let found_default = false;
      for ( let i = 0; i < case_nodes.children.length; i++) {
        var ch = case_nodes.children[i];
        const blockName = ch.getFirst();
        if ( blockName.vref == "default" ) {
          found_default = true;
          await this.WalkNode(ch, ctx, wr);
        } else {
          await this.WalkNode(ch, ctx, wr);
        }
      };
      if ( false == found_default ) {
        wr.newline();
        wr.out("default :", true);
        wr.indent(1);
        wr.out("break", true);
        wr.indent(-1);
      }
      wr.indent(-1);
      wr.out("}", true);
    }
  };
  async writeClass (node, ctx, wr) {
    const cl = node.clDesc;
    if ( typeof(cl) === "undefined" ) {
      return;
    }
    let declaredVariable = {};
    let dblDeclaredFunction = {};
    let declaredFunction = {};
    let declaredStaticFunction = {};
    let parentFunction = {};
    if ( (cl.extends_classes.length) > 0 ) {
      for ( let i = 0; i < cl.extends_classes.length; i++) {
        var pName = cl.extends_classes[i];
        const pC = ctx.findClass(pName);
        for ( let i_1 = 0; i_1 < pC.variables.length; i_1++) {
          var pvar = pC.variables[i_1];
          declaredVariable[pvar.name] = true;
        };
        for ( let i_2 = 0; i_2 < pC.defined_variants.length; i_2++) {
          var fnVar = pC.defined_variants[i_2];
          const mVs = pC.method_variants[fnVar];
          for ( let i_3 = 0; i_3 < mVs.variants.length; i_3++) {
            var variant = mVs.variants[i_3];
            declaredFunction[variant.name] = true;
            parentFunction[variant.name] = variant;
          };
        };
        for ( let i_4 = 0; i_4 < pC.static_methods.length; i_4++) {
          var variant_1 = pC.static_methods[i_4];
          declaredStaticFunction[variant_1.name] = true;
        };
      };
    }
    if ( this.header_created == false ) {
      wr.createTag("utilities");
      this.header_created = true;
    }
    wr.out(((("func ==(l: " + cl.compiledName) + ", r: ") + cl.compiledName) + ") -> Bool {", true);
    wr.indent(1);
    wr.out("return l === r", true);
    wr.indent(-1);
    wr.out("}", true);
    wr.out("class " + cl.compiledName, false);
    let parentClass;
    if ( (cl.extends_classes.length) > 0 ) {
      wr.out(" : ", false);
      for ( let i_5 = 0; i_5 < cl.extends_classes.length; i_5++) {
        var pName_1 = cl.extends_classes[i_5];
        parentClass = ctx.findClass(pName_1);
        wr.out(parentClass.compiledName, false);
      };
    } else {
      wr.out(" : Equatable ", false);
    }
    wr.out(" { ", true);
    wr.indent(1);
    for ( let i_6 = 0; i_6 < cl.variables.length; i_6++) {
      var pvar_1 = cl.variables[i_6];
      if ( ( typeof(declaredVariable[pvar_1.name] ) != "undefined" && declaredVariable.hasOwnProperty(pvar_1.name) ) ) {
        wr.out("// WAS DECLARED : " + pvar_1.name, true);
        continue;
      }
      await this.writeVarDef(pvar_1.node, ctx, wr);
    };
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
      await this.writeArgsDef(constr, ctx, wr);
      wr.out(" ) {", true);
      wr.indent(1);
      if ( typeof(parentClass) != "undefined" ) {
        wr.out("super.init()", true);
      }
      wr.newline();
      const subCtx = constr.fnCtx;
      subCtx.is_function = true;
      await this.WalkNode(constr.fnBody, subCtx, wr);
      wr.newline();
      wr.indent(-1);
      wr.out("}", true);
    }
    for ( let i_7 = 0; i_7 < cl.static_methods.length; i_7++) {
      var variant_2 = cl.static_methods[i_7];
      if ( variant_2.nameNode.hasFlag("main") ) {
        continue;
      }
      if ( ( typeof(declaredStaticFunction[variant_2.name] ) != "undefined" && declaredStaticFunction.hasOwnProperty(variant_2.name) ) ) {
        wr.out("override ", false);
      }
      wr.out(("class func " + variant_2.compiledName) + "(", false);
      await this.writeArgsDef(variant_2, ctx, wr);
      wr.out(") -> ", false);
      await this.writeTypeDef(variant_2.nameNode, ctx, wr);
      wr.out(" {", true);
      wr.indent(1);
      wr.newline();
      const subCtx_1 = variant_2.fnCtx;
      subCtx_1.is_function = true;
      await this.WalkNode(variant_2.fnBody, subCtx_1, wr);
      wr.newline();
      wr.indent(-1);
      wr.out("}", true);
    };
    for ( let i_8 = 0; i_8 < cl.defined_variants.length; i_8++) {
      var fnVar_1 = cl.defined_variants[i_8];
      const mVs_1 = cl.method_variants[fnVar_1];
      for ( let i_9 = 0; i_9 < mVs_1.variants.length; i_9++) {
        var variant_3 = mVs_1.variants[i_9];
        if ( ( typeof(dblDeclaredFunction[variant_3.name] ) != "undefined" && dblDeclaredFunction.hasOwnProperty(variant_3.name) ) ) {
          continue;
        }
        if ( ( typeof(declaredFunction[variant_3.name] ) != "undefined" && declaredFunction.hasOwnProperty(variant_3.name) ) ) {
          wr.out("override ", false);
        }
        dblDeclaredFunction[variant_3.name] = true;
        wr.out(("func " + variant_3.compiledName) + "(", false);
        if ( ( typeof(parentFunction[variant_3.name] ) != "undefined" && parentFunction.hasOwnProperty(variant_3.name) ) ) {
          await this.writeArgsDefWithLocals((parentFunction[variant_3.name]), variant_3, ctx, wr);
        } else {
          await this.writeArgsDef(variant_3, ctx, wr);
        }
        wr.out(") -> ", false);
        await this.writeTypeDef(variant_3.nameNode, ctx, wr);
        wr.out(" {", true);
        wr.indent(1);
        wr.newline();
        const subCtx_2 = variant_3.fnCtx;
        subCtx_2.is_function = true;
        await this.WalkNode(variant_3.fnBody, subCtx_2, wr);
        wr.newline();
        wr.indent(-1);
        wr.out("}", true);
      };
    };
    wr.indent(-1);
    wr.out("}", true);
    for ( let i_10 = 0; i_10 < cl.static_methods.length; i_10++) {
      var variant_4 = cl.static_methods[i_10];
      if ( variant_4.nameNode.hasFlag("main") && (variant_4.nameNode.code.filename == ctx.getRootFile()) ) {
        const theEnd = wr.getTag("file_end");
        theEnd.newline();
        theEnd.out("func __main__swift() {", true);
        theEnd.indent(1);
        const subCtx_3 = variant_4.fnCtx;
        subCtx_3.is_function = true;
        await this.WalkNode(variant_4.fnBody, subCtx_3, theEnd);
        theEnd.newline();
        theEnd.indent(-1);
        theEnd.out("}", true);
        theEnd.out("// call the main function", true);
        theEnd.out("__main__swift()", true);
        if ( ctx.hasCompilerFlag("forever") ) {
          theEnd.out("CFRunLoopRun()", true);
        }
      }
    };
  };
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
  };
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
    };
  };
  getObjectTypeString (type_string, ctx) {
    switch (type_string ) { 
      case "char" : 
        return "char";
      case "charbuffer" : 
        return "const char*";
      case "int" : 
        return "int";
      case "string" : 
        return "std::string";
      case "boolean" : 
        return "bool";
      case "double" : 
        return "double";
    };
    if ( ctx.isEnumDefined(type_string) ) {
      return "int";
    }
    if ( ctx.isDefinedClass(type_string) ) {
      const cc = ctx.findClass(type_string);
      if ( cc.is_union ) {
        return "r_union_" + type_string;
      }
      return ("std::shared_ptr<" + type_string) + ">";
    }
    return type_string;
  };
  getTypeString2 (type_string, ctx) {
    switch (type_string ) { 
      case "char" : 
        return "char";
      case "charbuffer" : 
        return "const char*";
      case "int" : 
        return "int";
      case "string" : 
        return "std::string";
      case "boolean" : 
        return "bool";
      case "double" : 
        return "double";
    };
    if ( ctx.isEnumDefined(type_string) ) {
      return "int";
    }
    return type_string;
  };
  writePtr (node, ctx, wr) {
    if ( node.type_name == "void" ) {
      return;
    }
  };
  async writeTypeDef (node, ctx, wr) {
    let v_type = node.value_type;
    let t_name = node.type_name;
    let a_name = node.array_type;
    let k_name = node.key_type;
    if ( ((v_type == 10) || (v_type == 11)) || (v_type == 0) ) {
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
      case 17 : 
        const rv = node.expression_value.children[0];
        const sec = node.expression_value.children[1];
        /** unused:  const fc = sec.getFirst()   **/ 
        this.import_lib("<functional>", ctx, wr);
        wr.out("std::function<", false);
        await this.writeTypeDef(rv, ctx, wr);
        wr.out("(", false);
        for ( let i = 0; i < sec.children.length; i++) {
          var arg = sec.children[i];
          if ( i > 0 ) {
            wr.out(", ", false);
          }
          await this.writeTypeDef(arg, ctx, wr);
        };
        wr.out(")>", false);
        break;
      case 13 : 
        wr.out("int", false);
        break;
      case 3 : 
        if ( node.hasFlag("optional") ) {
          wr.out(" r_optional_primitive<int> ", false);
        } else {
          wr.out("int", false);
        }
        break;
      case 14 : 
        wr.out("char", false);
        break;
      case 15 : 
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
          if ( cc.is_union ) {
            wr.out("r_union_", false);
            wr.out(t_name, false);
            return;
          }
          const cc_1 = ctx.findClass(t_name);
          wr.out("std::shared_ptr<", false);
          wr.out(cc_1.name, false);
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
    };
  };
  async WriteVRef (node, ctx, wr) {
    if ( node.vref == "this" ) {
      const currC = ctx.getCurrentClass();
      if ( (typeof(currC) !== "undefined" && currC != null )  ) {
        const cc = currC;
        if ( (cc.extends_classes.length) > 0 ) {
          wr.out(("std::dynamic_pointer_cast<" + cc.name) + ">(shared_from_this())", false);
          return;
        }
      }
      wr.out("shared_from_this()", false);
      return;
    }
    if ( node.eval_type == 13 ) {
      const rootObjName = node.ns[0];
      if ( (node.ns.length) > 1 ) {
        const enumName = node.ns[1];
        const e = ctx.getEnum(rootObjName);
        if ( (typeof(e) !== "undefined" && e != null )  ) {
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
      };
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
    };
  };
  async writeVarDef (node, ctx, wr) {
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
      await this.writeTypeDef(p.nameNode, ctx, wr);
      wr.out(" ", false);
      wr.out(p.compiledName, false);
      if ( (node.children.length) > 2 ) {
        wr.out(" = ", false);
        ctx.setInExpr();
        const value = node.getThird();
        await this.WalkNode(value, ctx, wr);
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
  };
  async disabledVarDef (node, ctx, wr) {
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
        await this.WalkNode(value, ctx, wr);
        ctx.unsetInExpr();
      } else {
      }
      wr.out(";", false);
      wr.newline();
    }
  };
  async CreateCallExpression (node, ctx, wr) {
    if ( node.has_call ) {
      const obj = node.getSecond();
      const method = node.getThird();
      const args = node.children[3];
      wr.out("(", false);
      ctx.setInExpr();
      await this.WalkNode(obj, ctx, wr);
      ctx.unsetInExpr();
      wr.out(")->", false);
      wr.out(method.vref, false);
      wr.out("(", false);
      ctx.setInExpr();
      for ( let i = 0; i < args.children.length; i++) {
        var arg = args.children[i];
        if ( i > 0 ) {
          wr.out(", ", false);
        }
        await this.WalkNode(arg, ctx, wr);
      };
      ctx.unsetInExpr();
      wr.out(")", false);
      if ( ctx.expressionLevel() == 0 ) {
        wr.out(";", true);
      }
    }
  };
  async CustomOperator (node, ctx, wr) {
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
      let b_has_default = false;
      for ( let i = 0; i < case_nodes.children.length; i++) {
        var ch = case_nodes.children[i];
        const blockName = ch.getFirst();
        if ( blockName.vref == "default" ) {
          b_has_default = true;
        }
      };
      if ( b_has_default ) {
        wr.out(("bool " + p.compiledName) + " = false;", true);
      }
      for ( let i_1 = 0; i_1 < case_nodes.children.length; i_1++) {
        var ch_1 = case_nodes.children[i_1];
        const blockName_1 = ch_1.getFirst();
        if ( blockName_1.vref == "default" ) {
          const defBlock = ch_1.getSecond();
          wr.out("if( ! ", false);
          wr.out(p.compiledName, false);
          wr.out(") {", true);
          wr.indent(1);
          await this.WalkNode(defBlock, ctx, wr);
          wr.indent(-1);
          wr.out("}", true);
        } else {
          const caseValue = ch_1.getSecond();
          const caseBlock = ch_1.getThird();
          wr.out("if( ", false);
          await this.WalkNode(condition, ctx, wr);
          wr.out(" == ", false);
          await this.WalkNode(caseValue, ctx, wr);
          wr.out(") {", true);
          wr.indent(1);
          if ( b_has_default ) {
            wr.out(p.compiledName + " = true;", true);
          }
          await this.WalkNode(caseBlock, ctx, wr);
          wr.indent(-1);
          wr.out("}", true);
        }
      };
    }
  };
  async CreateMethodCall (node, ctx, wr) {
    const obj = node.getFirst();
    const args = node.getSecond();
    ctx.setInExpr();
    await this.WalkNode(obj, ctx, wr);
    ctx.unsetInExpr();
    wr.out("(", false);
    ctx.setInExpr();
    for ( let i = 0; i < args.children.length; i++) {
      var arg = args.children[i];
      if ( i > 0 ) {
        wr.out(", ", false);
      }
      await this.WalkNode(arg, ctx, wr);
    };
    ctx.unsetInExpr();
    wr.out(")", false);
  };
  async CreatePropertyGet (node, ctx, wr) {
    const obj = node.getSecond();
    const prop = node.getThird();
    wr.out("(", false);
    ctx.setInExpr();
    await this.WalkNode(obj, ctx, wr);
    ctx.unsetInExpr();
    wr.out(")->", false);
    await this.WalkNode(prop, ctx, wr);
  };
  async CreateLambdaCall (node, ctx, wr) {
    const fName = node.children[0];
    const givenArgs = node.children[1];
    let args;
    if ( (typeof(fName.expression_value) !== "undefined" && fName.expression_value != null )  ) {
      args = fName.expression_value.children[1];
    } else {
      const param = ctx.getVariableDef(fName.vref);
      args = param.nameNode.expression_value.children[1];
    }
    ctx.setInExpr();
    await this.WalkNode(fName, ctx, wr);
    wr.out("(", false);
    for ( let i = 0; i < args.children.length; i++) {
      var arg = args.children[i];
      const n = givenArgs.children[i];
      if ( i > 0 ) {
        wr.out(", ", false);
      }
      if ( arg.value_type != 0 ) {
        await this.WalkNode(n, ctx, wr);
      }
    };
    wr.out(")", false);
    ctx.unsetInExpr();
    if ( ctx.expressionLevel() == 0 ) {
      wr.out(";", true);
    }
  };
  async CreateLambda (node, ctx, wr) {
    this.import_lib("<functional>", ctx, wr);
    const lambdaCtx = node.lambda_ctx;
    /** unused:  const fnNode = node.children[0]   **/ 
    const args = node.children[1];
    const body = node.children[2];
    wr.out("[&", false);
    for ( let i = 0; i < lambdaCtx.captured_variables.length; i++) {
      var cname = lambdaCtx.captured_variables[i];
      const vD = lambdaCtx.getVariableDef(cname);
      if ( vD.varType == 4 ) {
        wr.out(", ", false);
        wr.out(vD.compiledName, false);
      }
    };
    wr.out("](", false);
    for ( let i_1 = 0; i_1 < args.children.length; i_1++) {
      var arg = args.children[i_1];
      if ( i_1 > 0 ) {
        wr.out(", ", false);
      }
      await this.writeTypeDef(arg, ctx, wr);
      wr.out(" ", false);
      wr.out(arg.vref, false);
    };
    wr.out(") mutable { ", true);
    wr.indent(1);
    lambdaCtx.restartExpressionLevel();
    for ( let i_2 = 0; i_2 < body.children.length; i_2++) {
      var item = body.children[i_2];
      await this.WalkNode(item, lambdaCtx, wr);
    };
    wr.newline();
    wr.indent(-1);
    wr.out("}", false);
  };
  async writeCppHeaderVar (node, ctx, wr, do_initialize) {
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
      await this.writeTypeDef(p.nameNode, ctx, wr);
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
  };
  async writeArgsDef (fnDesc, ctx, wr) {
    for ( let i = 0; i < fnDesc.params.length; i++) {
      var arg = fnDesc.params[i];
      if ( i > 0 ) {
        wr.out(",", false);
      }
      wr.out(" ", false);
      await this.writeTypeDef(arg.nameNode, ctx, wr);
      wr.out((" " + arg.compiledName) + " ", false);
    };
  };
  async writeFnCall (node, ctx, wr) {
    if ( node.hasFnCall ) {
      const fc = node.getFirst();
      await this.WriteVRef(fc, ctx, wr);
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
          if ( (typeof(defVal) !== "undefined" && defVal != null )  ) {
            const fc_1 = defVal.vref_annotation.getFirst();
            await this.WalkNode(fc_1, ctx, wr);
          } else {
            ctx.addError(node, "Default argument was missing");
          }
          continue;
        }
        const n = givenArgs.children[i];
        await this.WalkNode(n, ctx, wr);
      };
      ctx.unsetInExpr();
      wr.out(")", false);
      if ( ctx.expressionLevel() == 0 ) {
        wr.out(";", true);
      }
    }
  };
  async writeNewCall (node, ctx, wr) {
    if ( node.hasNewOper ) {
      const cl = node.clDesc;
      /** unused:  const fc = node.getSecond()   **/ 
      wr.out(" std::make_shared<", false);
      wr.out(node.clDesc.name, false);
      wr.out(">(", false);
      const constr = cl.constructor_fn;
      const givenArgs = node.getThird();
      if ( (typeof(constr) !== "undefined" && constr != null )  ) {
        for ( let i = 0; i < constr.params.length; i++) {
          var arg = constr.params[i];
          const n = givenArgs.children[i];
          if ( i > 0 ) {
            wr.out(", ", false);
          }
          if ( true || ((typeof(arg.nameNode) !== "undefined" && arg.nameNode != null ) ) ) {
            await this.WalkNode(n, ctx, wr);
          }
        };
      }
      wr.out(")", false);
    }
  };
  async writeArrayLiteral (node, ctx, wr) {
    this.compiler.createPolyfill("\ntemplate< typename T, size_t N >\nstd::vector<T> r_make_vector_from_array( const T (&data)[N] )\n{\n    return std::vector<T>(data, data+N);\n}\n", ctx, wr);
    wr.out("r_make_vector_from_array( (", false);
    wr.out(this.getObjectTypeString(node.eval_array_type, ctx), false);
    wr.out("[] ) {", false);
    await operatorsOf.forEach_15(node.children, (async (item, index) => { 
      if ( index > 0 ) {
        wr.out(", ", false);
      }
      await this.WalkNode(item, ctx, wr);
    }));
    wr.out("} )", false);
  };
  async writeClassHeader (node, ctx, wr) {
    const cl = node.clDesc;
    if ( typeof(cl) === "undefined" ) {
      return;
    }
    let inheritedVars = {};
    wr.out("class " + cl.name, false);
    if ( (cl.extends_classes.length) > 0 ) {
      wr.out(" : ", false);
      for ( let i = 0; i < cl.extends_classes.length; i++) {
        var pName = cl.extends_classes[i];
        wr.out("public ", false);
        wr.out(pName, false);
        const extC = ctx.findClass(pName);
        for ( let i_1 = 0; i_1 < extC.variables.length; i_1++) {
          var pvar = extC.variables[i_1];
          inheritedVars[pvar.name] = true;
        };
      };
    } else {
      wr.out((" : public std::enable_shared_from_this<" + cl.name) + "> ", false);
    }
    wr.out(" { ", true);
    wr.indent(1);
    wr.out("public :", true);
    wr.indent(1);
    for ( let i_2 = 0; i_2 < cl.variables.length; i_2++) {
      var pvar_1 = cl.variables[i_2];
      if ( (( typeof(inheritedVars[pvar_1.name] ) != "undefined" && inheritedVars.hasOwnProperty(pvar_1.name) )) == false ) {
        await this.writeCppHeaderVar(pvar_1.node, ctx, wr, false);
      }
    };
    wr.out("/* class constructor */ ", true);
    wr.out(cl.name + "(", false);
    if ( cl.has_constructor ) {
      const constr = cl.constructor_fn;
      await this.writeArgsDef(constr, ctx, wr);
    }
    wr.out(" );", true);
    for ( let i_3 = 0; i_3 < cl.static_methods.length; i_3++) {
      var variant = cl.static_methods[i_3];
      if ( i_3 == 0 ) {
        wr.out("/* static methods */ ", true);
      }
      wr.out("static ", false);
      await this.writeTypeDef(variant.nameNode, ctx, wr);
      wr.out((" " + variant.compiledName) + "(", false);
      await this.writeArgsDef(variant, ctx, wr);
      wr.out(");", true);
    };
    for ( let i_4 = 0; i_4 < cl.defined_variants.length; i_4++) {
      var fnVar = cl.defined_variants[i_4];
      if ( i_4 == 0 ) {
        wr.out("/* instance methods */ ", true);
      }
      const mVs = cl.method_variants[fnVar];
      for ( let i_5 = 0; i_5 < mVs.variants.length; i_5++) {
        var variant_1 = mVs.variants[i_5];
        if ( cl.is_inherited ) {
          wr.out("virtual ", false);
        }
        await this.writeTypeDef(variant_1.nameNode, ctx, wr);
        wr.out((" " + variant_1.compiledName) + "(", false);
        await this.writeArgsDef(variant_1, ctx, wr);
        wr.out(");", true);
      };
    };
    wr.indent(-1);
    wr.indent(-1);
    wr.out("};", true);
  };
  async CreateUnions (parser, ctx, wr) {
    const root = ctx.getRoot();
    await operatorsOf_13.forEach_14(root.definedClasses, (async (item, index) => { 
      if ( item.is_union ) {
        await this.compiler.installFile("variant.hpp", ctx, wr);
        ctx.addPluginNode("makefile", CodeNode.fromList([CodeNode.fromList([CodeNode.vref1("dep"), CodeNode.newStr("variant.hpp"), CodeNode.newStr("https://github.com/mpark/variant/releases/download/v1.2.2/variant.hpp")])]));
        wr.out("typedef mpark::variant<", false);
        wr.indent(1);
        let cnt = 0;
        await operatorsOf.forEach_12(item.is_union_of, ((item, index) => { 
          if ( ctx.isDefinedClass(item) ) {
            const cl = ctx.findClass(item);
            if ( false == cl.isNormalClass() ) {
              return;
            }
            if ( cnt > 0 ) {
              wr.out(", ", false);
            }
            wr.out(this.getObjectTypeString(item, ctx), false);
            cnt = cnt + 1;
          } else {
            if ( cnt > 0 ) {
              wr.out(", ", false);
            }
            wr.out(this.getObjectTypeString(item, ctx), false);
            cnt = cnt + 1;
          }
        }));
        wr.indent(-1);
        wr.out((">  r_union_" + index) + ";", true);
        wr.addImport("\"variant.hpp\"");
      }
    }));
  };
  async writeClass (node, ctx, orig_wr) {
    const cl = node.clDesc;
    const wr = orig_wr;
    if ( typeof(cl) === "undefined" ) {
      return;
    }
    this.import_lib("<memory>", ctx, wr);
    for ( let i = 0; i < cl.capturedLocals.length; i++) {
      var dd = cl.capturedLocals[i];
      if ( dd.is_class_variable == false ) {
        if ( dd.set_cnt > 0 ) {
          if ( ctx.hasCompilerFlag("dont-allow-mutate") ) {
            ctx.addError(dd.nameNode, "Mutating captured variable is not allowed");
            return;
          }
        }
      }
    };
    if ( this.header_created == false ) {
      wr.createTag("c++Imports");
      wr.out("", true);
      wr.out("// define classes here to avoid compiler errors", true);
      wr.createTag("c++ClassDefs");
      wr.out("", true);
      wr.createTag("c++unions");
      wr.createTag("utilities");
      wr.out("", true);
      wr.out("// header definitions", true);
      wr.createTag("c++Header");
      wr.out("", true);
      wr.out("int __g_argc;", true);
      wr.out("char **__g_argv;", true);
      await this.CreateUnions(this.compiler.parser, ctx, wr.getTag("c++unions"));
      this.header_created = true;
    }
    const classWriter = orig_wr.getTag("c++ClassDefs");
    const headerWriter = orig_wr.getTag("c++Header");
    /** unused:  const projectName = "project"   **/ 
    classWriter.out(("class " + cl.name) + ";", true);
    await this.writeClassHeader(node, ctx, headerWriter);
    wr.out(((cl.name + "::") + cl.name) + "(", false);
    if ( cl.has_constructor ) {
      const constr = cl.constructor_fn;
      await this.writeArgsDef(constr, ctx, wr);
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
          };
          wr.out(")", false);
        }
      };
    }
    wr.out("{", true);
    wr.indent(1);
    for ( let i_3 = 0; i_3 < cl.variables.length; i_3++) {
      var pvar = cl.variables[i_3];
      const nn = pvar.node;
      if ( (nn.children.length) > 2 ) {
        const valueNode = nn.children[2];
        wr.out(("this->" + pvar.compiledName) + " = ", false);
        await this.WalkNode(valueNode, ctx, wr);
        wr.out(";", true);
      }
    };
    if ( cl.has_constructor ) {
      const constr_2 = cl.constructor_fn;
      wr.newline();
      const subCtx = constr_2.fnCtx;
      subCtx.is_function = true;
      await this.WalkNode(constr_2.fnBody, subCtx, wr);
      wr.newline();
    }
    wr.indent(-1);
    wr.out("}", true);
    for ( let i_4 = 0; i_4 < cl.static_methods.length; i_4++) {
      var variant = cl.static_methods[i_4];
      if ( variant.nameNode.hasFlag("main") ) {
        continue;
      }
      await this.writeTypeDef(variant.nameNode, ctx, wr);
      wr.out(" ", false);
      wr.out((" " + cl.name) + "::", false);
      wr.out(variant.compiledName + "(", false);
      await this.writeArgsDef(variant, ctx, wr);
      wr.out(") {", true);
      wr.indent(1);
      wr.newline();
      const subCtx_1 = variant.fnCtx;
      subCtx_1.is_function = true;
      await this.WalkNode(variant.fnBody, subCtx_1, wr);
      wr.newline();
      wr.indent(-1);
      wr.out("}", true);
    };
    for ( let i_5 = 0; i_5 < cl.defined_variants.length; i_5++) {
      var fnVar = cl.defined_variants[i_5];
      const mVs = cl.method_variants[fnVar];
      for ( let i_6 = 0; i_6 < mVs.variants.length; i_6++) {
        var variant_1 = mVs.variants[i_6];
        await this.writeTypeDef(variant_1.nameNode, ctx, wr);
        wr.out(" ", false);
        wr.out((" " + cl.name) + "::", false);
        wr.out(variant_1.compiledName + "(", false);
        await this.writeArgsDef(variant_1, ctx, wr);
        wr.out(") {", true);
        wr.indent(1);
        wr.newline();
        const subCtx_2 = variant_1.fnCtx;
        subCtx_2.is_function = true;
        await this.WalkNode(variant_1.fnBody, subCtx_2, wr);
        wr.newline();
        wr.indent(-1);
        wr.out("}", true);
      };
    };
    for ( let i_7 = 0; i_7 < cl.static_methods.length; i_7++) {
      var variant_2 = cl.static_methods[i_7];
      if ( variant_2.nameNode.hasFlag("main") && (variant_2.nameNode.code.filename == ctx.getRootFile()) ) {
        ctx.setCompilerSetting("mainclass", cl.name);
        wr.out("int main(int argc, char* argv[]) {", true);
        wr.indent(1);
        wr.out("__g_argc = argc;", true);
        wr.out("__g_argv = argv;", true);
        const subCtx_3 = variant_2.fnCtx;
        subCtx_3.in_main = true;
        subCtx_3.is_function = true;
        await this.WalkNode(variant_2.fnBody, subCtx_3, wr);
        wr.newline();
        wr.out("return 0;", true);
        wr.indent(-1);
        wr.out("}", true);
      }
    };
  };
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
    };
  };
  adjustType (tn) {
    if ( tn == "this" ) {
      return "this";
    }
    return tn;
  };
  getObjectTypeString (type_string, ctx) {
    switch (type_string ) { 
      case "int" : 
        return "Integer";
      case "string" : 
        return "String";
      case "chararray" : 
        return "CharArray";
      case "char" : 
        return "char";
      case "boolean" : 
        return "Boolean";
      case "double" : 
        return "Double";
    };
    return type_string;
  };
  getTypeString (type_string) {
    switch (type_string ) { 
      case "int" : 
        return "Integer";
      case "string" : 
        return "String";
      case "chararray" : 
        return "CharArray";
      case "char" : 
        return "Char";
      case "boolean" : 
        return "Boolean";
      case "double" : 
        return "Double";
    };
    return type_string;
  };
  async writeTypeDef (node, ctx, wr) {
    let v_type = node.value_type;
    if ( node.eval_type != 0 ) {
      v_type = node.eval_type;
    }
    switch (v_type ) { 
      case 13 : 
        wr.out("Int", false);
        break;
      case 3 : 
        wr.out("Int", false);
        break;
      case 2 : 
        wr.out("Double", false);
        break;
      case 14 : 
        wr.out("Char", false);
        break;
      case 15 : 
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
    };
    if ( node.hasFlag("optional") ) {
      wr.out("?", false);
    }
  };
  async WriteVRef (node, ctx, wr) {
    if ( node.eval_type == 13 ) {
      if ( (node.ns.length) > 1 ) {
        const rootObjName = node.ns[0];
        const enumName = node.ns[1];
        const e = ctx.getEnum(rootObjName);
        if ( (typeof(e) !== "undefined" && e != null )  ) {
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
      };
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
    };
  };
  async writeVarDef (node, ctx, wr) {
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
      await this.writeTypeDef(p.nameNode, ctx, wr);
      wr.out(" ", false);
      if ( (node.children.length) > 2 ) {
        wr.out(" = ", false);
        ctx.setInExpr();
        const value = node.getThird();
        await this.WalkNode(value, ctx, wr);
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
  };
  async writeArgsDef (fnDesc, ctx, wr) {
    for ( let i = 0; i < fnDesc.params.length; i++) {
      var arg = fnDesc.params[i];
      if ( i > 0 ) {
        wr.out(",", false);
      }
      wr.out(" ", false);
      wr.out(arg.name + " : ", false);
      await this.writeTypeDef(arg.nameNode, ctx, wr);
    };
  };
  async writeFnCall (node, ctx, wr) {
    if ( node.hasFnCall ) {
      const fc = node.getFirst();
      await this.WriteVRef(fc, ctx, wr);
      wr.out("(", false);
      const givenArgs = node.getSecond();
      for ( let i = 0; i < node.fnDesc.params.length; i++) {
        var arg = node.fnDesc.params[i];
        if ( i > 0 ) {
          wr.out(", ", false);
        }
        if ( (givenArgs.children.length) <= i ) {
          const defVal = arg.nameNode.getFlag("default");
          if ( (typeof(defVal) !== "undefined" && defVal != null )  ) {
            const fc_1 = defVal.vref_annotation.getFirst();
            await this.WalkNode(fc_1, ctx, wr);
          } else {
            ctx.addError(node, "Default argument was missing");
          }
          continue;
        }
        const n = givenArgs.children[i];
        await this.WalkNode(n, ctx, wr);
      };
      wr.out(")", false);
      if ( ctx.expressionLevel() == 0 ) {
        wr.out(";", true);
      }
    }
  };
  async writeNewCall (node, ctx, wr) {
    if ( node.hasNewOper ) {
      const cl = node.clDesc;
      /** unused:  const fc = node.getSecond()   **/ 
      wr.out(" ", false);
      wr.out(node.clDesc.name, false);
      wr.out("(", false);
      const constr = cl.constructor_fn;
      const givenArgs = node.getThird();
      if ( (typeof(constr) !== "undefined" && constr != null )  ) {
        for ( let i = 0; i < constr.params.length; i++) {
          var arg = constr.params[i];
          const n = givenArgs.children[i];
          if ( i > 0 ) {
            wr.out(", ", false);
          }
          if ( true || ((typeof(arg.nameNode) !== "undefined" && arg.nameNode != null ) ) ) {
            await this.WalkNode(n, ctx, wr);
          }
        };
      }
      wr.out(")", false);
    }
  };
  async writeClass (node, ctx, orig_wr) {
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
      await this.writeArgsDef(constr, ctx, wr);
      wr.out(" ) ", true);
    }
    wr.out(" {", true);
    wr.indent(1);
    for ( let i = 0; i < cl.variables.length; i++) {
      var pvar = cl.variables[i];
      await this.writeVarDef(pvar.node, ctx, wr);
    };
    if ( cl.has_constructor ) {
      const constr_1 = cl.constructor_fn;
      wr.out("", true);
      wr.out("init {", true);
      wr.indent(1);
      wr.newline();
      const subCtx = constr_1.fnCtx;
      subCtx.is_function = true;
      await this.WalkNode(constr_1.fnBody, subCtx, wr);
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
      await this.writeArgsDef(variant, ctx, wr);
      wr.out(") : ", false);
      await this.writeTypeDef(variant.nameNode, ctx, wr);
      wr.out(" {", true);
      wr.indent(1);
      wr.newline();
      const subCtx_1 = variant.fnCtx;
      subCtx_1.is_function = true;
      await this.WalkNode(variant.fnBody, subCtx_1, wr);
      wr.newline();
      wr.indent(-1);
      wr.out("}", true);
    };
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
        await this.writeArgsDef(variant_1, ctx, wr);
        wr.out(") : ", false);
        await this.writeTypeDef(variant_1.nameNode, ctx, wr);
        wr.out(" {", true);
        wr.indent(1);
        wr.newline();
        const subCtx_2 = variant_1.fnCtx;
        subCtx_2.is_function = true;
        await this.WalkNode(variant_1.fnBody, subCtx_2, wr);
        wr.newline();
        wr.indent(-1);
        wr.out("}", true);
      };
    };
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
        await this.WalkNode(variant_2.fnBody, subCtx_3, wr);
        wr.newline();
        wr.indent(-1);
        wr.out("}", true);
      }
    };
  };
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
  };
  getObjectTypeString (type_string, ctx) {
    if ( ctx.isDefinedClass(type_string) ) {
      const cc = ctx.findClass(type_string);
      if ( cc.is_union ) {
        return "dynamic";
      }
      if ( cc.is_system ) {
        const sysName = cc.systemNames["csharp"];
        if ( (typeof(sysName) !== "undefined" && sysName != null )  ) {
          return sysName;
        } else {
          const node = new CodeNode(new SourceCode(""), 0, 0);
          ctx.addError(node, ("No system class " + type_string) + "defined for C# ");
        }
      }
    }
    switch (type_string ) { 
      case "int" : 
        return "int";
      case "string" : 
        return "String";
      case "chararray" : 
        return "byte[]";
      case "char" : 
        return "byte";
      case "boolean" : 
        return "bool";
      case "double" : 
        return "double";
    };
    return type_string;
  };
  getTypeString (type_string) {
    switch (type_string ) { 
      case "int" : 
        return "int";
      case "string" : 
        return "String";
      case "chararray" : 
        return "byte[]";
      case "char" : 
        return "byte";
      case "boolean" : 
        return "bool";
      case "double" : 
        return "double";
    };
    return type_string;
  };
  async writeLambdaType (expression_value, ctx, wr) {
    const rv = expression_value.children[0];
    const sec = expression_value.children[1];
    /** unused:  const fc = sec.getFirst()   **/ 
    let is_void = false;
    if ( (rv.type_name == "void") || (rv.eval_type_name == "void") ) {
      is_void = true;
    }
    if ( is_void ) {
      wr.out("Action", false);
      if ( (sec.children.length) > 0 ) {
        wr.out("<", false);
      }
    } else {
      wr.out("Func<", false);
    }
    for ( let i = 0; i < sec.children.length; i++) {
      var arg = sec.children[i];
      if ( i > 0 ) {
        wr.out(", ", false);
      }
      await this.writeTypeDef(arg, ctx, wr);
    };
    if ( is_void == false ) {
      if ( (sec.children.length) > 0 ) {
        wr.out(", ", false);
      }
      await this.writeTypeDef(rv, ctx, wr);
    }
    if ( is_void ) {
      if ( (sec.children.length) > 0 ) {
        wr.out(">", false);
      }
    } else {
      wr.out(">", false);
    }
  };
  async writeTypeDef (node, ctx, wr) {
    let v_type = node.value_type;
    let t_name = node.type_name;
    let a_name = node.array_type;
    let k_name = node.key_type;
    if ( ((v_type == 10) || (v_type == 11)) || (v_type == 0) ) {
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
      case 17 : 
        await this.writeLambdaType(node.expression_value, ctx, wr);
        break;
      case 13 : 
        wr.out("int", false);
        break;
      case 3 : 
        wr.out("int", false);
        break;
      case 2 : 
        wr.out("double", false);
        break;
      case 14 : 
        wr.out("byte", false);
        break;
      case 15 : 
        wr.out("byte[]", false);
        break;
      case 4 : 
        wr.out("String", false);
        break;
      case 5 : 
        wr.out("bool", false);
        break;
      case 7 : 
        wr.out(((("Dictionary<" + this.getObjectTypeString(k_name, ctx)) + ",") + this.getObjectTypeString(a_name, ctx)) + ">", false);
        wr.addImport("System.Collections");
        wr.addImport("System.Collections.Generic");
        break;
      case 6 : 
        wr.out(("List<" + this.getObjectTypeString(a_name, ctx)) + ">", false);
        wr.addImport("System.Collections");
        wr.addImport("System.Collections.Generic");
        break;
      default: 
        if ( node.type_name == "void" ) {
          wr.out("void", false);
          return;
        }
        if ( ctx.isDefinedClass(t_name) ) {
          const cc = ctx.findClass(t_name);
          if ( cc.is_union ) {
            wr.out("dynamic", false);
            return;
          }
          if ( cc.is_system ) {
            const sysName = cc.systemNames["csharp"];
            if ( (typeof(sysName) !== "undefined" && sysName != null )  ) {
              wr.out(sysName, false);
            } else {
              ctx.addError(node, ("No system class " + t_name) + "defined for C# ");
            }
            return;
          }
        }
        wr.out(this.getTypeString(node.type_name), false);
        break;
    };
  };
  async WriteVRef (node, ctx, wr) {
    if ( node.eval_type == 13 ) {
      if ( (node.ns.length) > 1 ) {
        const rootObjName = node.ns[0];
        const enumName = node.ns[1];
        const e = ctx.getEnum(rootObjName);
        if ( (typeof(e) !== "undefined" && e != null )  ) {
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
          if ( part == "this" ) {
            if ( ctx.inLambda() ) {
              wr.out("this", false);
            } else {
              wr.out("this", false);
            }
            continue;
          }
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
      };
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
    };
  };
  async writeVarDef (node, ctx, wr) {
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
      await this.writeTypeDef(p.nameNode, ctx, wr);
      wr.out(" ", false);
      wr.out(p.compiledName, false);
      if ( (node.children.length) > 2 ) {
        wr.out(" = ", false);
        ctx.setInExpr();
        const value = node.getThird();
        await this.WalkNode(value, ctx, wr);
        ctx.unsetInExpr();
      } else {
        if ( nn.value_type == 6 ) {
          wr.out(" = new ", false);
          await this.writeTypeDef(p.nameNode, ctx, wr);
          wr.out("()", false);
        }
        if ( nn.value_type == 7 ) {
          wr.out(" = new ", false);
          await this.writeTypeDef(p.nameNode, ctx, wr);
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
  };
  async CreateLambda (node, ctx, wr) {
    const lambdaCtx = node.lambda_ctx;
    /** unused:  const fName = node.children[1]   **/ 
    const body = node.children[2];
    const args = node.children[1];
    wr.out("(", false);
    wr.out("(", false);
    await this.writeLambdaType(node, ctx, wr);
    wr.out(")", false);
    wr.out("(", false);
    wr.out("(", false);
    for ( let i = 0; i < args.children.length; i++) {
      var arg = args.children[i];
      if ( i > 0 ) {
        wr.out(", ", false);
      }
      if ( arg.flow_done == false ) {
        await this.compiler.parser.WalkNode(arg, lambdaCtx, wr);
      }
      await this.WalkNode(arg, lambdaCtx, wr);
    };
    wr.out(")", false);
    wr.out(" => { ", true);
    wr.indent(1);
    lambdaCtx.restartExpressionLevel();
    for ( let i_1 = 0; i_1 < body.children.length; i_1++) {
      var item = body.children[i_1];
      await this.WalkNode(item, lambdaCtx, wr);
    };
    wr.newline();
    wr.indent(-1);
    wr.out("}", false);
    wr.out("))", false);
    if ( ctx.expressionLevel() == 0 ) {
      wr.out(";", true);
    }
  };
  async writeArgsDef (fnDesc, ctx, wr) {
    for ( let i = 0; i < fnDesc.params.length; i++) {
      var arg = fnDesc.params[i];
      if ( i > 0 ) {
        wr.out(",", false);
      }
      wr.out(" ", false);
      await this.writeTypeDef(arg.nameNode, ctx, wr);
      wr.out((" " + arg.compiledName) + " ", false);
    };
  };
  async writeArrayLiteral (node, ctx, wr) {
    wr.out("new List<", false);
    wr.out(this.getObjectTypeString(node.eval_array_type, ctx), false);
    wr.out("> {", false);
    await operatorsOf.forEach_15(node.children, (async (item, index) => { 
      if ( index > 0 ) {
        wr.out(", ", false);
      }
      await this.WalkNode(item, ctx, wr);
    }));
    wr.out("}", false);
  };
  async writeClass (node, ctx, orig_wr) {
    const cl = node.clDesc;
    if ( typeof(cl) === "undefined" ) {
      return;
    }
    const wr = orig_wr;
    this.import_lib("System", ctx, wr);
    wr.out(("class " + cl.name) + " ", false);
    if ( (cl.extends_classes.length) > 0 ) {
      wr.out(" : ", false);
      for ( let i = 0; i < cl.extends_classes.length; i++) {
        var pName = cl.extends_classes[i];
        wr.out(pName, false);
      };
    }
    wr.out(" {", true);
    wr.indent(1);
    wr.createTag("utilities");
    for ( let i_1 = 0; i_1 < cl.variables.length; i_1++) {
      var pvar = cl.variables[i_1];
      wr.out("public ", false);
      await this.writeVarDef(pvar.node, ctx, wr);
    };
    if ( cl.has_constructor ) {
      const constr = cl.constructor_fn;
      wr.out(cl.name + "(", false);
      await this.writeArgsDef(constr, ctx, wr);
      wr.out(" ) {", true);
      wr.indent(1);
      wr.newline();
      const subCtx = constr.fnCtx;
      subCtx.is_function = true;
      await this.WalkNode(constr.fnBody, subCtx, wr);
      wr.newline();
      wr.indent(-1);
      wr.out("}", true);
    }
    for ( let i_2 = 0; i_2 < cl.static_methods.length; i_2++) {
      var variant = cl.static_methods[i_2];
      if ( variant.nameNode.hasFlag("main") && (variant.nameNode.code.filename != ctx.getRootFile()) ) {
        continue;
      }
      if ( variant.nameNode.hasFlag("main") ) {
        wr.out("static void Main( string [] args ) {", true);
      } else {
        wr.out("public static ", false);
        await this.writeTypeDef(variant.nameNode, ctx, wr);
        wr.out(" ", false);
        wr.out(variant.name + "(", false);
        await this.writeArgsDef(variant, ctx, wr);
        wr.out(") {", true);
      }
      wr.indent(1);
      wr.newline();
      const subCtx_1 = variant.fnCtx;
      subCtx_1.is_function = true;
      await this.WalkNode(variant.fnBody, subCtx_1, wr);
      wr.newline();
      wr.indent(-1);
      wr.out("}", true);
    };
    for ( let i_3 = 0; i_3 < cl.defined_variants.length; i_3++) {
      var fnVar = cl.defined_variants[i_3];
      const mVs = cl.method_variants[fnVar];
      for ( let i_4 = 0; i_4 < mVs.variants.length; i_4++) {
        var variant_1 = mVs.variants[i_4];
        wr.out("public ", false);
        await this.writeTypeDef(variant_1.nameNode, ctx, wr);
        wr.out(" ", false);
        wr.out(variant_1.name + "(", false);
        await this.writeArgsDef(variant_1, ctx, wr);
        wr.out(") {", true);
        wr.indent(1);
        const subCtx_2 = variant_1.fnCtx;
        subCtx_2.is_function = true;
        await this.WalkNode(variant_1.fnBody, subCtx_2, wr);
        wr.indent(-1);
        wr.out("}", true);
      };
    };
    wr.indent(-1);
    wr.out("}", true);
  };
}
class RangerScalaClassWriter  extends RangerGenericClassWriter {
  constructor() {
    super()
    this.init_done = false;
  }
  getObjectTypeString (type_string, ctx) {
    if ( ctx.isDefinedClass(type_string) ) {
      const cc = ctx.findClass(type_string);
      if ( cc.is_union ) {
        return "Any";
      }
    }
    switch (type_string ) { 
      case "int" : 
        return "Int";
      case "string" : 
        return "String";
      case "boolean" : 
        return "Boolean";
      case "double" : 
        return "Double";
      case "chararray" : 
        return "Array[Byte]";
      case "char" : 
        return "byte";
    };
    return type_string;
  };
  getTypeString (type_string) {
    switch (type_string ) { 
      case "int" : 
        return "Int";
      case "string" : 
        return "String";
      case "boolean" : 
        return "Boolean";
      case "double" : 
        return "Double";
      case "chararray" : 
        return "Array[Byte]";
      case "char" : 
        return "byte";
    };
    return type_string;
  };
  async writeTypeDef (node, ctx, wr) {
    if ( node.hasFlag("optional") ) {
      wr.out("Option[", false);
    }
    let v_type = node.value_type;
    let t_name = node.type_name;
    let a_name = node.array_type;
    let k_name = node.key_type;
    if ( ((v_type == 10) || (v_type == 11)) || (v_type == 0) ) {
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
      case 17 : 
        const rv = node.expression_value.children[0];
        const sec = node.expression_value.children[1];
        /** unused:  const fc = sec.getFirst()   **/ 
        let is_void = false;
        if ( (rv.type_name == "void") || (rv.eval_type_name == "void") ) {
          is_void = true;
        }
        wr.out("(", false);
        for ( let i = 0; i < sec.children.length; i++) {
          var arg = sec.children[i];
          if ( i > 0 ) {
            wr.out(", ", false);
          }
          await this.writeTypeDef(arg, ctx, wr);
        };
        wr.out(")", false);
        if ( is_void ) {
          wr.out("=> Unit", false);
        } else {
          wr.out("=> ", false);
          await this.writeTypeDef(rv, ctx, wr);
        }
        break;
      case 13 : 
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
      case 14 : 
        wr.out("Byte", false);
        break;
      case 15 : 
        wr.out("Array[Byte]", false);
        break;
      case 7 : 
        wr.addImport("scala.collection.mutable");
        wr.out(((("collection.mutable.HashMap[" + this.getObjectTypeString(k_name, ctx)) + ", ") + this.getObjectTypeString(a_name, ctx)) + "]", false);
        break;
      case 6 : 
        wr.addImport("scala.collection.mutable");
        wr.out(("collection.mutable.ArrayBuffer[" + this.getObjectTypeString(a_name, ctx)) + "]", false);
        break;
      default: 
        if ( ctx.isDefinedClass(t_name) ) {
          const cc = ctx.findClass(t_name);
          if ( cc.is_union ) {
            wr.out("Any", false);
            if ( node.hasFlag("optional") ) {
              wr.out("]", false);
            }
            return;
          }
        }
        if ( node.type_name == "void" ) {
          wr.out("Unit", false);
          return;
        }
        wr.out(this.getTypeString(t_name), false);
        break;
    };
    if ( node.hasFlag("optional") ) {
      wr.out("]", false);
    }
  };
  async writeTypeDefNoOption (node, ctx, wr) {
    let v_type = node.value_type;
    if ( node.eval_type != 0 ) {
      v_type = node.eval_type;
    }
    switch (v_type ) { 
      case 17 : 
        const rv = node.expression_value.children[0];
        const sec = node.expression_value.children[1];
        /** unused:  const fc = sec.getFirst()   **/ 
        let is_void = false;
        if ( (rv.type_name == "void") || (rv.eval_type_name == "void") ) {
          is_void = true;
        }
        wr.out("(", false);
        for ( let i = 0; i < sec.children.length; i++) {
          var arg = sec.children[i];
          if ( i > 0 ) {
            wr.out(", ", false);
          }
          await this.writeTypeDef(arg, ctx, wr);
        };
        wr.out(")", false);
        if ( is_void ) {
          wr.out("=> Unit", false);
        } else {
          wr.out("=> ", false);
          await this.writeTypeDef(rv, ctx, wr);
        }
        break;
      case 13 : 
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
      case 14 : 
        wr.out("Byte", false);
        break;
      case 15 : 
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
    };
  };
  async WriteVRef (node, ctx, wr) {
    if ( node.vref == "this" ) {
      wr.out("this", false);
      return;
    }
    if ( node.eval_type == 13 ) {
      if ( (node.ns.length) > 1 ) {
        const rootObjName = node.ns[0];
        const enumName = node.ns[1];
        const e = ctx.getEnum(rootObjName);
        if ( (typeof(e) !== "undefined" && e != null )  ) {
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
        if ( i == 0 ) {
          if ( p.nameNode.hasFlag("optional") ) {
            wr.out(".get", false);
          }
        }
      };
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
    };
  };
  async writeVarDef (node, ctx, wr) {
    if ( node.hasParamDesc ) {
      const p = node.paramDesc;
      /** unused:  const nn = node.children[1]   **/ 
      if ( (p.ref_cnt == 0) && (p.is_class_variable == false) ) {
        wr.out("/** unused ", false);
      }
      if ( (p.set_cnt > 0) || p.is_class_variable ) {
        wr.out(("var " + p.compiledName) + " ", false);
      } else {
        wr.out(("val " + p.compiledName) + " ", false);
      }
      const ti_ok = ctx.canUseTypeInference((p.nameNode));
      if ( (false == ti_ok) || ((false == p.nameNode.hasFlag("optional")) && ((node.children.length) == 2)) ) {
        wr.out(": ", false);
        await this.writeTypeDef(p.nameNode, ctx, wr);
        wr.out(" ", false);
      }
      if ( (node.children.length) > 2 ) {
        wr.out("= ", false);
        ctx.setInExpr();
        const value = node.getThird();
        await this.WalkNode(value, ctx, wr);
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
          await this.writeTypeDefNoOption(p.nameNode, ctx, wr);
          wr.out("]", false);
        } else {
          if ( b_inited == false ) {
            wr.out("= _", false);
          }
        }
      }
      if ( (p.ref_cnt == 0) && (p.is_class_variable == false) ) {
        wr.out("**/ ", true);
      } else {
        wr.newline();
      }
    }
  };
  async writeArgsDef (fnDesc, ctx, wr) {
    for ( let i = 0; i < fnDesc.params.length; i++) {
      var arg = fnDesc.params[i];
      if ( i > 0 ) {
        wr.out(",", false);
      }
      wr.out(" ", false);
      wr.out(arg.compiledName + " : ", false);
      await this.writeTypeDef(arg.nameNode, ctx, wr);
    };
  };
  async writeFnEnd (node, ctx, wr) {
    wr.indent(-1);
    wr.out("} catch {", true);
    wr.indent(1);
    wr.out("case rv:ScalaReturnValue => {", true);
    wr.indent(1);
    wr.out("__returns__ = rv.value", true);
    wr.indent(-1);
    wr.out("}", true);
    wr.indent(-1);
    wr.out("}", true);
    wr.out("__returns__.asInstanceOf[", false);
    await this.writeTypeDef(node, ctx, wr);
    wr.out("]", true);
  };
  writeFnStart (node, ctx, wr) {
    wr.out("var __returns__ : Any = null", true);
    wr.out("try {", true);
    wr.indent(1);
  };
  async CustomOperator (node, ctx, wr) {
    const fc = node.getFirst();
    const cmd = fc.vref;
    if ( cmd == "for" ) {
      const listNode = node.children[1];
      const itemNode = node.children[2];
      const indexNode = node.children[3];
      const bodyNode = node.children[4];
      let break_cnt = 0;
      let continue_cnt = 0;
      await bodyNode.forTree(((item, i) => { 
        if ( item.isFirstVref("break") ) {
          break_cnt = break_cnt + 1;
        }
        if ( item.isFirstVref("continue") ) {
          continue_cnt = continue_cnt + 1;
        }
      }));
      if ( continue_cnt > 0 ) {
        ctx.addError(node, "oops, sorry. Currently Scala output can not handle for-loops with continue :/");
        return;
      }
      if ( break_cnt > 0 ) {
        wr.addImport("scala.util.control._");
        wr.out("try {", true);
        wr.indent(1);
        wr.out("val __break__ = new Breaks", true);
        wr.out("__break__.breakable {", true);
        wr.indent(1);
      }
      wr.out("for( ", false);
      await this.WalkNode(indexNode, ctx, wr);
      wr.out(" <- 0 until ", false);
      await this.WalkNode(listNode, ctx, wr);
      wr.out(".length ) {", true);
      wr.indent(1);
      wr.out("val ", false);
      await this.WalkNode(itemNode, ctx, wr);
      wr.out(" = ", false);
      await this.WalkNode(listNode, ctx, wr);
      wr.out("(", false);
      await this.WalkNode(indexNode, ctx, wr);
      wr.out(")", true);
      await this.WalkNode(bodyNode, ctx, wr);
      wr.indent(-1);
      wr.out("}", true);
      if ( break_cnt > 0 ) {
        wr.indent(-1);
        wr.out("}", true);
        wr.indent(-1);
        wr.out("}", true);
      }
      return;
    }
    if ( cmd == "try" ) {
      const tryBlock = node.getSecond();
      const catchBlock = node.getThird();
      wr.out("try {", true);
      wr.indent(1);
      await this.WalkNode(tryBlock, ctx, wr);
      wr.indent(-1);
      wr.out("} catch {", true);
      wr.indent(1);
      if ( ctx.inLambda() ) {
        wr.out("case rv:ScalaReturnValue => {", true);
        wr.indent(1);
        wr.out("throw new ScalaReturnValue(rv.value)", true);
        wr.indent(-1);
        wr.out("}", true);
      }
      wr.out("case e: Exception => {", true);
      wr.indent(1);
      await this.WalkNode(catchBlock, ctx, wr);
      wr.indent(-1);
      wr.out("}", true);
      wr.indent(-1);
      wr.out("}", true);
      return;
    }
    if ( cmd == "return" ) {
      if ( (node.children.length) > 1 ) {
        const rValue = node.getSecond();
        if ( ctx.getFlag("last_returns") ) {
          await this.WalkNode(rValue, ctx, wr);
          return;
        }
        if ( ctx.inLambda() ) {
          wr.out("throw new ScalaReturnValue(", false);
          ctx.setInExpr();
          await this.WalkNode(rValue, ctx, wr);
          ctx.unsetInExpr();
          wr.out(")", true);
        } else {
          wr.out("return ", false);
          ctx.setInExpr();
          await this.WalkNode(rValue, ctx, wr);
          ctx.unsetInExpr();
          wr.out("  ", true);
        }
      } else {
        if ( ctx.inLambda() ) {
          wr.out("throw new ScalaReturnValue(null)", true);
        } else {
          wr.out("return", true);
        }
      }
      return;
    }
  };
  async CreateLambda (node, ctx, wr) {
    const lambdaCtx = node.lambda_ctx;
    const fnDef = node.children[0];
    const args = node.children[1];
    const body = node.children[2];
    lambdaCtx.is_lambda = true;
    wr.out("((", false);
    for ( let i = 0; i < args.children.length; i++) {
      var arg = args.children[i];
      if ( i > 0 ) {
        wr.out(", ", false);
      }
      if ( arg.flow_done == false ) {
        await this.compiler.parser.WalkNode(arg, lambdaCtx, wr);
      }
      await this.WalkNode(arg, lambdaCtx, wr);
      wr.out(" : ", false);
      await this.writeTypeDef(arg, ctx, wr);
    };
    wr.out(")", false);
    let return_cnt = 0;
    const line_cnt = body.children.length;
    await body.forTree(((item, i) => { 
      if ( item.isFirstVref("return") ) {
        return_cnt = return_cnt + 1;
      }
    }));
    if ( line_cnt == 1 ) {
      return_cnt = 1;
    }
    if ( fnDef.type_name != "void" ) {
      if ( return_cnt == 1 ) {
        if ( line_cnt > 1 ) {
          wr.out(" => { ", true);
          wr.indent(1);
          lambdaCtx.restartExpressionLevel();
        } else {
          wr.out(" => ", false);
          lambdaCtx.setInExpr();
        }
        lambdaCtx.setFlag("last_returns", true);
        for ( let i_1 = 0; i_1 < body.children.length; i_1++) {
          var item = body.children[i_1];
          await this.WalkNode(item, lambdaCtx, wr);
        };
        if ( line_cnt > 1 ) {
          wr.newline();
          wr.indent(-1);
          wr.out("}", false);
        } else {
          lambdaCtx.unsetInExpr();
        }
        wr.out(")", false);
        return;
      }
    }
    if ( (line_cnt > 1) || (return_cnt > 1) ) {
      wr.out(" => { ", true);
      wr.indent(1);
      lambdaCtx.restartExpressionLevel();
    } else {
      wr.out(" => ", false);
      lambdaCtx.setInExpr();
    }
    if ( fnDef.type_name != "void" ) {
      this.writeFnStart(fnDef, ctx, wr);
    }
    for ( let i_2 = 0; i_2 < body.children.length; i_2++) {
      var item_1 = body.children[i_2];
      await this.WalkNode(item_1, lambdaCtx, wr);
    };
    if ( fnDef.type_name != "void" ) {
      await this.writeFnEnd(fnDef, ctx, wr);
    }
    if ( (line_cnt > 1) || (return_cnt > 1) ) {
      wr.newline();
      wr.indent(-1);
      wr.out("}", false);
    } else {
      lambdaCtx.unsetInExpr();
    }
    wr.out(")", false);
  };
  async writeArrayLiteral (node, ctx, wr) {
    wr.out("collection.mutable.ArrayBuffer(", false);
    await operatorsOf.forEach_15(node.children, (async (item, index) => { 
      if ( index > 0 ) {
        wr.out(", ", false);
      }
      await this.WalkNode(item, ctx, wr);
    }));
    wr.out(")", false);
  };
  async writeClass (node, ctx, orig_wr) {
    let declaredFunction = {};
    const cl = node.clDesc;
    if ( typeof(cl) === "undefined" ) {
      return;
    }
    const wr = orig_wr;
    if ( this.init_done == false ) {
      wr.out("case class ScalaReturnValue(value:Any) extends Exception", true);
      wr.createTag("imports");
      this.init_done = true;
      wr.createTag("beginning");
    }
    /** unused:  const importFork = wr.getTag("imports")   **/ 
    const b_class_has_content = ((cl.has_constructor || ((cl.variables.length) > 0)) || ((cl.defined_variants.length) > 0)) || ((cl.extends_classes.length) > 0);
    if ( b_class_has_content ) {
      if ( (cl.extends_classes.length) > 0 ) {
        for ( let i = 0; i < cl.extends_classes.length; i++) {
          var pName = cl.extends_classes[i];
          const pC = ctx.findClass(pName);
          for ( let i_1 = 0; i_1 < pC.defined_variants.length; i_1++) {
            var fnVar = pC.defined_variants[i_1];
            const mVs = pC.method_variants[fnVar];
            for ( let i_2 = 0; i_2 < mVs.variants.length; i_2++) {
              var variant = mVs.variants[i_2];
              declaredFunction[variant.name] = true;
            };
          };
        };
      }
      wr.out(("class " + cl.name) + " ", false);
      if ( cl.has_constructor ) {
        wr.out("(", false);
        const constr = cl.constructor_fn;
        for ( let i_3 = 0; i_3 < constr.params.length; i_3++) {
          var arg = constr.params[i_3];
          if ( i_3 > 0 ) {
            wr.out(", ", false);
          }
          wr.out(arg.name + " : ", false);
          await this.writeTypeDef(arg.nameNode, ctx, wr);
        };
        wr.out(")", false);
      }
      if ( (cl.extends_classes.length) > 0 ) {
        wr.out(" extends ", false);
        for ( let i_4 = 0; i_4 < cl.extends_classes.length; i_4++) {
          var pName_1 = cl.extends_classes[i_4];
          wr.out(pName_1, false);
        };
      }
      wr.out(" {", true);
      wr.indent(1);
      for ( let i_5 = 0; i_5 < cl.variables.length; i_5++) {
        var pvar = cl.variables[i_5];
        await this.writeVarDef(pvar.node, ctx, wr);
      };
      if ( cl.has_constructor ) {
        const constr_1 = cl.constructor_fn;
        wr.newline();
        const subCtx = constr_1.fnCtx;
        subCtx.is_function = true;
        await this.WalkNode(constr_1.fnBody, subCtx, wr);
        wr.newline();
      }
      for ( let i_6 = 0; i_6 < cl.defined_variants.length; i_6++) {
        var fnVar_1 = cl.defined_variants[i_6];
        const mVs_1 = cl.method_variants[fnVar_1];
        for ( let i_7 = 0; i_7 < mVs_1.variants.length; i_7++) {
          var variant_1 = mVs_1.variants[i_7];
          if ( ( typeof(declaredFunction[variant_1.name] ) != "undefined" && declaredFunction.hasOwnProperty(variant_1.name) ) ) {
            wr.out("override ", false);
          }
          wr.out("def ", false);
          wr.out(" ", false);
          wr.out(variant_1.name + "(", false);
          await this.writeArgsDef(variant_1, ctx, wr);
          wr.out(") : ", false);
          await this.writeTypeDef(variant_1.nameNode, ctx, wr);
          wr.out(" = ", false);
          let return_cnt = 0;
          const line_cnt = variant_1.fnBody.children.length;
          await variant_1.fnBody.forTree(((item, i) => { 
            if ( item.isFirstVref("return") ) {
              return_cnt = return_cnt + 1;
            }
          }));
          const subCtx_1 = variant_1.fnCtx;
          subCtx_1.is_function = true;
          if ( return_cnt <= 1 ) {
            subCtx_1.setFlag("last_returns", true);
            if ( line_cnt > 1 ) {
              wr.out(" { ", true);
              wr.indent(1);
            } else {
              subCtx_1.setInExpr();
            }
            await this.WalkNode(variant_1.fnBody, subCtx_1, wr);
            if ( line_cnt > 1 ) {
              wr.newline();
              wr.indent(-1);
              wr.out("}", true);
            } else {
              subCtx_1.unsetInExpr();
              wr.newline();
            }
          } else {
            wr.out(" {", true);
            wr.indent(1);
            wr.newline();
            await this.WalkNode(variant_1.fnBody, subCtx_1, wr);
            wr.newline();
            wr.indent(-1);
            wr.out("}", true);
          }
        };
      };
      wr.indent(-1);
      wr.out("}", true);
    }
    let b_has_non_main_static = false;
    let b_had_app = false;
    let app_obj;
    await operatorsOf.forEach_29(cl.static_methods, ((item, index) => { 
      if ( item.name != "main" ) {
        b_has_non_main_static = true;
      } else {
        b_had_app = true;
        const it = item;
        app_obj = it;
      }
    }));
    if ( b_has_non_main_static ) {
      wr.out("", true);
      wr.out((("// companion object for static methods of " + cl.name) + " static cnt == ") + (cl.static_methods.length), true);
      wr.out(("object " + cl.name) + " {", true);
      wr.indent(1);
      for ( let i_8 = 0; i_8 < cl.static_methods.length; i_8++) {
        var variant_2 = cl.static_methods[i_8];
        if ( variant_2.nameNode.hasFlag("main") ) {
          continue;
        }
        wr.out("def ", false);
        wr.out(" ", false);
        wr.out(variant_2.name + "(", false);
        await this.writeArgsDef(variant_2, ctx, wr);
        wr.out(") : ", false);
        await this.writeTypeDef(variant_2.nameNode, ctx, wr);
        wr.out(" = {", true);
        wr.indent(1);
        wr.newline();
        const subCtx_2 = variant_2.fnCtx;
        subCtx_2.is_function = true;
        await this.WalkNode(variant_2.fnBody, subCtx_2, wr);
        wr.newline();
        wr.indent(-1);
        wr.out("}", true);
      };
      wr.newline();
      wr.indent(-1);
      wr.out("}", true);
    }
    if ( b_had_app ) {
      const variant_3 = app_obj;
      const b_scalafiddle = ctx.hasCompilerFlag("scalafiddle");
      let theEnd = wr.getTag("file_end");
      if ( b_scalafiddle ) {
        theEnd = wr.getTag("beginning");
        theEnd.out("", true);
        theEnd.out("// -----------  the scalafiddle main function begins ---------", true);
      }
      if ( b_scalafiddle == false ) {
        theEnd.out("", true);
        theEnd.out("// application main function for " + cl.name, true);
        theEnd.out(("object App" + cl.name) + " extends App {", true);
        theEnd.indent(1);
        theEnd.newline();
      }
      const subCtx_3 = variant_3.fnCtx;
      subCtx_3.is_function = true;
      await this.WalkNode(variant_3.fnBody, subCtx_3, theEnd);
      if ( b_scalafiddle ) {
        theEnd.out("// -----------  the scalafiddle main function ends ---------", true);
        theEnd.out("", true);
      }
      if ( b_scalafiddle == false ) {
        theEnd.newline();
        theEnd.indent(-1);
        theEnd.out("}", true);
      }
    }
  };
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
        wr.out(("int64(" + node.int_value) + ")", false);
        break;
      case 5 : 
        if ( node.boolean_value ) {
          wr.out("true", false);
        } else {
          wr.out("false", false);
        }
        break;
    };
  };
  getObjectTypeString (type_string, ctx) {
    if ( type_string == "this" ) {
      return this.thisName;
    }
    if ( ctx.isDefinedClass(type_string) ) {
      const cc = ctx.findClass(type_string);
      if ( cc.is_union ) {
        return "interface{}";
      }
      if ( cc.doesInherit() ) {
        return "IFACE_" + ctx.transformTypeName(type_string);
      }
    }
    switch (type_string ) { 
      case "int" : 
        return "int64";
      case "string" : 
        return "string";
      case "boolean" : 
        return "bool";
      case "double" : 
        return "float64";
      case "char" : 
        return "byte";
      case "charbuffer" : 
        return "[]byte";
    };
    return ctx.transformTypeName(type_string);
  };
  getTypeString2 (type_string, ctx) {
    if ( type_string == "this" ) {
      return this.thisName;
    }
    switch (type_string ) { 
      case "int" : 
        return "int64";
      case "string" : 
        return "string";
      case "boolean" : 
        return "bool";
      case "double" : 
        return "float64";
      case "char" : 
        return "byte";
      case "charbuffer" : 
        return "[]byte";
    };
    if ( ctx.isDefinedClass(type_string) ) {
      const cc = ctx.findClass(type_string);
      if ( cc.is_union ) {
        return "interface{}";
      }
    }
    return ctx.transformTypeName(type_string);
  };
  async writeRawTypeDef (node, ctx, wr) {
    this.write_raw_type = true;
    await this.writeTypeDef(node, ctx, wr);
    this.write_raw_type = false;
  };
  async writeTypeDef (node, ctx, wr) {
    this.writeTypeDef2(node, ctx, wr);
  };
  writeArrayTypeDef (node, ctx, wr) {
    let v_type = node.value_type;
    let a_name = node.array_type;
    if ( ((v_type == 10) || (v_type == 11)) || (v_type == 0) ) {
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
          if ( cc.is_union ) {
            wr.out("interface{}", false);
            return;
          }
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
          if ( cc_1.is_union ) {
            wr.out("interface{}", false);
            return;
          }
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
    };
  };
  writeTypeDef2 (node, ctx, wr) {
    let v_type = node.value_type;
    let t_name = node.type_name;
    let a_name = node.array_type;
    let k_name = node.key_type;
    if ( ((v_type == 10) || (v_type == 11)) || (v_type == 0) ) {
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
      case 17 : 
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
        };
        wr.out(") ", false);
        this.writeTypeDef2(rv, ctx, wr);
        break;
      case 13 : 
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
      case 14 : 
        wr.out("byte", false);
        break;
      case 15 : 
        wr.out("[]byte", false);
        break;
      case 7 : 
        if ( this.write_raw_type ) {
          wr.out(this.getObjectTypeString(a_name, ctx) + "", false);
        } else {
          wr.out(("map[" + this.getObjectTypeString(k_name, ctx)) + "]", false);
          if ( ctx.isDefinedClass(a_name) ) {
            const cc = ctx.findClass(a_name);
            if ( cc.is_union ) {
              wr.out("interface{}", false);
              return;
            }
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
          if ( cc_1.is_union ) {
            wr.out("interface{}", false);
            return;
          }
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
        if ( (node.type_name == "void") || (false == ((node.type_name.length) > 0)) ) {
          wr.out("()", false);
          return;
        }
        let b_iface = false;
        if ( ctx.isDefinedClass(t_name) ) {
          const cc_2 = ctx.findClass(t_name);
          b_iface = cc_2.is_interface;
          if ( cc_2.is_system ) {
            const sysName = cc_2.systemNames["go"];
            if ( (typeof(sysName) !== "undefined" && sysName != null )  ) {
              wr.out(sysName, false);
            } else {
              ctx.addError(node, ("No system class " + t_name) + "defined for Go ");
            }
            return;
          }
        }
        if ( ctx.isDefinedClass(t_name) ) {
          const cc_3 = ctx.findClass(t_name);
          if ( cc_3.is_union ) {
            wr.out("interface{}", false);
            return;
          }
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
    };
  };
  async WriteVRef (node, ctx, wr) {
    if ( node.vref == "this" ) {
      wr.out(this.thisName, false);
      return;
    }
    if ( node.eval_type == 13 ) {
      if ( (node.ns.length) > 1 ) {
        const rootObjName = node.ns[0];
        const enumName = node.ns[1];
        const e = ctx.getEnum(rootObjName);
        if ( (typeof(e) !== "undefined" && e != null )  ) {
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
        if ( ((typeof(p.nameNode) !== "undefined" && p.nameNode != null ) ) && ctx.isDefinedClass(p.nameNode.type_name) ) {
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
          const cc = ctx.getCurrentClass();
          if ( ((part != this.thisName) && ((typeof(cc) !== "undefined" && cc != null ) )) && (false == ctx.isInStatic()) ) {
            const currC = cc;
            const up = currC.findVariable(part);
            const lvDef = ctx.getVariableDef(part);
            if ( ((typeof(up) !== "undefined" && up != null ) ) && lvDef.is_class_variable ) {
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
        if ( (((typeof(p.nameNode) !== "undefined" && p.nameNode != null ) ) && p.nameNode.hasFlag("optional")) && (i != ns_last) ) {
          wr.out(".value.(", false);
          await this.writeTypeDef(p.nameNode, ctx, wr);
          wr.out(")", false);
        }
        if ( p.isClass() ) {
          had_static = true;
        }
      };
      return;
    }
    if ( node.hasParamDesc ) {
      const part_1 = node.ns[0];
      const cc_1 = ctx.getCurrentClass();
      if ( ((part_1 != this.thisName) && ((typeof(cc_1) !== "undefined" && cc_1 != null ) )) && (false == ctx.isInStatic()) ) {
        const currC_1 = cc_1;
        const up_1 = currC_1.findVariable(part_1);
        const lvDef_1 = ctx.getVariableDef(part_1);
        if ( ((typeof(up_1) !== "undefined" && up_1 != null ) ) && lvDef_1.is_class_variable ) {
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
        const cc_2 = ctx.getCurrentClass();
        if ( ((part_2 != "this") && ((typeof(cc_2) !== "undefined" && cc_2 != null ) )) && (false == ctx.isInStatic()) ) {
          const currC_2 = cc_2;
          const up_2 = currC_2.findVariable(part_2);
          const lvDef_2 = ctx.getVariableDef(part_2);
          if ( ((typeof(up_2) !== "undefined" && up_2 != null ) ) && lvDef_2.is_class_variable ) {
            /** unused:  const p3_2 = up_2   **/ 
            wr.out(this.thisName + ".", false);
          }
        }
      }
      wr.out(this.adjustType(part_2), false);
    };
  };
  async WriteSetterVRef (node, ctx, wr) {
    if ( node.vref == "this" ) {
      wr.out(this.thisName, false);
      return;
    }
    if ( node.eval_type == 13 ) {
      const rootObjName = node.ns[0];
      const enumName = node.ns[1];
      const e = ctx.getEnum(rootObjName);
      if ( (typeof(e) !== "undefined" && e != null )  ) {
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
          const cc = ctx.getCurrentClass();
          if ( ((part != this.thisName) && ((typeof(cc) !== "undefined" && cc != null ) )) && (false == ctx.isInStatic()) ) {
            const currC = cc;
            const up = currC.findVariable(part);
            const lvDef = ctx.getVariableDef(part);
            if ( ((typeof(up) !== "undefined" && up != null ) ) && lvDef.is_class_variable ) {
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
            await this.writeTypeDef(p.nameNode, ctx, wr);
            wr.out(")", false);
          }
        }
        if ( p.isClass() ) {
          had_static = true;
        }
      };
      return;
    }
    if ( node.hasParamDesc ) {
      const part_1 = node.ns[0];
      const cc_1 = ctx.getCurrentClass();
      if ( ((part_1 != this.thisName) && ((typeof(cc_1) !== "undefined" && cc_1 != null ) )) && (false == ctx.isInStatic()) ) {
        const currC_1 = cc_1;
        const up_1 = currC_1.findVariable(part_1);
        const lvDef_1 = ctx.getVariableDef(part_1);
        if ( ((typeof(up_1) !== "undefined" && up_1 != null ) ) && lvDef_1.is_class_variable ) {
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
        const cc_2 = ctx.getCurrentClass();
        if ( ((part_2 != "this") && ((typeof(cc_2) !== "undefined" && cc_2 != null ) )) && (false == ctx.isInStatic()) ) {
          const currC_2 = cc_2;
          const up_2 = currC_2.findVariable(part_2);
          const lvDef_2 = ctx.getVariableDef(part_2);
          if ( ((typeof(up_2) !== "undefined" && up_2 != null ) ) && lvDef_2.is_class_variable ) {
            /** unused:  const p3_2 = up_2   **/ 
            wr.out(this.thisName + ".", false);
          }
        }
      }
      wr.out(this.adjustType(part_2), false);
    };
  };
  async goExtractAssign (value, p, ctx, wr) {
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
    await this.writeTypeDef(arr_node, ctx, wr);
    wr.newline();
    wr.out(((p.compiledName + " , ") + pArr.compiledName) + " = ", false);
    ctx.setInExpr();
    await this.WalkNode(value, ctx, wr);
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
        if ( (typeof(partDef.nameNode) !== "undefined" && partDef.nameNode != null )  ) {
          if ( ctx.isDefinedClass(partDef.nameNode.type_name) ) {
            const c = ctx.findClass(partDef.nameNode.type_name);
            if ( c.doesInherit() ) {
              next_is_gs = true;
            }
          }
        }
        const cc = ctx.getCurrentClass();
        if ( ((part != "this") && ((typeof(cc) !== "undefined" && cc != null ) )) && (false == ctx.isInStatic()) ) {
          const currC = cc;
          const up = currC.findVariable(part);
          const lvDef = ctx.getVariableDef(part);
          if ( ((typeof(up) !== "undefined" && up != null ) ) && lvDef.is_class_variable ) {
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
          await this.writeTypeDef(pp.nameNode, ctx, wr);
          wr.out(")", false);
        }
      }
    };
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
  };
  async writeStructField (node, ctx, wr) {
    if ( node.hasParamDesc ) {
      const nn = node.children[1];
      const p = nn.paramDesc;
      wr.out(p.compiledName + " ", false);
      if ( p.nameNode.hasFlag("optional") ) {
        wr.out("*GoNullable", false);
      } else {
        await this.writeTypeDef(p.nameNode, ctx, wr);
      }
      if ( p.ref_cnt == 0 ) {
        wr.out(" /**  unused  **/ ", false);
      }
      wr.out((" `json:\"" + p.name) + "\"` ", false);
      wr.out("", true);
      if ( p.nameNode.hasFlag("optional") ) {
      }
    }
  };
  async writeVarDef (node, ctx, wr) {
    if ( node.hasParamDesc ) {
      const nn = node.children[1];
      const p = nn.paramDesc;
      let b_not_used = false;
      if ( (p.ref_cnt == 0) && (p.is_class_variable == false) ) {
        let b_can_skip = true;
        if ( (node.children.length) > 2 ) {
          const value = node.getThird();
          if ( value.has_call || value.has_lambda_call ) {
            b_can_skip = false;
          }
          await value.forTree(((item, i) => { 
            if ( item.has_call || item.has_lambda_call ) {
              b_can_skip = false;
            }
          }));
          if ( b_can_skip == false ) {
            wr.out(" _ = ", false);
            ctx.setInExpr();
            await this.WalkNode(value, ctx, wr);
            ctx.unsetInExpr();
            wr.out("", true);
            return;
          }
        }
        if ( b_can_skip ) {
          wr.out(("/** unused:  " + p.compiledName) + "*/", true);
          b_not_used = true;
          return;
        }
      }
      const map_or_hash = (nn.value_type == 6) || (nn.value_type == 7);
      if ( nn.hasFlag("optional") ) {
        wr.out(("var " + p.compiledName) + " *GoNullable = new(GoNullable); ", true);
        if ( (node.children.length) > 2 ) {
          const value_1 = node.children[2];
          if ( value_1.hasParamDesc ) {
            const pnn = value_1.paramDesc.nameNode;
            if ( pnn.hasFlag("optional") ) {
              wr.out(p.compiledName + ".value = ", false);
              ctx.setInExpr();
              const value_2 = node.getThird();
              await this.WalkNode(value_2, ctx, wr);
              ctx.unsetInExpr();
              wr.out(".value;", true);
              wr.out(p.compiledName + ".has_value = ", false);
              ctx.setInExpr();
              const value_3 = node.getThird();
              await this.WalkNode(value_3, ctx, wr);
              ctx.unsetInExpr();
              wr.out(".has_value;", true);
              return;
            } else {
              wr.out(p.compiledName + ".value = ", false);
              ctx.setInExpr();
              const value_4 = node.getThird();
              await this.WalkNode(value_4, ctx, wr);
              ctx.unsetInExpr();
              wr.out(";", true);
              wr.out(p.compiledName + ".has_value = true;", true);
              return;
            }
          } else {
            wr.out(p.compiledName + " = ", false);
            ctx.setInExpr();
            const value_5 = node.getThird();
            await this.WalkNode(value_5, ctx, wr);
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
      const ti_ok = ctx.canUseTypeInference((p.nameNode));
      if ( (false == ti_ok) || ((false == p.nameNode.hasFlag("optional")) && ((node.children.length) == 2)) ) {
        this.writeTypeDef2(p.nameNode, ctx, wr);
      }
      if ( (node.children.length) > 2 ) {
        const value_6 = node.getThird();
        if ( value_6.expression && ((value_6.children.length) > 1) ) {
          const fc = value_6.children[0];
          if ( fc.vref == "array_extract" ) {
            await this.goExtractAssign(value_6, p, ctx, wr);
            return;
          }
        }
        wr.out("= ", false);
        ctx.setInExpr();
        if ( p.nameNode.eval_type_name == "char" ) {
          wr.out("byte(", false);
        }
        await this.WalkNode(value_6, ctx, wr);
        if ( p.nameNode.eval_type_name == "char" ) {
          wr.out(")", false);
        }
        ctx.unsetInExpr();
      } else {
        if ( nn.value_type == 6 ) {
          wr.out(" = make(", false);
          await this.writeTypeDef(p.nameNode, ctx, wr);
          wr.out(", 0)", false);
        }
        if ( nn.value_type == 7 ) {
          wr.out(" = make(", false);
          await this.writeTypeDef(p.nameNode, ctx, wr);
          wr.out(")", false);
        }
      }
      wr.out(";", false);
      if ( (p.ref_cnt == 0) && (p.is_class_variable == true) ) {
        wr.out("     /** note: unused */", false);
      }
      if ( (p.ref_cnt == 0) && (p.is_class_variable == false) ) {
      } else {
        wr.newline();
      }
      if ( b_not_used == false ) {
        if ( nn.hasFlag("optional") ) {
          wr.addImport("errors");
        }
      }
    }
  };
  async writeArgsDef (fnDesc, ctx, wr) {
    for ( let i = 0; i < fnDesc.params.length; i++) {
      var arg = fnDesc.params[i];
      if ( i > 0 ) {
        wr.out(", ", false);
      }
      wr.out(arg.compiledName + " ", false);
      if ( arg.nameNode.hasFlag("optional") ) {
        wr.out("*GoNullable", false);
      } else {
        await this.writeTypeDef(arg.nameNode, ctx, wr);
      }
    };
  };
  async writeNewCall (node, ctx, wr) {
    if ( node.hasNewOper ) {
      const cl = node.clDesc;
      /** unused:  const fc = node.getSecond()   **/ 
      wr.out(("CreateNew_" + node.clDesc.name) + "(", false);
      const constr = cl.constructor_fn;
      const givenArgs = node.getThird();
      if ( (typeof(constr) !== "undefined" && constr != null )  ) {
        for ( let i = 0; i < constr.params.length; i++) {
          var arg = constr.params[i];
          const n = givenArgs.children[i];
          if ( i > 0 ) {
            wr.out(", ", false);
          }
          if ( true || ((typeof(arg.nameNode) !== "undefined" && arg.nameNode != null ) ) ) {
            await this.WalkNode(n, ctx, wr);
          }
        };
      }
      wr.out(")", false);
    }
  };
  async writeArrayLiteral (node, ctx, wr) {
    await this.writeTypeDef(node, ctx, wr);
    wr.out(" {", false);
    await operatorsOf.forEach_15(node.children, (async (item, index) => { 
      if ( index > 0 ) {
        wr.out(", ", false);
      }
      await this.WalkNode(item, ctx, wr);
    }));
    wr.out("}", false);
  };
  async CreateLambdaCall (node, ctx, wr) {
    const fName = node.children[0];
    const givenArgs = node.children[1];
    let args;
    if ( (typeof(fName.expression_value) !== "undefined" && fName.expression_value != null )  ) {
      args = fName.expression_value.children[1];
    } else {
      const param = ctx.getVariableDef(fName.vref);
      args = param.nameNode.expression_value.children[1];
    }
    ctx.setInExpr();
    await this.WalkNode(fName, ctx, wr);
    wr.out("(", false);
    const subCtx = ctx.fork();
    for ( let i = 0; i < args.children.length; i++) {
      var arg = args.children[i];
      const n = givenArgs.children[i];
      if ( i > 0 ) {
        wr.out(", ", false);
      }
      if ( arg.value_type != 0 ) {
        await this.WalkNode(n, subCtx, wr);
      } else {
        await this.WalkNode(n, subCtx, wr);
      }
    };
    ctx.unsetInExpr();
    wr.out(")", false);
    if ( ctx.expressionLevel() == 0 ) {
      wr.out(";", true);
    }
  };
  async CreateLambda (node, ctx, wr) {
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
      wr.out(arg.vref, false);
      wr.out(" ", false);
      if ( arg.hasFlag("optional") ) {
        wr.out("*GoNullable", false);
      } else {
        await this.writeTypeDef(arg, lambdaCtx, wr);
      }
    };
    wr.out(") ", false);
    if ( fnNode.hasFlag("optional") ) {
      wr.out("*GoNullable", false);
    } else {
      await this.writeTypeDef(fnNode, lambdaCtx, wr);
    }
    wr.out(" {", true);
    wr.indent(1);
    lambdaCtx.restartExpressionLevel();
    for ( let i_1 = 0; i_1 < body.children.length; i_1++) {
      var item = body.children[i_1];
      await this.WalkNode(item, lambdaCtx, wr);
    };
    wr.newline();
    wr.indent(-1);
    wr.out("}", false);
  };
  async CustomOperator (node, ctx, wr) {
    const fc = node.getFirst();
    const cmd = fc.vref;
    if ( cmd == "return" ) {
      if ( (node.children.length) > 1 ) {
        const rValue = node.getSecond();
        if ( ctx.isCatchBlock() || ctx.isTryBlock() ) {
          wr.out("__ex_returned = true", true);
          wr.out("__exReturn = ", false);
          ctx.setInExpr();
          await this.WalkNode(rValue, ctx, wr);
          ctx.unsetInExpr();
          wr.newline();
          if ( ctx.isTryBlock() ) {
            wr.out("return __ex_returned, __exReturn", true);
          }
        } else {
          wr.out("return ", false);
          ctx.setInExpr();
          await this.WalkNode(rValue, ctx, wr);
          ctx.unsetInExpr();
          wr.newline();
        }
      } else {
        if ( ctx.isCatchBlock() ) {
          wr.out("__ex_returned = true", true);
        }
        if ( ctx.isTryBlock() ) {
          wr.out("return false, nil", true);
        }
        wr.out("return", true);
      }
      return;
    }
    if ( cmd == "try" ) {
      const tryBlock = node.getSecond();
      const catchBlock = node.getThird();
      const currFn = ctx.getCurrentMethod();
      const ex2 = operatorsOf_21.createc95var_48(ctx, "did_return", "boolean");
      const ex3 = operatorsOf_21.createc95var_49(ctx, "ex_result", (currFn.nameNode));
      if ( currFn.nameNode.type_name == "void" ) {
        wr.out(ex2.compiledName + ", _ := (func () ( __ex_returned bool,  __exReturn interface{}) {", true);
      } else {
        wr.out(((ex2.compiledName + ", ") + ex3.compiledName) + " := (func () ( __ex_returned bool,  __exReturn interface{}) {", true);
      }
      wr.indent(1);
      wr.out("defer func() {", true);
      wr.indent(1);
      wr.out("if r:= recover(); r != nil {", true);
      wr.indent(1);
      const subCtx = ctx.fork();
      subCtx.is_catch_block = true;
      await this.WalkNode(catchBlock, subCtx, wr);
      wr.indent(-1);
      wr.out("}", true);
      wr.indent(-1);
      wr.out("}()", true);
      const subCtx_1 = ctx.fork();
      subCtx_1.is_try_block = true;
      await this.WalkNode(tryBlock, subCtx_1, wr);
      wr.out("return __ex_returned, __exReturn", true);
      wr.indent(-1);
      wr.out("})()", true);
      if ( currFn.nameNode.type_name != "void" ) {
        wr.out(("if " + ex2.compiledName) + " {", true);
        wr.indent(1);
        wr.out("return " + ex3.compiledName, false);
        wr.out(".(", false);
        await this.writeTypeDef(currFn.nameNode, ctx, wr);
        wr.out(")", true);
        wr.indent(-1);
        wr.out("}", true);
      } else {
        wr.out(("if " + ex2.compiledName) + " {", true);
        wr.indent(1);
        wr.out("return ", true);
        wr.indent(-1);
        wr.out("}", true);
      }
      return;
    }
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
            const cc = ctx.getCurrentClass();
            if ( ((part != "this") && ((typeof(cc) !== "undefined" && cc != null ) )) && (false == ctx.isInStatic()) ) {
              const currC = cc;
              const up = currC.findVariable(part);
              const lvDef = ctx.getVariableDef(part);
              if ( ((typeof(up) !== "undefined" && up != null ) ) && lvDef.is_class_variable ) {
                /** unused:  const p3 = up   **/ 
                wr.out(this.thisName + ".", false);
              }
            }
          }
          let partDef = ctx.getVariableDef(part);
          if ( (left.nsp.length) > i ) {
            partDef = left.nsp[i];
          }
          if ( (typeof(partDef.nameNode) !== "undefined" && partDef.nameNode != null )  ) {
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
              if ( (left.nsp.length) > (i + 1) ) {
                wr.out(".value.(", false);
                await this.writeTypeDef(pp.nameNode, ctx, wr);
                wr.out(")", false);
              } else {
                wr.out(".value", false);
                if ( right.hasFlag("optional") == false ) {
                  wr.out(" /* right is not optional, should set the has_value -> true */", false);
                }
              }
            }
          }
        };
        if ( cmd == "removeLast" ) {
          if ( last_was_setter ) {
            wr.out("(", false);
            ctx.setInExpr();
            await this.WalkNode(left, ctx, wr);
            wr.out("[:len(", false);
            await this.WalkNode(left, ctx, wr);
            wr.out(")-1]", false);
            ctx.unsetInExpr();
            wr.out("); ", true);
          } else {
            wr.out(" = ", false);
            ctx.setInExpr();
            await this.WalkNode(left, ctx, wr);
            wr.out("[:len(", false);
            await this.WalkNode(left, ctx, wr);
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
            await this.WalkNode(left, ctx, wr);
            wr.out(",", false);
            await this.WalkNode(right, ctx, wr);
            ctx.unsetInExpr();
            wr.out(")); ", true);
          } else {
            wr.out(" = ", false);
            wr.out("append(", false);
            ctx.setInExpr();
            await this.WalkNode(left, ctx, wr);
            wr.out(",", false);
            await this.WalkNode(right, ctx, wr);
            ctx.unsetInExpr();
            wr.out("); ", true);
          }
          return;
        }
        if ( last_was_setter ) {
          wr.out("(", false);
          ctx.setInExpr();
          await this.WalkNode(right, ctx, wr);
          ctx.unsetInExpr();
          wr.out("); ", true);
        } else {
          wr.out(" = ", false);
          ctx.setInExpr();
          await this.WalkNode(right, ctx, wr);
          ctx.unsetInExpr();
          wr.out("; ", true);
        }
        return;
      }
      await this.WriteSetterVRef(left, ctx, wr);
      wr.out(" = ", false);
      ctx.setInExpr();
      await this.WalkNode(right, ctx, wr);
      ctx.unsetInExpr();
      wr.out("; /* custom */", true);
    }
  };
  async writeInterface (cl, ctx, wr) {
    wr.out(("type " + cl.name) + " interface { ", true);
    wr.indent(1);
    for ( let i = 0; i < cl.defined_variants.length; i++) {
      var fnVar = cl.defined_variants[i];
      const mVs = cl.method_variants[fnVar];
      for ( let i_1 = 0; i_1 < mVs.variants.length; i_1++) {
        var variant = mVs.variants[i_1];
        wr.out(variant.compiledName + "(", false);
        await this.writeArgsDef(variant, ctx, wr);
        wr.out(") ", false);
        if ( variant.nameNode.hasFlag("optional") ) {
          wr.out("*GoNullable", false);
        } else {
          await this.writeTypeDef(variant.nameNode, ctx, wr);
        }
        wr.out("", true);
      };
    };
    wr.indent(-1);
    wr.out("}", true);
  };
  async writeClass (node, ctx, orig_wr) {
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
    let declaredFunction = {};
    let declaredIfFunction = {};
    wr.out(("type " + cl.name) + " struct { ", true);
    wr.indent(1);
    for ( let i = 0; i < cl.variables.length; i++) {
      var pvar = cl.variables[i];
      await this.writeStructField(pvar.node, ctx, wr);
      declaredVariable[pvar.name] = true;
    };
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
          await this.writeStructField(pvar_1.node, ctx, wr);
        };
      };
    }
    wr.indent(-1);
    wr.out("}", true);
    if ( cl.doesInherit() || ((cl.extends_classes.length) > 0) ) {
      wr.out(("type IFACE_" + cl.name) + " interface { ", true);
      wr.indent(1);
      for ( let i_3 = 0; i_3 < cl.variables.length; i_3++) {
        var p = cl.variables[i_3];
        wr.out("Get_", false);
        wr.out(p.compiledName + "() ", false);
        if ( p.nameNode.hasFlag("optional") ) {
          wr.out("*GoNullable", false);
        } else {
          await this.writeTypeDef(p.nameNode, ctx, wr);
        }
        wr.out("", true);
        wr.out("Set_", false);
        wr.out(p.compiledName + "(value ", false);
        if ( p.nameNode.hasFlag("optional") ) {
          wr.out("*GoNullable", false);
        } else {
          await this.writeTypeDef(p.nameNode, ctx, wr);
        }
        wr.out(") ", true);
      };
      for ( let i_4 = 0; i_4 < cl.defined_variants.length; i_4++) {
        var fnVar = cl.defined_variants[i_4];
        const mVs = cl.method_variants[fnVar];
        for ( let i_5 = 0; i_5 < mVs.variants.length; i_5++) {
          var variant = mVs.variants[i_5];
          if ( ( typeof(declaredIfFunction[variant.name] ) != "undefined" && declaredIfFunction.hasOwnProperty(variant.name) ) ) {
            continue;
          }
          declaredIfFunction[variant.name] = true;
          wr.out(variant.compiledName + "(", false);
          await this.writeArgsDef(variant, ctx, wr);
          wr.out(") ", false);
          if ( variant.nameNode.hasFlag("optional") ) {
            wr.out("*GoNullable", false);
          } else {
            await this.writeTypeDef(variant.nameNode, ctx, wr);
          }
          wr.out("", true);
        };
      };
      wr.indent(-1);
      wr.out("}", true);
    }
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
        await this.writeTypeDef(arg.nameNode, ctx, wr);
      };
    }
    wr.out((") *" + cl.name) + " {", true);
    wr.indent(1);
    wr.newline();
    wr.out(("me := new(" + cl.name) + ")", true);
    if ( (cl.extends_classes.length) > 0 ) {
      for ( let i_7 = 0; i_7 < cl.extends_classes.length; i_7++) {
        var pName_1 = cl.extends_classes[i_7];
        const pC_1 = ctx.findClass(pName_1);
        for ( let i_8 = 0; i_8 < pC_1.variables.length; i_8++) {
          var pvar_2 = pC_1.variables[i_8];
          const nn = pvar_2.node;
          if ( (nn.children.length) > 2 ) {
            const valueNode = nn.children[2];
            wr.out(("me." + pvar_2.compiledName) + " = ", false);
            await this.WalkNode(valueNode, ctx, wr);
            wr.out("", true);
          } else {
            const pNameN = pvar_2.nameNode;
            if ( pNameN.value_type == 6 ) {
              wr.out(("me." + pvar_2.compiledName) + " = ", false);
              wr.out("make(", false);
              await this.writeTypeDef(pvar_2.nameNode, ctx, wr);
              wr.out(",0)", true);
            }
            if ( pNameN.value_type == 7 ) {
              wr.out(("me." + pvar_2.compiledName) + " = ", false);
              wr.out("make(", false);
              await this.writeTypeDef(pvar_2.nameNode, ctx, wr);
              wr.out(")", true);
            }
          }
        };
        for ( let i_9 = 0; i_9 < pC_1.variables.length; i_9++) {
          var pvar_3 = pC_1.variables[i_9];
          if ( pvar_3.nameNode.hasFlag("optional") ) {
            wr.out(("me." + pvar_3.compiledName) + " = new(GoNullable);", true);
          }
        };
        if ( pC_1.has_constructor ) {
          const constr_1 = pC_1.constructor_fn;
          const subCtx = constr_1.fnCtx;
          subCtx.is_function = true;
          await this.WalkNode(constr_1.fnBody, subCtx, wr);
        }
      };
    }
    for ( let i_10 = 0; i_10 < cl.variables.length; i_10++) {
      var pvar_4 = cl.variables[i_10];
      const nn_1 = pvar_4.node;
      if ( (nn_1.children.length) > 2 ) {
        const valueNode_1 = nn_1.children[2];
        wr.out(("me." + pvar_4.compiledName) + " = ", false);
        await this.WalkNode(valueNode_1, ctx, wr);
        wr.out("", true);
      } else {
        const pNameN_1 = pvar_4.nameNode;
        if ( pNameN_1.value_type == 6 ) {
          wr.out(("me." + pvar_4.compiledName) + " = ", false);
          wr.out("make(", false);
          await this.writeTypeDef(pvar_4.nameNode, ctx, wr);
          wr.out(",0)", true);
        }
        if ( pNameN_1.value_type == 7 ) {
          wr.out(("me." + pvar_4.compiledName) + " = ", false);
          wr.out("make(", false);
          await this.writeTypeDef(pvar_4.nameNode, ctx, wr);
          wr.out(")", true);
        }
      }
    };
    for ( let i_11 = 0; i_11 < cl.variables.length; i_11++) {
      var pvar_5 = cl.variables[i_11];
      if ( pvar_5.nameNode.hasFlag("optional") ) {
        wr.out(("me." + pvar_5.compiledName) + " = new(GoNullable);", true);
      }
    };
    if ( cl.has_constructor ) {
      const constr_2 = cl.constructor_fn;
      const subCtx_1 = constr_2.fnCtx;
      subCtx_1.is_function = true;
      await this.WalkNode(constr_2.fnBody, subCtx_1, wr);
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
      await this.writeArgsDef(variant_1, ctx, wr);
      wr.out(") ", false);
      const vnn = variant_1.nameNode;
      if ( vnn.hasFlag("optional") ) {
        wr.out("*GoNullable", false);
      } else {
        await this.writeTypeDef(vnn, ctx, wr);
      }
      wr.out(" {", true);
      wr.indent(1);
      wr.newline();
      const subCtx_2 = variant_1.fnCtx;
      subCtx_2.is_function = true;
      subCtx_2.in_static_method = true;
      await this.WalkNode(variant_1.fnBody, subCtx_2, wr);
      subCtx_2.in_static_method = false;
      wr.newline();
      wr.indent(-1);
      wr.out("}", true);
    };
    let declaredFn = {};
    for ( let i_13 = 0; i_13 < cl.defined_variants.length; i_13++) {
      var fnVar_1 = cl.defined_variants[i_13];
      const mVs_1 = cl.method_variants[fnVar_1];
      for ( let i_14 = 0; i_14 < mVs_1.variants.length; i_14++) {
        var variant_2 = mVs_1.variants[i_14];
        if ( ( typeof(declaredFunction[variant_2.name] ) != "undefined" && declaredFunction.hasOwnProperty(variant_2.name) ) ) {
          continue;
        }
        declaredFunction[variant_2.name] = true;
        declaredFn[variant_2.name] = true;
        wr.out(((("func (this *" + cl.name) + ") ") + variant_2.compiledName) + " (", false);
        await this.writeArgsDef(variant_2, ctx, wr);
        wr.out(") ", false);
        if ( variant_2.nameNode.hasFlag("optional") ) {
          wr.out("*GoNullable", false);
        } else {
          await this.writeTypeDef(variant_2.nameNode, ctx, wr);
        }
        wr.out(" {", true);
        wr.indent(1);
        wr.newline();
        const subCtx_3 = variant_2.fnCtx;
        subCtx_3.is_function = true;
        await this.WalkNode(variant_2.fnBody, subCtx_3, wr);
        wr.newline();
        wr.indent(-1);
        wr.out("}", true);
      };
    };
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
            await this.writeArgsDef(variant_3, ctx, wr);
            wr.out(") ", false);
            if ( variant_3.nameNode.hasFlag("optional") ) {
              wr.out("*GoNullable", false);
            } else {
              await this.writeTypeDef(variant_3.nameNode, ctx, wr);
            }
            wr.out(" {", true);
            wr.indent(1);
            wr.newline();
            const subCtx_4 = variant_3.fnCtx;
            subCtx_4.is_function = true;
            await this.WalkNode(variant_3.fnBody, subCtx_4, wr);
            wr.newline();
            wr.indent(-1);
            wr.out("}", true);
          };
        };
      };
    }
    let declaredGetter = {};
    if ( cl.doesInherit() || ((cl.extends_classes.length) > 0) ) {
      for ( let i_18 = 0; i_18 < cl.variables.length; i_18++) {
        var p_1 = cl.variables[i_18];
        declaredGetter[p_1.name] = true;
        wr.newline();
        wr.out("// getter for variable " + p_1.name, true);
        wr.out(("func (this *" + cl.name) + ") ", false);
        wr.out("Get_", false);
        wr.out(p_1.compiledName + "() ", false);
        if ( p_1.nameNode.hasFlag("optional") ) {
          wr.out("*GoNullable", false);
        } else {
          await this.writeTypeDef(p_1.nameNode, ctx, wr);
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
          await this.writeTypeDef(p_1.nameNode, ctx, wr);
        }
        wr.out(") ", false);
        wr.out(" {", true);
        wr.indent(1);
        wr.out(("this." + p_1.compiledName) + " = value ", true);
        wr.indent(-1);
        wr.out("}", true);
      };
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
              await this.writeTypeDef(p_2.nameNode, ctx, wr);
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
              await this.writeTypeDef(p_2.nameNode, ctx, wr);
            }
            wr.out(") ", false);
            wr.out(" {", true);
            wr.indent(1);
            wr.out(("this." + p_2.compiledName) + " = value ", true);
            wr.indent(-1);
            wr.out("}", true);
          };
        };
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
        subCtx_5.in_static_method = true;
        await this.WalkNode(variant_4.fnBody, subCtx_5, wr);
        subCtx_5.in_static_method = false;
        if ( ctx.hasCompilerFlag("forever") ) {
          wr.out("for {}", true);
        }
        wr.newline();
        wr.indent(-1);
        wr.out("}", true);
      }
    };
  };
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
  };
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
      };
      ii = ii + 1;
    };
    return encoded_str_2;
  };
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
    };
  };
  async WriteVRef (node, ctx, wr) {
    if ( node.vref == "this" ) {
      wr.out("$this", false);
      return;
    }
    if ( node.eval_type == 13 ) {
      if ( (node.ns.length) > 1 ) {
        const rootObjName = node.ns[0];
        const enumName = node.ns[1];
        const e = ctx.getEnum(rootObjName);
        if ( (typeof(e) !== "undefined" && e != null )  ) {
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
            if ( (typeof(up) !== "undefined" && up != null )  ) {
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
      };
      return;
    }
    if ( node.hasParamDesc ) {
      wr.out("$", false);
      const part_2 = node.ns[0];
      if ( (part_2 != "this") && ctx.isMemberVariable(part_2) ) {
        const uc_1 = ctx.getCurrentClass();
        const currC_1 = uc_1;
        const up_1 = currC_1.findVariable(part_2);
        if ( (typeof(up_1) !== "undefined" && up_1 != null )  ) {
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
          if ( (typeof(up_2) !== "undefined" && up_2 != null )  ) {
            if ( false == ctx.isInStatic() ) {
              wr.out(this.thisName + "->", false);
            }
          }
        }
      }
      wr.out(this.adjustType(part_3), false);
    };
  };
  async writeVarInitDef (node, ctx, wr) {
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
        await this.WalkNode(value, ctx, wr);
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
  };
  async writeVarDef (node, ctx, wr) {
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
        await this.WalkNode(value, ctx, wr);
        ctx.unsetInExpr();
      } else {
        if ( nn.value_type == 6 ) {
          wr.out(" = array()", false);
        } else {
          if ( nn.value_type == 7 ) {
            wr.out(" = array()", false);
          } else {
            wr.out(" = null", false);
          }
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
  };
  async disabledVarDef (node, ctx, wr) {
    if ( node.hasParamDesc ) {
      const nn = node.children[1];
      const p = nn.paramDesc;
      wr.out("$this->" + p.compiledName, false);
      if ( (node.children.length) > 2 ) {
        wr.out(" = ", false);
        ctx.setInExpr();
        const value = node.getThird();
        await this.WalkNode(value, ctx, wr);
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
  };
  async CreateMethodCall (node, ctx, wr) {
    const obj = node.getFirst();
    const args = node.getSecond();
    ctx.setInExpr();
    await this.WalkNode(obj, ctx, wr);
    ctx.unsetInExpr();
    wr.out("(", false);
    ctx.setInExpr();
    for ( let i = 0; i < args.children.length; i++) {
      var arg = args.children[i];
      if ( i > 0 ) {
        wr.out(", ", false);
      }
      await this.WalkNode(arg, ctx, wr);
    };
    ctx.unsetInExpr();
    wr.out(")", false);
  };
  async CreatePropertyGet (node, ctx, wr) {
    const obj = node.getSecond();
    const prop = node.getThird();
    wr.out("(", false);
    ctx.setInExpr();
    await this.WalkNode(obj, ctx, wr);
    ctx.unsetInExpr();
    wr.out(")", false);
    wr.out("->", false);
    wr.out(prop.vref, false);
  };
  async CreateLambdaCall (node, ctx, wr) {
    const fName = node.children[0];
    const givenArgs = node.children[1];
    let args;
    if ( (typeof(fName.expression_value) !== "undefined" && fName.expression_value != null )  ) {
      args = fName.expression_value.children[1];
    } else {
      const param = ctx.getVariableDef(fName.vref);
      args = param.nameNode.expression_value.children[1];
    }
    ctx.setInExpr();
    wr.out("call_user_func(", false);
    await this.WalkNode(fName, ctx, wr);
    for ( let i = 0; i < args.children.length; i++) {
      var arg = args.children[i];
      const n = givenArgs.children[i];
      if ( i >= 0 ) {
        wr.out(", ", false);
      }
      if ( arg.value_type != 0 ) {
        await this.WalkNode(n, ctx, wr);
      }
    };
    ctx.unsetInExpr();
    if ( ctx.expressionLevel() == 0 ) {
      wr.out(");", true);
    } else {
      wr.out(")", false);
    }
  };
  async CreateLambda (node, ctx, wr) {
    const lambdaCtx = node.lambda_ctx;
    /** unused:  const fnNode = node.children[0]   **/ 
    const args = node.children[1];
    const body = node.children[2];
    wr.out("(function (", false);
    for ( let i = 0; i < args.children.length; i++) {
      var arg = args.children[i];
      if ( i > 0 ) {
        wr.out(", ", false);
      }
      await this.WalkNode(arg, lambdaCtx, wr);
    };
    wr.out(") ", false);
    let captCnt = 0;
    for ( let i_1 = 0; i_1 < lambdaCtx.captured_variables.length; i_1++) {
      var cname = lambdaCtx.captured_variables[i_1];
      const pp = lambdaCtx.getVariableDef(cname);
      if ( pp.set_cnt >= 0 ) {
        if ( captCnt == 0 ) {
          wr.out("use (", false);
        } else {
          wr.out(", ", false);
        }
        wr.out(" &$" + cname, false);
        captCnt = captCnt + 1;
      } else {
        if ( pp.varType == 4 ) {
          ctx.addError(node, "Mutating captured function parameter is not allowed");
        }
      }
    };
    if ( captCnt > 0 ) {
      wr.out(")", false);
    }
    wr.out(" {", true);
    wr.indent(1);
    lambdaCtx.restartExpressionLevel();
    for ( let i_2 = 0; i_2 < body.children.length; i_2++) {
      var item = body.children[i_2];
      await this.WalkNode(item, lambdaCtx, wr);
    };
    wr.newline();
    for ( let i_3 = 0; i_3 < lambdaCtx.captured_variables.length; i_3++) {
      var cname_1 = lambdaCtx.captured_variables[i_3];
      wr.out("// captured var " + cname_1, true);
    };
    wr.indent(-1);
    if ( ctx.expressionLevel() == 0 ) {
      wr.out("});", true);
    } else {
      wr.out("})", false);
    }
  };
  writeClassVarDef (node, ctx, wr) {
    if ( node.hasParamDesc ) {
      const nn = node.children[1];
      const p = nn.paramDesc;
      wr.out(("var $" + p.compiledName) + ";", true);
    }
  };
  writeArgsDef (fnDesc, ctx, wr) {
    for ( let i = 0; i < fnDesc.params.length; i++) {
      var arg = fnDesc.params[i];
      if ( i > 0 ) {
        wr.out(",", false);
      }
      wr.out((" $" + arg.compiledName) + " ", false);
    };
  };
  async writeArrayLiteral (node, ctx, wr) {
    wr.out("array(", false);
    await operatorsOf.forEach_15(node.children, (async (item, index) => { 
      if ( index > 0 ) {
        wr.out(", ", false);
      }
      await this.WalkNode(item, ctx, wr);
    }));
    wr.out(")", false);
  };
  async writeFnCall (node, ctx, wr) {
    if ( node.hasFnCall ) {
      const fc = node.getFirst();
      await this.WriteVRef(fc, ctx, wr);
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
          if ( (typeof(defVal) !== "undefined" && defVal != null )  ) {
            const fc_1 = defVal.vref_annotation.getFirst();
            await this.WalkNode(fc_1, ctx, wr);
          } else {
            ctx.addError(node, "Default argument was missing");
          }
          continue;
        }
        const n = givenArgs.children[i];
        await this.WalkNode(n, ctx, wr);
      };
      ctx.unsetInExpr();
      wr.out(")", false);
      if ( ctx.expressionLevel() == 0 ) {
        wr.out(";", true);
      }
    }
  };
  async writeNewCall (node, ctx, wr) {
    if ( node.hasNewOper ) {
      const cl = node.clDesc;
      /** unused:  const fc = node.getSecond()   **/ 
      wr.out(" new ", false);
      wr.out(node.clDesc.name, false);
      wr.out("(", false);
      const constr = cl.constructor_fn;
      const givenArgs = node.getThird();
      if ( (typeof(constr) !== "undefined" && constr != null )  ) {
        for ( let i = 0; i < constr.params.length; i++) {
          var arg = constr.params[i];
          const n = givenArgs.children[i];
          if ( i > 0 ) {
            wr.out(", ", false);
          }
          if ( true || ((typeof(arg.nameNode) !== "undefined" && arg.nameNode != null ) ) ) {
            await this.WalkNode(n, ctx, wr);
          }
        };
      }
      wr.out(")", false);
    }
  };
  async CreateCallExpression (node, ctx, wr) {
    if ( node.has_call ) {
      const obj = node.getSecond();
      const method = node.getThird();
      const args = node.children[3];
      wr.out("", false);
      ctx.setInExpr();
      if ( ctx.hasCompilerFlag("php54") ) {
        wr.out(("call_user_method(\"" + method.vref) + "\",", false);
        await this.WalkNode(obj, ctx, wr);
      } else {
        wr.out("(", false);
        await this.WalkNode(obj, ctx, wr);
        wr.out(")", false);
        ctx.unsetInExpr();
        wr.out("->", false);
        wr.out(method.vref, false);
        wr.out("(", false);
        ctx.setInExpr();
      }
      for ( let i = 0; i < args.children.length; i++) {
        var arg = args.children[i];
        if ( i > 0 ) {
          wr.out(", ", false);
        }
        await this.WalkNode(arg, ctx, wr);
      };
      ctx.unsetInExpr();
      wr.out(")", false);
      if ( ctx.expressionLevel() == 0 ) {
        wr.out(";", true);
      }
    }
  };
  async writeClass (node, ctx, orig_wr) {
    const cl = node.clDesc;
    if ( typeof(cl) === "undefined" ) {
      return;
    }
    let declaredFunction = {};
    const wr = orig_wr;
    /** unused:  const importFork = wr.fork()   **/ 
    for ( let i = 0; i < cl.capturedLocals.length; i++) {
      var dd = cl.capturedLocals[i];
      if ( dd.is_class_variable == false ) {
        if ( dd.set_cnt > 0 ) {
        }
      }
    };
    if ( this.wrote_header == false ) {
      wr.out("<?php ", true);
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
      };
    }
    wr.out(" { ", true);
    wr.indent(1);
    for ( let i_2 = 0; i_2 < cl.variables.length; i_2++) {
      var pvar = cl.variables[i_2];
      this.writeClassVarDef(pvar.node, ctx, wr);
    };
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
      await this.writeVarInitDef(pvar_1.node, ctx, wr);
    };
    if ( cl.has_constructor ) {
      const constr_1 = cl.constructor_fn;
      wr.newline();
      const subCtx = constr_1.fnCtx;
      subCtx.is_function = true;
      await this.WalkNode(constr_1.fnBody, subCtx, wr);
    }
    wr.newline();
    wr.indent(-1);
    wr.out("}", true);
    for ( let i_4 = 0; i_4 < cl.static_methods.length; i_4++) {
      var variant = cl.static_methods[i_4];
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
      await this.WalkNode(variant.fnBody, subCtx_1, wr);
      subCtx_1.in_static_method = false;
      wr.newline();
      wr.indent(-1);
      wr.out("}", true);
    };
    for ( let i_5 = 0; i_5 < cl.defined_variants.length; i_5++) {
      var fnVar = cl.defined_variants[i_5];
      const mVs = cl.method_variants[fnVar];
      for ( let i_6 = 0; i_6 < mVs.variants.length; i_6++) {
        var variant_1 = mVs.variants[i_6];
        if ( ( typeof(declaredFunction[variant_1.name] ) != "undefined" && declaredFunction.hasOwnProperty(variant_1.name) ) ) {
          continue;
        }
        declaredFunction[variant_1.name] = true;
        wr.out(("function " + variant_1.compiledName) + "(", false);
        this.writeArgsDef(variant_1, ctx, wr);
        wr.out(") {", true);
        wr.indent(1);
        wr.newline();
        const subCtx_2 = variant_1.fnCtx;
        subCtx_2.is_function = true;
        subCtx_2.in_static_method = false;
        await this.WalkNode(variant_1.fnBody, subCtx_2, wr);
        wr.newline();
        wr.indent(-1);
        wr.out("}", true);
      };
    };
    wr.indent(-1);
    wr.out("}", true);
    for ( let i_7 = 0; i_7 < cl.static_methods.length; i_7++) {
      var variant_2 = cl.static_methods[i_7];
      ctx.disableCurrentClass();
      ctx.in_static_method = true;
      if ( variant_2.nameNode.hasFlag("main") && (variant_2.nameNode.code.filename == ctx.getRootFile()) ) {
        wr.out("/* static PHP main routine */", false);
        wr.newline();
        await this.WalkNode(variant_2.fnBody, ctx, wr);
        wr.newline();
      }
      ctx.in_static_method = false;
    };
  };
}
class WebPageWriter  {
  constructor() {
  }
  async CreatePage (parser, node, ctx, orig_wr) {
    const sc = node.getSecond();
    const wr = orig_wr;
    wr.out("// created by WebPageWriter ", true);
    wr.out(sc.vref + " () {", true);
    wr.indent(1);
    wr.out(("var view = document.getElementById('" + sc.vref) + "');", true);
    const fnBody = node.children[2];
    const subCtx = ctx.fork();
    subCtx.is_function = true;
    subCtx.in_static_method = true;
    subCtx.setInMethod();
    await parser.WalkNodeChildren(fnBody, subCtx, wr);
    subCtx.unsetInMethod();
    subCtx.in_static_method = false;
    subCtx.function_level_context = true;
    await this.classWriter.WalkNode(fnBody, subCtx, wr);
    wr.out("return view;", true);
    wr.indent(-1);
    wr.out("}", true);
  };
}
class RangerJavaScriptClassWriter  extends RangerGenericClassWriter {
  constructor() {
    super()
    this.thisName = "this";     /** note: unused */
    this.wrote_header = false;
    this.target_flow = false;
    this.target_typescript = false;
  }
  lineEnding () {
    return ";";
  };
  adjustType (tn) {
    if ( tn == "this" ) {
      return "this";
    }
    return tn;
  };
  async CreateTsUnions (parser, ctx, wr) {
    const root = ctx.getRoot();
    await operatorsOf_13.forEach_14(root.definedClasses, (async (item, index) => { 
      if ( item.is_union ) {
        wr.out(("type union_" + index) + " = ", false);
        wr.indent(1);
        let cnt = 0;
        await operatorsOf.forEach_12(item.is_union_of, ((item, index) => { 
          if ( ctx.isDefinedClass(item) ) {
            const cl = ctx.findClass(item);
            if ( false == cl.isNormalClass() ) {
              return;
            }
            if ( cnt > 0 ) {
              wr.out("|", false);
            }
            wr.out(this.getObjectTypeString(item, ctx), false);
            cnt = cnt + 1;
          } else {
            if ( cnt > 0 ) {
              wr.out("|", false);
            }
            wr.out(this.getObjectTypeString(item, ctx), false);
            cnt = cnt + 1;
          }
        }));
        wr.indent(-1);
        wr.out(";", true);
      }
    }));
  };
  async writeFnCall (node, ctx, wr) {
    if ( node.hasFnCall ) {
      const fc = node.getFirst();
      if ( ((typeof(node.fnDesc) !== "undefined" && node.fnDesc != null ) ) && ((typeof(node.fnDesc.nameNode) !== "undefined" && node.fnDesc.nameNode != null ) ) ) {
        const fnName = node.fnDesc.nameNode;
        if ( fnName.hasFlag("async") ) {
          wr.out("await ", false);
        }
      }
      await this.WriteVRef(fc, ctx, wr);
      wr.out("(", false);
      const givenArgs = node.getSecond();
      ctx.setInExpr();
      let cnt = 0;
      for ( let i = 0; i < node.fnDesc.params.length; i++) {
        var arg = node.fnDesc.params[i];
        if ( arg.nameNode.hasFlag("keyword") ) {
          continue;
        }
        if ( cnt > 0 ) {
          wr.out(", ", false);
        }
        cnt = cnt + 1;
        if ( (givenArgs.children.length) <= i ) {
          const defVal = arg.nameNode.getFlag("default");
          if ( (typeof(defVal) !== "undefined" && defVal != null )  ) {
            const fc_1 = defVal.vref_annotation.getFirst();
            await this.WalkNode(fc_1, ctx, wr);
          } else {
            ctx.addError(node, "Default argument was missing");
          }
          continue;
        }
        const n = givenArgs.children[i];
        await this.WalkNode(n, ctx, wr);
      };
      ctx.unsetInExpr();
      wr.out(")", false);
      if ( (node.methodChain.length) > 0 ) {
        for ( let i_1 = 0; i_1 < node.methodChain.length; i_1++) {
          var cc = node.methodChain[i_1];
          wr.out("." + cc.methodName, false);
          wr.out("(", false);
          ctx.setInExpr();
          for ( let i_2 = 0; i_2 < cc.args.children.length; i_2++) {
            var arg_1 = cc.args.children[i_2];
            if ( i_2 > 0 ) {
              wr.out(", ", false);
            }
            await this.WalkNode(arg_1, ctx, wr);
          };
          ctx.unsetInExpr();
          wr.out(")", false);
        };
      }
      if ( ctx.expressionLevel() == 0 ) {
        wr.out(";", true);
      }
    }
  };
  async CreateCallExpression (node, ctx, wr) {
    if ( node.has_call ) {
      const obj = node.getSecond();
      const method = node.getThird();
      const args = node.children[3];
      if ( ((typeof(node.fnDesc) !== "undefined" && node.fnDesc != null ) ) && ((typeof(node.fnDesc.nameNode) !== "undefined" && node.fnDesc.nameNode != null ) ) ) {
        const fnName = node.fnDesc.nameNode;
        if ( fnName.hasFlag("async") ) {
          wr.out("await ", false);
        }
      }
      wr.out("(", false);
      ctx.setInExpr();
      await this.WalkNode(obj, ctx, wr);
      ctx.unsetInExpr();
      wr.out(").", false);
      wr.out(method.vref, false);
      wr.out("(", false);
      ctx.setInExpr();
      for ( let i = 0; i < args.children.length; i++) {
        var arg = args.children[i];
        if ( i > 0 ) {
          wr.out(", ", false);
        }
        await this.WalkNode(arg, ctx, wr);
      };
      ctx.unsetInExpr();
      wr.out(")", false);
      if ( ctx.expressionLevel() == 0 ) {
        wr.out(";", true);
      }
    }
  };
  getObjectTypeString (type_string, ctx) {
    switch (type_string ) { 
      case "int" : 
        return "number";
      case "string" : 
        return "string";
      case "charbuffer" : 
        return "string";
      case "char" : 
        return "number";
      case "boolean" : 
        return "boolean";
      case "double" : 
        return "number";
    };
    if ( ctx.isDefinedClass(type_string) ) {
      const cc = ctx.findClass(type_string);
      if ( cc.is_system ) {
        /** unused:  const current_sys = ctx   **/ 
        const sName = (cc.systemNames["es6"]);
        return sName;
      }
      if ( cc.is_union ) {
        return "union_" + cc.name;
      }
    }
    return type_string;
  };
  getTypeString (type_string) {
    switch (type_string ) { 
      case "int" : 
        return "number";
      case "string" : 
        return "string";
      case "charbuffer" : 
        return "string";
      case "char" : 
        return "number";
      case "boolean" : 
        return "boolean";
      case "double" : 
        return "number";
    };
    return type_string;
  };
  async writeTypeDef (node, ctx, wr) {
    let v_type = node.value_type;
    let t_name = node.type_name;
    let a_name = node.array_type;
    let k_name = node.key_type;
    if ( ((v_type == 10) || (v_type == 11)) || (v_type == 0) ) {
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
      case 17 : 
        const rv = node.expression_value.children[0];
        const sec = node.expression_value.children[1];
        /** unused:  const fc = sec.getFirst()   **/ 
        wr.out("(", false);
        for ( let i = 0; i < sec.children.length; i++) {
          var arg = sec.children[i];
          if ( i > 0 ) {
            wr.out(", ", false);
          }
          await this.WalkNode(arg, ctx, wr);
          wr.out(":", false);
          await this.writeTypeDef(arg, ctx, wr);
        };
        wr.out(") => ", false);
        await this.writeTypeDef(rv, ctx, wr);
        break;
      case 13 : 
        wr.out("number", false);
        break;
      case 3 : 
        wr.out("number", false);
        break;
      case 14 : 
        wr.out("number", false);
        break;
      case 15 : 
        wr.out("string", false);
        break;
      case 2 : 
        wr.out("number", false);
        break;
      case 4 : 
        wr.out("string", false);
        break;
      case 5 : 
        wr.out("boolean", false);
        break;
      case 7 : 
        wr.out(((("{[key:" + this.getObjectTypeString(k_name, ctx)) + "]:") + this.getObjectTypeString(a_name, ctx)) + "}", false);
        break;
      case 6 : 
        wr.out(("Array<" + this.getObjectTypeString(a_name, ctx)) + ">", false);
        break;
      default: 
        if ( node.type_name == "void" ) {
          wr.out("void", false);
          return;
        }
        if ( ctx.isDefinedClass(t_name) ) {
          const cc = ctx.findClass(t_name);
          if ( cc.is_system ) {
            /** unused:  const current_sys = ctx   **/ 
            const sName = (cc.systemNames["es6"]);
            wr.out(sName, false);
            return;
          }
          if ( cc.is_union ) {
            wr.out("union_", false);
            wr.out(t_name, false);
            return;
          }
          const cc_1 = ctx.findClass(t_name);
          wr.out(cc_1.name, false);
          return;
        }
        wr.out(this.getTypeString(t_name), false);
        break;
    };
  };
  async WriteVRef (node, ctx, wr) {
    if ( node.eval_type == 13 ) {
      if ( (node.ns.length) > 1 ) {
        const rootObjName = node.ns[0];
        const enumName = node.ns[1];
        const e = ctx.getEnum(rootObjName);
        if ( (typeof(e) !== "undefined" && e != null )  ) {
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
            if ( (typeof(up) !== "undefined" && up != null )  ) {
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
      };
      return;
    }
    if ( node.hasParamDesc ) {
      const part_1 = node.ns[0];
      if ( (part_1 != "this") && ctx.isMemberVariable(part_1) ) {
        const uc_1 = ctx.getCurrentClass();
        const currC_1 = uc_1;
        const up_1 = currC_1.findVariable(part_1);
        if ( (typeof(up_1) !== "undefined" && up_1 != null )  ) {
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
          if ( (typeof(up_2) !== "undefined" && up_2 != null )  ) {
            wr.out("this.", false);
          }
        }
      }
      wr.out(this.adjustType(part_2), false);
    };
  };
  async writeVarInitDef (node, ctx, wr) {
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
        await this.WalkNode(value, ctx, wr);
        ctx.unsetInExpr();
        was_set = true;
      } else {
        if ( nn.value_type == 6 ) {
          wr.out("this." + p.compiledName, false);
          if ( nn.hasFlag("immutable") ) {
            wr.out(" = require('immutable').List()", false);
          } else {
            wr.out(" = []", false);
          }
          was_set = true;
        }
        if ( nn.value_type == 7 ) {
          wr.out("this." + p.compiledName, false);
          if ( nn.hasFlag("immutable") ) {
            wr.out(" = require('immutable').Map()", false);
          } else {
            wr.out(" = {}", false);
          }
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
  };
  async writeVarDef (node, ctx, wr) {
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
      if ( this.target_typescript ) {
        wr.out(" : ", false);
        await this.writeTypeDef(p.nameNode, ctx, wr);
        wr.out(" ", false);
      }
      if ( (node.children.length) > 2 ) {
        wr.out(" = ", false);
        ctx.setInExpr();
        const value = node.getThird();
        await this.WalkNode(value, ctx, wr);
        ctx.unsetInExpr();
      } else {
        if ( nn.value_type == 6 ) {
          if ( nn.hasFlag("immutable") ) {
            wr.out(" = require('immutable').List()", false);
          } else {
            wr.out(" = []", false);
          }
        }
        if ( nn.value_type == 7 ) {
          if ( nn.hasFlag("immutable") ) {
            wr.out(" = require('immutable').Map()", false);
          } else {
            wr.out(" = {}", false);
          }
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
  };
  async writeClassVarDef (p, ctx, wr) {
    if ( this.target_typescript ) {
      wr.out(p.compiledName, false);
      wr.out(": ", false);
      await this.writeTypeDef(p.nameNode, ctx, wr);
      wr.out(";", true);
    }
  };
  async CreateLambdaCall (node, ctx, wr) {
    const fName = node.children[0];
    const args = node.children[1];
    ctx.setInExpr();
    const currM = ctx.getCurrentMethod();
    if ( ((typeof(currM.nameNode) !== "undefined" && currM.nameNode != null ) ) && currM.nameNode.hasFlag("async") ) {
      wr.out("await ", false);
    }
    await this.WalkNode(fName, ctx, wr);
    wr.out("(", false);
    for ( let i = 0; i < args.children.length; i++) {
      var arg = args.children[i];
      if ( i > 0 ) {
        wr.out(", ", false);
      }
      await this.WalkNode(arg, ctx, wr);
    };
    wr.out(")", false);
    ctx.unsetInExpr();
    if ( ctx.expressionLevel() == 0 ) {
      wr.out(";", true);
    }
  };
  async CreateLambda (node, ctx, wr) {
    const lambdaCtx = node.lambda_ctx;
    const fName = node.children[0];
    const args = node.children[1];
    const body = node.children[2];
    if ( ctx.expressionLevel() > 0 ) {
      wr.out("(", false);
    }
    if ( fName.hasFlag("async") ) {
      wr.out("async ", false);
    }
    wr.out("(", false);
    for ( let i = 0; i < args.children.length; i++) {
      var arg = args.children[i];
      if ( i > 0 ) {
        wr.out(", ", false);
      }
      if ( arg.flow_done == false ) {
        await this.compiler.parser.WalkNode(arg, lambdaCtx, wr);
      }
      await this.WalkNode(arg, lambdaCtx, wr);
      if ( this.target_typescript ) {
        wr.out(" : ", false);
        await this.writeTypeDef(arg, ctx, wr);
      }
    };
    wr.out(")", false);
    if ( this.target_typescript ) {
      wr.out(":", false);
      await this.writeTypeDef(fName, ctx, wr);
    }
    wr.out(" => { ", true);
    wr.indent(1);
    lambdaCtx.restartExpressionLevel();
    for ( let i_1 = 0; i_1 < body.children.length; i_1++) {
      var item = body.children[i_1];
      await this.WalkNode(item, lambdaCtx, wr);
    };
    wr.newline();
    wr.indent(-1);
    wr.out("}", false);
    if ( ctx.expressionLevel() > 0 ) {
      wr.out(")", false);
    } else {
      wr.out("", true);
    }
  };
  async writeArgsDef (fnDesc, ctx, wr) {
    let cnt = 0;
    const pms = operatorsOf.filter_50(fnDesc.params, ((item, index) => { 
      if ( item.nameNode.hasFlag("keyword") ) {
        return false;
      }
      return true;
    }));
    for ( let i = 0; i < pms.length; i++) {
      var arg = pms[i];
      if ( cnt > 0 ) {
        wr.out(", ", false);
      }
      cnt = cnt + 1;
      wr.out(arg.compiledName, false);
      if ( this.target_typescript ) {
        wr.out(" : ", false);
        await this.writeTypeDef(arg.nameNode, ctx, wr);
      }
    };
  };
  async writeClass (node, ctx, orig_wr) {
    const cl = node.clDesc;
    let is_react_native = false;
    let is_rn_default = false;
    if ( ctx.hasCompilerFlag("dead4main") || ctx.hasCompilerSetting("dceclass") ) {
      if ( cl.is_used_by_main == false ) {
        return;
      }
    }
    if ( cl.is_interface ) {
      orig_wr.out("// interface : " + cl.name, true);
      return;
    }
    if ( typeof(cl) === "undefined" ) {
      return;
    }
    if ( cl.nameNode.hasFlag("ReactNative") ) {
      is_react_native = true;
      this.compFlags["ReactNative"] = true;
    }
    if ( cl.nameNode.hasFlag("default") ) {
      is_rn_default = true;
    }
    const wr = orig_wr;
    /** unused:  const importFork = wr.fork()   **/ 
    if ( this.wrote_header == false ) {
      this.wrote_header = true;
      if ( ctx.hasCompilerFlag("nodecli") ) {
        wr.out("#!/usr/bin/env node", true);
      }
      if ( ctx.hasCompilerFlag("nodemodule") ) {
        const root = ctx.getRoot();
        await operatorsOf_13.forEach_14(root.definedClasses, ((item, index) => { 
          if ( ctx.hasCompilerFlag("dead4main") || ctx.hasCompilerSetting("dceclass") ) {
            if ( item.is_used_by_main == false ) {
              return;
            }
          }
          if ( item.isNormalClass() ) {
            const theEnd = wr.getTag("file_end");
            theEnd.out(((("module.exports." + item.name) + " = ") + item.name) + ";", true);
          }
        }));
      }
      this.target_flow = ctx.hasCompilerFlag("flow");
      this.target_typescript = ctx.hasCompilerFlag("typescript");
      if ( this.target_typescript ) {
        await this.CreateTsUnions(this.compiler.parser, ctx, wr);
      }
      if ( ctx.hasCompilerFlag("npm") ) {
        await this.writeNpmPackage(node, ctx, wr);
      }
    }
    let b_extd = false;
    if ( is_react_native ) {
      wr.out("export ", false);
      if ( is_rn_default ) {
        wr.out(" default ", false);
      }
    }
    wr.out(("class " + cl.name) + " ", false);
    if ( is_react_native ) {
      wr.out(" extends Component ", false);
    } else {
      for ( let i = 0; i < cl.extends_classes.length; i++) {
        var pName = cl.extends_classes[i];
        if ( i == 0 ) {
          wr.out(" extends ", false);
        }
        wr.out(pName, false);
        b_extd = true;
      };
    }
    wr.out(" {", true);
    wr.indent(1);
    for ( let i_1 = 0; i_1 < cl.variables.length; i_1++) {
      var pvar = cl.variables[i_1];
      await this.writeClassVarDef(pvar, ctx, wr);
    };
    if ( is_react_native == false ) {
      wr.out("constructor(", false);
      if ( cl.has_constructor ) {
        const constr = cl.constructor_fn;
        await this.writeArgsDef(constr, ctx, wr);
      }
      wr.out(") {", true);
      wr.indent(1);
      if ( b_extd ) {
        wr.out("super()", true);
      }
      for ( let i_2 = 0; i_2 < cl.variables.length; i_2++) {
        var pvar_1 = cl.variables[i_2];
        await this.writeVarInitDef(pvar_1.node, ctx, wr);
      };
      if ( cl.has_constructor ) {
        const constr_1 = cl.constructor_fn;
        wr.newline();
        const subCtx = constr_1.fnCtx;
        subCtx.is_function = true;
        await this.WalkNode(constr_1.fnBody, subCtx, wr);
      }
      wr.newline();
      wr.indent(-1);
      wr.out("}", true);
    }
    for ( let i_3 = 0; i_3 < cl.defined_variants.length; i_3++) {
      var fnVar = cl.defined_variants[i_3];
      const mVs = cl.method_variants[fnVar];
      for ( let i_4 = 0; i_4 < mVs.variants.length; i_4++) {
        var variant = mVs.variants[i_4];
        if ( variant.nameNode.hasFlag("async") ) {
          wr.out("async ", false);
        }
        wr.out(("" + variant.compiledName) + " (", false);
        await this.writeArgsDef(variant, ctx, wr);
        wr.out(")", false);
        if ( this.target_typescript ) {
          wr.out(" : ", false);
          await this.writeTypeDef(variant.nameNode, ctx, wr);
          wr.out(" ", false);
        }
        wr.out(" {", true);
        wr.indent(1);
        wr.newline();
        const subCtx_1 = variant.fnCtx;
        subCtx_1.is_function = true;
        await operatorsOf_13.forEach_20(subCtx_1.localVariables, ((item, index) => { 
          if ( item.is_register ) {
            wr.out("// register " + item.name, true);
          }
        }));
        await this.WalkNode(variant.fnBody, subCtx_1, wr);
        wr.newline();
        wr.indent(-1);
        wr.out("};", true);
      };
    };
    if ( this.target_typescript ) {
      for ( let i_5 = 0; i_5 < cl.static_methods.length; i_5++) {
        var variant_1 = cl.static_methods[i_5];
        if ( variant_1.nameNode.hasFlag("main") ) {
          continue;
        }
        wr.out("static ", false);
        wr.out(("" + variant_1.compiledName) + " (", false);
        await this.writeArgsDef(variant_1, ctx, wr);
        wr.out(")", false);
        wr.out(" : ", false);
        await this.writeTypeDef(variant_1.nameNode, ctx, wr);
        wr.out(" ", false);
        wr.out(" {", true);
        wr.indent(1);
        wr.newline();
        const subCtx_2 = variant_1.fnCtx;
        subCtx_2.is_function = true;
        await this.WalkNode(variant_1.fnBody, subCtx_2, wr);
        wr.newline();
        wr.indent(-1);
        wr.out("};", true);
      };
    }
    wr.indent(-1);
    wr.out("}", true);
    if ( this.target_typescript == false ) {
      for ( let i_6 = 0; i_6 < cl.static_methods.length; i_6++) {
        var variant_2 = cl.static_methods[i_6];
        if ( variant_2.nameNode.hasFlag("main") ) {
          continue;
        } else {
          let asyncKeyword = "";
          if ( variant_2.nameNode.hasFlag("async") ) {
            asyncKeyword = "async ";
          }
          wr.out(((((cl.name + ".") + variant_2.compiledName) + " = ") + asyncKeyword) + "function(", false);
          await this.writeArgsDef(variant_2, ctx, wr);
          wr.out(") {", true);
        }
        wr.indent(1);
        wr.newline();
        const subCtx_3 = variant_2.fnCtx;
        subCtx_3.is_function = true;
        await this.WalkNode(variant_2.fnBody, subCtx_3, wr);
        wr.newline();
        wr.indent(-1);
        wr.out("};", true);
      };
    }
    if ( ctx.hasCompilerFlag("nodemodule") == false ) {
      for ( let i_7 = 0; i_7 < cl.static_methods.length; i_7++) {
        var variant_3 = cl.static_methods[i_7];
        ctx.disableCurrentClass();
        if ( variant_3.nameNode.hasFlag("main") && (variant_3.nameNode.code.filename == ctx.getRootFile()) ) {
          let asyncKeyword_1 = "";
          if ( variant_3.nameNode.hasFlag("async") ) {
            asyncKeyword_1 = "async ";
          }
          const theEnd_1 = wr.getTag("file_end");
          theEnd_1.out("/* static JavaSript main routine at the end of the JS file */", false);
          theEnd_1.newline();
          theEnd_1.out(asyncKeyword_1 + "function __js_main() {", true);
          theEnd_1.indent(1);
          await this.WalkNode(variant_3.fnBody, ctx, theEnd_1);
          theEnd_1.newline();
          theEnd_1.indent(-1);
          theEnd_1.out("}", true);
          theEnd_1.out("__js_main();", true);
        }
      };
    }
  };
  BuildAST (code_string) {
    const lang_code = new SourceCode(code_string);
    lang_code.filename = "services";
    const lang_parser = new RangerLispParser(lang_code);
    lang_parser.parse(false);
    const node = lang_parser.rootNode;
    return node;
  };
  async CreateServices (parser, ctx, orig_wr) {
    if ( ctx.hasCompilerFlag("client") ) {
      ctx.addError(CodeNode.blockNode(), "client service writing for target JavaScript is not implemented");
      return;
    }
    const root = ctx.getRoot();
    const serviceBlock = CodeNode.blockNode();
    const wr = new CodeWriter();
    wr.out("class test_webservice {", true);
    wr.indent(1);
    wr.out("fn run () {", true);
    wr.indent(1);
    wr.out("def www (create_web_server)", true);
    wr.out("prepare_server www", true);
    await operatorsOf_13.forEach_25(root.appServices, ((item, index) => { 
      try {
        const paramList = item.getThird();
        const param = paramList.getFirst();
        wr.out(("www.post_route(\"/" + item.appGUID) + "\" {", true);
        wr.indent(1);
        wr.out(("def obj (" + param.type_name) + ".fromDictionary( (from_string (get_post_data req ))) )", true);
        wr.out("def service (new appServices)", true);
        wr.out(("def data (service." + item.appGUID) + "(obj))", true);
        wr.out("res.send((to_string (data.toDictionary())))", true);
        wr.indent(-1);
        wr.out("})", true);
        const nn = item.getSecond();
        nn.vref = item.appGUID;
        const params = item.getThird();
        let block_index = 3;
        const ch_len = (item.children.length) - 1;
        for ( let i = 0; i < item.children.length; i++) {
          var cb = item.children[i];
          if ( i > 3 ) {
            if ( (cb.vref.length) > 0 ) {
              if ( ctx.hasCompilerFlag(cb.vref) && (i < ch_len) ) {
                block_index = i + 1;
              }
            }
          }
        };
        const codeBlock = item.getChild(block_index);
        serviceBlock.children.push(CodeNode.op3("fn", [nn, params, codeBlock]));
      } catch(e) {
        ctx.addError(item, "Invalid service function");
      }
    }));
    wr.indent(-1);
    wr.out("www.startServer( 1777, {", true);
    wr.indent(1);
    wr.out("print \"Server started\"", true);
    wr.indent(-1);
    wr.out("}", true);
    wr.out("}", true);
    wr.indent(-1);
    wr.out("}", true);
    const codeNode = this.BuildAST(wr.getCode());
    const serviceClassDef = CodeNode.op3("class", [CodeNode.vref1("appServices"), serviceBlock]);
    /** unused:  const subCtx = root.fork()   **/ 
    const theEnd = orig_wr.getTag("file_end");
    await parser.WalkCollectMethods(serviceClassDef, root, theEnd);
    await parser.WalkCollectMethods(codeNode, root, theEnd);
    await parser.WalkNode(serviceClassDef, root, theEnd);
    await parser.WalkNode(codeNode, root, theEnd);
    theEnd.out("(new test_webservice).run();", true);
  };
  async CreatePages (parser, ctx, orig_wr) {
    const wr = orig_wr.getFileWriter(".", "pages.js");
    wr.out("class theApplicationClass {", true);
    wr.indent(1);
    await operatorsOf_13.forEach_25(ctx.appPages, (async (item, index) => { 
      await this.CreatePage(parser, item, ctx, wr);
    }));
    wr.indent(-1);
    wr.out("}", true);
  };
  async CreatePage (parser, node, ctx, orig_wr) {
    const writer = new WebPageWriter();
    writer.classWriter = this;
    await writer.CreatePage(parser, node, ctx, orig_wr);
  };
  async writeNpmPackage (node, ctx, orig_wr) {
    const wr = orig_wr.getFileWriter(".", "package.json");
    const opts = ["name", "version", "description", "author", "license"];
    wr.out("{", true);
    wr.indent(1);
    await operatorsOf.forEach_12(opts, ((item, index) => { 
      if ( ctx.hasCompilerSetting(item) == false ) {
        ctx.addError(node, ("NPM package requires option -" + item) + "=<value>");
      } else {
        wr.out(((("\"" + item) + "\" : \"") + ctx.getCompilerSetting(item)) + "\",", true);
      }
    }));
    const target_file = ctx.getCompilerSetting("o");
    if ( ctx.hasCompilerFlag("nodecli") ) {
      wr.out(((("\"bin\": {\"" + ctx.getCompilerSetting("name")) + "\":\"") + target_file) + "\"},", true);
    }
    wr.out("\"scripts\":{},", true);
    wr.out(("\"main\":\"" + target_file) + "\"", true);
    wr.indent(-1);
    wr.out("}", true);
  };
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
  };
  getObjectTypeString (type_string, ctx) {
    return type_string;
  };
  getTypeString (type_string) {
    return type_string;
  };
  async writeArrayLiteral (node, ctx, wr) {
    wr.out("([] ", false);
    await operatorsOf.forEach_15(node.children, (async (item, index) => { 
      if ( index > 0 ) {
        wr.out(" ", false);
      }
      await this.WalkNode(item, ctx, wr);
    }));
    wr.out(")", false);
  };
  async writeTypeDef (node, ctx, wr) {
    let v_type = node.value_type;
    let t_name = node.type_name;
    let a_name = node.array_type;
    let k_name = node.key_type;
    if ( ((v_type == 10) || (v_type == 11)) || (v_type == 0) ) {
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
  };
  async WriteVRef (node, ctx, wr) {
    wr.out(node.vref, false);
  };
  WriteVRefWithOpt (node, ctx, wr) {
    wr.out(node.vref, false);
    const flags = ["optional", "weak", "strong", "temp", "lives", "returns", "returnvalue"];
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
    };
    if ( some_set ) {
      wr.out(")", false);
    }
  };
  async writeVarDef (node, ctx, wr) {
    if ( node.hasParamDesc ) {
      const nn = node.children[1];
      const p = nn.paramDesc;
      wr.out("def ", false);
      this.WriteVRefWithOpt(nn, ctx, wr);
      wr.out(":", false);
      await this.writeTypeDef(p.nameNode, ctx, wr);
      if ( (node.children.length) > 2 ) {
        wr.out(" ", false);
        ctx.setInExpr();
        const value = node.getThird();
        await this.WalkNode(value, ctx, wr);
        ctx.unsetInExpr();
      }
      wr.newline();
    }
  };
  async CreateLambdaCall (node, ctx, wr) {
    const fName = node.children[0];
    const args = node.children[1];
    await this.WriteVRef(fName, ctx, wr);
    wr.out("(", false);
    for ( let i = 0; i < args.children.length; i++) {
      var arg = args.children[i];
      if ( i > 0 ) {
        wr.out(" ", false);
      }
      await this.WalkNode(arg, ctx, wr);
    };
    wr.out(")", false);
    if ( ctx.expressionLevel() == 0 ) {
      wr.out(" ", true);
    }
  };
  async CreateLambda (node, ctx, wr) {
    const lambdaCtx = node.lambda_ctx;
    const nn = node.children[0];
    const args = node.children[1];
    const body = node.children[2];
    wr.out("(fn:", false);
    await this.writeTypeDef(nn, ctx, wr);
    wr.out(" (", false);
    for ( let i = 0; i < args.children.length; i++) {
      var arg = args.children[i];
      if ( i > 0 ) {
        wr.out(" ", false);
      }
      this.WriteVRefWithOpt(arg, ctx, wr);
      wr.out(":", false);
      await this.writeTypeDef(arg, ctx, wr);
    };
    wr.out(")", false);
    wr.out(" { ", true);
    wr.indent(1);
    lambdaCtx.restartExpressionLevel();
    const newLambdaCtx = lambdaCtx.fork();
    newLambdaCtx.targetLangName = "ranger";
    for ( let i_1 = 0; i_1 < body.children.length; i_1++) {
      var item = body.children[i_1];
      await this.WalkNode(item, newLambdaCtx, wr);
    };
    wr.newline();
    wr.indent(-1);
    wr.out("})", true);
  };
  async writeFnCall (node, ctx, wr) {
    if ( node.hasFnCall ) {
      if ( ctx.expressionLevel() > 0 ) {
        wr.out("(", false);
      }
      const fc = node.getFirst();
      await this.WriteVRef(fc, ctx, wr);
      wr.out("(", false);
      const givenArgs = node.getSecond();
      ctx.setInExpr();
      for ( let i = 0; i < node.fnDesc.params.length; i++) {
        var arg = node.fnDesc.params[i];
        if ( i > 0 ) {
          wr.out(" ", false);
        }
        if ( (givenArgs.children.length) <= i ) {
          const defVal = arg.nameNode.getFlag("default");
          if ( (typeof(defVal) !== "undefined" && defVal != null )  ) {
            const fc_1 = defVal.vref_annotation.getFirst();
            await this.WalkNode(fc_1, ctx, wr);
          } else {
            ctx.addError(node, "Default argument was missing");
          }
          continue;
        }
        const n = givenArgs.children[i];
        await this.WalkNode(n, ctx, wr);
      };
      ctx.unsetInExpr();
      wr.out(")", false);
      if ( ctx.expressionLevel() > 0 ) {
        wr.out(")", false);
      }
      if ( ctx.expressionLevel() == 0 ) {
        wr.newline();
      }
    }
  };
  async writeNewCall (node, ctx, wr) {
    if ( node.hasNewOper ) {
      const cl = node.clDesc;
      /** unused:  const fc = node.getSecond()   **/ 
      wr.out("(new " + node.clDesc.name, false);
      wr.out("(", false);
      const constr = cl.constructor_fn;
      const givenArgs = node.getThird();
      if ( (typeof(constr) !== "undefined" && constr != null )  ) {
        for ( let i = 0; i < constr.params.length; i++) {
          var arg = constr.params[i];
          const n = givenArgs.children[i];
          if ( i > 0 ) {
            wr.out(" ", false);
          }
          if ( true || ((typeof(arg.nameNode) !== "undefined" && arg.nameNode != null ) ) ) {
            await this.WalkNode(n, ctx, wr);
          }
        };
      }
      wr.out("))", false);
    }
  };
  async writeArgsDef (fnDesc, ctx, wr) {
    for ( let i = 0; i < fnDesc.params.length; i++) {
      var arg = fnDesc.params[i];
      if ( i > 0 ) {
        wr.out(",", false);
      }
      wr.out(" ", false);
      this.WriteVRefWithOpt(arg.nameNode, ctx, wr);
      wr.out(":", false);
      await this.writeTypeDef(arg.nameNode, ctx, wr);
    };
  };
  async CreateCallExpression (node, ctx, wr) {
    if ( node.has_call ) {
      const obj = node.getSecond();
      const method = node.getThird();
      const args = node.children[3];
      wr.out("(call ", false);
      ctx.setInExpr();
      await this.WalkNode(obj, ctx, wr);
      ctx.unsetInExpr();
      wr.out(" ", false);
      wr.out(method.vref, false);
      wr.out("(", false);
      ctx.setInExpr();
      for ( let i = 0; i < args.children.length; i++) {
        var arg = args.children[i];
        if ( i > 0 ) {
          wr.out(" ", false);
        }
        await this.WalkNode(arg, ctx, wr);
      };
      ctx.unsetInExpr();
      wr.out("))", false);
      if ( ctx.expressionLevel() == 0 ) {
      }
    }
  };
  async writeClass (node, ctx, orig_wr) {
    const cl = node.clDesc;
    if ( typeof(cl) === "undefined" ) {
      return;
    }
    const wr = orig_wr;
    const importFork = wr.fork();
    wr.out("", true);
    wr.out("class " + cl.name, false);
    wr.out(" { ", true);
    wr.indent(1);
    if ( (cl.extends_classes.length) > 0 ) {
      wr.out("Extends(", false);
      for ( let i = 0; i < cl.extends_classes.length; i++) {
        var pName = cl.extends_classes[i];
        wr.out(pName, false);
      };
      wr.out(")", true);
    }
    wr.createTag("utilities");
    for ( let i_1 = 0; i_1 < cl.variables.length; i_1++) {
      var pvar = cl.variables[i_1];
      await this.writeVarDef(pvar.node, ctx, wr);
    };
    if ( cl.has_constructor ) {
      const constr = cl.constructor_fn;
      wr.out("", true);
      wr.out("Constructor (", false);
      await this.writeArgsDef(constr, ctx, wr);
      wr.out(" ) {", true);
      wr.indent(1);
      wr.newline();
      const subCtx = constr.fnCtx;
      subCtx.is_function = true;
      await this.WalkNode(constr.fnBody, subCtx, wr);
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
        await this.writeTypeDef(variant.nameNode, ctx, wr);
        wr.out(" (", false);
        await this.writeArgsDef(variant, ctx, wr);
        wr.out(") {", true);
      }
      wr.indent(1);
      wr.newline();
      const subCtx_1 = variant.fnCtx;
      subCtx_1.is_function = true;
      await this.WalkNode(variant.fnBody, subCtx_1, wr);
      wr.newline();
      wr.indent(-1);
      wr.out("}", true);
    };
    for ( let i_3 = 0; i_3 < cl.defined_variants.length; i_3++) {
      var fnVar = cl.defined_variants[i_3];
      const mVs = cl.method_variants[fnVar];
      for ( let i_4 = 0; i_4 < mVs.variants.length; i_4++) {
        var variant_1 = mVs.variants[i_4];
        wr.out("", true);
        wr.out("fn ", false);
        this.WriteVRefWithOpt(variant_1.nameNode, ctx, wr);
        wr.out(":", false);
        await this.writeTypeDef(variant_1.nameNode, ctx, wr);
        wr.out(" ", false);
        wr.out("(", false);
        await this.writeArgsDef(variant_1, ctx, wr);
        wr.out(") {", true);
        wr.indent(1);
        wr.newline();
        const subCtx_2 = variant_1.fnCtx;
        subCtx_2.is_function = true;
        await this.WalkNode(variant_1.fnBody, subCtx_2, wr);
        wr.newline();
        wr.indent(-1);
        wr.out("}", true);
      };
    };
    wr.indent(-1);
    wr.out("}", true);
    const import_list = wr.getImports();
    for ( let i_5 = 0; i_5 < import_list.length; i_5++) {
      var codeStr = import_list[i_5];
      importFork.out(("Import \"" + codeStr) + "\"", true);
    };
  };
}
class OpList  {
  constructor() {
    this.list = [];
  }
}
class RangerActiveOperators  {
  constructor() {
    this.opHash = {};
    this.initialized = false;
  }
  fork (fromOperator) {
    const newOps = new RangerActiveOperators();
    newOps.parent = this;
    for ( let i = 0; i < fromOperator.children.length; i++) {
      var lch = fromOperator.children[i];
      const fc = lch.getFirst();
      if ( fc.vref == "operators" ) {
        const n = lch.getSecond();
        newOps.stdCommands = n;
      }
    };
    return newOps;
  };
  async initializeOpCache () {
    await operatorsOf_13.forEach_19(this.opHash, ((item, index) => { 
      item.list.length = 0;
    }));
    for ( let i = 0; i < this.stdCommands.children.length; i++) {
      var lch = this.stdCommands.children[i];
      const fc = lch.getFirst();
      if ( ( typeof(this.opHash[fc.vref] ) != "undefined" && this.opHash.hasOwnProperty(fc.vref) ) ) {
        const opList = (this.opHash[fc.vref]);
        opList.list.push(lch);
      } else {
        const newOpList = new OpList();
        this.opHash[fc.vref] = newOpList;
        newOpList.list.push(lch);
      }
    };
    this.initialized = true;
  };
  async getOperators (name) {
    let results = [];
    if ( false == this.initialized ) {
      await this.initializeOpCache();
    }
    const items = this.opHash[name];
    if ( (typeof(items) !== "undefined" && items != null )  ) {
      return items.list;
    }
    return results;
  };
  initFrom (main) {
    let lang;
    for ( let i = 0; i < main.children.length; i++) {
      var m = main.children[i];
      const fc = m.getFirst();
      if ( fc.vref == "language" ) {
        lang = m;
      }
    };
    if ( typeof(lang) === "undefined" ) {
      return;
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
    };
    return;
  };
}
class LiveCompiler  {
  constructor() {
    this.hasCreatedPolyfill = {};     /** note: unused */
    this.repeat_index = 0;
    this.installedFile = {};
  }
  initWriter (ctx) {
    if ( (typeof(this.langWriter) !== "undefined" && this.langWriter != null )  ) {
      return;
    }
    const langName = operatorsOf_21.getTargetLang_22(ctx);
    console.log("Livecompiler starting with language => " + langName);
    switch (langName ) { 
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
    };
    if ( (typeof(this.langWriter) !== "undefined" && this.langWriter != null )  ) {
      this.langWriter.compiler = this;
    } else {
      this.langWriter = new RangerGenericClassWriter();
      this.langWriter.compiler = this;
    }
  };
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
      };
      ii = ii + 1;
    };
    return encoded_str_2;
  };
  WriteScalarValue (node, ctx, wr) {
    this.langWriter.WriteScalarValue(node, ctx, wr);
  };
  adjustType (tn) {
    if ( tn == "this" ) {
      return "self";
    }
    return tn;
  };
  async WriteVRef (node, ctx, wr) {
    await this.langWriter.WriteVRef(node, ctx, wr);
  };
  async writeTypeDef (node, ctx, wr) {
    await this.langWriter.writeTypeDef(node, ctx, wr);
  };
  async CreateLambdaCall (node, ctx, wr) {
    await this.langWriter.CreateLambdaCall(node, ctx, wr);
  };
  async CreateCallExpression (node, ctx, wr) {
    await this.langWriter.CreateCallExpression(node, ctx, wr);
  };
  async CreateLambda (node, ctx, wr) {
    await this.langWriter.CreateLambda(node, ctx, wr);
  };
  getTypeString (str, ctx) {
    return "";
  };
  createPolyfill (code, ctx, wr) {
    const p_write = wr.getTag("utilities");
    if ( (( typeof(p_write.compiledTags[code] ) != "undefined" && p_write.compiledTags.hasOwnProperty(code) )) == false ) {
      p_write.raw(code, true);
      p_write.compiledTags[code] = true;
    }
  };
  async installFile (filename, ctx, wr) {
    if ( ( typeof(this.installedFile[filename] ) != "undefined" && this.installedFile.hasOwnProperty(filename) ) ) {
      return;
    }
    const env = ctx.getEnv();
    this.installedFile[filename] = true;
    /** unused:  const fName = (operatorsOf_8.installc95directory_51(env) + "/") + filename   **/ 
    if ( operatorsOf_8.filec95exists_9(env, (operatorsOf_8.installc95directory_51(env) + "/"), filename) ) {
      const fileData = await (new Promise(resolve => { require('fs').readFile( (operatorsOf_8.installc95directory_51(env) + "/") + '/' + filename , 'utf8', (err,data)=>{ resolve(data) }) } ));
      if ( (typeof(fileData) !== "undefined" && fileData != null )  ) {
        const file_wr = wr.getFileWriter(".", filename);
        file_wr.raw(fileData, false);
      } else {
        console.log("did not get contents of " + filename);
      }
    } else {
      console.log(("did not find installed file " + operatorsOf_8.installc95directory_51(env)) + filename);
    }
  };
  async findOpCode (op, node, ctx, wr) {
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
              };
              stdClass.addStaticMethod(m);
              const err_cnt = ctx.compilerErrors.length;
              const flowParser = new RangerFlowParser();
              const TmpWr = new CodeWriter();
              await flowParser.WalkNode(theCode, runCtx, TmpWr);
              runCtx.unsetInMethod();
              const err_delta = (ctx.compilerErrors.length) - err_cnt;
              if ( err_delta > 0 ) {
                b_failed = true;
                console.log("Had following compiler errors:");
                for ( let i_1 = 0; i_1 < ctx.compilerErrors.length; i_1++) {
                  var e = ctx.compilerErrors[i_1];
                  if ( i_1 < err_cnt ) {
                    continue;
                  }
                  const line_index = e.node.getLine();
                  console.log((e.node.getFilename() + " Line: ") + line_index);
                  console.log(e.description);
                  console.log(e.node.getLineString(line_index));
                };
              } else {
                console.log("no errors found");
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
                await this.WalkNode(cc, ctx, wr);
              };
              wr.out(")", false);
            }
            return;
          }
        }
      };
    }
  };
  async findOpTemplate (op, node, ctx, wr) {
    /** unused:  const fnName = op.children[1]   **/ 
    /** unused:  const root = ctx.getRoot()   **/ 
    const langName = operatorsOf_21.getTargetLang_22(ctx);
    let rv;
    const opDef = op;
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
              rv = tplImpl;
              return rv;
            };
            if ( langName == "ranger" ) {
              const opNameNode = opDef.getFirst();
              const opArgs = opDef.getThird();
              const rangerTpl = CodeNode.fromList([CodeNode.newStr((("(" + opNameNode.vref) + " "))]);
              let cnt = 1;
              await operatorsOf.forEach_15(opArgs.children, ((item, index) => { 
                if ( item.type_name == "block" ) {
                  rangerTpl.children.push(CodeNode.fromList([CodeNode.vref1("block"), CodeNode.newInt(cnt)]));
                } else {
                  rangerTpl.children.push(CodeNode.fromList([CodeNode.vref1("e"), CodeNode.newInt(cnt)]));
                }
                cnt = cnt + 1;
              }));
              rangerTpl.children.push(CodeNode.newStr(")"));
              rv = rangerTpl;
            }
          }
        }
      };
    }
    return rv;
  };
  async localCall (node, ctx, wr) {
    if ( node.hasFnCall ) {
      if ( (typeof(this.langWriter) !== "undefined" && this.langWriter != null )  ) {
        await this.langWriter.writeFnCall(node, ctx, wr);
        return true;
      }
    }
    if ( node.hasNewOper ) {
      await this.langWriter.writeNewCall(node, ctx, wr);
      return true;
    }
    if ( node.hasVarDef ) {
      if ( node.disabled_node ) {
        await this.langWriter.disabledVarDef(node, ctx, wr);
      } else {
        await this.langWriter.writeVarDef(node, ctx, wr);
      }
      return true;
    }
    if ( node.hasClassDescription ) {
      await this.langWriter.writeClass(node, ctx, wr);
      return true;
    }
    return false;
  };
  async WalkNode (node, in_ctx, wr) {
    this.initWriter(in_ctx);
    if ( node.disabled_node ) {
      return;
    }
    let ctx = in_ctx;
    if ( (typeof(node.evalCtx) !== "undefined" && node.evalCtx != null )  ) {
      ctx = node.evalCtx;
    }
    if ( (node.register_name.length) > 0 ) {
      if ( ctx.expressionLevel() > 0 ) {
        if ( (node.reg_compiled_name.length) > 0 ) {
          wr.out(node.reg_compiled_name, false);
        } else {
          console.log((("Could not find compiled name for " + node.register_name) + " at ") + node.getCode());
        }
      }
      return;
    }
    let liveNodes = [];
    /** unused:  const rootItem = node   **/ 
    if ( (node.register_expressions.length) > 0 ) {
      await operatorsOf.forEach_15(node.register_expressions, ((item, index) => { 
        liveNodes.push(item);
      }));
    }
    await operatorsOf.forEach_15(liveNodes, (async (item, index) => { 
      if ( item.register_set == false ) {
        item.register_set = true;
        await this.WalkNode(item, ctx, wr);
      }
    }));
    liveNodes.length = 0;
    if ( node.value_type == 12 ) {
      return;
    }
    if ( node.isPrimitive() ) {
      this.WriteScalarValue(node, ctx, wr);
      return;
    }
    this.lastProcessedNode = node;
    if ( node.isFirstVref("property") ) {
      await this.langWriter.CreatePropertyGet(node, ctx, wr);
      return;
    }
    if ( node.is_plugin ) {
      return;
    }
    if ( node.is_array_literal ) {
      await this.langWriter.writeArrayLiteral(node, ctx, wr);
      return;
    }
    if ( ((node.value_type == 11) || (node.value_type == 7)) || (node.value_type == 6) ) {
      await this.WriteVRef(node, ctx, wr);
      return;
    }
    if ( node.value_type == 18 ) {
      await this.WriteVRef(node, ctx, wr);
      return;
    }
    if ( (node.children.length) > 0 ) {
      if ( node.has_operator ) {
        const op = ctx.findOperator(node);
        /** unused:  const fc = op.getFirst()   **/ 
        const tplImpl = await this.findOpTemplate(op, node, ctx, wr);
        let evalCtx = ctx;
        if ( (typeof(node.evalCtx) !== "undefined" && node.evalCtx != null )  ) {
          evalCtx = node.evalCtx;
        }
        if ( (typeof(tplImpl) !== "undefined" && tplImpl != null )  ) {
          const opName = op.getSecond();
          if ( opName.hasFlag("returns") ) {
            this.langWriter.release_local_vars(node, evalCtx, wr);
          }
          await this.walkCommandList(tplImpl, node, evalCtx, wr);
        } else {
          await this.findOpCode(op, node, evalCtx, wr);
        }
        return;
      }
      if ( node.is_direct_method_call ) {
        await this.langWriter.CreateMethodCall(node, ctx, wr);
        return;
      }
      if ( node.has_lambda ) {
        await this.CreateLambda(node, ctx, wr);
        return;
      }
      if ( node.has_lambda_call ) {
        await this.CreateLambdaCall(node, ctx, wr);
        return;
      }
      if ( node.is_part_of_chain ) {
        return;
      }
      if ( node.has_call ) {
        await this.CreateCallExpression(node, ctx, wr);
        return;
      }
      if ( (node.children.length) > 1 ) {
        if ( await this.localCall(node, ctx, wr) ) {
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
        if ( node.is_block_node ) {
          let liveNodes_2 = [];
          /** unused:  const rootItem_2 = item   **/ 
          if ( (item.register_expressions.length) > 0 ) {
            await operatorsOf.forEach_15(item.register_expressions, ((item, index) => { 
              liveNodes_2.push(item);
            }));
          }
          await item.walkTreeUntil((async (item, i) => { 
            if ( item.is_block_node ) {
              return false;
            }
            if ( (item.register_expressions.length) > 0 ) {
              await operatorsOf.forEach_15(item.register_expressions, ((item, index) => { 
              }));
            }
            return true;
          }));
          await operatorsOf.forEach_15(liveNodes_2, (async (item, index) => { 
            if ( item.register_set == false ) {
              item.register_set = true;
              await this.WalkNode(item, ctx, wr);
            }
          }));
        }
        await this.WalkNode(item, ctx, wr);
      };
    } else {
      if ( node.value_type == 17 ) {
        await this.WriteVRef(node, ctx, wr);
      }
    }
  };
  async walkCommandList (cmd, node, ctx, wr) {
    if ( ctx.expressionLevel() == 0 ) {
      wr.newline();
      if ( operatorsOf_21.getTargetLang_22(ctx) == "swift3" ) {
        const opn = node.operator_node;
        const nn = opn.getSecond();
        if ( nn.type_name != "void" ) {
          wr.out("_ = ", false);
        }
      }
    }
    if ( ctx.expressionLevel() > 1 ) {
      wr.out("(", false);
    }
    for ( let i = 0; i < cmd.children.length; i++) {
      var c = cmd.children[i];
      await this.walkCommand(c, node, ctx, wr);
    };
    if ( ctx.expressionLevel() > 1 ) {
      wr.out(")", false);
    }
    if ( ctx.expressionLevel() == 0 ) {
      wr.line_end(this.langWriter.lineEnding());
      wr.newline();
    }
  };
  async walkCommand (cmd, node, ctx, wr) {
    if ( cmd.expression ) {
      if ( (cmd.children.length) < 2 ) {
        ctx.addError(node, "Invalid command");
        ctx.addError(cmd, "Invalid command");
        return;
      }
      const cmdE = cmd.getFirst();
      const cmdArg = cmd.getSecond();
      switch (cmdE.vref ) { 
        case "service_id" : 
          const idx = cmdArg.int_value;
          if ( (node.children.length) >= idx ) {
            const arg = node.children[idx];
            const root = ctx.getRoot();
            const sNode = root.appServices[arg.vref];
            if ( (typeof(sNode) !== "undefined" && sNode != null )  ) {
              wr.out(sNode.appGUID, false);
            } else {
              ctx.addError(arg, "Service not found");
            }
          } else {
            ctx.addError(node, "Service not found");
          }
          break;
        case "log" : 
          console.log(cmdArg.string_value);
          break;
        case "str" : 
          const idx_1 = cmdArg.int_value;
          if ( (node.children.length) > idx_1 ) {
            const arg_1 = node.children[idx_1];
            wr.out(arg_1.string_value, false);
          }
          break;
        case "block" : 
          const idx_2 = cmdArg.int_value;
          if ( (node.children.length) > idx_2 ) {
            const arg_2 = node.children[idx_2];
            const sCtx = ctx.fork();
            sCtx.restartExpressionLevel();
            await this.WalkNode(arg_2, sCtx, wr);
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
          const idx_3 = cmdArg.int_value;
          if ( (node.children.length) > idx_3 ) {
            const arg_3 = node.children[idx_3];
            const cc = arg_3.string_value.charCodeAt(0);
            wr.out("" + (cc), false);
          }
          break;
        case "optional_option" : 
          const idx_4 = cmdArg.int_value;
          if ( (node.children.length) > idx_4 ) {
            const arg_4 = node.children[idx_4];
            if ( ctx.hasCompilerSetting(arg_4.string_value) ) {
              const setting = ctx.getCompilerSetting(arg_4.string_value);
              wr.out(setting, false);
            }
          }
          break;
        case "required_option" : 
          const idx_5 = cmdArg.int_value;
          if ( (node.children.length) > idx_5 ) {
            const arg_5 = node.children[idx_5];
            if ( ctx.hasCompilerSetting(arg_5.string_value) ) {
              const setting_1 = ctx.getCompilerSetting(arg_5.string_value);
              wr.out(setting_1, false);
            } else {
              ctx.addError(node, ("This source code requires compiler option -" + arg_5.string_value) + "=<> to be set ");
            }
          }
          break;
        case "java_case" : 
          const idx_6 = cmdArg.int_value;
          if ( (node.children.length) > idx_6 ) {
            const arg_6 = node.children[idx_6];
            await this.WalkNode(arg_6, ctx, wr);
            if ( arg_6.didReturnAtIndex < 0 ) {
              wr.newline();
              wr.out("break;", true);
            }
          }
          break;
        case "plugin" : 
          if ( (cmd.children.length) > 2 ) {
            const cmdData = cmd.getThird();
            const name = cmdArg.string_value;
            ctx.addPluginNode(name, cmdData);
          }
          break;
        case "lambda" : 
          const idx_7 = cmdArg.int_value;
          if ( (node.children.length) > idx_7 ) {
            const arg_7 = node.children[idx_7];
            ctx.setInExpr();
            await this.WalkNode(arg_7, ctx, wr);
            ctx.unsetInExpr();
          }
          break;
        case "e" : 
          const idx_8 = cmdArg.int_value;
          if ( (node.children.length) > idx_8 ) {
            const arg_8 = node.children[idx_8];
            ctx.setInExpr();
            await this.WalkNode(arg_8, ctx, wr);
            ctx.unsetInExpr();
          }
          break;
        case "goset" : 
          const idx_9 = cmdArg.int_value;
          if ( (node.children.length) > idx_9 ) {
            const arg_9 = node.children[idx_9];
            ctx.setInExpr();
            await this.langWriter.WriteSetterVRef(arg_9, ctx, wr);
            ctx.unsetInExpr();
          }
          break;
        case "pe" : 
          const idx_10 = cmdArg.int_value;
          if ( (node.children.length) > idx_10 ) {
            const arg_10 = node.children[idx_10];
            await this.WalkNode(arg_10, ctx, wr);
          }
          break;
        case "ptr" : 
          const idx_11 = cmdArg.int_value;
          if ( (node.children.length) > idx_11 ) {
            const arg_11 = node.children[idx_11];
            if ( arg_11.hasParamDesc ) {
              if ( arg_11.paramDesc.nameNode.isAPrimitiveType() == false ) {
                wr.out("*", false);
              }
            } else {
              if ( arg_11.isAPrimitiveType() == false ) {
                wr.out("*", false);
              }
            }
          }
          break;
        case "ptrsrc" : 
          const idx_12 = cmdArg.int_value;
          if ( (node.children.length) > idx_12 ) {
            const arg_12 = node.children[idx_12];
            if ( (arg_12.isPrimitiveType() == false) && (arg_12.isPrimitive() == false) ) {
              wr.out("&", false);
            }
          }
          break;
        case "nameof" : 
          const idx_13 = cmdArg.int_value;
          if ( (node.children.length) > idx_13 ) {
            const arg_13 = node.children[idx_13];
            wr.out(arg_13.vref, false);
          }
          break;
        case "list" : 
          const idx_14 = cmdArg.int_value;
          if ( (node.children.length) > idx_14 ) {
            const arg_14 = node.children[idx_14];
            for ( let i = 0; i < arg_14.children.length; i++) {
              var ch = arg_14.children[i];
              if ( i > 0 ) {
                wr.out(" ", false);
              }
              ctx.setInExpr();
              await this.WalkNode(ch, ctx, wr);
              ctx.unsetInExpr();
            };
          }
          break;
        case "repeat" : 
          const idx_15 = cmdArg.int_value;
          this.repeat_index = idx_15;
          if ( (node.children.length) >= idx_15 ) {
            const cmdToRepeat = cmd.getThird();
            let i_1 = idx_15;
            while (i_1 < (node.children.length)) {
              if ( i_1 >= idx_15 ) {
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
                };
                await this.walkCommandList(cmdToRepeat, node, ctx, wr);
              }
              i_1 = i_1 + 1;
            };
          }
          break;
        case "repeat_from" : 
          const idx_16 = cmdArg.int_value;
          this.repeat_index = idx_16;
          if ( (node.children.length) >= idx_16 ) {
            const cmdToRepeat_1 = cmd.getThird();
            let i_2 = idx_16;
            while (i_2 < (node.children.length)) {
              if ( i_2 >= idx_16 ) {
                for ( let ii_1 = 0; ii_1 < cmdToRepeat_1.children.length; ii_1++) {
                  var cc_2 = cmdToRepeat_1.children[ii_1];
                  if ( (cc_2.children.length) > 0 ) {
                    const fc_1 = cc_2.getFirst();
                    if ( fc_1.vref == "e" ) {
                      const dc_2 = cc_2.getSecond();
                      dc_2.int_value = i_2;
                    }
                    if ( fc_1.vref == "block" ) {
                      const dc_3 = cc_2.getSecond();
                      dc_3.int_value = i_2;
                    }
                  }
                };
                await this.walkCommandList(cmdToRepeat_1, node, ctx, wr);
                if ( (i_2 + 1) < (node.children.length) ) {
                  wr.out(",", false);
                }
              }
              i_2 = i_2 + 1;
            };
          }
          break;
        case "comma" : 
          const idx_17 = cmdArg.int_value;
          if ( (node.children.length) > idx_17 ) {
            const arg_15 = node.children[idx_17];
            for ( let i_3 = 0; i_3 < arg_15.children.length; i_3++) {
              var ch_1 = arg_15.children[i_3];
              if ( i_3 > 0 ) {
                wr.out(",", false);
              }
              ctx.setInExpr();
              await this.WalkNode(ch_1, ctx, wr);
              ctx.unsetInExpr();
            };
          }
          break;
        case "swift_rc" : 
          const idx_18 = cmdArg.int_value;
          if ( (node.children.length) > idx_18 ) {
            const arg_16 = node.children[idx_18];
            if ( arg_16.hasParamDesc ) {
              if ( arg_16.paramDesc.ref_cnt == 0 ) {
                wr.out("_", false);
              } else {
                const p_2 = ctx.getVariableDef(arg_16.vref);
                wr.out(p_2.compiledName, false);
              }
            } else {
              wr.out(arg_16.vref, false);
            }
          }
          break;
        case "r_ktype" : 
          const idx_19 = cmdArg.int_value;
          if ( (node.children.length) > idx_19 ) {
            const arg_17 = node.children[idx_19];
            if ( arg_17.hasParamDesc ) {
              const ss = this.langWriter.getObjectTypeString(arg_17.paramDesc.nameNode.key_type, ctx);
              wr.out(ss, false);
            } else {
              const ss_1 = this.langWriter.getObjectTypeString(arg_17.key_type, ctx);
              wr.out(ss_1, false);
            }
          }
          break;
        case "r_atype" : 
          const idx_20 = cmdArg.int_value;
          if ( (node.children.length) > idx_20 ) {
            const arg_18 = node.children[idx_20];
            if ( arg_18.hasParamDesc ) {
              const ss_2 = this.langWriter.getObjectTypeString(arg_18.paramDesc.nameNode.array_type, ctx);
              wr.out(ss_2, false);
            } else {
              const ss_3 = this.langWriter.getObjectTypeString(arg_18.array_type, ctx);
              wr.out(ss_3, false);
            }
          }
          break;
        case "r_atype_fname" : 
          const idx_21 = cmdArg.int_value;
          if ( (node.children.length) > idx_21 ) {
            const arg_19 = node.children[idx_21];
            if ( arg_19.hasParamDesc ) {
              let ss_4 = this.langWriter.getObjectTypeString(arg_19.paramDesc.nameNode.array_type, ctx);
              if ( ss_4 == "interface{}" ) {
                ss_4 = "interface";
              }
              wr.out(ss_4, false);
            } else {
              let ss_5 = this.langWriter.getObjectTypeString(arg_19.array_type, ctx);
              if ( ss_5 == "interface{}" ) {
                ss_5 = "interface";
              }
              wr.out(ss_5, false);
            }
          }
          break;
        case "custom" : 
          await this.langWriter.CustomOperator(node, ctx, wr);
          break;
        case "arraytype" : 
          const idx_22 = cmdArg.int_value;
          if ( (node.children.length) > idx_22 ) {
            const arg_20 = node.children[idx_22];
            if ( arg_20.hasParamDesc ) {
              this.langWriter.writeArrayTypeDef(arg_20.paramDesc.nameNode, ctx, wr);
            } else {
              this.langWriter.writeArrayTypeDef(arg_20, ctx, wr);
            }
          }
          break;
        case "java_class" : 
          try {
            const fName = cmdArg.string_value + ".java";
            const p_write = wr.getTag("utilities");
            if ( (( typeof(p_write.compiledTags[fName] ) != "undefined" && p_write.compiledTags.hasOwnProperty(fName) )) == false ) {
              const code = cmd.getThird();
              const classWr = wr.getFileWriter(".", fName);
              if ( (classWr.getCode().length) > 0 ) {
              } else {
                const package_name = ctx.getCompilerSetting("package");
                classWr.out(("package " + package_name) + ";", true);
                classWr.raw(code.string_value, false);
                p_write.compiledTags[fName] = true;
              }
            }
          } catch(e) {
          }
          break;
        case "rawtype" : 
          const idx_23 = cmdArg.int_value;
          if ( (node.children.length) > idx_23 ) {
            const arg_21 = node.children[idx_23];
            if ( arg_21.hasParamDesc ) {
              await this.langWriter.writeRawTypeDef(arg_21.paramDesc.nameNode, ctx, wr);
            } else {
              await this.langWriter.writeRawTypeDef(arg_21, ctx, wr);
            }
          }
          break;
        case "macro" : 
          const p_write_1 = wr.getTag("utilities");
          const newWriter = new CodeWriter();
          const testCtx = ctx.fork();
          testCtx.restartExpressionLevel();
          testCtx.targetLangName = "ranger";
          await this.walkCommandList(cmdArg, node, testCtx, newWriter);
          const p_str = newWriter.getCode();
          /** unused:  const root_1 = ctx.getRoot()   **/ 
          if ( (( typeof(p_write_1.compiledTags[p_str] ) != "undefined" && p_write_1.compiledTags.hasOwnProperty(p_str) )) == false ) {
            p_write_1.compiledTags[p_str] = true;
            const mCtx = ctx.fork();
            mCtx.restartExpressionLevel();
            mCtx.targetLangName = "ranger";
            await this.walkCommandList(cmdArg, node, mCtx, p_write_1);
          }
          break;
        case "install_file" : 
          await this.installFile(cmdArg.string_value, ctx, wr);
          break;
        case "create_polyfill" : 
          this.createPolyfill(cmdArg.string_value, ctx, wr);
          break;
        case "typeof" : 
          const idx_24 = cmdArg.int_value;
          if ( (node.children.length) >= idx_24 ) {
            const arg_22 = node.children[idx_24];
            if ( arg_22.hasParamDesc ) {
              await this.writeTypeDef(arg_22.paramDesc.nameNode, ctx, wr);
            } else {
              await this.writeTypeDef(arg_22, ctx, wr);
            }
          }
          break;
        case "imp" : 
          this.langWriter.import_lib(cmdArg.string_value, ctx, wr);
          break;
        case "atype" : 
          const idx_25 = cmdArg.int_value;
          if ( (node.children.length) >= idx_25 ) {
            const arg_23 = node.children[idx_25];
            const p_3 = this.findParamDesc(arg_23, ctx, wr);
            const nameNode = p_3.nameNode;
            const tn = nameNode.array_type;
            wr.out(this.getTypeString(tn, ctx), false);
          }
          break;
      };
    } else {
      if ( cmd.value_type == 11 ) {
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
            const fc_2 = node.getFirst();
            wr.out(fc_2.vref, false);
            break;
        };
      } else {
        if ( cmd.value_type == 4 ) {
          wr.out(cmd.string_value, false);
        }
      }
    }
  };
  compile (node, ctx, wr) {
  };
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
            if ( (typeof(classDesc) !== "undefined" && classDesc != null )  ) {
              varDesc = classDesc.findVariable(strname);
              if ( typeof(varDesc) === "undefined" ) {
                let classMethod = classDesc.findMethod(strname);
                if ( typeof(classMethod) === "undefined" ) {
                  classMethod = classDesc.findStaticMethod(strname);
                  if ( typeof(classMethod) === "undefined" ) {
                    ctx.addError(obj, "variable not found " + strname);
                  }
                }
                if ( (typeof(classMethod) !== "undefined" && classMethod != null )  ) {
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
        };
        return varDesc;
      }
      varDesc = ctx.getVariableDef(obj.vref);
      if ( (typeof(varDesc.nameNode) !== "undefined" && varDesc.nameNode != null )  ) {
      } else {
        console.log("findParamDesc : description not found for " + obj.vref);
        if ( (typeof(varDesc) !== "undefined" && varDesc != null )  ) {
          console.log("Vardesc was found though..." + varDesc.name);
        }
        ctx.addError(obj, "Error, no description for called object: " + obj.vref);
      }
      return varDesc;
    }
    const cc = ctx.getCurrentClass();
    return cc;
  };
}
class ColorConsole  {
  constructor() {
  }
  out (color, str) {
    console.log(str);
  };
}
class RangerDocGenerator  {
  constructor() {
  }
  async writeTypeDef (item, ctx, wr) {
    if ( item.hasFlag("optional") ) {
      wr.out("<optional>", false);
    }
    switch (item.value_type ) { 
      case 6 : 
        wr.out(("[" + item.array_type) + "]", false);
        break;
      case 7 : 
        wr.out(((("[" + item.key_type) + ":") + item.array_type) + "]", false);
        break;
      case 17 : 
        wr.out("(fn:", false);
        try {
          const rv = item.expression_value.children[0];
          const args = item.expression_value.children[1];
          await this.writeTypeDef(rv, ctx, wr);
          wr.out(" (", false);
          await operatorsOf.forEach_15(args.children, (async (item, index) => { 
            if ( index > 0 ) {
              wr.out(", ", false);
            }
            wr.out(item.vref, false);
            wr.out(": ", false);
            await this.writeTypeDef(item, ctx, wr);
          }));
          wr.out(")", false);
        } catch(e) {
        }
        wr.out(")", false);
        break;
      default: 
        if ( (item.type_name.length) > 0 ) {
          wr.out("" + item.type_name, false);
        }
        break;
    };
  };
  async writeArgDefs (node, ctx, wr) {
    await operatorsOf.forEach_15(node.children, (async (item, index) => { 
      if ( index > 0 ) {
        wr.out(" ", false);
      }
      wr.out(("`" + item.vref) + "`", false);
      wr.out(":", false);
      await this.writeTypeDef(item, ctx, wr);
      wr.out(" ", false);
    }));
  };
  async createClassDoc (node, ctx, orig_wr) {
    if ( ctx.hasCompilerSetting("classdoc") ) {
      const b_only_documented = false == ctx.hasCompilerFlag("allowempty");
      const wr = orig_wr.getFileWriter(".", ctx.getCompilerSetting("classdoc"));
      if ( b_only_documented == false ) {
        wr.out("# Classes", true);
      }
      const root = ctx.getRoot();
      await operatorsOf_13.forEach_14(root.definedClasses, (async (item, index) => { 
        if ( false == item.isNormalClass() ) {
          return;
        }
        if ( b_only_documented == false ) {
          wr.out("## " + index, true);
        }
        const theClass = item;
        await operatorsOf_13.forEach_30(item.method_variants, (async (item, index) => { 
          await operatorsOf.forEach_29(item.variants, (async (item, index) => { 
            if ( b_only_documented ) {
              if ( (item.git_doc.length) == 0 ) {
                return;
              }
            }
            wr.out("#### ", false);
            if ( typeof(item.nameNode) != "undefined" ) {
              if ( item.nameNode.type_name != "void" ) {
                wr.out("`", false);
                await this.writeTypeDef(item.nameNode, ctx, wr);
                wr.out("` ", false);
              }
            }
            wr.out((theClass.name + ":: ") + item.name, false);
            wr.out("(", false);
            for ( let i = 0; i < item.params.length; i++) {
              var arg = item.params[i];
              if ( i > 0 ) {
                wr.out(" ", false);
              }
              wr.out(("`" + arg.compiledName) + "`", false);
              wr.out(":", false);
              await this.writeTypeDef(arg.nameNode, ctx, wr);
            };
            wr.out(")", false);
            wr.out("", true);
            wr.out(item.git_doc, false);
            wr.out("", true);
          }));
        }));
      }));
    }
  };
  async writeOpDesc (item, ctx, wr) {
    const fc = item.getFirst();
    const nameNode = item.getSecond();
    const args = item.getThird();
    wr.out("| ", false);
    let name = fc.vref;
    if ( fc.vref == "||" ) {
      name = "&#124;&#124;";
    }
    if ( fc.vref == "|" ) {
      name = "&#124;";
    }
    wr.out(name, false);
    wr.out(" | ", false);
    if ( nameNode.type_name != "void" ) {
      wr.out("`", false);
      await this.writeTypeDef(nameNode, ctx, wr);
      wr.out("` ", false);
    }
    wr.out("| ", false);
    wr.out("  (", false);
    await this.writeArgDefs(args, ctx, wr);
    wr.out(" )", false);
    wr.out("| ", false);
    if ( item.hasStringProperty("doc") ) {
      wr.out(item.getStringProperty("doc"), false);
    }
    wr.out("| ", false);
    wr.out("", true);
  };
  async writeTypeDoc (list, tester, ctx, wr) {
    const www = wr.fork();
    wr.out("", true);
    wr.out("", true);
    wr.out("| operator | returns | arguments | description |", true);
    wr.out("| -------- | ------- | --------- | ------------| ", true);
    let cnt = 0;
    await operatorsOf.forEach_17(list, (async (item, index) => { 
      if ( await tester(item) ) {
        if ( cnt > 0 ) {
          www.out(", ", false);
        }
        www.out(("  `" + item.name) + "` ", false);
        await this.writeOpDesc(item.node, ctx, wr);
        cnt = cnt + 1;
      }
    }));
  };
  async createOperatorDoc (node, ctx, orig_wr) {
    if ( ctx.hasCompilerSetting("operatordoc") ) {
      const wr = orig_wr.getFileWriter(".", ctx.getCompilerSetting("operatordoc"));
      const allOps = await ctx.getAllOperators();
      let statements = operatorsOf.filter_52(allOps, ((item, index) => { 
        let is_map_array = false;
        if ( typeof(item.firstArg) != "undefined" ) {
          is_map_array = (item.firstArg.value_type == 6) || (item.firstArg.value_type == 7);
        }
        if ( (item.name.indexOf("if_")) == 0 ) {
          return false;
        }
        return (item.nameNode.type_name == "void") && (false == is_map_array);
      }));
      const lang_statements = operatorsOf.filter_52(allOps, ((item, index) => { 
        if ( (item.name.indexOf("if_")) == 0 ) {
          return true;
        }
        return false;
      }));
      statements = operatorsOf.groupBy_53(statements, ((item) => { 
        return item.name;
      }));
      const operator_list = operatorsOf.filter_52(allOps, ((item, index) => { 
        let is_map_array_1 = false;
        if ( typeof(item.firstArg) != "undefined" ) {
          is_map_array_1 = (item.firstArg.value_type == 6) || (item.firstArg.value_type == 7);
        }
        return is_map_array_1 || (item.nameNode.type_name != "void");
      }));
      const nList = operatorsOf.groupBy_53(operator_list, ((item) => { 
        let key = item.name;
        const fc = item.firstArg;
        if ( typeof(fc) != "undefined" ) {
          key = key + (((((":" + fc.type_name) + ":") + fc.key_type) + ":") + fc.array_type);
        }
        return key;
      }));
      wr.out("## Statements", true);
      await this.writeTypeDoc(statements, ((item) => { 
        return true;
      }), ctx, wr);
      wr.out("", true);
      wr.out("## Language switches", true);
      await this.writeTypeDoc(lang_statements, ((item) => { 
        return true;
      }), ctx, wr);
      wr.out("", true);
      wr.out("## Operators without arguments", true);
      await this.writeTypeDoc(nList, ((item) => { 
        return typeof(item.firstArg) === "undefined";
      }), ctx, wr);
      wr.out("", true);
      wr.out("## Generic operators", true);
      await this.writeTypeDoc(nList, ((item) => { 
        if ( typeof(item.firstArg) != "undefined" ) {
          return item.firstArg.type_name == "T";
        }
        return false;
      }), ctx, wr);
      wr.out("", true);
      wr.out("## Numeric operators", true);
      await this.writeTypeDoc(nList, ((item) => { 
        if ( typeof(item.firstArg) != "undefined" ) {
          return ((item.firstArg.type_name == "int") || (item.firstArg.type_name == "double")) && ((item.nameNode.type_name == "int") || (item.nameNode.type_name == "double"));
        }
        return false;
      }), ctx, wr);
      wr.out("", true);
      wr.out("## Miscellaneous operators", true);
      await this.writeTypeDoc(nList, ((item) => { 
        if ( typeof(item.firstArg) != "undefined" ) {
          return ((item.firstArg.type_name == "int") || (item.firstArg.type_name == "double")) && (((item.nameNode.type_name != "int") && (item.nameNode.type_name != "double")) && (item.nameNode.type_name != "boolean"));
        }
        return false;
      }), ctx, wr);
      wr.out("", true);
      wr.out("## String operators", true);
      await this.writeTypeDoc(nList, ((item) => { 
        if ( typeof(item.firstArg) != "undefined" ) {
          return item.firstArg.type_name == "string";
        }
        return false;
      }), ctx, wr);
      wr.out("", true);
      wr.out("", true);
      wr.out("## Array operators", true);
      await this.writeTypeDoc(nList, ((item) => { 
        if ( typeof(item.firstArg) != "undefined" ) {
          return item.firstArg.value_type == 6;
        }
        return false;
      }), ctx, wr);
      wr.out("", true);
      wr.out("## Map operators", true);
      await this.writeTypeDoc(nList, ((item) => { 
        if ( typeof(item.firstArg) != "undefined" ) {
          return item.firstArg.value_type == 7;
        }
        return false;
      }), ctx, wr);
      wr.out("", true);
      wr.out("## Boolean / test operators", true);
      await this.writeTypeDoc(nList, ((item) => { 
        if ( typeof(item.firstArg) != "undefined" ) {
          return item.nameNode.type_name == "boolean";
        }
        return false;
      }), ctx, wr);
    }
  };
}
class viewbuilder_Android  {
  constructor() {
  }
  _attr (wr, name, value) {
    wr.out((((("android:" + name) + "=") + "\"") + value) + "\" ", true);
  };
  async elWithText (name, node, wr) {
    wr.out(("<" + name) + " ", true);
    wr.indent(1);
    let width = "match_parent";
    const height = "wrap_content";
    let weight = "";
    await operatorsOf.forEach_15(node.children, ((item, index) => { 
      switch (item.value_type ) { 
        case 20 : 
          this._attr(wr, "text", item.string_value);
          break;
      };
    }));
    await operatorsOf.forEach_15(node.attrs, ((item, index) => { 
      if ( item.vref == "font-size" ) {
        this._attr(wr, "textSize", item.string_value + "dp");
      }
      if ( item.vref == "id" ) {
        this._attr(wr, "id", "@+id/" + item.string_value);
      }
      if ( item.vref == "width-pros" ) {
        weight = item.string_value;
      }
      if ( item.vref == "width" ) {
        width = item.string_value + "dp";
      }
    }));
    this._attr(wr, "layout_width", width);
    this._attr(wr, "layout_height", height);
    if ( (weight.length) > 0 ) {
      this._attr(wr, "layout_weight", weight);
    }
    wr.out("/>", true);
    wr.indent(-1);
  };
  async WalkNode (node, ctx, wr) {
    switch (node.vref ) { 
      case "ScrollView" : 
        wr.out("<ScrollView ", true);
        wr.indent(1);
        this._attr(wr, "layout_width", "match_parent");
        this._attr(wr, "layout_height", "wrap_content");
        await operatorsOf.forEach_15(node.attrs, ((item, index) => { 
          if ( item.vref == "id" ) {
            this._attr(wr, "id", "@+id/" + item.string_value);
          }
        }));
        wr.out(">", true);
        wr.indent(1);
        await operatorsOf.forEach_15(node.children, (async (item, index) => { 
          await this.WalkNode(item, ctx, wr);
        }));
        wr.indent(-1);
        wr.out("</ScrollView>", true);
        wr.indent(-1);
        break;
      case "LinearLayout" : 
        wr.out("<LinearLayout ", true);
        wr.indent(1);
        this._attr(wr, "layout_width", "match_parent");
        this._attr(wr, "layout_height", "wrap_content");
        let orientation = "vertical";
        await operatorsOf.forEach_15(node.attrs, ((item, index) => { 
          if ( item.vref == "id" ) {
            this._attr(wr, "id", "@+id/" + item.string_value);
          }
          if ( item.vref == "direction" ) {
            orientation = item.string_value;
          }
        }));
        this._attr(wr, "orientation", orientation);
        this._attr(wr, "weightSum", "100");
        wr.out(">", true);
        wr.indent(1);
        await operatorsOf.forEach_15(node.children, (async (item, index) => { 
          await this.WalkNode(item, ctx, wr);
        }));
        wr.indent(-1);
        wr.out("</LinearLayout>", true);
        wr.indent(-1);
        break;
      case "Button" : 
        await this.elWithText("Button", node, wr);
        break;
      case "Text" : 
        await this.elWithText("TextView", node, wr);
        break;
      case "Input" : 
        wr.out("<EditText ", true);
        wr.indent(1);
        this._attr(wr, "layout_width", "match_parent");
        this._attr(wr, "layout_height", "wrap_content");
        await operatorsOf.forEach_15(node.attrs, ((item, index) => { 
          if ( item.vref == "hint" ) {
            this._attr(wr, "hint", item.string_value);
          }
          if ( item.vref == "id" ) {
            this._attr(wr, "id", "@+id/" + item.string_value);
          }
          if ( (item.vref == "type") && (item.string_value == "password") ) {
            this._attr(wr, "inputType", "textPassword");
          }
        }));
        await operatorsOf.forEach_15(node.children, ((item, index) => { 
          switch (item.value_type ) { 
            case 20 : 
              this._attr(wr, "text", item.string_value);
              break;
          };
        }));
        wr.out("/>", true);
        wr.indent(-1);
        break;
    };
  };
  async writeClass (node, ctx, orig_wr) {
    let viewName = "";
    let b_scroll = false;
    await operatorsOf.forEach_15(node.attrs, ((item, index) => { 
      if ( item.vref == "name" ) {
        viewName = item.string_value;
      }
      if ( item.vref == "type" ) {
        if ( item.string_value == "scroll" ) {
          b_scroll = true;
        }
      }
    }));
    const wr = orig_wr.getFileWriter("layout", (("activity_" + viewName) + ".xml"));
    wr.out("<?xml version=\"1.0\" encoding=\"utf-8\"?>", true);
    let viewTag = "LinearLayout";
    if ( b_scroll ) {
      viewTag = "ScrollView";
    }
    wr.out(("<" + viewTag) + " xmlns:android=\"http://schemas.android.com/apk/res/android\" ", true);
    wr.indent(1);
    this._attr(wr, "layout_width", "match_parent");
    this._attr(wr, "layout_height", "match_parent");
    if ( b_scroll == false ) {
      this._attr(wr, "paddingLeft", "16dp");
      this._attr(wr, "paddingRight", "16dp");
      this._attr(wr, "orientation", "vertical");
    }
    this._attr(wr, "id", "@+id/view_id_" + viewName);
    wr.out(">", true);
    await operatorsOf.forEach_15(node.children, (async (item, index) => { 
      await this.WalkNode(item, ctx, wr);
    }));
    wr.indent(-1);
    wr.out(("</" + viewTag) + ">", true);
  };
}
class viewbuilder_Web  {
  constructor() {
  }
  _attr (wr, name, value) {
    wr.out(((((" " + name) + "=") + "\"") + value) + "\" ", false);
  };
  async tagAttrs (node, ctx, wr) {
    await operatorsOf.forEach_15(node.attrs, ((item, index) => { 
      if ( item.vref == "id" ) {
        this._attr(wr, "x-id", item.string_value);
      }
      if ( item.vref == "hint" ) {
        this._attr(wr, "tooltip", item.string_value);
        this._attr(wr, "title", item.string_value);
        this._attr(wr, "placeholder", item.string_value);
      }
    }));
  };
  async tagText (node, ctx, wr) {
    await operatorsOf.forEach_15(node.children, ((item, index) => { 
      switch (item.value_type ) { 
        case 20 : 
          wr.out(item.string_value, false);
          break;
      };
    }));
  };
  async tag (name, node, ctx, wr) {
    wr.out("<" + name, false);
    await this.tagAttrs(node, ctx, wr);
    wr.out(">", false);
    await this.tagText(node, ctx, wr);
    wr.out(("</" + name) + ">", true);
  };
  async WalkNode (node, ctx, wr) {
    switch (node.vref ) { 
      case "LinearLayout" : 
        await this.tag("div", node, ctx, wr);
        break;
      case "Button" : 
        wr.out("<div><a class='waves-effect waves-light btn' ", false);
        await this.tagAttrs(node, ctx, wr);
        wr.out(">", false);
        await this.tagText(node, ctx, wr);
        wr.out("</a></div>", false);
        break;
      case "Text" : 
        await this.tag("div", node, ctx, wr);
        break;
      case "Input" : 
        wr.out("<div>", true);
        await this.tag("input", node, ctx, wr);
        wr.out("</div>", true);
        break;
    };
  };
  async CreateViews (ctx, wr) {
    wr.out("<!DOCTYPE html>", true);
    wr.out("<html>", true);
    wr.indent(1);
    wr.out("<head>", true);
    wr.indent(1);
    wr.out("\r\n  <link rel=\"stylesheet\" href=\"https://cdnjs.cloudflare.com/ajax/libs/materialize/0.100.2/css/materialize.min.css\">\r\n  <script src=\"https://cdnjs.cloudflare.com/ajax/libs/materialize/0.100.2/js/materialize.min.js\"></script>    \r\n    ", true);
    wr.indent(-1);
    wr.out("</head>", true);
    wr.out("<body>", true);
    await operatorsOf_13.forEach_25(ctx.viewClassBody, (async (item, index) => { 
      await this.writeClass(item, ctx, wr);
    }));
    wr.out("</body>", true);
    wr.out("</html>", true);
  };
  async writeClass (node, ctx, wr) {
    let viewName = "";
    await operatorsOf.forEach_15(node.attrs, ((item, index) => { 
      if ( item.vref == "name" ) {
        viewName = item.string_value;
      }
    }));
    wr.out("", true);
    wr.out(("<div id=\"" + viewName) + "\">", true);
    wr.indent(1);
    await operatorsOf.forEach_15(node.children, (async (item, index) => { 
      await this.WalkNode(item, ctx, wr);
    }));
    wr.indent(-1);
    wr.out("</div>", true);
  };
}
class CompilerResults  {
  constructor() {
    this.target_dir = "";
  }
}
class VirtualCompiler  {
  constructor() {
  }
  getEnvVar (name) {
    return operatorsOf_8.envc95var_54((this.envObj), name);
  };
  possiblePaths (envVarName) {
    let res = [];
    const parts = envVarName.split(";");
    res.push("./");
    for ( let i = 0; i < parts.length; i++) {
      var str = parts[i];
      const s = str.trim();
      if ( (s.length) > 0 ) {
        let dirNames = s.split("/");
        dirNames.pop();
        const theDir = dirNames.join("/");
        res.push(theDir);
      }
    };
    res.push(operatorsOf_8.installc95directory_51((this.envObj)));
    return res;
  };
  searchLib (paths, libname) {
    for ( let i = 0; i < paths.length; i++) {
      var path = paths[i];
      if ( operatorsOf_8.filec95exists_9((this.envObj), path, libname) ) {
        return path;
      }
    };
    return "";
  };
  fillStr (cnt) {
    let s = "";
    let i = cnt;
    while (i > 0) {
      s = s + " ";
      i = i - 1;
    };
    return s;
  };
  async run (env) {
    const res = new CompilerResults();
    this.envObj = env;
    const allowed_languages = ["es6", "go", "scala", "java7", "swift3", "cpp", "php", "csharp"];
    const params = env.commandLine;
    let the_file = "";
    let plugins_only = false;
    const valid_options = ["l", "Selected language, one of " + (allowed_languages.join(", ")), "d", "output directory, default directory is \"bin/\"", "o", "output file, default is \"output.<language>\"", "classdoc", "write class documentation .md file", "operatordoc", "write operator documention into .md file"];
    const valid_flags = ["deadcode", "Eliminate functions which are not called by any other functions", "dead4main", "Eliminate functions and classes which are unreachable from the main function", "forever", "Leave the main program into eternal loop (Go, Swift)", "allowti", "Allow type inference at target lang (creates slightly smaller code)", "plugins-only", "ignore built-in language output and use only plugins", "plugins", "(node compiler only) run specified npm plugins -plugins=\"plugin1,plugin2\"", "strict", "Strict mode. Do not allow automatic unwrapping of optionals outside of try blocks.", "typescript", "Writes JavaScript code with TypeScript annotations", "npm", "Write the package.json to the output directory", "nodecli", "Insert node.js command line header #!/usr/bin/env node to the beginning of the JavaScript file", "nodemodule", "Export the classes as node.js modules (this option will disable the static main function)", "client", "the code is ment to be run in the client environment", "scalafiddle", "scalafiddle.io compatible output", "compiler", "recompile the compiler", "copysrc", "copy all the source codes into the target directory"];
    const parser_pragmas = ["@noinfix(true)", "disable operator infix parsing and automatic type definition checking "];
    if ( ( typeof(params.flags["compiler"] ) != "undefined" && params.flags.hasOwnProperty("compiler") ) ) {
      console.log("---------------------------------------------");
      console.log(" re-compiling the compiler itself ");
      console.log("---------------------------------------------");
      the_file = "ng_Compiler.clj";
    } else {
      if ( (params.values.length) < 1 ) {
        console.log("Ranger compiler, version " + "2.1.65");
        console.log("Installed at: " + operatorsOf_8.installc95directory_51(env));
        console.log("Usage: <file> <options> <flags>");
        console.log("Options: -<option>=<value> ");
        let optCnt = 0;
        while (optCnt < (valid_options.length)) {
          const option = valid_options[optCnt];
          const optionDesc = valid_options[(optCnt + 1)];
          console.log(((("  -" + option) + "=<value> ") + this.fillStr((13 - (option.length)))) + optionDesc);
          optCnt = optCnt + 2;
        };
        console.log("Flags: -<flag> ");
        let optCnt_1 = 0;
        while (optCnt_1 < (valid_flags.length)) {
          const option_1 = valid_flags[optCnt_1];
          const optionDesc_1 = valid_flags[(optCnt_1 + 1)];
          console.log(((("  -" + option_1) + " ") + this.fillStr((13 - (option_1.length)))) + optionDesc_1);
          optCnt_1 = optCnt_1 + 2;
        };
        console.log("Pragmas: (inside the source code files) ");
        let optCnt_2 = 0;
        while (optCnt_2 < (parser_pragmas.length)) {
          const option_2 = parser_pragmas[optCnt_2];
          const optionDesc_2 = parser_pragmas[(optCnt_2 + 1)];
          console.log(((("   " + option_2) + " ") + this.fillStr((16 - (option_2.length)))) + optionDesc_2);
          optCnt_2 = optCnt_2 + 2;
        };
        return res;
      }
      the_file = params.values[0];
    }
    let root_file = the_file;
    const the_lang_file = "Lang.clj";
    let the_lang = "es6";
    let the_target_dir = operatorsOf_8.currentc95directory_51(env) + "/bin";
    let the_target = "output";
    let package_name = "";
    let comp_attrs = {};
    const outDir = params.getParam("o");
    if ( (typeof(outDir) !== "undefined" && outDir != null )  ) {
      the_target = outDir;
    }
    let langLibEnv = operatorsOf_8.envc95var_54(env, "RANGER_LIB");
    if ( false == ((langLibEnv.length) > 0) ) {
      langLibEnv = "/;/lib/";
    }
    const theFilePaths = this.possiblePaths(operatorsOf_8.envc95var_54(env, "RANGER_LIB"));
    const theFilePath = this.searchLib(theFilePaths, the_file);
    if ( operatorsOf_8.filec95exists_9(env, theFilePath, the_file) == false ) {
      console.log("Could not compile.");
      console.log("File not found: " + the_file);
      return res;
    }
    const langFilePaths = this.possiblePaths(this.getEnvVar("RANGER_LIB"));
    const langFilePath = this.searchLib(langFilePaths, the_lang_file);
    if ( operatorsOf_8.filec95exists_9(env, langFilePath, the_lang_file) == false ) {
      console.log(("language file " + the_lang_file) + " not found! Check the library directory or RANGER_LIB enviroment variable");
      console.log("currently pointing at : " + langLibEnv);
      console.log("download: https://raw.githubusercontent.com/terotests/Ranger/master/compiler/Lang.clj");
      return res;
    } else {
      console.log("Using language file from : " + langFilePath);
    }
    console.log("File to be compiled: " + the_file);
    let langFileDirs = this.possiblePaths(this.getEnvVar("RANGER_LIB"));
    const c = await operatorsOf_8.readc95file_9(env, theFilePath, the_file);
    const code = new SourceCode(c);
    code.filename = the_file;
    const parser = new RangerLispParser(code);
    if ( ( typeof(params.flags["no-op-transform"] ) != "undefined" && params.flags.hasOwnProperty("no-op-transform") ) ) {
      parser.disableOperators = true;
    }
    parser.parse(( typeof(params.flags["no-op-transform"] ) != "undefined" && params.flags.hasOwnProperty("no-op-transform") ));
    const root = parser.rootNode;
    console.log("--> ready to compile");
    const flags = Object.keys(params.flags);
    for ( let ci = 0; ci < root.children.length; ci++) {
      var ch = root.children[ci];
      let inserted_nodes = [];
      if ( (ch.children.length) > 2 ) {
        const fc = ch.getFirst();
        if ( fc.vref == "flag" ) {
          const fName = ch.getSecond();
          for ( let i = 0; i < flags.length; i++) {
            var flag_name = flags[i];
            if ( flag_name == fName.vref ) {
              const compInfo = ch.getThird();
              let i_1 = 0;
              const cnt = compInfo.children.length;
              while (i_1 < (cnt - 1)) {
                const fc_1 = compInfo.children[i_1];
                const sc = compInfo.children[(i_1 + 1)];
                switch (fc_1.vref ) { 
                  case "libpath" : 
                    langFileDirs = this.possiblePaths(sc.string_value);
                    break;
                  case "output" : 
                    the_target = sc.string_value;
                    break;
                  case "root-file" : 
                    root_file = sc.string_value;
                    break;
                  case "language" : 
                    the_lang = sc.string_value;
                    break;
                  case "absolute_output_dir" : 
                    the_target_dir = sc.string_value;
                    break;
                  case "relative_output_dir" : 
                    the_target_dir = (operatorsOf_8.currentc95directory_51(env) + "/") + sc.string_value;
                    break;
                  case "package" : 
                    package_name = sc.string_value;
                    break;
                  case "android_res_dir" : 
                    comp_attrs[fc_1.vref] = sc.string_value;
                    break;
                  case "web_res_dir" : 
                    comp_attrs[fc_1.vref] = sc.string_value;
                    break;
                  case "Import" : 
                    inserted_nodes.push(CodeNode.fromList([CodeNode.vref1("Import"), CodeNode.newStr(sc.string_value)]));
                    break;
                  default: 
                    if ( (sc.string_value.length) > 0 ) {
                      comp_attrs[fc_1.vref] = sc.string_value;
                    }
                    break;
                };
                i_1 = i_1 + 2;
              };
            }
          };
          ch.children.length = 0;
          for ( let i_2 = 0; i_2 < inserted_nodes.length; i_2++) {
            var new_node = inserted_nodes[i_2];
            console.log(" *** Inserting " + new_node.getCode());
            root.children.splice(0, 0, new_node);
          };
        }
      }
    };
    root.children.splice(0, 0, CodeNode.fromList([CodeNode.vref1("Import"), CodeNode.newStr("stdlib.clj")]));
    const outDir_2 = params.getParam("o");
    if ( (typeof(outDir_2) !== "undefined" && outDir_2 != null )  ) {
      the_target = outDir_2;
    }
    comp_attrs["o"] = the_target;
    const outDir_3 = params.getParam("d");
    if ( (typeof(outDir_3) !== "undefined" && outDir_3 != null )  ) {
      the_target_dir = (operatorsOf_8.currentc95directory_51(env) + "/") + (outDir_3);
    }
    comp_attrs["d"] = the_target_dir;
    const pLang = params.getParam("l");
    if ( (typeof(pLang) !== "undefined" && pLang != null )  ) {
      the_lang = pLang;
    }
    const appCtx = new RangerAppWriterContext();
    appCtx.env = env;
    appCtx.libraryPaths = langFileDirs;
    appCtx.compilerSettings["package"] = package_name;
    if ( appCtx.hasCompilerFlag("verbose") ) {
      for ( let i_3 = 0; i_3 < appCtx.libraryPaths.length; i_3++) {
        var include_path = appCtx.libraryPaths[i_3];
        console.log("include-path : " + include_path);
      };
    }
    operatorsOf_13.forEach_55(params.flags, ((item, index) => { 
      const n = index;
      appCtx.compilerFlags[n] = true;
    }));
    operatorsOf_13.forEach_40(params.params, ((item, index) => { 
      const v = item;
      comp_attrs[index] = v;
    }));
    operatorsOf_13.forEach_40(comp_attrs, ((item, index) => { 
      const n_1 = item;
      appCtx.compilerSettings[index] = n_1;
    }));
    if ( (allowed_languages.indexOf(the_lang)) < 0 ) {
      console.log("Invalid language : " + the_lang);
      /** unused:  const s = ""   **/ 
      console.log("allowed languages: " + (allowed_languages.join(" ")));
      return res;
    }
    appCtx.compilerSettings["l"] = the_lang;
    if ( the_target == "output" ) {
      const root_parts = root_file.split(".");
      if ( (root_parts.length) == 2 ) {
        the_target = root_parts[0];
      }
      switch (the_lang ) { 
        case "es6" : 
          the_target = the_target + ".js";
          if ( appCtx.hasCompilerFlag("typescript") ) {
            the_target = the_target + ".ts";
          }
          break;
        case "swift3" : 
          the_target = the_target + ".swift";
          break;
        case "php" : 
          the_target = the_target + ".php";
          break;
        case "csharp" : 
          the_target = the_target + ".cs";
          break;
        case "java7" : 
          the_target = the_target + ".java";
          break;
        case "go" : 
          the_target = the_target + ".go";
          break;
        case "scala" : 
          the_target = the_target + ".scala";
          break;
        case "cpp" : 
          the_target = the_target + ".cpp";
          break;
      };
    }
    appCtx.compilerSettings["o"] = the_target;
    const lcc = new LiveCompiler();
    const node = parser.rootNode;
    const flowParser = new RangerFlowParser();
    const fileSystem = new CodeFileSystem();
    const file = fileSystem.getFile(".", the_target);
    let wr = file.getWriter();
    if ( appCtx.hasCompilerFlag("copysrc") ) {
      console.log("--> copying " + code.filename);
      const fileWr = wr.getFileWriter(".", code.filename);
      fileWr.raw(code.code, false);
    }
    appCtx.parser = flowParser;
    appCtx.compiler = lcc;
    lcc.parser = flowParser;
    if ( appCtx.hasCompilerSetting("plugins") ) {
      const val = appCtx.getCompilerSetting("plugins");
      const list = val.split(",");
      await operatorsOf.forEach_12(list, (async (item, index) => { 
        try {
          const plugin = require( item );
          const features = (new plugin.Plugin () ).features();
          if ( appCtx.hasCompilerFlag("verbose") ) {
            console.log(("Plugin " + item) + " registered with features ");
            await operatorsOf.forEach_12(features, ((item, index) => { 
              console.log(" [x] " + item);
            }));
          }
          const regPlug = new RangerRegisteredPlugin();
          regPlug.name = item;
          regPlug.features = operatorsOf.clone_56(features);
          appCtx.addPlugin(regPlug);
        } catch(e) {
          console.log("Failed to register plugin " + item);
        }
      }));
    }
    plugins_only = appCtx.hasCompilerFlag("plugins-only");
    try {
      await flowParser.mergeImports(node, appCtx, wr);
      const lang_str = await operatorsOf_8.readc95file_9(env, langFilePath, the_lang_file);
      const lang_code = new SourceCode(lang_str);
      lang_code.filename = the_lang_file;
      const lang_parser = new RangerLispParser(lang_code);
      lang_parser.parse(false);
      appCtx.langOperators = lang_parser.rootNode;
      appCtx.setRootFile(root_file);
      const ops = new RangerActiveOperators();
      ops.initFrom(lang_parser.rootNode);
      appCtx.operators = ops;
      appCtx.targetLangName = the_lang;
      lcc.initWriter(appCtx);
      console.log("--- context inited ---");
      console.log("1. Collecting available methods.");
      await flowParser.CollectMethods(node, appCtx, wr);
      if ( (appCtx.compilerErrors.length) > 0 ) {
        VirtualCompiler.displayCompilerErrors(appCtx);
        return res;
      }
      await flowParser.CreateCTTI(node, appCtx, wr);
      if ( appCtx.hasCompilerFlag("rtti") ) {
        await flowParser.CreateRTTI(node, appCtx, wr);
      }
      const ppList = appCtx.findPluginsFor("pre_flow");
      await operatorsOf.forEach_12(ppList, ((item, index) => { 
        try {
          const plugin_1 = require( item );
          ( (new plugin_1.Plugin () )["pre_flow"] )( root, appCtx , wr );
        } catch(e) {
        }
      }));
      await appCtx.initOpList();
      console.log("2. Analyzing the code.");
      console.log("selected language is " + appCtx.targetLangName);
      await flowParser.StartWalk(node, appCtx, wr);
      await flowParser.SolveAsyncFuncs(root, appCtx, wr);
      console.log("3. Compiling the source code.");
      switch (appCtx.targetLangName ) { 
        case "java7" : 
          if ( ( typeof(comp_attrs["android_res_dir"] ) != "undefined" && comp_attrs.hasOwnProperty("android_res_dir") ) ) {
            console.log("--> had android res dir");
            const resDir = (comp_attrs["android_res_dir"]);
            const resFs = new CodeFileSystem();
            const file_2 = resFs.getFile(".", "README.txt");
            const wr_2 = file_2.getWriter();
            const builder = new viewbuilder_Android();
            await operatorsOf_13.forEach_25(appCtx.viewClassBody, (async (item, index) => { 
              await builder.writeClass(item, appCtx, wr_2);
            }));
            resFs.saveTo(resDir, appCtx.hasCompilerFlag("show-writes"));
          }
          break;
        case "es6" : 
          if ( ( typeof(comp_attrs["web_res_dir"] ) != "undefined" && comp_attrs.hasOwnProperty("web_res_dir") ) ) {
            console.log("--> had web res dir");
            const resDir_1 = (comp_attrs["web_res_dir"]);
            const resFs_1 = new CodeFileSystem();
            const file_3 = resFs_1.getFile(".", "webviews.html");
            const wr_3 = file_3.getWriter();
            const builder_1 = new viewbuilder_Web();
            await builder_1.CreateViews(appCtx, wr_3);
            resFs_1.saveTo(resDir_1, appCtx.hasCompilerFlag("show-writes"));
          }
          break;
      };
      let staticMethods;
      const importFork = wr.fork();
      const contentFork = wr.fork();
      /** unused:  const theEnd = wr.createTag("file_end")   **/ 
      wr = contentFork;
      let handledClasses = {};
      for ( let i_4 = 0; i_4 < appCtx.definedClassList.length; i_4++) {
        var cName = appCtx.definedClassList[i_4];
        if ( cName == "RangerStaticMethods" ) {
          staticMethods = appCtx.definedClasses[cName];
          continue;
        }
        const cl = appCtx.definedClasses[cName];
        if ( cl.is_operator_class ) {
          continue;
        }
        if ( cl.is_trait ) {
          continue;
        }
        if ( cl.is_system ) {
          continue;
        }
        if ( cl.is_generic_instance ) {
          continue;
        }
        if ( cl.is_system_union ) {
          continue;
        }
        if ( cl.is_union ) {
          continue;
        }
        if ( ( typeof(handledClasses[cName] ) != "undefined" && handledClasses.hasOwnProperty(cName) ) ) {
          continue;
        }
        handledClasses[cName] = true;
        if ( (cl.extends_classes.length) > 0 ) {
          for ( let i_5 = 0; i_5 < cl.extends_classes.length; i_5++) {
            var eClassName = cl.extends_classes[i_5];
            if ( ( typeof(handledClasses[eClassName] ) != "undefined" && handledClasses.hasOwnProperty(eClassName) ) ) {
              continue;
            }
            const parentCl = appCtx.definedClasses[eClassName];
            await lcc.WalkNode(parentCl.classNode, appCtx, wr);
            handledClasses[eClassName] = true;
          };
        }
        await lcc.WalkNode(cl.classNode, appCtx, wr);
      };
      if ( (typeof(staticMethods) !== "undefined" && staticMethods != null )  ) {
        await lcc.WalkNode(staticMethods.classNode, appCtx, wr);
      }
      for ( let i_6 = 0; i_6 < flowParser.collectedIntefaces.length; i_6++) {
        var ifDesc = flowParser.collectedIntefaces[i_6];
        console.log("should define also interface " + ifDesc.name);
        await lcc.langWriter.writeInterface(ifDesc, appCtx, wr);
      };
      for ( let i_7 = 0; i_7 < appCtx.definedClassList.length; i_7++) {
        var cName_1 = appCtx.definedClassList[i_7];
        if ( ( typeof(handledClasses[cName_1] ) != "undefined" && handledClasses.hasOwnProperty(cName_1) ) ) {
          continue;
        }
        if ( cName_1 == "RangerStaticMethods" ) {
          staticMethods = appCtx.definedClasses[cName_1];
          continue;
        }
        const cl_1 = appCtx.definedClasses[cName_1];
        if ( cl_1.is_operator_class ) {
          continue;
        }
        if ( cl_1.is_generic_instance ) {
          await lcc.WalkNode(cl_1.classNode, appCtx, wr);
        }
        if ( cl_1.is_trait ) {
          continue;
        }
        if ( cl_1.is_system ) {
          continue;
        }
        if ( cl_1.is_operator_class ) {
          continue;
        }
        if ( cl_1.is_generic_instance ) {
          continue;
        }
        if ( cl_1.is_system_union ) {
          continue;
        }
        if ( cl_1.is_union ) {
          continue;
        }
        await lcc.WalkNode(cl_1.classNode, appCtx, wr);
      };
      for ( let i_8 = 0; i_8 < appCtx.definedClassList.length; i_8++) {
        var cName_2 = appCtx.definedClassList[i_8];
        const cl_2 = appCtx.definedClasses[cName_2];
        if ( cl_2.is_operator_class ) {
          await lcc.WalkNode(cl_2.classNode, appCtx, wr);
        }
      };
      const import_list = wr.getImports();
      if ( appCtx.targetLangName == "go" ) {
        importFork.out("package main", true);
        importFork.newline();
        importFork.out("import (", true);
        importFork.indent(1);
      }
      let added_import = {};
      for ( let i_9 = 0; i_9 < import_list.length; i_9++) {
        var codeStr = import_list[i_9];
        if ( ( typeof(added_import[codeStr] ) != "undefined" && added_import.hasOwnProperty(codeStr) ) ) {
          continue;
        }
        added_import[codeStr] = true;
        switch (appCtx.targetLangName ) { 
          case "es6" : 
            const parts = codeStr.split(".");
            const p0 = parts[0];
            if ( (parts.length) > 1 ) {
              const p1 = parts[1];
              importFork.out(((((("const " + p1) + " = require('") + p0) + "').") + p1) + ";", true);
            }
            if ( (parts.length) == 1 ) {
              importFork.out(((("const " + p0) + " = require('") + p0) + "');", true);
            }
            break;
          case "go" : 
            if ( (codeStr.charCodeAt(0 )) == (("_".charCodeAt(0))) ) {
              importFork.out((" _ \"" + (codeStr.substring(1, (codeStr.length) ))) + "\"", true);
            } else {
              importFork.out(("\"" + codeStr) + "\"", true);
            }
            break;
          case "csharp" : 
            importFork.out(("using " + codeStr) + ";", true);
            break;
          case "rust" : 
            importFork.out(("use " + codeStr) + ";", true);
            break;
          case "java7" : 
            importFork.out(("import " + codeStr) + ";", true);
            break;
          case "cpp" : 
            importFork.out("#include  " + codeStr, true);
            break;
          default: 
            importFork.out("import " + codeStr, true);
            break;
        };
      };
      if ( appCtx.targetLangName == "go" ) {
        importFork.indent(-1);
        importFork.out(")", true);
      }
      if ( appCtx.hasCompilerSetting("classdoc") ) {
        const gen = new RangerDocGenerator();
        await gen.createClassDoc(root, appCtx, wr);
      }
      if ( appCtx.hasCompilerSetting("operatordoc") ) {
        const gen_1 = new RangerDocGenerator();
        await gen_1.createOperatorDoc(root, appCtx, wr);
      }
      VirtualCompiler.displayCompilerErrors(appCtx);
      res.target_dir = the_target_dir;
      res.fileSystem = fileSystem;
      res.ctx = appCtx;
    } catch(e) {
      console.log(( e.toString()));
      if ( typeof(lcc.lastProcessedNode) != "undefined" ) {
        console.log("Got compiler error close to");
        console.log(lcc.lastProcessedNode.getLineAsString());
        return res;
      }
      if ( typeof(flowParser.lastProcessedNode) != "undefined" ) {
        console.log("Got compiler error close to");
        console.log(flowParser.lastProcessedNode.getLineAsString());
        return res;
      }
      console.log("Got unknown compiler error");
    }
    return res;
  };
}
VirtualCompiler.create_env = async function() {
  const env = new InputEnv();
  env.filesystem = new InputFSFolder();
  env.commandLine = new CmdParams();
  operatorsOf_3.createc95file_4(env.filesystem, "Lang.clj", (await (new Promise(resolve => { require('fs').readFile( "." + '/' + "Lang.clj" , 'utf8', (err,data)=>{ resolve(data) }) } ))));
  operatorsOf_3.createc95file_4(env.filesystem, "stdlib.clj", (await (new Promise(resolve => { require('fs').readFile( "../lib/" + '/' + "stdlib.clj" , 'utf8', (err,data)=>{ resolve(data) }) } ))));
  operatorsOf_3.createc95file_4(env.filesystem, "stdops.clj", (await (new Promise(resolve => { require('fs').readFile( "../lib/" + '/' + "stdops.clj" , 'utf8', (err,data)=>{ resolve(data) }) } ))));
  operatorsOf_3.createc95file_4(env.filesystem, "Timers.clj", (await (new Promise(resolve => { require('fs').readFile( "../lib/" + '/' + "Timers.clj" , 'utf8', (err,data)=>{ resolve(data) }) } ))));
  operatorsOf_3.createc95file_4(env.filesystem, "DOMLib.clj", (await (new Promise(resolve => { require('fs').readFile( "../lib/" + '/' + "DOMLib.clj" , 'utf8', (err,data)=>{ resolve(data) }) } ))));
  operatorsOf_3.createc95file_4(env.filesystem, "Ajax.clj", (await (new Promise(resolve => { require('fs').readFile( "../lib/" + '/' + "Ajax.clj" , 'utf8', (err,data)=>{ resolve(data) }) } ))));
  operatorsOf_3.createc95file_4(env.filesystem, "Crypto.clj", (await (new Promise(resolve => { require('fs').readFile( "../lib/" + '/' + "Crypto.clj" , 'utf8', (err,data)=>{ resolve(data) }) } ))));
  operatorsOf_3.createc95file_4(env.filesystem, "Engine3D.clj", (await (new Promise(resolve => { require('fs').readFile( "../lib/" + '/' + "Engine3D.clj" , 'utf8', (err,data)=>{ resolve(data) }) } ))));
  operatorsOf_3.createc95file_4(env.filesystem, "Storage.clj", (await (new Promise(resolve => { require('fs').readFile( "../lib/" + '/' + "Storage.clj" , 'utf8', (err,data)=>{ resolve(data) }) } ))));
  operatorsOf_3.createc95file_4(env.filesystem, "JSON.clj", (await (new Promise(resolve => { require('fs').readFile( "../lib/" + '/' + "JSON.clj" , 'utf8', (err,data)=>{ resolve(data) }) } ))));
  operatorsOf_3.createc95file_4(env.filesystem, "hello_world.clj", "\r\n\r\nclass tester {\r\n  static fn main () {\r\n    print \"Hello World!\"\r\n  }\r\n}\r\n\r\n    ");
  require("fs").writeFileSync( "." + "/"  + "compileEnv.js", "window._Ranger_compiler_environment_ = " + (JSON.stringify(env.toDictionary())));
};
VirtualCompiler.test_compilation = async function() {
  try {
    console.log("Virtual compiler compiled OK...");
    const env = await InputEnv.fromDictionary((window._Ranger_compiler_environment_));
    env.commandLine.params["l"] = "es6";
    env.commandLine.values.push("hello_world.clj");
    const virtualComp = new VirtualCompiler();
    const res = await virtualComp.run(env);
    console.log("Results of the compile:");
    if ( (typeof(res.fileSystem) !== "undefined" && res.fileSystem != null )  ) {
      operatorsOf.forEach_57(res.fileSystem.files, ((item, index) => { 
        console.log("FILE " + item.name);
        console.log(item.getCode());
      }));
    }
  } catch(e) {
  }
};
VirtualCompiler.displayCompilerErrors = function(appCtx) {
  const cons = new ColorConsole();
  for ( let i = 0; i < appCtx.compilerErrors.length; i++) {
    var e = appCtx.compilerErrors[i];
    const line_index = e.node.getLine();
    cons.out("gray", (e.node.getFilename() + " Line: ") + (1 + line_index));
    cons.out("gray", e.description);
    cons.out("gray", e.node.getLineString(line_index));
    cons.out("", e.node.getColStartString() + "^-------");
  };
};
VirtualCompiler.displayParserErrors = function(appCtx) {
  if ( (appCtx.parserErrors.length) == 0 ) {
    console.log("no language test errors");
    return;
  }
  console.log("LANGUAGE TEST ERRORS:");
  for ( let i = 0; i < appCtx.parserErrors.length; i++) {
    var e = appCtx.parserErrors[i];
    const line_index = e.node.getLine();
    console.log((e.node.getFilename() + " Line: ") + (1 + line_index));
    console.log(e.description);
    console.log(e.node.getLineString(line_index));
  };
};
class CompilerInterface  {
  constructor() {
  }
}
CompilerInterface.create_env = function() {
  const env = new InputEnv();
  env.use_real = true;
  env.commandLine = new CmdParams();
  env.commandLine.collect();
  return env;
};
class operatorsOf  {
  constructor() {
  }
}
operatorsOf.forEach_2 = function(__self, cb) {
  for ( let i = 0; i < __self.length; i++) {
    var it = __self[i];
    cb(it, i);
  };
};
operatorsOf.filter_6 = function(__self, cb) {
  let res_1 = [];
  for ( let i_1 = 0; i_1 < __self.length; i_1++) {
    var it_1 = __self[i_1];
    if ( cb(it_1, i_1) ) {
      res_1.push(it_1);
    }
  };
  return res_1;
};
operatorsOf.filter_7 = function(__self, cb) {
  let res_2 = [];
  for ( let i_2 = 0; i_2 < __self.length; i_2++) {
    var it_2 = __self[i_2];
    if ( cb(it_2, i_2) ) {
      res_2.push(it_2);
    }
  };
  return res_2;
};
operatorsOf.forEach_10 = function(__self, cb) {
  for ( let i_4 = 0; i_4 < __self.length; i_4++) {
    var it_3 = __self[i_4];
    cb(it_3, i_4);
  };
};
operatorsOf.forEach_11 = function(__self, cb) {
  for ( let i_5 = 0; i_5 < __self.length; i_5++) {
    var it_4 = __self[i_5];
    cb(it_4, i_5);
  };
};
operatorsOf.forEach_12 = async function(__self, cb) {
  for ( let i_6 = 0; i_6 < __self.length; i_6++) {
    var it_5 = __self[i_6];
    await cb(it_5, i_6);
  };
};
operatorsOf.forEach_15 = async function(__self, cb) {
  for ( let i_8 = 0; i_8 < __self.length; i_8++) {
    var it_6 = __self[i_8];
    await cb(it_6, i_8);
  };
};
operatorsOf.forEach_17 = async function(__self, cb) {
  for ( let i_10 = 0; i_10 < __self.length; i_10++) {
    var it_7 = __self[i_10];
    await cb(it_7, i_10);
  };
};
operatorsOf.clone_18 = function(__self) {
  let res_5 = [];
  for ( let i_11 = 0; i_11 < __self.length; i_11++) {
    var it_8 = __self[i_11];
    res_5.push(it_8);
  };
  return res_5;
};
operatorsOf.forEach_29 = async function(__self, cb) {
  for ( let i_15 = 0; i_15 < __self.length; i_15++) {
    var it_9 = __self[i_15];
    await cb(it_9, i_15);
  };
};
operatorsOf.forEach_31 = function(__self, cb) {
  for ( let i_17 = 0; i_17 < __self.length; i_17++) {
    var it_10 = __self[i_17];
    cb(it_10, i_17);
  };
};
operatorsOf.filter_32 = function(__self, cb) {
  let res_6 = [];
  for ( let i_18 = 0; i_18 < __self.length; i_18++) {
    var it_11 = __self[i_18];
    if ( cb(it_11, i_18) ) {
      res_6.push(it_11);
    }
  };
  return res_6;
};
operatorsOf.filter_36 = function(__self, cb) {
  let res_7 = [];
  for ( let i_19 = 0; i_19 < __self.length; i_19++) {
    var it_12 = __self[i_19];
    if ( cb(it_12, i_19) ) {
      res_7.push(it_12);
    }
  };
  return res_7;
};
operatorsOf.forEach_37 = function(__self, cb) {
  for ( let i_20 = 0; i_20 < __self.length; i_20++) {
    var it_13 = __self[i_20];
    cb(it_13, i_20);
  };
};
operatorsOf.map_44 = function(__self, cb) {
  /** unused:  const __len = __self.length   **/ 
  let res_8 = [];
  for ( let i_23 = 0; i_23 < __self.length; i_23++) {
    var it_14 = __self[i_23];
    res_8.push(cb(it_14, i_23));
  };
  return res_8;
};
operatorsOf.map_45 = function(__self, cb) {
  /** unused:  const len_1 = __self.length   **/ 
  let res_9 = [];
  for ( let i_24 = 0; i_24 < __self.length; i_24++) {
    var it_15 = __self[i_24];
    res_9.push(cb(it_15, i_24));
  };
  return res_9;
};
operatorsOf.clone_46 = function(__self) {
  let res_10 = [];
  for ( let i_25 = 0; i_25 < __self.length; i_25++) {
    var it_16 = __self[i_25];
    res_10.push(it_16);
  };
  return res_10;
};
operatorsOf.map_47 = function(__self, cb) {
  /** unused:  const len_2 = __self.length   **/ 
  let res_11 = [];
  for ( let i_26 = 0; i_26 < __self.length; i_26++) {
    var it_17 = __self[i_26];
    res_11.push(cb(it_17, i_26));
  };
  return res_11;
};
operatorsOf.filter_50 = function(__self, cb) {
  let res_12 = [];
  for ( let i_27 = 0; i_27 < __self.length; i_27++) {
    var it_18 = __self[i_27];
    if ( cb(it_18, i_27) ) {
      res_12.push(it_18);
    }
  };
  return res_12;
};
operatorsOf.filter_52 = function(__self, cb) {
  let res_13 = [];
  for ( let i_28 = 0; i_28 < __self.length; i_28++) {
    var it_19 = __self[i_28];
    if ( cb(it_19, i_28) ) {
      res_13.push(it_19);
    }
  };
  return res_13;
};
operatorsOf.groupBy_53 = function(__self, cb) {
  let res_14 = [];
  let mapper = {};
  for ( let i_29 = 0; i_29 < __self.length; i_29++) {
    var it_20 = __self[i_29];
    const key = cb(it_20);
    if ( false == (( typeof(mapper[key] ) != "undefined" && mapper.hasOwnProperty(key) )) ) {
      res_14.push(it_20);
      mapper[key] = true;
    }
  };
  return res_14;
};
operatorsOf.clone_56 = function(__self) {
  let res_15 = [];
  for ( let i_31 = 0; i_31 < __self.length; i_31++) {
    var it_21 = __self[i_31];
    res_15.push(it_21);
  };
  return res_15;
};
operatorsOf.forEach_57 = function(__self, cb) {
  for ( let i_32 = 0; i_32 < __self.length; i_32++) {
    var it_22 = __self[i_32];
    cb(it_22, i_32);
  };
};
class operatorsOfInputFSFolder_3  {
  constructor() {
  }
}
operatorsOfInputFSFolder_3.createc95file_4 = function(fs, name, data) {
  const f_1 = operatorsOf_3.createc95file_5(fs, name);
  if ( (typeof(f_1) !== "undefined" && f_1 != null )  ) {
    f_1.data = data;
  }
  return f_1;
};
class operatorsOf_3  {
  constructor() {
  }
}
operatorsOf_3.createc95file_5 = function(fs, name) {
  let res;
  const files = operatorsOf.filter_6(fs.files, ((item, index) => { 
    return item.name == name;
  }));
  const folders = operatorsOf.filter_7(fs.folders, ((item, index) => { 
    return item.name == name;
  }));
  if ( false == ((folders.length) > 0) ) {
    if ( (files.length) > 0 ) {
      res = files[0];
    } else {
      const f = new InputFSFile();
      f.name = name;
      fs.files.push(f);
      res = f;
    }
  }
  return res;
};
operatorsOf_3.createc95file_4 = function(fs, name, data) {
  const f_2 = operatorsOf_3.createc95file_5(fs, name);
  if ( (typeof(f_2) !== "undefined" && f_2 != null )  ) {
    f_2.data = data;
  }
  return f_2;
};
operatorsOf_3.createc95folder_5 = function(fs, name) {
  let res_3;
  const files_1 = operatorsOf.filter_6(fs.files, ((item, index) => { 
    return item.name == name;
  }));
  const folders_1 = operatorsOf.filter_7(fs.folders, ((item, index) => { 
    return item.name == name;
  }));
  if ( false == ((files_1.length) > 0) ) {
    if ( (folders_1.length) > 0 ) {
      res_3 = folders_1[0];
    } else {
      const f_3 = new InputFSFolder();
      f_3.name = name;
      fs.folders.push(f_3);
      res_3 = f_3;
    }
  }
  return res_3;
};
class operatorsOfInputEnv_8  {
  constructor() {
  }
}
operatorsOfInputEnv_8.readc95file_9 = async function(env, path, name) {
  if ( env.use_real ) {
    return await (new Promise(resolve => { require('fs').readFile( path + '/' + name , 'utf8', (err,data)=>{ resolve(data) }) } ));
  }
  let resStr;
  const f_4 = operatorsOf_8.findc95file_9(env, path, name);
  if ( (typeof(f_4) !== "undefined" && f_4 != null )  ) {
    resStr = f_4.data;
  }
  return resStr;
};
class operatorsOf_8  {
  constructor() {
  }
}
operatorsOf_8.findc95file_9 = function(env, path, name) {
  let res_4;
  if ( path == "/" ) {
    const files_2 = operatorsOf.filter_6(env.filesystem.files, ((item, index) => { 
      return item.name == name;
    }));
    if ( (files_2.length) > 0 ) {
      res_4 = files_2[0];
    }
    return res_4;
  }
  const parts = path.split("/");
  let fold = env.filesystem;
  let i_3 = 0;
  while (((parts.length) > i_3) && ((typeof(fold) !== "undefined" && fold != null ) )) {
    const pathName = parts[i_3];
    if ( (pathName.length) > 0 ) {
      const folder = operatorsOf.filter_7(fold.folders, ((item, index) => { 
        return item.name == pathName;
      }));
      if ( (folder.length) > 0 ) {
        fold = folder[0];
      } else {
        return res_4;
      }
    }
    i_3 = i_3 + 1;
  };
  if ( (typeof(fold) !== "undefined" && fold != null )  ) {
    const files_3 = operatorsOf.filter_6(fold.files, ((item, index) => { 
      return item.name == name;
    }));
    if ( (files_3.length) > 0 ) {
      res_4 = files_3[0];
    }
  }
  return res_4;
};
operatorsOf_8.readc95file_9 = async function(env, path, name) {
  if ( env.use_real ) {
    return await (new Promise(resolve => { require('fs').readFile( path + '/' + name , 'utf8', (err,data)=>{ resolve(data) }) } ));
  }
  let resStr_1;
  const f_5 = operatorsOf_8.findc95file_9(env, path, name);
  if ( (typeof(f_5) !== "undefined" && f_5 != null )  ) {
    resStr_1 = f_5.data;
  }
  return resStr_1;
};
operatorsOf_8.filec95exists_9 = function(env, path, name) {
  if ( env.use_real ) {
    return require("fs").existsSync(path + "/" + name );
  }
  const fo = operatorsOf_8.findc95file_9(env, path, name);
  return (typeof(fo) !== "undefined" && fo != null ) ;
};
operatorsOf_8.installc95directory_51 = function(env) {
  if ( env.use_real ) {
    return __dirname;
  }
  return "/";
};
operatorsOf_8.envc95var_54 = function(env, name) {
  if ( env.use_real ) {
    const ev = process.env[name];
    if ( (typeof(ev) !== "undefined" && ev != null )  ) {
      return ev;
    }
    return "";
  }
  return ((typeof((env.envVars[name])) !== "undefined" && (env.envVars[name]) != null ) ) ? ((env.envVars[name])) : "";
};
operatorsOf_8.currentc95directory_51 = function(env) {
  if ( env.use_real ) {
    return process.cwd();
  }
  return "/";
};
class operatorsOf_13  {
  constructor() {
  }
}
operatorsOf_13.forEach_14 = async function(__self, cb) {
  const list = Object.keys(__self);
  for ( let i_7 = 0; i_7 < list.length; i_7++) {
    var kk = list[i_7];
    const value = (__self[kk]);
    await cb(value, kk);
  };
};
operatorsOf_13.forEach_16 = async function(__self, cb) {
  const list_1 = Object.keys(__self);
  for ( let i_9 = 0; i_9 < list_1.length; i_9++) {
    var kk_1 = list_1[i_9];
    const value_1 = (__self[kk_1]);
    await cb(value_1, kk_1);
  };
};
operatorsOf_13.forEach_19 = async function(__self, cb) {
  const list_2 = Object.keys(__self);
  for ( let i_12 = 0; i_12 < list_2.length; i_12++) {
    var kk_2 = list_2[i_12];
    const value_2 = (__self[kk_2]);
    await cb(value_2, kk_2);
  };
};
operatorsOf_13.forEach_20 = async function(__self, cb) {
  const list_3 = Object.keys(__self);
  for ( let i_13 = 0; i_13 < list_3.length; i_13++) {
    var kk_3 = list_3[i_13];
    const value_3 = (__self[kk_3]);
    await cb(value_3, kk_3);
  };
};
operatorsOf_13.forEach_25 = async function(__self, cb) {
  const list_4 = Object.keys(__self);
  for ( let i_14 = 0; i_14 < list_4.length; i_14++) {
    var kk_4 = list_4[i_14];
    const value_4 = (__self[kk_4]);
    await cb(value_4, kk_4);
  };
};
operatorsOf_13.forEach_30 = async function(__self, cb) {
  const list_5 = Object.keys(__self);
  for ( let i_16 = 0; i_16 < list_5.length; i_16++) {
    var kk_5 = list_5[i_16];
    const value_5 = (__self[kk_5]);
    await cb(value_5, kk_5);
  };
};
operatorsOf_13.forEach_40 = function(__self, cb) {
  const list_6 = Object.keys(__self);
  for ( let i_22 = 0; i_22 < list_6.length; i_22++) {
    var kk_6 = list_6[i_22];
    const value_6 = (__self[kk_6]);
    cb(value_6, kk_6);
  };
};
operatorsOf_13.forEach_55 = function(__self, cb) {
  const list_7 = Object.keys(__self);
  for ( let i_30 = 0; i_30 < list_7.length; i_30++) {
    var kk_7 = list_7[i_30];
    const value_7 = (__self[kk_7]);
    cb(value_7, kk_7);
  };
};
class operatorsOfRangerAppWriterContext_21  {
  constructor() {
  }
}
operatorsOfRangerAppWriterContext_21.getTargetLang_22 = function(__self) {
  if ( (__self.targetLangName.length) > 0 ) {
    return __self.targetLangName;
  }
  if ( typeof(__self.parent) != "undefined" ) {
    return operatorsOf_21.getTargetLang_22((__self.parent));
  }
  return "ranger";
};
class operatorsOf_21  {
  constructor() {
  }
}
operatorsOf_21.getTargetLang_22 = function(__self) {
  if ( (__self.targetLangName.length) > 0 ) {
    return __self.targetLangName;
  }
  if ( typeof(__self.parent) != "undefined" ) {
    return operatorsOf_21.getTargetLang_22((__self.parent));
  }
  return "ranger";
};
operatorsOf_21.addUsage_28 = function(__self, cn) {
  const ctx = __self;
  const currM = ctx.getCurrentMethod();
  if ( ctx.isDefinedClass(cn.type_name) ) {
    const cl = ctx.findClass(cn.type_name);
    currM.addClassUsage(cl, ctx);
  }
  if ( ctx.isDefinedClass(cn.eval_type_name) ) {
    const cl_1 = ctx.findClass(cn.eval_type_name);
    currM.addClassUsage(cl_1, ctx);
  }
  if ( ctx.isDefinedClass(cn.eval_array_type) ) {
    const cl_2 = ctx.findClass(cn.eval_array_type);
    currM.addClassUsage(cl_2, ctx);
  }
};
operatorsOf_21.getActiveTransaction_22 = function(c) {
  let rValue;
  if ( (c.activeTransaction.length) > 0 ) {
    rValue = c.activeTransaction[((c.activeTransaction.length) - 1)];
  } else {
    if ( (typeof(c.parent) !== "undefined" && c.parent != null )  ) {
      return operatorsOf_21.getActiveTransaction_22((c.parent));
    }
  }
  return rValue;
};
operatorsOf_21.createc95var_48 = function(__self, name, type_name) {
  const fieldNode = CodeNode.vref2(name, type_name);
  fieldNode.value_type = fieldNode.typeNameAsType(__self);
  const p_2 = new RangerAppParamDesc();
  p_2.name = name;
  p_2.value_type = fieldNode.value_type;
  p_2.node = fieldNode;
  p_2.nameNode = fieldNode;
  p_2.is_optional = false;
  __self.defineVariable(p_2.name, p_2);
  return p_2;
};
operatorsOf_21.createc95var_49 = function(__self, name, usingNode) {
  /** unused:  const fieldNode_1 = CodeNode.vref1(name)   **/ 
  const p_3 = new RangerAppParamDesc();
  p_3.name = name;
  p_3.value_type = usingNode.value_type;
  p_3.node = usingNode;
  p_3.nameNode = usingNode;
  p_3.is_optional = false;
  __self.defineVariable(p_3.name, p_3);
  return p_3;
};
class operatorsOfchar_23  {
  constructor() {
  }
}
operatorsOfchar_23.isc95notc95limiter_24 = function(c) {
  return (((((c > 32) && (c != (59))) && (c != (41))) && (c != (40))) && (c != (125))) && (c != (44));
};
class operatorsOfRangerFlowParser_26  {
  constructor() {
  }
}
operatorsOfRangerFlowParser_26.EnterVarDef_27 = async function(__self, node, ctx, wr) {
  if ( ctx.isInMethod() ) {
    if ( (node.children.length) < 2 ) {
      ctx.addError(node, "invalid variable definition");
      return;
    }
    const tName = node.getSecond();
    await __self.CheckTypeAnnotationOf(tName, ctx, wr);
    if ( tName.expression ) {
      node.children.splice(1, 1);
      await operatorsOf.forEach_15(tName.children, ((item, index) => { 
        if ( index == 1 ) {
          if ( item.expression ) {
            node.children.push(((item.children[0])).copy());
          } else {
            node.children.push(item.copy());
          }
        }
        if ( index > 1 ) {
          node.children.push(item.copy());
        }
      }));
    }
    if ( (node.children.length) > 3 ) {
      ctx.addError(node, "invalid variable definition");
      return;
    }
    const cn = node.children[1];
    const p = new RangerAppParamDesc();
    let defaultArg;
    let is_immutable = false;
    cn.definedTypeClass = TFactory.new_def_signature(cn, ctx, wr);
    if ( (node.children.length) == 2 ) {
      if ( (cn.value_type != 6) && (cn.value_type != 7) ) {
        if ( false == cn.hasFlag("unwrap") ) {
          cn.setFlag("optional");
        }
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
    if ( (node.children.length) > 2 ) {
      p.init_cnt = 1;
      p.def_value = node.children[2];
      p.is_optional = false;
      defaultArg = node.children[2];
      ctx.setInExpr();
      await __self.WalkNode(defaultArg, ctx, wr);
      ctx.unsetInExpr();
      if ( defaultArg.hasFlag("optional") ) {
        cn.setFlag("optional");
      }
      if ( defaultArg.hasFlag("immutable") ) {
        cn.setFlag("immutable");
      }
      if ( defaultArg.hasParamDesc ) {
        const paramDesc = defaultArg.paramDesc;
        if ( (typeof(paramDesc.propertyClass) !== "undefined" && paramDesc.propertyClass != null )  ) {
          if ( paramDesc.propertyClass.nameNode.hasFlag("immutable") ) {
            if ( (defaultArg.eval_type == 6) || (defaultArg.eval_type == 7) ) {
              is_immutable = true;
            }
          }
        }
        if ( paramDesc.is_immutable ) {
          is_immutable = true;
        }
      }
      if ( defaultArg.eval_type == 6 ) {
        node.op_index = 1;
      }
      if ( cn.value_type == 13 ) {
        cn.eval_type_name = defaultArg.ns[0];
      }
      if ( cn.value_type == 14 ) {
        if ( (defaultArg.eval_type != 3) && (defaultArg.eval_type != 14) ) {
          ctx.addError(defaultArg, "Char should be assigned char or integer value --> " + defaultArg.getCode());
        } else {
          defaultArg.eval_type = 14;
        }
      }
    } else {
      if ( ((cn.value_type != 7) && (cn.value_type != 6)) && (false == cn.hasFlag("optional")) ) {
        if ( cn.hasFlag("unwrap") ) {
        } else {
          cn.setFlag("optional");
        }
      }
    }
    if ( (node.children.length) > 2 ) {
      if ( ((cn.type_name.length) == 0) && ((cn.array_type.length) == 0) ) {
        cn.inferDefTypeFromValue(node);
        if ( cn.value_type == 17 ) {
          cn.eval_type = 17;
        }
      }
    }
    ctx.hadValidType(cn);
    cn.defineNodeTypeTo(cn, ctx);
    p.name = cn.vref;
    if ( p.value_type == 0 ) {
      if ( (0 == (cn.type_name.length)) && ((typeof(defaultArg) !== "undefined" && defaultArg != null ) ) ) {
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
    if ( is_immutable ) {
      p.is_immutable = is_immutable;
    }
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
      if ( (defaultArg.register_name.length) > 0 ) {
        const rr = ctx.getVariableDef(defaultArg.register_name);
        if ( (typeof(rr.nameNode) !== "undefined" && rr.nameNode != null )  ) {
          if ( (typeof(rr.nameNode.expression_value) !== "undefined" && rr.nameNode.expression_value != null )  ) {
            cn.expression_value = rr.nameNode.expression_value.copy();
          }
        }
      }
      if ( defaultArg.eval_type == 17 ) {
        if ( (typeof(defaultArg.expression_value) !== "undefined" && defaultArg.expression_value != null )  ) {
          cn.expression_value = defaultArg.expression_value.copy();
        } else {
          if ( defaultArg.hasParamDesc ) {
            if ( ((typeof(defaultArg.paramDesc.nameNode) !== "undefined" && defaultArg.paramDesc.nameNode != null ) ) && ((typeof(defaultArg.paramDesc.nameNode.expression_value) !== "undefined" && defaultArg.paramDesc.nameNode.expression_value != null ) ) ) {
              cn.eval_type = 17;
              cn.expression_value = defaultArg.paramDesc.nameNode.expression_value.copy();
            }
          }
        }
      }
      if ( (typeof(defaultArg) !== "undefined" && defaultArg != null )  ) {
        await __self.convertToUnion(cn.eval_type_name, defaultArg, ctx, wr);
        if ( (typeof(defaultArg.evalTypeClass) !== "undefined" && defaultArg.evalTypeClass != null )  ) {
          cn.evalTypeClass = defaultArg.evalTypeClass;
        }
      }
      if ( cn.eval_type != defaultArg.eval_type ) {
        const b1 = (cn.eval_type == 14) && (defaultArg.eval_type == 3);
        const b2 = (cn.eval_type == 3) && (defaultArg.eval_type == 14);
        if ( false == (b1 || b2) ) {
          ctx.addError(node, (("Variable was assigned an incompatible type. Types were " + cn.eval_type) + " vs ") + defaultArg.eval_type);
        }
      }
    } else {
      p.is_optional = true;
    }
    ctx.defineVariable(p.name, p);
    if ( (node.children.length) > 2 ) {
      __self.shouldBeEqualTypes(cn, p.def_value, ctx, "Variable was assigned an incompatible type.");
    }
    operatorsOf_21.addUsage_28(ctx, cn);
  } else {
    const cn_1 = node.children[1];
    cn_1.eval_type = cn_1.typeNameAsType(ctx);
    cn_1.eval_type_name = cn_1.type_name;
    if ( (node.children.length) > 2 ) {
      __self.shouldBeEqualTypes(node.children[1], node.children[2], ctx, "Variable was assigned an incompatible type.");
    }
  }
};
class operatorsOf_26  {
  constructor() {
  }
}
operatorsOf_26.EnterVarDef_27 = async function(__self, node, ctx, wr) {
  if ( ctx.isInMethod() ) {
    if ( (node.children.length) < 2 ) {
      ctx.addError(node, "invalid variable definition");
      return;
    }
    const tName_1 = node.getSecond();
    await __self.CheckTypeAnnotationOf(tName_1, ctx, wr);
    if ( tName_1.expression ) {
      node.children.splice(1, 1);
      await operatorsOf.forEach_15(tName_1.children, ((item, index) => { 
        if ( index == 1 ) {
          if ( item.expression ) {
            node.children.push(((item.children[0])).copy());
          } else {
            node.children.push(item.copy());
          }
        }
        if ( index > 1 ) {
          node.children.push(item.copy());
        }
      }));
    }
    if ( (node.children.length) > 3 ) {
      ctx.addError(node, "invalid variable definition");
      return;
    }
    const cn_2 = node.children[1];
    const p_1 = new RangerAppParamDesc();
    let defaultArg_1;
    let is_immutable_1 = false;
    cn_2.definedTypeClass = TFactory.new_def_signature(cn_2, ctx, wr);
    if ( (node.children.length) == 2 ) {
      if ( (cn_2.value_type != 6) && (cn_2.value_type != 7) ) {
        if ( false == cn_2.hasFlag("unwrap") ) {
          cn_2.setFlag("optional");
        }
      }
    }
    if ( (cn_2.vref.length) == 0 ) {
      ctx.addError(node, "invalid variable definition");
    }
    if ( cn_2.hasFlag("weak") ) {
      p_1.changeStrength(0, 1, node);
    } else {
      p_1.changeStrength(1, 1, node);
    }
    node.hasVarDef = true;
    if ( (node.children.length) > 2 ) {
      p_1.init_cnt = 1;
      p_1.def_value = node.children[2];
      p_1.is_optional = false;
      defaultArg_1 = node.children[2];
      ctx.setInExpr();
      await __self.WalkNode(defaultArg_1, ctx, wr);
      ctx.unsetInExpr();
      if ( defaultArg_1.hasFlag("optional") ) {
        cn_2.setFlag("optional");
      }
      if ( defaultArg_1.hasFlag("immutable") ) {
        cn_2.setFlag("immutable");
      }
      if ( defaultArg_1.hasParamDesc ) {
        const paramDesc_1 = defaultArg_1.paramDesc;
        if ( (typeof(paramDesc_1.propertyClass) !== "undefined" && paramDesc_1.propertyClass != null )  ) {
          if ( paramDesc_1.propertyClass.nameNode.hasFlag("immutable") ) {
            if ( (defaultArg_1.eval_type == 6) || (defaultArg_1.eval_type == 7) ) {
              is_immutable_1 = true;
            }
          }
        }
        if ( paramDesc_1.is_immutable ) {
          is_immutable_1 = true;
        }
      }
      if ( defaultArg_1.eval_type == 6 ) {
        node.op_index = 1;
      }
      if ( cn_2.value_type == 13 ) {
        cn_2.eval_type_name = defaultArg_1.ns[0];
      }
      if ( cn_2.value_type == 14 ) {
        if ( (defaultArg_1.eval_type != 3) && (defaultArg_1.eval_type != 14) ) {
          ctx.addError(defaultArg_1, "Char should be assigned char or integer value --> " + defaultArg_1.getCode());
        } else {
          defaultArg_1.eval_type = 14;
        }
      }
    } else {
      if ( ((cn_2.value_type != 7) && (cn_2.value_type != 6)) && (false == cn_2.hasFlag("optional")) ) {
        if ( cn_2.hasFlag("unwrap") ) {
        } else {
          cn_2.setFlag("optional");
        }
      }
    }
    if ( (node.children.length) > 2 ) {
      if ( ((cn_2.type_name.length) == 0) && ((cn_2.array_type.length) == 0) ) {
        cn_2.inferDefTypeFromValue(node);
        if ( cn_2.value_type == 17 ) {
          cn_2.eval_type = 17;
        }
      }
    }
    ctx.hadValidType(cn_2);
    cn_2.defineNodeTypeTo(cn_2, ctx);
    p_1.name = cn_2.vref;
    if ( p_1.value_type == 0 ) {
      if ( (0 == (cn_2.type_name.length)) && ((typeof(defaultArg_1) !== "undefined" && defaultArg_1 != null ) ) ) {
        p_1.value_type = defaultArg_1.eval_type;
        cn_2.type_name = defaultArg_1.eval_type_name;
        cn_2.eval_type_name = defaultArg_1.eval_type_name;
        cn_2.value_type = defaultArg_1.eval_type;
      }
    } else {
      p_1.value_type = cn_2.value_type;
    }
    p_1.node = node;
    p_1.nameNode = cn_2;
    p_1.varType = 5;
    if ( is_immutable_1 ) {
      p_1.is_immutable = is_immutable_1;
    }
    if ( cn_2.has_vref_annotation ) {
      ctx.log(node, "ann", "At a variable -> Found has_vref_annotation annotated reference ");
      const ann_2 = cn_2.vref_annotation;
      if ( (ann_2.children.length) > 0 ) {
        const fc_2 = ann_2.children[0];
        ctx.log(node, "ann", (("value of first annotation " + fc_2.vref) + " and variable name ") + cn_2.vref);
      }
    }
    if ( cn_2.has_type_annotation ) {
      ctx.log(node, "ann", "At a variable -> Found annotated reference ");
      const ann_3 = cn_2.type_annotation;
      if ( (ann_3.children.length) > 0 ) {
        const fc_3 = ann_3.children[0];
        ctx.log(node, "ann", (("value of first annotation " + fc_3.vref) + " and variable name ") + cn_2.vref);
      }
    }
    cn_2.hasParamDesc = true;
    cn_2.ownParamDesc = p_1;
    cn_2.paramDesc = p_1;
    node.hasParamDesc = true;
    node.paramDesc = p_1;
    cn_2.eval_type = cn_2.typeNameAsType(ctx);
    cn_2.eval_type_name = cn_2.type_name;
    if ( (node.children.length) > 2 ) {
      if ( (defaultArg_1.register_name.length) > 0 ) {
        const rr_1 = ctx.getVariableDef(defaultArg_1.register_name);
        if ( (typeof(rr_1.nameNode) !== "undefined" && rr_1.nameNode != null )  ) {
          if ( (typeof(rr_1.nameNode.expression_value) !== "undefined" && rr_1.nameNode.expression_value != null )  ) {
            cn_2.expression_value = rr_1.nameNode.expression_value.copy();
          }
        }
      }
      if ( defaultArg_1.eval_type == 17 ) {
        if ( (typeof(defaultArg_1.expression_value) !== "undefined" && defaultArg_1.expression_value != null )  ) {
          cn_2.expression_value = defaultArg_1.expression_value.copy();
        } else {
          if ( defaultArg_1.hasParamDesc ) {
            if ( ((typeof(defaultArg_1.paramDesc.nameNode) !== "undefined" && defaultArg_1.paramDesc.nameNode != null ) ) && ((typeof(defaultArg_1.paramDesc.nameNode.expression_value) !== "undefined" && defaultArg_1.paramDesc.nameNode.expression_value != null ) ) ) {
              cn_2.eval_type = 17;
              cn_2.expression_value = defaultArg_1.paramDesc.nameNode.expression_value.copy();
            }
          }
        }
      }
      if ( (typeof(defaultArg_1) !== "undefined" && defaultArg_1 != null )  ) {
        await __self.convertToUnion(cn_2.eval_type_name, defaultArg_1, ctx, wr);
        if ( (typeof(defaultArg_1.evalTypeClass) !== "undefined" && defaultArg_1.evalTypeClass != null )  ) {
          cn_2.evalTypeClass = defaultArg_1.evalTypeClass;
        }
      }
      if ( cn_2.eval_type != defaultArg_1.eval_type ) {
        const b1_1 = (cn_2.eval_type == 14) && (defaultArg_1.eval_type == 3);
        const b2_1 = (cn_2.eval_type == 3) && (defaultArg_1.eval_type == 14);
        if ( false == (b1_1 || b2_1) ) {
          ctx.addError(node, (("Variable was assigned an incompatible type. Types were " + cn_2.eval_type) + " vs ") + defaultArg_1.eval_type);
        }
      }
    } else {
      p_1.is_optional = true;
    }
    ctx.defineVariable(p_1.name, p_1);
    if ( (node.children.length) > 2 ) {
      __self.shouldBeEqualTypes(cn_2, p_1.def_value, ctx, "Variable was assigned an incompatible type.");
    }
    operatorsOf_21.addUsage_28(ctx, cn_2);
  } else {
    const cn_3 = node.children[1];
    cn_3.eval_type = cn_3.typeNameAsType(ctx);
    cn_3.eval_type_name = cn_3.type_name;
    if ( (node.children.length) > 2 ) {
      __self.shouldBeEqualTypes(node.children[1], node.children[2], ctx, "Variable was assigned an incompatible type.");
    }
  }
};
class operatorsOfstring_33  {
  constructor() {
  }
}
operatorsOfstring_33.transactionc95depth_34 = function(name, c) {
  let t = operatorsOf_21.getActiveTransaction_22(c);
  let d = 0;
  while ((typeof(t) !== "undefined" && t != null ) ) {
    if ( t.name == name ) {
      d = d + 1;
    }
    t = t.parent;
  };
  return d;
};
class operatorsOf_33  {
  constructor() {
  }
}
operatorsOf_33.startc95transaction_35 = function(name, desc, c) {
  const t_1 = new ContextTransaction();
  t_1.name = name;
  t_1.desc = desc;
  t_1.ctx = c;
  const currC = operatorsOf_21.getActiveTransaction_22(c);
  c.activeTransaction.push(t_1);
  c.transactions.push(t_1);
  if ( (typeof(currC) !== "undefined" && currC != null )  ) {
    currC.children.push(t_1);
    t_1.parent = currC;
  }
  return t_1;
};
operatorsOf_33.transactionc95depth_34 = function(name, c) {
  let t_2 = operatorsOf_21.getActiveTransaction_22(c);
  let d_1 = 0;
  while ((typeof(t_2) !== "undefined" && t_2 != null ) ) {
    if ( t_2.name == name ) {
      d_1 = d_1 + 1;
    }
    t_2 = t_2.parent;
  };
  return d_1;
};
class operatorsOfContextTransaction_38  {
  constructor() {
  }
}
operatorsOfContextTransaction_38.endc95transaction_39 = function(t) {
  const c = t.ctx;
  const i_21 = c.activeTransaction.indexOf(t);
  if ( i_21 >= 0 ) {
    c.activeTransaction.splice(i_21, 1);
  }
  t.ended = true;
};
class operatorsOfCodeNode_41  {
  constructor() {
  }
}
operatorsOfCodeNode_41.rc46funcdesc_42 = function(node, ctx) {
  const m = new RangerAppFunctionDesc();
  const cn_4 = node.getSecond();
  m.name = cn_4.vref;
  m.compiledName = ctx.transformWord(cn_4.vref);
  m.node = node;
  m.nameNode = node.children[1];
  if ( node.hasBooleanProperty("strong") ) {
    m.refType = 2;
  } else {
    m.refType = 1;
  }
  return m;
};
class operatorsOf_41  {
  constructor() {
  }
}
operatorsOf_41.rc46func_43 = async function(node, ctx, wr) {
  const parser = new RangerFlowParser();
  return await parser.CreateFunctionObject(node, ctx, wr);
};
class operatorsOfJSONArrayObject_58  {
  constructor() {
  }
}
operatorsOfJSONArrayObject_58.forEach_59 = function(__self, cb) {
  let cnt = __self.length;
  let i_33 = 0;
  while (cnt > 0) {
    const value_8 = __self[i_33];
    cb(value_8, i_33);
    cnt = cnt - 1;
    i_33 = i_33 + 1;
  };
};
class operatorsOf_58  {
  constructor() {
  }
}
operatorsOf_58.forEach_59 = async function(__self, cb) {
  let cnt_1 = __self.length;
  let i_34 = 0;
  while (cnt_1 > 0) {
    const value_9 = __self[i_34];
    await cb(value_9, i_34);
    cnt_1 = cnt_1 - 1;
    i_34 = i_34 + 1;
  };
};
/* static JavaSript main routine at the end of the JS file */
async function __js_main() {
  const env = CompilerInterface.create_env();
  const o = new VirtualCompiler();
  const res = await o.run(env);
  if ( (res.target_dir.length) > 0 ) {
    res.fileSystem.saveTo(res.target_dir, false);
  }
}
__js_main();
