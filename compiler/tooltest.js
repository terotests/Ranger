
"use strict";

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

                            
var DictNode = function( ) {  
  function DictNode(source, start, end) {
    _classCallCheck(this, DictNode);
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
  
   _createClass(DictNode, [
    { key: "EncodeString", value: function EncodeString(orig_str) { 
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
    }}
    ,
    { key: "createEmptyObject", value: function createEmptyObject() { 
      var emptyCode = new SourceCode("");
      var v = new DictNode(emptyCode,0,0);
      v.value_type = 6;
      return v;
    }}
    ,
    { key: "addObject", value: function addObject(key) { 
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
    }}
    ,
    { key: "addString", value: function addString(key, value) { 
      if(this.value_type==6) {
        var v = new DictNode(this.code,0,0);
        v.string_value = value;
        v.value_type = 3;
        v.vref = key;
        v.is_property = true;
        this.keys.push(key);
        this.objects[key] = v;
      }
    }}
    ,
    { key: "getDoubleAt", value: function getDoubleAt(index) { 
      if(index<this.children.length) {
        var k = this.children[index];
        return k.double_value;
      }
      return 0;
    }}
    ,
    { key: "getDouble", value: function getDouble(key) { 
      if(typeof(this.objects[key]) != "undefined") {
        var k = this.objects[key];
        return k.double_value;
      }
      return 0;
    }}
    ,
    { key: "getStringAt", value: function getStringAt(index) { 
      if(index<this.children.length) {
        var k = this.children[index];
        return k.string_value;
      }
      return "";
    }}
    ,
    { key: "getString", value: function getString(key) { 
      if(typeof(this.objects[key]) != "undefined") {
        var k = this.objects[key];
        return k.string_value;
      }
      return "";
    }}
    ,
    { key: "getArray", value: function getArray(key) { 
      if(typeof(this.objects[key]) != "undefined") {
        var obj = this.objects[key];
        if(obj.is_property) {
          return obj.object_value;
        }
      }
      return new DictNode((new SourceCode("")),0,0);
    }}
    ,
    { key: "getArrayAt", value: function getArrayAt(index) { 
      if(index<this.children.length) {
        var k = this.children[index];
        return k;
      }
      return new DictNode((new SourceCode("")),0,0);
    }}
    ,
    { key: "getObject", value: function getObject(key) { 
      if(typeof(this.objects[key]) != "undefined") {
        var obj = this.objects[key];
        if(obj.is_property) {
          return obj.object_value;
        }
      }
      return new DictNode((new SourceCode("")),0,0);
    }}
    ,
    { key: "getObjectAt", value: function getObjectAt(index) { 
      if(index<this.children.length) {
        var k = this.children[index];
        return k;
      }
      return new DictNode((new SourceCode("")),0,0);
    }}
    ,
    { key: "walk", value: function walk() { 
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
    }}
    ,
    { key: "stringify", value: function stringify() { 
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
    }}
  ]);
  

return DictNode;
}();
var CodeNode = function( ) {  
  function CodeNode(source, start, end) {
    _classCallCheck(this, CodeNode);
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
  
   _createClass(CodeNode, [
    /**"\r\n NOTE: This is just a documentation test, not a real documentation entry!!!\r\n The codenode represents AST node which can be used for parsers and intepreters of the system.\r\n ```\r\n    (def n:CodeNode (new CodeNode (src start end)))\r\n    (def str:string (node getCode ()))\r\n ```\r\n "*/
    { key: "getFilename", value: function getFilename() { 
      return this.code.filename;
    }}
    ,
    { key: "getLine", value: function getLine() { 
      return this.code.getLine(this.sp);
    }}
    ,
    { key: "getLineString", value: function getLineString(line_index) { 
      return this.code.getLineString(line_index);
    }}
    ,
    { key: "getPositionalString", value: function getPositionalString() { 
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
    }}
    ,
    { key: "isVariableDef", value: function isVariableDef() { 
      return this.isFirstVref("def")
      ;
    }}
    ,
    { key: "isFunctionDef", value: function isFunctionDef() { 
      return this.isFirstVref("defn")
      ;
    }}
    ,
    { key: "isFunctionCall", value: function isFunctionCall() { 
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
    }}
    ,
    { key: "isPrimitive", value: function isPrimitive() { 
      if((this.value_type==1) || (this.value_type==3) || (this.value_type==2) || (this.value_type==4)) {
        return true;
      }
      return false;
    }}
    ,
    { key: "getFirst", value: function getFirst() { 
      return this.children[0];
    }}
    ,
    { key: "getSecond", value: function getSecond() { 
      return this.children[1];
    }}
    ,
    { key: "getThird", value: function getThird() { 
      return this.children[2];
    }}
    ,
    { key: "isSecondExpr", value: function isSecondExpr() { 
      if(this.children.length>1) {
        var second = this.children[1];
        if(second.expression) {
          return true;
        }
      }
      return false;
    }}
    ,
    { key: "getOperator", value: function getOperator() { 
      var s = "";
      if(this.children.length>0) {
        var fc = this.children[0];
        if(fc.value_type==8) {
          return fc.vref;
        }
      }
      return s;
    }}
    ,
    { key: "getVRefAt", value: function getVRefAt(idx) { 
      var s = "";
      if(this.children.length>idx) {
        var fc = this.children[idx];
        return fc.vref;
      }
      return s;
    }}
    ,
    { key: "getStringAt", value: function getStringAt(idx) { 
      var s = "";
      if(this.children.length>idx) {
        var fc = this.children[idx];
        if(fc.value_type==3) {
          return fc.string_value;
        }
      }
      return s;
    }}
    ,
    { key: "hasExpressionProperty", value: function hasExpressionProperty(name) { 
      var ann = this.props[name];
      if(ann != null ) {
        return ann.expression;
      }
      return false;
    }}
    ,
    { key: "getExpressionProperty", value: function getExpressionProperty(name) { 
      var ann = this.props[name];
      if(ann != null ) {
        return ann;
      }
      return false;
    }}
    ,
    { key: "hasIntProperty", value: function hasIntProperty(name) { 
      var ann = this.props[name];
      if(ann != null ) {
        var fc = ann.children[0];
        if(fc.value_type==2) {
          return true;
        }
      }
      return false;
    }}
    ,
    { key: "getIntProperty", value: function getIntProperty(name) { 
      var ann = this.props[name];
      if(ann != null ) {
        var fc = ann.children[0];
        if(fc.value_type==2) {
          return fc.int_value;
        }
      }
      return 0;
    }}
    ,
    { key: "hasDoubleProperty", value: function hasDoubleProperty(name) { 
      var ann = this.props[name];
      if(ann != null ) {
        if(ann.value_type==1) {
          return true;
        }
      }
      return false;
    }}
    ,
    { key: "getDoubleProperty", value: function getDoubleProperty(name) { 
      var ann = this.props[name];
      if(ann != null ) {
        if(ann.value_type==1) {
          return ann.double_value;
        }
      }
      return 0;
    }}
    ,
    { key: "hasStringProperty", value: function hasStringProperty(name) { 
      var ann = this.props[name];
      if(ann != null ) {
        if(ann.value_type==3) {
          return true;
        }
      }
      return false;
    }}
    ,
    { key: "getStringProperty", value: function getStringProperty(name) { 
      var ann = this.props[name];
      if(ann != null ) {
        if(ann.value_type==3) {
          return ann.string_value;
        }
      }
      return "";
    }}
    ,
    { key: "hasBooleanProperty", value: function hasBooleanProperty(name) { 
      var ann = this.props[name];
      if(ann != null ) {
        if(ann.value_type==4) {
          return true;
        }
      }
      return false;
    }}
    ,
    { key: "getBooleanProperty", value: function getBooleanProperty(name) { 
      var ann = this.props[name];
      if(ann != null ) {
        if(ann.value_type==4) {
          return ann.boolean_value;
        }
      }
      return false;
    }}
    ,
    { key: "isFirstTypeVref", value: function isFirstTypeVref(vrefName) { 
      if(this.children.length>0) {
        var fc = this.children[0];
        if(fc.value_type==8) {
          return true;
        }
      }
      return false;
    }}
    ,
    { key: "isFirstVref", value: function isFirstVref(vrefName) { 
      if(this.children.length>0) {
        var fc = this.children[0];
        if(fc.vref==vrefName) {
          return true;
        }
      }
      return false;
    }}
    ,
    { key: "getString", value: function getString() { 
      return this.code.code.substring(this.sp, this.ep);
    }}
    ,
    { key: "writeCode", value: function writeCode(wr) { 
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
    }}
    ,
    { key: "getCode", value: function getCode() { 
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
    }}
    ,
    { key: "walk", value: function walk() { 
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
    }}
  ]);
  

return CodeNode;
}();
var SourceCode = function( ) {  
  function SourceCode(code_string) {
    _classCallCheck(this, SourceCode);
    this.code = undefined;
    this.filename = "";
    this.lines = [];
    this.code = code_string;
    this.lines = code_string.split("\n");
  }
  
   _createClass(SourceCode, [
    { key: "getLineString", value: function getLineString(line_index) { 
      if(this.lines.length>line_index) {
        return this.lines[line_index];
      }
      return "";
    }}
    ,
    { key: "getLine", value: function getLine(sp) { 
      var cnt = 0;
      for( var i= 0; i< this.lines.length; i++) { 
        var str= this.lines[i];
        cnt = cnt + (str.length + 1);
        if(cnt>sp) {
          return i;
        }
      }
      return -1;
    }}
  ]);
  

return SourceCode;
}();
var CodeExecState = function( ) {  
  function CodeExecState() {
    _classCallCheck(this, CodeExecState);
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
  
   _createClass(CodeExecState, [
  ]);
  

return CodeExecState;
}();
var RangerContextEvent = function( ) {  
  function RangerContextEvent() {
    _classCallCheck(this, RangerContextEvent);
    this.ctx = undefined;
    this.var_name = undefined;
  }
  
   _createClass(RangerContextEvent, [
    { key: "fire", value: function fire() { 
    }}
  ]);
  

return RangerContextEvent;
}();
var RangerContextEventContainer = function( ) {  
  function RangerContextEventContainer() {
    _classCallCheck(this, RangerContextEventContainer);
    this.listeners = [];
  }
  
   _createClass(RangerContextEventContainer, [
    { key: "fire", value: function fire() { 
      for( var i= 0; i< this.listeners.length; i++) { 
        var observer= this.listeners[i];
        observer.fire()
      }
    }}
  ]);
  

return RangerContextEventContainer;
}();
var RangerContext = function( ) {  
  function RangerContext() {
    _classCallCheck(this, RangerContext);
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
  
   _createClass(RangerContext, [
    { key: "fork", value: function fork() { 
      var new_ctx = new RangerContext();
      new_ctx.parent = this;
      return new_ctx;
    }}
    ,
    { key: "getTypeOf", value: function getTypeOf(key) { 
      if(typeof(this.defined_values[key]) != "undefined") {
        return this.set_types[key];
      } else {
        if(this.parent != null ) {
          return this.parent.getTypeOf(key);
        }
      }
      return 0;
    }}
    ,
    { key: "isString", value: function isString(key) { 
      if(typeof(this.set_values[key]) != "undefined") {
        return (this.set_types[key])==3;
      }
      if(this.parent != null ) {
        return this.parent.isString(key);
      }
      return false;
    }}
    ,
    { key: "isDouble", value: function isDouble(key) { 
      if(typeof(this.set_values[key]) != "undefined") {
        return (this.set_types[key])==1;
      }
      if(this.parent != null ) {
        return this.parent.isDouble(key);
      }
      return false;
    }}
    ,
    { key: "isInt", value: function isInt(key) { 
      if(typeof(this.set_values[key]) != "undefined") {
        return (this.set_types[key])==2;
      }
      if(this.parent != null ) {
        return this.parent.isInt(key);
      }
      return false;
    }}
    ,
    { key: "isBoolean", value: function isBoolean(key) { 
      if(typeof(this.set_values[key]) != "undefined") {
        return (this.set_types[key])==4;
      }
      if(this.parent != null ) {
        return this.parent.isBoolean(key);
      }
      return false;
    }}
    ,
    { key: "isDefinedString", value: function isDefinedString(key) { 
      if(typeof(this.defined_values[key]) != "undefined") {
        return (this.set_types[key])==3;
      }
      if(this.parent != null ) {
        return this.parent.isString(key);
      }
      return false;
    }}
    ,
    { key: "isDefinedDouble", value: function isDefinedDouble(key) { 
      if(typeof(this.defined_values[key]) != "undefined") {
        return (this.set_types[key])==1;
      }
      if(this.parent != null ) {
        return this.parent.isDefinedDouble(key);
      }
      return false;
    }}
    ,
    { key: "isDefinedInt", value: function isDefinedInt(key) { 
      if(typeof(this.defined_values[key]) != "undefined") {
        return (this.set_types[key])==2;
      }
      if(this.parent != null ) {
        return this.parent.isDefinedInt(key);
      }
      return false;
    }}
    ,
    { key: "isDefinedBoolean", value: function isDefinedBoolean(key) { 
      if(typeof(this.defined_values[key]) != "undefined") {
        return (this.set_types[key])==4;
      }
      if(this.parent != null ) {
        return this.parent.isDefinedBoolean(key);
      }
      return false;
    }}
    ,
    { key: "defineString", value: function defineString(key) { 
      this.set_types[key] = 3;
      this.defined_values[key] = true;
    }}
    ,
    { key: "defineInt", value: function defineInt(key) { 
      this.set_types[key] = 2;
      this.defined_values[key] = true;
    }}
    ,
    { key: "defineBoolean", value: function defineBoolean(key) { 
      this.set_types[key] = 4;
      this.defined_values[key] = true;
    }}
    ,
    { key: "defineDouble", value: function defineDouble(key) { 
      this.set_types[key] = 4;
      this.defined_values[key] = true;
    }}
    ,
    { key: "setString", value: function setString(key, value) { 
      this.str_values[key] = value;
    }}
    ,
    { key: "getString", value: function getString(key) { 
      if(typeof(this.str_values[key]) != "undefined") {
        return this.str_values[key];
      } else {
        if(this.parent != null ) {
          return this.parent.getString(key);
        } else {
          return "";
        }
      }
    }}
  ]);
  

return RangerContext;
}();
var CodeFile = function( ) {  
  function CodeFile(filePath, fileName) {
    _classCallCheck(this, CodeFile);
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
  
   _createClass(CodeFile, [
    { key: "addImport", value: function addImport(import_name) { 
      if(typeof(this.import_list[import_name]) != "undefined") {
      } else {
        this.import_list[this.name] = import_name;
        this.import_names.push(import_name);
      }
    }}
    ,
    { key: "getImports", value: function getImports() { 
      return this.import_names;
    }}
    ,
    { key: "getWriter", value: function getWriter() { 
      return this.writer;
    }}
    ,
    { key: "getCode", value: function getCode() { 
      return this.writer.getCode();
    }}
  ]);
  

return CodeFile;
}();
var CodeFileSystem = function( ) {  
  function CodeFileSystem() {
    _classCallCheck(this, CodeFileSystem);
    this.files = [];
  }
  
   _createClass(CodeFileSystem, [
    { key: "getFile", value: function getFile(path, name) { 
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
    }}
    ,
    { key: "mkdir", value: function mkdir(path) { 
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
    }}
    ,
    { key: "saveTo", value: function saveTo(path) { 
      for( var idx= 0; idx< this.files.length; idx++) { 
        var file= this.files[idx];
        var file_path = path + "\/" + file.path_name;
        this.mkdir(file_path)
        console.log("Writing to path " + file_path);
        require("fs").writeFileSync( process.cwd() + "/" + file_path + "/" + file.name, file.getCode());
      }
    }}
    ,
    { key: "printFilesList", value: function printFilesList() { 
      for( var idx= 0; idx< this.files.length; idx++) { 
        var file= this.files[idx];
        console.log("----===== " + (file.path_name + "\/" + file.name) + " ====----");
        console.log(file.getCode());
      }
    }}
  ]);
  

return CodeFileSystem;
}();
var CodeSlice = function( ) {  
  function CodeSlice() {
    _classCallCheck(this, CodeSlice);
    this.code = "";
    this.writer = undefined;
  }
  
   _createClass(CodeSlice, [
    { key: "getCode", value: function getCode() { 
      if(this.writer == null ) {
        return this.code;
      }
      return this.writer.getCode();
    }}
  ]);
  

return CodeSlice;
}();
var CodeWriter = function( ) {  
  function CodeWriter() {
    _classCallCheck(this, CodeWriter);
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
  
   _createClass(CodeWriter, [
    { key: "addImport", value: function addImport(name) { 
      if(this.ownerFile != null ) {
        this.ownerFile.addImport(name)
      } else {
        if(this.parent != null ) {
          this.parent.addImport(name)
        }
      }
    }}
    ,
    { key: "indent", value: function indent(delta) { 
      this.indentAmount = delta + this.indentAmount;
      if(this.indentAmount<0) {
        this.indentAmount = 0;
      }
    }}
    ,
    { key: "addIndent", value: function addIndent() { 
      var i = 0;
      if(this.currentLine.length==0) {
        while(i<this.indentAmount) {
          this.currentLine = this.currentLine + this.tabStr;
          i = i + 1;
        }
      }
    }}
    ,
    { key: "createTag", value: function createTag(name) { 
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
    }}
    ,
    { key: "getTag", value: function getTag(name) { 
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
    }}
    ,
    { key: "hasTag", value: function hasTag(name) { 
      if(typeof(this.tags[name]) != "undefined") {
        return true;
      } else {
        if(this.parent != null ) {
          return this.parent.hasTag(name);
        }
      }
      return false;
    }}
    ,
    { key: "fork", value: function fork() { 
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
    }}
    ,
    { key: "newline", value: function newline() { 
      /**"Inserts newline if necessary"*/
      if(this.currentLine.length>0) {
        this.out("",true)
      }
    }}
    ,
    { key: "writeSlice", value: function writeSlice(str, newLine) { 
      this.addIndent()
      this.currentLine = this.currentLine + str;
      if(newLine) {
        this.current_slice.code = this.current_slice.code + this.currentLine + "\n";
        this.currentLine = "";
      }
    }}
    /**"out function accepts string and newline parameter"*/
    ,
    { key: "out", value: function out(str, newLine) { 
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
    }}
    ,
    { key: "getCode", value: function getCode() { 
      var res = "";
      for( var idx= 0; idx< this.slices.length; idx++) { 
        var slice= this.slices[idx];
        res = res + (slice.getCode());
      }
      res = res + this.currentLine;
      return res;
    }}
  ]);
  

return CodeWriter;
}();
var CodeWriterTester = function( ) {  
  function CodeWriterTester() {
    _classCallCheck(this, CodeWriterTester);
  }
  
   _createClass(CodeWriterTester, [
    { key: "test1", value: function test1() { 
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
    }}
  ]);
  

return CodeWriterTester;
}();
var RangerLispParser = function( ) {  
  function RangerLispParser(code_module) {
    _classCallCheck(this, RangerLispParser);
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
  
   _createClass(RangerLispParser, [
    { key: "getCode", value: function getCode() { 
      return this.rootNode.getCode();
    }}
    ,
    { key: "parse", value: function parse() { 
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
    }}
  ]);
  

return RangerLispParser;
}();
var JSONParser = function( ) {  
  function JSONParser(code_module) {
    _classCallCheck(this, JSONParser);
    this.code = undefined;
    this.s = undefined;
    this.len = undefined;
    this.i = 0;
    this.parents = [];
    this.next = undefined;
    this.rootNode = undefined;
    this.curr_node = undefined;
    this.tag_depth = 0;
    this.s = code_module.code;
    this.code = code_module;
    this.len = code_module.code.length;
  }
  
   _createClass(JSONParser, [
    { key: "skip_space", value: function skip_space() { 
      while((this.i<this.len) && (this.s.charCodeAt(this.i)<=32)) {
        this.i = 1 + this.i;
      }
      return this.i;
    }}
    ,
    { key: "parse", value: function parse() { 
      var c;
      var next_c;
      var fc;
      var new_node;
      var sp = this.i;
      var ep = this.i;
      var last_i = 0;
      var cc1;
      var cc2;
      while(this.i<this.len) {
        last_i = this.i;
        while((this.i<this.len) && (this.s.charCodeAt(this.i)<=32)) {
          this.i = 1 + this.i;
        }
        cc1 = this.s.charCodeAt(this.i);
        if(cc1=="]".charCodeAt(0)) {
          this.parents.pop()
          if(this.curr_node.is_property_value) {
            this.parents.pop()
          }
          var p_cnt = this.parents.length;
          var last_parent = this.parents[(p_cnt - 1)];
          this.curr_node = last_parent;
          this.i = this.i + 1;
          continue;
        }
        if(cc1=="}".charCodeAt(0)) {
          this.parents.pop()
          if(this.curr_node.is_property_value) {
            this.parents.pop()
          }
          var p_cnt = this.parents.length;
          var last_parent = this.parents[(p_cnt - 1)];
          this.curr_node = last_parent;
          this.i = this.i + 1;
          continue;
        }
        if(cc1==",".charCodeAt(0)) {
          this.i = this.i + 1;
          continue;
        }
        if(cc1==":".charCodeAt(0)) {
          this.i = this.i + 1;
          continue;
        }
        fc = cc1;
        if((fc=="n".charCodeAt(0)) && (this.s.charCodeAt((this.i + 1))=="u".charCodeAt(0)) && (this.s.charCodeAt((this.i + 2))=="l".charCodeAt(0)) && (this.s.charCodeAt((this.i + 3))=="l".charCodeAt(0))) {
          if(this.curr_node.is_property) {
            this.curr_node.value_type = 7;
            this.parents.pop()
            var p_cnt = this.parents.length;
            var last_parent = this.parents[(p_cnt - 1)];
            this.curr_node = last_parent;
          } else {
            var new_attr = new DictNode(this.code,sp,ep);
            new_attr.value_type = 7;
            this.curr_node.children.push(new_attr);
          }
          this.i = this.i + 4;
          continue;
        }
        if((fc=="t".charCodeAt(0)) && (this.s.charCodeAt((this.i + 1))=="r".charCodeAt(0)) && (this.s.charCodeAt((this.i + 2))=="u".charCodeAt(0)) && (this.s.charCodeAt((this.i + 3))=="e".charCodeAt(0))) {
          if(this.curr_node.is_property) {
            this.curr_node.value_type = 4;
            this.curr_node.boolean_value = true;
            this.parents.pop()
            var p_cnt = this.parents.length;
            var last_parent = this.parents[(p_cnt - 1)];
            this.curr_node = last_parent;
          } else {
            var new_attr = new DictNode(this.code,sp,ep);
            new_attr.value_type = 4;
            new_attr.boolean_value = true;
            this.curr_node.children.push(new_attr);
          }
          this.i = this.i + 4;
          continue;
        }
        if((fc=="f".charCodeAt(0)) && (this.s.charCodeAt((this.i + 1))=="a".charCodeAt(0)) && (this.s.charCodeAt((this.i + 2))=="l".charCodeAt(0)) && (this.s.charCodeAt((this.i + 3))=="s".charCodeAt(0)) && (this.s.charCodeAt((this.i + 4))=="e".charCodeAt(0))) {
          if(this.curr_node.is_property) {
            this.curr_node.value_type = 4;
            this.curr_node.boolean_value = false;
            this.parents.pop()
            var p_cnt = this.parents.length;
            var last_parent = this.parents[(p_cnt - 1)];
            this.curr_node = last_parent;
          } else {
            var new_attr = new DictNode(this.code,sp,ep);
            new_attr.value_type = 4;
            new_attr.boolean_value = false;
            this.curr_node.children.push(new_attr);
          }
          this.i = this.i + 5;
          continue;
        }
        if(((fc==45) && (this.s.charCodeAt((this.i + 1))>=46) && (this.s.charCodeAt((this.i + 1))<=57)) || ((fc>=48) && (fc<=57))) {
          sp = this.i;
          this.i = 1 + this.i;
          c = this.s.charCodeAt(this.i);
          while((this.i<this.len) && (((c>=48) && (c<=57)) || (c=="e".charCodeAt(0)) || (c=="E".charCodeAt(0)) || (c==".".charCodeAt(0)) || (c=="+".charCodeAt(0)) || (c=="-".charCodeAt(0)))) {
            this.i = 1 + this.i;
            c = this.s.charCodeAt(this.i);
          }
          ep = this.i;
          if(this.curr_node.is_property) {
            this.curr_node.value_type = 1;
            this.curr_node.double_value = parseFloat(this.s.substring(sp, ep));
            this.parents.pop()
            var p_cnt = this.parents.length;
            var last_parent = this.parents[(p_cnt - 1)];
            this.curr_node = last_parent;
            continue;
          } else {
            var new_attr = new DictNode(this.code,sp,ep);
            new_attr.value_type = 1;
            new_attr.double_value = parseFloat(this.s.substring(sp, ep));
            this.curr_node.children.push(new_attr);
            continue;
          }
        }
        if(cc1==34) {
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
            if(this.curr_node.is_property) {
              if(must_encode) {
                this.curr_node.string_value = encoded_str;
              } else {
                this.curr_node.string_value = this.s.substring(sp, ep);
              }
              this.curr_node.value_type = 3;
              this.parents.pop()
              var p_cnt = this.parents.length;
              var last_parent = this.parents[(p_cnt - 1)];
              this.curr_node = last_parent;
              this.i = this.i + 1;
              continue;
            }
            if(this.curr_node.value_type==5) {
              var new_attr = new DictNode(this.code,sp,ep);
              new_attr.value_type = 3;
              if(must_encode) {
                new_attr.string_value = encoded_str;
              } else {
                new_attr.string_value = this.s.substring(sp, ep);
              }
              this.curr_node.children.push(new_attr);
              this.i = this.i + 1;
              continue;
            }
            if(this.curr_node.value_type==6) {
              var new_prop = new DictNode(this.code,sp,ep);
              new_prop.is_property = true;
              new_prop.vref = this.s.substring(sp, ep);
              this.curr_node.keys.push(new_prop.vref);
              this.curr_node.objects[new_prop.vref] = new_prop;
              this.parents.push(new_prop);
              this.curr_node = new_prop;
              this.i = this.i + 1;
              continue;
            }
          }
        }
        if(cc1=="{".charCodeAt(0)) {
          var new_node = new DictNode(this.code,sp,ep);
          new_node.value_type = 6;
          this.parents.push(new_node);
          if(this.curr_node == null ) {
            this.curr_node = new_node;
            this.rootNode = new_node;
          } else {
            if(this.curr_node.is_property) {
              this.curr_node.object_value = new_node;
              this.curr_node.value_type = 6;
              new_node.value_type = 6;
              new_node.is_property_value = true;
            } else {
              this.curr_node.children.push(new_node);
            }
            this.curr_node = new_node;
          }
          this.i = this.i + 1;
          continue;
        }
        if(cc1=="[".charCodeAt(0)) {
          var new_node = new DictNode(this.code,sp,ep);
          new_node.value_type = 5;
          this.parents.push(new_node);
          if(this.curr_node == null ) {
            this.curr_node = new_node;
            this.rootNode = new_node;
          } else {
            if(this.curr_node.is_property) {
              this.curr_node.object_value = new_node;
              this.curr_node.value_type = 6;
              new_node.is_property_value = true;
            } else {
              this.curr_node.children.push(new_node);
            }
            this.curr_node = new_node;
          }
          this.i = this.i + 1;
          continue;
        }
        if(last_i==this.i) {
          this.i = 1 + this.i;
        }
      }
      return this.rootNode;
    }}
  ]);
  

return JSONParser;
}();
var RangerCompilerError = function( ) {  
  function RangerCompilerError() {
    _classCallCheck(this, RangerCompilerError);
    this.error_level = 0;
    this.code_line = 0;
    this.fileName = "";
    this.description = "";
    this.node = undefined;
  }
  
   _createClass(RangerCompilerError, [
  ]);
  

return RangerCompilerError;
}();
var RangerNodeValue = function( ) {  
  function RangerNodeValue() {
    _classCallCheck(this, RangerNodeValue);
    this.double_value = undefined;
    this.string_value = undefined;
    this.int_value = undefined;
    this.boolean_value = undefined;
    this.expression_value = undefined;
  }
  
   _createClass(RangerNodeValue, [
  ]);
  

return RangerNodeValue;
}();
var RangerAppParamDesc = function( ) {  
  function RangerAppParamDesc() {
    _classCallCheck(this, RangerAppParamDesc);
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
  
   _createClass(RangerAppParamDesc, [
  ]);
  

return RangerAppParamDesc;
}();
var RangerAppFunctionDesc = function( ) {  
  function RangerAppFunctionDesc() {
    _classCallCheck(this, RangerAppFunctionDesc);
    this.name = "";
    this.node = undefined;
    this.nameNode = undefined;
    this.params = [];
    this.return_value = undefined;
    this.is_method = false;
    this.container_class = undefined;
    this.body_ast = undefined;
    this.body_str = undefined;
  }
  
   _createClass(RangerAppFunctionDesc, [
  ]);
  

return RangerAppFunctionDesc;
}();
var RangerAppEnum = function( ) {  
  function RangerAppEnum() {
    _classCallCheck(this, RangerAppEnum);
    this.name = "";
    this.cnt = 0;
    this.values = {};
    this.node = undefined;
  }
  
   _createClass(RangerAppEnum, [
    { key: "add", value: function add(n) { 
      this.values[n] = this.cnt;
      this.cnt = this.cnt + 1;
    }}
  ]);
  

return RangerAppEnum;
}();
var RangerAppClassDesc = function( ) {  
  function RangerAppClassDesc() {
    _classCallCheck(this, RangerAppClassDesc);
    this.name = "";
    this.ctx = undefined;
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
  
   _createClass(RangerAppClassDesc, [
    { key: "hasMethod", value: function hasMethod(m_name) { 
      return typeof(this.defined_methods[m_name]) != "undefined";
    }}
    ,
    { key: "findMethod", value: function findMethod(f_name) { 
      for( var i= 0; i< this.methods.length; i++) { 
        var m= this.methods[i];
        if(m.name==f_name) {
          return m;
        }
      }
      for( var i= 0; i< this.extends_classes.length; i++) { 
        var cname= this.extends_classes[i];
        var cDesc = this.ctx.findClass(cname);
        if(cDesc.hasMethod(f_name)) {
          return cDesc.findMethod(f_name);
        }
      }
    }}
    ,
    { key: "findVariable", value: function findVariable(f_name) { 
      for( var i= 0; i< this.variables.length; i++) { 
        var m= this.variables[i];
        if(m.name==f_name) {
          return m;
        }
      }
    }}
    ,
    { key: "addParentClass", value: function addParentClass(p_name) { 
      this.extends_classes.push(p_name);
    }}
    ,
    { key: "addVariable", value: function addVariable(desc) { 
      this.variables.push(desc);
    }}
    ,
    { key: "addMethod", value: function addMethod(desc) { 
      this.defined_methods[desc.name] = true;
      this.methods.push(desc);
    }}
    ,
    { key: "addConstructor", value: function addConstructor(desc) { 
      this.constructor_node = desc;
      this.has_constructor = true;
    }}
    ,
    { key: "addDesctructor", value: function addDesctructor(desc) { 
      this.descructor_node = desc;
      this.has_desctructor = true;
    }}
  ]);
  

return RangerAppClassDesc;
}();
var RangerAppWriterContext = function( ) {  
  function RangerAppWriterContext() {
    _classCallCheck(this, RangerAppWriterContext);
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
  
   _createClass(RangerAppWriterContext, [
    { key: "addError", value: function addError(node, descr) { 
      var e = new RangerCompilerError();
      e.description = descr;
      e.node = node;
      var root = this.getRoot();
      root.compilerErrors.push(e);
    }}
    ,
    { key: "defTmpVarName", value: function defTmpVarName(name) { 
      this.localTmpVariables[name] = true;
    }}
    ,
    { key: "isFinalTmpVarName", value: function isFinalTmpVarName(name) { 
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
    }}
    ,
    { key: "getTmpVarName", value: function getTmpVarName(name) { 
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
    }}
    ,
    { key: "isEnumDefined", value: function isEnumDefined(n) { 
      if(typeof(this.definedEnums[n]) != "undefined") {
        return true;
      }
      if(this.parent == null ) {
        return false;
      }
      return this.parent.isEnumDefined(n);
    }}
    ,
    { key: "getEnum", value: function getEnum(n) { 
      if(typeof(this.definedEnums[n]) != "undefined") {
        return this.definedEnums[n];
      }
      if(this.parent == null ) {
        return new RangerAppEnum();
      }
      return this.parent.getEnum(n);
    }}
    ,
    { key: "isVarDefined", value: function isVarDefined(name) { 
      if(typeof(this.localVariables[name]) != "undefined") {
        return true;
      }
      if(this.parent == null ) {
        return false;
      }
      return this.parent.isVarDefined(name);
    }}
    ,
    { key: "getVariableDef", value: function getVariableDef(name) { 
      if(typeof(this.localVariables[name]) != "undefined") {
        return this.localVariables[name];
      }
      if(this.parent == null ) {
        var tmp = new RangerAppParamDesc();
        return tmp;
      }
      return this.parent.getVariableDef(name);
    }}
    ,
    { key: "defineVariable", value: function defineVariable(name, desc) { 
      this.localVariables[name] = desc;
      this.localVarNames.push(name);
    }}
    ,
    { key: "isDefinedClass", value: function isDefinedClass(name) { 
      if(typeof(this.definedClasses[name]) != "undefined") {
        return true;
      } else {
        if(this.parent != null ) {
          return this.parent.isDefinedClass(name);
        }
      }
      return false;
    }}
    ,
    { key: "getRoot", value: function getRoot() { 
      if(this.parent == null ) {
        return this;
      } else {
        return this.parent.getRoot();
      }
    }}
    ,
    { key: "addClass", value: function addClass(name, desc) { 
      var root = this.getRoot()
      ;
      if(typeof(name[root.definedClasses]) != "undefined") {
        console.log("ERROR: class " + name + " already defined");
      } else {
        root.definedClasses[name] = desc;
        root.definedClassList.push(name);
      }
    }}
    ,
    { key: "findClass", value: function findClass(name) { 
      var root = this.getRoot()
      ;
      return root.definedClasses[name];
    }}
    ,
    { key: "getCurrentClass", value: function getCurrentClass() { 
      if(this.currentClass != null ) {
        return this.currentClass;
      }
      if(this.parent != null ) {
        return this.parent.getCurrentClass();
      }
      return new RangerAppClassDesc();
    }}
    ,
    { key: "isInExpression", value: function isInExpression() { 
      if(this.expr_stack.length>0) {
        return true;
      }
      if(this.parent != null ) {
        return this.parent.isInExpression();
      }
      return false;
    }}
    ,
    { key: "expressionLevel", value: function expressionLevel() { 
      var level = this.expr_stack.length;
      if(this.parent != null ) {
        return level + (this.parent.expressionLevel());
      }
      return level;
    }}
    ,
    { key: "setInExpr", value: function setInExpr() { 
      this.expr_stack.push(true);
    }}
    ,
    { key: "unsetInExpr", value: function unsetInExpr() { 
      this.expr_stack.pop()
    }}
    ,
    { key: "isInMethod", value: function isInMethod() { 
      if(this.method_stack.length>0) {
        return true;
      }
      if(this.parent != null ) {
        return this.parent.isInMethod();
      }
      return false;
    }}
    ,
    { key: "setInMethod", value: function setInMethod() { 
      this.method_stack.push(true);
    }}
    ,
    { key: "unsetInMethod", value: function unsetInMethod() { 
      this.method_stack.pop()
    }}
    ,
    { key: "fork", value: function fork() { 
      var new_ctx = new RangerAppWriterContext();
      new_ctx.parent = this;
      return new_ctx;
    }}
  ]);
  

return RangerAppWriterContext;
}();
var RangerCommonWriter = function( ) {  
  function RangerCommonWriter() {
    _classCallCheck(this, RangerCommonWriter);
  }
  
   _createClass(RangerCommonWriter, [
    { key: "getWriterLang", value: function getWriterLang() { 
      return "common";
    }}
    ,
    { key: "EncodeString", value: function EncodeString(orig_str) { 
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
    }}
    ,
    { key: "cmdEnum", value: function cmdEnum(node, ctx, wr) { 
      var fNameNode = node.children[1];
      var enumList = node.children[2];
      var new_enum = new RangerAppEnum();
      for( var i= 0; i< enumList.children.length; i++) { 
        var item= enumList.children[i];
        new_enum.add(item.vref)
      }
      ctx.definedEnums[fNameNode.vref] = new_enum;
    }}
    ,
    { key: "findParamDesc", value: function findParamDesc(obj, ctx, wr) { 
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
    }}
    ,
    { key: "areEqualTypes", value: function areEqualTypes(n1, n2, ctx) { 
      if(n1 == null ) {
        if(n2 != null ) {
          ctx.addError(n2,"Internal error: shouldBeEqualTypes called with n2 == null ")
        }
        return false;
      }
      if(n2 == null ) {
        if(n1 != null ) {
          ctx.addError(n1,"Internal error: shouldBeEqualTypes called with n1 == null ")
        }
        return false;
      }
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
            return false;
          }
        }
      }
      return true;
    }}
    ,
    { key: "shouldBeEqualTypes", value: function shouldBeEqualTypes(n1, n2, ctx) { 
      if(n1 == null ) {
        if(n2 != null ) {
          ctx.addError(n2,"Internal error: shouldBeEqualTypes called with n2 == null ")
        }
        return;
      }
      if(n2 == null ) {
        if(n1 != null ) {
          ctx.addError(n1,"Internal error: shouldBeEqualTypes called with n1 == null ")
        }
        return;
      }
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
    }}
    ,
    { key: "shouldBeType", value: function shouldBeType(type_name, n1, ctx) { 
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
    }}
    ,
    { key: "cmdImport", value: function cmdImport(node, ctx, wr) { 
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
    }}
    ,
    { key: "CreateClass", value: function CreateClass(node, ctx, wr) { 
      wr.out("----Create class is not defined---- :(",true)
    }}
    ,
    { key: "getThisName", value: function getThisName() { 
      return "this";
    }}
    ,
    { key: "WriteThisVar", value: function WriteThisVar(node, ctx, wr) { 
      wr.out(this.getThisName()
      ,false)
    }}
    ,
    { key: "WriteVRef", value: function WriteVRef(node, ctx, wr) { 
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
    }}
    ,
    { key: "Constructor", value: function Constructor(node, ctx, wr) { 
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
    }}
    ,
    { key: "WriteScalarValue", value: function WriteScalarValue(node, ctx, wr) { 
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
    }}
    ,
    { key: "cmdNew", value: function cmdNew(node, ctx, wr) { 
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
    }}
    ,
    { key: "cmdLocalCall", value: function cmdLocalCall(node, ctx, wr) { 
      var fnNode = node.getFirst();
      var desc = ctx.getCurrentClass();
      if(desc.hasMethod(fnNode.vref)) {
        var fnDescr = desc.findMethod(fnNode.vref);
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
        for( var i= 0; i< fnDescr.params.length; i++) { 
          var param= fnDescr.params[i];
          var argNode = node.children[(i + 1)];
          if(argNode == null ) {
            ctx.addError(node,"Argument was not defined")
          }
          if(this.areEqualTypes(param.nameNode,argNode,ctx)) {
          } else {
            ctx.addError(node,"ERROR, invalid argument types for " + desc.name + " method " + fnDescr.name)
          }
        }
        return true;
      } else {
        ctx.addError(node,"ERROR, could not find class " + desc.name + " method " + fnNode.vref)
        return false;
      }
      return false;
    }}
    ,
    { key: "cmdCall", value: function cmdCall(node, ctx, wr) { 
      var obj = node.getSecond();
      var method = node.getThird();
      var fnDescr;
      var has_fn_desc = false;
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
            fnDescr = classDesc.findMethod(method.vref);
            if(fnDescr == null ) {
              ctx.addError(obj,"ERROR, could not find class " + className + " method " + method.vref)
            } else {
              has_fn_desc = true;
            }
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
      if(has_fn_desc) {
        var nn = fnDescr.nameNode;
        node.eval_type = nn.value_type;
        node.eval_type_name = nn.type_name;
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
        if(has_fn_desc) {
          for( var i= 0; i< fnDescr.params.length; i++) { 
            var param= fnDescr.params[i];
            var argNode = params.children[i];
            if(argNode == null ) {
              ctx.addError(node,"Argument was not defined")
            }
            if(this.areEqualTypes(param.nameNode,argNode,ctx)) {
            } else {
              ctx.addError(node,"ERROR, invalid argument types for " + className + " method " + method.vref)
            }
          }
        }
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
    }}
    ,
    { key: "cmdJoin", value: function cmdJoin(node, ctx, wr) { 
      var n1 = node.getSecond();
      var n2 = node.getThird();
      ctx.setInExpr()
      this.WalkNode(n1,ctx,wr)
      ctx.unsetInExpr()
      wr.out(".join(",false)
      this.WalkNode(n2,ctx,wr)
      wr.out(")",false)
    }}
    ,
    { key: "cmdSplit", value: function cmdSplit(node, ctx, wr) { 
      var n1 = node.getSecond();
      var n2 = node.getThird();
      ctx.setInExpr()
      this.WalkNode(n1,ctx,wr)
      ctx.unsetInExpr()
      wr.out(".split(",false)
      this.WalkNode(n2,ctx,wr)
      wr.out(")",false)
    }}
    ,
    { key: "cmdTrim", value: function cmdTrim(node, ctx, wr) { 
      var n1 = node.getSecond();
      ctx.setInExpr()
      this.WalkNode(n1,ctx,wr)
      ctx.unsetInExpr()
      wr.out(".trim()",false)
      this.shouldBeType("string",n1,ctx)
    }}
    ,
    { key: "cmdStrlen", value: function cmdStrlen(node, ctx, wr) { 
      var n1 = node.getSecond();
      ctx.setInExpr()
      this.WalkNode(n1,ctx,wr)
      ctx.unsetInExpr()
      wr.out(".length",false)
      this.shouldBeType("string",n1,ctx)
    }}
    ,
    { key: "cmdSubstring", value: function cmdSubstring(node, ctx, wr) { 
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
    }}
    ,
    { key: "cmdCharcode", value: function cmdCharcode(node, ctx, wr) { 
      var n1 = node.getSecond();
      ctx.setInExpr()
      this.WalkNode(n1,ctx,wr)
      wr.out(".charCodeAt(0)",false)
      ctx.unsetInExpr()
    }}
    ,
    { key: "cmdStrfromcode", value: function cmdStrfromcode(node, ctx, wr) { 
      var n1 = node.getSecond();
      ctx.setInExpr()
      wr.out("String.fromCharCode(",false)
      this.WalkNode(n1,ctx,wr)
      wr.out(")",false)
      ctx.unsetInExpr()
      this.shouldBeType("int",n1,ctx)
    }}
    ,
    { key: "cmdCharAt", value: function cmdCharAt(node, ctx, wr) { 
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
    }}
    ,
    { key: "cmdStr2Int", value: function cmdStr2Int(node, ctx, wr) { 
      var n1 = node.getSecond();
      ctx.setInExpr()
      wr.out("parseInt(",false)
      this.WalkNode(n1,ctx,wr)
      ctx.unsetInExpr()
      wr.out(")",false)
      this.shouldBeType("string",n1,ctx)
    }}
    ,
    { key: "cmdStr2Double", value: function cmdStr2Double(node, ctx, wr) { 
      var n1 = node.getSecond();
      ctx.setInExpr()
      wr.out("parseFloat(",false)
      this.WalkNode(n1,ctx,wr)
      ctx.unsetInExpr()
      wr.out(")",false)
      this.shouldBeType("string",n1,ctx)
    }}
    ,
    { key: "cmdDouble2Str", value: function cmdDouble2Str(node, ctx, wr) { 
      var n1 = node.getSecond();
      ctx.setInExpr()
      wr.out("(",String.fromCharCode(34),String.fromCharCode(34)," + ",false)
      this.WalkNode(n1,ctx,wr)
      ctx.unsetInExpr()
      wr.out(")",false)
      this.shouldBeType("double",n1,ctx)
    }}
    ,
    { key: "cmdArrayLength", value: function cmdArrayLength(node, ctx, wr) { 
      var n1 = node.getSecond();
      ctx.setInExpr()
      this.WalkNode(n1,ctx,wr)
      ctx.unsetInExpr()
      wr.out(".length",false)
      node.eval_type = 2;
      node.eval_type_name = "int";
    }}
    ,
    { key: "cmdPrint", value: function cmdPrint(node, ctx, wr) { 
      var n1 = node.getSecond();
      wr.newline()
      wr.out("console.log(",false)
      ctx.setInExpr()
      this.WalkNode(n1,ctx,wr)
      ctx.unsetInExpr()
      wr.out(");",true)
      this.shouldBeType("string",n1,ctx)
    }}
    ,
    { key: "cmdDoc", value: function cmdDoc(node, ctx, wr) { 
      wr.newline()
      wr.out("\/**",false)
      if(node.children.length>1) {
        var fc = node.getSecond();
        this.WalkNode(fc,ctx,wr)
      }
      wr.out("*\/",true)
    }}
    ,
    { key: "cmdContinue", value: function cmdContinue(node, ctx, wr) { 
      wr.newline()
      wr.out("continue;",true)
    }}
    ,
    { key: "cmdBreak", value: function cmdBreak(node, ctx, wr) { 
      wr.newline()
      wr.out("break;",true)
    }}
    ,
    { key: "cmdThrow", value: function cmdThrow(node, ctx, wr) { 
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
    }}
    ,
    { key: "cmdReturn", value: function cmdReturn(node, ctx, wr) { 
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
    }}
    ,
    { key: "cmdRemoveLast", value: function cmdRemoveLast(node, ctx, wr) { 
      var obj = node.getSecond();
      wr.newline()
      ctx.setInExpr()
      this.WalkNode(obj,ctx,wr)
      ctx.unsetInExpr()
      wr.out(".pop()",true)
      this.shouldBeType("[]",obj,ctx)
    }}
    ,
    { key: "cmdPush", value: function cmdPush(node, ctx, wr) { 
      var obj = node.getSecond();
      var value = node.getThird();
      wr.newline()
      ctx.setInExpr()
      this.WalkNode(obj,ctx,wr)
      wr.out(".push(",false)
      this.WalkNode(value,ctx,wr)
      ctx.unsetInExpr()
      wr.out(");",true)
    }}
    ,
    { key: "cmdItemAt", value: function cmdItemAt(node, ctx, wr) { 
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
    }}
    ,
    { key: "cmdHas", value: function cmdHas(node, ctx, wr) { 
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
    }}
    ,
    { key: "cmdSet", value: function cmdSet(node, ctx, wr) { 
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
    }}
    ,
    { key: "cmdGet", value: function cmdGet(node, ctx, wr) { 
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
    }}
    ,
    { key: "cmdIsNull", value: function cmdIsNull(node, ctx, wr) { 
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
    }}
    ,
    { key: "cmdNotNull", value: function cmdNotNull(node, ctx, wr) { 
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
    }}
    ,
    { key: "cmdAssign", value: function cmdAssign(node, ctx, wr) { 
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
    }}
    ,
    { key: "mathLibCalled", value: function mathLibCalled(node, ctx, wr) { 
    }}
    ,
    { key: "cmdMathLibOp", value: function cmdMathLibOp(node, ctx, wr) { 
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
    }}
    ,
    { key: "cmdComparisionOp", value: function cmdComparisionOp(node, ctx, wr) { 
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
    }}
    ,
    { key: "cmdLogicOp", value: function cmdLogicOp(node, ctx, wr) { 
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
    }}
    ,
    { key: "cmdPlusOp", value: function cmdPlusOp(node, ctx, wr) { 
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
    }}
    ,
    { key: "cmdNumericOp", value: function cmdNumericOp(node, ctx, wr) { 
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
    }}
    ,
    { key: "cmdIf", value: function cmdIf(node, ctx, wr) { 
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
    }}
    ,
    { key: "cmdFor", value: function cmdFor(node, ctx, wr) { 
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
    }}
    ,
    { key: "cmdWhile", value: function cmdWhile(node, ctx, wr) { 
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
    }}
    ,
    { key: "cmdDefault", value: function cmdDefault(node, ctx, wr) { 
      wr.newline()
      var n1 = node.getSecond();
      wr.out("default: ",true)
      wr.indent(1)
      this.WalkNode(n1,ctx,wr)
      wr.newline()
      wr.out("break;",true)
      wr.indent(-1)
    }}
    ,
    { key: "cmdCase", value: function cmdCase(node, ctx, wr) { 
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
    }}
    ,
    { key: "cmdSwitch", value: function cmdSwitch(node, ctx, wr) { 
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
    }}
    ,
    { key: "cmdFileRead", value: function cmdFileRead(node, ctx, wr) { 
    }}
    ,
    { key: "cmdFileWrite", value: function cmdFileWrite(node, ctx, wr) { 
    }}
    ,
    { key: "cmdIsDir", value: function cmdIsDir(node, ctx, wr) { 
    }}
    ,
    { key: "cmdIsFile", value: function cmdIsFile(node, ctx, wr) { 
    }}
    ,
    { key: "cmdCreateDir", value: function cmdCreateDir(node, ctx, wr) { 
    }}
    ,
    { key: "cmdArgv", value: function cmdArgv(node, ctx, wr) { 
    }}
    ,
    { key: "cmdArgvCnt", value: function cmdArgvCnt(node, ctx, wr) { 
    }}
    ,
    { key: "WriteComment", value: function WriteComment(node, ctx, wr) { 
    }}
    ,
    { key: "EnterClass", value: function EnterClass(node, ctx, wr) { 
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
    }}
    ,
    { key: "EnterMethod", value: function EnterMethod(node, ctx, wr) { 
      var cn = node.children[1];
      var desc = ctx.getCurrentClass();
      var subCtx = ctx.fork();
      var m = desc.findMethod(cn.vref);
      for( var i= 0; i< m.params.length; i++) { 
        var v= m.params[i];
        subCtx.defineVariable(v.name,v)
      }
      this.PublicMethod(node,subCtx,wr)
    }}
    ,
    { key: "EnterVarDef", value: function EnterVarDef(node, ctx, wr) { 
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
    }}
    ,
    { key: "WalkNodeChildren", value: function WalkNodeChildren(node, ctx, wr) { 
      if(node.expression) {
        for( var i= 0; i< node.children.length; i++) { 
          var item= node.children[i];
          this.WalkNode(item,ctx,wr)
        }
      }
    }}
    ,
    { key: "WalkNode", value: function WalkNode(node, ctx, wr) { 
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
    }}
    ,
    { key: "StartCodeWriting", value: function StartCodeWriting(node, ctx, wr) { 
      this.WalkNode(node,ctx,wr)
      var lang = this.getWriterLang();
      if(node.hasStringProperty(lang)) {
        wr.newline()
        wr.out(node.getStringProperty(lang),true)
      }
    }}
    ,
    { key: "CollectMethods", value: function CollectMethods(node, ctx, wr) { 
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
        new_class.ctx = ctx;
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
        m.node = node;
        m.nameNode = node.children[1];
        var args = node.children[2];
        for( var ii= 0; ii< args.children.length; ii++) { 
          var arg= args.children[ii];
          var p = new RangerAppParamDesc();
          p.name = arg.vref;
          p.value_type = arg.value_type;
          p.node = arg;
          p.nameNode = arg;
          arg.eval_type = arg.value_type;
          arg.eval_type_name = arg.type_name;
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
    }}
    ,
    { key: "DefineVar", value: function DefineVar(node, ctx, wr) { 
      console.log("ERROR: DefineVar not implemented!");
    }}
  ]);
  

return RangerCommonWriter;
}();
var RangerES5Writer = function( _RangerCommonWriter) {  _inherits(RangerES5Writer, _RangerCommonWriter);
  
  function RangerES5Writer() {
    _classCallCheck(this, RangerES5Writer);
    var _this = _possibleConstructorReturn(this, (RangerES5Writer.__proto__ || Object.getPrototypeOf(RangerES5Writer)).call(this));
    return _this;
  }
  
   _createClass(RangerES5Writer, [
    { key: "getWriterLang", value: function getWriterLang() { 
      return "JavaScript";
    }}
    ,
    { key: "cmdArgv", value: function cmdArgv(node, ctx, wr) { 
      var argIndex = node.getSecond();
      wr.out("process.argv[ 2 + process.execArgv.length + ",false)
      ctx.setInExpr()
      this.WalkNode(argIndex,ctx,wr)
      ctx.unsetInExpr()
      wr.out("]",false)
    }}
    ,
    { key: "cmdArgvCnt", value: function cmdArgvCnt(node, ctx, wr) { 
      wr.out("( process.argv.length - ( 2 + process.execArgv.length ) )",false)
    }}
    ,
    { key: "cmdFileRead", value: function cmdFileRead(node, ctx, wr) { 
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
    }}
    ,
    { key: "cmdFileWrite", value: function cmdFileWrite(node, ctx, wr) { 
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
    }}
    ,
    { key: "cmdIsFile", value: function cmdIsFile(node, ctx, wr) { 
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
    }}
    ,
    { key: "cmdIsDir", value: function cmdIsDir(node, ctx, wr) { 
      var pathName = node.getSecond();
      wr.out("require(" + String.fromCharCode(34) + "fs" + String.fromCharCode(34) + ").existsSync( process.cwd() + ",false)
      wr.out(String.fromCharCode(34) + "\/" + String.fromCharCode(34) + " + ",false)
      ctx.setInExpr()
      this.WalkNode(pathName,ctx,wr)
      ctx.unsetInExpr()
      wr.out(")",false)
    }}
    ,
    { key: "cmdCreateDir", value: function cmdCreateDir(node, ctx, wr) { 
      var pathName = node.getSecond();
      wr.newline()
      wr.out("require(" + String.fromCharCode(34) + "fs" + String.fromCharCode(34) + ").mkdirSync( process.cwd() + ",false)
      wr.out(String.fromCharCode(34) + "\/" + String.fromCharCode(34) + " + ",false)
      ctx.setInExpr()
      this.WalkNode(pathName,ctx,wr)
      wr.out(");",true)
      ctx.unsetInExpr()
    }}
    ,
    { key: "PublicMethod", value: function PublicMethod(node, ctx, wr) { 
      var currClass = ctx.getCurrentClass();
      var nameDef = node.getSecond();
      if(false==(wr.hasTag(("js_class_writer" + currClass.name)))) {
        wr.createTag("js_class_writer" + currClass.name)
      } else {
        wr.out(",",true)
      }
      wr.newline()
      wr.out("{ key: \"" + nameDef.vref + "\", value: function " + nameDef.vref + "(",false)
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
      wr.newline()
      wr.out("}}",true)
      ctx.unsetInMethod()
    }}
    ,
    { key: "CreateClass", value: function CreateClass(node, ctx, wr) { 
      var nameDef = node.getSecond();
      var classInfo = ctx.findClass(nameDef.vref);
      if(false==(wr.hasTag("polyfill"))) {
        wr.createTag("polyfill")
        wr.out("\n\"use strict\";\n\nvar _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if (\"value\" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();\n\nfunction _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError(\"this hasn't been initialised - super() hasn't been called\"); } return call && (typeof call === \"object\" || typeof call === \"function\") ? call : self; }\n\nfunction _inherits(subClass, superClass) { if (typeof superClass !== \"function\" && superClass !== null) { throw new TypeError(\"Super expression must either be null or a function, not \" + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }\n\nfunction _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError(\"Cannot call a class as a function\"); } }\n\n                            ",true)
      }
      wr.newline()
      wr.out("var " + nameDef.vref + " = function( ",false)
      var b_extended = false;
      if(classInfo.extends_classes.length>0) {
        b_extended = true;
        for( var i= 0; i< classInfo.extends_classes.length; i++) { 
          var pName= classInfo.extends_classes[i];
          if(i>0) {
            wr.out(",",false)
          }
          wr.out("_" + pName,false)
        }
      }
      wr.out(") { " + " ",false)
      wr.indent(1)
      if(b_extended) {
        for( var i= 0; i< classInfo.extends_classes.length; i++) { 
          var pName= classInfo.extends_classes[i];
          wr.out("_inherits(" + nameDef.vref + ", _" + pName + ");",true)
        }
      }
      wr.out("",true)
      var cw = wr.createTag("constructor");
      cw.out("function " + nameDef.vref + "(",false)
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
      cw.out("_classCallCheck(this, " + nameDef.vref + ");",true)
      if(b_extended) {
        cw.out("var _this = _possibleConstructorReturn(this, (" + nameDef.vref + ".__proto__ || Object.getPrototypeOf(" + nameDef.vref + ")).call(this));",true)
      }
      wr.newline()
      wr.out("",true)
      wr.out(" _createClass(" + nameDef.vref + ", [",true)
      wr.indent(1)
      var fnBody = node.children[2];
      this.WalkNodeChildren(fnBody,ctx,wr)
      wr.indent(-1)
      wr.out("]);",true)
      wr.out("",true)
      if(b_extended) {
        cw.out("return _this;",true)
      }
      cw.indent(-1)
      cw.out("}",true)
      wr.indent(-1)
      wr.out("",true)
      wr.out("return " + nameDef.vref + ";",true)
      wr.out("}(",false)
      if(b_extended) {
        for( var i= 0; i< classInfo.extends_classes.length; i++) { 
          var pName= classInfo.extends_classes[i];
          if(i>0) {
            wr.out(",",false)
          }
          wr.out(pName,false)
        }
      }
      wr.out(");",true)
    }}
    ,
    { key: "DefineVar", value: function DefineVar(node, ctx, wr) { 
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
    }}
    ,
    { key: "DefineMethod", value: function DefineMethod(node, ctx, wr) { 
      var s = node.getVRefAt(1);
      wr.out("\/\/ DefineMethod",true)
      wr.out(s + "() {",true)
      wr.indent(1)
      wr.out("\/\/ the code...",true)
      wr.indent(-1)
      wr.out("}",true)
    }}
  ]);
  

return RangerES5Writer;
}(RangerCommonWriter);
var TestCreateSh = function( ) {  
  function TestCreateSh() {
    _classCallCheck(this, TestCreateSh);
    this.read_filename = "";
    this.call_class = "";
    this.call_method = "";
    this.tool_dir = "";
    this.tool_name = "";
    this.version = "";
    this.arg_cnt = 0;
    this.fnDescription = undefined;
  }
  
   _createClass(TestCreateSh, [
    { key: "codeStringToJs", value: function codeStringToJs(str, wr) { 
      var code = new SourceCode(str);
      var parser = new RangerLispParser(code);
      parser.parse()
      var appCtx = new RangerAppWriterContext();
      var cwr = new RangerES5Writer();
      var node = parser.rootNode;
      cwr.CollectMethods(node,appCtx,wr)
      cwr.StartCodeWriting(node,appCtx,wr)
    }}
    ,
    { key: "writeJavascriptCmdTool", value: function writeJavascriptCmdTool(wr, info) { 
      var usageWr = new CodeWriter();
      for( var i= 0; i< this.fnDescription.params.length; i++) { 
        var v= this.fnDescription.params[i];
        usageWr.out("<" + v.name + ">",true)
      }
      var callWr = new CodeWriter();
      var ii = 0;
      callWr.out("(def obj:" + this.call_class + " (new " + this.call_class + "()) )",true)
      callWr.out("(call obj " + this.call_method + " (",false)
      while(ii<this.arg_cnt) {
        callWr.out("(shell_arg " + ii + ") ",false)
        ii = ii + 1;
      }
      callWr.out(")",true)
      var rWr = new CodeWriter();
      rWr.out("\n(                    \n    (CreateClass ShellScriptToolMain" + this.call_class + "\n        (\n            (PublicMethod run:void ()\n                (\n                    (def argCnt:int (shell_arg_cnt _))\n                    (if ( < argCnt " + this.arg_cnt + ")\n                        (\n                            (print \"" + (info.getStringProperty("description")) + " " + (info.getStringProperty("version")) + " \")\n                            (print \"Usage:\")\n                            (print (+ \"" + (info.getStringProperty("name")) + " " + (usageWr.getCode()) + " \"))\n                            (return _)\n                        )\n                    )\n                    " + (callWr.getCode()) + "\n                )\n            )\n        )\n    )                    \n)\n                    ",false)
      this.codeStringToJs(rWr.getCode(),wr)
      wr.out("\n\/\/ start the cmd line tool\n(new ShellScriptToolMain" + this.call_class + "()).run();\n                    ",true)
    }}
    ,
    { key: "createPackageJSON", value: function createPackageJSON(info) { 
      var jsp = new JSONParser((new SourceCode("{}")));
      var n = jsp.parse();
      n.addString("name",info.getStringProperty("name"))
      n.addString("version",info.getStringProperty("version"))
      n.addString("description",info.getStringProperty("description"))
      n.addString("main","index.js")
      n.addObject("scripts")
      var binNode = n.addObject("bin");
      binNode.addString(info.getStringProperty("name"),".\/index.js")
      n.addString("author",info.getStringProperty("author"))
      n.addString("license",info.getStringProperty("license"))
      return n.stringify();
    }}
    ,
    { key: "run", value: function run() { 
      if(( process.argv.length - ( 2 + process.execArgv.length ) )==3) {
        this.read_filename = process.argv[ 2 + process.execArgv.length + 0];
        this.call_class = process.argv[ 2 + process.execArgv.length + 1];
        this.call_method = process.argv[ 2 + process.execArgv.length + 2];
      } else {
        console.log("args: <file> <class> <method> ");
        return;
      }
      var c = require("fs").readFileSync( process.cwd() + "/" + "." + "/" + this.read_filename, "utf8");
      var code = new SourceCode(c);
      var parser = new RangerLispParser(code);
      parser.parse()
      console.log("Directory " + this.tool_dir);
      var fileSystem = new CodeFileSystem();
      var cf = fileSystem.getFile(".","index.js");
      var code_wr = cf.getWriter();
      code_wr.out("#!\/usr\/bin\/env node",true)
      var appCtx = new RangerAppWriterContext();
      var cwr = new RangerES5Writer();
      var node = parser.rootNode;
      cwr.CollectMethods(node,appCtx,code_wr)
      cwr.StartCodeWriting(node,appCtx,code_wr)
      if(appCtx.isDefinedClass(this.call_class)) {
        console.log("Found " + this.call_class + "!");
        var cDesc = appCtx.findClass(this.call_class);
        if(cDesc.hasMethod(this.call_method)) {
          console.log("Class had method " + this.call_method + "!");
          var m = cDesc.findMethod(this.call_method);
          this.fnDescription = m;
          var fnNode = m.node;
          if(fnNode != null ) {
            if(fnNode.hasExpressionProperty("shellUtility")) {
              console.log("Found the utility info!!!!");
              var info = fnNode.getExpressionProperty("shellUtility");
              var util_name = info.getStringProperty("name");
              console.log("name => " + util_name);
              console.log("dir => " + (info.getStringProperty("directory")));
              this.tool_dir = info.getStringProperty("directory");
              var packageFile = fileSystem.getFile(".","package.json");
              var package_wr = packageFile.getWriter();
              package_wr.out(this.createPackageJSON(info)
              ,false)
              for( var i= 0; i< m.params.length; i++) { 
                var v= m.params[i];
                console.log("--> variable " + v.name);
                this.arg_cnt = this.arg_cnt + 1;
              }
              this.writeJavascriptCmdTool(code_wr,info)
            } else {
              return;
            }
          }
          fileSystem.saveTo(this.tool_dir)
        } else {
          console.log("had no method " + this.call_method + " :(");
        }
      } else {
        console.log("Class " + this.call_class + " not found");
      }
      return;
    }}
  ]);
  

return TestCreateSh;
}();

// for JS code only
(new TestCreateSh()).run();

