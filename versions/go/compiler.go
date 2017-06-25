package main
import (
  "strings"
  "fmt"
  "strconv"
  "os"
  "io/ioutil"
  "time"
)

type GoNullable struct { 
  value interface{}
  has_value bool
}

func r_indexof_arr_string( a []string, item string ) ( int64 ) { 
  for i, v := range a {
    if item == v { 
      return int64(i) 
     } 
   } 
return -1
}
func r_has_key_string_bool( a map[string]bool, key string ) bool { 
  _, ok := a[key]
  return ok

}
func r_get_string_RangerAppMethodVariants( a map[string]*RangerAppMethodVariants, key string ) *GoNullable  { 
  res := new(GoNullable)
  v, ok := a[key]
  if ok { 
    res.has_value = true
    res.value = v
    return res
  }
  res.has_value = false
  return res
}
func r_get_string_CodeNode( a map[string]*CodeNode, key string ) *GoNullable  { 
  res := new(GoNullable)
  v, ok := a[key]
  if ok { 
    res.has_value = true
    res.value = v
    return res
  }
  res.has_value = false
  return res
}
func r_has_key_string_CodeNode( a map[string]*CodeNode, key string ) bool { 
  _, ok := a[key]
  return ok

}
func r_get_string_string( a map[string]string, key string ) *GoNullable  { 
  res := new(GoNullable)
  v, ok := a[key]
  if ok { 
    res.has_value = true
    res.value = v
    return res
  }
  res.has_value = false
  return res
}
func r_has_key_string_string( a map[string]string, key string ) bool { 
  _, ok := a[key]
  return ok

}
func r_get_string_CodeWriter( a map[string]*CodeWriter, key string ) *GoNullable  { 
  res := new(GoNullable)
  v, ok := a[key]
  if ok { 
    res.has_value = true
    res.value = v
    return res
  }
  res.has_value = false
  return res
}
func r_has_key_string_RangerAppEnum( a map[string]*RangerAppEnum, key string ) bool { 
  _, ok := a[key]
  return ok

}
func r_get_string_RangerAppEnum( a map[string]*RangerAppEnum, key string ) *GoNullable  { 
  res := new(GoNullable)
  v, ok := a[key]
  if ok { 
    res.has_value = true
    res.value = v
    return res
  }
  res.has_value = false
  return res
}
func r_has_key_string_IFACE_RangerAppParamDesc( a map[string]IFACE_RangerAppParamDesc, key string ) bool { 
  _, ok := a[key]
  return ok

}
func r_get_string_bool( a map[string]bool, key string ) *GoNullable  { 
  res := new(GoNullable)
  v, ok := a[key]
  if ok { 
    res.has_value = true
    res.value = v
    return res
  }
  res.has_value = false
  return res
}
func r_get_string_IFACE_RangerAppParamDesc( a map[string]IFACE_RangerAppParamDesc, key string ) *GoNullable  { 
  res := new(GoNullable)
  v, ok := a[key]
  if ok { 
    res.has_value = true
    res.value = v
    return res
  }
  res.has_value = false
  return res
}
func r_has_key_string_int64( a map[string]int64, key string ) bool { 
  _, ok := a[key]
  return ok

}
func r_get_string_int64( a map[string]int64, key string ) *GoNullable  { 
  res := new(GoNullable)
  v, ok := a[key]
  if ok { 
    res.has_value = true
    res.value = v
    return res
  }
  res.has_value = false
  return res
}
func r_has_key_string_RangerAppClassDesc( a map[string]*RangerAppClassDesc, key string ) bool { 
  _, ok := a[key]
  return ok

}
func r_get_string_RangerAppClassDesc( a map[string]*RangerAppClassDesc, key string ) *GoNullable  { 
  res := new(GoNullable)
  v, ok := a[key]
  if ok { 
    res.has_value = true
    res.value = v
    return res
  }
  res.has_value = false
  return res
}

func r_dir_exists(pathName string) bool {
    if _, err := os.Stat(pathName); os.IsNotExist(err) {
        return false
    }
    return true
}


func r_write_text_file(pathName string, fileName string, txtData string)  {
    f, e := os.Create(pathName + "/" + fileName)
    if e != nil {
        panic(e)
    }
    defer f.Close()

    _ , err := f.WriteString(txtData)
    if err != nil {
        panic(err)
    }
    f.Sync()
}

func r_str_2_d64(s string) *GoNullable {
   res := new(GoNullable);
   if v, err := strconv.ParseFloat(s, 64); err == nil {
     res.has_value = true
     res.value = v
   } else {
     res.has_value = false
   }
   return res
}

func r_str_2_i64(s string) *GoNullable {
   res := new(GoNullable);
   if v, err := strconv.ParseInt(s, 10, 64); err == nil {
     res.has_value = true
     res.value = v
   } else {
     res.has_value = false
   }
   return res
}

func r_m_arr_CodeNode_extract( a []*CodeNode, i int64 ) (*CodeNode, []*CodeNode ) { 
  item := a[i]
  res := append(a[:i], a[(i+1):]...)
  return item, res 

}
func r_indexof_arr_CodeNode( a []*CodeNode, item *CodeNode ) ( int64 ) { 
  for i, v := range a {
    if item == v { 
      return int64(i) 
     } 
   } 
return -1
}


// polyfill for reading files
func r_io_read_file( path string , fileName string ) *GoNullable {
   res := new(GoNullable);
   if v, err := ioutil.ReadFile(path + "/" + fileName); err == nil {
     res.has_value = true
     res.value = string(v)
   } else {
     res.has_value = false
   }
   return res 
}


func r_file_exists(pathName string, fileName string) bool {
    if _, err := os.Stat(pathName + "/" + fileName); os.IsNotExist(err) {
        return false
    }
    return true
}

type RangerAppTodo struct { 
  description string
  todonode *GoNullable
}
type IFACE_RangerAppTodo interface { 
  Get_description() string
  Set_description(value string) 
  Get_todonode() *GoNullable
  Set_todonode(value *GoNullable) 
}

func CreateNew_RangerAppTodo() *RangerAppTodo {
  me := new(RangerAppTodo)
  me.description = ""
  me.todonode = new(GoNullable);
  return me;
}
// getter for variable description
func (this *RangerAppTodo) Get_description() string {
  return this.description
}
// setter for variable description
func (this *RangerAppTodo) Set_description( value string)  {
  this.description = value 
}
// getter for variable todonode
func (this *RangerAppTodo) Get_todonode() *GoNullable {
  return this.todonode
}
// setter for variable todonode
func (this *RangerAppTodo) Set_todonode( value *GoNullable)  {
  this.todonode = value 
}
type RangerCompilerMessage struct { 
  error_level int64 /**  unused  **/ 
  code_line int64 /**  unused  **/ 
  fileName string /**  unused  **/ 
  description string
  node *GoNullable
}
type IFACE_RangerCompilerMessage interface { 
  Get_error_level() int64
  Set_error_level(value int64) 
  Get_code_line() int64
  Set_code_line(value int64) 
  Get_fileName() string
  Set_fileName(value string) 
  Get_description() string
  Set_description(value string) 
  Get_node() *GoNullable
  Set_node(value *GoNullable) 
}

func CreateNew_RangerCompilerMessage() *RangerCompilerMessage {
  me := new(RangerCompilerMessage)
  me.error_level = 0
  me.code_line = 0
  me.fileName = ""
  me.description = ""
  me.node = new(GoNullable);
  return me;
}
// getter for variable error_level
func (this *RangerCompilerMessage) Get_error_level() int64 {
  return this.error_level
}
// setter for variable error_level
func (this *RangerCompilerMessage) Set_error_level( value int64)  {
  this.error_level = value 
}
// getter for variable code_line
func (this *RangerCompilerMessage) Get_code_line() int64 {
  return this.code_line
}
// setter for variable code_line
func (this *RangerCompilerMessage) Set_code_line( value int64)  {
  this.code_line = value 
}
// getter for variable fileName
func (this *RangerCompilerMessage) Get_fileName() string {
  return this.fileName
}
// setter for variable fileName
func (this *RangerCompilerMessage) Set_fileName( value string)  {
  this.fileName = value 
}
// getter for variable description
func (this *RangerCompilerMessage) Get_description() string {
  return this.description
}
// setter for variable description
func (this *RangerCompilerMessage) Set_description( value string)  {
  this.description = value 
}
// getter for variable node
func (this *RangerCompilerMessage) Get_node() *GoNullable {
  return this.node
}
// setter for variable node
func (this *RangerCompilerMessage) Set_node( value *GoNullable)  {
  this.node = value 
}
type RangerRefForce struct { 
  strength int64
  lifetime int64
  changer *GoNullable
}
type IFACE_RangerRefForce interface { 
  Get_strength() int64
  Set_strength(value int64) 
  Get_lifetime() int64
  Set_lifetime(value int64) 
  Get_changer() *GoNullable
  Set_changer(value *GoNullable) 
}

func CreateNew_RangerRefForce() *RangerRefForce {
  me := new(RangerRefForce)
  me.strength = 0
  me.lifetime = 1
  me.changer = new(GoNullable);
  return me;
}
// getter for variable strength
func (this *RangerRefForce) Get_strength() int64 {
  return this.strength
}
// setter for variable strength
func (this *RangerRefForce) Set_strength( value int64)  {
  this.strength = value 
}
// getter for variable lifetime
func (this *RangerRefForce) Get_lifetime() int64 {
  return this.lifetime
}
// setter for variable lifetime
func (this *RangerRefForce) Set_lifetime( value int64)  {
  this.lifetime = value 
}
// getter for variable changer
func (this *RangerRefForce) Get_changer() *GoNullable {
  return this.changer
}
// setter for variable changer
func (this *RangerRefForce) Set_changer( value *GoNullable)  {
  this.changer = value 
}
type RangerAppParamDesc struct { 
  name string
  compiledName string
  debugString string
  ref_cnt int64
  init_cnt int64
  set_cnt int64
  return_cnt int64
  prop_assign_cnt int64 /**  unused  **/ 
  value_type int64
  has_default bool /**  unused  **/ 
  def_value *GoNullable
  default_value *GoNullable /**  unused  **/ 
  isThis bool /**  unused  **/ 
  classDesc *GoNullable /**  unused  **/ 
  fnDesc *GoNullable /**  unused  **/ 
  ownerHistory []*RangerRefForce
  varType int64
  refType int64
  initRefType int64
  isParam *GoNullable /**  unused  **/ 
  paramIndex int64 /**  unused  **/ 
  is_optional bool
  is_mutating bool /**  unused  **/ 
  is_set bool /**  unused  **/ 
  is_class_variable bool
  node *GoNullable
  nameNode *GoNullable
  description string /**  unused  **/ 
  git_doc string /**  unused  **/ 
}
type IFACE_RangerAppParamDesc interface { 
  Get_name() string
  Set_name(value string) 
  Get_compiledName() string
  Set_compiledName(value string) 
  Get_debugString() string
  Set_debugString(value string) 
  Get_ref_cnt() int64
  Set_ref_cnt(value int64) 
  Get_init_cnt() int64
  Set_init_cnt(value int64) 
  Get_set_cnt() int64
  Set_set_cnt(value int64) 
  Get_return_cnt() int64
  Set_return_cnt(value int64) 
  Get_prop_assign_cnt() int64
  Set_prop_assign_cnt(value int64) 
  Get_value_type() int64
  Set_value_type(value int64) 
  Get_has_default() bool
  Set_has_default(value bool) 
  Get_def_value() *GoNullable
  Set_def_value(value *GoNullable) 
  Get_default_value() *GoNullable
  Set_default_value(value *GoNullable) 
  Get_isThis() bool
  Set_isThis(value bool) 
  Get_classDesc() *GoNullable
  Set_classDesc(value *GoNullable) 
  Get_fnDesc() *GoNullable
  Set_fnDesc(value *GoNullable) 
  Get_ownerHistory() []*RangerRefForce
  Set_ownerHistory(value []*RangerRefForce) 
  Get_varType() int64
  Set_varType(value int64) 
  Get_refType() int64
  Set_refType(value int64) 
  Get_initRefType() int64
  Set_initRefType(value int64) 
  Get_isParam() *GoNullable
  Set_isParam(value *GoNullable) 
  Get_paramIndex() int64
  Set_paramIndex(value int64) 
  Get_is_optional() bool
  Set_is_optional(value bool) 
  Get_is_mutating() bool
  Set_is_mutating(value bool) 
  Get_is_set() bool
  Set_is_set(value bool) 
  Get_is_class_variable() bool
  Set_is_class_variable(value bool) 
  Get_node() *GoNullable
  Set_node(value *GoNullable) 
  Get_nameNode() *GoNullable
  Set_nameNode(value *GoNullable) 
  Get_description() string
  Set_description(value string) 
  Get_git_doc() string
  Set_git_doc(value string) 
  changeStrength(newStrength int64, lifeTime int64, changer *CodeNode) ()
  isProperty() bool
  isClass() bool
  doesInherit() bool
  isAllocatedType() bool
  moveRefTo(node *CodeNode, target IFACE_RangerAppParamDesc, ctx *RangerAppWriterContext) ()
  originalStrength() int64
  getLifetime() int64
  getStrength() int64
  debugRefChanges() ()
  pointsToObject(ctx *RangerAppWriterContext) bool
  isObject() bool
  isArray() bool
  isHash() bool
  isPrimitive() bool
  getRefTypeName() string
  getVarTypeName() string
  getTypeName() string
}

func CreateNew_RangerAppParamDesc() *RangerAppParamDesc {
  me := new(RangerAppParamDesc)
  me.name = ""
  me.compiledName = ""
  me.debugString = ""
  me.ref_cnt = 0
  me.init_cnt = 0
  me.set_cnt = 0
  me.return_cnt = 0
  me.prop_assign_cnt = 0
  me.value_type = 0
  me.has_default = false
  me.isThis = false
  me.ownerHistory = make([]*RangerRefForce,0)
  me.varType = 0
  me.refType = 0
  me.initRefType = 0
  me.paramIndex = 0
  me.is_optional = false
  me.is_mutating = false
  me.is_set = false
  me.is_class_variable = false
  me.description = ""
  me.git_doc = ""
  me.def_value = new(GoNullable);
  me.default_value = new(GoNullable);
  me.classDesc = new(GoNullable);
  me.fnDesc = new(GoNullable);
  me.isParam = new(GoNullable);
  me.node = new(GoNullable);
  me.nameNode = new(GoNullable);
  return me;
}
func (this *RangerAppParamDesc) changeStrength (newStrength int64, lifeTime int64, changer *CodeNode) () {
  var entry *RangerRefForce = CreateNew_RangerRefForce();
  entry.strength = newStrength; 
  entry.lifetime = lifeTime; 
  entry.changer.value = changer;
  entry.changer.has_value = true; /* detected as non-optional */
  this.ownerHistory = append(this.ownerHistory,entry); 
}
func (this *RangerAppParamDesc) isProperty () bool {
  return true;
}
func (this *RangerAppParamDesc) isClass () bool {
  return false;
}
func (this *RangerAppParamDesc) doesInherit () bool {
  return false;
}
func (this *RangerAppParamDesc) isAllocatedType () bool {
  if  this.nameNode.has_value {
    if  this.nameNode.value.(*CodeNode).eval_type != 0 {
      if  this.nameNode.value.(*CodeNode).eval_type == 6 {
        return true;
      }
      if  this.nameNode.value.(*CodeNode).eval_type == 7 {
        return true;
      }
      if  (((this.nameNode.value.(*CodeNode).eval_type == 4) || (this.nameNode.value.(*CodeNode).eval_type == 2)) || (this.nameNode.value.(*CodeNode).eval_type == 5)) || (this.nameNode.value.(*CodeNode).eval_type == 3) {
        return false;
      }
      if  this.nameNode.value.(*CodeNode).eval_type == 11 {
        return false;
      }
      return true;
    }
    if  this.nameNode.value.(*CodeNode).eval_type == 11 {
      return false;
    }
    if  this.nameNode.value.(*CodeNode).value_type == 9 {
      if  false == this.nameNode.value.(*CodeNode).isPrimitive() {
        return true;
      }
    }
    if  this.nameNode.value.(*CodeNode).value_type == 6 {
      return true;
    }
    if  this.nameNode.value.(*CodeNode).value_type == 7 {
      return true;
    }
  }
  return false;
}
func (this *RangerAppParamDesc) moveRefTo (node *CodeNode, target IFACE_RangerAppParamDesc, ctx *RangerAppWriterContext) () {
  if  node.ref_change_done {
    return;
  }
  if  false == target.isAllocatedType() {
    return;
  }
  if  false == this.isAllocatedType() {
    return;
  }
  node.ref_change_done = true; 
  var other_s int64 = target.getStrength();
  var my_s int64 = this.getStrength();
  var my_lifetime int64 = this.getLifetime();
  var other_lifetime int64 = target.getLifetime();
  var a_lives bool = false;
  var b_lives bool = false;
  var tmp_var bool = this.nameNode.value.(*CodeNode).hasFlag("temp");
  if  target.Get_nameNode().has_value {
    if  target.Get_nameNode().value.(*CodeNode).hasFlag("lives") {
      my_lifetime = 2; 
      b_lives = true; 
    }
  }
  if  this.nameNode.has_value {
    if  this.nameNode.value.(*CodeNode).hasFlag("lives") {
      my_lifetime = 2; 
      a_lives = true; 
    }
  }
  if  other_s > 0 {
    if  my_s == 1 {
      var lt int64 = my_lifetime;
      if  other_lifetime > my_lifetime {
        lt = other_lifetime; 
      }
      this.changeStrength(0, lt, node);
    } else {
      if  my_s == 0 {
        if  tmp_var == false {
          ctx.addError(node, strings.Join([]string{ "Can not move a weak reference to a strong target, at ",node.getCode() }, ""));
          fmt.Println( "can not move weak refs to strong target:" )
          this.debugRefChanges();
        }
      } else {
        ctx.addError(node, strings.Join([]string{ "Can not move immutable reference to a strong target, evald type ",this.nameNode.value.(*CodeNode).eval_type_name }, ""));
      }
    }
  } else {
    if  a_lives || b_lives {
    } else {
      if  (my_lifetime < other_lifetime) && (this.return_cnt == 0) {
        if  this.nameNode.value.(*CodeNode).hasFlag("returnvalue") == false {
          ctx.addError(node, strings.Join([]string{ "Can not create a weak reference if target has longer lifetime than original, current lifetime == ",strconv.FormatInt(my_lifetime, 10) }, ""));
        }
      }
    }
  }
}
func (this *RangerAppParamDesc) originalStrength () int64 {
  var len int64 = int64(len(this.ownerHistory));
  if  len > 0 {
    var firstEntry *RangerRefForce = this.ownerHistory[0];
    return firstEntry.strength;
  }
  return 1;
}
func (this *RangerAppParamDesc) getLifetime () int64 {
  var len_4 int64 = int64(len(this.ownerHistory));
  if  len_4 > 0 {
    var lastEntry *RangerRefForce = this.ownerHistory[(len_4 - 1)];
    return lastEntry.lifetime;
  }
  return 1;
}
func (this *RangerAppParamDesc) getStrength () int64 {
  var len_6 int64 = int64(len(this.ownerHistory));
  if  len_6 > 0 {
    var lastEntry_4 *RangerRefForce = this.ownerHistory[(len_6 - 1)];
    return lastEntry_4.strength;
  }
  return 1;
}
func (this *RangerAppParamDesc) debugRefChanges () () {
  fmt.Println( strings.Join([]string{ (strings.Join([]string{ "variable ",this.name }, ""))," ref history : " }, "") )
  var i int64 = 0;  
  for ; i < int64(len(this.ownerHistory)) ; i++ {
    h := this.ownerHistory[i];
    fmt.Println( strings.Join([]string{ (strings.Join([]string{ (strings.Join([]string{ " => change to ",strconv.FormatInt(h.strength, 10) }, ""))," by " }, "")),h.changer.value.(*CodeNode).getCode() }, "") )
  }
}
func (this *RangerAppParamDesc) pointsToObject (ctx *RangerAppWriterContext) bool {
  if  this.nameNode.has_value {
    var is_primitive bool = false;
    switch (this.nameNode.value.(*CodeNode).array_type ) { 
      case "string" : 
        is_primitive = true; 
      case "int" : 
        is_primitive = true; 
      case "boolean" : 
        is_primitive = true; 
      case "double" : 
        is_primitive = true; 
    }
    if  is_primitive {
      return false;
    }
    if  (this.nameNode.value.(*CodeNode).value_type == 6) || (this.nameNode.value.(*CodeNode).value_type == 7) {
      var is_object bool = true;
      switch (this.nameNode.value.(*CodeNode).array_type ) { 
        case "string" : 
          is_object = false; 
        case "int" : 
          is_object = false; 
        case "boolean" : 
          is_object = false; 
        case "double" : 
          is_object = false; 
      }
      return is_object;
    }
    if  this.nameNode.value.(*CodeNode).value_type == 9 {
      var is_object_8 bool = true;
      switch (this.nameNode.value.(*CodeNode).type_name ) { 
        case "string" : 
          is_object_8 = false; 
        case "int" : 
          is_object_8 = false; 
        case "boolean" : 
          is_object_8 = false; 
        case "double" : 
          is_object_8 = false; 
      }
      if  ctx.isEnumDefined(this.nameNode.value.(*CodeNode).type_name) {
        return false;
      }
      return is_object_8;
    }
  }
  return false;
}
func (this *RangerAppParamDesc) isObject () bool {
  if  this.nameNode.has_value {
    if  this.nameNode.value.(*CodeNode).value_type == 9 {
      if  false == this.nameNode.value.(*CodeNode).isPrimitive() {
        return true;
      }
    }
  }
  return false;
}
func (this *RangerAppParamDesc) isArray () bool {
  if  this.nameNode.has_value {
    if  this.nameNode.value.(*CodeNode).value_type == 6 {
      return true;
    }
  }
  return false;
}
func (this *RangerAppParamDesc) isHash () bool {
  if  this.nameNode.has_value {
    if  this.nameNode.value.(*CodeNode).value_type == 7 {
      return true;
    }
  }
  return false;
}
func (this *RangerAppParamDesc) isPrimitive () bool {
  if  this.nameNode.has_value {
    return this.nameNode.value.(*CodeNode).isPrimitive();
  }
  return false;
}
func (this *RangerAppParamDesc) getRefTypeName () string {
  switch (this.refType ) { 
    case 0 : 
      return "NoType";
    case 1 : 
      return "Weak";
  }
  return "";
}
func (this *RangerAppParamDesc) getVarTypeName () string {
  switch (this.refType ) { 
    case 0 : 
      return "NoType";
    case 1 : 
      return "This";
  }
  return "";
}
func (this *RangerAppParamDesc) getTypeName () string {
  var s string = this.nameNode.value.(*CodeNode).type_name;
  return s;
}
// getter for variable name
func (this *RangerAppParamDesc) Get_name() string {
  return this.name
}
// setter for variable name
func (this *RangerAppParamDesc) Set_name( value string)  {
  this.name = value 
}
// getter for variable compiledName
func (this *RangerAppParamDesc) Get_compiledName() string {
  return this.compiledName
}
// setter for variable compiledName
func (this *RangerAppParamDesc) Set_compiledName( value string)  {
  this.compiledName = value 
}
// getter for variable debugString
func (this *RangerAppParamDesc) Get_debugString() string {
  return this.debugString
}
// setter for variable debugString
func (this *RangerAppParamDesc) Set_debugString( value string)  {
  this.debugString = value 
}
// getter for variable ref_cnt
func (this *RangerAppParamDesc) Get_ref_cnt() int64 {
  return this.ref_cnt
}
// setter for variable ref_cnt
func (this *RangerAppParamDesc) Set_ref_cnt( value int64)  {
  this.ref_cnt = value 
}
// getter for variable init_cnt
func (this *RangerAppParamDesc) Get_init_cnt() int64 {
  return this.init_cnt
}
// setter for variable init_cnt
func (this *RangerAppParamDesc) Set_init_cnt( value int64)  {
  this.init_cnt = value 
}
// getter for variable set_cnt
func (this *RangerAppParamDesc) Get_set_cnt() int64 {
  return this.set_cnt
}
// setter for variable set_cnt
func (this *RangerAppParamDesc) Set_set_cnt( value int64)  {
  this.set_cnt = value 
}
// getter for variable return_cnt
func (this *RangerAppParamDesc) Get_return_cnt() int64 {
  return this.return_cnt
}
// setter for variable return_cnt
func (this *RangerAppParamDesc) Set_return_cnt( value int64)  {
  this.return_cnt = value 
}
// getter for variable prop_assign_cnt
func (this *RangerAppParamDesc) Get_prop_assign_cnt() int64 {
  return this.prop_assign_cnt
}
// setter for variable prop_assign_cnt
func (this *RangerAppParamDesc) Set_prop_assign_cnt( value int64)  {
  this.prop_assign_cnt = value 
}
// getter for variable value_type
func (this *RangerAppParamDesc) Get_value_type() int64 {
  return this.value_type
}
// setter for variable value_type
func (this *RangerAppParamDesc) Set_value_type( value int64)  {
  this.value_type = value 
}
// getter for variable has_default
func (this *RangerAppParamDesc) Get_has_default() bool {
  return this.has_default
}
// setter for variable has_default
func (this *RangerAppParamDesc) Set_has_default( value bool)  {
  this.has_default = value 
}
// getter for variable def_value
func (this *RangerAppParamDesc) Get_def_value() *GoNullable {
  return this.def_value
}
// setter for variable def_value
func (this *RangerAppParamDesc) Set_def_value( value *GoNullable)  {
  this.def_value = value 
}
// getter for variable default_value
func (this *RangerAppParamDesc) Get_default_value() *GoNullable {
  return this.default_value
}
// setter for variable default_value
func (this *RangerAppParamDesc) Set_default_value( value *GoNullable)  {
  this.default_value = value 
}
// getter for variable isThis
func (this *RangerAppParamDesc) Get_isThis() bool {
  return this.isThis
}
// setter for variable isThis
func (this *RangerAppParamDesc) Set_isThis( value bool)  {
  this.isThis = value 
}
// getter for variable classDesc
func (this *RangerAppParamDesc) Get_classDesc() *GoNullable {
  return this.classDesc
}
// setter for variable classDesc
func (this *RangerAppParamDesc) Set_classDesc( value *GoNullable)  {
  this.classDesc = value 
}
// getter for variable fnDesc
func (this *RangerAppParamDesc) Get_fnDesc() *GoNullable {
  return this.fnDesc
}
// setter for variable fnDesc
func (this *RangerAppParamDesc) Set_fnDesc( value *GoNullable)  {
  this.fnDesc = value 
}
// getter for variable ownerHistory
func (this *RangerAppParamDesc) Get_ownerHistory() []*RangerRefForce {
  return this.ownerHistory
}
// setter for variable ownerHistory
func (this *RangerAppParamDesc) Set_ownerHistory( value []*RangerRefForce)  {
  this.ownerHistory = value 
}
// getter for variable varType
func (this *RangerAppParamDesc) Get_varType() int64 {
  return this.varType
}
// setter for variable varType
func (this *RangerAppParamDesc) Set_varType( value int64)  {
  this.varType = value 
}
// getter for variable refType
func (this *RangerAppParamDesc) Get_refType() int64 {
  return this.refType
}
// setter for variable refType
func (this *RangerAppParamDesc) Set_refType( value int64)  {
  this.refType = value 
}
// getter for variable initRefType
func (this *RangerAppParamDesc) Get_initRefType() int64 {
  return this.initRefType
}
// setter for variable initRefType
func (this *RangerAppParamDesc) Set_initRefType( value int64)  {
  this.initRefType = value 
}
// getter for variable isParam
func (this *RangerAppParamDesc) Get_isParam() *GoNullable {
  return this.isParam
}
// setter for variable isParam
func (this *RangerAppParamDesc) Set_isParam( value *GoNullable)  {
  this.isParam = value 
}
// getter for variable paramIndex
func (this *RangerAppParamDesc) Get_paramIndex() int64 {
  return this.paramIndex
}
// setter for variable paramIndex
func (this *RangerAppParamDesc) Set_paramIndex( value int64)  {
  this.paramIndex = value 
}
// getter for variable is_optional
func (this *RangerAppParamDesc) Get_is_optional() bool {
  return this.is_optional
}
// setter for variable is_optional
func (this *RangerAppParamDesc) Set_is_optional( value bool)  {
  this.is_optional = value 
}
// getter for variable is_mutating
func (this *RangerAppParamDesc) Get_is_mutating() bool {
  return this.is_mutating
}
// setter for variable is_mutating
func (this *RangerAppParamDesc) Set_is_mutating( value bool)  {
  this.is_mutating = value 
}
// getter for variable is_set
func (this *RangerAppParamDesc) Get_is_set() bool {
  return this.is_set
}
// setter for variable is_set
func (this *RangerAppParamDesc) Set_is_set( value bool)  {
  this.is_set = value 
}
// getter for variable is_class_variable
func (this *RangerAppParamDesc) Get_is_class_variable() bool {
  return this.is_class_variable
}
// setter for variable is_class_variable
func (this *RangerAppParamDesc) Set_is_class_variable( value bool)  {
  this.is_class_variable = value 
}
// getter for variable node
func (this *RangerAppParamDesc) Get_node() *GoNullable {
  return this.node
}
// setter for variable node
func (this *RangerAppParamDesc) Set_node( value *GoNullable)  {
  this.node = value 
}
// getter for variable nameNode
func (this *RangerAppParamDesc) Get_nameNode() *GoNullable {
  return this.nameNode
}
// setter for variable nameNode
func (this *RangerAppParamDesc) Set_nameNode( value *GoNullable)  {
  this.nameNode = value 
}
// getter for variable description
func (this *RangerAppParamDesc) Get_description() string {
  return this.description
}
// setter for variable description
func (this *RangerAppParamDesc) Set_description( value string)  {
  this.description = value 
}
// getter for variable git_doc
func (this *RangerAppParamDesc) Get_git_doc() string {
  return this.git_doc
}
// setter for variable git_doc
func (this *RangerAppParamDesc) Set_git_doc( value string)  {
  this.git_doc = value 
}
type RangerAppFunctionDesc struct { 
  name string
  ref_cnt int64
  node *GoNullable
  nameNode *GoNullable
  fnBody *GoNullable
  params []IFACE_RangerAppParamDesc
  return_value *GoNullable /**  unused  **/ 
  is_method bool /**  unused  **/ 
  is_static bool
  container_class *GoNullable /**  unused  **/ 
  refType int64
  fnCtx *GoNullable
  // inherited from parent class RangerAppParamDesc
  compiledName string
  debugString string
  init_cnt int64
  set_cnt int64
  return_cnt int64
  prop_assign_cnt int64 /**  unused  **/ 
  value_type int64
  has_default bool /**  unused  **/ 
  def_value *GoNullable
  default_value *GoNullable /**  unused  **/ 
  isThis bool /**  unused  **/ 
  classDesc *GoNullable /**  unused  **/ 
  fnDesc *GoNullable /**  unused  **/ 
  ownerHistory []*RangerRefForce
  varType int64
  initRefType int64
  isParam *GoNullable /**  unused  **/ 
  paramIndex int64 /**  unused  **/ 
  is_optional bool
  is_mutating bool /**  unused  **/ 
  is_set bool /**  unused  **/ 
  is_class_variable bool
  description string /**  unused  **/ 
  git_doc string /**  unused  **/ 
}
type IFACE_RangerAppFunctionDesc interface { 
  Get_name() string
  Set_name(value string) 
  Get_ref_cnt() int64
  Set_ref_cnt(value int64) 
  Get_node() *GoNullable
  Set_node(value *GoNullable) 
  Get_nameNode() *GoNullable
  Set_nameNode(value *GoNullable) 
  Get_fnBody() *GoNullable
  Set_fnBody(value *GoNullable) 
  Get_params() []IFACE_RangerAppParamDesc
  Set_params(value []IFACE_RangerAppParamDesc) 
  Get_return_value() *GoNullable
  Set_return_value(value *GoNullable) 
  Get_is_method() bool
  Set_is_method(value bool) 
  Get_is_static() bool
  Set_is_static(value bool) 
  Get_container_class() *GoNullable
  Set_container_class(value *GoNullable) 
  Get_refType() int64
  Set_refType(value int64) 
  Get_fnCtx() *GoNullable
  Set_fnCtx(value *GoNullable) 
  isClass() bool
  isProperty() bool
}

func CreateNew_RangerAppFunctionDesc() *RangerAppFunctionDesc {
  me := new(RangerAppFunctionDesc)
  me.name = ""
  me.ref_cnt = 0
  me.params = make([]IFACE_RangerAppParamDesc,0)
  me.is_method = false
  me.is_static = false
  me.refType = 0
  me.node = new(GoNullable);
  me.nameNode = new(GoNullable);
  me.fnBody = new(GoNullable);
  me.return_value = new(GoNullable);
  me.container_class = new(GoNullable);
  me.fnCtx = new(GoNullable);
  me.name = ""
  me.compiledName = ""
  me.debugString = ""
  me.ref_cnt = 0
  me.init_cnt = 0
  me.set_cnt = 0
  me.return_cnt = 0
  me.prop_assign_cnt = 0
  me.value_type = 0
  me.has_default = false
  me.isThis = false
  me.ownerHistory = make([]*RangerRefForce,0)
  me.varType = 0
  me.refType = 0
  me.initRefType = 0
  me.paramIndex = 0
  me.is_optional = false
  me.is_mutating = false
  me.is_set = false
  me.is_class_variable = false
  me.description = ""
  me.git_doc = ""
  me.def_value = new(GoNullable);
  me.default_value = new(GoNullable);
  me.classDesc = new(GoNullable);
  me.fnDesc = new(GoNullable);
  me.isParam = new(GoNullable);
  me.node = new(GoNullable);
  me.nameNode = new(GoNullable);
  return me;
}
func (this *RangerAppFunctionDesc) isClass () bool {
  return false;
}
func (this *RangerAppFunctionDesc) isProperty () bool {
  return false;
}
// inherited methods from parent class RangerAppParamDesc
func (this *RangerAppFunctionDesc) changeStrength (newStrength int64, lifeTime int64, changer *CodeNode) () {
  var entry *RangerRefForce = CreateNew_RangerRefForce();
  entry.strength = newStrength; 
  entry.lifetime = lifeTime; 
  entry.changer.value = changer;
  entry.changer.has_value = true; /* detected as non-optional */
  this.ownerHistory = append(this.ownerHistory,entry); 
}
func (this *RangerAppFunctionDesc) doesInherit () bool {
  return false;
}
func (this *RangerAppFunctionDesc) isAllocatedType () bool {
  if  this.nameNode.has_value {
    if  this.nameNode.value.(*CodeNode).eval_type != 0 {
      if  this.nameNode.value.(*CodeNode).eval_type == 6 {
        return true;
      }
      if  this.nameNode.value.(*CodeNode).eval_type == 7 {
        return true;
      }
      if  (((this.nameNode.value.(*CodeNode).eval_type == 4) || (this.nameNode.value.(*CodeNode).eval_type == 2)) || (this.nameNode.value.(*CodeNode).eval_type == 5)) || (this.nameNode.value.(*CodeNode).eval_type == 3) {
        return false;
      }
      if  this.nameNode.value.(*CodeNode).eval_type == 11 {
        return false;
      }
      return true;
    }
    if  this.nameNode.value.(*CodeNode).eval_type == 11 {
      return false;
    }
    if  this.nameNode.value.(*CodeNode).value_type == 9 {
      if  false == this.nameNode.value.(*CodeNode).isPrimitive() {
        return true;
      }
    }
    if  this.nameNode.value.(*CodeNode).value_type == 6 {
      return true;
    }
    if  this.nameNode.value.(*CodeNode).value_type == 7 {
      return true;
    }
  }
  return false;
}
func (this *RangerAppFunctionDesc) moveRefTo (node *CodeNode, target IFACE_RangerAppParamDesc, ctx *RangerAppWriterContext) () {
  if  node.ref_change_done {
    return;
  }
  if  false == target.isAllocatedType() {
    return;
  }
  if  false == this.isAllocatedType() {
    return;
  }
  node.ref_change_done = true; 
  var other_s int64 = target.getStrength();
  var my_s int64 = this.getStrength();
  var my_lifetime int64 = this.getLifetime();
  var other_lifetime int64 = target.getLifetime();
  var a_lives bool = false;
  var b_lives bool = false;
  var tmp_var bool = this.nameNode.value.(*CodeNode).hasFlag("temp");
  if  target.Get_nameNode().has_value {
    if  target.Get_nameNode().value.(*CodeNode).hasFlag("lives") {
      my_lifetime = 2; 
      b_lives = true; 
    }
  }
  if  this.nameNode.has_value {
    if  this.nameNode.value.(*CodeNode).hasFlag("lives") {
      my_lifetime = 2; 
      a_lives = true; 
    }
  }
  if  other_s > 0 {
    if  my_s == 1 {
      var lt int64 = my_lifetime;
      if  other_lifetime > my_lifetime {
        lt = other_lifetime; 
      }
      this.changeStrength(0, lt, node);
    } else {
      if  my_s == 0 {
        if  tmp_var == false {
          ctx.addError(node, strings.Join([]string{ "Can not move a weak reference to a strong target, at ",node.getCode() }, ""));
          fmt.Println( "can not move weak refs to strong target:" )
          this.debugRefChanges();
        }
      } else {
        ctx.addError(node, strings.Join([]string{ "Can not move immutable reference to a strong target, evald type ",this.nameNode.value.(*CodeNode).eval_type_name }, ""));
      }
    }
  } else {
    if  a_lives || b_lives {
    } else {
      if  (my_lifetime < other_lifetime) && (this.return_cnt == 0) {
        if  this.nameNode.value.(*CodeNode).hasFlag("returnvalue") == false {
          ctx.addError(node, strings.Join([]string{ "Can not create a weak reference if target has longer lifetime than original, current lifetime == ",strconv.FormatInt(my_lifetime, 10) }, ""));
        }
      }
    }
  }
}
func (this *RangerAppFunctionDesc) originalStrength () int64 {
  var len int64 = int64(len(this.ownerHistory));
  if  len > 0 {
    var firstEntry *RangerRefForce = this.ownerHistory[0];
    return firstEntry.strength;
  }
  return 1;
}
func (this *RangerAppFunctionDesc) getLifetime () int64 {
  var len_4 int64 = int64(len(this.ownerHistory));
  if  len_4 > 0 {
    var lastEntry *RangerRefForce = this.ownerHistory[(len_4 - 1)];
    return lastEntry.lifetime;
  }
  return 1;
}
func (this *RangerAppFunctionDesc) getStrength () int64 {
  var len_6 int64 = int64(len(this.ownerHistory));
  if  len_6 > 0 {
    var lastEntry_4 *RangerRefForce = this.ownerHistory[(len_6 - 1)];
    return lastEntry_4.strength;
  }
  return 1;
}
func (this *RangerAppFunctionDesc) debugRefChanges () () {
  fmt.Println( strings.Join([]string{ (strings.Join([]string{ "variable ",this.name }, ""))," ref history : " }, "") )
  var i int64 = 0;  
  for ; i < int64(len(this.ownerHistory)) ; i++ {
    h := this.ownerHistory[i];
    fmt.Println( strings.Join([]string{ (strings.Join([]string{ (strings.Join([]string{ " => change to ",strconv.FormatInt(h.strength, 10) }, ""))," by " }, "")),h.changer.value.(*CodeNode).getCode() }, "") )
  }
}
func (this *RangerAppFunctionDesc) pointsToObject (ctx *RangerAppWriterContext) bool {
  if  this.nameNode.has_value {
    var is_primitive bool = false;
    switch (this.nameNode.value.(*CodeNode).array_type ) { 
      case "string" : 
        is_primitive = true; 
      case "int" : 
        is_primitive = true; 
      case "boolean" : 
        is_primitive = true; 
      case "double" : 
        is_primitive = true; 
    }
    if  is_primitive {
      return false;
    }
    if  (this.nameNode.value.(*CodeNode).value_type == 6) || (this.nameNode.value.(*CodeNode).value_type == 7) {
      var is_object bool = true;
      switch (this.nameNode.value.(*CodeNode).array_type ) { 
        case "string" : 
          is_object = false; 
        case "int" : 
          is_object = false; 
        case "boolean" : 
          is_object = false; 
        case "double" : 
          is_object = false; 
      }
      return is_object;
    }
    if  this.nameNode.value.(*CodeNode).value_type == 9 {
      var is_object_8 bool = true;
      switch (this.nameNode.value.(*CodeNode).type_name ) { 
        case "string" : 
          is_object_8 = false; 
        case "int" : 
          is_object_8 = false; 
        case "boolean" : 
          is_object_8 = false; 
        case "double" : 
          is_object_8 = false; 
      }
      if  ctx.isEnumDefined(this.nameNode.value.(*CodeNode).type_name) {
        return false;
      }
      return is_object_8;
    }
  }
  return false;
}
func (this *RangerAppFunctionDesc) isObject () bool {
  if  this.nameNode.has_value {
    if  this.nameNode.value.(*CodeNode).value_type == 9 {
      if  false == this.nameNode.value.(*CodeNode).isPrimitive() {
        return true;
      }
    }
  }
  return false;
}
func (this *RangerAppFunctionDesc) isArray () bool {
  if  this.nameNode.has_value {
    if  this.nameNode.value.(*CodeNode).value_type == 6 {
      return true;
    }
  }
  return false;
}
func (this *RangerAppFunctionDesc) isHash () bool {
  if  this.nameNode.has_value {
    if  this.nameNode.value.(*CodeNode).value_type == 7 {
      return true;
    }
  }
  return false;
}
func (this *RangerAppFunctionDesc) isPrimitive () bool {
  if  this.nameNode.has_value {
    return this.nameNode.value.(*CodeNode).isPrimitive();
  }
  return false;
}
func (this *RangerAppFunctionDesc) getRefTypeName () string {
  switch (this.refType ) { 
    case 0 : 
      return "NoType";
    case 1 : 
      return "Weak";
  }
  return "";
}
func (this *RangerAppFunctionDesc) getVarTypeName () string {
  switch (this.refType ) { 
    case 0 : 
      return "NoType";
    case 1 : 
      return "This";
  }
  return "";
}
func (this *RangerAppFunctionDesc) getTypeName () string {
  var s string = this.nameNode.value.(*CodeNode).type_name;
  return s;
}
// getter for variable name
func (this *RangerAppFunctionDesc) Get_name() string {
  return this.name
}
// setter for variable name
func (this *RangerAppFunctionDesc) Set_name( value string)  {
  this.name = value 
}
// getter for variable ref_cnt
func (this *RangerAppFunctionDesc) Get_ref_cnt() int64 {
  return this.ref_cnt
}
// setter for variable ref_cnt
func (this *RangerAppFunctionDesc) Set_ref_cnt( value int64)  {
  this.ref_cnt = value 
}
// getter for variable node
func (this *RangerAppFunctionDesc) Get_node() *GoNullable {
  return this.node
}
// setter for variable node
func (this *RangerAppFunctionDesc) Set_node( value *GoNullable)  {
  this.node = value 
}
// getter for variable nameNode
func (this *RangerAppFunctionDesc) Get_nameNode() *GoNullable {
  return this.nameNode
}
// setter for variable nameNode
func (this *RangerAppFunctionDesc) Set_nameNode( value *GoNullable)  {
  this.nameNode = value 
}
// getter for variable fnBody
func (this *RangerAppFunctionDesc) Get_fnBody() *GoNullable {
  return this.fnBody
}
// setter for variable fnBody
func (this *RangerAppFunctionDesc) Set_fnBody( value *GoNullable)  {
  this.fnBody = value 
}
// getter for variable params
func (this *RangerAppFunctionDesc) Get_params() []IFACE_RangerAppParamDesc {
  return this.params
}
// setter for variable params
func (this *RangerAppFunctionDesc) Set_params( value []IFACE_RangerAppParamDesc)  {
  this.params = value 
}
// getter for variable return_value
func (this *RangerAppFunctionDesc) Get_return_value() *GoNullable {
  return this.return_value
}
// setter for variable return_value
func (this *RangerAppFunctionDesc) Set_return_value( value *GoNullable)  {
  this.return_value = value 
}
// getter for variable is_method
func (this *RangerAppFunctionDesc) Get_is_method() bool {
  return this.is_method
}
// setter for variable is_method
func (this *RangerAppFunctionDesc) Set_is_method( value bool)  {
  this.is_method = value 
}
// getter for variable is_static
func (this *RangerAppFunctionDesc) Get_is_static() bool {
  return this.is_static
}
// setter for variable is_static
func (this *RangerAppFunctionDesc) Set_is_static( value bool)  {
  this.is_static = value 
}
// getter for variable container_class
func (this *RangerAppFunctionDesc) Get_container_class() *GoNullable {
  return this.container_class
}
// setter for variable container_class
func (this *RangerAppFunctionDesc) Set_container_class( value *GoNullable)  {
  this.container_class = value 
}
// getter for variable refType
func (this *RangerAppFunctionDesc) Get_refType() int64 {
  return this.refType
}
// setter for variable refType
func (this *RangerAppFunctionDesc) Set_refType( value int64)  {
  this.refType = value 
}
// getter for variable fnCtx
func (this *RangerAppFunctionDesc) Get_fnCtx() *GoNullable {
  return this.fnCtx
}
// setter for variable fnCtx
func (this *RangerAppFunctionDesc) Set_fnCtx( value *GoNullable)  {
  this.fnCtx = value 
}
// inherited getters and setters from the parent class RangerAppParamDesc
// getter for variable compiledName
func (this *RangerAppFunctionDesc) Get_compiledName() string {
  return this.compiledName
}
// getter for variable compiledName
func (this *RangerAppFunctionDesc) Set_compiledName( value string)  {
  this.compiledName = value 
}
// getter for variable debugString
func (this *RangerAppFunctionDesc) Get_debugString() string {
  return this.debugString
}
// getter for variable debugString
func (this *RangerAppFunctionDesc) Set_debugString( value string)  {
  this.debugString = value 
}
// getter for variable init_cnt
func (this *RangerAppFunctionDesc) Get_init_cnt() int64 {
  return this.init_cnt
}
// getter for variable init_cnt
func (this *RangerAppFunctionDesc) Set_init_cnt( value int64)  {
  this.init_cnt = value 
}
// getter for variable set_cnt
func (this *RangerAppFunctionDesc) Get_set_cnt() int64 {
  return this.set_cnt
}
// getter for variable set_cnt
func (this *RangerAppFunctionDesc) Set_set_cnt( value int64)  {
  this.set_cnt = value 
}
// getter for variable return_cnt
func (this *RangerAppFunctionDesc) Get_return_cnt() int64 {
  return this.return_cnt
}
// getter for variable return_cnt
func (this *RangerAppFunctionDesc) Set_return_cnt( value int64)  {
  this.return_cnt = value 
}
// getter for variable prop_assign_cnt
func (this *RangerAppFunctionDesc) Get_prop_assign_cnt() int64 {
  return this.prop_assign_cnt
}
// getter for variable prop_assign_cnt
func (this *RangerAppFunctionDesc) Set_prop_assign_cnt( value int64)  {
  this.prop_assign_cnt = value 
}
// getter for variable value_type
func (this *RangerAppFunctionDesc) Get_value_type() int64 {
  return this.value_type
}
// getter for variable value_type
func (this *RangerAppFunctionDesc) Set_value_type( value int64)  {
  this.value_type = value 
}
// getter for variable has_default
func (this *RangerAppFunctionDesc) Get_has_default() bool {
  return this.has_default
}
// getter for variable has_default
func (this *RangerAppFunctionDesc) Set_has_default( value bool)  {
  this.has_default = value 
}
// getter for variable def_value
func (this *RangerAppFunctionDesc) Get_def_value() *GoNullable {
  return this.def_value
}
// getter for variable def_value
func (this *RangerAppFunctionDesc) Set_def_value( value *GoNullable)  {
  this.def_value = value 
}
// getter for variable default_value
func (this *RangerAppFunctionDesc) Get_default_value() *GoNullable {
  return this.default_value
}
// getter for variable default_value
func (this *RangerAppFunctionDesc) Set_default_value( value *GoNullable)  {
  this.default_value = value 
}
// getter for variable isThis
func (this *RangerAppFunctionDesc) Get_isThis() bool {
  return this.isThis
}
// getter for variable isThis
func (this *RangerAppFunctionDesc) Set_isThis( value bool)  {
  this.isThis = value 
}
// getter for variable classDesc
func (this *RangerAppFunctionDesc) Get_classDesc() *GoNullable {
  return this.classDesc
}
// getter for variable classDesc
func (this *RangerAppFunctionDesc) Set_classDesc( value *GoNullable)  {
  this.classDesc = value 
}
// getter for variable fnDesc
func (this *RangerAppFunctionDesc) Get_fnDesc() *GoNullable {
  return this.fnDesc
}
// getter for variable fnDesc
func (this *RangerAppFunctionDesc) Set_fnDesc( value *GoNullable)  {
  this.fnDesc = value 
}
// getter for variable ownerHistory
func (this *RangerAppFunctionDesc) Get_ownerHistory() []*RangerRefForce {
  return this.ownerHistory
}
// getter for variable ownerHistory
func (this *RangerAppFunctionDesc) Set_ownerHistory( value []*RangerRefForce)  {
  this.ownerHistory = value 
}
// getter for variable varType
func (this *RangerAppFunctionDesc) Get_varType() int64 {
  return this.varType
}
// getter for variable varType
func (this *RangerAppFunctionDesc) Set_varType( value int64)  {
  this.varType = value 
}
// getter for variable initRefType
func (this *RangerAppFunctionDesc) Get_initRefType() int64 {
  return this.initRefType
}
// getter for variable initRefType
func (this *RangerAppFunctionDesc) Set_initRefType( value int64)  {
  this.initRefType = value 
}
// getter for variable isParam
func (this *RangerAppFunctionDesc) Get_isParam() *GoNullable {
  return this.isParam
}
// getter for variable isParam
func (this *RangerAppFunctionDesc) Set_isParam( value *GoNullable)  {
  this.isParam = value 
}
// getter for variable paramIndex
func (this *RangerAppFunctionDesc) Get_paramIndex() int64 {
  return this.paramIndex
}
// getter for variable paramIndex
func (this *RangerAppFunctionDesc) Set_paramIndex( value int64)  {
  this.paramIndex = value 
}
// getter for variable is_optional
func (this *RangerAppFunctionDesc) Get_is_optional() bool {
  return this.is_optional
}
// getter for variable is_optional
func (this *RangerAppFunctionDesc) Set_is_optional( value bool)  {
  this.is_optional = value 
}
// getter for variable is_mutating
func (this *RangerAppFunctionDesc) Get_is_mutating() bool {
  return this.is_mutating
}
// getter for variable is_mutating
func (this *RangerAppFunctionDesc) Set_is_mutating( value bool)  {
  this.is_mutating = value 
}
// getter for variable is_set
func (this *RangerAppFunctionDesc) Get_is_set() bool {
  return this.is_set
}
// getter for variable is_set
func (this *RangerAppFunctionDesc) Set_is_set( value bool)  {
  this.is_set = value 
}
// getter for variable is_class_variable
func (this *RangerAppFunctionDesc) Get_is_class_variable() bool {
  return this.is_class_variable
}
// getter for variable is_class_variable
func (this *RangerAppFunctionDesc) Set_is_class_variable( value bool)  {
  this.is_class_variable = value 
}
// getter for variable description
func (this *RangerAppFunctionDesc) Get_description() string {
  return this.description
}
// getter for variable description
func (this *RangerAppFunctionDesc) Set_description( value string)  {
  this.description = value 
}
// getter for variable git_doc
func (this *RangerAppFunctionDesc) Get_git_doc() string {
  return this.git_doc
}
// getter for variable git_doc
func (this *RangerAppFunctionDesc) Set_git_doc( value string)  {
  this.git_doc = value 
}
type RangerAppMethodVariants struct { 
  name string /**  unused  **/ 
  variants []*RangerAppFunctionDesc
}
type IFACE_RangerAppMethodVariants interface { 
  Get_name() string
  Set_name(value string) 
  Get_variants() []*RangerAppFunctionDesc
  Set_variants(value []*RangerAppFunctionDesc) 
}

func CreateNew_RangerAppMethodVariants() *RangerAppMethodVariants {
  me := new(RangerAppMethodVariants)
  me.name = ""
  me.variants = make([]*RangerAppFunctionDesc,0)
  return me;
}
// getter for variable name
func (this *RangerAppMethodVariants) Get_name() string {
  return this.name
}
// setter for variable name
func (this *RangerAppMethodVariants) Set_name( value string)  {
  this.name = value 
}
// getter for variable variants
func (this *RangerAppMethodVariants) Get_variants() []*RangerAppFunctionDesc {
  return this.variants
}
// setter for variable variants
func (this *RangerAppMethodVariants) Set_variants( value []*RangerAppFunctionDesc)  {
  this.variants = value 
}
type RangerAppInterfaceImpl struct { 
  name string /**  unused  **/ 
  typeParams *GoNullable /**  unused  **/ 
}
type IFACE_RangerAppInterfaceImpl interface { 
  Get_name() string
  Set_name(value string) 
  Get_typeParams() *GoNullable
  Set_typeParams(value *GoNullable) 
}

func CreateNew_RangerAppInterfaceImpl() *RangerAppInterfaceImpl {
  me := new(RangerAppInterfaceImpl)
  me.name = ""
  me.typeParams = new(GoNullable);
  return me;
}
// getter for variable name
func (this *RangerAppInterfaceImpl) Get_name() string {
  return this.name
}
// setter for variable name
func (this *RangerAppInterfaceImpl) Set_name( value string)  {
  this.name = value 
}
// getter for variable typeParams
func (this *RangerAppInterfaceImpl) Get_typeParams() *GoNullable {
  return this.typeParams
}
// setter for variable typeParams
func (this *RangerAppInterfaceImpl) Set_typeParams( value *GoNullable)  {
  this.typeParams = value 
}
type RangerAppClassDesc struct { 
  name string
  is_system bool
  compiledName string /**  unused  **/ 
  systemNames map[string]string
  systemInfo *GoNullable /**  unused  **/ 
  is_interface bool /**  unused  **/ 
  is_template bool /**  unused  **/ 
  generic_params *GoNullable /**  unused  **/ 
  ctx *GoNullable
  variables []IFACE_RangerAppParamDesc
  methods []*RangerAppFunctionDesc
  defined_methods map[string]bool
  static_methods []*RangerAppFunctionDesc
  defined_static_methods map[string]bool
  defined_variants []string
  method_variants map[string]*RangerAppMethodVariants
  has_constructor bool
  constructor_node *GoNullable
  constructor_fn *GoNullable
  has_destructor bool /**  unused  **/ 
  destructor_node *GoNullable /**  unused  **/ 
  destructor_fn *GoNullable /**  unused  **/ 
  extends_classes []string
  implements_interfaces []string /**  unused  **/ 
  nameNode *GoNullable
  classNode *GoNullable
  contr_writers []*CodeWriter /**  unused  **/ 
  is_inherited bool
  // inherited from parent class RangerAppParamDesc
  debugString string
  ref_cnt int64
  init_cnt int64
  set_cnt int64
  return_cnt int64
  prop_assign_cnt int64 /**  unused  **/ 
  value_type int64
  has_default bool /**  unused  **/ 
  def_value *GoNullable
  default_value *GoNullable /**  unused  **/ 
  isThis bool /**  unused  **/ 
  classDesc *GoNullable /**  unused  **/ 
  fnDesc *GoNullable /**  unused  **/ 
  ownerHistory []*RangerRefForce
  varType int64
  refType int64
  initRefType int64
  isParam *GoNullable /**  unused  **/ 
  paramIndex int64 /**  unused  **/ 
  is_optional bool
  is_mutating bool /**  unused  **/ 
  is_set bool /**  unused  **/ 
  is_class_variable bool
  node *GoNullable
  description string /**  unused  **/ 
  git_doc string /**  unused  **/ 
}
type IFACE_RangerAppClassDesc interface { 
  Get_name() string
  Set_name(value string) 
  Get_is_system() bool
  Set_is_system(value bool) 
  Get_compiledName() string
  Set_compiledName(value string) 
  Get_systemNames() map[string]string
  Set_systemNames(value map[string]string) 
  Get_systemInfo() *GoNullable
  Set_systemInfo(value *GoNullable) 
  Get_is_interface() bool
  Set_is_interface(value bool) 
  Get_is_template() bool
  Set_is_template(value bool) 
  Get_generic_params() *GoNullable
  Set_generic_params(value *GoNullable) 
  Get_ctx() *GoNullable
  Set_ctx(value *GoNullable) 
  Get_variables() []IFACE_RangerAppParamDesc
  Set_variables(value []IFACE_RangerAppParamDesc) 
  Get_methods() []*RangerAppFunctionDesc
  Set_methods(value []*RangerAppFunctionDesc) 
  Get_defined_methods() map[string]bool
  Set_defined_methods(value map[string]bool) 
  Get_static_methods() []*RangerAppFunctionDesc
  Set_static_methods(value []*RangerAppFunctionDesc) 
  Get_defined_static_methods() map[string]bool
  Set_defined_static_methods(value map[string]bool) 
  Get_defined_variants() []string
  Set_defined_variants(value []string) 
  Get_method_variants() map[string]*RangerAppMethodVariants
  Set_method_variants(value map[string]*RangerAppMethodVariants) 
  Get_has_constructor() bool
  Set_has_constructor(value bool) 
  Get_constructor_node() *GoNullable
  Set_constructor_node(value *GoNullable) 
  Get_constructor_fn() *GoNullable
  Set_constructor_fn(value *GoNullable) 
  Get_has_destructor() bool
  Set_has_destructor(value bool) 
  Get_destructor_node() *GoNullable
  Set_destructor_node(value *GoNullable) 
  Get_destructor_fn() *GoNullable
  Set_destructor_fn(value *GoNullable) 
  Get_extends_classes() []string
  Set_extends_classes(value []string) 
  Get_implements_interfaces() []string
  Set_implements_interfaces(value []string) 
  Get_nameNode() *GoNullable
  Set_nameNode(value *GoNullable) 
  Get_classNode() *GoNullable
  Set_classNode(value *GoNullable) 
  Get_contr_writers() []*CodeWriter
  Set_contr_writers(value []*CodeWriter) 
  Get_is_inherited() bool
  Set_is_inherited(value bool) 
  isClass() bool
  isProperty() bool
  doesInherit() bool
  isSameOrParentClass(class_name string, ctx *RangerAppWriterContext) bool
  hasMethod(m_name string) bool
  findMethod(f_name string) *GoNullable
  hasStaticMethod(m_name string) bool
  findStaticMethod(f_name string) *GoNullable
  findVariable(f_name string) *GoNullable
  addParentClass(p_name string) ()
  addVariable(desc IFACE_RangerAppParamDesc) ()
  addMethod(desc *RangerAppFunctionDesc) ()
  addStaticMethod(desc *RangerAppFunctionDesc) ()
}

func CreateNew_RangerAppClassDesc() *RangerAppClassDesc {
  me := new(RangerAppClassDesc)
  me.name = ""
  me.is_system = false
  me.compiledName = ""
  me.systemNames = make(map[string]string)
  me.is_interface = false
  me.is_template = false
  me.variables = make([]IFACE_RangerAppParamDesc,0)
  me.methods = make([]*RangerAppFunctionDesc,0)
  me.defined_methods = make(map[string]bool)
  me.static_methods = make([]*RangerAppFunctionDesc,0)
  me.defined_static_methods = make(map[string]bool)
  me.defined_variants = make([]string,0)
  me.method_variants = make(map[string]*RangerAppMethodVariants)
  me.has_constructor = false
  me.has_destructor = false
  me.extends_classes = make([]string,0)
  me.implements_interfaces = make([]string,0)
  me.contr_writers = make([]*CodeWriter,0)
  me.is_inherited = false
  me.systemInfo = new(GoNullable);
  me.generic_params = new(GoNullable);
  me.ctx = new(GoNullable);
  me.constructor_node = new(GoNullable);
  me.constructor_fn = new(GoNullable);
  me.destructor_node = new(GoNullable);
  me.destructor_fn = new(GoNullable);
  me.nameNode = new(GoNullable);
  me.classNode = new(GoNullable);
  me.name = ""
  me.compiledName = ""
  me.debugString = ""
  me.ref_cnt = 0
  me.init_cnt = 0
  me.set_cnt = 0
  me.return_cnt = 0
  me.prop_assign_cnt = 0
  me.value_type = 0
  me.has_default = false
  me.isThis = false
  me.ownerHistory = make([]*RangerRefForce,0)
  me.varType = 0
  me.refType = 0
  me.initRefType = 0
  me.paramIndex = 0
  me.is_optional = false
  me.is_mutating = false
  me.is_set = false
  me.is_class_variable = false
  me.description = ""
  me.git_doc = ""
  me.def_value = new(GoNullable);
  me.default_value = new(GoNullable);
  me.classDesc = new(GoNullable);
  me.fnDesc = new(GoNullable);
  me.isParam = new(GoNullable);
  me.node = new(GoNullable);
  me.nameNode = new(GoNullable);
  return me;
}
func (this *RangerAppClassDesc) isClass () bool {
  return true;
}
func (this *RangerAppClassDesc) isProperty () bool {
  return false;
}
func (this *RangerAppClassDesc) doesInherit () bool {
  return this.is_inherited;
}
func (this *RangerAppClassDesc) isSameOrParentClass (class_name string, ctx *RangerAppWriterContext) bool {
  if  class_name == this.name {
    return true;
  }
  if  (r_indexof_arr_string(this.extends_classes, class_name)) >= 0 {
    return true;
  }
  var i_2 int64 = 0;  
  for ; i_2 < int64(len(this.extends_classes)) ; i_2++ {
    c_name := this.extends_classes[i_2];
    var c *RangerAppClassDesc = ctx.findClass(c_name);
    if  c.isSameOrParentClass(class_name, ctx) {
      return true;
    }
  }
  return false;
}
func (this *RangerAppClassDesc) hasMethod (m_name string) bool {
  if  r_has_key_string_bool(this.defined_methods, m_name) {
    return true;
  }
  var i_5 int64 = 0;  
  for ; i_5 < int64(len(this.extends_classes)) ; i_5++ {
    cname := this.extends_classes[i_5];
    var cDesc *RangerAppClassDesc = this.ctx.value.(*RangerAppWriterContext).findClass(cname);
    if  cDesc.hasMethod(m_name) {
      return cDesc.hasMethod(m_name);
    }
  }
  return false;
}
func (this *RangerAppClassDesc) findMethod (f_name string) *GoNullable {
  var res *GoNullable = new(GoNullable); 
  var i_7 int64 = 0;  
  for ; i_7 < int64(len(this.methods)) ; i_7++ {
    m := this.methods[i_7];
    if  m.name == f_name {
      res.value = m;
      res.has_value = true; /* detected as non-optional */
      return res;
    }
  }
  var i_11 int64 = 0;  
  for ; i_11 < int64(len(this.extends_classes)) ; i_11++ {
    cname_4 := this.extends_classes[i_11];
    var cDesc_4 *RangerAppClassDesc = this.ctx.value.(*RangerAppWriterContext).findClass(cname_4);
    if  cDesc_4.hasMethod(f_name) {
      return cDesc_4.findMethod(f_name);
    }
  }
  return res;
}
func (this *RangerAppClassDesc) hasStaticMethod (m_name string) bool {
  return r_has_key_string_bool(this.defined_static_methods, m_name);
}
func (this *RangerAppClassDesc) findStaticMethod (f_name string) *GoNullable {
  var e *GoNullable = new(GoNullable); 
  var i_11 int64 = 0;  
  for ; i_11 < int64(len(this.static_methods)) ; i_11++ {
    m_4 := this.static_methods[i_11];
    if  m_4.name == f_name {
      e.value = m_4;
      e.has_value = true; /* detected as non-optional */
      return e;
    }
  }
  var i_15 int64 = 0;  
  for ; i_15 < int64(len(this.extends_classes)) ; i_15++ {
    cname_6 := this.extends_classes[i_15];
    var cDesc_6 *RangerAppClassDesc = this.ctx.value.(*RangerAppWriterContext).findClass(cname_6);
    if  cDesc_6.hasStaticMethod(f_name) {
      return cDesc_6.findStaticMethod(f_name);
    }
  }
  return e;
}
func (this *RangerAppClassDesc) findVariable (f_name string) *GoNullable {
  var e_4 *GoNullable = new(GoNullable); 
  var i_15 int64 = 0;  
  for ; i_15 < int64(len(this.variables)) ; i_15++ {
    m_6 := this.variables[i_15];
    if  m_6.Get_name() == f_name {
      e_4.value = m_6;
      e_4.has_value = true; /* detected as non-optional */
      return e_4;
    }
  }
  var i_19 int64 = 0;  
  for ; i_19 < int64(len(this.extends_classes)) ; i_19++ {
    cname_8 := this.extends_classes[i_19];
    var cDesc_8 *RangerAppClassDesc = this.ctx.value.(*RangerAppWriterContext).findClass(cname_8);
    return cDesc_8.findVariable(f_name);
  }
  return e_4;
}
func (this *RangerAppClassDesc) addParentClass (p_name string) () {
  this.extends_classes = append(this.extends_classes,p_name); 
}
func (this *RangerAppClassDesc) addVariable (desc IFACE_RangerAppParamDesc) () {
  this.variables = append(this.variables,desc); 
}
func (this *RangerAppClassDesc) addMethod (desc *RangerAppFunctionDesc) () {
  this.defined_methods[desc.name] = true
  this.methods = append(this.methods,desc); 
  var defVs *GoNullable = new(GoNullable); 
  defVs = r_get_string_RangerAppMethodVariants(this.method_variants, desc.name);
  if  !defVs.has_value  {
    var new_v *RangerAppMethodVariants = CreateNew_RangerAppMethodVariants();
    this.method_variants[desc.name] = new_v
    this.defined_variants = append(this.defined_variants,desc.name); 
    new_v.variants = append(new_v.variants,desc); 
  } else {
    var new_v2 *RangerAppMethodVariants = defVs.value.(*RangerAppMethodVariants);
    new_v2.variants = append(new_v2.variants,desc); 
  }
}
func (this *RangerAppClassDesc) addStaticMethod (desc *RangerAppFunctionDesc) () {
  this.defined_static_methods[desc.name] = true
  this.static_methods = append(this.static_methods,desc); 
}
// inherited methods from parent class RangerAppParamDesc
func (this *RangerAppClassDesc) changeStrength (newStrength int64, lifeTime int64, changer *CodeNode) () {
  var entry *RangerRefForce = CreateNew_RangerRefForce();
  entry.strength = newStrength; 
  entry.lifetime = lifeTime; 
  entry.changer.value = changer;
  entry.changer.has_value = true; /* detected as non-optional */
  this.ownerHistory = append(this.ownerHistory,entry); 
}
func (this *RangerAppClassDesc) isAllocatedType () bool {
  if  this.nameNode.has_value {
    if  this.nameNode.value.(*CodeNode).eval_type != 0 {
      if  this.nameNode.value.(*CodeNode).eval_type == 6 {
        return true;
      }
      if  this.nameNode.value.(*CodeNode).eval_type == 7 {
        return true;
      }
      if  (((this.nameNode.value.(*CodeNode).eval_type == 4) || (this.nameNode.value.(*CodeNode).eval_type == 2)) || (this.nameNode.value.(*CodeNode).eval_type == 5)) || (this.nameNode.value.(*CodeNode).eval_type == 3) {
        return false;
      }
      if  this.nameNode.value.(*CodeNode).eval_type == 11 {
        return false;
      }
      return true;
    }
    if  this.nameNode.value.(*CodeNode).eval_type == 11 {
      return false;
    }
    if  this.nameNode.value.(*CodeNode).value_type == 9 {
      if  false == this.nameNode.value.(*CodeNode).isPrimitive() {
        return true;
      }
    }
    if  this.nameNode.value.(*CodeNode).value_type == 6 {
      return true;
    }
    if  this.nameNode.value.(*CodeNode).value_type == 7 {
      return true;
    }
  }
  return false;
}
func (this *RangerAppClassDesc) moveRefTo (node *CodeNode, target IFACE_RangerAppParamDesc, ctx *RangerAppWriterContext) () {
  if  node.ref_change_done {
    return;
  }
  if  false == target.isAllocatedType() {
    return;
  }
  if  false == this.isAllocatedType() {
    return;
  }
  node.ref_change_done = true; 
  var other_s int64 = target.getStrength();
  var my_s int64 = this.getStrength();
  var my_lifetime int64 = this.getLifetime();
  var other_lifetime int64 = target.getLifetime();
  var a_lives bool = false;
  var b_lives bool = false;
  var tmp_var bool = this.nameNode.value.(*CodeNode).hasFlag("temp");
  if  target.Get_nameNode().has_value {
    if  target.Get_nameNode().value.(*CodeNode).hasFlag("lives") {
      my_lifetime = 2; 
      b_lives = true; 
    }
  }
  if  this.nameNode.has_value {
    if  this.nameNode.value.(*CodeNode).hasFlag("lives") {
      my_lifetime = 2; 
      a_lives = true; 
    }
  }
  if  other_s > 0 {
    if  my_s == 1 {
      var lt int64 = my_lifetime;
      if  other_lifetime > my_lifetime {
        lt = other_lifetime; 
      }
      this.changeStrength(0, lt, node);
    } else {
      if  my_s == 0 {
        if  tmp_var == false {
          ctx.addError(node, strings.Join([]string{ "Can not move a weak reference to a strong target, at ",node.getCode() }, ""));
          fmt.Println( "can not move weak refs to strong target:" )
          this.debugRefChanges();
        }
      } else {
        ctx.addError(node, strings.Join([]string{ "Can not move immutable reference to a strong target, evald type ",this.nameNode.value.(*CodeNode).eval_type_name }, ""));
      }
    }
  } else {
    if  a_lives || b_lives {
    } else {
      if  (my_lifetime < other_lifetime) && (this.return_cnt == 0) {
        if  this.nameNode.value.(*CodeNode).hasFlag("returnvalue") == false {
          ctx.addError(node, strings.Join([]string{ "Can not create a weak reference if target has longer lifetime than original, current lifetime == ",strconv.FormatInt(my_lifetime, 10) }, ""));
        }
      }
    }
  }
}
func (this *RangerAppClassDesc) originalStrength () int64 {
  var len int64 = int64(len(this.ownerHistory));
  if  len > 0 {
    var firstEntry *RangerRefForce = this.ownerHistory[0];
    return firstEntry.strength;
  }
  return 1;
}
func (this *RangerAppClassDesc) getLifetime () int64 {
  var len_4 int64 = int64(len(this.ownerHistory));
  if  len_4 > 0 {
    var lastEntry *RangerRefForce = this.ownerHistory[(len_4 - 1)];
    return lastEntry.lifetime;
  }
  return 1;
}
func (this *RangerAppClassDesc) getStrength () int64 {
  var len_6 int64 = int64(len(this.ownerHistory));
  if  len_6 > 0 {
    var lastEntry_4 *RangerRefForce = this.ownerHistory[(len_6 - 1)];
    return lastEntry_4.strength;
  }
  return 1;
}
func (this *RangerAppClassDesc) debugRefChanges () () {
  fmt.Println( strings.Join([]string{ (strings.Join([]string{ "variable ",this.name }, ""))," ref history : " }, "") )
  var i int64 = 0;  
  for ; i < int64(len(this.ownerHistory)) ; i++ {
    h := this.ownerHistory[i];
    fmt.Println( strings.Join([]string{ (strings.Join([]string{ (strings.Join([]string{ " => change to ",strconv.FormatInt(h.strength, 10) }, ""))," by " }, "")),h.changer.value.(*CodeNode).getCode() }, "") )
  }
}
func (this *RangerAppClassDesc) pointsToObject (ctx *RangerAppWriterContext) bool {
  if  this.nameNode.has_value {
    var is_primitive bool = false;
    switch (this.nameNode.value.(*CodeNode).array_type ) { 
      case "string" : 
        is_primitive = true; 
      case "int" : 
        is_primitive = true; 
      case "boolean" : 
        is_primitive = true; 
      case "double" : 
        is_primitive = true; 
    }
    if  is_primitive {
      return false;
    }
    if  (this.nameNode.value.(*CodeNode).value_type == 6) || (this.nameNode.value.(*CodeNode).value_type == 7) {
      var is_object bool = true;
      switch (this.nameNode.value.(*CodeNode).array_type ) { 
        case "string" : 
          is_object = false; 
        case "int" : 
          is_object = false; 
        case "boolean" : 
          is_object = false; 
        case "double" : 
          is_object = false; 
      }
      return is_object;
    }
    if  this.nameNode.value.(*CodeNode).value_type == 9 {
      var is_object_8 bool = true;
      switch (this.nameNode.value.(*CodeNode).type_name ) { 
        case "string" : 
          is_object_8 = false; 
        case "int" : 
          is_object_8 = false; 
        case "boolean" : 
          is_object_8 = false; 
        case "double" : 
          is_object_8 = false; 
      }
      if  ctx.isEnumDefined(this.nameNode.value.(*CodeNode).type_name) {
        return false;
      }
      return is_object_8;
    }
  }
  return false;
}
func (this *RangerAppClassDesc) isObject () bool {
  if  this.nameNode.has_value {
    if  this.nameNode.value.(*CodeNode).value_type == 9 {
      if  false == this.nameNode.value.(*CodeNode).isPrimitive() {
        return true;
      }
    }
  }
  return false;
}
func (this *RangerAppClassDesc) isArray () bool {
  if  this.nameNode.has_value {
    if  this.nameNode.value.(*CodeNode).value_type == 6 {
      return true;
    }
  }
  return false;
}
func (this *RangerAppClassDesc) isHash () bool {
  if  this.nameNode.has_value {
    if  this.nameNode.value.(*CodeNode).value_type == 7 {
      return true;
    }
  }
  return false;
}
func (this *RangerAppClassDesc) isPrimitive () bool {
  if  this.nameNode.has_value {
    return this.nameNode.value.(*CodeNode).isPrimitive();
  }
  return false;
}
func (this *RangerAppClassDesc) getRefTypeName () string {
  switch (this.refType ) { 
    case 0 : 
      return "NoType";
    case 1 : 
      return "Weak";
  }
  return "";
}
func (this *RangerAppClassDesc) getVarTypeName () string {
  switch (this.refType ) { 
    case 0 : 
      return "NoType";
    case 1 : 
      return "This";
  }
  return "";
}
func (this *RangerAppClassDesc) getTypeName () string {
  var s string = this.nameNode.value.(*CodeNode).type_name;
  return s;
}
// getter for variable name
func (this *RangerAppClassDesc) Get_name() string {
  return this.name
}
// setter for variable name
func (this *RangerAppClassDesc) Set_name( value string)  {
  this.name = value 
}
// getter for variable is_system
func (this *RangerAppClassDesc) Get_is_system() bool {
  return this.is_system
}
// setter for variable is_system
func (this *RangerAppClassDesc) Set_is_system( value bool)  {
  this.is_system = value 
}
// getter for variable compiledName
func (this *RangerAppClassDesc) Get_compiledName() string {
  return this.compiledName
}
// setter for variable compiledName
func (this *RangerAppClassDesc) Set_compiledName( value string)  {
  this.compiledName = value 
}
// getter for variable systemNames
func (this *RangerAppClassDesc) Get_systemNames() map[string]string {
  return this.systemNames
}
// setter for variable systemNames
func (this *RangerAppClassDesc) Set_systemNames( value map[string]string)  {
  this.systemNames = value 
}
// getter for variable systemInfo
func (this *RangerAppClassDesc) Get_systemInfo() *GoNullable {
  return this.systemInfo
}
// setter for variable systemInfo
func (this *RangerAppClassDesc) Set_systemInfo( value *GoNullable)  {
  this.systemInfo = value 
}
// getter for variable is_interface
func (this *RangerAppClassDesc) Get_is_interface() bool {
  return this.is_interface
}
// setter for variable is_interface
func (this *RangerAppClassDesc) Set_is_interface( value bool)  {
  this.is_interface = value 
}
// getter for variable is_template
func (this *RangerAppClassDesc) Get_is_template() bool {
  return this.is_template
}
// setter for variable is_template
func (this *RangerAppClassDesc) Set_is_template( value bool)  {
  this.is_template = value 
}
// getter for variable generic_params
func (this *RangerAppClassDesc) Get_generic_params() *GoNullable {
  return this.generic_params
}
// setter for variable generic_params
func (this *RangerAppClassDesc) Set_generic_params( value *GoNullable)  {
  this.generic_params = value 
}
// getter for variable ctx
func (this *RangerAppClassDesc) Get_ctx() *GoNullable {
  return this.ctx
}
// setter for variable ctx
func (this *RangerAppClassDesc) Set_ctx( value *GoNullable)  {
  this.ctx = value 
}
// getter for variable variables
func (this *RangerAppClassDesc) Get_variables() []IFACE_RangerAppParamDesc {
  return this.variables
}
// setter for variable variables
func (this *RangerAppClassDesc) Set_variables( value []IFACE_RangerAppParamDesc)  {
  this.variables = value 
}
// getter for variable methods
func (this *RangerAppClassDesc) Get_methods() []*RangerAppFunctionDesc {
  return this.methods
}
// setter for variable methods
func (this *RangerAppClassDesc) Set_methods( value []*RangerAppFunctionDesc)  {
  this.methods = value 
}
// getter for variable defined_methods
func (this *RangerAppClassDesc) Get_defined_methods() map[string]bool {
  return this.defined_methods
}
// setter for variable defined_methods
func (this *RangerAppClassDesc) Set_defined_methods( value map[string]bool)  {
  this.defined_methods = value 
}
// getter for variable static_methods
func (this *RangerAppClassDesc) Get_static_methods() []*RangerAppFunctionDesc {
  return this.static_methods
}
// setter for variable static_methods
func (this *RangerAppClassDesc) Set_static_methods( value []*RangerAppFunctionDesc)  {
  this.static_methods = value 
}
// getter for variable defined_static_methods
func (this *RangerAppClassDesc) Get_defined_static_methods() map[string]bool {
  return this.defined_static_methods
}
// setter for variable defined_static_methods
func (this *RangerAppClassDesc) Set_defined_static_methods( value map[string]bool)  {
  this.defined_static_methods = value 
}
// getter for variable defined_variants
func (this *RangerAppClassDesc) Get_defined_variants() []string {
  return this.defined_variants
}
// setter for variable defined_variants
func (this *RangerAppClassDesc) Set_defined_variants( value []string)  {
  this.defined_variants = value 
}
// getter for variable method_variants
func (this *RangerAppClassDesc) Get_method_variants() map[string]*RangerAppMethodVariants {
  return this.method_variants
}
// setter for variable method_variants
func (this *RangerAppClassDesc) Set_method_variants( value map[string]*RangerAppMethodVariants)  {
  this.method_variants = value 
}
// getter for variable has_constructor
func (this *RangerAppClassDesc) Get_has_constructor() bool {
  return this.has_constructor
}
// setter for variable has_constructor
func (this *RangerAppClassDesc) Set_has_constructor( value bool)  {
  this.has_constructor = value 
}
// getter for variable constructor_node
func (this *RangerAppClassDesc) Get_constructor_node() *GoNullable {
  return this.constructor_node
}
// setter for variable constructor_node
func (this *RangerAppClassDesc) Set_constructor_node( value *GoNullable)  {
  this.constructor_node = value 
}
// getter for variable constructor_fn
func (this *RangerAppClassDesc) Get_constructor_fn() *GoNullable {
  return this.constructor_fn
}
// setter for variable constructor_fn
func (this *RangerAppClassDesc) Set_constructor_fn( value *GoNullable)  {
  this.constructor_fn = value 
}
// getter for variable has_destructor
func (this *RangerAppClassDesc) Get_has_destructor() bool {
  return this.has_destructor
}
// setter for variable has_destructor
func (this *RangerAppClassDesc) Set_has_destructor( value bool)  {
  this.has_destructor = value 
}
// getter for variable destructor_node
func (this *RangerAppClassDesc) Get_destructor_node() *GoNullable {
  return this.destructor_node
}
// setter for variable destructor_node
func (this *RangerAppClassDesc) Set_destructor_node( value *GoNullable)  {
  this.destructor_node = value 
}
// getter for variable destructor_fn
func (this *RangerAppClassDesc) Get_destructor_fn() *GoNullable {
  return this.destructor_fn
}
// setter for variable destructor_fn
func (this *RangerAppClassDesc) Set_destructor_fn( value *GoNullable)  {
  this.destructor_fn = value 
}
// getter for variable extends_classes
func (this *RangerAppClassDesc) Get_extends_classes() []string {
  return this.extends_classes
}
// setter for variable extends_classes
func (this *RangerAppClassDesc) Set_extends_classes( value []string)  {
  this.extends_classes = value 
}
// getter for variable implements_interfaces
func (this *RangerAppClassDesc) Get_implements_interfaces() []string {
  return this.implements_interfaces
}
// setter for variable implements_interfaces
func (this *RangerAppClassDesc) Set_implements_interfaces( value []string)  {
  this.implements_interfaces = value 
}
// getter for variable nameNode
func (this *RangerAppClassDesc) Get_nameNode() *GoNullable {
  return this.nameNode
}
// setter for variable nameNode
func (this *RangerAppClassDesc) Set_nameNode( value *GoNullable)  {
  this.nameNode = value 
}
// getter for variable classNode
func (this *RangerAppClassDesc) Get_classNode() *GoNullable {
  return this.classNode
}
// setter for variable classNode
func (this *RangerAppClassDesc) Set_classNode( value *GoNullable)  {
  this.classNode = value 
}
// getter for variable contr_writers
func (this *RangerAppClassDesc) Get_contr_writers() []*CodeWriter {
  return this.contr_writers
}
// setter for variable contr_writers
func (this *RangerAppClassDesc) Set_contr_writers( value []*CodeWriter)  {
  this.contr_writers = value 
}
// getter for variable is_inherited
func (this *RangerAppClassDesc) Get_is_inherited() bool {
  return this.is_inherited
}
// setter for variable is_inherited
func (this *RangerAppClassDesc) Set_is_inherited( value bool)  {
  this.is_inherited = value 
}
// inherited getters and setters from the parent class RangerAppParamDesc
// getter for variable debugString
func (this *RangerAppClassDesc) Get_debugString() string {
  return this.debugString
}
// getter for variable debugString
func (this *RangerAppClassDesc) Set_debugString( value string)  {
  this.debugString = value 
}
// getter for variable ref_cnt
func (this *RangerAppClassDesc) Get_ref_cnt() int64 {
  return this.ref_cnt
}
// getter for variable ref_cnt
func (this *RangerAppClassDesc) Set_ref_cnt( value int64)  {
  this.ref_cnt = value 
}
// getter for variable init_cnt
func (this *RangerAppClassDesc) Get_init_cnt() int64 {
  return this.init_cnt
}
// getter for variable init_cnt
func (this *RangerAppClassDesc) Set_init_cnt( value int64)  {
  this.init_cnt = value 
}
// getter for variable set_cnt
func (this *RangerAppClassDesc) Get_set_cnt() int64 {
  return this.set_cnt
}
// getter for variable set_cnt
func (this *RangerAppClassDesc) Set_set_cnt( value int64)  {
  this.set_cnt = value 
}
// getter for variable return_cnt
func (this *RangerAppClassDesc) Get_return_cnt() int64 {
  return this.return_cnt
}
// getter for variable return_cnt
func (this *RangerAppClassDesc) Set_return_cnt( value int64)  {
  this.return_cnt = value 
}
// getter for variable prop_assign_cnt
func (this *RangerAppClassDesc) Get_prop_assign_cnt() int64 {
  return this.prop_assign_cnt
}
// getter for variable prop_assign_cnt
func (this *RangerAppClassDesc) Set_prop_assign_cnt( value int64)  {
  this.prop_assign_cnt = value 
}
// getter for variable value_type
func (this *RangerAppClassDesc) Get_value_type() int64 {
  return this.value_type
}
// getter for variable value_type
func (this *RangerAppClassDesc) Set_value_type( value int64)  {
  this.value_type = value 
}
// getter for variable has_default
func (this *RangerAppClassDesc) Get_has_default() bool {
  return this.has_default
}
// getter for variable has_default
func (this *RangerAppClassDesc) Set_has_default( value bool)  {
  this.has_default = value 
}
// getter for variable def_value
func (this *RangerAppClassDesc) Get_def_value() *GoNullable {
  return this.def_value
}
// getter for variable def_value
func (this *RangerAppClassDesc) Set_def_value( value *GoNullable)  {
  this.def_value = value 
}
// getter for variable default_value
func (this *RangerAppClassDesc) Get_default_value() *GoNullable {
  return this.default_value
}
// getter for variable default_value
func (this *RangerAppClassDesc) Set_default_value( value *GoNullable)  {
  this.default_value = value 
}
// getter for variable isThis
func (this *RangerAppClassDesc) Get_isThis() bool {
  return this.isThis
}
// getter for variable isThis
func (this *RangerAppClassDesc) Set_isThis( value bool)  {
  this.isThis = value 
}
// getter for variable classDesc
func (this *RangerAppClassDesc) Get_classDesc() *GoNullable {
  return this.classDesc
}
// getter for variable classDesc
func (this *RangerAppClassDesc) Set_classDesc( value *GoNullable)  {
  this.classDesc = value 
}
// getter for variable fnDesc
func (this *RangerAppClassDesc) Get_fnDesc() *GoNullable {
  return this.fnDesc
}
// getter for variable fnDesc
func (this *RangerAppClassDesc) Set_fnDesc( value *GoNullable)  {
  this.fnDesc = value 
}
// getter for variable ownerHistory
func (this *RangerAppClassDesc) Get_ownerHistory() []*RangerRefForce {
  return this.ownerHistory
}
// getter for variable ownerHistory
func (this *RangerAppClassDesc) Set_ownerHistory( value []*RangerRefForce)  {
  this.ownerHistory = value 
}
// getter for variable varType
func (this *RangerAppClassDesc) Get_varType() int64 {
  return this.varType
}
// getter for variable varType
func (this *RangerAppClassDesc) Set_varType( value int64)  {
  this.varType = value 
}
// getter for variable refType
func (this *RangerAppClassDesc) Get_refType() int64 {
  return this.refType
}
// getter for variable refType
func (this *RangerAppClassDesc) Set_refType( value int64)  {
  this.refType = value 
}
// getter for variable initRefType
func (this *RangerAppClassDesc) Get_initRefType() int64 {
  return this.initRefType
}
// getter for variable initRefType
func (this *RangerAppClassDesc) Set_initRefType( value int64)  {
  this.initRefType = value 
}
// getter for variable isParam
func (this *RangerAppClassDesc) Get_isParam() *GoNullable {
  return this.isParam
}
// getter for variable isParam
func (this *RangerAppClassDesc) Set_isParam( value *GoNullable)  {
  this.isParam = value 
}
// getter for variable paramIndex
func (this *RangerAppClassDesc) Get_paramIndex() int64 {
  return this.paramIndex
}
// getter for variable paramIndex
func (this *RangerAppClassDesc) Set_paramIndex( value int64)  {
  this.paramIndex = value 
}
// getter for variable is_optional
func (this *RangerAppClassDesc) Get_is_optional() bool {
  return this.is_optional
}
// getter for variable is_optional
func (this *RangerAppClassDesc) Set_is_optional( value bool)  {
  this.is_optional = value 
}
// getter for variable is_mutating
func (this *RangerAppClassDesc) Get_is_mutating() bool {
  return this.is_mutating
}
// getter for variable is_mutating
func (this *RangerAppClassDesc) Set_is_mutating( value bool)  {
  this.is_mutating = value 
}
// getter for variable is_set
func (this *RangerAppClassDesc) Get_is_set() bool {
  return this.is_set
}
// getter for variable is_set
func (this *RangerAppClassDesc) Set_is_set( value bool)  {
  this.is_set = value 
}
// getter for variable is_class_variable
func (this *RangerAppClassDesc) Get_is_class_variable() bool {
  return this.is_class_variable
}
// getter for variable is_class_variable
func (this *RangerAppClassDesc) Set_is_class_variable( value bool)  {
  this.is_class_variable = value 
}
// getter for variable node
func (this *RangerAppClassDesc) Get_node() *GoNullable {
  return this.node
}
// getter for variable node
func (this *RangerAppClassDesc) Set_node( value *GoNullable)  {
  this.node = value 
}
// getter for variable description
func (this *RangerAppClassDesc) Get_description() string {
  return this.description
}
// getter for variable description
func (this *RangerAppClassDesc) Set_description( value string)  {
  this.description = value 
}
// getter for variable git_doc
func (this *RangerAppClassDesc) Get_git_doc() string {
  return this.git_doc
}
// getter for variable git_doc
func (this *RangerAppClassDesc) Set_git_doc( value string)  {
  this.git_doc = value 
}
type RangerTypeClass struct { 
  name string /**  unused  **/ 
  compiledName string /**  unused  **/ 
  value_type int64 /**  unused  **/ 
  type_name *GoNullable /**  unused  **/ 
  key_type *GoNullable /**  unused  **/ 
  array_type *GoNullable /**  unused  **/ 
  is_primitive bool /**  unused  **/ 
  is_mutable bool /**  unused  **/ 
  is_optional bool /**  unused  **/ 
  is_generic bool /**  unused  **/ 
  is_lambda bool /**  unused  **/ 
  nameNode *GoNullable /**  unused  **/ 
  templateParams *GoNullable /**  unused  **/ 
  implements []*RangerTypeClass /**  unused  **/ 
}
type IFACE_RangerTypeClass interface { 
  Get_name() string
  Set_name(value string) 
  Get_compiledName() string
  Set_compiledName(value string) 
  Get_value_type() int64
  Set_value_type(value int64) 
  Get_type_name() *GoNullable
  Set_type_name(value *GoNullable) 
  Get_key_type() *GoNullable
  Set_key_type(value *GoNullable) 
  Get_array_type() *GoNullable
  Set_array_type(value *GoNullable) 
  Get_is_primitive() bool
  Set_is_primitive(value bool) 
  Get_is_mutable() bool
  Set_is_mutable(value bool) 
  Get_is_optional() bool
  Set_is_optional(value bool) 
  Get_is_generic() bool
  Set_is_generic(value bool) 
  Get_is_lambda() bool
  Set_is_lambda(value bool) 
  Get_nameNode() *GoNullable
  Set_nameNode(value *GoNullable) 
  Get_templateParams() *GoNullable
  Set_templateParams(value *GoNullable) 
  Get_implements() []*RangerTypeClass
  Set_implements(value []*RangerTypeClass) 
}

func CreateNew_RangerTypeClass() *RangerTypeClass {
  me := new(RangerTypeClass)
  me.name = ""
  me.compiledName = ""
  me.value_type = 0
  me.is_primitive = false
  me.is_mutable = false
  me.is_optional = false
  me.is_generic = false
  me.is_lambda = false
  me.implements = make([]*RangerTypeClass,0)
  me.type_name = new(GoNullable);
  me.key_type = new(GoNullable);
  me.array_type = new(GoNullable);
  me.nameNode = new(GoNullable);
  me.templateParams = new(GoNullable);
  return me;
}
// getter for variable name
func (this *RangerTypeClass) Get_name() string {
  return this.name
}
// setter for variable name
func (this *RangerTypeClass) Set_name( value string)  {
  this.name = value 
}
// getter for variable compiledName
func (this *RangerTypeClass) Get_compiledName() string {
  return this.compiledName
}
// setter for variable compiledName
func (this *RangerTypeClass) Set_compiledName( value string)  {
  this.compiledName = value 
}
// getter for variable value_type
func (this *RangerTypeClass) Get_value_type() int64 {
  return this.value_type
}
// setter for variable value_type
func (this *RangerTypeClass) Set_value_type( value int64)  {
  this.value_type = value 
}
// getter for variable type_name
func (this *RangerTypeClass) Get_type_name() *GoNullable {
  return this.type_name
}
// setter for variable type_name
func (this *RangerTypeClass) Set_type_name( value *GoNullable)  {
  this.type_name = value 
}
// getter for variable key_type
func (this *RangerTypeClass) Get_key_type() *GoNullable {
  return this.key_type
}
// setter for variable key_type
func (this *RangerTypeClass) Set_key_type( value *GoNullable)  {
  this.key_type = value 
}
// getter for variable array_type
func (this *RangerTypeClass) Get_array_type() *GoNullable {
  return this.array_type
}
// setter for variable array_type
func (this *RangerTypeClass) Set_array_type( value *GoNullable)  {
  this.array_type = value 
}
// getter for variable is_primitive
func (this *RangerTypeClass) Get_is_primitive() bool {
  return this.is_primitive
}
// setter for variable is_primitive
func (this *RangerTypeClass) Set_is_primitive( value bool)  {
  this.is_primitive = value 
}
// getter for variable is_mutable
func (this *RangerTypeClass) Get_is_mutable() bool {
  return this.is_mutable
}
// setter for variable is_mutable
func (this *RangerTypeClass) Set_is_mutable( value bool)  {
  this.is_mutable = value 
}
// getter for variable is_optional
func (this *RangerTypeClass) Get_is_optional() bool {
  return this.is_optional
}
// setter for variable is_optional
func (this *RangerTypeClass) Set_is_optional( value bool)  {
  this.is_optional = value 
}
// getter for variable is_generic
func (this *RangerTypeClass) Get_is_generic() bool {
  return this.is_generic
}
// setter for variable is_generic
func (this *RangerTypeClass) Set_is_generic( value bool)  {
  this.is_generic = value 
}
// getter for variable is_lambda
func (this *RangerTypeClass) Get_is_lambda() bool {
  return this.is_lambda
}
// setter for variable is_lambda
func (this *RangerTypeClass) Set_is_lambda( value bool)  {
  this.is_lambda = value 
}
// getter for variable nameNode
func (this *RangerTypeClass) Get_nameNode() *GoNullable {
  return this.nameNode
}
// setter for variable nameNode
func (this *RangerTypeClass) Set_nameNode( value *GoNullable)  {
  this.nameNode = value 
}
// getter for variable templateParams
func (this *RangerTypeClass) Get_templateParams() *GoNullable {
  return this.templateParams
}
// setter for variable templateParams
func (this *RangerTypeClass) Set_templateParams( value *GoNullable)  {
  this.templateParams = value 
}
// getter for variable implements
func (this *RangerTypeClass) Get_implements() []*RangerTypeClass {
  return this.implements
}
// setter for variable implements
func (this *RangerTypeClass) Set_implements( value []*RangerTypeClass)  {
  this.implements = value 
}
type SourceCode struct { 
  code string
  sp int64 /**  unused  **/ 
  ep int64 /**  unused  **/ 
  lines []string
  filename string
}
type IFACE_SourceCode interface { 
  Get_code() string
  Set_code(value string) 
  Get_sp() int64
  Set_sp(value int64) 
  Get_ep() int64
  Set_ep(value int64) 
  Get_lines() []string
  Set_lines(value []string) 
  Get_filename() string
  Set_filename(value string) 
  getLineString(line_index int64) string
  getLine(sp int64) int64
}

func CreateNew_SourceCode(code_str string) *SourceCode {
  me := new(SourceCode)
  me.code = ""
  me.sp = 0
  me.ep = 0
  me.lines = make([]string,0)
  me.filename = ""
  me.code = code_str; 
  me.lines = strings.Split(code_str, "\n"); 
  return me;
}
func (this *SourceCode) getLineString (line_index int64) string {
  if  (int64(len(this.lines))) > line_index {
    return this.lines[line_index];
  }
  return "";
}
func (this *SourceCode) getLine (sp int64) int64 {
  var cnt int64 = 0;
  var i_10 int64 = 0;  
  for ; i_10 < int64(len(this.lines)) ; i_10++ {
    str := this.lines[i_10];
    cnt = cnt + ((int64(len(str))) + 1); 
    if  cnt > sp {
      return i_10;
    }
  }
  return -1;
}
// getter for variable code
func (this *SourceCode) Get_code() string {
  return this.code
}
// setter for variable code
func (this *SourceCode) Set_code( value string)  {
  this.code = value 
}
// getter for variable sp
func (this *SourceCode) Get_sp() int64 {
  return this.sp
}
// setter for variable sp
func (this *SourceCode) Set_sp( value int64)  {
  this.sp = value 
}
// getter for variable ep
func (this *SourceCode) Get_ep() int64 {
  return this.ep
}
// setter for variable ep
func (this *SourceCode) Set_ep( value int64)  {
  this.ep = value 
}
// getter for variable lines
func (this *SourceCode) Get_lines() []string {
  return this.lines
}
// setter for variable lines
func (this *SourceCode) Set_lines( value []string)  {
  this.lines = value 
}
// getter for variable filename
func (this *SourceCode) Get_filename() string {
  return this.filename
}
// setter for variable filename
func (this *SourceCode) Set_filename( value string)  {
  this.filename = value 
}
type CodeNode struct { 
  code *GoNullable
  sp int64
  ep int64
  has_operator bool
  op_index int64
  is_system_class bool
  mutable_def bool
  expression bool
  vref string
  is_block_node bool
  infix_operator bool
  infix_node *GoNullable
  infix_subnode bool
  operator_pred int64
  to_the_right bool
  right_node *GoNullable
  type_type string
  type_name string
  key_type string
  array_type string
  ns []string
  nsp []IFACE_RangerAppParamDesc
  has_vref_annotation bool
  vref_annotation *GoNullable
  has_type_annotation bool
  type_annotation *GoNullable
  typeClass *GoNullable
  value_type int64
  eval_type int64
  eval_type_name string
  eval_key_type string
  eval_array_type string
  flow_done bool
  ref_change_done bool
  eval_type_node *GoNullable /**  unused  **/ 
  ref_type int64
  ref_need_assign int64 /**  unused  **/ 
  double_value float64
  string_value string
  int_value int64
  boolean_value bool
  expression_value *GoNullable
  props map[string]*CodeNode
  prop_keys []string
  comments []*CodeNode
  children []*CodeNode
  parent *GoNullable
  didReturnAtIndex int64
  hasVarDef bool
  hasClassDescription bool
  hasNewOper bool
  clDesc *GoNullable
  hasFnCall bool
  fnDesc *GoNullable
  hasParamDesc bool
  paramDesc *GoNullable
  ownParamDesc *GoNullable
  evalCtx *GoNullable
}
type IFACE_CodeNode interface { 
  Get_code() *GoNullable
  Set_code(value *GoNullable) 
  Get_sp() int64
  Set_sp(value int64) 
  Get_ep() int64
  Set_ep(value int64) 
  Get_has_operator() bool
  Set_has_operator(value bool) 
  Get_op_index() int64
  Set_op_index(value int64) 
  Get_is_system_class() bool
  Set_is_system_class(value bool) 
  Get_mutable_def() bool
  Set_mutable_def(value bool) 
  Get_expression() bool
  Set_expression(value bool) 
  Get_vref() string
  Set_vref(value string) 
  Get_is_block_node() bool
  Set_is_block_node(value bool) 
  Get_infix_operator() bool
  Set_infix_operator(value bool) 
  Get_infix_node() *GoNullable
  Set_infix_node(value *GoNullable) 
  Get_infix_subnode() bool
  Set_infix_subnode(value bool) 
  Get_operator_pred() int64
  Set_operator_pred(value int64) 
  Get_to_the_right() bool
  Set_to_the_right(value bool) 
  Get_right_node() *GoNullable
  Set_right_node(value *GoNullable) 
  Get_type_type() string
  Set_type_type(value string) 
  Get_type_name() string
  Set_type_name(value string) 
  Get_key_type() string
  Set_key_type(value string) 
  Get_array_type() string
  Set_array_type(value string) 
  Get_ns() []string
  Set_ns(value []string) 
  Get_nsp() []IFACE_RangerAppParamDesc
  Set_nsp(value []IFACE_RangerAppParamDesc) 
  Get_has_vref_annotation() bool
  Set_has_vref_annotation(value bool) 
  Get_vref_annotation() *GoNullable
  Set_vref_annotation(value *GoNullable) 
  Get_has_type_annotation() bool
  Set_has_type_annotation(value bool) 
  Get_type_annotation() *GoNullable
  Set_type_annotation(value *GoNullable) 
  Get_typeClass() *GoNullable
  Set_typeClass(value *GoNullable) 
  Get_value_type() int64
  Set_value_type(value int64) 
  Get_eval_type() int64
  Set_eval_type(value int64) 
  Get_eval_type_name() string
  Set_eval_type_name(value string) 
  Get_eval_key_type() string
  Set_eval_key_type(value string) 
  Get_eval_array_type() string
  Set_eval_array_type(value string) 
  Get_flow_done() bool
  Set_flow_done(value bool) 
  Get_ref_change_done() bool
  Set_ref_change_done(value bool) 
  Get_eval_type_node() *GoNullable
  Set_eval_type_node(value *GoNullable) 
  Get_ref_type() int64
  Set_ref_type(value int64) 
  Get_ref_need_assign() int64
  Set_ref_need_assign(value int64) 
  Get_double_value() float64
  Set_double_value(value float64) 
  Get_string_value() string
  Set_string_value(value string) 
  Get_int_value() int64
  Set_int_value(value int64) 
  Get_boolean_value() bool
  Set_boolean_value(value bool) 
  Get_expression_value() *GoNullable
  Set_expression_value(value *GoNullable) 
  Get_props() map[string]*CodeNode
  Set_props(value map[string]*CodeNode) 
  Get_prop_keys() []string
  Set_prop_keys(value []string) 
  Get_comments() []*CodeNode
  Set_comments(value []*CodeNode) 
  Get_children() []*CodeNode
  Set_children(value []*CodeNode) 
  Get_parent() *GoNullable
  Set_parent(value *GoNullable) 
  Get_didReturnAtIndex() int64
  Set_didReturnAtIndex(value int64) 
  Get_hasVarDef() bool
  Set_hasVarDef(value bool) 
  Get_hasClassDescription() bool
  Set_hasClassDescription(value bool) 
  Get_hasNewOper() bool
  Set_hasNewOper(value bool) 
  Get_clDesc() *GoNullable
  Set_clDesc(value *GoNullable) 
  Get_hasFnCall() bool
  Set_hasFnCall(value bool) 
  Get_fnDesc() *GoNullable
  Set_fnDesc(value *GoNullable) 
  Get_hasParamDesc() bool
  Set_hasParamDesc(value bool) 
  Get_paramDesc() *GoNullable
  Set_paramDesc(value *GoNullable) 
  Get_ownParamDesc() *GoNullable
  Set_ownParamDesc(value *GoNullable) 
  Get_evalCtx() *GoNullable
  Set_evalCtx(value *GoNullable) 
  getParsedString() string
  rebuildWithType(match *RangerArgMatch, changeVref bool) *CodeNode
  buildTypeSignatureUsingMatch(match *RangerArgMatch) string
  buildTypeSignature() string
  getVRefSignatureWithMatch(match *RangerArgMatch) string
  getVRefSignature() string
  getTypeSignatureWithMatch(match *RangerArgMatch) string
  getTypeSignature() string
  getFilename() string
  getFlag(flagName string) *GoNullable
  hasFlag(flagName string) bool
  setFlag(flagName string) ()
  getTypeInformationString() string
  getLine() int64
  getLineString(line_index int64) string
  getLineAsString() string
  getPositionalString() string
  copyEvalResFrom(node *CodeNode) ()
  defineNodeTypeTo(node *CodeNode, ctx *RangerAppWriterContext) ()
  typeNameAsType(ctx *RangerAppWriterContext) int64
  isPrimitive() bool
  isPrimitiveType() bool
  isAPrimitiveType() bool
  getFirst() *CodeNode
  getSecond() *CodeNode
  getThird() *CodeNode
  isSecondExpr() bool
  getOperator() string
  getVRefAt(idx int64) string
  getStringAt(idx int64) string
  hasExpressionProperty(name string) bool
  getExpressionProperty(name string) *GoNullable
  hasIntProperty(name string) bool
  getIntProperty(name string) int64
  hasDoubleProperty(name string) bool
  getDoubleProperty(name string) float64
  hasStringProperty(name string) bool
  getStringProperty(name string) string
  hasBooleanProperty(name string) bool
  getBooleanProperty(name string) bool
  isFirstTypeVref(vrefName string) bool
  isFirstVref(vrefName string) bool
  getString() string
  writeCode(wr *CodeWriter) ()
  getCode() string
  walk() ()
}

func CreateNew_CodeNode(source *SourceCode, start int64, end int64) *CodeNode {
  me := new(CodeNode)
  me.sp = 0
  me.ep = 0
  me.has_operator = false
  me.op_index = 0
  me.is_system_class = false
  me.mutable_def = false
  me.expression = false
  me.vref = ""
  me.is_block_node = false
  me.infix_operator = false
  me.infix_subnode = false
  me.operator_pred = 0
  me.to_the_right = false
  me.type_type = ""
  me.type_name = ""
  me.key_type = ""
  me.array_type = ""
  me.ns = make([]string,0)
  me.nsp = make([]IFACE_RangerAppParamDesc,0)
  me.has_vref_annotation = false
  me.has_type_annotation = false
  me.value_type = 0
  me.eval_type = 0
  me.eval_type_name = ""
  me.eval_key_type = ""
  me.eval_array_type = ""
  me.flow_done = false
  me.ref_change_done = false
  me.ref_type = 0
  me.ref_need_assign = 0
  me.double_value = 0.0
  me.string_value = ""
  me.int_value = 0
  me.boolean_value = false
  me.props = make(map[string]*CodeNode)
  me.prop_keys = make([]string,0)
  me.comments = make([]*CodeNode,0)
  me.children = make([]*CodeNode,0)
  me.didReturnAtIndex = -1
  me.hasVarDef = false
  me.hasClassDescription = false
  me.hasNewOper = false
  me.hasFnCall = false
  me.hasParamDesc = false
  me.code = new(GoNullable);
  me.infix_node = new(GoNullable);
  me.right_node = new(GoNullable);
  me.vref_annotation = new(GoNullable);
  me.type_annotation = new(GoNullable);
  me.typeClass = new(GoNullable);
  me.eval_type_node = new(GoNullable);
  me.expression_value = new(GoNullable);
  me.parent = new(GoNullable);
  me.clDesc = new(GoNullable);
  me.fnDesc = new(GoNullable);
  me.paramDesc = new(GoNullable);
  me.ownParamDesc = new(GoNullable);
  me.evalCtx = new(GoNullable);
  me.sp = start; 
  me.ep = end; 
  me.code.value = source;
  me.code.has_value = true; /* detected as non-optional */
  return me;
}
func (this *CodeNode) getParsedString () string {
  return this.code.value.(*SourceCode).code[this.sp:this.ep];
}
func (this *CodeNode) rebuildWithType (match *RangerArgMatch, changeVref bool) *CodeNode {
  var newNode *CodeNode = CreateNew_CodeNode(this.code.value.(*SourceCode), this.sp, this.ep);
  newNode.has_operator = this.has_operator; 
  newNode.op_index = this.op_index; 
  newNode.mutable_def = this.mutable_def; 
  newNode.expression = this.expression; 
  if  changeVref {
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
  if  this.has_vref_annotation {
    newNode.has_vref_annotation = true; 
    var ann *GoNullable = new(GoNullable); 
    ann.value = this.vref_annotation.value;
    ann.has_value = this.vref_annotation.has_value;
    newNode.vref_annotation.value = ann.value.(*CodeNode).rebuildWithType(match, true);
    newNode.vref_annotation.has_value = true; /* detected as non-optional */
  }
  if  this.has_type_annotation {
    newNode.has_type_annotation = true; 
    var t_ann *GoNullable = new(GoNullable); 
    t_ann.value = this.type_annotation.value;
    t_ann.has_value = this.type_annotation.has_value;
    newNode.type_annotation.value = t_ann.value.(*CodeNode).rebuildWithType(match, true);
    newNode.type_annotation.has_value = true; /* detected as non-optional */
  }
  var i_11 int64 = 0;  
  for ; i_11 < int64(len(this.ns)) ; i_11++ {
    n := this.ns[i_11];
    newNode.ns = append(newNode.ns,n); 
  }
  switch (this.value_type ) { 
    case 2 : 
      newNode.double_value = this.double_value; 
    case 4 : 
      newNode.string_value = this.string_value; 
    case 3 : 
      newNode.int_value = this.int_value; 
    case 5 : 
      newNode.boolean_value = this.boolean_value; 
    case 15 : 
      if  this.expression_value.has_value {
        newNode.expression_value.value = this.expression_value.value.(*CodeNode).rebuildWithType(match, changeVref);
        newNode.expression_value.has_value = true; /* detected as non-optional */
      }
  }
  var i_16 int64 = 0;  
  for ; i_16 < int64(len(this.prop_keys)) ; i_16++ {
    key := this.prop_keys[i_16];
    newNode.prop_keys = append(newNode.prop_keys,key); 
    var oldp *GoNullable = new(GoNullable); 
    oldp = r_get_string_CodeNode(this.props, key);
    var np *CodeNode = oldp.value.(*CodeNode).rebuildWithType(match, changeVref);
    newNode.props[key] = np
  }
  var i_19 int64 = 0;  
  for ; i_19 < int64(len(this.children)) ; i_19++ {
    ch := this.children[i_19];
    var newCh *CodeNode = ch.rebuildWithType(match, changeVref);
    newCh.parent.value = newNode;
    newCh.parent.has_value = true; /* detected as non-optional */
    newNode.children = append(newNode.children,newCh); 
  }
  return newNode;
}
func (this *CodeNode) buildTypeSignatureUsingMatch (match *RangerArgMatch) string {
  var tName string = match.getTypeName(this.type_name);
  switch (tName ) { 
    case "double" : 
      return "double";
    case "string" : 
      return "string";
    case "integer" : 
      return "int";
    case "boolean" : 
      return "boolean";
  }
  var s_2 string = "";
  if  this.value_type == 6 {
    s_2 = strings.Join([]string{ s_2,"[" }, ""); 
    s_2 = strings.Join([]string{ s_2,match.getTypeName(this.array_type) }, ""); 
    s_2 = strings.Join([]string{ s_2,this.getTypeSignatureWithMatch(match) }, ""); 
    s_2 = strings.Join([]string{ s_2,"]" }, ""); 
    return s_2;
  }
  if  this.value_type == 7 {
    s_2 = strings.Join([]string{ s_2,"[" }, ""); 
    s_2 = strings.Join([]string{ s_2,match.getTypeName(this.key_type) }, ""); 
    s_2 = strings.Join([]string{ s_2,":" }, ""); 
    s_2 = strings.Join([]string{ s_2,match.getTypeName(this.array_type) }, ""); 
    s_2 = strings.Join([]string{ s_2,this.getTypeSignatureWithMatch(match) }, ""); 
    s_2 = strings.Join([]string{ s_2,"]" }, ""); 
    return s_2;
  }
  s_2 = match.getTypeName(this.type_name); 
  s_2 = strings.Join([]string{ s_2,this.getVRefSignatureWithMatch(match) }, ""); 
  return s_2;
}
func (this *CodeNode) buildTypeSignature () string {
  switch (this.value_type ) { 
    case 2 : 
      return "double";
    case 4 : 
      return "string";
    case 3 : 
      return "int";
    case 5 : 
      return "boolean";
    case 12 : 
      return "char";
    case 13 : 
      return "charbuffer";
  }
  var s_5 string = "";
  if  this.value_type == 6 {
    s_5 = strings.Join([]string{ s_5,"[" }, ""); 
    s_5 = strings.Join([]string{ s_5,this.array_type }, ""); 
    s_5 = strings.Join([]string{ s_5,this.getTypeSignature() }, ""); 
    s_5 = strings.Join([]string{ s_5,"]" }, ""); 
    return s_5;
  }
  if  this.value_type == 7 {
    s_5 = strings.Join([]string{ s_5,"[" }, ""); 
    s_5 = strings.Join([]string{ s_5,this.key_type }, ""); 
    s_5 = strings.Join([]string{ s_5,":" }, ""); 
    s_5 = strings.Join([]string{ s_5,this.array_type }, ""); 
    s_5 = strings.Join([]string{ s_5,this.getTypeSignature() }, ""); 
    s_5 = strings.Join([]string{ s_5,"]" }, ""); 
    return s_5;
  }
  s_5 = this.type_name; 
  s_5 = strings.Join([]string{ s_5,this.getVRefSignature() }, ""); 
  return s_5;
}
func (this *CodeNode) getVRefSignatureWithMatch (match *RangerArgMatch) string {
  if  this.has_vref_annotation {
    var nn *CodeNode = this.vref_annotation.value.(*CodeNode).rebuildWithType(match, true);
    return strings.Join([]string{ "@",nn.getCode() }, "");
  }
  return "";
}
func (this *CodeNode) getVRefSignature () string {
  if  this.has_vref_annotation {
    return strings.Join([]string{ "@",this.vref_annotation.value.(*CodeNode).getCode() }, "");
  }
  return "";
}
func (this *CodeNode) getTypeSignatureWithMatch (match *RangerArgMatch) string {
  if  this.has_type_annotation {
    var nn_4 *CodeNode = this.type_annotation.value.(*CodeNode).rebuildWithType(match, true);
    return strings.Join([]string{ "@",nn_4.getCode() }, "");
  }
  return "";
}
func (this *CodeNode) getTypeSignature () string {
  if  this.has_type_annotation {
    return strings.Join([]string{ "@",this.type_annotation.value.(*CodeNode).getCode() }, "");
  }
  return "";
}
func (this *CodeNode) getFilename () string {
  return this.code.value.(*SourceCode).filename;
}
func (this *CodeNode) getFlag (flagName string) *GoNullable {
  var res_2 *GoNullable = new(GoNullable); 
  if  false == this.has_vref_annotation {
    return res_2;
  }
  var i_18 int64 = 0;  
  for ; i_18 < int64(len(this.vref_annotation.value.(*CodeNode).children)) ; i_18++ {
    ch_4 := this.vref_annotation.value.(*CodeNode).children[i_18];
    if  ch_4.vref == flagName {
      res_2.value = ch_4;
      res_2.has_value = true; /* detected as non-optional */
      return res_2;
    }
  }
  return res_2;
}
func (this *CodeNode) hasFlag (flagName string) bool {
  if  false == this.has_vref_annotation {
    return false;
  }
  var i_20 int64 = 0;  
  for ; i_20 < int64(len(this.vref_annotation.value.(*CodeNode).children)) ; i_20++ {
    ch_6 := this.vref_annotation.value.(*CodeNode).children[i_20];
    if  ch_6.vref == flagName {
      return true;
    }
  }
  return false;
}
func (this *CodeNode) setFlag (flagName string) () {
  if  false == this.has_vref_annotation {
    this.vref_annotation.value = CreateNew_CodeNode(this.code.value.(*SourceCode), this.sp, this.ep);
    this.vref_annotation.has_value = true; /* detected as non-optional */
  }
  if  this.hasFlag(flagName) {
    return;
  }
  var flag *CodeNode = CreateNew_CodeNode(this.code.value.(*SourceCode), this.sp, this.ep);
  flag.vref = flagName; 
  flag.value_type = 9; 
  this.vref_annotation.value.(*CodeNode).children = append(this.vref_annotation.value.(*CodeNode).children,flag); 
  this.has_vref_annotation = true; 
}
func (this *CodeNode) getTypeInformationString () string {
  var s_7 string = "";
  if  (int64(len(this.vref))) > 0 {
    s_7 = strings.Join([]string{ (strings.Join([]string{ (strings.Join([]string{ s_7,"<vref:" }, "")),this.vref }, "")),">" }, ""); 
  } else {
    s_7 = strings.Join([]string{ s_7,"<no.vref>" }, ""); 
  }
  if  (int64(len(this.type_name))) > 0 {
    s_7 = strings.Join([]string{ (strings.Join([]string{ (strings.Join([]string{ s_7,"<type_name:" }, "")),this.type_name }, "")),">" }, ""); 
  } else {
    s_7 = strings.Join([]string{ s_7,"<no.type_name>" }, ""); 
  }
  if  (int64(len(this.array_type))) > 0 {
    s_7 = strings.Join([]string{ (strings.Join([]string{ (strings.Join([]string{ s_7,"<array_type:" }, "")),this.array_type }, "")),">" }, ""); 
  } else {
    s_7 = strings.Join([]string{ s_7,"<no.array_type>" }, ""); 
  }
  if  (int64(len(this.key_type))) > 0 {
    s_7 = strings.Join([]string{ (strings.Join([]string{ (strings.Join([]string{ s_7,"<key_type:" }, "")),this.key_type }, "")),">" }, ""); 
  } else {
    s_7 = strings.Join([]string{ s_7,"<no.key_type>" }, ""); 
  }
  switch (this.value_type ) { 
    case 5 : 
      s_7 = strings.Join([]string{ s_7,"<value_type=Boolean>" }, ""); 
    case 4 : 
      s_7 = strings.Join([]string{ s_7,"<value_type=String>" }, ""); 
  }
  return s_7;
}
func (this *CodeNode) getLine () int64 {
  return this.code.value.(*SourceCode).getLine(this.sp);
}
func (this *CodeNode) getLineString (line_index int64) string {
  return this.code.value.(*SourceCode).getLineString(line_index);
}
func (this *CodeNode) getLineAsString () string {
  var idx int64 = this.getLine();
  var line_name_idx int64 = idx + 1;
  return strings.Join([]string{ (strings.Join([]string{ (strings.Join([]string{ (strings.Join([]string{ this.getFilename(),", line " }, "")),strconv.FormatInt(line_name_idx, 10) }, ""))," : " }, "")),this.code.value.(*SourceCode).getLineString(idx) }, "");
}
func (this *CodeNode) getPositionalString () string {
  if  (this.ep > this.sp) && ((this.ep - this.sp) < 50) {
    var start int64 = this.sp;
    var end int64 = this.ep;
    start = start - 100; 
    end = end + 50; 
    if  start < 0 {
      start = 0; 
    }
    if  end >= (int64(len(this.code.value.(*SourceCode).code))) {
      end = (int64(len(this.code.value.(*SourceCode).code))) - 1; 
    }
    return this.code.value.(*SourceCode).code[start:end];
  }
  return "";
}
func (this *CodeNode) copyEvalResFrom (node *CodeNode) () {
  if  node.hasParamDesc {
    this.hasParamDesc = node.hasParamDesc; 
    this.paramDesc.value = node.paramDesc.value;
    this.paramDesc.has_value = node.paramDesc.has_value; 
  }
  if  node.typeClass.has_value {
    this.typeClass.value = node.typeClass.value;
    this.typeClass.has_value = node.typeClass.has_value; 
  }
  this.eval_type = node.eval_type; 
  this.eval_type_name = node.eval_type_name; 
  if  node.hasFlag("optional") {
    this.setFlag("optional");
  }
  if  node.value_type == 7 {
    this.eval_key_type = node.eval_key_type; 
    this.eval_array_type = node.eval_array_type; 
    this.eval_type = 7; 
  }
  if  node.value_type == 6 {
    this.eval_key_type = node.eval_key_type; 
    this.eval_array_type = node.eval_array_type; 
    this.eval_type = 6; 
  }
}
func (this *CodeNode) defineNodeTypeTo (node *CodeNode, ctx *RangerAppWriterContext) () {
  switch (this.type_name ) { 
    case "double" : 
      node.value_type = 2; 
      node.eval_type = 2; 
      node.eval_type_name = "double"; 
    case "int" : 
      node.value_type = 3; 
      node.eval_type = 3; 
      node.eval_type_name = "int"; 
    case "char" : 
      node.value_type = 12; 
      node.eval_type = 12; 
      node.eval_type_name = "char"; 
    case "charbuffer" : 
      node.value_type = 13; 
      node.eval_type = 13; 
      node.eval_type_name = "charbuffer"; 
    case "string" : 
      node.value_type = 4; 
      node.eval_type = 4; 
      node.eval_type_name = "string"; 
    case "boolean" : 
      node.value_type = 5; 
      node.eval_type = 5; 
      node.eval_type_name = "string"; 
    default: 
      if  true == this.expression {
        node.value_type = 15; 
        node.eval_type = 15; 
        node.expression = true; 
      }
      if  this.value_type == 6 {
        node.value_type = 6; 
        node.eval_type = 6; 
        node.eval_type_name = this.type_name; 
        node.eval_array_type = this.array_type; 
      }
      if  this.value_type == 7 {
        node.value_type = 7; 
        node.eval_type = 7; 
        node.eval_type_name = this.type_name; 
        node.eval_array_type = this.array_type; 
        node.key_type = this.key_type; 
      }
      if  this.value_type == 11 {
        node.value_type = 11; 
        node.eval_type = 11; 
        node.eval_type_name = this.type_name; 
      }
      if  this.value_type == 9 {
        if  ctx.isEnumDefined(this.type_name) {
          node.value_type = 11; 
          node.eval_type = 11; 
          node.eval_type_name = this.type_name; 
        }
        if  ctx.isDefinedClass(this.type_name) {
          node.value_type = 8; 
          node.eval_type = 8; 
          node.eval_type_name = this.type_name; 
        }
      }
  }
}
func (this *CodeNode) typeNameAsType (ctx *RangerAppWriterContext) int64 {
  switch (this.type_name ) { 
    case "double" : 
      return 2;
    case "int" : 
      return 3;
    case "string" : 
      return 4;
    case "boolean" : 
      return 5;
    case "char" : 
      return 12;
    case "charbuffer" : 
      return 13;
    default: 
      if  true == this.expression {
        return 15;
      }
      if  this.value_type == 9 {
        if  ctx.isEnumDefined(this.type_name) {
          return 11;
        }
        if  ctx.isDefinedClass(this.type_name) {
          return 8;
        }
      }
  }
  return this.value_type;
}
func (this *CodeNode) isPrimitive () bool {
  if  (((((this.value_type == 2) || (this.value_type == 4)) || (this.value_type == 3)) || (this.value_type == 12)) || (this.value_type == 13)) || (this.value_type == 5) {
    return true;
  }
  return false;
}
func (this *CodeNode) isPrimitiveType () bool {
  var tn string = this.type_name;
  if  (((((tn == "double") || (tn == "string")) || (tn == "int")) || (tn == "char")) || (tn == "charbuffer")) || (tn == "boolean") {
    return true;
  }
  return false;
}
func (this *CodeNode) isAPrimitiveType () bool {
  var tn_4 string = this.type_name;
  if  (this.value_type == 6) || (this.value_type == 7) {
    tn_4 = this.array_type; 
  }
  if  (((((tn_4 == "double") || (tn_4 == "string")) || (tn_4 == "int")) || (tn_4 == "char")) || (tn_4 == "charbuffer")) || (tn_4 == "boolean") {
    return true;
  }
  return false;
}
func (this *CodeNode) getFirst () *CodeNode {
  return this.children[0];
}
func (this *CodeNode) getSecond () *CodeNode {
  return this.children[1];
}
func (this *CodeNode) getThird () *CodeNode {
  return this.children[2];
}
func (this *CodeNode) isSecondExpr () bool {
  if  (int64(len(this.children))) > 1 {
    var second *CodeNode = this.children[1];
    if  second.expression {
      return true;
    }
  }
  return false;
}
func (this *CodeNode) getOperator () string {
  var s_9 string = "";
  if  (int64(len(this.children))) > 0 {
    var fc *CodeNode = this.children[0];
    if  fc.value_type == 9 {
      return fc.vref;
    }
  }
  return s_9;
}
func (this *CodeNode) getVRefAt (idx int64) string {
  var s_11 string = "";
  if  (int64(len(this.children))) > idx {
    var fc_4 *CodeNode = this.children[idx];
    return fc_4.vref;
  }
  return s_11;
}
func (this *CodeNode) getStringAt (idx int64) string {
  var s_13 string = "";
  if  (int64(len(this.children))) > idx {
    var fc_6 *CodeNode = this.children[idx];
    if  fc_6.value_type == 4 {
      return fc_6.string_value;
    }
  }
  return s_13;
}
func (this *CodeNode) hasExpressionProperty (name string) bool {
  var ann_4 *GoNullable = new(GoNullable); 
  ann_4 = r_get_string_CodeNode(this.props, name);
  if  ann_4.has_value {
    return ann_4.value.(*CodeNode).expression;
  }
  return false;
}
func (this *CodeNode) getExpressionProperty (name string) *GoNullable {
  var ann_6 *GoNullable = new(GoNullable); 
  ann_6 = r_get_string_CodeNode(this.props, name);
  if  ann_6.has_value {
    return ann_6;
  }
  return ann_6;
}
func (this *CodeNode) hasIntProperty (name string) bool {
  var ann_8 *GoNullable = new(GoNullable); 
  ann_8 = r_get_string_CodeNode(this.props, name);
  if  ann_8.has_value {
    var fc_8 *CodeNode = ann_8.value.(*CodeNode).children[0];
    if  fc_8.value_type == 3 {
      return true;
    }
  }
  return false;
}
func (this *CodeNode) getIntProperty (name string) int64 {
  var ann_10 *GoNullable = new(GoNullable); 
  ann_10 = r_get_string_CodeNode(this.props, name);
  if  ann_10.has_value {
    var fc_10 *CodeNode = ann_10.value.(*CodeNode).children[0];
    if  fc_10.value_type == 3 {
      return fc_10.int_value;
    }
  }
  return 0;
}
func (this *CodeNode) hasDoubleProperty (name string) bool {
  var ann_12 *GoNullable = new(GoNullable); 
  ann_12 = r_get_string_CodeNode(this.props, name);
  if  ann_12.has_value {
    if  ann_12.value.(*CodeNode).value_type == 2 {
      return true;
    }
  }
  return false;
}
func (this *CodeNode) getDoubleProperty (name string) float64 {
  var ann_14 *GoNullable = new(GoNullable); 
  ann_14 = r_get_string_CodeNode(this.props, name);
  if  ann_14.has_value {
    if  ann_14.value.(*CodeNode).value_type == 2 {
      return ann_14.value.(*CodeNode).double_value;
    }
  }
  return 0.0;
}
func (this *CodeNode) hasStringProperty (name string) bool {
  if  false == (r_has_key_string_CodeNode(this.props, name)) {
    return false;
  }
  var ann_16 *GoNullable = new(GoNullable); 
  ann_16 = r_get_string_CodeNode(this.props, name);
  if  ann_16.has_value {
    if  ann_16.value.(*CodeNode).value_type == 4 {
      return true;
    }
  }
  return false;
}
func (this *CodeNode) getStringProperty (name string) string {
  var ann_18 *GoNullable = new(GoNullable); 
  ann_18 = r_get_string_CodeNode(this.props, name);
  if  ann_18.has_value {
    if  ann_18.value.(*CodeNode).value_type == 4 {
      return ann_18.value.(*CodeNode).string_value;
    }
  }
  return "";
}
func (this *CodeNode) hasBooleanProperty (name string) bool {
  var ann_20 *GoNullable = new(GoNullable); 
  ann_20 = r_get_string_CodeNode(this.props, name);
  if  ann_20.has_value {
    if  ann_20.value.(*CodeNode).value_type == 5 {
      return true;
    }
  }
  return false;
}
func (this *CodeNode) getBooleanProperty (name string) bool {
  var ann_22 *GoNullable = new(GoNullable); 
  ann_22 = r_get_string_CodeNode(this.props, name);
  if  ann_22.has_value {
    if  ann_22.value.(*CodeNode).value_type == 5 {
      return ann_22.value.(*CodeNode).boolean_value;
    }
  }
  return false;
}
func (this *CodeNode) isFirstTypeVref (vrefName string) bool {
  if  (int64(len(this.children))) > 0 {
    var fc_12 *CodeNode = this.children[0];
    if  fc_12.value_type == 9 {
      return true;
    }
  }
  return false;
}
func (this *CodeNode) isFirstVref (vrefName string) bool {
  if  (int64(len(this.children))) > 0 {
    var fc_14 *CodeNode = this.children[0];
    if  fc_14.vref == vrefName {
      return true;
    }
  }
  return false;
}
func (this *CodeNode) getString () string {
  return this.code.value.(*SourceCode).code[this.sp:this.ep];
}
func (this *CodeNode) writeCode (wr *CodeWriter) () {
  switch (this.value_type ) { 
    case 2 : 
      wr.out(strconv.FormatFloat(this.double_value,'f', 6, 64), false);
    case 4 : 
      wr.out(strings.Join([]string{ (strings.Join([]string{ (string([] byte{byte(34)})),this.string_value }, "")),(string([] byte{byte(34)})) }, ""), false);
    case 3 : 
      wr.out(strings.Join([]string{ "",strconv.FormatInt(this.int_value, 10) }, ""), false);
    case 5 : 
      if  this.boolean_value {
        wr.out("true", false);
      } else {
        wr.out("false", false);
      }
  }
}
func (this *CodeNode) getCode () string {
  var wr *CodeWriter = CreateNew_CodeWriter();
  this.writeCode(wr);
  return wr.getCode();
}
func (this *CodeNode) walk () () {
  switch (this.value_type ) { 
    case 2 : 
      fmt.Println( strings.Join([]string{ "Double : ",strconv.FormatFloat(this.double_value,'f', 6, 64) }, "") )
    case 4 : 
      fmt.Println( strings.Join([]string{ "String : ",this.string_value }, "") )
  }
  if  this.expression {
    fmt.Println( "(" )
  } else {
    fmt.Println( this.code.value.(*SourceCode).code[this.sp:this.ep] )
  }
  var i_22 int64 = 0;  
  for ; i_22 < int64(len(this.children)) ; i_22++ {
    item := this.children[i_22];
    item.walk();
  }
  if  this.expression {
    fmt.Println( ")" )
  }
}
// getter for variable code
func (this *CodeNode) Get_code() *GoNullable {
  return this.code
}
// setter for variable code
func (this *CodeNode) Set_code( value *GoNullable)  {
  this.code = value 
}
// getter for variable sp
func (this *CodeNode) Get_sp() int64 {
  return this.sp
}
// setter for variable sp
func (this *CodeNode) Set_sp( value int64)  {
  this.sp = value 
}
// getter for variable ep
func (this *CodeNode) Get_ep() int64 {
  return this.ep
}
// setter for variable ep
func (this *CodeNode) Set_ep( value int64)  {
  this.ep = value 
}
// getter for variable has_operator
func (this *CodeNode) Get_has_operator() bool {
  return this.has_operator
}
// setter for variable has_operator
func (this *CodeNode) Set_has_operator( value bool)  {
  this.has_operator = value 
}
// getter for variable op_index
func (this *CodeNode) Get_op_index() int64 {
  return this.op_index
}
// setter for variable op_index
func (this *CodeNode) Set_op_index( value int64)  {
  this.op_index = value 
}
// getter for variable is_system_class
func (this *CodeNode) Get_is_system_class() bool {
  return this.is_system_class
}
// setter for variable is_system_class
func (this *CodeNode) Set_is_system_class( value bool)  {
  this.is_system_class = value 
}
// getter for variable mutable_def
func (this *CodeNode) Get_mutable_def() bool {
  return this.mutable_def
}
// setter for variable mutable_def
func (this *CodeNode) Set_mutable_def( value bool)  {
  this.mutable_def = value 
}
// getter for variable expression
func (this *CodeNode) Get_expression() bool {
  return this.expression
}
// setter for variable expression
func (this *CodeNode) Set_expression( value bool)  {
  this.expression = value 
}
// getter for variable vref
func (this *CodeNode) Get_vref() string {
  return this.vref
}
// setter for variable vref
func (this *CodeNode) Set_vref( value string)  {
  this.vref = value 
}
// getter for variable is_block_node
func (this *CodeNode) Get_is_block_node() bool {
  return this.is_block_node
}
// setter for variable is_block_node
func (this *CodeNode) Set_is_block_node( value bool)  {
  this.is_block_node = value 
}
// getter for variable infix_operator
func (this *CodeNode) Get_infix_operator() bool {
  return this.infix_operator
}
// setter for variable infix_operator
func (this *CodeNode) Set_infix_operator( value bool)  {
  this.infix_operator = value 
}
// getter for variable infix_node
func (this *CodeNode) Get_infix_node() *GoNullable {
  return this.infix_node
}
// setter for variable infix_node
func (this *CodeNode) Set_infix_node( value *GoNullable)  {
  this.infix_node = value 
}
// getter for variable infix_subnode
func (this *CodeNode) Get_infix_subnode() bool {
  return this.infix_subnode
}
// setter for variable infix_subnode
func (this *CodeNode) Set_infix_subnode( value bool)  {
  this.infix_subnode = value 
}
// getter for variable operator_pred
func (this *CodeNode) Get_operator_pred() int64 {
  return this.operator_pred
}
// setter for variable operator_pred
func (this *CodeNode) Set_operator_pred( value int64)  {
  this.operator_pred = value 
}
// getter for variable to_the_right
func (this *CodeNode) Get_to_the_right() bool {
  return this.to_the_right
}
// setter for variable to_the_right
func (this *CodeNode) Set_to_the_right( value bool)  {
  this.to_the_right = value 
}
// getter for variable right_node
func (this *CodeNode) Get_right_node() *GoNullable {
  return this.right_node
}
// setter for variable right_node
func (this *CodeNode) Set_right_node( value *GoNullable)  {
  this.right_node = value 
}
// getter for variable type_type
func (this *CodeNode) Get_type_type() string {
  return this.type_type
}
// setter for variable type_type
func (this *CodeNode) Set_type_type( value string)  {
  this.type_type = value 
}
// getter for variable type_name
func (this *CodeNode) Get_type_name() string {
  return this.type_name
}
// setter for variable type_name
func (this *CodeNode) Set_type_name( value string)  {
  this.type_name = value 
}
// getter for variable key_type
func (this *CodeNode) Get_key_type() string {
  return this.key_type
}
// setter for variable key_type
func (this *CodeNode) Set_key_type( value string)  {
  this.key_type = value 
}
// getter for variable array_type
func (this *CodeNode) Get_array_type() string {
  return this.array_type
}
// setter for variable array_type
func (this *CodeNode) Set_array_type( value string)  {
  this.array_type = value 
}
// getter for variable ns
func (this *CodeNode) Get_ns() []string {
  return this.ns
}
// setter for variable ns
func (this *CodeNode) Set_ns( value []string)  {
  this.ns = value 
}
// getter for variable nsp
func (this *CodeNode) Get_nsp() []IFACE_RangerAppParamDesc {
  return this.nsp
}
// setter for variable nsp
func (this *CodeNode) Set_nsp( value []IFACE_RangerAppParamDesc)  {
  this.nsp = value 
}
// getter for variable has_vref_annotation
func (this *CodeNode) Get_has_vref_annotation() bool {
  return this.has_vref_annotation
}
// setter for variable has_vref_annotation
func (this *CodeNode) Set_has_vref_annotation( value bool)  {
  this.has_vref_annotation = value 
}
// getter for variable vref_annotation
func (this *CodeNode) Get_vref_annotation() *GoNullable {
  return this.vref_annotation
}
// setter for variable vref_annotation
func (this *CodeNode) Set_vref_annotation( value *GoNullable)  {
  this.vref_annotation = value 
}
// getter for variable has_type_annotation
func (this *CodeNode) Get_has_type_annotation() bool {
  return this.has_type_annotation
}
// setter for variable has_type_annotation
func (this *CodeNode) Set_has_type_annotation( value bool)  {
  this.has_type_annotation = value 
}
// getter for variable type_annotation
func (this *CodeNode) Get_type_annotation() *GoNullable {
  return this.type_annotation
}
// setter for variable type_annotation
func (this *CodeNode) Set_type_annotation( value *GoNullable)  {
  this.type_annotation = value 
}
// getter for variable typeClass
func (this *CodeNode) Get_typeClass() *GoNullable {
  return this.typeClass
}
// setter for variable typeClass
func (this *CodeNode) Set_typeClass( value *GoNullable)  {
  this.typeClass = value 
}
// getter for variable value_type
func (this *CodeNode) Get_value_type() int64 {
  return this.value_type
}
// setter for variable value_type
func (this *CodeNode) Set_value_type( value int64)  {
  this.value_type = value 
}
// getter for variable eval_type
func (this *CodeNode) Get_eval_type() int64 {
  return this.eval_type
}
// setter for variable eval_type
func (this *CodeNode) Set_eval_type( value int64)  {
  this.eval_type = value 
}
// getter for variable eval_type_name
func (this *CodeNode) Get_eval_type_name() string {
  return this.eval_type_name
}
// setter for variable eval_type_name
func (this *CodeNode) Set_eval_type_name( value string)  {
  this.eval_type_name = value 
}
// getter for variable eval_key_type
func (this *CodeNode) Get_eval_key_type() string {
  return this.eval_key_type
}
// setter for variable eval_key_type
func (this *CodeNode) Set_eval_key_type( value string)  {
  this.eval_key_type = value 
}
// getter for variable eval_array_type
func (this *CodeNode) Get_eval_array_type() string {
  return this.eval_array_type
}
// setter for variable eval_array_type
func (this *CodeNode) Set_eval_array_type( value string)  {
  this.eval_array_type = value 
}
// getter for variable flow_done
func (this *CodeNode) Get_flow_done() bool {
  return this.flow_done
}
// setter for variable flow_done
func (this *CodeNode) Set_flow_done( value bool)  {
  this.flow_done = value 
}
// getter for variable ref_change_done
func (this *CodeNode) Get_ref_change_done() bool {
  return this.ref_change_done
}
// setter for variable ref_change_done
func (this *CodeNode) Set_ref_change_done( value bool)  {
  this.ref_change_done = value 
}
// getter for variable eval_type_node
func (this *CodeNode) Get_eval_type_node() *GoNullable {
  return this.eval_type_node
}
// setter for variable eval_type_node
func (this *CodeNode) Set_eval_type_node( value *GoNullable)  {
  this.eval_type_node = value 
}
// getter for variable ref_type
func (this *CodeNode) Get_ref_type() int64 {
  return this.ref_type
}
// setter for variable ref_type
func (this *CodeNode) Set_ref_type( value int64)  {
  this.ref_type = value 
}
// getter for variable ref_need_assign
func (this *CodeNode) Get_ref_need_assign() int64 {
  return this.ref_need_assign
}
// setter for variable ref_need_assign
func (this *CodeNode) Set_ref_need_assign( value int64)  {
  this.ref_need_assign = value 
}
// getter for variable double_value
func (this *CodeNode) Get_double_value() float64 {
  return this.double_value
}
// setter for variable double_value
func (this *CodeNode) Set_double_value( value float64)  {
  this.double_value = value 
}
// getter for variable string_value
func (this *CodeNode) Get_string_value() string {
  return this.string_value
}
// setter for variable string_value
func (this *CodeNode) Set_string_value( value string)  {
  this.string_value = value 
}
// getter for variable int_value
func (this *CodeNode) Get_int_value() int64 {
  return this.int_value
}
// setter for variable int_value
func (this *CodeNode) Set_int_value( value int64)  {
  this.int_value = value 
}
// getter for variable boolean_value
func (this *CodeNode) Get_boolean_value() bool {
  return this.boolean_value
}
// setter for variable boolean_value
func (this *CodeNode) Set_boolean_value( value bool)  {
  this.boolean_value = value 
}
// getter for variable expression_value
func (this *CodeNode) Get_expression_value() *GoNullable {
  return this.expression_value
}
// setter for variable expression_value
func (this *CodeNode) Set_expression_value( value *GoNullable)  {
  this.expression_value = value 
}
// getter for variable props
func (this *CodeNode) Get_props() map[string]*CodeNode {
  return this.props
}
// setter for variable props
func (this *CodeNode) Set_props( value map[string]*CodeNode)  {
  this.props = value 
}
// getter for variable prop_keys
func (this *CodeNode) Get_prop_keys() []string {
  return this.prop_keys
}
// setter for variable prop_keys
func (this *CodeNode) Set_prop_keys( value []string)  {
  this.prop_keys = value 
}
// getter for variable comments
func (this *CodeNode) Get_comments() []*CodeNode {
  return this.comments
}
// setter for variable comments
func (this *CodeNode) Set_comments( value []*CodeNode)  {
  this.comments = value 
}
// getter for variable children
func (this *CodeNode) Get_children() []*CodeNode {
  return this.children
}
// setter for variable children
func (this *CodeNode) Set_children( value []*CodeNode)  {
  this.children = value 
}
// getter for variable parent
func (this *CodeNode) Get_parent() *GoNullable {
  return this.parent
}
// setter for variable parent
func (this *CodeNode) Set_parent( value *GoNullable)  {
  this.parent = value 
}
// getter for variable didReturnAtIndex
func (this *CodeNode) Get_didReturnAtIndex() int64 {
  return this.didReturnAtIndex
}
// setter for variable didReturnAtIndex
func (this *CodeNode) Set_didReturnAtIndex( value int64)  {
  this.didReturnAtIndex = value 
}
// getter for variable hasVarDef
func (this *CodeNode) Get_hasVarDef() bool {
  return this.hasVarDef
}
// setter for variable hasVarDef
func (this *CodeNode) Set_hasVarDef( value bool)  {
  this.hasVarDef = value 
}
// getter for variable hasClassDescription
func (this *CodeNode) Get_hasClassDescription() bool {
  return this.hasClassDescription
}
// setter for variable hasClassDescription
func (this *CodeNode) Set_hasClassDescription( value bool)  {
  this.hasClassDescription = value 
}
// getter for variable hasNewOper
func (this *CodeNode) Get_hasNewOper() bool {
  return this.hasNewOper
}
// setter for variable hasNewOper
func (this *CodeNode) Set_hasNewOper( value bool)  {
  this.hasNewOper = value 
}
// getter for variable clDesc
func (this *CodeNode) Get_clDesc() *GoNullable {
  return this.clDesc
}
// setter for variable clDesc
func (this *CodeNode) Set_clDesc( value *GoNullable)  {
  this.clDesc = value 
}
// getter for variable hasFnCall
func (this *CodeNode) Get_hasFnCall() bool {
  return this.hasFnCall
}
// setter for variable hasFnCall
func (this *CodeNode) Set_hasFnCall( value bool)  {
  this.hasFnCall = value 
}
// getter for variable fnDesc
func (this *CodeNode) Get_fnDesc() *GoNullable {
  return this.fnDesc
}
// setter for variable fnDesc
func (this *CodeNode) Set_fnDesc( value *GoNullable)  {
  this.fnDesc = value 
}
// getter for variable hasParamDesc
func (this *CodeNode) Get_hasParamDesc() bool {
  return this.hasParamDesc
}
// setter for variable hasParamDesc
func (this *CodeNode) Set_hasParamDesc( value bool)  {
  this.hasParamDesc = value 
}
// getter for variable paramDesc
func (this *CodeNode) Get_paramDesc() *GoNullable {
  return this.paramDesc
}
// setter for variable paramDesc
func (this *CodeNode) Set_paramDesc( value *GoNullable)  {
  this.paramDesc = value 
}
// getter for variable ownParamDesc
func (this *CodeNode) Get_ownParamDesc() *GoNullable {
  return this.ownParamDesc
}
// setter for variable ownParamDesc
func (this *CodeNode) Set_ownParamDesc( value *GoNullable)  {
  this.ownParamDesc = value 
}
// getter for variable evalCtx
func (this *CodeNode) Get_evalCtx() *GoNullable {
  return this.evalCtx
}
// setter for variable evalCtx
func (this *CodeNode) Set_evalCtx( value *GoNullable)  {
  this.evalCtx = value 
}
type AfterCodeNode struct { 
  ff int64 /**  unused  **/ 
}
type IFACE_AfterCodeNode interface { 
  Get_ff() int64
  Set_ff(value int64) 
}

func CreateNew_AfterCodeNode() *AfterCodeNode {
  me := new(AfterCodeNode)
  me.ff = 0
  return me;
}
// getter for variable ff
func (this *AfterCodeNode) Get_ff() int64 {
  return this.ff
}
// setter for variable ff
func (this *AfterCodeNode) Set_ff( value int64)  {
  this.ff = value 
}
type RangerNodeValue struct { 
  double_value *GoNullable /**  unused  **/ 
  string_value *GoNullable /**  unused  **/ 
  int_value *GoNullable /**  unused  **/ 
  boolean_value *GoNullable /**  unused  **/ 
  expression_value *GoNullable /**  unused  **/ 
}
type IFACE_RangerNodeValue interface { 
  Get_double_value() *GoNullable
  Set_double_value(value *GoNullable) 
  Get_string_value() *GoNullable
  Set_string_value(value *GoNullable) 
  Get_int_value() *GoNullable
  Set_int_value(value *GoNullable) 
  Get_boolean_value() *GoNullable
  Set_boolean_value(value *GoNullable) 
  Get_expression_value() *GoNullable
  Set_expression_value(value *GoNullable) 
}

func CreateNew_RangerNodeValue() *RangerNodeValue {
  me := new(RangerNodeValue)
  me.double_value = new(GoNullable);
  me.string_value = new(GoNullable);
  me.int_value = new(GoNullable);
  me.boolean_value = new(GoNullable);
  me.expression_value = new(GoNullable);
  return me;
}
// getter for variable double_value
func (this *RangerNodeValue) Get_double_value() *GoNullable {
  return this.double_value
}
// setter for variable double_value
func (this *RangerNodeValue) Set_double_value( value *GoNullable)  {
  this.double_value = value 
}
// getter for variable string_value
func (this *RangerNodeValue) Get_string_value() *GoNullable {
  return this.string_value
}
// setter for variable string_value
func (this *RangerNodeValue) Set_string_value( value *GoNullable)  {
  this.string_value = value 
}
// getter for variable int_value
func (this *RangerNodeValue) Get_int_value() *GoNullable {
  return this.int_value
}
// setter for variable int_value
func (this *RangerNodeValue) Set_int_value( value *GoNullable)  {
  this.int_value = value 
}
// getter for variable boolean_value
func (this *RangerNodeValue) Get_boolean_value() *GoNullable {
  return this.boolean_value
}
// setter for variable boolean_value
func (this *RangerNodeValue) Set_boolean_value( value *GoNullable)  {
  this.boolean_value = value 
}
// getter for variable expression_value
func (this *RangerNodeValue) Get_expression_value() *GoNullable {
  return this.expression_value
}
// setter for variable expression_value
func (this *RangerNodeValue) Set_expression_value( value *GoNullable)  {
  this.expression_value = value 
}
type RangerBackReference struct { 
  from_class *GoNullable /**  unused  **/ 
  var_name *GoNullable /**  unused  **/ 
  ref_type *GoNullable /**  unused  **/ 
}
type IFACE_RangerBackReference interface { 
  Get_from_class() *GoNullable
  Set_from_class(value *GoNullable) 
  Get_var_name() *GoNullable
  Set_var_name(value *GoNullable) 
  Get_ref_type() *GoNullable
  Set_ref_type(value *GoNullable) 
}

func CreateNew_RangerBackReference() *RangerBackReference {
  me := new(RangerBackReference)
  me.from_class = new(GoNullable);
  me.var_name = new(GoNullable);
  me.ref_type = new(GoNullable);
  return me;
}
// getter for variable from_class
func (this *RangerBackReference) Get_from_class() *GoNullable {
  return this.from_class
}
// setter for variable from_class
func (this *RangerBackReference) Set_from_class( value *GoNullable)  {
  this.from_class = value 
}
// getter for variable var_name
func (this *RangerBackReference) Get_var_name() *GoNullable {
  return this.var_name
}
// setter for variable var_name
func (this *RangerBackReference) Set_var_name( value *GoNullable)  {
  this.var_name = value 
}
// getter for variable ref_type
func (this *RangerBackReference) Get_ref_type() *GoNullable {
  return this.ref_type
}
// setter for variable ref_type
func (this *RangerBackReference) Set_ref_type( value *GoNullable)  {
  this.ref_type = value 
}
type RangerAppEnum struct { 
  name string /**  unused  **/ 
  cnt int64
  values map[string]int64
  node *GoNullable /**  unused  **/ 
}
type IFACE_RangerAppEnum interface { 
  Get_name() string
  Set_name(value string) 
  Get_cnt() int64
  Set_cnt(value int64) 
  Get_values() map[string]int64
  Set_values(value map[string]int64) 
  Get_node() *GoNullable
  Set_node(value *GoNullable) 
  add(n string) ()
}

func CreateNew_RangerAppEnum() *RangerAppEnum {
  me := new(RangerAppEnum)
  me.name = ""
  me.cnt = 0
  me.values = make(map[string]int64)
  me.node = new(GoNullable);
  return me;
}
func (this *RangerAppEnum) add (n string) () {
  this.values[n] = this.cnt
  this.cnt = this.cnt + 1; 
}
// getter for variable name
func (this *RangerAppEnum) Get_name() string {
  return this.name
}
// setter for variable name
func (this *RangerAppEnum) Set_name( value string)  {
  this.name = value 
}
// getter for variable cnt
func (this *RangerAppEnum) Get_cnt() int64 {
  return this.cnt
}
// setter for variable cnt
func (this *RangerAppEnum) Set_cnt( value int64)  {
  this.cnt = value 
}
// getter for variable values
func (this *RangerAppEnum) Get_values() map[string]int64 {
  return this.values
}
// setter for variable values
func (this *RangerAppEnum) Set_values( value map[string]int64)  {
  this.values = value 
}
// getter for variable node
func (this *RangerAppEnum) Get_node() *GoNullable {
  return this.node
}
// setter for variable node
func (this *RangerAppEnum) Set_node( value *GoNullable)  {
  this.node = value 
}
type OpFindResult struct { 
  did_find bool /**  unused  **/ 
  node *GoNullable /**  unused  **/ 
}
type IFACE_OpFindResult interface { 
  Get_did_find() bool
  Set_did_find(value bool) 
  Get_node() *GoNullable
  Set_node(value *GoNullable) 
}

func CreateNew_OpFindResult() *OpFindResult {
  me := new(OpFindResult)
  me.did_find = false
  me.node = new(GoNullable);
  return me;
}
// getter for variable did_find
func (this *OpFindResult) Get_did_find() bool {
  return this.did_find
}
// setter for variable did_find
func (this *OpFindResult) Set_did_find( value bool)  {
  this.did_find = value 
}
// getter for variable node
func (this *OpFindResult) Get_node() *GoNullable {
  return this.node
}
// setter for variable node
func (this *OpFindResult) Set_node( value *GoNullable)  {
  this.node = value 
}
type RangerAppWriterContext struct { 
  langOperators *GoNullable
  stdCommands *GoNullable
  intRootCounter int64 /**  unused  **/ 
  targetLangName string
  ctx *GoNullable /**  unused  **/ 
  parent *GoNullable
  defined_imports []string /**  unused  **/ 
  already_imported map[string]bool
  fileSystem *GoNullable
  is_function bool
  is_block bool /**  unused  **/ 
  has_block_exited bool /**  unused  **/ 
  in_expression bool /**  unused  **/ 
  expr_stack []bool
  expr_restart bool
  in_method bool /**  unused  **/ 
  method_stack []bool
  typeNames []string /**  unused  **/ 
  typeClasses map[string]*RangerTypeClass /**  unused  **/ 
  currentClassName *GoNullable /**  unused  **/ 
  in_class bool
  in_static_method bool
  currentClass *GoNullable
  currentMethod *GoNullable
  thisName string
  definedEnums map[string]*RangerAppEnum
  definedInterfaces map[string]*RangerAppClassDesc /**  unused  **/ 
  definedInterfaceList []string /**  unused  **/ 
  definedClasses map[string]*RangerAppClassDesc
  definedClassList []string
  templateClassNodes map[string]*CodeNode
  templateClassList []string
  classSignatures map[string]string
  classToSignature map[string]string
  templateClasses map[string]*RangerAppClassDesc /**  unused  **/ 
  classStaticWriters map[string]*CodeWriter
  localVariables map[string]IFACE_RangerAppParamDesc
  localVarNames []string
  compilerFlags map[string]bool
  compilerSettings map[string]string
  parserErrors []*RangerCompilerMessage
  compilerErrors []*RangerCompilerMessage
  compilerMessages []*RangerCompilerMessage
  compilerLog map[string]*RangerCompilerMessage /**  unused  **/ 
  todoList []*RangerAppTodo
  definedMacro map[string]bool /**  unused  **/ 
  defCounts map[string]int64
}
type IFACE_RangerAppWriterContext interface { 
  Get_langOperators() *GoNullable
  Set_langOperators(value *GoNullable) 
  Get_stdCommands() *GoNullable
  Set_stdCommands(value *GoNullable) 
  Get_intRootCounter() int64
  Set_intRootCounter(value int64) 
  Get_targetLangName() string
  Set_targetLangName(value string) 
  Get_ctx() *GoNullable
  Set_ctx(value *GoNullable) 
  Get_parent() *GoNullable
  Set_parent(value *GoNullable) 
  Get_defined_imports() []string
  Set_defined_imports(value []string) 
  Get_already_imported() map[string]bool
  Set_already_imported(value map[string]bool) 
  Get_fileSystem() *GoNullable
  Set_fileSystem(value *GoNullable) 
  Get_is_function() bool
  Set_is_function(value bool) 
  Get_is_block() bool
  Set_is_block(value bool) 
  Get_has_block_exited() bool
  Set_has_block_exited(value bool) 
  Get_in_expression() bool
  Set_in_expression(value bool) 
  Get_expr_stack() []bool
  Set_expr_stack(value []bool) 
  Get_expr_restart() bool
  Set_expr_restart(value bool) 
  Get_in_method() bool
  Set_in_method(value bool) 
  Get_method_stack() []bool
  Set_method_stack(value []bool) 
  Get_typeNames() []string
  Set_typeNames(value []string) 
  Get_typeClasses() map[string]*RangerTypeClass
  Set_typeClasses(value map[string]*RangerTypeClass) 
  Get_currentClassName() *GoNullable
  Set_currentClassName(value *GoNullable) 
  Get_in_class() bool
  Set_in_class(value bool) 
  Get_in_static_method() bool
  Set_in_static_method(value bool) 
  Get_currentClass() *GoNullable
  Set_currentClass(value *GoNullable) 
  Get_currentMethod() *GoNullable
  Set_currentMethod(value *GoNullable) 
  Get_thisName() string
  Set_thisName(value string) 
  Get_definedEnums() map[string]*RangerAppEnum
  Set_definedEnums(value map[string]*RangerAppEnum) 
  Get_definedInterfaces() map[string]*RangerAppClassDesc
  Set_definedInterfaces(value map[string]*RangerAppClassDesc) 
  Get_definedInterfaceList() []string
  Set_definedInterfaceList(value []string) 
  Get_definedClasses() map[string]*RangerAppClassDesc
  Set_definedClasses(value map[string]*RangerAppClassDesc) 
  Get_definedClassList() []string
  Set_definedClassList(value []string) 
  Get_templateClassNodes() map[string]*CodeNode
  Set_templateClassNodes(value map[string]*CodeNode) 
  Get_templateClassList() []string
  Set_templateClassList(value []string) 
  Get_classSignatures() map[string]string
  Set_classSignatures(value map[string]string) 
  Get_classToSignature() map[string]string
  Set_classToSignature(value map[string]string) 
  Get_templateClasses() map[string]*RangerAppClassDesc
  Set_templateClasses(value map[string]*RangerAppClassDesc) 
  Get_classStaticWriters() map[string]*CodeWriter
  Set_classStaticWriters(value map[string]*CodeWriter) 
  Get_localVariables() map[string]IFACE_RangerAppParamDesc
  Set_localVariables(value map[string]IFACE_RangerAppParamDesc) 
  Get_localVarNames() []string
  Set_localVarNames(value []string) 
  Get_compilerFlags() map[string]bool
  Set_compilerFlags(value map[string]bool) 
  Get_compilerSettings() map[string]string
  Set_compilerSettings(value map[string]string) 
  Get_parserErrors() []*RangerCompilerMessage
  Set_parserErrors(value []*RangerCompilerMessage) 
  Get_compilerErrors() []*RangerCompilerMessage
  Set_compilerErrors(value []*RangerCompilerMessage) 
  Get_compilerMessages() []*RangerCompilerMessage
  Set_compilerMessages(value []*RangerCompilerMessage) 
  Get_compilerLog() map[string]*RangerCompilerMessage
  Set_compilerLog(value map[string]*RangerCompilerMessage) 
  Get_todoList() []*RangerAppTodo
  Set_todoList(value []*RangerAppTodo) 
  Get_definedMacro() map[string]bool
  Set_definedMacro(value map[string]bool) 
  Get_defCounts() map[string]int64
  Set_defCounts(value map[string]int64) 
  initStdCommands() bool
  transformTypeName(typeName string) string
  isPrimitiveType(typeName string) bool
  isDefinedType(typeName string) bool
  hadValidType(node *CodeNode) bool
  getTargetLang() string
  findOperator(node *CodeNode) *CodeNode
  getStdCommands() *CodeNode
  findClassWithSign(node *CodeNode) *RangerAppClassDesc
  createSignature(origClass string, classSig string) string
  createOperator(fromNode *CodeNode) ()
  getFileWriter(path string, fileName string) *CodeWriter
  addTodo(node *CodeNode, descr string) ()
  setThisName(the_name string) ()
  getThisName() string
  printLogs(logName string) ()
  log(node *CodeNode, logName string, descr string) ()
  addMessage(node *CodeNode, descr string) ()
  addError(targetnode *CodeNode, descr string) ()
  addParserError(targetnode *CodeNode, descr string) ()
  addTemplateClass(name string, node *CodeNode) ()
  hasTemplateNode(name string) bool
  findTemplateNode(name string) *CodeNode
  setStaticWriter(className string, writer *CodeWriter) ()
  getStaticWriter(className string) *CodeWriter
  isEnumDefined(n string) bool
  getEnum(n string) *GoNullable
  isVarDefined(name string) bool
  setCompilerFlag(name string, value bool) ()
  hasCompilerFlag(s_name string) bool
  getCompilerSetting(s_name string) string
  hasCompilerSetting(s_name string) bool
  getVariableDef(name string) IFACE_RangerAppParamDesc
  findFunctionCtx() *RangerAppWriterContext
  getFnVarCnt(name string) int64
  debugVars() ()
  getVarTotalCnt(name string) int64
  getFnVarCnt2(name string) int64
  isMemberVariable(name string) bool
  defineVariable(name string, desc IFACE_RangerAppParamDesc) ()
  isDefinedClass(name string) bool
  getRoot() *RangerAppWriterContext
  getClasses() []*RangerAppClassDesc
  addClass(name string, desc *RangerAppClassDesc) ()
  findClass(name string) *RangerAppClassDesc
  hasClass(name string) bool
  getCurrentMethod() *RangerAppFunctionDesc
  setCurrentClass(cc *RangerAppClassDesc) ()
  disableCurrentClass() ()
  hasCurrentClass() bool
  getCurrentClass() *GoNullable
  restartExpressionLevel() ()
  isInExpression() bool
  expressionLevel() int64
  setInExpr() ()
  unsetInExpr() ()
  getErrorCount() int64
  isInStatic() bool
  isInMethod() bool
  setInMethod() ()
  unsetInMethod() ()
  fork() *RangerAppWriterContext
}

func CreateNew_RangerAppWriterContext() *RangerAppWriterContext {
  me := new(RangerAppWriterContext)
  me.intRootCounter = 1
  me.targetLangName = ""
  me.defined_imports = make([]string,0)
  me.already_imported = make(map[string]bool)
  me.is_function = false
  me.is_block = false
  me.has_block_exited = false
  me.in_expression = false
  me.expr_stack = make([]bool,0)
  me.expr_restart = false
  me.in_method = false
  me.method_stack = make([]bool,0)
  me.typeNames = make([]string,0)
  me.typeClasses = make(map[string]*RangerTypeClass)
  me.in_class = false
  me.in_static_method = false
  me.thisName = "this"
  me.definedEnums = make(map[string]*RangerAppEnum)
  me.definedInterfaces = make(map[string]*RangerAppClassDesc)
  me.definedInterfaceList = make([]string,0)
  me.definedClasses = make(map[string]*RangerAppClassDesc)
  me.definedClassList = make([]string,0)
  me.templateClassNodes = make(map[string]*CodeNode)
  me.templateClassList = make([]string,0)
  me.classSignatures = make(map[string]string)
  me.classToSignature = make(map[string]string)
  me.templateClasses = make(map[string]*RangerAppClassDesc)
  me.classStaticWriters = make(map[string]*CodeWriter)
  me.localVariables = make(map[string]IFACE_RangerAppParamDesc)
  me.localVarNames = make([]string,0)
  me.compilerFlags = make(map[string]bool)
  me.compilerSettings = make(map[string]string)
  me.parserErrors = make([]*RangerCompilerMessage,0)
  me.compilerErrors = make([]*RangerCompilerMessage,0)
  me.compilerMessages = make([]*RangerCompilerMessage,0)
  me.compilerLog = make(map[string]*RangerCompilerMessage)
  me.todoList = make([]*RangerAppTodo,0)
  me.definedMacro = make(map[string]bool)
  me.defCounts = make(map[string]int64)
  me.langOperators = new(GoNullable);
  me.stdCommands = new(GoNullable);
  me.ctx = new(GoNullable);
  me.parent = new(GoNullable);
  me.fileSystem = new(GoNullable);
  me.currentClassName = new(GoNullable);
  me.currentClass = new(GoNullable);
  me.currentMethod = new(GoNullable);
  return me;
}
func (this *RangerAppWriterContext) initStdCommands () bool {
  if  this.stdCommands.has_value {
    return true;
  }
  if  !this.langOperators.has_value  {
    return true;
  }
  var main *GoNullable = new(GoNullable); 
  main.value = this.langOperators.value;
  main.has_value = this.langOperators.has_value;
  var lang *GoNullable = new(GoNullable); 
  var i_17 int64 = 0;  
  for ; i_17 < int64(len(main.value.(*CodeNode).children)) ; i_17++ {
    m_4 := main.value.(*CodeNode).children[i_17];
    var fc_8 *CodeNode = m_4.getFirst();
    if  fc_8.vref == "language" {
      lang.value = m_4;
      lang.has_value = true; /* detected as non-optional */
    }
  }
  /** unused:  cmds*/
  var langNodes *CodeNode = lang.value.(*CodeNode).children[1];
  var i_22 int64 = 0;  
  for ; i_22 < int64(len(langNodes.children)) ; i_22++ {
    lch := langNodes.children[i_22];
    var fc_13 *CodeNode = lch.getFirst();
    if  fc_13.vref == "commands" {
      /** unused:  n_2*/
      this.stdCommands.value = lch.getSecond();
      this.stdCommands.has_value = true; /* detected as non-optional */
    }
  }
  return true;
}
func (this *RangerAppWriterContext) transformTypeName (typeName string) string {
  if  this.isPrimitiveType(typeName) {
    return typeName;
  }
  if  this.isEnumDefined(typeName) {
    return typeName;
  }
  if  this.isDefinedClass(typeName) {
    var cl *RangerAppClassDesc = this.findClass(typeName);
    if  cl.is_system {
      return (r_get_string_string(cl.systemNames, this.getTargetLang())).value.(string);
    }
  }
  return typeName;
}
func (this *RangerAppWriterContext) isPrimitiveType (typeName string) bool {
  if  (((((typeName == "double") || (typeName == "string")) || (typeName == "int")) || (typeName == "char")) || (typeName == "charbuffer")) || (typeName == "boolean") {
    return true;
  }
  return false;
}
func (this *RangerAppWriterContext) isDefinedType (typeName string) bool {
  if  (((((typeName == "double") || (typeName == "string")) || (typeName == "int")) || (typeName == "char")) || (typeName == "charbuffer")) || (typeName == "boolean") {
    return true;
  }
  if  this.isEnumDefined(typeName) {
    return true;
  }
  if  this.isDefinedClass(typeName) {
    return true;
  }
  return false;
}
func (this *RangerAppWriterContext) hadValidType (node *CodeNode) bool {
  if  node.isPrimitiveType() || node.isPrimitive() {
    return true;
  }
  if  (node.value_type == 6) && this.isDefinedType(node.array_type) {
    return true;
  }
  if  ((node.value_type == 7) && this.isDefinedType(node.array_type)) && this.isPrimitiveType(node.key_type) {
    return true;
  }
  if  this.isDefinedType(node.type_name) {
    return true;
  }
  this.addError(node, strings.Join([]string{ (strings.Join([]string{ (strings.Join([]string{ (strings.Join([]string{ (strings.Join([]string{ "Invalid or missing type definition: ",node.type_name }, ""))," " }, "")),node.key_type }, ""))," " }, "")),node.array_type }, ""));
  return false;
}
func (this *RangerAppWriterContext) getTargetLang () string {
  if  (int64(len(this.targetLangName))) > 0 {
    return this.targetLangName;
  }
  if ( this.parent.has_value) {
    return this.parent.value.(*RangerAppWriterContext).getTargetLang();
  }
  return "ranger";
}
func (this *RangerAppWriterContext) findOperator (node *CodeNode) *CodeNode {
  var root *RangerAppWriterContext = this.getRoot();
  root.initStdCommands();
  return root.stdCommands.value.(*CodeNode).children[node.op_index];
}
func (this *RangerAppWriterContext) getStdCommands () *CodeNode {
  var root_4 *RangerAppWriterContext = this.getRoot();
  root_4.initStdCommands();
  return root_4.stdCommands.value.(*CodeNode);
}
func (this *RangerAppWriterContext) findClassWithSign (node *CodeNode) *RangerAppClassDesc {
  var root_6 *RangerAppWriterContext = this.getRoot();
  var tplArgs *GoNullable = new(GoNullable); 
  tplArgs.value = node.vref_annotation.value;
  tplArgs.has_value = node.vref_annotation.has_value;
  var sign string = strings.Join([]string{ node.vref,tplArgs.value.(*CodeNode).getCode() }, "");
  var theName *GoNullable = new(GoNullable); 
  theName = r_get_string_string(root_6.classSignatures, sign);
  return this.findClass((theName.value.(string)));
}
func (this *RangerAppWriterContext) createSignature (origClass string, classSig string) string {
  if  r_has_key_string_string(this.classSignatures, classSig) {
    return (r_get_string_string(this.classSignatures, classSig)).value.(string);
  }
  var ii int64 = 1;
  var sigName string = strings.Join([]string{ (strings.Join([]string{ origClass,"V" }, "")),strconv.FormatInt(ii, 10) }, "");
  for r_has_key_string_string(this.classToSignature, sigName) {
    ii = ii + 1; 
    sigName = strings.Join([]string{ (strings.Join([]string{ origClass,"V" }, "")),strconv.FormatInt(ii, 10) }, ""); 
  }
  this.classToSignature[sigName] = classSig
  this.classSignatures[classSig] = sigName
  return sigName;
}
func (this *RangerAppWriterContext) createOperator (fromNode *CodeNode) () {
  var root_8 *RangerAppWriterContext = this.getRoot();
  if  root_8.initStdCommands() {
    root_8.stdCommands.value.(*CodeNode).children = append(root_8.stdCommands.value.(*CodeNode).children,fromNode); 
    /** unused:  fc_13*/
  }
}
func (this *RangerAppWriterContext) getFileWriter (path string, fileName string) *CodeWriter {
  var root_10 *RangerAppWriterContext = this.getRoot();
  var fs *GoNullable = new(GoNullable); 
  fs.value = root_10.fileSystem.value;
  fs.has_value = root_10.fileSystem.has_value;
  var file *CodeFile = fs.value.(*CodeFileSystem).getFile(path, fileName);
  var wr_2 *GoNullable = new(GoNullable); 
  wr_2.value = file.getWriter().value;
  wr_2.has_value = file.getWriter().has_value; 
  return wr_2.value.(*CodeWriter);
}
func (this *RangerAppWriterContext) addTodo (node *CodeNode, descr string) () {
  var e_3 *RangerAppTodo = CreateNew_RangerAppTodo();
  e_3.description = descr; 
  e_3.todonode.value = node;
  e_3.todonode.has_value = true; /* detected as non-optional */
  var root_12 *RangerAppWriterContext = this.getRoot();
  root_12.todoList = append(root_12.todoList,e_3); 
}
func (this *RangerAppWriterContext) setThisName (the_name string) () {
  var root_14 *RangerAppWriterContext = this.getRoot();
  root_14.thisName = the_name; 
}
func (this *RangerAppWriterContext) getThisName () string {
  var root_16 *RangerAppWriterContext = this.getRoot();
  return root_16.thisName;
}
func (this *RangerAppWriterContext) printLogs (logName string) () {
}
func (this *RangerAppWriterContext) log (node *CodeNode, logName string, descr string) () {
}
func (this *RangerAppWriterContext) addMessage (node *CodeNode, descr string) () {
  var e_6 *RangerCompilerMessage = CreateNew_RangerCompilerMessage();
  e_6.description = descr; 
  e_6.node.value = node;
  e_6.node.has_value = true; /* detected as non-optional */
  var root_18 *RangerAppWriterContext = this.getRoot();
  root_18.compilerMessages = append(root_18.compilerMessages,e_6); 
}
func (this *RangerAppWriterContext) addError (targetnode *CodeNode, descr string) () {
  var e_8 *RangerCompilerMessage = CreateNew_RangerCompilerMessage();
  e_8.description = descr; 
  e_8.node.value = targetnode;
  e_8.node.has_value = true; /* detected as non-optional */
  var root_20 *RangerAppWriterContext = this.getRoot();
  root_20.compilerErrors = append(root_20.compilerErrors,e_8); 
}
func (this *RangerAppWriterContext) addParserError (targetnode *CodeNode, descr string) () {
  var e_10 *RangerCompilerMessage = CreateNew_RangerCompilerMessage();
  e_10.description = descr; 
  e_10.node.value = targetnode;
  e_10.node.has_value = true; /* detected as non-optional */
  var root_22 *RangerAppWriterContext = this.getRoot();
  root_22.parserErrors = append(root_22.parserErrors,e_10); 
}
func (this *RangerAppWriterContext) addTemplateClass (name string, node *CodeNode) () {
  var root_24 *RangerAppWriterContext = this.getRoot();
  root_24.templateClassList = append(root_24.templateClassList,name); 
  root_24.templateClassNodes[name] = node
}
func (this *RangerAppWriterContext) hasTemplateNode (name string) bool {
  var root_26 *RangerAppWriterContext = this.getRoot();
  return r_has_key_string_CodeNode(root_26.templateClassNodes, name);
}
func (this *RangerAppWriterContext) findTemplateNode (name string) *CodeNode {
  var root_28 *RangerAppWriterContext = this.getRoot();
  return (r_get_string_CodeNode(root_28.templateClassNodes, name)).value.(*CodeNode);
}
func (this *RangerAppWriterContext) setStaticWriter (className string, writer *CodeWriter) () {
  var root_30 *RangerAppWriterContext = this.getRoot();
  root_30.classStaticWriters[className] = writer
}
func (this *RangerAppWriterContext) getStaticWriter (className string) *CodeWriter {
  var root_32 *RangerAppWriterContext = this.getRoot();
  return (r_get_string_CodeWriter(root_32.classStaticWriters, className)).value.(*CodeWriter);
}
func (this *RangerAppWriterContext) isEnumDefined (n string) bool {
  if  r_has_key_string_RangerAppEnum(this.definedEnums, n) {
    return true;
  }
  if  !this.parent.has_value  {
    return false;
  }
  return this.parent.value.(*RangerAppWriterContext).isEnumDefined(n);
}
func (this *RangerAppWriterContext) getEnum (n string) *GoNullable {
  if  r_has_key_string_RangerAppEnum(this.definedEnums, n) {
    return r_get_string_RangerAppEnum(this.definedEnums, n);
  }
  if  this.parent.has_value {
    return this.parent.value.(*RangerAppWriterContext).getEnum(n);
  }
  var none *GoNullable = new(GoNullable); 
  return none;
}
func (this *RangerAppWriterContext) isVarDefined (name string) bool {
  if  r_has_key_string_IFACE_RangerAppParamDesc(this.localVariables, name) {
    return true;
  }
  if  !this.parent.has_value  {
    return false;
  }
  return this.parent.value.(*RangerAppWriterContext).isVarDefined(name);
}
func (this *RangerAppWriterContext) setCompilerFlag (name string, value bool) () {
  this.compilerFlags[name] = value
}
func (this *RangerAppWriterContext) hasCompilerFlag (s_name string) bool {
  if  r_has_key_string_bool(this.compilerFlags, s_name) {
    return (r_get_string_bool(this.compilerFlags, s_name)).value.(bool);
  }
  if  !this.parent.has_value  {
    return false;
  }
  return this.parent.value.(*RangerAppWriterContext).hasCompilerFlag(s_name);
}
func (this *RangerAppWriterContext) getCompilerSetting (s_name string) string {
  if  r_has_key_string_string(this.compilerSettings, s_name) {
    return (r_get_string_string(this.compilerSettings, s_name)).value.(string);
  }
  if  !this.parent.has_value  {
    return "";
  }
  return this.parent.value.(*RangerAppWriterContext).getCompilerSetting(s_name);
}
func (this *RangerAppWriterContext) hasCompilerSetting (s_name string) bool {
  if  r_has_key_string_string(this.compilerSettings, s_name) {
    return true;
  }
  if  !this.parent.has_value  {
    return false;
  }
  return this.parent.value.(*RangerAppWriterContext).hasCompilerSetting(s_name);
}
func (this *RangerAppWriterContext) getVariableDef (name string) IFACE_RangerAppParamDesc {
  if  r_has_key_string_IFACE_RangerAppParamDesc(this.localVariables, name) {
    return (r_get_string_IFACE_RangerAppParamDesc(this.localVariables, name)).value.(IFACE_RangerAppParamDesc);
  }
  if  !this.parent.has_value  {
    var tmp IFACE_RangerAppParamDesc = CreateNew_RangerAppParamDesc();
    return tmp;
  }
  return this.parent.value.(*RangerAppWriterContext).getVariableDef(name);
}
func (this *RangerAppWriterContext) findFunctionCtx () *RangerAppWriterContext {
  if  this.is_function {
    return this;
  }
  if  !this.parent.has_value  {
    return this;
  }
  return this.parent.value.(*RangerAppWriterContext).findFunctionCtx();
}
func (this *RangerAppWriterContext) getFnVarCnt (name string) int64 {
  var fnCtx *RangerAppWriterContext = this.findFunctionCtx();
  var ii_4 int64 = 0;
  if  r_has_key_string_int64(fnCtx.defCounts, name) {
    ii_4 = (r_get_string_int64(fnCtx.defCounts, name)).value.(int64); 
    ii_4 = 1 + ii_4; 
  } else {
    fnCtx.defCounts[name] = ii_4
    return 0;
  }
  var scope_has bool = this.isVarDefined((strings.Join([]string{ (strings.Join([]string{ name,"_" }, "")),strconv.FormatInt(ii_4, 10) }, "")));
  for scope_has {
    ii_4 = 1 + ii_4; 
    scope_has = this.isVarDefined((strings.Join([]string{ (strings.Join([]string{ name,"_" }, "")),strconv.FormatInt(ii_4, 10) }, ""))); 
  }
  fnCtx.defCounts[name] = ii_4
  return ii_4;
}
func (this *RangerAppWriterContext) debugVars () () {
  fmt.Println( "--- context vars ---" )
  var i_22 int64 = 0;  
  for ; i_22 < int64(len(this.localVarNames)) ; i_22++ {
    na := this.localVarNames[i_22];
    fmt.Println( strings.Join([]string{ "var => ",na }, "") )
  }
  if  this.parent.has_value {
    this.parent.value.(*RangerAppWriterContext).debugVars();
  }
}
func (this *RangerAppWriterContext) getVarTotalCnt (name string) int64 {
  var fnCtx_4 *RangerAppWriterContext = this;
  var ii_6 int64 = 0;
  if  r_has_key_string_int64(fnCtx_4.defCounts, name) {
    ii_6 = (r_get_string_int64(fnCtx_4.defCounts, name)).value.(int64); 
  }
  if  fnCtx_4.parent.has_value {
    ii_6 = ii_6 + fnCtx_4.parent.value.(*RangerAppWriterContext).getVarTotalCnt(name); 
  }
  if  this.isVarDefined(name) {
    ii_6 = ii_6 + 1; 
  }
  return ii_6;
}
func (this *RangerAppWriterContext) getFnVarCnt2 (name string) int64 {
  var fnCtx_6 *RangerAppWriterContext = this;
  var ii_8 int64 = 0;
  if  r_has_key_string_int64(fnCtx_6.defCounts, name) {
    ii_8 = (r_get_string_int64(fnCtx_6.defCounts, name)).value.(int64); 
    ii_8 = 1 + ii_8; 
    fnCtx_6.defCounts[name] = ii_8
  } else {
    fnCtx_6.defCounts[name] = 1
  }
  if  fnCtx_6.parent.has_value {
    ii_8 = ii_8 + fnCtx_6.parent.value.(*RangerAppWriterContext).getFnVarCnt2(name); 
  }
  var scope_has_4 bool = this.isVarDefined(name);
  if  scope_has_4 {
    ii_8 = 1 + ii_8; 
  }
  var scope_has_9 bool = this.isVarDefined((strings.Join([]string{ (strings.Join([]string{ name,"_" }, "")),strconv.FormatInt(ii_8, 10) }, "")));
  for scope_has_9 {
    ii_8 = 1 + ii_8; 
    scope_has_9 = this.isVarDefined((strings.Join([]string{ (strings.Join([]string{ name,"_" }, "")),strconv.FormatInt(ii_8, 10) }, ""))); 
  }
  return ii_8;
}
func (this *RangerAppWriterContext) isMemberVariable (name string) bool {
  if  this.isVarDefined(name) {
    var vDef IFACE_RangerAppParamDesc = this.getVariableDef(name);
    if  vDef.Get_varType() == 8 {
      return true;
    }
  }
  return false;
}
func (this *RangerAppWriterContext) defineVariable (name string, desc IFACE_RangerAppParamDesc) () {
  var cnt_2 int64 = 0;
  if  false == (((desc.Get_varType() == 8) || (desc.Get_varType() == 4)) || (desc.Get_varType() == 10)) {
    cnt_2 = this.getFnVarCnt2(name); 
  }
  if  0 == cnt_2 {
    desc.Set_compiledName(name); 
  } else {
    desc.Set_compiledName(strings.Join([]string{ (strings.Join([]string{ name,"_" }, "")),strconv.FormatInt(cnt_2, 10) }, "")); 
  }
  this.localVariables[name] = desc
  this.localVarNames = append(this.localVarNames,name); 
}
func (this *RangerAppWriterContext) isDefinedClass (name string) bool {
  if  r_has_key_string_RangerAppClassDesc(this.definedClasses, name) {
    return true;
  } else {
    if  this.parent.has_value {
      return this.parent.value.(*RangerAppWriterContext).isDefinedClass(name);
    }
  }
  return false;
}
func (this *RangerAppWriterContext) getRoot () *RangerAppWriterContext {
  if  !this.parent.has_value  {
    return this;
  }
  return this.parent.value.(*RangerAppWriterContext).getRoot();
}
func (this *RangerAppWriterContext) getClasses () []*RangerAppClassDesc {
  var list []*RangerAppClassDesc = make([]*RangerAppClassDesc, 0);
  var i_24 int64 = 0;  
  for ; i_24 < int64(len(this.definedClassList)) ; i_24++ {
    n_5 := this.definedClassList[i_24];
    list = append(list,(r_get_string_RangerAppClassDesc(this.definedClasses, n_5)).value.(*RangerAppClassDesc)); 
  }
  return list;
}
func (this *RangerAppWriterContext) addClass (name string, desc *RangerAppClassDesc) () {
  var root_34 *RangerAppWriterContext = this.getRoot();
  if  r_has_key_string_RangerAppClassDesc(root_34.definedClasses, name) {
    fmt.Println( strings.Join([]string{ (strings.Join([]string{ "ERROR: class ",name }, ""))," already defined" }, "") )
  } else {
    root_34.definedClasses[name] = desc
    root_34.definedClassList = append(root_34.definedClassList,name); 
  }
}
func (this *RangerAppWriterContext) findClass (name string) *RangerAppClassDesc {
  var root_36 *RangerAppWriterContext = this.getRoot();
  return (r_get_string_RangerAppClassDesc(root_36.definedClasses, name)).value.(*RangerAppClassDesc);
}
func (this *RangerAppWriterContext) hasClass (name string) bool {
  var root_38 *RangerAppWriterContext = this.getRoot();
  return r_has_key_string_RangerAppClassDesc(root_38.definedClasses, name);
}
func (this *RangerAppWriterContext) getCurrentMethod () *RangerAppFunctionDesc {
  if  this.currentMethod.has_value {
    return this.currentMethod.value.(*RangerAppFunctionDesc);
  }
  if  this.parent.has_value {
    return this.parent.value.(*RangerAppWriterContext).getCurrentMethod();
  }
  return CreateNew_RangerAppFunctionDesc();
}
func (this *RangerAppWriterContext) setCurrentClass (cc *RangerAppClassDesc) () {
  this.in_class = true; 
  this.currentClass.value = cc;
  this.currentClass.has_value = true; /* detected as non-optional */
}
func (this *RangerAppWriterContext) disableCurrentClass () () {
  if  this.in_class {
    this.in_class = false; 
  }
  if  this.parent.has_value {
    this.parent.value.(*RangerAppWriterContext).disableCurrentClass();
  }
}
func (this *RangerAppWriterContext) hasCurrentClass () bool {
  if  this.in_class && (this.currentClass.has_value) {
    return true;
  }
  if  this.parent.has_value {
    return this.parent.value.(*RangerAppWriterContext).hasCurrentClass();
  }
  return false;
}
func (this *RangerAppWriterContext) getCurrentClass () *GoNullable {
  if  this.in_class && (this.currentClass.has_value) {
    return this.currentClass;
  }
  if  this.parent.has_value {
    return this.parent.value.(*RangerAppWriterContext).getCurrentClass();
  }
  var non *GoNullable = new(GoNullable); 
  return non;
}
func (this *RangerAppWriterContext) restartExpressionLevel () () {
  this.expr_restart = true; 
}
func (this *RangerAppWriterContext) isInExpression () bool {
  if  (int64(len(this.expr_stack))) > 0 {
    return true;
  }
  if  (this.parent.has_value) && (this.expr_restart == false) {
    return this.parent.value.(*RangerAppWriterContext).isInExpression();
  }
  return false;
}
func (this *RangerAppWriterContext) expressionLevel () int64 {
  var level int64 = int64(len(this.expr_stack));
  if  (this.parent.has_value) && (this.expr_restart == false) {
    return level + this.parent.value.(*RangerAppWriterContext).expressionLevel();
  }
  return level;
}
func (this *RangerAppWriterContext) setInExpr () () {
  this.expr_stack = append(this.expr_stack,true); 
}
func (this *RangerAppWriterContext) unsetInExpr () () {
  this.expr_stack = this.expr_stack[:len(this.expr_stack)-1]; 
}
func (this *RangerAppWriterContext) getErrorCount () int64 {
  var cnt_5 int64 = int64(len(this.compilerErrors));
  if ( this.parent.has_value) {
    cnt_5 = cnt_5 + this.parent.value.(*RangerAppWriterContext).getErrorCount(); 
  }
  return cnt_5;
}
func (this *RangerAppWriterContext) isInStatic () bool {
  if  this.in_static_method {
    return true;
  }
  if ( this.parent.has_value) {
    return this.parent.value.(*RangerAppWriterContext).isInStatic();
  }
  return false;
}
func (this *RangerAppWriterContext) isInMethod () bool {
  if  (int64(len(this.method_stack))) > 0 {
    return true;
  }
  if  this.parent.has_value {
    return this.parent.value.(*RangerAppWriterContext).isInMethod();
  }
  return false;
}
func (this *RangerAppWriterContext) setInMethod () () {
  this.method_stack = append(this.method_stack,true); 
}
func (this *RangerAppWriterContext) unsetInMethod () () {
  this.method_stack = this.method_stack[:len(this.method_stack)-1]; 
}
func (this *RangerAppWriterContext) fork () *RangerAppWriterContext {
  var new_ctx *RangerAppWriterContext = CreateNew_RangerAppWriterContext();
  new_ctx.parent.value = this;
  new_ctx.parent.has_value = true; /* detected as non-optional */
  return new_ctx;
}
// getter for variable langOperators
func (this *RangerAppWriterContext) Get_langOperators() *GoNullable {
  return this.langOperators
}
// setter for variable langOperators
func (this *RangerAppWriterContext) Set_langOperators( value *GoNullable)  {
  this.langOperators = value 
}
// getter for variable stdCommands
func (this *RangerAppWriterContext) Get_stdCommands() *GoNullable {
  return this.stdCommands
}
// setter for variable stdCommands
func (this *RangerAppWriterContext) Set_stdCommands( value *GoNullable)  {
  this.stdCommands = value 
}
// getter for variable intRootCounter
func (this *RangerAppWriterContext) Get_intRootCounter() int64 {
  return this.intRootCounter
}
// setter for variable intRootCounter
func (this *RangerAppWriterContext) Set_intRootCounter( value int64)  {
  this.intRootCounter = value 
}
// getter for variable targetLangName
func (this *RangerAppWriterContext) Get_targetLangName() string {
  return this.targetLangName
}
// setter for variable targetLangName
func (this *RangerAppWriterContext) Set_targetLangName( value string)  {
  this.targetLangName = value 
}
// getter for variable ctx
func (this *RangerAppWriterContext) Get_ctx() *GoNullable {
  return this.ctx
}
// setter for variable ctx
func (this *RangerAppWriterContext) Set_ctx( value *GoNullable)  {
  this.ctx = value 
}
// getter for variable parent
func (this *RangerAppWriterContext) Get_parent() *GoNullable {
  return this.parent
}
// setter for variable parent
func (this *RangerAppWriterContext) Set_parent( value *GoNullable)  {
  this.parent = value 
}
// getter for variable defined_imports
func (this *RangerAppWriterContext) Get_defined_imports() []string {
  return this.defined_imports
}
// setter for variable defined_imports
func (this *RangerAppWriterContext) Set_defined_imports( value []string)  {
  this.defined_imports = value 
}
// getter for variable already_imported
func (this *RangerAppWriterContext) Get_already_imported() map[string]bool {
  return this.already_imported
}
// setter for variable already_imported
func (this *RangerAppWriterContext) Set_already_imported( value map[string]bool)  {
  this.already_imported = value 
}
// getter for variable fileSystem
func (this *RangerAppWriterContext) Get_fileSystem() *GoNullable {
  return this.fileSystem
}
// setter for variable fileSystem
func (this *RangerAppWriterContext) Set_fileSystem( value *GoNullable)  {
  this.fileSystem = value 
}
// getter for variable is_function
func (this *RangerAppWriterContext) Get_is_function() bool {
  return this.is_function
}
// setter for variable is_function
func (this *RangerAppWriterContext) Set_is_function( value bool)  {
  this.is_function = value 
}
// getter for variable is_block
func (this *RangerAppWriterContext) Get_is_block() bool {
  return this.is_block
}
// setter for variable is_block
func (this *RangerAppWriterContext) Set_is_block( value bool)  {
  this.is_block = value 
}
// getter for variable has_block_exited
func (this *RangerAppWriterContext) Get_has_block_exited() bool {
  return this.has_block_exited
}
// setter for variable has_block_exited
func (this *RangerAppWriterContext) Set_has_block_exited( value bool)  {
  this.has_block_exited = value 
}
// getter for variable in_expression
func (this *RangerAppWriterContext) Get_in_expression() bool {
  return this.in_expression
}
// setter for variable in_expression
func (this *RangerAppWriterContext) Set_in_expression( value bool)  {
  this.in_expression = value 
}
// getter for variable expr_stack
func (this *RangerAppWriterContext) Get_expr_stack() []bool {
  return this.expr_stack
}
// setter for variable expr_stack
func (this *RangerAppWriterContext) Set_expr_stack( value []bool)  {
  this.expr_stack = value 
}
// getter for variable expr_restart
func (this *RangerAppWriterContext) Get_expr_restart() bool {
  return this.expr_restart
}
// setter for variable expr_restart
func (this *RangerAppWriterContext) Set_expr_restart( value bool)  {
  this.expr_restart = value 
}
// getter for variable in_method
func (this *RangerAppWriterContext) Get_in_method() bool {
  return this.in_method
}
// setter for variable in_method
func (this *RangerAppWriterContext) Set_in_method( value bool)  {
  this.in_method = value 
}
// getter for variable method_stack
func (this *RangerAppWriterContext) Get_method_stack() []bool {
  return this.method_stack
}
// setter for variable method_stack
func (this *RangerAppWriterContext) Set_method_stack( value []bool)  {
  this.method_stack = value 
}
// getter for variable typeNames
func (this *RangerAppWriterContext) Get_typeNames() []string {
  return this.typeNames
}
// setter for variable typeNames
func (this *RangerAppWriterContext) Set_typeNames( value []string)  {
  this.typeNames = value 
}
// getter for variable typeClasses
func (this *RangerAppWriterContext) Get_typeClasses() map[string]*RangerTypeClass {
  return this.typeClasses
}
// setter for variable typeClasses
func (this *RangerAppWriterContext) Set_typeClasses( value map[string]*RangerTypeClass)  {
  this.typeClasses = value 
}
// getter for variable currentClassName
func (this *RangerAppWriterContext) Get_currentClassName() *GoNullable {
  return this.currentClassName
}
// setter for variable currentClassName
func (this *RangerAppWriterContext) Set_currentClassName( value *GoNullable)  {
  this.currentClassName = value 
}
// getter for variable in_class
func (this *RangerAppWriterContext) Get_in_class() bool {
  return this.in_class
}
// setter for variable in_class
func (this *RangerAppWriterContext) Set_in_class( value bool)  {
  this.in_class = value 
}
// getter for variable in_static_method
func (this *RangerAppWriterContext) Get_in_static_method() bool {
  return this.in_static_method
}
// setter for variable in_static_method
func (this *RangerAppWriterContext) Set_in_static_method( value bool)  {
  this.in_static_method = value 
}
// getter for variable currentClass
func (this *RangerAppWriterContext) Get_currentClass() *GoNullable {
  return this.currentClass
}
// setter for variable currentClass
func (this *RangerAppWriterContext) Set_currentClass( value *GoNullable)  {
  this.currentClass = value 
}
// getter for variable currentMethod
func (this *RangerAppWriterContext) Get_currentMethod() *GoNullable {
  return this.currentMethod
}
// setter for variable currentMethod
func (this *RangerAppWriterContext) Set_currentMethod( value *GoNullable)  {
  this.currentMethod = value 
}
// getter for variable thisName
func (this *RangerAppWriterContext) Get_thisName() string {
  return this.thisName
}
// setter for variable thisName
func (this *RangerAppWriterContext) Set_thisName( value string)  {
  this.thisName = value 
}
// getter for variable definedEnums
func (this *RangerAppWriterContext) Get_definedEnums() map[string]*RangerAppEnum {
  return this.definedEnums
}
// setter for variable definedEnums
func (this *RangerAppWriterContext) Set_definedEnums( value map[string]*RangerAppEnum)  {
  this.definedEnums = value 
}
// getter for variable definedInterfaces
func (this *RangerAppWriterContext) Get_definedInterfaces() map[string]*RangerAppClassDesc {
  return this.definedInterfaces
}
// setter for variable definedInterfaces
func (this *RangerAppWriterContext) Set_definedInterfaces( value map[string]*RangerAppClassDesc)  {
  this.definedInterfaces = value 
}
// getter for variable definedInterfaceList
func (this *RangerAppWriterContext) Get_definedInterfaceList() []string {
  return this.definedInterfaceList
}
// setter for variable definedInterfaceList
func (this *RangerAppWriterContext) Set_definedInterfaceList( value []string)  {
  this.definedInterfaceList = value 
}
// getter for variable definedClasses
func (this *RangerAppWriterContext) Get_definedClasses() map[string]*RangerAppClassDesc {
  return this.definedClasses
}
// setter for variable definedClasses
func (this *RangerAppWriterContext) Set_definedClasses( value map[string]*RangerAppClassDesc)  {
  this.definedClasses = value 
}
// getter for variable definedClassList
func (this *RangerAppWriterContext) Get_definedClassList() []string {
  return this.definedClassList
}
// setter for variable definedClassList
func (this *RangerAppWriterContext) Set_definedClassList( value []string)  {
  this.definedClassList = value 
}
// getter for variable templateClassNodes
func (this *RangerAppWriterContext) Get_templateClassNodes() map[string]*CodeNode {
  return this.templateClassNodes
}
// setter for variable templateClassNodes
func (this *RangerAppWriterContext) Set_templateClassNodes( value map[string]*CodeNode)  {
  this.templateClassNodes = value 
}
// getter for variable templateClassList
func (this *RangerAppWriterContext) Get_templateClassList() []string {
  return this.templateClassList
}
// setter for variable templateClassList
func (this *RangerAppWriterContext) Set_templateClassList( value []string)  {
  this.templateClassList = value 
}
// getter for variable classSignatures
func (this *RangerAppWriterContext) Get_classSignatures() map[string]string {
  return this.classSignatures
}
// setter for variable classSignatures
func (this *RangerAppWriterContext) Set_classSignatures( value map[string]string)  {
  this.classSignatures = value 
}
// getter for variable classToSignature
func (this *RangerAppWriterContext) Get_classToSignature() map[string]string {
  return this.classToSignature
}
// setter for variable classToSignature
func (this *RangerAppWriterContext) Set_classToSignature( value map[string]string)  {
  this.classToSignature = value 
}
// getter for variable templateClasses
func (this *RangerAppWriterContext) Get_templateClasses() map[string]*RangerAppClassDesc {
  return this.templateClasses
}
// setter for variable templateClasses
func (this *RangerAppWriterContext) Set_templateClasses( value map[string]*RangerAppClassDesc)  {
  this.templateClasses = value 
}
// getter for variable classStaticWriters
func (this *RangerAppWriterContext) Get_classStaticWriters() map[string]*CodeWriter {
  return this.classStaticWriters
}
// setter for variable classStaticWriters
func (this *RangerAppWriterContext) Set_classStaticWriters( value map[string]*CodeWriter)  {
  this.classStaticWriters = value 
}
// getter for variable localVariables
func (this *RangerAppWriterContext) Get_localVariables() map[string]IFACE_RangerAppParamDesc {
  return this.localVariables
}
// setter for variable localVariables
func (this *RangerAppWriterContext) Set_localVariables( value map[string]IFACE_RangerAppParamDesc)  {
  this.localVariables = value 
}
// getter for variable localVarNames
func (this *RangerAppWriterContext) Get_localVarNames() []string {
  return this.localVarNames
}
// setter for variable localVarNames
func (this *RangerAppWriterContext) Set_localVarNames( value []string)  {
  this.localVarNames = value 
}
// getter for variable compilerFlags
func (this *RangerAppWriterContext) Get_compilerFlags() map[string]bool {
  return this.compilerFlags
}
// setter for variable compilerFlags
func (this *RangerAppWriterContext) Set_compilerFlags( value map[string]bool)  {
  this.compilerFlags = value 
}
// getter for variable compilerSettings
func (this *RangerAppWriterContext) Get_compilerSettings() map[string]string {
  return this.compilerSettings
}
// setter for variable compilerSettings
func (this *RangerAppWriterContext) Set_compilerSettings( value map[string]string)  {
  this.compilerSettings = value 
}
// getter for variable parserErrors
func (this *RangerAppWriterContext) Get_parserErrors() []*RangerCompilerMessage {
  return this.parserErrors
}
// setter for variable parserErrors
func (this *RangerAppWriterContext) Set_parserErrors( value []*RangerCompilerMessage)  {
  this.parserErrors = value 
}
// getter for variable compilerErrors
func (this *RangerAppWriterContext) Get_compilerErrors() []*RangerCompilerMessage {
  return this.compilerErrors
}
// setter for variable compilerErrors
func (this *RangerAppWriterContext) Set_compilerErrors( value []*RangerCompilerMessage)  {
  this.compilerErrors = value 
}
// getter for variable compilerMessages
func (this *RangerAppWriterContext) Get_compilerMessages() []*RangerCompilerMessage {
  return this.compilerMessages
}
// setter for variable compilerMessages
func (this *RangerAppWriterContext) Set_compilerMessages( value []*RangerCompilerMessage)  {
  this.compilerMessages = value 
}
// getter for variable compilerLog
func (this *RangerAppWriterContext) Get_compilerLog() map[string]*RangerCompilerMessage {
  return this.compilerLog
}
// setter for variable compilerLog
func (this *RangerAppWriterContext) Set_compilerLog( value map[string]*RangerCompilerMessage)  {
  this.compilerLog = value 
}
// getter for variable todoList
func (this *RangerAppWriterContext) Get_todoList() []*RangerAppTodo {
  return this.todoList
}
// setter for variable todoList
func (this *RangerAppWriterContext) Set_todoList( value []*RangerAppTodo)  {
  this.todoList = value 
}
// getter for variable definedMacro
func (this *RangerAppWriterContext) Get_definedMacro() map[string]bool {
  return this.definedMacro
}
// setter for variable definedMacro
func (this *RangerAppWriterContext) Set_definedMacro( value map[string]bool)  {
  this.definedMacro = value 
}
// getter for variable defCounts
func (this *RangerAppWriterContext) Get_defCounts() map[string]int64 {
  return this.defCounts
}
// setter for variable defCounts
func (this *RangerAppWriterContext) Set_defCounts( value map[string]int64)  {
  this.defCounts = value 
}
type CodeFile struct { 
  path_name string
  name string
  writer *GoNullable
  import_list map[string]string
  import_names []string
  fileSystem *GoNullable
}
type IFACE_CodeFile interface { 
  Get_path_name() string
  Set_path_name(value string) 
  Get_name() string
  Set_name(value string) 
  Get_writer() *GoNullable
  Set_writer(value *GoNullable) 
  Get_import_list() map[string]string
  Set_import_list(value map[string]string) 
  Get_import_names() []string
  Set_import_names(value []string) 
  Get_fileSystem() *GoNullable
  Set_fileSystem(value *GoNullable) 
  addImport(import_name string) ()
  testCreateWriter() *CodeWriter
  getImports() []string
  getWriter() *GoNullable
  getCode() string
}

func CreateNew_CodeFile(filePath string, fileName string) *CodeFile {
  me := new(CodeFile)
  me.path_name = ""
  me.name = ""
  me.import_list = make(map[string]string)
  me.import_names = make([]string,0)
  me.writer = new(GoNullable);
  me.fileSystem = new(GoNullable);
  me.name = fileName; 
  me.path_name = filePath; 
  me.writer.value = CreateNew_CodeWriter();
  me.writer.has_value = true; /* detected as non-optional */
  me.writer.value.(*CodeWriter).createTag("imports");
  me.writer.value.(*CodeWriter).ownerFile.value = me;
  me.writer.value.(*CodeWriter).ownerFile.has_value = true; /* detected as non-optional */
  return me;
}
func (this *CodeFile) addImport (import_name string) () {
  if  false == (r_has_key_string_string(this.import_list, import_name)) {
    this.import_list[import_name] = import_name
    this.import_names = append(this.import_names,import_name); 
  }
}
func (this *CodeFile) testCreateWriter () *CodeWriter {
  return CreateNew_CodeWriter();
}
func (this *CodeFile) getImports () []string {
  return this.import_names;
}
func (this *CodeFile) getWriter () *GoNullable {
  return this.writer;
}
func (this *CodeFile) getCode () string {
  return this.writer.value.(*CodeWriter).getCode();
}
// getter for variable path_name
func (this *CodeFile) Get_path_name() string {
  return this.path_name
}
// setter for variable path_name
func (this *CodeFile) Set_path_name( value string)  {
  this.path_name = value 
}
// getter for variable name
func (this *CodeFile) Get_name() string {
  return this.name
}
// setter for variable name
func (this *CodeFile) Set_name( value string)  {
  this.name = value 
}
// getter for variable writer
func (this *CodeFile) Get_writer() *GoNullable {
  return this.writer
}
// setter for variable writer
func (this *CodeFile) Set_writer( value *GoNullable)  {
  this.writer = value 
}
// getter for variable import_list
func (this *CodeFile) Get_import_list() map[string]string {
  return this.import_list
}
// setter for variable import_list
func (this *CodeFile) Set_import_list( value map[string]string)  {
  this.import_list = value 
}
// getter for variable import_names
func (this *CodeFile) Get_import_names() []string {
  return this.import_names
}
// setter for variable import_names
func (this *CodeFile) Set_import_names( value []string)  {
  this.import_names = value 
}
// getter for variable fileSystem
func (this *CodeFile) Get_fileSystem() *GoNullable {
  return this.fileSystem
}
// setter for variable fileSystem
func (this *CodeFile) Set_fileSystem( value *GoNullable)  {
  this.fileSystem = value 
}
type CodeFileSystem struct { 
  files []*CodeFile
}
type IFACE_CodeFileSystem interface { 
  Get_files() []*CodeFile
  Set_files(value []*CodeFile) 
  getFile(path string, name string) *CodeFile
  mkdir(path string) ()
  saveTo(path string) ()
}

func CreateNew_CodeFileSystem() *CodeFileSystem {
  me := new(CodeFileSystem)
  me.files = make([]*CodeFile,0)
  return me;
}
func (this *CodeFileSystem) getFile (path string, name string) *CodeFile {
  var idx_2 int64 = 0;  
  for ; idx_2 < int64(len(this.files)) ; idx_2++ {
    file_2 := this.files[idx_2];
    if  (file_2.path_name == path) && (file_2.name == name) {
      return file_2;
    }
  }
  var new_file *CodeFile = CreateNew_CodeFile(path, name);
  new_file.fileSystem.value = this;
  new_file.fileSystem.has_value = true; /* detected as non-optional */
  this.files = append(this.files,new_file); 
  return new_file;
}
func (this *CodeFileSystem) mkdir (path string) () {
  var parts []string = strings.Split(path, "/");
  var curr_path string = "";
  var i_21 int64 = 0;  
  for ; i_21 < int64(len(parts)) ; i_21++ {
    p := parts[i_21];
    curr_path = strings.Join([]string{ (strings.Join([]string{ curr_path,"/" }, "")),p }, ""); 
    if  false == (r_dir_exists(curr_path)) {
      _ = os.Mkdir( curr_path , os.ModePerm)
    }
  }
}
func (this *CodeFileSystem) saveTo (path string) () {
  var idx_5 int64 = 0;  
  for ; idx_5 < int64(len(this.files)) ; idx_5++ {
    file_5 := this.files[idx_5];
    var file_path string = strings.Join([]string{ (strings.Join([]string{ path,"/" }, "")),file_5.path_name }, "");
    this.mkdir(file_path);
    fmt.Println( strings.Join([]string{ (strings.Join([]string{ (strings.Join([]string{ "Writing to file ",file_path }, "")),"/" }, "")),file_5.name }, "") )
    var file_content string = file_5.getCode();
    if  (int64(len(file_content))) > 0 {
      r_write_text_file(file_path, file_5.name, file_content)
    }
  }
}
// getter for variable files
func (this *CodeFileSystem) Get_files() []*CodeFile {
  return this.files
}
// setter for variable files
func (this *CodeFileSystem) Set_files( value []*CodeFile)  {
  this.files = value 
}
type CodeSlice struct { 
  code string
  writer *GoNullable
}
type IFACE_CodeSlice interface { 
  Get_code() string
  Set_code(value string) 
  Get_writer() *GoNullable
  Set_writer(value *GoNullable) 
  getCode() string
}

func CreateNew_CodeSlice() *CodeSlice {
  me := new(CodeSlice)
  me.code = ""
  me.writer = new(GoNullable);
  return me;
}
func (this *CodeSlice) getCode () string {
  if  !this.writer.has_value  {
    return this.code;
  }
  return this.writer.value.(*CodeWriter).getCode();
}
// getter for variable code
func (this *CodeSlice) Get_code() string {
  return this.code
}
// setter for variable code
func (this *CodeSlice) Set_code( value string)  {
  this.code = value 
}
// getter for variable writer
func (this *CodeSlice) Get_writer() *GoNullable {
  return this.writer
}
// setter for variable writer
func (this *CodeSlice) Set_writer( value *GoNullable)  {
  this.writer = value 
}
type CodeWriter struct { 
  tagName string /**  unused  **/ 
  codeStr string /**  unused  **/ 
  currentLine string
  tabStr string
  lineNumber int64 /**  unused  **/ 
  indentAmount int64
  compiledTags map[string]bool
  tags map[string]int64
  slices []*CodeSlice
  current_slice *GoNullable
  ownerFile *GoNullable
  forks []*CodeWriter /**  unused  **/ 
  tagOffset int64 /**  unused  **/ 
  parent *GoNullable
  had_nl bool /**  unused  **/ 
}
type IFACE_CodeWriter interface { 
  Get_tagName() string
  Set_tagName(value string) 
  Get_codeStr() string
  Set_codeStr(value string) 
  Get_currentLine() string
  Set_currentLine(value string) 
  Get_tabStr() string
  Set_tabStr(value string) 
  Get_lineNumber() int64
  Set_lineNumber(value int64) 
  Get_indentAmount() int64
  Set_indentAmount(value int64) 
  Get_compiledTags() map[string]bool
  Set_compiledTags(value map[string]bool) 
  Get_tags() map[string]int64
  Set_tags(value map[string]int64) 
  Get_slices() []*CodeSlice
  Set_slices(value []*CodeSlice) 
  Get_current_slice() *GoNullable
  Set_current_slice(value *GoNullable) 
  Get_ownerFile() *GoNullable
  Set_ownerFile(value *GoNullable) 
  Get_forks() []*CodeWriter
  Set_forks(value []*CodeWriter) 
  Get_tagOffset() int64
  Set_tagOffset(value int64) 
  Get_parent() *GoNullable
  Set_parent(value *GoNullable) 
  Get_had_nl() bool
  Set_had_nl(value bool) 
  getFileWriter(path string, fileName string) *CodeWriter
  getImports() []string
  addImport(name string) ()
  indent(delta int64) ()
  addIndent() ()
  createTag(name string) *CodeWriter
  getTag(name string) *CodeWriter
  hasTag(name string) bool
  fork() *CodeWriter
  newline() ()
  writeSlice(str string, newLine bool) ()
  out(str string, newLine bool) ()
  raw(str string, newLine bool) ()
  getCode() string
}

func CreateNew_CodeWriter() *CodeWriter {
  me := new(CodeWriter)
  me.tagName = ""
  me.codeStr = ""
  me.currentLine = ""
  me.tabStr = "  "
  me.lineNumber = 1
  me.indentAmount = 0
  me.compiledTags = make(map[string]bool)
  me.tags = make(map[string]int64)
  me.slices = make([]*CodeSlice,0)
  me.forks = make([]*CodeWriter,0)
  me.tagOffset = 0
  me.had_nl = true
  me.current_slice = new(GoNullable);
  me.ownerFile = new(GoNullable);
  me.parent = new(GoNullable);
  var new_slice *CodeSlice = CreateNew_CodeSlice();
  me.slices = append(me.slices,new_slice); 
  me.current_slice.value = new_slice;
  me.current_slice.has_value = true; /* detected as non-optional */
  return me;
}
func (this *CodeWriter) getFileWriter (path string, fileName string) *CodeWriter {
  var fs_2 *GoNullable = new(GoNullable); 
  fs_2.value = this.ownerFile.value.(*CodeFile).fileSystem.value;
  fs_2.has_value = this.ownerFile.value.(*CodeFile).fileSystem.has_value;
  var file_4 *CodeFile = fs_2.value.(*CodeFileSystem).getFile(path, fileName);
  var wr_3 *GoNullable = new(GoNullable); 
  wr_3 = file_4.getWriter();
  return wr_3.value.(*CodeWriter);
}
func (this *CodeWriter) getImports () []string {
  var p_2 *CodeWriter = this;
  for (!p_2.ownerFile.has_value ) && (p_2.parent.has_value) {
    p_2 = p_2.parent.value.(*CodeWriter); 
  }
  if  p_2.ownerFile.has_value {
    var f *CodeFile = p_2.ownerFile.value.(*CodeFile);
    return f.import_names;
  }
  var nothing []string = make([]string, 0);
  return nothing;
}
func (this *CodeWriter) addImport (name string) () {
  if  this.ownerFile.has_value {
    this.ownerFile.value.(*CodeFile).addImport(name);
  } else {
    if  this.parent.has_value {
      this.parent.value.(*CodeWriter).addImport(name);
    }
  }
}
func (this *CodeWriter) indent (delta int64) () {
  this.indentAmount = this.indentAmount + delta; 
  if  this.indentAmount < 0 {
    this.indentAmount = 0; 
  }
}
func (this *CodeWriter) addIndent () () {
  var i_22 int64 = 0;
  if  0 == (int64(len(this.currentLine))) {
    for i_22 < this.indentAmount {
      this.currentLine = strings.Join([]string{ this.currentLine,this.tabStr }, ""); 
      i_22 = i_22 + 1; 
    }
  }
}
func (this *CodeWriter) createTag (name string) *CodeWriter {
  var new_writer *CodeWriter = CreateNew_CodeWriter();
  var new_slice_4 *CodeSlice = CreateNew_CodeSlice();
  this.tags[name] = int64(len(this.slices))
  this.slices = append(this.slices,new_slice_4); 
  new_slice_4.writer.value = new_writer;
  new_slice_4.writer.has_value = true; /* detected as non-optional */
  new_writer.indentAmount = this.indentAmount; 
  var new_active_slice *CodeSlice = CreateNew_CodeSlice();
  this.slices = append(this.slices,new_active_slice); 
  this.current_slice.value = new_active_slice;
  this.current_slice.has_value = true; /* detected as non-optional */
  new_writer.parent.value = this;
  new_writer.parent.has_value = true; /* detected as non-optional */
  return new_writer;
}
func (this *CodeWriter) getTag (name string) *CodeWriter {
  if  r_has_key_string_int64(this.tags, name) {
    var idx_4 int64 = (r_get_string_int64(this.tags, name)).value.(int64);
    var slice *CodeSlice = this.slices[idx_4];
    return slice.writer.value.(*CodeWriter);
  } else {
    if  this.parent.has_value {
      return this.parent.value.(*CodeWriter).getTag(name);
    }
  }
  return this;
}
func (this *CodeWriter) hasTag (name string) bool {
  if  r_has_key_string_int64(this.tags, name) {
    return true;
  } else {
    if  this.parent.has_value {
      return this.parent.value.(*CodeWriter).hasTag(name);
    }
  }
  return false;
}
func (this *CodeWriter) fork () *CodeWriter {
  var new_writer_4 *CodeWriter = CreateNew_CodeWriter();
  var new_slice_6 *CodeSlice = CreateNew_CodeSlice();
  this.slices = append(this.slices,new_slice_6); 
  new_slice_6.writer.value = new_writer_4;
  new_slice_6.writer.has_value = true; /* detected as non-optional */
  new_writer_4.indentAmount = this.indentAmount; 
  new_writer_4.parent.value = this;
  new_writer_4.parent.has_value = true; /* detected as non-optional */
  var new_active_slice_4 *CodeSlice = CreateNew_CodeSlice();
  this.slices = append(this.slices,new_active_slice_4); 
  this.current_slice.value = new_active_slice_4;
  this.current_slice.has_value = true; /* detected as non-optional */
  return new_writer_4;
}
func (this *CodeWriter) newline () () {
  if  (int64(len(this.currentLine))) > 0 {
    this.out("", true);
  }
}
func (this *CodeWriter) writeSlice (str string, newLine bool) () {
  this.addIndent();
  this.currentLine = strings.Join([]string{ this.currentLine,str }, ""); 
  if  newLine {
    this.current_slice.value.(*CodeSlice).code = strings.Join([]string{ (strings.Join([]string{ this.current_slice.value.(*CodeSlice).code,this.currentLine }, "")),"\n" }, ""); 
    this.currentLine = ""; 
  }
}
func (this *CodeWriter) out (str string, newLine bool) () {
  var lines []string = strings.Split(str, "\n");
  var rowCnt int64 = int64(len(lines));
  if  rowCnt == 1 {
    this.writeSlice(str, newLine);
  } else {
    var idx_7 int64 = 0;  
    for ; idx_7 < int64(len(lines)) ; idx_7++ {
      row := lines[idx_7];
      this.addIndent();
      if  idx_7 < (rowCnt - 1) {
        this.writeSlice(strings.TrimSpace(row), true);
      } else {
        this.writeSlice(row, newLine);
      }
    }
  }
}
func (this *CodeWriter) raw (str string, newLine bool) () {
  var lines_4 []string = strings.Split(str, "\n");
  var rowCnt_4 int64 = int64(len(lines_4));
  if  rowCnt_4 == 1 {
    this.writeSlice(str, newLine);
  } else {
    var idx_9 int64 = 0;  
    for ; idx_9 < int64(len(lines_4)) ; idx_9++ {
      row_4 := lines_4[idx_9];
      this.addIndent();
      if  idx_9 < (rowCnt_4 - 1) {
        this.writeSlice(row_4, true);
      } else {
        this.writeSlice(row_4, newLine);
      }
    }
  }
}
func (this *CodeWriter) getCode () string {
  var res_3 string = "";
  var idx_11 int64 = 0;  
  for ; idx_11 < int64(len(this.slices)) ; idx_11++ {
    slice_4 := this.slices[idx_11];
    res_3 = strings.Join([]string{ res_3,slice_4.getCode() }, ""); 
  }
  res_3 = strings.Join([]string{ res_3,this.currentLine }, ""); 
  return res_3;
}
// getter for variable tagName
func (this *CodeWriter) Get_tagName() string {
  return this.tagName
}
// setter for variable tagName
func (this *CodeWriter) Set_tagName( value string)  {
  this.tagName = value 
}
// getter for variable codeStr
func (this *CodeWriter) Get_codeStr() string {
  return this.codeStr
}
// setter for variable codeStr
func (this *CodeWriter) Set_codeStr( value string)  {
  this.codeStr = value 
}
// getter for variable currentLine
func (this *CodeWriter) Get_currentLine() string {
  return this.currentLine
}
// setter for variable currentLine
func (this *CodeWriter) Set_currentLine( value string)  {
  this.currentLine = value 
}
// getter for variable tabStr
func (this *CodeWriter) Get_tabStr() string {
  return this.tabStr
}
// setter for variable tabStr
func (this *CodeWriter) Set_tabStr( value string)  {
  this.tabStr = value 
}
// getter for variable lineNumber
func (this *CodeWriter) Get_lineNumber() int64 {
  return this.lineNumber
}
// setter for variable lineNumber
func (this *CodeWriter) Set_lineNumber( value int64)  {
  this.lineNumber = value 
}
// getter for variable indentAmount
func (this *CodeWriter) Get_indentAmount() int64 {
  return this.indentAmount
}
// setter for variable indentAmount
func (this *CodeWriter) Set_indentAmount( value int64)  {
  this.indentAmount = value 
}
// getter for variable compiledTags
func (this *CodeWriter) Get_compiledTags() map[string]bool {
  return this.compiledTags
}
// setter for variable compiledTags
func (this *CodeWriter) Set_compiledTags( value map[string]bool)  {
  this.compiledTags = value 
}
// getter for variable tags
func (this *CodeWriter) Get_tags() map[string]int64 {
  return this.tags
}
// setter for variable tags
func (this *CodeWriter) Set_tags( value map[string]int64)  {
  this.tags = value 
}
// getter for variable slices
func (this *CodeWriter) Get_slices() []*CodeSlice {
  return this.slices
}
// setter for variable slices
func (this *CodeWriter) Set_slices( value []*CodeSlice)  {
  this.slices = value 
}
// getter for variable current_slice
func (this *CodeWriter) Get_current_slice() *GoNullable {
  return this.current_slice
}
// setter for variable current_slice
func (this *CodeWriter) Set_current_slice( value *GoNullable)  {
  this.current_slice = value 
}
// getter for variable ownerFile
func (this *CodeWriter) Get_ownerFile() *GoNullable {
  return this.ownerFile
}
// setter for variable ownerFile
func (this *CodeWriter) Set_ownerFile( value *GoNullable)  {
  this.ownerFile = value 
}
// getter for variable forks
func (this *CodeWriter) Get_forks() []*CodeWriter {
  return this.forks
}
// setter for variable forks
func (this *CodeWriter) Set_forks( value []*CodeWriter)  {
  this.forks = value 
}
// getter for variable tagOffset
func (this *CodeWriter) Get_tagOffset() int64 {
  return this.tagOffset
}
// setter for variable tagOffset
func (this *CodeWriter) Set_tagOffset( value int64)  {
  this.tagOffset = value 
}
// getter for variable parent
func (this *CodeWriter) Get_parent() *GoNullable {
  return this.parent
}
// setter for variable parent
func (this *CodeWriter) Set_parent( value *GoNullable)  {
  this.parent = value 
}
// getter for variable had_nl
func (this *CodeWriter) Get_had_nl() bool {
  return this.had_nl
}
// setter for variable had_nl
func (this *CodeWriter) Set_had_nl( value bool)  {
  this.had_nl = value 
}
type RangerLispParser struct { 
  code *GoNullable
  buff *GoNullable
  len int64
  i int64
  parents []*CodeNode
  next *GoNullable /**  unused  **/ 
  paren_cnt int64
  get_op_pred int64 /**  unused  **/ 
  rootNode *GoNullable
  curr_node *GoNullable
  had_error bool
}
type IFACE_RangerLispParser interface { 
  Get_code() *GoNullable
  Set_code(value *GoNullable) 
  Get_buff() *GoNullable
  Set_buff(value *GoNullable) 
  Get_len() int64
  Set_len(value int64) 
  Get_i() int64
  Set_i(value int64) 
  Get_parents() []*CodeNode
  Set_parents(value []*CodeNode) 
  Get_next() *GoNullable
  Set_next(value *GoNullable) 
  Get_paren_cnt() int64
  Set_paren_cnt(value int64) 
  Get_get_op_pred() int64
  Set_get_op_pred(value int64) 
  Get_rootNode() *GoNullable
  Set_rootNode(value *GoNullable) 
  Get_curr_node() *GoNullable
  Set_curr_node(value *GoNullable) 
  Get_had_error() bool
  Set_had_error(value bool) 
  joo(cm *SourceCode) ()
  getCode() string
  parse_raw_annotation() *CodeNode
  skip_space(is_block_parent bool) bool
  end_expression() bool
  getOperator() int64
  isOperator() int64
  getOperatorPred(str string) int64
  insert_node(p_node *CodeNode) ()
  parse() ()
}

func CreateNew_RangerLispParser(code_module *SourceCode) *RangerLispParser {
  me := new(RangerLispParser)
  me.len = 0
  me.i = 0
  me.parents = make([]*CodeNode,0)
  me.paren_cnt = 0
  me.get_op_pred = 0
  me.had_error = false
  me.code = new(GoNullable);
  me.buff = new(GoNullable);
  me.next = new(GoNullable);
  me.rootNode = new(GoNullable);
  me.curr_node = new(GoNullable);
  me.buff.value = []byte(code_module.code);
  me.buff.has_value = true; /* detected as non-optional */
  me.code.value = code_module;
  me.code.has_value = true; /* detected as non-optional */
  me.len = int64(len((me.buff.value.([]byte)))); 
  me.rootNode.value = CreateNew_CodeNode(me.code.value.(*SourceCode), 0, 0);
  me.rootNode.has_value = true; /* detected as non-optional */
  me.rootNode.value.(*CodeNode).is_block_node = true; 
  me.rootNode.value.(*CodeNode).expression = true; 
  me.curr_node.value = me.rootNode.value;
  me.curr_node.has_value = me.rootNode.has_value; 
  me.parents = append(me.parents,me.curr_node.value.(*CodeNode)); 
  me.paren_cnt = 1; 
  return me;
}
func (this *RangerLispParser) joo (cm *SourceCode) () {
  /** unused:  ll*/
}
func (this *RangerLispParser) getCode () string {
  return this.rootNode.value.(*CodeNode).getCode();
}
func (this *RangerLispParser) parse_raw_annotation () *CodeNode {
  var sp int64 = this.i;
  var ep int64 = this.i;
  this.i = this.i + 1; 
  sp = this.i; 
  ep = this.i; 
  if  this.i < this.len {
    var a_node2 *CodeNode = CreateNew_CodeNode(this.code.value.(*SourceCode), sp, ep);
    a_node2.expression = true; 
    this.curr_node.value = a_node2;
    this.curr_node.has_value = true; /* detected as non-optional */
    this.parents = append(this.parents,a_node2); 
    this.i = this.i + 1; 
    this.paren_cnt = this.paren_cnt + 1; 
    this.parse();
    return a_node2;
  } else {
  }
  return CreateNew_CodeNode(this.code.value.(*SourceCode), sp, ep);
}
func (this *RangerLispParser) skip_space (is_block_parent bool) bool {
  var s_8 []byte = this.buff.value.([]byte);
  var did_break bool = false;
  if  this.i >= this.len {
    return true;
  }
  var c_2 byte = s_8[this.i];
  /** unused:  bb*/
  for (this.i < this.len) && (c_2 <= 32) {
    if  is_block_parent && ((c_2 == 10) || (c_2 == 13)) {
      this.end_expression();
      did_break = true; 
      break;
    }
    this.i = 1 + this.i; 
    if  this.i >= this.len {
      return true;
    }
    c_2 = s_8[this.i]; 
  }
  return did_break;
}
func (this *RangerLispParser) end_expression () bool {
  this.i = 1 + this.i; 
  if  this.i >= this.len {
    return false;
  }
  this.paren_cnt = this.paren_cnt - 1; 
  if  this.paren_cnt < 0 {
    fmt.Println( "Parser error ) mismatch" )
  }
  this.parents = this.parents[:len(this.parents)-1]; 
  if  this.curr_node.has_value {
    this.curr_node.value.(*CodeNode).ep = this.i; 
    this.curr_node.value.(*CodeNode).infix_operator = false; 
  }
  if  (int64(len(this.parents))) > 0 {
    this.curr_node.value = this.parents[((int64(len(this.parents))) - 1)];
    this.curr_node.has_value = true; /* detected as non-optional */
  } else {
    this.curr_node.value = this.rootNode.value;
    this.curr_node.has_value = this.rootNode.has_value; 
  }
  this.curr_node.value.(*CodeNode).infix_operator = false; 
  return true;
}
func (this *RangerLispParser) getOperator () int64 {
  var s_11 []byte = this.buff.value.([]byte);
  if  (this.i + 2) >= this.len {
    return 0;
  }
  var c_5 byte = s_11[this.i];
  var c2 byte = s_11[(this.i + 1)];
  switch (c_5 ) { 
    case []byte("*")[0] : 
      this.i = this.i + 1; 
      return 14;
    case []byte("/")[0] : 
      this.i = this.i + 1; 
      return 14;
    case []byte("+")[0] : 
      this.i = this.i + 1; 
      return 13;
    case []byte("-")[0] : 
      this.i = this.i + 1; 
      return 13;
    case []byte("<")[0] : 
      if  c2 == ([]byte("=")[0]) {
        this.i = this.i + 2; 
        return 11;
      }
      this.i = this.i + 1; 
      return 11;
    case []byte(">")[0] : 
      if  c2 == ([]byte("=")[0]) {
        this.i = this.i + 2; 
        return 11;
      }
      this.i = this.i + 1; 
      return 11;
    case []byte("!")[0] : 
      if  c2 == ([]byte("=")[0]) {
        this.i = this.i + 2; 
        return 10;
      }
      return 0;
    case []byte("=")[0] : 
      if  c2 == ([]byte("=")[0]) {
        this.i = this.i + 2; 
        return 10;
      }
      this.i = this.i + 1; 
      return 3;
    case []byte("&")[0] : 
      if  c2 == ([]byte("&")[0]) {
        this.i = this.i + 2; 
        return 6;
      }
      return 0;
    case []byte("|")[0] : 
      if  c2 == ([]byte("|")[0]) {
        this.i = this.i + 2; 
        return 5;
      }
      return 0;
    default: 
  }
  return 0;
}
func (this *RangerLispParser) isOperator () int64 {
  var s_13 []byte = this.buff.value.([]byte);
  if  (this.i - 2) > this.len {
    return 0;
  }
  var c_7 byte = s_13[this.i];
  var c2_4 byte = s_13[(this.i + 1)];
  switch (c_7 ) { 
    case []byte("*")[0] : 
      return 1;
    case []byte("/")[0] : 
      return 14;
    case []byte("+")[0] : 
      return 13;
    case []byte("-")[0] : 
      return 13;
    case []byte("<")[0] : 
      if  c2_4 == ([]byte("=")[0]) {
        return 11;
      }
      return 11;
    case []byte(">")[0] : 
      if  c2_4 == ([]byte("=")[0]) {
        return 11;
      }
      return 11;
    case []byte("!")[0] : 
      if  c2_4 == ([]byte("=")[0]) {
        return 10;
      }
      return 0;
    case []byte("=")[0] : 
      if  c2_4 == ([]byte("=")[0]) {
        return 10;
      }
      return 3;
    case []byte("&")[0] : 
      if  c2_4 == ([]byte("&")[0]) {
        return 6;
      }
      return 0;
    case []byte("|")[0] : 
      if  c2_4 == ([]byte("|")[0]) {
        return 5;
      }
      return 0;
    default: 
  }
  return 0;
}
func (this *RangerLispParser) getOperatorPred (str string) int64 {
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
    case "*" : 
      return 14;
    case "/" : 
      return 14;
    default: 
  }
  return 0;
}
func (this *RangerLispParser) insert_node (p_node *CodeNode) () {
  var push_target *GoNullable = new(GoNullable); 
  push_target.value = this.curr_node.value;
  push_target.has_value = this.curr_node.has_value;
  if  this.curr_node.value.(*CodeNode).infix_operator {
    push_target.value = this.curr_node.value.(*CodeNode).infix_node.value;
    push_target.has_value = this.curr_node.value.(*CodeNode).infix_node.has_value; 
    if  push_target.value.(*CodeNode).to_the_right {
      push_target.value = push_target.value.(*CodeNode).right_node.value;
      push_target.has_value = push_target.value.(*CodeNode).right_node.has_value; 
      p_node.parent.value = push_target.value;
      p_node.parent.has_value = push_target.has_value; 
    }
  }
  push_target.value.(*CodeNode).children = append(push_target.value.(*CodeNode).children,p_node); 
}
func (this *RangerLispParser) parse () () {
  var s_15 []byte = this.buff.value.([]byte);
  var c_9 byte = s_15[0];
  /** unused:  next_c*/
  var fc_11 byte = 0;
  var new_node *GoNullable = new(GoNullable); 
  var sp_4 int64 = 0;
  var ep_4 int64 = 0;
  var last_i int64 = 0;
  var had_lf bool = false;
  for this.i < this.len {
    if  this.had_error {
      break;
    }
    last_i = this.i; 
    var is_block_parent bool = false;
    if  had_lf {
      had_lf = false; 
      this.end_expression();
      break;
    }
    if  this.curr_node.has_value {
      if  this.curr_node.value.(*CodeNode).parent.has_value {
        var nodeParent *GoNullable = new(GoNullable); 
        nodeParent.value = this.curr_node.value.(*CodeNode).parent.value;
        nodeParent.has_value = this.curr_node.value.(*CodeNode).parent.has_value;
        if  nodeParent.value.(*CodeNode).is_block_node {
          is_block_parent = true; 
        }
      }
    }
    if  this.skip_space(is_block_parent) {
      break;
    }
    had_lf = false; 
    c_9 = s_15[this.i]; 
    if  this.i < this.len {
      c_9 = s_15[this.i]; 
      if  c_9 == 59 {
        sp_4 = this.i + 1; 
        for (this.i < this.len) && ((s_15[this.i]) > 31) {
          this.i = 1 + this.i; 
        }
        if  this.i >= this.len {
          break;
        }
        new_node.value = CreateNew_CodeNode(this.code.value.(*SourceCode), sp_4, this.i);
        new_node.has_value = true; /* detected as non-optional */
        new_node.value.(*CodeNode).value_type = 10; 
        new_node.value.(*CodeNode).string_value = fmt.Sprintf("%s", s_15[sp_4:this.i]); 
        this.curr_node.value.(*CodeNode).comments = append(this.curr_node.value.(*CodeNode).comments,new_node.value.(*CodeNode)); 
        continue;
      }
      if  this.i < (this.len - 1) {
        fc_11 = s_15[(this.i + 1)]; 
        if  (((c_9 == 40) || (c_9 == ([]byte("{")[0]))) || ((c_9 == 39) && (fc_11 == 40))) || ((c_9 == 96) && (fc_11 == 40)) {
          this.paren_cnt = this.paren_cnt + 1; 
          if  !this.curr_node.has_value  {
            this.rootNode.value = CreateNew_CodeNode(this.code.value.(*SourceCode), this.i, this.i);
            this.rootNode.has_value = true; /* detected as non-optional */
            this.curr_node.value = this.rootNode.value;
            this.curr_node.has_value = this.rootNode.has_value; 
            if  c_9 == 96 {
              this.curr_node.value.(*CodeNode).value_type = 30; 
            }
            if  c_9 == 39 {
              this.curr_node.value.(*CodeNode).value_type = 29; 
            }
            this.curr_node.value.(*CodeNode).expression = true; 
            this.parents = append(this.parents,this.curr_node.value.(*CodeNode)); 
          } else {
            var new_qnode *CodeNode = CreateNew_CodeNode(this.code.value.(*SourceCode), this.i, this.i);
            if  c_9 == 96 {
              new_qnode.value_type = 30; 
            }
            if  c_9 == 39 {
              new_qnode.value_type = 29; 
            }
            new_qnode.expression = true; 
            this.insert_node(new_qnode);
            this.parents = append(this.parents,new_qnode); 
            this.curr_node.value = new_qnode;
            this.curr_node.has_value = true; /* detected as non-optional */
          }
          if  c_9 == ([]byte("{")[0]) {
            this.curr_node.value.(*CodeNode).is_block_node = true; 
          }
          this.i = 1 + this.i; 
          this.parse();
          continue;
        }
      }
      sp_4 = this.i; 
      ep_4 = this.i; 
      fc_11 = s_15[this.i]; 
      if  (((fc_11 == 45) && ((s_15[(this.i + 1)]) >= 46)) && ((s_15[(this.i + 1)]) <= 57)) || ((fc_11 >= 48) && (fc_11 <= 57)) {
        var is_double bool = false;
        sp_4 = this.i; 
        this.i = 1 + this.i; 
        c_9 = s_15[this.i]; 
        for (this.i < this.len) && ((((c_9 >= 48) && (c_9 <= 57)) || (c_9 == ([]byte(".")[0]))) || ((this.i == sp_4) && ((c_9 == ([]byte("+")[0])) || (c_9 == ([]byte("-")[0]))))) {
          if  c_9 == ([]byte(".")[0]) {
            is_double = true; 
          }
          this.i = 1 + this.i; 
          c_9 = s_15[this.i]; 
        }
        ep_4 = this.i; 
        var new_num_node *CodeNode = CreateNew_CodeNode(this.code.value.(*SourceCode), sp_4, ep_4);
        if  is_double {
          new_num_node.value_type = 2; 
          new_num_node.double_value = (r_str_2_d64((fmt.Sprintf("%s", s_15[sp_4:ep_4])))).value.(float64); 
        } else {
          new_num_node.value_type = 3; 
          new_num_node.int_value = (r_str_2_i64((fmt.Sprintf("%s", s_15[sp_4:ep_4])))).value.(int64); 
        }
        this.insert_node(new_num_node);
        continue;
      }
      if  fc_11 == 34 {
        sp_4 = this.i + 1; 
        ep_4 = sp_4; 
        c_9 = s_15[this.i]; 
        var must_encode bool = false;
        for this.i < this.len {
          this.i = 1 + this.i; 
          c_9 = s_15[this.i]; 
          if  c_9 == 34 {
            break;
          }
          if  c_9 == 92 {
            this.i = 1 + this.i; 
            if  this.i < this.len {
              must_encode = true; 
              c_9 = s_15[this.i]; 
            } else {
              break;
            }
          }
        }
        ep_4 = this.i; 
        if  this.i < this.len {
          var encoded_str string = "";
          if  must_encode {
            var orig_str []byte = []byte((fmt.Sprintf("%s", s_15[sp_4:ep_4])));
            var str_length int64 = int64(len(orig_str));
            var ii_5 int64 = 0;
            for ii_5 < str_length {var cc byte = orig_str[ii_5];
              if  cc == 92 {
                var next_ch byte = orig_str[(ii_5 + 1)];
                switch (next_ch ) { 
                  case 34 : 
                    encoded_str = strings.Join([]string{ encoded_str,(string([] byte{byte(34)})) }, ""); 
                  case 92 : 
                    encoded_str = strings.Join([]string{ encoded_str,(string([] byte{byte(92)})) }, ""); 
                  case 47 : 
                    encoded_str = strings.Join([]string{ encoded_str,(string([] byte{byte(47)})) }, ""); 
                  case 98 : 
                    encoded_str = strings.Join([]string{ encoded_str,(string([] byte{byte(8)})) }, ""); 
                  case 102 : 
                    encoded_str = strings.Join([]string{ encoded_str,(string([] byte{byte(12)})) }, ""); 
                  case 110 : 
                    encoded_str = strings.Join([]string{ encoded_str,(string([] byte{byte(10)})) }, ""); 
                  case 114 : 
                    encoded_str = strings.Join([]string{ encoded_str,(string([] byte{byte(13)})) }, ""); 
                  case 116 : 
                    encoded_str = strings.Join([]string{ encoded_str,(string([] byte{byte(9)})) }, ""); 
                  case 117 : 
                    ii_5 = ii_5 + 4; 
                  default: 
                }
                ii_5 = ii_5 + 2; 
              } else {
                encoded_str = strings.Join([]string{ encoded_str,(fmt.Sprintf("%s", orig_str[ii_5:(1 + ii_5)])) }, ""); 
                ii_5 = ii_5 + 1; 
              }
            }
          }
          var new_str_node *CodeNode = CreateNew_CodeNode(this.code.value.(*SourceCode), sp_4, ep_4);
          new_str_node.value_type = 4; 
          if  must_encode {
            new_str_node.string_value = encoded_str; 
          } else {
            new_str_node.string_value = fmt.Sprintf("%s", s_15[sp_4:ep_4]); 
          }
          this.insert_node(new_str_node);
          this.i = 1 + this.i; 
          continue;
        }
      }
      if  (((fc_11 == ([]byte("t")[0])) && ((s_15[(this.i + 1)]) == ([]byte("r")[0]))) && ((s_15[(this.i + 2)]) == ([]byte("u")[0]))) && ((s_15[(this.i + 3)]) == ([]byte("e")[0])) {
        var new_true_node *CodeNode = CreateNew_CodeNode(this.code.value.(*SourceCode), sp_4, sp_4 + 4);
        new_true_node.value_type = 5; 
        new_true_node.boolean_value = true; 
        this.insert_node(new_true_node);
        this.i = this.i + 4; 
        continue;
      }
      if  ((((fc_11 == ([]byte("f")[0])) && ((s_15[(this.i + 1)]) == ([]byte("a")[0]))) && ((s_15[(this.i + 2)]) == ([]byte("l")[0]))) && ((s_15[(this.i + 3)]) == ([]byte("s")[0]))) && ((s_15[(this.i + 4)]) == ([]byte("e")[0])) {
        var new_f_node *CodeNode = CreateNew_CodeNode(this.code.value.(*SourceCode), sp_4, sp_4 + 5);
        new_f_node.value_type = 5; 
        new_f_node.boolean_value = false; 
        this.insert_node(new_f_node);
        this.i = this.i + 5; 
        continue;
      }
      if  fc_11 == ([]byte("@")[0]) {
        this.i = this.i + 1; 
        sp_4 = this.i; 
        ep_4 = this.i; 
        c_9 = s_15[this.i]; 
        for ((((this.i < this.len) && ((s_15[this.i]) > 32)) && (c_9 != 40)) && (c_9 != 41)) && (c_9 != ([]byte("}")[0])) {
          this.i = 1 + this.i; 
          c_9 = s_15[this.i]; 
        }
        ep_4 = this.i; 
        if  (this.i < this.len) && (ep_4 > sp_4) {
          var a_node2_4 *CodeNode = CreateNew_CodeNode(this.code.value.(*SourceCode), sp_4, ep_4);
          var a_name string = fmt.Sprintf("%s", s_15[sp_4:ep_4]);
          a_node2_4.expression = true; 
          this.curr_node.value = a_node2_4;
          this.curr_node.has_value = true; /* detected as non-optional */
          this.parents = append(this.parents,a_node2_4); 
          this.i = this.i + 1; 
          this.paren_cnt = this.paren_cnt + 1; 
          this.parse();
          var use_first bool = false;
          if  1 == (int64(len(a_node2_4.children))) {
            var ch1 *CodeNode = a_node2_4.children[0];
            use_first = ch1.isPrimitive(); 
          }
          if  use_first {
            var theNode *CodeNode
            
            // array_extract operator 
            var theNode_6 []*CodeNode
            theNode , theNode_6 = r_m_arr_CodeNode_extract(a_node2_4.children, 0);
            a_node2_4.children = theNode_6; 
            
            this.curr_node.value.(*CodeNode).props[a_name] = theNode
          } else {
            this.curr_node.value.(*CodeNode).props[a_name] = a_node2_4
          }
          this.curr_node.value.(*CodeNode).prop_keys = append(this.curr_node.value.(*CodeNode).prop_keys,a_name); 
          continue;
        }
      }
      var ns_list []string = make([]string, 0);
      var last_ns int64 = this.i;
      var ns_cnt int64 = 1;
      var vref_had_type_ann bool = false;
      var vref_ann_node *GoNullable = new(GoNullable); 
      var vref_end int64 = this.i;
      if  (((((this.i < this.len) && ((s_15[this.i]) > 32)) && (c_9 != 58)) && (c_9 != 40)) && (c_9 != 41)) && (c_9 != ([]byte("}")[0])) {
        if  this.curr_node.value.(*CodeNode).is_block_node == true {
          var new_expr_node *CodeNode = CreateNew_CodeNode(this.code.value.(*SourceCode), sp_4, ep_4);
          new_expr_node.parent.value = this.curr_node.value;
          new_expr_node.parent.has_value = this.curr_node.has_value; 
          new_expr_node.expression = true; 
          this.curr_node.value.(*CodeNode).children = append(this.curr_node.value.(*CodeNode).children,new_expr_node); 
          this.curr_node.value = new_expr_node;
          this.curr_node.has_value = true; /* detected as non-optional */
          this.parents = append(this.parents,new_expr_node); 
          this.paren_cnt = 1 + this.paren_cnt; 
          this.parse();
          continue;
        }
      }
      var op_c int64 = 0;
      if  (int64(len(this.curr_node.value.(*CodeNode).children))) >= 0 {
        op_c = this.getOperator(); 
      }
      var last_was_newline bool = false;
      if  op_c > 0 {
      } else {
        for (((((this.i < this.len) && ((s_15[this.i]) > 32)) && (c_9 != 58)) && (c_9 != 40)) && (c_9 != 41)) && (c_9 != ([]byte("}")[0])) {
          if  this.i > sp_4 {
            var is_opchar int64 = this.isOperator();
            if  is_opchar > 0 {
              break;
            }
          }
          this.i = 1 + this.i; 
          c_9 = s_15[this.i]; 
          if  (c_9 == 10) || (c_9 == 13) {
            last_was_newline = true; 
            break;
          }
          if  c_9 == ([]byte(".")[0]) {
            ns_list = append(ns_list,fmt.Sprintf("%s", s_15[last_ns:this.i])); 
            last_ns = this.i + 1; 
            ns_cnt = 1 + ns_cnt; 
          }
          if  (this.i > vref_end) && (c_9 == ([]byte("@")[0])) {
            vref_had_type_ann = true; 
            vref_end = this.i; 
            vref_ann_node.value = this.parse_raw_annotation();
            vref_ann_node.has_value = true; /* detected as non-optional */
            c_9 = s_15[this.i]; 
            break;
          }
        }
      }
      ep_4 = this.i; 
      if  vref_had_type_ann {
        ep_4 = vref_end; 
      }
      ns_list = append(ns_list,fmt.Sprintf("%s", s_15[last_ns:ep_4])); 
      c_9 = s_15[this.i]; 
      for ((this.i < this.len) && (c_9 <= 32)) && (false == last_was_newline) {
        this.i = 1 + this.i; 
        c_9 = s_15[this.i]; 
        if  is_block_parent && ((c_9 == 10) || (c_9 == 13)) {
          this.i = this.i - 1; 
          c_9 = s_15[this.i]; 
          had_lf = true; 
          break;
        }
      }
      if  c_9 == 58 {
        this.i = this.i + 1; 
        for (this.i < this.len) && ((s_15[this.i]) <= 32) {
          this.i = 1 + this.i; 
        }
        var vt_sp int64 = this.i;
        var vt_ep int64 = this.i;
        c_9 = s_15[this.i]; 
        if  c_9 == ([]byte("(")[0]) {
          var a_node3 *CodeNode = CreateNew_CodeNode(this.code.value.(*SourceCode), sp_4, ep_4);
          a_node3.expression = true; 
          this.curr_node.value = a_node3;
          this.curr_node.has_value = true; /* detected as non-optional */
          this.parents = append(this.parents,a_node3); 
          this.i = this.i + 1; 
          this.parse();
          var new_expr_node_10 *CodeNode = CreateNew_CodeNode(this.code.value.(*SourceCode), sp_4, vt_ep);
          new_expr_node_10.vref = fmt.Sprintf("%s", s_15[sp_4:ep_4]); 
          new_expr_node_10.ns = ns_list; 
          new_expr_node_10.expression_value.value = a_node3;
          new_expr_node_10.expression_value.has_value = true; /* detected as non-optional */
          new_expr_node_10.value_type = 15; 
          if  vref_had_type_ann {
            new_expr_node_10.vref_annotation.value = vref_ann_node.value;
            new_expr_node_10.vref_annotation.has_value = vref_ann_node.has_value; 
            new_expr_node_10.has_vref_annotation = true; 
          }
          this.curr_node.value.(*CodeNode).children = append(this.curr_node.value.(*CodeNode).children,new_expr_node_10); 
          continue;
        }
        if  c_9 == ([]byte("[")[0]) {
          this.i = this.i + 1; 
          vt_sp = this.i; 
          var hash_sep int64 = 0;
          var had_array_type_ann bool = false;
          c_9 = s_15[this.i]; 
          for ((this.i < this.len) && (c_9 > 32)) && (c_9 != 93) {
            this.i = 1 + this.i; 
            c_9 = s_15[this.i]; 
            if  c_9 == ([]byte(":")[0]) {
              hash_sep = this.i; 
            }
            if  c_9 == ([]byte("@")[0]) {
              had_array_type_ann = true; 
              break;
            }
          }
          vt_ep = this.i; 
          if  hash_sep > 0 {
            vt_ep = this.i; 
            var type_name string = fmt.Sprintf("%s", s_15[(1 + hash_sep):vt_ep]);
            var key_type_name string = fmt.Sprintf("%s", s_15[vt_sp:hash_sep]);
            var new_hash_node *CodeNode = CreateNew_CodeNode(this.code.value.(*SourceCode), sp_4, vt_ep);
            new_hash_node.vref = fmt.Sprintf("%s", s_15[sp_4:ep_4]); 
            new_hash_node.ns = ns_list; 
            new_hash_node.value_type = 7; 
            new_hash_node.array_type = type_name; 
            new_hash_node.key_type = key_type_name; 
            if  vref_had_type_ann {
              new_hash_node.vref_annotation.value = vref_ann_node.value;
              new_hash_node.vref_annotation.has_value = vref_ann_node.has_value; 
              new_hash_node.has_vref_annotation = true; 
            }
            if  had_array_type_ann {
              var vann_hash *CodeNode = this.parse_raw_annotation();
              new_hash_node.type_annotation.value = vann_hash;
              new_hash_node.type_annotation.has_value = true; /* detected as non-optional */
              new_hash_node.has_type_annotation = true; 
              fmt.Println( "--> parsed HASH TYPE annotation" )
            }
            new_hash_node.parent.value = this.curr_node.value;
            new_hash_node.parent.has_value = this.curr_node.has_value; 
            this.curr_node.value.(*CodeNode).children = append(this.curr_node.value.(*CodeNode).children,new_hash_node); 
            this.i = 1 + this.i; 
            continue;
          } else {
            vt_ep = this.i; 
            var type_name_17 string = fmt.Sprintf("%s", s_15[vt_sp:vt_ep]);
            var new_arr_node *CodeNode = CreateNew_CodeNode(this.code.value.(*SourceCode), sp_4, vt_ep);
            new_arr_node.vref = fmt.Sprintf("%s", s_15[sp_4:ep_4]); 
            new_arr_node.ns = ns_list; 
            new_arr_node.value_type = 6; 
            new_arr_node.array_type = type_name_17; 
            new_arr_node.parent.value = this.curr_node.value;
            new_arr_node.parent.has_value = this.curr_node.has_value; 
            this.curr_node.value.(*CodeNode).children = append(this.curr_node.value.(*CodeNode).children,new_arr_node); 
            if  vref_had_type_ann {
              new_arr_node.vref_annotation.value = vref_ann_node.value;
              new_arr_node.vref_annotation.has_value = vref_ann_node.has_value; 
              new_arr_node.has_vref_annotation = true; 
            }
            if  had_array_type_ann {
              var vann_arr *CodeNode = this.parse_raw_annotation();
              new_arr_node.type_annotation.value = vann_arr;
              new_arr_node.type_annotation.has_value = true; /* detected as non-optional */
              new_arr_node.has_type_annotation = true; 
              fmt.Println( "--> parsed ARRAY TYPE annotation" )
            }
            this.i = 1 + this.i; 
            continue;
          }
        }
        var had_type_ann bool = false;
        for ((((((this.i < this.len) && ((s_15[this.i]) > 32)) && (c_9 != 58)) && (c_9 != 40)) && (c_9 != 41)) && (c_9 != ([]byte("}")[0]))) && (c_9 != ([]byte(",")[0])) {
          this.i = 1 + this.i; 
          c_9 = s_15[this.i]; 
          if  c_9 == ([]byte("@")[0]) {
            had_type_ann = true; 
            break;
          }
        }
        if  this.i < this.len {
          vt_ep = this.i; 
          /** unused:  type_name_18*/
          var new_ref_node *CodeNode = CreateNew_CodeNode(this.code.value.(*SourceCode), sp_4, ep_4);
          new_ref_node.vref = fmt.Sprintf("%s", s_15[sp_4:ep_4]); 
          new_ref_node.ns = ns_list; 
          new_ref_node.value_type = 9; 
          new_ref_node.type_name = fmt.Sprintf("%s", s_15[vt_sp:vt_ep]); 
          new_ref_node.parent.value = this.curr_node.value;
          new_ref_node.parent.has_value = this.curr_node.has_value; 
          if  vref_had_type_ann {
            new_ref_node.vref_annotation.value = vref_ann_node.value;
            new_ref_node.vref_annotation.has_value = vref_ann_node.has_value; 
            new_ref_node.has_vref_annotation = true; 
          }
          this.curr_node.value.(*CodeNode).children = append(this.curr_node.value.(*CodeNode).children,new_ref_node); 
          if  had_type_ann {
            var vann *CodeNode = this.parse_raw_annotation();
            new_ref_node.type_annotation.value = vann;
            new_ref_node.type_annotation.has_value = true; /* detected as non-optional */
            new_ref_node.has_type_annotation = true; 
          }
          continue;
        }
      } else {
        if  (this.i < this.len) && (ep_4 > sp_4) {
          var new_vref_node *CodeNode = CreateNew_CodeNode(this.code.value.(*SourceCode), sp_4, ep_4);
          new_vref_node.vref = fmt.Sprintf("%s", s_15[sp_4:ep_4]); 
          new_vref_node.value_type = 9; 
          new_vref_node.ns = ns_list; 
          new_vref_node.parent.value = this.curr_node.value;
          new_vref_node.parent.has_value = this.curr_node.has_value; 
          var op_pred int64 = this.getOperatorPred(new_vref_node.vref);
          if  new_vref_node.vref == "," {
            this.curr_node.value.(*CodeNode).infix_operator = false; 
            continue;
          }
          var pTarget *GoNullable = new(GoNullable); 
          pTarget.value = this.curr_node.value;
          pTarget.has_value = this.curr_node.has_value;
          if  this.curr_node.value.(*CodeNode).infix_operator {
            var iNode *GoNullable = new(GoNullable); 
            iNode.value = this.curr_node.value.(*CodeNode).infix_node.value;
            iNode.has_value = this.curr_node.value.(*CodeNode).infix_node.has_value;
            if  (op_pred > 0) || (iNode.value.(*CodeNode).to_the_right == false) {
              pTarget.value = iNode.value;
              pTarget.has_value = iNode.has_value; 
            } else {
              var rn *GoNullable = new(GoNullable); 
              rn.value = iNode.value.(*CodeNode).right_node.value;
              rn.has_value = iNode.value.(*CodeNode).right_node.has_value;
              new_vref_node.parent.value = rn.value;
              new_vref_node.parent.has_value = rn.has_value; 
              pTarget.value = rn.value;
              pTarget.has_value = rn.has_value; 
            }
          }
          pTarget.value.(*CodeNode).children = append(pTarget.value.(*CodeNode).children,new_vref_node); 
          if  vref_had_type_ann {
            new_vref_node.vref_annotation.value = vref_ann_node.value;
            new_vref_node.vref_annotation.has_value = vref_ann_node.has_value; 
            new_vref_node.has_vref_annotation = true; 
          }
          if  ((s_15[(this.i + 1)]) == ([]byte("(")[0])) || ((s_15[(this.i + 0)]) == ([]byte("(")[0])) {
            if  ((0 == op_pred) && this.curr_node.value.(*CodeNode).infix_operator) && (1 == (int64(len(this.curr_node.value.(*CodeNode).children)))) {
            }
          }
          if  ((op_pred > 0) && this.curr_node.value.(*CodeNode).infix_operator) || ((op_pred > 0) && ((int64(len(this.curr_node.value.(*CodeNode).children))) >= 2)) {
            if  (op_pred == 3) && (2 == (int64(len(this.curr_node.value.(*CodeNode).children)))) {
              var n_ch *CodeNode
              
              // array_extract operator 
              var n_ch_9 []*CodeNode
              n_ch , n_ch_9 = r_m_arr_CodeNode_extract(this.curr_node.value.(*CodeNode).children, 0);
              this.curr_node.value.(*CodeNode).children = n_ch_9; 
              
              this.curr_node.value.(*CodeNode).children = append(this.curr_node.value.(*CodeNode).children,n_ch); 
            } else {
              if  false == this.curr_node.value.(*CodeNode).infix_operator {
                var if_node *CodeNode = CreateNew_CodeNode(this.code.value.(*SourceCode), sp_4, ep_4);
                this.curr_node.value.(*CodeNode).infix_node.value = if_node;
                this.curr_node.value.(*CodeNode).infix_node.has_value = true; /* detected as non-optional */
                this.curr_node.value.(*CodeNode).infix_operator = true; 
                if_node.infix_subnode = true; 
                this.curr_node.value.(*CodeNode).value_type = 0; 
                this.curr_node.value.(*CodeNode).expression = true; 
                if_node.expression = true; 
                var ch_cnt int64 = int64(len(this.curr_node.value.(*CodeNode).children));
                var ii_14 int64 = 0;
                var start_from int64 = ch_cnt - 2;
                var keep_nodes *CodeNode = CreateNew_CodeNode(this.code.value.(*SourceCode), sp_4, ep_4);
                for ch_cnt > 0 {var n_ch_21 *CodeNode
                  
                  // array_extract operator 
                  var n_ch_13 []*CodeNode
                  n_ch_21 , n_ch_13 = r_m_arr_CodeNode_extract(this.curr_node.value.(*CodeNode).children, 0);
                  this.curr_node.value.(*CodeNode).children = n_ch_13; 
                  
                  var p_target *CodeNode = if_node;
                  if  (ii_14 < start_from) || n_ch_21.infix_subnode {
                    p_target = keep_nodes; 
                  }
                  p_target.children = append(p_target.children,n_ch_21); 
                  ch_cnt = ch_cnt - 1; 
                  ii_14 = 1 + ii_14; 
                }
                var i_33 int64 = 0;  
                for ; i_33 < int64(len(keep_nodes.children)) ; i_33++ {
                  keep := keep_nodes.children[i_33];
                  this.curr_node.value.(*CodeNode).children = append(this.curr_node.value.(*CodeNode).children,keep); 
                }
                this.curr_node.value.(*CodeNode).children = append(this.curr_node.value.(*CodeNode).children,if_node); 
              }
              var ifNode *GoNullable = new(GoNullable); 
              ifNode.value = this.curr_node.value.(*CodeNode).infix_node.value;
              ifNode.has_value = this.curr_node.value.(*CodeNode).infix_node.has_value;
              var new_op_node *CodeNode = CreateNew_CodeNode(this.code.value.(*SourceCode), sp_4, ep_4);
              new_op_node.expression = true; 
              new_op_node.parent.value = ifNode.value;
              new_op_node.parent.has_value = ifNode.has_value; 
              var until_index int64 = (int64(len(ifNode.value.(*CodeNode).children))) - 1;
              var to_right bool = false;
              var just_continue bool = false;
              if  (ifNode.value.(*CodeNode).operator_pred > 0) && (ifNode.value.(*CodeNode).operator_pred < op_pred) {
                to_right = true; 
              }
              if  (ifNode.value.(*CodeNode).operator_pred > 0) && (ifNode.value.(*CodeNode).operator_pred > op_pred) {
                ifNode.value.(*CodeNode).to_the_right = false; 
              }
              if  (ifNode.value.(*CodeNode).operator_pred > 0) && (ifNode.value.(*CodeNode).operator_pred == op_pred) {
                to_right = ifNode.value.(*CodeNode).to_the_right; 
              }
              /** unused:  opTarget*/
              if  to_right {
                var op_node *CodeNode
                
                // array_extract operator 
                var op_node_6 []*CodeNode
                op_node , op_node_6 = r_m_arr_CodeNode_extract(ifNode.value.(*CodeNode).children, until_index);
                ifNode.value.(*CodeNode).children = op_node_6; 
                
                var last_value *CodeNode
                
                // array_extract operator 
                var last_value_6 []*CodeNode
                last_value , last_value_6 = r_m_arr_CodeNode_extract(ifNode.value.(*CodeNode).children, (until_index - 1));
                ifNode.value.(*CodeNode).children = last_value_6; 
                
                new_op_node.children = append(new_op_node.children,op_node); 
                new_op_node.children = append(new_op_node.children,last_value); 
              } else {
                if  false == just_continue {
                  for until_index > 0 {var what_to_add *CodeNode
                    
                    // array_extract operator 
                    var what_to_add_6 []*CodeNode
                    what_to_add , what_to_add_6 = r_m_arr_CodeNode_extract(ifNode.value.(*CodeNode).children, 0);
                    ifNode.value.(*CodeNode).children = what_to_add_6; 
                    
                    new_op_node.children = append(new_op_node.children,what_to_add); 
                    until_index = until_index - 1; 
                  }
                }
              }
              if  to_right || (false == just_continue) {
                ifNode.value.(*CodeNode).children = append(ifNode.value.(*CodeNode).children,new_op_node); 
              }
              if  to_right {
                ifNode.value.(*CodeNode).right_node.value = new_op_node;
                ifNode.value.(*CodeNode).right_node.has_value = true; /* detected as non-optional */
                ifNode.value.(*CodeNode).to_the_right = true; 
              }
              ifNode.value.(*CodeNode).operator_pred = op_pred; 
              continue;
            }
          }
          continue;
        }
      }
      if  (c_9 == 41) || (c_9 == ([]byte("}")[0])) {
        if  ((c_9 == ([]byte("}")[0])) && is_block_parent) && ((int64(len(this.curr_node.value.(*CodeNode).children))) > 0) {
          this.end_expression();
        }
        this.i = 1 + this.i; 
        this.paren_cnt = this.paren_cnt - 1; 
        if  this.paren_cnt < 0 {
          break;
        }
        this.parents = this.parents[:len(this.parents)-1]; 
        if  this.curr_node.has_value {
          this.curr_node.value.(*CodeNode).ep = this.i; 
        }
        if  (int64(len(this.parents))) > 0 {
          this.curr_node.value = this.parents[((int64(len(this.parents))) - 1)];
          this.curr_node.has_value = true; /* detected as non-optional */
        } else {
          this.curr_node.value = this.rootNode.value;
          this.curr_node.has_value = this.rootNode.has_value; 
        }
        break;
      }
      if  last_i == this.i {
        this.i = 1 + this.i; 
      }
    }
  }
}
// getter for variable code
func (this *RangerLispParser) Get_code() *GoNullable {
  return this.code
}
// setter for variable code
func (this *RangerLispParser) Set_code( value *GoNullable)  {
  this.code = value 
}
// getter for variable buff
func (this *RangerLispParser) Get_buff() *GoNullable {
  return this.buff
}
// setter for variable buff
func (this *RangerLispParser) Set_buff( value *GoNullable)  {
  this.buff = value 
}
// getter for variable len
func (this *RangerLispParser) Get_len() int64 {
  return this.len
}
// setter for variable len
func (this *RangerLispParser) Set_len( value int64)  {
  this.len = value 
}
// getter for variable i
func (this *RangerLispParser) Get_i() int64 {
  return this.i
}
// setter for variable i
func (this *RangerLispParser) Set_i( value int64)  {
  this.i = value 
}
// getter for variable parents
func (this *RangerLispParser) Get_parents() []*CodeNode {
  return this.parents
}
// setter for variable parents
func (this *RangerLispParser) Set_parents( value []*CodeNode)  {
  this.parents = value 
}
// getter for variable next
func (this *RangerLispParser) Get_next() *GoNullable {
  return this.next
}
// setter for variable next
func (this *RangerLispParser) Set_next( value *GoNullable)  {
  this.next = value 
}
// getter for variable paren_cnt
func (this *RangerLispParser) Get_paren_cnt() int64 {
  return this.paren_cnt
}
// setter for variable paren_cnt
func (this *RangerLispParser) Set_paren_cnt( value int64)  {
  this.paren_cnt = value 
}
// getter for variable get_op_pred
func (this *RangerLispParser) Get_get_op_pred() int64 {
  return this.get_op_pred
}
// setter for variable get_op_pred
func (this *RangerLispParser) Set_get_op_pred( value int64)  {
  this.get_op_pred = value 
}
// getter for variable rootNode
func (this *RangerLispParser) Get_rootNode() *GoNullable {
  return this.rootNode
}
// setter for variable rootNode
func (this *RangerLispParser) Set_rootNode( value *GoNullable)  {
  this.rootNode = value 
}
// getter for variable curr_node
func (this *RangerLispParser) Get_curr_node() *GoNullable {
  return this.curr_node
}
// setter for variable curr_node
func (this *RangerLispParser) Set_curr_node( value *GoNullable)  {
  this.curr_node = value 
}
// getter for variable had_error
func (this *RangerLispParser) Get_had_error() bool {
  return this.had_error
}
// setter for variable had_error
func (this *RangerLispParser) Set_had_error( value bool)  {
  this.had_error = value 
}
type RangerArgMatch struct { 
  matched map[string]string
}
type IFACE_RangerArgMatch interface { 
  Get_matched() map[string]string
  Set_matched(value map[string]string) 
  matchArguments(args *CodeNode, callArgs *CodeNode, ctx *RangerAppWriterContext, firstArgIndex int64) bool
  add(tplKeyword string, typeName string, ctx *RangerAppWriterContext) bool
  doesDefsMatch(arg *CodeNode, node *CodeNode, ctx *RangerAppWriterContext) bool
  doesMatch(arg *CodeNode, node *CodeNode, ctx *RangerAppWriterContext) bool
  areEqualTypes(type1 string, type2 string, ctx *RangerAppWriterContext) bool
  getTypeName(n string) string
  getType(n string) int64
  setRvBasedOn(arg *CodeNode, node *CodeNode) bool
}

func CreateNew_RangerArgMatch() *RangerArgMatch {
  me := new(RangerArgMatch)
  me.matched = make(map[string]string)
  return me;
}
func (this *RangerArgMatch) matchArguments (args *CodeNode, callArgs *CodeNode, ctx *RangerAppWriterContext, firstArgIndex int64) bool {
  /** unused:  fc_12*/
  var missed_args []string = make([]string, 0);
  var all_matched bool = true;
  var i_24 int64 = 0;  
  for ; i_24 < int64(len(args.children)) ; i_24++ {
    arg := args.children[i_24];
    var callArg *CodeNode = callArgs.children[(i_24 + firstArgIndex)];
    if  arg.hasFlag("ignore") {
      continue;
    }
    if  arg.hasFlag("mutable") {
      if  callArg.hasParamDesc {
        var pa *GoNullable = new(GoNullable); 
        pa.value = callArg.paramDesc.value;
        pa.has_value = callArg.paramDesc.has_value;
        var b bool = pa.value.(IFACE_RangerAppParamDesc).Get_nameNode().value.(*CodeNode).hasFlag("mutable");
        if  b == false {
          missed_args = append(missed_args,"was mutable"); 
          all_matched = false; 
        }
      } else {
        all_matched = false; 
      }
    }
    if  arg.hasFlag("optional") {
      if  callArg.hasParamDesc {
        var pa_8 *GoNullable = new(GoNullable); 
        pa_8.value = callArg.paramDesc.value;
        pa_8.has_value = callArg.paramDesc.has_value;
        var b_8 bool = pa_8.value.(IFACE_RangerAppParamDesc).Get_nameNode().value.(*CodeNode).hasFlag("optional");
        if  b_8 == false {
          missed_args = append(missed_args,"optional was missing"); 
          all_matched = false; 
        }
      } else {
        if  callArg.hasFlag("optional") {
        } else {
          all_matched = false; 
        }
      }
    }
    if  callArg.hasFlag("optional") {
      if  false == arg.hasFlag("optional") {
        all_matched = false; 
      }
    }
    if  (arg.value_type != 7) && (arg.value_type != 6) {
      if  callArg.eval_type == 11 {
        if  arg.type_name == "enum" {
          continue;
        }
      }
      if  false == this.add(arg.type_name, callArg.eval_type_name, ctx) {
        all_matched = false; 
        return all_matched;
      }
    }
    if  arg.value_type == 6 {
      if  false == this.add(arg.array_type, callArg.eval_array_type, ctx) {
        fmt.Println( "--> Failed to add the argument  " )
        all_matched = false; 
      }
    }
    if  arg.value_type == 7 {
      if  false == this.add(arg.key_type, callArg.eval_key_type, ctx) {
        fmt.Println( "--> Failed to add the key argument  " )
        all_matched = false; 
      }
      if  false == this.add(arg.array_type, callArg.eval_array_type, ctx) {
        fmt.Println( "--> Failed to add the key argument  " )
        all_matched = false; 
      }
    }
    var did_match bool = false;
    if  this.doesMatch(arg, callArg, ctx) {
      did_match = true; 
    } else {
      missed_args = append(missed_args,strings.Join([]string{ (strings.Join([]string{ (strings.Join([]string{ "matching arg ",arg.vref }, ""))," faileg against " }, "")),callArg.vref }, "")); 
    }
    if  false == did_match {
      all_matched = false; 
    }
  }
  return all_matched;
}
func (this *RangerArgMatch) add (tplKeyword string, typeName string, ctx *RangerAppWriterContext) bool {
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
  }
  if  (int64(len(tplKeyword))) > 1 {
    return true;
  }
  if  r_has_key_string_string(this.matched, tplKeyword) {
    var s_12 string = (r_get_string_string(this.matched, tplKeyword)).value.(string);
    if  this.areEqualTypes(s_12, typeName, ctx) {
      return true;
    }
    if  s_12 == typeName {
      return true;
    } else {
      return false;
    }
  }
  this.matched[tplKeyword] = typeName
  return true;
}
func (this *RangerArgMatch) doesDefsMatch (arg *CodeNode, node *CodeNode, ctx *RangerAppWriterContext) bool {
  if  node.value_type == 11 {
    if  arg.type_name == "enum" {
      return true;
    } else {
      return false;
    }
  }
  if  (arg.value_type != 7) && (arg.value_type != 6) {
    var eq bool = this.areEqualTypes(arg.type_name, node.type_name, ctx);
    var typename string = arg.type_name;
    switch (typename ) { 
      case "expression" : 
        return node.expression;
      case "block" : 
        return node.expression;
      case "arguments" : 
        return node.expression;
      case "keyword" : 
        return node.eval_type == 9;
      case "T.name" : 
        return node.eval_type_name == typename;
    }
    return eq;
  }
  if  (arg.value_type == 6) && (node.eval_type == 6) {
    var same_arrays bool = this.areEqualTypes(arg.array_type, node.array_type, ctx);
    return same_arrays;
  }
  if  (arg.value_type == 7) && (node.eval_type == 7) {
    var same_arrays_6 bool = this.areEqualTypes(arg.array_type, node.array_type, ctx);
    var same_keys bool = this.areEqualTypes(arg.key_type, node.key_type, ctx);
    return same_arrays_6 && same_keys;
  }
  return false;
}
func (this *RangerArgMatch) doesMatch (arg *CodeNode, node *CodeNode, ctx *RangerAppWriterContext) bool {
  if  node.value_type == 11 {
    if  arg.type_name == "enum" {
      return true;
    } else {
      return false;
    }
  }
  if  (arg.value_type != 7) && (arg.value_type != 6) {
    var eq_4 bool = this.areEqualTypes(arg.type_name, node.eval_type_name, ctx);
    var typename_4 string = arg.type_name;
    switch (typename_4 ) { 
      case "expression" : 
        return node.expression;
      case "block" : 
        return node.expression;
      case "arguments" : 
        return node.expression;
      case "keyword" : 
        return node.eval_type == 9;
      case "T.name" : 
        return node.eval_type_name == typename_4;
    }
    return eq_4;
  }
  if  (arg.value_type == 6) && (node.eval_type == 6) {
    var same_arrays_6 bool = this.areEqualTypes(arg.array_type, node.eval_array_type, ctx);
    return same_arrays_6;
  }
  if  (arg.value_type == 7) && (node.eval_type == 7) {
    var same_arrays_10 bool = this.areEqualTypes(arg.array_type, node.eval_array_type, ctx);
    var same_keys_4 bool = this.areEqualTypes(arg.key_type, node.eval_key_type, ctx);
    return same_arrays_10 && same_keys_4;
  }
  return false;
}
func (this *RangerArgMatch) areEqualTypes (type1 string, type2 string, ctx *RangerAppWriterContext) bool {
  var typename_6 string = type1;
  if  r_has_key_string_string(this.matched, type1) {
    typename_6 = (r_get_string_string(this.matched, type1)).value.(string); 
  }
  switch (typename_6 ) { 
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
  }
  if  ctx.isDefinedClass(typename_6) && ctx.isDefinedClass(type2) {
    var c1 *RangerAppClassDesc = ctx.findClass(typename_6);
    var c2_3 *RangerAppClassDesc = ctx.findClass(type2);
    if  c1.isSameOrParentClass(type2, ctx) {
      return true;
    }
    if  c2_3.isSameOrParentClass(typename_6, ctx) {
      return true;
    }
  }
  return typename_6 == type2;
}
func (this *RangerArgMatch) getTypeName (n string) string {
  var typename_8 string = n;
  if  r_has_key_string_string(this.matched, typename_8) {
    typename_8 = (r_get_string_string(this.matched, typename_8)).value.(string); 
  }
  if  0 == (int64(len(typename_8))) {
    return "";
  }
  return typename_8;
}
func (this *RangerArgMatch) getType (n string) int64 {
  var typename_10 string = n;
  if  r_has_key_string_string(this.matched, typename_10) {
    typename_10 = (r_get_string_string(this.matched, typename_10)).value.(string); 
  }
  if  0 == (int64(len(typename_10))) {
    return 0;
  }
  switch (typename_10 ) { 
    case "expression" : 
      return 14;
    case "block" : 
      return 14;
    case "arguments" : 
      return 14;
    case "string" : 
      return 4;
    case "int" : 
      return 3;
    case "char" : 
      return 12;
    case "charbuffer" : 
      return 13;
    case "boolean" : 
      return 5;
    case "double" : 
      return 2;
    case "enum" : 
      return 11;
  }
  return 8;
}
func (this *RangerArgMatch) setRvBasedOn (arg *CodeNode, node *CodeNode) bool {
  if  arg.hasFlag("optional") {
    node.setFlag("optional");
  }
  if  (arg.value_type != 7) && (arg.value_type != 6) {
    node.eval_type = this.getType(arg.type_name); 
    node.eval_type_name = this.getTypeName(arg.type_name); 
    return true;
  }
  if  arg.value_type == 6 {
    node.eval_type = 6; 
    node.eval_array_type = this.getTypeName(arg.array_type); 
    return true;
  }
  if  arg.value_type == 7 {
    node.eval_type = 7; 
    node.eval_key_type = this.getTypeName(arg.key_type); 
    node.eval_array_type = this.getTypeName(arg.array_type); 
    return true;
  }
  return false;
}
// getter for variable matched
func (this *RangerArgMatch) Get_matched() map[string]string {
  return this.matched
}
// setter for variable matched
func (this *RangerArgMatch) Set_matched( value map[string]string)  {
  this.matched = value 
}
type RangerFlowParser struct { 
  stdCommands *GoNullable
}
type IFACE_RangerFlowParser interface { 
  Get_stdCommands() *GoNullable
  Set_stdCommands(value *GoNullable) 
  cmdEnum(node *CodeNode, ctx *RangerAppWriterContext, wr *CodeWriter) ()
  initStdCommands() ()
  findLanguageOper(details *CodeNode, ctx *RangerAppWriterContext) *GoNullable
  buildMacro(langOper *GoNullable, args *CodeNode, ctx *RangerAppWriterContext) *CodeNode
  stdParamMatch(callArgs *CodeNode, inCtx *RangerAppWriterContext, wr *CodeWriter) bool
  cmdImport(node *CodeNode, ctx *RangerAppWriterContext, wr *CodeWriter) bool
  getThisName() string
  WriteThisVar(node *CodeNode, ctx *RangerAppWriterContext, wr *CodeWriter) ()
  WriteVRef(node *CodeNode, ctx *RangerAppWriterContext, wr *CodeWriter) ()
  CreateClass(node *CodeNode, ctx *RangerAppWriterContext, wr *CodeWriter) ()
  DefineVar(node *CodeNode, ctx *RangerAppWriterContext, wr *CodeWriter) ()
  WriteComment(node *CodeNode, ctx *RangerAppWriterContext, wr *CodeWriter) ()
  cmdLog(node *CodeNode, ctx *RangerAppWriterContext, wr *CodeWriter) ()
  cmdDoc(node *CodeNode, ctx *RangerAppWriterContext, wr *CodeWriter) ()
  cmdGitDoc(node *CodeNode, ctx *RangerAppWriterContext, wr *CodeWriter) ()
  cmdNative(node *CodeNode, ctx *RangerAppWriterContext, wr *CodeWriter) ()
  LangInit(node *CodeNode, ctx *RangerAppWriterContext, wr *CodeWriter) ()
  getWriterLang() string
  StartCodeWriting(node *CodeNode, ctx *RangerAppWriterContext, wr *CodeWriter) ()
  Constructor(node *CodeNode, ctx *RangerAppWriterContext, wr *CodeWriter) ()
  WriteScalarValue(node *CodeNode, ctx *RangerAppWriterContext, wr *CodeWriter) ()
  buildGenericClass(tpl *CodeNode, node *CodeNode, ctx *RangerAppWriterContext, wr *CodeWriter) ()
  cmdNew(node *CodeNode, ctx *RangerAppWriterContext, wr *CodeWriter) ()
  cmdLocalCall(node *CodeNode, ctx *RangerAppWriterContext, wr *CodeWriter) bool
  cmdReturn(node *CodeNode, ctx *RangerAppWriterContext, wr *CodeWriter) ()
  cmdAssign(node *CodeNode, ctx *RangerAppWriterContext, wr *CodeWriter) ()
  EnterTemplateClass(node *CodeNode, ctx *RangerAppWriterContext, wr *CodeWriter) ()
  EnterClass(node *CodeNode, ctx *RangerAppWriterContext, wr *CodeWriter) ()
  EnterMethod(node *CodeNode, ctx *RangerAppWriterContext, wr *CodeWriter) ()
  EnterStaticMethod(node *CodeNode, ctx *RangerAppWriterContext, wr *CodeWriter) ()
  EnterLambdaMethod(node *CodeNode, ctx *RangerAppWriterContext, wr *CodeWriter) ()
  EnterVarDef(node *CodeNode, ctx *RangerAppWriterContext, wr *CodeWriter) ()
  WalkNodeChildren(node *CodeNode, ctx *RangerAppWriterContext, wr *CodeWriter) ()
  matchNode(node *CodeNode, ctx *RangerAppWriterContext, wr *CodeWriter) bool
  WalkNode(node *CodeNode, ctx *RangerAppWriterContext, wr *CodeWriter) bool
  mergeImports(node *CodeNode, ctx *RangerAppWriterContext, wr *CodeWriter) ()
  CollectMethods(node *CodeNode, ctx *RangerAppWriterContext, wr *CodeWriter) ()
  FindWeakRefs(node *CodeNode, ctx *RangerAppWriterContext, wr *CodeWriter) ()
  findFunctionDesc(obj *CodeNode, ctx *RangerAppWriterContext, wr *CodeWriter) *GoNullable
  findParamDesc(obj *CodeNode, ctx *RangerAppWriterContext, wr *CodeWriter) *GoNullable
  areEqualTypes(n1 *CodeNode, n2 *CodeNode, ctx *RangerAppWriterContext) bool
  shouldBeEqualTypes(n1 *CodeNode, n2 *CodeNode, ctx *RangerAppWriterContext, msg string) ()
  shouldBeExpression(n1 *CodeNode, ctx *RangerAppWriterContext, msg string) ()
  shouldHaveChildCnt(cnt int64, n1 *CodeNode, ctx *RangerAppWriterContext, msg string) ()
  shouldBeNumeric(n1 *CodeNode, ctx *RangerAppWriterContext, msg string) ()
  shouldBeArray(n1 *CodeNode, ctx *RangerAppWriterContext, msg string) ()
  shouldBeType(type_name string, n1 *CodeNode, ctx *RangerAppWriterContext, msg string) ()
}

func CreateNew_RangerFlowParser() *RangerFlowParser {
  me := new(RangerFlowParser)
  me.stdCommands = new(GoNullable);
  return me;
}
func (this *RangerFlowParser) cmdEnum (node *CodeNode, ctx *RangerAppWriterContext, wr *CodeWriter) () {
  var fNameNode *CodeNode = node.children[1];
  var enumList *CodeNode = node.children[2];
  var new_enum *RangerAppEnum = CreateNew_RangerAppEnum();
  var i_25 int64 = 0;  
  for ; i_25 < int64(len(enumList.children)) ; i_25++ {
    item_2 := enumList.children[i_25];
    new_enum.add(item_2.vref);
  }
  ctx.definedEnums[fNameNode.vref] = new_enum
}
func (this *RangerFlowParser) initStdCommands () () {
}
func (this *RangerFlowParser) findLanguageOper (details *CodeNode, ctx *RangerAppWriterContext) *GoNullable {
  var langName string = ctx.getTargetLang();
  var i_28 int64 = 0;  
  for ; i_28 < int64(len(details.children)) ; i_28++ {
    det := details.children[i_28];
    if  (int64(len(det.children))) > 0 {
      var fc_13 *CodeNode = det.children[0];
      if  fc_13.vref == "templates" {
        var tplList *CodeNode = det.children[1];
        var i_38 int64 = 0;  
        for ; i_38 < int64(len(tplList.children)) ; i_38++ {
          tpl := tplList.children[i_38];
          var tplName *CodeNode = tpl.getFirst();
          var tplImpl *GoNullable = new(GoNullable); 
          tplImpl.value = tpl.getSecond();
          tplImpl.has_value = true; /* detected as non-optional */
          if  (tplName.vref != "*") && (tplName.vref != langName) {
            continue;
          }
          var rv *GoNullable = new(GoNullable); 
          rv.value = tpl;
          rv.has_value = true; /* detected as non-optional */
          return rv;
        }
      }
    }
  }
  var none_2 *GoNullable = new(GoNullable); 
  return none_2;
}
func (this *RangerFlowParser) buildMacro (langOper *GoNullable, args *CodeNode, ctx *RangerAppWriterContext) *CodeNode {
  var subCtx *RangerAppWriterContext = ctx.fork();
  var wr_4 *CodeWriter = CreateNew_CodeWriter();
  var lcc *LiveCompiler = CreateNew_LiveCompiler();
  lcc.langWriter.value = CreateNew_RangerRangerClassWriter();
  lcc.langWriter.has_value = true; /* detected as non-optional */
  lcc.langWriter.value.(IFACE_RangerGenericClassWriter).Get_compiler().value = lcc;
  lcc.langWriter.value.(IFACE_RangerGenericClassWriter).Get_compiler().has_value = true; /* detected as non-optional */
  subCtx.targetLangName = "ranger"; 
  var macroNode *CodeNode = langOper.value.(*CodeNode);
  var cmdList *CodeNode = macroNode.getSecond();
  lcc.walkCommandList(cmdList, args, subCtx, wr_4);
  var lang_str string = wr_4.getCode();
  var lang_code *SourceCode = CreateNew_SourceCode(lang_str);
  lang_code.filename = strings.Join([]string{ (strings.Join([]string{ "<macro ",macroNode.vref }, "")),">" }, ""); 
  var lang_parser *RangerLispParser = CreateNew_RangerLispParser(lang_code);
  lang_parser.parse();
  var node *CodeNode = lang_parser.rootNode.value.(*CodeNode);
  return node;
}
func (this *RangerFlowParser) stdParamMatch (callArgs *CodeNode, inCtx *RangerAppWriterContext, wr *CodeWriter) bool {
  this.stdCommands.value = inCtx.getStdCommands();
  this.stdCommands.has_value = true; /* detected as non-optional */
  var callFnName *CodeNode = callArgs.getFirst();
  var cmds_2 *GoNullable = new(GoNullable); 
  cmds_2.value = this.stdCommands.value;
  cmds_2.has_value = this.stdCommands.has_value;
  var some_matched bool = false;
  /** unused:  found_fn*/
  /** unused:  missed_args_2*/
  var ctx *RangerAppWriterContext = inCtx.fork();
  /** unused:  lang_name*/
  var expects_error bool = false;
  var err_cnt int64 = inCtx.getErrorCount();
  if  callArgs.hasBooleanProperty("error") {
    expects_error = true; 
  }
  var main_index int64 = 0;  
  for ; main_index < int64(len(cmds_2.value.(*CodeNode).children)) ; main_index++ {
    ch_4 := cmds_2.value.(*CodeNode).children[main_index];
    var fc_16 *CodeNode = ch_4.getFirst();
    var nameNode *CodeNode = ch_4.getSecond();
    var args *CodeNode = ch_4.getThird();
    if  callFnName.vref == fc_16.vref {
      /** unused:  line_index*/
      var callerArgCnt int64 = (int64(len(callArgs.children))) - 1;
      var fnArgCnt int64 = int64(len(args.children));
      var has_eval_ctx bool = false;
      var is_macro bool = false;
      if  nameNode.hasFlag("newcontext") {
        ctx = inCtx.fork(); 
        has_eval_ctx = true; 
      }
      if  callerArgCnt == fnArgCnt {
        var details_list *CodeNode = ch_4.children[3];
        var langOper *GoNullable = new(GoNullable); 
        langOper = this.findLanguageOper(details_list, ctx);
        if  !langOper.has_value  {
          continue;
        }
        if  langOper.value.(*CodeNode).hasBooleanProperty("macro") {
          is_macro = true; 
        }
        var match *RangerArgMatch = CreateNew_RangerArgMatch();
        var i_32 int64 = 0;  
        for ; i_32 < int64(len(args.children)) ; i_32++ {
          arg_2 := args.children[i_32];
          var callArg_2 *CodeNode = callArgs.children[(i_32 + 1)];
          if  arg_2.hasFlag("define") {
            var p_3 IFACE_RangerAppParamDesc = CreateNew_RangerAppParamDesc();
            p_3.Set_name(callArg_2.vref); 
            p_3.Set_value_type(arg_2.value_type); 
            p_3.Get_node().value = callArg_2;
            p_3.Get_node().has_value = true; /* detected as non-optional */
            p_3.Get_nameNode().value = callArg_2;
            p_3.Get_nameNode().has_value = true; /* detected as non-optional */
            p_3.Set_is_optional(false); 
            ctx.defineVariable(p_3.Get_name(), p_3);
            callArg_2.hasParamDesc = true; 
            callArg_2.ownParamDesc.value = p_3;
            callArg_2.ownParamDesc.has_value = true; /* detected as non-optional */
            callArg_2.paramDesc.value = p_3;
            callArg_2.paramDesc.has_value = true; /* detected as non-optional */
            if  (int64(len(callArg_2.type_name))) == 0 {
              callArg_2.type_name = arg_2.type_name; 
              callArg_2.value_type = arg_2.value_type; 
            }
            callArg_2.eval_type = arg_2.value_type; 
            callArg_2.eval_type_name = arg_2.type_name; 
          }
          if  arg_2.hasFlag("ignore") {
            continue;
          }
          ctx.setInExpr();
          this.WalkNode(callArg_2, ctx, wr);
          ctx.unsetInExpr();
        }
        var all_matched_2 bool = match.matchArguments(args, callArgs, ctx, 1);
        if  all_matched_2 {
          if  is_macro {
            var macroNode_4 *CodeNode = this.buildMacro(langOper, callArgs, ctx);
            var len_4 int64 = int64(len(callArgs.children));
            for len_4 > 0 {
              callArgs.children = callArgs.children[:len(callArgs.children)-1]; 
              len_4 = len_4 - 1; 
            }
            callArgs.children = append(callArgs.children,macroNode_4); 
            macroNode_4.parent.value = callArgs;
            macroNode_4.parent.has_value = true; /* detected as non-optional */
            this.WalkNode(macroNode_4, ctx, wr);
            match.setRvBasedOn(nameNode, callArgs);
            return true;
          }
          if  nameNode.hasFlag("moves") {
            var moves_opt *GoNullable = new(GoNullable); 
            moves_opt = nameNode.getFlag("moves");
            var moves *CodeNode = moves_opt.value.(*CodeNode);
            var ann_12 *GoNullable = new(GoNullable); 
            ann_12.value = moves.vref_annotation.value;
            ann_12.has_value = moves.vref_annotation.has_value;
            var from *CodeNode = ann_12.value.(*CodeNode).getFirst();
            var to *CodeNode = ann_12.value.(*CodeNode).getSecond();
            var cA *CodeNode = callArgs.children[from.int_value];
            var cA2 *CodeNode = callArgs.children[to.int_value];
            if  cA.hasParamDesc {
              var pp *GoNullable = new(GoNullable); 
              pp.value = cA.paramDesc.value;
              pp.has_value = cA.paramDesc.has_value;
              var pp2 *GoNullable = new(GoNullable); 
              pp2.value = cA2.paramDesc.value;
              pp2.has_value = cA2.paramDesc.has_value;
              pp.value.(IFACE_RangerAppParamDesc).moveRefTo(callArgs, pp2.value.(IFACE_RangerAppParamDesc), ctx);
            }
          }
          if  nameNode.hasFlag("returns") {
            var activeFn *RangerAppFunctionDesc = ctx.getCurrentMethod();
            if  activeFn.nameNode.value.(*CodeNode).type_name != "void" {
              if  (int64(len(callArgs.children))) < 2 {
                ctx.addError(callArgs, " missing return value !!!");
              } else {
                var returnedValue *CodeNode = callArgs.children[1];
                if  match.doesMatch((activeFn.nameNode.value.(*CodeNode)), returnedValue, ctx) == false {
                  ctx.addError(returnedValue, "invalid return value type!!!");
                }
                var argNode *CodeNode = activeFn.nameNode.value.(*CodeNode);
                if  returnedValue.hasFlag("optional") {
                  if  false == argNode.hasFlag("optional") {
                    ctx.addError(callArgs, strings.Join([]string{ "function return value optionality does not match, expected non-optional return value, optional given at ",argNode.getCode() }, ""));
                  }
                }
                if  argNode.hasFlag("optional") {
                  if  false == returnedValue.hasFlag("optional") {
                    ctx.addError(callArgs, strings.Join([]string{ "function return value optionality does not match, expected optional return value ",argNode.getCode() }, ""));
                  }
                }
                var pp_14 *GoNullable = new(GoNullable); 
                pp_14.value = returnedValue.paramDesc.value;
                pp_14.has_value = returnedValue.paramDesc.has_value;
                if  pp_14.has_value {
                  pp_14.value.(IFACE_RangerAppParamDesc).moveRefTo(callArgs, activeFn, ctx);
                }
              }
            }
            if  !callArgs.parent.has_value  {
              ctx.addError(callArgs, "did not have parent");
              fmt.Println( strings.Join([]string{ "no parent => ",callArgs.getCode() }, "") )
            }
            callArgs.parent.value.(*CodeNode).didReturnAtIndex = r_indexof_arr_CodeNode(callArgs.parent.value.(*CodeNode).children, callArgs); 
          }
          if  nameNode.hasFlag("returns") == false {
            match.setRvBasedOn(nameNode, callArgs);
          }
          if  has_eval_ctx {
            callArgs.evalCtx.value = ctx;
            callArgs.evalCtx.has_value = true; /* detected as non-optional */
          }
          var nodeP *GoNullable = new(GoNullable); 
          nodeP.value = callArgs.parent.value;
          nodeP.has_value = callArgs.parent.has_value;
          if  nodeP.has_value {
          } else {
          }
          /** unused:  sig*/
          some_matched = true; 
          callArgs.has_operator = true; 
          callArgs.op_index = main_index; 
          var arg_index int64 = 0;  
          for ; arg_index < int64(len(args.children)) ; arg_index++ {
            arg_13 := args.children[arg_index];
            if  arg_13.has_vref_annotation {
              var anns *GoNullable = new(GoNullable); 
              anns.value = arg_13.vref_annotation.value;
              anns.has_value = arg_13.vref_annotation.has_value;
              var i_42 int64 = 0;  
              for ; i_42 < int64(len(anns.value.(*CodeNode).children)) ; i_42++ {
                ann_25 := anns.value.(*CodeNode).children[i_42];
                if  ann_25.vref == "mutates" {
                  var theArg *CodeNode = callArgs.children[(arg_index + 1)];
                  if  theArg.hasParamDesc {
                    theArg.paramDesc.value.(IFACE_RangerAppParamDesc).Set_set_cnt(theArg.paramDesc.value.(IFACE_RangerAppParamDesc).Get_set_cnt() + 1); 
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
  if  some_matched == false {
    ctx.addError(callArgs, strings.Join([]string{ "stdMatch -> Could not match argument types for ",callFnName.vref }, ""));
  }
  if  expects_error {
    var cnt_now int64 = ctx.getErrorCount();
    if  cnt_now == err_cnt {
      ctx.addParserError(callArgs, strings.Join([]string{ (strings.Join([]string{ (strings.Join([]string{ "LANGUAGE_PARSER_ERROR: expected generated error, err counts : ",strconv.FormatInt(err_cnt, 10) }, ""))," : " }, "")),strconv.FormatInt(cnt_now, 10) }, ""));
    }
  } else {
    var cnt_now_9 int64 = ctx.getErrorCount();
    if  cnt_now_9 > err_cnt {
      ctx.addParserError(callArgs, strings.Join([]string{ (strings.Join([]string{ (strings.Join([]string{ "LANGUAGE_PARSER_ERROR: did not expect generated error, err counts : ",strconv.FormatInt(err_cnt, 10) }, ""))," : " }, "")),strconv.FormatInt(cnt_now_9, 10) }, ""));
    }
  }
  return true;
}
func (this *RangerFlowParser) cmdImport (node *CodeNode, ctx *RangerAppWriterContext, wr *CodeWriter) bool {
  return false;
}
func (this *RangerFlowParser) getThisName () string {
  return "this";
}
func (this *RangerFlowParser) WriteThisVar (node *CodeNode, ctx *RangerAppWriterContext, wr *CodeWriter) () {
}
func (this *RangerFlowParser) WriteVRef (node *CodeNode, ctx *RangerAppWriterContext, wr *CodeWriter) () {
  if  node.vref == "_" {
    return;
  }
  var rootObjName string = node.ns[0];
  if  ctx.isInStatic() {
    if  rootObjName == "this" {
      ctx.addError(node, "This can not be used in static context");
    }
  }
  if  ctx.isEnumDefined(rootObjName) {
    var enumName string = node.ns[1];
    var ee *GoNullable = new(GoNullable); 
    ee = ctx.getEnum(rootObjName);
    var e_7 *RangerAppEnum = ee.value.(*RangerAppEnum);
    if  r_has_key_string_int64(e_7.values, enumName) {
      node.eval_type = 11; 
      node.eval_type_name = rootObjName; 
      node.int_value = (r_get_string_int64(e_7.values, enumName)).value.(int64); 
    } else {
      ctx.addError(node, strings.Join([]string{ (strings.Join([]string{ (strings.Join([]string{ "Undefined Enum ",rootObjName }, "")),"." }, "")),enumName }, ""));
      node.eval_type = 1; 
    }
    return;
  }
  if  node.vref == this.getThisName() {
    var cd *GoNullable = new(GoNullable); 
    cd = ctx.getCurrentClass();
    var thisClassDesc *GoNullable = new(GoNullable); 
    thisClassDesc.value = cd.value;
    thisClassDesc.has_value = cd.has_value;
    node.eval_type = 8; 
    node.eval_type_name = thisClassDesc.value.(*RangerAppClassDesc).name; 
    node.ref_type = 4; 
    return;
  }
  if  (rootObjName == "this") || ctx.isVarDefined(rootObjName) {
    /** unused:  vDef2*/
    /** unused:  activeFn_4*/
    var vDef_2 *GoNullable = new(GoNullable); 
    vDef_2 = this.findParamDesc(node, ctx, wr);
    if  vDef_2.has_value {
      node.hasParamDesc = true; 
      node.ownParamDesc.value = vDef_2.value;
      node.ownParamDesc.has_value = vDef_2.has_value; 
      node.paramDesc.value = vDef_2.value;
      node.paramDesc.has_value = vDef_2.has_value; 
      vDef_2.value.(IFACE_RangerAppParamDesc).Set_ref_cnt(1 + vDef_2.value.(IFACE_RangerAppParamDesc).Get_ref_cnt()); 
      var vNameNode *GoNullable = new(GoNullable); 
      vNameNode.value = vDef_2.value.(IFACE_RangerAppParamDesc).Get_nameNode().value;
      vNameNode.has_value = vDef_2.value.(IFACE_RangerAppParamDesc).Get_nameNode().has_value;
      if  vNameNode.has_value {
        if  vNameNode.value.(*CodeNode).hasFlag("optional") {
          node.setFlag("optional");
        }
        node.eval_type = vNameNode.value.(*CodeNode).typeNameAsType(ctx); 
        node.eval_type_name = vNameNode.value.(*CodeNode).type_name; 
        if  vNameNode.value.(*CodeNode).value_type == 6 {
          node.eval_type = 6; 
          node.eval_array_type = vNameNode.value.(*CodeNode).array_type; 
        }
        if  vNameNode.value.(*CodeNode).value_type == 7 {
          node.eval_type = 7; 
          node.eval_key_type = vNameNode.value.(*CodeNode).key_type; 
          node.eval_array_type = vNameNode.value.(*CodeNode).array_type; 
        }
      }
    }
  } else {
    var class_or_this bool = rootObjName == this.getThisName();
    if  ctx.isDefinedClass(rootObjName) {
      class_or_this = true; 
      node.eval_type = 23; 
      node.eval_type_name = rootObjName; 
    }
    if  ctx.hasTemplateNode(rootObjName) {
      class_or_this = true; 
    }
    if  false == class_or_this {
      var udesc *GoNullable = new(GoNullable); 
      udesc = ctx.getCurrentClass();
      var desc *RangerAppClassDesc = udesc.value.(*RangerAppClassDesc);
      ctx.addError(node, strings.Join([]string{ (strings.Join([]string{ (strings.Join([]string{ "Undefined variable ",rootObjName }, ""))," in class " }, "")),desc.name }, ""));
    }
    return;
  }
}
func (this *RangerFlowParser) CreateClass (node *CodeNode, ctx *RangerAppWriterContext, wr *CodeWriter) () {
}
func (this *RangerFlowParser) DefineVar (node *CodeNode, ctx *RangerAppWriterContext, wr *CodeWriter) () {
}
func (this *RangerFlowParser) WriteComment (node *CodeNode, ctx *RangerAppWriterContext, wr *CodeWriter) () {
}
func (this *RangerFlowParser) cmdLog (node *CodeNode, ctx *RangerAppWriterContext, wr *CodeWriter) () {
}
func (this *RangerFlowParser) cmdDoc (node *CodeNode, ctx *RangerAppWriterContext, wr *CodeWriter) () {
}
func (this *RangerFlowParser) cmdGitDoc (node *CodeNode, ctx *RangerAppWriterContext, wr *CodeWriter) () {
}
func (this *RangerFlowParser) cmdNative (node *CodeNode, ctx *RangerAppWriterContext, wr *CodeWriter) () {
}
func (this *RangerFlowParser) LangInit (node *CodeNode, ctx *RangerAppWriterContext, wr *CodeWriter) () {
}
func (this *RangerFlowParser) getWriterLang () string {
  return "_";
}
func (this *RangerFlowParser) StartCodeWriting (node *CodeNode, ctx *RangerAppWriterContext, wr *CodeWriter) () {
}
func (this *RangerFlowParser) Constructor (node *CodeNode, ctx *RangerAppWriterContext, wr *CodeWriter) () {
  this.shouldHaveChildCnt(3, node, ctx, "Method expexts four arguments");
  /** unused:  cn*/
  var fnBody *CodeNode = node.children[2];
  var udesc_4 *GoNullable = new(GoNullable); 
  udesc_4 = ctx.getCurrentClass();
  var desc_4 *RangerAppClassDesc = udesc_4.value.(*RangerAppClassDesc);
  var m_5 *GoNullable = new(GoNullable); 
  m_5.value = desc_4.constructor_fn.value;
  m_5.has_value = desc_4.constructor_fn.has_value;
  var subCtx_4 *RangerAppWriterContext = m_5.value.(*RangerAppFunctionDesc).fnCtx.value.(*RangerAppWriterContext);
  subCtx_4.is_function = true; 
  subCtx_4.currentMethod.value = m_5.value;
  subCtx_4.currentMethod.has_value = m_5.has_value; 
  subCtx_4.setInMethod();
  var i_36 int64 = 0;  
  for ; i_36 < int64(len(m_5.value.(*RangerAppFunctionDesc).params)) ; i_36++ {
    v := m_5.value.(*RangerAppFunctionDesc).params[i_36];
    subCtx_4.defineVariable(v.Get_name(), v);
  }
  this.WalkNodeChildren(fnBody, subCtx_4, wr);
  subCtx_4.unsetInMethod();
  if  fnBody.didReturnAtIndex >= 0 {
    ctx.addError(node, "constructor should not return any values!");
  }
  var i_40 int64 = 0;  
  for ; i_40 < int64(len(subCtx_4.localVarNames)) ; i_40++ {
    n_4 := subCtx_4.localVarNames[i_40];
    var p_6 *GoNullable = new(GoNullable); 
    p_6 = r_get_string_IFACE_RangerAppParamDesc(subCtx_4.localVariables, n_4);
    if  p_6.value.(IFACE_RangerAppParamDesc).Get_set_cnt() > 0 {
      var defNode *GoNullable = new(GoNullable); 
      defNode.value = p_6.value.(IFACE_RangerAppParamDesc).Get_node().value;
      defNode.has_value = p_6.value.(IFACE_RangerAppParamDesc).Get_node().has_value;
      defNode.value.(*CodeNode).setFlag("mutable");
      var nNode *GoNullable = new(GoNullable); 
      nNode.value = p_6.value.(IFACE_RangerAppParamDesc).Get_nameNode().value;
      nNode.has_value = p_6.value.(IFACE_RangerAppParamDesc).Get_nameNode().has_value;
      nNode.value.(*CodeNode).setFlag("mutable");
    }
  }
}
func (this *RangerFlowParser) WriteScalarValue (node *CodeNode, ctx *RangerAppWriterContext, wr *CodeWriter) () {
  node.eval_type = node.value_type; 
  switch (node.value_type ) { 
    case 2 : 
      node.eval_type_name = "double"; 
    case 4 : 
      node.eval_type_name = "string"; 
    case 3 : 
      node.eval_type_name = "int"; 
    case 5 : 
      node.eval_type_name = "boolean"; 
  }
}
func (this *RangerFlowParser) buildGenericClass (tpl *CodeNode, node *CodeNode, ctx *RangerAppWriterContext, wr *CodeWriter) () {
  var root_20 *RangerAppWriterContext = ctx.getRoot();
  var cn_4 *CodeNode = tpl.getSecond();
  var newName *CodeNode = node.getSecond();
  var tplArgs_2 *GoNullable = new(GoNullable); 
  tplArgs_2.value = cn_4.vref_annotation.value;
  tplArgs_2.has_value = cn_4.vref_annotation.has_value;
  var givenArgs *GoNullable = new(GoNullable); 
  givenArgs.value = newName.vref_annotation.value;
  givenArgs.has_value = newName.vref_annotation.has_value;
  var sign_2 string = strings.Join([]string{ cn_4.vref,givenArgs.value.(*CodeNode).getCode() }, "");
  if  r_has_key_string_string(root_20.classSignatures, sign_2) {
    return;
  }
  fmt.Println( strings.Join([]string{ "could build generic class... ",cn_4.vref }, "") )
  var match_4 *RangerArgMatch = CreateNew_RangerArgMatch();
  var i_40 int64 = 0;  
  for ; i_40 < int64(len(tplArgs_2.value.(*CodeNode).children)) ; i_40++ {
    arg_7 := tplArgs_2.value.(*CodeNode).children[i_40];
    var given *CodeNode = givenArgs.value.(*CodeNode).children[i_40];
    fmt.Println( strings.Join([]string{ (strings.Join([]string{ (strings.Join([]string{ " setting ",arg_7.vref }, ""))," => " }, "")),given.vref }, "") )
    if  false == match_4.add(arg_7.vref, given.vref, ctx) {
      fmt.Println( "set failed!" )
    } else {
      fmt.Println( "set OK" )
    }
    fmt.Println( strings.Join([]string{ " T == ",match_4.getTypeName(arg_7.vref) }, "") )
  }
  fmt.Println( strings.Join([]string{ " T == ",match_4.getTypeName("T") }, "") )
  var newClassNode *CodeNode = tpl.rebuildWithType(match_4, false);
  fmt.Println( "build done" )
  fmt.Println( newClassNode.getCode() )
  var sign_8 string = strings.Join([]string{ cn_4.vref,givenArgs.value.(*CodeNode).getCode() }, "");
  fmt.Println( strings.Join([]string{ "signature ==> ",sign_8 }, "") )
  var cName *CodeNode = newClassNode.getSecond();
  var friendlyName string = root_20.createSignature(cn_4.vref, sign_8);
  fmt.Println( strings.Join([]string{ "class common name => ",friendlyName }, "") )
  cName.vref = friendlyName; 
  cName.has_vref_annotation = false; 
  fmt.Println( newClassNode.getCode() )
  this.CollectMethods(newClassNode, ctx, wr);
  this.WalkNode(newClassNode, root_20, wr);
  fmt.Println( "the class collected the methods..." )
}
func (this *RangerFlowParser) cmdNew (node *CodeNode, ctx *RangerAppWriterContext, wr *CodeWriter) () {
  if  (int64(len(node.children))) < 3 {
    ctx.addError(node, "the new operator expects three arguments");
    return;
  }
  var obj *CodeNode = node.getSecond();
  var params *CodeNode = node.getThird();
  var currC *GoNullable = new(GoNullable); 
  var b_template bool = false;
  var expects_error_4 bool = false;
  var err_cnt_4 int64 = ctx.getErrorCount();
  if  node.hasBooleanProperty("error") {
    expects_error_4 = true; 
  }
  if  ctx.hasTemplateNode(obj.vref) {
    fmt.Println( " ==> template class" )
    b_template = true; 
    var tpl_4 *CodeNode = ctx.findTemplateNode(obj.vref);
    if  obj.has_vref_annotation {
      fmt.Println( "generic class OK" )
      this.buildGenericClass(tpl_4, node, ctx, wr);
      currC.value = ctx.findClassWithSign(obj);
      currC.has_value = true; /* detected as non-optional */
      if  currC.has_value {
        fmt.Println( strings.Join([]string{ "@@ class was found ",obj.vref }, "") )
      }
    } else {
      ctx.addError(node, "generic class requires a type annotation");
      return;
    }
  }
  this.WalkNode(obj, ctx, wr);
  var i_42 int64 = 0;  
  for ; i_42 < int64(len(params.children)) ; i_42++ {
    arg_9 := params.children[i_42];
    ctx.setInExpr();
    this.WalkNode(arg_9, ctx, wr);
    ctx.unsetInExpr();
  }
  node.eval_type = 8; 
  node.eval_type_name = obj.vref; 
  if  b_template == false {
    currC.value = ctx.findClass(obj.vref);
    currC.has_value = true; /* detected as non-optional */
  }
  node.hasNewOper = true; 
  node.clDesc.value = currC.value;
  node.clDesc.has_value = currC.has_value; 
  var fnDescr *GoNullable = new(GoNullable); 
  fnDescr.value = currC.value.(*RangerAppClassDesc).constructor_fn.value;
  fnDescr.has_value = currC.value.(*RangerAppClassDesc).constructor_fn.has_value;
  if  fnDescr.has_value {
    var i_46 int64 = 0;  
    for ; i_46 < int64(len(fnDescr.value.(*RangerAppFunctionDesc).params)) ; i_46++ {
      param := fnDescr.value.(*RangerAppFunctionDesc).params[i_46];
      var has_default bool = false;
      if  param.Get_nameNode().value.(*CodeNode).hasFlag("default") {
        has_default = true; 
      }
      if  (int64(len(params.children))) <= i_46 {
        if  has_default {
          continue;
        }
        ctx.addError(node, "Argument was not defined");
      }
      var argNode_4 *CodeNode = params.children[i_46];
      if  false == this.areEqualTypes((param.Get_nameNode().value.(*CodeNode)), argNode_4, ctx) {
        ctx.addError(node, strings.Join([]string{ (strings.Join([]string{ "ERROR, invalid argument types for ",currC.value.(*RangerAppClassDesc).name }, ""))," constructor " }, ""));
      }
      var pNode *CodeNode = param.Get_nameNode().value.(*CodeNode);
      if  pNode.hasFlag("optional") {
        if  false == argNode_4.hasFlag("optional") {
          ctx.addError(node, strings.Join([]string{ "new parameter optionality does not match, expected optional parameter",argNode_4.getCode() }, ""));
        }
      }
      if  argNode_4.hasFlag("optional") {
        if  false == pNode.hasFlag("optional") {
          ctx.addError(node, strings.Join([]string{ "new parameter optionality does not match, expected non-optional, optional given",argNode_4.getCode() }, ""));
        }
      }
    }
  }
  if  expects_error_4 {
    var cnt_now_6 int64 = ctx.getErrorCount();
    if  cnt_now_6 == err_cnt_4 {
      ctx.addParserError(node, strings.Join([]string{ (strings.Join([]string{ (strings.Join([]string{ "LANGUAGE_PARSER_ERROR: expected generated error, err counts : ",strconv.FormatInt(err_cnt_4, 10) }, ""))," : " }, "")),strconv.FormatInt(cnt_now_6, 10) }, ""));
    }
  } else {
    var cnt_now_13 int64 = ctx.getErrorCount();
    if  cnt_now_13 > err_cnt_4 {
      ctx.addParserError(node, strings.Join([]string{ (strings.Join([]string{ (strings.Join([]string{ "LANGUAGE_PARSER_ERROR: did not expect generated error, err counts : ",strconv.FormatInt(err_cnt_4, 10) }, ""))," : " }, "")),strconv.FormatInt(cnt_now_13, 10) }, ""));
    }
  }
}
func (this *RangerFlowParser) cmdLocalCall (node *CodeNode, ctx *RangerAppWriterContext, wr *CodeWriter) bool {
  var fnNode *CodeNode = node.getFirst();
  var udesc_6 *GoNullable = new(GoNullable); 
  udesc_6 = ctx.getCurrentClass();
  var desc_6 *RangerAppClassDesc = udesc_6.value.(*RangerAppClassDesc);
  var expects_error_6 bool = false;
  var err_cnt_6 int64 = ctx.getErrorCount();
  if  node.hasBooleanProperty("error") {
    expects_error_6 = true; 
  }
  if  (int64(len(fnNode.ns))) > 1 {
    var vFnDef *GoNullable = new(GoNullable); 
    vFnDef = this.findFunctionDesc(fnNode, ctx, wr);
    if  vFnDef.has_value {
      vFnDef.value.(*RangerAppFunctionDesc).ref_cnt = vFnDef.value.(*RangerAppFunctionDesc).ref_cnt + 1; 
      var subCtx_6 *RangerAppWriterContext = ctx.fork();
      node.hasFnCall = true; 
      node.fnDesc.value = vFnDef.value;
      node.fnDesc.has_value = vFnDef.has_value; 
      var p_8 IFACE_RangerAppParamDesc = CreateNew_RangerAppParamDesc();
      p_8.Set_name(fnNode.vref); 
      p_8.Set_value_type(fnNode.value_type); 
      p_8.Get_node().value = fnNode;
      p_8.Get_node().has_value = true; /* detected as non-optional */
      p_8.Get_nameNode().value = fnNode;
      p_8.Get_nameNode().has_value = true; /* detected as non-optional */
      p_8.Set_varType(10); 
      subCtx_6.defineVariable(p_8.Get_name(), p_8);
      this.WalkNode(fnNode, subCtx_6, wr);
      var callParams *CodeNode = node.children[1];
      var i_46 int64 = 0;  
      for ; i_46 < int64(len(callParams.children)) ; i_46++ {
        arg_11 := callParams.children[i_46];
        ctx.setInExpr();
        this.WalkNode(arg_11, subCtx_6, wr);
        ctx.unsetInExpr();
        var fnArg IFACE_RangerAppParamDesc = vFnDef.value.(*RangerAppFunctionDesc).params[i_46];
        var callArgP *GoNullable = new(GoNullable); 
        callArgP.value = arg_11.paramDesc.value;
        callArgP.has_value = arg_11.paramDesc.has_value;
        if  callArgP.has_value {
          callArgP.value.(IFACE_RangerAppParamDesc).moveRefTo(node, fnArg, ctx);
        }
      }
      var i_54 int64 = 0;  
      for ; i_54 < int64(len(vFnDef.value.(*RangerAppFunctionDesc).params)) ; i_54++ {
        param_4 := vFnDef.value.(*RangerAppFunctionDesc).params[i_54];
        if  (int64(len(callParams.children))) <= i_54 {
          if  param_4.Get_nameNode().value.(*CodeNode).hasFlag("default") {
            continue;
          }
          ctx.addError(node, "Argument was not defined");
          break;
        }
        var argNode_6 *CodeNode = callParams.children[i_54];
        if  false == this.areEqualTypes((param_4.Get_nameNode().value.(*CodeNode)), argNode_6, ctx) {
          ctx.addError(node, strings.Join([]string{ "ERROR, invalid argument types for method ",vFnDef.value.(*RangerAppFunctionDesc).name }, ""));
        }
        var pNode_4 *CodeNode = param_4.Get_nameNode().value.(*CodeNode);
        if  pNode_4.hasFlag("optional") {
          if  false == argNode_6.hasFlag("optional") {
            ctx.addError(node, strings.Join([]string{ "function parameter optionality does not match, consider making parameter optional ",argNode_6.getCode() }, ""));
          }
        }
        if  argNode_6.hasFlag("optional") {
          if  false == pNode_4.hasFlag("optional") {
            ctx.addError(node, strings.Join([]string{ "function parameter optionality does not match, consider unwrapping ",argNode_6.getCode() }, ""));
          }
        }
      }
      var nn_3 *GoNullable = new(GoNullable); 
      nn_3.value = vFnDef.value.(*RangerAppFunctionDesc).nameNode.value;
      nn_3.has_value = vFnDef.value.(*RangerAppFunctionDesc).nameNode.has_value;
      node.eval_type = nn_3.value.(*CodeNode).typeNameAsType(ctx); 
      node.eval_type_name = nn_3.value.(*CodeNode).type_name; 
      if  nn_3.value.(*CodeNode).hasFlag("optional") {
        node.setFlag("optional");
      }
      if  expects_error_6 {
        var cnt_now_10 int64 = ctx.getErrorCount();
        if  cnt_now_10 == err_cnt_6 {
          ctx.addParserError(node, strings.Join([]string{ (strings.Join([]string{ (strings.Join([]string{ "LANGUAGE_PARSER_ERROR: expected generated error, err counts : ",strconv.FormatInt(err_cnt_6, 10) }, ""))," : " }, "")),strconv.FormatInt(cnt_now_10, 10) }, ""));
        }
      } else {
        var cnt_now_21 int64 = ctx.getErrorCount();
        if  cnt_now_21 > err_cnt_6 {
          ctx.addParserError(node, strings.Join([]string{ (strings.Join([]string{ (strings.Join([]string{ "LANGUAGE_PARSER_ERROR: did not expect generated error, err counts : ",strconv.FormatInt(err_cnt_6, 10) }, ""))," : " }, "")),strconv.FormatInt(cnt_now_21, 10) }, ""));
        }
      }
      return true;
    } else {
      ctx.addError(node, "Called Object or Property was not defined");
    }
  }
  if  desc_6.hasMethod(fnNode.vref) {
    var fnDescr_4 *GoNullable = new(GoNullable); 
    fnDescr_4 = desc_6.findMethod(fnNode.vref);
    var subCtx_10 *RangerAppWriterContext = ctx.fork();
    node.hasFnCall = true; 
    node.fnDesc.value = fnDescr_4.value;
    node.fnDesc.has_value = fnDescr_4.has_value; 
    var p_12 IFACE_RangerAppParamDesc = CreateNew_RangerAppParamDesc();
    p_12.Set_name(fnNode.vref); 
    p_12.Set_value_type(fnNode.value_type); 
    p_12.Get_node().value = fnNode;
    p_12.Get_node().has_value = true; /* detected as non-optional */
    p_12.Get_nameNode().value = fnNode;
    p_12.Get_nameNode().has_value = true; /* detected as non-optional */
    p_12.Set_varType(10); 
    subCtx_10.defineVariable(p_12.Get_name(), p_12);
    this.WriteThisVar(fnNode, subCtx_10, wr);
    this.WalkNode(fnNode, subCtx_10, wr);
    var i_53 int64 = 0;  
    for ; i_53 < int64(len(node.children)) ; i_53++ {
      arg_15 := node.children[i_53];
      if  i_53 < 1 {
        continue;
      }
      ctx.setInExpr();
      this.WalkNode(arg_15, subCtx_10, wr);
      ctx.unsetInExpr();
    }
    var i_58 int64 = 0;  
    for ; i_58 < int64(len(fnDescr_4.value.(*RangerAppFunctionDesc).params)) ; i_58++ {
      param_8 := fnDescr_4.value.(*RangerAppFunctionDesc).params[i_58];
      if  (int64(len(node.children))) <= (i_58 + 1) {
        ctx.addError(node, "Argument was not defined");
        break;
      }
      var argNode_10 *CodeNode = node.children[(i_58 + 1)];
      if  false == this.areEqualTypes((param_8.Get_nameNode().value.(*CodeNode)), argNode_10, ctx) {
        ctx.addError(node, strings.Join([]string{ (strings.Join([]string{ (strings.Join([]string{ "ERROR, invalid argument types for ",desc_6.name }, ""))," method " }, "")),fnDescr_4.value.(*RangerAppFunctionDesc).name }, ""));
      }
    }
    var nn_8 *GoNullable = new(GoNullable); 
    nn_8.value = fnDescr_4.value.(*RangerAppFunctionDesc).nameNode.value;
    nn_8.has_value = fnDescr_4.value.(*RangerAppFunctionDesc).nameNode.has_value;
    nn_8.value.(*CodeNode).defineNodeTypeTo(node, ctx);
    if  expects_error_6 {
      var cnt_now_17 int64 = ctx.getErrorCount();
      if  cnt_now_17 == err_cnt_6 {
        ctx.addParserError(node, strings.Join([]string{ (strings.Join([]string{ (strings.Join([]string{ "LANGUAGE_PARSER_ERROR: expected generated error, err counts : ",strconv.FormatInt(err_cnt_6, 10) }, ""))," : " }, "")),strconv.FormatInt(cnt_now_17, 10) }, ""));
      }
    } else {
      var cnt_now_25 int64 = ctx.getErrorCount();
      if  cnt_now_25 > err_cnt_6 {
        ctx.addParserError(node, strings.Join([]string{ (strings.Join([]string{ (strings.Join([]string{ "LANGUAGE_PARSER_ERROR: did not expect generated error, err counts : ",strconv.FormatInt(err_cnt_6, 10) }, ""))," : " }, "")),strconv.FormatInt(cnt_now_25, 10) }, ""));
      }
    }
    return true;
  }
  ctx.addError(node, strings.Join([]string{ (strings.Join([]string{ (strings.Join([]string{ "ERROR, could not find class ",desc_6.name }, ""))," method " }, "")),fnNode.vref }, ""));
  ctx.addError(node, strings.Join([]string{ "definition : ",node.getCode() }, ""));
  if  expects_error_6 {
    var cnt_now_23 int64 = ctx.getErrorCount();
    if  cnt_now_23 == err_cnt_6 {
      ctx.addParserError(node, strings.Join([]string{ (strings.Join([]string{ (strings.Join([]string{ "LANGUAGE_PARSER_ERROR: expected generated error, err counts : ",strconv.FormatInt(err_cnt_6, 10) }, ""))," : " }, "")),strconv.FormatInt(cnt_now_23, 10) }, ""));
    }
  } else {
    var cnt_now_29 int64 = ctx.getErrorCount();
    if  cnt_now_29 > err_cnt_6 {
      ctx.addParserError(node, strings.Join([]string{ (strings.Join([]string{ (strings.Join([]string{ "LANGUAGE_PARSER_ERROR: did not expect generated error, err counts : ",strconv.FormatInt(err_cnt_6, 10) }, ""))," : " }, "")),strconv.FormatInt(cnt_now_29, 10) }, ""));
    }
  }
  return false;
}
func (this *RangerFlowParser) cmdReturn (node *CodeNode, ctx *RangerAppWriterContext, wr *CodeWriter) () {
  node.has_operator = true; 
  node.op_index = 5; 
  fmt.Println( "cmdReturn" )
  if  (int64(len(node.children))) > 1 {
    var fc_18 *CodeNode = node.getSecond();
    if  fc_18.vref == "_" {
    } else {
      ctx.setInExpr();
      this.WalkNode(fc_18, ctx, wr);
      ctx.unsetInExpr();
      /** unused:  activeFn_6*/
      if  fc_18.hasParamDesc {
        fc_18.paramDesc.value.(IFACE_RangerAppParamDesc).Set_return_cnt(1 + fc_18.paramDesc.value.(IFACE_RangerAppParamDesc).Get_return_cnt()); 
        fc_18.paramDesc.value.(IFACE_RangerAppParamDesc).Set_ref_cnt(1 + fc_18.paramDesc.value.(IFACE_RangerAppParamDesc).Get_ref_cnt()); 
      }
      var currFn *RangerAppFunctionDesc = ctx.getCurrentMethod();
      if  fc_18.hasParamDesc {
        fmt.Println( "cmdReturn move-->" )
        var pp_6 *GoNullable = new(GoNullable); 
        pp_6.value = fc_18.paramDesc.value;
        pp_6.has_value = fc_18.paramDesc.has_value;
        pp_6.value.(IFACE_RangerAppParamDesc).moveRefTo(node, currFn, ctx);
      } else {
        fmt.Println( "cmdReturn had no param desc" )
      }
    }
  }
}
func (this *RangerFlowParser) cmdAssign (node *CodeNode, ctx *RangerAppWriterContext, wr *CodeWriter) () {
  wr.newline();
  var n1 *CodeNode = node.getSecond();
  var n2 *CodeNode = node.getThird();
  this.WalkNode(n1, ctx, wr);
  ctx.setInExpr();
  this.WalkNode(n2, ctx, wr);
  ctx.unsetInExpr();
  if  n1.hasParamDesc {
    n1.paramDesc.value.(IFACE_RangerAppParamDesc).Set_ref_cnt(n1.paramDesc.value.(IFACE_RangerAppParamDesc).Get_ref_cnt() + 1); 
    n1.paramDesc.value.(IFACE_RangerAppParamDesc).Set_set_cnt(n1.paramDesc.value.(IFACE_RangerAppParamDesc).Get_set_cnt() + 1); 
  }
  if  n2.hasParamDesc {
    n2.paramDesc.value.(IFACE_RangerAppParamDesc).Set_ref_cnt(n2.paramDesc.value.(IFACE_RangerAppParamDesc).Get_ref_cnt() + 1); 
  }
  if  n2.hasFlag("optional") {
    if  false == n1.hasFlag("optional") {
      ctx.addError(node, "Can not assign optional to non-optional type");
    }
  }
  this.stdParamMatch(node, ctx, wr);
}
func (this *RangerFlowParser) EnterTemplateClass (node *CodeNode, ctx *RangerAppWriterContext, wr *CodeWriter) () {
}
func (this *RangerFlowParser) EnterClass (node *CodeNode, ctx *RangerAppWriterContext, wr *CodeWriter) () {
  if  (int64(len(node.children))) != 3 {
    ctx.addError(node, "Invalid class declaration");
    return;
  }
  var cn_6 *CodeNode = node.children[1];
  var cBody *CodeNode = node.children[2];
  var desc_8 *RangerAppClassDesc = ctx.findClass(cn_6.vref);
  if  cn_6.has_vref_annotation {
    fmt.Println( "--> generic class, not processed" )
    return;
  }
  var subCtx_10 *RangerAppWriterContext = desc_8.ctx.value.(*RangerAppWriterContext);
  subCtx_10.setCurrentClass(desc_8);
  var i_54 int64 = 0;  
  for ; i_54 < int64(len(desc_8.variables)) ; i_54++ {
    p_12 := desc_8.variables[i_54];
    var vNode *GoNullable = new(GoNullable); 
    vNode.value = p_12.Get_node().value;
    vNode.has_value = p_12.Get_node().has_value;
    if  (int64(len(vNode.value.(*CodeNode).children))) > 2 {
      var value *CodeNode = vNode.value.(*CodeNode).children[2];
      ctx.setInExpr();
      this.WalkNode(value, ctx, wr);
      ctx.unsetInExpr();
    }
    p_12.Set_is_class_variable(true); 
    p_12.Get_nameNode().value.(*CodeNode).eval_type = p_12.Get_nameNode().value.(*CodeNode).typeNameAsType(ctx); 
    p_12.Get_nameNode().value.(*CodeNode).eval_type_name = p_12.Get_nameNode().value.(*CodeNode).type_name; 
  }
  var i_58 int64 = 0;  
  for ; i_58 < int64(len(cBody.children)) ; i_58++ {
    fNode := cBody.children[i_58];
    if  fNode.isFirstVref("fn") || fNode.isFirstVref("Constructor") {
      this.WalkNode(fNode, subCtx_10, wr);
    }
  }
  var i_61 int64 = 0;  
  for ; i_61 < int64(len(cBody.children)) ; i_61++ {
    fNode_6 := cBody.children[i_61];
    if  fNode_6.isFirstVref("fn") || fNode_6.isFirstVref("PublicMethod") {
      this.WalkNode(fNode_6, subCtx_10, wr);
    }
  }
  var staticCtx *RangerAppWriterContext = ctx.fork();
  staticCtx.setCurrentClass(desc_8);
  var i_64 int64 = 0;  
  for ; i_64 < int64(len(cBody.children)) ; i_64++ {
    fNode_9 := cBody.children[i_64];
    if  fNode_9.isFirstVref("sfn") || fNode_9.isFirstVref("StaticMethod") {
      this.WalkNode(fNode_9, staticCtx, wr);
    }
  }
  node.hasClassDescription = true; 
  node.clDesc.value = desc_8;
  node.clDesc.has_value = true; /* detected as non-optional */
  desc_8.classNode.value = node;
  desc_8.classNode.has_value = true; /* detected as non-optional */
}
func (this *RangerFlowParser) EnterMethod (node *CodeNode, ctx *RangerAppWriterContext, wr *CodeWriter) () {
  this.shouldHaveChildCnt(4, node, ctx, "Method expexts four arguments");
  var cn_8 *CodeNode = node.children[1];
  var fnBody_4 *CodeNode = node.children[3];
  var udesc_8 *GoNullable = new(GoNullable); 
  udesc_8 = ctx.getCurrentClass();
  var desc_10 *RangerAppClassDesc = udesc_8.value.(*RangerAppClassDesc);
  var um *GoNullable = new(GoNullable); 
  um = desc_10.findMethod(cn_8.vref);
  var m_8 *RangerAppFunctionDesc = um.value.(*RangerAppFunctionDesc);
  var subCtx_12 *RangerAppWriterContext = m_8.fnCtx.value.(*RangerAppWriterContext);
  subCtx_12.currentMethod.value = m_8;
  subCtx_12.currentMethod.has_value = true; /* detected as non-optional */
  var i_62 int64 = 0;  
  for ; i_62 < int64(len(m_8.params)) ; i_62++ {
    v_4 := m_8.params[i_62];
    v_4.Get_nameNode().value.(*CodeNode).eval_type = v_4.Get_nameNode().value.(*CodeNode).typeNameAsType(subCtx_12); 
    v_4.Get_nameNode().value.(*CodeNode).eval_type_name = v_4.Get_nameNode().value.(*CodeNode).type_name; 
  }
  subCtx_12.setInMethod();
  this.WalkNodeChildren(fnBody_4, subCtx_12, wr);
  subCtx_12.unsetInMethod();
  if  fnBody_4.didReturnAtIndex == -1 {
    if  cn_8.type_name != "void" {
      ctx.addError(node, "Function does not return any values!");
    }
  }
  var i_66 int64 = 0;  
  for ; i_66 < int64(len(subCtx_12.localVarNames)) ; i_66++ {
    n_7 := subCtx_12.localVarNames[i_66];
    var p_14 *GoNullable = new(GoNullable); 
    p_14 = r_get_string_IFACE_RangerAppParamDesc(subCtx_12.localVariables, n_7);
    if  p_14.value.(IFACE_RangerAppParamDesc).Get_set_cnt() > 0 {
      var defNode_4 *GoNullable = new(GoNullable); 
      defNode_4.value = p_14.value.(IFACE_RangerAppParamDesc).Get_node().value;
      defNode_4.has_value = p_14.value.(IFACE_RangerAppParamDesc).Get_node().has_value;
      defNode_4.value.(*CodeNode).setFlag("mutable");
      var nNode_4 *GoNullable = new(GoNullable); 
      nNode_4.value = p_14.value.(IFACE_RangerAppParamDesc).Get_nameNode().value;
      nNode_4.has_value = p_14.value.(IFACE_RangerAppParamDesc).Get_nameNode().has_value;
      nNode_4.value.(*CodeNode).setFlag("mutable");
    }
  }
}
func (this *RangerFlowParser) EnterStaticMethod (node *CodeNode, ctx *RangerAppWriterContext, wr *CodeWriter) () {
  this.shouldHaveChildCnt(4, node, ctx, "Method expexts four arguments");
  var cn_10 *CodeNode = node.children[1];
  var fnBody_6 *CodeNode = node.children[3];
  var udesc_10 *GoNullable = new(GoNullable); 
  udesc_10 = ctx.getCurrentClass();
  var desc_12 *RangerAppClassDesc = udesc_10.value.(*RangerAppClassDesc);
  var subCtx_14 *RangerAppWriterContext = ctx.fork();
  subCtx_14.is_function = true; 
  var um_4 *GoNullable = new(GoNullable); 
  um_4 = desc_12.findStaticMethod(cn_10.vref);
  var m_10 *RangerAppFunctionDesc = um_4.value.(*RangerAppFunctionDesc);
  subCtx_14.currentMethod.value = m_10;
  subCtx_14.currentMethod.has_value = true; /* detected as non-optional */
  subCtx_14.in_static_method = true; 
  m_10.fnCtx.value = subCtx_14;
  m_10.fnCtx.has_value = true; /* detected as non-optional */
  if  cn_10.hasFlag("weak") {
    m_10.changeStrength(0, 1, node);
  } else {
    m_10.changeStrength(1, 1, node);
  }
  subCtx_14.setInMethod();
  var i_66 int64 = 0;  
  for ; i_66 < int64(len(m_10.params)) ; i_66++ {
    v_6 := m_10.params[i_66];
    subCtx_14.defineVariable(v_6.Get_name(), v_6);
    v_6.Get_nameNode().value.(*CodeNode).eval_type = v_6.Get_nameNode().value.(*CodeNode).typeNameAsType(ctx); 
    v_6.Get_nameNode().value.(*CodeNode).eval_type_name = v_6.Get_nameNode().value.(*CodeNode).type_name; 
  }
  this.WalkNodeChildren(fnBody_6, subCtx_14, wr);
  subCtx_14.unsetInMethod();
  subCtx_14.in_static_method = false; 
  if  fnBody_6.didReturnAtIndex == -1 {
    if  cn_10.type_name != "void" {
      ctx.addError(node, "Function does not return any values!");
    }
  }
  var i_70 int64 = 0;  
  for ; i_70 < int64(len(subCtx_14.localVarNames)) ; i_70++ {
    n_9 := subCtx_14.localVarNames[i_70];
    var p_16 *GoNullable = new(GoNullable); 
    p_16 = r_get_string_IFACE_RangerAppParamDesc(subCtx_14.localVariables, n_9);
    if  p_16.value.(IFACE_RangerAppParamDesc).Get_set_cnt() > 0 {
      var defNode_6 *GoNullable = new(GoNullable); 
      defNode_6.value = p_16.value.(IFACE_RangerAppParamDesc).Get_node().value;
      defNode_6.has_value = p_16.value.(IFACE_RangerAppParamDesc).Get_node().has_value;
      defNode_6.value.(*CodeNode).setFlag("mutable");
      var nNode_6 *GoNullable = new(GoNullable); 
      nNode_6.value = p_16.value.(IFACE_RangerAppParamDesc).Get_nameNode().value;
      nNode_6.has_value = p_16.value.(IFACE_RangerAppParamDesc).Get_nameNode().has_value;
      nNode_6.value.(*CodeNode).setFlag("mutable");
    }
  }
}
func (this *RangerFlowParser) EnterLambdaMethod (node *CodeNode, ctx *RangerAppWriterContext, wr *CodeWriter) () {
  fmt.Println( "--> found a lambda method" )
  node.eval_type = 16; 
  var args_4 *CodeNode = node.children[2];
  var body *CodeNode = node.children[3];
  var subCtx_16 *RangerAppWriterContext = ctx.fork();
  var i_70 int64 = 0;  
  for ; i_70 < int64(len(args_4.children)) ; i_70++ {
    arg_15 := args_4.children[i_70];
    var v_8 IFACE_RangerAppParamDesc = CreateNew_RangerAppParamDesc();
    v_8.Set_name(arg_15.vref); 
    v_8.Get_node().value = arg_15;
    v_8.Get_node().has_value = true; /* detected as non-optional */
    v_8.Get_nameNode().value = arg_15;
    v_8.Get_nameNode().has_value = true; /* detected as non-optional */
    subCtx_16.defineVariable(v_8.Get_name(), v_8);
  }
  var i_74 int64 = 0;  
  for ; i_74 < int64(len(body.children)) ; i_74++ {
    item_5 := body.children[i_74];
    this.WalkNode(item_5, subCtx_16, wr);
  }
  fmt.Println( "--> EXITLAMBDA" )
}
func (this *RangerFlowParser) EnterVarDef (node *CodeNode, ctx *RangerAppWriterContext, wr *CodeWriter) () {
  if  ctx.isInMethod() {
    if  (int64(len(node.children))) > 3 {
      ctx.addError(node, "invalid variable definition");
      return;
    }
    if  (int64(len(node.children))) < 2 {
      ctx.addError(node, "invalid variable definition");
      return;
    }
    var cn_12 *CodeNode = node.children[1];
    var p_18 IFACE_RangerAppParamDesc = CreateNew_RangerAppParamDesc();
    var defaultArg *GoNullable = new(GoNullable); 
    if  (int64(len(node.children))) == 2 {
      if  (cn_12.value_type != 6) && (cn_12.value_type != 7) {
        cn_12.setFlag("optional");
      }
    }
    ctx.hadValidType(cn_12);
    cn_12.defineNodeTypeTo(cn_12, ctx);
    if  (int64(len(cn_12.vref))) == 0 {
      ctx.addError(node, "invalid variable definition");
    }
    if  cn_12.hasFlag("weak") {
      p_18.changeStrength(0, 1, node);
    } else {
      p_18.changeStrength(1, 1, node);
    }
    node.hasVarDef = true; 
    if  (int64(len(node.children))) > 2 {
      p_18.Set_init_cnt(1); 
      p_18.Get_def_value().value = node.children[2];
      p_18.Get_def_value().has_value = true; /* detected as non-optional */
      p_18.Set_is_optional(false); 
      defaultArg.value = node.children[2];
      defaultArg.has_value = true; /* detected as non-optional */
      ctx.setInExpr();
      this.WalkNode(defaultArg.value.(*CodeNode), ctx, wr);
      ctx.unsetInExpr();
      if  defaultArg.value.(*CodeNode).hasFlag("optional") {
        cn_12.setFlag("optional");
      }
      if  defaultArg.value.(*CodeNode).eval_type == 6 {
        node.op_index = 1; 
      }
      if  cn_12.value_type == 11 {
        cn_12.eval_type_name = defaultArg.value.(*CodeNode).ns[0]; 
      }
      if  cn_12.value_type == 12 {
        if  (defaultArg.value.(*CodeNode).eval_type != 3) && (defaultArg.value.(*CodeNode).eval_type != 12) {
          ctx.addError(defaultArg.value.(*CodeNode), strings.Join([]string{ "Char should be assigned char or integer value --> ",defaultArg.value.(*CodeNode).getCode() }, ""));
        } else {
          defaultArg.value.(*CodeNode).eval_type = 12; 
        }
      }
    } else {
      if  ((cn_12.value_type != 7) && (cn_12.value_type != 6)) && (false == cn_12.hasFlag("optional")) {
        cn_12.setFlag("optional");
      }
    }
    p_18.Set_name(cn_12.vref); 
    if  p_18.Get_value_type() == 0 {
      if  (0 == (int64(len(cn_12.type_name)))) && (defaultArg.has_value) {
        p_18.Set_value_type(defaultArg.value.(*CodeNode).eval_type); 
        cn_12.type_name = defaultArg.value.(*CodeNode).eval_type_name; 
        cn_12.eval_type_name = defaultArg.value.(*CodeNode).eval_type_name; 
        cn_12.value_type = defaultArg.value.(*CodeNode).eval_type; 
      }
    } else {
      p_18.Set_value_type(cn_12.value_type); 
    }
    p_18.Get_node().value = node;
    p_18.Get_node().has_value = true; /* detected as non-optional */
    p_18.Get_nameNode().value = cn_12;
    p_18.Get_nameNode().has_value = true; /* detected as non-optional */
    p_18.Set_varType(5); 
    if  cn_12.has_vref_annotation {
      ctx.log(node, "ann", "At a variable -> Found has_vref_annotation annotated reference ");
      var ann_17 *GoNullable = new(GoNullable); 
      ann_17.value = cn_12.vref_annotation.value;
      ann_17.has_value = cn_12.vref_annotation.has_value;
      if  (int64(len(ann_17.value.(*CodeNode).children))) > 0 {
        var fc_20 *CodeNode = ann_17.value.(*CodeNode).children[0];
        ctx.log(node, "ann", strings.Join([]string{ (strings.Join([]string{ (strings.Join([]string{ "value of first annotation ",fc_20.vref }, ""))," and variable name " }, "")),cn_12.vref }, ""));
      }
    }
    if  cn_12.has_type_annotation {
      ctx.log(node, "ann", "At a variable -> Found annotated reference ");
      var ann_23 *GoNullable = new(GoNullable); 
      ann_23.value = cn_12.type_annotation.value;
      ann_23.has_value = cn_12.type_annotation.has_value;
      if  (int64(len(ann_23.value.(*CodeNode).children))) > 0 {
        var fc_26 *CodeNode = ann_23.value.(*CodeNode).children[0];
        ctx.log(node, "ann", strings.Join([]string{ (strings.Join([]string{ (strings.Join([]string{ "value of first annotation ",fc_26.vref }, ""))," and variable name " }, "")),cn_12.vref }, ""));
      }
    }
    cn_12.hasParamDesc = true; 
    cn_12.ownParamDesc.value = p_18;
    cn_12.ownParamDesc.has_value = true; /* detected as non-optional */
    cn_12.paramDesc.value = p_18;
    cn_12.paramDesc.has_value = true; /* detected as non-optional */
    node.hasParamDesc = true; 
    node.paramDesc.value = p_18;
    node.paramDesc.has_value = true; /* detected as non-optional */
    cn_12.eval_type = cn_12.typeNameAsType(ctx); 
    cn_12.eval_type_name = cn_12.type_name; 
    if  (int64(len(node.children))) > 2 {
      if  cn_12.eval_type != defaultArg.value.(*CodeNode).eval_type {
        ctx.addError(node, strings.Join([]string{ (strings.Join([]string{ (strings.Join([]string{ "Variable was assigned an incompatible type. Types were ",strconv.FormatInt(cn_12.eval_type, 10) }, ""))," vs " }, "")),strconv.FormatInt(defaultArg.value.(*CodeNode).eval_type, 10) }, ""));
      }
    } else {
      p_18.Set_is_optional(true); 
    }
    ctx.defineVariable(p_18.Get_name(), p_18);
    this.DefineVar(node, ctx, wr);
    if  (int64(len(node.children))) > 2 {
      this.shouldBeEqualTypes(cn_12, p_18.Get_def_value().value.(*CodeNode), ctx, "Variable was assigned an incompatible type.");
    }
  } else {
    var cn_19 *CodeNode = node.children[1];
    cn_19.eval_type = cn_19.typeNameAsType(ctx); 
    cn_19.eval_type_name = cn_19.type_name; 
    this.DefineVar(node, ctx, wr);
    if  (int64(len(node.children))) > 2 {
      this.shouldBeEqualTypes(node.children[1], node.children[2], ctx, "Variable was assigned an incompatible type.");
    }
  }
}
func (this *RangerFlowParser) WalkNodeChildren (node *CodeNode, ctx *RangerAppWriterContext, wr *CodeWriter) () {
  if  node.hasStringProperty("todo") {
    ctx.addTodo(node, node.getStringProperty("todo"));
  }
  if  node.expression {
    var i_74 int64 = 0;  
    for ; i_74 < int64(len(node.children)) ; i_74++ {
      item_7 := node.children[i_74];
      item_7.parent.value = node;
      item_7.parent.has_value = true; /* detected as non-optional */
      this.WalkNode(item_7, ctx, wr);
      node.copyEvalResFrom(item_7);
    }
  }
}
func (this *RangerFlowParser) matchNode (node *CodeNode, ctx *RangerAppWriterContext, wr *CodeWriter) bool {
  if  0 == (int64(len(node.children))) {
    return false;
  }
  var fc_24 *CodeNode = node.getFirst();
  this.stdCommands.value = ctx.getStdCommands();
  this.stdCommands.has_value = true; /* detected as non-optional */
  var i_76 int64 = 0;  
  for ; i_76 < int64(len(this.stdCommands.value.(*CodeNode).children)) ; i_76++ {
    cmd := this.stdCommands.value.(*CodeNode).children[i_76];
    var cmdName *CodeNode = cmd.getFirst();
    if  cmdName.vref == fc_24.vref {
      this.stdParamMatch(node, ctx, wr);
      if  node.parent.has_value {
        node.parent.value.(*CodeNode).copyEvalResFrom(node);
      }
      return true;
    }
  }
  return false;
}
func (this *RangerFlowParser) WalkNode (node *CodeNode, ctx *RangerAppWriterContext, wr *CodeWriter) bool {
  /** unused:  line_index_4*/
  if  node.flow_done {
    return true;
  }
  node.flow_done = true; 
  if  node.hasStringProperty("todo") {
    ctx.addTodo(node, node.getStringProperty("todo"));
  }
  if  node.isPrimitive() {
    if  ctx.expressionLevel() == 0 {
      ctx.addError(node, "Primitive element at top level!");
    }
    this.WriteScalarValue(node, ctx, wr);
    return true;
  }
  if  node.value_type == 9 {
    this.WriteVRef(node, ctx, wr);
    return true;
  }
  if  node.value_type == 10 {
    this.WriteComment(node, ctx, wr);
    return true;
  }
  if  node.isFirstVref("lambda") {
    this.EnterLambdaMethod(node, ctx, wr);
    return true;
  }
  if  node.isFirstVref("Extends") {
    return true;
  }
  if  node.isFirstVref("operators") {
    return true;
  }
  if  node.isFirstVref("systemclass") {
    return true;
  }
  if  node.isFirstVref("Import") {
    this.cmdImport(node, ctx, wr);
    return true;
  }
  if  node.isFirstVref("def") {
    this.EnterVarDef(node, ctx, wr);
    return true;
  }
  if  node.isFirstVref("let") {
    this.EnterVarDef(node, ctx, wr);
    return true;
  }
  if  node.isFirstVref("TemplateClass") {
    this.EnterTemplateClass(node, ctx, wr);
    return true;
  }
  if  node.isFirstVref("CreateClass") {
    this.EnterClass(node, ctx, wr);
    return true;
  }
  if  node.isFirstVref("class") {
    this.EnterClass(node, ctx, wr);
    return true;
  }
  if  node.isFirstVref("PublicMethod") {
    this.EnterMethod(node, ctx, wr);
    return true;
  }
  if  node.isFirstVref("StaticMethod") {
    this.EnterStaticMethod(node, ctx, wr);
    return true;
  }
  if  node.isFirstVref("fn") {
    this.EnterMethod(node, ctx, wr);
    return true;
  }
  if  node.isFirstVref("sfn") {
    this.EnterStaticMethod(node, ctx, wr);
    return true;
  }
  if  node.isFirstVref("=") {
    this.cmdAssign(node, ctx, wr);
    return true;
  }
  if  node.isFirstVref("Constructor") {
    this.Constructor(node, ctx, wr);
    return true;
  }
  if  node.isFirstVref("new") {
    this.cmdNew(node, ctx, wr);
    return true;
  }
  if  this.matchNode(node, ctx, wr) {
    return true;
  }
  if  (int64(len(node.children))) > 0 {
    var fc_26 *CodeNode = node.children[0];
    if  fc_26.value_type == 9 {
      var was_called bool = true;
      switch (fc_26.vref ) { 
        case "Enum" : 
          this.cmdEnum(node, ctx, wr);
        default: 
          was_called = false; 
      }
      if  was_called {
        return true;
      }
      if  (int64(len(node.children))) > 1 {
        if  this.cmdLocalCall(node, ctx, wr) {
          return true;
        }
      }
    }
  }
  if  node.expression {
    var i_78 int64 = 0;  
    for ; i_78 < int64(len(node.children)) ; i_78++ {
      item_9 := node.children[i_78];
      item_9.parent.value = node;
      item_9.parent.has_value = true; /* detected as non-optional */
      this.WalkNode(item_9, ctx, wr);
      node.copyEvalResFrom(item_9);
    }
    return true;
  }
  ctx.addError(node, "Could not understand this part");
  return true;
}
func (this *RangerFlowParser) mergeImports (node *CodeNode, ctx *RangerAppWriterContext, wr *CodeWriter) () {
  if  node.isFirstVref("Import") {
    var fNameNode_4 *CodeNode = node.children[1];
    var import_file string = fNameNode_4.string_value;
    if  r_has_key_string_bool(ctx.already_imported, import_file) {
      return;
    }
    ctx.already_imported[import_file] = true
    var c_6 *GoNullable = new(GoNullable); 
    c_6 = r_io_read_file(".", import_file);
    var code *SourceCode = CreateNew_SourceCode(c_6.value.(string));
    code.filename = import_file; 
    var parser *RangerLispParser = CreateNew_RangerLispParser(code);
    parser.parse();
    node.expression = true; 
    node.vref = ""; 
    node.children = node.children[:len(node.children)-1]; 
    node.children = node.children[:len(node.children)-1]; 
    var rn_2 *CodeNode = parser.rootNode.value.(*CodeNode);
    this.mergeImports(rn_2, ctx, wr);
    node.children = append(node.children,rn_2); 
  } else {
    var i_80 int64 = 0;  
    for ; i_80 < int64(len(node.children)) ; i_80++ {
      item_11 := node.children[i_80];
      this.mergeImports(item_11, ctx, wr);
    }
  }
}
func (this *RangerFlowParser) CollectMethods (node *CodeNode, ctx *RangerAppWriterContext, wr *CodeWriter) () {
  var find_more bool = true;
  if  node.isFirstVref("systemclass") {
    fmt.Println( "---------- found systemclass ------ " )
    var nameNode_4 *CodeNode = node.getSecond();
    var instances *CodeNode = node.getThird();
    var new_class *RangerAppClassDesc = CreateNew_RangerAppClassDesc();
    new_class.name = nameNode_4.vref; 
    new_class.nameNode.value = nameNode_4;
    new_class.nameNode.has_value = true; /* detected as non-optional */
    ctx.addClass(nameNode_4.vref, new_class);
    new_class.is_system = true; 
    var i_82 int64 = 0;  
    for ; i_82 < int64(len(instances.children)) ; i_82++ {
      ch_7 := instances.children[i_82];
      var langName_4 *CodeNode = ch_7.getFirst();
      var langClassName *CodeNode = ch_7.getSecond();
      new_class.systemNames[langName_4.vref] = langClassName.vref
    }
    nameNode_4.is_system_class = true; 
    nameNode_4.clDesc.value = new_class;
    nameNode_4.clDesc.has_value = true; /* detected as non-optional */
    return;
  }
  if  node.isFirstVref("Extends") {
    var extList *CodeNode = node.children[1];
    var currC_4 *GoNullable = new(GoNullable); 
    currC_4.value = ctx.currentClass.value;
    currC_4.has_value = ctx.currentClass.has_value;
    var ii_7 int64 = 0;  
    for ; ii_7 < int64(len(extList.children)) ; ii_7++ {
      ee_4 := extList.children[ii_7];
      currC_4.value.(*RangerAppClassDesc).addParentClass(ee_4.vref);
      var ParentClass *RangerAppClassDesc = ctx.findClass(ee_4.vref);
      ParentClass.is_inherited = true; 
    }
  }
  if  node.isFirstVref("Constructor") {
    var currC_8 *GoNullable = new(GoNullable); 
    currC_8.value = ctx.currentClass.value;
    currC_8.has_value = ctx.currentClass.has_value;
    var subCtx_18 *RangerAppWriterContext = currC_8.value.(*RangerAppClassDesc).ctx.value.(*RangerAppWriterContext).fork();
    currC_8.value.(*RangerAppClassDesc).has_constructor = true; 
    currC_8.value.(*RangerAppClassDesc).constructor_node.value = node;
    currC_8.value.(*RangerAppClassDesc).constructor_node.has_value = true; /* detected as non-optional */
    var m_12 *RangerAppFunctionDesc = CreateNew_RangerAppFunctionDesc();
    m_12.name = "Constructor"; 
    m_12.node.value = node;
    m_12.node.has_value = true; /* detected as non-optional */
    m_12.nameNode.value = node.children[0];
    m_12.nameNode.has_value = true; /* detected as non-optional */
    m_12.fnBody.value = node.children[2];
    m_12.fnBody.has_value = true; /* detected as non-optional */
    m_12.fnCtx.value = subCtx_18;
    m_12.fnCtx.has_value = true; /* detected as non-optional */
    var args_6 *CodeNode = node.children[1];
    var ii_12 int64 = 0;  
    for ; ii_12 < int64(len(args_6.children)) ; ii_12++ {
      arg_17 := args_6.children[ii_12];
      var p_20 IFACE_RangerAppParamDesc = CreateNew_RangerAppParamDesc();
      p_20.Set_name(arg_17.vref); 
      p_20.Set_value_type(arg_17.value_type); 
      p_20.Get_node().value = arg_17;
      p_20.Get_node().has_value = true; /* detected as non-optional */
      p_20.Get_nameNode().value = arg_17;
      p_20.Get_nameNode().has_value = true; /* detected as non-optional */
      p_20.Set_refType(1); 
      p_20.Set_varType(4); 
      m_12.params = append(m_12.params,p_20); 
      arg_17.hasParamDesc = true; 
      arg_17.paramDesc.value = p_20;
      arg_17.paramDesc.has_value = true; /* detected as non-optional */
      arg_17.eval_type = arg_17.value_type; 
      arg_17.eval_type_name = arg_17.type_name; 
      subCtx_18.defineVariable(p_20.Get_name(), p_20);
    }
    currC_8.value.(*RangerAppClassDesc).constructor_fn.value = m_12;
    currC_8.value.(*RangerAppClassDesc).constructor_fn.has_value = true; /* detected as non-optional */
    find_more = false; 
  }
  if  node.isFirstVref("CreateClass") || node.isFirstVref("class") {
    var s_13 string = node.getVRefAt(1);
    var classNameNode *CodeNode = node.getSecond();
    if  classNameNode.has_vref_annotation {
      fmt.Println( "%% vref_annotation" )
      var ann_21 *GoNullable = new(GoNullable); 
      ann_21.value = classNameNode.vref_annotation.value;
      ann_21.has_value = classNameNode.vref_annotation.has_value;
      fmt.Println( strings.Join([]string{ (strings.Join([]string{ classNameNode.vref," : " }, "")),ann_21.value.(*CodeNode).getCode() }, "") )
      ctx.addTemplateClass(classNameNode.vref, node);
      find_more = false; 
    } else {
      var new_class_6 *RangerAppClassDesc = CreateNew_RangerAppClassDesc();
      new_class_6.name = s_13; 
      var subCtx_22 *RangerAppWriterContext = ctx.fork();
      ctx.setCurrentClass(new_class_6);
      subCtx_22.setCurrentClass(new_class_6);
      new_class_6.ctx.value = subCtx_22;
      new_class_6.ctx.has_value = true; /* detected as non-optional */
      new_class_6.nameNode.value = classNameNode;
      new_class_6.nameNode.has_value = true; /* detected as non-optional */
      ctx.addClass(s_13, new_class_6);
      new_class_6.classNode.value = node;
      new_class_6.classNode.has_value = true; /* detected as non-optional */
    }
  }
  if  node.isFirstVref("TemplateClass") {
    var s_18 string = node.getVRefAt(1);
    ctx.addTemplateClass(s_18, node);
    find_more = false; 
  }
  if  node.isFirstVref("Extends") {
    var list_2 *CodeNode = node.children[1];
    var i_86 int64 = 0;  
    for ; i_86 < int64(len(list_2.children)) ; i_86++ {
      cname_5 := list_2.children[i_86];
      var extC *RangerAppClassDesc = ctx.findClass(cname_5.vref);
      var i_95 int64 = 0;  
      for ; i_95 < int64(len(extC.variables)) ; i_95++ {
        vv := extC.variables[i_95];
        var currC_11 *GoNullable = new(GoNullable); 
        currC_11.value = ctx.currentClass.value;
        currC_11.has_value = ctx.currentClass.has_value;
        var subCtx_25 *GoNullable = new(GoNullable); 
        subCtx_25.value = currC_11.value.(*RangerAppClassDesc).ctx.value;
        subCtx_25.has_value = currC_11.value.(*RangerAppClassDesc).ctx.has_value;
        subCtx_25.value.(*RangerAppWriterContext).defineVariable(vv.Get_name(), vv);
      }
    }
    find_more = false; 
  }
  if  node.isFirstVref("def") || node.isFirstVref("let") {
    var s_21 string = node.getVRefAt(1);
    var vDef_5 *CodeNode = node.children[1];
    var p_24 IFACE_RangerAppParamDesc = CreateNew_RangerAppParamDesc();
    p_24.Set_name(s_21); 
    p_24.Set_value_type(vDef_5.value_type); 
    p_24.Get_node().value = node;
    p_24.Get_node().has_value = true; /* detected as non-optional */
    p_24.Set_is_class_variable(true); 
    p_24.Set_varType(8); 
    p_24.Get_node().value = node;
    p_24.Get_node().has_value = true; /* detected as non-optional */
    p_24.Get_nameNode().value = vDef_5;
    p_24.Get_nameNode().has_value = true; /* detected as non-optional */
    vDef_5.hasParamDesc = true; 
    vDef_5.ownParamDesc.value = p_24;
    vDef_5.ownParamDesc.has_value = true; /* detected as non-optional */
    vDef_5.paramDesc.value = p_24;
    vDef_5.paramDesc.has_value = true; /* detected as non-optional */
    node.hasParamDesc = true; 
    node.paramDesc.value = p_24;
    node.paramDesc.has_value = true; /* detected as non-optional */
    if  vDef_5.hasFlag("weak") {
      p_24.changeStrength(0, 2, p_24.Get_nameNode().value.(*CodeNode));
    } else {
      p_24.changeStrength(2, 2, p_24.Get_nameNode().value.(*CodeNode));
    }
    if  (int64(len(node.children))) > 2 {
      p_24.Set_set_cnt(1); 
      p_24.Get_def_value().value = node.children[2];
      p_24.Get_def_value().has_value = true; /* detected as non-optional */
      p_24.Set_is_optional(false); 
    } else {
      p_24.Set_is_optional(true); 
      if  false == ((vDef_5.value_type == 6) || (vDef_5.value_type == 7)) {
        vDef_5.setFlag("optional");
      }
    }
    var currC_14 *GoNullable = new(GoNullable); 
    currC_14.value = ctx.currentClass.value;
    currC_14.has_value = ctx.currentClass.has_value;
    currC_14.value.(*RangerAppClassDesc).addVariable(p_24);
    var subCtx_28 *GoNullable = new(GoNullable); 
    subCtx_28.value = currC_14.value.(*RangerAppClassDesc).ctx.value;
    subCtx_28.has_value = currC_14.value.(*RangerAppClassDesc).ctx.has_value;
    subCtx_28.value.(*RangerAppWriterContext).defineVariable(p_24.Get_name(), p_24);
    p_24.Set_is_class_variable(true); 
  }
  if  node.isFirstVref("operators") {
    var listOf *CodeNode = node.getSecond();
    var i_92 int64 = 0;  
    for ; i_92 < int64(len(listOf.children)) ; i_92++ {
      item_13 := listOf.children[i_92];
      ctx.createOperator(item_13);
    }
    find_more = false; 
  }
  if  node.isFirstVref("Import") || node.isFirstVref("import") {
    var fNameNode_6 *CodeNode = node.children[1];
    var import_file_4 string = fNameNode_6.string_value;
    if  r_has_key_string_bool(ctx.already_imported, import_file_4) {
      return;
    } else {
      ctx.already_imported[import_file_4] = true
    }
    var c_9 *GoNullable = new(GoNullable); 
    c_9 = r_io_read_file(".", import_file_4);
    var code_4 *SourceCode = CreateNew_SourceCode(c_9.value.(string));
    code_4.filename = import_file_4; 
    var parser_4 *RangerLispParser = CreateNew_RangerLispParser(code_4);
    parser_4.parse();
    var rnode *GoNullable = new(GoNullable); 
    rnode.value = parser_4.rootNode.value;
    rnode.has_value = parser_4.rootNode.has_value;
    this.CollectMethods(rnode.value.(*CodeNode), ctx, wr);
    find_more = false; 
  }
  if  node.isFirstVref("StaticMethod") || node.isFirstVref("sfn") {
    var s_24 string = node.getVRefAt(1);
    var currC_17 *GoNullable = new(GoNullable); 
    currC_17.value = ctx.currentClass.value;
    currC_17.has_value = ctx.currentClass.has_value;
    var m_16 *RangerAppFunctionDesc = CreateNew_RangerAppFunctionDesc();
    m_16.name = s_24; 
    m_16.node.value = node;
    m_16.node.has_value = true; /* detected as non-optional */
    m_16.is_static = true; 
    m_16.nameNode.value = node.children[1];
    m_16.nameNode.has_value = true; /* detected as non-optional */
    var args_10 *CodeNode = node.children[2];
    m_16.fnBody.value = node.children[3];
    m_16.fnBody.has_value = true; /* detected as non-optional */
    var ii_15 int64 = 0;  
    for ; ii_15 < int64(len(args_10.children)) ; ii_15++ {
      arg_21 := args_10.children[ii_15];
      var p_27 IFACE_RangerAppParamDesc = CreateNew_RangerAppParamDesc();
      p_27.Set_name(arg_21.vref); 
      p_27.Set_value_type(arg_21.value_type); 
      p_27.Get_node().value = arg_21;
      p_27.Get_node().has_value = true; /* detected as non-optional */
      p_27.Get_nameNode().value = arg_21;
      p_27.Get_nameNode().has_value = true; /* detected as non-optional */
      p_27.Set_refType(1); 
      p_27.Set_varType(4); 
      m_16.params = append(m_16.params,p_27); 
      arg_21.hasParamDesc = true; 
      arg_21.paramDesc.value = p_27;
      arg_21.paramDesc.has_value = true; /* detected as non-optional */
      arg_21.eval_type = arg_21.value_type; 
      arg_21.eval_type_name = arg_21.type_name; 
      if  arg_21.hasFlag("strong") {
        p_27.changeStrength(1, 1, p_27.Get_nameNode().value.(*CodeNode));
      } else {
        arg_21.setFlag("lives");
        p_27.changeStrength(0, 1, p_27.Get_nameNode().value.(*CodeNode));
      }
    }
    currC_17.value.(*RangerAppClassDesc).addStaticMethod(m_16);
    find_more = false; 
  }
  if  node.isFirstVref("PublicMethod") || node.isFirstVref("fn") {
    var cn_16 *CodeNode = node.getSecond();
    var s_27 string = node.getVRefAt(1);
    var currC_20 *GoNullable = new(GoNullable); 
    currC_20.value = ctx.currentClass.value;
    currC_20.has_value = ctx.currentClass.has_value;
    var m_19 *RangerAppFunctionDesc = CreateNew_RangerAppFunctionDesc();
    m_19.name = s_27; 
    m_19.node.value = node;
    m_19.node.has_value = true; /* detected as non-optional */
    m_19.nameNode.value = node.children[1];
    m_19.nameNode.has_value = true; /* detected as non-optional */
    if  node.hasBooleanProperty("strong") {
      m_19.refType = 2; 
    } else {
      m_19.refType = 1; 
    }
    var subCtx_31 *RangerAppWriterContext = currC_20.value.(*RangerAppClassDesc).ctx.value.(*RangerAppWriterContext).fork();
    subCtx_31.is_function = true; 
    subCtx_31.currentMethod.value = m_19;
    subCtx_31.currentMethod.has_value = true; /* detected as non-optional */
    m_19.fnCtx.value = subCtx_31;
    m_19.fnCtx.has_value = true; /* detected as non-optional */
    if  cn_16.hasFlag("weak") {
      m_19.changeStrength(0, 1, node);
    } else {
      m_19.changeStrength(1, 1, node);
    }
    var args_13 *CodeNode = node.children[2];
    m_19.fnBody.value = node.children[3];
    m_19.fnBody.has_value = true; /* detected as non-optional */
    var ii_18 int64 = 0;  
    for ; ii_18 < int64(len(args_13.children)) ; ii_18++ {
      arg_24 := args_13.children[ii_18];
      var p2 IFACE_RangerAppParamDesc = CreateNew_RangerAppParamDesc();
      p2.Set_name(arg_24.vref); 
      p2.Set_value_type(arg_24.value_type); 
      p2.Get_node().value = arg_24;
      p2.Get_node().has_value = true; /* detected as non-optional */
      p2.Get_nameNode().value = arg_24;
      p2.Get_nameNode().has_value = true; /* detected as non-optional */
      p2.Set_refType(1); 
      p2.Set_initRefType(1); 
      p2.Set_debugString("--> collected "); 
      if  args_13.hasBooleanProperty("strong") {
        p2.Set_debugString("--> collected as STRONG"); 
        ctx.log(node, "memory5", "strong param should move local ownership to call ***");
        p2.Set_refType(2); 
        p2.Set_initRefType(2); 
      }
      p2.Set_varType(4); 
      m_19.params = append(m_19.params,p2); 
      arg_24.hasParamDesc = true; 
      arg_24.paramDesc.value = p2;
      arg_24.paramDesc.has_value = true; /* detected as non-optional */
      arg_24.eval_type = arg_24.value_type; 
      arg_24.eval_type_name = arg_24.type_name; 
      if  arg_24.hasFlag("strong") {
        p2.changeStrength(1, 1, p2.Get_nameNode().value.(*CodeNode));
      } else {
        arg_24.setFlag("lives");
        p2.changeStrength(0, 1, p2.Get_nameNode().value.(*CodeNode));
      }
      subCtx_31.defineVariable(p2.Get_name(), p2);
    }
    currC_20.value.(*RangerAppClassDesc).addMethod(m_19);
    find_more = false; 
  }
  if  find_more {
    var i_95 int64 = 0;  
    for ; i_95 < int64(len(node.children)) ; i_95++ {
      item_17 := node.children[i_95];
      this.CollectMethods(item_17, ctx, wr);
    }
  }
}
func (this *RangerFlowParser) FindWeakRefs (node *CodeNode, ctx *RangerAppWriterContext, wr *CodeWriter) () {
  var list_5 []*RangerAppClassDesc = ctx.getClasses();
  var i_92 int64 = 0;  
  for ; i_92 < int64(len(list_5)) ; i_92++ {
    classDesc := list_5[i_92];
    var i2 int64 = 0;  
    for ; i2 < int64(len(classDesc.variables)) ; i2++ {
      varD := classDesc.variables[i2];
      if  varD.Get_refType() == 1 {
        if  varD.isArray() {
          /** unused:  nn_8*/
        }
        if  varD.isHash() {
          /** unused:  nn_18*/
        }
        if  varD.isObject() {
          /** unused:  nn_24*/
        }
      }
    }
  }
}
func (this *RangerFlowParser) findFunctionDesc (obj *CodeNode, ctx *RangerAppWriterContext, wr *CodeWriter) *GoNullable {
  var varDesc *GoNullable = new(GoNullable); 
  var varFnDesc *GoNullable = new(GoNullable); 
  if  obj.vref != this.getThisName() {
    if  (int64(len(obj.ns))) > 1 {
      var cnt_4 int64 = int64(len(obj.ns));
      var classRefDesc *GoNullable = new(GoNullable); 
      var classDesc_4 *GoNullable = new(GoNullable); 
      var i_94 int64 = 0;  
      for ; i_94 < int64(len(obj.ns)) ; i_94++ {
        strname := obj.ns[i_94];
        if  i_94 == 0 {
          if  strname == this.getThisName() {
            classDesc_4.value = ctx.getCurrentClass().value;
            classDesc_4.has_value = ctx.getCurrentClass().has_value; 
          } else {
            if  ctx.isDefinedClass(strname) {
              classDesc_4.value = ctx.findClass(strname);
              classDesc_4.has_value = true; /* detected as non-optional */
              continue;
            }
            classRefDesc.value = ctx.getVariableDef(strname);
            classRefDesc.has_value = true; /* detected as non-optional */
            if  (!classRefDesc.has_value ) || (!classRefDesc.value.(IFACE_RangerAppParamDesc).Get_nameNode().has_value ) {
              ctx.addError(obj, strings.Join([]string{ "Error, no description for called object: ",strname }, ""));
              break;
            }
            classRefDesc.value.(IFACE_RangerAppParamDesc).Set_ref_cnt(1 + classRefDesc.value.(IFACE_RangerAppParamDesc).Get_ref_cnt()); 
            classDesc_4.value = ctx.findClass(classRefDesc.value.(IFACE_RangerAppParamDesc).Get_nameNode().value.(*CodeNode).type_name);
            classDesc_4.has_value = true; /* detected as non-optional */
            if  !classDesc_4.has_value  {
              return varFnDesc;
            }
          }
        } else {
          if  !classDesc_4.has_value  {
            return varFnDesc;
          }
          if  i_94 < (cnt_4 - 1) {
            varDesc.value = classDesc_4.value.(*RangerAppClassDesc).findVariable(strname).value;
            varDesc.has_value = classDesc_4.value.(*RangerAppClassDesc).findVariable(strname).has_value; 
            if  !varDesc.has_value  {
              ctx.addError(obj, strings.Join([]string{ "Error, no description for refenced obj: ",strname }, ""));
            }
            var subClass string = varDesc.value.(IFACE_RangerAppParamDesc).getTypeName();
            classDesc_4.value = ctx.findClass(subClass);
            classDesc_4.has_value = true; /* detected as non-optional */
            continue;
          }
          if  classDesc_4.has_value {
            varFnDesc.value = classDesc_4.value.(*RangerAppClassDesc).findMethod(strname).value;
            varFnDesc.has_value = classDesc_4.value.(*RangerAppClassDesc).findMethod(strname).has_value; 
            if  !varFnDesc.has_value  {
              varFnDesc.value = classDesc_4.value.(*RangerAppClassDesc).findStaticMethod(strname).value;
              varFnDesc.has_value = classDesc_4.value.(*RangerAppClassDesc).findStaticMethod(strname).has_value; 
              if  !varFnDesc.has_value  {
                ctx.addError(obj, strings.Join([]string{ " function variable not found ",strname }, ""));
              }
            }
          }
        }
      }
      return varFnDesc;
    }
    var udesc_12 *GoNullable = new(GoNullable); 
    udesc_12 = ctx.getCurrentClass();
    var currClass *RangerAppClassDesc = udesc_12.value.(*RangerAppClassDesc);
    varFnDesc.value = currClass.findMethod(obj.vref).value;
    varFnDesc.has_value = currClass.findMethod(obj.vref).has_value; 
    if  varFnDesc.value.(*RangerAppFunctionDesc).nameNode.has_value {
    } else {
      ctx.addError(obj, strings.Join([]string{ "Error, no description for called function: ",obj.vref }, ""));
    }
    return varFnDesc;
  }
  ctx.addError(obj, "Can not call 'this' like function");
  varFnDesc.value = CreateNew_RangerAppFunctionDesc();
  varFnDesc.has_value = true; /* detected as non-optional */
  return varFnDesc;
}
func (this *RangerFlowParser) findParamDesc (obj *CodeNode, ctx *RangerAppWriterContext, wr *CodeWriter) *GoNullable {
  var varDesc_4 *GoNullable = new(GoNullable); 
  var set_nsp bool = false;
  var classDesc_6 *GoNullable = new(GoNullable); 
  if  0 == (int64(len(obj.nsp))) {
    set_nsp = true; 
  }
  if  obj.vref != this.getThisName() {
    if  (int64(len(obj.ns))) > 1 {
      var cnt_7 int64 = int64(len(obj.ns));
      var classRefDesc_4 *GoNullable = new(GoNullable); 
      var i_96 int64 = 0;  
      for ; i_96 < int64(len(obj.ns)) ; i_96++ {
        strname_4 := obj.ns[i_96];
        if  i_96 == 0 {
          if  strname_4 == this.getThisName() {
            classDesc_6.value = ctx.getCurrentClass().value;
            classDesc_6.has_value = ctx.getCurrentClass().has_value; 
            if  set_nsp {
              obj.nsp = append(obj.nsp,classDesc_6.value.(*RangerAppClassDesc)); 
            }
          } else {
            if  ctx.isDefinedClass(strname_4) {
              classDesc_6.value = ctx.findClass(strname_4);
              classDesc_6.has_value = true; /* detected as non-optional */
              if  set_nsp {
                obj.nsp = append(obj.nsp,classDesc_6.value.(*RangerAppClassDesc)); 
              }
              continue;
            }
            classRefDesc_4.value = ctx.getVariableDef(strname_4);
            classRefDesc_4.has_value = true; /* detected as non-optional */
            if  !classRefDesc_4.has_value  {
              ctx.addError(obj, strings.Join([]string{ "Error, no description for called object: ",strname_4 }, ""));
              break;
            }
            if  set_nsp {
              obj.nsp = append(obj.nsp,classRefDesc_4.value.(IFACE_RangerAppParamDesc)); 
            }
            classRefDesc_4.value.(IFACE_RangerAppParamDesc).Set_ref_cnt(1 + classRefDesc_4.value.(IFACE_RangerAppParamDesc).Get_ref_cnt()); 
            classDesc_6.value = ctx.findClass(classRefDesc_4.value.(IFACE_RangerAppParamDesc).Get_nameNode().value.(*CodeNode).type_name);
            classDesc_6.has_value = true; /* detected as non-optional */
          }
        } else {
          if  i_96 < (cnt_7 - 1) {
            varDesc_4.value = classDesc_6.value.(*RangerAppClassDesc).findVariable(strname_4).value;
            varDesc_4.has_value = classDesc_6.value.(*RangerAppClassDesc).findVariable(strname_4).has_value; 
            if  !varDesc_4.has_value  {
              ctx.addError(obj, strings.Join([]string{ "Error, no description for refenced obj: ",strname_4 }, ""));
            }
            var subClass_4 string = varDesc_4.value.(IFACE_RangerAppParamDesc).getTypeName();
            classDesc_6.value = ctx.findClass(subClass_4);
            classDesc_6.has_value = true; /* detected as non-optional */
            if  set_nsp {
              obj.nsp = append(obj.nsp,varDesc_4.value.(IFACE_RangerAppParamDesc)); 
            }
            continue;
          }
          if  classDesc_6.has_value {
            varDesc_4.value = classDesc_6.value.(*RangerAppClassDesc).findVariable(strname_4).value;
            varDesc_4.has_value = classDesc_6.value.(*RangerAppClassDesc).findVariable(strname_4).has_value; 
            if  !varDesc_4.has_value  {
              var classMethod *GoNullable = new(GoNullable); 
              classMethod = classDesc_6.value.(*RangerAppClassDesc).findMethod(strname_4);
              if  !classMethod.has_value  {
                classMethod.value = classDesc_6.value.(*RangerAppClassDesc).findStaticMethod(strname_4).value;
                classMethod.has_value = classDesc_6.value.(*RangerAppClassDesc).findStaticMethod(strname_4).has_value; 
                if  !classMethod.has_value  {
                  ctx.addError(obj, strings.Join([]string{ "variable not found ",strname_4 }, ""));
                }
              }
              if  classMethod.has_value {
                if  set_nsp {
                  obj.nsp = append(obj.nsp,classMethod.value.(*RangerAppFunctionDesc)); 
                }
                return classMethod;
              }
            }
            if  set_nsp {
              obj.nsp = append(obj.nsp,varDesc_4.value.(IFACE_RangerAppParamDesc)); 
            }
          }
        }
      }
      return varDesc_4;
    }
    varDesc_4.value = ctx.getVariableDef(obj.vref);
    varDesc_4.has_value = true; /* detected as non-optional */
    if  varDesc_4.value.(IFACE_RangerAppParamDesc).Get_nameNode().has_value {
    } else {
      fmt.Println( strings.Join([]string{ "findParamDesc : description not found for ",obj.vref }, "") )
      if  varDesc_4.has_value {
        fmt.Println( strings.Join([]string{ "Vardesc was found though...",varDesc_4.value.(IFACE_RangerAppParamDesc).Get_name() }, "") )
      }
      ctx.addError(obj, strings.Join([]string{ "Error, no description for called object: ",obj.vref }, ""));
    }
    return varDesc_4;
  }
  var cc_2 *GoNullable = new(GoNullable); 
  cc_2 = ctx.getCurrentClass();
  return cc_2;
}
func (this *RangerFlowParser) areEqualTypes (n1 *CodeNode, n2 *CodeNode, ctx *RangerAppWriterContext) bool {
  if  (((n1.eval_type != 0) && (n2.eval_type != 0)) && ((int64(len(n1.eval_type_name))) > 0)) && ((int64(len(n2.eval_type_name))) > 0) {
    if  n1.eval_type_name == n2.eval_type_name {
    } else {
      var b_ok bool = false;
      if  ctx.isEnumDefined(n1.eval_type_name) && (n2.eval_type_name == "int") {
        b_ok = true; 
      }
      if  ctx.isEnumDefined(n2.eval_type_name) && (n1.eval_type_name == "int") {
        b_ok = true; 
      }
      if  (n1.eval_type_name == "char") && (n2.eval_type_name == "int") {
        b_ok = true; 
      }
      if  (n1.eval_type_name == "int") && (n2.eval_type_name == "char") {
        b_ok = true; 
      }
      if  ctx.isDefinedClass(n1.eval_type_name) && ctx.isDefinedClass(n2.eval_type_name) {
        var c1_2 *RangerAppClassDesc = ctx.findClass(n1.eval_type_name);
        var c2_4 *RangerAppClassDesc = ctx.findClass(n2.eval_type_name);
        if  c1_2.isSameOrParentClass(n2.eval_type_name, ctx) {
          return true;
        }
        if  c2_4.isSameOrParentClass(n1.eval_type_name, ctx) {
          return true;
        }
      }
      if  b_ok == false {
        return false;
      }
    }
  }
  return true;
}
func (this *RangerFlowParser) shouldBeEqualTypes (n1 *CodeNode, n2 *CodeNode, ctx *RangerAppWriterContext, msg string) () {
  if  (((n1.eval_type != 0) && (n2.eval_type != 0)) && ((int64(len(n1.eval_type_name))) > 0)) && ((int64(len(n2.eval_type_name))) > 0) {
    if  n1.eval_type_name == n2.eval_type_name {
    } else {
      var b_ok_4 bool = false;
      if  ctx.isEnumDefined(n1.eval_type_name) && (n2.eval_type_name == "int") {
        b_ok_4 = true; 
      }
      if  ctx.isEnumDefined(n2.eval_type_name) && (n1.eval_type_name == "int") {
        b_ok_4 = true; 
      }
      if  ctx.isDefinedClass(n2.eval_type_name) {
        var cc_5 *RangerAppClassDesc = ctx.findClass(n2.eval_type_name);
        if  cc_5.isSameOrParentClass(n1.eval_type_name, ctx) {
          b_ok_4 = true; 
        }
      }
      if  (n1.eval_type_name == "char") && (n2.eval_type_name == "int") {
        b_ok_4 = true; 
      }
      if  (n1.eval_type_name == "int") && (n2.eval_type_name == "char") {
        b_ok_4 = true; 
      }
      if  b_ok_4 == false {
        ctx.addError(n1, strings.Join([]string{ (strings.Join([]string{ (strings.Join([]string{ (strings.Join([]string{ (strings.Join([]string{ "Type mismatch ",n2.eval_type_name }, ""))," <> " }, "")),n1.eval_type_name }, "")),". " }, "")),msg }, ""));
      }
    }
  }
}
func (this *RangerFlowParser) shouldBeExpression (n1 *CodeNode, ctx *RangerAppWriterContext, msg string) () {
  if  n1.expression == false {
    ctx.addError(n1, msg);
  }
}
func (this *RangerFlowParser) shouldHaveChildCnt (cnt int64, n1 *CodeNode, ctx *RangerAppWriterContext, msg string) () {
  if  (int64(len(n1.children))) != cnt {
    ctx.addError(n1, msg);
  }
}
func (this *RangerFlowParser) shouldBeNumeric (n1 *CodeNode, ctx *RangerAppWriterContext, msg string) () {
  if  (n1.eval_type != 0) && ((int64(len(n1.eval_type_name))) > 0) {
    if  false == ((n1.eval_type_name == "double") || (n1.eval_type_name == "int")) {
      ctx.addError(n1, strings.Join([]string{ (strings.Join([]string{ (strings.Join([]string{ "Not numeric: ",n1.eval_type_name }, "")),". " }, "")),msg }, ""));
    }
  }
}
func (this *RangerFlowParser) shouldBeArray (n1 *CodeNode, ctx *RangerAppWriterContext, msg string) () {
  if  n1.eval_type != 6 {
    ctx.addError(n1, strings.Join([]string{ "Expecting array. ",msg }, ""));
  }
}
func (this *RangerFlowParser) shouldBeType (type_name string, n1 *CodeNode, ctx *RangerAppWriterContext, msg string) () {
  if  (n1.eval_type != 0) && ((int64(len(n1.eval_type_name))) > 0) {
    if  n1.eval_type_name == type_name {
    } else {
      var b_ok_6 bool = false;
      if  ctx.isEnumDefined(n1.eval_type_name) && (type_name == "int") {
        b_ok_6 = true; 
      }
      if  ctx.isEnumDefined(type_name) && (n1.eval_type_name == "int") {
        b_ok_6 = true; 
      }
      if  (n1.eval_type_name == "char") && (type_name == "int") {
        b_ok_6 = true; 
      }
      if  (n1.eval_type_name == "int") && (type_name == "char") {
        b_ok_6 = true; 
      }
      if  b_ok_6 == false {
        ctx.addError(n1, strings.Join([]string{ (strings.Join([]string{ (strings.Join([]string{ (strings.Join([]string{ (strings.Join([]string{ "Type mismatch ",type_name }, ""))," <> " }, "")),n1.eval_type_name }, "")),". " }, "")),msg }, ""));
      }
    }
  }
}
// getter for variable stdCommands
func (this *RangerFlowParser) Get_stdCommands() *GoNullable {
  return this.stdCommands
}
// setter for variable stdCommands
func (this *RangerFlowParser) Set_stdCommands( value *GoNullable)  {
  this.stdCommands = value 
}
type RangerGenericClassWriter struct { 
  compiler *GoNullable
}
type IFACE_RangerGenericClassWriter interface { 
  Get_compiler() *GoNullable
  Set_compiler(value *GoNullable) 
  EncodeString(node *CodeNode, ctx *RangerAppWriterContext, wr *CodeWriter) string
  CustomOperator(node *CodeNode, ctx *RangerAppWriterContext, wr *CodeWriter) ()
  WriteSetterVRef(node *CodeNode, ctx *RangerAppWriterContext, wr *CodeWriter) ()
  writeArrayTypeDef(node *CodeNode, ctx *RangerAppWriterContext, wr *CodeWriter) ()
  WriteEnum(node *CodeNode, ctx *RangerAppWriterContext, wr *CodeWriter) ()
  WriteScalarValue(node *CodeNode, ctx *RangerAppWriterContext, wr *CodeWriter) ()
  getTypeString(type_string string) string
  import_lib(lib_name string, ctx *RangerAppWriterContext, wr *CodeWriter) ()
  getObjectTypeString(type_string string, ctx *RangerAppWriterContext) string
  release_local_vars(node *CodeNode, ctx *RangerAppWriterContext, wr *CodeWriter) ()
  WalkNode(node *CodeNode, ctx *RangerAppWriterContext, wr *CodeWriter) ()
  writeTypeDef(node *CodeNode, ctx *RangerAppWriterContext, wr *CodeWriter) ()
  writeRawTypeDef(node *CodeNode, ctx *RangerAppWriterContext, wr *CodeWriter) ()
  adjustType(tn string) string
  WriteVRef(node *CodeNode, ctx *RangerAppWriterContext, wr *CodeWriter) ()
  writeVarDef(node *CodeNode, ctx *RangerAppWriterContext, wr *CodeWriter) ()
  writeFnCall(node *CodeNode, ctx *RangerAppWriterContext, wr *CodeWriter) ()
  writeNewCall(node *CodeNode, ctx *RangerAppWriterContext, wr *CodeWriter) ()
  writeClass(node *CodeNode, ctx *RangerAppWriterContext, wr *CodeWriter) ()
}

func CreateNew_RangerGenericClassWriter() *RangerGenericClassWriter {
  me := new(RangerGenericClassWriter)
  me.compiler = new(GoNullable);
  return me;
}
func (this *RangerGenericClassWriter) EncodeString (node *CodeNode, ctx *RangerAppWriterContext, wr *CodeWriter) string {
  /** unused:  encoded_str_2*/
  var str_length_2 int64 = int64(len(node.string_value));
  var encoded_str_8 string = "";
  var ii_11 int64 = 0;
  for ii_11 < str_length_2 {var cc_4 int64 = int64(node.string_value[ii_11]);
    switch (cc_4 ) { 
      case 8 : 
        encoded_str_8 = strings.Join([]string{ (strings.Join([]string{ encoded_str_8,(string([] byte{byte(92)})) }, "")),(string([] byte{byte(98)})) }, ""); 
      case 9 : 
        encoded_str_8 = strings.Join([]string{ (strings.Join([]string{ encoded_str_8,(string([] byte{byte(92)})) }, "")),(string([] byte{byte(116)})) }, ""); 
      case 10 : 
        encoded_str_8 = strings.Join([]string{ (strings.Join([]string{ encoded_str_8,(string([] byte{byte(92)})) }, "")),(string([] byte{byte(110)})) }, ""); 
      case 12 : 
        encoded_str_8 = strings.Join([]string{ (strings.Join([]string{ encoded_str_8,(string([] byte{byte(92)})) }, "")),(string([] byte{byte(102)})) }, ""); 
      case 13 : 
        encoded_str_8 = strings.Join([]string{ (strings.Join([]string{ encoded_str_8,(string([] byte{byte(92)})) }, "")),(string([] byte{byte(114)})) }, ""); 
      case 34 : 
        encoded_str_8 = strings.Join([]string{ (strings.Join([]string{ encoded_str_8,(string([] byte{byte(92)})) }, "")),(string([] byte{byte(34)})) }, ""); 
      case 92 : 
        encoded_str_8 = strings.Join([]string{ (strings.Join([]string{ encoded_str_8,(string([] byte{byte(92)})) }, "")),(string([] byte{byte(92)})) }, ""); 
      default: 
        encoded_str_8 = strings.Join([]string{ encoded_str_8,(string([] byte{byte(cc_4)})) }, ""); 
    }
    ii_11 = ii_11 + 1; 
  }
  return encoded_str_8;
}
func (this *RangerGenericClassWriter) CustomOperator (node *CodeNode, ctx *RangerAppWriterContext, wr *CodeWriter) () {
}
func (this *RangerGenericClassWriter) WriteSetterVRef (node *CodeNode, ctx *RangerAppWriterContext, wr *CodeWriter) () {
}
func (this *RangerGenericClassWriter) writeArrayTypeDef (node *CodeNode, ctx *RangerAppWriterContext, wr *CodeWriter) () {
}
func (this *RangerGenericClassWriter) WriteEnum (node *CodeNode, ctx *RangerAppWriterContext, wr *CodeWriter) () {
  if  node.eval_type == 11 {
    var rootObjName_2 string = node.ns[0];
    var e_8 *GoNullable = new(GoNullable); 
    e_8 = ctx.getEnum(rootObjName_2);
    if  e_8.has_value {
      var enumName_2 string = node.ns[1];
      wr.out(strings.Join([]string{ "",strconv.FormatInt(((r_get_string_int64(e_8.value.(*RangerAppEnum).values, enumName_2)).value.(int64)), 10) }, ""), false);
    } else {
      if  node.hasParamDesc {
        var pp_4 *GoNullable = new(GoNullable); 
        pp_4.value = node.paramDesc.value;
        pp_4.has_value = node.paramDesc.has_value;
        var nn_8 *GoNullable = new(GoNullable); 
        nn_8.value = pp_4.value.(IFACE_RangerAppParamDesc).Get_nameNode().value;
        nn_8.has_value = pp_4.value.(IFACE_RangerAppParamDesc).Get_nameNode().has_value;
        this.WriteVRef(nn_8.value.(*CodeNode), ctx, wr);
      }
    }
  }
}
func (this *RangerGenericClassWriter) WriteScalarValue (node *CodeNode, ctx *RangerAppWriterContext, wr *CodeWriter) () {
  switch (node.value_type ) { 
    case 2 : 
      wr.out(strings.Join([]string{ "",strconv.FormatFloat(node.double_value,'f', 6, 64) }, ""), false);
    case 4 : 
      var s_18 string = this.EncodeString(node, ctx, wr);
      wr.out(strings.Join([]string{ (strings.Join([]string{ "\"",s_18 }, "")),"\"" }, ""), false);
    case 3 : 
      wr.out(strings.Join([]string{ "",strconv.FormatInt(node.int_value, 10) }, ""), false);
    case 5 : 
      if  node.boolean_value {
        wr.out("true", false);
      } else {
        wr.out("false", false);
      }
  }
}
func (this *RangerGenericClassWriter) getTypeString (type_string string) string {
  return type_string;
}
func (this *RangerGenericClassWriter) import_lib (lib_name string, ctx *RangerAppWriterContext, wr *CodeWriter) () {
  wr.addImport(lib_name);
}
func (this *RangerGenericClassWriter) getObjectTypeString (type_string string, ctx *RangerAppWriterContext) string {
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
  }
  return type_string;
}
func (this *RangerGenericClassWriter) release_local_vars (node *CodeNode, ctx *RangerAppWriterContext, wr *CodeWriter) () {
  var i_61 int64 = 0;  
  for ; i_61 < int64(len(ctx.localVarNames)) ; i_61++ {
    n_7 := ctx.localVarNames[i_61];
    var p_14 *GoNullable = new(GoNullable); 
    p_14 = r_get_string_IFACE_RangerAppParamDesc(ctx.localVariables, n_7);
    if  p_14.value.(IFACE_RangerAppParamDesc).Get_ref_cnt() == 0 {
      continue;
    }
    if  p_14.value.(IFACE_RangerAppParamDesc).isAllocatedType() {
      if  1 == p_14.value.(IFACE_RangerAppParamDesc).getStrength() {
        if  p_14.value.(IFACE_RangerAppParamDesc).Get_nameNode().value.(*CodeNode).eval_type == 7 {
        }
        if  p_14.value.(IFACE_RangerAppParamDesc).Get_nameNode().value.(*CodeNode).eval_type == 6 {
        }
        if  (p_14.value.(IFACE_RangerAppParamDesc).Get_nameNode().value.(*CodeNode).eval_type != 6) && (p_14.value.(IFACE_RangerAppParamDesc).Get_nameNode().value.(*CodeNode).eval_type != 7) {
        }
      }
      if  0 == p_14.value.(IFACE_RangerAppParamDesc).getStrength() {
        if  p_14.value.(IFACE_RangerAppParamDesc).Get_nameNode().value.(*CodeNode).eval_type == 7 {
        }
        if  p_14.value.(IFACE_RangerAppParamDesc).Get_nameNode().value.(*CodeNode).eval_type == 6 {
        }
        if  (p_14.value.(IFACE_RangerAppParamDesc).Get_nameNode().value.(*CodeNode).eval_type != 6) && (p_14.value.(IFACE_RangerAppParamDesc).Get_nameNode().value.(*CodeNode).eval_type != 7) {
        }
      }
    }
  }
  if  ctx.is_function {
    return;
  }
  if  ctx.parent.has_value {
    this.release_local_vars(node, ctx.parent.value.(*RangerAppWriterContext), wr);
  }
}
func (this *RangerGenericClassWriter) WalkNode (node *CodeNode, ctx *RangerAppWriterContext, wr *CodeWriter) () {
  this.compiler.value.(*LiveCompiler).WalkNode(node, ctx, wr);
}
func (this *RangerGenericClassWriter) writeTypeDef (node *CodeNode, ctx *RangerAppWriterContext, wr *CodeWriter) () {
  wr.out(node.type_name, false);
}
func (this *RangerGenericClassWriter) writeRawTypeDef (node *CodeNode, ctx *RangerAppWriterContext, wr *CodeWriter) () {
  this.writeTypeDef(node, ctx, wr);
}
func (this *RangerGenericClassWriter) adjustType (tn string) string {
  return tn;
}
func (this *RangerGenericClassWriter) WriteVRef (node *CodeNode, ctx *RangerAppWriterContext, wr *CodeWriter) () {
  if  node.eval_type == 11 {
    if  (int64(len(node.ns))) > 1 {
      var rootObjName_5 string = node.ns[0];
      var enumName_5 string = node.ns[1];
      var e_11 *GoNullable = new(GoNullable); 
      e_11 = ctx.getEnum(rootObjName_5);
      if  e_11.has_value {
        wr.out(strings.Join([]string{ "",strconv.FormatInt(((r_get_string_int64(e_11.value.(*RangerAppEnum).values, enumName_5)).value.(int64)), 10) }, ""), false);
        return;
      }
    }
  }
  if  (int64(len(node.nsp))) > 0 {
    var i_64 int64 = 0;  
    for ; i_64 < int64(len(node.nsp)) ; i_64++ {
      p_17 := node.nsp[i_64];
      if  i_64 > 0 {
        wr.out(".", false);
      }
      if  (int64(len(p_17.Get_compiledName()))) > 0 {
        wr.out(this.adjustType(p_17.Get_compiledName()), false);
      } else {
        if  (int64(len(p_17.Get_name()))) > 0 {
          wr.out(this.adjustType(p_17.Get_name()), false);
        } else {
          wr.out(this.adjustType((node.ns[i_64])), false);
        }
      }
    }
    return;
  }
  var i_68 int64 = 0;  
  for ; i_68 < int64(len(node.ns)) ; i_68++ {
    part := node.ns[i_68];
    if  i_68 > 0 {
      wr.out(".", false);
    }
    wr.out(this.adjustType(part), false);
  }
}
func (this *RangerGenericClassWriter) writeVarDef (node *CodeNode, ctx *RangerAppWriterContext, wr *CodeWriter) () {
  if  node.hasParamDesc {
    var p_19 *GoNullable = new(GoNullable); 
    p_19.value = node.paramDesc.value;
    p_19.has_value = node.paramDesc.has_value;
    if  p_19.value.(IFACE_RangerAppParamDesc).Get_set_cnt() > 0 {
      wr.out(strings.Join([]string{ "var ",p_19.value.(IFACE_RangerAppParamDesc).Get_name() }, ""), false);
    } else {
      wr.out(strings.Join([]string{ "const ",p_19.value.(IFACE_RangerAppParamDesc).Get_name() }, ""), false);
    }
    if  (int64(len(node.children))) > 2 {
      wr.out(" = ", false);
      ctx.setInExpr();
      var value_2 *CodeNode = node.getThird();
      this.WalkNode(value_2, ctx, wr);
      ctx.unsetInExpr();
      wr.out(";", true);
    } else {
      wr.out(";", true);
    }
  }
}
func (this *RangerGenericClassWriter) writeFnCall (node *CodeNode, ctx *RangerAppWriterContext, wr *CodeWriter) () {
  if  node.hasFnCall {
    var fc_20 *CodeNode = node.getFirst();
    this.WriteVRef(fc_20, ctx, wr);
    wr.out("(", false);
    var givenArgs_2 *CodeNode = node.getSecond();
    ctx.setInExpr();
    var i_68 int64 = 0;  
    for ; i_68 < int64(len(node.fnDesc.value.(*RangerAppFunctionDesc).params)) ; i_68++ {
      arg_12 := node.fnDesc.value.(*RangerAppFunctionDesc).params[i_68];
      if  i_68 > 0 {
        wr.out(", ", false);
      }
      if  (int64(len(givenArgs_2.children))) <= i_68 {
        var defVal *GoNullable = new(GoNullable); 
        defVal = arg_12.Get_nameNode().value.(*CodeNode).getFlag("default");
        if  defVal.has_value {
          var fc_31 *CodeNode = defVal.value.(*CodeNode).vref_annotation.value.(*CodeNode).getFirst();
          this.WalkNode(fc_31, ctx, wr);
        } else {
          ctx.addError(node, "Default argument was missing");
        }
        continue;
      }
      var n_10 *CodeNode = givenArgs_2.children[i_68];
      this.WalkNode(n_10, ctx, wr);
    }
    ctx.unsetInExpr();
    wr.out(")", false);
    if  ctx.expressionLevel() == 0 {
      wr.out(";", true);
    }
  }
}
func (this *RangerGenericClassWriter) writeNewCall (node *CodeNode, ctx *RangerAppWriterContext, wr *CodeWriter) () {
  if  node.hasNewOper {
    var cl_2 *GoNullable = new(GoNullable); 
    cl_2.value = node.clDesc.value;
    cl_2.has_value = node.clDesc.has_value;
    /** unused:  fc_25*/
    wr.out(strings.Join([]string{ "new ",node.clDesc.value.(*RangerAppClassDesc).name }, ""), false);
    wr.out("(", false);
    var constr *GoNullable = new(GoNullable); 
    constr.value = cl_2.value.(*RangerAppClassDesc).constructor_fn.value;
    constr.has_value = cl_2.value.(*RangerAppClassDesc).constructor_fn.has_value;
    var givenArgs_5 *CodeNode = node.getThird();
    if  constr.has_value {
      var i_70 int64 = 0;  
      for ; i_70 < int64(len(constr.value.(*RangerAppFunctionDesc).params)) ; i_70++ {
        arg_15 := constr.value.(*RangerAppFunctionDesc).params[i_70];
        var n_12 *CodeNode = givenArgs_5.children[i_70];
        if  i_70 > 0 {
          wr.out(", ", false);
        }
        if  true || (arg_15.Get_nameNode().has_value) {
          this.WalkNode(n_12, ctx, wr);
        }
      }
    }
    wr.out(")", false);
  }
}
func (this *RangerGenericClassWriter) writeClass (node *CodeNode, ctx *RangerAppWriterContext, wr *CodeWriter) () {
  var cl_5 *GoNullable = new(GoNullable); 
  cl_5.value = node.clDesc.value;
  cl_5.has_value = node.clDesc.has_value;
  if  !cl_5.has_value  {
    return;
  }
  wr.out(strings.Join([]string{ (strings.Join([]string{ "class ",cl_5.value.(*RangerAppClassDesc).name }, ""))," { " }, ""), true);
  wr.indent(1);
  var i_72 int64 = 0;  
  for ; i_72 < int64(len(cl_5.value.(*RangerAppClassDesc).variables)) ; i_72++ {
    pvar := cl_5.value.(*RangerAppClassDesc).variables[i_72];
    wr.out(strings.Join([]string{ (strings.Join([]string{ (strings.Join([]string{ (strings.Join([]string{ "/* var ",pvar.Get_name() }, ""))," => " }, "")),pvar.Get_nameNode().value.(*CodeNode).parent.value.(*CodeNode).getCode() }, ""))," */ " }, ""), true);
  }
  var i_76 int64 = 0;  
  for ; i_76 < int64(len(cl_5.value.(*RangerAppClassDesc).static_methods)) ; i_76++ {
    pvar_6 := cl_5.value.(*RangerAppClassDesc).static_methods[i_76];
    wr.out(strings.Join([]string{ (strings.Join([]string{ "/* static ",pvar_6.name }, ""))," */ " }, ""), true);
  }
  var i_79 int64 = 0;  
  for ; i_79 < int64(len(cl_5.value.(*RangerAppClassDesc).defined_variants)) ; i_79++ {
    fnVar := cl_5.value.(*RangerAppClassDesc).defined_variants[i_79];
    var mVs *GoNullable = new(GoNullable); 
    mVs = r_get_string_RangerAppMethodVariants(cl_5.value.(*RangerAppClassDesc).method_variants, fnVar);
    var i_86 int64 = 0;  
    for ; i_86 < int64(len(mVs.value.(*RangerAppMethodVariants).variants)) ; i_86++ {
      variant := mVs.value.(*RangerAppMethodVariants).variants[i_86];
      wr.out(strings.Join([]string{ (strings.Join([]string{ "function ",variant.name }, "")),"() {" }, ""), true);
      wr.indent(1);
      wr.newline();
      var subCtx_14 *RangerAppWriterContext = ctx.fork();
      this.WalkNode(variant.fnBody.value.(*CodeNode), subCtx_14, wr);
      wr.newline();
      wr.indent(-1);
      wr.out("}", true);
    }
  }
  wr.indent(-1);
  wr.out("}", true);
}
// getter for variable compiler
func (this *RangerGenericClassWriter) Get_compiler() *GoNullable {
  return this.compiler
}
// setter for variable compiler
func (this *RangerGenericClassWriter) Set_compiler( value *GoNullable)  {
  this.compiler = value 
}
type RangerJava7ClassWriter struct { 
  compiler *GoNullable /**  unused  **/ 
  // inherited from parent class RangerGenericClassWriter
}
type IFACE_RangerJava7ClassWriter interface { 
  Get_compiler() *GoNullable
  Set_compiler(value *GoNullable) 
  adjustType(tn string) string
  getObjectTypeString(type_string string, ctx *RangerAppWriterContext) string
  getTypeString(type_string string) string
  writeTypeDef(node *CodeNode, ctx *RangerAppWriterContext, wr *CodeWriter) ()
  WriteVRef(node *CodeNode, ctx *RangerAppWriterContext, wr *CodeWriter) ()
  writeVarDef(node *CodeNode, ctx *RangerAppWriterContext, wr *CodeWriter) ()
  writeArgsDef(fnDesc *RangerAppFunctionDesc, ctx *RangerAppWriterContext, wr *CodeWriter) ()
  CustomOperator(node *CodeNode, ctx *RangerAppWriterContext, wr *CodeWriter) ()
  writeClass(node *CodeNode, ctx *RangerAppWriterContext, orig_wr *CodeWriter) ()
}

func CreateNew_RangerJava7ClassWriter() *RangerJava7ClassWriter {
  me := new(RangerJava7ClassWriter)
  me.compiler = new(GoNullable);
  me.compiler = new(GoNullable);
  return me;
}
func (this *RangerJava7ClassWriter) adjustType (tn string) string {
  if  tn == "this" {
    return "this";
  }
  return tn;
}
func (this *RangerJava7ClassWriter) getObjectTypeString (type_string string, ctx *RangerAppWriterContext) string {
  switch (type_string ) { 
    case "int" : 
      return "Integer";
    case "string" : 
      return "String";
    case "chararray" : 
      return "char[]";
    case "char" : 
      return "char";
    case "boolean" : 
      return "Boolean";
    case "double" : 
      return "Double";
  }
  return type_string;
}
func (this *RangerJava7ClassWriter) getTypeString (type_string string) string {
  switch (type_string ) { 
    case "int" : 
      return "int";
    case "string" : 
      return "String";
    case "chararray" : 
      return "char[]";
    case "char" : 
      return "char";
    case "boolean" : 
      return "boolean";
    case "double" : 
      return "double";
  }
  return type_string;
}
func (this *RangerJava7ClassWriter) writeTypeDef (node *CodeNode, ctx *RangerAppWriterContext, wr *CodeWriter) () {
  var v_type int64 = node.value_type;
  var t_name string = node.type_name;
  var a_name_2 string = node.array_type;
  var k_name string = node.key_type;
  if  ((v_type == 8) || (v_type == 9)) || (v_type == 0) {
    v_type = node.typeNameAsType(ctx); 
  }
  if  node.eval_type != 0 {
    v_type = node.eval_type; 
    if  (int64(len(node.eval_type_name))) > 0 {
      t_name = node.eval_type_name; 
    }
    if  (int64(len(node.eval_array_type))) > 0 {
      a_name_2 = node.eval_array_type; 
    }
    if  (int64(len(node.eval_key_type))) > 0 {
      k_name = node.eval_key_type; 
    }
  }
  if  node.hasFlag("optional") {
    wr.addImport("java.util.Optional");
    wr.out("Optional<", false);
    switch (v_type ) { 
      case 11 : 
        wr.out("Integer", false);
      case 3 : 
        wr.out("Integer", false);
      case 2 : 
        wr.out("Double", false);
      case 4 : 
        wr.out("String", false);
      case 5 : 
        wr.out("Boolean", false);
      case 12 : 
        wr.out("char", false);
      case 13 : 
        wr.out("char[]", false);
      case 7 : 
        wr.out(strings.Join([]string{ (strings.Join([]string{ (strings.Join([]string{ (strings.Join([]string{ "HashMap<",this.getObjectTypeString(k_name, ctx) }, "")),"," }, "")),this.getObjectTypeString(a_name_2, ctx) }, "")),">" }, ""), false);
        wr.addImport("java.util.*");
      case 6 : 
        wr.out(strings.Join([]string{ (strings.Join([]string{ "ArrayList<",this.getObjectTypeString(a_name_2, ctx) }, "")),">" }, ""), false);
        wr.addImport("java.util.*");
      default: 
        if  t_name == "void" {
          wr.out("void", false);
        } else {
          wr.out(this.getObjectTypeString(t_name, ctx), false);
        }
    }
  } else {
    switch (v_type ) { 
      case 11 : 
        wr.out("int", false);
      case 3 : 
        wr.out("int", false);
      case 2 : 
        wr.out("double", false);
      case 12 : 
        wr.out("char", false);
      case 13 : 
        wr.out("char[]", false);
      case 4 : 
        wr.out("String", false);
      case 5 : 
        wr.out("boolean", false);
      case 7 : 
        wr.out(strings.Join([]string{ (strings.Join([]string{ (strings.Join([]string{ (strings.Join([]string{ "HashMap<",this.getObjectTypeString(k_name, ctx) }, "")),"," }, "")),this.getObjectTypeString(a_name_2, ctx) }, "")),">" }, ""), false);
        wr.addImport("java.util.*");
      case 6 : 
        wr.out(strings.Join([]string{ (strings.Join([]string{ "ArrayList<",this.getObjectTypeString(a_name_2, ctx) }, "")),">" }, ""), false);
        wr.addImport("java.util.*");
      default: 
        if  t_name == "void" {
          wr.out("void", false);
        } else {
          wr.out(this.getTypeString(t_name), false);
        }
    }
  }
  if  node.hasFlag("optional") {
    wr.out(">", false);
  }
}
func (this *RangerJava7ClassWriter) WriteVRef (node *CodeNode, ctx *RangerAppWriterContext, wr *CodeWriter) () {
  if  node.vref == "this" {
    wr.out("this", false);
    return;
  }
  if  node.eval_type == 11 {
    if  (int64(len(node.ns))) > 1 {
      var rootObjName_4 string = node.ns[0];
      var enumName_4 string = node.ns[1];
      var e_10 *GoNullable = new(GoNullable); 
      e_10 = ctx.getEnum(rootObjName_4);
      if  e_10.has_value {
        wr.out(strings.Join([]string{ "",strconv.FormatInt(((r_get_string_int64(e_10.value.(*RangerAppEnum).values, enumName_4)).value.(int64)), 10) }, ""), false);
        return;
      }
    }
  }
  var max_len int64 = int64(len(node.ns));
  if  (int64(len(node.nsp))) > 0 {
    var i_70 int64 = 0;  
    for ; i_70 < int64(len(node.nsp)) ; i_70++ {
      p_17 := node.nsp[i_70];
      if  i_70 == 0 {
        var part_2 string = node.ns[0];
        if  part_2 == "this" {
          wr.out("this", false);
          continue;
        }
      }
      if  i_70 > 0 {
        wr.out(".", false);
      }
      if  (int64(len(p_17.Get_compiledName()))) > 0 {
        wr.out(this.adjustType(p_17.Get_compiledName()), false);
      } else {
        if  (int64(len(p_17.Get_name()))) > 0 {
          wr.out(this.adjustType(p_17.Get_name()), false);
        } else {
          wr.out(this.adjustType((node.ns[i_70])), false);
        }
      }
      if  i_70 < (max_len - 1) {
        if  p_17.Get_nameNode().value.(*CodeNode).hasFlag("optional") {
          wr.out(".get()", false);
        }
      }
    }
    return;
  }
  if  node.hasParamDesc {
    var p_22 *GoNullable = new(GoNullable); 
    p_22.value = node.paramDesc.value;
    p_22.has_value = node.paramDesc.has_value;
    wr.out(p_22.value.(IFACE_RangerAppParamDesc).Get_compiledName(), false);
    return;
  }
  var i_75 int64 = 0;  
  for ; i_75 < int64(len(node.ns)) ; i_75++ {
    part_7 := node.ns[i_75];
    if  i_75 > 0 {
      wr.out(".", false);
    }
    wr.out(this.adjustType(part_7), false);
  }
}
func (this *RangerJava7ClassWriter) writeVarDef (node *CodeNode, ctx *RangerAppWriterContext, wr *CodeWriter) () {
  if  node.hasParamDesc {
    var nn_9 *CodeNode = node.children[1];
    var p_22 *GoNullable = new(GoNullable); 
    p_22.value = nn_9.paramDesc.value;
    p_22.has_value = nn_9.paramDesc.has_value;
    if  (p_22.value.(IFACE_RangerAppParamDesc).Get_ref_cnt() == 0) && (p_22.value.(IFACE_RangerAppParamDesc).Get_is_class_variable() == false) {
      wr.out("/** unused:  ", false);
    }
    if  (p_22.value.(IFACE_RangerAppParamDesc).Get_set_cnt() > 0) || p_22.value.(IFACE_RangerAppParamDesc).Get_is_class_variable() {
      wr.out("", false);
    } else {
      wr.out("final ", false);
    }
    this.writeTypeDef(p_22.value.(IFACE_RangerAppParamDesc).Get_nameNode().value.(*CodeNode), ctx, wr);
    wr.out(" ", false);
    wr.out(p_22.value.(IFACE_RangerAppParamDesc).Get_compiledName(), false);
    if  (int64(len(node.children))) > 2 {
      wr.out(" = ", false);
      ctx.setInExpr();
      var value_3 *CodeNode = node.getThird();
      this.WalkNode(value_3, ctx, wr);
      ctx.unsetInExpr();
    } else {
      var b_was_set bool = false;
      if  nn_9.value_type == 6 {
        wr.out(" = new ", false);
        this.writeTypeDef(p_22.value.(IFACE_RangerAppParamDesc).Get_nameNode().value.(*CodeNode), ctx, wr);
        wr.out("()", false);
        b_was_set = true; 
      }
      if  nn_9.value_type == 7 {
        wr.out(" = new ", false);
        this.writeTypeDef(p_22.value.(IFACE_RangerAppParamDesc).Get_nameNode().value.(*CodeNode), ctx, wr);
        wr.out("()", false);
        b_was_set = true; 
      }
      if  (b_was_set == false) && nn_9.hasFlag("optional") {
        wr.out(" = Optional.empty()", false);
      }
    }
    if  (p_22.value.(IFACE_RangerAppParamDesc).Get_ref_cnt() == 0) && (p_22.value.(IFACE_RangerAppParamDesc).Get_is_class_variable() == true) {
      wr.out("     /** note: unused */", false);
    }
    if  (p_22.value.(IFACE_RangerAppParamDesc).Get_ref_cnt() == 0) && (p_22.value.(IFACE_RangerAppParamDesc).Get_is_class_variable() == false) {
      wr.out("   **/ ;", true);
    } else {
      wr.out(";", false);
      wr.newline();
    }
  }
}
func (this *RangerJava7ClassWriter) writeArgsDef (fnDesc *RangerAppFunctionDesc, ctx *RangerAppWriterContext, wr *CodeWriter) () {
  var i_75 int64 = 0;  
  for ; i_75 < int64(len(fnDesc.params)) ; i_75++ {
    arg_14 := fnDesc.params[i_75];
    if  i_75 > 0 {
      wr.out(",", false);
    }
    wr.out(" ", false);
    this.writeTypeDef(arg_14.Get_nameNode().value.(*CodeNode), ctx, wr);
    wr.out(strings.Join([]string{ (strings.Join([]string{ " ",arg_14.Get_name() }, ""))," " }, ""), false);
  }
}
func (this *RangerJava7ClassWriter) CustomOperator (node *CodeNode, ctx *RangerAppWriterContext, wr *CodeWriter) () {
  var fc_23 *CodeNode = node.getFirst();
  var cmd_2 string = fc_23.vref;
  if  cmd_2 == "return" {
    wr.newline();
    if  (int64(len(node.children))) > 1 {
      var value_6 *CodeNode = node.getSecond();
      if  value_6.hasParamDesc {
        var nn_12 *CodeNode = value_6.paramDesc.value.(IFACE_RangerAppParamDesc).Get_nameNode().value.(*CodeNode);
        if  ctx.isDefinedClass(nn_12.type_name) {
          /** unused:  cl_4*/
          var activeFn_4 *RangerAppFunctionDesc = ctx.getCurrentMethod();
          var fnNameNode *CodeNode = activeFn_4.nameNode.value.(*CodeNode);
          if  fnNameNode.hasFlag("optional") {
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
func (this *RangerJava7ClassWriter) writeClass (node *CodeNode, ctx *RangerAppWriterContext, orig_wr *CodeWriter) () {
  var cl_7 *GoNullable = new(GoNullable); 
  cl_7.value = node.clDesc.value;
  cl_7.has_value = node.clDesc.has_value;
  if  !cl_7.has_value  {
    return;
  }
  var declaredVariable map[string]bool = make(map[string]bool);
  if  (int64(len(cl_7.value.(*RangerAppClassDesc).extends_classes))) > 0 {
    var i_77 int64 = 0;  
    for ; i_77 < int64(len(cl_7.value.(*RangerAppClassDesc).extends_classes)) ; i_77++ {
      pName := cl_7.value.(*RangerAppClassDesc).extends_classes[i_77];
      var pC *RangerAppClassDesc = ctx.findClass(pName);
      var i_87 int64 = 0;  
      for ; i_87 < int64(len(pC.variables)) ; i_87++ {
        pvar_3 := pC.variables[i_87];
        declaredVariable[pvar_3.Get_name()] = true
      }
    }
  }
  var wr_5 *CodeWriter = orig_wr.getFileWriter(".", (strings.Join([]string{ cl_7.value.(*RangerAppClassDesc).name,".java" }, "")));
  var importFork *CodeWriter = wr_5.fork();
  wr_5.out("", true);
  wr_5.out(strings.Join([]string{ "class ",cl_7.value.(*RangerAppClassDesc).name }, ""), false);
  var parentClass *GoNullable = new(GoNullable); 
  if  (int64(len(cl_7.value.(*RangerAppClassDesc).extends_classes))) > 0 {
    wr_5.out(" extends ", false);
    var i_84 int64 = 0;  
    for ; i_84 < int64(len(cl_7.value.(*RangerAppClassDesc).extends_classes)) ; i_84++ {
      pName_6 := cl_7.value.(*RangerAppClassDesc).extends_classes[i_84];
      wr_5.out(pName_6, false);
      parentClass.value = ctx.findClass(pName_6);
      parentClass.has_value = true; /* detected as non-optional */
    }
  }
  wr_5.out(" { ", true);
  wr_5.indent(1);
  wr_5.createTag("utilities");
  var i_87 int64 = 0;  
  for ; i_87 < int64(len(cl_7.value.(*RangerAppClassDesc).variables)) ; i_87++ {
    pvar_8 := cl_7.value.(*RangerAppClassDesc).variables[i_87];
    if  r_has_key_string_bool(declaredVariable, pvar_8.Get_name()) {
      continue;
    }
    wr_5.out("public ", false);
    this.writeVarDef(pvar_8.Get_node().value.(*CodeNode), ctx, wr_5);
  }
  if  cl_7.value.(*RangerAppClassDesc).has_constructor {
    var constr_2 *GoNullable = new(GoNullable); 
    constr_2.value = cl_7.value.(*RangerAppClassDesc).constructor_fn.value;
    constr_2.has_value = cl_7.value.(*RangerAppClassDesc).constructor_fn.has_value;
    wr_5.out("", true);
    wr_5.out(strings.Join([]string{ cl_7.value.(*RangerAppClassDesc).name,"(" }, ""), false);
    this.writeArgsDef(constr_2.value.(*RangerAppFunctionDesc), ctx, wr_5);
    wr_5.out(" ) {", true);
    wr_5.indent(1);
    wr_5.newline();
    var subCtx_15 *RangerAppWriterContext = constr_2.value.(*RangerAppFunctionDesc).fnCtx.value.(*RangerAppWriterContext);
    subCtx_15.is_function = true; 
    this.WalkNode(constr_2.value.(*RangerAppFunctionDesc).fnBody.value.(*CodeNode), subCtx_15, wr_5);
    wr_5.newline();
    wr_5.indent(-1);
    wr_5.out("}", true);
  }
  var i_90 int64 = 0;  
  for ; i_90 < int64(len(cl_7.value.(*RangerAppClassDesc).static_methods)) ; i_90++ {
    variant_2 := cl_7.value.(*RangerAppClassDesc).static_methods[i_90];
    wr_5.out("", true);
    if  variant_2.nameNode.value.(*CodeNode).hasFlag("main") {
      wr_5.out("public static void main(String [] args ) {", true);
    } else {
      wr_5.out("public static ", false);
      this.writeTypeDef(variant_2.nameNode.value.(*CodeNode), ctx, wr_5);
      wr_5.out(" ", false);
      wr_5.out(strings.Join([]string{ variant_2.name,"(" }, ""), false);
      this.writeArgsDef(variant_2, ctx, wr_5);
      wr_5.out(") {", true);
    }
    wr_5.indent(1);
    wr_5.newline();
    var subCtx_20 *RangerAppWriterContext = variant_2.fnCtx.value.(*RangerAppWriterContext);
    subCtx_20.is_function = true; 
    this.WalkNode(variant_2.fnBody.value.(*CodeNode), subCtx_20, wr_5);
    wr_5.newline();
    wr_5.indent(-1);
    wr_5.out("}", true);
  }
  var i_93 int64 = 0;  
  for ; i_93 < int64(len(cl_7.value.(*RangerAppClassDesc).defined_variants)) ; i_93++ {
    fnVar_2 := cl_7.value.(*RangerAppClassDesc).defined_variants[i_93];
    var mVs_2 *GoNullable = new(GoNullable); 
    mVs_2 = r_get_string_RangerAppMethodVariants(cl_7.value.(*RangerAppClassDesc).method_variants, fnVar_2);
    var i_100 int64 = 0;  
    for ; i_100 < int64(len(mVs_2.value.(*RangerAppMethodVariants).variants)) ; i_100++ {
      variant_7 := mVs_2.value.(*RangerAppMethodVariants).variants[i_100];
      wr_5.out("", true);
      wr_5.out("public ", false);
      this.writeTypeDef(variant_7.nameNode.value.(*CodeNode), ctx, wr_5);
      wr_5.out(" ", false);
      wr_5.out(strings.Join([]string{ variant_7.name,"(" }, ""), false);
      this.writeArgsDef(variant_7, ctx, wr_5);
      wr_5.out(") {", true);
      wr_5.indent(1);
      wr_5.newline();
      var subCtx_23 *RangerAppWriterContext = variant_7.fnCtx.value.(*RangerAppWriterContext);
      subCtx_23.is_function = true; 
      this.WalkNode(variant_7.fnBody.value.(*CodeNode), subCtx_23, wr_5);
      wr_5.newline();
      wr_5.indent(-1);
      wr_5.out("}", true);
    }
  }
  wr_5.indent(-1);
  wr_5.out("}", true);
  var import_list []string = wr_5.getImports();
  var i_99 int64 = 0;  
  for ; i_99 < int64(len(import_list)) ; i_99++ {
    codeStr := import_list[i_99];
    importFork.out(strings.Join([]string{ (strings.Join([]string{ "import ",codeStr }, "")),";" }, ""), true);
  }
}
// inherited methods from parent class RangerGenericClassWriter
func (this *RangerJava7ClassWriter) EncodeString (node *CodeNode, ctx *RangerAppWriterContext, wr *CodeWriter) string {
  /** unused:  encoded_str_2*/
  var str_length_2 int64 = int64(len(node.string_value));
  var encoded_str_8 string = "";
  var ii_11 int64 = 0;
  for ii_11 < str_length_2 {var cc_4 int64 = int64(node.string_value[ii_11]);
    switch (cc_4 ) { 
      case 8 : 
        encoded_str_8 = strings.Join([]string{ (strings.Join([]string{ encoded_str_8,(string([] byte{byte(92)})) }, "")),(string([] byte{byte(98)})) }, ""); 
      case 9 : 
        encoded_str_8 = strings.Join([]string{ (strings.Join([]string{ encoded_str_8,(string([] byte{byte(92)})) }, "")),(string([] byte{byte(116)})) }, ""); 
      case 10 : 
        encoded_str_8 = strings.Join([]string{ (strings.Join([]string{ encoded_str_8,(string([] byte{byte(92)})) }, "")),(string([] byte{byte(110)})) }, ""); 
      case 12 : 
        encoded_str_8 = strings.Join([]string{ (strings.Join([]string{ encoded_str_8,(string([] byte{byte(92)})) }, "")),(string([] byte{byte(102)})) }, ""); 
      case 13 : 
        encoded_str_8 = strings.Join([]string{ (strings.Join([]string{ encoded_str_8,(string([] byte{byte(92)})) }, "")),(string([] byte{byte(114)})) }, ""); 
      case 34 : 
        encoded_str_8 = strings.Join([]string{ (strings.Join([]string{ encoded_str_8,(string([] byte{byte(92)})) }, "")),(string([] byte{byte(34)})) }, ""); 
      case 92 : 
        encoded_str_8 = strings.Join([]string{ (strings.Join([]string{ encoded_str_8,(string([] byte{byte(92)})) }, "")),(string([] byte{byte(92)})) }, ""); 
      default: 
        encoded_str_8 = strings.Join([]string{ encoded_str_8,(string([] byte{byte(cc_4)})) }, ""); 
    }
    ii_11 = ii_11 + 1; 
  }
  return encoded_str_8;
}
func (this *RangerJava7ClassWriter) WriteSetterVRef (node *CodeNode, ctx *RangerAppWriterContext, wr *CodeWriter) () {
}
func (this *RangerJava7ClassWriter) writeArrayTypeDef (node *CodeNode, ctx *RangerAppWriterContext, wr *CodeWriter) () {
}
func (this *RangerJava7ClassWriter) WriteEnum (node *CodeNode, ctx *RangerAppWriterContext, wr *CodeWriter) () {
  if  node.eval_type == 11 {
    var rootObjName_2 string = node.ns[0];
    var e_8 *GoNullable = new(GoNullable); 
    e_8 = ctx.getEnum(rootObjName_2);
    if  e_8.has_value {
      var enumName_2 string = node.ns[1];
      wr.out(strings.Join([]string{ "",strconv.FormatInt(((r_get_string_int64(e_8.value.(*RangerAppEnum).values, enumName_2)).value.(int64)), 10) }, ""), false);
    } else {
      if  node.hasParamDesc {
        var pp_4 *GoNullable = new(GoNullable); 
        pp_4.value = node.paramDesc.value;
        pp_4.has_value = node.paramDesc.has_value;
        var nn_8 *GoNullable = new(GoNullable); 
        nn_8.value = pp_4.value.(IFACE_RangerAppParamDesc).Get_nameNode().value;
        nn_8.has_value = pp_4.value.(IFACE_RangerAppParamDesc).Get_nameNode().has_value;
        this.WriteVRef(nn_8.value.(*CodeNode), ctx, wr);
      }
    }
  }
}
func (this *RangerJava7ClassWriter) WriteScalarValue (node *CodeNode, ctx *RangerAppWriterContext, wr *CodeWriter) () {
  switch (node.value_type ) { 
    case 2 : 
      wr.out(strings.Join([]string{ "",strconv.FormatFloat(node.double_value,'f', 6, 64) }, ""), false);
    case 4 : 
      var s_18 string = this.EncodeString(node, ctx, wr);
      wr.out(strings.Join([]string{ (strings.Join([]string{ "\"",s_18 }, "")),"\"" }, ""), false);
    case 3 : 
      wr.out(strings.Join([]string{ "",strconv.FormatInt(node.int_value, 10) }, ""), false);
    case 5 : 
      if  node.boolean_value {
        wr.out("true", false);
      } else {
        wr.out("false", false);
      }
  }
}
func (this *RangerJava7ClassWriter) import_lib (lib_name string, ctx *RangerAppWriterContext, wr *CodeWriter) () {
  wr.addImport(lib_name);
}
func (this *RangerJava7ClassWriter) release_local_vars (node *CodeNode, ctx *RangerAppWriterContext, wr *CodeWriter) () {
  var i_61 int64 = 0;  
  for ; i_61 < int64(len(ctx.localVarNames)) ; i_61++ {
    n_7 := ctx.localVarNames[i_61];
    var p_14 *GoNullable = new(GoNullable); 
    p_14 = r_get_string_IFACE_RangerAppParamDesc(ctx.localVariables, n_7);
    if  p_14.value.(IFACE_RangerAppParamDesc).Get_ref_cnt() == 0 {
      continue;
    }
    if  p_14.value.(IFACE_RangerAppParamDesc).isAllocatedType() {
      if  1 == p_14.value.(IFACE_RangerAppParamDesc).getStrength() {
        if  p_14.value.(IFACE_RangerAppParamDesc).Get_nameNode().value.(*CodeNode).eval_type == 7 {
        }
        if  p_14.value.(IFACE_RangerAppParamDesc).Get_nameNode().value.(*CodeNode).eval_type == 6 {
        }
        if  (p_14.value.(IFACE_RangerAppParamDesc).Get_nameNode().value.(*CodeNode).eval_type != 6) && (p_14.value.(IFACE_RangerAppParamDesc).Get_nameNode().value.(*CodeNode).eval_type != 7) {
        }
      }
      if  0 == p_14.value.(IFACE_RangerAppParamDesc).getStrength() {
        if  p_14.value.(IFACE_RangerAppParamDesc).Get_nameNode().value.(*CodeNode).eval_type == 7 {
        }
        if  p_14.value.(IFACE_RangerAppParamDesc).Get_nameNode().value.(*CodeNode).eval_type == 6 {
        }
        if  (p_14.value.(IFACE_RangerAppParamDesc).Get_nameNode().value.(*CodeNode).eval_type != 6) && (p_14.value.(IFACE_RangerAppParamDesc).Get_nameNode().value.(*CodeNode).eval_type != 7) {
        }
      }
    }
  }
  if  ctx.is_function {
    return;
  }
  if  ctx.parent.has_value {
    this.release_local_vars(node, ctx.parent.value.(*RangerAppWriterContext), wr);
  }
}
func (this *RangerJava7ClassWriter) WalkNode (node *CodeNode, ctx *RangerAppWriterContext, wr *CodeWriter) () {
  this.compiler.value.(*LiveCompiler).WalkNode(node, ctx, wr);
}
func (this *RangerJava7ClassWriter) writeRawTypeDef (node *CodeNode, ctx *RangerAppWriterContext, wr *CodeWriter) () {
  this.writeTypeDef(node, ctx, wr);
}
func (this *RangerJava7ClassWriter) writeFnCall (node *CodeNode, ctx *RangerAppWriterContext, wr *CodeWriter) () {
  if  node.hasFnCall {
    var fc_20 *CodeNode = node.getFirst();
    this.WriteVRef(fc_20, ctx, wr);
    wr.out("(", false);
    var givenArgs_2 *CodeNode = node.getSecond();
    ctx.setInExpr();
    var i_68 int64 = 0;  
    for ; i_68 < int64(len(node.fnDesc.value.(*RangerAppFunctionDesc).params)) ; i_68++ {
      arg_12 := node.fnDesc.value.(*RangerAppFunctionDesc).params[i_68];
      if  i_68 > 0 {
        wr.out(", ", false);
      }
      if  (int64(len(givenArgs_2.children))) <= i_68 {
        var defVal *GoNullable = new(GoNullable); 
        defVal = arg_12.Get_nameNode().value.(*CodeNode).getFlag("default");
        if  defVal.has_value {
          var fc_31 *CodeNode = defVal.value.(*CodeNode).vref_annotation.value.(*CodeNode).getFirst();
          this.WalkNode(fc_31, ctx, wr);
        } else {
          ctx.addError(node, "Default argument was missing");
        }
        continue;
      }
      var n_10 *CodeNode = givenArgs_2.children[i_68];
      this.WalkNode(n_10, ctx, wr);
    }
    ctx.unsetInExpr();
    wr.out(")", false);
    if  ctx.expressionLevel() == 0 {
      wr.out(";", true);
    }
  }
}
func (this *RangerJava7ClassWriter) writeNewCall (node *CodeNode, ctx *RangerAppWriterContext, wr *CodeWriter) () {
  if  node.hasNewOper {
    var cl_2 *GoNullable = new(GoNullable); 
    cl_2.value = node.clDesc.value;
    cl_2.has_value = node.clDesc.has_value;
    /** unused:  fc_25*/
    wr.out(strings.Join([]string{ "new ",node.clDesc.value.(*RangerAppClassDesc).name }, ""), false);
    wr.out("(", false);
    var constr *GoNullable = new(GoNullable); 
    constr.value = cl_2.value.(*RangerAppClassDesc).constructor_fn.value;
    constr.has_value = cl_2.value.(*RangerAppClassDesc).constructor_fn.has_value;
    var givenArgs_5 *CodeNode = node.getThird();
    if  constr.has_value {
      var i_70 int64 = 0;  
      for ; i_70 < int64(len(constr.value.(*RangerAppFunctionDesc).params)) ; i_70++ {
        arg_15 := constr.value.(*RangerAppFunctionDesc).params[i_70];
        var n_12 *CodeNode = givenArgs_5.children[i_70];
        if  i_70 > 0 {
          wr.out(", ", false);
        }
        if  true || (arg_15.Get_nameNode().has_value) {
          this.WalkNode(n_12, ctx, wr);
        }
      }
    }
    wr.out(")", false);
  }
}
// getter for variable compiler
func (this *RangerJava7ClassWriter) Get_compiler() *GoNullable {
  return this.compiler
}
// setter for variable compiler
func (this *RangerJava7ClassWriter) Set_compiler( value *GoNullable)  {
  this.compiler = value 
}
// inherited getters and setters from the parent class RangerGenericClassWriter
type RangerSwift3ClassWriter struct { 
  compiler *GoNullable /**  unused  **/ 
  // inherited from parent class RangerGenericClassWriter
}
type IFACE_RangerSwift3ClassWriter interface { 
  Get_compiler() *GoNullable
  Set_compiler(value *GoNullable) 
  adjustType(tn string) string
  getObjectTypeString(type_string string, ctx *RangerAppWriterContext) string
  getTypeString(type_string string) string
  writeTypeDef(node *CodeNode, ctx *RangerAppWriterContext, wr *CodeWriter) ()
  WriteEnum(node *CodeNode, ctx *RangerAppWriterContext, wr *CodeWriter) ()
  WriteVRef(node *CodeNode, ctx *RangerAppWriterContext, wr *CodeWriter) ()
  writeVarDef(node *CodeNode, ctx *RangerAppWriterContext, wr *CodeWriter) ()
  writeArgsDef(fnDesc *RangerAppFunctionDesc, ctx *RangerAppWriterContext, wr *CodeWriter) ()
  writeFnCall(node *CodeNode, ctx *RangerAppWriterContext, wr *CodeWriter) ()
  writeNewCall(node *CodeNode, ctx *RangerAppWriterContext, wr *CodeWriter) ()
  haveSameSig(fn1 *RangerAppFunctionDesc, fn2 *RangerAppFunctionDesc, ctx *RangerAppWriterContext) bool
  writeClass(node *CodeNode, ctx *RangerAppWriterContext, wr *CodeWriter) ()
}

func CreateNew_RangerSwift3ClassWriter() *RangerSwift3ClassWriter {
  me := new(RangerSwift3ClassWriter)
  me.compiler = new(GoNullable);
  me.compiler = new(GoNullable);
  return me;
}
func (this *RangerSwift3ClassWriter) adjustType (tn string) string {
  if  tn == "this" {
    return "self";
  }
  return tn;
}
func (this *RangerSwift3ClassWriter) getObjectTypeString (type_string string, ctx *RangerAppWriterContext) string {
  switch (type_string ) { 
    case "int" : 
      return "Int";
    case "string" : 
      return "String";
    case "chararray" : 
      return "[UInt8]";
    case "char" : 
      return "UInt8";
    case "boolean" : 
      return "Bool";
    case "double" : 
      return "Double";
  }
  return type_string;
}
func (this *RangerSwift3ClassWriter) getTypeString (type_string string) string {
  switch (type_string ) { 
    case "int" : 
      return "Int";
    case "string" : 
      return "String";
    case "boolean" : 
      return "Bool";
    case "double" : 
      return "Double";
  }
  return type_string;
}
func (this *RangerSwift3ClassWriter) writeTypeDef (node *CodeNode, ctx *RangerAppWriterContext, wr *CodeWriter) () {
  var v_type_2 int64 = node.value_type;
  if  node.eval_type != 0 {
    v_type_2 = node.eval_type; 
  }
  switch (v_type_2 ) { 
    case 11 : 
      wr.out("Int", false);
    case 3 : 
      wr.out("Int", false);
    case 2 : 
      wr.out("Double", false);
    case 4 : 
      wr.out("String", false);
    case 12 : 
      wr.out("UInt8", false);
    case 13 : 
      wr.out("[UInt8]", false);
    case 5 : 
      wr.out("Bool", false);
    case 7 : 
      wr.out(strings.Join([]string{ (strings.Join([]string{ (strings.Join([]string{ (strings.Join([]string{ "[",this.getObjectTypeString(node.key_type, ctx) }, "")),":" }, "")),this.getObjectTypeString(node.array_type, ctx) }, "")),"]" }, ""), false);
    case 6 : 
      wr.out(strings.Join([]string{ (strings.Join([]string{ "[",this.getObjectTypeString(node.array_type, ctx) }, "")),"]" }, ""), false);
    default: 
      if  node.type_name == "void" {
        wr.out("Void", false);
        return;
      }
      wr.out(this.getTypeString(node.type_name), false);
  }
  if  node.hasFlag("optional") {
    wr.out("?", false);
  }
}
func (this *RangerSwift3ClassWriter) WriteEnum (node *CodeNode, ctx *RangerAppWriterContext, wr *CodeWriter) () {
  if  node.eval_type == 11 {
    var rootObjName_5 string = node.ns[0];
    var e_11 *GoNullable = new(GoNullable); 
    e_11 = ctx.getEnum(rootObjName_5);
    if  e_11.has_value {
      var enumName_5 string = node.ns[1];
      wr.out(strings.Join([]string{ "",strconv.FormatInt(((r_get_string_int64(e_11.value.(*RangerAppEnum).values, enumName_5)).value.(int64)), 10) }, ""), false);
    } else {
      if  node.hasParamDesc {
        var pp_5 *GoNullable = new(GoNullable); 
        pp_5.value = node.paramDesc.value;
        pp_5.has_value = node.paramDesc.has_value;
        var nn_11 *GoNullable = new(GoNullable); 
        nn_11.value = pp_5.value.(IFACE_RangerAppParamDesc).Get_nameNode().value;
        nn_11.has_value = pp_5.value.(IFACE_RangerAppParamDesc).Get_nameNode().has_value;
        wr.out(nn_11.value.(*CodeNode).vref, false);
      }
    }
  }
}
func (this *RangerSwift3ClassWriter) WriteVRef (node *CodeNode, ctx *RangerAppWriterContext, wr *CodeWriter) () {
  if  node.vref == "this" {
    wr.out("self", false);
    return;
  }
  if  node.eval_type == 11 {
    if  (int64(len(node.ns))) > 1 {
      var rootObjName_8 string = node.ns[0];
      var enumName_8 string = node.ns[1];
      var e_14 *GoNullable = new(GoNullable); 
      e_14 = ctx.getEnum(rootObjName_8);
      if  e_14.has_value {
        wr.out(strings.Join([]string{ "",strconv.FormatInt(((r_get_string_int64(e_14.value.(*RangerAppEnum).values, enumName_8)).value.(int64)), 10) }, ""), false);
        return;
      }
    }
  }
  var max_len_2 int64 = int64(len(node.ns));
  if  (int64(len(node.nsp))) > 0 {
    var i_81 int64 = 0;  
    for ; i_81 < int64(len(node.nsp)) ; i_81++ {
      p_20 := node.nsp[i_81];
      if  i_81 == 0 {
        var part_4 string = node.ns[0];
        if  part_4 == "this" {
          wr.out("self", false);
          continue;
        }
      }
      if  i_81 > 0 {
        wr.out(".", false);
      }
      if  (int64(len(p_20.Get_compiledName()))) > 0 {
        wr.out(this.adjustType(p_20.Get_compiledName()), false);
      } else {
        if  (int64(len(p_20.Get_name()))) > 0 {
          wr.out(this.adjustType(p_20.Get_name()), false);
        } else {
          wr.out(this.adjustType((node.ns[i_81])), false);
        }
      }
      if  i_81 < (max_len_2 - 1) {
        if  p_20.Get_nameNode().value.(*CodeNode).hasFlag("optional") {
          wr.out("!", false);
        }
      }
    }
    return;
  }
  if  node.hasParamDesc {
    var p_25 *GoNullable = new(GoNullable); 
    p_25.value = node.paramDesc.value;
    p_25.has_value = node.paramDesc.has_value;
    wr.out(p_25.value.(IFACE_RangerAppParamDesc).Get_compiledName(), false);
    return;
  }
  var i_86 int64 = 0;  
  for ; i_86 < int64(len(node.ns)) ; i_86++ {
    part_9 := node.ns[i_86];
    if  i_86 > 0 {
      wr.out(".", false);
    }
    wr.out(this.adjustType(part_9), false);
  }
}
func (this *RangerSwift3ClassWriter) writeVarDef (node *CodeNode, ctx *RangerAppWriterContext, wr *CodeWriter) () {
  if  node.hasParamDesc {
    var nn_14 *CodeNode = node.children[1];
    var p_25 *GoNullable = new(GoNullable); 
    p_25.value = nn_14.paramDesc.value;
    p_25.has_value = nn_14.paramDesc.has_value;
    if  (p_25.value.(IFACE_RangerAppParamDesc).Get_ref_cnt() == 0) && (p_25.value.(IFACE_RangerAppParamDesc).Get_is_class_variable() == false) {
      wr.out("/** unused:  ", false);
    }
    if  (p_25.value.(IFACE_RangerAppParamDesc).Get_set_cnt() > 0) || p_25.value.(IFACE_RangerAppParamDesc).Get_is_class_variable() {
      wr.out(strings.Join([]string{ (strings.Join([]string{ "var ",p_25.value.(IFACE_RangerAppParamDesc).Get_compiledName() }, ""))," : " }, ""), false);
    } else {
      wr.out(strings.Join([]string{ (strings.Join([]string{ "let ",p_25.value.(IFACE_RangerAppParamDesc).Get_compiledName() }, ""))," : " }, ""), false);
    }
    this.writeTypeDef(p_25.value.(IFACE_RangerAppParamDesc).Get_nameNode().value.(*CodeNode), ctx, wr);
    if  (int64(len(node.children))) > 2 {
      wr.out(" = ", false);
      ctx.setInExpr();
      var value_5 *CodeNode = node.getThird();
      this.WalkNode(value_5, ctx, wr);
      ctx.unsetInExpr();
    } else {
      if  nn_14.value_type == 6 {
        wr.out(" = ", false);
        this.writeTypeDef(p_25.value.(IFACE_RangerAppParamDesc).Get_nameNode().value.(*CodeNode), ctx, wr);
        wr.out("()", false);
      }
      if  nn_14.value_type == 7 {
        wr.out(" = ", false);
        this.writeTypeDef(p_25.value.(IFACE_RangerAppParamDesc).Get_nameNode().value.(*CodeNode), ctx, wr);
        wr.out("()", false);
      }
    }
    if  (p_25.value.(IFACE_RangerAppParamDesc).Get_ref_cnt() == 0) && (p_25.value.(IFACE_RangerAppParamDesc).Get_is_class_variable() == true) {
      wr.out("     /** note: unused */", false);
    }
    if  (p_25.value.(IFACE_RangerAppParamDesc).Get_ref_cnt() == 0) && (p_25.value.(IFACE_RangerAppParamDesc).Get_is_class_variable() == false) {
      wr.out("   **/ ", true);
    } else {
      wr.newline();
    }
  }
}
func (this *RangerSwift3ClassWriter) writeArgsDef (fnDesc *RangerAppFunctionDesc, ctx *RangerAppWriterContext, wr *CodeWriter) () {
  var i_86 int64 = 0;  
  for ; i_86 < int64(len(fnDesc.params)) ; i_86++ {
    arg_15 := fnDesc.params[i_86];
    if  i_86 > 0 {
      wr.out(", ", false);
    }
    wr.out(strings.Join([]string{ arg_15.Get_name()," : " }, ""), false);
    this.writeTypeDef(arg_15.Get_nameNode().value.(*CodeNode), ctx, wr);
  }
}
func (this *RangerSwift3ClassWriter) writeFnCall (node *CodeNode, ctx *RangerAppWriterContext, wr *CodeWriter) () {
  if  node.hasFnCall {
    var fc_24 *CodeNode = node.getFirst();
    var fnName *GoNullable = new(GoNullable); 
    fnName.value = node.fnDesc.value.(*RangerAppFunctionDesc).nameNode.value;
    fnName.has_value = node.fnDesc.value.(*RangerAppFunctionDesc).nameNode.has_value;
    if  ctx.expressionLevel() == 0 {
      if  fnName.value.(*CodeNode).type_name != "void" {
        wr.out("_ = ", false);
      }
    }
    this.WriteVRef(fc_24, ctx, wr);
    wr.out("(", false);
    ctx.setInExpr();
    var givenArgs_4 *CodeNode = node.getSecond();
    var i_88 int64 = 0;  
    for ; i_88 < int64(len(node.fnDesc.value.(*RangerAppFunctionDesc).params)) ; i_88++ {
      arg_18 := node.fnDesc.value.(*RangerAppFunctionDesc).params[i_88];
      if  i_88 > 0 {
        wr.out(", ", false);
      }
      if  (int64(len(givenArgs_4.children))) <= i_88 {
        var defVal_2 *GoNullable = new(GoNullable); 
        defVal_2 = arg_18.Get_nameNode().value.(*CodeNode).getFlag("default");
        if  defVal_2.has_value {
          var fc_35 *CodeNode = defVal_2.value.(*CodeNode).vref_annotation.value.(*CodeNode).getFirst();
          this.WalkNode(fc_35, ctx, wr);
        } else {
          ctx.addError(node, "Default argument was missing");
        }
        continue;
      }
      var n_10 *CodeNode = givenArgs_4.children[i_88];
      wr.out(strings.Join([]string{ arg_18.Get_name()," : " }, ""), false);
      this.WalkNode(n_10, ctx, wr);
    }
    ctx.unsetInExpr();
    wr.out(")", false);
    if  ctx.expressionLevel() == 0 {
      wr.newline();
    }
  }
}
func (this *RangerSwift3ClassWriter) writeNewCall (node *CodeNode, ctx *RangerAppWriterContext, wr *CodeWriter) () {
  if  node.hasNewOper {
    var cl_6 *GoNullable = new(GoNullable); 
    cl_6.value = node.clDesc.value;
    cl_6.has_value = node.clDesc.has_value;
    /** unused:  fc_29*/
    wr.out(node.clDesc.value.(*RangerAppClassDesc).name, false);
    wr.out("(", false);
    var constr_3 *GoNullable = new(GoNullable); 
    constr_3.value = cl_6.value.(*RangerAppClassDesc).constructor_fn.value;
    constr_3.has_value = cl_6.value.(*RangerAppClassDesc).constructor_fn.has_value;
    var givenArgs_7 *CodeNode = node.getThird();
    if  constr_3.has_value {
      var i_90 int64 = 0;  
      for ; i_90 < int64(len(constr_3.value.(*RangerAppFunctionDesc).params)) ; i_90++ {
        arg_20 := constr_3.value.(*RangerAppFunctionDesc).params[i_90];
        var n_13 *CodeNode = givenArgs_7.children[i_90];
        if  i_90 > 0 {
          wr.out(", ", false);
        }
        wr.out(strings.Join([]string{ arg_20.Get_name()," : " }, ""), false);
        this.WalkNode(n_13, ctx, wr);
      }
    }
    wr.out(")", false);
  }
}
func (this *RangerSwift3ClassWriter) haveSameSig (fn1 *RangerAppFunctionDesc, fn2 *RangerAppFunctionDesc, ctx *RangerAppWriterContext) bool {
  if  fn1.name != fn2.name {
    return false;
  }
  var match_3 *RangerArgMatch = CreateNew_RangerArgMatch();
  var n1_2 *CodeNode = fn1.nameNode.value.(*CodeNode);
  var n2_2 *CodeNode = fn1.nameNode.value.(*CodeNode);
  if  match_3.doesDefsMatch(n1_2, n2_2, ctx) == false {
    return false;
  }
  if  (int64(len(fn1.params))) != (int64(len(fn2.params))) {
    return false;
  }
  var i_92 int64 = 0;  
  for ; i_92 < int64(len(fn1.params)) ; i_92++ {
    p_27 := fn1.params[i_92];
    var p2_2 IFACE_RangerAppParamDesc = fn2.params[i_92];
    if  match_3.doesDefsMatch((p_27.Get_nameNode().value.(*CodeNode)), (p2_2.Get_nameNode().value.(*CodeNode)), ctx) == false {
      return false;
    }
  }
  return true;
}
func (this *RangerSwift3ClassWriter) writeClass (node *CodeNode, ctx *RangerAppWriterContext, wr *CodeWriter) () {
  var cl_9 *GoNullable = new(GoNullable); 
  cl_9.value = node.clDesc.value;
  cl_9.has_value = node.clDesc.has_value;
  if  !cl_9.has_value  {
    return;
  }
  wr.out(strings.Join([]string{ "class ",cl_9.value.(*RangerAppClassDesc).name }, ""), false);
  var parentClass_2 *GoNullable = new(GoNullable); 
  if  (int64(len(cl_9.value.(*RangerAppClassDesc).extends_classes))) > 0 {
    wr.out(" : ", false);
    var i_94 int64 = 0;  
    for ; i_94 < int64(len(cl_9.value.(*RangerAppClassDesc).extends_classes)) ; i_94++ {
      pName_3 := cl_9.value.(*RangerAppClassDesc).extends_classes[i_94];
      wr.out(pName_3, false);
      parentClass_2.value = ctx.findClass(pName_3);
      parentClass_2.has_value = true; /* detected as non-optional */
    }
  }
  wr.out(" { ", true);
  wr.indent(1);
  var i_98 int64 = 0;  
  for ; i_98 < int64(len(cl_9.value.(*RangerAppClassDesc).variables)) ; i_98++ {
    pvar_5 := cl_9.value.(*RangerAppClassDesc).variables[i_98];
    this.writeVarDef(pvar_5.Get_node().value.(*CodeNode), ctx, wr);
  }
  if  cl_9.value.(*RangerAppClassDesc).has_constructor {
    var constr_6 *GoNullable = new(GoNullable); 
    constr_6.value = cl_9.value.(*RangerAppClassDesc).constructor_fn.value;
    constr_6.has_value = cl_9.value.(*RangerAppClassDesc).constructor_fn.has_value;
    var b_must_override bool = false;
    if ( parentClass_2.has_value) {
      if  (int64(len(constr_6.value.(*RangerAppFunctionDesc).params))) == 0 {
        b_must_override = true; 
      } else {
        if  parentClass_2.value.(*RangerAppClassDesc).has_constructor {
          var p_constr *RangerAppFunctionDesc = parentClass_2.value.(*RangerAppClassDesc).constructor_fn.value.(*RangerAppFunctionDesc);
          if  this.haveSameSig((constr_6.value.(*RangerAppFunctionDesc)), p_constr, ctx) {
            b_must_override = true; 
          }
        }
      }
    }
    if  b_must_override {
      wr.out("override ", false);
    }
    wr.out("init(", false);
    this.writeArgsDef(constr_6.value.(*RangerAppFunctionDesc), ctx, wr);
    wr.out(" ) {", true);
    wr.indent(1);
    if ( parentClass_2.has_value) {
      wr.out("super.init()", true);
    }
    wr.newline();
    var subCtx_18 *RangerAppWriterContext = constr_6.value.(*RangerAppFunctionDesc).fnCtx.value.(*RangerAppWriterContext);
    subCtx_18.is_function = true; 
    this.WalkNode(constr_6.value.(*RangerAppFunctionDesc).fnBody.value.(*CodeNode), subCtx_18, wr);
    wr.newline();
    wr.indent(-1);
    wr.out("}", true);
  }
  var i_101 int64 = 0;  
  for ; i_101 < int64(len(cl_9.value.(*RangerAppClassDesc).static_methods)) ; i_101++ {
    variant_4 := cl_9.value.(*RangerAppClassDesc).static_methods[i_101];
    if  variant_4.nameNode.value.(*CodeNode).hasFlag("main") {
      continue;
    }
    wr.out(strings.Join([]string{ (strings.Join([]string{ "static func ",variant_4.name }, "")),"(" }, ""), false);
    this.writeArgsDef(variant_4, ctx, wr);
    wr.out(") -> ", false);
    this.writeTypeDef(variant_4.nameNode.value.(*CodeNode), ctx, wr);
    wr.out(" {", true);
    wr.indent(1);
    wr.newline();
    var subCtx_23 *RangerAppWriterContext = variant_4.fnCtx.value.(*RangerAppWriterContext);
    subCtx_23.is_function = true; 
    this.WalkNode(variant_4.fnBody.value.(*CodeNode), subCtx_23, wr);
    wr.newline();
    wr.indent(-1);
    wr.out("}", true);
  }
  var i_104 int64 = 0;  
  for ; i_104 < int64(len(cl_9.value.(*RangerAppClassDesc).defined_variants)) ; i_104++ {
    fnVar_3 := cl_9.value.(*RangerAppClassDesc).defined_variants[i_104];
    var mVs_3 *GoNullable = new(GoNullable); 
    mVs_3 = r_get_string_RangerAppMethodVariants(cl_9.value.(*RangerAppClassDesc).method_variants, fnVar_3);
    var i_111 int64 = 0;  
    for ; i_111 < int64(len(mVs_3.value.(*RangerAppMethodVariants).variants)) ; i_111++ {
      variant_9 := mVs_3.value.(*RangerAppMethodVariants).variants[i_111];
      wr.out(strings.Join([]string{ (strings.Join([]string{ "func ",variant_9.name }, "")),"(" }, ""), false);
      this.writeArgsDef(variant_9, ctx, wr);
      wr.out(") -> ", false);
      this.writeTypeDef(variant_9.nameNode.value.(*CodeNode), ctx, wr);
      wr.out(" {", true);
      wr.indent(1);
      wr.newline();
      var subCtx_26 *RangerAppWriterContext = variant_9.fnCtx.value.(*RangerAppWriterContext);
      subCtx_26.is_function = true; 
      this.WalkNode(variant_9.fnBody.value.(*CodeNode), subCtx_26, wr);
      wr.newline();
      wr.indent(-1);
      wr.out("}", true);
    }
  }
  wr.indent(-1);
  wr.out("}", true);
  var i_110 int64 = 0;  
  for ; i_110 < int64(len(cl_9.value.(*RangerAppClassDesc).static_methods)) ; i_110++ {
    variant_12 := cl_9.value.(*RangerAppClassDesc).static_methods[i_110];
    var b_3 bool = variant_12.nameNode.value.(*CodeNode).hasFlag("main");
    if  b_3 {
      wr.newline();
      var subCtx_29 *RangerAppWriterContext = variant_12.fnCtx.value.(*RangerAppWriterContext);
      subCtx_29.is_function = true; 
      this.WalkNode(variant_12.fnBody.value.(*CodeNode), subCtx_29, wr);
      wr.newline();
    }
  }
}
// inherited methods from parent class RangerGenericClassWriter
func (this *RangerSwift3ClassWriter) EncodeString (node *CodeNode, ctx *RangerAppWriterContext, wr *CodeWriter) string {
  /** unused:  encoded_str_2*/
  var str_length_2 int64 = int64(len(node.string_value));
  var encoded_str_8 string = "";
  var ii_11 int64 = 0;
  for ii_11 < str_length_2 {var cc_4 int64 = int64(node.string_value[ii_11]);
    switch (cc_4 ) { 
      case 8 : 
        encoded_str_8 = strings.Join([]string{ (strings.Join([]string{ encoded_str_8,(string([] byte{byte(92)})) }, "")),(string([] byte{byte(98)})) }, ""); 
      case 9 : 
        encoded_str_8 = strings.Join([]string{ (strings.Join([]string{ encoded_str_8,(string([] byte{byte(92)})) }, "")),(string([] byte{byte(116)})) }, ""); 
      case 10 : 
        encoded_str_8 = strings.Join([]string{ (strings.Join([]string{ encoded_str_8,(string([] byte{byte(92)})) }, "")),(string([] byte{byte(110)})) }, ""); 
      case 12 : 
        encoded_str_8 = strings.Join([]string{ (strings.Join([]string{ encoded_str_8,(string([] byte{byte(92)})) }, "")),(string([] byte{byte(102)})) }, ""); 
      case 13 : 
        encoded_str_8 = strings.Join([]string{ (strings.Join([]string{ encoded_str_8,(string([] byte{byte(92)})) }, "")),(string([] byte{byte(114)})) }, ""); 
      case 34 : 
        encoded_str_8 = strings.Join([]string{ (strings.Join([]string{ encoded_str_8,(string([] byte{byte(92)})) }, "")),(string([] byte{byte(34)})) }, ""); 
      case 92 : 
        encoded_str_8 = strings.Join([]string{ (strings.Join([]string{ encoded_str_8,(string([] byte{byte(92)})) }, "")),(string([] byte{byte(92)})) }, ""); 
      default: 
        encoded_str_8 = strings.Join([]string{ encoded_str_8,(string([] byte{byte(cc_4)})) }, ""); 
    }
    ii_11 = ii_11 + 1; 
  }
  return encoded_str_8;
}
func (this *RangerSwift3ClassWriter) CustomOperator (node *CodeNode, ctx *RangerAppWriterContext, wr *CodeWriter) () {
}
func (this *RangerSwift3ClassWriter) WriteSetterVRef (node *CodeNode, ctx *RangerAppWriterContext, wr *CodeWriter) () {
}
func (this *RangerSwift3ClassWriter) writeArrayTypeDef (node *CodeNode, ctx *RangerAppWriterContext, wr *CodeWriter) () {
}
func (this *RangerSwift3ClassWriter) WriteScalarValue (node *CodeNode, ctx *RangerAppWriterContext, wr *CodeWriter) () {
  switch (node.value_type ) { 
    case 2 : 
      wr.out(strings.Join([]string{ "",strconv.FormatFloat(node.double_value,'f', 6, 64) }, ""), false);
    case 4 : 
      var s_18 string = this.EncodeString(node, ctx, wr);
      wr.out(strings.Join([]string{ (strings.Join([]string{ "\"",s_18 }, "")),"\"" }, ""), false);
    case 3 : 
      wr.out(strings.Join([]string{ "",strconv.FormatInt(node.int_value, 10) }, ""), false);
    case 5 : 
      if  node.boolean_value {
        wr.out("true", false);
      } else {
        wr.out("false", false);
      }
  }
}
func (this *RangerSwift3ClassWriter) import_lib (lib_name string, ctx *RangerAppWriterContext, wr *CodeWriter) () {
  wr.addImport(lib_name);
}
func (this *RangerSwift3ClassWriter) release_local_vars (node *CodeNode, ctx *RangerAppWriterContext, wr *CodeWriter) () {
  var i_61 int64 = 0;  
  for ; i_61 < int64(len(ctx.localVarNames)) ; i_61++ {
    n_7 := ctx.localVarNames[i_61];
    var p_14 *GoNullable = new(GoNullable); 
    p_14 = r_get_string_IFACE_RangerAppParamDesc(ctx.localVariables, n_7);
    if  p_14.value.(IFACE_RangerAppParamDesc).Get_ref_cnt() == 0 {
      continue;
    }
    if  p_14.value.(IFACE_RangerAppParamDesc).isAllocatedType() {
      if  1 == p_14.value.(IFACE_RangerAppParamDesc).getStrength() {
        if  p_14.value.(IFACE_RangerAppParamDesc).Get_nameNode().value.(*CodeNode).eval_type == 7 {
        }
        if  p_14.value.(IFACE_RangerAppParamDesc).Get_nameNode().value.(*CodeNode).eval_type == 6 {
        }
        if  (p_14.value.(IFACE_RangerAppParamDesc).Get_nameNode().value.(*CodeNode).eval_type != 6) && (p_14.value.(IFACE_RangerAppParamDesc).Get_nameNode().value.(*CodeNode).eval_type != 7) {
        }
      }
      if  0 == p_14.value.(IFACE_RangerAppParamDesc).getStrength() {
        if  p_14.value.(IFACE_RangerAppParamDesc).Get_nameNode().value.(*CodeNode).eval_type == 7 {
        }
        if  p_14.value.(IFACE_RangerAppParamDesc).Get_nameNode().value.(*CodeNode).eval_type == 6 {
        }
        if  (p_14.value.(IFACE_RangerAppParamDesc).Get_nameNode().value.(*CodeNode).eval_type != 6) && (p_14.value.(IFACE_RangerAppParamDesc).Get_nameNode().value.(*CodeNode).eval_type != 7) {
        }
      }
    }
  }
  if  ctx.is_function {
    return;
  }
  if  ctx.parent.has_value {
    this.release_local_vars(node, ctx.parent.value.(*RangerAppWriterContext), wr);
  }
}
func (this *RangerSwift3ClassWriter) WalkNode (node *CodeNode, ctx *RangerAppWriterContext, wr *CodeWriter) () {
  this.compiler.value.(*LiveCompiler).WalkNode(node, ctx, wr);
}
func (this *RangerSwift3ClassWriter) writeRawTypeDef (node *CodeNode, ctx *RangerAppWriterContext, wr *CodeWriter) () {
  this.writeTypeDef(node, ctx, wr);
}
// getter for variable compiler
func (this *RangerSwift3ClassWriter) Get_compiler() *GoNullable {
  return this.compiler
}
// setter for variable compiler
func (this *RangerSwift3ClassWriter) Set_compiler( value *GoNullable)  {
  this.compiler = value 
}
// inherited getters and setters from the parent class RangerGenericClassWriter
type RangerKotlinClassWriter struct { 
  compiler *GoNullable /**  unused  **/ 
  // inherited from parent class RangerGenericClassWriter
}
type IFACE_RangerKotlinClassWriter interface { 
  Get_compiler() *GoNullable
  Set_compiler(value *GoNullable) 
  WriteScalarValue(node *CodeNode, ctx *RangerAppWriterContext, wr *CodeWriter) ()
  adjustType(tn string) string
  getObjectTypeString(type_string string, ctx *RangerAppWriterContext) string
  getTypeString(type_string string) string
  writeTypeDef(node *CodeNode, ctx *RangerAppWriterContext, wr *CodeWriter) ()
  WriteVRef(node *CodeNode, ctx *RangerAppWriterContext, wr *CodeWriter) ()
  writeVarDef(node *CodeNode, ctx *RangerAppWriterContext, wr *CodeWriter) ()
  writeArgsDef(fnDesc *RangerAppFunctionDesc, ctx *RangerAppWriterContext, wr *CodeWriter) ()
  writeFnCall(node *CodeNode, ctx *RangerAppWriterContext, wr *CodeWriter) ()
  writeNewCall(node *CodeNode, ctx *RangerAppWriterContext, wr *CodeWriter) ()
  writeClass(node *CodeNode, ctx *RangerAppWriterContext, orig_wr *CodeWriter) ()
}

func CreateNew_RangerKotlinClassWriter() *RangerKotlinClassWriter {
  me := new(RangerKotlinClassWriter)
  me.compiler = new(GoNullable);
  me.compiler = new(GoNullable);
  return me;
}
func (this *RangerKotlinClassWriter) WriteScalarValue (node *CodeNode, ctx *RangerAppWriterContext, wr *CodeWriter) () {
  switch (node.value_type ) { 
    case 2 : 
      wr.out(node.getParsedString(), false);
    case 4 : 
      var s_19 string = this.EncodeString(node, ctx, wr);
      wr.out(strings.Join([]string{ (strings.Join([]string{ "\"",s_19 }, "")),"\"" }, ""), false);
    case 3 : 
      wr.out(strings.Join([]string{ "",strconv.FormatInt(node.int_value, 10) }, ""), false);
    case 5 : 
      if  node.boolean_value {
        wr.out("true", false);
      } else {
        wr.out("false", false);
      }
  }
}
func (this *RangerKotlinClassWriter) adjustType (tn string) string {
  if  tn == "this" {
    return "this";
  }
  return tn;
}
func (this *RangerKotlinClassWriter) getObjectTypeString (type_string string, ctx *RangerAppWriterContext) string {
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
  }
  return type_string;
}
func (this *RangerKotlinClassWriter) getTypeString (type_string string) string {
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
  }
  return type_string;
}
func (this *RangerKotlinClassWriter) writeTypeDef (node *CodeNode, ctx *RangerAppWriterContext, wr *CodeWriter) () {
  var v_type_3 int64 = node.value_type;
  if  node.eval_type != 0 {
    v_type_3 = node.eval_type; 
  }
  switch (v_type_3 ) { 
    case 11 : 
      wr.out("Int", false);
    case 3 : 
      wr.out("Int", false);
    case 2 : 
      wr.out("Double", false);
    case 12 : 
      wr.out("Char", false);
    case 13 : 
      wr.out("CharArray", false);
    case 4 : 
      wr.out("String", false);
    case 5 : 
      wr.out("Boolean", false);
    case 7 : 
      wr.out(strings.Join([]string{ (strings.Join([]string{ (strings.Join([]string{ (strings.Join([]string{ "MutableMap<",this.getObjectTypeString(node.key_type, ctx) }, "")),"," }, "")),this.getObjectTypeString(node.array_type, ctx) }, "")),">" }, ""), false);
    case 6 : 
      wr.out(strings.Join([]string{ (strings.Join([]string{ "MutableList<",this.getObjectTypeString(node.array_type, ctx) }, "")),">" }, ""), false);
    default: 
      if  node.type_name == "void" {
        wr.out("Unit", false);
      } else {
        wr.out(this.getTypeString(node.type_name), false);
      }
  }
  if  node.hasFlag("optional") {
    wr.out("?", false);
  }
}
func (this *RangerKotlinClassWriter) WriteVRef (node *CodeNode, ctx *RangerAppWriterContext, wr *CodeWriter) () {
  if  node.eval_type == 11 {
    if  (int64(len(node.ns))) > 1 {
      var rootObjName_7 string = node.ns[0];
      var enumName_7 string = node.ns[1];
      var e_13 *GoNullable = new(GoNullable); 
      e_13 = ctx.getEnum(rootObjName_7);
      if  e_13.has_value {
        wr.out(strings.Join([]string{ "",strconv.FormatInt(((r_get_string_int64(e_13.value.(*RangerAppEnum).values, enumName_7)).value.(int64)), 10) }, ""), false);
        return;
      }
    }
  }
  if  (int64(len(node.nsp))) > 0 {
    var i_93 int64 = 0;  
    for ; i_93 < int64(len(node.nsp)) ; i_93++ {
      p_24 := node.nsp[i_93];
      if  i_93 > 0 {
        wr.out(".", false);
      }
      if  (int64(len(p_24.Get_compiledName()))) > 0 {
        wr.out(this.adjustType(p_24.Get_compiledName()), false);
      } else {
        if  (int64(len(p_24.Get_name()))) > 0 {
          wr.out(this.adjustType(p_24.Get_name()), false);
        } else {
          wr.out(this.adjustType((node.ns[i_93])), false);
        }
      }
      if  i_93 == 0 {
        if  p_24.Get_nameNode().value.(*CodeNode).hasFlag("optional") {
          wr.out("!!", false);
        }
      }
    }
    return;
  }
  if  node.hasParamDesc {
    var p_29 *GoNullable = new(GoNullable); 
    p_29.value = node.paramDesc.value;
    p_29.has_value = node.paramDesc.has_value;
    wr.out(p_29.value.(IFACE_RangerAppParamDesc).Get_compiledName(), false);
    return;
  }
  var i_98 int64 = 0;  
  for ; i_98 < int64(len(node.ns)) ; i_98++ {
    part_6 := node.ns[i_98];
    if  i_98 > 0 {
      wr.out(".", false);
    }
    wr.out(this.adjustType(part_6), false);
  }
}
func (this *RangerKotlinClassWriter) writeVarDef (node *CodeNode, ctx *RangerAppWriterContext, wr *CodeWriter) () {
  if  node.hasParamDesc {
    var nn_13 *CodeNode = node.children[1];
    var p_29 *GoNullable = new(GoNullable); 
    p_29.value = nn_13.paramDesc.value;
    p_29.has_value = nn_13.paramDesc.has_value;
    if  (p_29.value.(IFACE_RangerAppParamDesc).Get_ref_cnt() == 0) && (p_29.value.(IFACE_RangerAppParamDesc).Get_is_class_variable() == false) {
      wr.out("/** unused:  ", false);
    }
    if  (p_29.value.(IFACE_RangerAppParamDesc).Get_set_cnt() > 0) || p_29.value.(IFACE_RangerAppParamDesc).Get_is_class_variable() {
      wr.out("var ", false);
    } else {
      wr.out("val ", false);
    }
    wr.out(p_29.value.(IFACE_RangerAppParamDesc).Get_compiledName(), false);
    wr.out(" : ", false);
    this.writeTypeDef(p_29.value.(IFACE_RangerAppParamDesc).Get_nameNode().value.(*CodeNode), ctx, wr);
    wr.out(" ", false);
    if  (int64(len(node.children))) > 2 {
      wr.out(" = ", false);
      ctx.setInExpr();
      var value_6 *CodeNode = node.getThird();
      this.WalkNode(value_6, ctx, wr);
      ctx.unsetInExpr();
    } else {
      if  nn_13.value_type == 6 {
        wr.out(" = arrayListOf()", false);
      }
      if  nn_13.value_type == 7 {
        wr.out(" = hashMapOf()", false);
      }
    }
    if  (p_29.value.(IFACE_RangerAppParamDesc).Get_ref_cnt() == 0) && (p_29.value.(IFACE_RangerAppParamDesc).Get_is_class_variable() == true) {
      wr.out("     /** note: unused */", false);
    }
    if  (p_29.value.(IFACE_RangerAppParamDesc).Get_ref_cnt() == 0) && (p_29.value.(IFACE_RangerAppParamDesc).Get_is_class_variable() == false) {
      wr.out("   **/ ;", true);
    } else {
      wr.out(";", false);
      wr.newline();
    }
  }
}
func (this *RangerKotlinClassWriter) writeArgsDef (fnDesc *RangerAppFunctionDesc, ctx *RangerAppWriterContext, wr *CodeWriter) () {
  var i_98 int64 = 0;  
  for ; i_98 < int64(len(fnDesc.params)) ; i_98++ {
    arg_18 := fnDesc.params[i_98];
    if  i_98 > 0 {
      wr.out(",", false);
    }
    wr.out(" ", false);
    wr.out(strings.Join([]string{ arg_18.Get_name()," : " }, ""), false);
    this.writeTypeDef(arg_18.Get_nameNode().value.(*CodeNode), ctx, wr);
  }
}
func (this *RangerKotlinClassWriter) writeFnCall (node *CodeNode, ctx *RangerAppWriterContext, wr *CodeWriter) () {
  if  node.hasFnCall {
    var fc_27 *CodeNode = node.getFirst();
    this.WriteVRef(fc_27, ctx, wr);
    wr.out("(", false);
    var givenArgs_6 *CodeNode = node.getSecond();
    var i_100 int64 = 0;  
    for ; i_100 < int64(len(node.fnDesc.value.(*RangerAppFunctionDesc).params)) ; i_100++ {
      arg_21 := node.fnDesc.value.(*RangerAppFunctionDesc).params[i_100];
      if  i_100 > 0 {
        wr.out(", ", false);
      }
      if  (int64(len(givenArgs_6.children))) <= i_100 {
        var defVal_3 *GoNullable = new(GoNullable); 
        defVal_3 = arg_21.Get_nameNode().value.(*CodeNode).getFlag("default");
        if  defVal_3.has_value {
          var fc_38 *CodeNode = defVal_3.value.(*CodeNode).vref_annotation.value.(*CodeNode).getFirst();
          this.WalkNode(fc_38, ctx, wr);
        } else {
          ctx.addError(node, "Default argument was missing");
        }
        continue;
      }
      var n_12 *CodeNode = givenArgs_6.children[i_100];
      this.WalkNode(n_12, ctx, wr);
    }
    wr.out(")", false);
    if  ctx.expressionLevel() == 0 {
      wr.out(";", true);
    }
  }
}
func (this *RangerKotlinClassWriter) writeNewCall (node *CodeNode, ctx *RangerAppWriterContext, wr *CodeWriter) () {
  if  node.hasNewOper {
    var cl_8 *GoNullable = new(GoNullable); 
    cl_8.value = node.clDesc.value;
    cl_8.has_value = node.clDesc.has_value;
    /** unused:  fc_32*/
    wr.out(" ", false);
    wr.out(node.clDesc.value.(*RangerAppClassDesc).name, false);
    wr.out("(", false);
    var constr_5 *GoNullable = new(GoNullable); 
    constr_5.value = cl_8.value.(*RangerAppClassDesc).constructor_fn.value;
    constr_5.has_value = cl_8.value.(*RangerAppClassDesc).constructor_fn.has_value;
    var givenArgs_9 *CodeNode = node.getThird();
    if  constr_5.has_value {
      var i_102 int64 = 0;  
      for ; i_102 < int64(len(constr_5.value.(*RangerAppFunctionDesc).params)) ; i_102++ {
        arg_23 := constr_5.value.(*RangerAppFunctionDesc).params[i_102];
        var n_15 *CodeNode = givenArgs_9.children[i_102];
        if  i_102 > 0 {
          wr.out(", ", false);
        }
        if  true || (arg_23.Get_nameNode().has_value) {
          this.WalkNode(n_15, ctx, wr);
        }
      }
    }
    wr.out(")", false);
  }
}
func (this *RangerKotlinClassWriter) writeClass (node *CodeNode, ctx *RangerAppWriterContext, orig_wr *CodeWriter) () {
  var cl_11 *GoNullable = new(GoNullable); 
  cl_11.value = node.clDesc.value;
  cl_11.has_value = node.clDesc.has_value;
  if  !cl_11.has_value  {
    return;
  }
  var wr_6 *CodeWriter = orig_wr;
  /** unused:  importFork_2*/
  wr_6.out("", true);
  wr_6.out(strings.Join([]string{ "class ",cl_11.value.(*RangerAppClassDesc).name }, ""), false);
  if  cl_11.value.(*RangerAppClassDesc).has_constructor {
    var constr_8 *RangerAppFunctionDesc = cl_11.value.(*RangerAppClassDesc).constructor_fn.value.(*RangerAppFunctionDesc);
    wr_6.out("(", false);
    this.writeArgsDef(constr_8, ctx, wr_6);
    wr_6.out(" ) ", true);
  }
  wr_6.out(" {", true);
  wr_6.indent(1);
  var i_104 int64 = 0;  
  for ; i_104 < int64(len(cl_11.value.(*RangerAppClassDesc).variables)) ; i_104++ {
    pvar_6 := cl_11.value.(*RangerAppClassDesc).variables[i_104];
    this.writeVarDef(pvar_6.Get_node().value.(*CodeNode), ctx, wr_6);
  }
  if  cl_11.value.(*RangerAppClassDesc).has_constructor {
    var constr_12 *GoNullable = new(GoNullable); 
    constr_12.value = cl_11.value.(*RangerAppClassDesc).constructor_fn.value;
    constr_12.has_value = cl_11.value.(*RangerAppClassDesc).constructor_fn.has_value;
    wr_6.out("", true);
    wr_6.out("init {", true);
    wr_6.indent(1);
    wr_6.newline();
    var subCtx_22 *RangerAppWriterContext = constr_12.value.(*RangerAppFunctionDesc).fnCtx.value.(*RangerAppWriterContext);
    subCtx_22.is_function = true; 
    this.WalkNode(constr_12.value.(*RangerAppFunctionDesc).fnBody.value.(*CodeNode), subCtx_22, wr_6);
    wr_6.newline();
    wr_6.indent(-1);
    wr_6.out("}", true);
  }
  if  (int64(len(cl_11.value.(*RangerAppClassDesc).static_methods))) > 0 {
    wr_6.out("companion object {", true);
    wr_6.indent(1);
  }
  var i_108 int64 = 0;  
  for ; i_108 < int64(len(cl_11.value.(*RangerAppClassDesc).static_methods)) ; i_108++ {
    variant_7 := cl_11.value.(*RangerAppClassDesc).static_methods[i_108];
    wr_6.out("", true);
    if  variant_7.nameNode.value.(*CodeNode).hasFlag("main") {
      continue;
    }
    wr_6.out("fun ", false);
    wr_6.out(" ", false);
    wr_6.out(strings.Join([]string{ variant_7.name,"(" }, ""), false);
    this.writeArgsDef(variant_7, ctx, wr_6);
    wr_6.out(") : ", false);
    this.writeTypeDef(variant_7.nameNode.value.(*CodeNode), ctx, wr_6);
    wr_6.out(" {", true);
    wr_6.indent(1);
    wr_6.newline();
    var subCtx_27 *RangerAppWriterContext = variant_7.fnCtx.value.(*RangerAppWriterContext);
    subCtx_27.is_function = true; 
    this.WalkNode(variant_7.fnBody.value.(*CodeNode), subCtx_27, wr_6);
    wr_6.newline();
    wr_6.indent(-1);
    wr_6.out("}", true);
  }
  if  (int64(len(cl_11.value.(*RangerAppClassDesc).static_methods))) > 0 {
    wr_6.indent(-1);
    wr_6.out("}", true);
  }
  var i_111 int64 = 0;  
  for ; i_111 < int64(len(cl_11.value.(*RangerAppClassDesc).defined_variants)) ; i_111++ {
    fnVar_4 := cl_11.value.(*RangerAppClassDesc).defined_variants[i_111];
    var mVs_4 *GoNullable = new(GoNullable); 
    mVs_4 = r_get_string_RangerAppMethodVariants(cl_11.value.(*RangerAppClassDesc).method_variants, fnVar_4);
    var i_118 int64 = 0;  
    for ; i_118 < int64(len(mVs_4.value.(*RangerAppMethodVariants).variants)) ; i_118++ {
      variant_12 := mVs_4.value.(*RangerAppMethodVariants).variants[i_118];
      wr_6.out("", true);
      wr_6.out("fun ", false);
      wr_6.out(" ", false);
      wr_6.out(strings.Join([]string{ variant_12.name,"(" }, ""), false);
      this.writeArgsDef(variant_12, ctx, wr_6);
      wr_6.out(") : ", false);
      this.writeTypeDef(variant_12.nameNode.value.(*CodeNode), ctx, wr_6);
      wr_6.out(" {", true);
      wr_6.indent(1);
      wr_6.newline();
      var subCtx_30 *RangerAppWriterContext = variant_12.fnCtx.value.(*RangerAppWriterContext);
      subCtx_30.is_function = true; 
      this.WalkNode(variant_12.fnBody.value.(*CodeNode), subCtx_30, wr_6);
      wr_6.newline();
      wr_6.indent(-1);
      wr_6.out("}", true);
    }
  }
  wr_6.indent(-1);
  wr_6.out("}", true);
  var i_117 int64 = 0;  
  for ; i_117 < int64(len(cl_11.value.(*RangerAppClassDesc).static_methods)) ; i_117++ {
    variant_15 := cl_11.value.(*RangerAppClassDesc).static_methods[i_117];
    wr_6.out("", true);
    if  variant_15.nameNode.value.(*CodeNode).hasFlag("main") {
      wr_6.out("fun main(args : Array<String>) {", true);
      wr_6.indent(1);
      wr_6.newline();
      var subCtx_33 *RangerAppWriterContext = variant_15.fnCtx.value.(*RangerAppWriterContext);
      subCtx_33.is_function = true; 
      this.WalkNode(variant_15.fnBody.value.(*CodeNode), subCtx_33, wr_6);
      wr_6.newline();
      wr_6.indent(-1);
      wr_6.out("}", true);
    }
  }
}
// inherited methods from parent class RangerGenericClassWriter
func (this *RangerKotlinClassWriter) EncodeString (node *CodeNode, ctx *RangerAppWriterContext, wr *CodeWriter) string {
  /** unused:  encoded_str_2*/
  var str_length_2 int64 = int64(len(node.string_value));
  var encoded_str_8 string = "";
  var ii_11 int64 = 0;
  for ii_11 < str_length_2 {var cc_4 int64 = int64(node.string_value[ii_11]);
    switch (cc_4 ) { 
      case 8 : 
        encoded_str_8 = strings.Join([]string{ (strings.Join([]string{ encoded_str_8,(string([] byte{byte(92)})) }, "")),(string([] byte{byte(98)})) }, ""); 
      case 9 : 
        encoded_str_8 = strings.Join([]string{ (strings.Join([]string{ encoded_str_8,(string([] byte{byte(92)})) }, "")),(string([] byte{byte(116)})) }, ""); 
      case 10 : 
        encoded_str_8 = strings.Join([]string{ (strings.Join([]string{ encoded_str_8,(string([] byte{byte(92)})) }, "")),(string([] byte{byte(110)})) }, ""); 
      case 12 : 
        encoded_str_8 = strings.Join([]string{ (strings.Join([]string{ encoded_str_8,(string([] byte{byte(92)})) }, "")),(string([] byte{byte(102)})) }, ""); 
      case 13 : 
        encoded_str_8 = strings.Join([]string{ (strings.Join([]string{ encoded_str_8,(string([] byte{byte(92)})) }, "")),(string([] byte{byte(114)})) }, ""); 
      case 34 : 
        encoded_str_8 = strings.Join([]string{ (strings.Join([]string{ encoded_str_8,(string([] byte{byte(92)})) }, "")),(string([] byte{byte(34)})) }, ""); 
      case 92 : 
        encoded_str_8 = strings.Join([]string{ (strings.Join([]string{ encoded_str_8,(string([] byte{byte(92)})) }, "")),(string([] byte{byte(92)})) }, ""); 
      default: 
        encoded_str_8 = strings.Join([]string{ encoded_str_8,(string([] byte{byte(cc_4)})) }, ""); 
    }
    ii_11 = ii_11 + 1; 
  }
  return encoded_str_8;
}
func (this *RangerKotlinClassWriter) CustomOperator (node *CodeNode, ctx *RangerAppWriterContext, wr *CodeWriter) () {
}
func (this *RangerKotlinClassWriter) WriteSetterVRef (node *CodeNode, ctx *RangerAppWriterContext, wr *CodeWriter) () {
}
func (this *RangerKotlinClassWriter) writeArrayTypeDef (node *CodeNode, ctx *RangerAppWriterContext, wr *CodeWriter) () {
}
func (this *RangerKotlinClassWriter) WriteEnum (node *CodeNode, ctx *RangerAppWriterContext, wr *CodeWriter) () {
  if  node.eval_type == 11 {
    var rootObjName_2 string = node.ns[0];
    var e_8 *GoNullable = new(GoNullable); 
    e_8 = ctx.getEnum(rootObjName_2);
    if  e_8.has_value {
      var enumName_2 string = node.ns[1];
      wr.out(strings.Join([]string{ "",strconv.FormatInt(((r_get_string_int64(e_8.value.(*RangerAppEnum).values, enumName_2)).value.(int64)), 10) }, ""), false);
    } else {
      if  node.hasParamDesc {
        var pp_4 *GoNullable = new(GoNullable); 
        pp_4.value = node.paramDesc.value;
        pp_4.has_value = node.paramDesc.has_value;
        var nn_8 *GoNullable = new(GoNullable); 
        nn_8.value = pp_4.value.(IFACE_RangerAppParamDesc).Get_nameNode().value;
        nn_8.has_value = pp_4.value.(IFACE_RangerAppParamDesc).Get_nameNode().has_value;
        this.WriteVRef(nn_8.value.(*CodeNode), ctx, wr);
      }
    }
  }
}
func (this *RangerKotlinClassWriter) import_lib (lib_name string, ctx *RangerAppWriterContext, wr *CodeWriter) () {
  wr.addImport(lib_name);
}
func (this *RangerKotlinClassWriter) release_local_vars (node *CodeNode, ctx *RangerAppWriterContext, wr *CodeWriter) () {
  var i_61 int64 = 0;  
  for ; i_61 < int64(len(ctx.localVarNames)) ; i_61++ {
    n_7 := ctx.localVarNames[i_61];
    var p_14 *GoNullable = new(GoNullable); 
    p_14 = r_get_string_IFACE_RangerAppParamDesc(ctx.localVariables, n_7);
    if  p_14.value.(IFACE_RangerAppParamDesc).Get_ref_cnt() == 0 {
      continue;
    }
    if  p_14.value.(IFACE_RangerAppParamDesc).isAllocatedType() {
      if  1 == p_14.value.(IFACE_RangerAppParamDesc).getStrength() {
        if  p_14.value.(IFACE_RangerAppParamDesc).Get_nameNode().value.(*CodeNode).eval_type == 7 {
        }
        if  p_14.value.(IFACE_RangerAppParamDesc).Get_nameNode().value.(*CodeNode).eval_type == 6 {
        }
        if  (p_14.value.(IFACE_RangerAppParamDesc).Get_nameNode().value.(*CodeNode).eval_type != 6) && (p_14.value.(IFACE_RangerAppParamDesc).Get_nameNode().value.(*CodeNode).eval_type != 7) {
        }
      }
      if  0 == p_14.value.(IFACE_RangerAppParamDesc).getStrength() {
        if  p_14.value.(IFACE_RangerAppParamDesc).Get_nameNode().value.(*CodeNode).eval_type == 7 {
        }
        if  p_14.value.(IFACE_RangerAppParamDesc).Get_nameNode().value.(*CodeNode).eval_type == 6 {
        }
        if  (p_14.value.(IFACE_RangerAppParamDesc).Get_nameNode().value.(*CodeNode).eval_type != 6) && (p_14.value.(IFACE_RangerAppParamDesc).Get_nameNode().value.(*CodeNode).eval_type != 7) {
        }
      }
    }
  }
  if  ctx.is_function {
    return;
  }
  if  ctx.parent.has_value {
    this.release_local_vars(node, ctx.parent.value.(*RangerAppWriterContext), wr);
  }
}
func (this *RangerKotlinClassWriter) WalkNode (node *CodeNode, ctx *RangerAppWriterContext, wr *CodeWriter) () {
  this.compiler.value.(*LiveCompiler).WalkNode(node, ctx, wr);
}
func (this *RangerKotlinClassWriter) writeRawTypeDef (node *CodeNode, ctx *RangerAppWriterContext, wr *CodeWriter) () {
  this.writeTypeDef(node, ctx, wr);
}
// getter for variable compiler
func (this *RangerKotlinClassWriter) Get_compiler() *GoNullable {
  return this.compiler
}
// setter for variable compiler
func (this *RangerKotlinClassWriter) Set_compiler( value *GoNullable)  {
  this.compiler = value 
}
// inherited getters and setters from the parent class RangerGenericClassWriter
type RangerCSharpClassWriter struct { 
  compiler *GoNullable /**  unused  **/ 
  // inherited from parent class RangerGenericClassWriter
}
type IFACE_RangerCSharpClassWriter interface { 
  Get_compiler() *GoNullable
  Set_compiler(value *GoNullable) 
  adjustType(tn string) string
  getObjectTypeString(type_string string, ctx *RangerAppWriterContext) string
  getTypeString(type_string string) string
  writeTypeDef(node *CodeNode, ctx *RangerAppWriterContext, wr *CodeWriter) ()
  WriteVRef(node *CodeNode, ctx *RangerAppWriterContext, wr *CodeWriter) ()
  writeVarDef(node *CodeNode, ctx *RangerAppWriterContext, wr *CodeWriter) ()
  writeArgsDef(fnDesc *RangerAppFunctionDesc, ctx *RangerAppWriterContext, wr *CodeWriter) ()
  writeClass(node *CodeNode, ctx *RangerAppWriterContext, orig_wr *CodeWriter) ()
}

func CreateNew_RangerCSharpClassWriter() *RangerCSharpClassWriter {
  me := new(RangerCSharpClassWriter)
  me.compiler = new(GoNullable);
  me.compiler = new(GoNullable);
  return me;
}
func (this *RangerCSharpClassWriter) adjustType (tn string) string {
  if  tn == "this" {
    return "this";
  }
  return tn;
}
func (this *RangerCSharpClassWriter) getObjectTypeString (type_string string, ctx *RangerAppWriterContext) string {
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
  }
  return type_string;
}
func (this *RangerCSharpClassWriter) getTypeString (type_string string) string {
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
      return "boolean";
    case "double" : 
      return "double";
  }
  return type_string;
}
func (this *RangerCSharpClassWriter) writeTypeDef (node *CodeNode, ctx *RangerAppWriterContext, wr *CodeWriter) () {
  var v_type_4 int64 = node.value_type;
  if  node.eval_type != 0 {
    v_type_4 = node.eval_type; 
  }
  switch (v_type_4 ) { 
    case 11 : 
      wr.out("int", false);
    case 3 : 
      wr.out("int", false);
    case 2 : 
      wr.out("double", false);
    case 12 : 
      wr.out("byte", false);
    case 13 : 
      wr.out("byte[]", false);
    case 4 : 
      wr.out("String", false);
    case 5 : 
      wr.out("boolean", false);
    case 7 : 
      wr.out(strings.Join([]string{ (strings.Join([]string{ (strings.Join([]string{ (strings.Join([]string{ "Dictionary<",this.getObjectTypeString(node.key_type, ctx) }, "")),"," }, "")),this.getObjectTypeString(node.array_type, ctx) }, "")),">" }, ""), false);
      wr.addImport("System.Collections");
    case 6 : 
      wr.out(strings.Join([]string{ (strings.Join([]string{ "List<",this.getObjectTypeString(node.array_type, ctx) }, "")),">" }, ""), false);
      wr.addImport("System.Collections");
    default: 
      if  node.type_name == "void" {
        wr.out("void", false);
      } else {
        wr.out(this.getTypeString(node.type_name), false);
      }
  }
  if  node.hasFlag("optional") {
    wr.out("?", false);
  }
}
func (this *RangerCSharpClassWriter) WriteVRef (node *CodeNode, ctx *RangerAppWriterContext, wr *CodeWriter) () {
  if  node.eval_type == 11 {
    if  (int64(len(node.ns))) > 1 {
      var rootObjName_8 string = node.ns[0];
      var enumName_8 string = node.ns[1];
      var e_14 *GoNullable = new(GoNullable); 
      e_14 = ctx.getEnum(rootObjName_8);
      if  e_14.has_value {
        wr.out(strings.Join([]string{ "",strconv.FormatInt(((r_get_string_int64(e_14.value.(*RangerAppEnum).values, enumName_8)).value.(int64)), 10) }, ""), false);
        return;
      }
    }
  }
  if  (int64(len(node.nsp))) > 0 {
    var i_103 int64 = 0;  
    for ; i_103 < int64(len(node.nsp)) ; i_103++ {
      p_27 := node.nsp[i_103];
      if  i_103 > 0 {
        wr.out(".", false);
      }
      if  i_103 == 0 {
        if  p_27.Get_nameNode().value.(*CodeNode).hasFlag("optional") {
        }
      }
      if  (int64(len(p_27.Get_compiledName()))) > 0 {
        wr.out(this.adjustType(p_27.Get_compiledName()), false);
      } else {
        if  (int64(len(p_27.Get_name()))) > 0 {
          wr.out(this.adjustType(p_27.Get_name()), false);
        } else {
          wr.out(this.adjustType((node.ns[i_103])), false);
        }
      }
    }
    return;
  }
  if  node.hasParamDesc {
    var p_32 *GoNullable = new(GoNullable); 
    p_32.value = node.paramDesc.value;
    p_32.has_value = node.paramDesc.has_value;
    wr.out(p_32.value.(IFACE_RangerAppParamDesc).Get_compiledName(), false);
    return;
  }
  var i_108 int64 = 0;  
  for ; i_108 < int64(len(node.ns)) ; i_108++ {
    part_7 := node.ns[i_108];
    if  i_108 > 0 {
      wr.out(".", false);
    }
    wr.out(this.adjustType(part_7), false);
  }
}
func (this *RangerCSharpClassWriter) writeVarDef (node *CodeNode, ctx *RangerAppWriterContext, wr *CodeWriter) () {
  if  node.hasParamDesc {
    var nn_14 *CodeNode = node.children[1];
    var p_32 *GoNullable = new(GoNullable); 
    p_32.value = nn_14.paramDesc.value;
    p_32.has_value = nn_14.paramDesc.has_value;
    if  (p_32.value.(IFACE_RangerAppParamDesc).Get_ref_cnt() == 0) && (p_32.value.(IFACE_RangerAppParamDesc).Get_is_class_variable() == false) {
      wr.out("/** unused:  ", false);
    }
    if  (p_32.value.(IFACE_RangerAppParamDesc).Get_set_cnt() > 0) || p_32.value.(IFACE_RangerAppParamDesc).Get_is_class_variable() {
      wr.out("", false);
    } else {
      wr.out("const ", false);
    }
    this.writeTypeDef(p_32.value.(IFACE_RangerAppParamDesc).Get_nameNode().value.(*CodeNode), ctx, wr);
    wr.out(" ", false);
    wr.out(p_32.value.(IFACE_RangerAppParamDesc).Get_compiledName(), false);
    if  (int64(len(node.children))) > 2 {
      wr.out(" = ", false);
      ctx.setInExpr();
      var value_7 *CodeNode = node.getThird();
      this.WalkNode(value_7, ctx, wr);
      ctx.unsetInExpr();
    } else {
      if  nn_14.value_type == 6 {
        wr.out(" = new ", false);
        this.writeTypeDef(p_32.value.(IFACE_RangerAppParamDesc).Get_nameNode().value.(*CodeNode), ctx, wr);
        wr.out("()", false);
      }
      if  nn_14.value_type == 7 {
        wr.out(" = new ", false);
        this.writeTypeDef(p_32.value.(IFACE_RangerAppParamDesc).Get_nameNode().value.(*CodeNode), ctx, wr);
        wr.out("()", false);
      }
    }
    if  (p_32.value.(IFACE_RangerAppParamDesc).Get_ref_cnt() == 0) && (p_32.value.(IFACE_RangerAppParamDesc).Get_is_class_variable() == true) {
      wr.out("     /** note: unused */", false);
    }
    if  (p_32.value.(IFACE_RangerAppParamDesc).Get_ref_cnt() == 0) && (p_32.value.(IFACE_RangerAppParamDesc).Get_is_class_variable() == false) {
      wr.out("   **/ ;", true);
    } else {
      wr.out(";", false);
      wr.newline();
    }
  }
}
func (this *RangerCSharpClassWriter) writeArgsDef (fnDesc *RangerAppFunctionDesc, ctx *RangerAppWriterContext, wr *CodeWriter) () {
  var i_108 int64 = 0;  
  for ; i_108 < int64(len(fnDesc.params)) ; i_108++ {
    arg_21 := fnDesc.params[i_108];
    if  i_108 > 0 {
      wr.out(",", false);
    }
    wr.out(" ", false);
    this.writeTypeDef(arg_21.Get_nameNode().value.(*CodeNode), ctx, wr);
    wr.out(strings.Join([]string{ (strings.Join([]string{ " ",arg_21.Get_name() }, ""))," " }, ""), false);
  }
}
func (this *RangerCSharpClassWriter) writeClass (node *CodeNode, ctx *RangerAppWriterContext, orig_wr *CodeWriter) () {
  var cl_10 *GoNullable = new(GoNullable); 
  cl_10.value = node.clDesc.value;
  cl_10.has_value = node.clDesc.has_value;
  if  !cl_10.has_value  {
    return;
  }
  var wr_7 *CodeWriter = orig_wr.getFileWriter(".", (strings.Join([]string{ cl_10.value.(*RangerAppClassDesc).name,".cs" }, "")));
  var importFork_3 *CodeWriter = wr_7.fork();
  wr_7.out("", true);
  wr_7.out(strings.Join([]string{ (strings.Join([]string{ "class ",cl_10.value.(*RangerAppClassDesc).name }, ""))," {" }, ""), true);
  wr_7.indent(1);
  var i_110 int64 = 0;  
  for ; i_110 < int64(len(cl_10.value.(*RangerAppClassDesc).variables)) ; i_110++ {
    pvar_7 := cl_10.value.(*RangerAppClassDesc).variables[i_110];
    wr_7.out("public ", false);
    this.writeVarDef(pvar_7.Get_node().value.(*CodeNode), ctx, wr_7);
  }
  if  cl_10.value.(*RangerAppClassDesc).has_constructor {
    var constr_8 *RangerAppFunctionDesc = cl_10.value.(*RangerAppClassDesc).constructor_fn.value.(*RangerAppFunctionDesc);
    wr_7.out("", true);
    wr_7.out(strings.Join([]string{ cl_10.value.(*RangerAppClassDesc).name,"(" }, ""), false);
    this.writeArgsDef(constr_8, ctx, wr_7);
    wr_7.out(" ) {", true);
    wr_7.indent(1);
    wr_7.newline();
    var subCtx_26 *RangerAppWriterContext = constr_8.fnCtx.value.(*RangerAppWriterContext);
    subCtx_26.is_function = true; 
    this.WalkNode(constr_8.fnBody.value.(*CodeNode), subCtx_26, wr_7);
    wr_7.newline();
    wr_7.indent(-1);
    wr_7.out("}", true);
  }
  var i_114 int64 = 0;  
  for ; i_114 < int64(len(cl_10.value.(*RangerAppClassDesc).static_methods)) ; i_114++ {
    variant_10 := cl_10.value.(*RangerAppClassDesc).static_methods[i_114];
    wr_7.out("", true);
    if  variant_10.nameNode.value.(*CodeNode).hasFlag("main") {
      wr_7.out("static int Main( string [] args ) {", true);
    } else {
      wr_7.out("public static ", false);
      this.writeTypeDef(variant_10.nameNode.value.(*CodeNode), ctx, wr_7);
      wr_7.out(" ", false);
      wr_7.out(strings.Join([]string{ variant_10.name,"(" }, ""), false);
      this.writeArgsDef(variant_10, ctx, wr_7);
      wr_7.out(") {", true);
    }
    wr_7.indent(1);
    wr_7.newline();
    var subCtx_31 *RangerAppWriterContext = variant_10.fnCtx.value.(*RangerAppWriterContext);
    subCtx_31.is_function = true; 
    this.WalkNode(variant_10.fnBody.value.(*CodeNode), subCtx_31, wr_7);
    wr_7.newline();
    wr_7.indent(-1);
    wr_7.out("}", true);
  }
  var i_117 int64 = 0;  
  for ; i_117 < int64(len(cl_10.value.(*RangerAppClassDesc).defined_variants)) ; i_117++ {
    fnVar_5 := cl_10.value.(*RangerAppClassDesc).defined_variants[i_117];
    var mVs_5 *GoNullable = new(GoNullable); 
    mVs_5 = r_get_string_RangerAppMethodVariants(cl_10.value.(*RangerAppClassDesc).method_variants, fnVar_5);
    var i_124 int64 = 0;  
    for ; i_124 < int64(len(mVs_5.value.(*RangerAppMethodVariants).variants)) ; i_124++ {
      variant_15 := mVs_5.value.(*RangerAppMethodVariants).variants[i_124];
      wr_7.out("", true);
      wr_7.out("public ", false);
      this.writeTypeDef(variant_15.nameNode.value.(*CodeNode), ctx, wr_7);
      wr_7.out(" ", false);
      wr_7.out(strings.Join([]string{ variant_15.name,"(" }, ""), false);
      this.writeArgsDef(variant_15, ctx, wr_7);
      wr_7.out(") {", true);
      wr_7.indent(1);
      wr_7.newline();
      var subCtx_34 *RangerAppWriterContext = variant_15.fnCtx.value.(*RangerAppWriterContext);
      subCtx_34.is_function = true; 
      this.WalkNode(variant_15.fnBody.value.(*CodeNode), subCtx_34, wr_7);
      wr_7.newline();
      wr_7.indent(-1);
      wr_7.out("}", true);
    }
  }
  wr_7.indent(-1);
  wr_7.out("}", true);
  var import_list_2 []string = wr_7.getImports();
  var i_123 int64 = 0;  
  for ; i_123 < int64(len(import_list_2)) ; i_123++ {
    codeStr_2 := import_list_2[i_123];
    importFork_3.out(strings.Join([]string{ (strings.Join([]string{ "using ",codeStr_2 }, "")),";" }, ""), true);
  }
}
// inherited methods from parent class RangerGenericClassWriter
func (this *RangerCSharpClassWriter) EncodeString (node *CodeNode, ctx *RangerAppWriterContext, wr *CodeWriter) string {
  /** unused:  encoded_str_2*/
  var str_length_2 int64 = int64(len(node.string_value));
  var encoded_str_8 string = "";
  var ii_11 int64 = 0;
  for ii_11 < str_length_2 {var cc_4 int64 = int64(node.string_value[ii_11]);
    switch (cc_4 ) { 
      case 8 : 
        encoded_str_8 = strings.Join([]string{ (strings.Join([]string{ encoded_str_8,(string([] byte{byte(92)})) }, "")),(string([] byte{byte(98)})) }, ""); 
      case 9 : 
        encoded_str_8 = strings.Join([]string{ (strings.Join([]string{ encoded_str_8,(string([] byte{byte(92)})) }, "")),(string([] byte{byte(116)})) }, ""); 
      case 10 : 
        encoded_str_8 = strings.Join([]string{ (strings.Join([]string{ encoded_str_8,(string([] byte{byte(92)})) }, "")),(string([] byte{byte(110)})) }, ""); 
      case 12 : 
        encoded_str_8 = strings.Join([]string{ (strings.Join([]string{ encoded_str_8,(string([] byte{byte(92)})) }, "")),(string([] byte{byte(102)})) }, ""); 
      case 13 : 
        encoded_str_8 = strings.Join([]string{ (strings.Join([]string{ encoded_str_8,(string([] byte{byte(92)})) }, "")),(string([] byte{byte(114)})) }, ""); 
      case 34 : 
        encoded_str_8 = strings.Join([]string{ (strings.Join([]string{ encoded_str_8,(string([] byte{byte(92)})) }, "")),(string([] byte{byte(34)})) }, ""); 
      case 92 : 
        encoded_str_8 = strings.Join([]string{ (strings.Join([]string{ encoded_str_8,(string([] byte{byte(92)})) }, "")),(string([] byte{byte(92)})) }, ""); 
      default: 
        encoded_str_8 = strings.Join([]string{ encoded_str_8,(string([] byte{byte(cc_4)})) }, ""); 
    }
    ii_11 = ii_11 + 1; 
  }
  return encoded_str_8;
}
func (this *RangerCSharpClassWriter) CustomOperator (node *CodeNode, ctx *RangerAppWriterContext, wr *CodeWriter) () {
}
func (this *RangerCSharpClassWriter) WriteSetterVRef (node *CodeNode, ctx *RangerAppWriterContext, wr *CodeWriter) () {
}
func (this *RangerCSharpClassWriter) writeArrayTypeDef (node *CodeNode, ctx *RangerAppWriterContext, wr *CodeWriter) () {
}
func (this *RangerCSharpClassWriter) WriteEnum (node *CodeNode, ctx *RangerAppWriterContext, wr *CodeWriter) () {
  if  node.eval_type == 11 {
    var rootObjName_2 string = node.ns[0];
    var e_8 *GoNullable = new(GoNullable); 
    e_8 = ctx.getEnum(rootObjName_2);
    if  e_8.has_value {
      var enumName_2 string = node.ns[1];
      wr.out(strings.Join([]string{ "",strconv.FormatInt(((r_get_string_int64(e_8.value.(*RangerAppEnum).values, enumName_2)).value.(int64)), 10) }, ""), false);
    } else {
      if  node.hasParamDesc {
        var pp_4 *GoNullable = new(GoNullable); 
        pp_4.value = node.paramDesc.value;
        pp_4.has_value = node.paramDesc.has_value;
        var nn_8 *GoNullable = new(GoNullable); 
        nn_8.value = pp_4.value.(IFACE_RangerAppParamDesc).Get_nameNode().value;
        nn_8.has_value = pp_4.value.(IFACE_RangerAppParamDesc).Get_nameNode().has_value;
        this.WriteVRef(nn_8.value.(*CodeNode), ctx, wr);
      }
    }
  }
}
func (this *RangerCSharpClassWriter) WriteScalarValue (node *CodeNode, ctx *RangerAppWriterContext, wr *CodeWriter) () {
  switch (node.value_type ) { 
    case 2 : 
      wr.out(strings.Join([]string{ "",strconv.FormatFloat(node.double_value,'f', 6, 64) }, ""), false);
    case 4 : 
      var s_18 string = this.EncodeString(node, ctx, wr);
      wr.out(strings.Join([]string{ (strings.Join([]string{ "\"",s_18 }, "")),"\"" }, ""), false);
    case 3 : 
      wr.out(strings.Join([]string{ "",strconv.FormatInt(node.int_value, 10) }, ""), false);
    case 5 : 
      if  node.boolean_value {
        wr.out("true", false);
      } else {
        wr.out("false", false);
      }
  }
}
func (this *RangerCSharpClassWriter) import_lib (lib_name string, ctx *RangerAppWriterContext, wr *CodeWriter) () {
  wr.addImport(lib_name);
}
func (this *RangerCSharpClassWriter) release_local_vars (node *CodeNode, ctx *RangerAppWriterContext, wr *CodeWriter) () {
  var i_61 int64 = 0;  
  for ; i_61 < int64(len(ctx.localVarNames)) ; i_61++ {
    n_7 := ctx.localVarNames[i_61];
    var p_14 *GoNullable = new(GoNullable); 
    p_14 = r_get_string_IFACE_RangerAppParamDesc(ctx.localVariables, n_7);
    if  p_14.value.(IFACE_RangerAppParamDesc).Get_ref_cnt() == 0 {
      continue;
    }
    if  p_14.value.(IFACE_RangerAppParamDesc).isAllocatedType() {
      if  1 == p_14.value.(IFACE_RangerAppParamDesc).getStrength() {
        if  p_14.value.(IFACE_RangerAppParamDesc).Get_nameNode().value.(*CodeNode).eval_type == 7 {
        }
        if  p_14.value.(IFACE_RangerAppParamDesc).Get_nameNode().value.(*CodeNode).eval_type == 6 {
        }
        if  (p_14.value.(IFACE_RangerAppParamDesc).Get_nameNode().value.(*CodeNode).eval_type != 6) && (p_14.value.(IFACE_RangerAppParamDesc).Get_nameNode().value.(*CodeNode).eval_type != 7) {
        }
      }
      if  0 == p_14.value.(IFACE_RangerAppParamDesc).getStrength() {
        if  p_14.value.(IFACE_RangerAppParamDesc).Get_nameNode().value.(*CodeNode).eval_type == 7 {
        }
        if  p_14.value.(IFACE_RangerAppParamDesc).Get_nameNode().value.(*CodeNode).eval_type == 6 {
        }
        if  (p_14.value.(IFACE_RangerAppParamDesc).Get_nameNode().value.(*CodeNode).eval_type != 6) && (p_14.value.(IFACE_RangerAppParamDesc).Get_nameNode().value.(*CodeNode).eval_type != 7) {
        }
      }
    }
  }
  if  ctx.is_function {
    return;
  }
  if  ctx.parent.has_value {
    this.release_local_vars(node, ctx.parent.value.(*RangerAppWriterContext), wr);
  }
}
func (this *RangerCSharpClassWriter) WalkNode (node *CodeNode, ctx *RangerAppWriterContext, wr *CodeWriter) () {
  this.compiler.value.(*LiveCompiler).WalkNode(node, ctx, wr);
}
func (this *RangerCSharpClassWriter) writeRawTypeDef (node *CodeNode, ctx *RangerAppWriterContext, wr *CodeWriter) () {
  this.writeTypeDef(node, ctx, wr);
}
func (this *RangerCSharpClassWriter) writeFnCall (node *CodeNode, ctx *RangerAppWriterContext, wr *CodeWriter) () {
  if  node.hasFnCall {
    var fc_20 *CodeNode = node.getFirst();
    this.WriteVRef(fc_20, ctx, wr);
    wr.out("(", false);
    var givenArgs_2 *CodeNode = node.getSecond();
    ctx.setInExpr();
    var i_68 int64 = 0;  
    for ; i_68 < int64(len(node.fnDesc.value.(*RangerAppFunctionDesc).params)) ; i_68++ {
      arg_12 := node.fnDesc.value.(*RangerAppFunctionDesc).params[i_68];
      if  i_68 > 0 {
        wr.out(", ", false);
      }
      if  (int64(len(givenArgs_2.children))) <= i_68 {
        var defVal *GoNullable = new(GoNullable); 
        defVal = arg_12.Get_nameNode().value.(*CodeNode).getFlag("default");
        if  defVal.has_value {
          var fc_31 *CodeNode = defVal.value.(*CodeNode).vref_annotation.value.(*CodeNode).getFirst();
          this.WalkNode(fc_31, ctx, wr);
        } else {
          ctx.addError(node, "Default argument was missing");
        }
        continue;
      }
      var n_10 *CodeNode = givenArgs_2.children[i_68];
      this.WalkNode(n_10, ctx, wr);
    }
    ctx.unsetInExpr();
    wr.out(")", false);
    if  ctx.expressionLevel() == 0 {
      wr.out(";", true);
    }
  }
}
func (this *RangerCSharpClassWriter) writeNewCall (node *CodeNode, ctx *RangerAppWriterContext, wr *CodeWriter) () {
  if  node.hasNewOper {
    var cl_2 *GoNullable = new(GoNullable); 
    cl_2.value = node.clDesc.value;
    cl_2.has_value = node.clDesc.has_value;
    /** unused:  fc_25*/
    wr.out(strings.Join([]string{ "new ",node.clDesc.value.(*RangerAppClassDesc).name }, ""), false);
    wr.out("(", false);
    var constr *GoNullable = new(GoNullable); 
    constr.value = cl_2.value.(*RangerAppClassDesc).constructor_fn.value;
    constr.has_value = cl_2.value.(*RangerAppClassDesc).constructor_fn.has_value;
    var givenArgs_5 *CodeNode = node.getThird();
    if  constr.has_value {
      var i_70 int64 = 0;  
      for ; i_70 < int64(len(constr.value.(*RangerAppFunctionDesc).params)) ; i_70++ {
        arg_15 := constr.value.(*RangerAppFunctionDesc).params[i_70];
        var n_12 *CodeNode = givenArgs_5.children[i_70];
        if  i_70 > 0 {
          wr.out(", ", false);
        }
        if  true || (arg_15.Get_nameNode().has_value) {
          this.WalkNode(n_12, ctx, wr);
        }
      }
    }
    wr.out(")", false);
  }
}
// getter for variable compiler
func (this *RangerCSharpClassWriter) Get_compiler() *GoNullable {
  return this.compiler
}
// setter for variable compiler
func (this *RangerCSharpClassWriter) Set_compiler( value *GoNullable)  {
  this.compiler = value 
}
// inherited getters and setters from the parent class RangerGenericClassWriter
type RangerScalaClassWriter struct { 
  compiler *GoNullable /**  unused  **/ 
  // inherited from parent class RangerGenericClassWriter
}
type IFACE_RangerScalaClassWriter interface { 
  Get_compiler() *GoNullable
  Set_compiler(value *GoNullable) 
  getObjectTypeString(type_string string, ctx *RangerAppWriterContext) string
  getTypeString(type_string string) string
  writeTypeDef(node *CodeNode, ctx *RangerAppWriterContext, wr *CodeWriter) ()
  writeTypeDefNoOption(node *CodeNode, ctx *RangerAppWriterContext, wr *CodeWriter) ()
  WriteVRef(node *CodeNode, ctx *RangerAppWriterContext, wr *CodeWriter) ()
  writeVarDef(node *CodeNode, ctx *RangerAppWriterContext, wr *CodeWriter) ()
  writeArgsDef(fnDesc *RangerAppFunctionDesc, ctx *RangerAppWriterContext, wr *CodeWriter) ()
  writeClass(node *CodeNode, ctx *RangerAppWriterContext, orig_wr *CodeWriter) ()
}

func CreateNew_RangerScalaClassWriter() *RangerScalaClassWriter {
  me := new(RangerScalaClassWriter)
  me.compiler = new(GoNullable);
  me.compiler = new(GoNullable);
  return me;
}
func (this *RangerScalaClassWriter) getObjectTypeString (type_string string, ctx *RangerAppWriterContext) string {
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
  }
  return type_string;
}
func (this *RangerScalaClassWriter) getTypeString (type_string string) string {
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
  }
  return type_string;
}
func (this *RangerScalaClassWriter) writeTypeDef (node *CodeNode, ctx *RangerAppWriterContext, wr *CodeWriter) () {
  if  node.hasFlag("optional") {
    wr.out("Option[", false);
  }
  var v_type_5 int64 = node.value_type;
  if  node.eval_type != 0 {
    v_type_5 = node.eval_type; 
  }
  switch (v_type_5 ) { 
    case 11 : 
      wr.out("Int", false);
    case 3 : 
      wr.out("Int", false);
    case 2 : 
      wr.out("Double", false);
    case 4 : 
      wr.out("String", false);
    case 5 : 
      wr.out("Boolean", false);
    case 12 : 
      wr.out("Byte", false);
    case 13 : 
      wr.out("Array[Byte]", false);
    case 7 : 
      wr.addImport("scala.collection.mutable");
      wr.out(strings.Join([]string{ (strings.Join([]string{ (strings.Join([]string{ (strings.Join([]string{ "collection.mutable.HashMap[",this.getObjectTypeString(node.key_type, ctx) }, "")),", " }, "")),this.getObjectTypeString(node.array_type, ctx) }, "")),"]" }, ""), false);
    case 6 : 
      wr.addImport("scala.collection.mutable");
      wr.out(strings.Join([]string{ (strings.Join([]string{ "collection.mutable.ArrayBuffer[",this.getObjectTypeString(node.array_type, ctx) }, "")),"]" }, ""), false);
    default: 
      if  node.type_name == "void" {
        wr.out("Unit", false);
        return;
      }
      wr.out(this.getTypeString(node.type_name), false);
  }
  if  node.hasFlag("optional") {
    wr.out("]", false);
  }
}
func (this *RangerScalaClassWriter) writeTypeDefNoOption (node *CodeNode, ctx *RangerAppWriterContext, wr *CodeWriter) () {
  var v_type_8 int64 = node.value_type;
  if  node.eval_type != 0 {
    v_type_8 = node.eval_type; 
  }
  switch (v_type_8 ) { 
    case 11 : 
      wr.out("Int", false);
    case 3 : 
      wr.out("Int", false);
    case 2 : 
      wr.out("Double", false);
    case 4 : 
      wr.out("String", false);
    case 5 : 
      wr.out("Boolean", false);
    case 12 : 
      wr.out("Byte", false);
    case 13 : 
      wr.out("Array[Byte]", false);
    case 7 : 
      wr.addImport("scala.collection.mutable");
      wr.out(strings.Join([]string{ (strings.Join([]string{ (strings.Join([]string{ (strings.Join([]string{ "collection.mutable.HashMap[",this.getObjectTypeString(node.key_type, ctx) }, "")),", " }, "")),this.getObjectTypeString(node.array_type, ctx) }, "")),"]" }, ""), false);
    case 6 : 
      wr.addImport("scala.collection.mutable");
      wr.out(strings.Join([]string{ (strings.Join([]string{ "collection.mutable.ArrayBuffer[",this.getObjectTypeString(node.array_type, ctx) }, "")),"]" }, ""), false);
    default: 
      if  node.type_name == "void" {
        wr.out("Unit", false);
        return;
      }
      wr.out(this.getTypeString(node.type_name), false);
  }
}
func (this *RangerScalaClassWriter) WriteVRef (node *CodeNode, ctx *RangerAppWriterContext, wr *CodeWriter) () {
  if  node.eval_type == 11 {
    if  (int64(len(node.ns))) > 1 {
      var rootObjName_9 string = node.ns[0];
      var enumName_9 string = node.ns[1];
      var e_15 *GoNullable = new(GoNullable); 
      e_15 = ctx.getEnum(rootObjName_9);
      if  e_15.has_value {
        wr.out(strings.Join([]string{ "",strconv.FormatInt(((r_get_string_int64(e_15.value.(*RangerAppEnum).values, enumName_9)).value.(int64)), 10) }, ""), false);
        return;
      }
    }
  }
  if  (int64(len(node.nsp))) > 0 {
    var i_111 int64 = 0;  
    for ; i_111 < int64(len(node.nsp)) ; i_111++ {
      p_30 := node.nsp[i_111];
      if  i_111 > 0 {
        wr.out(".", false);
      }
      if  (int64(len(p_30.Get_compiledName()))) > 0 {
        wr.out(this.adjustType(p_30.Get_compiledName()), false);
      } else {
        if  (int64(len(p_30.Get_name()))) > 0 {
          wr.out(this.adjustType(p_30.Get_name()), false);
        } else {
          wr.out(this.adjustType((node.ns[i_111])), false);
        }
      }
      if  i_111 == 0 {
        if  p_30.Get_nameNode().value.(*CodeNode).hasFlag("optional") {
          wr.out(".get", false);
        }
      }
    }
    return;
  }
  if  node.hasParamDesc {
    var p_35 *GoNullable = new(GoNullable); 
    p_35.value = node.paramDesc.value;
    p_35.has_value = node.paramDesc.has_value;
    wr.out(p_35.value.(IFACE_RangerAppParamDesc).Get_compiledName(), false);
    return;
  }
  var i_116 int64 = 0;  
  for ; i_116 < int64(len(node.ns)) ; i_116++ {
    part_8 := node.ns[i_116];
    if  i_116 > 0 {
      wr.out(".", false);
    }
    wr.out(this.adjustType(part_8), false);
  }
}
func (this *RangerScalaClassWriter) writeVarDef (node *CodeNode, ctx *RangerAppWriterContext, wr *CodeWriter) () {
  if  node.hasParamDesc {
    var p_35 *GoNullable = new(GoNullable); 
    p_35.value = node.paramDesc.value;
    p_35.has_value = node.paramDesc.has_value;
    /** unused:  nn_15*/
    if  (p_35.value.(IFACE_RangerAppParamDesc).Get_ref_cnt() == 0) && (p_35.value.(IFACE_RangerAppParamDesc).Get_is_class_variable() == false) {
      wr.out("/** unused ", false);
    }
    if  (p_35.value.(IFACE_RangerAppParamDesc).Get_set_cnt() > 0) || p_35.value.(IFACE_RangerAppParamDesc).Get_is_class_variable() {
      wr.out(strings.Join([]string{ (strings.Join([]string{ "var ",p_35.value.(IFACE_RangerAppParamDesc).Get_compiledName() }, ""))," : " }, ""), false);
    } else {
      wr.out(strings.Join([]string{ (strings.Join([]string{ "val ",p_35.value.(IFACE_RangerAppParamDesc).Get_compiledName() }, ""))," : " }, ""), false);
    }
    this.writeTypeDef(p_35.value.(IFACE_RangerAppParamDesc).Get_nameNode().value.(*CodeNode), ctx, wr);
    if  (int64(len(node.children))) > 2 {
      wr.out(" = ", false);
      ctx.setInExpr();
      var value_8 *CodeNode = node.getThird();
      this.WalkNode(value_8, ctx, wr);
      ctx.unsetInExpr();
    } else {
      var b_inited bool = false;
      if  p_35.value.(IFACE_RangerAppParamDesc).Get_nameNode().value.(*CodeNode).value_type == 6 {
        b_inited = true; 
        wr.out("= new collection.mutable.ArrayBuffer()", false);
      }
      if  p_35.value.(IFACE_RangerAppParamDesc).Get_nameNode().value.(*CodeNode).value_type == 7 {
        b_inited = true; 
        wr.out("= new collection.mutable.HashMap()", false);
      }
      if  p_35.value.(IFACE_RangerAppParamDesc).Get_nameNode().value.(*CodeNode).hasFlag("optional") {
        wr.out(" = Option.empty[", false);
        this.writeTypeDefNoOption(p_35.value.(IFACE_RangerAppParamDesc).Get_nameNode().value.(*CodeNode), ctx, wr);
        wr.out("]", false);
      } else {
        if  b_inited == false {
          wr.out(" = _", false);
        }
      }
    }
    if  (p_35.value.(IFACE_RangerAppParamDesc).Get_ref_cnt() == 0) && (p_35.value.(IFACE_RangerAppParamDesc).Get_is_class_variable() == false) {
      wr.out("**/ ", true);
    } else {
      wr.newline();
    }
  }
}
func (this *RangerScalaClassWriter) writeArgsDef (fnDesc *RangerAppFunctionDesc, ctx *RangerAppWriterContext, wr *CodeWriter) () {
  var i_116 int64 = 0;  
  for ; i_116 < int64(len(fnDesc.params)) ; i_116++ {
    arg_22 := fnDesc.params[i_116];
    if  i_116 > 0 {
      wr.out(",", false);
    }
    wr.out(" ", false);
    wr.out(strings.Join([]string{ arg_22.Get_name()," : " }, ""), false);
    this.writeTypeDef(arg_22.Get_nameNode().value.(*CodeNode), ctx, wr);
  }
}
func (this *RangerScalaClassWriter) writeClass (node *CodeNode, ctx *RangerAppWriterContext, orig_wr *CodeWriter) () {
  var cl_11 *GoNullable = new(GoNullable); 
  cl_11.value = node.clDesc.value;
  cl_11.has_value = node.clDesc.has_value;
  if  !cl_11.has_value  {
    return;
  }
  var wr_8 *CodeWriter = orig_wr.getFileWriter(".", (strings.Join([]string{ cl_11.value.(*RangerAppClassDesc).name,".scala" }, "")));
  var importFork_4 *CodeWriter = wr_8.fork();
  wr_8.out("", true);
  wr_8.out(strings.Join([]string{ (strings.Join([]string{ "class ",cl_11.value.(*RangerAppClassDesc).name }, ""))," " }, ""), false);
  if  cl_11.value.(*RangerAppClassDesc).has_constructor {
    wr_8.out("(", false);
    var constr_9 *RangerAppFunctionDesc = cl_11.value.(*RangerAppClassDesc).constructor_fn.value.(*RangerAppFunctionDesc);
    var i_118 int64 = 0;  
    for ; i_118 < int64(len(constr_9.params)) ; i_118++ {
      arg_25 := constr_9.params[i_118];
      if  i_118 > 0 {
        wr_8.out(", ", false);
      }
      wr_8.out(strings.Join([]string{ arg_25.Get_name()," : " }, ""), false);
      this.writeTypeDef(arg_25.Get_nameNode().value.(*CodeNode), ctx, wr_8);
    }
    wr_8.out(")", false);
  }
  wr_8.out(" {", true);
  wr_8.indent(1);
  var i_122 int64 = 0;  
  for ; i_122 < int64(len(cl_11.value.(*RangerAppClassDesc).variables)) ; i_122++ {
    pvar_8 := cl_11.value.(*RangerAppClassDesc).variables[i_122];
    this.writeVarDef(pvar_8.Get_node().value.(*CodeNode), ctx, wr_8);
  }
  if  cl_11.value.(*RangerAppClassDesc).has_constructor {
    var constr_14 *GoNullable = new(GoNullable); 
    constr_14.value = cl_11.value.(*RangerAppClassDesc).constructor_fn.value;
    constr_14.has_value = cl_11.value.(*RangerAppClassDesc).constructor_fn.has_value;
    wr_8.newline();
    var subCtx_29 *RangerAppWriterContext = constr_14.value.(*RangerAppFunctionDesc).fnCtx.value.(*RangerAppWriterContext);
    subCtx_29.is_function = true; 
    this.WalkNode(constr_14.value.(*RangerAppFunctionDesc).fnBody.value.(*CodeNode), subCtx_29, wr_8);
    wr_8.newline();
  }
  var i_125 int64 = 0;  
  for ; i_125 < int64(len(cl_11.value.(*RangerAppClassDesc).defined_variants)) ; i_125++ {
    fnVar_6 := cl_11.value.(*RangerAppClassDesc).defined_variants[i_125];
    var mVs_6 *GoNullable = new(GoNullable); 
    mVs_6 = r_get_string_RangerAppMethodVariants(cl_11.value.(*RangerAppClassDesc).method_variants, fnVar_6);
    var i_132 int64 = 0;  
    for ; i_132 < int64(len(mVs_6.value.(*RangerAppMethodVariants).variants)) ; i_132++ {
      variant_12 := mVs_6.value.(*RangerAppMethodVariants).variants[i_132];
      wr_8.out("", true);
      wr_8.out("def ", false);
      wr_8.out(" ", false);
      wr_8.out(strings.Join([]string{ variant_12.name,"(" }, ""), false);
      this.writeArgsDef(variant_12, ctx, wr_8);
      wr_8.out(") : ", false);
      this.writeTypeDef(variant_12.nameNode.value.(*CodeNode), ctx, wr_8);
      wr_8.out(" = {", true);
      wr_8.indent(1);
      wr_8.newline();
      var subCtx_34 *RangerAppWriterContext = variant_12.fnCtx.value.(*RangerAppWriterContext);
      subCtx_34.is_function = true; 
      this.WalkNode(variant_12.fnBody.value.(*CodeNode), subCtx_34, wr_8);
      wr_8.newline();
      wr_8.indent(-1);
      wr_8.out("}", true);
    }
  }
  wr_8.indent(-1);
  wr_8.out("}", true);
  var b_had_app bool = false;
  var app_obj *GoNullable = new(GoNullable); 
  if  (int64(len(cl_11.value.(*RangerAppClassDesc).static_methods))) > 0 {
    wr_8.out("", true);
    wr_8.out(strings.Join([]string{ "// companion object for static methods of ",cl_11.value.(*RangerAppClassDesc).name }, ""), true);
    wr_8.out(strings.Join([]string{ (strings.Join([]string{ "object ",cl_11.value.(*RangerAppClassDesc).name }, ""))," {" }, ""), true);
    wr_8.indent(1);
  }
  var i_131 int64 = 0;  
  for ; i_131 < int64(len(cl_11.value.(*RangerAppClassDesc).static_methods)) ; i_131++ {
    variant_17 := cl_11.value.(*RangerAppClassDesc).static_methods[i_131];
    if  variant_17.nameNode.value.(*CodeNode).hasFlag("main") {
      b_had_app = true; 
      app_obj.value = variant_17;
      app_obj.has_value = true; /* detected as non-optional */
      continue;
    }
    wr_8.out("", true);
    wr_8.out("def ", false);
    wr_8.out(" ", false);
    wr_8.out(strings.Join([]string{ variant_17.name,"(" }, ""), false);
    this.writeArgsDef(variant_17, ctx, wr_8);
    wr_8.out(") : ", false);
    this.writeTypeDef(variant_17.nameNode.value.(*CodeNode), ctx, wr_8);
    wr_8.out(" = {", true);
    wr_8.indent(1);
    wr_8.newline();
    var subCtx_37 *RangerAppWriterContext = variant_17.fnCtx.value.(*RangerAppWriterContext);
    subCtx_37.is_function = true; 
    this.WalkNode(variant_17.fnBody.value.(*CodeNode), subCtx_37, wr_8);
    wr_8.newline();
    wr_8.indent(-1);
    wr_8.out("}", true);
  }
  if  (int64(len(cl_11.value.(*RangerAppClassDesc).static_methods))) > 0 {
    wr_8.newline();
    wr_8.indent(-1);
    wr_8.out("}", true);
  }
  if  b_had_app {
    var variant_20 *GoNullable = new(GoNullable); 
    variant_20.value = app_obj.value;
    variant_20.has_value = app_obj.has_value;
    wr_8.out("", true);
    wr_8.out(strings.Join([]string{ "// application main function for ",cl_11.value.(*RangerAppClassDesc).name }, ""), true);
    wr_8.out(strings.Join([]string{ (strings.Join([]string{ "object App",cl_11.value.(*RangerAppClassDesc).name }, ""))," extends App {" }, ""), true);
    wr_8.indent(1);
    wr_8.indent(1);
    wr_8.newline();
    var subCtx_40 *RangerAppWriterContext = variant_20.value.(*RangerAppFunctionDesc).fnCtx.value.(*RangerAppWriterContext);
    subCtx_40.is_function = true; 
    this.WalkNode(variant_20.value.(*RangerAppFunctionDesc).fnBody.value.(*CodeNode), subCtx_40, wr_8);
    wr_8.newline();
    wr_8.indent(-1);
    wr_8.out("}", true);
  }
  var import_list_3 []string = wr_8.getImports();
  var i_134 int64 = 0;  
  for ; i_134 < int64(len(import_list_3)) ; i_134++ {
    codeStr_3 := import_list_3[i_134];
    importFork_4.out(strings.Join([]string{ (strings.Join([]string{ "import ",codeStr_3 }, "")),";" }, ""), true);
  }
}
// inherited methods from parent class RangerGenericClassWriter
func (this *RangerScalaClassWriter) EncodeString (node *CodeNode, ctx *RangerAppWriterContext, wr *CodeWriter) string {
  /** unused:  encoded_str_2*/
  var str_length_2 int64 = int64(len(node.string_value));
  var encoded_str_8 string = "";
  var ii_11 int64 = 0;
  for ii_11 < str_length_2 {var cc_4 int64 = int64(node.string_value[ii_11]);
    switch (cc_4 ) { 
      case 8 : 
        encoded_str_8 = strings.Join([]string{ (strings.Join([]string{ encoded_str_8,(string([] byte{byte(92)})) }, "")),(string([] byte{byte(98)})) }, ""); 
      case 9 : 
        encoded_str_8 = strings.Join([]string{ (strings.Join([]string{ encoded_str_8,(string([] byte{byte(92)})) }, "")),(string([] byte{byte(116)})) }, ""); 
      case 10 : 
        encoded_str_8 = strings.Join([]string{ (strings.Join([]string{ encoded_str_8,(string([] byte{byte(92)})) }, "")),(string([] byte{byte(110)})) }, ""); 
      case 12 : 
        encoded_str_8 = strings.Join([]string{ (strings.Join([]string{ encoded_str_8,(string([] byte{byte(92)})) }, "")),(string([] byte{byte(102)})) }, ""); 
      case 13 : 
        encoded_str_8 = strings.Join([]string{ (strings.Join([]string{ encoded_str_8,(string([] byte{byte(92)})) }, "")),(string([] byte{byte(114)})) }, ""); 
      case 34 : 
        encoded_str_8 = strings.Join([]string{ (strings.Join([]string{ encoded_str_8,(string([] byte{byte(92)})) }, "")),(string([] byte{byte(34)})) }, ""); 
      case 92 : 
        encoded_str_8 = strings.Join([]string{ (strings.Join([]string{ encoded_str_8,(string([] byte{byte(92)})) }, "")),(string([] byte{byte(92)})) }, ""); 
      default: 
        encoded_str_8 = strings.Join([]string{ encoded_str_8,(string([] byte{byte(cc_4)})) }, ""); 
    }
    ii_11 = ii_11 + 1; 
  }
  return encoded_str_8;
}
func (this *RangerScalaClassWriter) CustomOperator (node *CodeNode, ctx *RangerAppWriterContext, wr *CodeWriter) () {
}
func (this *RangerScalaClassWriter) WriteSetterVRef (node *CodeNode, ctx *RangerAppWriterContext, wr *CodeWriter) () {
}
func (this *RangerScalaClassWriter) writeArrayTypeDef (node *CodeNode, ctx *RangerAppWriterContext, wr *CodeWriter) () {
}
func (this *RangerScalaClassWriter) WriteEnum (node *CodeNode, ctx *RangerAppWriterContext, wr *CodeWriter) () {
  if  node.eval_type == 11 {
    var rootObjName_2 string = node.ns[0];
    var e_8 *GoNullable = new(GoNullable); 
    e_8 = ctx.getEnum(rootObjName_2);
    if  e_8.has_value {
      var enumName_2 string = node.ns[1];
      wr.out(strings.Join([]string{ "",strconv.FormatInt(((r_get_string_int64(e_8.value.(*RangerAppEnum).values, enumName_2)).value.(int64)), 10) }, ""), false);
    } else {
      if  node.hasParamDesc {
        var pp_4 *GoNullable = new(GoNullable); 
        pp_4.value = node.paramDesc.value;
        pp_4.has_value = node.paramDesc.has_value;
        var nn_8 *GoNullable = new(GoNullable); 
        nn_8.value = pp_4.value.(IFACE_RangerAppParamDesc).Get_nameNode().value;
        nn_8.has_value = pp_4.value.(IFACE_RangerAppParamDesc).Get_nameNode().has_value;
        this.WriteVRef(nn_8.value.(*CodeNode), ctx, wr);
      }
    }
  }
}
func (this *RangerScalaClassWriter) WriteScalarValue (node *CodeNode, ctx *RangerAppWriterContext, wr *CodeWriter) () {
  switch (node.value_type ) { 
    case 2 : 
      wr.out(strings.Join([]string{ "",strconv.FormatFloat(node.double_value,'f', 6, 64) }, ""), false);
    case 4 : 
      var s_18 string = this.EncodeString(node, ctx, wr);
      wr.out(strings.Join([]string{ (strings.Join([]string{ "\"",s_18 }, "")),"\"" }, ""), false);
    case 3 : 
      wr.out(strings.Join([]string{ "",strconv.FormatInt(node.int_value, 10) }, ""), false);
    case 5 : 
      if  node.boolean_value {
        wr.out("true", false);
      } else {
        wr.out("false", false);
      }
  }
}
func (this *RangerScalaClassWriter) import_lib (lib_name string, ctx *RangerAppWriterContext, wr *CodeWriter) () {
  wr.addImport(lib_name);
}
func (this *RangerScalaClassWriter) release_local_vars (node *CodeNode, ctx *RangerAppWriterContext, wr *CodeWriter) () {
  var i_61 int64 = 0;  
  for ; i_61 < int64(len(ctx.localVarNames)) ; i_61++ {
    n_7 := ctx.localVarNames[i_61];
    var p_14 *GoNullable = new(GoNullable); 
    p_14 = r_get_string_IFACE_RangerAppParamDesc(ctx.localVariables, n_7);
    if  p_14.value.(IFACE_RangerAppParamDesc).Get_ref_cnt() == 0 {
      continue;
    }
    if  p_14.value.(IFACE_RangerAppParamDesc).isAllocatedType() {
      if  1 == p_14.value.(IFACE_RangerAppParamDesc).getStrength() {
        if  p_14.value.(IFACE_RangerAppParamDesc).Get_nameNode().value.(*CodeNode).eval_type == 7 {
        }
        if  p_14.value.(IFACE_RangerAppParamDesc).Get_nameNode().value.(*CodeNode).eval_type == 6 {
        }
        if  (p_14.value.(IFACE_RangerAppParamDesc).Get_nameNode().value.(*CodeNode).eval_type != 6) && (p_14.value.(IFACE_RangerAppParamDesc).Get_nameNode().value.(*CodeNode).eval_type != 7) {
        }
      }
      if  0 == p_14.value.(IFACE_RangerAppParamDesc).getStrength() {
        if  p_14.value.(IFACE_RangerAppParamDesc).Get_nameNode().value.(*CodeNode).eval_type == 7 {
        }
        if  p_14.value.(IFACE_RangerAppParamDesc).Get_nameNode().value.(*CodeNode).eval_type == 6 {
        }
        if  (p_14.value.(IFACE_RangerAppParamDesc).Get_nameNode().value.(*CodeNode).eval_type != 6) && (p_14.value.(IFACE_RangerAppParamDesc).Get_nameNode().value.(*CodeNode).eval_type != 7) {
        }
      }
    }
  }
  if  ctx.is_function {
    return;
  }
  if  ctx.parent.has_value {
    this.release_local_vars(node, ctx.parent.value.(*RangerAppWriterContext), wr);
  }
}
func (this *RangerScalaClassWriter) WalkNode (node *CodeNode, ctx *RangerAppWriterContext, wr *CodeWriter) () {
  this.compiler.value.(*LiveCompiler).WalkNode(node, ctx, wr);
}
func (this *RangerScalaClassWriter) writeRawTypeDef (node *CodeNode, ctx *RangerAppWriterContext, wr *CodeWriter) () {
  this.writeTypeDef(node, ctx, wr);
}
func (this *RangerScalaClassWriter) adjustType (tn string) string {
  return tn;
}
func (this *RangerScalaClassWriter) writeFnCall (node *CodeNode, ctx *RangerAppWriterContext, wr *CodeWriter) () {
  if  node.hasFnCall {
    var fc_20 *CodeNode = node.getFirst();
    this.WriteVRef(fc_20, ctx, wr);
    wr.out("(", false);
    var givenArgs_2 *CodeNode = node.getSecond();
    ctx.setInExpr();
    var i_68 int64 = 0;  
    for ; i_68 < int64(len(node.fnDesc.value.(*RangerAppFunctionDesc).params)) ; i_68++ {
      arg_12 := node.fnDesc.value.(*RangerAppFunctionDesc).params[i_68];
      if  i_68 > 0 {
        wr.out(", ", false);
      }
      if  (int64(len(givenArgs_2.children))) <= i_68 {
        var defVal *GoNullable = new(GoNullable); 
        defVal = arg_12.Get_nameNode().value.(*CodeNode).getFlag("default");
        if  defVal.has_value {
          var fc_31 *CodeNode = defVal.value.(*CodeNode).vref_annotation.value.(*CodeNode).getFirst();
          this.WalkNode(fc_31, ctx, wr);
        } else {
          ctx.addError(node, "Default argument was missing");
        }
        continue;
      }
      var n_10 *CodeNode = givenArgs_2.children[i_68];
      this.WalkNode(n_10, ctx, wr);
    }
    ctx.unsetInExpr();
    wr.out(")", false);
    if  ctx.expressionLevel() == 0 {
      wr.out(";", true);
    }
  }
}
func (this *RangerScalaClassWriter) writeNewCall (node *CodeNode, ctx *RangerAppWriterContext, wr *CodeWriter) () {
  if  node.hasNewOper {
    var cl_2 *GoNullable = new(GoNullable); 
    cl_2.value = node.clDesc.value;
    cl_2.has_value = node.clDesc.has_value;
    /** unused:  fc_25*/
    wr.out(strings.Join([]string{ "new ",node.clDesc.value.(*RangerAppClassDesc).name }, ""), false);
    wr.out("(", false);
    var constr *GoNullable = new(GoNullable); 
    constr.value = cl_2.value.(*RangerAppClassDesc).constructor_fn.value;
    constr.has_value = cl_2.value.(*RangerAppClassDesc).constructor_fn.has_value;
    var givenArgs_5 *CodeNode = node.getThird();
    if  constr.has_value {
      var i_70 int64 = 0;  
      for ; i_70 < int64(len(constr.value.(*RangerAppFunctionDesc).params)) ; i_70++ {
        arg_15 := constr.value.(*RangerAppFunctionDesc).params[i_70];
        var n_12 *CodeNode = givenArgs_5.children[i_70];
        if  i_70 > 0 {
          wr.out(", ", false);
        }
        if  true || (arg_15.Get_nameNode().has_value) {
          this.WalkNode(n_12, ctx, wr);
        }
      }
    }
    wr.out(")", false);
  }
}
// getter for variable compiler
func (this *RangerScalaClassWriter) Get_compiler() *GoNullable {
  return this.compiler
}
// setter for variable compiler
func (this *RangerScalaClassWriter) Set_compiler( value *GoNullable)  {
  this.compiler = value 
}
// inherited getters and setters from the parent class RangerGenericClassWriter
type RangerGolangClassWriter struct { 
  compiler *GoNullable /**  unused  **/ 
  thisName string
  write_raw_type bool
  did_write_nullable bool
  // inherited from parent class RangerGenericClassWriter
}
type IFACE_RangerGolangClassWriter interface { 
  Get_compiler() *GoNullable
  Set_compiler(value *GoNullable) 
  Get_thisName() string
  Set_thisName(value string) 
  Get_write_raw_type() bool
  Set_write_raw_type(value bool) 
  Get_did_write_nullable() bool
  Set_did_write_nullable(value bool) 
  WriteScalarValue(node *CodeNode, ctx *RangerAppWriterContext, wr *CodeWriter) ()
  getObjectTypeString(type_string string, ctx *RangerAppWriterContext) string
  getTypeString2(type_string string, ctx *RangerAppWriterContext) string
  writeRawTypeDef(node *CodeNode, ctx *RangerAppWriterContext, wr *CodeWriter) ()
  writeTypeDef(node *CodeNode, ctx *RangerAppWriterContext, wr *CodeWriter) ()
  writeArrayTypeDef(node *CodeNode, ctx *RangerAppWriterContext, wr *CodeWriter) ()
  writeTypeDef2(node *CodeNode, ctx *RangerAppWriterContext, wr *CodeWriter) ()
  WriteVRef(node *CodeNode, ctx *RangerAppWriterContext, wr *CodeWriter) ()
  WriteSetterVRef(node *CodeNode, ctx *RangerAppWriterContext, wr *CodeWriter) ()
  goExtractAssign(value *CodeNode, p IFACE_RangerAppParamDesc, ctx *RangerAppWriterContext, wr *CodeWriter) ()
  writeStructField(node *CodeNode, ctx *RangerAppWriterContext, wr *CodeWriter) ()
  writeVarDef(node *CodeNode, ctx *RangerAppWriterContext, wr *CodeWriter) ()
  writeArgsDef(fnDesc *RangerAppFunctionDesc, ctx *RangerAppWriterContext, wr *CodeWriter) ()
  writeNewCall(node *CodeNode, ctx *RangerAppWriterContext, wr *CodeWriter) ()
  CustomOperator(node *CodeNode, ctx *RangerAppWriterContext, wr *CodeWriter) ()
  writeClass(node *CodeNode, ctx *RangerAppWriterContext, orig_wr *CodeWriter) ()
}

func CreateNew_RangerGolangClassWriter() *RangerGolangClassWriter {
  me := new(RangerGolangClassWriter)
  me.thisName = "this"
  me.write_raw_type = false
  me.did_write_nullable = false
  me.compiler = new(GoNullable);
  me.compiler = new(GoNullable);
  return me;
}
func (this *RangerGolangClassWriter) WriteScalarValue (node *CodeNode, ctx *RangerAppWriterContext, wr *CodeWriter) () {
  switch (node.value_type ) { 
    case 2 : 
      wr.out(node.getParsedString(), false);
    case 4 : 
      var s_20 string = this.EncodeString(node, ctx, wr);
      wr.out(strings.Join([]string{ (strings.Join([]string{ "\"",s_20 }, "")),"\"" }, ""), false);
    case 3 : 
      wr.out(strings.Join([]string{ "",strconv.FormatInt(node.int_value, 10) }, ""), false);
    case 5 : 
      if  node.boolean_value {
        wr.out("true", false);
      } else {
        wr.out("false", false);
      }
  }
}
func (this *RangerGolangClassWriter) getObjectTypeString (type_string string, ctx *RangerAppWriterContext) string {
  if  type_string == "this" {
    return this.thisName;
  }
  if  ctx.isDefinedClass(type_string) {
    var cc_5 *RangerAppClassDesc = ctx.findClass(type_string);
    if  cc_5.doesInherit() {
      return strings.Join([]string{ "IFACE_",ctx.transformTypeName(type_string) }, "");
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
  }
  return ctx.transformTypeName(type_string);
}
func (this *RangerGolangClassWriter) getTypeString2 (type_string string, ctx *RangerAppWriterContext) string {
  if  type_string == "this" {
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
  }
  return ctx.transformTypeName(type_string);
}
func (this *RangerGolangClassWriter) writeRawTypeDef (node *CodeNode, ctx *RangerAppWriterContext, wr *CodeWriter) () {
  this.write_raw_type = true; 
  this.writeTypeDef(node, ctx, wr);
  this.write_raw_type = false; 
}
func (this *RangerGolangClassWriter) writeTypeDef (node *CodeNode, ctx *RangerAppWriterContext, wr *CodeWriter) () {
  this.writeTypeDef2(node, ctx, wr);
}
func (this *RangerGolangClassWriter) writeArrayTypeDef (node *CodeNode, ctx *RangerAppWriterContext, wr *CodeWriter) () {
  var v_type_7 int64 = node.value_type;
  var a_name_3 string = node.array_type;
  if  ((v_type_7 == 8) || (v_type_7 == 9)) || (v_type_7 == 0) {
    v_type_7 = node.typeNameAsType(ctx); 
  }
  if  node.eval_type != 0 {
    v_type_7 = node.eval_type; 
    if  (int64(len(node.eval_array_type))) > 0 {
      a_name_3 = node.eval_array_type; 
    }
  }
  switch (v_type_7 ) { 
    case 7 : 
      if  ctx.isDefinedClass(a_name_3) {
        var cc_8 *RangerAppClassDesc = ctx.findClass(a_name_3);
        if  cc_8.doesInherit() {
          wr.out(strings.Join([]string{ "IFACE_",this.getTypeString2(a_name_3, ctx) }, ""), false);
          return;
        }
      }
      if  ctx.isPrimitiveType(a_name_3) == false {
        wr.out("*", false);
      }
      wr.out(strings.Join([]string{ this.getObjectTypeString(a_name_3, ctx),"" }, ""), false);
    case 6 : 
      if  ctx.isDefinedClass(a_name_3) {
        var cc_14 *RangerAppClassDesc = ctx.findClass(a_name_3);
        if  cc_14.doesInherit() {
          wr.out(strings.Join([]string{ "IFACE_",this.getTypeString2(a_name_3, ctx) }, ""), false);
          return;
        }
      }
      if  (this.write_raw_type == false) && (ctx.isPrimitiveType(a_name_3) == false) {
        wr.out("*", false);
      }
      wr.out(strings.Join([]string{ this.getObjectTypeString(a_name_3, ctx),"" }, ""), false);
    default: 
  }
}
func (this *RangerGolangClassWriter) writeTypeDef2 (node *CodeNode, ctx *RangerAppWriterContext, wr *CodeWriter) () {
  var v_type_10 int64 = node.value_type;
  var t_name_2 string = node.type_name;
  var a_name_6 string = node.array_type;
  var k_name_2 string = node.key_type;
  if  ((v_type_10 == 8) || (v_type_10 == 9)) || (v_type_10 == 0) {
    v_type_10 = node.typeNameAsType(ctx); 
  }
  if  node.eval_type != 0 {
    v_type_10 = node.eval_type; 
    if  (int64(len(node.eval_type_name))) > 0 {
      t_name_2 = node.eval_type_name; 
    }
    if  (int64(len(node.eval_array_type))) > 0 {
      a_name_6 = node.eval_array_type; 
    }
    if  (int64(len(node.eval_key_type))) > 0 {
      k_name_2 = node.eval_key_type; 
    }
  }
  switch (v_type_10 ) { 
    case 11 : 
      wr.out("int64", false);
    case 3 : 
      wr.out("int64", false);
    case 2 : 
      wr.out("float64", false);
    case 4 : 
      wr.out("string", false);
    case 5 : 
      wr.out("bool", false);
    case 12 : 
      wr.out("byte", false);
    case 13 : 
      wr.out("[]byte", false);
    case 7 : 
      if  this.write_raw_type {
        wr.out(strings.Join([]string{ this.getObjectTypeString(a_name_6, ctx),"" }, ""), false);
      } else {
        wr.out(strings.Join([]string{ (strings.Join([]string{ "map[",this.getObjectTypeString(k_name_2, ctx) }, "")),"]" }, ""), false);
        if  ctx.isDefinedClass(a_name_6) {
          var cc_12 *RangerAppClassDesc = ctx.findClass(a_name_6);
          if  cc_12.doesInherit() {
            wr.out(strings.Join([]string{ "IFACE_",this.getTypeString2(a_name_6, ctx) }, ""), false);
            return;
          }
        }
        if  (this.write_raw_type == false) && (ctx.isPrimitiveType(a_name_6) == false) {
          wr.out("*", false);
        }
        wr.out(strings.Join([]string{ this.getObjectTypeString(a_name_6, ctx),"" }, ""), false);
      }
    case 6 : 
      if  false == this.write_raw_type {
        wr.out("[]", false);
      }
      if  ctx.isDefinedClass(a_name_6) {
        var cc_18 *RangerAppClassDesc = ctx.findClass(a_name_6);
        if  cc_18.doesInherit() {
          wr.out(strings.Join([]string{ "IFACE_",this.getTypeString2(a_name_6, ctx) }, ""), false);
          return;
        }
      }
      if  (this.write_raw_type == false) && (ctx.isPrimitiveType(a_name_6) == false) {
        wr.out("*", false);
      }
      wr.out(strings.Join([]string{ this.getObjectTypeString(a_name_6, ctx),"" }, ""), false);
    default: 
      if  node.type_name == "void" {
        wr.out("()", false);
        return;
      }
      if  ctx.isDefinedClass(t_name_2) {
        var cc_22 *RangerAppClassDesc = ctx.findClass(t_name_2);
        if  cc_22.doesInherit() {
          wr.out(strings.Join([]string{ "IFACE_",this.getTypeString2(t_name_2, ctx) }, ""), false);
          return;
        }
      }
      if  (this.write_raw_type == false) && (node.isPrimitiveType() == false) {
        wr.out("*", false);
      }
      wr.out(this.getTypeString2(t_name_2, ctx), false);
  }
}
func (this *RangerGolangClassWriter) WriteVRef (node *CodeNode, ctx *RangerAppWriterContext, wr *CodeWriter) () {
  if  node.vref == "this" {
    wr.out(this.thisName, false);
    return;
  }
  if  node.eval_type == 11 {
    if  (int64(len(node.ns))) > 1 {
      var rootObjName_10 string = node.ns[0];
      var enumName_10 string = node.ns[1];
      var e_16 *GoNullable = new(GoNullable); 
      e_16 = ctx.getEnum(rootObjName_10);
      if  e_16.has_value {
        wr.out(strings.Join([]string{ "",strconv.FormatInt(((r_get_string_int64(e_16.value.(*RangerAppEnum).values, enumName_10)).value.(int64)), 10) }, ""), false);
        return;
      }
    }
  }
  var next_is_gs bool = false;
  /** unused:  last_was_setter*/
  var needs_par bool = false;
  var ns_last int64 = (int64(len(node.ns))) - 1;
  if  (int64(len(node.nsp))) > 0 {
    var had_static bool = false;
    var i_120 int64 = 0;  
    for ; i_120 < int64(len(node.nsp)) ; i_120++ {
      p_33 := node.nsp[i_120];
      if  next_is_gs {
        if  p_33.isProperty() {
          wr.out(".Get_", false);
          needs_par = true; 
        } else {
          needs_par = false; 
        }
        next_is_gs = false; 
      }
      if  needs_par == false {
        if  i_120 > 0 {
          if  had_static {
            wr.out("_static_", false);
          } else {
            wr.out(".", false);
          }
        }
      }
      if  ctx.isDefinedClass(p_33.Get_nameNode().value.(*CodeNode).type_name) {
        var c_8 *RangerAppClassDesc = ctx.findClass(p_33.Get_nameNode().value.(*CodeNode).type_name);
        if  c_8.doesInherit() {
          next_is_gs = true; 
        }
      }
      if  i_120 == 0 {
        var part_9 string = node.ns[0];
        if  part_9 == "this" {
          wr.out(this.thisName, false);
          continue;
        }
        if  (part_9 != this.thisName) && ctx.isMemberVariable(part_9) {
          var cc_18 *GoNullable = new(GoNullable); 
          cc_18 = ctx.getCurrentClass();
          var currC_8 *RangerAppClassDesc = cc_18.value.(*RangerAppClassDesc);
          var up *GoNullable = new(GoNullable); 
          up = currC_8.findVariable(part_9);
          if  up.has_value {
            /** unused:  p3*/
            wr.out(strings.Join([]string{ this.thisName,"." }, ""), false);
          }
        }
      }
      if  (int64(len(p_33.Get_compiledName()))) > 0 {
        wr.out(this.adjustType(p_33.Get_compiledName()), false);
      } else {
        if  (int64(len(p_33.Get_name()))) > 0 {
          wr.out(this.adjustType(p_33.Get_name()), false);
        } else {
          wr.out(this.adjustType((node.ns[i_120])), false);
        }
      }
      if  needs_par {
        wr.out("()", false);
        needs_par = false; 
      }
      if  p_33.Get_nameNode().value.(*CodeNode).hasFlag("optional") && (i_120 != ns_last) {
        wr.out(".value.(", false);
        this.writeTypeDef(p_33.Get_nameNode().value.(*CodeNode), ctx, wr);
        wr.out(")", false);
      }
      if  p_33.isClass() {
        had_static = true; 
      }
    }
    return;
  }
  if  node.hasParamDesc {
    var part_14 string = node.ns[0];
    if  (part_14 != this.thisName) && ctx.isMemberVariable(part_14) {
      var cc_22 *GoNullable = new(GoNullable); 
      cc_22 = ctx.getCurrentClass();
      var currC_13 *RangerAppClassDesc = cc_22.value.(*RangerAppClassDesc);
      var up_6 *GoNullable = new(GoNullable); 
      up_6 = currC_13.findVariable(part_14);
      if  up_6.has_value {
        /** unused:  p3_6*/
        wr.out(strings.Join([]string{ this.thisName,"." }, ""), false);
      }
    }
    var p_38 *GoNullable = new(GoNullable); 
    p_38.value = node.paramDesc.value;
    p_38.has_value = node.paramDesc.has_value;
    wr.out(p_38.value.(IFACE_RangerAppParamDesc).Get_compiledName(), false);
    return;
  }
  var b_was_static bool = false;
  var i_125 int64 = 0;  
  for ; i_125 < int64(len(node.ns)) ; i_125++ {
    part_17 := node.ns[i_125];
    if  i_125 > 0 {
      if  (i_125 == 1) && b_was_static {
        wr.out("_static_", false);
      } else {
        wr.out(".", false);
      }
    }
    if  i_125 == 0 {
      if  part_17 == "this" {
        wr.out(this.thisName, false);
        continue;
      }
      if  ctx.hasClass(part_17) {
        b_was_static = true; 
      }
      if  (part_17 != "this") && ctx.isMemberVariable(part_17) {
        var cc_25 *GoNullable = new(GoNullable); 
        cc_25 = ctx.getCurrentClass();
        var currC_16 *RangerAppClassDesc = cc_25.value.(*RangerAppClassDesc);
        var up_9 *GoNullable = new(GoNullable); 
        up_9 = currC_16.findVariable(part_17);
        if  up_9.has_value {
          /** unused:  p3_9*/
          wr.out(strings.Join([]string{ this.thisName,"." }, ""), false);
        }
      }
    }
    wr.out(this.adjustType(part_17), false);
  }
}
func (this *RangerGolangClassWriter) WriteSetterVRef (node *CodeNode, ctx *RangerAppWriterContext, wr *CodeWriter) () {
  if  node.vref == "this" {
    wr.out(this.thisName, false);
    return;
  }
  if  node.eval_type == 11 {
    var rootObjName_13 string = node.ns[0];
    var enumName_13 string = node.ns[1];
    var e_19 *GoNullable = new(GoNullable); 
    e_19 = ctx.getEnum(rootObjName_13);
    if  e_19.has_value {
      wr.out(strings.Join([]string{ "",strconv.FormatInt(((r_get_string_int64(e_19.value.(*RangerAppEnum).values, enumName_13)).value.(int64)), 10) }, ""), false);
      return;
    }
  }
  var next_is_gs_4 bool = false;
  /** unused:  last_was_setter_4*/
  var needs_par_4 bool = false;
  var ns_len int64 = (int64(len(node.ns))) - 1;
  if  (int64(len(node.nsp))) > 0 {
    var had_static_4 bool = false;
    var i_125 int64 = 0;  
    for ; i_125 < int64(len(node.nsp)) ; i_125++ {
      p_38 := node.nsp[i_125];
      if  next_is_gs_4 {
        if  p_38.isProperty() {
          wr.out(".Get_", false);
          needs_par_4 = true; 
        } else {
          needs_par_4 = false; 
        }
        next_is_gs_4 = false; 
      }
      if  needs_par_4 == false {
        if  i_125 > 0 {
          if  had_static_4 {
            wr.out("_static_", false);
          } else {
            wr.out(".", false);
          }
        }
      }
      if  ctx.isDefinedClass(p_38.Get_nameNode().value.(*CodeNode).type_name) {
        var c_11 *RangerAppClassDesc = ctx.findClass(p_38.Get_nameNode().value.(*CodeNode).type_name);
        if  c_11.doesInherit() {
          next_is_gs_4 = true; 
        }
      }
      if  i_125 == 0 {
        var part_16 string = node.ns[0];
        if  part_16 == "this" {
          wr.out(this.thisName, false);
          continue;
        }
        if  (part_16 != this.thisName) && ctx.isMemberVariable(part_16) {
          var cc_24 *GoNullable = new(GoNullable); 
          cc_24 = ctx.getCurrentClass();
          var currC_15 *RangerAppClassDesc = cc_24.value.(*RangerAppClassDesc);
          var up_8 *GoNullable = new(GoNullable); 
          up_8 = currC_15.findVariable(part_16);
          if  up_8.has_value {
            /** unused:  p3_8*/
            wr.out(strings.Join([]string{ this.thisName,"." }, ""), false);
          }
        }
      }
      if  (int64(len(p_38.Get_compiledName()))) > 0 {
        wr.out(this.adjustType(p_38.Get_compiledName()), false);
      } else {
        if  (int64(len(p_38.Get_name()))) > 0 {
          wr.out(this.adjustType(p_38.Get_name()), false);
        } else {
          wr.out(this.adjustType((node.ns[i_125])), false);
        }
      }
      if  needs_par_4 {
        wr.out("()", false);
        needs_par_4 = false; 
      }
      if  i_125 < ns_len {
        if  p_38.Get_nameNode().value.(*CodeNode).hasFlag("optional") {
          wr.out(".value.(", false);
          this.writeTypeDef(p_38.Get_nameNode().value.(*CodeNode), ctx, wr);
          wr.out(")", false);
        }
      }
      if  p_38.isClass() {
        had_static_4 = true; 
      }
    }
    return;
  }
  if  node.hasParamDesc {
    var part_20 string = node.ns[0];
    if  (part_20 != this.thisName) && ctx.isMemberVariable(part_20) {
      var cc_28 *GoNullable = new(GoNullable); 
      cc_28 = ctx.getCurrentClass();
      var currC_19 *RangerAppClassDesc = cc_28.value.(*RangerAppClassDesc);
      var up_12 *GoNullable = new(GoNullable); 
      up_12 = currC_19.findVariable(part_20);
      if  up_12.has_value {
        /** unused:  p3_12*/
        wr.out(strings.Join([]string{ this.thisName,"." }, ""), false);
      }
    }
    var p_42 *GoNullable = new(GoNullable); 
    p_42.value = node.paramDesc.value;
    p_42.has_value = node.paramDesc.has_value;
    wr.out(p_42.value.(IFACE_RangerAppParamDesc).Get_compiledName(), false);
    return;
  }
  var b_was_static_4 bool = false;
  var i_129 int64 = 0;  
  for ; i_129 < int64(len(node.ns)) ; i_129++ {
    part_23 := node.ns[i_129];
    if  i_129 > 0 {
      if  (i_129 == 1) && b_was_static_4 {
        wr.out("_static_", false);
      } else {
        wr.out(".", false);
      }
    }
    if  i_129 == 0 {
      if  part_23 == "this" {
        wr.out(this.thisName, false);
        continue;
      }
      if  ctx.hasClass(part_23) {
        b_was_static_4 = true; 
      }
      if  (part_23 != "this") && ctx.isMemberVariable(part_23) {
        var cc_31 *GoNullable = new(GoNullable); 
        cc_31 = ctx.getCurrentClass();
        var currC_22 *RangerAppClassDesc = cc_31.value.(*RangerAppClassDesc);
        var up_15 *GoNullable = new(GoNullable); 
        up_15 = currC_22.findVariable(part_23);
        if  up_15.has_value {
          /** unused:  p3_15*/
          wr.out(strings.Join([]string{ this.thisName,"." }, ""), false);
        }
      }
    }
    wr.out(this.adjustType(part_23), false);
  }
}
func (this *RangerGolangClassWriter) goExtractAssign (value *CodeNode, p IFACE_RangerAppParamDesc, ctx *RangerAppWriterContext, wr *CodeWriter) () {
  var arr_node *CodeNode = value.children[1];
  wr.newline();
  wr.out("", true);
  wr.out("// array_extract operator ", true);
  wr.out("var ", false);
  var pArr IFACE_RangerAppParamDesc = CreateNew_RangerAppParamDesc();
  pArr.Set_name("_arrTemp"); 
  pArr.Get_node().value = arr_node;
  pArr.Get_node().has_value = true; /* detected as non-optional */
  pArr.Get_nameNode().value = arr_node;
  pArr.Get_nameNode().has_value = true; /* detected as non-optional */
  pArr.Set_is_optional(false); 
  ctx.defineVariable(p.Get_name(), pArr);
  wr.out(pArr.Get_compiledName(), false);
  wr.out(" ", false);
  this.writeTypeDef(arr_node, ctx, wr);
  wr.newline();
  wr.out(strings.Join([]string{ (strings.Join([]string{ (strings.Join([]string{ p.Get_compiledName()," , " }, "")),pArr.Get_compiledName() }, ""))," = " }, ""), false);
  ctx.setInExpr();
  this.WalkNode(value, ctx, wr);
  ctx.unsetInExpr();
  wr.out(";", true);
  var left *CodeNode = arr_node;
  var len_5 int64 = (int64(len(left.ns))) - 1;
  /** unused:  last_part*/
  var next_is_gs_6 bool = false;
  var last_was_setter_6 bool = false;
  var needs_par_6 bool = false;
  var b_was_static_6 bool = false;
  var i_129 int64 = 0;  
  for ; i_129 < int64(len(left.ns)) ; i_129++ {
    part_22 := left.ns[i_129];
    if  next_is_gs_6 {
      if  i_129 == len_5 {
        wr.out(".Set_", false);
        last_was_setter_6 = true; 
      } else {
        wr.out(".Get_", false);
        needs_par_6 = true; 
        next_is_gs_6 = false; 
        last_was_setter_6 = false; 
      }
    }
    if  (last_was_setter_6 == false) && (needs_par_6 == false) {
      if  i_129 > 0 {
        if  (i_129 == 1) && b_was_static_6 {
          wr.out("_static_", false);
        } else {
          wr.out(".", false);
        }
      }
    }
    if  i_129 == 0 {
      if  part_22 == "this" {
        wr.out(this.thisName, false);
        continue;
      }
      if  ctx.hasClass(part_22) {
        b_was_static_6 = true; 
      }
      var partDef IFACE_RangerAppParamDesc = ctx.getVariableDef(part_22);
      if  partDef.Get_nameNode().has_value {
        if  ctx.isDefinedClass(partDef.Get_nameNode().value.(*CodeNode).type_name) {
          var c_13 *RangerAppClassDesc = ctx.findClass(partDef.Get_nameNode().value.(*CodeNode).type_name);
          if  c_13.doesInherit() {
            next_is_gs_6 = true; 
          }
        }
      }
      if  (part_22 != "this") && ctx.isMemberVariable(part_22) {
        var cc_30 *GoNullable = new(GoNullable); 
        cc_30 = ctx.getCurrentClass();
        var currC_21 *RangerAppClassDesc = cc_30.value.(*RangerAppClassDesc);
        var up_14 *GoNullable = new(GoNullable); 
        up_14 = currC_21.findVariable(part_22);
        if  up_14.has_value {
          /** unused:  p3_14*/
          wr.out(strings.Join([]string{ this.thisName,"." }, ""), false);
        }
      }
    }
    if  (int64(len(left.nsp))) > 0 {
      var p_45 IFACE_RangerAppParamDesc = left.nsp[i_129];
      wr.out(this.adjustType(p_45.Get_compiledName()), false);
    } else {
      if  left.hasParamDesc {
        wr.out(left.paramDesc.value.(IFACE_RangerAppParamDesc).Get_compiledName(), false);
      } else {
        wr.out(this.adjustType(part_22), false);
      }
    }
    if  needs_par_6 {
      wr.out("()", false);
      needs_par_6 = false; 
    }
    if  (int64(len(left.nsp))) >= (i_129 + 1) {
      var pp_6 IFACE_RangerAppParamDesc = left.nsp[i_129];
      if  pp_6.Get_nameNode().value.(*CodeNode).hasFlag("optional") {
        wr.out(".value.(", false);
        this.writeTypeDef(pp_6.Get_nameNode().value.(*CodeNode), ctx, wr);
        wr.out(")", false);
      }
    }
  }
  if  last_was_setter_6 {
    wr.out("(", false);
    wr.out(pArr.Get_compiledName(), false);
    wr.out("); ", true);
  } else {
    wr.out(" = ", false);
    wr.out(pArr.Get_compiledName(), false);
    wr.out("; ", true);
  }
  wr.out("", true);
}
func (this *RangerGolangClassWriter) writeStructField (node *CodeNode, ctx *RangerAppWriterContext, wr *CodeWriter) () {
  if  node.hasParamDesc {
    var nn_16 *CodeNode = node.children[1];
    var p_44 *GoNullable = new(GoNullable); 
    p_44.value = nn_16.paramDesc.value;
    p_44.has_value = nn_16.paramDesc.has_value;
    wr.out(strings.Join([]string{ p_44.value.(IFACE_RangerAppParamDesc).Get_compiledName()," " }, ""), false);
    if  p_44.value.(IFACE_RangerAppParamDesc).Get_nameNode().value.(*CodeNode).hasFlag("optional") {
      wr.out("*GoNullable", false);
    } else {
      this.writeTypeDef(p_44.value.(IFACE_RangerAppParamDesc).Get_nameNode().value.(*CodeNode), ctx, wr);
    }
    if  p_44.value.(IFACE_RangerAppParamDesc).Get_ref_cnt() == 0 {
      wr.out(" /**  unused  **/ ", false);
    }
    wr.out("", true);
    if  p_44.value.(IFACE_RangerAppParamDesc).Get_nameNode().value.(*CodeNode).hasFlag("optional") {
    }
  }
}
func (this *RangerGolangClassWriter) writeVarDef (node *CodeNode, ctx *RangerAppWriterContext, wr *CodeWriter) () {
  if  node.hasParamDesc {
    var nn_19 *CodeNode = node.children[1];
    var p_46 *GoNullable = new(GoNullable); 
    p_46.value = nn_19.paramDesc.value;
    p_46.has_value = nn_19.paramDesc.has_value;
    var b_not_used bool = false;
    if  (p_46.value.(IFACE_RangerAppParamDesc).Get_ref_cnt() == 0) && (p_46.value.(IFACE_RangerAppParamDesc).Get_is_class_variable() == false) {
      wr.out(strings.Join([]string{ (strings.Join([]string{ "/** unused:  ",p_46.value.(IFACE_RangerAppParamDesc).Get_compiledName() }, "")),"*/" }, ""), true);
      b_not_used = true; 
      return;
    }
    var map_or_hash bool = (nn_19.value_type == 6) || (nn_19.value_type == 7);
    if  nn_19.hasFlag("optional") {
      wr.out(strings.Join([]string{ (strings.Join([]string{ "var ",p_46.value.(IFACE_RangerAppParamDesc).Get_compiledName() }, ""))," *GoNullable = new(GoNullable); " }, ""), true);
      if  (int64(len(node.children))) > 2 {
        var value_9 *CodeNode = node.children[2];
        if  value_9.hasParamDesc {
          var pnn *GoNullable = new(GoNullable); 
          pnn.value = value_9.paramDesc.value.(IFACE_RangerAppParamDesc).Get_nameNode().value;
          pnn.has_value = value_9.paramDesc.value.(IFACE_RangerAppParamDesc).Get_nameNode().has_value;
          if  pnn.value.(*CodeNode).hasFlag("optional") {
            wr.out(strings.Join([]string{ p_46.value.(IFACE_RangerAppParamDesc).Get_compiledName(),".value = " }, ""), false);
            ctx.setInExpr();
            var value_23 *CodeNode = node.getThird();
            this.WalkNode(value_23, ctx, wr);
            ctx.unsetInExpr();
            wr.out(".value;", true);
            wr.out(strings.Join([]string{ p_46.value.(IFACE_RangerAppParamDesc).Get_compiledName(),".has_value = " }, ""), false);
            ctx.setInExpr();
            var value_33 *CodeNode = node.getThird();
            this.WalkNode(value_33, ctx, wr);
            ctx.unsetInExpr();
            wr.out(".has_value;", true);
            return;
          } else {
            wr.out(strings.Join([]string{ p_46.value.(IFACE_RangerAppParamDesc).Get_compiledName(),".value = " }, ""), false);
            ctx.setInExpr();
            var value_41 *CodeNode = node.getThird();
            this.WalkNode(value_41, ctx, wr);
            ctx.unsetInExpr();
            wr.out(";", true);
            wr.out(strings.Join([]string{ p_46.value.(IFACE_RangerAppParamDesc).Get_compiledName(),".has_value = true;" }, ""), true);
            return;
          }
        } else {
          wr.out(strings.Join([]string{ p_46.value.(IFACE_RangerAppParamDesc).Get_compiledName()," = " }, ""), false);
          ctx.setInExpr();
          var value_44 *CodeNode = node.getThird();
          this.WalkNode(value_44, ctx, wr);
          ctx.unsetInExpr();
          wr.out(";", true);
          return;
        }
      }
      return;
    } else {
      if  ((p_46.value.(IFACE_RangerAppParamDesc).Get_set_cnt() > 0) || p_46.value.(IFACE_RangerAppParamDesc).Get_is_class_variable()) || map_or_hash {
        wr.out(strings.Join([]string{ (strings.Join([]string{ "var ",p_46.value.(IFACE_RangerAppParamDesc).Get_compiledName() }, ""))," " }, ""), false);
      } else {
        wr.out(strings.Join([]string{ (strings.Join([]string{ "var ",p_46.value.(IFACE_RangerAppParamDesc).Get_compiledName() }, ""))," " }, ""), false);
      }
    }
    this.writeTypeDef2(p_46.value.(IFACE_RangerAppParamDesc).Get_nameNode().value.(*CodeNode), ctx, wr);
    if  (int64(len(node.children))) > 2 {
      var value_32 *CodeNode = node.getThird();
      if  value_32.expression && ((int64(len(value_32.children))) > 1) {
        var fc_30 *CodeNode = value_32.children[0];
        if  fc_30.vref == "array_extract" {
          this.goExtractAssign(value_32, p_46.value.(IFACE_RangerAppParamDesc), ctx, wr);
          return;
        }
      }
      wr.out(" = ", false);
      ctx.setInExpr();
      this.WalkNode(value_32, ctx, wr);
      ctx.unsetInExpr();
    } else {
      if  nn_19.value_type == 6 {
        wr.out(" = make(", false);
        this.writeTypeDef(p_46.value.(IFACE_RangerAppParamDesc).Get_nameNode().value.(*CodeNode), ctx, wr);
        wr.out(", 0)", false);
      }
      if  nn_19.value_type == 7 {
        wr.out(" = make(", false);
        this.writeTypeDef(p_46.value.(IFACE_RangerAppParamDesc).Get_nameNode().value.(*CodeNode), ctx, wr);
        wr.out(")", false);
      }
    }
    wr.out(";", false);
    if  (p_46.value.(IFACE_RangerAppParamDesc).Get_ref_cnt() == 0) && (p_46.value.(IFACE_RangerAppParamDesc).Get_is_class_variable() == true) {
      wr.out("     /** note: unused */", false);
    }
    if  (p_46.value.(IFACE_RangerAppParamDesc).Get_ref_cnt() == 0) && (p_46.value.(IFACE_RangerAppParamDesc).Get_is_class_variable() == false) {
      wr.out("   **/ ", true);
    } else {
      wr.newline();
    }
    if  b_not_used == false {
      if  nn_19.hasFlag("optional") {
        wr.addImport("errors");
      }
    }
  }
}
func (this *RangerGolangClassWriter) writeArgsDef (fnDesc *RangerAppFunctionDesc, ctx *RangerAppWriterContext, wr *CodeWriter) () {
  var i_131 int64 = 0;  
  for ; i_131 < int64(len(fnDesc.params)) ; i_131++ {
    arg_24 := fnDesc.params[i_131];
    if  i_131 > 0 {
      wr.out(", ", false);
    }
    wr.out(strings.Join([]string{ arg_24.Get_name()," " }, ""), false);
    if  arg_24.Get_nameNode().value.(*CodeNode).hasFlag("optional") {
      wr.out("*GoNullable", false);
    } else {
      this.writeTypeDef(arg_24.Get_nameNode().value.(*CodeNode), ctx, wr);
    }
  }
}
func (this *RangerGolangClassWriter) writeNewCall (node *CodeNode, ctx *RangerAppWriterContext, wr *CodeWriter) () {
  if  node.hasNewOper {
    var cl_12 *GoNullable = new(GoNullable); 
    cl_12.value = node.clDesc.value;
    cl_12.has_value = node.clDesc.has_value;
    /** unused:  fc_33*/
    wr.out(strings.Join([]string{ (strings.Join([]string{ "CreateNew_",node.clDesc.value.(*RangerAppClassDesc).name }, "")),"(" }, ""), false);
    var constr_11 *GoNullable = new(GoNullable); 
    constr_11.value = cl_12.value.(*RangerAppClassDesc).constructor_fn.value;
    constr_11.has_value = cl_12.value.(*RangerAppClassDesc).constructor_fn.has_value;
    var givenArgs_8 *CodeNode = node.getThird();
    if  constr_11.has_value {
      var i_133 int64 = 0;  
      for ; i_133 < int64(len(constr_11.value.(*RangerAppFunctionDesc).params)) ; i_133++ {
        arg_27 := constr_11.value.(*RangerAppFunctionDesc).params[i_133];
        var n_14 *CodeNode = givenArgs_8.children[i_133];
        if  i_133 > 0 {
          wr.out(", ", false);
        }
        if  true || (arg_27.Get_nameNode().has_value) {
          this.WalkNode(n_14, ctx, wr);
        }
      }
    }
    wr.out(")", false);
  }
}
func (this *RangerGolangClassWriter) CustomOperator (node *CodeNode, ctx *RangerAppWriterContext, wr *CodeWriter) () {
  var fc_35 *CodeNode = node.getFirst();
  var cmd_3 string = fc_35.vref;
  if  ((cmd_3 == "=") || (cmd_3 == "push")) || (cmd_3 == "removeLast") {
    var left_4 *CodeNode = node.getSecond();
    var right *CodeNode = left_4;
    if  (cmd_3 == "=") || (cmd_3 == "push") {
      right = node.getThird(); 
    }
    wr.newline();
    var b_was_static_8 bool = false;
    if  left_4.hasParamDesc {
      var len_8 int64 = (int64(len(left_4.ns))) - 1;
      /** unused:  last_part_4*/
      var next_is_gs_8 bool = false;
      var last_was_setter_8 bool = false;
      var needs_par_8 bool = false;
      var i_135 int64 = 0;  
      for ; i_135 < int64(len(left_4.ns)) ; i_135++ {
        part_24 := left_4.ns[i_135];
        if  next_is_gs_8 {
          if  i_135 == len_8 {
            wr.out(".Set_", false);
            last_was_setter_8 = true; 
          } else {
            wr.out(".Get_", false);
            needs_par_8 = true; 
            next_is_gs_8 = false; 
            last_was_setter_8 = false; 
          }
        }
        if  (last_was_setter_8 == false) && (needs_par_8 == false) {
          if  i_135 > 0 {
            if  (i_135 == 1) && b_was_static_8 {
              wr.out("_static_", false);
            } else {
              wr.out(".", false);
            }
          }
        }
        if  i_135 == 0 {
          if  part_24 == "this" {
            wr.out(this.thisName, false);
            continue;
          }
          if  ctx.hasClass(part_24) {
            b_was_static_8 = true; 
          }
          if  (part_24 != "this") && ctx.isMemberVariable(part_24) {
            var cc_32 *GoNullable = new(GoNullable); 
            cc_32 = ctx.getCurrentClass();
            var currC_23 *RangerAppClassDesc = cc_32.value.(*RangerAppClassDesc);
            var up_16 *GoNullable = new(GoNullable); 
            up_16 = currC_23.findVariable(part_24);
            if  up_16.has_value {
              /** unused:  p3_16*/
              wr.out(strings.Join([]string{ this.thisName,"." }, ""), false);
            }
          }
        }
        var partDef_4 IFACE_RangerAppParamDesc = ctx.getVariableDef(part_24);
        if  (int64(len(left_4.nsp))) > i_135 {
          partDef_4 = left_4.nsp[i_135]; 
        }
        if  partDef_4.Get_nameNode().has_value {
          if  ctx.isDefinedClass(partDef_4.Get_nameNode().value.(*CodeNode).type_name) {
            var c_15 *RangerAppClassDesc = ctx.findClass(partDef_4.Get_nameNode().value.(*CodeNode).type_name);
            if  c_15.doesInherit() {
              next_is_gs_8 = true; 
            }
          }
        }
        if  (int64(len(left_4.nsp))) > 0 {
          var p_48 IFACE_RangerAppParamDesc = left_4.nsp[i_135];
          wr.out(this.adjustType(p_48.Get_compiledName()), false);
        } else {
          if  left_4.hasParamDesc {
            wr.out(left_4.paramDesc.value.(IFACE_RangerAppParamDesc).Get_compiledName(), false);
          } else {
            wr.out(this.adjustType(part_24), false);
          }
        }
        if  needs_par_8 {
          wr.out("()", false);
          needs_par_8 = false; 
        }
        if  (int64(len(left_4.nsp))) >= (i_135 + 1) {
          var pp_9 IFACE_RangerAppParamDesc = left_4.nsp[i_135];
          if  pp_9.Get_nameNode().value.(*CodeNode).hasFlag("optional") {
            wr.out(".value.(", false);
            this.writeTypeDef(pp_9.Get_nameNode().value.(*CodeNode), ctx, wr);
            wr.out(")", false);
          }
        }
      }
      if  cmd_3 == "removeLast" {
        if  last_was_setter_8 {
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
      if  cmd_3 == "push" {
        if  last_was_setter_8 {
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
      if  last_was_setter_8 {
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
func (this *RangerGolangClassWriter) writeClass (node *CodeNode, ctx *RangerAppWriterContext, orig_wr *CodeWriter) () {
  var cl_15 *GoNullable = new(GoNullable); 
  cl_15.value = node.clDesc.value;
  cl_15.has_value = node.clDesc.has_value;
  if  !cl_15.has_value  {
    return;
  }
  var wr_9 *CodeWriter = orig_wr;
  if  this.did_write_nullable == false {
    wr_9.raw("\r\ntype GoNullable struct { \r\n  value interface{}\r\n  has_value bool\r\n}\r\n", true);
    wr_9.createTag("utilities");
    this.did_write_nullable = true; 
  }
  var declaredVariable_2 map[string]bool = make(map[string]bool);
  wr_9.out(strings.Join([]string{ (strings.Join([]string{ "type ",cl_15.value.(*RangerAppClassDesc).name }, ""))," struct { " }, ""), true);
  wr_9.indent(1);
  var i_137 int64 = 0;  
  for ; i_137 < int64(len(cl_15.value.(*RangerAppClassDesc).variables)) ; i_137++ {
    pvar_9 := cl_15.value.(*RangerAppClassDesc).variables[i_137];
    this.writeStructField(pvar_9.Get_node().value.(*CodeNode), ctx, wr_9);
    declaredVariable_2[pvar_9.Get_name()] = true
  }
  if  (int64(len(cl_15.value.(*RangerAppClassDesc).extends_classes))) > 0 {
    var i_141 int64 = 0;  
    for ; i_141 < int64(len(cl_15.value.(*RangerAppClassDesc).extends_classes)) ; i_141++ {
      pName_4 := cl_15.value.(*RangerAppClassDesc).extends_classes[i_141];
      var pC_2 *RangerAppClassDesc = ctx.findClass(pName_4);
      wr_9.out(strings.Join([]string{ "// inherited from parent class ",pName_4 }, ""), true);
      var i_150 int64 = 0;  
      for ; i_150 < int64(len(pC_2.variables)) ; i_150++ {
        pvar_14 := pC_2.variables[i_150];
        if  r_has_key_string_bool(declaredVariable_2, pvar_14.Get_name()) {
          continue;
        }
        this.writeStructField(pvar_14.Get_node().value.(*CodeNode), ctx, wr_9);
      }
    }
  }
  wr_9.indent(-1);
  wr_9.out("}", true);
  wr_9.out(strings.Join([]string{ (strings.Join([]string{ "type IFACE_",cl_15.value.(*RangerAppClassDesc).name }, ""))," interface { " }, ""), true);
  wr_9.indent(1);
  var i_147 int64 = 0;  
  for ; i_147 < int64(len(cl_15.value.(*RangerAppClassDesc).variables)) ; i_147++ {
    p_50 := cl_15.value.(*RangerAppClassDesc).variables[i_147];
    wr_9.out("Get_", false);
    wr_9.out(strings.Join([]string{ p_50.Get_compiledName(),"() " }, ""), false);
    if  p_50.Get_nameNode().value.(*CodeNode).hasFlag("optional") {
      wr_9.out("*GoNullable", false);
    } else {
      this.writeTypeDef(p_50.Get_nameNode().value.(*CodeNode), ctx, wr_9);
    }
    wr_9.out("", true);
    wr_9.out("Set_", false);
    wr_9.out(strings.Join([]string{ p_50.Get_compiledName(),"(value " }, ""), false);
    if  p_50.Get_nameNode().value.(*CodeNode).hasFlag("optional") {
      wr_9.out("*GoNullable", false);
    } else {
      this.writeTypeDef(p_50.Get_nameNode().value.(*CodeNode), ctx, wr_9);
    }
    wr_9.out(") ", true);
  }
  var i_150 int64 = 0;  
  for ; i_150 < int64(len(cl_15.value.(*RangerAppClassDesc).defined_variants)) ; i_150++ {
    fnVar_7 := cl_15.value.(*RangerAppClassDesc).defined_variants[i_150];
    var mVs_7 *GoNullable = new(GoNullable); 
    mVs_7 = r_get_string_RangerAppMethodVariants(cl_15.value.(*RangerAppClassDesc).method_variants, fnVar_7);
    var i_157 int64 = 0;  
    for ; i_157 < int64(len(mVs_7.value.(*RangerAppMethodVariants).variants)) ; i_157++ {
      variant_15 := mVs_7.value.(*RangerAppMethodVariants).variants[i_157];
      wr_9.out(strings.Join([]string{ variant_15.name,"(" }, ""), false);
      this.writeArgsDef(variant_15, ctx, wr_9);
      wr_9.out(") ", false);
      if  variant_15.nameNode.value.(*CodeNode).hasFlag("optional") {
        wr_9.out("*GoNullable", false);
      } else {
        this.writeTypeDef(variant_15.nameNode.value.(*CodeNode), ctx, wr_9);
      }
      wr_9.out("", true);
    }
  }
  wr_9.indent(-1);
  wr_9.out("}", true);
  this.thisName = "me"; 
  wr_9.out("", true);
  wr_9.out(strings.Join([]string{ (strings.Join([]string{ "func CreateNew_",cl_15.value.(*RangerAppClassDesc).name }, "")),"(" }, ""), false);
  if  cl_15.value.(*RangerAppClassDesc).has_constructor {
    var constr_14 *GoNullable = new(GoNullable); 
    constr_14.value = cl_15.value.(*RangerAppClassDesc).constructor_fn.value;
    constr_14.has_value = cl_15.value.(*RangerAppClassDesc).constructor_fn.has_value;
    var i_156 int64 = 0;  
    for ; i_156 < int64(len(constr_14.value.(*RangerAppFunctionDesc).params)) ; i_156++ {
      arg_29 := constr_14.value.(*RangerAppFunctionDesc).params[i_156];
      if  i_156 > 0 {
        wr_9.out(", ", false);
      }
      wr_9.out(strings.Join([]string{ arg_29.Get_name()," " }, ""), false);
      this.writeTypeDef(arg_29.Get_nameNode().value.(*CodeNode), ctx, wr_9);
    }
  }
  wr_9.out(strings.Join([]string{ (strings.Join([]string{ ") *",cl_15.value.(*RangerAppClassDesc).name }, ""))," {" }, ""), true);
  wr_9.indent(1);
  wr_9.newline();
  wr_9.out(strings.Join([]string{ (strings.Join([]string{ "me := new(",cl_15.value.(*RangerAppClassDesc).name }, "")),")" }, ""), true);
  var i_159 int64 = 0;  
  for ; i_159 < int64(len(cl_15.value.(*RangerAppClassDesc).variables)) ; i_159++ {
    pvar_17 := cl_15.value.(*RangerAppClassDesc).variables[i_159];
    var nn_21 *CodeNode = pvar_17.Get_node().value.(*CodeNode);
    if  (int64(len(nn_21.children))) > 2 {
      var valueNode *CodeNode = nn_21.children[2];
      wr_9.out(strings.Join([]string{ (strings.Join([]string{ "me.",pvar_17.Get_compiledName() }, ""))," = " }, ""), false);
      this.WalkNode(valueNode, ctx, wr_9);
      wr_9.out("", true);
    } else {
      var pNameN *GoNullable = new(GoNullable); 
      pNameN.value = pvar_17.Get_nameNode().value;
      pNameN.has_value = pvar_17.Get_nameNode().has_value;
      if  pNameN.value.(*CodeNode).value_type == 6 {
        wr_9.out(strings.Join([]string{ (strings.Join([]string{ "me.",pvar_17.Get_compiledName() }, ""))," = " }, ""), false);
        wr_9.out("make(", false);
        this.writeTypeDef(pvar_17.Get_nameNode().value.(*CodeNode), ctx, wr_9);
        wr_9.out(",0)", true);
      }
      if  pNameN.value.(*CodeNode).value_type == 7 {
        wr_9.out(strings.Join([]string{ (strings.Join([]string{ "me.",pvar_17.Get_compiledName() }, ""))," = " }, ""), false);
        wr_9.out("make(", false);
        this.writeTypeDef(pvar_17.Get_nameNode().value.(*CodeNode), ctx, wr_9);
        wr_9.out(")", true);
      }
    }
  }
  var i_162 int64 = 0;  
  for ; i_162 < int64(len(cl_15.value.(*RangerAppClassDesc).variables)) ; i_162++ {
    pvar_20 := cl_15.value.(*RangerAppClassDesc).variables[i_162];
    if  pvar_20.Get_nameNode().value.(*CodeNode).hasFlag("optional") {
      wr_9.out(strings.Join([]string{ (strings.Join([]string{ "me.",pvar_20.Get_compiledName() }, ""))," = new(GoNullable);" }, ""), true);
    }
  }
  if  (int64(len(cl_15.value.(*RangerAppClassDesc).extends_classes))) > 0 {
    var i_165 int64 = 0;  
    for ; i_165 < int64(len(cl_15.value.(*RangerAppClassDesc).extends_classes)) ; i_165++ {
      pName_9 := cl_15.value.(*RangerAppClassDesc).extends_classes[i_165];
      var pC_7 *RangerAppClassDesc = ctx.findClass(pName_9);
      var i_174 int64 = 0;  
      for ; i_174 < int64(len(pC_7.variables)) ; i_174++ {
        pvar_23 := pC_7.variables[i_174];
        var nn_25 *CodeNode = pvar_23.Get_node().value.(*CodeNode);
        if  (int64(len(nn_25.children))) > 2 {
          var valueNode_6 *CodeNode = nn_25.children[2];
          wr_9.out(strings.Join([]string{ (strings.Join([]string{ "me.",pvar_23.Get_compiledName() }, ""))," = " }, ""), false);
          this.WalkNode(valueNode_6, ctx, wr_9);
          wr_9.out("", true);
        } else {
          var pNameN_6 *CodeNode = pvar_23.Get_nameNode().value.(*CodeNode);
          if  pNameN_6.value_type == 6 {
            wr_9.out(strings.Join([]string{ (strings.Join([]string{ "me.",pvar_23.Get_compiledName() }, ""))," = " }, ""), false);
            wr_9.out("make(", false);
            this.writeTypeDef(pvar_23.Get_nameNode().value.(*CodeNode), ctx, wr_9);
            wr_9.out(",0)", true);
          }
          if  pNameN_6.value_type == 7 {
            wr_9.out(strings.Join([]string{ (strings.Join([]string{ "me.",pvar_23.Get_compiledName() }, ""))," = " }, ""), false);
            wr_9.out("make(", false);
            this.writeTypeDef(pvar_23.Get_nameNode().value.(*CodeNode), ctx, wr_9);
            wr_9.out(")", true);
          }
        }
      }
      var i_179 int64 = 0;  
      for ; i_179 < int64(len(pC_7.variables)) ; i_179++ {
        pvar_30 := pC_7.variables[i_179];
        if  pvar_30.Get_nameNode().value.(*CodeNode).hasFlag("optional") {
          wr_9.out(strings.Join([]string{ (strings.Join([]string{ "me.",pvar_30.Get_compiledName() }, ""))," = new(GoNullable);" }, ""), true);
        }
      }
      if  pC_7.has_constructor {
        var constr_18 *GoNullable = new(GoNullable); 
        constr_18.value = pC_7.constructor_fn.value;
        constr_18.has_value = pC_7.constructor_fn.has_value;
        var subCtx_33 *RangerAppWriterContext = constr_18.value.(*RangerAppFunctionDesc).fnCtx.value.(*RangerAppWriterContext);
        subCtx_33.is_function = true; 
        this.WalkNode(constr_18.value.(*RangerAppFunctionDesc).fnBody.value.(*CodeNode), subCtx_33, wr_9);
      }
    }
  }
  if  cl_15.value.(*RangerAppClassDesc).has_constructor {
    var constr_21 *GoNullable = new(GoNullable); 
    constr_21.value = cl_15.value.(*RangerAppClassDesc).constructor_fn.value;
    constr_21.has_value = cl_15.value.(*RangerAppClassDesc).constructor_fn.has_value;
    var subCtx_38 *RangerAppWriterContext = constr_21.value.(*RangerAppFunctionDesc).fnCtx.value.(*RangerAppWriterContext);
    subCtx_38.is_function = true; 
    this.WalkNode(constr_21.value.(*RangerAppFunctionDesc).fnBody.value.(*CodeNode), subCtx_38, wr_9);
  }
  wr_9.out("return me;", true);
  wr_9.indent(-1);
  wr_9.out("}", true);
  this.thisName = "this"; 
  var i_174 int64 = 0;  
  for ; i_174 < int64(len(cl_15.value.(*RangerAppClassDesc).static_methods)) ; i_174++ {
    variant_20 := cl_15.value.(*RangerAppClassDesc).static_methods[i_174];
    if  variant_20.nameNode.value.(*CodeNode).hasFlag("main") {
      continue;
    }
    wr_9.newline();
    wr_9.out(strings.Join([]string{ (strings.Join([]string{ (strings.Join([]string{ (strings.Join([]string{ "func ",cl_15.value.(*RangerAppClassDesc).name }, "")),"_static_" }, "")),variant_20.name }, "")),"(" }, ""), false);
    this.writeArgsDef(variant_20, ctx, wr_9);
    wr_9.out(") ", false);
    this.writeTypeDef(variant_20.nameNode.value.(*CodeNode), ctx, wr_9);
    wr_9.out(" {", true);
    wr_9.indent(1);
    wr_9.newline();
    var subCtx_41 *RangerAppWriterContext = variant_20.fnCtx.value.(*RangerAppWriterContext);
    subCtx_41.is_function = true; 
    this.WalkNode(variant_20.fnBody.value.(*CodeNode), subCtx_41, wr_9);
    wr_9.newline();
    wr_9.indent(-1);
    wr_9.out("}", true);
  }
  var declaredFn map[string]bool = make(map[string]bool);
  var i_177 int64 = 0;  
  for ; i_177 < int64(len(cl_15.value.(*RangerAppClassDesc).defined_variants)) ; i_177++ {
    fnVar_12 := cl_15.value.(*RangerAppClassDesc).defined_variants[i_177];
    var mVs_12 *GoNullable = new(GoNullable); 
    mVs_12 = r_get_string_RangerAppMethodVariants(cl_15.value.(*RangerAppClassDesc).method_variants, fnVar_12);
    var i_184 int64 = 0;  
    for ; i_184 < int64(len(mVs_12.value.(*RangerAppMethodVariants).variants)) ; i_184++ {
      variant_23 := mVs_12.value.(*RangerAppMethodVariants).variants[i_184];
      declaredFn[variant_23.name] = true
      wr_9.out(strings.Join([]string{ (strings.Join([]string{ (strings.Join([]string{ (strings.Join([]string{ "func (this *",cl_15.value.(*RangerAppClassDesc).name }, "")),") " }, "")),variant_23.name }, ""))," (" }, ""), false);
      this.writeArgsDef(variant_23, ctx, wr_9);
      wr_9.out(") ", false);
      if  variant_23.nameNode.value.(*CodeNode).hasFlag("optional") {
        wr_9.out("*GoNullable", false);
      } else {
        this.writeTypeDef(variant_23.nameNode.value.(*CodeNode), ctx, wr_9);
      }
      wr_9.out(" {", true);
      wr_9.indent(1);
      wr_9.newline();
      var subCtx_44 *RangerAppWriterContext = variant_23.fnCtx.value.(*RangerAppWriterContext);
      subCtx_44.is_function = true; 
      this.WalkNode(variant_23.fnBody.value.(*CodeNode), subCtx_44, wr_9);
      wr_9.newline();
      wr_9.indent(-1);
      wr_9.out("}", true);
    }
  }
  if  (int64(len(cl_15.value.(*RangerAppClassDesc).extends_classes))) > 0 {
    var i_183 int64 = 0;  
    for ; i_183 < int64(len(cl_15.value.(*RangerAppClassDesc).extends_classes)) ; i_183++ {
      pName_12 := cl_15.value.(*RangerAppClassDesc).extends_classes[i_183];
      var pC_10 *RangerAppClassDesc = ctx.findClass(pName_12);
      wr_9.out(strings.Join([]string{ "// inherited methods from parent class ",pName_12 }, ""), true);
      var i_192 int64 = 0;  
      for ; i_192 < int64(len(pC_10.defined_variants)) ; i_192++ {
        fnVar_15 := pC_10.defined_variants[i_192];
        var mVs_15 *GoNullable = new(GoNullable); 
        mVs_15 = r_get_string_RangerAppMethodVariants(pC_10.method_variants, fnVar_15);
        var i_200 int64 = 0;  
        for ; i_200 < int64(len(mVs_15.value.(*RangerAppMethodVariants).variants)) ; i_200++ {
          variant_26 := mVs_15.value.(*RangerAppMethodVariants).variants[i_200];
          if  r_has_key_string_bool(declaredFn, variant_26.name) {
            continue;
          }
          wr_9.out(strings.Join([]string{ (strings.Join([]string{ (strings.Join([]string{ (strings.Join([]string{ "func (this *",cl_15.value.(*RangerAppClassDesc).name }, "")),") " }, "")),variant_26.name }, ""))," (" }, ""), false);
          this.writeArgsDef(variant_26, ctx, wr_9);
          wr_9.out(") ", false);
          if  variant_26.nameNode.value.(*CodeNode).hasFlag("optional") {
            wr_9.out("*GoNullable", false);
          } else {
            this.writeTypeDef(variant_26.nameNode.value.(*CodeNode), ctx, wr_9);
          }
          wr_9.out(" {", true);
          wr_9.indent(1);
          wr_9.newline();
          var subCtx_47 *RangerAppWriterContext = variant_26.fnCtx.value.(*RangerAppWriterContext);
          subCtx_47.is_function = true; 
          this.WalkNode(variant_26.fnBody.value.(*CodeNode), subCtx_47, wr_9);
          wr_9.newline();
          wr_9.indent(-1);
          wr_9.out("}", true);
        }
      }
    }
  }
  var declaredGetter map[string]bool = make(map[string]bool);
  var i_192 int64 = 0;  
  for ; i_192 < int64(len(cl_15.value.(*RangerAppClassDesc).variables)) ; i_192++ {
    p_54 := cl_15.value.(*RangerAppClassDesc).variables[i_192];
    declaredGetter[p_54.Get_name()] = true
    wr_9.newline();
    wr_9.out(strings.Join([]string{ "// getter for variable ",p_54.Get_name() }, ""), true);
    wr_9.out(strings.Join([]string{ (strings.Join([]string{ "func (this *",cl_15.value.(*RangerAppClassDesc).name }, "")),") " }, ""), false);
    wr_9.out("Get_", false);
    wr_9.out(strings.Join([]string{ p_54.Get_compiledName(),"() " }, ""), false);
    if  p_54.Get_nameNode().value.(*CodeNode).hasFlag("optional") {
      wr_9.out("*GoNullable", false);
    } else {
      this.writeTypeDef(p_54.Get_nameNode().value.(*CodeNode), ctx, wr_9);
    }
    wr_9.out(" {", true);
    wr_9.indent(1);
    wr_9.out(strings.Join([]string{ "return this.",p_54.Get_compiledName() }, ""), true);
    wr_9.indent(-1);
    wr_9.out("}", true);
    wr_9.newline();
    wr_9.out(strings.Join([]string{ "// setter for variable ",p_54.Get_name() }, ""), true);
    wr_9.out(strings.Join([]string{ (strings.Join([]string{ "func (this *",cl_15.value.(*RangerAppClassDesc).name }, "")),") " }, ""), false);
    wr_9.out("Set_", false);
    wr_9.out(strings.Join([]string{ p_54.Get_compiledName(),"( value " }, ""), false);
    if  p_54.Get_nameNode().value.(*CodeNode).hasFlag("optional") {
      wr_9.out("*GoNullable", false);
    } else {
      this.writeTypeDef(p_54.Get_nameNode().value.(*CodeNode), ctx, wr_9);
    }
    wr_9.out(") ", false);
    wr_9.out(" {", true);
    wr_9.indent(1);
    wr_9.out(strings.Join([]string{ (strings.Join([]string{ "this.",p_54.Get_compiledName() }, ""))," = value " }, ""), true);
    wr_9.indent(-1);
    wr_9.out("}", true);
  }
  if  (int64(len(cl_15.value.(*RangerAppClassDesc).extends_classes))) > 0 {
    var i_195 int64 = 0;  
    for ; i_195 < int64(len(cl_15.value.(*RangerAppClassDesc).extends_classes)) ; i_195++ {
      pName_15 := cl_15.value.(*RangerAppClassDesc).extends_classes[i_195];
      var pC_13 *RangerAppClassDesc = ctx.findClass(pName_15);
      wr_9.out(strings.Join([]string{ "// inherited getters and setters from the parent class ",pName_15 }, ""), true);
      var i_204 int64 = 0;  
      for ; i_204 < int64(len(pC_13.variables)) ; i_204++ {
        p_57 := pC_13.variables[i_204];
        if  r_has_key_string_bool(declaredGetter, p_57.Get_name()) {
          continue;
        }
        wr_9.newline();
        wr_9.out(strings.Join([]string{ "// getter for variable ",p_57.Get_name() }, ""), true);
        wr_9.out(strings.Join([]string{ (strings.Join([]string{ "func (this *",cl_15.value.(*RangerAppClassDesc).name }, "")),") " }, ""), false);
        wr_9.out("Get_", false);
        wr_9.out(strings.Join([]string{ p_57.Get_compiledName(),"() " }, ""), false);
        if  p_57.Get_nameNode().value.(*CodeNode).hasFlag("optional") {
          wr_9.out("*GoNullable", false);
        } else {
          this.writeTypeDef(p_57.Get_nameNode().value.(*CodeNode), ctx, wr_9);
        }
        wr_9.out(" {", true);
        wr_9.indent(1);
        wr_9.out(strings.Join([]string{ "return this.",p_57.Get_compiledName() }, ""), true);
        wr_9.indent(-1);
        wr_9.out("}", true);
        wr_9.newline();
        wr_9.out(strings.Join([]string{ "// getter for variable ",p_57.Get_name() }, ""), true);
        wr_9.out(strings.Join([]string{ (strings.Join([]string{ "func (this *",cl_15.value.(*RangerAppClassDesc).name }, "")),") " }, ""), false);
        wr_9.out("Set_", false);
        wr_9.out(strings.Join([]string{ p_57.Get_compiledName(),"( value " }, ""), false);
        if  p_57.Get_nameNode().value.(*CodeNode).hasFlag("optional") {
          wr_9.out("*GoNullable", false);
        } else {
          this.writeTypeDef(p_57.Get_nameNode().value.(*CodeNode), ctx, wr_9);
        }
        wr_9.out(") ", false);
        wr_9.out(" {", true);
        wr_9.indent(1);
        wr_9.out(strings.Join([]string{ (strings.Join([]string{ "this.",p_57.Get_compiledName() }, ""))," = value " }, ""), true);
        wr_9.indent(-1);
        wr_9.out("}", true);
      }
    }
  }
  var i_201 int64 = 0;  
  for ; i_201 < int64(len(cl_15.value.(*RangerAppClassDesc).static_methods)) ; i_201++ {
    variant_29 := cl_15.value.(*RangerAppClassDesc).static_methods[i_201];
    if  variant_29.nameNode.value.(*CodeNode).hasFlag("main") {
      wr_9.out("func main() {", true);
      wr_9.indent(1);
      wr_9.newline();
      var subCtx_50 *RangerAppWriterContext = variant_29.fnCtx.value.(*RangerAppWriterContext);
      subCtx_50.is_function = true; 
      this.WalkNode(variant_29.fnBody.value.(*CodeNode), subCtx_50, wr_9);
      wr_9.newline();
      wr_9.indent(-1);
      wr_9.out("}", true);
    }
  }
}
// inherited methods from parent class RangerGenericClassWriter
func (this *RangerGolangClassWriter) EncodeString (node *CodeNode, ctx *RangerAppWriterContext, wr *CodeWriter) string {
  /** unused:  encoded_str_2*/
  var str_length_2 int64 = int64(len(node.string_value));
  var encoded_str_8 string = "";
  var ii_11 int64 = 0;
  for ii_11 < str_length_2 {var cc_4 int64 = int64(node.string_value[ii_11]);
    switch (cc_4 ) { 
      case 8 : 
        encoded_str_8 = strings.Join([]string{ (strings.Join([]string{ encoded_str_8,(string([] byte{byte(92)})) }, "")),(string([] byte{byte(98)})) }, ""); 
      case 9 : 
        encoded_str_8 = strings.Join([]string{ (strings.Join([]string{ encoded_str_8,(string([] byte{byte(92)})) }, "")),(string([] byte{byte(116)})) }, ""); 
      case 10 : 
        encoded_str_8 = strings.Join([]string{ (strings.Join([]string{ encoded_str_8,(string([] byte{byte(92)})) }, "")),(string([] byte{byte(110)})) }, ""); 
      case 12 : 
        encoded_str_8 = strings.Join([]string{ (strings.Join([]string{ encoded_str_8,(string([] byte{byte(92)})) }, "")),(string([] byte{byte(102)})) }, ""); 
      case 13 : 
        encoded_str_8 = strings.Join([]string{ (strings.Join([]string{ encoded_str_8,(string([] byte{byte(92)})) }, "")),(string([] byte{byte(114)})) }, ""); 
      case 34 : 
        encoded_str_8 = strings.Join([]string{ (strings.Join([]string{ encoded_str_8,(string([] byte{byte(92)})) }, "")),(string([] byte{byte(34)})) }, ""); 
      case 92 : 
        encoded_str_8 = strings.Join([]string{ (strings.Join([]string{ encoded_str_8,(string([] byte{byte(92)})) }, "")),(string([] byte{byte(92)})) }, ""); 
      default: 
        encoded_str_8 = strings.Join([]string{ encoded_str_8,(string([] byte{byte(cc_4)})) }, ""); 
    }
    ii_11 = ii_11 + 1; 
  }
  return encoded_str_8;
}
func (this *RangerGolangClassWriter) WriteEnum (node *CodeNode, ctx *RangerAppWriterContext, wr *CodeWriter) () {
  if  node.eval_type == 11 {
    var rootObjName_2 string = node.ns[0];
    var e_8 *GoNullable = new(GoNullable); 
    e_8 = ctx.getEnum(rootObjName_2);
    if  e_8.has_value {
      var enumName_2 string = node.ns[1];
      wr.out(strings.Join([]string{ "",strconv.FormatInt(((r_get_string_int64(e_8.value.(*RangerAppEnum).values, enumName_2)).value.(int64)), 10) }, ""), false);
    } else {
      if  node.hasParamDesc {
        var pp_4 *GoNullable = new(GoNullable); 
        pp_4.value = node.paramDesc.value;
        pp_4.has_value = node.paramDesc.has_value;
        var nn_8 *GoNullable = new(GoNullable); 
        nn_8.value = pp_4.value.(IFACE_RangerAppParamDesc).Get_nameNode().value;
        nn_8.has_value = pp_4.value.(IFACE_RangerAppParamDesc).Get_nameNode().has_value;
        this.WriteVRef(nn_8.value.(*CodeNode), ctx, wr);
      }
    }
  }
}
func (this *RangerGolangClassWriter) getTypeString (type_string string) string {
  return type_string;
}
func (this *RangerGolangClassWriter) import_lib (lib_name string, ctx *RangerAppWriterContext, wr *CodeWriter) () {
  wr.addImport(lib_name);
}
func (this *RangerGolangClassWriter) release_local_vars (node *CodeNode, ctx *RangerAppWriterContext, wr *CodeWriter) () {
  var i_61 int64 = 0;  
  for ; i_61 < int64(len(ctx.localVarNames)) ; i_61++ {
    n_7 := ctx.localVarNames[i_61];
    var p_14 *GoNullable = new(GoNullable); 
    p_14 = r_get_string_IFACE_RangerAppParamDesc(ctx.localVariables, n_7);
    if  p_14.value.(IFACE_RangerAppParamDesc).Get_ref_cnt() == 0 {
      continue;
    }
    if  p_14.value.(IFACE_RangerAppParamDesc).isAllocatedType() {
      if  1 == p_14.value.(IFACE_RangerAppParamDesc).getStrength() {
        if  p_14.value.(IFACE_RangerAppParamDesc).Get_nameNode().value.(*CodeNode).eval_type == 7 {
        }
        if  p_14.value.(IFACE_RangerAppParamDesc).Get_nameNode().value.(*CodeNode).eval_type == 6 {
        }
        if  (p_14.value.(IFACE_RangerAppParamDesc).Get_nameNode().value.(*CodeNode).eval_type != 6) && (p_14.value.(IFACE_RangerAppParamDesc).Get_nameNode().value.(*CodeNode).eval_type != 7) {
        }
      }
      if  0 == p_14.value.(IFACE_RangerAppParamDesc).getStrength() {
        if  p_14.value.(IFACE_RangerAppParamDesc).Get_nameNode().value.(*CodeNode).eval_type == 7 {
        }
        if  p_14.value.(IFACE_RangerAppParamDesc).Get_nameNode().value.(*CodeNode).eval_type == 6 {
        }
        if  (p_14.value.(IFACE_RangerAppParamDesc).Get_nameNode().value.(*CodeNode).eval_type != 6) && (p_14.value.(IFACE_RangerAppParamDesc).Get_nameNode().value.(*CodeNode).eval_type != 7) {
        }
      }
    }
  }
  if  ctx.is_function {
    return;
  }
  if  ctx.parent.has_value {
    this.release_local_vars(node, ctx.parent.value.(*RangerAppWriterContext), wr);
  }
}
func (this *RangerGolangClassWriter) WalkNode (node *CodeNode, ctx *RangerAppWriterContext, wr *CodeWriter) () {
  this.compiler.value.(*LiveCompiler).WalkNode(node, ctx, wr);
}
func (this *RangerGolangClassWriter) adjustType (tn string) string {
  return tn;
}
func (this *RangerGolangClassWriter) writeFnCall (node *CodeNode, ctx *RangerAppWriterContext, wr *CodeWriter) () {
  if  node.hasFnCall {
    var fc_20 *CodeNode = node.getFirst();
    this.WriteVRef(fc_20, ctx, wr);
    wr.out("(", false);
    var givenArgs_2 *CodeNode = node.getSecond();
    ctx.setInExpr();
    var i_68 int64 = 0;  
    for ; i_68 < int64(len(node.fnDesc.value.(*RangerAppFunctionDesc).params)) ; i_68++ {
      arg_12 := node.fnDesc.value.(*RangerAppFunctionDesc).params[i_68];
      if  i_68 > 0 {
        wr.out(", ", false);
      }
      if  (int64(len(givenArgs_2.children))) <= i_68 {
        var defVal *GoNullable = new(GoNullable); 
        defVal = arg_12.Get_nameNode().value.(*CodeNode).getFlag("default");
        if  defVal.has_value {
          var fc_31 *CodeNode = defVal.value.(*CodeNode).vref_annotation.value.(*CodeNode).getFirst();
          this.WalkNode(fc_31, ctx, wr);
        } else {
          ctx.addError(node, "Default argument was missing");
        }
        continue;
      }
      var n_10 *CodeNode = givenArgs_2.children[i_68];
      this.WalkNode(n_10, ctx, wr);
    }
    ctx.unsetInExpr();
    wr.out(")", false);
    if  ctx.expressionLevel() == 0 {
      wr.out(";", true);
    }
  }
}
// getter for variable compiler
func (this *RangerGolangClassWriter) Get_compiler() *GoNullable {
  return this.compiler
}
// setter for variable compiler
func (this *RangerGolangClassWriter) Set_compiler( value *GoNullable)  {
  this.compiler = value 
}
// getter for variable thisName
func (this *RangerGolangClassWriter) Get_thisName() string {
  return this.thisName
}
// setter for variable thisName
func (this *RangerGolangClassWriter) Set_thisName( value string)  {
  this.thisName = value 
}
// getter for variable write_raw_type
func (this *RangerGolangClassWriter) Get_write_raw_type() bool {
  return this.write_raw_type
}
// setter for variable write_raw_type
func (this *RangerGolangClassWriter) Set_write_raw_type( value bool)  {
  this.write_raw_type = value 
}
// getter for variable did_write_nullable
func (this *RangerGolangClassWriter) Get_did_write_nullable() bool {
  return this.did_write_nullable
}
// setter for variable did_write_nullable
func (this *RangerGolangClassWriter) Set_did_write_nullable( value bool)  {
  this.did_write_nullable = value 
}
// inherited getters and setters from the parent class RangerGenericClassWriter
type RangerPHPClassWriter struct { 
  compiler *GoNullable /**  unused  **/ 
  thisName string
  wrote_header bool
  // inherited from parent class RangerGenericClassWriter
}
type IFACE_RangerPHPClassWriter interface { 
  Get_compiler() *GoNullable
  Set_compiler(value *GoNullable) 
  Get_thisName() string
  Set_thisName(value string) 
  Get_wrote_header() bool
  Set_wrote_header(value bool) 
  adjustType(tn string) string
  WriteVRef(node *CodeNode, ctx *RangerAppWriterContext, wr *CodeWriter) ()
  writeVarInitDef(node *CodeNode, ctx *RangerAppWriterContext, wr *CodeWriter) ()
  writeVarDef(node *CodeNode, ctx *RangerAppWriterContext, wr *CodeWriter) ()
  writeClassVarDef(node *CodeNode, ctx *RangerAppWriterContext, wr *CodeWriter) ()
  writeArgsDef(fnDesc *RangerAppFunctionDesc, ctx *RangerAppWriterContext, wr *CodeWriter) ()
  writeFnCall(node *CodeNode, ctx *RangerAppWriterContext, wr *CodeWriter) ()
  writeNewCall(node *CodeNode, ctx *RangerAppWriterContext, wr *CodeWriter) ()
  writeClass(node *CodeNode, ctx *RangerAppWriterContext, orig_wr *CodeWriter) ()
}

func CreateNew_RangerPHPClassWriter() *RangerPHPClassWriter {
  me := new(RangerPHPClassWriter)
  me.thisName = "this"
  me.wrote_header = false
  me.compiler = new(GoNullable);
  me.compiler = new(GoNullable);
  return me;
}
func (this *RangerPHPClassWriter) adjustType (tn string) string {
  if  tn == "this" {
    return "this";
  }
  return tn;
}
func (this *RangerPHPClassWriter) WriteVRef (node *CodeNode, ctx *RangerAppWriterContext, wr *CodeWriter) () {
  if  node.vref == "this" {
    wr.out("$this", false);
    return;
  }
  if  node.eval_type == 11 {
    if  (int64(len(node.ns))) > 1 {
      var rootObjName_12 string = node.ns[0];
      var enumName_12 string = node.ns[1];
      var e_18 *GoNullable = new(GoNullable); 
      e_18 = ctx.getEnum(rootObjName_12);
      if  e_18.has_value {
        wr.out(strings.Join([]string{ "",strconv.FormatInt(((r_get_string_int64(e_18.value.(*RangerAppEnum).values, enumName_12)).value.(int64)), 10) }, ""), false);
        return;
      }
    }
  }
  if  (int64(len(node.nsp))) > 0 {
    var i_150 int64 = 0;  
    for ; i_150 < int64(len(node.nsp)) ; i_150++ {
      p_44 := node.nsp[i_150];
      if  i_150 == 0 {
        var part_17 string = node.ns[0];
        if  part_17 == "this" {
          wr.out("$this", false);
          continue;
        }
      }
      if  i_150 > 0 {
        wr.out("->", false);
      }
      if  i_150 == 0 {
        wr.out("$", false);
        if  p_44.Get_nameNode().value.(*CodeNode).hasFlag("optional") {
        }
        var part_26 string = node.ns[0];
        if  (part_26 != "this") && ctx.hasCurrentClass() {
          var uc *GoNullable = new(GoNullable); 
          uc = ctx.getCurrentClass();
          var currC_16 *RangerAppClassDesc = uc.value.(*RangerAppClassDesc);
          var up_9 *GoNullable = new(GoNullable); 
          up_9 = currC_16.findVariable(part_26);
          if  up_9.has_value {
            wr.out(strings.Join([]string{ this.thisName,"->" }, ""), false);
          }
        }
      }
      if  (int64(len(p_44.Get_compiledName()))) > 0 {
        wr.out(this.adjustType(p_44.Get_compiledName()), false);
      } else {
        if  (int64(len(p_44.Get_name()))) > 0 {
          wr.out(this.adjustType(p_44.Get_name()), false);
        } else {
          wr.out(this.adjustType((node.ns[i_150])), false);
        }
      }
    }
    return;
  }
  if  node.hasParamDesc {
    wr.out("$", false);
    var part_25 string = node.ns[0];
    if  (part_25 != "this") && ctx.hasCurrentClass() {
      var uc_6 *GoNullable = new(GoNullable); 
      uc_6 = ctx.getCurrentClass();
      var currC_21 *RangerAppClassDesc = uc_6.value.(*RangerAppClassDesc);
      var up_14 *GoNullable = new(GoNullable); 
      up_14 = currC_21.findVariable(part_25);
      if  up_14.has_value {
        wr.out(strings.Join([]string{ this.thisName,"->" }, ""), false);
      }
    }
    var p_49 *GoNullable = new(GoNullable); 
    p_49.value = node.paramDesc.value;
    p_49.has_value = node.paramDesc.has_value;
    wr.out(p_49.value.(IFACE_RangerAppParamDesc).Get_compiledName(), false);
    return;
  }
  var b_was_static_5 bool = false;
  var i_155 int64 = 0;  
  for ; i_155 < int64(len(node.ns)) ; i_155++ {
    part_28 := node.ns[i_155];
    if  i_155 > 0 {
      if  (i_155 == 1) && b_was_static_5 {
        wr.out("::", false);
      } else {
        wr.out("->", false);
      }
    }
    if  i_155 == 0 {
      if  ctx.hasClass(part_28) {
        b_was_static_5 = true; 
      } else {
        wr.out("$", false);
      }
      if  (part_28 != "this") && ctx.hasCurrentClass() {
        var uc_9 *GoNullable = new(GoNullable); 
        uc_9 = ctx.getCurrentClass();
        var currC_24 *RangerAppClassDesc = uc_9.value.(*RangerAppClassDesc);
        var up_17 *GoNullable = new(GoNullable); 
        up_17 = currC_24.findVariable(part_28);
        if  up_17.has_value {
          wr.out(strings.Join([]string{ this.thisName,"->" }, ""), false);
        }
      }
    }
    wr.out(this.adjustType(part_28), false);
  }
}
func (this *RangerPHPClassWriter) writeVarInitDef (node *CodeNode, ctx *RangerAppWriterContext, wr *CodeWriter) () {
  if  node.hasParamDesc {
    var nn_20 *CodeNode = node.children[1];
    var p_49 *GoNullable = new(GoNullable); 
    p_49.value = nn_20.paramDesc.value;
    p_49.has_value = nn_20.paramDesc.has_value;
    if  (p_49.value.(IFACE_RangerAppParamDesc).Get_ref_cnt() == 0) && (p_49.value.(IFACE_RangerAppParamDesc).Get_is_class_variable() == false) {
      wr.out("/** unused:  ", false);
    }
    wr.out(strings.Join([]string{ "$this->",p_49.value.(IFACE_RangerAppParamDesc).Get_compiledName() }, ""), false);
    if  (int64(len(node.children))) > 2 {
      wr.out(" = ", false);
      ctx.setInExpr();
      var value_15 *CodeNode = node.getThird();
      this.WalkNode(value_15, ctx, wr);
      ctx.unsetInExpr();
    } else {
      if  nn_20.value_type == 6 {
        wr.out(" = array()", false);
      }
      if  nn_20.value_type == 7 {
        wr.out(" = array()", false);
      }
    }
    if  (p_49.value.(IFACE_RangerAppParamDesc).Get_ref_cnt() == 0) && (p_49.value.(IFACE_RangerAppParamDesc).Get_is_class_variable() == false) {
      wr.out("   **/", true);
      return;
    }
    wr.out(";", false);
    if  (p_49.value.(IFACE_RangerAppParamDesc).Get_ref_cnt() == 0) && (p_49.value.(IFACE_RangerAppParamDesc).Get_is_class_variable() == true) {
      wr.out("     /** note: unused */", false);
    }
    wr.newline();
  }
}
func (this *RangerPHPClassWriter) writeVarDef (node *CodeNode, ctx *RangerAppWriterContext, wr *CodeWriter) () {
  if  node.hasParamDesc {
    var nn_23 *CodeNode = node.children[1];
    var p_51 *GoNullable = new(GoNullable); 
    p_51.value = nn_23.paramDesc.value;
    p_51.has_value = nn_23.paramDesc.has_value;
    if  (p_51.value.(IFACE_RangerAppParamDesc).Get_ref_cnt() == 0) && (p_51.value.(IFACE_RangerAppParamDesc).Get_is_class_variable() == false) {
      wr.out("/** unused:  ", false);
    }
    wr.out(strings.Join([]string{ "$",p_51.value.(IFACE_RangerAppParamDesc).Get_compiledName() }, ""), false);
    if  (int64(len(node.children))) > 2 {
      wr.out(" = ", false);
      ctx.setInExpr();
      var value_18 *CodeNode = node.getThird();
      this.WalkNode(value_18, ctx, wr);
      ctx.unsetInExpr();
    } else {
      if  nn_23.value_type == 6 {
        wr.out(" = array()", false);
      }
      if  nn_23.value_type == 7 {
        wr.out(" = array()", false);
      }
    }
    if  (p_51.value.(IFACE_RangerAppParamDesc).Get_ref_cnt() == 0) && (p_51.value.(IFACE_RangerAppParamDesc).Get_is_class_variable() == true) {
      wr.out("     /** note: unused */", false);
    }
    if  (p_51.value.(IFACE_RangerAppParamDesc).Get_ref_cnt() == 0) && (p_51.value.(IFACE_RangerAppParamDesc).Get_is_class_variable() == false) {
      wr.out("   **/ ;", true);
    } else {
      wr.out(";", false);
      wr.newline();
    }
  }
}
func (this *RangerPHPClassWriter) writeClassVarDef (node *CodeNode, ctx *RangerAppWriterContext, wr *CodeWriter) () {
  if  node.hasParamDesc {
    var nn_25 *CodeNode = node.children[1];
    var p_53 *GoNullable = new(GoNullable); 
    p_53.value = nn_25.paramDesc.value;
    p_53.has_value = nn_25.paramDesc.has_value;
    wr.out(strings.Join([]string{ (strings.Join([]string{ "var $",p_53.value.(IFACE_RangerAppParamDesc).Get_compiledName() }, "")),";" }, ""), true);
  }
}
func (this *RangerPHPClassWriter) writeArgsDef (fnDesc *RangerAppFunctionDesc, ctx *RangerAppWriterContext, wr *CodeWriter) () {
  var i_155 int64 = 0;  
  for ; i_155 < int64(len(fnDesc.params)) ; i_155++ {
    arg_27 := fnDesc.params[i_155];
    if  i_155 > 0 {
      wr.out(",", false);
    }
    wr.out(strings.Join([]string{ (strings.Join([]string{ " $",arg_27.Get_name() }, ""))," " }, ""), false);
  }
}
func (this *RangerPHPClassWriter) writeFnCall (node *CodeNode, ctx *RangerAppWriterContext, wr *CodeWriter) () {
  if  node.hasFnCall {
    var fc_33 *CodeNode = node.getFirst();
    this.WriteVRef(fc_33, ctx, wr);
    wr.out("(", false);
    var givenArgs_9 *CodeNode = node.getSecond();
    ctx.setInExpr();
    var i_157 int64 = 0;  
    for ; i_157 < int64(len(node.fnDesc.value.(*RangerAppFunctionDesc).params)) ; i_157++ {
      arg_30 := node.fnDesc.value.(*RangerAppFunctionDesc).params[i_157];
      if  i_157 > 0 {
        wr.out(", ", false);
      }
      if  (int64(len(givenArgs_9.children))) <= i_157 {
        var defVal_4 *GoNullable = new(GoNullable); 
        defVal_4 = arg_30.Get_nameNode().value.(*CodeNode).getFlag("default");
        if  defVal_4.has_value {
          var fc_44 *CodeNode = defVal_4.value.(*CodeNode).vref_annotation.value.(*CodeNode).getFirst();
          this.WalkNode(fc_44, ctx, wr);
        } else {
          ctx.addError(node, "Default argument was missing");
        }
        continue;
      }
      var n_15 *CodeNode = givenArgs_9.children[i_157];
      this.WalkNode(n_15, ctx, wr);
    }
    ctx.unsetInExpr();
    wr.out(")", false);
    if  ctx.expressionLevel() == 0 {
      wr.out(";", true);
    }
  }
}
func (this *RangerPHPClassWriter) writeNewCall (node *CodeNode, ctx *RangerAppWriterContext, wr *CodeWriter) () {
  if  node.hasNewOper {
    var cl_14 *GoNullable = new(GoNullable); 
    cl_14.value = node.clDesc.value;
    cl_14.has_value = node.clDesc.has_value;
    /** unused:  fc_38*/
    wr.out(" new ", false);
    wr.out(node.clDesc.value.(*RangerAppClassDesc).name, false);
    wr.out("(", false);
    var constr_15 *GoNullable = new(GoNullable); 
    constr_15.value = cl_14.value.(*RangerAppClassDesc).constructor_fn.value;
    constr_15.has_value = cl_14.value.(*RangerAppClassDesc).constructor_fn.has_value;
    var givenArgs_12 *CodeNode = node.getThird();
    if  constr_15.has_value {
      var i_159 int64 = 0;  
      for ; i_159 < int64(len(constr_15.value.(*RangerAppFunctionDesc).params)) ; i_159++ {
        arg_32 := constr_15.value.(*RangerAppFunctionDesc).params[i_159];
        var n_18 *CodeNode = givenArgs_12.children[i_159];
        if  i_159 > 0 {
          wr.out(", ", false);
        }
        if  true || (arg_32.Get_nameNode().has_value) {
          this.WalkNode(n_18, ctx, wr);
        }
      }
    }
    wr.out(")", false);
  }
}
func (this *RangerPHPClassWriter) writeClass (node *CodeNode, ctx *RangerAppWriterContext, orig_wr *CodeWriter) () {
  var cl_17 *GoNullable = new(GoNullable); 
  cl_17.value = node.clDesc.value;
  cl_17.has_value = node.clDesc.has_value;
  if  !cl_17.has_value  {
    return;
  }
  var wr_10 *CodeWriter = orig_wr;
  /** unused:  importFork_5*/
  if  this.wrote_header == false {
    wr_10.out("<? ", true);
    wr_10.out("", true);
    this.wrote_header = true; 
  }
  wr_10.out(strings.Join([]string{ "class ",cl_17.value.(*RangerAppClassDesc).name }, ""), false);
  var parentClass_3 *GoNullable = new(GoNullable); 
  if  (int64(len(cl_17.value.(*RangerAppClassDesc).extends_classes))) > 0 {
    wr_10.out(" extends ", false);
    var i_161 int64 = 0;  
    for ; i_161 < int64(len(cl_17.value.(*RangerAppClassDesc).extends_classes)) ; i_161++ {
      pName_8 := cl_17.value.(*RangerAppClassDesc).extends_classes[i_161];
      wr_10.out(pName_8, false);
      parentClass_3.value = ctx.findClass(pName_8);
      parentClass_3.has_value = true; /* detected as non-optional */
    }
  }
  wr_10.out(" { ", true);
  wr_10.indent(1);
  var i_165 int64 = 0;  
  for ; i_165 < int64(len(cl_17.value.(*RangerAppClassDesc).variables)) ; i_165++ {
    pvar_15 := cl_17.value.(*RangerAppClassDesc).variables[i_165];
    this.writeClassVarDef(pvar_15.Get_node().value.(*CodeNode), ctx, wr_10);
  }
  wr_10.out("", true);
  wr_10.out("function __construct(", false);
  if  cl_17.value.(*RangerAppClassDesc).has_constructor {
    var constr_18 *RangerAppFunctionDesc = cl_17.value.(*RangerAppClassDesc).constructor_fn.value.(*RangerAppFunctionDesc);
    this.writeArgsDef(constr_18, ctx, wr_10);
  }
  wr_10.out(" ) {", true);
  wr_10.indent(1);
  if ( parentClass_3.has_value) {
    wr_10.out("parent::__construct();", true);
  }
  var i_168 int64 = 0;  
  for ; i_168 < int64(len(cl_17.value.(*RangerAppClassDesc).variables)) ; i_168++ {
    pvar_20 := cl_17.value.(*RangerAppClassDesc).variables[i_168];
    this.writeVarInitDef(pvar_20.Get_node().value.(*CodeNode), ctx, wr_10);
  }
  if  cl_17.value.(*RangerAppClassDesc).has_constructor {
    var constr_22 *GoNullable = new(GoNullable); 
    constr_22.value = cl_17.value.(*RangerAppClassDesc).constructor_fn.value;
    constr_22.has_value = cl_17.value.(*RangerAppClassDesc).constructor_fn.has_value;
    wr_10.newline();
    var subCtx_39 *RangerAppWriterContext = constr_22.value.(*RangerAppFunctionDesc).fnCtx.value.(*RangerAppWriterContext);
    subCtx_39.is_function = true; 
    this.WalkNode(constr_22.value.(*RangerAppFunctionDesc).fnBody.value.(*CodeNode), subCtx_39, wr_10);
  }
  wr_10.newline();
  wr_10.indent(-1);
  wr_10.out("}", true);
  var i_171 int64 = 0;  
  for ; i_171 < int64(len(cl_17.value.(*RangerAppClassDesc).static_methods)) ; i_171++ {
    variant_20 := cl_17.value.(*RangerAppClassDesc).static_methods[i_171];
    wr_10.out("", true);
    if  variant_20.nameNode.value.(*CodeNode).hasFlag("main") {
      continue;
    } else {
      wr_10.out("public static function ", false);
      wr_10.out(strings.Join([]string{ variant_20.name,"(" }, ""), false);
      this.writeArgsDef(variant_20, ctx, wr_10);
      wr_10.out(") {", true);
    }
    wr_10.indent(1);
    wr_10.newline();
    var subCtx_44 *RangerAppWriterContext = variant_20.fnCtx.value.(*RangerAppWriterContext);
    subCtx_44.is_function = true; 
    this.WalkNode(variant_20.fnBody.value.(*CodeNode), subCtx_44, wr_10);
    wr_10.newline();
    wr_10.indent(-1);
    wr_10.out("}", true);
  }
  var i_174 int64 = 0;  
  for ; i_174 < int64(len(cl_17.value.(*RangerAppClassDesc).defined_variants)) ; i_174++ {
    fnVar_10 := cl_17.value.(*RangerAppClassDesc).defined_variants[i_174];
    var mVs_10 *GoNullable = new(GoNullable); 
    mVs_10 = r_get_string_RangerAppMethodVariants(cl_17.value.(*RangerAppClassDesc).method_variants, fnVar_10);
    var i_181 int64 = 0;  
    for ; i_181 < int64(len(mVs_10.value.(*RangerAppMethodVariants).variants)) ; i_181++ {
      variant_25 := mVs_10.value.(*RangerAppMethodVariants).variants[i_181];
      wr_10.out("", true);
      wr_10.out(strings.Join([]string{ (strings.Join([]string{ "function ",variant_25.name }, "")),"(" }, ""), false);
      this.writeArgsDef(variant_25, ctx, wr_10);
      wr_10.out(") {", true);
      wr_10.indent(1);
      wr_10.newline();
      var subCtx_47 *RangerAppWriterContext = variant_25.fnCtx.value.(*RangerAppWriterContext);
      subCtx_47.is_function = true; 
      this.WalkNode(variant_25.fnBody.value.(*CodeNode), subCtx_47, wr_10);
      wr_10.newline();
      wr_10.indent(-1);
      wr_10.out("}", true);
    }
  }
  wr_10.indent(-1);
  wr_10.out("}", true);
  var i_180 int64 = 0;  
  for ; i_180 < int64(len(cl_17.value.(*RangerAppClassDesc).static_methods)) ; i_180++ {
    variant_28 := cl_17.value.(*RangerAppClassDesc).static_methods[i_180];
    ctx.disableCurrentClass();
    wr_10.out("", true);
    if  variant_28.nameNode.value.(*CodeNode).hasFlag("main") {
      wr_10.out("/* static PHP main routine */", false);
      wr_10.newline();
      this.WalkNode(variant_28.fnBody.value.(*CodeNode), ctx, wr_10);
      wr_10.newline();
    }
  }
}
// inherited methods from parent class RangerGenericClassWriter
func (this *RangerPHPClassWriter) EncodeString (node *CodeNode, ctx *RangerAppWriterContext, wr *CodeWriter) string {
  /** unused:  encoded_str_2*/
  var str_length_2 int64 = int64(len(node.string_value));
  var encoded_str_8 string = "";
  var ii_11 int64 = 0;
  for ii_11 < str_length_2 {var cc_4 int64 = int64(node.string_value[ii_11]);
    switch (cc_4 ) { 
      case 8 : 
        encoded_str_8 = strings.Join([]string{ (strings.Join([]string{ encoded_str_8,(string([] byte{byte(92)})) }, "")),(string([] byte{byte(98)})) }, ""); 
      case 9 : 
        encoded_str_8 = strings.Join([]string{ (strings.Join([]string{ encoded_str_8,(string([] byte{byte(92)})) }, "")),(string([] byte{byte(116)})) }, ""); 
      case 10 : 
        encoded_str_8 = strings.Join([]string{ (strings.Join([]string{ encoded_str_8,(string([] byte{byte(92)})) }, "")),(string([] byte{byte(110)})) }, ""); 
      case 12 : 
        encoded_str_8 = strings.Join([]string{ (strings.Join([]string{ encoded_str_8,(string([] byte{byte(92)})) }, "")),(string([] byte{byte(102)})) }, ""); 
      case 13 : 
        encoded_str_8 = strings.Join([]string{ (strings.Join([]string{ encoded_str_8,(string([] byte{byte(92)})) }, "")),(string([] byte{byte(114)})) }, ""); 
      case 34 : 
        encoded_str_8 = strings.Join([]string{ (strings.Join([]string{ encoded_str_8,(string([] byte{byte(92)})) }, "")),(string([] byte{byte(34)})) }, ""); 
      case 92 : 
        encoded_str_8 = strings.Join([]string{ (strings.Join([]string{ encoded_str_8,(string([] byte{byte(92)})) }, "")),(string([] byte{byte(92)})) }, ""); 
      default: 
        encoded_str_8 = strings.Join([]string{ encoded_str_8,(string([] byte{byte(cc_4)})) }, ""); 
    }
    ii_11 = ii_11 + 1; 
  }
  return encoded_str_8;
}
func (this *RangerPHPClassWriter) CustomOperator (node *CodeNode, ctx *RangerAppWriterContext, wr *CodeWriter) () {
}
func (this *RangerPHPClassWriter) WriteSetterVRef (node *CodeNode, ctx *RangerAppWriterContext, wr *CodeWriter) () {
}
func (this *RangerPHPClassWriter) writeArrayTypeDef (node *CodeNode, ctx *RangerAppWriterContext, wr *CodeWriter) () {
}
func (this *RangerPHPClassWriter) WriteEnum (node *CodeNode, ctx *RangerAppWriterContext, wr *CodeWriter) () {
  if  node.eval_type == 11 {
    var rootObjName_2 string = node.ns[0];
    var e_8 *GoNullable = new(GoNullable); 
    e_8 = ctx.getEnum(rootObjName_2);
    if  e_8.has_value {
      var enumName_2 string = node.ns[1];
      wr.out(strings.Join([]string{ "",strconv.FormatInt(((r_get_string_int64(e_8.value.(*RangerAppEnum).values, enumName_2)).value.(int64)), 10) }, ""), false);
    } else {
      if  node.hasParamDesc {
        var pp_4 *GoNullable = new(GoNullable); 
        pp_4.value = node.paramDesc.value;
        pp_4.has_value = node.paramDesc.has_value;
        var nn_8 *GoNullable = new(GoNullable); 
        nn_8.value = pp_4.value.(IFACE_RangerAppParamDesc).Get_nameNode().value;
        nn_8.has_value = pp_4.value.(IFACE_RangerAppParamDesc).Get_nameNode().has_value;
        this.WriteVRef(nn_8.value.(*CodeNode), ctx, wr);
      }
    }
  }
}
func (this *RangerPHPClassWriter) WriteScalarValue (node *CodeNode, ctx *RangerAppWriterContext, wr *CodeWriter) () {
  switch (node.value_type ) { 
    case 2 : 
      wr.out(strings.Join([]string{ "",strconv.FormatFloat(node.double_value,'f', 6, 64) }, ""), false);
    case 4 : 
      var s_18 string = this.EncodeString(node, ctx, wr);
      wr.out(strings.Join([]string{ (strings.Join([]string{ "\"",s_18 }, "")),"\"" }, ""), false);
    case 3 : 
      wr.out(strings.Join([]string{ "",strconv.FormatInt(node.int_value, 10) }, ""), false);
    case 5 : 
      if  node.boolean_value {
        wr.out("true", false);
      } else {
        wr.out("false", false);
      }
  }
}
func (this *RangerPHPClassWriter) getTypeString (type_string string) string {
  return type_string;
}
func (this *RangerPHPClassWriter) import_lib (lib_name string, ctx *RangerAppWriterContext, wr *CodeWriter) () {
  wr.addImport(lib_name);
}
func (this *RangerPHPClassWriter) getObjectTypeString (type_string string, ctx *RangerAppWriterContext) string {
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
  }
  return type_string;
}
func (this *RangerPHPClassWriter) release_local_vars (node *CodeNode, ctx *RangerAppWriterContext, wr *CodeWriter) () {
  var i_61 int64 = 0;  
  for ; i_61 < int64(len(ctx.localVarNames)) ; i_61++ {
    n_7 := ctx.localVarNames[i_61];
    var p_14 *GoNullable = new(GoNullable); 
    p_14 = r_get_string_IFACE_RangerAppParamDesc(ctx.localVariables, n_7);
    if  p_14.value.(IFACE_RangerAppParamDesc).Get_ref_cnt() == 0 {
      continue;
    }
    if  p_14.value.(IFACE_RangerAppParamDesc).isAllocatedType() {
      if  1 == p_14.value.(IFACE_RangerAppParamDesc).getStrength() {
        if  p_14.value.(IFACE_RangerAppParamDesc).Get_nameNode().value.(*CodeNode).eval_type == 7 {
        }
        if  p_14.value.(IFACE_RangerAppParamDesc).Get_nameNode().value.(*CodeNode).eval_type == 6 {
        }
        if  (p_14.value.(IFACE_RangerAppParamDesc).Get_nameNode().value.(*CodeNode).eval_type != 6) && (p_14.value.(IFACE_RangerAppParamDesc).Get_nameNode().value.(*CodeNode).eval_type != 7) {
        }
      }
      if  0 == p_14.value.(IFACE_RangerAppParamDesc).getStrength() {
        if  p_14.value.(IFACE_RangerAppParamDesc).Get_nameNode().value.(*CodeNode).eval_type == 7 {
        }
        if  p_14.value.(IFACE_RangerAppParamDesc).Get_nameNode().value.(*CodeNode).eval_type == 6 {
        }
        if  (p_14.value.(IFACE_RangerAppParamDesc).Get_nameNode().value.(*CodeNode).eval_type != 6) && (p_14.value.(IFACE_RangerAppParamDesc).Get_nameNode().value.(*CodeNode).eval_type != 7) {
        }
      }
    }
  }
  if  ctx.is_function {
    return;
  }
  if  ctx.parent.has_value {
    this.release_local_vars(node, ctx.parent.value.(*RangerAppWriterContext), wr);
  }
}
func (this *RangerPHPClassWriter) WalkNode (node *CodeNode, ctx *RangerAppWriterContext, wr *CodeWriter) () {
  this.compiler.value.(*LiveCompiler).WalkNode(node, ctx, wr);
}
func (this *RangerPHPClassWriter) writeTypeDef (node *CodeNode, ctx *RangerAppWriterContext, wr *CodeWriter) () {
  wr.out(node.type_name, false);
}
func (this *RangerPHPClassWriter) writeRawTypeDef (node *CodeNode, ctx *RangerAppWriterContext, wr *CodeWriter) () {
  this.writeTypeDef(node, ctx, wr);
}
// getter for variable compiler
func (this *RangerPHPClassWriter) Get_compiler() *GoNullable {
  return this.compiler
}
// setter for variable compiler
func (this *RangerPHPClassWriter) Set_compiler( value *GoNullable)  {
  this.compiler = value 
}
// getter for variable thisName
func (this *RangerPHPClassWriter) Get_thisName() string {
  return this.thisName
}
// setter for variable thisName
func (this *RangerPHPClassWriter) Set_thisName( value string)  {
  this.thisName = value 
}
// getter for variable wrote_header
func (this *RangerPHPClassWriter) Get_wrote_header() bool {
  return this.wrote_header
}
// setter for variable wrote_header
func (this *RangerPHPClassWriter) Set_wrote_header( value bool)  {
  this.wrote_header = value 
}
// inherited getters and setters from the parent class RangerGenericClassWriter
type RangerJavaScriptClassWriter struct { 
  compiler *GoNullable /**  unused  **/ 
  thisName string /**  unused  **/ 
  wrote_header bool
  // inherited from parent class RangerGenericClassWriter
}
type IFACE_RangerJavaScriptClassWriter interface { 
  Get_compiler() *GoNullable
  Set_compiler(value *GoNullable) 
  Get_thisName() string
  Set_thisName(value string) 
  Get_wrote_header() bool
  Set_wrote_header(value bool) 
  adjustType(tn string) string
  WriteVRef(node *CodeNode, ctx *RangerAppWriterContext, wr *CodeWriter) ()
  writeVarInitDef(node *CodeNode, ctx *RangerAppWriterContext, wr *CodeWriter) ()
  writeVarDef(node *CodeNode, ctx *RangerAppWriterContext, wr *CodeWriter) ()
  writeClassVarDef(node *CodeNode, ctx *RangerAppWriterContext, wr *CodeWriter) ()
  writeArgsDef(fnDesc *RangerAppFunctionDesc, ctx *RangerAppWriterContext, wr *CodeWriter) ()
  writeClass(node *CodeNode, ctx *RangerAppWriterContext, orig_wr *CodeWriter) ()
}

func CreateNew_RangerJavaScriptClassWriter() *RangerJavaScriptClassWriter {
  me := new(RangerJavaScriptClassWriter)
  me.thisName = "this"
  me.wrote_header = false
  me.compiler = new(GoNullable);
  me.compiler = new(GoNullable);
  return me;
}
func (this *RangerJavaScriptClassWriter) adjustType (tn string) string {
  if  tn == "this" {
    return "this";
  }
  return tn;
}
func (this *RangerJavaScriptClassWriter) WriteVRef (node *CodeNode, ctx *RangerAppWriterContext, wr *CodeWriter) () {
  if  node.eval_type == 11 {
    if  (int64(len(node.ns))) > 1 {
      var rootObjName_13 string = node.ns[0];
      var enumName_13 string = node.ns[1];
      var e_19 *GoNullable = new(GoNullable); 
      e_19 = ctx.getEnum(rootObjName_13);
      if  e_19.has_value {
        wr.out(strings.Join([]string{ "",strconv.FormatInt(((r_get_string_int64(e_19.value.(*RangerAppEnum).values, enumName_13)).value.(int64)), 10) }, ""), false);
        return;
      }
    }
  }
  if  (int64(len(node.nsp))) > 0 {
    var i_162 int64 = 0;  
    for ; i_162 < int64(len(node.nsp)) ; i_162++ {
      p_49 := node.nsp[i_162];
      if  i_162 > 0 {
        wr.out(".", false);
      }
      if  i_162 == 0 {
        if  p_49.Get_nameNode().value.(*CodeNode).hasFlag("optional") {
        }
        var part_21 string = node.ns[0];
        if  (part_21 != "this") && ctx.isMemberVariable(part_21) {
          var uc_4 *GoNullable = new(GoNullable); 
          uc_4 = ctx.getCurrentClass();
          var currC_19 *RangerAppClassDesc = uc_4.value.(*RangerAppClassDesc);
          var up_12 *GoNullable = new(GoNullable); 
          up_12 = currC_19.findVariable(part_21);
          if  up_12.has_value {
            wr.out("this.", false);
          }
        }
        if  part_21 == "this" {
          wr.out("this", false);
          continue;
        }
      }
      if  (int64(len(p_49.Get_compiledName()))) > 0 {
        wr.out(this.adjustType(p_49.Get_compiledName()), false);
      } else {
        if  (int64(len(p_49.Get_name()))) > 0 {
          wr.out(this.adjustType(p_49.Get_name()), false);
        } else {
          wr.out(this.adjustType((node.ns[i_162])), false);
        }
      }
    }
    return;
  }
  if  node.hasParamDesc {
    var part_26 string = node.ns[0];
    if  (part_26 != "this") && ctx.isMemberVariable(part_26) {
      var uc_9 *GoNullable = new(GoNullable); 
      uc_9 = ctx.getCurrentClass();
      var currC_24 *RangerAppClassDesc = uc_9.value.(*RangerAppClassDesc);
      var up_17 *GoNullable = new(GoNullable); 
      up_17 = currC_24.findVariable(part_26);
      if  up_17.has_value {
        wr.out("this.", false);
      }
    }
    var p_54 *GoNullable = new(GoNullable); 
    p_54.value = node.paramDesc.value;
    p_54.has_value = node.paramDesc.has_value;
    wr.out(p_54.value.(IFACE_RangerAppParamDesc).Get_compiledName(), false);
    return;
  }
  var b_was_static_6 bool = false;
  var i_167 int64 = 0;  
  for ; i_167 < int64(len(node.ns)) ; i_167++ {
    part_29 := node.ns[i_167];
    if  i_167 > 0 {
      if  (i_167 == 1) && b_was_static_6 {
        wr.out(".", false);
      } else {
        wr.out(".", false);
      }
    }
    if  i_167 == 0 {
      if  ctx.hasClass(part_29) {
        b_was_static_6 = true; 
      } else {
        wr.out("", false);
      }
      if  (part_29 != "this") && ctx.isMemberVariable(part_29) {
        var uc_12 *GoNullable = new(GoNullable); 
        uc_12 = ctx.getCurrentClass();
        var currC_27 *RangerAppClassDesc = uc_12.value.(*RangerAppClassDesc);
        var up_20 *GoNullable = new(GoNullable); 
        up_20 = currC_27.findVariable(part_29);
        if  up_20.has_value {
          wr.out("this.", false);
        }
      }
    }
    wr.out(this.adjustType(part_29), false);
  }
}
func (this *RangerJavaScriptClassWriter) writeVarInitDef (node *CodeNode, ctx *RangerAppWriterContext, wr *CodeWriter) () {
  if  node.hasParamDesc {
    var nn_23 *CodeNode = node.children[1];
    var p_54 *GoNullable = new(GoNullable); 
    p_54.value = nn_23.paramDesc.value;
    p_54.has_value = nn_23.paramDesc.has_value;
    var remove_unused bool = ctx.hasCompilerFlag("remove-unused-class-vars");
    if  (p_54.value.(IFACE_RangerAppParamDesc).Get_ref_cnt() == 0) && (remove_unused || (p_54.value.(IFACE_RangerAppParamDesc).Get_is_class_variable() == false)) {
      wr.out("/** unused:  ", false);
    }
    wr.out(strings.Join([]string{ "this.",p_54.value.(IFACE_RangerAppParamDesc).Get_compiledName() }, ""), false);
    if  (int64(len(node.children))) > 2 {
      wr.out(" = ", false);
      ctx.setInExpr();
      var value_17 *CodeNode = node.getThird();
      this.WalkNode(value_17, ctx, wr);
      ctx.unsetInExpr();
    } else {
      if  nn_23.value_type == 6 {
        wr.out(" = []", false);
      }
      if  nn_23.value_type == 7 {
        wr.out(" = {}", false);
      }
    }
    if  (p_54.value.(IFACE_RangerAppParamDesc).Get_ref_cnt() == 0) && (remove_unused || (p_54.value.(IFACE_RangerAppParamDesc).Get_is_class_variable() == false)) {
      wr.out("   **/", true);
      return;
    }
    wr.out(";", false);
    if  (p_54.value.(IFACE_RangerAppParamDesc).Get_ref_cnt() == 0) && (p_54.value.(IFACE_RangerAppParamDesc).Get_is_class_variable() == true) {
      wr.out("     /** note: unused */", false);
    }
    wr.newline();
  }
}
func (this *RangerJavaScriptClassWriter) writeVarDef (node *CodeNode, ctx *RangerAppWriterContext, wr *CodeWriter) () {
  if  node.hasParamDesc {
    var nn_26 *CodeNode = node.children[1];
    var p_56 *GoNullable = new(GoNullable); 
    p_56.value = nn_26.paramDesc.value;
    p_56.has_value = nn_26.paramDesc.has_value;
    /** unused:  opt_js*/
    if  (p_56.value.(IFACE_RangerAppParamDesc).Get_ref_cnt() == 0) && (p_56.value.(IFACE_RangerAppParamDesc).Get_is_class_variable() == false) {
      wr.out("/** unused:  ", false);
    }
    wr.out(strings.Join([]string{ "var ",p_56.value.(IFACE_RangerAppParamDesc).Get_compiledName() }, ""), false);
    if  (int64(len(node.children))) > 2 {
      wr.out(" = ", false);
      ctx.setInExpr();
      var value_20 *CodeNode = node.getThird();
      this.WalkNode(value_20, ctx, wr);
      ctx.unsetInExpr();
    } else {
      if  nn_26.value_type == 6 {
        wr.out(" = []", false);
      }
      if  nn_26.value_type == 7 {
        wr.out(" = []", false);
      }
    }
    if  (p_56.value.(IFACE_RangerAppParamDesc).Get_ref_cnt() == 0) && (p_56.value.(IFACE_RangerAppParamDesc).Get_is_class_variable() == true) {
      wr.out("     /** note: unused */", false);
    }
    if  (p_56.value.(IFACE_RangerAppParamDesc).Get_ref_cnt() == 0) && (p_56.value.(IFACE_RangerAppParamDesc).Get_is_class_variable() == false) {
      wr.out("   **/ ", true);
    } else {
      wr.out("", false);
      wr.newline();
    }
  }
}
func (this *RangerJavaScriptClassWriter) writeClassVarDef (node *CodeNode, ctx *RangerAppWriterContext, wr *CodeWriter) () {
}
func (this *RangerJavaScriptClassWriter) writeArgsDef (fnDesc *RangerAppFunctionDesc, ctx *RangerAppWriterContext, wr *CodeWriter) () {
  var i_167 int64 = 0;  
  for ; i_167 < int64(len(fnDesc.params)) ; i_167++ {
    arg_30 := fnDesc.params[i_167];
    if  i_167 > 0 {
      wr.out(",", false);
    }
    wr.out(strings.Join([]string{ arg_30.Get_name()," " }, ""), false);
  }
}
func (this *RangerJavaScriptClassWriter) writeClass (node *CodeNode, ctx *RangerAppWriterContext, orig_wr *CodeWriter) () {
  var cl_16 *GoNullable = new(GoNullable); 
  cl_16.value = node.clDesc.value;
  cl_16.has_value = node.clDesc.has_value;
  if  !cl_16.has_value  {
    return;
  }
  var wr_11 *CodeWriter = orig_wr;
  /** unused:  importFork_6*/
  if  this.wrote_header == false {
    wr_11.out("", true);
    this.wrote_header = true; 
  }
  var b_extd bool = false;
  wr_11.out(strings.Join([]string{ (strings.Join([]string{ "class ",cl_16.value.(*RangerAppClassDesc).name }, ""))," " }, ""), false);
  var i_169 int64 = 0;  
  for ; i_169 < int64(len(cl_16.value.(*RangerAppClassDesc).extends_classes)) ; i_169++ {
    pName_9 := cl_16.value.(*RangerAppClassDesc).extends_classes[i_169];
    if  i_169 == 0 {
      wr_11.out(" extends ", false);
    }
    wr_11.out(pName_9, false);
    b_extd = true; 
  }
  wr_11.out(" {", true);
  wr_11.indent(1);
  var i_173 int64 = 0;  
  for ; i_173 < int64(len(cl_16.value.(*RangerAppClassDesc).variables)) ; i_173++ {
    pvar_17 := cl_16.value.(*RangerAppClassDesc).variables[i_173];
    this.writeClassVarDef(pvar_17.Get_node().value.(*CodeNode), ctx, wr_11);
  }
  wr_11.out("", true);
  wr_11.out("constructor(", false);
  if  cl_16.value.(*RangerAppClassDesc).has_constructor {
    var constr_18 *RangerAppFunctionDesc = cl_16.value.(*RangerAppClassDesc).constructor_fn.value.(*RangerAppFunctionDesc);
    this.writeArgsDef(constr_18, ctx, wr_11);
  }
  wr_11.out(" ) {", true);
  wr_11.indent(1);
  if  b_extd {
    wr_11.out("super()", true);
  }
  var i_176 int64 = 0;  
  for ; i_176 < int64(len(cl_16.value.(*RangerAppClassDesc).variables)) ; i_176++ {
    pvar_22 := cl_16.value.(*RangerAppClassDesc).variables[i_176];
    this.writeVarInitDef(pvar_22.Get_node().value.(*CodeNode), ctx, wr_11);
  }
  if  cl_16.value.(*RangerAppClassDesc).has_constructor {
    var constr_23 *GoNullable = new(GoNullable); 
    constr_23.value = cl_16.value.(*RangerAppClassDesc).constructor_fn.value;
    constr_23.has_value = cl_16.value.(*RangerAppClassDesc).constructor_fn.has_value;
    wr_11.newline();
    var subCtx_42 *RangerAppWriterContext = constr_23.value.(*RangerAppFunctionDesc).fnCtx.value.(*RangerAppWriterContext);
    subCtx_42.is_function = true; 
    this.WalkNode(constr_23.value.(*RangerAppFunctionDesc).fnBody.value.(*CodeNode), subCtx_42, wr_11);
  }
  wr_11.newline();
  wr_11.indent(-1);
  wr_11.out("}", true);
  var i_179 int64 = 0;  
  for ; i_179 < int64(len(cl_16.value.(*RangerAppClassDesc).defined_variants)) ; i_179++ {
    fnVar_11 := cl_16.value.(*RangerAppClassDesc).defined_variants[i_179];
    var mVs_11 *GoNullable = new(GoNullable); 
    mVs_11 = r_get_string_RangerAppMethodVariants(cl_16.value.(*RangerAppClassDesc).method_variants, fnVar_11);
    var i_186 int64 = 0;  
    for ; i_186 < int64(len(mVs_11.value.(*RangerAppMethodVariants).variants)) ; i_186++ {
      variant_23 := mVs_11.value.(*RangerAppMethodVariants).variants[i_186];
      wr_11.out("", true);
      wr_11.out(strings.Join([]string{ (strings.Join([]string{ "",variant_23.name }, "")),"(" }, ""), false);
      this.writeArgsDef(variant_23, ctx, wr_11);
      wr_11.out(") {", true);
      wr_11.indent(1);
      wr_11.newline();
      var subCtx_47 *RangerAppWriterContext = variant_23.fnCtx.value.(*RangerAppWriterContext);
      subCtx_47.is_function = true; 
      this.WalkNode(variant_23.fnBody.value.(*CodeNode), subCtx_47, wr_11);
      wr_11.newline();
      wr_11.indent(-1);
      wr_11.out("}", true);
    }
  }
  wr_11.indent(-1);
  wr_11.out("}", true);
  var i_185 int64 = 0;  
  for ; i_185 < int64(len(cl_16.value.(*RangerAppClassDesc).static_methods)) ; i_185++ {
    variant_28 := cl_16.value.(*RangerAppClassDesc).static_methods[i_185];
    wr_11.out("", true);
    if  variant_28.nameNode.value.(*CodeNode).hasFlag("main") {
      continue;
    } else {
      wr_11.out(strings.Join([]string{ (strings.Join([]string{ (strings.Join([]string{ cl_16.value.(*RangerAppClassDesc).name,"." }, "")),variant_28.name }, ""))," = function(" }, ""), false);
      this.writeArgsDef(variant_28, ctx, wr_11);
      wr_11.out(") {", true);
    }
    wr_11.indent(1);
    wr_11.newline();
    var subCtx_50 *RangerAppWriterContext = variant_28.fnCtx.value.(*RangerAppWriterContext);
    subCtx_50.is_function = true; 
    this.WalkNode(variant_28.fnBody.value.(*CodeNode), subCtx_50, wr_11);
    wr_11.newline();
    wr_11.indent(-1);
    wr_11.out("}", true);
  }
  var i_188 int64 = 0;  
  for ; i_188 < int64(len(cl_16.value.(*RangerAppClassDesc).static_methods)) ; i_188++ {
    variant_31 := cl_16.value.(*RangerAppClassDesc).static_methods[i_188];
    ctx.disableCurrentClass();
    wr_11.out("", true);
    if  variant_31.nameNode.value.(*CodeNode).hasFlag("main") {
      wr_11.out("/* static JavaSript main routine */", false);
      wr_11.newline();
      this.WalkNode(variant_31.fnBody.value.(*CodeNode), ctx, wr_11);
      wr_11.newline();
    }
  }
}
// inherited methods from parent class RangerGenericClassWriter
func (this *RangerJavaScriptClassWriter) EncodeString (node *CodeNode, ctx *RangerAppWriterContext, wr *CodeWriter) string {
  /** unused:  encoded_str_2*/
  var str_length_2 int64 = int64(len(node.string_value));
  var encoded_str_8 string = "";
  var ii_11 int64 = 0;
  for ii_11 < str_length_2 {var cc_4 int64 = int64(node.string_value[ii_11]);
    switch (cc_4 ) { 
      case 8 : 
        encoded_str_8 = strings.Join([]string{ (strings.Join([]string{ encoded_str_8,(string([] byte{byte(92)})) }, "")),(string([] byte{byte(98)})) }, ""); 
      case 9 : 
        encoded_str_8 = strings.Join([]string{ (strings.Join([]string{ encoded_str_8,(string([] byte{byte(92)})) }, "")),(string([] byte{byte(116)})) }, ""); 
      case 10 : 
        encoded_str_8 = strings.Join([]string{ (strings.Join([]string{ encoded_str_8,(string([] byte{byte(92)})) }, "")),(string([] byte{byte(110)})) }, ""); 
      case 12 : 
        encoded_str_8 = strings.Join([]string{ (strings.Join([]string{ encoded_str_8,(string([] byte{byte(92)})) }, "")),(string([] byte{byte(102)})) }, ""); 
      case 13 : 
        encoded_str_8 = strings.Join([]string{ (strings.Join([]string{ encoded_str_8,(string([] byte{byte(92)})) }, "")),(string([] byte{byte(114)})) }, ""); 
      case 34 : 
        encoded_str_8 = strings.Join([]string{ (strings.Join([]string{ encoded_str_8,(string([] byte{byte(92)})) }, "")),(string([] byte{byte(34)})) }, ""); 
      case 92 : 
        encoded_str_8 = strings.Join([]string{ (strings.Join([]string{ encoded_str_8,(string([] byte{byte(92)})) }, "")),(string([] byte{byte(92)})) }, ""); 
      default: 
        encoded_str_8 = strings.Join([]string{ encoded_str_8,(string([] byte{byte(cc_4)})) }, ""); 
    }
    ii_11 = ii_11 + 1; 
  }
  return encoded_str_8;
}
func (this *RangerJavaScriptClassWriter) CustomOperator (node *CodeNode, ctx *RangerAppWriterContext, wr *CodeWriter) () {
}
func (this *RangerJavaScriptClassWriter) WriteSetterVRef (node *CodeNode, ctx *RangerAppWriterContext, wr *CodeWriter) () {
}
func (this *RangerJavaScriptClassWriter) writeArrayTypeDef (node *CodeNode, ctx *RangerAppWriterContext, wr *CodeWriter) () {
}
func (this *RangerJavaScriptClassWriter) WriteEnum (node *CodeNode, ctx *RangerAppWriterContext, wr *CodeWriter) () {
  if  node.eval_type == 11 {
    var rootObjName_2 string = node.ns[0];
    var e_8 *GoNullable = new(GoNullable); 
    e_8 = ctx.getEnum(rootObjName_2);
    if  e_8.has_value {
      var enumName_2 string = node.ns[1];
      wr.out(strings.Join([]string{ "",strconv.FormatInt(((r_get_string_int64(e_8.value.(*RangerAppEnum).values, enumName_2)).value.(int64)), 10) }, ""), false);
    } else {
      if  node.hasParamDesc {
        var pp_4 *GoNullable = new(GoNullable); 
        pp_4.value = node.paramDesc.value;
        pp_4.has_value = node.paramDesc.has_value;
        var nn_8 *GoNullable = new(GoNullable); 
        nn_8.value = pp_4.value.(IFACE_RangerAppParamDesc).Get_nameNode().value;
        nn_8.has_value = pp_4.value.(IFACE_RangerAppParamDesc).Get_nameNode().has_value;
        this.WriteVRef(nn_8.value.(*CodeNode), ctx, wr);
      }
    }
  }
}
func (this *RangerJavaScriptClassWriter) WriteScalarValue (node *CodeNode, ctx *RangerAppWriterContext, wr *CodeWriter) () {
  switch (node.value_type ) { 
    case 2 : 
      wr.out(strings.Join([]string{ "",strconv.FormatFloat(node.double_value,'f', 6, 64) }, ""), false);
    case 4 : 
      var s_18 string = this.EncodeString(node, ctx, wr);
      wr.out(strings.Join([]string{ (strings.Join([]string{ "\"",s_18 }, "")),"\"" }, ""), false);
    case 3 : 
      wr.out(strings.Join([]string{ "",strconv.FormatInt(node.int_value, 10) }, ""), false);
    case 5 : 
      if  node.boolean_value {
        wr.out("true", false);
      } else {
        wr.out("false", false);
      }
  }
}
func (this *RangerJavaScriptClassWriter) getTypeString (type_string string) string {
  return type_string;
}
func (this *RangerJavaScriptClassWriter) import_lib (lib_name string, ctx *RangerAppWriterContext, wr *CodeWriter) () {
  wr.addImport(lib_name);
}
func (this *RangerJavaScriptClassWriter) getObjectTypeString (type_string string, ctx *RangerAppWriterContext) string {
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
  }
  return type_string;
}
func (this *RangerJavaScriptClassWriter) release_local_vars (node *CodeNode, ctx *RangerAppWriterContext, wr *CodeWriter) () {
  var i_61 int64 = 0;  
  for ; i_61 < int64(len(ctx.localVarNames)) ; i_61++ {
    n_7 := ctx.localVarNames[i_61];
    var p_14 *GoNullable = new(GoNullable); 
    p_14 = r_get_string_IFACE_RangerAppParamDesc(ctx.localVariables, n_7);
    if  p_14.value.(IFACE_RangerAppParamDesc).Get_ref_cnt() == 0 {
      continue;
    }
    if  p_14.value.(IFACE_RangerAppParamDesc).isAllocatedType() {
      if  1 == p_14.value.(IFACE_RangerAppParamDesc).getStrength() {
        if  p_14.value.(IFACE_RangerAppParamDesc).Get_nameNode().value.(*CodeNode).eval_type == 7 {
        }
        if  p_14.value.(IFACE_RangerAppParamDesc).Get_nameNode().value.(*CodeNode).eval_type == 6 {
        }
        if  (p_14.value.(IFACE_RangerAppParamDesc).Get_nameNode().value.(*CodeNode).eval_type != 6) && (p_14.value.(IFACE_RangerAppParamDesc).Get_nameNode().value.(*CodeNode).eval_type != 7) {
        }
      }
      if  0 == p_14.value.(IFACE_RangerAppParamDesc).getStrength() {
        if  p_14.value.(IFACE_RangerAppParamDesc).Get_nameNode().value.(*CodeNode).eval_type == 7 {
        }
        if  p_14.value.(IFACE_RangerAppParamDesc).Get_nameNode().value.(*CodeNode).eval_type == 6 {
        }
        if  (p_14.value.(IFACE_RangerAppParamDesc).Get_nameNode().value.(*CodeNode).eval_type != 6) && (p_14.value.(IFACE_RangerAppParamDesc).Get_nameNode().value.(*CodeNode).eval_type != 7) {
        }
      }
    }
  }
  if  ctx.is_function {
    return;
  }
  if  ctx.parent.has_value {
    this.release_local_vars(node, ctx.parent.value.(*RangerAppWriterContext), wr);
  }
}
func (this *RangerJavaScriptClassWriter) WalkNode (node *CodeNode, ctx *RangerAppWriterContext, wr *CodeWriter) () {
  this.compiler.value.(*LiveCompiler).WalkNode(node, ctx, wr);
}
func (this *RangerJavaScriptClassWriter) writeTypeDef (node *CodeNode, ctx *RangerAppWriterContext, wr *CodeWriter) () {
  wr.out(node.type_name, false);
}
func (this *RangerJavaScriptClassWriter) writeRawTypeDef (node *CodeNode, ctx *RangerAppWriterContext, wr *CodeWriter) () {
  this.writeTypeDef(node, ctx, wr);
}
func (this *RangerJavaScriptClassWriter) writeFnCall (node *CodeNode, ctx *RangerAppWriterContext, wr *CodeWriter) () {
  if  node.hasFnCall {
    var fc_20 *CodeNode = node.getFirst();
    this.WriteVRef(fc_20, ctx, wr);
    wr.out("(", false);
    var givenArgs_2 *CodeNode = node.getSecond();
    ctx.setInExpr();
    var i_68 int64 = 0;  
    for ; i_68 < int64(len(node.fnDesc.value.(*RangerAppFunctionDesc).params)) ; i_68++ {
      arg_12 := node.fnDesc.value.(*RangerAppFunctionDesc).params[i_68];
      if  i_68 > 0 {
        wr.out(", ", false);
      }
      if  (int64(len(givenArgs_2.children))) <= i_68 {
        var defVal *GoNullable = new(GoNullable); 
        defVal = arg_12.Get_nameNode().value.(*CodeNode).getFlag("default");
        if  defVal.has_value {
          var fc_31 *CodeNode = defVal.value.(*CodeNode).vref_annotation.value.(*CodeNode).getFirst();
          this.WalkNode(fc_31, ctx, wr);
        } else {
          ctx.addError(node, "Default argument was missing");
        }
        continue;
      }
      var n_10 *CodeNode = givenArgs_2.children[i_68];
      this.WalkNode(n_10, ctx, wr);
    }
    ctx.unsetInExpr();
    wr.out(")", false);
    if  ctx.expressionLevel() == 0 {
      wr.out(";", true);
    }
  }
}
func (this *RangerJavaScriptClassWriter) writeNewCall (node *CodeNode, ctx *RangerAppWriterContext, wr *CodeWriter) () {
  if  node.hasNewOper {
    var cl_2 *GoNullable = new(GoNullable); 
    cl_2.value = node.clDesc.value;
    cl_2.has_value = node.clDesc.has_value;
    /** unused:  fc_25*/
    wr.out(strings.Join([]string{ "new ",node.clDesc.value.(*RangerAppClassDesc).name }, ""), false);
    wr.out("(", false);
    var constr *GoNullable = new(GoNullable); 
    constr.value = cl_2.value.(*RangerAppClassDesc).constructor_fn.value;
    constr.has_value = cl_2.value.(*RangerAppClassDesc).constructor_fn.has_value;
    var givenArgs_5 *CodeNode = node.getThird();
    if  constr.has_value {
      var i_70 int64 = 0;  
      for ; i_70 < int64(len(constr.value.(*RangerAppFunctionDesc).params)) ; i_70++ {
        arg_15 := constr.value.(*RangerAppFunctionDesc).params[i_70];
        var n_12 *CodeNode = givenArgs_5.children[i_70];
        if  i_70 > 0 {
          wr.out(", ", false);
        }
        if  true || (arg_15.Get_nameNode().has_value) {
          this.WalkNode(n_12, ctx, wr);
        }
      }
    }
    wr.out(")", false);
  }
}
// getter for variable compiler
func (this *RangerJavaScriptClassWriter) Get_compiler() *GoNullable {
  return this.compiler
}
// setter for variable compiler
func (this *RangerJavaScriptClassWriter) Set_compiler( value *GoNullable)  {
  this.compiler = value 
}
// getter for variable thisName
func (this *RangerJavaScriptClassWriter) Get_thisName() string {
  return this.thisName
}
// setter for variable thisName
func (this *RangerJavaScriptClassWriter) Set_thisName( value string)  {
  this.thisName = value 
}
// getter for variable wrote_header
func (this *RangerJavaScriptClassWriter) Get_wrote_header() bool {
  return this.wrote_header
}
// setter for variable wrote_header
func (this *RangerJavaScriptClassWriter) Set_wrote_header( value bool)  {
  this.wrote_header = value 
}
// inherited getters and setters from the parent class RangerGenericClassWriter
type RangerRangerClassWriter struct { 
  compiler *GoNullable /**  unused  **/ 
  // inherited from parent class RangerGenericClassWriter
}
type IFACE_RangerRangerClassWriter interface { 
  Get_compiler() *GoNullable
  Set_compiler(value *GoNullable) 
  adjustType(tn string) string
  getObjectTypeString(type_string string, ctx *RangerAppWriterContext) string
  getTypeString(type_string string) string
  writeTypeDef(node *CodeNode, ctx *RangerAppWriterContext, wr *CodeWriter) ()
  WriteVRef(node *CodeNode, ctx *RangerAppWriterContext, wr *CodeWriter) ()
  WriteVRefWithOpt(node *CodeNode, ctx *RangerAppWriterContext, wr *CodeWriter) ()
  writeVarDef(node *CodeNode, ctx *RangerAppWriterContext, wr *CodeWriter) ()
  writeFnCall(node *CodeNode, ctx *RangerAppWriterContext, wr *CodeWriter) ()
  writeNewCall(node *CodeNode, ctx *RangerAppWriterContext, wr *CodeWriter) ()
  writeArgsDef(fnDesc *RangerAppFunctionDesc, ctx *RangerAppWriterContext, wr *CodeWriter) ()
  writeClass(node *CodeNode, ctx *RangerAppWriterContext, orig_wr *CodeWriter) ()
}

func CreateNew_RangerRangerClassWriter() *RangerRangerClassWriter {
  me := new(RangerRangerClassWriter)
  me.compiler = new(GoNullable);
  me.compiler = new(GoNullable);
  return me;
}
func (this *RangerRangerClassWriter) adjustType (tn string) string {
  if  tn == "this" {
    return "this";
  }
  return tn;
}
func (this *RangerRangerClassWriter) getObjectTypeString (type_string string, ctx *RangerAppWriterContext) string {
  return type_string;
}
func (this *RangerRangerClassWriter) getTypeString (type_string string) string {
  return type_string;
}
func (this *RangerRangerClassWriter) writeTypeDef (node *CodeNode, ctx *RangerAppWriterContext, wr *CodeWriter) () {
  var v_type_9 int64 = node.value_type;
  var t_name_3 string = node.type_name;
  var a_name_5 string = node.array_type;
  var k_name_3 string = node.key_type;
  if  ((v_type_9 == 8) || (v_type_9 == 9)) || (v_type_9 == 0) {
    v_type_9 = node.typeNameAsType(ctx); 
  }
  if  node.eval_type != 0 {
    v_type_9 = node.eval_type; 
    if  (int64(len(node.eval_type_name))) > 0 {
      t_name_3 = node.eval_type_name; 
    }
    if  (int64(len(node.eval_array_type))) > 0 {
      a_name_5 = node.eval_array_type; 
    }
    if  (int64(len(node.eval_key_type))) > 0 {
      k_name_3 = node.eval_key_type; 
    }
  }
  if  v_type_9 == 7 {
    wr.out(strings.Join([]string{ (strings.Join([]string{ (strings.Join([]string{ (strings.Join([]string{ "[",k_name_3 }, "")),":" }, "")),a_name_5 }, "")),"]" }, ""), false);
    return;
  }
  if  v_type_9 == 6 {
    wr.out(strings.Join([]string{ (strings.Join([]string{ "[",a_name_5 }, "")),"]" }, ""), false);
    return;
  }
  wr.out(t_name_3, false);
}
func (this *RangerRangerClassWriter) WriteVRef (node *CodeNode, ctx *RangerAppWriterContext, wr *CodeWriter) () {
  wr.out(node.vref, false);
}
func (this *RangerRangerClassWriter) WriteVRefWithOpt (node *CodeNode, ctx *RangerAppWriterContext, wr *CodeWriter) () {
  wr.out(node.vref, false);
  var flags []string = []string{"optional","weak","strong","temp","lives","returns"};
  var some_set bool = false;
  var i_172 int64 = 0;  
  for ; i_172 < int64(len(flags)) ; i_172++ {
    flag_2 := flags[i_172];
    if  node.hasFlag(flag_2) {
      if  false == some_set {
        wr.out("@(", false);
        some_set = true; 
      } else {
        wr.out(" ", false);
      }
      wr.out(flag_2, false);
    }
  }
  if  some_set {
    wr.out(")", false);
  }
}
func (this *RangerRangerClassWriter) writeVarDef (node *CodeNode, ctx *RangerAppWriterContext, wr *CodeWriter) () {
  if  node.hasParamDesc {
    var nn_25 *CodeNode = node.children[1];
    var p_53 *GoNullable = new(GoNullable); 
    p_53.value = nn_25.paramDesc.value;
    p_53.has_value = nn_25.paramDesc.has_value;
    wr.out("def ", false);
    this.WriteVRefWithOpt(nn_25, ctx, wr);
    wr.out(":", false);
    this.writeTypeDef(p_53.value.(IFACE_RangerAppParamDesc).Get_nameNode().value.(*CodeNode), ctx, wr);
    if  (int64(len(node.children))) > 2 {
      wr.out(" ", false);
      ctx.setInExpr();
      var value_19 *CodeNode = node.getThird();
      this.WalkNode(value_19, ctx, wr);
      ctx.unsetInExpr();
    }
    wr.newline();
  }
}
func (this *RangerRangerClassWriter) writeFnCall (node *CodeNode, ctx *RangerAppWriterContext, wr *CodeWriter) () {
  if  node.hasFnCall {
    if  ctx.expressionLevel() > 0 {
      wr.out("(", false);
    }
    var fc_36 *CodeNode = node.getFirst();
    this.WriteVRef(fc_36, ctx, wr);
    wr.out("(", false);
    var givenArgs_11 *CodeNode = node.getSecond();
    ctx.setInExpr();
    var i_175 int64 = 0;  
    for ; i_175 < int64(len(node.fnDesc.value.(*RangerAppFunctionDesc).params)) ; i_175++ {
      arg_31 := node.fnDesc.value.(*RangerAppFunctionDesc).params[i_175];
      if  i_175 > 0 {
        wr.out(", ", false);
      }
      if  (int64(len(givenArgs_11.children))) <= i_175 {
        var defVal_5 *GoNullable = new(GoNullable); 
        defVal_5 = arg_31.Get_nameNode().value.(*CodeNode).getFlag("default");
        if  defVal_5.has_value {
          var fc_47 *CodeNode = defVal_5.value.(*CodeNode).vref_annotation.value.(*CodeNode).getFirst();
          this.WalkNode(fc_47, ctx, wr);
        } else {
          ctx.addError(node, "Default argument was missing");
        }
        continue;
      }
      var n_17 *CodeNode = givenArgs_11.children[i_175];
      this.WalkNode(n_17, ctx, wr);
    }
    ctx.unsetInExpr();
    wr.out(")", false);
    if  ctx.expressionLevel() > 0 {
      wr.out(")", false);
    }
    if  ctx.expressionLevel() == 0 {
      wr.newline();
    }
  }
}
func (this *RangerRangerClassWriter) writeNewCall (node *CodeNode, ctx *RangerAppWriterContext, wr *CodeWriter) () {
  if  node.hasNewOper {
    var cl_17 *GoNullable = new(GoNullable); 
    cl_17.value = node.clDesc.value;
    cl_17.has_value = node.clDesc.has_value;
    /** unused:  fc_41*/
    wr.out(strings.Join([]string{ "(new ",node.clDesc.value.(*RangerAppClassDesc).name }, ""), false);
    wr.out("(", false);
    var constr_20 *GoNullable = new(GoNullable); 
    constr_20.value = cl_17.value.(*RangerAppClassDesc).constructor_fn.value;
    constr_20.has_value = cl_17.value.(*RangerAppClassDesc).constructor_fn.has_value;
    var givenArgs_14 *CodeNode = node.getThird();
    if  constr_20.has_value {
      var i_177 int64 = 0;  
      for ; i_177 < int64(len(constr_20.value.(*RangerAppFunctionDesc).params)) ; i_177++ {
        arg_34 := constr_20.value.(*RangerAppFunctionDesc).params[i_177];
        var n_20 *CodeNode = givenArgs_14.children[i_177];
        if  i_177 > 0 {
          wr.out(", ", false);
        }
        if  true || (arg_34.Get_nameNode().has_value) {
          this.WalkNode(n_20, ctx, wr);
        }
      }
    }
    wr.out("))", false);
  }
}
func (this *RangerRangerClassWriter) writeArgsDef (fnDesc *RangerAppFunctionDesc, ctx *RangerAppWriterContext, wr *CodeWriter) () {
  var i_179 int64 = 0;  
  for ; i_179 < int64(len(fnDesc.params)) ; i_179++ {
    arg_36 := fnDesc.params[i_179];
    if  i_179 > 0 {
      wr.out(",", false);
    }
    wr.out(" ", false);
    this.WriteVRefWithOpt(arg_36.Get_nameNode().value.(*CodeNode), ctx, wr);
    wr.out(":", false);
    this.writeTypeDef(arg_36.Get_nameNode().value.(*CodeNode), ctx, wr);
  }
}
func (this *RangerRangerClassWriter) writeClass (node *CodeNode, ctx *RangerAppWriterContext, orig_wr *CodeWriter) () {
  var cl_20 *GoNullable = new(GoNullable); 
  cl_20.value = node.clDesc.value;
  cl_20.has_value = node.clDesc.has_value;
  if  !cl_20.has_value  {
    return;
  }
  var wr_12 *CodeWriter = orig_wr;
  var importFork_7 *CodeWriter = wr_12.fork();
  wr_12.out("", true);
  wr_12.out(strings.Join([]string{ "class ",cl_20.value.(*RangerAppClassDesc).name }, ""), false);
  var parentClass_4 *GoNullable = new(GoNullable); 
  wr_12.out(" { ", true);
  wr_12.indent(1);
  if  (int64(len(cl_20.value.(*RangerAppClassDesc).extends_classes))) > 0 {
    wr_12.out("Extends(", false);
    var i_181 int64 = 0;  
    for ; i_181 < int64(len(cl_20.value.(*RangerAppClassDesc).extends_classes)) ; i_181++ {
      pName_10 := cl_20.value.(*RangerAppClassDesc).extends_classes[i_181];
      wr_12.out(pName_10, false);
      parentClass_4.value = ctx.findClass(pName_10);
      parentClass_4.has_value = true; /* detected as non-optional */
    }
    wr_12.out(")", true);
  }
  wr_12.createTag("utilities");
  var i_185 int64 = 0;  
  for ; i_185 < int64(len(cl_20.value.(*RangerAppClassDesc).variables)) ; i_185++ {
    pvar_19 := cl_20.value.(*RangerAppClassDesc).variables[i_185];
    this.writeVarDef(pvar_19.Get_node().value.(*CodeNode), ctx, wr_12);
  }
  if  cl_20.value.(*RangerAppClassDesc).has_constructor {
    var constr_23 *GoNullable = new(GoNullable); 
    constr_23.value = cl_20.value.(*RangerAppClassDesc).constructor_fn.value;
    constr_23.has_value = cl_20.value.(*RangerAppClassDesc).constructor_fn.has_value;
    wr_12.out("", true);
    wr_12.out("Constructor (", false);
    this.writeArgsDef(constr_23.value.(*RangerAppFunctionDesc), ctx, wr_12);
    wr_12.out(" ) {", true);
    wr_12.indent(1);
    wr_12.newline();
    var subCtx_45 *RangerAppWriterContext = constr_23.value.(*RangerAppFunctionDesc).fnCtx.value.(*RangerAppWriterContext);
    subCtx_45.is_function = true; 
    this.WalkNode(constr_23.value.(*RangerAppFunctionDesc).fnBody.value.(*CodeNode), subCtx_45, wr_12);
    wr_12.newline();
    wr_12.indent(-1);
    wr_12.out("}", true);
  }
  var i_188 int64 = 0;  
  for ; i_188 < int64(len(cl_20.value.(*RangerAppClassDesc).static_methods)) ; i_188++ {
    variant_26 := cl_20.value.(*RangerAppClassDesc).static_methods[i_188];
    wr_12.out("", true);
    if  variant_26.nameNode.value.(*CodeNode).hasFlag("main") {
      wr_12.out("sfn m@(main):void () {", true);
    } else {
      wr_12.out("sfn ", false);
      this.WriteVRefWithOpt(variant_26.nameNode.value.(*CodeNode), ctx, wr_12);
      wr_12.out(":", false);
      this.writeTypeDef(variant_26.nameNode.value.(*CodeNode), ctx, wr_12);
      wr_12.out(" (", false);
      this.writeArgsDef(variant_26, ctx, wr_12);
      wr_12.out(") {", true);
    }
    wr_12.indent(1);
    wr_12.newline();
    var subCtx_50 *RangerAppWriterContext = variant_26.fnCtx.value.(*RangerAppWriterContext);
    subCtx_50.is_function = true; 
    this.WalkNode(variant_26.fnBody.value.(*CodeNode), subCtx_50, wr_12);
    wr_12.newline();
    wr_12.indent(-1);
    wr_12.out("}", true);
  }
  var i_191 int64 = 0;  
  for ; i_191 < int64(len(cl_20.value.(*RangerAppClassDesc).defined_variants)) ; i_191++ {
    fnVar_12 := cl_20.value.(*RangerAppClassDesc).defined_variants[i_191];
    var mVs_12 *GoNullable = new(GoNullable); 
    mVs_12 = r_get_string_RangerAppMethodVariants(cl_20.value.(*RangerAppClassDesc).method_variants, fnVar_12);
    var i_198 int64 = 0;  
    for ; i_198 < int64(len(mVs_12.value.(*RangerAppMethodVariants).variants)) ; i_198++ {
      variant_31 := mVs_12.value.(*RangerAppMethodVariants).variants[i_198];
      wr_12.out("", true);
      wr_12.out("fn ", false);
      this.WriteVRefWithOpt(variant_31.nameNode.value.(*CodeNode), ctx, wr_12);
      wr_12.out(":", false);
      this.writeTypeDef(variant_31.nameNode.value.(*CodeNode), ctx, wr_12);
      wr_12.out(" ", false);
      wr_12.out("(", false);
      this.writeArgsDef(variant_31, ctx, wr_12);
      wr_12.out(") {", true);
      wr_12.indent(1);
      wr_12.newline();
      var subCtx_53 *RangerAppWriterContext = variant_31.fnCtx.value.(*RangerAppWriterContext);
      subCtx_53.is_function = true; 
      this.WalkNode(variant_31.fnBody.value.(*CodeNode), subCtx_53, wr_12);
      wr_12.newline();
      wr_12.indent(-1);
      wr_12.out("}", true);
    }
  }
  wr_12.indent(-1);
  wr_12.out("}", true);
  var import_list_4 []string = wr_12.getImports();
  var i_197 int64 = 0;  
  for ; i_197 < int64(len(import_list_4)) ; i_197++ {
    codeStr_4 := import_list_4[i_197];
    importFork_7.out(strings.Join([]string{ (strings.Join([]string{ "Import \"",codeStr_4 }, "")),"\"" }, ""), true);
  }
}
// inherited methods from parent class RangerGenericClassWriter
func (this *RangerRangerClassWriter) EncodeString (node *CodeNode, ctx *RangerAppWriterContext, wr *CodeWriter) string {
  /** unused:  encoded_str_2*/
  var str_length_2 int64 = int64(len(node.string_value));
  var encoded_str_8 string = "";
  var ii_11 int64 = 0;
  for ii_11 < str_length_2 {var cc_4 int64 = int64(node.string_value[ii_11]);
    switch (cc_4 ) { 
      case 8 : 
        encoded_str_8 = strings.Join([]string{ (strings.Join([]string{ encoded_str_8,(string([] byte{byte(92)})) }, "")),(string([] byte{byte(98)})) }, ""); 
      case 9 : 
        encoded_str_8 = strings.Join([]string{ (strings.Join([]string{ encoded_str_8,(string([] byte{byte(92)})) }, "")),(string([] byte{byte(116)})) }, ""); 
      case 10 : 
        encoded_str_8 = strings.Join([]string{ (strings.Join([]string{ encoded_str_8,(string([] byte{byte(92)})) }, "")),(string([] byte{byte(110)})) }, ""); 
      case 12 : 
        encoded_str_8 = strings.Join([]string{ (strings.Join([]string{ encoded_str_8,(string([] byte{byte(92)})) }, "")),(string([] byte{byte(102)})) }, ""); 
      case 13 : 
        encoded_str_8 = strings.Join([]string{ (strings.Join([]string{ encoded_str_8,(string([] byte{byte(92)})) }, "")),(string([] byte{byte(114)})) }, ""); 
      case 34 : 
        encoded_str_8 = strings.Join([]string{ (strings.Join([]string{ encoded_str_8,(string([] byte{byte(92)})) }, "")),(string([] byte{byte(34)})) }, ""); 
      case 92 : 
        encoded_str_8 = strings.Join([]string{ (strings.Join([]string{ encoded_str_8,(string([] byte{byte(92)})) }, "")),(string([] byte{byte(92)})) }, ""); 
      default: 
        encoded_str_8 = strings.Join([]string{ encoded_str_8,(string([] byte{byte(cc_4)})) }, ""); 
    }
    ii_11 = ii_11 + 1; 
  }
  return encoded_str_8;
}
func (this *RangerRangerClassWriter) CustomOperator (node *CodeNode, ctx *RangerAppWriterContext, wr *CodeWriter) () {
}
func (this *RangerRangerClassWriter) WriteSetterVRef (node *CodeNode, ctx *RangerAppWriterContext, wr *CodeWriter) () {
}
func (this *RangerRangerClassWriter) writeArrayTypeDef (node *CodeNode, ctx *RangerAppWriterContext, wr *CodeWriter) () {
}
func (this *RangerRangerClassWriter) WriteEnum (node *CodeNode, ctx *RangerAppWriterContext, wr *CodeWriter) () {
  if  node.eval_type == 11 {
    var rootObjName_2 string = node.ns[0];
    var e_8 *GoNullable = new(GoNullable); 
    e_8 = ctx.getEnum(rootObjName_2);
    if  e_8.has_value {
      var enumName_2 string = node.ns[1];
      wr.out(strings.Join([]string{ "",strconv.FormatInt(((r_get_string_int64(e_8.value.(*RangerAppEnum).values, enumName_2)).value.(int64)), 10) }, ""), false);
    } else {
      if  node.hasParamDesc {
        var pp_4 *GoNullable = new(GoNullable); 
        pp_4.value = node.paramDesc.value;
        pp_4.has_value = node.paramDesc.has_value;
        var nn_8 *GoNullable = new(GoNullable); 
        nn_8.value = pp_4.value.(IFACE_RangerAppParamDesc).Get_nameNode().value;
        nn_8.has_value = pp_4.value.(IFACE_RangerAppParamDesc).Get_nameNode().has_value;
        this.WriteVRef(nn_8.value.(*CodeNode), ctx, wr);
      }
    }
  }
}
func (this *RangerRangerClassWriter) WriteScalarValue (node *CodeNode, ctx *RangerAppWriterContext, wr *CodeWriter) () {
  switch (node.value_type ) { 
    case 2 : 
      wr.out(strings.Join([]string{ "",strconv.FormatFloat(node.double_value,'f', 6, 64) }, ""), false);
    case 4 : 
      var s_18 string = this.EncodeString(node, ctx, wr);
      wr.out(strings.Join([]string{ (strings.Join([]string{ "\"",s_18 }, "")),"\"" }, ""), false);
    case 3 : 
      wr.out(strings.Join([]string{ "",strconv.FormatInt(node.int_value, 10) }, ""), false);
    case 5 : 
      if  node.boolean_value {
        wr.out("true", false);
      } else {
        wr.out("false", false);
      }
  }
}
func (this *RangerRangerClassWriter) import_lib (lib_name string, ctx *RangerAppWriterContext, wr *CodeWriter) () {
  wr.addImport(lib_name);
}
func (this *RangerRangerClassWriter) release_local_vars (node *CodeNode, ctx *RangerAppWriterContext, wr *CodeWriter) () {
  var i_61 int64 = 0;  
  for ; i_61 < int64(len(ctx.localVarNames)) ; i_61++ {
    n_7 := ctx.localVarNames[i_61];
    var p_14 *GoNullable = new(GoNullable); 
    p_14 = r_get_string_IFACE_RangerAppParamDesc(ctx.localVariables, n_7);
    if  p_14.value.(IFACE_RangerAppParamDesc).Get_ref_cnt() == 0 {
      continue;
    }
    if  p_14.value.(IFACE_RangerAppParamDesc).isAllocatedType() {
      if  1 == p_14.value.(IFACE_RangerAppParamDesc).getStrength() {
        if  p_14.value.(IFACE_RangerAppParamDesc).Get_nameNode().value.(*CodeNode).eval_type == 7 {
        }
        if  p_14.value.(IFACE_RangerAppParamDesc).Get_nameNode().value.(*CodeNode).eval_type == 6 {
        }
        if  (p_14.value.(IFACE_RangerAppParamDesc).Get_nameNode().value.(*CodeNode).eval_type != 6) && (p_14.value.(IFACE_RangerAppParamDesc).Get_nameNode().value.(*CodeNode).eval_type != 7) {
        }
      }
      if  0 == p_14.value.(IFACE_RangerAppParamDesc).getStrength() {
        if  p_14.value.(IFACE_RangerAppParamDesc).Get_nameNode().value.(*CodeNode).eval_type == 7 {
        }
        if  p_14.value.(IFACE_RangerAppParamDesc).Get_nameNode().value.(*CodeNode).eval_type == 6 {
        }
        if  (p_14.value.(IFACE_RangerAppParamDesc).Get_nameNode().value.(*CodeNode).eval_type != 6) && (p_14.value.(IFACE_RangerAppParamDesc).Get_nameNode().value.(*CodeNode).eval_type != 7) {
        }
      }
    }
  }
  if  ctx.is_function {
    return;
  }
  if  ctx.parent.has_value {
    this.release_local_vars(node, ctx.parent.value.(*RangerAppWriterContext), wr);
  }
}
func (this *RangerRangerClassWriter) WalkNode (node *CodeNode, ctx *RangerAppWriterContext, wr *CodeWriter) () {
  this.compiler.value.(*LiveCompiler).WalkNode(node, ctx, wr);
}
func (this *RangerRangerClassWriter) writeRawTypeDef (node *CodeNode, ctx *RangerAppWriterContext, wr *CodeWriter) () {
  this.writeTypeDef(node, ctx, wr);
}
// getter for variable compiler
func (this *RangerRangerClassWriter) Get_compiler() *GoNullable {
  return this.compiler
}
// setter for variable compiler
func (this *RangerRangerClassWriter) Set_compiler( value *GoNullable)  {
  this.compiler = value 
}
// inherited getters and setters from the parent class RangerGenericClassWriter
type LiveCompiler struct { 
  langWriter *GoNullable
  hasCreatedPolyfill map[string]bool /**  unused  **/ 
}
type IFACE_LiveCompiler interface { 
  Get_langWriter() *GoNullable
  Set_langWriter(value *GoNullable) 
  Get_hasCreatedPolyfill() map[string]bool
  Set_hasCreatedPolyfill(value map[string]bool) 
  initWriter(ctx *RangerAppWriterContext) ()
  EncodeString(node *CodeNode, ctx *RangerAppWriterContext, wr *CodeWriter) string
  WriteScalarValue(node *CodeNode, ctx *RangerAppWriterContext, wr *CodeWriter) ()
  adjustType(tn string) string
  WriteVRef(node *CodeNode, ctx *RangerAppWriterContext, wr *CodeWriter) ()
  writeTypeDef(node *CodeNode, ctx *RangerAppWriterContext, wr *CodeWriter) ()
  CreateLambda(node *CodeNode, ctx *RangerAppWriterContext, wr *CodeWriter) ()
  getTypeString(str string, ctx *RangerAppWriterContext) string
  findOpCode(op *CodeNode, node *CodeNode, ctx *RangerAppWriterContext, wr *CodeWriter) ()
  findOpTemplate(op *CodeNode, node *CodeNode, ctx *RangerAppWriterContext, wr *CodeWriter) *GoNullable
  localCall(node *CodeNode, ctx *RangerAppWriterContext, wr *CodeWriter) bool
  WalkNode(node *CodeNode, ctx *RangerAppWriterContext, wr *CodeWriter) ()
  walkCommandList(cmd *CodeNode, node *CodeNode, ctx *RangerAppWriterContext, wr *CodeWriter) ()
  walkCommand(cmd *CodeNode, node *CodeNode, ctx *RangerAppWriterContext, wr *CodeWriter) ()
  compile(node *CodeNode, ctx *RangerAppWriterContext, wr *CodeWriter) ()
  findParamDesc(obj *CodeNode, ctx *RangerAppWriterContext, wr *CodeWriter) *GoNullable
}

func CreateNew_LiveCompiler() *LiveCompiler {
  me := new(LiveCompiler)
  me.hasCreatedPolyfill = make(map[string]bool)
  me.langWriter = new(GoNullable);
  return me;
}
func LiveCompiler_static_displayCompilerErrors(appCtx *RangerAppWriterContext) () {
  var i_203 int64 = 0;  
  for ; i_203 < int64(len(appCtx.compilerErrors)) ; i_203++ {
    e_21 := appCtx.compilerErrors[i_203];
    var line_index_4 int64 = e_21.node.value.(*CodeNode).getLine();
    fmt.Println( strings.Join([]string{ (strings.Join([]string{ e_21.node.value.(*CodeNode).getFilename()," Line: " }, "")),strconv.FormatInt((1 + line_index_4), 10) }, "") )
    fmt.Println( e_21.description )
    fmt.Println( e_21.node.value.(*CodeNode).getLineString(line_index_4) )
  }
}
func LiveCompiler_static_displayParserErrors(appCtx *RangerAppWriterContext) () {
  if  (int64(len(appCtx.parserErrors))) == 0 {
    fmt.Println( "no language test errors" )
    return;
  }
  fmt.Println( "LANGUAGE TEST ERRORS:" )
  var i_205 int64 = 0;  
  for ; i_205 < int64(len(appCtx.parserErrors)) ; i_205++ {
    e_24 := appCtx.parserErrors[i_205];
    var line_index_7 int64 = e_24.node.value.(*CodeNode).getLine();
    fmt.Println( strings.Join([]string{ (strings.Join([]string{ e_24.node.value.(*CodeNode).getFilename()," Line: " }, "")),strconv.FormatInt((1 + line_index_7), 10) }, "") )
    fmt.Println( e_24.description )
    fmt.Println( e_24.node.value.(*CodeNode).getLineString(line_index_7) )
  }
}
func (this *LiveCompiler) initWriter (ctx *RangerAppWriterContext) () {
  if  this.langWriter.has_value {
    return;
  }
  var root_21 *RangerAppWriterContext = ctx.getRoot();
  switch (root_21.targetLangName ) { 
    case "go" : 
      this.langWriter.value = CreateNew_RangerGolangClassWriter();
      this.langWriter.has_value = true; /* detected as non-optional */
    case "scala" : 
      this.langWriter.value = CreateNew_RangerScalaClassWriter();
      this.langWriter.has_value = true; /* detected as non-optional */
    case "java7" : 
      this.langWriter.value = CreateNew_RangerJava7ClassWriter();
      this.langWriter.has_value = true; /* detected as non-optional */
    case "swift3" : 
      this.langWriter.value = CreateNew_RangerSwift3ClassWriter();
      this.langWriter.has_value = true; /* detected as non-optional */
    case "kotlin" : 
      this.langWriter.value = CreateNew_RangerKotlinClassWriter();
      this.langWriter.has_value = true; /* detected as non-optional */
    case "php" : 
      this.langWriter.value = CreateNew_RangerPHPClassWriter();
      this.langWriter.has_value = true; /* detected as non-optional */
    case "csharp" : 
      this.langWriter.value = CreateNew_RangerCSharpClassWriter();
      this.langWriter.has_value = true; /* detected as non-optional */
    case "es6" : 
      this.langWriter.value = CreateNew_RangerJavaScriptClassWriter();
      this.langWriter.has_value = true; /* detected as non-optional */
    case "ranger" : 
      this.langWriter.value = CreateNew_RangerRangerClassWriter();
      this.langWriter.has_value = true; /* detected as non-optional */
  }
  if  this.langWriter.has_value {
    this.langWriter.value.(IFACE_RangerGenericClassWriter).Get_compiler().value = this;
    this.langWriter.value.(IFACE_RangerGenericClassWriter).Get_compiler().has_value = true; /* detected as non-optional */
  } else {
    this.langWriter.value = CreateNew_RangerGenericClassWriter();
    this.langWriter.has_value = true; /* detected as non-optional */
    this.langWriter.value.(IFACE_RangerGenericClassWriter).Get_compiler().value = this;
    this.langWriter.value.(IFACE_RangerGenericClassWriter).Get_compiler().has_value = true; /* detected as non-optional */
  }
}
func (this *LiveCompiler) EncodeString (node *CodeNode, ctx *RangerAppWriterContext, wr *CodeWriter) string {
  /** unused:  encoded_str_4*/
  var str_length_3 int64 = int64(len(node.string_value));
  var encoded_str_10 string = "";
  var ii_12 int64 = 0;
  for ii_12 < str_length_3 {var ch_6 int64 = int64(node.string_value[ii_12]);
    var cc_19 int64 = ch_6;
    switch (cc_19 ) { 
      case 8 : 
        encoded_str_10 = strings.Join([]string{ (strings.Join([]string{ encoded_str_10,(string([] byte{byte(92)})) }, "")),(string([] byte{byte(98)})) }, ""); 
      case 9 : 
        encoded_str_10 = strings.Join([]string{ (strings.Join([]string{ encoded_str_10,(string([] byte{byte(92)})) }, "")),(string([] byte{byte(116)})) }, ""); 
      case 10 : 
        encoded_str_10 = strings.Join([]string{ (strings.Join([]string{ encoded_str_10,(string([] byte{byte(92)})) }, "")),(string([] byte{byte(110)})) }, ""); 
      case 12 : 
        encoded_str_10 = strings.Join([]string{ (strings.Join([]string{ encoded_str_10,(string([] byte{byte(92)})) }, "")),(string([] byte{byte(102)})) }, ""); 
      case 13 : 
        encoded_str_10 = strings.Join([]string{ (strings.Join([]string{ encoded_str_10,(string([] byte{byte(92)})) }, "")),(string([] byte{byte(114)})) }, ""); 
      case 34 : 
        encoded_str_10 = strings.Join([]string{ (strings.Join([]string{ encoded_str_10,(string([] byte{byte(92)})) }, "")),(string([] byte{byte(34)})) }, ""); 
      case 92 : 
        encoded_str_10 = strings.Join([]string{ (strings.Join([]string{ encoded_str_10,(string([] byte{byte(92)})) }, "")),(string([] byte{byte(92)})) }, ""); 
      default: 
        encoded_str_10 = strings.Join([]string{ encoded_str_10,(string([] byte{byte(ch_6)})) }, ""); 
    }
    ii_12 = ii_12 + 1; 
  }
  return encoded_str_10;
}
func (this *LiveCompiler) WriteScalarValue (node *CodeNode, ctx *RangerAppWriterContext, wr *CodeWriter) () {
  this.langWriter.value.(IFACE_RangerGenericClassWriter).WriteScalarValue(node, ctx, wr);
}
func (this *LiveCompiler) adjustType (tn string) string {
  if  tn == "this" {
    return "self";
  }
  return tn;
}
func (this *LiveCompiler) WriteVRef (node *CodeNode, ctx *RangerAppWriterContext, wr *CodeWriter) () {
  this.langWriter.value.(IFACE_RangerGenericClassWriter).WriteVRef(node, ctx, wr);
}
func (this *LiveCompiler) writeTypeDef (node *CodeNode, ctx *RangerAppWriterContext, wr *CodeWriter) () {
  this.langWriter.value.(IFACE_RangerGenericClassWriter).writeTypeDef(node, ctx, wr);
}
func (this *LiveCompiler) CreateLambda (node *CodeNode, ctx *RangerAppWriterContext, wr *CodeWriter) () {
  var args_6 *CodeNode = node.children[2];
  var body_2 *CodeNode = node.children[3];
  wr.out("(", false);
  var i_182 int64 = 0;  
  for ; i_182 < int64(len(args_6.children)) ; i_182++ {
    arg_34 := args_6.children[i_182];
    if  i_182 > 0 {
      wr.out(", ", false);
    }
    wr.out(arg_34.vref, false);
  }
  wr.out(")", false);
  wr.out(" => { ", true);
  wr.indent(1);
  wr.out("// body ", true);
  var i_187 int64 = 0;  
  for ; i_187 < int64(len(body_2.children)) ; i_187++ {
    item_9 := body_2.children[i_187];
    this.WalkNode(item_9, ctx, wr);
  }
  wr.newline();
  wr.indent(-1);
  wr.out("}", true);
}
func (this *LiveCompiler) getTypeString (str string, ctx *RangerAppWriterContext) string {
  return "";
}
func (this *LiveCompiler) findOpCode (op *CodeNode, node *CodeNode, ctx *RangerAppWriterContext, wr *CodeWriter) () {
  var fnName_2 *CodeNode = op.children[1];
  var args_9 *CodeNode = op.children[2];
  if  (int64(len(op.children))) > 3 {
    var details *CodeNode = op.children[3];
    var i_187 int64 = 0;  
    for ; i_187 < int64(len(details.children)) ; i_187++ {
      det_2 := details.children[i_187];
      if  (int64(len(det_2.children))) > 0 {
        var fc_39 *CodeNode = det_2.children[0];
        if  fc_39.vref == "code" {
          var match_4 *RangerArgMatch = CreateNew_RangerArgMatch();
          var all_matched_3 bool = match_4.matchArguments(args_9, node, ctx, 1);
          if  all_matched_3 == false {
            return;
          }
          var origCode *CodeNode = det_2.children[1];
          var theCode *CodeNode = origCode.rebuildWithType(match_4, true);
          var appCtx *RangerAppWriterContext = ctx.getRoot();
          var stdFnName string = appCtx.createSignature(fnName_2.vref, (strings.Join([]string{ fnName_2.vref,theCode.getCode() }, "")));
          var stdClass *RangerAppClassDesc = ctx.findClass("RangerStaticMethods");
          var runCtx *RangerAppWriterContext = appCtx.fork();
          var b_failed bool = false;
          if  false == (r_has_key_string_bool(stdClass.defined_static_methods, stdFnName)) {
            runCtx.setInMethod();
            var m_11 *RangerAppFunctionDesc = CreateNew_RangerAppFunctionDesc();
            m_11.name = stdFnName; 
            m_11.node.value = op;
            m_11.node.has_value = true; /* detected as non-optional */
            m_11.is_static = true; 
            m_11.nameNode.value = fnName_2;
            m_11.nameNode.has_value = true; /* detected as non-optional */
            m_11.fnBody.value = theCode;
            m_11.fnBody.has_value = true; /* detected as non-optional */
            var ii_15 int64 = 0;  
            for ; ii_15 < int64(len(args_9.children)) ; ii_15++ {
              arg_37 := args_9.children[ii_15];
              var p_54 IFACE_RangerAppParamDesc = CreateNew_RangerAppParamDesc();
              p_54.Set_name(arg_37.vref); 
              p_54.Set_value_type(arg_37.value_type); 
              p_54.Get_node().value = arg_37;
              p_54.Get_node().has_value = true; /* detected as non-optional */
              p_54.Get_nameNode().value = arg_37;
              p_54.Get_nameNode().has_value = true; /* detected as non-optional */
              p_54.Set_refType(1); 
              p_54.Set_varType(4); 
              m_11.params = append(m_11.params,p_54); 
              arg_37.hasParamDesc = true; 
              arg_37.paramDesc.value = p_54;
              arg_37.paramDesc.has_value = true; /* detected as non-optional */
              arg_37.eval_type = arg_37.value_type; 
              arg_37.eval_type_name = arg_37.type_name; 
              runCtx.defineVariable(p_54.Get_name(), p_54);
            }
            stdClass.addStaticMethod(m_11);
            var err_cnt_4 int64 = int64(len(ctx.compilerErrors));
            var flowParser *RangerFlowParser = CreateNew_RangerFlowParser();
            var TmpWr *CodeWriter = CreateNew_CodeWriter();
            flowParser.WalkNode(theCode, runCtx, TmpWr);
            runCtx.unsetInMethod();
            var err_delta int64 = (int64(len(ctx.compilerErrors))) - err_cnt_4;
            if  err_delta > 0 {
              b_failed = true; 
              fmt.Println( "Had following compiler errors:" )
              var i_201 int64 = 0;  
              for ; i_201 < int64(len(ctx.compilerErrors)) ; i_201++ {
                e_20 := ctx.compilerErrors[i_201];
                if  i_201 < err_cnt_4 {
                  continue;
                }
                var line_index_3 int64 = e_20.node.value.(*CodeNode).getLine();
                fmt.Println( strings.Join([]string{ (strings.Join([]string{ e_20.node.value.(*CodeNode).getFilename()," Line: " }, "")),strconv.FormatInt(line_index_3, 10) }, "") )
                fmt.Println( e_20.description )
                fmt.Println( e_20.node.value.(*CodeNode).getLineString(line_index_3) )
              }
            } else {
              fmt.Println( "no errors found" )
            }
          }
          if  b_failed {
            wr.out("/* custom operator compilation failed */ ", false);
          } else {
            wr.out(strings.Join([]string{ (strings.Join([]string{ "RangerStaticMethods.",stdFnName }, "")),"(" }, ""), false);
            var i_209 int64 = 0;  
            for ; i_209 < int64(len(node.children)) ; i_209++ {
              cc_22 := node.children[i_209];
              if  i_209 == 0 {
                continue;
              }
              if  i_209 > 1 {
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
func (this *LiveCompiler) findOpTemplate (op *CodeNode, node *CodeNode, ctx *RangerAppWriterContext, wr *CodeWriter) *GoNullable {
  /** unused:  fnName_5*/
  /** unused:  root_24*/
  var langName_3 string = ctx.getTargetLang();
  if  (int64(len(op.children))) > 3 {
    var details_4 *CodeNode = op.children[3];
    var i_193 int64 = 0;  
    for ; i_193 < int64(len(details_4.children)) ; i_193++ {
      det_5 := details_4.children[i_193];
      if  (int64(len(det_5.children))) > 0 {
        var fc_42 *CodeNode = det_5.children[0];
        if  fc_42.vref == "templates" {
          var tplList_2 *CodeNode = det_5.children[1];
          var i_205 int64 = 0;  
          for ; i_205 < int64(len(tplList_2.children)) ; i_205++ {
            tpl_3 := tplList_2.children[i_205];
            var tplName_2 *CodeNode = tpl_3.getFirst();
            var tplImpl_2 *GoNullable = new(GoNullable); 
            tplImpl_2.value = tpl_3.getSecond();
            tplImpl_2.has_value = true; /* detected as non-optional */
            if  (tplName_2.vref != "*") && (tplName_2.vref != langName_3) {
              continue;
            }
            if  tplName_2.hasFlag("mutable") {
              if  false == node.hasFlag("mutable") {
                continue;
              }
            }
            return tplImpl_2;
          }
        }
      }
    }
  }
  var non_2 *GoNullable = new(GoNullable); 
  return non_2;
}
func (this *LiveCompiler) localCall (node *CodeNode, ctx *RangerAppWriterContext, wr *CodeWriter) bool {
  if  node.hasFnCall {
    if  this.langWriter.has_value {
      this.langWriter.value.(IFACE_RangerGenericClassWriter).writeFnCall(node, ctx, wr);
      return true;
    }
  }
  if  node.hasNewOper {
    this.langWriter.value.(IFACE_RangerGenericClassWriter).writeNewCall(node, ctx, wr);
    return true;
  }
  if  node.hasVarDef {
    this.langWriter.value.(IFACE_RangerGenericClassWriter).writeVarDef(node, ctx, wr);
    return true;
  }
  if  node.hasClassDescription {
    this.langWriter.value.(IFACE_RangerGenericClassWriter).writeClass(node, ctx, wr);
    return true;
  }
  return false;
}
func (this *LiveCompiler) WalkNode (node *CodeNode, ctx *RangerAppWriterContext, wr *CodeWriter) () {
  this.initWriter(ctx);
  if  node.isPrimitive() {
    this.WriteScalarValue(node, ctx, wr);
    return;
  }
  if  node.value_type == 9 {
    this.WriteVRef(node, ctx, wr);
    return;
  }
  if  node.value_type == 16 {
    this.WriteVRef(node, ctx, wr);
    return;
  }
  if  (int64(len(node.children))) > 0 {
    if  node.has_operator {
      var op *CodeNode = ctx.findOperator(node);
      /** unused:  fc_44*/
      var tplImpl_5 *GoNullable = new(GoNullable); 
      tplImpl_5 = this.findOpTemplate(op, node, ctx, wr);
      var evalCtx *RangerAppWriterContext = ctx;
      if  node.evalCtx.has_value {
        evalCtx = node.evalCtx.value.(*RangerAppWriterContext); 
      }
      if  tplImpl_5.has_value {
        var opName *CodeNode = op.getSecond();
        if  opName.hasFlag("returns") {
          this.langWriter.value.(IFACE_RangerGenericClassWriter).release_local_vars(node, evalCtx, wr);
        }
        this.walkCommandList(tplImpl_5.value.(*CodeNode), node, evalCtx, wr);
      } else {
        this.findOpCode(op, node, evalCtx, wr);
      }
      return;
    }
    if  node.isFirstVref("lambda") {
      this.CreateLambda(node, ctx, wr);
      return;
    }
    if  (int64(len(node.children))) > 1 {
      if  this.localCall(node, ctx, wr) {
        return;
      }
    }
    /** unused:  fc_50*/
  }
  if  node.expression {
    var i_197 int64 = 0;  
    for ; i_197 < int64(len(node.children)) ; i_197++ {
      item_12 := node.children[i_197];
      if  (node.didReturnAtIndex >= 0) && (node.didReturnAtIndex < i_197) {
        break;
      }
      this.WalkNode(item_12, ctx, wr);
    }
  } else {
  }
}
func (this *LiveCompiler) walkCommandList (cmd *CodeNode, node *CodeNode, ctx *RangerAppWriterContext, wr *CodeWriter) () {
  if  ctx.expressionLevel() == 0 {
    wr.newline();
  }
  if  ctx.expressionLevel() > 1 {
    wr.out("(", false);
  }
  var i_199 int64 = 0;  
  for ; i_199 < int64(len(cmd.children)) ; i_199++ {
    c_12 := cmd.children[i_199];
    this.walkCommand(c_12, node, ctx, wr);
  }
  if  ctx.expressionLevel() > 1 {
    wr.out(")", false);
  }
  if  ctx.expressionLevel() == 0 {
    wr.newline();
  }
}
func (this *LiveCompiler) walkCommand (cmd *CodeNode, node *CodeNode, ctx *RangerAppWriterContext, wr *CodeWriter) () {
  if  cmd.expression {
    var cmdE *CodeNode = cmd.getFirst();
    var cmdArg *CodeNode = cmd.getSecond();
    switch (cmdE.vref ) { 
      case "block" : 
        var idx_8 int64 = cmdArg.int_value;
        if  (int64(len(node.children))) > idx_8 {
          var arg_39 *CodeNode = node.children[idx_8];
          this.WalkNode(arg_39, ctx, wr);
        }
      case "varname" : 
        if  ctx.isVarDefined(cmdArg.vref) {
          var p_57 IFACE_RangerAppParamDesc = ctx.getVariableDef(cmdArg.vref);
          wr.out(p_57.Get_compiledName(), false);
        }
      case "defvar" : 
        var p_65 IFACE_RangerAppParamDesc = CreateNew_RangerAppParamDesc();
        p_65.Set_name(cmdArg.vref); 
        p_65.Set_value_type(cmdArg.value_type); 
        p_65.Get_node().value = cmdArg;
        p_65.Get_node().has_value = true; /* detected as non-optional */
        p_65.Get_nameNode().value = cmdArg;
        p_65.Get_nameNode().has_value = true; /* detected as non-optional */
        p_65.Set_is_optional(false); 
        ctx.defineVariable(p_65.Get_name(), p_65);
      case "cc" : 
        var idx_17 int64 = cmdArg.int_value;
        if  (int64(len(node.children))) > idx_17 {
          var arg_47 *CodeNode = node.children[idx_17];
          var cc_24 byte = []byte(arg_47.string_value)[0];
          wr.out(strings.Join([]string{ "",strconv.FormatInt((int64(cc_24)), 10) }, ""), false);
        }
      case "java_case" : 
        var idx_22 int64 = cmdArg.int_value;
        if  (int64(len(node.children))) > idx_22 {
          var arg_52 *CodeNode = node.children[idx_22];
          this.WalkNode(arg_52, ctx, wr);
          if  arg_52.didReturnAtIndex < 0 {
            wr.newline();
            wr.out("break;", true);
          }
        }
      case "e" : 
        var idx_27 int64 = cmdArg.int_value;
        if  (int64(len(node.children))) > idx_27 {
          var arg_57 *CodeNode = node.children[idx_27];
          ctx.setInExpr();
          this.WalkNode(arg_57, ctx, wr);
          ctx.unsetInExpr();
        }
      case "goset" : 
        var idx_32 int64 = cmdArg.int_value;
        if  (int64(len(node.children))) > idx_32 {
          var arg_62 *CodeNode = node.children[idx_32];
          ctx.setInExpr();
          this.langWriter.value.(IFACE_RangerGenericClassWriter).WriteSetterVRef(arg_62, ctx, wr);
          ctx.unsetInExpr();
        }
      case "pe" : 
        var idx_37 int64 = cmdArg.int_value;
        if  (int64(len(node.children))) > idx_37 {
          var arg_67 *CodeNode = node.children[idx_37];
          this.WalkNode(arg_67, ctx, wr);
        }
      case "ptr" : 
        var idx_42 int64 = cmdArg.int_value;
        if  (int64(len(node.children))) > idx_42 {
          var arg_72 *CodeNode = node.children[idx_42];
          if  arg_72.hasParamDesc {
            if  arg_72.paramDesc.value.(IFACE_RangerAppParamDesc).Get_nameNode().value.(*CodeNode).isAPrimitiveType() == false {
              wr.out("*", false);
            }
          } else {
            if  arg_72.isAPrimitiveType() == false {
              wr.out("*", false);
            }
          }
        }
      case "ptrsrc" : 
        var idx_47 int64 = cmdArg.int_value;
        if  (int64(len(node.children))) > idx_47 {
          var arg_77 *CodeNode = node.children[idx_47];
          if  (arg_77.isPrimitiveType() == false) && (arg_77.isPrimitive() == false) {
            wr.out("&", false);
          }
        }
      case "nameof" : 
        var idx_52 int64 = cmdArg.int_value;
        if  (int64(len(node.children))) > idx_52 {
          var arg_82 *CodeNode = node.children[idx_52];
          wr.out(arg_82.vref, false);
        }
      case "list" : 
        var idx_57 int64 = cmdArg.int_value;
        if  (int64(len(node.children))) > idx_57 {
          var arg_87 *CodeNode = node.children[idx_57];
          var i_201 int64 = 0;  
          for ; i_201 < int64(len(arg_87.children)) ; i_201++ {
            ch_9 := arg_87.children[i_201];
            if  i_201 > 0 {
              wr.out(" ", false);
            }
            ctx.setInExpr();
            this.WalkNode(ch_9, ctx, wr);
            ctx.unsetInExpr();
          }
        }
      case "comma" : 
        var idx_62 int64 = cmdArg.int_value;
        if  (int64(len(node.children))) > idx_62 {
          var arg_92 *CodeNode = node.children[idx_62];
          var i_209 int64 = 0;  
          for ; i_209 < int64(len(arg_92.children)) ; i_209++ {
            ch_17 := arg_92.children[i_209];
            if  i_209 > 0 {
              wr.out(",", false);
            }
            ctx.setInExpr();
            this.WalkNode(ch_17, ctx, wr);
            ctx.unsetInExpr();
          }
        }
      case "swift_rc" : 
        var idx_67 int64 = cmdArg.int_value;
        if  (int64(len(node.children))) > idx_67 {
          var arg_97 *CodeNode = node.children[idx_67];
          if  arg_97.hasParamDesc {
            if  arg_97.paramDesc.value.(IFACE_RangerAppParamDesc).Get_ref_cnt() == 0 {
              wr.out("_", false);
            } else {
              wr.out(arg_97.vref, false);
            }
          } else {
            wr.out(arg_97.vref, false);
          }
        }
      case "r_ktype" : 
        var idx_72 int64 = cmdArg.int_value;
        if  (int64(len(node.children))) > idx_72 {
          var arg_102 *CodeNode = node.children[idx_72];
          if  arg_102.hasParamDesc {
            var ss string = this.langWriter.value.(IFACE_RangerGenericClassWriter).getObjectTypeString(arg_102.paramDesc.value.(IFACE_RangerAppParamDesc).Get_nameNode().value.(*CodeNode).key_type, ctx);
            wr.out(ss, false);
          } else {
            var ss_17 string = this.langWriter.value.(IFACE_RangerGenericClassWriter).getObjectTypeString(arg_102.key_type, ctx);
            wr.out(ss_17, false);
          }
        }
      case "r_atype" : 
        var idx_77 int64 = cmdArg.int_value;
        if  (int64(len(node.children))) > idx_77 {
          var arg_107 *CodeNode = node.children[idx_77];
          if  arg_107.hasParamDesc {
            var ss_15 string = this.langWriter.value.(IFACE_RangerGenericClassWriter).getObjectTypeString(arg_107.paramDesc.value.(IFACE_RangerAppParamDesc).Get_nameNode().value.(*CodeNode).array_type, ctx);
            wr.out(ss_15, false);
          } else {
            var ss_27 string = this.langWriter.value.(IFACE_RangerGenericClassWriter).getObjectTypeString(arg_107.array_type, ctx);
            wr.out(ss_27, false);
          }
        }
      case "custom" : 
        this.langWriter.value.(IFACE_RangerGenericClassWriter).CustomOperator(node, ctx, wr);
      case "arraytype" : 
        var idx_82 int64 = cmdArg.int_value;
        if  (int64(len(node.children))) > idx_82 {
          var arg_112 *CodeNode = node.children[idx_82];
          if  arg_112.hasParamDesc {
            this.langWriter.value.(IFACE_RangerGenericClassWriter).writeArrayTypeDef(arg_112.paramDesc.value.(IFACE_RangerAppParamDesc).Get_nameNode().value.(*CodeNode), ctx, wr);
          } else {
            this.langWriter.value.(IFACE_RangerGenericClassWriter).writeArrayTypeDef(arg_112, ctx, wr);
          }
        }
      case "rawtype" : 
        var idx_87 int64 = cmdArg.int_value;
        if  (int64(len(node.children))) > idx_87 {
          var arg_117 *CodeNode = node.children[idx_87];
          if  arg_117.hasParamDesc {
            this.langWriter.value.(IFACE_RangerGenericClassWriter).writeRawTypeDef(arg_117.paramDesc.value.(IFACE_RangerAppParamDesc).Get_nameNode().value.(*CodeNode), ctx, wr);
          } else {
            this.langWriter.value.(IFACE_RangerGenericClassWriter).writeRawTypeDef(arg_117, ctx, wr);
          }
        }
      case "macro" : 
        var p_write *CodeWriter = wr.getTag("utilities");
        var newWriter *CodeWriter = CreateNew_CodeWriter();
        var testCtx *RangerAppWriterContext = ctx.fork();
        testCtx.restartExpressionLevel();
        this.walkCommandList(cmdArg, node, testCtx, newWriter);
        var p_str string = newWriter.getCode();
        /** unused:  root_26*/
        if  (r_has_key_string_bool(p_write.compiledTags, p_str)) == false {
          p_write.compiledTags[p_str] = true
          var mCtx *RangerAppWriterContext = ctx.fork();
          mCtx.restartExpressionLevel();
          this.walkCommandList(cmdArg, node, mCtx, p_write);
        }
      case "create_polyfill" : 
        var p_write_10 *CodeWriter = wr.getTag("utilities");
        var p_str_10 string = cmdArg.string_value;
        if  (r_has_key_string_bool(p_write_10.compiledTags, p_str_10)) == false {
          p_write_10.raw(p_str_10, true);
          p_write_10.compiledTags[p_str_10] = true
        }
      case "typeof" : 
        var idx_92 int64 = cmdArg.int_value;
        if  (int64(len(node.children))) >= idx_92 {
          var arg_122 *CodeNode = node.children[idx_92];
          if  arg_122.hasParamDesc {
            this.writeTypeDef(arg_122.paramDesc.value.(IFACE_RangerAppParamDesc).Get_nameNode().value.(*CodeNode), ctx, wr);
          } else {
            this.writeTypeDef(arg_122, ctx, wr);
          }
        }
      case "imp" : 
        this.langWriter.value.(IFACE_RangerGenericClassWriter).import_lib(cmdArg.string_value, ctx, wr);
      case "atype" : 
        var idx_97 int64 = cmdArg.int_value;
        if  (int64(len(node.children))) >= idx_97 {
          var arg_127 *CodeNode = node.children[idx_97];
          var p_70 *GoNullable = new(GoNullable); 
          p_70 = this.findParamDesc(arg_127, ctx, wr);
          var nameNode_3 *CodeNode = p_70.value.(IFACE_RangerAppParamDesc).Get_nameNode().value.(*CodeNode);
          var tn_3 string = nameNode_3.array_type;
          wr.out(this.getTypeString(tn_3, ctx), false);
        }
    }
  } else {
    if  cmd.value_type == 9 {
      switch (cmd.vref ) { 
        case "nl" : 
          wr.newline();
        case "I" : 
          wr.indent(1);
        case "i" : 
          wr.indent(-1);
        case "op" : 
          var fc_48 *CodeNode = node.getFirst();
          wr.out(fc_48.vref, false);
      }
    } else {
      if  cmd.value_type == 4 {
        wr.out(cmd.string_value, false);
      }
    }
  }
}
func (this *LiveCompiler) compile (node *CodeNode, ctx *RangerAppWriterContext, wr *CodeWriter) () {
}
func (this *LiveCompiler) findParamDesc (obj *CodeNode, ctx *RangerAppWriterContext, wr *CodeWriter) *GoNullable {
  var varDesc_3 *GoNullable = new(GoNullable); 
  var set_nsp_2 bool = false;
  var classDesc_4 *GoNullable = new(GoNullable); 
  if  0 == (int64(len(obj.nsp))) {
    set_nsp_2 = true; 
  }
  if  obj.vref != "this" {
    if  (int64(len(obj.ns))) > 1 {
      var cnt_6 int64 = int64(len(obj.ns));
      var classRefDesc_3 *GoNullable = new(GoNullable); 
      var i_205 int64 = 0;  
      for ; i_205 < int64(len(obj.ns)) ; i_205++ {
        strname_3 := obj.ns[i_205];
        if  i_205 == 0 {
          if  strname_3 == "this" {
            classDesc_4.value = ctx.getCurrentClass().value;
            classDesc_4.has_value = ctx.getCurrentClass().has_value; 
            if  set_nsp_2 {
              obj.nsp = append(obj.nsp,classDesc_4.value.(*RangerAppClassDesc)); 
            }
          } else {
            if  ctx.isDefinedClass(strname_3) {
              classDesc_4.value = ctx.findClass(strname_3);
              classDesc_4.has_value = true; /* detected as non-optional */
              if  set_nsp_2 {
                obj.nsp = append(obj.nsp,classDesc_4.value.(*RangerAppClassDesc)); 
              }
              continue;
            }
            classRefDesc_3.value = ctx.getVariableDef(strname_3);
            classRefDesc_3.has_value = true; /* detected as non-optional */
            if  !classRefDesc_3.has_value  {
              ctx.addError(obj, strings.Join([]string{ "Error, no description for called object: ",strname_3 }, ""));
              break;
            }
            if  set_nsp_2 {
              obj.nsp = append(obj.nsp,classRefDesc_3.value.(IFACE_RangerAppParamDesc)); 
            }
            classRefDesc_3.value.(IFACE_RangerAppParamDesc).Set_ref_cnt(1 + classRefDesc_3.value.(IFACE_RangerAppParamDesc).Get_ref_cnt()); 
            classDesc_4.value = ctx.findClass(classRefDesc_3.value.(IFACE_RangerAppParamDesc).Get_nameNode().value.(*CodeNode).type_name);
            classDesc_4.has_value = true; /* detected as non-optional */
          }
        } else {
          if  i_205 < (cnt_6 - 1) {
            varDesc_3.value = classDesc_4.value.(*RangerAppClassDesc).findVariable(strname_3).value;
            varDesc_3.has_value = classDesc_4.value.(*RangerAppClassDesc).findVariable(strname_3).has_value; 
            if  !varDesc_3.has_value  {
              ctx.addError(obj, strings.Join([]string{ "Error, no description for refenced obj: ",strname_3 }, ""));
            }
            var subClass_3 string = varDesc_3.value.(IFACE_RangerAppParamDesc).getTypeName();
            classDesc_4.value = ctx.findClass(subClass_3);
            classDesc_4.has_value = true; /* detected as non-optional */
            if  set_nsp_2 {
              obj.nsp = append(obj.nsp,varDesc_3.value.(IFACE_RangerAppParamDesc)); 
            }
            continue;
          }
          if  classDesc_4.has_value {
            varDesc_3.value = classDesc_4.value.(*RangerAppClassDesc).findVariable(strname_3).value;
            varDesc_3.has_value = classDesc_4.value.(*RangerAppClassDesc).findVariable(strname_3).has_value; 
            if  !varDesc_3.has_value  {
              var classMethod_2 *GoNullable = new(GoNullable); 
              classMethod_2 = classDesc_4.value.(*RangerAppClassDesc).findMethod(strname_3);
              if  !classMethod_2.has_value  {
                classMethod_2.value = classDesc_4.value.(*RangerAppClassDesc).findStaticMethod(strname_3).value;
                classMethod_2.has_value = classDesc_4.value.(*RangerAppClassDesc).findStaticMethod(strname_3).has_value; 
                if  !classMethod_2.has_value  {
                  ctx.addError(obj, strings.Join([]string{ "variable not found ",strname_3 }, ""));
                }
              }
              if  classMethod_2.has_value {
                if  set_nsp_2 {
                  obj.nsp = append(obj.nsp,classMethod_2.value.(*RangerAppFunctionDesc)); 
                }
                return classMethod_2;
              }
            }
            if  set_nsp_2 {
              obj.nsp = append(obj.nsp,varDesc_3.value.(IFACE_RangerAppParamDesc)); 
            }
          }
        }
      }
      return varDesc_3;
    }
    varDesc_3.value = ctx.getVariableDef(obj.vref);
    varDesc_3.has_value = true; /* detected as non-optional */
    if  varDesc_3.value.(IFACE_RangerAppParamDesc).Get_nameNode().has_value {
    } else {
      fmt.Println( strings.Join([]string{ "findParamDesc : description not found for ",obj.vref }, "") )
      if  varDesc_3.has_value {
        fmt.Println( strings.Join([]string{ "Vardesc was found though...",varDesc_3.value.(IFACE_RangerAppParamDesc).Get_name() }, "") )
      }
      ctx.addError(obj, strings.Join([]string{ "Error, no description for called object: ",obj.vref }, ""));
    }
    return varDesc_3;
  }
  var cc_26 *GoNullable = new(GoNullable); 
  cc_26 = ctx.getCurrentClass();
  return cc_26;
}
// getter for variable langWriter
func (this *LiveCompiler) Get_langWriter() *GoNullable {
  return this.langWriter
}
// setter for variable langWriter
func (this *LiveCompiler) Set_langWriter( value *GoNullable)  {
  this.langWriter = value 
}
// getter for variable hasCreatedPolyfill
func (this *LiveCompiler) Get_hasCreatedPolyfill() map[string]bool {
  return this.hasCreatedPolyfill
}
// setter for variable hasCreatedPolyfill
func (this *LiveCompiler) Set_hasCreatedPolyfill( value map[string]bool)  {
  this.hasCreatedPolyfill = value 
}
func main() {
  var allowed_languages []string = []string{"es6","go","scala","java7","swift3","php"};
  if  (int64( len( os.Args) - 1 )) < 5 {
    fmt.Println( "Ranger compiler, version 2.01" )
    fmt.Println( "usage <file> <language-file> <language> <directory> <targetfile>" )
    var s_21 string = "";
    var i_194 int64 = 0;  
    for ; i_194 < int64(len(allowed_languages)) ; i_194++ {
      lang_2 := allowed_languages[i_194];
      s_21 = strings.Join([]string{ (strings.Join([]string{ s_21," " }, "")),lang_2 }, ""); 
    }
    fmt.Println( strings.Join([]string{ "allowed languages: ",s_21 }, "") )
    return;
  }
  var the_file string = os.Args[0 + 1];
  var the_lang_file string = os.Args[1 + 1];
  var the_lang string = os.Args[2 + 1];
  var the_target_dir string = os.Args[3 + 1];
  var the_target string = os.Args[4 + 1];
  if  (r_indexof_arr_string(allowed_languages, the_lang)) < 0 {
    fmt.Println( strings.Join([]string{ "Invalid language : ",the_lang }, "") )
    var s_26 string = "";
    var i_199 int64 = 0;  
    for ; i_199 < int64(len(allowed_languages)) ; i_199++ {
      lang_7 := allowed_languages[i_199];
      s_26 = strings.Join([]string{ (strings.Join([]string{ s_26," " }, "")),lang_7 }, ""); 
    }
    fmt.Println( strings.Join([]string{ "allowed languages: ",s_26 }, "") )
    return;
  }
  if  (r_file_exists(".", the_file)) == false {
    fmt.Println( "Could not compile." )
    fmt.Println( strings.Join([]string{ "File not found: ",the_file }, "") )
    return;
  }
  if  (r_file_exists(".", the_lang_file)) == false {
    fmt.Println( strings.Join([]string{ (strings.Join([]string{ "language file ",the_lang_file }, ""))," not found!" }, "") )
    fmt.Println( "download: https://raw.githubusercontent.com/terotests/Ranger/master/compiler/Lang.clj" )
    return;
  }
  fmt.Println( strings.Join([]string{ "File to be compiled: ",the_file }, "") )
  var c_13 *GoNullable = new(GoNullable); 
  c_13 = r_io_read_file(".", the_file);
  var code_3 *SourceCode = CreateNew_SourceCode(c_13.value.(string));
  code_3.filename = the_file; 
  var parser_3 *RangerLispParser = CreateNew_RangerLispParser(code_3);
  parser_3.parse();
  var node_2 *CodeNode = parser_3.rootNode.value.(*CodeNode);
  var flowParser_2 *RangerFlowParser = CreateNew_RangerFlowParser();
  var appCtx_2 *RangerAppWriterContext = CreateNew_RangerAppWriterContext();
  var wr_13 *CodeWriter = CreateNew_CodeWriter();
  for {
    _start := time.Now()
    flowParser_2.mergeImports(node_2, appCtx_2, wr_13);
    var lang_str_2 *GoNullable = new(GoNullable); 
    lang_str_2 = r_io_read_file(".", the_lang_file);
    var lang_code_2 *SourceCode = CreateNew_SourceCode(lang_str_2.value.(string));
    lang_code_2.filename = the_lang_file; 
    var lang_parser_2 *RangerLispParser = CreateNew_RangerLispParser(lang_code_2);
    lang_parser_2.parse();
    appCtx_2.langOperators.value = lang_parser_2.rootNode.value.(*CodeNode);
    appCtx_2.langOperators.has_value = true; /* detected as non-optional */
    fmt.Println( "1. Collecting available methods." )
    flowParser_2.CollectMethods(node_2, appCtx_2, wr_13);
    if  (int64(len(appCtx_2.compilerErrors))) > 0 {
      LiveCompiler_static_displayCompilerErrors(appCtx_2);
      return;
    }
    fmt.Println( "2. Analyzing the code." )
    appCtx_2.targetLangName = the_lang; 
    flowParser_2.WalkNode(node_2, appCtx_2, wr_13);
    if  (int64(len(appCtx_2.compilerErrors))) > 0 {
      LiveCompiler_static_displayCompilerErrors(appCtx_2);
      LiveCompiler_static_displayParserErrors(appCtx_2);
      return;
    }
    fmt.Println( "3. Compiling the source code." )
    var fileSystem *CodeFileSystem = CreateNew_CodeFileSystem();
    var file_5 *CodeFile = fileSystem.getFile(".", the_target);
    var wr_20 *GoNullable = new(GoNullable); 
    wr_20 = file_5.getWriter();
    var lcc_2 *LiveCompiler = CreateNew_LiveCompiler();
    var staticMethods *GoNullable = new(GoNullable); 
    var importFork_8 *CodeWriter = wr_20.value.(*CodeWriter).fork();
    var i_202 int64 = 0;  
    for ; i_202 < int64(len(appCtx_2.definedClassList)) ; i_202++ {
      cName_2 := appCtx_2.definedClassList[i_202];
      if  cName_2 == "RangerStaticMethods" {
        staticMethods.value = r_get_string_RangerAppClassDesc(appCtx_2.definedClasses, cName_2).value;
        staticMethods.has_value = r_get_string_RangerAppClassDesc(appCtx_2.definedClasses, cName_2).has_value; 
        continue;
      }
      var cl_19 *GoNullable = new(GoNullable); 
      cl_19 = r_get_string_RangerAppClassDesc(appCtx_2.definedClasses, cName_2);
      if  cl_19.value.(*RangerAppClassDesc).is_system {
        fmt.Println( strings.Join([]string{ (strings.Join([]string{ "--> system class ",cl_19.value.(*RangerAppClassDesc).name }, "")),", skipping" }, "") )
        continue;
      }
      lcc_2.WalkNode(cl_19.value.(*RangerAppClassDesc).classNode.value.(*CodeNode), appCtx_2, wr_20.value.(*CodeWriter));
    }
    if  staticMethods.has_value {
      lcc_2.WalkNode(staticMethods.value.(*RangerAppClassDesc).classNode.value.(*CodeNode), appCtx_2, wr_20.value.(*CodeWriter));
    }
    var import_list_5 []string = wr_20.value.(*CodeWriter).getImports();
    if  appCtx_2.targetLangName == "go" {
      importFork_8.out("package main", true);
      importFork_8.newline();
      importFork_8.out("import (", true);
      importFork_8.indent(1);
    }
    var i_207 int64 = 0;  
    for ; i_207 < int64(len(import_list_5)) ; i_207++ {
      codeStr_5 := import_list_5[i_207];
      switch (appCtx_2.targetLangName ) { 
        case "go" : 
          if  (int64(codeStr_5[0])) == (int64(([]byte("_")[0]))) {
            importFork_8.out(strings.Join([]string{ (strings.Join([]string{ " _ \"",(codeStr_5[1:(int64(len(codeStr_5)))]) }, "")),"\"" }, ""), true);
          } else {
            importFork_8.out(strings.Join([]string{ (strings.Join([]string{ "\"",codeStr_5 }, "")),"\"" }, ""), true);
          }
        case "rust" : 
          importFork_8.out(strings.Join([]string{ (strings.Join([]string{ "use ",codeStr_5 }, "")),";" }, ""), true);
        default: 
          importFork_8.out(strings.Join([]string{ (strings.Join([]string{ "import ",codeStr_5 }, "")),"" }, ""), true);
      }
    }
    if  appCtx_2.targetLangName == "go" {
      importFork_8.indent(-1);
      importFork_8.out(")", true);
    }
    fileSystem.saveTo(the_target_dir);
    fmt.Println( "Ready." )
    LiveCompiler_static_displayCompilerErrors(appCtx_2);
    LiveCompiler_static_displayParserErrors(appCtx_2);
    fmt.Println("Total time", time.Since(_start) )
    break;
  }
}
