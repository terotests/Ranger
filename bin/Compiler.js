
"use strict";

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

                            
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
    this.writer.createTag("imports");
    this.writer.ownerFile = this;
  }
  
   _createClass(CodeFile, [
    { key: "addImport", value: function addImport(import_name) { 
      if(typeof(this.import_list[import_name]) != "undefined") {
      } else {
        this.import_list[import_name] = import_name;
        this.import_names.push(import_name);
      }
    }}
    ,
    { key: "testCreateWriter", value: function testCreateWriter() { 
      return new CodeWriter();
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
    /* Weak variable : fileSystem*/
    /* Weak Object variable : fileSystem in class CodeFile */
  ], [
    
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
        this.mkdir(file_path);
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
  ], [
    
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
  ], [
    
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
    var new_slice = new CodeSlice();
    this.current_slice = new_slice;
    this.slices.push(new_slice);
  }
  
   _createClass(CodeWriter, [
    { key: "getImports", value: function getImports() { 
      if(this.ownerFile != null ) {
        return this.ownerFile.import_names;
      } else {
        if(this.parent != null ) {
          return this.parent.getImports();
        }
        var nothing = [];
        return nothing;
      }
    }}
    ,
    { key: "addImport", value: function addImport(name) { 
      if(this.ownerFile != null ) {
        this.ownerFile.addImport(name);
      } else {
        if(this.parent != null ) {
          this.parent.addImport(name);
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
        this.out("",true);
      }
    }}
    ,
    { key: "writeSlice", value: function writeSlice(str, newLine) { 
      this.addIndent();
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
        this.writeSlice(str,newLine);
      } else {
        for( var idx= 0; idx< lines.length; idx++) { 
          var row= lines[idx];
          this.addIndent();
          if(idx<(rowCnt - 1)) {
            this.writeSlice(row.trim(),true);
          } else {
            this.writeSlice(row,newLine);
          }
        }
      }
    }}
    ,
    { key: "raw", value: function raw(str, newLine) { 
      var lines = str.split("\n");
      var rowCnt = lines.length;
      if(rowCnt==1) {
        this.writeSlice(str,newLine);
      } else {
        for( var idx= 0; idx< lines.length; idx++) { 
          var row= lines[idx];
          this.addIndent();
          if(idx<(rowCnt - 1)) {
            this.writeSlice(row,true);
          } else {
            this.writeSlice(row,newLine);
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
    /* Weak variable : current_slice*/
    /* Weak Object variable : current_slice in class CodeWriter */
    /* Weak variable : ownerFile*/
    /* Weak Object variable : ownerFile in class CodeWriter */
    /* Weak variable : parent*/
    /* Weak Object variable : parent in class CodeWriter */
  ], [
    
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
      wr.addImport("java.utils.*");
      wr.out("\n                \n\/\/ this is a sample output from LISP code\n\nclass mySampleClass {\n\n}                               \n                ",true);
      testFile.addImport("java.io.*");
      var iWriter = wr.getTag("imports");
      var i_list = testFile.getImports();
      for( var idx= 0; idx< i_list.length; idx++) { 
        var str= i_list[idx];
        iWriter.out("import " + str + ";",true);
      }
      fs.printFilesList();
    }}
  ], [
    
  ]);
  

return CodeWriterTester;
}();
var DictNode = function( ) {  
  function DictNode() {
    _classCallCheck(this, DictNode);
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
      var v = new DictNode();
      v.value_type = 6;
      return v;
    }}
    ,
    { key: "addObject", value: function addObject(key) { 
      if(this.value_type==6) {
        var p = new DictNode();
        var v = new DictNode();
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
        var v = new DictNode();
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
      return new DictNode();
    }}
    ,
    { key: "getArrayAt", value: function getArrayAt(index) { 
      if(index<this.children.length) {
        var k = this.children[index];
        return k;
      }
      return new DictNode();
    }}
    ,
    { key: "getObject", value: function getObject(key) { 
      if(typeof(this.objects[key]) != "undefined") {
        var obj = this.objects[key];
        if(obj.is_property) {
          return obj.object_value;
        }
      }
      return new DictNode();
    }}
    ,
    { key: "getObjectAt", value: function getObjectAt(index) { 
      if(index<this.children.length) {
        var k = this.children[index];
        return k;
      }
      return new DictNode();
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
          console.log((
          this.double_value));
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
          item.walk();
          console.log(",");
        }
        console.log(")");
      }
      if(this.value_type==6) {
        if(this.is_property) {
          console.log(this.vref + " : ");
          this.object_value.walk();
        } else {
          console.log("Object(");
          for( var i_1= 0; i_1< this.keys.length; i_1++) { 
            var key= this.keys[i_1];
            var item_1 = this.objects[key];
            item_1.walk();
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
        var str_1 = "";
        if(this.is_property) {
          return String.fromCharCode(34) + this.vref + String.fromCharCode(34) + ":" + (this.object_value.stringify());
        } else {
          str_1 = "{";
          for( var i_1= 0; i_1< this.keys.length; i_1++) { 
            var key= this.keys[i_1];
            if(i_1>0) {
              str_1 = str_1 + ",";
            }
            var item_1 = this.objects[key];
            str_1 = str_1 + (item_1.stringify());
          }
          str_1 = str_1 + "}";
          return str_1;
        }
      }
      return "";
    }}
  ], [
    
  ]);
  

return DictNode;
}();
var RangerAppParamDesc = function( ) {  
  function RangerAppParamDesc() {
    _classCallCheck(this, RangerAppParamDesc);
    this.name = "";
    this.compiledName = "";
    this.debugString = "";
    this.ref_cnt = 0;
    this.set_cnt = 0;
    this.prop_assign_cnt = 0;
    this.value_type = undefined;
    this.has_default = false;
    this.def_value = undefined;
    this.default_value = undefined;
    this.isThis = false;
    this.classDesc = undefined;
    this.fnDesc = undefined;
    this.varType = 0;
    this.refType = 0;
    this.initRefType = 0;
    this.isParam = undefined;
    this.paramIndex = 0;
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
    { key: "pointsToObject", value: function pointsToObject(ctx) { 
      if(this.nameNode != null ) {
        var is_primitive = false;
        switch(this.nameNode.array_type) {
          case "string":
          case "int":
          case "boolean":
          case "double":
            is_primitive = true;
            break;
        }
        if(is_primitive) {
          return false;
        }
        if((this.nameNode.value_type==5) || (this.nameNode.value_type==6)) {
          var is_object = true;
          switch(this.nameNode.array_type) {
            case "string":
            case "int":
            case "boolean":
            case "double":
              is_object = false;
              break;
          }
          return is_object;
        }
        if(this.nameNode.value_type==8) {
          var is_object_1 = true;
          switch(this.nameNode.type_name) {
            case "string":
            case "int":
            case "boolean":
            case "double":
              is_object_1 = false;
              break;
          }
          if(ctx.isEnumDefined(this.nameNode.type_name)) {
            return false;
          }
          return is_object_1;
        }
      }
      return false;
    }}
    ,
    { key: "isObject", value: function isObject() { 
      if(this.nameNode != null ) {
        if(this.nameNode.value_type==8) {
          if(false==(this.nameNode.isPrimitive())) {
            return true;
          }
        }
      }
      return false;
    }}
    ,
    { key: "isArray", value: function isArray() { 
      if(this.nameNode != null ) {
        if(this.nameNode.value_type==5) {
          return true;
        }
      }
      return false;
    }}
    ,
    { key: "isHash", value: function isHash() { 
      if(this.nameNode != null ) {
        if(this.nameNode.value_type==6) {
          return true;
        }
      }
      return false;
    }}
    ,
    { key: "isPrimitive", value: function isPrimitive() { 
      if(this.nameNode != null ) {
        return this.nameNode.isPrimitive();
      }
      return false;
    }}
    ,
    { key: "getRefTypeName", value: function getRefTypeName() { 
      switch(this.refType) {
        case 0:
          return "NoType";
          break;
        case 1:
          return "Weak";
          break;
        case 2:
          return "Strong";
          break;
        case 3:
          return "Shared";
          break;
        case 4:
          return "StrongImmutable";
          break;
      }
    }}
    ,
    { key: "getVarTypeName", value: function getVarTypeName() { 
      switch(this.refType) {
        case 0:
          return "NoType";
          break;
        case 1:
          return "This";
          break;
        case 2:
          return "ThisProperty";
          break;
        case 3:
          return "NewObject";
          break;
        case 4:
          return "FunctionParameter";
          break;
        case 5:
          return "LocalVariable";
          break;
        case 6:
          return "Array";
          break;
        case 7:
          return "Object";
          break;
        case 8:
          return "Property";
          break;
        case 9:
          return "Class";
          break;
      }
    }}
    ,
    { key: "getTypeName", value: function getTypeName() { 
      var s = this.nameNode.type_name;
      return s;
    }}
    /* Weak variable : node*/
    /* Weak Object variable : node in class RangerAppParamDesc */
    /* Weak variable : nameNode*/
    /* Weak Object variable : nameNode in class RangerAppParamDesc */
  ], [
    
  ]);
  

return RangerAppParamDesc;
}();
var RangerAppFunctionDesc = function( _RangerAppParamDesc) {  _inherits(RangerAppFunctionDesc, _RangerAppParamDesc);
  
  function RangerAppFunctionDesc() {
    _classCallCheck(this, RangerAppFunctionDesc);
    var _this = _possibleConstructorReturn(this, (RangerAppFunctionDesc.__proto__ || Object.getPrototypeOf(RangerAppFunctionDesc)).call(this));
    this.name = "";
    this.node = undefined;
    this.nameNode = undefined;
    this.params = [];
    this.return_value = undefined;
    this.is_method = false;
    this.is_static = false;
    this.container_class = undefined;
    this.refType = 0;
    this.body_ast = undefined;
    this.body_str = undefined;
    return _this;
  }
  
   _createClass(RangerAppFunctionDesc, [
    /* Weak variable : node*/
    /* Weak Object variable : node in class RangerAppFunctionDesc */
    /* Weak variable : nameNode*/
    /* Weak Object variable : nameNode in class RangerAppFunctionDesc */
  ], [
    
  ]);
  

return RangerAppFunctionDesc;
}(RangerAppParamDesc);
var RangerAppTodo = function( ) {  
  function RangerAppTodo() {
    _classCallCheck(this, RangerAppTodo);
    this.description = "";
    this.node = undefined;
  }
  
   _createClass(RangerAppTodo, [
    /* Weak variable : node*/
    /* Weak Object variable : node in class RangerAppTodo */
  ], [
    
  ]);
  

return RangerAppTodo;
}();
var RangerCompilerMessage = function( ) {  
  function RangerCompilerMessage() {
    _classCallCheck(this, RangerCompilerMessage);
    this.error_level = 0;
    this.code_line = 0;
    this.fileName = "";
    this.description = "";
    this.node = undefined;
  }
  
   _createClass(RangerCompilerMessage, [
    /* Weak variable : node*/
    /* Weak Object variable : node in class RangerCompilerMessage */
  ], [
    
  ]);
  

return RangerCompilerMessage;
}();
var RangerAppClassDesc = function( ) {  
  function RangerAppClassDesc() {
    _classCallCheck(this, RangerAppClassDesc);
    this.name = "";
    this.ctx = undefined;
    this.variables = [];
    this.methods = [];
    this.defined_methods = {};
    this.static_methods = [];
    this.defined_static_methods = {};
    this.has_constructor = false;
    this.constructor_node = undefined;
    this.constructor_fn = undefined;
    this.has_destructor = false;
    this.destructor_node = undefined;
    this.destructor_fn = undefined;
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
      for( var i_1= 0; i_1< this.extends_classes.length; i_1++) { 
        var cname= this.extends_classes[i_1];
        var cDesc = this.ctx.findClass(cname);
        if(cDesc.hasMethod(f_name)) {
          return cDesc.findMethod(f_name);
        }
      }
    }}
    ,
    { key: "hasStaticMethod", value: function hasStaticMethod(m_name) { 
      return typeof(this.defined_static_methods[m_name]) != "undefined";
    }}
    ,
    { key: "findStaticMethod", value: function findStaticMethod(f_name) { 
      for( var i= 0; i< this.static_methods.length; i++) { 
        var m= this.static_methods[i];
        if(m.name==f_name) {
          return m;
        }
      }
      for( var i_1= 0; i_1< this.extends_classes.length; i_1++) { 
        var cname= this.extends_classes[i_1];
        var cDesc = this.ctx.findClass(cname);
        if(cDesc.hasStaticMethod(f_name)) {
          return cDesc.findStaticMethod(f_name);
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
    { key: "addStaticMethod", value: function addStaticMethod(desc) { 
      this.defined_static_methods[desc.name] = true;
      this.static_methods.push(desc);
    }}
    /* Weak variable : ctx*/
    /* Weak Object variable : ctx in class RangerAppClassDesc */
    /* Weak variable : constructor_node*/
    /* Weak Object variable : constructor_node in class RangerAppClassDesc */
    /* Weak variable : constructor_fn*/
    /* Weak Object variable : constructor_fn in class RangerAppClassDesc */
    /* Weak variable : destructor_node*/
    /* Weak Object variable : destructor_node in class RangerAppClassDesc */
    /* Weak variable : destructor_fn*/
    /* Weak Object variable : destructor_fn in class RangerAppClassDesc */
  ], [
    
  ]);
  

return RangerAppClassDesc;
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
    /* Weak variable : expression_value*/
    /* Weak Object variable : expression_value in class RangerNodeValue */
  ], [
    
  ]);
  

return RangerNodeValue;
}();
var RangerBackReference = function( ) {  
  function RangerBackReference() {
    _classCallCheck(this, RangerBackReference);
    this.from_class = undefined;
    this.var_name = undefined;
    this.ref_type = undefined;
  }
  
   _createClass(RangerBackReference, [
  ], [
    
  ]);
  

return RangerBackReference;
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
    /* Weak variable : cnt*/
    /* Weak Object variable : cnt in class RangerAppEnum */
  ], [
    
  ]);
  

return RangerAppEnum;
}();
var RangerAppWriterContext = function( ) {  
  function RangerAppWriterContext() {
    _classCallCheck(this, RangerAppWriterContext);
    this.ctx = undefined;
    this.parent = undefined;
    this.defined_imports = [];
    this.already_imported = {};
    this.fileSystem = undefined;
    this.is_function = false;
    this.is_block = false;
    this.has_block_exited = false;
    this.in_expression = false;
    this.expr_stack = [];
    this.in_method = false;
    this.method_stack = [];
    this.currentClassName = undefined;
    this.currentClass = undefined;
    this.currentMethod = undefined;
    this.thisName = "this";
    this.definedEnums = {};
    this.definedClasses = {};
    this.definedClassList = [];
    this.templateClassNodes = {};
    this.templateClassList = [];
    this.classStaticWriters = {};
    this.localVariables = {};
    this.localVarNames = [];
    this.compilerFlags = {};
    this.compilerSettings = {};
    this.compilerErrors = [];
    this.compilerMessages = [];
    this.compilerLog = {};
    this.instantiatedObjects = [];
    this.instanceVariables = {};
    this.resignedInstancesVars = {};
    this.todoList = [];
    this.defCounts = {};
    this.fileSystem = new CodeFileSystem();
  }
  
   _createClass(RangerAppWriterContext, [
    { key: "getStrongLocals", value: function getStrongLocals() { 
      var list = [];
      for( var i= 0; i< this.localVarNames.length; i++) { 
        var n= this.localVarNames[i];
        var p = this.localVariables[n];
        if(p.refType==2) {
          list.push(p);
        }
      }
      return list;
    }}
    ,
    { key: "getFileWriter", value: function getFileWriter(path, fileName) { 
      var root = this.getRoot();
      var fs = root.fileSystem;
      var file = fs.getFile(path,fileName);
      var wr = file.getWriter();
      return wr;
    }}
    ,
    { key: "addTodo", value: function addTodo(node, descr) { 
      var e = new RangerAppTodo();
      e.description = descr;
      e.node = node;
      var root = this.getRoot();
      root.todoList.push(e);
    }}
    ,
    { key: "setThisName", value: function setThisName(the_name) { 
      var root = this.getRoot();
      root.thisName = the_name;
    }}
    ,
    { key: "getThisName", value: function getThisName() { 
      var root = this.getRoot();
      return root.thisName;
    }}
    ,
    { key: "printLogs", value: function printLogs(logName) { 
      var root = this.getRoot();
      console.log("--------------------------------------------------------------------");
      console.log("log " + logName);
      if(typeof(root.compilerLog[logName]) != "undefined") {
        var logObjs = root.compilerLog[logName];
        if(logObjs.length>0) {
          for( var i= 0; i< logObjs.length; i++) { 
            var e= logObjs[i];
            var line_index = e.node.getLine();
            console.log("[" + logName + "] " + (e.node.getFilename()) + ", Line " + line_index + ": " + e.description);
            console.log(e.node.getLineAsString());
          }
        } else {
          console.log("<no entries>");
        }
      } else {
        console.log("<no entries>");
      }
    }}
    ,
    { key: "log", value: function log(node, logName, descr) { 
      var root = this.getRoot();
      var logObjs = [];
      if(false==(typeof(root.compilerLog[logName]) != "undefined")) {
        root.compilerLog[logName] = logObjs;
      } else {
        logObjs = root.compilerLog[logName];
      }
      var e = new RangerCompilerMessage();
      e.description = descr;
      e.node = node;
      var root_1 = this.getRoot();
      logObjs.push(e);
    }}
    ,
    { key: "addMessage", value: function addMessage(node, descr) { 
      var e = new RangerCompilerMessage();
      e.description = descr;
      e.node = node;
      var root = this.getRoot();
      root.compilerMessages.push(e);
    }}
    ,
    { key: "addError", value: function addError(node, descr) { 
      var e = new RangerCompilerMessage();
      e.description = descr;
      e.node = node;
      var root = this.getRoot();
      root.compilerErrors.push(e);
    }}
    ,
    { key: "addTemplateClass", value: function addTemplateClass(name, node) { 
      var root = this.getRoot();
      root.templateClassList.push(name);
      root.templateClassNodes[name] = node;
    }}
    ,
    { key: "hasTemplateNode", value: function hasTemplateNode(name) { 
      var root = this.getRoot();
      return typeof(root.templateClassNodes[name]) != "undefined";
    }}
    ,
    { key: "findTemplateNode", value: function findTemplateNode(name) { 
      var root = this.getRoot();
      return root.templateClassNodes[name];
    }}
    ,
    { key: "setStaticWriter", value: function setStaticWriter(className, writer) { 
      var root = this.getRoot();
      root.classStaticWriters[className] = writer;
    }}
    ,
    { key: "getStaticWriter", value: function getStaticWriter(className) { 
      var root = this.getRoot();
      return root.classStaticWriters[className];
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
    { key: "hasCompilerFlag", value: function hasCompilerFlag(s_name) { 
      if(typeof(this.compilerFlags[s_name]) != "undefined") {
        return this.compilerFlags[s_name];
      }
      if(this.parent == null ) {
        return false;
      }
      return this.parent.hasCompilerFlag(s_name);
    }}
    ,
    { key: "getCompilerSetting", value: function getCompilerSetting(s_name) { 
      if(typeof(this.compilerSettings[s_name]) != "undefined") {
        return this.compilerSettings[s_name];
      }
      if(this.parent == null ) {
        return "";
      }
      return this.parent.getCompilerSetting(s_name);
    }}
    ,
    { key: "hasCompilerSetting", value: function hasCompilerSetting(s_name) { 
      if(typeof(this.compilerSettings[s_name]) != "undefined") {
        return true;
      }
      if(this.parent == null ) {
        return false;
      }
      return this.parent.hasCompilerSetting(s_name);
    }}
    ,
    { key: "getCompilerSetting", value: function getCompilerSetting(s_name) { 
      if(typeof(this.compilerSettings[s_name]) != "undefined") {
        return this.compilerSettings[s_name];
      }
      if(this.parent == null ) {
        return "";
      }
      return this.parent.getCompilerSetting(s_name);
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
    { key: "findFunctionCtx", value: function findFunctionCtx() { 
      if(this.is_function) {
        return this;
      }
      if(this.parent == null ) {
        return this;
      }
      return this.parent.findFunctionCtx();
    }}
    ,
    { key: "getFnVarCnt", value: function getFnVarCnt(name) { 
      var fnCtx = this.findFunctionCtx();
      var ii = 0;
      if(typeof(fnCtx.defCounts[name]) != "undefined") {
        ii = fnCtx.defCounts[name];
        ii = 1 + ii;
      } else {
        fnCtx.defCounts[name] = ii;
        return 0;
      }
      var scope_has = this.isVarDefined((name + "_" + ii));
      while(scope_has) {
        ii = 1 + ii;
        scope_has = this.isVarDefined((name + "_" + ii));
      }
      fnCtx.defCounts[name] = ii;
      return ii;
    }}
    ,
    { key: "defineVariable", value: function defineVariable(name, desc) { 
      var cnt = 0;
      if(false==((desc.varType==8) || (desc.varType==4) || (desc.varType==10))) {
        cnt = this.getFnVarCnt(name);
      }
      if(0==cnt) {
        desc.compiledName = name;
      } else {
        desc.compiledName = name + "_" + cnt;
      }
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
    { key: "getClasses", value: function getClasses() { 
      var list = [];
      for( var i= 0; i< this.definedClassList.length; i++) { 
        var n= this.definedClassList[i];
        list.push(this.definedClasses[n]);
      }
      return list;
    }}
    ,
    { key: "addClass", value: function addClass(name, desc) { 
      var root = this.getRoot();
      if(typeof(name[root.definedClasses]) != "undefined") {
        console.log("ERROR: class " + name + " already defined");
      } else {
        root.definedClasses[name] = desc;
        root.definedClassList.push(name);
      }
    }}
    ,
    { key: "findClass", value: function findClass(name) { 
      var root = this.getRoot();
      return root.definedClasses[name];
    }}
    ,
    { key: "hasClass", value: function hasClass(name) { 
      var root = this.getRoot();
      return typeof(root.definedClasses[name]) != "undefined";
    }}
    ,
    { key: "getCurrentMethod", value: function getCurrentMethod() { 
      if(this.currentMethod != null ) {
        return this.currentMethod;
      }
      if(this.parent != null ) {
        return this.parent.getCurrentMethod();
      }
      return new RangerAppFunctionDesc();
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
    /* Weak variable : parent*/
    /* Weak Object variable : parent in class RangerAppWriterContext */
    /* Weak variable : templateClassNodes*/
    /* Weak HASH variable : templateClassNodes in class RangerAppWriterContext*/
  ], [
    
  ]);
  

return RangerAppWriterContext;
}();
var CodeNode = function( ) {  
  function CodeNode(source, start, end) {
    _classCallCheck(this, CodeNode);
    this.code = undefined;
    this.sp = 0;
    this.ep = 0;
    this.expression = false;
    this.vref = "";
    this.is_block_node = false;
    this.infix_operator = false;
    this.infix_node = undefined;
    this.infix_subnode = false;
    this.operator_pred = 0;
    this.to_the_right = false;
    this.right_node = undefined;
    this.type_type = "";
    this.type_name = "";
    this.key_type = "";
    this.array_type = "";
    this.ns = [];
    this.vforce = [];
    this.wrap = [];
    this.template_expression = undefined;
    this.has_vref_annotation = false;
    this.vref_annotation = undefined;
    this.has_type_annotation = false;
    this.type_annotation = undefined;
    this.value_type = 0;
    this.eval_type = 0;
    this.eval_type_name = "";
    this.ref_type = 0;
    this.ref_need_assign = 0;
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
    this.hasParamDesc = false;
    this.paramDesc = undefined;
    this.ownedInstances = [];
    this.referencedInstances = [];
    this.returnedInstances = [];
    this.execState = undefined;
    this.sp = start;
    this.ep = end;
    this.code = source;
  }
  
   _createClass(CodeNode, [
    /**"\r\n NOTE: This is just a documentation test, not a real documentation entry!!!\r\n The codenode represents AST node which can be used for parsers and intepreters of the system.\r\n ```\r\n    (def n:CodeNode (new CodeNode (src start end)))\r\n    (def str:string (node getCode ()))\r\n ```\r\n "*/
    { key: "moveOwnedToReturned", value: function moveOwnedToReturned() { 
      for( var i= 0; i< this.ownedInstances.length; i++) { 
        var inst= this.ownedInstances[i];
        this.returnedInstances.push(inst);
      }
      var cnt = this.ownedInstances.length;
      while(cnt>0) {
        this.ownedInstances.pop()
        cnt = cnt - 1;
      }
    }}
    ,
    { key: "copyRefToReturn", value: function copyRefToReturn(node) { 
      for( var i= 0; i< node.referencedInstances.length; i++) { 
        var inst= node.referencedInstances[i];
        this.returnedInstances.push(inst);
      }
    }}
    ,
    { key: "getInstancesFrom", value: function getInstancesFrom(node) { 
      for( var i= 0; i< node.ownedInstances.length; i++) { 
        var inst= node.ownedInstances[i];
        this.ownedInstances.push(inst);
      }
      var cnt = node.ownedInstances.length;
      while(cnt>0) {
        node.ownedInstances.pop()
        cnt = cnt - 1;
      }
    }}
    ,
    { key: "getFilename", value: function getFilename() { 
      return this.code.filename;
    }}
    ,
    { key: "getTypeInformationString", value: function getTypeInformationString() { 
      var s = "";
      if(this.vref.length>0) {
        s = s + "<vref:" + this.vref + ">";
      } else {
        s = s + "<no.vref>";
      }
      if(this.type_name.length>0) {
        s = s + "<type_name:" + this.type_name + ">";
      } else {
        s = s + "<no.type_name>";
      }
      if(this.array_type.length>0) {
        s = s + "<array_type:" + this.array_type + ">";
      } else {
        s = s + "<no.array_type>";
      }
      if(this.key_type.length>0) {
        s = s + "<key_type:" + this.key_type + ">";
      } else {
        s = s + "<no.key_type>";
      }
      switch(this.value_type) {
        case 4:
          s = s + "<value_type=Boolean>";
          break;
        case 3:
          s = s + "<value_type=String>";
          break;
        case 2:
          s = s + "<value_type=Integer>";
          break;
        case 1:
          s = s + "<value_type=Double>";
          break;
        case 5:
          s = s + "<value_type=Array>";
          break;
        case 8:
          s = s + "<value_type=VRef>";
          break;
        case 10:
          s = s + "<value_type=ExpressionType>";
          break;
        case 7:
          s = s + "<value_type=Object>";
          break;
        default: 
          s = s + "<value_type=Unknown " + this.value_type + " >";
          break;
      }
      return s;
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
    { key: "getLineAsString", value: function getLineAsString() { 
      var idx = this.getLine();
      var line_name_idx = idx + 1;
      return this.getFilename() + ", line " + line_name_idx + " : " + (this.code.getLineString(idx));
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
      return this.isFirstVref("def");
    }}
    ,
    { key: "isFunctionDef", value: function isFunctionDef() { 
      return this.isFirstVref("defn");
    }}
    ,
    { key: "isFunctionCall", value: function isFunctionCall() { 
      if(this.isVariableDef()) {
        return false;
      }
      if(this.isFunctionDef()) {
        return false;
      }
      if(this.isFirstTypeVref() && (this.children.length>1)) {
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
    { key: "isPrimitiveType", value: function isPrimitiveType() { 
      if((this.type_name=="double") || (this.type_name=="string") || (this.type_name=="int") || (this.type_name=="boolean")) {
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
          this.double_value),false);
          break;
        case 3:
          wr.out(String.fromCharCode(34) + this.string_value + String.fromCharCode(34),false);
          break;
        case 2:
          wr.out("" + this.int_value,false);
          break;
        case 4:
          if(this.boolean_value) {
            wr.out("true",false);
          } else {
            wr.out("false",false);
          }
          break;
        case 8:
          var res = this.vref;
          if(this.type_name.length>0) {
            res = res + ":" + this.type_name;
          }
          wr.out(res,false);
          break;
        case 5:
          var res_1 = this.vref;
          if(this.array_type.length>0) {
            res_1 = res_1 + ":[" + this.array_type + "]";
          }
          wr.out(res_1,false);
          break;
        case 6:
          var res_2 = this.vref;
          if(this.array_type.length>0) {
            res_2 = res_2 + ":[" + this.key_type + ":" + this.array_type + "]";
          }
          wr.out(res_2,false);
          break;
        case 10:
          wr.out(this.vref + ":",false);
          if(this.expression_value == null ) {
          } else {
            this.expression_value.writeCode(wr);
          }
          break;
        case 9:
          wr.out(";",false);
          wr.out(this.string_value,true);
          break;
        default: 
          if(this.expression) {
            wr.out("(",false);
            for( var i= 0; i< this.prop_keys.length; i++) { 
              var key= this.prop_keys[i];
              wr.out(" @",false);
              wr.out(key,false);
              var propVal = this.props[key];
              if(propVal.isPrimitive()) {
                wr.out("(",false);
                propVal.writeCode(wr);
                wr.out(")",false);
              } else {
                propVal.writeCode(wr);
              }
              wr.out(" ",false);
            }
            var is_block = false;
            var exp_cnt = 0;
            for( var i_1= 0; i_1< this.children.length; i_1++) { 
              var item= this.children[i_1];
              if(i_1==0) {
                is_block = item.expression;
                if(is_block) {
                  wr.out("",true);
                  wr.indent(1);
                } else {
                }
              }
              if(item.expression || (item.value_type==9)) {
                exp_cnt = 1 + exp_cnt;
              }
              if((is_block==false) && (exp_cnt>0)) {
                is_block = true;
                wr.out("",true);
                wr.indent(1);
              }
              if(is_block) {
                item.writeCode(wr);
                if(item.value_type==9) {
                } else {
                  wr.out("",true);
                }
              } else {
                if(i_1>0) {
                  wr.out(" ",false);
                }
                item.writeCode(wr);
              }
            }
            if(is_block) {
              wr.indent(-1);
            }
            wr.out(")",false);
          }
          break;
      }
    }}
    ,
    { key: "getCode", value: function getCode() { 
      var wr = new CodeWriter();
      this.writeCode(wr);
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
          var res_1 = this.vref;
          if(this.array_type.length>0) {
            res_1 = res_1 + ":[" + this.array_type + "]";
          }
          return res_1;
          break;
        case 6:
          var res_2 = this.vref;
          if(this.array_type.length>0) {
            res_2 = res_2 + ":[" + this.key_type + ":" + this.array_type + "]";
          }
          return res_2;
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
        var res_3 = "( ";
        for( var i= 0; i< this.children.length; i++) { 
          var item= this.children[i];
          res_3 = res_3 + " ";
          res_3 = res_3 + (item.getCode());
          res_3 = res_3 + " ";
        }
        res_3 = res_3 + " ) ";
        return res_3;
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
          this.expression_value.walk();
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
        item.walk();
      }
      if(this.expression) {
        console.log(")");
      }
    }}
    /* Weak variable : expression*/
    /* Weak Object variable : expression in class CodeNode */
    /* Weak variable : infix_node*/
    /* Weak Object variable : infix_node in class CodeNode */
    /* Weak variable : right_node*/
    /* Weak Object variable : right_node in class CodeNode */
    /* Weak variable : parent*/
    /* Weak Object variable : parent in class CodeNode */
    /* Weak variable : paramDesc*/
    /* Weak Object variable : paramDesc in class CodeNode */
  ], [
    
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
  ], [
    
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
  ], [
    
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
  ], [
    
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
        observer.fire();
      }
    }}
  ], [
    
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
    /* Weak variable : parent*/
    /* Weak Object variable : parent in class RangerContext */
  ], [
    
  ]);
  

return RangerContext;
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
    this.get_op_pred = 0;
    this.rootNode = undefined;
    this.curr_node = undefined;
    this.had_error = false;
    this.s = code_module.code;
    this.code = code_module;
    this.len = code_module.code.length;
    this.rootNode = new CodeNode(this.code,0,0);
    this.rootNode.is_block_node = true;
    this.rootNode.expression = true;
    this.curr_node = this.rootNode;
    this.parents.push(this.curr_node);
    this.paren_cnt = 1;
  }
  
   _createClass(RangerLispParser, [
    { key: "getCode", value: function getCode() { 
      return this.rootNode.getCode();
    }}
    ,
    { key: "parse_raw_annotation", value: function parse_raw_annotation() { 
      var c;
      var sp = this.i;
      var ep = this.i;
      this.i = this.i + 1;
      sp = this.i;
      ep = this.i;
      c = this.s.charCodeAt(this.i);
      if(this.i<this.len) {
        var a_node2 = new CodeNode(this.code,sp,ep);
        a_node2.expression = true;
        this.curr_node = a_node2;
        this.parents.push(a_node2);
        this.i = this.i + 1;
        this.paren_cnt = this.paren_cnt + 1;
        this.parse();
        return a_node2;
      }
    }}
    ,
    { key: "skip_space", value: function skip_space(is_block_parent) { 
      var did_break = false;
      var c = this.s.charCodeAt(this.i);
      while((this.i<this.len) && (c<=32)) {
        if(is_block_parent && ((c==10) || (c==13))) {
          this.end_expression();
          did_break = true;
          break;
        }
        this.i = 1 + this.i;
        c = this.s.charCodeAt(this.i);
      }
      return did_break;
    }}
    ,
    { key: "end_expression", value: function end_expression() { 
      this.i = 1 + this.i;
      this.paren_cnt = this.paren_cnt - 1;
      if(this.paren_cnt<0) {
        throw  "Parser error ) mismatch";
      }
      this.parents.pop()
      if(this.curr_node != null ) {
        this.curr_node.ep = this.i;
        this.curr_node.infix_operator = false;
      }
      if(this.parents.length>0) {
        this.curr_node = this.parents[(this.parents.length - 1)];
      } else {
        this.curr_node = this.rootNode;
      }
      this.curr_node.infix_operator = false;
    }}
    ,
    { key: "getOperator", value: function getOperator() { 
      if((this.i - 2)>this.len) {
        return 0;
      }
      var c = this.s.charCodeAt(this.i);
      var c2 = this.s.charCodeAt((this.i + 1));
      switch(c) {
        case "*".charCodeAt(0):
          this.i = this.i + 1;
          return 14;
          break;
        case "\/".charCodeAt(0):
          this.i = this.i + 1;
          return 14;
          break;
        case "+".charCodeAt(0):
          this.i = this.i + 1;
          return 13;
          break;
        case "-".charCodeAt(0):
          this.i = this.i + 1;
          return 13;
          break;
        case "<".charCodeAt(0):
          if(c2=="=".charCodeAt(0)) {
            this.i = this.i + 2;
            return 11;
          }
          this.i = this.i + 1;
          return 11;
          break;
        case ">".charCodeAt(0):
          if(c2=="=".charCodeAt(0)) {
            this.i = this.i + 2;
            return 11;
          }
          this.i = this.i + 1;
          return 11;
          break;
        case "!".charCodeAt(0):
          if(c2=="=".charCodeAt(0)) {
            this.i = this.i + 2;
            return 10;
          }
          return 0;
          break;
        case "=".charCodeAt(0):
          if(c2=="=".charCodeAt(0)) {
            this.i = this.i + 2;
            return 10;
          }
          this.i = this.i + 1;
          return 3;
          break;
        case "&".charCodeAt(0):
          if(c2=="&".charCodeAt(0)) {
            this.i = this.i + 2;
            return 6;
          }
          return 0;
          break;
        case "|".charCodeAt(0):
          if(c2=="|".charCodeAt(0)) {
            this.i = this.i + 2;
            return 5;
          }
          return 0;
          break;
      }
      return 0;
    }}
    ,
    { key: "isOperator", value: function isOperator() { 
      if((this.i - 2)>this.len) {
        return 0;
      }
      var c = this.s.charCodeAt(this.i);
      var c2 = this.s.charCodeAt((this.i + 1));
      switch(c) {
        case "*".charCodeAt(0):
          return 1;
          break;
        case "\/".charCodeAt(0):
          return 14;
          break;
        case "+".charCodeAt(0):
          return 13;
          break;
        case "-".charCodeAt(0):
          return 13;
          break;
        case "<".charCodeAt(0):
          if(c2=="=".charCodeAt(0)) {
            return 11;
          }
          return 11;
          break;
        case ">".charCodeAt(0):
          if(c2=="=".charCodeAt(0)) {
            return 11;
          }
          return 11;
          break;
        case "!".charCodeAt(0):
          if(c2=="=".charCodeAt(0)) {
            return 10;
          }
          return 0;
          break;
        case "=".charCodeAt(0):
          if(c2=="=".charCodeAt(0)) {
            return 10;
          }
          return 3;
          break;
        case "&".charCodeAt(0):
          if(c2=="&".charCodeAt(0)) {
            return 6;
          }
          return 0;
          break;
        case "|".charCodeAt(0):
          if(c2=="|".charCodeAt(0)) {
            return 5;
          }
          return 0;
          break;
      }
      return 0;
    }}
    ,
    { key: "getOperatorPred", value: function getOperatorPred(str) { 
      switch(str) {
        case "<":
        case ">":
        case "<=":
        case ">=":
          return 11;
          break;
        case "==":
        case "!=":
          return 10;
          break;
        case "=":
          return 3;
          break;
        case "&&":
          return 6;
          break;
        case "||":
          return 5;
          break;
        case "+":
        case "-":
          return 13;
          break;
        case "*":
          return 14;
          break;
        case "\/":
          return 14;
          break;
      }
      return 0;
    }}
    ,
    { key: "insert_node", value: function insert_node(new_node) { 
      if(false==this.curr_node.infix_operator) {
        this.curr_node.children.push(new_node);
      } else {
        var ifNode = this.curr_node.infix_node;
        if(ifNode.to_the_right==false) {
          ifNode.children.push(new_node);
        } else {
          var rn = ifNode.right_node;
          new_node.parent = rn;
          rn.children.push(new_node);
        }
      }
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
        var had_lf = false;
        while(this.i<this.len) {
          if(this.had_error) {
            break;
          }
          last_i = this.i;
          var is_in_block = false;
          var is_block_parent = false;
          if(had_lf) {
            had_lf = false;
            this.end_expression();
            break;
          }
          if(this.curr_node != null ) {
            if(this.curr_node.is_block_node) {
              is_in_block = true;
            }
            if(this.curr_node.parent != null ) {
              var nodeParent = this.curr_node.parent;
              if(nodeParent.is_block_node) {
                is_in_block = true;
                is_block_parent = true;
              }
            }
          }
          if(this.skip_space(is_block_parent)) {
            break;
          }
          had_lf = false;
          c = this.s.charCodeAt(this.i);
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
              if((c==40) || (c=="{".charCodeAt(0)) || ((c==39) && (fc==40)) || ((c==96) && (fc==40))) {
                this.paren_cnt = this.paren_cnt + 1;
                if(this.curr_node == null ) {
                  this.rootNode = new CodeNode(this.code,this.i,this.i);
                  this.curr_node = this.rootNode;
                  if(c==96) {
                    this.curr_node.value_type = 22;
                  }
                  if(c==39) {
                    this.curr_node.value_type = 21;
                  }
                  this.curr_node.expression = true;
                  this.parents.push(this.curr_node);
                } else {
                  var new_qnode = new CodeNode(this.code,this.i,this.i);
                  if(c==96) {
                    new_qnode.value_type = 22;
                  }
                  if(c==39) {
                    new_qnode.value_type = 21;
                  }
                  new_qnode.expression = true;
                  this.insert_node(new_qnode);
                  this.curr_node = new_qnode;
                  this.parents.push(new_qnode);
                }
                if(c=="{".charCodeAt(0)) {
                  this.curr_node.is_block_node = true;
                }
                this.i = 1 + this.i;
                this.parse();
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
              while((this.i<this.len) && (((c>=48) && (c<=57)) || (c==".".charCodeAt(0)) || ((this.i==sp) && ((c=="+".charCodeAt(0)) || (c=="-".charCodeAt(0)))))) {
                if((c==".".charCodeAt(0))) {
                  is_double = true;
                }
                this.i = 1 + this.i;
                c = this.s.charCodeAt(this.i);
              }
              ep = this.i;
              var new_num_node = new CodeNode(this.code,sp,ep);
              if(is_double) {
                new_num_node.value_type = 1;
                new_num_node.double_value = parseFloat(this.s.substring(sp, ep));
              } else {
                new_num_node.value_type = 2;
                new_num_node.int_value = parseInt(this.s.substring(sp, ep));
              }
              this.insert_node(new_num_node);
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
                var new_str_node = new CodeNode(this.code,sp,ep);
                new_str_node.value_type = 3;
                if(must_encode) {
                  new_str_node.string_value = encoded_str;
                } else {
                  new_str_node.string_value = this.s.substring(sp, ep);
                }
                this.insert_node(new_str_node);
                this.i = 1 + this.i;
                continue;
              }
            }
            if((fc=="t".charCodeAt(0)) && (this.s.charCodeAt((this.i + 1))=="r".charCodeAt(0)) && (this.s.charCodeAt((this.i + 2))=="u".charCodeAt(0)) && (this.s.charCodeAt((this.i + 3))=="e".charCodeAt(0))) {
              var new_true_node = new CodeNode(this.code,sp,(sp + 4));
              new_true_node.value_type = 4;
              new_true_node.boolean_value = true;
              this.insert_node(new_true_node);
              this.i = this.i + 4;
              continue;
            }
            if((fc=="f".charCodeAt(0)) && (this.s.charCodeAt((this.i + 1))=="a".charCodeAt(0)) && (this.s.charCodeAt((this.i + 2))=="l".charCodeAt(0)) && (this.s.charCodeAt((this.i + 3))=="s".charCodeAt(0)) && (this.s.charCodeAt((this.i + 4))=="e".charCodeAt(0))) {
              var new_f_node = new CodeNode(this.code,sp,(sp + 5));
              new_f_node.value_type = 4;
              new_f_node.boolean_value = false;
              this.insert_node(new_f_node);
              this.i = this.i + 5;
              continue;
            }
            if(fc=="@".charCodeAt(0)) {
              this.i = this.i + 1;
              sp = this.i;
              ep = this.i;
              c = this.s.charCodeAt(this.i);
              while((this.i<this.len) && (this.s.charCodeAt(this.i)>32) && (c!=40) && (c!=41) && (c!="}".charCodeAt(0))) {
                this.i = 1 + this.i;
                c = this.s.charCodeAt(this.i);
              }
              ep = this.i;
              if((this.i<this.len) && (ep>sp)) {
                var a_node2 = new CodeNode(this.code,sp,ep);
                var a_name = this.s.substring(sp, ep);
                a_node2.expression = true;
                this.curr_node = a_node2;
                this.parents.push(a_node2);
                this.i = this.i + 1;
                this.paren_cnt = this.paren_cnt + 1;
                this.parse();
                var use_first = false;
                if(1==a_node2.children.length) {
                  var ch1 = a_node2.children[0];
                  use_first = ch1.isPrimitive();
                }
                if(use_first) {
                  var theNode = a_node2.children.splice(0,1).pop();
                  this.curr_node.props[a_name] = theNode;
                } else {
                  this.curr_node.props[a_name] = a_node2;
                }
                this.curr_node.prop_keys.push(a_name);
                continue;
              }
            }
            var ns_list = [];
            var last_ns = this.i;
            var ns_cnt = 1;
            var vref_had_type_ann = false;
            var vref_ann_node;
            var vref_end = this.i;
            if((this.i<this.len) && (this.s.charCodeAt(this.i)>32) && (c!=58) && (c!=40) && (c!=41) && (c!="}".charCodeAt(0))) {
              if(this.curr_node.is_block_node==true) {
                var new_expr_node = new CodeNode(this.code,sp,ep);
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
            var op_c = 0;
            var not_first = false;
            if(this.curr_node.children.length>=0) {
              op_c = this.getOperator();
              not_first = true;
            }
            var last_was_newline = false;
            if(op_c>0) {
            } else {
              while((this.i<this.len) && (this.s.charCodeAt(this.i)>32) && (c!=58) && (c!=40) && (c!=41) && (c!="}".charCodeAt(0))) {
                if(this.i>sp) {
                  var is_opchar = this.isOperator();
                  if(is_opchar>0) {
                    break;
                  }
                }
                this.i = 1 + this.i;
                c = this.s.charCodeAt(this.i);
                if((c==10) || (c==13)) {
                  last_was_newline = true;
                  break;
                }
                if(c==".".charCodeAt(0)) {
                  ns_list.push(this.s.substring(last_ns, this.i));
                  last_ns = this.i + 1;
                  ns_cnt = 1 + ns_cnt;
                }
                if((this.i>vref_end) && (c=="@".charCodeAt(0))) {
                  vref_had_type_ann = true;
                  vref_end = this.i;
                  vref_ann_node = this.parse_raw_annotation();
                  c = this.s.charCodeAt(this.i);
                  break;
                }
              }
            }
            ep = this.i;
            if(vref_had_type_ann) {
              ep = vref_end;
            }
            ns_list.push(this.s.substring(last_ns, ep));
            c = this.s.charCodeAt(this.i);
            while((this.i<this.len) && (c<=32) && (false==last_was_newline)) {
              this.i = 1 + this.i;
              c = this.s.charCodeAt(this.i);
              if(is_block_parent && ((c==10) || (c==13))) {
                this.i = this.i - 1;
                c = this.s.charCodeAt(this.i);
                had_lf = true;
                break;
              }
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
                var a_node3 = new CodeNode(this.code,sp,ep);
                a_node3.expression = true;
                this.curr_node = a_node3;
                this.parents.push(a_node3);
                this.i = this.i + 1;
                this.parse();
                var new_expr_node_1 = new CodeNode(this.code,sp,vt_ep);
                new_expr_node_1.vref = this.s.substring(sp, ep);
                new_expr_node_1.ns = ns_list;
                new_expr_node_1.expression_value = a_node3;
                new_expr_node_1.value_type = 10;
                if(vref_had_type_ann) {
                  new_expr_node_1.vref_annotation = vref_ann_node;
                  new_expr_node_1.has_vref_annotation = true;
                }
                this.curr_node.children.push(new_expr_node_1);
                continue;
              }
              if(c=="[".charCodeAt(0)) {
                this.i = this.i + 1;
                vt_sp = this.i;
                var hash_sep = 0;
                var had_array_type_ann = false;
                c = this.s.charCodeAt(this.i);
                while((this.i<this.len) && (c>32) && (c!=93)) {
                  this.i = 1 + this.i;
                  c = this.s.charCodeAt(this.i);
                  if(c==":".charCodeAt(0)) {
                    hash_sep = this.i;
                  }
                  if(c=="@".charCodeAt(0)) {
                    had_array_type_ann = true;
                    break;
                  }
                }
                vt_ep = this.i;
                if(hash_sep>0) {
                  vt_ep = this.i;
                  var type_name = this.s.substring((1 + hash_sep), vt_ep);
                  var key_type_name = this.s.substring(vt_sp, hash_sep);
                  var new_hash_node = new CodeNode(this.code,sp,vt_ep);
                  new_hash_node.vref = this.s.substring(sp, ep);
                  new_hash_node.ns = ns_list;
                  new_hash_node.value_type = 6;
                  new_hash_node.array_type = type_name;
                  new_hash_node.key_type = key_type_name;
                  if(vref_had_type_ann) {
                    new_hash_node.vref_annotation = vref_ann_node;
                    new_hash_node.has_vref_annotation = true;
                  }
                  if(had_array_type_ann) {
                    var vann_hash = this.parse_raw_annotation();
                    new_hash_node.type_annotation = vann_hash;
                    new_hash_node.has_type_annotation = true;
                    console.log("--> parsed HASH TYPE annotation");
                  }
                  new_hash_node.parent = this.curr_node;
                  this.curr_node.children.push(new_hash_node);
                  this.i = 1 + this.i;
                  continue;
                } else {
                  vt_ep = this.i;
                  var type_name_1 = this.s.substring(vt_sp, vt_ep);
                  var new_arr_node = new CodeNode(this.code,sp,vt_ep);
                  new_arr_node.vref = this.s.substring(sp, ep);
                  new_arr_node.ns = ns_list;
                  new_arr_node.value_type = 5;
                  new_arr_node.array_type = type_name_1;
                  new_arr_node.parent = this.curr_node;
                  this.curr_node.children.push(new_arr_node);
                  if(vref_had_type_ann) {
                    new_arr_node.vref_annotation = vref_ann_node;
                    new_arr_node.has_vref_annotation = true;
                  }
                  if(had_array_type_ann) {
                    var vann_arr = this.parse_raw_annotation();
                    new_arr_node.type_annotation = vann_arr;
                    new_arr_node.has_type_annotation = true;
                    console.log("--> parsed ARRAY TYPE annotation");
                  }
                  this.i = 1 + this.i;
                  continue;
                }
              }
              var had_type_ann = false;
              while((this.i<this.len) && (this.s.charCodeAt(this.i)>32) && (c!=58) && (c!=40) && (c!=41) && (c!="}".charCodeAt(0)) && (c!=",".charCodeAt(0))) {
                this.i = 1 + this.i;
                c = this.s.charCodeAt(this.i);
                if(c=="@".charCodeAt(0)) {
                  had_type_ann = true;
                  break;
                }
              }
              if(this.i<this.len) {
                vt_ep = this.i;
                var type_name_2 = this.s.substring(vt_sp, vt_ep);
                var new_ref_node = new CodeNode(this.code,sp,ep);
                new_ref_node.vref = this.s.substring(sp, ep);
                new_ref_node.ns = ns_list;
                new_ref_node.value_type = 8;
                new_ref_node.type_name = this.s.substring(vt_sp, vt_ep);
                new_ref_node.parent = this.curr_node;
                if(vref_had_type_ann) {
                  new_ref_node.vref_annotation = vref_ann_node;
                  new_ref_node.has_vref_annotation = true;
                }
                this.curr_node.children.push(new_ref_node);
                if(had_type_ann) {
                  var vann = this.parse_raw_annotation();
                  new_ref_node.type_annotation = vann;
                  new_ref_node.has_type_annotation = true;
                }
                continue;
              }
            } else {
              if((this.i<this.len) && (ep>sp)) {
                var new_vref_node = new CodeNode(this.code,sp,ep);
                new_vref_node.vref = this.s.substring(sp, ep);
                new_vref_node.value_type = 8;
                new_vref_node.ns = ns_list;
                new_vref_node.parent = this.curr_node;
                var op_pred = this.getOperatorPred(new_vref_node.vref);
                if(new_vref_node.vref==",") {
                  this.curr_node.infix_operator = false;
                  continue;
                }
                if(this.curr_node.infix_operator) {
                  var iNode = this.curr_node.infix_node;
                  if((op_pred>0) || (iNode.to_the_right==false)) {
                    iNode.children.push(new_vref_node);
                  } else {
                    var rn = iNode.right_node;
                    new_vref_node.parent = rn;
                    rn.children.push(new_vref_node);
                  }
                } else {
                  this.curr_node.children.push(new_vref_node);
                }
                if(vref_had_type_ann) {
                  new_vref_node.vref_annotation = vref_ann_node;
                  new_vref_node.has_vref_annotation = true;
                  console.log("--> had a normal vref annotation");
                  console.log(this.s.substring(sp, ep));
                }
                if((this.s.charCodeAt((this.i + 1))=="(".charCodeAt(0)) || (this.s.charCodeAt((this.i + 0))=="(".charCodeAt(0))) {
                  if((0==op_pred) && this.curr_node.infix_operator && (1==this.curr_node.children.length)) {
                  }
                }
                if(((op_pred>0) && this.curr_node.infix_operator) || ((op_pred>0) && (this.curr_node.children.length>=2))) {
                  if(op_pred==3) {
                    var n_ch = this.curr_node.children.splice(0,1).pop();
                    this.curr_node.children.push(n_ch);
                  } else {
                    if(false==this.curr_node.infix_operator) {
                      var if_node = new CodeNode(this.code,sp,ep);
                      this.curr_node.infix_node = if_node;
                      this.curr_node.infix_operator = true;
                      if_node.infix_subnode = true;
                      var ch_cnt = this.curr_node.children.length;
                      var ii_1 = 0;
                      var start_from = ch_cnt - 2;
                      var keep_nodes = [];
                      while(ch_cnt>0) {
                        var n_ch_1 = this.curr_node.children.splice(0,1).pop();
                        if((ii_1<start_from) || n_ch_1.infix_subnode) {
                          keep_nodes.push(n_ch_1);
                        } else {
                          if_node.children.push(n_ch_1);
                        }
                        ch_cnt = ch_cnt - 1;
                        ii_1 = 1 + ii_1;
                      }
                      for( var i= 0; i< keep_nodes.length; i++) { 
                        var keep= keep_nodes[i];
                        this.curr_node.children.push(keep);
                      }
                      this.curr_node.children.push(if_node);
                    }
                    var ifNode = this.curr_node.infix_node;
                    var new_op_node = new CodeNode(this.code,sp,ep);
                    new_op_node.expression = true;
                    new_op_node.parent = ifNode;
                    var until_index = ifNode.children.length - 1;
                    var to_right = false;
                    var just_continue = false;
                    if((ifNode.operator_pred>0) && (ifNode.operator_pred<op_pred)) {
                      to_right = true;
                    }
                    if((ifNode.operator_pred>0) && (ifNode.operator_pred>op_pred)) {
                      ifNode.to_the_right = false;
                    }
                    if((ifNode.operator_pred>0) && (ifNode.operator_pred==op_pred)) {
                      to_right = ifNode.to_the_right;
                    }
                    if(to_right) {
                      var op_node = ifNode.children.splice(until_index,1).pop();
                      var last_value = ifNode.children.splice(until_index - 1,1).pop();
                      new_op_node.children.push(op_node);
                      new_op_node.children.push(last_value);
                      ifNode.children.push(new_op_node);
                      ifNode.right_node = new_op_node;
                      ifNode.to_the_right = true;
                    } else {
                      if(false==just_continue) {
                        while(until_index>0) {
                          var what_to_add = ifNode.children.splice(0,1).pop();
                          new_op_node.children.push(what_to_add);
                          until_index = until_index - 1;
                        }
                        ifNode.children.push(new_op_node);
                      }
                    }
                    ifNode.operator_pred = op_pred;
                    continue;
                  }
                }
                continue;
              }
            }
            if((c==41) || (c=="}".charCodeAt(0))) {
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
    /* Weak variable : i*/
    /* Weak Object variable : i in class RangerLispParser */
    /* Weak variable : parents*/
    /* Weak ARRAY variable : parents in class RangerLispParser*/
    /* Weak variable : curr_node*/
    /* Weak Object variable : curr_node in class RangerLispParser */
  ], [
    
  ]);
  

return RangerLispParser;
}();
var RangerAllocations = function( ) {  
  function RangerAllocations() {
    _classCallCheck(this, RangerAllocations);
  }
  
   _createClass(RangerAllocations, [
  ], [
    { key: "moveOwnership", value: function moveOwnership(n1, n2, ctx, wr) {
    var node = n1;
    if(n1.hasParamDesc && n2.hasParamDesc) {
    var p2 = n2.paramDesc;
    var p1 = n1.paramDesc;
    var p = RangerAllocations.findParamDesc(n1,ctx,wr);
    p1 = p;
    if(p == null ) {
    return;
    }
    if((p1.refType==2) && (p2.refType==4)) {
    ctx.log(node,"memory4","ERROR: can not assing strong immutable to strong");
    return;
    }
    if((p1.refType==1) && (p2.refType==4)) {
    ctx.log(node,"memory4","OK: strong immutable can be referred");
    return;
    }
    if((p1.refType==1) && (p2.refType==1)) {
    ctx.log(node,"memory4","+++ weak -> weak assigment, nothing to do");
    return;
    }
    if((p1.refType==1) && (p2.refType==2)) {
    ctx.log(node,"memory4","+++ strong -> weak assigment, nothing to do, OK");
    if(p.varType==8) {
    p2.prop_assign_cnt = 1 + p2.prop_assign_cnt;
    }
    return;
    }
    if((p1.refType==2) && (p2.refType==1)) {
    if(p1.pointsToObject(ctx)) {
    ctx.log(node,"memory4","+++ ERROR weak -> strong");
    var ss = p1.getVarTypeName();
    if(p1.nameNode != null ) {
    ctx.log(node,"memory4","type: " + (p1.nameNode.getTypeInformationString()));
    }
    } else {
    ctx.log(node,"memory4","+++ NOTE: weak -> strong");
    if(p1.nameNode != null ) {
    ctx.log(node,"memory4","type: " + (p1.nameNode.getTypeInformationString()));
    }
    }
    return;
    }
    if((p1.refType==0) && (p2.refType==2)) {
    if(p1.varType==5) {
    ctx.log(node,"memory4","+++ strong ref assigned to a not typed local variable, OK");
    p1.refType = 2;
    p2.refType = 1;
    return;
    } else {
    ctx.log(node,"memory4","+++ strong -> non local non typed maybe ERROR");
    }
    }
    if((p1.refType==2) && (p2.refType==2)) {
    if(p1.varType==5) {
    ctx.log(node,"memory4","+++ local variable assigned to a strong ref, OK");
    return;
    }
    if(p2.varType==3) {
    ctx.log(node,"memory4","+++ NEW OBJECT -> Strong, OK");
    p1.refType = 2;
    return;
    }
    var nn = p.nameNode;
    if(nn != null ) {
    if(nn.isPrimitiveType()) {
    ctx.log(node,"memory4","+++ NON DETECTED, primitive assigment, OK");
    } else {
    if(p.varType==8) {
    p2.prop_assign_cnt = 1 + p2.prop_assign_cnt;
    if(p.refType==1) {
    ctx.log(node,"memory4","WEAK PROPERTY ASSIGN to -> " + n1.vref);
    }
    if(p.refType==2) {
    ctx.log(node,"memory4","STRONG PROPERTY ASSIGN to -> " + n1.vref);
    }
    }
    if(p.varType==5) {
    ctx.log(node,"memory4","Local variable ASSIGN to -> " + n1.vref + " str: " + (nn.getString()) + " " + nn.type_name);
    }
    p1.refType = 2;
    p2.refType = 1;
    ctx.log(node,"memory4","+++ MOVING OWNERSHIP ",nn.value_type);
    }
    }
    }
    if(p2.varType==3) {
    ctx.log(node,"memory4","ASSIGN & STRONG variable assigment because of NewObject: " + n1.vref);
    if(p1.varType==8) {
    ctx.log(node,"memory4","also: PROPERTY ASSIGN to " + n1.vref);
    }
    return;
    }
    if(p1.varType==8) {
    ctx.log(node,"memory4","PROPERTY ASSIGN to " + n1.vref);
    return;
    }
    if(p1.varType==2) {
    ctx.log(node,"memory4","THIS.PROPERTY ASSIGN to " + n1.vref);
    return;
    }
    } else {
    }
    }}
    ,
    { key: "cmdNew", value: function cmdNew(node, ctx, wr) {
    var p = new RangerAppParamDesc();
    p.varType = 3;
    p.refType = 2;
    var obj = node.getSecond();
    p.node = node;
    p.nameNode = obj;
    node.hasParamDesc = true;
    node.paramDesc = p;
    }}
    ,
    { key: "cmdAssign", value: function cmdAssign(node, ctx, wr) {
    var n1 = node.getSecond();
    var n2 = node.getThird();
    RangerAllocations.moveOwnership(n1,n2,ctx,wr);
    return;
    if(n1.hasParamDesc && n2.hasParamDesc) {
    var p1 = n1.paramDesc;
    var p2 = n2.paramDesc;
    ctx.log(node,"memory4","DEFINED assign to " + n1.vref);
    if(p2.varType==3) {
    ctx.log(node,"memory4","ASSIGN & STRONG variable assigment because of NewObject: " + n1.vref);
    if(p1.varType==2) {
    ctx.log(node,"memory4","also: THIS.PROPERTY ASSIGN to " + n1.vref);
    }
    return;
    }
    if(p1.varType==8) {
    ctx.log(node,"memory4","PROPERTY ASSIGN to " + n1.vref);
    return;
    }
    if(p1.varType==2) {
    ctx.log(node,"memory4","THIS.PROPERTY ASSIGN to " + n1.vref);
    return;
    }
    } else {
    }
    }}
    ,
    { key: "cmdCall", value: function cmdCall(node, ctx, wr) {
    }}
    ,
    { key: "cmdLocalCall", value: function cmdLocalCall(node, ctx, wr) {
    }}
    ,
    { key: "cmdPush", value: function cmdPush(node, ctx, wr) {
    }}
    ,
    { key: "cmdGet", value: function cmdGet(node, ctx, wr) {
    }}
    ,
    { key: "cmdSet", value: function cmdSet(node, ctx, wr) {
    }}
    ,
    { key: "cmdItemAt", value: function cmdItemAt(node, ctx, wr) {
    }}
    ,
    { key: "cmdReturn", value: function cmdReturn(node, ctx, wr) {
    }}
    ,
    { key: "EnterVarDef", value: function EnterVarDef(node, ctx, wr) {
    var n1 = node.getSecond();
    if(node.children.length>2) {
    var n2 = node.getThird();
    if(n1.hasParamDesc && n2.hasParamDesc) {
    ctx.log(node,"memory4","variable definition of defined var " + n1.vref);
    var p1 = n1.paramDesc;
    var p2 = n2.paramDesc;
    if(p2.varType==3) {
    p1.refType = 2;
    ctx.log(node,"memory4","STRONG variable definition because of NewObject: " + n1.vref);
    return;
    }
    }
    }
    }}
    ,
    { key: "WriteVRef", value: function WriteVRef(node, ctx, wr) {
    var p = new RangerAppParamDesc();
    var rootObjName = node.ns[0];
    if(ctx.isEnumDefined(rootObjName)) {
    return;
    }
    if(node.vref==(ctx.getThisName())) {
    node.hasParamDesc = true;
    node.paramDesc = p;
    p.varType = 1;
    p.refType = 4;
    return;
    }
    var p_1 = RangerAllocations.findParamDesc(node,ctx,wr);
    if(p_1 != null ) {
    node.hasParamDesc = true;
    node.paramDesc = p_1;
    }
    }}
    ,
    { key: "findParamDesc", value: function findParamDesc(obj, ctx, wr) {
    if(obj.hasParamDesc) {
    return obj.paramDesc;
    }
    if(0==obj.vref.length) {
    var noT = new RangerAppParamDesc();
    return noT;
    }
    var varDesc;
    if(ctx.hasClass(obj.vref)) {
    varDesc = new RangerAppParamDesc();
    varDesc.varType = 9;
    varDesc.refType = 4;
    return varDesc;
    }
    if(obj.vref==(ctx.getThisName())) {
    varDesc = new RangerAppParamDesc();
    varDesc.varType = 1;
    varDesc.refType = 4;
    return varDesc;
    } else {
    if(obj.ns.length>1) {
    var cnt = obj.ns.length;
    var classRefDesc;
    for( var i= 0; i< obj.ns.length; i++) {
    var strname= obj.ns[i];
    if(i==0) {
    var classDesc;
    if(strname==(ctx.getThisName())) {
    classDesc = ctx.getCurrentClass();
    } else {
    classRefDesc = ctx.getVariableDef(strname);
    if(classRefDesc == null ) {
    ctx.addError(obj,"Error, no description for called object: " + strname);
    break;
    }
    classDesc = ctx.findClass(classRefDesc.nameNode.type_name);
    }
    } else {
    if(i<(cnt - 1)) {
    varDesc = classDesc.findVariable(strname);
    if(varDesc == null ) {
    ctx.addError(obj,"Error, no description for refenced obj: " + strname);
    }
    var subClass = varDesc.getTypeName();
    classDesc = ctx.findClass(subClass);
    continue;
    }
    if(classDesc != null ) {
    varDesc = classDesc.findVariable(strname);
    if(varDesc != null ) {
    varDesc.varType = 8;
    }
    }
    }
    }
    return varDesc;
    }
    varDesc = ctx.getVariableDef(obj.vref);
    if((varDesc != null ) && (varDesc.nameNode != null )) {
    } else {
    }
    return varDesc;
    }
    return varDesc;
    }}
    
  ]);
  

return RangerAllocations;
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
    { key: "getCmdName", value: function getCmdName(cmd) { 
      return cmd;
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
        new_enum.add(item.vref);
      }
      ctx.definedEnums[fNameNode.vref] = new_enum;
    }}
    ,
    { key: "findFunctionDesc", value: function findFunctionDesc(obj, ctx, wr) { 
      var varDesc;
      var varFnDesc;
      if(obj.vref==this.getThisName()) {
        ctx.addError(obj,"Can not call 'this' like function");
        varFnDesc = new RangerAppFunctionDesc();
        return varFnDesc;
      } else {
        if(obj.ns.length>1) {
          var cnt = obj.ns.length;
          var classRefDesc;
          for( var i= 0; i< obj.ns.length; i++) { 
            var strname= obj.ns[i];
            if(i==0) {
              var classDesc;
              if(strname==this.getThisName()) {
                classDesc = ctx.getCurrentClass();
              } else {
                classRefDesc = ctx.getVariableDef(strname);
                if(classRefDesc == null ) {
                  ctx.addError(obj,"Error, no description for called object: " + strname);
                  break;
                }
                classDesc = ctx.findClass(classRefDesc.nameNode.type_name);
              }
            } else {
              if(i<(cnt - 1)) {
                varDesc = classDesc.findVariable(strname);
                if(varDesc == null ) {
                  ctx.addError(obj,"Error, no description for refenced obj: " + strname);
                }
                var subClass = varDesc.getTypeName();
                classDesc = ctx.findClass(subClass);
                continue;
              }
              if(classDesc != null ) {
                varFnDesc = classDesc.findMethod(strname);
                if(varFnDesc == null ) {
                  ctx.addError(obj,"variable not found " + strname);
                }
              }
            }
          }
          return varFnDesc;
        }
        var currClass = ctx.getCurrentClass();
        varFnDesc = currClass.findMethod(obj.vref);
        if(varFnDesc.nameNode != null ) {
        } else {
          ctx.addError(obj,"Error, no description for called function: " + obj.vref);
        }
        return varFnDesc;
      }
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
              var classDesc;
              if(strname==this.getThisName()) {
                classDesc = ctx.getCurrentClass();
              } else {
                classRefDesc = ctx.getVariableDef(strname);
                if(classRefDesc == null ) {
                  ctx.addError(obj,"Error, no description for called object: " + strname);
                  break;
                }
                classDesc = ctx.findClass(classRefDesc.nameNode.type_name);
              }
            } else {
              if(i<(cnt - 1)) {
                varDesc = classDesc.findVariable(strname);
                if(varDesc == null ) {
                  ctx.addError(obj,"Error, no description for refenced obj: " + strname);
                }
                var subClass = varDesc.getTypeName();
                classDesc = ctx.findClass(subClass);
                continue;
              }
              if(classDesc != null ) {
                varDesc = classDesc.findVariable(strname);
                if(varDesc == null ) {
                  var classMethod = classDesc.findMethod(strname);
                  if(classMethod == null ) {
                    ctx.addError(obj,"variable not found " + strname);
                  } else {
                    return classMethod;
                  }
                }
              }
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
          ctx.addError(obj,"Error, no description for called object: " + obj.vref);
        }
        return varDesc;
      }
    }}
    ,
    { key: "areEqualTypes", value: function areEqualTypes(n1, n2, ctx) { 
      if(n1 == null ) {
        if(n2 != null ) {
          ctx.addError(n2,"Internal error: shouldBeEqualTypes called with n2 == null ");
        }
        return false;
      }
      if(n2 == null ) {
        if(n1 != null ) {
          ctx.addError(n1,"Internal error: shouldBeEqualTypes called with n1 == null ");
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
    { key: "shouldBeEqualTypes", value: function shouldBeEqualTypes(n1, n2, ctx, msg) { 
      if(n1 == null ) {
        if(n2 != null ) {
          ctx.addError(n2,"Internal error: shouldBeEqualTypes called with n2 == null ");
        }
        return;
      }
      if(n2 == null ) {
        if(n1 != null ) {
          ctx.addError(n1,"Internal error: shouldBeEqualTypes called with n1 == null ");
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
          if(ctx.isDefinedClass(n2.eval_type_name)) {
            var cc = ctx.findClass(n2.eval_type_name);
            if(cc.extends_classes.indexOf(n1.eval_type_name)>=0) {
              b_ok = true;
            }
          }
          if((n1.eval_type_name=="char") && (n2.eval_type_name=="int")) {
            b_ok = true;
          }
          if((n1.eval_type_name=="int") && (n2.eval_type_name=="char")) {
            b_ok = true;
          }
          if(b_ok==false) {
            ctx.addError(n1,"Type mismatch " + n2.eval_type_name + " <> " + n1.eval_type_name + ". " + msg);
          }
        }
      }
    }}
    ,
    { key: "shouldBeExpression", value: function shouldBeExpression(n1, ctx, msg) { 
      if(n1.expression==false) {
        ctx.addError(n1,msg);
      }
    }}
    ,
    { key: "shouldHaveChildCnt", value: function shouldHaveChildCnt(cnt, n1, ctx, msg) { 
      if(n1.children.length!=cnt) {
        ctx.addError(n1,msg);
      }
    }}
    ,
    { key: "shouldBeNumeric", value: function shouldBeNumeric(n1, ctx, msg) { 
      if((n1.eval_type!=0) && (n1.eval_type_name.length>0)) {
        if(false==((n1.eval_type_name=="double") || (n1.eval_type_name=="int"))) {
          ctx.addError(n1,"Not numeric: " + n1.eval_type_name + ". " + msg);
        }
      }
    }}
    ,
    { key: "shouldBeArray", value: function shouldBeArray(n1, ctx, msg) { 
      if(n1.eval_type!=5) {
        ctx.addError(n1,"Expecting array. " + msg);
      }
    }}
    ,
    { key: "shouldBeType", value: function shouldBeType(type_name, n1, ctx, msg) { 
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
            ctx.addError(n1,"Type mismatch " + type_name + " <> " + n1.eval_type_name + ". " + msg);
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
        parser.parse();
        var rnode = parser.rootNode;
        this.CollectMethods(rnode,ctx,wr);
        this.StartCodeWriting(rnode,ctx,wr);
        return true;
      } catch(e) {
        console.log(e);
        throw  "ERROR: import failed, possibly invalid Import filename: " + import_file;
      }
    }}
    ,
    { key: "CreateClass", value: function CreateClass(node, ctx, wr) { 
      wr.out("----Create class is not defined---- :(",true);
    }}
    ,
    { key: "getThisName", value: function getThisName() { 
      return "this";
    }}
    ,
    { key: "WriteThisVar", value: function WriteThisVar(node, ctx, wr) { 
      wr.out(this.getThisName(),false);
    }}
    ,
    { key: "WriteVRef", value: function WriteVRef(node, ctx, wr) { 
      if(node.vref=="_") {
        return;
      }
      RangerAllocations.WriteVRef(node,ctx,wr);
      if(node.has_vref_annotation) {
        ctx.log(node,"ann","Found annotated reference ");
        var ann = node.vref_annotation;
        if(ann.children.length>0) {
          var fc = ann.children[0];
          ctx.log(node,"ann","value of first " + fc.vref);
        }
      }
      var rootObjName = node.ns[0];
      if(ctx.isEnumDefined(rootObjName)) {
        var enumName = node.ns[1];
        var e = ctx.getEnum(rootObjName);
        if(typeof(e.values[enumName]) != "undefined") {
          wr.out((e.values[enumName]) + "",false);
        } else {
          ctx.addError(node,"Undefined Enum " + rootObjName + "." + enumName);
        }
        return 1;
      }
      if(node.vref==this.getThisName()) {
        wr.out(node.vref,false);
        node.ref_type = 4;
        return;
      }
      if(ctx.isVarDefined(rootObjName)) {
        var vDef = ctx.getVariableDef(rootObjName);
        var activeFn = ctx.getCurrentMethod();
        if(vDef.is_class_variable) {
          this.WriteThisVar(node,ctx,wr);
          wr.out(".",false);
          wr.out(node.vref,false);
          if(node.ns.length>1) {
            var pointedClass = ctx.findClass(vDef.nameNode.type_name);
            if(pointedClass == null ) {
              ctx.addError(node,"Could not find class " + vDef.nameNode.type_name);
              return;
            }
            var vName = node.ns[1];
            vDef = pointedClass.findVariable(vName);
          }
          if(vDef.node.getBooleanProperty("weak")) {
            node.ref_type = 1;
          }
          var vNameNode = vDef.nameNode;
          node.eval_type = vNameNode.value_type;
          node.eval_type_name = vNameNode.type_name;
          return 1;
        }
        vDef = this.findParamDesc(node,ctx,wr);
        if(vDef != null ) {
          if(vDef.node.getBooleanProperty("weak")) {
            node.ref_type = 1;
          }
          var vNameNode_1 = vDef.nameNode;
          if((vNameNode_1 != null ) && (vNameNode_1.type_name != null )) {
            node.eval_type = vNameNode_1.value_type;
            node.eval_type_name = vNameNode_1.type_name;
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
          ctx.addError(node,"Undefined variable " + rootObjName + " in class " + desc.name);
        }
        wr.out(node.vref,false);
        return;
      }
      for( var i= 0; i< node.ns.length; i++) { 
        var nns= node.ns[i];
        if(i>0) {
          wr.out(".",false);
          wr.out(nns,false);
        } else {
          var varDef = ctx.getVariableDef(nns);
          wr.out(varDef.compiledName,false);
        }
      }
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
        p.varType = 4;
        p.is_optional = false;
        subCtx.defineVariable(p.name,p);
      }
      var cBody = node.getThird();
      ctx.setInMethod();
      this.WalkNode(cBody,subCtx,cw);
      ctx.unsetInMethod();
    }}
    ,
    { key: "WriteScalarValue", value: function WriteScalarValue(node, ctx, wr) { 
      node.eval_type = node.value_type;
      switch(node.value_type) {
        case 1:
          wr.out("" + node.double_value,false);
          node.eval_type_name = "double";
          break;
        case 3:
          wr.out(String.fromCharCode(34) + (this.EncodeString(node.string_value)) + String.fromCharCode(34),false);
          node.eval_type_name = "string";
          break;
        case 2:
          wr.out("" + node.int_value,false);
          node.eval_type_name = "int";
          break;
        case 4:
          if(node.boolean_value) {
            wr.out("true",false);
          } else {
            wr.out("false",false);
          }
          node.eval_type_name = "boolean";
          break;
      }
    }}
    ,
    { key: "cmdNew", value: function cmdNew(node, ctx, wr) { 
      this.shouldHaveChildCnt(3,node,ctx,"new expexts three arguments");
      var obj = node.getSecond();
      var params = node.getThird();
      if((ctx.expressionLevel())>1) {
        wr.out("(",false);
      }
      wr.out("new ",false);
      ctx.setInExpr();
      this.WalkNode(obj,ctx,wr);
      wr.out("(",false);
      for( var i= 0; i< params.children.length; i++) { 
        var arg= params.children[i];
        if(i>0) {
          wr.out(",",false);
        }
        this.WalkNode(arg,ctx,wr);
      }
      wr.out(")",false);
      ctx.unsetInExpr();
      if((ctx.expressionLevel())>1) {
        wr.out(")",false);
      }
      if((ctx.expressionLevel())==0) {
        wr.newline();
      }
      node.eval_type = 7;
      node.eval_type_name = obj.vref;
      var currC = ctx.findClass(obj.vref);
      var fnDescr = currC.constructor_fn;
      if(fnDescr != null ) {
        for( var i_1= 0; i_1< fnDescr.params.length; i_1++) { 
          var param= fnDescr.params[i_1];
          var argNode = params.children[i_1];
          if(argNode == null ) {
            ctx.addError(node,"Argument was not defined");
          }
          if(this.areEqualTypes(param.nameNode,argNode,ctx)) {
          } else {
            ctx.addError(node,"ERROR, invalid argument types for " + currC.name + " constructor ");
          }
        }
      }
      RangerAllocations.cmdNew(node,ctx,wr);
    }}
    ,
    { key: "cmdLocalCall", value: function cmdLocalCall(node, ctx, wr) { 
      var fnNode = node.getFirst();
      var desc = ctx.getCurrentClass();
      if(fnNode.ns.length>1) {
        var vFnDef = this.findFunctionDesc(fnNode,ctx,wr);
        if(vFnDef != null ) {
          var subCtx = ctx.fork();
          var p = new RangerAppParamDesc();
          p.name = fnNode.vref;
          p.value_type = fnNode.value_type;
          p.node = fnNode;
          p.nameNode = fnNode;
          p.varType = 10;
          subCtx.defineVariable(p.name,p);
          subCtx.setInExpr();
          this.WalkNode(fnNode,subCtx,wr);
          wr.out("(",false);
          var callParams = node.children[1];
          for( var i= 0; i< callParams.children.length; i++) { 
            var arg= callParams.children[i];
            if(i>0) {
              wr.out(",",false);
            }
            this.WalkNode(arg,subCtx,wr);
          }
          wr.out(")",false);
          subCtx.unsetInExpr();
          if((ctx.expressionLevel())==0) {
            wr.out(";",false);
            wr.newline();
          }
          for( var i_1= 0; i_1< vFnDef.params.length; i_1++) { 
            var param= vFnDef.params[i_1];
            var argNode = callParams.children[i_1];
            if(argNode == null ) {
              ctx.addError(node,"Argument was not defined");
            }
            if(this.areEqualTypes(param.nameNode,argNode,ctx)) {
            } else {
              ctx.addError(node,"ERROR, invalid argument types for method " + vFnDef.name);
            }
          }
          return true;
        } else {
          ctx.addError(node,"Called Object or Property was not defined");
        }
      }
      if(desc.hasMethod(fnNode.vref)) {
        var fnDescr = desc.findMethod(fnNode.vref);
        var subCtx_1 = ctx.fork();
        var p_1 = new RangerAppParamDesc();
        p_1.name = fnNode.vref;
        p_1.value_type = fnNode.value_type;
        p_1.node = fnNode;
        p_1.nameNode = fnNode;
        p_1.varType = 10;
        subCtx_1.defineVariable(p_1.name,p_1);
        subCtx_1.setInExpr();
        this.WriteThisVar(fnNode,subCtx_1,wr);
        wr.out(".",false);
        this.WalkNode(fnNode,subCtx_1,wr);
        wr.out("(",false);
        for( var i_2= 0; i_2< node.children.length; i_2++) { 
          var arg_1= node.children[i_2];
          if(i_2<1) {
            continue;
          }
          if(i_2>1) {
            wr.out(",",false);
          }
          this.WalkNode(arg_1,subCtx_1,wr);
        }
        wr.out(")",false);
        subCtx_1.unsetInExpr();
        if((ctx.expressionLevel())==0) {
          wr.out(";",false);
          wr.newline();
        }
        for( var i_3= 0; i_3< fnDescr.params.length; i_3++) { 
          var param_1= fnDescr.params[i_3];
          var argNode_1 = node.children[(i_3 + 1)];
          if(argNode_1 == null ) {
            ctx.addError(node,"Argument was not defined");
          }
          if(this.areEqualTypes(param_1.nameNode,argNode_1,ctx)) {
          } else {
            ctx.addError(node,"ERROR, invalid argument types for " + desc.name + " method " + fnDescr.name);
          }
        }
        return true;
      } else {
        ctx.addError(node,"ERROR, could not find class " + desc.name + " method " + fnNode.vref);
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
      p.varType = 10;
      p.nameNode = method;
      subCtx.defineVariable(p.name,p);
      var varDesc;
      if(obj.vref==this.getThisName()) {
        var classDesc = ctx.getCurrentClass();
        if(classDesc != null ) {
          fnDescr = classDesc.findMethod(method.vref);
          if(fnDescr == null ) {
            ctx.addError(obj,"ERROR, could not find this." + method.vref + " from class " + classDesc.name);
          } else {
            has_fn_desc = true;
          }
        } else {
          ctx.addError(obj,"ERROR, could not find class for this ");
        }
      } else {
        var possibleClass = obj.ns[0];
        if(ctx.hasClass(possibleClass)) {
          var classDesc_1 = ctx.findClass(possibleClass);
          fnDescr = classDesc_1.findStaticMethod(method.vref);
          if(fnDescr == null ) {
            ctx.addError(obj,"ERROR, could not find class " + possibleClass + " static method " + method.vref);
          } else {
            has_fn_desc = true;
          }
        } else {
          varDesc = this.findParamDesc(obj,subCtx,wr);
          if(varDesc != null ) {
            var className = varDesc.nameNode.type_name;
            var classDesc_2 = ctx.findClass(className);
            if(classDesc_2 != null ) {
              fnDescr = classDesc_2.findMethod(method.vref);
              if(fnDescr == null ) {
                ctx.addError(obj,"ERROR, could not find class " + className + " method " + method.vref);
              } else {
                has_fn_desc = true;
              }
            } else {
              ctx.addError(obj,"ERROR, could not find class " + className);
            }
          } else {
            console.log("description not found for " + obj.vref);
            if(varDesc != null ) {
              console.log("Vardesc was found though..." + varDesc.name);
            }
            ctx.addError(obj,"Error, no description for called object: " + obj.vref);
          }
        }
      }
      if((subCtx.expressionLevel())==0) {
        wr.newline();
      }
      if((subCtx.expressionLevel())>1) {
        wr.out("(",false);
      }
      if(has_fn_desc) {
        var nn = fnDescr.nameNode;
        node.eval_type = nn.value_type;
        node.eval_type_name = nn.type_name;
      }
      if(node.children.length>3) {
        var params = node.children[3];
        subCtx.setInExpr();
        this.WalkNode(obj,subCtx,wr);
        wr.out(".",false);
        this.WalkNode(method,subCtx,wr);
        wr.out("(",false);
        for( var i= 0; i< params.children.length; i++) { 
          var arg= params.children[i];
          if(i>0) {
            wr.out(",",false);
          }
          this.WalkNode(arg,subCtx,wr);
        }
        wr.out(")",false);
        subCtx.unsetInExpr();
        if(has_fn_desc) {
          for( var i_1= 0; i_1< fnDescr.params.length; i_1++) { 
            var param= fnDescr.params[i_1];
            if(fnDescr.name=="addVariable") {
              ctx.log(node,"memory5","addVariable " + param.name + " " + param.debugString);
            }
            var argNode = params.children[i_1];
            if(argNode == null ) {
              ctx.addError(node,"Argument was not defined");
              continue;
            }
            var paramNameNode = param.nameNode;
            if(fnDescr.name=="addVariable") {
              ctx.log(node,"memory5","comparing to strong --> " + param.refType + " " + param.debugString);
            }
            if(param.initRefType==2) {
              ctx.log(node,"memory4","*** should move local ownership to call ***");
              RangerAllocations.moveOwnership(params,argNode,ctx,wr);
            } else {
            }
            if(false==(paramNameNode.isPrimitiveType())) {
            }
            if(this.areEqualTypes(param.nameNode,argNode,ctx)) {
            } else {
              ctx.addError(node,"ERROR, invalid argument types for " + className + " method " + method.vref);
            }
          }
        }
      } else {
        subCtx.setInExpr();
        this.WalkNode(obj,subCtx,wr);
        wr.out(".",false);
        this.WalkNode(method,subCtx,wr);
        wr.out("()",false);
        subCtx.unsetInExpr();
      }
      if((subCtx.expressionLevel())>1) {
        wr.out(")",false);
      }
      if((ctx.expressionLevel())==0) {
        wr.out(";",false);
        wr.newline();
      }
    }}
    ,
    { key: "cmdJoin", value: function cmdJoin(node, ctx, wr) { 
      var n1 = node.getSecond();
      var n2 = node.getThird();
      ctx.setInExpr();
      this.WalkNode(n1,ctx,wr);
      ctx.unsetInExpr();
      wr.out(".join(",false);
      this.WalkNode(n2,ctx,wr);
      wr.out(")",false);
      this.shouldBeType("string",n2,ctx,"join expects a string as the second parameter.");
    }}
    ,
    { key: "cmdSplit", value: function cmdSplit(node, ctx, wr) { 
      var n1 = node.getSecond();
      var n2 = node.getThird();
      ctx.setInExpr();
      this.WalkNode(n1,ctx,wr);
      ctx.unsetInExpr();
      wr.out(".split(",false);
      this.WalkNode(n2,ctx,wr);
      wr.out(")",false);
      this.shouldBeType("string",n1,ctx,"strsplit expects a string as the first parameter.");
      this.shouldBeType("string",n2,ctx,"strsplit expects a string as the second parameter.");
    }}
    ,
    { key: "cmdTrim", value: function cmdTrim(node, ctx, wr) { 
      var n1 = node.getSecond();
      ctx.setInExpr();
      this.WalkNode(n1,ctx,wr);
      ctx.unsetInExpr();
      wr.out(".trim()",false);
      this.shouldBeType("string",n1,ctx,"Trim expects a string as the first parameter.");
    }}
    ,
    { key: "cmdStrlen", value: function cmdStrlen(node, ctx, wr) { 
      var n1 = node.getSecond();
      ctx.setInExpr();
      this.WalkNode(n1,ctx,wr);
      ctx.unsetInExpr();
      wr.out(".length",false);
      this.shouldBeType("string",n1,ctx,"strlen expects a string as the first parameter.");
    }}
    ,
    { key: "cmdSubstring", value: function cmdSubstring(node, ctx, wr) { 
      var n1 = node.getSecond();
      var start = node.children[2];
      var end = node.children[3];
      ctx.setInExpr();
      this.WalkNode(n1,ctx,wr);
      wr.out(".substring(",false);
      this.WalkNode(start,ctx,wr);
      wr.out(", ",false);
      this.WalkNode(end,ctx,wr);
      wr.out(")",false);
      ctx.unsetInExpr();
      this.shouldBeType("string",n1,ctx,"substring expects a string as the first parameter.");
      this.shouldBeType("int",start,ctx,"substring expects an integer as the second parameter.");
      this.shouldBeType("int",end,ctx,"substring expects an integer as the third parameter.");
    }}
    ,
    { key: "cmdCharcode", value: function cmdCharcode(node, ctx, wr) { 
      var n1 = node.getSecond();
      ctx.setInExpr();
      this.WalkNode(n1,ctx,wr);
      wr.out(".charCodeAt(0)",false);
      ctx.unsetInExpr();
      this.shouldBeType("string",n1,ctx,"charcode expects a string as the first parameter.");
    }}
    ,
    { key: "cmdStrfromcode", value: function cmdStrfromcode(node, ctx, wr) { 
      var n1 = node.getSecond();
      ctx.setInExpr();
      wr.out("String.fromCharCode(",false);
      this.WalkNode(n1,ctx,wr);
      wr.out(")",false);
      ctx.unsetInExpr();
      this.shouldBeType("int",n1,ctx,"strfromcode expects an integer as the first parameter.");
    }}
    ,
    { key: "cmdCharAt", value: function cmdCharAt(node, ctx, wr) { 
      var n1 = node.getSecond();
      var index = node.children[2];
      ctx.setInExpr();
      this.WalkNode(n1,ctx,wr);
      wr.out(".charCodeAt(",false);
      this.WalkNode(index,ctx,wr);
      wr.out(")",false);
      ctx.unsetInExpr();
      this.shouldBeType("string",n1,ctx,"charAt expects a string as the first parameter.");
      this.shouldBeType("int",index,ctx,"charAt expects an integer as the second parameter.");
    }}
    ,
    { key: "cmdStr2Int", value: function cmdStr2Int(node, ctx, wr) { 
      var n1 = node.getSecond();
      ctx.setInExpr();
      wr.out("parseInt(",false);
      this.WalkNode(n1,ctx,wr);
      ctx.unsetInExpr();
      wr.out(")",false);
      this.shouldBeType("string",n1,ctx,"str2int expects a string as the first parameter.");
    }}
    ,
    { key: "cmdStr2Double", value: function cmdStr2Double(node, ctx, wr) { 
      var n1 = node.getSecond();
      ctx.setInExpr();
      wr.out("parseFloat(",false);
      this.WalkNode(n1,ctx,wr);
      ctx.unsetInExpr();
      wr.out(")",false);
      this.shouldBeType("string",n1,ctx,"str2double expects a string as the first parameter.");
    }}
    ,
    { key: "cmdDouble2Str", value: function cmdDouble2Str(node, ctx, wr) { 
      var n1 = node.getSecond();
      ctx.setInExpr();
      wr.out("(",String.fromCharCode(34),String.fromCharCode(34)," + ",false);
      this.WalkNode(n1,ctx,wr);
      ctx.unsetInExpr();
      wr.out(")",false);
      this.shouldBeType("double",n1,ctx,"double2str expects a double as the first parameter.");
    }}
    ,
    { key: "cmdArrayLength", value: function cmdArrayLength(node, ctx, wr) { 
      var n1 = node.getSecond();
      ctx.setInExpr();
      this.WalkNode(n1,ctx,wr);
      ctx.unsetInExpr();
      wr.out(".length",false);
      node.eval_type = 2;
      node.eval_type_name = "int";
    }}
    ,
    { key: "cmdLog", value: function cmdLog(node, ctx, wr) { 
      return;
      if(ctx.hasCompilerSetting("log_group")) {
        var gName = ctx.getCompilerSetting("log_group");
        var n1 = node.getSecond();
        var n2 = node.getThird();
        if(n1.string_value==gName) {
          wr.newline();
          wr.out("console.log(\"[" + gName + "] \" +",false);
          ctx.setInExpr();
          this.WalkNode(n2,ctx,wr);
          ctx.unsetInExpr();
          wr.out(");",true);
        }
      }
    }}
    ,
    { key: "cmdPrint", value: function cmdPrint(node, ctx, wr) { 
      var n1 = node.getSecond();
      wr.newline();
      wr.out("console.log(",false);
      ctx.setInExpr();
      this.WalkNode(n1,ctx,wr);
      ctx.unsetInExpr();
      wr.out(");",true);
      this.shouldBeType("string",n1,ctx,"print expects a string as the first parameter.");
    }}
    ,
    { key: "cmdDoc", value: function cmdDoc(node, ctx, wr) { 
      wr.newline();
      wr.out("\/**",false);
      if(node.children.length>1) {
        var fc = node.getSecond();
        this.WalkNode(fc,ctx,wr);
      }
      wr.out("*\/",true);
    }}
    ,
    { key: "cmdGitDoc", value: function cmdGitDoc(node, ctx, wr) { 
      var cn = node.children[1];
      var doc = node.children[2];
      var classWriter = ctx.getFileWriter(".",cn.string_value);
      classWriter.raw(doc.string_value,true);
    }}
    ,
    { key: "cmdContinue", value: function cmdContinue(node, ctx, wr) { 
      wr.newline();
      wr.out("continue;",true);
    }}
    ,
    { key: "cmdBreak", value: function cmdBreak(node, ctx, wr) { 
      wr.newline();
      wr.out("break;",true);
    }}
    ,
    { key: "cmdThrow", value: function cmdThrow(node, ctx, wr) { 
      wr.newline();
      wr.out("throw ",false);
      if(node.children.length>1) {
        var fc = node.getSecond();
        if(fc.vref=="_") {
        } else {
          wr.out(" ",false);
          ctx.setInExpr();
          this.WalkNode(fc,ctx,wr);
          ctx.unsetInExpr();
        }
      }
      wr.out(";",true);
    }}
    ,
    { key: "cmdReturn", value: function cmdReturn(node, ctx, wr) { 
      wr.out("return",false);
      if(node.children.length>1) {
        var fc = node.getSecond();
        if(fc.vref=="_") {
        } else {
          wr.out(" ",false);
          ctx.setInExpr();
          this.WalkNode(fc,ctx,wr);
          ctx.unsetInExpr();
          var currFn = ctx.getCurrentMethod();
          if(fc.hasParamDesc) {
            var p = fc.paramDesc;
            if(currFn.refType==2) {
              ctx.log(node,"memory4",">>>>>>>>> ----------- returning strong variable possibly here");
            } else {
              if(p != null ) {
                if(p.refType==2) {
                  var type_found = false;
                  if(p.varType==5) {
                    type_found = true;
                    ctx.log(node,"memory4","<<<<< ERROR >>>> returning strong but function is not strong");
                    ctx.log(node,"memory4","RETURNING LocalVariable, problem because deallocated after return");
                  }
                  if(p.varType==3) {
                    type_found = true;
                    ctx.log(node,"memory4","<<<<< ERROR >>>> returning NEW Object which is STRONG but function is weak");
                  }
                  if(p.varType==8) {
                    type_found = true;
                    ctx.log(node,"memory4","RETURNING Property => should be a weak return, OK");
                  }
                  if(false==type_found) {
                    ctx.log(node,"memory4","<<<<< ERROR >>>> TYPE NOT FOUND && returning strong but function is not strong");
                  }
                }
              }
            }
          }
        }
      }
      wr.out(";",true);
    }}
    ,
    { key: "cmdRemoveIndex", value: function cmdRemoveIndex(node, ctx, wr) { 
      var arrayObj = node.getSecond();
      var indexNode = node.getThird();
      wr.newline();
      ctx.setInExpr();
      this.WalkNode(arrayObj,ctx,wr);
      wr.out(".splice(",false);
      this.WalkNode(indexNode,ctx,wr);
      ctx.unsetInExpr();
      wr.out(", 1)",true);
      this.shouldBeType("int",indexNode,ctx,"indexOf expects an interger as the second parameter.");
      this.shouldBeArray(arrayObj,ctx,"remove expects an array as the first parameter.");
    }}
    ,
    { key: "cmdIndexOf", value: function cmdIndexOf(node, ctx, wr) { 
      var arrayObj = node.getSecond();
      var itemObj = node.getThird();
      ctx.setInExpr();
      this.WalkNode(arrayObj,ctx,wr);
      wr.out(".indexOf(",false);
      this.WalkNode(itemObj,ctx,wr);
      ctx.unsetInExpr();
      wr.out(")",false);
      this.shouldBeArray(arrayObj,ctx,"remove expects an array as the first parameter.");
    }}
    ,
    { key: "cmdExtractArray", value: function cmdExtractArray(node, ctx, wr) { 
      var obj = node.getSecond();
      var index = node.getThird();
      ctx.setInExpr();
      this.WalkNode(obj,ctx,wr);
      ctx.unsetInExpr();
      wr.out(".splice(",false);
      this.WalkNode(index,ctx,wr);
      wr.out(",1).pop()",false);
      if(false==(obj.isPrimitiveType())) {
        var p = new RangerAppParamDesc();
        p.varType = 3;
        p.refType = 2;
        var obj_1 = node.getSecond();
        p.node = node;
        p.nameNode = obj_1;
        node.hasParamDesc = true;
        node.paramDesc = p;
      }
      this.shouldBeArray(obj_1,ctx,"array_extract expects an array as the first parameter.");
      this.shouldBeType("int",index,ctx,"array_extract expects an int as the second parameter.");
    }}
    ,
    { key: "cmdRemoveLast", value: function cmdRemoveLast(node, ctx, wr) { 
      var obj = node.getSecond();
      wr.newline();
      ctx.setInExpr();
      this.WalkNode(obj,ctx,wr);
      ctx.unsetInExpr();
      wr.out(".pop()",true);
      this.shouldBeArray(obj,ctx,"removeLast expects an array as the first parameter.");
    }}
    ,
    { key: "cmdPush", value: function cmdPush(node, ctx, wr) { 
      var obj = node.getSecond();
      var value = node.getThird();
      wr.newline();
      ctx.setInExpr();
      this.WalkNode(obj,ctx,wr);
      wr.out("." + (this.getCmdName("push")) + "(",false);
      this.WalkNode(value,ctx,wr);
      ctx.unsetInExpr();
      wr.out(");",true);
      RangerAllocations.moveOwnership(obj,value,ctx,wr);
      this.shouldBeArray(obj,ctx,"push expects an array as the first parameter.");
    }}
    ,
    { key: "cmdItemAt", value: function cmdItemAt(node, ctx, wr) { 
      var obj = node.getSecond();
      var index = node.getThird();
      ctx.setInExpr();
      this.WalkNode(obj,ctx,wr);
      wr.out("[",false);
      this.WalkNode(index,ctx,wr);
      ctx.unsetInExpr();
      wr.out("]",false);
      this.shouldBeArray(obj,ctx,"itemAt expects an array as the first parameter.");
      this.shouldBeType("int",index,ctx,"charAt expects an interger as the second parameter.");
    }}
    ,
    { key: "cmdHas", value: function cmdHas(node, ctx, wr) { 
      var obj = node.getSecond();
      var key = node.getThird();
      if((ctx.expressionLevel())>1) {
        wr.out("(",false);
      }
      wr.out("typeof(",false);
      ctx.setInExpr();
      this.WalkNode(obj,ctx,wr);
      wr.out("[",false);
      this.WalkNode(key,ctx,wr);
      wr.out("]",false);
      ctx.unsetInExpr();
      wr.out(") != " + String.fromCharCode(34) + "undefined" + String.fromCharCode(34),false);
      if((ctx.expressionLevel())>1) {
        wr.out(")",false);
      }
      this.shouldBeType("string",key,ctx,"has expects a string as the second parameter.");
    }}
    ,
    { key: "cmdSet", value: function cmdSet(node, ctx, wr) { 
      var obj = node.getSecond();
      var key = node.getThird();
      var value = node.children[3];
      wr.newline();
      ctx.setInExpr();
      this.WalkNode(obj,ctx,wr);
      wr.out("[",false);
      this.WalkNode(key,ctx,wr);
      wr.out("] = ",false);
      this.WalkNode(value,ctx,wr);
      ctx.unsetInExpr();
      wr.out(";",true);
      RangerAllocations.moveOwnership(obj,value,ctx,wr);
    }}
    ,
    { key: "cmdGet", value: function cmdGet(node, ctx, wr) { 
      var obj = node.getSecond();
      var key = node.getThird();
      if((ctx.expressionLevel())>1) {
        wr.out("(",false);
      }
      ctx.setInExpr();
      this.WalkNode(obj,ctx,wr);
      wr.out("[",false);
      this.WalkNode(key,ctx,wr);
      wr.out("]",false);
      ctx.unsetInExpr();
      if((ctx.expressionLevel())>1) {
        wr.out(")",false);
      }
    }}
    ,
    { key: "cmdIsNull", value: function cmdIsNull(node, ctx, wr) { 
      var n1 = node.getSecond();
      if((ctx.expressionLevel())>1) {
        wr.out("(",false);
      }
      ctx.setInExpr();
      this.WalkNode(n1,ctx,wr);
      ctx.unsetInExpr();
      wr.out(" == null ",false);
      if((ctx.expressionLevel())>1) {
        wr.out(")",false);
      }
    }}
    ,
    { key: "cmdNotNull", value: function cmdNotNull(node, ctx, wr) { 
      var n1 = node.getSecond();
      if((ctx.expressionLevel())>1) {
        wr.out("(",false);
      }
      ctx.setInExpr();
      this.WalkNode(n1,ctx,wr);
      ctx.unsetInExpr();
      wr.out(" != null ",false);
      if((ctx.expressionLevel())>1) {
        wr.out(")",false);
      }
    }}
    ,
    { key: "cmdAssign", value: function cmdAssign(node, ctx, wr) { 
      wr.newline();
      var n1 = node.getSecond();
      var n2 = node.getThird();
      this.WalkNode(n1,ctx,wr);
      wr.out(" = ",false);
      ctx.setInExpr();
      this.WalkNode(n2,ctx,wr);
      ctx.unsetInExpr();
      wr.out(";",true);
      RangerAllocations.cmdAssign(node,ctx,wr);
      if(n1.ref_type==1) {
      } else {
        var is_strong = true;
        if(n2.ref_type==4) {
          ctx.log(node,"memory3","ERROR: strong immutable can not be assigned to non-weak " + n1.vref);
          is_strong = false;
        }
        if(n2.ref_type==1) {
          ctx.log(node,"memory3","ERROR: Weak -> Strong assigment for " + n2.vref);
          is_strong = false;
        }
      }
      this.shouldBeEqualTypes(n1,n2,ctx,"Assigment expects both sides to be equal.");
    }}
    ,
    { key: "mathLibCalled", value: function mathLibCalled(node, ctx, wr) { 
    }}
    ,
    { key: "cmdMathLibOp", value: function cmdMathLibOp(node, ctx, wr) { 
      var op = node.getFirst();
      var n1 = node.getSecond();
      wr.out("Math.",false);
      wr.out(op.vref,false);
      wr.out("(",false);
      ctx.setInExpr();
      this.WalkNode(n1,ctx,wr);
      ctx.unsetInExpr();
      wr.out(")",false);
      this.mathLibCalled(node,ctx,wr);
      if((n1.eval_type!=0) && (n1.eval_type_name!="double")) {
        ctx.addError(n1,"Math operator Math." + op.vref + " called with invalid value type: " + n1.eval_type_name);
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
        wr.out("(",false);
      }
      ctx.setInExpr();
      this.WalkNode(n1,ctx,wr);
      wr.out(op.vref,false);
      this.WalkNode(n2,ctx,wr);
      ctx.unsetInExpr();
      if((ctx.expressionLevel())>1) {
        wr.out(")",false);
      }
      this.shouldBeEqualTypes(n1,n2,ctx,"Can not compare values of different types.");
    }}
    ,
    { key: "cmdLogicOp", value: function cmdLogicOp(node, ctx, wr) { 
      var op = node.getFirst();
      node.eval_type = 4;
      node.eval_type_name = "boolean";
      var firstChild = node.getSecond();
      if((ctx.expressionLevel())>1) {
        wr.out("(",false);
      }
      for( var i= 0; i< node.children.length; i++) { 
        var item= node.children[i];
        if(i>0) {
          if(i>1) {
            wr.out(" " + op.vref + " ",false);
          }
          ctx.setInExpr();
          this.WalkNode(item,ctx,wr);
          ctx.unsetInExpr();
        }
      }
      if((ctx.expressionLevel())>1) {
        wr.out(")",false);
      }
      this.shouldBeType("boolean",firstChild,ctx,"Logical operator expects boolean as the first parameter.");
      for( var i_1= 0; i_1< node.children.length; i_1++) { 
        var ch= node.children[i_1];
        if(i_1>1) {
          this.shouldBeEqualTypes(firstChild,ch,ctx,"Logic operator expects boolean arguments.");
        }
      }
    }}
    ,
    { key: "cmdPlusOp", value: function cmdPlusOp(node, ctx, wr) { 
      var op = node.getFirst();
      if((ctx.expressionLevel())>1) {
        wr.out("(",false);
      }
      for( var i= 0; i< node.children.length; i++) { 
        var item= node.children[i];
        if(i>0) {
          if(i>1) {
            wr.out(" " + op.vref + " ",false);
          }
          ctx.setInExpr();
          this.WalkNode(item,ctx,wr);
          ctx.unsetInExpr();
        }
      }
      if((ctx.expressionLevel())>1) {
        wr.out(")",false);
      }
    }}
    ,
    { key: "cmdNumericOp", value: function cmdNumericOp(node, ctx, wr) { 
      var op = node.getFirst();
      if((ctx.expressionLevel())>1) {
        wr.out("(",false);
      }
      for( var i= 0; i< node.children.length; i++) { 
        var item= node.children[i];
        if(i>0) {
          if(i>1) {
            wr.out(" " + op.vref + " ",false);
          }
          ctx.setInExpr();
          this.WalkNode(item,ctx,wr);
          ctx.unsetInExpr();
          this.shouldBeNumeric(item,ctx,"Operator " + op.vref + "expects numberic arguments");
        }
      }
      if((ctx.expressionLevel())>1) {
        wr.out(")",false);
      }
    }}
    ,
    { key: "cmdIf", value: function cmdIf(node, ctx, wr) { 
      wr.newline();
      var n1 = node.getSecond();
      var n2 = node.getThird();
      wr.out("if(",false);
      ctx.setInExpr();
      this.WalkNode(n1,ctx,wr);
      ctx.unsetInExpr();
      wr.out(") {",true);
      wr.indent(1);
      this.shouldBeExpression(n2,ctx,"The second parameter of if statement should be expression");
      this.WalkNode(n2,ctx,wr);
      wr.newline();
      wr.indent(-1);
      if(node.children.length>3) {
        var elseb = node.children[3];
        wr.out("} else {",true);
        wr.indent(1);
        this.WalkNode(elseb,ctx,wr);
        wr.newline();
        wr.indent(-1);
      }
      wr.out("}",true);
      this.shouldBeType("boolean",n1,ctx,"if expects a boolean as the first parameter.");
    }}
    ,
    { key: "cmdFor", value: function cmdFor(node, ctx, wr) { 
      wr.newline();
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
      subCtx.defineVariable(p.name,p);
      var p2 = new RangerAppParamDesc();
      p2.name = nodeField.vref;
      p2.value_type = nodeField.value_type;
      p2.node = nodeField;
      p2.nameNode = nodeField;
      p2.is_optional = false;
      subCtx.defineVariable(p2.name,p2);
      wr.out("for( var ",false);
      this.WalkNode(indexField,subCtx,wr);
      wr.out("= 0; ",false);
      this.WalkNode(indexField,subCtx,wr);
      wr.out("< ",false);
      this.WriteVRef(listField,ctx,wr);
      wr.out(".length; ",false);
      this.WalkNode(indexField,subCtx,wr);
      wr.out("++) { ",true);
      wr.indent(1);
      wr.out("var ",false);
      this.WalkNode(nodeField,subCtx,wr);
      wr.out("= ",false);
      this.WriteVRef(listField,ctx,wr);
      wr.out("[",false);
      this.WalkNode(indexField,subCtx,wr);
      wr.out("];",true);
      this.WalkNode(loopField,subCtx,wr);
      wr.newline();
      wr.indent(-1);
      wr.out("}",true);
      this.shouldBeExpression(loopField,ctx,"For loop requires expression to evaluate.");
    }}
    ,
    { key: "cmdWhile", value: function cmdWhile(node, ctx, wr) { 
      wr.newline();
      var n1 = node.getSecond();
      var n2 = node.getThird();
      wr.out("while(",false);
      ctx.setInExpr();
      this.WalkNode(n1,ctx,wr);
      ctx.unsetInExpr();
      wr.out(") {",true);
      wr.indent(1);
      this.WalkNode(n2,ctx,wr);
      wr.newline();
      wr.indent(-1);
      wr.out("}",true);
      this.shouldBeType("boolean",n1,ctx,"while expects a string as the first parameter.");
    }}
    ,
    { key: "cmdDefault", value: function cmdDefault(node, ctx, wr) { 
      wr.newline();
      var n1 = node.getSecond();
      wr.out("default: ",true);
      wr.indent(1);
      this.WalkNode(n1,ctx,wr);
      wr.newline();
      wr.out("break;",true);
      wr.indent(-1);
    }}
    ,
    { key: "cmdCase", value: function cmdCase(node, ctx, wr) { 
      wr.newline();
      var n1 = node.getSecond();
      var n2 = node.getThird();
      if(n1.expression) {
        for( var i= 0; i< n1.children.length; i++) { 
          var item= n1.children[i];
          wr.out("case ",false);
          ctx.setInExpr();
          this.WalkNode(item,ctx,wr);
          this.shouldBeEqualTypes(item,n1.children[0],ctx,"case statement expects arguments to be of the same type.");
          node.eval_type = item.eval_type;
          node.eval_type_name = item.eval_type_name;
          ctx.unsetInExpr();
          wr.out(":",true);
        }
      } else {
        wr.out("case ",false);
        ctx.setInExpr();
        this.WalkNode(n1,ctx,wr);
        node.eval_type = n1.eval_type;
        node.eval_type_name = n1.eval_type_name;
        ctx.unsetInExpr();
        wr.out(":",true);
      }
      wr.indent(1);
      this.WalkNode(n2,ctx,wr);
      wr.newline();
      wr.out("break;",true);
      wr.indent(-1);
    }}
    ,
    { key: "cmdSwitch", value: function cmdSwitch(node, ctx, wr) { 
      wr.newline();
      var n1 = node.getSecond();
      wr.out("switch(",false);
      ctx.setInExpr();
      this.WalkNode(n1,ctx,wr);
      ctx.unsetInExpr();
      wr.out(") {",true);
      wr.indent(1);
      for( var i= 0; i< node.children.length; i++) { 
        var cItem= node.children[i];
        if(i>=2) {
          this.WalkNode(cItem,ctx,wr);
          this.shouldBeEqualTypes(cItem,n1,ctx,"switch statement expects argument and case have same type.");
        }
      }
      wr.newline();
      wr.indent(-1);
      wr.out("}",true);
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
    { key: "PublicMethod", value: function PublicMethod(node, ctx, wr) { 
    }}
    ,
    { key: "StaticMethod", value: function StaticMethod(node, ctx, wr) { 
    }}
    ,
    { key: "WriteComment", value: function WriteComment(node, ctx, wr) { 
    }}
    ,
    { key: "EnterTemplateClass", value: function EnterTemplateClass(node, ctx, wr) { 
      console.log("at template class");
      var nameNode = node.children[1];
      ctx.log(node,"memory4","[entering Template class node definition " + nameNode.vref + "]");
    }}
    ,
    { key: "EnterClass", value: function EnterClass(node, ctx, wr) { 
      var cn = node.children[1];
      var desc = ctx.findClass(cn.vref);
      var subCtx = ctx.fork();
      var classWriter = ctx.getFileWriter(".","classdoc.md");
      classWriter.out("# " + cn.vref,true);
      if(cn.has_vref_annotation) {
        ctx.log(node,"ann","EnterClass Found annotated reference ");
        var ann = cn.vref_annotation;
        if(ann.children.length>0) {
          var fc = ann.children[0];
          ctx.log(node,"ann","value of first " + fc.vref);
        }
      }
      subCtx.currentClass = desc;
      for( var i= 0; i< desc.variables.length; i++) { 
        var p= desc.variables[i];
        subCtx.defineVariable(p.name,p);
      }
      this.CreateClass(node,subCtx,wr);
    }}
    ,
    { key: "EnterMethod", value: function EnterMethod(node, ctx, wr) { 
      this.shouldHaveChildCnt(4,node,ctx,"Method expexts four arguments");
      var cn = node.children[1];
      var fnBody = node.children[3];
      var desc = ctx.getCurrentClass();
      var classWriter = ctx.getFileWriter(".","classdoc.md");
      classWriter.out(" - **" + cn.vref + "** (",false);
      var subCtx = ctx.fork();
      subCtx.is_function = true;
      var m = desc.findMethod(cn.vref);
      subCtx.currentMethod = m;
      for( var i= 0; i< m.params.length; i++) { 
        var v= m.params[i];
        subCtx.defineVariable(v.name,v);
        classWriter.out("*" + v.name + "* ",false);
      }
      classWriter.out(") : " + cn.type_name + " ",true);
      this.PublicMethod(node,subCtx,wr);
    }}
    ,
    { key: "EnterStaticMethod", value: function EnterStaticMethod(node, ctx, wr) { 
      this.shouldHaveChildCnt(4,node,ctx,"StaticMethod expexts four arguments");
      var cn = node.children[1];
      var fnBody = node.children[3];
      var desc = ctx.getCurrentClass();
      ctx.log(node,"memory4","[creating static method " + cn.vref + "]");
      var subCtx = ctx.fork();
      subCtx.is_function = true;
      var m = desc.findStaticMethod(cn.vref);
      subCtx.currentMethod = m;
      for( var i= 0; i< m.params.length; i++) { 
        var v= m.params[i];
        subCtx.defineVariable(v.name,v);
      }
      this.StaticMethod(node,subCtx,wr);
    }}
    ,
    { key: "EnterVarDef", value: function EnterVarDef(node, ctx, wr) { 
      if(ctx.isInMethod()) {
        var cn = node.children[1];
        var desc = ctx.getCurrentClass();
        var p = new RangerAppParamDesc();
        p.name = cn.vref;
        p.value_type = cn.value_type;
        p.node = node;
        p.nameNode = cn;
        p.varType = 5;
        if(cn.has_vref_annotation) {
          ctx.log(node,"ann","At a variable -> Found has_vref_annotation annotated reference ");
          var ann = cn.vref_annotation;
          if(ann.children.length>0) {
            var fc = ann.children[0];
            ctx.log(node,"ann","value of first annotation " + fc.vref + " and variable name " + cn.vref);
          }
        }
        if(cn.has_type_annotation) {
          ctx.log(node,"ann","At a variable -> Found annotated reference ");
          var ann_1 = cn.type_annotation;
          if(ann_1.children.length>0) {
            var fc_1 = ann_1.children[0];
            ctx.log(node,"ann","value of first annotation " + fc_1.vref + " and variable name " + cn.vref);
          }
        }
        cn.hasParamDesc = true;
        cn.paramDesc = p;
        cn.eval_type = cn.value_type;
        cn.eval_type_name = cn.type_name;
        if(node.children.length>2) {
          p.set_cnt = 1;
          p.def_value = node.children[2];
          p.is_optional = false;
        } else {
          p.is_optional = true;
        }
        ctx.defineVariable(p.name,p);
        this.DefineVar(node,ctx,wr);
        if(node.children.length>2) {
          this.shouldBeEqualTypes(cn,p.def_value,ctx,"Variable was assigned an incompatible type.");
          var valueNode = p.def_value;
          if(valueNode.ownedInstances.length>0) {
            node.getInstancesFrom(valueNode);
          }
        }
        RangerAllocations.EnterVarDef(node,ctx,wr);
      } else {
        var cn_1 = node.children[1];
        cn_1.eval_type = cn_1.value_type;
        cn_1.eval_type_name = cn_1.type_name;
        this.DefineVar(node,ctx,wr);
        if(node.children.length>2) {
          this.shouldBeEqualTypes(node.children[1],node.children[2],ctx,"Variable was assigned an incompatible type.");
        }
      }
    }}
    ,
    { key: "WalkNodeChildren", value: function WalkNodeChildren(node, ctx, wr) { 
      if(node.hasStringProperty("todo")) {
        ctx.addTodo(node,node.getStringProperty("todo"));
      }
      if(node.expression) {
        for( var i= 0; i< node.children.length; i++) { 
          var item= node.children[i];
          this.WalkNode(item,ctx,wr);
        }
      }
    }}
    ,
    { key: "WalkNode", value: function WalkNode(node, ctx, wr) { 
      if(node == null ) {
        return false;
      }
      if(node.hasStringProperty("todo")) {
        ctx.addTodo(node,node.getStringProperty("todo"));
      }
      if(node.isPrimitive()) {
        this.WriteScalarValue(node,ctx,wr);
        return true;
      }
      if(node.value_type==8) {
        this.WriteVRef(node,ctx,wr);
        return true;
      }
      if(node.value_type==9) {
        this.WriteComment(node,ctx,wr);
        return true;
      }
      if(node.isFirstVref("Extends")) {
        return true;
      }
      if(node.isFirstVref("Import")) {
        this.cmdImport(node,ctx,wr);
        return true;
      }
      if(node.isFirstVref("def")) {
        this.EnterVarDef(node,ctx,wr);
        return true;
      }
      if(node.isFirstVref("let")) {
        this.EnterVarDef(node,ctx,wr);
        return true;
      }
      if(node.isFirstVref("TemplateClass")) {
        this.EnterTemplateClass(node,ctx,wr);
        return true;
      }
      if(node.isFirstVref("CreateClass")) {
        this.EnterClass(node,ctx,wr);
        return true;
      }
      if(node.isFirstVref("class")) {
        this.EnterClass(node,ctx,wr);
        return true;
      }
      if(node.isFirstVref("PublicMethod")) {
        this.EnterMethod(node,ctx,wr);
        return true;
      }
      if(node.isFirstVref("StaticMethod")) {
        this.EnterStaticMethod(node,ctx,wr);
        return true;
      }
      if(node.isFirstVref("fn")) {
        this.EnterMethod(node,ctx,wr);
        return true;
      }
      if(node.isFirstVref("sfn")) {
        this.EnterStaticMethod(node,ctx,wr);
        return true;
      }
      if(node.isFirstVref("Constructor")) {
        this.Constructor(node,ctx,wr);
        return true;
      }
      if(node.children.length>0) {
        var fc = node.children[0];
        if((fc != null ) && (fc.value_type==8)) {
          var was_called = true;
          switch(fc.vref) {
            case "Enum":
              this.cmdEnum(node,ctx,wr);
              break;
            case "if":
              this.cmdIf(node,ctx,wr);
              break;
            case "while":
              this.cmdWhile(node,ctx,wr);
              break;
            case "for":
              this.cmdFor(node,ctx,wr);
              break;
            case "break":
              this.cmdBreak(node,ctx,wr);
              break;
            case "continue":
              this.cmdContinue(node,ctx,wr);
              break;
            case "dbglog":
              this.cmdLog(node,ctx,wr);
              break;
            case "throw":
              this.cmdThrow(node,ctx,wr);
              break;
            case "switch":
              this.cmdSwitch(node,ctx,wr);
              break;
            case "case":
              this.cmdCase(node,ctx,wr);
              break;
            case "default":
              this.cmdDefault(node,ctx,wr);
              break;
            case "return":
              this.cmdReturn(node,ctx,wr);
              break;
            case "call":
              this.cmdCall(node,ctx,wr);
              break;
            case "new":
              this.cmdNew(node,ctx,wr);
              break;
            case "doc":
              this.cmdDoc(node,ctx,wr);
              break;
            case "gitdoc":
              this.cmdGitDoc(node,ctx,wr);
              break;
            case "print":
              this.cmdPrint(node,ctx,wr);
              break;
            case "has":
              this.cmdHas(node,ctx,wr);
              break;
            case "get":
              this.cmdGet(node,ctx,wr);
              break;
            case "set":
              this.cmdSet(node,ctx,wr);
              break;
            case "null?":
              this.cmdIsNull(node,ctx,wr);
              break;
            case "!null?":
              this.cmdNotNull(node,ctx,wr);
              break;
            case "trim":
              this.cmdTrim(node,ctx,wr);
              break;
            case "join":
              this.cmdJoin(node,ctx,wr);
              break;
            case "strsplit":
              this.cmdSplit(node,ctx,wr);
              break;
            case "strlen":
              this.cmdStrlen(node,ctx,wr);
              break;
            case "charAt":
              this.cmdCharAt(node,ctx,wr);
              break;
            case "substring":
              this.cmdSubstring(node,ctx,wr);
              break;
            case "charcode":
              this.cmdCharcode(node,ctx,wr);
              break;
            case "strfromcode":
              this.cmdStrfromcode(node,ctx,wr);
              break;
            case "double2str":
              this.cmdDouble2Str(node,ctx,wr);
              break;
            case "str2int":
              this.cmdStr2Int(node,ctx,wr);
              break;
            case "str2double":
              this.cmdStr2Double(node,ctx,wr);
              break;
            case "array_length":
              this.cmdArrayLength(node,ctx,wr);
              break;
            case "array_extract":
              this.cmdExtractArray(node,ctx,wr);
              break;
            case "itemAt":
              this.cmdItemAt(node,ctx,wr);
              break;
            case "indexOf":
              this.cmdIndexOf(node,ctx,wr);
              break;
            case "remove_index":
              this.cmdRemoveIndex(node,ctx,wr);
              break;
            case "push":
              this.cmdPush(node,ctx,wr);
              break;
            case "removeLast":
              this.cmdRemoveLast(node,ctx,wr);
              break;
            case "shell_arg_cnt":
              this.cmdArgvCnt(node,ctx,wr);
              break;
            case "shell_arg":
              this.cmdArgv(node,ctx,wr);
              break;
            case "file_read":
              this.cmdFileRead(node,ctx,wr);
              break;
            case "file_write":
              this.cmdFileWrite(node,ctx,wr);
              break;
            case "file_exists":
              this.cmdIsFile(node,ctx,wr);
              break;
            case "dir_exists":
              this.cmdIsDir(node,ctx,wr);
              break;
            case "dir_create":
              this.cmdCreateDir(node,ctx,wr);
              break;
            case "+":
              this.cmdPlusOp(node,ctx,wr);
              break;
            case "=":
              this.cmdAssign(node,ctx,wr);
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
              this.cmdMathLibOp(node,ctx,wr);
              break;
            case "==":
            case "<":
            case ">":
            case "!=":
            case ">=":
            case "<=":
              this.cmdComparisionOp(node,ctx,wr);
              break;
            case "&&":
            case "||":
              this.cmdLogicOp(node,ctx,wr);
              break;
            case "*":
            case "-":
            case "\/":
            case "%":
              this.cmdNumericOp(node,ctx,wr);
              break;
            default: 
              was_called = false;
              break;
          }
          if(was_called) {
            return true;
          }
          if(node.children.length>1) {
            if(this.cmdLocalCall(node,ctx,wr)) {
              return true;
            }
          } else {
          }
        }
      }
      if(node.expression) {
        for( var i= 0; i< node.children.length; i++) { 
          var item= node.children[i];
          this.WalkNode(item,ctx,wr);
        }
      }
    }}
    ,
    { key: "StartCodeWriting", value: function StartCodeWriting(node, ctx, wr) { 
      this.FindWeakRefs(node,ctx,wr);
      this.WalkNode(node,ctx,wr);
      var lang = this.getWriterLang();
      if(node.hasStringProperty(lang)) {
        wr.newline();
        wr.out(node.getStringProperty(lang),true);
      }
    }}
    ,
    { key: "FindWeakRefs", value: function FindWeakRefs(node, ctx, wr) { 
      var list = ctx.getClasses();
      for( var i= 0; i< list.length; i++) { 
        var classDesc= list[i];
        for( var i2= 0; i2< classDesc.variables.length; i2++) { 
          var varD= classDesc.variables[i2];
          if(varD.refType==1) {
            if(varD.isArray()) {
              var nn = varD.nameNode;
            }
            if(varD.isHash()) {
              var nn_1 = varD.nameNode;
            }
            if(varD.isObject()) {
              var nn_2 = varD.nameNode;
            }
          }
        }
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
          currC.addParentClass(ee.vref);
        }
      }
      if(node.isFirstVref("Constructor")) {
        var currC_1 = ctx.currentClass;
        currC_1.has_constructor = true;
        currC_1.constructor_node = node;
        var m = new RangerAppFunctionDesc();
        m.name = "Constructor";
        m.node = node;
        m.nameNode = node.children[0];
        var args = node.children[1];
        for( var ii_1= 0; ii_1< args.children.length; ii_1++) { 
          var arg= args.children[ii_1];
          var p = new RangerAppParamDesc();
          p.name = arg.vref;
          p.value_type = arg.value_type;
          p.node = arg;
          p.nameNode = arg;
          p.refType = 1;
          p.varType = 4;
          arg.hasParamDesc = true;
          arg.paramDesc = p;
          arg.eval_type = arg.value_type;
          arg.eval_type_name = arg.type_name;
          m.params.push(p);
        }
        currC_1.constructor_fn = m;
      }
      if((node.isFirstVref("CreateClass")) || (node.isFirstVref("class"))) {
        var s = node.getVRefAt(1);
        var new_class = new RangerAppClassDesc();
        new_class.name = s;
        ctx.currentClass = new_class;
        new_class.ctx = ctx;
        ctx.addClass(s,new_class);
      }
      if(node.isFirstVref("TemplateClass")) {
        var s_1 = node.getVRefAt(1);
        ctx.addTemplateClass(s_1,node);
        find_more = false;
      }
      if((node.isFirstVref("def")) || (node.isFirstVref("let"))) {
        var s_2 = node.getVRefAt(1);
        var vDef = node.children[1];
        var p_1 = new RangerAppParamDesc();
        p_1.name = s_2;
        p_1.value_type = vDef.value_type;
        p_1.node = node;
        p_1.is_class_variable = true;
        p_1.varType = 8;
        p_1.nameNode = vDef;
        vDef.hasParamDesc = true;
        vDef.paramDesc = p_1;
        if(node.hasBooleanProperty("weak")) {
          p_1.refType = 1;
        } else {
          p_1.refType = 2;
        }
        if(node.children.length>2) {
          p_1.set_cnt = 1;
          p_1.def_value = node.children[2];
          p_1.is_optional = false;
        } else {
          p_1.is_optional = true;
        }
        var currC_2 = ctx.currentClass;
        currC_2.addVariable(p_1);
      }
      if((node.isFirstVref("StaticMethod")) || (node.isFirstVref("sfn"))) {
        var s_3 = node.getVRefAt(1);
        var currC_3 = ctx.currentClass;
        var m_1 = new RangerAppFunctionDesc();
        m_1.name = s_3;
        m_1.node = node;
        m_1.is_static = true;
        m_1.nameNode = node.children[1];
        var args_1 = node.children[2];
        for( var ii_2= 0; ii_2< args_1.children.length; ii_2++) { 
          var arg_1= args_1.children[ii_2];
          var p_2 = new RangerAppParamDesc();
          p_2.name = arg_1.vref;
          p_2.value_type = arg_1.value_type;
          p_2.node = arg_1;
          p_2.nameNode = arg_1;
          p_2.refType = 1;
          p_2.varType = 4;
          arg_1.hasParamDesc = true;
          arg_1.paramDesc = p_2;
          arg_1.eval_type = arg_1.value_type;
          arg_1.eval_type_name = arg_1.type_name;
          m_1.params.push(p_2);
        }
        currC_3.addStaticMethod(m_1);
        find_more = false;
      }
      if((node.isFirstVref("PublicMethod")) || (node.isFirstVref("fn"))) {
        var s_4 = node.getVRefAt(1);
        var currC_4 = ctx.currentClass;
        var m_2 = new RangerAppFunctionDesc();
        m_2.name = s_4;
        m_2.node = node;
        m_2.nameNode = node.children[1];
        if(node.hasBooleanProperty("strong")) {
          m_2.refType = 2;
        } else {
          m_2.refType = 1;
        }
        var args_2 = node.children[2];
        for( var ii_3= 0; ii_3< args_2.children.length; ii_3++) { 
          var arg_2= args_2.children[ii_3];
          var p2 = new RangerAppParamDesc();
          p2.name = arg_2.vref;
          p2.value_type = arg_2.value_type;
          p2.node = arg_2;
          p2.nameNode = arg_2;
          p2.refType = 1;
          p2.initRefType = 1;
          p2.debugString = "--> collected ";
          if(args_2.hasBooleanProperty("strong")) {
            p2.debugString = "--> collected as STRONG";
            ctx.log(node,"memory5","strong param should move local ownership to call ***");
            p2.refType = 2;
            p2.initRefType = 2;
          }
          p2.varType = 4;
          arg_2.hasParamDesc = true;
          arg_2.paramDesc = p2;
          arg_2.eval_type = arg_2.value_type;
          arg_2.eval_type_name = arg_2.type_name;
          m_2.params.push(p2);
        }
        currC_4.addMethod(m_2);
        find_more = false;
      }
      if(find_more) {
        for( var i= 0; i< node.children.length; i++) { 
          var item= node.children[i];
          this.CollectMethods(item,ctx,wr);
        }
      }
    }}
    ,
    { key: "DefineVar", value: function DefineVar(node, ctx, wr) { 
      console.log("ERROR: DefineVar not implemented!");
    }}
  ], [
    
  ]);
  

return RangerCommonWriter;
}();
var RangerJavaScriptWriter = function( _RangerCommonWriter) {  _inherits(RangerJavaScriptWriter, _RangerCommonWriter);
  
  function RangerJavaScriptWriter() {
    _classCallCheck(this, RangerJavaScriptWriter);
    var _this = _possibleConstructorReturn(this, (RangerJavaScriptWriter.__proto__ || Object.getPrototypeOf(RangerJavaScriptWriter)).call(this));
    return _this;
  }
  
   _createClass(RangerJavaScriptWriter, [
    { key: "getWriterLang", value: function getWriterLang() { 
      return "JavaScript";
    }}
    ,
    { key: "cmdArgv", value: function cmdArgv(node, ctx, wr) { 
      var argIndex = node.getSecond();
      wr.out("process.argv[ 2 + process.execArgv.length + ",false);
      ctx.setInExpr();
      this.WalkNode(argIndex,ctx,wr);
      ctx.unsetInExpr();
      wr.out("]",false);
    }}
    ,
    { key: "cmdArgvCnt", value: function cmdArgvCnt(node, ctx, wr) { 
      wr.out("( process.argv.length - ( 2 + process.execArgv.length ) )",false);
    }}
    ,
    { key: "cmdFileRead", value: function cmdFileRead(node, ctx, wr) { 
      var pathName = node.getSecond();
      var fileName = node.getThird();
      wr.out("require(" + String.fromCharCode(34) + "fs" + String.fromCharCode(34) + ").readFileSync( process.cwd() + ",false);
      wr.out(String.fromCharCode(34) + "\/" + String.fromCharCode(34) + " + ",false);
      ctx.setInExpr();
      this.WalkNode(pathName,ctx,wr);
      wr.out(" + " + String.fromCharCode(34) + "\/" + String.fromCharCode(34) + " + ",false);
      this.WalkNode(fileName,ctx,wr);
      ctx.unsetInExpr();
      wr.out(", " + String.fromCharCode(34) + "utf8" + String.fromCharCode(34) + ")",false);
    }}
    ,
    { key: "cmdFileWrite", value: function cmdFileWrite(node, ctx, wr) { 
      var pathName = node.getSecond();
      var fileName = node.getThird();
      var dataToWrite = node.children[3];
      wr.newline();
      wr.out("require(" + String.fromCharCode(34) + "fs" + String.fromCharCode(34) + ").writeFileSync( process.cwd() + ",false);
      wr.out(String.fromCharCode(34) + "\/" + String.fromCharCode(34) + " + ",false);
      ctx.setInExpr();
      this.WalkNode(pathName,ctx,wr);
      wr.out(" + " + String.fromCharCode(34) + "\/" + String.fromCharCode(34) + " + ",false);
      this.WalkNode(fileName,ctx,wr);
      wr.out(", ",false);
      this.WalkNode(dataToWrite,ctx,wr);
      wr.out(");",true);
      ctx.unsetInExpr();
    }}
    ,
    { key: "cmdIsFile", value: function cmdIsFile(node, ctx, wr) { 
      var pathName = node.getSecond();
      var fileName = node.getThird();
      wr.out("require(" + String.fromCharCode(34) + "fs" + String.fromCharCode(34) + ").existsSync( process.cwd() + ",false);
      wr.out(String.fromCharCode(34) + "\/" + String.fromCharCode(34) + " + ",false);
      ctx.setInExpr();
      this.WalkNode(pathName,ctx,wr);
      wr.out(" + " + String.fromCharCode(34) + "\/" + String.fromCharCode(34) + " + ",false);
      this.WalkNode(fileName,ctx,wr);
      ctx.unsetInExpr();
      wr.out(")",false);
    }}
    ,
    { key: "cmdIsDir", value: function cmdIsDir(node, ctx, wr) { 
      var pathName = node.getSecond();
      wr.out("require(" + String.fromCharCode(34) + "fs" + String.fromCharCode(34) + ").existsSync( process.cwd() + ",false);
      wr.out(String.fromCharCode(34) + "\/" + String.fromCharCode(34) + " + ",false);
      ctx.setInExpr();
      this.WalkNode(pathName,ctx,wr);
      ctx.unsetInExpr();
      wr.out(")",false);
    }}
    ,
    { key: "cmdCreateDir", value: function cmdCreateDir(node, ctx, wr) { 
      var pathName = node.getSecond();
      wr.newline();
      wr.out("require(" + String.fromCharCode(34) + "fs" + String.fromCharCode(34) + ").mkdirSync( process.cwd() + ",false);
      wr.out(String.fromCharCode(34) + "\/" + String.fromCharCode(34) + " + ",false);
      ctx.setInExpr();
      this.WalkNode(pathName,ctx,wr);
      wr.out(");",true);
      ctx.unsetInExpr();
    }}
    ,
    { key: "PublicMethod", value: function PublicMethod(node, ctx, wr) { 
      var nameDef = node.getSecond();
      wr.newline();
      wr.out(nameDef.vref + "(",false);
      var args = node.getThird();
      for( var i= 0; i< args.children.length; i++) { 
        var arg= args.children[i];
        if(i>0) {
          wr.out(", ",false);
        }
        wr.out(arg.vref,false);
      }
      wr.out(") { ",true);
      ctx.setInMethod();
      wr.indent(1);
      var fnBody = node.children[3];
      var has_try_catch = false;
      var try_catch;
      if(fnBody.hasExpressionProperty("onError")) {
        try_catch = fnBody.getExpressionProperty("onError");
        wr.out("try {",true);
        wr.indent(1);
      }
      this.WalkNodeChildren(fnBody,ctx,wr);
      wr.newline();
      wr.indent(-1);
      if(fnBody.hasExpressionProperty("onError")) {
        wr.out("} catch(e) {",true);
        wr.indent(1);
        wr.out("console.log(e);",true);
        this.WalkNodeChildren(try_catch,ctx,wr);
        wr.indent(-1);
        wr.out("}",true);
        wr.indent(-1);
      }
      wr.out("}",true);
      ctx.unsetInMethod();
    }}
    ,
    { key: "CreateClass", value: function CreateClass(node, ctx, wr) { 
      var nameDef = node.getSecond();
      var classInfo = ctx.findClass(nameDef.vref);
      wr.newline();
      wr.out("class " + nameDef.vref + " ",false);
      var b_extended = false;
      if(classInfo.extends_classes.length>0) {
        wr.out(" extends ",false);
        b_extended = true;
        for( var i= 0; i< classInfo.extends_classes.length; i++) { 
          var pName= classInfo.extends_classes[i];
          if(i>0) {
            wr.out(",",false);
          }
          wr.out(pName,false);
        }
      }
      wr.out(" {",true);
      wr.indent(1);
      wr.out("",true);
      var cw = wr.createTag("constructor");
      cw.out("constructor(",false);
      if(classInfo.has_constructor) {
        var constr = classInfo.constructor_node;
        var cParams = constr.getSecond();
        for( var i_1= 0; i_1< cParams.children.length; i_1++) { 
          var param= cParams.children[i_1];
          if(i_1>0) {
            cw.out(", ",false);
          }
          cw.out(param.vref,false);
        }
      }
      cw.out(") {",true);
      cw.indent(1);
      if(b_extended) {
        cw.out("super()",true);
      }
      var fnBody = node.children[2];
      this.WalkNodeChildren(fnBody,ctx,wr);
      cw.indent(-1);
      cw.out("}",true);
      wr.indent(-1);
      wr.out("}",true);
    }}
    ,
    { key: "DefineVar", value: function DefineVar(node, ctx, wr) { 
      if(ctx.isInMethod()) {
        var v = node.getSecond();
        wr.out("var " + v.vref,false);
        if(node.children.length>2) {
          wr.out(" = ",false);
          ctx.setInExpr();
          this.WalkNode(node.getThird(),ctx,wr);
          ctx.unsetInExpr();
        } else {
          switch(v.value_type) {
            case 6:
              wr.out(" = {}",false);
              break;
            case 5:
              wr.out(" = []",false);
              break;
            default: 
              wr.out("",false);
              break;
          }
        }
        wr.out(";",true);
      } else {
        var cw = wr.getTag("constructor");
        var v_1 = node.getSecond();
        cw.out("this." + v_1.vref,false);
        if(node.children.length>2) {
          cw.out(" = ",false);
          ctx.setInExpr();
          this.WalkNode(node.getThird(),ctx,cw);
          ctx.unsetInExpr();
        } else {
          switch(v_1.value_type) {
            case 6:
              cw.out(" = {}",false);
              break;
            case 5:
              cw.out(" = []",false);
              break;
            default: 
              cw.out(" = undefined",false);
              break;
          }
        }
        cw.out(";",true);
      }
    }}
  ], [
    
  ]);
  

return RangerJavaScriptWriter;
}(RangerCommonWriter);
var RangerJava7Writer = function( _RangerCommonWriter) {  _inherits(RangerJava7Writer, _RangerCommonWriter);
  
  function RangerJava7Writer() {
    _classCallCheck(this, RangerJava7Writer);
    var _this = _possibleConstructorReturn(this, (RangerJava7Writer.__proto__ || Object.getPrototypeOf(RangerJava7Writer)).call(this));
    return _this;
  }
  
   _createClass(RangerJava7Writer, [
    { key: "getWriterLang", value: function getWriterLang() { 
      return "Java7";
    }}
    ,
    { key: "getCmdName", value: function getCmdName(cmd) { 
      switch(cmd) {
        case "push":
          return "add";
          break;
        default: 
          return cmd;
          break;
      }
    }}
    ,
    { key: "cmdItemAt", value: function cmdItemAt(node, ctx, wr) { 
      var obj = node.getSecond();
      var index = node.getThird();
      ctx.setInExpr();
      this.WalkNode(obj,ctx,wr);
      wr.out(".get(",false);
      this.WalkNode(index,ctx,wr);
      ctx.unsetInExpr();
      wr.out(")",false);
      this.shouldBeArray(obj,ctx,"itemAt expects an array as the first parameter.");
      this.shouldBeType("int",index,ctx,"charAt expects an interger as the second parameter.");
    }}
    ,
    { key: "cmdRemoveLast", value: function cmdRemoveLast(node, ctx, wr) { 
      var obj = node.getSecond();
      var index = node.getThird();
      ctx.setInExpr();
      this.WalkNode(obj,ctx,wr);
      wr.out(".remove(",false);
      this.WalkNode(obj,ctx,wr);
      wr.out(".size() - 1",false);
      ctx.unsetInExpr();
      wr.out(")",false);
      this.shouldBeArray(obj,ctx,"itemAt expects an array as the first parameter.");
      this.shouldBeType("int",index,ctx,"charAt expects an interger as the second parameter.");
    }}
    ,
    { key: "mathLibCalled", value: function mathLibCalled(node, ctx, wr) { 
      wr.addImport("java.lang.Math");
    }}
    ,
    { key: "cmdPrint", value: function cmdPrint(node, ctx, wr) { 
      wr.addImport("java.io.*");
      var n1 = node.getSecond();
      wr.newline();
      wr.out("System.out.println(String.valueOf(",false);
      ctx.setInExpr();
      this.WalkNode(n1,ctx,wr);
      ctx.unsetInExpr();
      wr.out("));",true);
      this.shouldBeType("string",n1,ctx,"print expects a string as the first parameter.");
    }}
    ,
    { key: "cmdFor", value: function cmdFor(node, ctx, wr) { 
      wr.newline();
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
      subCtx.defineVariable(p.name,p);
      var p2 = new RangerAppParamDesc();
      p2.name = nodeField.vref;
      p2.value_type = nodeField.value_type;
      p2.node = nodeField;
      p2.nameNode = nodeField;
      p2.is_optional = false;
      subCtx.defineVariable(p2.name,p2);
      wr.out("for( int ",false);
      this.WalkNode(indexField,subCtx,wr);
      wr.out("= 0; ",false);
      this.WalkNode(indexField,subCtx,wr);
      wr.out("< ",false);
      this.WriteVRef(listField,ctx,wr);
      wr.out(".size(); ",false);
      this.WalkNode(indexField,subCtx,wr);
      wr.out("++) { ",true);
      wr.indent(1);
      wr.out("\/\/ FIX the TYPE names here",true);
      wr.out(nodeField.type_name,false);
      wr.out(" ",false);
      this.WalkNode(nodeField,subCtx,wr);
      wr.out(" = ",false);
      this.WriteVRef(listField,ctx,wr);
      wr.out(".get(",false);
      this.WalkNode(indexField,subCtx,wr);
      wr.out(");",true);
      this.WalkNode(loopField,subCtx,wr);
      wr.newline();
      wr.indent(-1);
      wr.out("}",true);
      this.shouldBeExpression(loopField,ctx,"For loop requires expression to evaluate.");
    }}
    ,
    { key: "cmdArrayLength", value: function cmdArrayLength(node, ctx, wr) { 
      var n1 = node.getSecond();
      ctx.setInExpr();
      this.WalkNode(n1,ctx,wr);
      ctx.unsetInExpr();
      wr.out(".size()",false);
      node.eval_type = 2;
      node.eval_type_name = "int";
    }}
    ,
    { key: "cmdStrlen", value: function cmdStrlen(node, ctx, wr) { 
      var n1 = node.getSecond();
      ctx.setInExpr();
      this.WalkNode(n1,ctx,wr);
      ctx.unsetInExpr();
      wr.out(".length()",false);
      this.shouldBeType("string",n1,ctx,"strlen expects a string as the first parameter.");
    }}
    ,
    { key: "cmdHas", value: function cmdHas(node, ctx, wr) { 
      var obj = node.getSecond();
      var key = node.getThird();
      if((ctx.expressionLevel())>1) {
        wr.out("(",false);
      }
      ctx.setInExpr();
      this.WalkNode(obj,ctx,wr);
      wr.out(".containsKey(",false);
      this.WalkNode(key,ctx,wr);
      wr.out(")",false);
      ctx.unsetInExpr();
      if((ctx.expressionLevel())>1) {
        wr.out(")",false);
      }
      this.shouldBeType("string",key,ctx,"has expects a string as the second parameter.");
    }}
    ,
    { key: "cmdSet", value: function cmdSet(node, ctx, wr) { 
      var obj = node.getSecond();
      var key = node.getThird();
      var value = node.children[3];
      wr.newline();
      ctx.setInExpr();
      this.WalkNode(obj,ctx,wr);
      wr.out(".put(",false);
      this.WalkNode(key,ctx,wr);
      wr.out(",",false);
      this.WalkNode(value,ctx,wr);
      ctx.unsetInExpr();
      wr.out(");",true);
      RangerAllocations.moveOwnership(obj,value,ctx,wr);
    }}
    ,
    { key: "cmdGet", value: function cmdGet(node, ctx, wr) { 
      var obj = node.getSecond();
      var key = node.getThird();
      if((ctx.expressionLevel())>1) {
        wr.out("(",false);
      }
      ctx.setInExpr();
      this.WalkNode(obj,ctx,wr);
      wr.out(".get(",false);
      this.WalkNode(key,ctx,wr);
      wr.out(")",false);
      ctx.unsetInExpr();
      if((ctx.expressionLevel())>1) {
        wr.out(")",false);
      }
    }}
    ,
    { key: "cmdArgv", value: function cmdArgv(node, ctx, wr) { 
      wr.out("RangerIO.readArg()",false);
    }}
    ,
    { key: "cmdArgvCnt", value: function cmdArgvCnt(node, ctx, wr) { 
      wr.out("RangerIO.argCount()",false);
    }}
    ,
    { key: "cmdFileRead", value: function cmdFileRead(node, ctx, wr) { 
      wr.out("RangerIO.ReadFile()",false);
    }}
    ,
    { key: "cmdFileWrite", value: function cmdFileWrite(node, ctx, wr) { 
      wr.out("RangerIO.FileWrite()",false);
    }}
    ,
    { key: "cmdIsFile", value: function cmdIsFile(node, ctx, wr) { 
      wr.out("RangerIO.IsFile()",false);
    }}
    ,
    { key: "cmdIsDir", value: function cmdIsDir(node, ctx, wr) { 
      wr.out("RangerIO.IsDir()",false);
    }}
    ,
    { key: "cmdCreateDir", value: function cmdCreateDir(node, ctx, wr) { 
      wr.out("RangerIO.CreateDir()",false);
    }}
    ,
    { key: "PublicMethod", value: function PublicMethod(node, ctx, wr) { 
      var nameDef = node.getSecond();
      wr.newline();
      wr.out(nameDef.vref + "(",false);
      var args = node.getThird();
      for( var i= 0; i< args.children.length; i++) { 
        var arg= args.children[i];
        if(i>0) {
          wr.out(", ",false);
        }
        wr.out(arg.vref,false);
      }
      wr.out(") { ",true);
      ctx.setInMethod();
      wr.indent(1);
      var fnBody = node.children[3];
      var has_try_catch = false;
      var try_catch;
      if(fnBody.hasExpressionProperty("onError")) {
        try_catch = fnBody.getExpressionProperty("onError");
        wr.out("try {",true);
        wr.indent(1);
      }
      this.WalkNodeChildren(fnBody,ctx,wr);
      wr.newline();
      wr.indent(-1);
      if(fnBody.hasExpressionProperty("onError")) {
        wr.out("} catch( Exception e ) {",true);
        wr.indent(1);
        this.WalkNodeChildren(try_catch,ctx,wr);
        wr.indent(-1);
        wr.out("}",true);
        wr.indent(-1);
      }
      wr.out("}",true);
      ctx.unsetInMethod();
    }}
    ,
    { key: "CreateClass", value: function CreateClass(node, ctx, inputWriter) { 
      var nameDef = node.getSecond();
      var classInfo = ctx.findClass(nameDef.vref);
      var wr = ctx.getFileWriter(".",(nameDef.vref + ".java"));
      var importFork = wr.fork();
      wr.newline();
      wr.out("class " + nameDef.vref + " ",false);
      var b_extended = false;
      if(classInfo.extends_classes.length>0) {
        wr.out(" extends ",false);
        b_extended = true;
        for( var i= 0; i< classInfo.extends_classes.length; i++) { 
          var pName= classInfo.extends_classes[i];
          if(i>0) {
            wr.out(",",false);
          }
          wr.out(pName,false);
        }
      }
      wr.out(" {",true);
      wr.indent(1);
      wr.out("",true);
      var cw = wr.createTag("constructor");
      cw.out("public " + nameDef.vref + "(",false);
      if(classInfo.has_constructor) {
        var constr = classInfo.constructor_node;
        var cParams = constr.getSecond();
        for( var i_1= 0; i_1< cParams.children.length; i_1++) { 
          var param= cParams.children[i_1];
          if(i_1>0) {
            cw.out(", ",false);
          }
          cw.out(param.vref,false);
        }
      }
      cw.out(") {",true);
      cw.indent(1);
      if(b_extended) {
        cw.out("super()",true);
      }
      var fnBody = node.children[2];
      this.WalkNodeChildren(fnBody,ctx,wr);
      cw.indent(-1);
      cw.out("}",true);
      wr.indent(-1);
      wr.out("}",true);
      var import_list = wr.getImports();
      for( var i_2= 0; i_2< import_list.length; i_2++) { 
        var codeStr= import_list[i_2];
        importFork.out("import " + codeStr + ";",true);
      }
    }}
    ,
    { key: "DefineVar", value: function DefineVar(node, ctx, wr) { 
      if(ctx.isInMethod()) {
        var v = node.getSecond();
        wr.out("var " + v.vref,false);
        if(node.children.length>2) {
          wr.out(" = ",false);
          ctx.setInExpr();
          this.WalkNode(node.getThird(),ctx,wr);
          ctx.unsetInExpr();
        } else {
          switch(v.value_type) {
            case 6:
              wr.out(" = {}",false);
              break;
            case 5:
              wr.out(" = []",false);
              break;
            default: 
              wr.out("",false);
              break;
          }
        }
        wr.out(";",true);
      } else {
        var cw = wr.getTag("constructor");
        var v_1 = node.getSecond();
        cw.out("this." + v_1.vref,false);
        if(node.children.length>2) {
          cw.out(" = ",false);
          ctx.setInExpr();
          this.WalkNode(node.getThird(),ctx,cw);
          ctx.unsetInExpr();
        } else {
          switch(v_1.value_type) {
            case 6:
              cw.out(" = {}",false);
              break;
            case 5:
              cw.out(" = []",false);
              break;
            default: 
              cw.out(" = undefined",false);
              break;
          }
        }
        cw.out(";",true);
      }
    }}
  ], [
    
  ]);
  

return RangerJava7Writer;
}(RangerCommonWriter);
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
      wr.out("process.argv[ 2 + process.execArgv.length + ",false);
      ctx.setInExpr();
      this.WalkNode(argIndex,ctx,wr);
      ctx.unsetInExpr();
      wr.out("]",false);
    }}
    ,
    { key: "cmdArgvCnt", value: function cmdArgvCnt(node, ctx, wr) { 
      wr.out("( process.argv.length - ( 2 + process.execArgv.length ) )",false);
    }}
    ,
    { key: "cmdFileRead", value: function cmdFileRead(node, ctx, wr) { 
      var pathName = node.getSecond();
      var fileName = node.getThird();
      wr.out("require(" + String.fromCharCode(34) + "fs" + String.fromCharCode(34) + ").readFileSync( process.cwd() + ",false);
      wr.out(String.fromCharCode(34) + "\/" + String.fromCharCode(34) + " + ",false);
      ctx.setInExpr();
      this.WalkNode(pathName,ctx,wr);
      wr.out(" + " + String.fromCharCode(34) + "\/" + String.fromCharCode(34) + " + ",false);
      this.WalkNode(fileName,ctx,wr);
      ctx.unsetInExpr();
      wr.out(", " + String.fromCharCode(34) + "utf8" + String.fromCharCode(34) + ")",false);
    }}
    ,
    { key: "cmdFileWrite", value: function cmdFileWrite(node, ctx, wr) { 
      var pathName = node.getSecond();
      var fileName = node.getThird();
      var dataToWrite = node.children[3];
      wr.newline();
      wr.out("require(" + String.fromCharCode(34) + "fs" + String.fromCharCode(34) + ").writeFileSync( process.cwd() + ",false);
      wr.out(String.fromCharCode(34) + "\/" + String.fromCharCode(34) + " + ",false);
      ctx.setInExpr();
      this.WalkNode(pathName,ctx,wr);
      wr.out(" + " + String.fromCharCode(34) + "\/" + String.fromCharCode(34) + " + ",false);
      this.WalkNode(fileName,ctx,wr);
      wr.out(", ",false);
      this.WalkNode(dataToWrite,ctx,wr);
      wr.out(");",true);
      ctx.unsetInExpr();
    }}
    ,
    { key: "cmdIsFile", value: function cmdIsFile(node, ctx, wr) { 
      var pathName = node.getSecond();
      var fileName = node.getThird();
      wr.out("require(" + String.fromCharCode(34) + "fs" + String.fromCharCode(34) + ").existsSync( process.cwd() + ",false);
      wr.out(String.fromCharCode(34) + "\/" + String.fromCharCode(34) + " + ",false);
      ctx.setInExpr();
      this.WalkNode(pathName,ctx,wr);
      wr.out(" + " + String.fromCharCode(34) + "\/" + String.fromCharCode(34) + " + ",false);
      this.WalkNode(fileName,ctx,wr);
      ctx.unsetInExpr();
      wr.out(")",false);
    }}
    ,
    { key: "cmdIsDir", value: function cmdIsDir(node, ctx, wr) { 
      var pathName = node.getSecond();
      wr.out("require(" + String.fromCharCode(34) + "fs" + String.fromCharCode(34) + ").existsSync( process.cwd() + ",false);
      wr.out(String.fromCharCode(34) + "\/" + String.fromCharCode(34) + " + ",false);
      ctx.setInExpr();
      this.WalkNode(pathName,ctx,wr);
      ctx.unsetInExpr();
      wr.out(")",false);
    }}
    ,
    { key: "cmdCreateDir", value: function cmdCreateDir(node, ctx, wr) { 
      var pathName = node.getSecond();
      wr.newline();
      wr.out("require(" + String.fromCharCode(34) + "fs" + String.fromCharCode(34) + ").mkdirSync( process.cwd() + ",false);
      wr.out(String.fromCharCode(34) + "\/" + String.fromCharCode(34) + " + ",false);
      ctx.setInExpr();
      this.WalkNode(pathName,ctx,wr);
      wr.out(");",true);
      ctx.unsetInExpr();
    }}
    ,
    { key: "PublicMethod", value: function PublicMethod(node, ctx, wr) { 
      var currClass = ctx.getCurrentClass();
      var nameDef = node.getSecond();
      if(false==(wr.hasTag(("js_class_writer" + currClass.name)))) {
        wr.createTag("js_class_writer" + currClass.name);
      } else {
        wr.out(",",true);
      }
      wr.newline();
      wr.out("{ key: \"" + nameDef.vref + "\", value: function " + nameDef.vref + "(",false);
      var args = node.getThird();
      for( var i= 0; i< args.children.length; i++) { 
        var arg= args.children[i];
        if(i>0) {
          wr.out(", ",false);
        }
        wr.out(arg.vref,false);
      }
      wr.out(") { ",true);
      ctx.setInMethod();
      wr.indent(1);
      var fnBody = node.children[3];
      var has_try_catch = false;
      var try_catch;
      if(fnBody.hasExpressionProperty("onError")) {
        try_catch = fnBody.getExpressionProperty("onError");
        wr.out("try {",true);
        wr.indent(1);
      }
      this.WalkNodeChildren(fnBody,ctx,wr);
      wr.newline();
      wr.indent(-1);
      if(fnBody.hasExpressionProperty("onError")) {
        wr.out("} catch(e) {",true);
        wr.indent(1);
        wr.out("console.log(e);",true);
        this.WalkNodeChildren(try_catch,ctx,wr);
        wr.indent(-1);
        wr.out("}",true);
        wr.indent(-1);
      }
      wr.newline();
      wr.out("}}",true);
      ctx.unsetInMethod();
    }}
    ,
    { key: "StaticMethod", value: function StaticMethod(node, ctx, orig_wr) { 
      var currClass = ctx.getCurrentClass();
      var nameDef = node.getSecond();
      var wr = ctx.getStaticWriter(currClass.name);
      if(false==(wr.hasTag(("js_class_static_writer" + currClass.name)))) {
        wr.createTag("js_class_static_writer" + currClass.name);
      } else {
        wr.out(",",true);
      }
      wr.newline();
      wr.out("{ key: \"" + nameDef.vref + "\", value: function " + nameDef.vref + "(",false);
      var args = node.getThird();
      for( var i= 0; i< args.children.length; i++) { 
        var arg= args.children[i];
        if(i>0) {
          wr.out(", ",false);
        }
        wr.out(arg.vref,false);
      }
      wr.out(") { ",true);
      ctx.setInMethod();
      wr.indent(1);
      var fnBody = node.children[3];
      var has_try_catch = false;
      var try_catch;
      if(fnBody.hasExpressionProperty("onError")) {
        try_catch = fnBody.getExpressionProperty("onError");
        wr.out("try {",true);
        wr.indent(1);
      }
      this.WalkNodeChildren(fnBody,ctx,wr);
      wr.newline();
      wr.indent(-1);
      if(fnBody.hasExpressionProperty("onError")) {
        wr.out("} catch(e) {",true);
        wr.indent(1);
        wr.out("console.log(e);",true);
        this.WalkNodeChildren(try_catch,ctx,wr);
        wr.indent(-1);
        wr.out("}",true);
        wr.indent(-1);
      }
      wr.newline();
      wr.out("}}",true);
      ctx.unsetInMethod();
    }}
    ,
    { key: "CreateClass", value: function CreateClass(node, ctx, wr) { 
      var nameDef = node.getSecond();
      var classInfo = ctx.findClass(nameDef.vref);
      if(false==(wr.hasTag("polyfill"))) {
        wr.createTag("polyfill");
        wr.out("\n\"use strict\";\n\nvar _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if (\"value\" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();\n\nfunction _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError(\"this hasn't been initialised - super() hasn't been called\"); } return call && (typeof call === \"object\" || typeof call === \"function\") ? call : self; }\n\nfunction _inherits(subClass, superClass) { if (typeof superClass !== \"function\" && superClass !== null) { throw new TypeError(\"Super expression must either be null or a function, not \" + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }\n\nfunction _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError(\"Cannot call a class as a function\"); } }\n\n                            ",true);
      }
      wr.newline();
      wr.out("var " + nameDef.vref + " = function( ",false);
      var staticWriter = new CodeWriter();
      ctx.setStaticWriter(nameDef.vref,staticWriter);
      var b_extended = false;
      if(classInfo.extends_classes.length>0) {
        b_extended = true;
        for( var i= 0; i< classInfo.extends_classes.length; i++) { 
          var pName= classInfo.extends_classes[i];
          if(i>0) {
            wr.out(",",false);
          }
          wr.out("_" + pName,false);
        }
      }
      wr.out(") { " + " ",false);
      wr.indent(1);
      if(b_extended) {
        for( var i_1= 0; i_1< classInfo.extends_classes.length; i_1++) { 
          var pName_1= classInfo.extends_classes[i_1];
          wr.out("_inherits(" + nameDef.vref + ", _" + pName_1 + ");",true);
        }
      }
      wr.out("",true);
      var cw = wr.createTag("constructor");
      cw.out("function " + nameDef.vref + "(",false);
      if(classInfo.has_constructor) {
        var constr = classInfo.constructor_node;
        var cParams = constr.getSecond();
        for( var i_2= 0; i_2< cParams.children.length; i_2++) { 
          var param= cParams.children[i_2];
          if(i_2>0) {
            cw.out(", ",false);
          }
          cw.out(param.vref,false);
        }
      }
      cw.out(") {",true);
      cw.indent(1);
      cw.out("_classCallCheck(this, " + nameDef.vref + ");",true);
      if(b_extended) {
        cw.out("var _this = _possibleConstructorReturn(this, (" + nameDef.vref + ".__proto__ || Object.getPrototypeOf(" + nameDef.vref + ")).call(this));",true);
      }
      wr.newline();
      wr.out("",true);
      wr.out(" _createClass(" + nameDef.vref + ", [",true);
      wr.indent(1);
      var fnBody = node.children[2];
      this.WalkNodeChildren(fnBody,ctx,wr);
      for( var i_3= 0; i_3< classInfo.variables.length; i_3++) { 
        var varD= classInfo.variables[i_3];
        if(varD.refType==1) {
          wr.out("\/* Weak variable : " + varD.name + "*\/",true);
          if(varD.isArray()) {
            wr.out("\/* Weak ARRAY variable : " + varD.name + " in class " + classInfo.name + "*\/",true);
          }
          if(varD.isHash()) {
            wr.out("\/* Weak HASH variable : " + varD.name + " in class " + classInfo.name + "*\/",true);
          }
          if(varD.isObject()) {
            wr.out("\/* Weak Object variable : " + varD.name + " in class " + classInfo.name + " *\/",true);
          }
        }
      }
      wr.newline();
      wr.indent(-1);
      wr.out("], [",true);
      wr.indent(1);
      wr.out(staticWriter.getCode(),true);
      wr.indent(-1);
      wr.out("]);",true);
      wr.out("",true);
      if(b_extended) {
        cw.out("return _this;",true);
      }
      cw.indent(-1);
      cw.out("}",true);
      wr.indent(-1);
      wr.out("",true);
      wr.out("return " + nameDef.vref + ";",true);
      wr.out("}(",false);
      if(b_extended) {
        for( var i_4= 0; i_4< classInfo.extends_classes.length; i_4++) { 
          var pName_2= classInfo.extends_classes[i_4];
          if(i_4>0) {
            wr.out(",",false);
          }
          wr.out(pName_2,false);
        }
      }
      wr.out(");",true);
    }}
    ,
    { key: "DefineVar", value: function DefineVar(node, ctx, wr) { 
      if(ctx.isInMethod()) {
        var v = node.getSecond();
        wr.out("var " + v.paramDesc.compiledName,false);
        if(node.children.length>2) {
          wr.out(" = ",false);
          ctx.setInExpr();
          this.WalkNode(node.getThird(),ctx,wr);
          ctx.unsetInExpr();
        } else {
          switch(v.value_type) {
            case 6:
              wr.out(" = {}",false);
              break;
            case 5:
              wr.out(" = []",false);
              break;
            default: 
              wr.out("",false);
              break;
          }
        }
        wr.out(";",true);
      } else {
        var cw = wr.getTag("constructor");
        var v_1 = node.getSecond();
        cw.out("this." + v_1.vref,false);
        if(node.children.length>2) {
          cw.out(" = ",false);
          ctx.setInExpr();
          this.WalkNode(node.getThird(),ctx,cw);
          ctx.unsetInExpr();
        } else {
          switch(v_1.value_type) {
            case 6:
              cw.out(" = {}",false);
              break;
            case 5:
              cw.out(" = []",false);
              break;
            default: 
              cw.out(" = undefined",false);
              break;
          }
        }
        cw.out(";",true);
      }
    }}
  ], [
    
  ]);
  

return RangerES5Writer;
}(RangerCommonWriter);

