class DictNode  {
  
  constructor(source, start, end) {
    this.code = undefined;
    this.sp = 0;
    this.ep = 0;
    this.is_property = false;
    this.is_property_value = false;
    this.vref = undefined;
    this.value_type = 0;
    this.double_value = undefined;
    this.string_value = undefined;
    this.boolean_value = undefined;
    this.object_value = undefined;
    this.children = [];
    this.objects = {};
    this.keys = [];
    this.sp = start;
    this.ep = end;
    this.code = source;
  }
  EncodeString(orig_str) { 
    var encoded_str = "";
    var str_length = orig_str.length;
    var ii = 0;
    while(ii<str_length) {
      var cc = orig_str.charCodeAt(ii);
      switch(cc) {
        case 8:
          encoded_str = encoded_str + String.fromCharCode(92) + String.fromCharCode(98);
          break;
        case 9:
          encoded_str = encoded_str + String.fromCharCode(92) + String.fromCharCode(116);
          break;
        case 10:
          encoded_str = encoded_str + String.fromCharCode(92) + String.fromCharCode(110);
          break;
        case 12:
          encoded_str = encoded_str + String.fromCharCode(92) + String.fromCharCode(102);
          break;
        case 13:
          encoded_str = encoded_str + String.fromCharCode(92) + String.fromCharCode(114);
          break;
        case 34:
          encoded_str = encoded_str + String.fromCharCode(92) + String.fromCharCode(34);
          break;
        case 92:
          encoded_str = encoded_str + String.fromCharCode(92) + String.fromCharCode(92);
          break;
        case 47:
          encoded_str = encoded_str + String.fromCharCode(92) + String.fromCharCode(47);
          break;
        default: 
          encoded_str = encoded_str + String.fromCharCode(cc);
          break;
      }
      ii = 1 + ii;
    }
    return encoded_str;
  }
  createEmptyObject() { 
    var emptyCode = new SourceCode("");
    var v = new DictNode(emptyCode,0,0);
    v.value_type = 6;
    return v;
  }
  addObject(key) { 
    if(this.value_type==6) {
      var p = new DictNode(this.code,0,0);
      var v = new DictNode(this.code,0,0);
      p.value_type = 6;
      p.vref = key;
      p.is_property = true;
      v.value_type = 6;
      v.vref = key;
      v.is_property_value = true;
      p.object_value = v;
      this.keys.push(key);
      this.objects[key] = p;
      return v;
    }
  }
  addString(key, value) { 
    if(this.value_type==6) {
      var v = new DictNode(this.code,0,0);
      v.string_value = value;
      v.value_type = 3;
      v.vref = key;
      v.is_property = true;
      this.keys.push(key);
      this.objects[key] = v;
    }
  }
  getDoubleAt(index) { 
    if(index<this.children.length) {
      var k = this.children[index];
      return k.double_value;
    }
    return 0;
  }
  getDouble(key) { 
    if(typeof(this.objects[key]) != "undefined") {
      var k = this.objects[key];
      return k.double_value;
    }
    return 0;
  }
  getStringAt(index) { 
    if(index<this.children.length) {
      var k = this.children[index];
      return k.string_value;
    }
    return "";
  }
  getString(key) { 
    if(typeof(this.objects[key]) != "undefined") {
      var k = this.objects[key];
      return k.string_value;
    }
    return "";
  }
  getArray(key) { 
    if(typeof(this.objects[key]) != "undefined") {
      var obj = this.objects[key];
      if(obj.is_property) {
        return obj.object_value;
      }
    }
    return new DictNode((new SourceCode("")),0,0);
  }
  getArrayAt(index) { 
    if(index<this.children.length) {
      var k = this.children[index];
      return k;
    }
    return new DictNode((new SourceCode("")),0,0);
  }
  getObject(key) { 
    if(typeof(this.objects[key]) != "undefined") {
      var obj = this.objects[key];
      if(obj.is_property) {
        return obj.object_value;
      }
    }
    return new DictNode((new SourceCode("")),0,0);
  }
  getObjectAt(index) { 
    if(index<this.children.length) {
      var k = this.children[index];
      return k;
    }
    return new DictNode((new SourceCode("")),0,0);
  }
  walk() { 
    if(this.is_property) {
      if(this.value_type==7) {
        console.log(this.vref + " : null");
      }
      if(this.value_type==1) {
        console.log(this.vref + " : " + this.double_value);
      }
      if(this.value_type==3) {
        console.log(this.vref + " : " + this.string_value);
      }
      if(this.value_type==4) {
        if(this.boolean_value) {
          console.log(this.vref + " : " + "true");
        } else {
          console.log(this.vref + " : " + "false");
        }
      }
    } else {
      if(this.value_type==7) {
        console.log("null");
      }
      if(this.value_type==1) {
        console.log(this.double_value);
      }
      if(this.value_type==3) {
        console.log(this.string_value);
      }
      if(this.value_type==4) {
        if(this.boolean_value) {
          console.log("true");
        } else {
          console.log("false");
        }
      }
    }
    if(this.value_type==5) {
      if(this.is_property) {
        console.log(this.vref + " : Array(");
      } else {
        console.log("Array(");
      }
      console.log("child cnt == " + this.children.length);
      for( var i= 0; i< this.children.length; i++) { 
        var item= this.children[i];
        item.walk()
        console.log(",");
      }
      console.log(")");
    }
    if(this.value_type==6) {
      if(this.is_property) {
        console.log(this.vref + " : ");
        this.object_value.walk()
      } else {
        console.log("Object(");
        for( var i= 0; i< this.keys.length; i++) { 
          var key= this.keys[i];
          var item = this.objects[key];
          item.walk()
          console.log(",");
        }
        console.log(")");
      }
    }
  }
  stringify() { 
    if(this.is_property) {
      if(this.value_type==7) {
        return String.fromCharCode(34) + this.vref + String.fromCharCode(34) + ":null";
      }
      if(this.value_type==1) {
        return String.fromCharCode(34) + this.vref + String.fromCharCode(34) + ":" + this.double_value;
      }
      if(this.value_type==3) {
        return String.fromCharCode(34) + this.vref + String.fromCharCode(34) + ":" + String.fromCharCode(34) + this.EncodeString(this.string_value) + String.fromCharCode(34);
      }
      if(this.value_type==4) {
        if(this.boolean_value) {
          return String.fromCharCode(34) + this.vref + String.fromCharCode(34) + ":" + "true";
        } else {
          return String.fromCharCode(34) + this.vref + String.fromCharCode(34) + ":" + "false";
        }
      }
    } else {
      if(this.value_type==7) {
        return "null";
      }
      if(this.value_type==1) {
        return "" + this.double_value;
      }
      if(this.value_type==3) {
        return String.fromCharCode(34) + this.EncodeString(this.string_value) + String.fromCharCode(34);
      }
      if(this.value_type==4) {
        if(this.boolean_value) {
          return "true";
        } else {
          return "false";
        }
      }
    }
    if(this.value_type==5) {
      var str = "";
      if(this.is_property) {
        str = String.fromCharCode(34) + this.vref + String.fromCharCode(34) + ":[";
      } else {
        str = "[";
      }
      for( var i= 0; i< this.children.length; i++) { 
        var item= this.children[i];
        if(i>0) {
          str = str + ",";
        }
        str = str + (item.stringify());
      }
      str = str + "]";
      return str;
    }
    if(this.value_type==6) {
      var str = "";
      if(this.is_property) {
        return String.fromCharCode(34) + this.vref + String.fromCharCode(34) + ":" + (this.object_value.stringify());
      } else {
        str = "{";
        for( var i= 0; i< this.keys.length; i++) { 
          var key= this.keys[i];
          if(i>0) {
            str = str + ",";
          }
          var item = this.objects[key];
          str = str + (item.stringify());
        }
        str = str + "}";
        return str;
      }
    }
    return "";
  }
}
class CodeNode  {
  
  constructor(source, start, end) {
    this.code = undefined;
    this.sp = 0;
    this.ep = 0;
    this.expression = false;
    this.vref = undefined;
    this.type_type = "";
    this.type_name = "";
    this.key_type = undefined;
    this.array_type = undefined;
    this.ns = [];
    this.value_type = 0;
    this.eval_type = 0;
    this.eval_type_name = "";
    this.double_value = undefined;
    this.string_value = undefined;
    this.int_value = undefined;
    this.boolean_value = undefined;
    this.expression_value = undefined;
    this.props = {};
    this.prop_keys = [];
    this.comments = [];
    this.children = [];
    this.parent = undefined;
    this.execState = undefined;
    this.sp = start;
    this.ep = end;
    this.code = source;
  }
  /**"\r\n NOTE: This is just a documentation test, not a real documentation entry!!!\r\n The codenode represents AST node which can be used for parsers and intepreters of the system.\r\n ```\r\n    (def n:CodeNode (new CodeNode (src start end)))\r\n    (def str:string (node getCode ()))\r\n ```\r\n "*/
  getFilename() { 
    return this.code.filename;
  }
  getLine() { 
    return this.code.getLine(this.sp);
  }
  getLineString(line_index) { 
    return this.code.getLineString(line_index);
  }
  getPositionalString() { 
    if((this.ep>this.sp) && ((this.ep - this.sp)<50)) {
      var start = this.sp;
      var end = this.ep;
      start = start - 100;
      end = end + 50;
      if(start<0) {
        start = 0;
      }
      if(end>=this.code.code.length) {
        end = this.code.code.length - 1;
      }
      return this.code.code.substring(start, end);
    }
    return "";
  }
  isVariableDef() { 
    return this.isFirstVref("def")
    ;
  }
  isFunctionDef() { 
    return this.isFirstVref("defn")
    ;
  }
  isFunctionCall() { 
    if(this.isVariableDef()
    ) {
      return false;
    }
    if(this.isFunctionDef()
    ) {
      return false;
    }
    if(this.isFirstTypeVref() && this.children.length>1) {
      return true;
    }
    return false;
  }
  isPrimitive() { 
    if((this.value_type==1) || (this.value_type==3) || (this.value_type==2) || (this.value_type==4)) {
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
    if(this.children.length>1) {
      var second = this.children[1];
      if(second.expression) {
        return true;
      }
    }
    return false;
  }
  getOperator() { 
    var s = "";
    if(this.children.length>0) {
      var fc = this.children[0];
      if(fc.value_type==8) {
        return fc.vref;
      }
    }
    return s;
  }
  getVRefAt(idx) { 
    var s = "";
    if(this.children.length>idx) {
      var fc = this.children[idx];
      return fc.vref;
    }
    return s;
  }
  getStringAt(idx) { 
    var s = "";
    if(this.children.length>idx) {
      var fc = this.children[idx];
      if(fc.value_type==3) {
        return fc.string_value;
      }
    }
    return s;
  }
  hasExpressionProperty(name) { 
    var ann = this.props[name];
    if(ann != null ) {
      return ann.expression;
    }
    return false;
  }
  getExpressionProperty(name) { 
    var ann = this.props[name];
    if(ann != null ) {
      return ann;
    }
    return false;
  }
  hasIntProperty(name) { 
    var ann = this.props[name];
    if(ann != null ) {
      var fc = ann.children[0];
      if(fc.value_type==2) {
        return true;
      }
    }
    return false;
  }
  getIntProperty(name) { 
    var ann = this.props[name];
    if(ann != null ) {
      var fc = ann.children[0];
      if(fc.value_type==2) {
        return fc.int_value;
      }
    }
    return 0;
  }
  hasDoubleProperty(name) { 
    var ann = this.props[name];
    if(ann != null ) {
      if(ann.value_type==1) {
        return true;
      }
    }
    return false;
  }
  getDoubleProperty(name) { 
    var ann = this.props[name];
    if(ann != null ) {
      if(ann.value_type==1) {
        return ann.double_value;
      }
    }
    return 0;
  }
  hasStringProperty(name) { 
    var ann = this.props[name];
    if(ann != null ) {
      if(ann.value_type==3) {
        return true;
      }
    }
    return false;
  }
  getStringProperty(name) { 
    var ann = this.props[name];
    if(ann != null ) {
      if(ann.value_type==3) {
        return ann.string_value;
      }
    }
    return "";
  }
  hasBooleanProperty(name) { 
    var ann = this.props[name];
    if(ann != null ) {
      if(ann.value_type==4) {
        return true;
      }
    }
    return false;
  }
  getBooleanProperty(name) { 
    var ann = this.props[name];
    if(ann != null ) {
      if(ann.value_type==4) {
        return ann.boolean_value;
      }
    }
    return false;
  }
  isFirstTypeVref(vrefName) { 
    if(this.children.length>0) {
      var fc = this.children[0];
      if(fc.value_type==8) {
        return true;
      }
    }
    return false;
  }
  isFirstVref(vrefName) { 
    if(this.children.length>0) {
      var fc = this.children[0];
      if(fc.vref==vrefName) {
        return true;
      }
    }
    return false;
  }
  getString() { 
    return this.code.code.substring(this.sp, this.ep);
  }
  writeCode(wr) { 
    switch(this.value_type) {
      case 1:
        wr.out((
        this.double_value),false)
        break;
      case 3:
        wr.out(String.fromCharCode(34) + this.string_value + String.fromCharCode(34),false)
        break;
      case 2:
        wr.out("" + this.int_value,false)
        break;
      case 4:
        if(this.boolean_value) {
          wr.out("true",false)
        } else {
          wr.out("false",false)
        }
        break;
      case 8:
        var res = this.vref;
        if(this.type_name.length>0) {
          res = res + ":" + this.type_name;
        }
        wr.out(res,false)
        break;
      case 5:
        var res = this.vref;
        if(this.array_type.length>0) {
          res = res + ":[" + this.array_type + "]";
        }
        wr.out(res,false)
        break;
      case 6:
        var res = this.vref;
        if(this.array_type.length>0) {
          res = res + ":[" + this.key_type + ":" + this.array_type + "]";
        }
        wr.out(res,false)
        break;
      case 10:
        wr.out(this.vref + ":",false)
        if(this.expression_value == null ) {
        } else {
          this.expression_value.writeCode(wr)
        }
        break;
      case 9:
        wr.out(";",false)
        wr.out(this.string_value,true)
        break;
      default: 
        if(this.expression) {
          wr.out("(",false)
          for( var i= 0; i< this.prop_keys.length; i++) { 
            var key= this.prop_keys[i];
            wr.out(" @",false)
            wr.out(key,false)
            var propVal = this.props[key];
            if(propVal.isPrimitive()) {
              wr.out("(",false)
              propVal.writeCode(wr)
              wr.out(")",false)
            } else {
              propVal.writeCode(wr)
            }
            wr.out(" ",false)
          }
          var is_block = false;
          var exp_cnt = 0;
          for( var i= 0; i< this.children.length; i++) { 
            var item= this.children[i];
            if(i==0) {
              is_block = item.expression;
              if(is_block) {
                wr.out("",true)
                wr.indent(1)
              } else {
              }
            }
            if(item.expression || (item.value_type==9)) {
              exp_cnt = 1 + exp_cnt;
            }
            if((is_block==false) && (exp_cnt>0)) {
              is_block = true;
              wr.out("",true)
              wr.indent(1)
            }
            if(is_block) {
              item.writeCode(wr)
              if(item.value_type==9) {
              } else {
                wr.out("",true)
              }
            } else {
              if(i>0) {
                wr.out(" ",false)
              }
              item.writeCode(wr)
            }
          }
          if(is_block) {
            wr.indent(-1)
          }
          wr.out(")",false)
        }
        break;
    }
  }
  getCode() { 
    var wr = new CodeWriter();
    this.writeCode(wr)
    return wr.getCode();
    switch(this.value_type) {
      case 1:
        return (
        this.double_value);
        break;
      case 3:
        return String.fromCharCode(34) + this.string_value + String.fromCharCode(34);
        break;
      case 2:
        return "" + this.int_value;
        break;
      case 4:
        if(this.boolean_value) {
          return "true";
        } else {
          return "false";
        }
        break;
      case 8:
        var res = this.vref;
        if(this.type_name.length>0) {
          res = res + ":" + this.type_name;
        }
        return res;
        break;
      case 5:
        var res = this.vref;
        if(this.array_type.length>0) {
          res = res + ":[" + this.array_type + "]";
        }
        return res;
        break;
      case 6:
        var res = this.vref;
        if(this.array_type.length>0) {
          res = res + ":[" + this.key_type + ":" + this.array_type + "]";
        }
        return res;
        break;
      case 10:
        if(this.expression_value == null ) {
          return "";
        }
        return this.expression_value.getCode();
        break;
      case 9:
        return "";
        break;
    }
    if(this.expression) {
      var res = "( ";
      for( var i= 0; i< this.children.length; i++) { 
        var item= this.children[i];
        res = res + " ";
        res = res + (item.getCode());
        res = res + " ";
      }
      res = res + " ) ";
      return res;
    }
    return "";
  }
  walk() { 
    switch(this.value_type) {
      case 1:
        console.log("Double : " + this.double_value);
        break;
      case 3:
        console.log("String : " + this.string_value);
        break;
      case 2:
        console.log("Integer : " + this.int_value);
        break;
      case 4:
        console.log("Boolean : " + this.boolean_value);
        break;
      case 8:
        console.log("VREF : " + this.vref + " : " + this.type_name);
        console.log(this.ns);
        break;
      case 5:
        console.log("Array : " + this.vref + " : " + this.array_type);
        break;
      case 6:
        console.log("Hash : " + this.vref + " : [" + this.key_type + ":" + this.array_type + "]");
        break;
      case 10:
        console.log("Expression type : " + this.vref);
        console.log("----- expression starts ------");
        this.expression_value.walk()
        console.log("----- expression ends ------");
        break;
      case 9:
        console.log("Comment : " + this.string_value);
        break;
    }
    if(this.expression) {
      console.log("(");
    } else {
      console.log(this.code.code.substring(this.sp, this.ep));
    }
    for( var i= 0; i< this.children.length; i++) { 
      var item= this.children[i];
      item.walk()
    }
    if(this.expression) {
      console.log(")");
    }
  }
}
class SourceCode  {
  
  constructor(code_string) {
    this.code = undefined;
    this.filename = "";
    this.lines = [];
    this.code = code_string;
    this.lines = code_string.split("\n");
  }
  getLineString(line_index) { 
    if(this.lines.length>line_index) {
      return this.lines[line_index];
    }
    return "";
  }
  getLine(sp) { 
    var cnt = 0;
    for( var i= 0; i< this.lines.length; i++) { 
      var str= this.lines[i];
      cnt = cnt + (str.length + 1);
      if(cnt>sp) {
        return i;
      }
    }
    return -1;
  }
}
class CodeExecState  {
  
  constructor() {
    this.is_running = false;
    this.is_ready = false;
    this.expand_args = false;
    this.param_index = 0;
    this.child_index = 0;
    this.value_type = 0;
    this.double_value = undefined;
    this.string_value = undefined;
    this.int_value = undefined;
    this.boolean_value = undefined;
    this.expression_value = undefined;
    this.ctx = undefined;
  }
}
class RangerContextEvent  {
  
  constructor() {
    this.ctx = undefined;
    this.var_name = undefined;
  }
  fire() { 
  }
}
class RangerContextEventContainer  {
  
  constructor() {
    this.listeners = [];
  }
  fire() { 
    for( var i= 0; i< this.listeners.length; i++) { 
      var observer= this.listeners[i];
      observer.fire()
    }
  }
}
class RangerContext  {
  
  constructor() {
    this.parent = undefined;
    this.defined_values = {};
    this.set_values = {};
    this.set_types = {};
    this.int_values = {};
    this.str_values = {};
    this.double_values = {};
    this.bool_values = {};
    this.dict_values = {};
    this.code_values = {};
    this.events = {};
  }
  fork() { 
    var new_ctx = new RangerContext();
    new_ctx.parent = this;
    return new_ctx;
  }
  getTypeOf(key) { 
    if(typeof(this.defined_values[key]) != "undefined") {
      return this.set_types[key];
    } else {
      if(this.parent != null ) {
        return this.parent.getTypeOf(key);
      }
    }
    return 0;
  }
  isString(key) { 
    if(typeof(this.set_values[key]) != "undefined") {
      return (this.set_types[key])==3;
    }
    if(this.parent != null ) {
      return this.parent.isString(key);
    }
    return false;
  }
  isDouble(key) { 
    if(typeof(this.set_values[key]) != "undefined") {
      return (this.set_types[key])==1;
    }
    if(this.parent != null ) {
      return this.parent.isDouble(key);
    }
    return false;
  }
  isInt(key) { 
    if(typeof(this.set_values[key]) != "undefined") {
      return (this.set_types[key])==2;
    }
    if(this.parent != null ) {
      return this.parent.isInt(key);
    }
    return false;
  }
  isBoolean(key) { 
    if(typeof(this.set_values[key]) != "undefined") {
      return (this.set_types[key])==4;
    }
    if(this.parent != null ) {
      return this.parent.isBoolean(key);
    }
    return false;
  }
  isDefinedString(key) { 
    if(typeof(this.defined_values[key]) != "undefined") {
      return (this.set_types[key])==3;
    }
    if(this.parent != null ) {
      return this.parent.isString(key);
    }
    return false;
  }
  isDefinedDouble(key) { 
    if(typeof(this.defined_values[key]) != "undefined") {
      return (this.set_types[key])==1;
    }
    if(this.parent != null ) {
      return this.parent.isDefinedDouble(key);
    }
    return false;
  }
  isDefinedInt(key) { 
    if(typeof(this.defined_values[key]) != "undefined") {
      return (this.set_types[key])==2;
    }
    if(this.parent != null ) {
      return this.parent.isDefinedInt(key);
    }
    return false;
  }
  isDefinedBoolean(key) { 
    if(typeof(this.defined_values[key]) != "undefined") {
      return (this.set_types[key])==4;
    }
    if(this.parent != null ) {
      return this.parent.isDefinedBoolean(key);
    }
    return false;
  }
  defineString(key) { 
    this.set_types[key] = 3;
    this.defined_values[key] = true;
  }
  defineInt(key) { 
    this.set_types[key] = 2;
    this.defined_values[key] = true;
  }
  defineBoolean(key) { 
    this.set_types[key] = 4;
    this.defined_values[key] = true;
  }
  defineDouble(key) { 
    this.set_types[key] = 4;
    this.defined_values[key] = true;
  }
  setString(key, value) { 
    this.str_values[key] = value;
  }
  getString(key) { 
    if(typeof(this.str_values[key]) != "undefined") {
      return this.str_values[key];
    } else {
      if(this.parent != null ) {
        return this.parent.getString(key);
      } else {
        return "";
      }
    }
  }
}
class CodeFile  {
  
  constructor(filePath, fileName) {
    this.path_name = "";
    this.name = "";
    this.writer = undefined;
    this.import_list = {};
    this.import_names = [];
    this.fileSystem = undefined;
    this.name = fileName;
    this.path_name = filePath;
    this.writer = new CodeWriter();
    this.writer.createTag("imports")
    this.writer.ownerFile = this;
  }
  addImport(import_name) { 
    if(typeof(this.import_list[import_name]) != "undefined") {
    } else {
      this.import_list[this.name] = import_name;
      this.import_names.push(import_name);
    }
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
  
  constructor() {
    this.files = [];
  }
  getFile(path, name) { 
    for( var idx= 0; idx< this.files.length; idx++) { 
      var file= this.files[idx];
      if((file.path_name==path) && (file.name==name)) {
        return file;
      }
    }
    var new_file = new CodeFile(path,name);
    new_file.fileSystem = this;
    this.files.push(new_file);
    return new_file;
  }
  mkdir(path) { 
    var parts = path.split("\/");
    var curr_path = "";
    for( var i= 0; i< parts.length; i++) { 
      var p= parts[i];
      curr_path = curr_path + "\/" + p;
      if(require("fs").existsSync( process.cwd() + "/" + curr_path)) {
      } else {
        require("fs").mkdirSync( process.cwd() + "/" + curr_path);
      }
    }
  }
  saveTo(path) { 
    for( var idx= 0; idx< this.files.length; idx++) { 
      var file= this.files[idx];
      var file_path = path + "\/" + file.path_name;
      this.mkdir(file_path)
      console.log("Writing to path " + file_path);
      require("fs").writeFileSync( process.cwd() + "/" + file_path + "/" + file.name, file.getCode());
    }
  }
  printFilesList() { 
    for( var idx= 0; idx< this.files.length; idx++) { 
      var file= this.files[idx];
      console.log("----===== " + (file.path_name + "\/" + file.name) + " ====----");
      console.log(file.getCode());
    }
  }
}
class CodeSlice  {
  
  constructor() {
    this.code = "";
    this.writer = undefined;
  }
  getCode() { 
    if(this.writer == null ) {
      return this.code;
    }
    return this.writer.getCode();
  }
}
class CodeWriter  {
  
  constructor() {
    this.tagName = "";
    this.codeStr = "";
    this.currentLine = "";
    this.tabStr = "  ";
    this.lineNumber = 1;
    this.indentAmount = 0;
    this.tags = {};
    this.slices = [];
    this.current_slice = undefined;
    this.ownerFile = undefined;
    this.forks = [];
    this.tagOffset = undefined;
    this.parent = undefined;
    this.had_nl = true;
    this.current_slice = new CodeSlice();
    this.slices.push(this.current_slice);
  }
  addImport(name) { 
    if(this.ownerFile != null ) {
      this.ownerFile.addImport(name)
    } else {
      if(this.parent != null ) {
        this.parent.addImport(name)
      }
    }
  }
  indent(delta) { 
    this.indentAmount = delta + this.indentAmount;
    if(this.indentAmount<0) {
      this.indentAmount = 0;
    }
  }
  addIndent() { 
    var i = 0;
    if(this.currentLine.length==0) {
      while(i<this.indentAmount) {
        this.currentLine = this.currentLine + this.tabStr;
        i = i + 1;
      }
    }
  }
  createTag(name) { 
    var new_writer = new CodeWriter();
    var new_slice = new CodeSlice();
    this.tags[name] = this.slices.length;
    this.slices.push(new_slice);
    new_slice.writer = new_writer;
    new_writer.indentAmount = this.indentAmount;
    var new_active_slice = new CodeSlice();
    this.slices.push(new_active_slice);
    this.current_slice = new_active_slice;
    new_writer.parent = this;
    return new_writer;
  }
  getTag(name) { 
    if(typeof(this.tags[name]) != "undefined") {
      var idx = this.tags[name];
      var slice = this.slices[idx];
      return slice.writer;
    } else {
      if(this.parent != null ) {
        return this.parent.getTag(name);
      }
    }
    return this;
  }
  hasTag(name) { 
    if(typeof(this.tags[name]) != "undefined") {
      return true;
    } else {
      if(this.parent != null ) {
        return this.parent.hasTag(name);
      }
    }
    return false;
  }
  fork() { 
    var new_writer = new CodeWriter();
    var new_slice = new CodeSlice();
    this.slices.push(new_slice);
    new_slice.writer = new_writer;
    new_writer.indentAmount = this.indentAmount;
    new_writer.parent = this;
    var new_active_slice = new CodeSlice();
    this.slices.push(new_active_slice);
    this.current_slice = new_active_slice;
    return new_writer;
  }
  newline() { 
    /**"Inserts newline if necessary"*/
    if(this.currentLine.length>0) {
      this.out("",true)
    }
  }
  writeSlice(str, newLine) { 
    this.addIndent()
    this.currentLine = this.currentLine + str;
    if(newLine) {
      this.current_slice.code = this.current_slice.code + this.currentLine + "\n";
      this.currentLine = "";
    }
  }
  /**"out function accepts string and newline parameter"*/
  out(str, newLine) { 
    var lines = str.split("\n");
    var rowCnt = lines.length;
    if(rowCnt==1) {
      this.writeSlice(str,newLine)
    } else {
      for( var idx= 0; idx< lines.length; idx++) { 
        var row= lines[idx];
        this.addIndent()
        if(idx<(rowCnt - 1)) {
          this.writeSlice(row.trim(),true)
        } else {
          this.writeSlice(row,newLine)
        }
      }
    }
  }
  getCode() { 
    var res = "";
    for( var idx= 0; idx< this.slices.length; idx++) { 
      var slice= this.slices[idx];
      res = res + (slice.getCode());
    }
    res = res + this.currentLine;
    return res;
  }
}
class CodeWriterTester  {
  
  constructor() {
  }
  test1() { 
    var fs = new CodeFileSystem();
    var testFile = fs.getFile("root","test.java");
    var wr = testFile.getWriter();
    wr.addImport("java.utils.*")
    wr.out("\n                \n\/\/ this is a sample output from LISP code\n\nclass mySampleClass {\n\n}                               \n                ",true)
    testFile.addImport("java.io.*")
    var iWriter = wr.getTag("imports");
    var i_list = testFile.getImports();
    for( var idx= 0; idx< i_list.length; idx++) { 
      var str= i_list[idx];
      iWriter.out("import " + str + ";",true)
    }
    fs.printFilesList()
  }
}
class RangerLispParser  {
  
  constructor(code_module) {
    this.code = undefined;
    this.s = undefined;
    this.len = undefined;
    this.i = 0;
    this.parents = [];
    this.next = undefined;
    this.paren_cnt = 0;
    this.rootNode = undefined;
    this.curr_node = undefined;
    this.had_error = false;
    this.s = code_module.code;
    this.code = code_module;
    this.len = code_module.code.length;
  }
  getCode() { 
    return this.rootNode.getCode();
  }
  parse() { 
    try {
      var c;
      var next_c;
      var fc;
      var new_node;
      var sp = this.i;
      var ep = this.i;
      var last_i = 0;
      while(this.i<this.len) {
        if(this.had_error) {
          break;
        }
        last_i = this.i;
        while((this.i<this.len) && (this.s.charCodeAt(this.i)<=32)) {
          this.i = 1 + this.i;
        }
        if(this.i<this.len) {
          c = this.s.charCodeAt(this.i);
          if(c==59) {
            sp = this.i + 1;
            while((this.i<this.len) && (this.s.charCodeAt(this.i)>31)) {
              this.i = 1 + this.i;
            }
            new_node = new CodeNode(this.code,sp,this.i);
            new_node.value_type = 9;
            new_node.string_value = this.s.substring(sp, this.i);
            this.curr_node.comments.push(new_node);
            continue;
          }
          if(this.i<(this.len - 1)) {
            fc = this.s.charCodeAt((this.i + 1));
            if((c==40) || ((c==39) && (fc==40)) || ((c==96) && (fc==40))) {
              this.paren_cnt = this.paren_cnt + 1;
              if(this.curr_node == null ) {
                this.curr_node = new CodeNode(this.code,this.i,this.i);
                if(c==96) {
                  this.curr_node.value_type = 22;
                }
                if(c==39) {
                  this.curr_node.value_type = 21;
                }
                this.curr_node.expression = true;
                this.rootNode = this.curr_node;
                this.parents.push(this.curr_node);
              } else {
                new_node = new CodeNode(this.code,this.i,this.i);
                if(c==96) {
                  new_node.value_type = 22;
                }
                if(c==39) {
                  new_node.value_type = 21;
                }
                new_node.expression = true;
                this.curr_node.children.push(new_node);
                this.curr_node = new_node;
                this.parents.push(this.curr_node);
              }
              this.i = 1 + this.i;
              this.parse()
              continue;
            }
          }
          sp = this.i;
          ep = this.i;
          fc = this.s.charCodeAt(this.i);
          if(((fc==45) && (this.s.charCodeAt((this.i + 1))>=46) && (this.s.charCodeAt((this.i + 1))<=57)) || ((fc>=48) && (fc<=57))) {
            var is_double = false;
            sp = this.i;
            this.i = 1 + this.i;
            c = this.s.charCodeAt(this.i);
            while((this.i<this.len) && (((c>=48) && (c<=57)) || (c=="e".charCodeAt(0)) || (c=="E".charCodeAt(0)) || (c==".".charCodeAt(0)) || (c=="+".charCodeAt(0)) || (c=="-".charCodeAt(0)))) {
              if((c=="e".charCodeAt(0)) || (c=="E".charCodeAt(0)) || (c==".".charCodeAt(0))) {
                is_double = true;
              }
              this.i = 1 + this.i;
              c = this.s.charCodeAt(this.i);
            }
            ep = this.i;
            new_node = new CodeNode(this.code,sp,ep);
            if(is_double) {
              new_node.value_type = 1;
              new_node.double_value = parseFloat(this.s.substring(sp, ep));
            } else {
              new_node.value_type = 2;
              new_node.int_value = parseInt(this.s.substring(sp, ep));
            }
            this.curr_node.children.push(new_node);
            continue;
          }
          if(fc==34) {
            sp = this.i + 1;
            ep = sp;
            c = this.s.charCodeAt(this.i);
            var must_encode = false;
            while(this.i<this.len) {
              this.i = 1 + this.i;
              c = this.s.charCodeAt(this.i);
              if(c==34) {
                break;
              }
              if(c==92) {
                this.i = 1 + this.i;
                if(this.i<this.len) {
                  must_encode = true;
                  c = this.s.charCodeAt(this.i);
                } else {
                  break;
                }
              }
            }
            ep = this.i;
            if(this.i<this.len) {
              var encoded_str = "";
              if(must_encode) {
                var orig_str = this.s.substring(sp, ep);
                var str_length = orig_str.length;
                var ii = 0;
                while(ii<str_length) {
                  var cc = orig_str.charCodeAt(ii);
                  if(cc==92) {
                    var next_ch = orig_str.charCodeAt((ii + 1));
                    switch(next_ch) {
                      case 34:
                        encoded_str = encoded_str + String.fromCharCode(34);
                        break;
                      case 92:
                        encoded_str = encoded_str + String.fromCharCode(92);
                        break;
                      case 47:
                        encoded_str = encoded_str + String.fromCharCode(47);
                        break;
                      case 98:
                        encoded_str = encoded_str + String.fromCharCode(8);
                        break;
                      case 102:
                        encoded_str = encoded_str + String.fromCharCode(12);
                        break;
                      case 110:
                        encoded_str = encoded_str + String.fromCharCode(10);
                        break;
                      case 114:
                        encoded_str = encoded_str + String.fromCharCode(13);
                        break;
                      case 116:
                        encoded_str = encoded_str + String.fromCharCode(9);
                        break;
                      case 117:
                        ii = ii + 4;
                        break;
                    }
                    ii = ii + 2;
                  } else {
                    encoded_str = encoded_str + orig_str.substring(ii, (1 + ii));
                    ii = ii + 1;
                  }
                }
              }
              new_node = new CodeNode(this.code,sp,ep);
              new_node.value_type = 3;
              if(must_encode) {
                new_node.string_value = encoded_str;
              } else {
                new_node.string_value = this.s.substring(sp, ep);
              }
              this.curr_node.children.push(new_node);
              this.i = 1 + this.i;
              continue;
            }
          }
          if((fc=="t".charCodeAt(0)) && (this.s.charCodeAt((this.i + 1))=="r".charCodeAt(0)) && (this.s.charCodeAt((this.i + 2))=="u".charCodeAt(0)) && (this.s.charCodeAt((this.i + 3))=="e".charCodeAt(0))) {
            new_node = new CodeNode(this.code,sp,(sp + 4));
            new_node.value_type = 4;
            new_node.boolean_value = true;
            this.curr_node.children.push(new_node);
            this.i = this.i + 4;
            continue;
          }
          if((fc=="f".charCodeAt(0)) && (this.s.charCodeAt((this.i + 1))=="a".charCodeAt(0)) && (this.s.charCodeAt((this.i + 2))=="l".charCodeAt(0)) && (this.s.charCodeAt((this.i + 3))=="s".charCodeAt(0)) && (this.s.charCodeAt((this.i + 4))=="e".charCodeAt(0))) {
            new_node = new CodeNode(this.code,sp,(sp + 5));
            new_node.value_type = 4;
            new_node.boolean_value = false;
            this.curr_node.children.push(new_node);
            this.i = this.i + 5;
            continue;
          }
          if(fc=="@".charCodeAt(0)) {
            this.i = this.i + 1;
            sp = this.i;
            ep = this.i;
            c = this.s.charCodeAt(this.i);
            while((this.i<this.len) && (this.s.charCodeAt(this.i)>32) && (c!=40) && (c!=41)) {
              this.i = 1 + this.i;
              c = this.s.charCodeAt(this.i);
            }
            ep = this.i;
            if((this.i<this.len) && (ep>sp)) {
              var a_node = new CodeNode(this.code,sp,ep);
              var a_name = this.s.substring(sp, ep);
              a_node.expression = true;
              this.curr_node = a_node;
              this.parents.push(a_node);
              this.i = this.i + 1;
              this.paren_cnt = this.paren_cnt + 1;
              this.parse()
              if(1==a_node.children.length) {
                var ch1 = a_node.children[0];
                if(ch1.isPrimitive()) {
                  this.curr_node.props[a_name] = ch1;
                } else {
                  this.curr_node.props[a_name] = a_node;
                }
              } else {
                this.curr_node.props[a_name] = a_node;
              }
              this.curr_node.prop_keys.push(a_name);
              continue;
            }
          }
          var ns_list = [];
          var last_ns = this.i;
          var ns_cnt = 1;
          while((this.i<this.len) && (this.s.charCodeAt(this.i)>32) && (c!=58) && (c!=40) && (c!=41)) {
            this.i = 1 + this.i;
            c = this.s.charCodeAt(this.i);
            if(c==".".charCodeAt(0)) {
              ns_list.push(this.s.substring(last_ns, this.i));
              last_ns = this.i + 1;
              ns_cnt = 1 + ns_cnt;
            }
          }
          ns_list.push(this.s.substring(last_ns, this.i));
          ep = this.i;
          while((this.i<this.len) && (this.s.charCodeAt(this.i)<=32)) {
            this.i = 1 + this.i;
            c = this.s.charCodeAt(this.i);
          }
          if(c==58) {
            this.i = this.i + 1;
            while((this.i<this.len) && (this.s.charCodeAt(this.i)<=32)) {
              this.i = 1 + this.i;
            }
            var vt_sp = this.i;
            var vt_ep = this.i;
            c = this.s.charCodeAt(this.i);
            if(c=="(".charCodeAt(0)) {
              var a_node = new CodeNode(this.code,sp,ep);
              a_node.expression = true;
              this.curr_node = a_node;
              this.parents.push(a_node);
              this.i = this.i + 1;
              this.parse()
              new_node = new CodeNode(this.code,sp,vt_ep);
              new_node.vref = this.s.substring(sp, ep);
              new_node.ns = ns_list;
              new_node.expression_value = a_node;
              new_node.value_type = 10;
              this.curr_node.children.push(new_node);
              continue;
            }
            if(c=="[".charCodeAt(0)) {
              this.i = this.i + 1;
              vt_sp = this.i;
              var hash_sep = 0;
              c = this.s.charCodeAt(this.i);
              while((this.i<this.len) && (c>32) && (c!=93)) {
                this.i = 1 + this.i;
                c = this.s.charCodeAt(this.i);
                if(c==":".charCodeAt(0)) {
                  hash_sep = this.i;
                }
              }
              vt_ep = this.i;
              if(hash_sep>0) {
                vt_ep = this.i;
                var type_name = this.s.substring((1 + hash_sep), vt_ep);
                var key_type_name = this.s.substring(vt_sp, hash_sep);
                new_node = new CodeNode(this.code,sp,vt_ep);
                new_node.vref = this.s.substring(sp, ep);
                new_node.ns = ns_list;
                new_node.value_type = 6;
                new_node.array_type = type_name;
                new_node.key_type = key_type_name;
                new_node.parent = this.curr_node;
                this.curr_node.children.push(new_node);
                this.i = 1 + this.i;
                continue;
              } else {
                vt_ep = this.i;
                var type_name = this.s.substring(vt_sp, vt_ep);
                new_node = new CodeNode(this.code,sp,vt_ep);
                new_node.vref = this.s.substring(sp, ep);
                new_node.ns = ns_list;
                new_node.value_type = 5;
                new_node.array_type = type_name;
                new_node.parent = this.curr_node;
                this.curr_node.children.push(new_node);
                this.i = 1 + this.i;
                continue;
              }
            }
            while((this.i<this.len) && (this.s.charCodeAt(this.i)>32) && (c!=58) && (c!=40) && (c!=41)) {
              this.i = 1 + this.i;
              c = this.s.charCodeAt(this.i);
            }
            if(this.i<this.len) {
              vt_ep = this.i;
              var type_name = this.s.substring(vt_sp, vt_ep);
              new_node = new CodeNode(this.code,sp,ep);
              new_node.vref = this.s.substring(sp, ep);
              new_node.ns = ns_list;
              new_node.value_type = 8;
              new_node.type_name = this.s.substring(vt_sp, vt_ep);
              new_node.parent = this.curr_node;
              this.curr_node.children.push(new_node);
              continue;
            }
          } else {
            if((this.i<this.len) && (ep>sp)) {
              new_node = new CodeNode(this.code,sp,ep);
              new_node.vref = this.s.substring(sp, ep);
              new_node.value_type = 8;
              new_node.ns = ns_list;
              new_node.parent = this.curr_node;
              this.curr_node.children.push(new_node);
            }
          }
          if(c==41) {
            this.i = 1 + this.i;
            this.paren_cnt = this.paren_cnt - 1;
            if(this.paren_cnt<0) {
              throw  "Parser error ) mismatch";
            }
            this.parents.pop()
            if(this.curr_node != null ) {
              this.curr_node.ep = this.i;
            }
            if(this.parents.length>0) {
              this.curr_node = this.parents[(this.parents.length - 1)];
            } else {
              this.curr_node = this.rootNode;
            }
            break;
          }
          if(last_i==this.i) {
            this.i = 1 + this.i;
          }
        }
      }
    } catch(e) {
      console.log(e);
      if(this.curr_node != null ) {
        var line_index = this.curr_node.getLine();
        line_index = this.curr_node.getLine();
        console.log((this.curr_node.getFilename()) + " Line: " + line_index);
        console.log("Parser error close to");
        console.log(this.curr_node.getLineString(line_index));
        this.had_error = true;
      }
    }
  }
}
class RangerCompilerError  {
  
  constructor() {
    this.error_level = 0;
    this.code_line = 0;
    this.fileName = "";
    this.description = "";
    this.node = undefined;
  }
}
class RangerNodeValue  {
  
  constructor() {
    this.double_value = undefined;
    this.string_value = undefined;
    this.int_value = undefined;
    this.boolean_value = undefined;
    this.expression_value = undefined;
  }
}
class RangerAppParamDesc  {
  
  constructor() {
    this.name = "";
    this.ref_cnt = 0;
    this.set_cnt = 0;
    this.value_type = undefined;
    this.has_default = false;
    this.def_value = undefined;
    this.default_value = undefined;
    this.is_optional = false;
    this.is_mutating = false;
    this.is_set = false;
    this.is_class_variable = false;
    this.node = undefined;
    this.nameNode = undefined;
    this.description = "";
    this.git_doc = "";
  }
}
class RangerAppFunctionDesc  {
  
  constructor() {
    this.name = "";
    this.nameNode = undefined;
    this.params = [];
    this.return_value = undefined;
    this.is_method = false;
    this.container_class = undefined;
    this.body_ast = undefined;
    this.body_str = undefined;
  }
}
class RangerAppEnum  {
  
  constructor() {
    this.name = "";
    this.cnt = 0;
    this.values = {};
    this.node = undefined;
  }
  add(n) { 
    this.values[n] = this.cnt;
    this.cnt = this.cnt + 1;
  }
}
class RangerAppClassDesc  {
  
  constructor() {
    this.name = "";
    this.variables = [];
    this.methods = [];
    this.defined_methods = {};
    this.has_constructor = false;
    this.constructor_node = undefined;
    this.has_desctructor = false;
    this.descructor_node = undefined;
    this.extends_classes = [];
    this.contr_writers = [];
  }
  hasMethod(m_name) { 
    return typeof(this.defined_methods[m_name]) != "undefined";
  }
  findMethod(f_name) { 
    for( var i= 0; i< this.methods.length; i++) { 
      var m= this.methods[i];
      if(m.name==f_name) {
        return m;
      }
    }
  }
  findVariable(f_name) { 
    for( var i= 0; i< this.variables.length; i++) { 
      var m= this.variables[i];
      if(m.name==f_name) {
        return m;
      }
    }
  }
  addParentClass(p_name) { 
    this.extends_classes.push(p_name);
  }
  addVariable(desc) { 
    this.variables.push(desc);
  }
  addMethod(desc) { 
    this.defined_methods[desc.name] = true;
    this.methods.push(desc);
  }
  addConstructor(desc) { 
    this.constructor_node = desc;
    this.has_constructor = true;
  }
  addDesctructor(desc) { 
    this.descructor_node = desc;
    this.has_desctructor = true;
  }
}
class RangerAppWriterContext  {
  
  constructor() {
    this.ctx = undefined;
    this.parent = undefined;
    this.defined_imports = [];
    this.already_imported = {};
    this.fileSystem = undefined;
    this.in_expression = false;
    this.expr_stack = [];
    this.in_method = false;
    this.method_stack = [];
    this.currentClassName = undefined;
    this.currentClass = undefined;
    this.definedEnums = {};
    this.definedClasses = {};
    this.definedClassList = [];
    this.localVariables = {};
    this.localVarNames = [];
    this.compilerErrors = [];
    this.compilerMessage = [];
    this.localTmpVariables = {};
    this.localFinalTmpVariables = {};
    this.localTmpVarNames = [];
    this.tmpVarConversions = {};
    this.fileSystem = new CodeFileSystem();
  }
  addError(node, descr) { 
    var e = new RangerCompilerError();
    e.description = descr;
    e.node = node;
    var root = this.getRoot();
    root.compilerErrors.push(e);
  }
  defTmpVarName(name) { 
    this.localTmpVariables[name] = true;
  }
  isFinalTmpVarName(name) { 
    if(this.isVarDefined(name)
    ) {
      return true;
    }
    if(typeof(this.localFinalTmpVariables[name]) != "undefined") {
      return true;
    }
    if(this.parent != null ) {
      this.parent.isFinalTmpVarName(name)
    }
    return false;
  }
  getTmpVarName(name) { 
    if(typeof(this.tmpVarConversions[name]) != "undefined") {
      return this.tmpVarConversions[name];
    }
    if(false==this.isFinalTmpVarName(name)) {
      this.tmpVarConversions[name] = name;
      this.localFinalTmpVariables[name] = true;
      return name;
    }
    var idx = 2;
    var maxLoops = 10000;
    while(maxLoops>0) {
      var test_str = name + idx;
      if(false==this.isFinalTmpVarName(test_str)) {
        this.tmpVarConversions[name] = test_str;
        this.localFinalTmpVariables[test_str] = true;
        return test_str;
      }
      idx = idx + 1;
      maxLoops = maxLoops - 1;
    }
    console.log("ERROR, could not convert variable " + name + " to tmp variable");
    return "__tmp__";
  }
  isEnumDefined(n) { 
    if(typeof(this.definedEnums[n]) != "undefined") {
      return true;
    }
    if(this.parent == null ) {
      return false;
    }
    return this.parent.isEnumDefined(n);
  }
  getEnum(n) { 
    if(typeof(this.definedEnums[n]) != "undefined") {
      return this.definedEnums[n];
    }
    if(this.parent == null ) {
      return new RangerAppEnum();
    }
    return this.parent.getEnum(n);
  }
  isVarDefined(name) { 
    if(typeof(this.localVariables[name]) != "undefined") {
      return true;
    }
    if(this.parent == null ) {
      return false;
    }
    return this.parent.isVarDefined(name);
  }
  getVariableDef(name) { 
    if(typeof(this.localVariables[name]) != "undefined") {
      return this.localVariables[name];
    }
    if(this.parent == null ) {
      var tmp = new RangerAppParamDesc();
      return tmp;
    }
    return this.parent.getVariableDef(name);
  }
  defineVariable(name, desc) { 
    this.localVariables[name] = desc;
    this.localVarNames.push(name);
  }
  isDefinedClass(name) { 
    if(typeof(this.definedClasses[name]) != "undefined") {
      return true;
    } else {
      if(this.parent != null ) {
        return this.parent.isDefinedClass(name);
      }
    }
    return false;
  }
  getRoot() { 
    if(this.parent == null ) {
      return this;
    } else {
      return this.parent.getRoot();
    }
  }
  addClass(name, desc) { 
    var root = this.getRoot()
    ;
    if(typeof(name[root.definedClasses]) != "undefined") {
      console.log("ERROR: class " + name + " already defined");
    } else {
      root.definedClasses[name] = desc;
      root.definedClassList.push(name);
    }
  }
  findClass(name) { 
    var root = this.getRoot()
    ;
    return root.definedClasses[name];
  }
  getCurrentClass() { 
    if(this.currentClass != null ) {
      return this.currentClass;
    }
    if(this.parent != null ) {
      return this.parent.getCurrentClass();
    }
    return new RangerAppClassDesc();
  }
  isInExpression() { 
    if(this.expr_stack.length>0) {
      return true;
    }
    if(this.parent != null ) {
      return this.parent.isInExpression();
    }
    return false;
  }
  expressionLevel() { 
    var level = this.expr_stack.length;
    if(this.parent != null ) {
      return level + (this.parent.expressionLevel());
    }
    return level;
  }
  setInExpr() { 
    this.expr_stack.push(true);
  }
  unsetInExpr() { 
    this.expr_stack.pop()
  }
  isInMethod() { 
    if(this.method_stack.length>0) {
      return true;
    }
    if(this.parent != null ) {
      return this.parent.isInMethod();
    }
    return false;
  }
  setInMethod() { 
    this.method_stack.push(true);
  }
  unsetInMethod() { 
    this.method_stack.pop()
  }
  fork() { 
    var new_ctx = new RangerAppWriterContext();
    new_ctx.parent = this;
    return new_ctx;
  }
}
class RangerCommonWriter  {
  
  constructor() {
  }
  getWriterLang() { 
    return "common";
  }
  EncodeString(orig_str) { 
    var encoded_str = "";
    var str_length = orig_str.length;
    var ii = 0;
    while(ii<str_length) {
      var cc = orig_str.charCodeAt(ii);
      switch(cc) {
        case 8:
          encoded_str = encoded_str + String.fromCharCode(92) + String.fromCharCode(98);
          break;
        case 9:
          encoded_str = encoded_str + String.fromCharCode(92) + String.fromCharCode(116);
          break;
        case 10:
          encoded_str = encoded_str + String.fromCharCode(92) + String.fromCharCode(110);
          break;
        case 12:
          encoded_str = encoded_str + String.fromCharCode(92) + String.fromCharCode(102);
          break;
        case 13:
          encoded_str = encoded_str + String.fromCharCode(92) + String.fromCharCode(114);
          break;
        case 34:
          encoded_str = encoded_str + String.fromCharCode(92) + String.fromCharCode(34);
          break;
        case 92:
          encoded_str = encoded_str + String.fromCharCode(92) + String.fromCharCode(92);
          break;
        case 47:
          encoded_str = encoded_str + String.fromCharCode(92) + String.fromCharCode(47);
          break;
        default: 
          encoded_str = encoded_str + String.fromCharCode(cc);
          break;
      }
      ii = 1 + ii;
    }
    return encoded_str;
  }
  cmdEnum(node, ctx, wr) { 
    var fNameNode = node.children[1];
    var enumList = node.children[2];
    var new_enum = new RangerAppEnum();
    for( var i= 0; i< enumList.children.length; i++) { 
      var item= enumList.children[i];
      new_enum.add(item.vref)
    }
    ctx.definedEnums[fNameNode.vref] = new_enum;
  }
  findParamDesc(obj, ctx, wr) { 
    var varDesc;
    if(obj.vref==this.getThisName()) {
      varDesc = new RangerAppParamDesc();
      return varDesc;
    } else {
      if(obj.ns.length>1) {
        var cnt = obj.ns.length;
        var classRefDesc;
        for( var i= 0; i< obj.ns.length; i++) { 
          var strname= obj.ns[i];
          if(i==0) {
            classRefDesc = ctx.getVariableDef(strname);
            if(classRefDesc == null ) {
              ctx.addError(obj,"Error, no description for called object: " + strname)
              break;
            }
            var classDesc;
            classDesc = ctx.findClass(classRefDesc.nameNode.type_name);
          } else {
            varDesc = classDesc.findVariable(strname);
          }
        }
        return varDesc;
      }
      varDesc = ctx.getVariableDef(obj.vref);
      if(varDesc.nameNode != null ) {
      } else {
        console.log("findParamDesc : description not found for " + obj.vref);
        if(varDesc != null ) {
          console.log("Vardesc was found though..." + varDesc.name);
        }
        ctx.addError(obj,"Error, no description for called object: " + obj.vref)
      }
      return varDesc;
    }
  }
  shouldBeEqualTypes(n1, n2, ctx) { 
    if((n1.eval_type!=0) && (n2.eval_type!=0) && (n1.eval_type_name.length>0) && (n2.eval_type_name.length>0)) {
      if(n1.eval_type_name==n2.eval_type_name) {
      } else {
        var b_ok = false;
        if((ctx.isEnumDefined(n1.eval_type_name)) && (n2.eval_type_name=="int")) {
          b_ok = true;
        }
        if((ctx.isEnumDefined(n2.eval_type_name)) && (n1.eval_type_name=="int")) {
          b_ok = true;
        }
        if((n1.eval_type_name=="char") && (n2.eval_type_name=="int")) {
          b_ok = true;
        }
        if((n1.eval_type_name=="int") && (n2.eval_type_name=="char")) {
          b_ok = true;
        }
        if(b_ok==false) {
          ctx.addError(n1,"Type mismatch " + n2.eval_type_name + " <> " + n1.eval_type_name)
        }
      }
    }
  }
  shouldBeType(type_name, n1, ctx) { 
    if((n1.eval_type!=0) && (n1.eval_type_name.length>0)) {
      if(n1.eval_type_name==type_name) {
      } else {
        var b_ok = false;
        if((ctx.isEnumDefined(n1.eval_type_name)) && (type_name=="int")) {
          b_ok = true;
        }
        if((ctx.isEnumDefined(type_name)) && (n1.eval_type_name=="int")) {
          b_ok = true;
        }
        if((n1.eval_type_name=="char") && (type_name=="int")) {
          b_ok = true;
        }
        if((n1.eval_type_name=="int") && (type_name=="char")) {
          b_ok = true;
        }
        if(b_ok==false) {
          ctx.addError(n1,"Type mismatch " + type_name + " <> " + n1.eval_type_name)
        }
      }
    }
  }
  cmdImport(node, ctx, wr) { 
    try {
      var fNameNode = node.children[1];
      var import_file = fNameNode.string_value;
      if(typeof(ctx.already_imported[import_file]) != "undefined") {
        return false;
      } else {
        ctx.already_imported[import_file] = true;
      }
      var c = require("fs").readFileSync( process.cwd() + "/" + "." + "/" + import_file, "utf8");
      var code = new SourceCode(c);
      code.filename = import_file;
      var parser = new RangerLispParser(code);
      parser.parse()
      var rnode = parser.rootNode;
      this.CollectMethods(rnode,ctx,wr)
      this.StartCodeWriting(rnode,ctx,wr)
      return true;
    } catch(e) {
      console.log(e);
      throw  "ERROR: import failed, possibly invalid Import filename: " + import_file;
    }
  }
  CreateClass(node, ctx, wr) { 
    wr.out("----Create class is not defined---- :(",true)
  }
  getThisName() { 
    return "this";
  }
  WriteThisVar(node, ctx, wr) { 
    wr.out(this.getThisName()
    ,false)
  }
  WriteVRef(node, ctx, wr) { 
    if(node.vref=="_") {
      return;
    }
    var rootObjName = node.ns[0];
    if(ctx.isEnumDefined(rootObjName)) {
      var enumName = node.ns[1];
      var e = ctx.getEnum(rootObjName);
      wr.out((e.values[enumName]) + "",false)
      return 1;
    }
    if(ctx.isVarDefined(rootObjName)) {
      var vDef = ctx.getVariableDef(rootObjName);
      if(vDef.is_class_variable) {
        this.WriteThisVar(node,ctx,wr)
        wr.out(".",false)
        wr.out(node.vref,false)
        return 1;
      }
      vDef = this.findParamDesc(node,ctx,wr);
      if(vDef != null ) {
        var vNameNode = vDef.nameNode;
        if((vNameNode != null ) && (vNameNode.type_name != null )) {
          node.eval_type = 8;
          node.eval_type_name = vNameNode.type_name;
        }
      }
    } else {
      var class_or_this = rootObjName==this.getThisName();
      if(ctx.isDefinedClass(rootObjName)) {
        class_or_this = true;
      }
      if(class_or_this) {
      } else {
        var desc = ctx.getCurrentClass();
        ctx.addError(node,"Undefined variable " + rootObjName + " in class " + desc.name)
      }
    }
    wr.out(node.vref,false)
  }
  Constructor(node, ctx, wr) { 
    var subCtx = ctx.fork();
    var cw = wr.getTag("constructor");
    var cParams = node.children[1];
    for( var i= 0; i< cParams.children.length; i++) { 
      var cn= cParams.children[i];
      var p = new RangerAppParamDesc();
      p.name = cn.vref;
      p.value_type = cn.value_type;
      p.node = cn;
      p.nameNode = cn;
      p.is_optional = false;
      subCtx.defineVariable(p.name,p)
    }
    var cBody = node.getThird();
    ctx.setInMethod()
    this.WalkNode(cBody,subCtx,cw)
    ctx.unsetInMethod()
  }
  WriteScalarValue(node, ctx, wr) { 
    node.eval_type = node.value_type;
    switch(node.value_type) {
      case 1:
        wr.out("" + node.double_value,false)
        node.eval_type_name = "double";
        break;
      case 3:
        wr.out(String.fromCharCode(34) + (this.EncodeString(node.string_value)) + String.fromCharCode(34),false)
        node.eval_type_name = "string";
        break;
      case 2:
        wr.out("" + node.int_value,false)
        node.eval_type_name = "int";
        break;
      case 4:
        if(node.boolean_value) {
          wr.out("true",false)
        } else {
          wr.out("false",false)
        }
        node.eval_type_name = "boolean";
        break;
    }
  }
  cmdNew(node, ctx, wr) { 
    var obj = node.getSecond();
    var params = node.getThird();
    if((ctx.expressionLevel())>1) {
      wr.out("(",false)
    }
    wr.out("new ",false)
    ctx.setInExpr()
    this.WalkNode(obj,ctx,wr)
    wr.out("(",false)
    for( var i= 0; i< params.children.length; i++) { 
      var arg= params.children[i];
      if(i>0) {
        wr.out(",",false)
      }
      this.WalkNode(arg,ctx,wr)
    }
    wr.out(")",false)
    ctx.unsetInExpr()
    if((ctx.expressionLevel())>1) {
      wr.out(")",false)
    }
    if((ctx.expressionLevel())==0) {
      wr.newline()
    }
    node.eval_type = 7;
    node.eval_type_name = obj.vref;
  }
  cmdLocalCall(node, ctx, wr) { 
    var fnNode = node.getFirst();
    var desc = ctx.getCurrentClass();
    if(desc.hasMethod(fnNode.vref)) {
      var subCtx = ctx.fork();
      var p = new RangerAppParamDesc();
      p.name = fnNode.vref;
      p.value_type = fnNode.value_type;
      p.node = fnNode;
      p.nameNode = fnNode;
      subCtx.defineVariable(p.name,p)
      subCtx.setInExpr()
      this.WriteThisVar(fnNode,subCtx,wr)
      wr.out(".",false)
      this.WalkNode(fnNode,subCtx,wr)
      wr.out("(",false)
      for( var i= 0; i< node.children.length; i++) { 
        var arg= node.children[i];
        if(i<1) {
          continue;
        }
        if(i>1) {
          wr.out(",",false)
        }
        this.WalkNode(arg,subCtx,wr)
      }
      wr.out(")",false)
      ctx.unsetInExpr()
      if((ctx.expressionLevel())==0) {
        wr.newline()
      }
      return true;
    } else {
      return false;
    }
    return false;
  }
  cmdCall(node, ctx, wr) { 
    var obj = node.getSecond();
    var method = node.getThird();
    var subCtx = ctx.fork();
    var p = new RangerAppParamDesc();
    p.name = method.vref;
    p.value_type = method.value_type;
    p.node = method;
    p.nameNode = method;
    subCtx.defineVariable(p.name,p)
    var varDesc;
    if(obj.vref==this.getThisName()) {
    } else {
      varDesc = this.findParamDesc(obj,subCtx,wr);
      if(varDesc != null ) {
        var className = varDesc.nameNode.type_name;
        var classDesc = ctx.findClass(className);
        if(classDesc != null ) {
          var fnDescr = classDesc.findMethod(method.vref);
        } else {
          ctx.addError(obj,"ERROR, could not find class " + className)
        }
      } else {
        console.log("description not found for " + obj.vref);
        if(varDesc != null ) {
          console.log("Vardesc was found though..." + varDesc.name);
        }
        ctx.addError(obj,"Error, no description for called object: " + obj.vref)
      }
    }
    if((subCtx.expressionLevel())==0) {
      wr.newline()
    }
    if((subCtx.expressionLevel())>1) {
      wr.out("(",false)
    }
    if(node.children.length>3) {
      var params = node.children[3];
      subCtx.setInExpr()
      this.WalkNode(obj,subCtx,wr)
      wr.out(".",false)
      this.WalkNode(method,subCtx,wr)
      wr.out("(",false)
      for( var i= 0; i< params.children.length; i++) { 
        var arg= params.children[i];
        if(i>0) {
          wr.out(",",false)
        }
        this.WalkNode(arg,subCtx,wr)
      }
      wr.out(")",false)
      subCtx.unsetInExpr()
    } else {
      subCtx.setInExpr()
      this.WalkNode(obj,subCtx,wr)
      wr.out(".",false)
      this.WalkNode(method,subCtx,wr)
      wr.out("()",false)
      subCtx.unsetInExpr()
    }
    if((subCtx.expressionLevel())>1) {
      wr.out(")",false)
    }
    if((subCtx.expressionLevel())==0) {
      wr.newline()
    }
  }
  cmdJoin(node, ctx, wr) { 
    var n1 = node.getSecond();
    var n2 = node.getThird();
    ctx.setInExpr()
    this.WalkNode(n1,ctx,wr)
    ctx.unsetInExpr()
    wr.out(".join(",false)
    this.WalkNode(n2,ctx,wr)
    wr.out(")",false)
  }
  cmdSplit(node, ctx, wr) { 
    var n1 = node.getSecond();
    var n2 = node.getThird();
    ctx.setInExpr()
    this.WalkNode(n1,ctx,wr)
    ctx.unsetInExpr()
    wr.out(".split(",false)
    this.WalkNode(n2,ctx,wr)
    wr.out(")",false)
  }
  cmdTrim(node, ctx, wr) { 
    var n1 = node.getSecond();
    ctx.setInExpr()
    this.WalkNode(n1,ctx,wr)
    ctx.unsetInExpr()
    wr.out(".trim()",false)
    this.shouldBeType("string",n1,ctx)
  }
  cmdStrlen(node, ctx, wr) { 
    var n1 = node.getSecond();
    ctx.setInExpr()
    this.WalkNode(n1,ctx,wr)
    ctx.unsetInExpr()
    wr.out(".length",false)
    this.shouldBeType("string",n1,ctx)
  }
  cmdSubstring(node, ctx, wr) { 
    var n1 = node.getSecond();
    var start = node.children[2];
    var end = node.children[3];
    ctx.setInExpr()
    this.WalkNode(n1,ctx,wr)
    wr.out(".substring(",false)
    this.WalkNode(start,ctx,wr)
    wr.out(", ",false)
    this.WalkNode(end,ctx,wr)
    wr.out(")",false)
    ctx.unsetInExpr()
    this.shouldBeType("string",n1,ctx)
    this.shouldBeType("int",start,ctx)
    this.shouldBeType("int",end,ctx)
  }
  cmdCharcode(node, ctx, wr) { 
    var n1 = node.getSecond();
    ctx.setInExpr()
    this.WalkNode(n1,ctx,wr)
    wr.out(".charCodeAt(0)",false)
    ctx.unsetInExpr()
  }
  cmdStrfromcode(node, ctx, wr) { 
    var n1 = node.getSecond();
    ctx.setInExpr()
    wr.out("String.fromCharCode(",false)
    this.WalkNode(n1,ctx,wr)
    wr.out(")",false)
    ctx.unsetInExpr()
    this.shouldBeType("int",n1,ctx)
  }
  cmdCharAt(node, ctx, wr) { 
    var n1 = node.getSecond();
    var index = node.children[2];
    ctx.setInExpr()
    this.WalkNode(n1,ctx,wr)
    wr.out(".charCodeAt(",false)
    this.WalkNode(index,ctx,wr)
    wr.out(")",false)
    ctx.unsetInExpr()
    this.shouldBeType("string",n1,ctx)
    this.shouldBeType("int",index,ctx)
  }
  cmdStr2Int(node, ctx, wr) { 
    var n1 = node.getSecond();
    ctx.setInExpr()
    wr.out("parseInt(",false)
    this.WalkNode(n1,ctx,wr)
    ctx.unsetInExpr()
    wr.out(")",false)
    this.shouldBeType("string",n1,ctx)
  }
  cmdStr2Double(node, ctx, wr) { 
    var n1 = node.getSecond();
    ctx.setInExpr()
    wr.out("parseFloat(",false)
    this.WalkNode(n1,ctx,wr)
    ctx.unsetInExpr()
    wr.out(")",false)
    this.shouldBeType("string",n1,ctx)
  }
  cmdDouble2Str(node, ctx, wr) { 
    var n1 = node.getSecond();
    ctx.setInExpr()
    wr.out("(",String.fromCharCode(34),String.fromCharCode(34)," + ",false)
    this.WalkNode(n1,ctx,wr)
    ctx.unsetInExpr()
    wr.out(")",false)
    this.shouldBeType("double",n1,ctx)
  }
  cmdArrayLength(node, ctx, wr) { 
    var n1 = node.getSecond();
    ctx.setInExpr()
    this.WalkNode(n1,ctx,wr)
    ctx.unsetInExpr()
    wr.out(".length",false)
    node.eval_type = 2;
    node.eval_type_name = "int";
  }
  cmdPrint(node, ctx, wr) { 
    var n1 = node.getSecond();
    wr.newline()
    wr.out("console.log(",false)
    ctx.setInExpr()
    this.WalkNode(n1,ctx,wr)
    ctx.unsetInExpr()
    wr.out(");",true)
    this.shouldBeType("string",n1,ctx)
  }
  cmdDoc(node, ctx, wr) { 
    wr.newline()
    wr.out("\/**",false)
    if(node.children.length>1) {
      var fc = node.getSecond();
      this.WalkNode(fc,ctx,wr)
    }
    wr.out("*\/",true)
  }
  cmdContinue(node, ctx, wr) { 
    wr.newline()
    wr.out("continue;",true)
  }
  cmdBreak(node, ctx, wr) { 
    wr.newline()
    wr.out("break;",true)
  }
  cmdThrow(node, ctx, wr) { 
    wr.newline()
    wr.out("throw ",false)
    if(node.children.length>1) {
      var fc = node.getSecond();
      if(fc.vref=="_") {
      } else {
        wr.out(" ",false)
        ctx.setInExpr()
        this.WalkNode(fc,ctx,wr)
        ctx.unsetInExpr()
      }
    }
    wr.out(";",true)
  }
  cmdReturn(node, ctx, wr) { 
    wr.out("return",false)
    if(node.children.length>1) {
      var fc = node.getSecond();
      if(fc.vref=="_") {
      } else {
        wr.out(" ",false)
        ctx.setInExpr()
        this.WalkNode(fc,ctx,wr)
        ctx.unsetInExpr()
      }
    }
    wr.out(";",true)
  }
  cmdRemoveLast(node, ctx, wr) { 
    var obj = node.getSecond();
    wr.newline()
    ctx.setInExpr()
    this.WalkNode(obj,ctx,wr)
    ctx.unsetInExpr()
    wr.out(".pop()",true)
    this.shouldBeType("[]",obj,ctx)
  }
  cmdPush(node, ctx, wr) { 
    var obj = node.getSecond();
    var value = node.getThird();
    wr.newline()
    ctx.setInExpr()
    this.WalkNode(obj,ctx,wr)
    wr.out(".push(",false)
    this.WalkNode(value,ctx,wr)
    ctx.unsetInExpr()
    wr.out(");",true)
  }
  cmdItemAt(node, ctx, wr) { 
    var obj = node.getSecond();
    var index = node.getThird();
    ctx.setInExpr()
    this.WalkNode(obj,ctx,wr)
    wr.out("[",false)
    this.WalkNode(index,ctx,wr)
    ctx.unsetInExpr()
    wr.out("]",false)
    this.shouldBeType("[]",obj,ctx)
    this.shouldBeType("int",index,ctx)
  }
  cmdHas(node, ctx, wr) { 
    var obj = node.getSecond();
    var key = node.getThird();
    if((ctx.expressionLevel())>1) {
      wr.out("(",false)
    }
    wr.out("typeof(",false)
    ctx.setInExpr()
    this.WalkNode(obj,ctx,wr)
    wr.out("[",false)
    this.WalkNode(key,ctx,wr)
    wr.out("]",false)
    ctx.unsetInExpr()
    wr.out(") != " + String.fromCharCode(34) + "undefined" + String.fromCharCode(34),false)
    if((ctx.expressionLevel())>1) {
      wr.out(")",false)
    }
  }
  cmdSet(node, ctx, wr) { 
    var obj = node.getSecond();
    var key = node.getThird();
    var value = node.children[3];
    wr.newline()
    ctx.setInExpr()
    this.WalkNode(obj,ctx,wr)
    wr.out("[",false)
    this.WalkNode(key,ctx,wr)
    wr.out("] = ",false)
    this.WalkNode(value,ctx,wr)
    ctx.unsetInExpr()
    wr.out(";",true)
  }
  cmdGet(node, ctx, wr) { 
    var obj = node.getSecond();
    var key = node.getThird();
    if((ctx.expressionLevel())>1) {
      wr.out("(",false)
    }
    ctx.setInExpr()
    this.WalkNode(obj,ctx,wr)
    wr.out("[",false)
    this.WalkNode(key,ctx,wr)
    wr.out("]",false)
    ctx.unsetInExpr()
    if((ctx.expressionLevel())>1) {
      wr.out(")",false)
    }
  }
  cmdIsNull(node, ctx, wr) { 
    var n1 = node.getSecond();
    if((ctx.expressionLevel())>1) {
      wr.out("(",false)
    }
    ctx.setInExpr()
    this.WalkNode(n1,ctx,wr)
    ctx.unsetInExpr()
    wr.out(" == null ",false)
    if((ctx.expressionLevel())>1) {
      wr.out(")",false)
    }
  }
  cmdNotNull(node, ctx, wr) { 
    var n1 = node.getSecond();
    if((ctx.expressionLevel())>1) {
      wr.out("(",false)
    }
    ctx.setInExpr()
    this.WalkNode(n1,ctx,wr)
    ctx.unsetInExpr()
    wr.out(" != null ",false)
    if((ctx.expressionLevel())>1) {
      wr.out(")",false)
    }
  }
  cmdAssign(node, ctx, wr) { 
    wr.newline()
    var n1 = node.getSecond();
    var n2 = node.getThird();
    this.WalkNode(n1,ctx,wr)
    wr.out(" = ",false)
    ctx.setInExpr()
    this.WalkNode(n2,ctx,wr)
    ctx.unsetInExpr()
    wr.out(";",true)
    this.shouldBeEqualTypes(n1,n2,ctx)
  }
  mathLibCalled(node, ctx, wr) { 
  }
  cmdMathLibOp(node, ctx, wr) { 
    var op = node.getFirst();
    var n1 = node.getSecond();
    wr.out("Math.",false)
    wr.out(op.vref,false)
    wr.out("(",false)
    ctx.setInExpr()
    this.WalkNode(n1,ctx,wr)
    ctx.unsetInExpr()
    wr.out(")",false)
    this.mathLibCalled(node,ctx,wr)
    if((n1.eval_type!=0) && (n1.eval_type_name!="double")) {
      ctx.addError(n1,"Math operator Math." + op.vref + " called with invalid value type: " + n1.eval_type_name)
    }
  }
  cmdComparisionOp(node, ctx, wr) { 
    var op = node.getFirst();
    var n1 = node.getSecond();
    var n2 = node.getThird();
    node.eval_type = 4;
    node.eval_type_name = "boolean";
    if((ctx.expressionLevel())>1) {
      wr.out("(",false)
    }
    ctx.setInExpr()
    this.WalkNode(n1,ctx,wr)
    wr.out(op.vref,false)
    this.WalkNode(n2,ctx,wr)
    ctx.unsetInExpr()
    if((ctx.expressionLevel())>1) {
      wr.out(")",false)
    }
    this.shouldBeEqualTypes(n1,n2,ctx)
  }
  cmdLogicOp(node, ctx, wr) { 
    var op = node.getFirst();
    node.eval_type = 4;
    node.eval_type_name = "boolean";
    var firstChild = node.getSecond();
    for( var i= 0; i< node.children.length; i++) { 
      var ch= node.children[i];
      if(i>1) {
        this.shouldBeEqualTypes(firstChild,ch,ctx)
      }
    }
    if((ctx.expressionLevel())>1) {
      wr.out("(",false)
    }
    for( var i= 0; i< node.children.length; i++) { 
      var item= node.children[i];
      if(i>0) {
        if(i>1) {
          wr.out(" " + op.vref + " ",false)
        }
        ctx.setInExpr()
        this.WalkNode(item,ctx,wr)
        ctx.unsetInExpr()
      }
    }
    if((ctx.expressionLevel())>1) {
      wr.out(")",false)
    }
  }
  cmdPlusOp(node, ctx, wr) { 
    var op = node.getFirst();
    if((ctx.expressionLevel())>1) {
      wr.out("(",false)
    }
    for( var i= 0; i< node.children.length; i++) { 
      var item= node.children[i];
      if(i>0) {
        if(i>1) {
          wr.out(" " + op.vref + " ",false)
        }
        ctx.setInExpr()
        this.WalkNode(item,ctx,wr)
        ctx.unsetInExpr()
      }
    }
    if((ctx.expressionLevel())>1) {
      wr.out(")",false)
    }
  }
  cmdNumericOp(node, ctx, wr) { 
    var op = node.getFirst();
    if((ctx.expressionLevel())>1) {
      wr.out("(",false)
    }
    for( var i= 0; i< node.children.length; i++) { 
      var item= node.children[i];
      if(i>0) {
        if(i>1) {
          wr.out(" " + op.vref + " ",false)
        }
        ctx.setInExpr()
        this.WalkNode(item,ctx,wr)
        ctx.unsetInExpr()
      }
    }
    if((ctx.expressionLevel())>1) {
      wr.out(")",false)
    }
  }
  cmdIf(node, ctx, wr) { 
    wr.newline()
    var n1 = node.getSecond();
    var n2 = node.getThird();
    wr.out("if(",false)
    ctx.setInExpr()
    this.WalkNode(n1,ctx,wr)
    ctx.unsetInExpr()
    wr.out(") {",true)
    wr.indent(1)
    this.WalkNode(n2,ctx,wr)
    wr.newline()
    wr.indent(-1)
    if(node.children.length>3) {
      var elseb = node.children[3];
      wr.out("} else {",true)
      wr.indent(1)
      this.WalkNode(elseb,ctx,wr)
      wr.newline()
      wr.indent(-1)
    }
    wr.out("}",true)
    this.shouldBeType("boolean",n1,ctx)
  }
  cmdFor(node, ctx, wr) { 
    wr.newline()
    var listField = node.children[1];
    var nodeField = node.children[2];
    var indexField = node.children[3];
    var loopField = node.children[4];
    var subCtx = ctx.fork();
    var p = new RangerAppParamDesc();
    p.name = indexField.vref;
    p.value_type = indexField.value_type;
    p.node = indexField;
    p.nameNode = indexField;
    p.is_optional = false;
    subCtx.defineVariable(p.name,p)
    var p2 = new RangerAppParamDesc();
    p2.name = nodeField.vref;
    p2.value_type = nodeField.value_type;
    p2.node = nodeField;
    p2.nameNode = nodeField;
    p2.is_optional = false;
    subCtx.defineVariable(p2.name,p2)
    wr.out("for( var ",false)
    wr.out(indexField.vref,false)
    wr.out("= 0; ",false)
    wr.out(indexField.vref,false)
    wr.out("< ",false)
    this.WriteVRef(listField,ctx,wr)
    wr.out(".length; ",false)
    wr.out(indexField.vref,false)
    wr.out("++) { ",true)
    wr.indent(1)
    wr.out("var ",false)
    wr.out(nodeField.vref,false)
    wr.out("= ",false)
    this.WriteVRef(listField,ctx,wr)
    wr.out("[",false)
    wr.out(indexField.vref,false)
    wr.out("];",true)
    this.WalkNode(loopField,subCtx,wr)
    wr.newline()
    wr.indent(-1)
    wr.out("}",true)
  }
  cmdWhile(node, ctx, wr) { 
    wr.newline()
    var n1 = node.getSecond();
    var n2 = node.getThird();
    wr.out("while(",false)
    ctx.setInExpr()
    this.WalkNode(n1,ctx,wr)
    ctx.unsetInExpr()
    wr.out(") {",true)
    wr.indent(1)
    this.WalkNode(n2,ctx,wr)
    wr.newline()
    wr.indent(-1)
    wr.out("}",true)
    this.shouldBeType("boolean",n1,ctx)
  }
  cmdDefault(node, ctx, wr) { 
    wr.newline()
    var n1 = node.getSecond();
    wr.out("default: ",true)
    wr.indent(1)
    this.WalkNode(n1,ctx,wr)
    wr.newline()
    wr.out("break;",true)
    wr.indent(-1)
  }
  cmdCase(node, ctx, wr) { 
    wr.newline()
    var n1 = node.getSecond();
    var n2 = node.getThird();
    if(n1.expression) {
      for( var i= 0; i< n1.children.length; i++) { 
        var item= n1.children[i];
        wr.out("case ",false)
        ctx.setInExpr()
        this.WalkNode(item,ctx,wr)
        ctx.unsetInExpr()
        wr.out(":",true)
      }
    } else {
      wr.out("case ",false)
      ctx.setInExpr()
      this.WalkNode(n1,ctx,wr)
      ctx.unsetInExpr()
      wr.out(":",true)
    }
    wr.indent(1)
    this.WalkNode(n2,ctx,wr)
    wr.newline()
    wr.out("break;",true)
    wr.indent(-1)
  }
  cmdSwitch(node, ctx, wr) { 
    wr.newline()
    var n1 = node.getSecond();
    wr.out("switch(",false)
    ctx.setInExpr()
    this.WalkNode(n1,ctx,wr)
    ctx.unsetInExpr()
    wr.out(") {",true)
    wr.indent(1)
    for( var i= 0; i< node.children.length; i++) { 
      var cItem= node.children[i];
      if(i>=2) {
        this.WalkNode(cItem,ctx,wr)
      }
    }
    wr.newline()
    wr.indent(-1)
    wr.out("}",true)
  }
  cmdFileRead(node, ctx, wr) { 
  }
  cmdFileWrite(node, ctx, wr) { 
  }
  cmdIsDir(node, ctx, wr) { 
  }
  cmdIsFile(node, ctx, wr) { 
  }
  cmdCreateDir(node, ctx, wr) { 
  }
  cmdArgv(node, ctx, wr) { 
  }
  cmdArgvCnt(node, ctx, wr) { 
  }
  WriteComment(node, ctx, wr) { 
  }
  EnterClass(node, ctx, wr) { 
    var cn = node.children[1];
    var desc = ctx.findClass(cn.vref);
    var subCtx = ctx.fork();
    subCtx.currentClass = desc;
    for( var i= 0; i< desc.variables.length; i++) { 
      var p= desc.variables[i];
      subCtx.defineVariable(p.name,p)
    }
    for( var i= 0; i< desc.variables.length; i++) { 
      var p= desc.variables[i];
      subCtx.defineVariable(p.name,p)
    }
    this.CreateClass(node,subCtx,wr)
  }
  EnterMethod(node, ctx, wr) { 
    var cn = node.children[1];
    var desc = ctx.getCurrentClass();
    var subCtx = ctx.fork();
    var m = desc.findMethod(cn.vref);
    for( var i= 0; i< m.params.length; i++) { 
      var v= m.params[i];
      subCtx.defineVariable(v.name,v)
    }
    this.PublicMethod(node,subCtx,wr)
  }
  EnterVarDef(node, ctx, wr) { 
    if(ctx.isInMethod()) {
      var cn = node.children[1];
      var desc = ctx.currentClass;
      var p = new RangerAppParamDesc();
      p.name = cn.vref;
      p.value_type = cn.value_type;
      p.node = node;
      p.nameNode = cn;
      cn.eval_type = cn.value_type;
      cn.eval_type_name = cn.type_name;
      if(node.children.length>2) {
        p.set_cnt = 1;
        p.def_value = node.children[2];
        p.is_optional = false;
      } else {
        p.is_optional = true;
      }
      ctx.defineVariable(p.name,p)
      this.DefineVar(node,ctx,wr)
      if(node.children.length>2) {
        this.shouldBeEqualTypes(cn,p.def_value,ctx)
      }
    } else {
      var cn = node.children[1];
      cn.eval_type = cn.value_type;
      cn.eval_type_name = cn.type_name;
      this.DefineVar(node,ctx,wr)
      if(node.children.length>2) {
        this.shouldBeEqualTypes(node.children[1],node.children[2],ctx)
      }
    }
  }
  WalkNodeChildren(node, ctx, wr) { 
    if(node.expression) {
      for( var i= 0; i< node.children.length; i++) { 
        var item= node.children[i];
        this.WalkNode(item,ctx,wr)
      }
    }
  }
  WalkNode(node, ctx, wr) { 
    if(node == null ) {
      return false;
    }
    if(node.isPrimitive()) {
      this.WriteScalarValue(node,ctx,wr)
      return true;
    }
    if(node.value_type==8) {
      this.WriteVRef(node,ctx,wr)
      return true;
    }
    if(node.value_type==9) {
      this.WriteComment(node,ctx,wr)
      return true;
    }
    if(node.isFirstVref("Extends")) {
      return true;
    }
    if(node.isFirstVref("Import")) {
      this.cmdImport(node,ctx,wr)
      return true;
    }
    if(node.isFirstVref("def")) {
      this.EnterVarDef(node,ctx,wr)
      return true;
    }
    if(node.isFirstVref("CreateClass")) {
      this.EnterClass(node,ctx,wr)
      return true;
    }
    if(node.isFirstVref("PublicMethod")) {
      this.EnterMethod(node,ctx,wr)
      return true;
    }
    if(node.isFirstVref("Constructor")) {
      this.Constructor(node,ctx,wr)
      return true;
    }
    if(node.children.length>0) {
      var fc = node.children[0];
      if((fc != null ) && (fc.value_type==8)) {
        var was_called = true;
        switch(fc.vref) {
          case "Enum":
            this.cmdEnum(node,ctx,wr)
            break;
          case "if":
            this.cmdIf(node,ctx,wr)
            break;
          case "while":
            this.cmdWhile(node,ctx,wr)
            break;
          case "for":
            this.cmdFor(node,ctx,wr)
            break;
          case "break":
            this.cmdBreak(node,ctx,wr)
            break;
          case "continue":
            this.cmdContinue(node,ctx,wr)
            break;
          case "throw":
            this.cmdThrow(node,ctx,wr)
            break;
          case "switch":
            this.cmdSwitch(node,ctx,wr)
            break;
          case "case":
            this.cmdCase(node,ctx,wr)
            break;
          case "default":
            this.cmdDefault(node,ctx,wr)
            break;
          case "return":
            this.cmdReturn(node,ctx,wr)
            break;
          case "call":
            this.cmdCall(node,ctx,wr)
            break;
          case "new":
            this.cmdNew(node,ctx,wr)
            break;
          case "doc":
            this.cmdDoc(node,ctx,wr)
            break;
          case "print":
            this.cmdPrint(node,ctx,wr)
            break;
          case "has":
            this.cmdHas(node,ctx,wr)
            break;
          case "get":
            this.cmdGet(node,ctx,wr)
            break;
          case "set":
            this.cmdSet(node,ctx,wr)
            break;
          case "null?":
            this.cmdIsNull(node,ctx,wr)
            break;
          case "!null?":
            this.cmdNotNull(node,ctx,wr)
            break;
          case "trim":
            this.cmdTrim(node,ctx,wr)
            break;
          case "join":
            this.cmdJoin(node,ctx,wr)
            break;
          case "strsplit":
            this.cmdSplit(node,ctx,wr)
            break;
          case "strlen":
            this.cmdStrlen(node,ctx,wr)
            break;
          case "charAt":
            this.cmdCharAt(node,ctx,wr)
            break;
          case "substring":
            this.cmdSubstring(node,ctx,wr)
            break;
          case "charcode":
            this.cmdCharcode(node,ctx,wr)
            break;
          case "strfromcode":
            this.cmdStrfromcode(node,ctx,wr)
            break;
          case "double2str":
            this.cmdDouble2Str(node,ctx,wr)
            break;
          case "str2int":
            this.cmdStr2Int(node,ctx,wr)
            break;
          case "str2double":
            this.cmdStr2Double(node,ctx,wr)
            break;
          case "array_length":
            this.cmdArrayLength(node,ctx,wr)
            break;
          case "itemAt":
            this.cmdItemAt(node,ctx,wr)
            break;
          case "push":
            this.cmdPush(node,ctx,wr)
            break;
          case "removeLast":
            this.cmdRemoveLast(node,ctx,wr)
            break;
          case "shell_arg_cnt":
            this.cmdArgvCnt(node,ctx,wr)
            break;
          case "shell_arg":
            this.cmdArgv(node,ctx,wr)
            break;
          case "file_read":
            this.cmdFileRead(node,ctx,wr)
            break;
          case "file_write":
            this.cmdFileWrite(node,ctx,wr)
            break;
          case "file_exists":
            this.cmdIsFile(node,ctx,wr)
            break;
          case "dir_exists":
            this.cmdIsDir(node,ctx,wr)
            break;
          case "dir_create":
            this.cmdCreateDir(node,ctx,wr)
            break;
          case "+":
            this.cmdPlusOp(node,ctx,wr)
            break;
          case "=":
            this.cmdAssign(node,ctx,wr)
            break;
          case "sin":
          case "cos":
          case "tan":
          case "atan":
          case "log":
          case "abs":
          case "acos":
          case "asin":
          case "floor":
          case "round":
          case "sqrt":
            this.cmdMathLibOp(node,ctx,wr)
            break;
          case "==":
          case "<":
          case ">":
          case "!=":
          case ">=":
          case "<=":
            this.cmdComparisionOp(node,ctx,wr)
            break;
          case "&&":
          case "||":
            this.cmdLogicOp(node,ctx,wr)
            break;
          case "*":
          case "-":
          case "\/":
          case "%":
            this.cmdNumericOp(node,ctx,wr)
            break;
          default: 
            was_called = false;
            break;
        }
        if(was_called) {
          return true;
        }
        if(this.cmdLocalCall(node,ctx,wr)) {
          return true;
        }
      }
    }
    if(node.expression) {
      for( var i= 0; i< node.children.length; i++) { 
        var item= node.children[i];
        this.WalkNode(item,ctx,wr)
      }
    }
  }
  StartCodeWriting(node, ctx, wr) { 
    this.WalkNode(node,ctx,wr)
    var lang = this.getWriterLang();
    if(node.hasStringProperty(lang)) {
      wr.newline()
      wr.out(node.getStringProperty(lang),true)
    }
  }
  CollectMethods(node, ctx, wr) { 
    var find_more = true;
    if(node.isFirstVref("Extends")) {
      var extList = node.children[1];
      var currC = ctx.currentClass;
      for( var ii= 0; ii< extList.children.length; ii++) { 
        var ee= extList.children[ii];
        currC.addParentClass(ee.vref)
      }
    }
    if(node.isFirstVref("Constructor")) {
      var currC = ctx.currentClass;
      currC.has_constructor = true;
      currC.constructor_node = node;
    }
    if(node.isFirstVref("CreateClass")) {
      var s = node.getVRefAt(1);
      var new_class = new RangerAppClassDesc();
      new_class.name = s;
      ctx.currentClass = new_class;
      ctx.addClass(s,new_class)
    }
    if(node.isFirstVref("def")) {
      var s = node.getVRefAt(1);
      var vDef = node.children[1];
      var p = new RangerAppParamDesc();
      p.name = s;
      p.value_type = vDef.value_type;
      p.node = node;
      p.is_class_variable = true;
      p.nameNode = vDef;
      if(node.children.length>2) {
        p.set_cnt = 1;
        p.def_value = node.children[2];
        p.is_optional = false;
      } else {
        p.is_optional = true;
      }
      var currC = ctx.currentClass;
      currC.addVariable(p)
    }
    if(node.isFirstVref("PublicMethod")) {
      var s = node.getVRefAt(1);
      var currC = ctx.currentClass;
      var m = new RangerAppFunctionDesc();
      m.name = s;
      m.nameNode = node.children[1];
      var args = node.children[2];
      for( var ii= 0; ii< args.children.length; ii++) { 
        var arg= args.children[ii];
        var p = new RangerAppParamDesc();
        p.name = arg.vref;
        p.value_type = arg.value_type;
        p.node = arg;
        p.nameNode = arg;
        m.params.push(p);
      }
      currC.addMethod(m)
      find_more = false;
    }
    if(find_more) {
      for( var i= 0; i< node.children.length; i++) { 
        var item= node.children[i];
        this.CollectMethods(item,ctx,wr)
      }
    }
  }
  DefineVar(node, ctx, wr) { 
    console.log("ERROR: DefineVar not implemented!");
  }
}
class RangerJavaScriptWriter  extends RangerCommonWriter {
  
  constructor() {
    super()
  }
  getWriterLang() { 
    return "JavaScript";
  }
  cmdArgv(node, ctx, wr) { 
    var argIndex = node.getSecond();
    wr.out("process.argv[ 2 + process.execArgv.length + ",false)
    ctx.setInExpr()
    this.WalkNode(argIndex,ctx,wr)
    ctx.unsetInExpr()
    wr.out("]",false)
  }
  cmdArgvCnt(node, ctx, wr) { 
    wr.out("( process.argv.length - ( 2 + process.execArgv.length ) )",false)
  }
  cmdFileRead(node, ctx, wr) { 
    var pathName = node.getSecond();
    var fileName = node.getThird();
    wr.out("require(" + String.fromCharCode(34) + "fs" + String.fromCharCode(34) + ").readFileSync( process.cwd() + ",false)
    wr.out(String.fromCharCode(34) + "\/" + String.fromCharCode(34) + " + ",false)
    ctx.setInExpr()
    this.WalkNode(pathName,ctx,wr)
    wr.out(" + " + String.fromCharCode(34) + "\/" + String.fromCharCode(34) + " + ",false)
    this.WalkNode(fileName,ctx,wr)
    ctx.unsetInExpr()
    wr.out(", " + String.fromCharCode(34) + "utf8" + String.fromCharCode(34) + ")",false)
  }
  cmdFileWrite(node, ctx, wr) { 
    var pathName = node.getSecond();
    var fileName = node.getThird();
    var dataToWrite = node.children[3];
    wr.newline()
    wr.out("require(" + String.fromCharCode(34) + "fs" + String.fromCharCode(34) + ").writeFileSync( process.cwd() + ",false)
    wr.out(String.fromCharCode(34) + "\/" + String.fromCharCode(34) + " + ",false)
    ctx.setInExpr()
    this.WalkNode(pathName,ctx,wr)
    wr.out(" + " + String.fromCharCode(34) + "\/" + String.fromCharCode(34) + " + ",false)
    this.WalkNode(fileName,ctx,wr)
    wr.out(", ",false)
    this.WalkNode(dataToWrite,ctx,wr)
    wr.out(");",true)
    ctx.unsetInExpr()
  }
  cmdIsFile(node, ctx, wr) { 
    var pathName = node.getSecond();
    var fileName = node.getThird();
    wr.out("require(" + String.fromCharCode(34) + "fs" + String.fromCharCode(34) + ").existsSync( process.cwd() + ",false)
    wr.out(String.fromCharCode(34) + "\/" + String.fromCharCode(34) + " + ",false)
    ctx.setInExpr()
    this.WalkNode(pathName,ctx,wr)
    wr.out(" + " + String.fromCharCode(34) + "\/" + String.fromCharCode(34) + " + ",false)
    this.WalkNode(fileName,ctx,wr)
    ctx.unsetInExpr()
    wr.out(")",false)
  }
  cmdIsDir(node, ctx, wr) { 
    var pathName = node.getSecond();
    wr.out("require(" + String.fromCharCode(34) + "fs" + String.fromCharCode(34) + ").existsSync( process.cwd() + ",false)
    wr.out(String.fromCharCode(34) + "\/" + String.fromCharCode(34) + " + ",false)
    ctx.setInExpr()
    this.WalkNode(pathName,ctx,wr)
    ctx.unsetInExpr()
    wr.out(")",false)
  }
  cmdCreateDir(node, ctx, wr) { 
    var pathName = node.getSecond();
    wr.newline()
    wr.out("require(" + String.fromCharCode(34) + "fs" + String.fromCharCode(34) + ").mkdirSync( process.cwd() + ",false)
    wr.out(String.fromCharCode(34) + "\/" + String.fromCharCode(34) + " + ",false)
    ctx.setInExpr()
    this.WalkNode(pathName,ctx,wr)
    wr.out(");",true)
    ctx.unsetInExpr()
  }
  PublicMethod(node, ctx, wr) { 
    var nameDef = node.getSecond();
    wr.newline()
    wr.out(nameDef.vref + "(",false)
    var args = node.getThird();
    for( var i= 0; i< args.children.length; i++) { 
      var arg= args.children[i];
      if(i>0) {
        wr.out(", ",false)
      }
      wr.out(arg.vref,false)
    }
    wr.out(") { ",true)
    ctx.setInMethod()
    wr.indent(1)
    var fnBody = node.children[3];
    var has_try_catch = false;
    var try_catch;
    if(fnBody.hasExpressionProperty("onError")) {
      try_catch = fnBody.getExpressionProperty("onError");
      wr.out("try {",true)
      wr.indent(1)
    }
    this.WalkNodeChildren(fnBody,ctx,wr)
    wr.newline()
    wr.indent(-1)
    if(fnBody.hasExpressionProperty("onError")) {
      wr.out("} catch(e) {",true)
      wr.indent(1)
      wr.out("console.log(e);",true)
      this.WalkNodeChildren(try_catch,ctx,wr)
      wr.indent(-1)
      wr.out("}",true)
      wr.indent(-1)
    }
    wr.out("}",true)
    ctx.unsetInMethod()
  }
  CreateClass(node, ctx, wr) { 
    var nameDef = node.getSecond();
    var classInfo = ctx.findClass(nameDef.vref);
    wr.newline()
    wr.out("class " + nameDef.vref + " ",false)
    var b_extended = false;
    if(classInfo.extends_classes.length>0) {
      wr.out(" extends ",false)
      b_extended = true;
      for( var i= 0; i< classInfo.extends_classes.length; i++) { 
        var pName= classInfo.extends_classes[i];
        if(i>0) {
          wr.out(",",false)
        }
        wr.out(pName,false)
      }
    }
    wr.out(" {",true)
    wr.indent(1)
    wr.out("",true)
    var cw = wr.createTag("constructor");
    cw.out("constructor(",false)
    if(classInfo.has_constructor) {
      var constr = classInfo.constructor_node;
      var cParams = constr.getSecond();
      for( var i= 0; i< cParams.children.length; i++) { 
        var param= cParams.children[i];
        if(i>0) {
          cw.out(", ",false)
        }
        cw.out(param.vref,false)
      }
    }
    cw.out(") {",true)
    cw.indent(1)
    if(b_extended) {
      cw.out("super()",true)
    }
    var fnBody = node.children[2];
    this.WalkNodeChildren(fnBody,ctx,wr)
    cw.indent(-1)
    cw.out("}",true)
    wr.indent(-1)
    wr.out("}",true)
  }
  DefineVar(node, ctx, wr) { 
    if(ctx.isInMethod()) {
      var v = node.getSecond();
      wr.out("var " + v.vref,false)
      if(node.children.length>2) {
        wr.out(" = ",false)
        ctx.setInExpr()
        this.WalkNode(node.getThird(),ctx,wr)
        ctx.unsetInExpr()
      } else {
        switch(v.value_type) {
          case 6:
            wr.out(" = {}",false)
            break;
          case 5:
            wr.out(" = []",false)
            break;
          default: 
            wr.out("",false)
            break;
        }
      }
      wr.out(";",true)
    } else {
      var cw = wr.getTag("constructor");
      var v = node.getSecond();
      cw.out("this." + v.vref,false)
      if(node.children.length>2) {
        cw.out(" = ",false)
        ctx.setInExpr()
        this.WalkNode(node.getThird(),ctx,cw)
        ctx.unsetInExpr()
      } else {
        switch(v.value_type) {
          case 6:
            cw.out(" = {}",false)
            break;
          case 5:
            cw.out(" = []",false)
            break;
          default: 
            cw.out(" = undefined",false)
            break;
        }
      }
      cw.out(";",true)
    }
  }
  DefineMethod(node, ctx, wr) { 
    var s = node.getVRefAt(1);
    wr.out("\/\/ DefineMethod",true)
    wr.out(s + "() {",true)
    wr.indent(1)
    wr.out("\/\/ the code...",true)
    wr.indent(-1)
    wr.out("}",true)
  }
}
class TestCodeCompiler  {
  
  constructor() {
  }
  compile(fileName) { 
    try {
      if(require("fs").existsSync( process.cwd() + "/" + "." + "/" + fileName)) {
      } else {
        console.log("File does not exists!");
        return;
      }
      var c = require("fs").readFileSync( process.cwd() + "/" + "." + "/" + fileName, "utf8");
      var code = new SourceCode(c);
      code.filename = fileName;
      var parser = new RangerLispParser(code);
      parser.parse()
      if(parser.had_error) {
        return;
      }
      var appCtx = new RangerAppWriterContext();
      var cwr = new RangerJavaScriptWriter();
      var node = parser.rootNode;
      var wr = new CodeWriter();
      cwr.CollectMethods(node,appCtx,wr)
      cwr.StartCodeWriting(node,appCtx,wr)
      var had_errors = false;
      if(appCtx.compilerErrors.length==0) {
        wr.newline()
        if(( process.argv.length - ( 2 + process.execArgv.length ) )>0) {
        } else {
          wr.out("(new TestCodeCompiler()).test1()")
        }
        console.log(wr.getCode());
      } else {
        had_errors = true;
        console.log("Had following compiler errors:");
        for( var i= 0; i< appCtx.compilerErrors.length; i++) { 
          var e= appCtx.compilerErrors[i];
          var line_index = e.node.getLine();
          console.log((e.node.getFilename()) + " Line: " + line_index);
          console.log(e.description);
          console.log(e.node.getLineString(line_index));
        }
      }
    } catch(e) {
      console.log(e);
      console.log("Unknown compiler error.");
    }
  }
  test1() { 
    try {
      var read_filename = ".\/TestCodeCompiler.clj";
      if(( process.argv.length - ( 2 + process.execArgv.length ) )>0) {
        read_filename = process.argv[ 2 + process.execArgv.length + 0];
      }
      var c = require("fs").readFileSync( process.cwd() + "/" + "." + "/" + read_filename, "utf8");
      var code = new SourceCode(c);
      code.filename = read_filename;
      var parser = new RangerLispParser(code);
      parser.parse()
      if(parser.had_error) {
        return;
      }
      var appCtx = new RangerAppWriterContext();
      var cwr = new RangerJavaScriptWriter();
      var node = parser.rootNode;
      var wr = new CodeWriter();
      cwr.CollectMethods(node,appCtx,wr)
      cwr.StartCodeWriting(node,appCtx,wr)
      var had_errors = false;
      if(appCtx.compilerErrors.length==0) {
        wr.newline()
        if(( process.argv.length - ( 2 + process.execArgv.length ) )>0) {
        } else {
          wr.out("(new TestCodeCompiler()).test1()")
        }
        console.log(wr.getCode());
      } else {
        had_errors = true;
        console.log("Had following compiler errors:");
        for( var i= 0; i< appCtx.compilerErrors.length; i++) { 
          var e= appCtx.compilerErrors[i];
          var line_index = e.node.getLine();
          console.log((e.node.getFilename()) + " Line: " + line_index);
          console.log(e.description);
          console.log(e.node.getLineString(line_index));
        }
      }
    } catch(e) {
      console.log(e);
      console.log("Compilation error occurred !!");
    }
  }
  run() { 
    var fileSystem = new CodeFileSystem();
    console.log(process.argv[ 2 + process.execArgv.length + 0]);
    var c = require("fs").readFileSync( process.cwd() + "/" + "." + "/" + ".\/TestFS.clj", "utf8");
    var code = new SourceCode(c);
    var parser = new RangerLispParser(code);
    parser.parse()
    var appCtx = new RangerAppWriterContext();
    var cwr = new RangerJavaScriptWriter();
    var node = parser.rootNode;
    var cf = fileSystem.getFile("ranger\/test1","fstest.js");
    var wr = cf.getWriter();
    cwr.CollectMethods(node,appCtx,wr)
    cwr.StartCodeWriting(node,appCtx,wr)
    fileSystem.saveTo("output")
  }
}
(new TestCodeCompiler()).test1()
