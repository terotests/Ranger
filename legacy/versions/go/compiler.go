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

func r_has_key_string_RangerParamEventList( a map[string]*RangerParamEventList, key string ) bool { 
  _, ok := a[key]
  return ok

}
func r_get_string_RangerParamEventList( a map[string]*RangerParamEventList, key string ) *GoNullable  { 
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
func r_has_key_string_IFACE_RangerAppParamDesc( a map[string]IFACE_RangerAppParamDesc, key string ) bool { 
  _, ok := a[key]
  return ok

}
func r_has_key_string_string( a map[string]string, key string ) bool { 
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

func r_has_key_string_DictNode( a map[string]*DictNode, key string ) bool { 
  _, ok := a[key]
  return ok

}
func r_get_string_DictNode( a map[string]*DictNode, key string ) *GoNullable  { 
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
type RangerParamEventHandler struct { 
}
type IFACE_RangerParamEventHandler interface { 
  callback(param IFACE_RangerAppParamDesc) ()
}

func CreateNew_RangerParamEventHandler() *RangerParamEventHandler {
  me := new(RangerParamEventHandler)
  return me;
}
func (this *RangerParamEventHandler) callback (param IFACE_RangerAppParamDesc) () {
}
type RangerParamEventList struct { 
  list []*RangerParamEventHandler
}
type IFACE_RangerParamEventList interface { 
  Get_list() []*RangerParamEventHandler
  Set_list(value []*RangerParamEventHandler) 
}

func CreateNew_RangerParamEventList() *RangerParamEventList {
  me := new(RangerParamEventList)
  me.list = make([]*RangerParamEventHandler,0)
  return me;
}
// getter for variable list
func (this *RangerParamEventList) Get_list() []*RangerParamEventHandler {
  return this.list
}
// setter for variable list
func (this *RangerParamEventList) Set_list( value []*RangerParamEventHandler)  {
  this.list = value 
}
type RangerParamEventMap struct { 
  events map[string]*RangerParamEventList
}
type IFACE_RangerParamEventMap interface { 
  Get_events() map[string]*RangerParamEventList
  Set_events(value map[string]*RangerParamEventList) 
  clearAllEvents() ()
  addEvent(name string, e *RangerParamEventHandler) ()
  fireEvent(name string, from IFACE_RangerAppParamDesc) ()
}

func CreateNew_RangerParamEventMap() *RangerParamEventMap {
  me := new(RangerParamEventMap)
  me.events = make(map[string]*RangerParamEventList)
  return me;
}
func (this *RangerParamEventMap) clearAllEvents () () {
}
func (this *RangerParamEventMap) addEvent (name string, e *RangerParamEventHandler) () {
  if  (r_has_key_string_RangerParamEventList(this.events, name)) == false {
    this.events[name] = CreateNew_RangerParamEventList()
  }
  var list *RangerParamEventList = (r_get_string_RangerParamEventList(this.events, name)).value.(*RangerParamEventList);
  list.list = append(list.list,e); 
}
func (this *RangerParamEventMap) fireEvent (name string, from IFACE_RangerAppParamDesc) () {
  if  r_has_key_string_RangerParamEventList(this.events, name) {
    var list *RangerParamEventList = (r_get_string_RangerParamEventList(this.events, name)).value.(*RangerParamEventList);
    var i int64 = 0;  
    for ; i < int64(len(list.list)) ; i++ {
      ev := list.list[i];
      ev.callback(from);
    }
  }
}
// getter for variable events
func (this *RangerParamEventMap) Get_events() map[string]*RangerParamEventList {
  return this.events
}
// setter for variable events
func (this *RangerParamEventMap) Set_events( value map[string]*RangerParamEventList)  {
  this.events = value 
}
type RangerAppArrayValue struct { 
  value_type int64 /**  unused  **/ 
  value_type_name string /**  unused  **/ 
  values []*RangerAppValue /**  unused  **/ 
}
type IFACE_RangerAppArrayValue interface { 
  Get_value_type() int64
  Set_value_type(value int64) 
  Get_value_type_name() string
  Set_value_type_name(value string) 
  Get_values() []*RangerAppValue
  Set_values(value []*RangerAppValue) 
}

func CreateNew_RangerAppArrayValue() *RangerAppArrayValue {
  me := new(RangerAppArrayValue)
  me.value_type = 0
  me.value_type_name = ""
  me.values = make([]*RangerAppValue,0)
  return me;
}
// getter for variable value_type
func (this *RangerAppArrayValue) Get_value_type() int64 {
  return this.value_type
}
// setter for variable value_type
func (this *RangerAppArrayValue) Set_value_type( value int64)  {
  this.value_type = value 
}
// getter for variable value_type_name
func (this *RangerAppArrayValue) Get_value_type_name() string {
  return this.value_type_name
}
// setter for variable value_type_name
func (this *RangerAppArrayValue) Set_value_type_name( value string)  {
  this.value_type_name = value 
}
// getter for variable values
func (this *RangerAppArrayValue) Get_values() []*RangerAppValue {
  return this.values
}
// setter for variable values
func (this *RangerAppArrayValue) Set_values( value []*RangerAppValue)  {
  this.values = value 
}
type RangerAppHashValue struct { 
  value_type int64 /**  unused  **/ 
  key_type_name string /**  unused  **/ 
  value_type_name string /**  unused  **/ 
  s_values map[string]*RangerAppValue /**  unused  **/ 
  i_values map[int64]*RangerAppValue /**  unused  **/ 
  b_values map[bool]*RangerAppValue /**  unused  **/ 
  d_values map[float64]*RangerAppValue /**  unused  **/ 
}
type IFACE_RangerAppHashValue interface { 
  Get_value_type() int64
  Set_value_type(value int64) 
  Get_key_type_name() string
  Set_key_type_name(value string) 
  Get_value_type_name() string
  Set_value_type_name(value string) 
  Get_s_values() map[string]*RangerAppValue
  Set_s_values(value map[string]*RangerAppValue) 
  Get_i_values() map[int64]*RangerAppValue
  Set_i_values(value map[int64]*RangerAppValue) 
  Get_b_values() map[bool]*RangerAppValue
  Set_b_values(value map[bool]*RangerAppValue) 
  Get_d_values() map[float64]*RangerAppValue
  Set_d_values(value map[float64]*RangerAppValue) 
}

func CreateNew_RangerAppHashValue() *RangerAppHashValue {
  me := new(RangerAppHashValue)
  me.value_type = 0
  me.key_type_name = ""
  me.value_type_name = ""
  me.s_values = make(map[string]*RangerAppValue)
  me.i_values = make(map[int64]*RangerAppValue)
  me.b_values = make(map[bool]*RangerAppValue)
  me.d_values = make(map[float64]*RangerAppValue)
  return me;
}
// getter for variable value_type
func (this *RangerAppHashValue) Get_value_type() int64 {
  return this.value_type
}
// setter for variable value_type
func (this *RangerAppHashValue) Set_value_type( value int64)  {
  this.value_type = value 
}
// getter for variable key_type_name
func (this *RangerAppHashValue) Get_key_type_name() string {
  return this.key_type_name
}
// setter for variable key_type_name
func (this *RangerAppHashValue) Set_key_type_name( value string)  {
  this.key_type_name = value 
}
// getter for variable value_type_name
func (this *RangerAppHashValue) Get_value_type_name() string {
  return this.value_type_name
}
// setter for variable value_type_name
func (this *RangerAppHashValue) Set_value_type_name( value string)  {
  this.value_type_name = value 
}
// getter for variable s_values
func (this *RangerAppHashValue) Get_s_values() map[string]*RangerAppValue {
  return this.s_values
}
// setter for variable s_values
func (this *RangerAppHashValue) Set_s_values( value map[string]*RangerAppValue)  {
  this.s_values = value 
}
// getter for variable i_values
func (this *RangerAppHashValue) Get_i_values() map[int64]*RangerAppValue {
  return this.i_values
}
// setter for variable i_values
func (this *RangerAppHashValue) Set_i_values( value map[int64]*RangerAppValue)  {
  this.i_values = value 
}
// getter for variable b_values
func (this *RangerAppHashValue) Get_b_values() map[bool]*RangerAppValue {
  return this.b_values
}
// setter for variable b_values
func (this *RangerAppHashValue) Set_b_values( value map[bool]*RangerAppValue)  {
  this.b_values = value 
}
// getter for variable d_values
func (this *RangerAppHashValue) Get_d_values() map[float64]*RangerAppValue {
  return this.d_values
}
// setter for variable d_values
func (this *RangerAppHashValue) Set_d_values( value map[float64]*RangerAppValue)  {
  this.d_values = value 
}
type RangerAppValue struct { 
  double_value int64 /**  unused  **/ 
  string_value string /**  unused  **/ 
  int_value int64 /**  unused  **/ 
  boolean_value bool /**  unused  **/ 
  arr *GoNullable /**  unused  **/ 
  hash *GoNullable /**  unused  **/ 
}
type IFACE_RangerAppValue interface { 
  Get_double_value() int64
  Set_double_value(value int64) 
  Get_string_value() string
  Set_string_value(value string) 
  Get_int_value() int64
  Set_int_value(value int64) 
  Get_boolean_value() bool
  Set_boolean_value(value bool) 
  Get_arr() *GoNullable
  Set_arr(value *GoNullable) 
  Get_hash() *GoNullable
  Set_hash(value *GoNullable) 
}

func CreateNew_RangerAppValue() *RangerAppValue {
  me := new(RangerAppValue)
  me.double_value = 0
  me.string_value = ""
  me.int_value = 0
  me.boolean_value = false
  me.arr = new(GoNullable);
  me.hash = new(GoNullable);
  return me;
}
// getter for variable double_value
func (this *RangerAppValue) Get_double_value() int64 {
  return this.double_value
}
// setter for variable double_value
func (this *RangerAppValue) Set_double_value( value int64)  {
  this.double_value = value 
}
// getter for variable string_value
func (this *RangerAppValue) Get_string_value() string {
  return this.string_value
}
// setter for variable string_value
func (this *RangerAppValue) Set_string_value( value string)  {
  this.string_value = value 
}
// getter for variable int_value
func (this *RangerAppValue) Get_int_value() int64 {
  return this.int_value
}
// setter for variable int_value
func (this *RangerAppValue) Set_int_value( value int64)  {
  this.int_value = value 
}
// getter for variable boolean_value
func (this *RangerAppValue) Get_boolean_value() bool {
  return this.boolean_value
}
// setter for variable boolean_value
func (this *RangerAppValue) Set_boolean_value( value bool)  {
  this.boolean_value = value 
}
// getter for variable arr
func (this *RangerAppValue) Get_arr() *GoNullable {
  return this.arr
}
// setter for variable arr
func (this *RangerAppValue) Set_arr( value *GoNullable)  {
  this.arr = value 
}
// getter for variable hash
func (this *RangerAppValue) Get_hash() *GoNullable {
  return this.hash
}
// setter for variable hash
func (this *RangerAppValue) Set_hash( value *GoNullable)  {
  this.hash = value 
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
  value *GoNullable /**  unused  **/ 
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
  is_captured bool
  node *GoNullable
  nameNode *GoNullable
  description string /**  unused  **/ 
  git_doc string /**  unused  **/ 
  has_events bool
  eMap *GoNullable
}
type IFACE_RangerAppParamDesc interface { 
  Get_name() string
  Set_name(value string) 
  Get_value() *GoNullable
  Set_value(value *GoNullable) 
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
  Get_is_captured() bool
  Set_is_captured(value bool) 
  Get_node() *GoNullable
  Set_node(value *GoNullable) 
  Get_nameNode() *GoNullable
  Set_nameNode(value *GoNullable) 
  Get_description() string
  Set_description(value string) 
  Get_git_doc() string
  Set_git_doc(value string) 
  Get_has_events() bool
  Set_has_events(value bool) 
  Get_eMap() *GoNullable
  Set_eMap(value *GoNullable) 
  addEvent(name string, e *RangerParamEventHandler) ()
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
  me.is_captured = false
  me.description = ""
  me.git_doc = ""
  me.has_events = false
  me.value = new(GoNullable);
  me.def_value = new(GoNullable);
  me.default_value = new(GoNullable);
  me.classDesc = new(GoNullable);
  me.fnDesc = new(GoNullable);
  me.isParam = new(GoNullable);
  me.node = new(GoNullable);
  me.nameNode = new(GoNullable);
  me.eMap = new(GoNullable);
  return me;
}
func (this *RangerAppParamDesc) addEvent (name string, e *RangerParamEventHandler) () {
  if  this.has_events == false {
    this.eMap.value = CreateNew_RangerParamEventMap();
    this.eMap.has_value = true; /* detected as non-optional */
    this.has_events = true; 
  }
  this.eMap.value.(*RangerParamEventMap).addEvent(name, e);
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
      if  (((((this.nameNode.value.(*CodeNode).eval_type == 13) || (this.nameNode.value.(*CodeNode).eval_type == 12)) || (this.nameNode.value.(*CodeNode).eval_type == 4)) || (this.nameNode.value.(*CodeNode).eval_type == 2)) || (this.nameNode.value.(*CodeNode).eval_type == 5)) || (this.nameNode.value.(*CodeNode).eval_type == 3) {
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
  var __len int64 = int64(len(this.ownerHistory));
  if  __len > 0 {
    var firstEntry *RangerRefForce = this.ownerHistory[0];
    return firstEntry.strength;
  }
  return 1;
}
func (this *RangerAppParamDesc) getLifetime () int64 {
  var __len int64 = int64(len(this.ownerHistory));
  if  __len > 0 {
    var lastEntry *RangerRefForce = this.ownerHistory[(__len - 1)];
    return lastEntry.lifetime;
  }
  return 1;
}
func (this *RangerAppParamDesc) getStrength () int64 {
  var __len int64 = int64(len(this.ownerHistory));
  if  __len > 0 {
    var lastEntry *RangerRefForce = this.ownerHistory[(__len - 1)];
    return lastEntry.strength;
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
      var is_object_1 bool = true;
      switch (this.nameNode.value.(*CodeNode).type_name ) { 
        case "string" : 
          is_object_1 = false; 
        case "int" : 
          is_object_1 = false; 
        case "boolean" : 
          is_object_1 = false; 
        case "double" : 
          is_object_1 = false; 
      }
      if  ctx.isEnumDefined(this.nameNode.value.(*CodeNode).type_name) {
        return false;
      }
      return is_object_1;
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
// getter for variable value
func (this *RangerAppParamDesc) Get_value() *GoNullable {
  return this.value
}
// setter for variable value
func (this *RangerAppParamDesc) Set_value( value *GoNullable)  {
  this.value = value 
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
// getter for variable is_captured
func (this *RangerAppParamDesc) Get_is_captured() bool {
  return this.is_captured
}
// setter for variable is_captured
func (this *RangerAppParamDesc) Set_is_captured( value bool)  {
  this.is_captured = value 
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
// getter for variable has_events
func (this *RangerAppParamDesc) Get_has_events() bool {
  return this.has_events
}
// setter for variable has_events
func (this *RangerAppParamDesc) Set_has_events( value bool)  {
  this.has_events = value 
}
// getter for variable eMap
func (this *RangerAppParamDesc) Get_eMap() *GoNullable {
  return this.eMap
}
// setter for variable eMap
func (this *RangerAppParamDesc) Set_eMap( value *GoNullable)  {
  this.eMap = value 
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
  value *GoNullable /**  unused  **/ 
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
  is_captured bool
  description string /**  unused  **/ 
  git_doc string /**  unused  **/ 
  has_events bool
  eMap *GoNullable
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
  me.is_captured = false
  me.description = ""
  me.git_doc = ""
  me.has_events = false
  me.value = new(GoNullable);
  me.def_value = new(GoNullable);
  me.default_value = new(GoNullable);
  me.classDesc = new(GoNullable);
  me.fnDesc = new(GoNullable);
  me.isParam = new(GoNullable);
  me.node = new(GoNullable);
  me.nameNode = new(GoNullable);
  me.eMap = new(GoNullable);
  return me;
}
func (this *RangerAppFunctionDesc) isClass () bool {
  return false;
}
func (this *RangerAppFunctionDesc) isProperty () bool {
  return false;
}
// inherited methods from parent class RangerAppParamDesc
func (this *RangerAppFunctionDesc) addEvent (name string, e *RangerParamEventHandler) () {
  if  this.has_events == false {
    this.eMap.value = CreateNew_RangerParamEventMap();
    this.eMap.has_value = true; /* detected as non-optional */
    this.has_events = true; 
  }
  this.eMap.value.(*RangerParamEventMap).addEvent(name, e);
}
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
      if  (((((this.nameNode.value.(*CodeNode).eval_type == 13) || (this.nameNode.value.(*CodeNode).eval_type == 12)) || (this.nameNode.value.(*CodeNode).eval_type == 4)) || (this.nameNode.value.(*CodeNode).eval_type == 2)) || (this.nameNode.value.(*CodeNode).eval_type == 5)) || (this.nameNode.value.(*CodeNode).eval_type == 3) {
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
  var __len int64 = int64(len(this.ownerHistory));
  if  __len > 0 {
    var firstEntry *RangerRefForce = this.ownerHistory[0];
    return firstEntry.strength;
  }
  return 1;
}
func (this *RangerAppFunctionDesc) getLifetime () int64 {
  var __len int64 = int64(len(this.ownerHistory));
  if  __len > 0 {
    var lastEntry *RangerRefForce = this.ownerHistory[(__len - 1)];
    return lastEntry.lifetime;
  }
  return 1;
}
func (this *RangerAppFunctionDesc) getStrength () int64 {
  var __len int64 = int64(len(this.ownerHistory));
  if  __len > 0 {
    var lastEntry *RangerRefForce = this.ownerHistory[(__len - 1)];
    return lastEntry.strength;
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
      var is_object_1 bool = true;
      switch (this.nameNode.value.(*CodeNode).type_name ) { 
        case "string" : 
          is_object_1 = false; 
        case "int" : 
          is_object_1 = false; 
        case "boolean" : 
          is_object_1 = false; 
        case "double" : 
          is_object_1 = false; 
      }
      if  ctx.isEnumDefined(this.nameNode.value.(*CodeNode).type_name) {
        return false;
      }
      return is_object_1;
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
// getter for variable value
func (this *RangerAppFunctionDesc) Get_value() *GoNullable {
  return this.value
}
// getter for variable value
func (this *RangerAppFunctionDesc) Set_value( value *GoNullable)  {
  this.value = value 
}
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
// getter for variable is_captured
func (this *RangerAppFunctionDesc) Get_is_captured() bool {
  return this.is_captured
}
// getter for variable is_captured
func (this *RangerAppFunctionDesc) Set_is_captured( value bool)  {
  this.is_captured = value 
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
// getter for variable has_events
func (this *RangerAppFunctionDesc) Get_has_events() bool {
  return this.has_events
}
// getter for variable has_events
func (this *RangerAppFunctionDesc) Set_has_events( value bool)  {
  this.has_events = value 
}
// getter for variable eMap
func (this *RangerAppFunctionDesc) Get_eMap() *GoNullable {
  return this.eMap
}
// getter for variable eMap
func (this *RangerAppFunctionDesc) Set_eMap( value *GoNullable)  {
  this.eMap = value 
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
  is_interface bool
  is_system_union bool
  is_template bool /**  unused  **/ 
  is_serialized bool
  is_trait bool
  generic_params *GoNullable /**  unused  **/ 
  ctx *GoNullable
  variables []IFACE_RangerAppParamDesc
  capturedLocals []IFACE_RangerAppParamDesc
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
  implements_interfaces []string
  consumes_traits []string
  is_union_of []string
  nameNode *GoNullable
  classNode *GoNullable
  contr_writers []*CodeWriter /**  unused  **/ 
  is_inherited bool
  // inherited from parent class RangerAppParamDesc
  value *GoNullable /**  unused  **/ 
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
  is_captured bool
  node *GoNullable
  description string /**  unused  **/ 
  git_doc string /**  unused  **/ 
  has_events bool
  eMap *GoNullable
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
  Get_is_system_union() bool
  Set_is_system_union(value bool) 
  Get_is_template() bool
  Set_is_template(value bool) 
  Get_is_serialized() bool
  Set_is_serialized(value bool) 
  Get_is_trait() bool
  Set_is_trait(value bool) 
  Get_generic_params() *GoNullable
  Set_generic_params(value *GoNullable) 
  Get_ctx() *GoNullable
  Set_ctx(value *GoNullable) 
  Get_variables() []IFACE_RangerAppParamDesc
  Set_variables(value []IFACE_RangerAppParamDesc) 
  Get_capturedLocals() []IFACE_RangerAppParamDesc
  Set_capturedLocals(value []IFACE_RangerAppParamDesc) 
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
  Get_consumes_traits() []string
  Set_consumes_traits(value []string) 
  Get_is_union_of() []string
  Set_is_union_of(value []string) 
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
  hasOwnMethod(m_name string) bool
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
  me.is_system_union = false
  me.is_template = false
  me.is_serialized = false
  me.is_trait = false
  me.variables = make([]IFACE_RangerAppParamDesc,0)
  me.capturedLocals = make([]IFACE_RangerAppParamDesc,0)
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
  me.consumes_traits = make([]string,0)
  me.is_union_of = make([]string,0)
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
  me.is_captured = false
  me.description = ""
  me.git_doc = ""
  me.has_events = false
  me.value = new(GoNullable);
  me.def_value = new(GoNullable);
  me.default_value = new(GoNullable);
  me.classDesc = new(GoNullable);
  me.fnDesc = new(GoNullable);
  me.isParam = new(GoNullable);
  me.node = new(GoNullable);
  me.nameNode = new(GoNullable);
  me.eMap = new(GoNullable);
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
  if  ctx.isPrimitiveType(class_name) {
    if  (r_indexof_arr_string(this.is_union_of, class_name)) >= 0 {
      return true;
    }
    return false;
  }
  if  class_name == this.name {
    return true;
  }
  if  (r_indexof_arr_string(this.extends_classes, class_name)) >= 0 {
    return true;
  }
  if  (r_indexof_arr_string(this.consumes_traits, class_name)) >= 0 {
    return true;
  }
  if  (r_indexof_arr_string(this.implements_interfaces, class_name)) >= 0 {
    return true;
  }
  if  (r_indexof_arr_string(this.is_union_of, class_name)) >= 0 {
    return true;
  }
  var i int64 = 0;  
  for ; i < int64(len(this.extends_classes)) ; i++ {
    c_name := this.extends_classes[i];
    var c *RangerAppClassDesc = ctx.findClass(c_name);
    if  c.isSameOrParentClass(class_name, ctx) {
      return true;
    }
  }
  var i_1 int64 = 0;  
  for ; i_1 < int64(len(this.consumes_traits)) ; i_1++ {
    c_name_1 := this.consumes_traits[i_1];
    var c_1 *RangerAppClassDesc = ctx.findClass(c_name_1);
    if  c_1.isSameOrParentClass(class_name, ctx) {
      return true;
    }
  }
  var i_2 int64 = 0;  
  for ; i_2 < int64(len(this.implements_interfaces)) ; i_2++ {
    i_name := this.implements_interfaces[i_2];
    var c_2 *RangerAppClassDesc = ctx.findClass(i_name);
    if  c_2.isSameOrParentClass(class_name, ctx) {
      return true;
    }
  }
  var i_3 int64 = 0;  
  for ; i_3 < int64(len(this.is_union_of)) ; i_3++ {
    i_name_1 := this.is_union_of[i_3];
    if  this.isSameOrParentClass(i_name_1, ctx) {
      return true;
    }
    if  ctx.isDefinedClass(i_name_1) {
      var c_3 *RangerAppClassDesc = ctx.findClass(i_name_1);
      if  c_3.isSameOrParentClass(class_name, ctx) {
        return true;
      }
    } else {
      fmt.Println( strings.Join([]string{ "did not find union class ",i_name_1 }, "") )
    }
  }
  return false;
}
func (this *RangerAppClassDesc) hasOwnMethod (m_name string) bool {
  if  r_has_key_string_bool(this.defined_methods, m_name) {
    return true;
  }
  return false;
}
func (this *RangerAppClassDesc) hasMethod (m_name string) bool {
  if  r_has_key_string_bool(this.defined_methods, m_name) {
    return true;
  }
  var i int64 = 0;  
  for ; i < int64(len(this.extends_classes)) ; i++ {
    cname := this.extends_classes[i];
    var cDesc *RangerAppClassDesc = this.ctx.value.(*RangerAppWriterContext).findClass(cname);
    if  cDesc.hasMethod(m_name) {
      return cDesc.hasMethod(m_name);
    }
  }
  return false;
}
func (this *RangerAppClassDesc) findMethod (f_name string) *GoNullable {
  var res *GoNullable = new(GoNullable); 
  var i int64 = 0;  
  for ; i < int64(len(this.methods)) ; i++ {
    m := this.methods[i];
    if  m.name == f_name {
      res.value = m;
      res.has_value = true; /* detected as non-optional */
      return res;
    }
  }
  var i_1 int64 = 0;  
  for ; i_1 < int64(len(this.extends_classes)) ; i_1++ {
    cname := this.extends_classes[i_1];
    var cDesc *RangerAppClassDesc = this.ctx.value.(*RangerAppWriterContext).findClass(cname);
    if  cDesc.hasMethod(f_name) {
      return cDesc.findMethod(f_name);
    }
  }
  return res;
}
func (this *RangerAppClassDesc) hasStaticMethod (m_name string) bool {
  return r_has_key_string_bool(this.defined_static_methods, m_name);
}
func (this *RangerAppClassDesc) findStaticMethod (f_name string) *GoNullable {
  var e *GoNullable = new(GoNullable); 
  var i int64 = 0;  
  for ; i < int64(len(this.static_methods)) ; i++ {
    m := this.static_methods[i];
    if  m.name == f_name {
      e.value = m;
      e.has_value = true; /* detected as non-optional */
      return e;
    }
  }
  var i_1 int64 = 0;  
  for ; i_1 < int64(len(this.extends_classes)) ; i_1++ {
    cname := this.extends_classes[i_1];
    var cDesc *RangerAppClassDesc = this.ctx.value.(*RangerAppWriterContext).findClass(cname);
    if  cDesc.hasStaticMethod(f_name) {
      return cDesc.findStaticMethod(f_name);
    }
  }
  return e;
}
func (this *RangerAppClassDesc) findVariable (f_name string) *GoNullable {
  var e *GoNullable = new(GoNullable); 
  var i int64 = 0;  
  for ; i < int64(len(this.variables)) ; i++ {
    m := this.variables[i];
    if  m.Get_name() == f_name {
      e.value = m;
      e.has_value = true; /* detected as non-optional */
      return e;
    }
  }
  var i_1 int64 = 0;  
  for ; i_1 < int64(len(this.extends_classes)) ; i_1++ {
    cname := this.extends_classes[i_1];
    var cDesc *RangerAppClassDesc = this.ctx.value.(*RangerAppWriterContext).findClass(cname);
    return cDesc.findVariable(f_name);
  }
  return e;
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
func (this *RangerAppClassDesc) addEvent (name string, e *RangerParamEventHandler) () {
  if  this.has_events == false {
    this.eMap.value = CreateNew_RangerParamEventMap();
    this.eMap.has_value = true; /* detected as non-optional */
    this.has_events = true; 
  }
  this.eMap.value.(*RangerParamEventMap).addEvent(name, e);
}
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
      if  (((((this.nameNode.value.(*CodeNode).eval_type == 13) || (this.nameNode.value.(*CodeNode).eval_type == 12)) || (this.nameNode.value.(*CodeNode).eval_type == 4)) || (this.nameNode.value.(*CodeNode).eval_type == 2)) || (this.nameNode.value.(*CodeNode).eval_type == 5)) || (this.nameNode.value.(*CodeNode).eval_type == 3) {
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
  var __len int64 = int64(len(this.ownerHistory));
  if  __len > 0 {
    var firstEntry *RangerRefForce = this.ownerHistory[0];
    return firstEntry.strength;
  }
  return 1;
}
func (this *RangerAppClassDesc) getLifetime () int64 {
  var __len int64 = int64(len(this.ownerHistory));
  if  __len > 0 {
    var lastEntry *RangerRefForce = this.ownerHistory[(__len - 1)];
    return lastEntry.lifetime;
  }
  return 1;
}
func (this *RangerAppClassDesc) getStrength () int64 {
  var __len int64 = int64(len(this.ownerHistory));
  if  __len > 0 {
    var lastEntry *RangerRefForce = this.ownerHistory[(__len - 1)];
    return lastEntry.strength;
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
      var is_object_1 bool = true;
      switch (this.nameNode.value.(*CodeNode).type_name ) { 
        case "string" : 
          is_object_1 = false; 
        case "int" : 
          is_object_1 = false; 
        case "boolean" : 
          is_object_1 = false; 
        case "double" : 
          is_object_1 = false; 
      }
      if  ctx.isEnumDefined(this.nameNode.value.(*CodeNode).type_name) {
        return false;
      }
      return is_object_1;
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
// getter for variable is_system_union
func (this *RangerAppClassDesc) Get_is_system_union() bool {
  return this.is_system_union
}
// setter for variable is_system_union
func (this *RangerAppClassDesc) Set_is_system_union( value bool)  {
  this.is_system_union = value 
}
// getter for variable is_template
func (this *RangerAppClassDesc) Get_is_template() bool {
  return this.is_template
}
// setter for variable is_template
func (this *RangerAppClassDesc) Set_is_template( value bool)  {
  this.is_template = value 
}
// getter for variable is_serialized
func (this *RangerAppClassDesc) Get_is_serialized() bool {
  return this.is_serialized
}
// setter for variable is_serialized
func (this *RangerAppClassDesc) Set_is_serialized( value bool)  {
  this.is_serialized = value 
}
// getter for variable is_trait
func (this *RangerAppClassDesc) Get_is_trait() bool {
  return this.is_trait
}
// setter for variable is_trait
func (this *RangerAppClassDesc) Set_is_trait( value bool)  {
  this.is_trait = value 
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
// getter for variable capturedLocals
func (this *RangerAppClassDesc) Get_capturedLocals() []IFACE_RangerAppParamDesc {
  return this.capturedLocals
}
// setter for variable capturedLocals
func (this *RangerAppClassDesc) Set_capturedLocals( value []IFACE_RangerAppParamDesc)  {
  this.capturedLocals = value 
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
// getter for variable consumes_traits
func (this *RangerAppClassDesc) Get_consumes_traits() []string {
  return this.consumes_traits
}
// setter for variable consumes_traits
func (this *RangerAppClassDesc) Set_consumes_traits( value []string)  {
  this.consumes_traits = value 
}
// getter for variable is_union_of
func (this *RangerAppClassDesc) Get_is_union_of() []string {
  return this.is_union_of
}
// setter for variable is_union_of
func (this *RangerAppClassDesc) Set_is_union_of( value []string)  {
  this.is_union_of = value 
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
// getter for variable value
func (this *RangerAppClassDesc) Get_value() *GoNullable {
  return this.value
}
// getter for variable value
func (this *RangerAppClassDesc) Set_value( value *GoNullable)  {
  this.value = value 
}
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
// getter for variable is_captured
func (this *RangerAppClassDesc) Get_is_captured() bool {
  return this.is_captured
}
// getter for variable is_captured
func (this *RangerAppClassDesc) Set_is_captured( value bool)  {
  this.is_captured = value 
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
// getter for variable has_events
func (this *RangerAppClassDesc) Get_has_events() bool {
  return this.has_events
}
// getter for variable has_events
func (this *RangerAppClassDesc) Set_has_events( value bool)  {
  this.has_events = value 
}
// getter for variable eMap
func (this *RangerAppClassDesc) Get_eMap() *GoNullable {
  return this.eMap
}
// getter for variable eMap
func (this *RangerAppClassDesc) Set_eMap( value *GoNullable)  {
  this.eMap = value 
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
type SourceCode struct { 
  code string
  lines []string
  filename string
}
type IFACE_SourceCode interface { 
  Get_code() string
  Set_code(value string) 
  Get_lines() []string
  Set_lines(value []string) 
  Get_filename() string
  Set_filename(value string) 
  getLineString(line_index int64) string
  getLine(sp int64) int64
  getColumnStr(sp int64) string
  getColumn(sp int64) int64
}

func CreateNew_SourceCode(code_str string) *SourceCode {
  me := new(SourceCode)
  me.code = ""
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
  var i int64 = 0;  
  for ; i < int64(len(this.lines)) ; i++ {
    str := this.lines[i];
    cnt = cnt + ((int64(len(str))) + 1); 
    if  cnt > sp {
      return i;
    }
  }
  return -1;
}
func (this *SourceCode) getColumnStr (sp int64) string {
  var cnt int64 = 0;
  var last int64 = 0;
  var i int64 = 0;  
  for ; i < int64(len(this.lines)) ; i++ {
    str := this.lines[i];
    cnt = cnt + ((int64(len(str))) + 1); 
    if  cnt > sp {
      var ll int64 = sp - last;
      var ss string = "";
      for ll > 0 {
        ss = strings.Join([]string{ ss," " }, ""); 
        ll = ll - 1; 
      }
      return ss;
    }
    last = cnt; 
  }
  return "";
}
func (this *SourceCode) getColumn (sp int64) int64 {
  var cnt int64 = 0;
  var last int64 = 0;
  var i int64 = 0;  
  for ; i < int64(len(this.lines)) ; i++ {
    str := this.lines[i];
    cnt = cnt + ((int64(len(str))) + 1); 
    if  cnt > sp {
      return sp - last;
    }
    last = cnt; 
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
  disabled_node bool
  op_index int64
  is_system_class bool
  mutable_def bool
  expression bool
  vref string
  is_block_node bool
  infix_operator bool
  infix_node *GoNullable
  infix_subnode bool
  has_lambda bool
  has_lambda_call bool
  operator_pred int64
  to_the_right bool
  right_node *GoNullable
  type_type string
  type_name string
  key_type string
  array_type string
  ns []string
  has_vref_annotation bool
  vref_annotation *GoNullable
  has_type_annotation bool
  type_annotation *GoNullable
  parsed_type int64
  value_type int64
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
  typeClass *GoNullable
  lambda_ctx *GoNullable
  nsp []IFACE_RangerAppParamDesc
  eval_type int64
  eval_type_name string
  eval_key_type string
  eval_array_type string
  eval_function *GoNullable
  flow_done bool
  ref_change_done bool
  eval_type_node *GoNullable /**  unused  **/ 
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
  evalState *GoNullable /**  unused  **/ 
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
  Get_disabled_node() bool
  Set_disabled_node(value bool) 
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
  Get_has_lambda() bool
  Set_has_lambda(value bool) 
  Get_has_lambda_call() bool
  Set_has_lambda_call(value bool) 
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
  Get_has_vref_annotation() bool
  Set_has_vref_annotation(value bool) 
  Get_vref_annotation() *GoNullable
  Set_vref_annotation(value *GoNullable) 
  Get_has_type_annotation() bool
  Set_has_type_annotation(value bool) 
  Get_type_annotation() *GoNullable
  Set_type_annotation(value *GoNullable) 
  Get_parsed_type() int64
  Set_parsed_type(value int64) 
  Get_value_type() int64
  Set_value_type(value int64) 
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
  Get_typeClass() *GoNullable
  Set_typeClass(value *GoNullable) 
  Get_lambda_ctx() *GoNullable
  Set_lambda_ctx(value *GoNullable) 
  Get_nsp() []IFACE_RangerAppParamDesc
  Set_nsp(value []IFACE_RangerAppParamDesc) 
  Get_eval_type() int64
  Set_eval_type(value int64) 
  Get_eval_type_name() string
  Set_eval_type_name(value string) 
  Get_eval_key_type() string
  Set_eval_key_type(value string) 
  Get_eval_array_type() string
  Set_eval_array_type(value string) 
  Get_eval_function() *GoNullable
  Set_eval_function(value *GoNullable) 
  Get_flow_done() bool
  Set_flow_done(value bool) 
  Get_ref_change_done() bool
  Set_ref_change_done(value bool) 
  Get_eval_type_node() *GoNullable
  Set_eval_type_node(value *GoNullable) 
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
  Get_evalState() *GoNullable
  Set_evalState(value *GoNullable) 
  getParsedString() string
  getFilename() string
  getFlag(flagName string) *GoNullable
  hasFlag(flagName string) bool
  setFlag(flagName string) ()
  getTypeInformationString() string
  getLine() int64
  getLineString(line_index int64) string
  getColStartString() string
  getLineAsString() string
  getPositionalString() string
  isParsedAsPrimitive() bool
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
  walk() ()
  writeCode(wr *CodeWriter) ()
  getCode() string
  rebuildWithType(match *RangerArgMatch, changeVref bool) *CodeNode
  buildTypeSignatureUsingMatch(match *RangerArgMatch) string
  buildTypeSignature() string
  getVRefSignatureWithMatch(match *RangerArgMatch) string
  getVRefSignature() string
  getTypeSignatureWithMatch(match *RangerArgMatch) string
  getTypeSignature() string
  typeNameAsType(ctx *RangerAppWriterContext) int64
  copyEvalResFrom(node *CodeNode) ()
  defineNodeTypeTo(node *CodeNode, ctx *RangerAppWriterContext) ()
  ifNoTypeSetToVoid() ()
  ifNoTypeSetToEvalTypeOf(node *CodeNode) bool
}

func CreateNew_CodeNode(source *SourceCode, start int64, end int64) *CodeNode {
  me := new(CodeNode)
  me.sp = 0
  me.ep = 0
  me.has_operator = false
  me.disabled_node = false
  me.op_index = 0
  me.is_system_class = false
  me.mutable_def = false
  me.expression = false
  me.vref = ""
  me.is_block_node = false
  me.infix_operator = false
  me.infix_subnode = false
  me.has_lambda = false
  me.has_lambda_call = false
  me.operator_pred = 0
  me.to_the_right = false
  me.type_type = ""
  me.type_name = ""
  me.key_type = ""
  me.array_type = ""
  me.ns = make([]string,0)
  me.has_vref_annotation = false
  me.has_type_annotation = false
  me.parsed_type = 0
  me.value_type = 0
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
  me.nsp = make([]IFACE_RangerAppParamDesc,0)
  me.eval_type = 0
  me.eval_type_name = ""
  me.eval_key_type = ""
  me.eval_array_type = ""
  me.flow_done = false
  me.ref_change_done = false
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
  me.expression_value = new(GoNullable);
  me.parent = new(GoNullable);
  me.typeClass = new(GoNullable);
  me.lambda_ctx = new(GoNullable);
  me.eval_function = new(GoNullable);
  me.eval_type_node = new(GoNullable);
  me.clDesc = new(GoNullable);
  me.fnDesc = new(GoNullable);
  me.paramDesc = new(GoNullable);
  me.ownParamDesc = new(GoNullable);
  me.evalCtx = new(GoNullable);
  me.evalState = new(GoNullable);
  me.sp = start; 
  me.ep = end; 
  me.code.value = source;
  me.code.has_value = true; /* detected as non-optional */
  return me;
}
func (this *CodeNode) getParsedString () string {
  return this.code.value.(*SourceCode).code[this.sp:this.ep];
}
func (this *CodeNode) getFilename () string {
  return this.code.value.(*SourceCode).filename;
}
func (this *CodeNode) getFlag (flagName string) *GoNullable {
  var res *GoNullable = new(GoNullable); 
  if  false == this.has_vref_annotation {
    return res;
  }
  var i int64 = 0;  
  for ; i < int64(len(this.vref_annotation.value.(*CodeNode).children)) ; i++ {
    ch := this.vref_annotation.value.(*CodeNode).children[i];
    if  ch.vref == flagName {
      res.value = ch;
      res.has_value = true; /* detected as non-optional */
      return res;
    }
  }
  return res;
}
func (this *CodeNode) hasFlag (flagName string) bool {
  if  false == this.has_vref_annotation {
    return false;
  }
  var i int64 = 0;  
  for ; i < int64(len(this.vref_annotation.value.(*CodeNode).children)) ; i++ {
    ch := this.vref_annotation.value.(*CodeNode).children[i];
    if  ch.vref == flagName {
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
  var s string = "";
  if  (int64(len(this.vref))) > 0 {
    s = strings.Join([]string{ (strings.Join([]string{ (strings.Join([]string{ s,"<vref:" }, "")),this.vref }, "")),">" }, ""); 
  } else {
    s = strings.Join([]string{ s,"<no.vref>" }, ""); 
  }
  if  (int64(len(this.type_name))) > 0 {
    s = strings.Join([]string{ (strings.Join([]string{ (strings.Join([]string{ s,"<type_name:" }, "")),this.type_name }, "")),">" }, ""); 
  } else {
    s = strings.Join([]string{ s,"<no.type_name>" }, ""); 
  }
  if  (int64(len(this.array_type))) > 0 {
    s = strings.Join([]string{ (strings.Join([]string{ (strings.Join([]string{ s,"<array_type:" }, "")),this.array_type }, "")),">" }, ""); 
  } else {
    s = strings.Join([]string{ s,"<no.array_type>" }, ""); 
  }
  if  (int64(len(this.key_type))) > 0 {
    s = strings.Join([]string{ (strings.Join([]string{ (strings.Join([]string{ s,"<key_type:" }, "")),this.key_type }, "")),">" }, ""); 
  } else {
    s = strings.Join([]string{ s,"<no.key_type>" }, ""); 
  }
  switch (this.value_type ) { 
    case 5 : 
      s = strings.Join([]string{ s,"<value_type=Boolean>" }, ""); 
    case 4 : 
      s = strings.Join([]string{ s,"<value_type=String>" }, ""); 
  }
  return s;
}
func (this *CodeNode) getLine () int64 {
  return this.code.value.(*SourceCode).getLine(this.sp);
}
func (this *CodeNode) getLineString (line_index int64) string {
  return this.code.value.(*SourceCode).getLineString(line_index);
}
func (this *CodeNode) getColStartString () string {
  return this.code.value.(*SourceCode).getColumnStr(this.sp);
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
func (this *CodeNode) isParsedAsPrimitive () bool {
  if  (((((this.parsed_type == 2) || (this.parsed_type == 4)) || (this.parsed_type == 3)) || (this.parsed_type == 12)) || (this.parsed_type == 13)) || (this.parsed_type == 5) {
    return true;
  }
  return false;
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
  var tn string = this.type_name;
  if  (this.value_type == 6) || (this.value_type == 7) {
    tn = this.array_type; 
  }
  if  (((((tn == "double") || (tn == "string")) || (tn == "int")) || (tn == "char")) || (tn == "charbuffer")) || (tn == "boolean") {
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
  var s string = "";
  if  (int64(len(this.children))) > 0 {
    var fc *CodeNode = this.children[0];
    if  fc.value_type == 9 {
      return fc.vref;
    }
  }
  return s;
}
func (this *CodeNode) getVRefAt (idx int64) string {
  var s string = "";
  if  (int64(len(this.children))) > idx {
    var fc *CodeNode = this.children[idx];
    return fc.vref;
  }
  return s;
}
func (this *CodeNode) getStringAt (idx int64) string {
  var s string = "";
  if  (int64(len(this.children))) > idx {
    var fc *CodeNode = this.children[idx];
    if  fc.value_type == 4 {
      return fc.string_value;
    }
  }
  return s;
}
func (this *CodeNode) hasExpressionProperty (name string) bool {
  var ann *GoNullable = new(GoNullable); 
  ann = r_get_string_CodeNode(this.props, name);
  if  ann.has_value {
    return ann.value.(*CodeNode).expression;
  }
  return false;
}
func (this *CodeNode) getExpressionProperty (name string) *GoNullable {
  var ann *GoNullable = new(GoNullable); 
  ann = r_get_string_CodeNode(this.props, name);
  if  ann.has_value {
    return ann;
  }
  return ann;
}
func (this *CodeNode) hasIntProperty (name string) bool {
  var ann *GoNullable = new(GoNullable); 
  ann = r_get_string_CodeNode(this.props, name);
  if  ann.has_value {
    var fc *CodeNode = ann.value.(*CodeNode).children[0];
    if  fc.value_type == 3 {
      return true;
    }
  }
  return false;
}
func (this *CodeNode) getIntProperty (name string) int64 {
  var ann *GoNullable = new(GoNullable); 
  ann = r_get_string_CodeNode(this.props, name);
  if  ann.has_value {
    var fc *CodeNode = ann.value.(*CodeNode).children[0];
    if  fc.value_type == 3 {
      return fc.int_value;
    }
  }
  return 0;
}
func (this *CodeNode) hasDoubleProperty (name string) bool {
  var ann *GoNullable = new(GoNullable); 
  ann = r_get_string_CodeNode(this.props, name);
  if  ann.has_value {
    if  ann.value.(*CodeNode).value_type == 2 {
      return true;
    }
  }
  return false;
}
func (this *CodeNode) getDoubleProperty (name string) float64 {
  var ann *GoNullable = new(GoNullable); 
  ann = r_get_string_CodeNode(this.props, name);
  if  ann.has_value {
    if  ann.value.(*CodeNode).value_type == 2 {
      return ann.value.(*CodeNode).double_value;
    }
  }
  return 0.0;
}
func (this *CodeNode) hasStringProperty (name string) bool {
  if  false == (r_has_key_string_CodeNode(this.props, name)) {
    return false;
  }
  var ann *GoNullable = new(GoNullable); 
  ann = r_get_string_CodeNode(this.props, name);
  if  ann.has_value {
    if  ann.value.(*CodeNode).value_type == 4 {
      return true;
    }
  }
  return false;
}
func (this *CodeNode) getStringProperty (name string) string {
  var ann *GoNullable = new(GoNullable); 
  ann = r_get_string_CodeNode(this.props, name);
  if  ann.has_value {
    if  ann.value.(*CodeNode).value_type == 4 {
      return ann.value.(*CodeNode).string_value;
    }
  }
  return "";
}
func (this *CodeNode) hasBooleanProperty (name string) bool {
  var ann *GoNullable = new(GoNullable); 
  ann = r_get_string_CodeNode(this.props, name);
  if  ann.has_value {
    if  ann.value.(*CodeNode).value_type == 5 {
      return true;
    }
  }
  return false;
}
func (this *CodeNode) getBooleanProperty (name string) bool {
  var ann *GoNullable = new(GoNullable); 
  ann = r_get_string_CodeNode(this.props, name);
  if  ann.has_value {
    if  ann.value.(*CodeNode).value_type == 5 {
      return ann.value.(*CodeNode).boolean_value;
    }
  }
  return false;
}
func (this *CodeNode) isFirstTypeVref (vrefName string) bool {
  if  (int64(len(this.children))) > 0 {
    var fc *CodeNode = this.children[0];
    if  fc.value_type == 9 {
      return true;
    }
  }
  return false;
}
func (this *CodeNode) isFirstVref (vrefName string) bool {
  if  (int64(len(this.children))) > 0 {
    var fc *CodeNode = this.children[0];
    if  fc.vref == vrefName {
      return true;
    }
  }
  return false;
}
func (this *CodeNode) getString () string {
  return this.code.value.(*SourceCode).code[this.sp:this.ep];
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
  var i int64 = 0;  
  for ; i < int64(len(this.children)) ; i++ {
    item := this.children[i];
    item.walk();
  }
  if  this.expression {
    fmt.Println( ")" )
  }
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
    case 9 : 
      wr.out(this.vref, false);
    case 7 : 
      wr.out(this.vref, false);
      wr.out(strings.Join([]string{ (strings.Join([]string{ (strings.Join([]string{ (strings.Join([]string{ ":[",this.key_type }, "")),":" }, "")),this.array_type }, "")),"]" }, ""), false);
    case 6 : 
      wr.out(this.vref, false);
      wr.out(strings.Join([]string{ (strings.Join([]string{ ":[",this.array_type }, "")),"]" }, ""), false);
  }
  if  this.expression {
    wr.out("(", false);
    var i int64 = 0;  
    for ; i < int64(len(this.children)) ; i++ {
      ch := this.children[i];
      ch.writeCode(wr);
    }
    wr.out(")", false);
  }
}
func (this *CodeNode) getCode () string {
  var wr *CodeWriter = CreateNew_CodeWriter();
  this.writeCode(wr);
  return wr.getCode();
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
  var i int64 = 0;  
  for ; i < int64(len(this.ns)) ; i++ {
    n := this.ns[i];
    if  changeVref {
      var new_ns string = match.getTypeName(n);
      newNode.ns = append(newNode.ns,new_ns); 
    } else {
      newNode.vref = this.vref; 
      newNode.ns = append(newNode.ns,n); 
    }
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
  var i_1 int64 = 0;  
  for ; i_1 < int64(len(this.prop_keys)) ; i_1++ {
    key := this.prop_keys[i_1];
    newNode.prop_keys = append(newNode.prop_keys,key); 
    var oldp *GoNullable = new(GoNullable); 
    oldp = r_get_string_CodeNode(this.props, key);
    var np *CodeNode = oldp.value.(*CodeNode).rebuildWithType(match, changeVref);
    newNode.props[key] = np
  }
  var i_2 int64 = 0;  
  for ; i_2 < int64(len(this.children)) ; i_2++ {
    ch := this.children[i_2];
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
  var s string = "";
  if  this.value_type == 6 {
    s = strings.Join([]string{ s,"[" }, ""); 
    s = strings.Join([]string{ s,match.getTypeName(this.array_type) }, ""); 
    s = strings.Join([]string{ s,this.getTypeSignatureWithMatch(match) }, ""); 
    s = strings.Join([]string{ s,"]" }, ""); 
    return s;
  }
  if  this.value_type == 7 {
    s = strings.Join([]string{ s,"[" }, ""); 
    s = strings.Join([]string{ s,match.getTypeName(this.key_type) }, ""); 
    s = strings.Join([]string{ s,":" }, ""); 
    s = strings.Join([]string{ s,match.getTypeName(this.array_type) }, ""); 
    s = strings.Join([]string{ s,this.getTypeSignatureWithMatch(match) }, ""); 
    s = strings.Join([]string{ s,"]" }, ""); 
    return s;
  }
  s = match.getTypeName(this.type_name); 
  s = strings.Join([]string{ s,this.getVRefSignatureWithMatch(match) }, ""); 
  return s;
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
  var s string = "";
  if  this.value_type == 6 {
    s = strings.Join([]string{ s,"[" }, ""); 
    s = strings.Join([]string{ s,this.array_type }, ""); 
    s = strings.Join([]string{ s,this.getTypeSignature() }, ""); 
    s = strings.Join([]string{ s,"]" }, ""); 
    return s;
  }
  if  this.value_type == 7 {
    s = strings.Join([]string{ s,"[" }, ""); 
    s = strings.Join([]string{ s,this.key_type }, ""); 
    s = strings.Join([]string{ s,":" }, ""); 
    s = strings.Join([]string{ s,this.array_type }, ""); 
    s = strings.Join([]string{ s,this.getTypeSignature() }, ""); 
    s = strings.Join([]string{ s,"]" }, ""); 
    return s;
  }
  s = this.type_name; 
  return s;
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
    var nn *CodeNode = this.type_annotation.value.(*CodeNode).rebuildWithType(match, true);
    return strings.Join([]string{ "@",nn.getCode() }, "");
  }
  return "";
}
func (this *CodeNode) getTypeSignature () string {
  if  this.has_type_annotation {
    return strings.Join([]string{ "@",this.type_annotation.value.(*CodeNode).getCode() }, "");
  }
  return "";
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
func (this *CodeNode) copyEvalResFrom (node *CodeNode) () {
  if  node.hasParamDesc {
    this.hasParamDesc = node.hasParamDesc; 
    this.paramDesc.value = node.paramDesc.value;
    this.paramDesc.has_value = false; 
    if this.paramDesc.value != nil {
      this.paramDesc.has_value = true
    }
  }
  if  node.typeClass.has_value {
    this.typeClass.value = node.typeClass.value;
    this.typeClass.has_value = false; 
    if this.typeClass.value != nil {
      this.typeClass.has_value = true
    }
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
  if  node.value_type == 15 {
    this.eval_type = 15; 
    this.eval_function.value = node.eval_function.value;
    this.eval_function.has_value = false; 
    if this.eval_function.value != nil {
      this.eval_function.has_value = true
    }
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
func (this *CodeNode) ifNoTypeSetToVoid () () {
  if  (((int64(len(this.type_name))) == 0) && ((int64(len(this.key_type))) == 0)) && ((int64(len(this.array_type))) == 0) {
    this.type_name = "void"; 
  }
}
func (this *CodeNode) ifNoTypeSetToEvalTypeOf (node *CodeNode) bool {
  if  (((int64(len(this.type_name))) == 0) && ((int64(len(this.key_type))) == 0)) && ((int64(len(this.array_type))) == 0) {
    this.type_name = node.eval_type_name; 
    this.array_type = node.eval_array_type; 
    this.key_type = node.eval_key_type; 
    this.value_type = node.eval_type; 
    this.eval_type = node.eval_type; 
    this.eval_type_name = node.eval_type_name; 
    this.eval_array_type = node.eval_array_type; 
    this.eval_key_type = node.eval_key_type; 
    if  node.value_type == 15 {
      if  !this.expression_value.has_value  {
        var copyOf *CodeNode = node.rebuildWithType(CreateNew_RangerArgMatch(), false);
        copyOf.children = copyOf.children[:len(copyOf.children)-1]; 
        this.expression_value.value = copyOf;
        this.expression_value.has_value = true; /* detected as non-optional */
      }
    }
    return true;
  }
  return false;
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
// getter for variable disabled_node
func (this *CodeNode) Get_disabled_node() bool {
  return this.disabled_node
}
// setter for variable disabled_node
func (this *CodeNode) Set_disabled_node( value bool)  {
  this.disabled_node = value 
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
// getter for variable has_lambda
func (this *CodeNode) Get_has_lambda() bool {
  return this.has_lambda
}
// setter for variable has_lambda
func (this *CodeNode) Set_has_lambda( value bool)  {
  this.has_lambda = value 
}
// getter for variable has_lambda_call
func (this *CodeNode) Get_has_lambda_call() bool {
  return this.has_lambda_call
}
// setter for variable has_lambda_call
func (this *CodeNode) Set_has_lambda_call( value bool)  {
  this.has_lambda_call = value 
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
// getter for variable parsed_type
func (this *CodeNode) Get_parsed_type() int64 {
  return this.parsed_type
}
// setter for variable parsed_type
func (this *CodeNode) Set_parsed_type( value int64)  {
  this.parsed_type = value 
}
// getter for variable value_type
func (this *CodeNode) Get_value_type() int64 {
  return this.value_type
}
// setter for variable value_type
func (this *CodeNode) Set_value_type( value int64)  {
  this.value_type = value 
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
// getter for variable typeClass
func (this *CodeNode) Get_typeClass() *GoNullable {
  return this.typeClass
}
// setter for variable typeClass
func (this *CodeNode) Set_typeClass( value *GoNullable)  {
  this.typeClass = value 
}
// getter for variable lambda_ctx
func (this *CodeNode) Get_lambda_ctx() *GoNullable {
  return this.lambda_ctx
}
// setter for variable lambda_ctx
func (this *CodeNode) Set_lambda_ctx( value *GoNullable)  {
  this.lambda_ctx = value 
}
// getter for variable nsp
func (this *CodeNode) Get_nsp() []IFACE_RangerAppParamDesc {
  return this.nsp
}
// setter for variable nsp
func (this *CodeNode) Set_nsp( value []IFACE_RangerAppParamDesc)  {
  this.nsp = value 
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
// getter for variable eval_function
func (this *CodeNode) Get_eval_function() *GoNullable {
  return this.eval_function
}
// setter for variable eval_function
func (this *CodeNode) Set_eval_function( value *GoNullable)  {
  this.eval_function = value 
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
// getter for variable evalState
func (this *CodeNode) Get_evalState() *GoNullable {
  return this.evalState
}
// setter for variable evalState
func (this *CodeNode) Set_evalState( value *GoNullable)  {
  this.evalState = value 
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
  reservedWords *GoNullable
  intRootCounter int64 /**  unused  **/ 
  targetLangName string
  parent *GoNullable
  defined_imports []string /**  unused  **/ 
  already_imported map[string]bool
  fileSystem *GoNullable
  is_function bool
  class_level_context bool
  function_level_context bool
  in_main bool
  is_block bool /**  unused  **/ 
  is_capturing bool
  captured_variables []string
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
  refTransform map[string]string
  rootFile string
}
type IFACE_RangerAppWriterContext interface { 
  Get_langOperators() *GoNullable
  Set_langOperators(value *GoNullable) 
  Get_stdCommands() *GoNullable
  Set_stdCommands(value *GoNullable) 
  Get_reservedWords() *GoNullable
  Set_reservedWords(value *GoNullable) 
  Get_intRootCounter() int64
  Set_intRootCounter(value int64) 
  Get_targetLangName() string
  Set_targetLangName(value string) 
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
  Get_class_level_context() bool
  Set_class_level_context(value bool) 
  Get_function_level_context() bool
  Set_function_level_context(value bool) 
  Get_in_main() bool
  Set_in_main(value bool) 
  Get_is_block() bool
  Set_is_block(value bool) 
  Get_is_capturing() bool
  Set_is_capturing(value bool) 
  Get_captured_variables() []string
  Set_captured_variables(value []string) 
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
  Get_refTransform() map[string]string
  Set_refTransform(value map[string]string) 
  Get_rootFile() string
  Set_rootFile(value string) 
  isCapturing() bool
  isLocalToCapture(name string) bool
  addCapturedVariable(name string) ()
  getCapturedVariables() []string
  transformWord(input_word string) string
  initReservedWords() bool
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
  getFnVarCnt3(name string) int64
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
  isInMain() bool
  isInMethod() bool
  setInMethod() ()
  unsetInMethod() ()
  findMethodLevelContext() *GoNullable
  findClassLevelContext() *GoNullable
  fork() *RangerAppWriterContext
  getRootFile() string
  setRootFile(file_name string) ()
}

func CreateNew_RangerAppWriterContext() *RangerAppWriterContext {
  me := new(RangerAppWriterContext)
  me.intRootCounter = 1
  me.targetLangName = ""
  me.defined_imports = make([]string,0)
  me.already_imported = make(map[string]bool)
  me.is_function = false
  me.class_level_context = false
  me.function_level_context = false
  me.in_main = false
  me.is_block = false
  me.is_capturing = false
  me.captured_variables = make([]string,0)
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
  me.refTransform = make(map[string]string)
  me.rootFile = "--not-defined--"
  me.langOperators = new(GoNullable);
  me.stdCommands = new(GoNullable);
  me.reservedWords = new(GoNullable);
  me.parent = new(GoNullable);
  me.fileSystem = new(GoNullable);
  me.currentClassName = new(GoNullable);
  me.currentClass = new(GoNullable);
  me.currentMethod = new(GoNullable);
  return me;
}
func (this *RangerAppWriterContext) isCapturing () bool {
  if  this.is_capturing {
    return true;
  }
  if ( this.parent.has_value) {
    return this.parent.value.(*RangerAppWriterContext).isCapturing();
  }
  return false;
}
func (this *RangerAppWriterContext) isLocalToCapture (name string) bool {
  if  r_has_key_string_IFACE_RangerAppParamDesc(this.localVariables, name) {
    return true;
  }
  if  this.is_capturing {
    return false;
  }
  if ( this.parent.has_value) {
    return this.parent.value.(*RangerAppWriterContext).isLocalToCapture(name);
  }
  return false;
}
func (this *RangerAppWriterContext) addCapturedVariable (name string) () {
  if  this.is_capturing {
    if  (r_indexof_arr_string(this.captured_variables, name)) < 0 {
      this.captured_variables = append(this.captured_variables,name); 
    }
    return;
  }
  if ( this.parent.has_value) {
    this.parent.value.(*RangerAppWriterContext).addCapturedVariable(name);
  }
}
func (this *RangerAppWriterContext) getCapturedVariables () []string {
  if  this.is_capturing {
    return this.captured_variables;
  }
  if ( this.parent.has_value) {
    var r []string = this.parent.value.(*RangerAppWriterContext).getCapturedVariables();
    return r;
  }
  var res []string = make([]string, 0);
  return res;
}
func (this *RangerAppWriterContext) transformWord (input_word string) string {
  var root *RangerAppWriterContext = this.getRoot();
  root.initReservedWords();
  if  r_has_key_string_string(this.refTransform, input_word) {
    return (r_get_string_string(this.refTransform, input_word)).value.(string);
  }
  return input_word;
}
func (this *RangerAppWriterContext) initReservedWords () bool {
  if  this.reservedWords.has_value {
    return true;
  }
  var main *GoNullable = new(GoNullable); 
  main.value = this.langOperators.value;
  main.has_value = this.langOperators.has_value;
  var lang *GoNullable = new(GoNullable); 
  var i int64 = 0;  
  for ; i < int64(len(main.value.(*CodeNode).children)) ; i++ {
    m := main.value.(*CodeNode).children[i];
    var fc *CodeNode = m.getFirst();
    if  fc.vref == "language" {
      lang.value = m;
      lang.has_value = true; /* detected as non-optional */
    }
  }
  /** unused:  cmds*/
  var langNodes *CodeNode = lang.value.(*CodeNode).children[1];
  var i_1 int64 = 0;  
  for ; i_1 < int64(len(langNodes.children)) ; i_1++ {
    lch := langNodes.children[i_1];
    var fc_1 *CodeNode = lch.getFirst();
    if  fc_1.vref == "reserved_words" {
      /** unused:  n*/
      this.reservedWords.value = lch.getSecond();
      this.reservedWords.has_value = true; /* detected as non-optional */
      var i_2 int64 = 0;  
      for ; i_2 < int64(len(this.reservedWords.value.(*CodeNode).children)) ; i_2++ {
        ch := this.reservedWords.value.(*CodeNode).children[i_2];
        var word *CodeNode = ch.getFirst();
        var transform *CodeNode = ch.getSecond();
        this.refTransform[word.vref] = transform.vref
      }
    }
  }
  return true;
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
  var i int64 = 0;  
  for ; i < int64(len(main.value.(*CodeNode).children)) ; i++ {
    m := main.value.(*CodeNode).children[i];
    var fc *CodeNode = m.getFirst();
    if  fc.vref == "language" {
      lang.value = m;
      lang.has_value = true; /* detected as non-optional */
    }
  }
  /** unused:  cmds*/
  var langNodes *CodeNode = lang.value.(*CodeNode).children[1];
  var i_1 int64 = 0;  
  for ; i_1 < int64(len(langNodes.children)) ; i_1++ {
    lch := langNodes.children[i_1];
    var fc_1 *CodeNode = lch.getFirst();
    if  fc_1.vref == "commands" {
      /** unused:  n*/
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
  if  node.value_type == 6 {
    if  this.isDefinedType(node.array_type) {
      return true;
    } else {
      this.addError(node, strings.Join([]string{ "Unknown type for array values: ",node.array_type }, ""));
      return false;
    }
  }
  if  node.value_type == 7 {
    if  this.isDefinedType(node.array_type) && this.isPrimitiveType(node.key_type) {
      return true;
    } else {
      if  this.isDefinedType(node.array_type) == false {
        this.addError(node, strings.Join([]string{ "Unknown type for map values: ",node.array_type }, ""));
      }
      if  this.isDefinedType(node.array_type) == false {
        this.addError(node, strings.Join([]string{ "Unknown type for map keys: ",node.key_type }, ""));
      }
      return false;
    }
  }
  if  this.isDefinedType(node.type_name) {
    return true;
  } else {
    if  node.value_type == 15 {
    } else {
      this.addError(node, strings.Join([]string{ (strings.Join([]string{ (strings.Join([]string{ "Unknown type: ",node.type_name }, ""))," type ID : " }, "")),strconv.FormatInt(node.value_type, 10) }, ""));
    }
  }
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
  var root *RangerAppWriterContext = this.getRoot();
  root.initStdCommands();
  return root.stdCommands.value.(*CodeNode);
}
func (this *RangerAppWriterContext) findClassWithSign (node *CodeNode) *RangerAppClassDesc {
  var root *RangerAppWriterContext = this.getRoot();
  var tplArgs *GoNullable = new(GoNullable); 
  tplArgs.value = node.vref_annotation.value;
  tplArgs.has_value = node.vref_annotation.has_value;
  var sign string = strings.Join([]string{ node.vref,tplArgs.value.(*CodeNode).getCode() }, "");
  var theName *GoNullable = new(GoNullable); 
  theName = r_get_string_string(root.classSignatures, sign);
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
  var root *RangerAppWriterContext = this.getRoot();
  if  root.initStdCommands() {
    root.stdCommands.value.(*CodeNode).children = append(root.stdCommands.value.(*CodeNode).children,fromNode); 
    /** unused:  fc*/
  }
}
func (this *RangerAppWriterContext) getFileWriter (path string, fileName string) *CodeWriter {
  var root *RangerAppWriterContext = this.getRoot();
  var fs *GoNullable = new(GoNullable); 
  fs.value = root.fileSystem.value;
  fs.has_value = root.fileSystem.has_value;
  var file *CodeFile = fs.value.(*CodeFileSystem).getFile(path, fileName);
  var wr *GoNullable = new(GoNullable); 
  wr.value = file.getWriter().value;
  wr.has_value = false; 
  if wr.value != nil {
    wr.has_value = true
  }
  return wr.value.(*CodeWriter);
}
func (this *RangerAppWriterContext) addTodo (node *CodeNode, descr string) () {
  var e *RangerAppTodo = CreateNew_RangerAppTodo();
  e.description = descr; 
  e.todonode.value = node;
  e.todonode.has_value = true; /* detected as non-optional */
  var root *RangerAppWriterContext = this.getRoot();
  root.todoList = append(root.todoList,e); 
}
func (this *RangerAppWriterContext) setThisName (the_name string) () {
  var root *RangerAppWriterContext = this.getRoot();
  root.thisName = the_name; 
}
func (this *RangerAppWriterContext) getThisName () string {
  var root *RangerAppWriterContext = this.getRoot();
  return root.thisName;
}
func (this *RangerAppWriterContext) printLogs (logName string) () {
}
func (this *RangerAppWriterContext) log (node *CodeNode, logName string, descr string) () {
}
func (this *RangerAppWriterContext) addMessage (node *CodeNode, descr string) () {
  var e *RangerCompilerMessage = CreateNew_RangerCompilerMessage();
  e.description = descr; 
  e.node.value = node;
  e.node.has_value = true; /* detected as non-optional */
  var root *RangerAppWriterContext = this.getRoot();
  root.compilerMessages = append(root.compilerMessages,e); 
}
func (this *RangerAppWriterContext) addError (targetnode *CodeNode, descr string) () {
  var e *RangerCompilerMessage = CreateNew_RangerCompilerMessage();
  e.description = descr; 
  e.node.value = targetnode;
  e.node.has_value = true; /* detected as non-optional */
  var root *RangerAppWriterContext = this.getRoot();
  root.compilerErrors = append(root.compilerErrors,e); 
}
func (this *RangerAppWriterContext) addParserError (targetnode *CodeNode, descr string) () {
  var e *RangerCompilerMessage = CreateNew_RangerCompilerMessage();
  e.description = descr; 
  e.node.value = targetnode;
  e.node.has_value = true; /* detected as non-optional */
  var root *RangerAppWriterContext = this.getRoot();
  root.parserErrors = append(root.parserErrors,e); 
}
func (this *RangerAppWriterContext) addTemplateClass (name string, node *CodeNode) () {
  var root *RangerAppWriterContext = this.getRoot();
  root.templateClassList = append(root.templateClassList,name); 
  root.templateClassNodes[name] = node
}
func (this *RangerAppWriterContext) hasTemplateNode (name string) bool {
  var root *RangerAppWriterContext = this.getRoot();
  return r_has_key_string_CodeNode(root.templateClassNodes, name);
}
func (this *RangerAppWriterContext) findTemplateNode (name string) *CodeNode {
  var root *RangerAppWriterContext = this.getRoot();
  return (r_get_string_CodeNode(root.templateClassNodes, name)).value.(*CodeNode);
}
func (this *RangerAppWriterContext) setStaticWriter (className string, writer *CodeWriter) () {
  var root *RangerAppWriterContext = this.getRoot();
  root.classStaticWriters[className] = writer
}
func (this *RangerAppWriterContext) getStaticWriter (className string) *CodeWriter {
  var root *RangerAppWriterContext = this.getRoot();
  return (r_get_string_CodeWriter(root.classStaticWriters, className)).value.(*CodeWriter);
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
  var ii int64 = 0;
  if  r_has_key_string_int64(fnCtx.defCounts, name) {
    ii = (r_get_string_int64(fnCtx.defCounts, name)).value.(int64); 
    ii = 1 + ii; 
  } else {
    fnCtx.defCounts[name] = ii
    return 0;
  }
  var scope_has bool = this.isVarDefined((strings.Join([]string{ (strings.Join([]string{ name,"_" }, "")),strconv.FormatInt(ii, 10) }, "")));
  for scope_has {
    ii = 1 + ii; 
    scope_has = this.isVarDefined((strings.Join([]string{ (strings.Join([]string{ name,"_" }, "")),strconv.FormatInt(ii, 10) }, ""))); 
  }
  fnCtx.defCounts[name] = ii
  return ii;
}
func (this *RangerAppWriterContext) debugVars () () {
  fmt.Println( "--- context vars ---" )
  var i int64 = 0;  
  for ; i < int64(len(this.localVarNames)) ; i++ {
    na := this.localVarNames[i];
    fmt.Println( strings.Join([]string{ "var => ",na }, "") )
  }
  if  this.parent.has_value {
    this.parent.value.(*RangerAppWriterContext).debugVars();
  }
}
func (this *RangerAppWriterContext) getVarTotalCnt (name string) int64 {
  var fnCtx *RangerAppWriterContext = this;
  var ii int64 = 0;
  if  r_has_key_string_int64(fnCtx.defCounts, name) {
    ii = (r_get_string_int64(fnCtx.defCounts, name)).value.(int64); 
  }
  if  fnCtx.parent.has_value {
    ii = ii + fnCtx.parent.value.(*RangerAppWriterContext).getVarTotalCnt(name); 
  }
  if  this.isVarDefined(name) {
    ii = ii + 1; 
  }
  return ii;
}
func (this *RangerAppWriterContext) getFnVarCnt2 (name string) int64 {
  var fnCtx *RangerAppWriterContext = this;
  var ii int64 = 0;
  if  r_has_key_string_int64(fnCtx.defCounts, name) {
    ii = (r_get_string_int64(fnCtx.defCounts, name)).value.(int64); 
    ii = 1 + ii; 
    fnCtx.defCounts[name] = ii
  } else {
    fnCtx.defCounts[name] = 1
  }
  if  fnCtx.parent.has_value {
    ii = ii + fnCtx.parent.value.(*RangerAppWriterContext).getFnVarCnt2(name); 
  }
  var scope_has bool = this.isVarDefined(name);
  if  scope_has {
    ii = 1 + ii; 
  }
  var scope_has_2 bool = this.isVarDefined((strings.Join([]string{ (strings.Join([]string{ name,"_" }, "")),strconv.FormatInt(ii, 10) }, "")));
  for scope_has_2 {
    ii = 1 + ii; 
    scope_has_2 = this.isVarDefined((strings.Join([]string{ (strings.Join([]string{ name,"_" }, "")),strconv.FormatInt(ii, 10) }, ""))); 
  }
  return ii;
}
func (this *RangerAppWriterContext) getFnVarCnt3 (name string) int64 {
  var classLevel *GoNullable = new(GoNullable); 
  classLevel = this.findMethodLevelContext();
  var fnCtx *RangerAppWriterContext = this;
  var ii int64 = 0;
  if  r_has_key_string_int64(fnCtx.defCounts, name) {
    ii = (r_get_string_int64(fnCtx.defCounts, name)).value.(int64); 
    fnCtx.defCounts[name] = ii + 1
  } else {
    fnCtx.defCounts[name] = 1
  }
  if  classLevel.value.(*RangerAppWriterContext).isVarDefined(name) {
    ii = ii + 1; 
  }
  var scope_has bool = this.isVarDefined((strings.Join([]string{ (strings.Join([]string{ name,"_" }, "")),strconv.FormatInt(ii, 10) }, "")));
  for scope_has {
    ii = 1 + ii; 
    scope_has = this.isVarDefined((strings.Join([]string{ (strings.Join([]string{ name,"_" }, "")),strconv.FormatInt(ii, 10) }, ""))); 
  }
  return ii;
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
  var cnt int64 = 0;
  var fnLevel *GoNullable = new(GoNullable); 
  fnLevel = this.findMethodLevelContext();
  if  false == (((desc.Get_varType() == 8) || (desc.Get_varType() == 4)) || (desc.Get_varType() == 10)) {
    cnt = fnLevel.value.(*RangerAppWriterContext).getFnVarCnt3(name); 
  }
  if  0 == cnt {
    if  name == "len" {
      desc.Set_compiledName("__len"); 
    } else {
      desc.Set_compiledName(name); 
    }
  } else {
    desc.Set_compiledName(strings.Join([]string{ (strings.Join([]string{ name,"_" }, "")),strconv.FormatInt(cnt, 10) }, "")); 
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
  var i int64 = 0;  
  for ; i < int64(len(this.definedClassList)) ; i++ {
    n := this.definedClassList[i];
    list = append(list,(r_get_string_RangerAppClassDesc(this.definedClasses, n)).value.(*RangerAppClassDesc)); 
  }
  return list;
}
func (this *RangerAppWriterContext) addClass (name string, desc *RangerAppClassDesc) () {
  var root *RangerAppWriterContext = this.getRoot();
  if  r_has_key_string_RangerAppClassDesc(root.definedClasses, name) {
  } else {
    root.definedClasses[name] = desc
    root.definedClassList = append(root.definedClassList,name); 
  }
}
func (this *RangerAppWriterContext) findClass (name string) *RangerAppClassDesc {
  var root *RangerAppWriterContext = this.getRoot();
  return (r_get_string_RangerAppClassDesc(root.definedClasses, name)).value.(*RangerAppClassDesc);
}
func (this *RangerAppWriterContext) hasClass (name string) bool {
  var root *RangerAppWriterContext = this.getRoot();
  return r_has_key_string_RangerAppClassDesc(root.definedClasses, name);
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
  var cnt int64 = int64(len(this.compilerErrors));
  if ( this.parent.has_value) {
    cnt = cnt + this.parent.value.(*RangerAppWriterContext).getErrorCount(); 
  }
  return cnt;
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
func (this *RangerAppWriterContext) isInMain () bool {
  if  this.in_main {
    return true;
  }
  if ( this.parent.has_value) {
    return this.parent.value.(*RangerAppWriterContext).isInMain();
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
func (this *RangerAppWriterContext) findMethodLevelContext () *GoNullable {
  var res *GoNullable = new(GoNullable); 
  if  this.function_level_context {
    res.value = this;
    res.has_value = true; /* detected as non-optional */
    return res;
  }
  if ( this.parent.has_value) {
    return this.parent.value.(*RangerAppWriterContext).findMethodLevelContext();
  }
  res.value = this;
  res.has_value = true; /* detected as non-optional */
  return res;
}
func (this *RangerAppWriterContext) findClassLevelContext () *GoNullable {
  var res *GoNullable = new(GoNullable); 
  if  this.class_level_context {
    res.value = this;
    res.has_value = true; /* detected as non-optional */
    return res;
  }
  if ( this.parent.has_value) {
    return this.parent.value.(*RangerAppWriterContext).findClassLevelContext();
  }
  res.value = this;
  res.has_value = true; /* detected as non-optional */
  return res;
}
func (this *RangerAppWriterContext) fork () *RangerAppWriterContext {
  var new_ctx *RangerAppWriterContext = CreateNew_RangerAppWriterContext();
  new_ctx.parent.value = this;
  new_ctx.parent.has_value = true; /* detected as non-optional */
  return new_ctx;
}
func (this *RangerAppWriterContext) getRootFile () string {
  var root *RangerAppWriterContext = this.getRoot();
  return root.rootFile;
}
func (this *RangerAppWriterContext) setRootFile (file_name string) () {
  var root *RangerAppWriterContext = this.getRoot();
  root.rootFile = file_name; 
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
// getter for variable reservedWords
func (this *RangerAppWriterContext) Get_reservedWords() *GoNullable {
  return this.reservedWords
}
// setter for variable reservedWords
func (this *RangerAppWriterContext) Set_reservedWords( value *GoNullable)  {
  this.reservedWords = value 
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
// getter for variable class_level_context
func (this *RangerAppWriterContext) Get_class_level_context() bool {
  return this.class_level_context
}
// setter for variable class_level_context
func (this *RangerAppWriterContext) Set_class_level_context( value bool)  {
  this.class_level_context = value 
}
// getter for variable function_level_context
func (this *RangerAppWriterContext) Get_function_level_context() bool {
  return this.function_level_context
}
// setter for variable function_level_context
func (this *RangerAppWriterContext) Set_function_level_context( value bool)  {
  this.function_level_context = value 
}
// getter for variable in_main
func (this *RangerAppWriterContext) Get_in_main() bool {
  return this.in_main
}
// setter for variable in_main
func (this *RangerAppWriterContext) Set_in_main( value bool)  {
  this.in_main = value 
}
// getter for variable is_block
func (this *RangerAppWriterContext) Get_is_block() bool {
  return this.is_block
}
// setter for variable is_block
func (this *RangerAppWriterContext) Set_is_block( value bool)  {
  this.is_block = value 
}
// getter for variable is_capturing
func (this *RangerAppWriterContext) Get_is_capturing() bool {
  return this.is_capturing
}
// setter for variable is_capturing
func (this *RangerAppWriterContext) Set_is_capturing( value bool)  {
  this.is_capturing = value 
}
// getter for variable captured_variables
func (this *RangerAppWriterContext) Get_captured_variables() []string {
  return this.captured_variables
}
// setter for variable captured_variables
func (this *RangerAppWriterContext) Set_captured_variables( value []string)  {
  this.captured_variables = value 
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
// getter for variable refTransform
func (this *RangerAppWriterContext) Get_refTransform() map[string]string {
  return this.refTransform
}
// setter for variable refTransform
func (this *RangerAppWriterContext) Set_refTransform( value map[string]string)  {
  this.refTransform = value 
}
// getter for variable rootFile
func (this *RangerAppWriterContext) Get_rootFile() string {
  return this.rootFile
}
// setter for variable rootFile
func (this *RangerAppWriterContext) Set_rootFile( value string)  {
  this.rootFile = value 
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
  this.writer.value.(*CodeWriter).ownerFile.value = this;
  this.writer.value.(*CodeWriter).ownerFile.has_value = true; /* detected as non-optional */
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
  var idx int64 = 0;  
  for ; idx < int64(len(this.files)) ; idx++ {
    file := this.files[idx];
    if  (file.path_name == path) && (file.name == name) {
      return file;
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
  var i int64 = 0;  
  for ; i < int64(len(parts)) ; i++ {
    p := parts[i];
    curr_path = strings.Join([]string{ (strings.Join([]string{ curr_path,"/" }, "")),p }, ""); 
    if  false == (r_dir_exists(curr_path)) {
      _ = os.Mkdir( curr_path , os.ModePerm)
    }
  }
}
func (this *CodeFileSystem) saveTo (path string) () {
  var idx int64 = 0;  
  for ; idx < int64(len(this.files)) ; idx++ {
    file := this.files[idx];
    var file_path string = strings.Join([]string{ (strings.Join([]string{ path,"/" }, "")),file.path_name }, "");
    this.mkdir(file_path);
    fmt.Println( strings.Join([]string{ (strings.Join([]string{ (strings.Join([]string{ "Writing to file ",file_path }, "")),"/" }, "")),file.name }, "") )
    var file_content string = file.getCode();
    if  (int64(len(file_content))) > 0 {
      r_write_text_file(file_path, file.name, file_content)
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
  var fs *GoNullable = new(GoNullable); 
  fs.value = this.ownerFile.value.(*CodeFile).fileSystem.value;
  fs.has_value = this.ownerFile.value.(*CodeFile).fileSystem.has_value;
  var file *CodeFile = fs.value.(*CodeFileSystem).getFile(path, fileName);
  var wr *GoNullable = new(GoNullable); 
  wr = file.getWriter();
  return wr.value.(*CodeWriter);
}
func (this *CodeWriter) getImports () []string {
  var p *CodeWriter = this;
  for (!p.ownerFile.has_value ) && (p.parent.has_value) {
    p = p.parent.value.(*CodeWriter); 
  }
  if  p.ownerFile.has_value {
    var f *CodeFile = p.ownerFile.value.(*CodeFile);
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
  var i int64 = 0;
  if  0 == (int64(len(this.currentLine))) {
    for i < this.indentAmount {
      this.currentLine = strings.Join([]string{ this.currentLine,this.tabStr }, ""); 
      i = i + 1; 
    }
  }
}
func (this *CodeWriter) createTag (name string) *CodeWriter {
  var new_writer *CodeWriter = CreateNew_CodeWriter();
  var new_slice *CodeSlice = CreateNew_CodeSlice();
  this.tags[name] = int64(len(this.slices))
  this.slices = append(this.slices,new_slice); 
  new_slice.writer.value = new_writer;
  new_slice.writer.has_value = true; /* detected as non-optional */
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
    var idx int64 = (r_get_string_int64(this.tags, name)).value.(int64);
    var slice *CodeSlice = this.slices[idx];
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
  var new_writer *CodeWriter = CreateNew_CodeWriter();
  var new_slice *CodeSlice = CreateNew_CodeSlice();
  this.slices = append(this.slices,new_slice); 
  new_slice.writer.value = new_writer;
  new_slice.writer.has_value = true; /* detected as non-optional */
  new_writer.indentAmount = this.indentAmount; 
  new_writer.parent.value = this;
  new_writer.parent.has_value = true; /* detected as non-optional */
  var new_active_slice *CodeSlice = CreateNew_CodeSlice();
  this.slices = append(this.slices,new_active_slice); 
  this.current_slice.value = new_active_slice;
  this.current_slice.has_value = true; /* detected as non-optional */
  return new_writer;
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
    var idx int64 = 0;  
    for ; idx < int64(len(lines)) ; idx++ {
      row := lines[idx];
      this.addIndent();
      if  idx < (rowCnt - 1) {
        this.writeSlice(strings.TrimSpace(row), true);
      } else {
        this.writeSlice(row, newLine);
      }
    }
  }
}
func (this *CodeWriter) raw (str string, newLine bool) () {
  var lines []string = strings.Split(str, "\n");
  var rowCnt int64 = int64(len(lines));
  if  rowCnt == 1 {
    this.writeSlice(str, newLine);
  } else {
    var idx int64 = 0;  
    for ; idx < int64(len(lines)) ; idx++ {
      row := lines[idx];
      this.addIndent();
      if  idx < (rowCnt - 1) {
        this.writeSlice(row, true);
      } else {
        this.writeSlice(row, newLine);
      }
    }
  }
}
func (this *CodeWriter) getCode () string {
  var res string = "";
  var idx int64 = 0;  
  for ; idx < int64(len(this.slices)) ; idx++ {
    slice := this.slices[idx];
    res = strings.Join([]string{ res,slice.getCode() }, ""); 
  }
  res = strings.Join([]string{ res,this.currentLine }, ""); 
  return res;
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
  __len int64
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
  Get___len() int64
  Set___len(value int64) 
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
  me.__len = 0
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
  me.__len = int64(len((me.buff.value.([]byte)))); 
  me.rootNode.value = CreateNew_CodeNode(me.code.value.(*SourceCode), 0, 0);
  me.rootNode.has_value = true; /* detected as non-optional */
  me.rootNode.value.(*CodeNode).is_block_node = true; 
  me.rootNode.value.(*CodeNode).expression = true; 
  me.curr_node.value = me.rootNode.value;
  me.curr_node.has_value = false; 
  if me.curr_node.value != nil {
    me.curr_node.has_value = true
  }
  me.parents = append(me.parents,me.curr_node.value.(*CodeNode)); 
  me.paren_cnt = 1; 
  return me;
}
func (this *RangerLispParser) joo (cm *SourceCode) () {
  /** unused:  ll*/
}
func (this *RangerLispParser) parse_raw_annotation () *CodeNode {
  var sp int64 = this.i;
  var ep int64 = this.i;
  this.i = this.i + 1; 
  sp = this.i; 
  ep = this.i; 
  if  this.i < this.__len {
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
  var s []byte = this.buff.value.([]byte);
  var did_break bool = false;
  if  this.i >= this.__len {
    return true;
  }
  var c byte = s[this.i];
  /** unused:  bb*/
  for (this.i < this.__len) && (c <= 32) {
    if  is_block_parent && ((c == 10) || (c == 13)) {
      this.end_expression();
      did_break = true; 
      break;
    }
    this.i = 1 + this.i; 
    if  this.i >= this.__len {
      return true;
    }
    c = s[this.i]; 
  }
  return did_break;
}
func (this *RangerLispParser) end_expression () bool {
  this.i = 1 + this.i; 
  if  this.i >= this.__len {
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
    this.curr_node.has_value = false; 
    if this.curr_node.value != nil {
      this.curr_node.has_value = true
    }
  }
  this.curr_node.value.(*CodeNode).infix_operator = false; 
  return true;
}
func (this *RangerLispParser) getOperator () int64 {
  var s []byte = this.buff.value.([]byte);
  if  (this.i + 2) >= this.__len {
    return 0;
  }
  var c byte = s[this.i];
  var c2 byte = s[(this.i + 1)];
  switch (c ) { 
    case 42 : 
      this.i = this.i + 1; 
      return 14;
    case 47 : 
      this.i = this.i + 1; 
      return 14;
    case 43 : 
      this.i = this.i + 1; 
      return 13;
    case 45 : 
      this.i = this.i + 1; 
      return 13;
    case 60 : 
      if  c2 == (61) {
        this.i = this.i + 2; 
        return 11;
      }
      this.i = this.i + 1; 
      return 11;
    case 62 : 
      if  c2 == (61) {
        this.i = this.i + 2; 
        return 11;
      }
      this.i = this.i + 1; 
      return 11;
    case 33 : 
      if  c2 == (61) {
        this.i = this.i + 2; 
        return 10;
      }
      return 0;
    case 61 : 
      if  c2 == (61) {
        this.i = this.i + 2; 
        return 10;
      }
      this.i = this.i + 1; 
      return 3;
    case 38 : 
      if  c2 == (38) {
        this.i = this.i + 2; 
        return 6;
      }
      return 0;
    case 124 : 
      if  c2 == (124) {
        this.i = this.i + 2; 
        return 5;
      }
      return 0;
    default: 
  }
  return 0;
}
func (this *RangerLispParser) isOperator () int64 {
  var s []byte = this.buff.value.([]byte);
  if  (this.i - 2) > this.__len {
    return 0;
  }
  var c byte = s[this.i];
  var c2 byte = s[(this.i + 1)];
  switch (c ) { 
    case 42 : 
      return 1;
    case 47 : 
      return 14;
    case 43 : 
      return 13;
    case 45 : 
      return 13;
    case 60 : 
      if  c2 == (61) {
        return 11;
      }
      return 11;
    case 62 : 
      if  c2 == (61) {
        return 11;
      }
      return 11;
    case 33 : 
      if  c2 == (61) {
        return 10;
      }
      return 0;
    case 61 : 
      if  c2 == (61) {
        return 10;
      }
      return 3;
    case 38 : 
      if  c2 == (38) {
        return 6;
      }
      return 0;
    case 124 : 
      if  c2 == (124) {
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
    push_target.has_value = false; 
    if push_target.value != nil {
      push_target.has_value = true
    }
    if  push_target.value.(*CodeNode).to_the_right {
      push_target.value = push_target.value.(*CodeNode).right_node.value;
      push_target.has_value = false; 
      if push_target.value != nil {
        push_target.has_value = true
      }
      p_node.parent.value = push_target.value;
      p_node.parent.has_value = false; 
      if p_node.parent.value != nil {
        p_node.parent.has_value = true
      }
    }
  }
  push_target.value.(*CodeNode).children = append(push_target.value.(*CodeNode).children,p_node); 
}
func (this *RangerLispParser) parse () () {
  var s []byte = this.buff.value.([]byte);
  var c byte = s[0];
  /** unused:  next_c*/
  var fc byte = 0;
  var new_node *GoNullable = new(GoNullable); 
  var sp int64 = 0;
  var ep int64 = 0;
  var last_i int64 = 0;
  var had_lf bool = false;
  for this.i < this.__len {
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
    c = s[this.i]; 
    if  this.i < this.__len {
      c = s[this.i]; 
      if  c == 59 {
        sp = this.i + 1; 
        for (this.i < this.__len) && ((s[this.i]) > 31) {
          this.i = 1 + this.i; 
        }
        if  this.i >= this.__len {
          break;
        }
        new_node.value = CreateNew_CodeNode(this.code.value.(*SourceCode), sp, this.i);
        new_node.has_value = true; /* detected as non-optional */
        new_node.value.(*CodeNode).parsed_type = 10; 
        new_node.value.(*CodeNode).value_type = 10; 
        new_node.value.(*CodeNode).string_value = fmt.Sprintf("%s", s[sp:this.i]); 
        this.curr_node.value.(*CodeNode).comments = append(this.curr_node.value.(*CodeNode).comments,new_node.value.(*CodeNode)); 
        continue;
      }
      if  this.i < (this.__len - 1) {
        fc = s[(this.i + 1)]; 
        if  (((c == 40) || (c == (123))) || ((c == 39) && (fc == 40))) || ((c == 96) && (fc == 40)) {
          this.paren_cnt = this.paren_cnt + 1; 
          if  !this.curr_node.has_value  {
            this.rootNode.value = CreateNew_CodeNode(this.code.value.(*SourceCode), this.i, this.i);
            this.rootNode.has_value = true; /* detected as non-optional */
            this.curr_node.value = this.rootNode.value;
            this.curr_node.has_value = false; 
            if this.curr_node.value != nil {
              this.curr_node.has_value = true
            }
            if  c == 96 {
              this.curr_node.value.(*CodeNode).parsed_type = 30; 
              this.curr_node.value.(*CodeNode).value_type = 30; 
            }
            if  c == 39 {
              this.curr_node.value.(*CodeNode).parsed_type = 29; 
              this.curr_node.value.(*CodeNode).value_type = 29; 
            }
            this.curr_node.value.(*CodeNode).expression = true; 
            this.parents = append(this.parents,this.curr_node.value.(*CodeNode)); 
          } else {
            var new_qnode *CodeNode = CreateNew_CodeNode(this.code.value.(*SourceCode), this.i, this.i);
            if  c == 96 {
              new_qnode.value_type = 30; 
            }
            if  c == 39 {
              new_qnode.value_type = 29; 
            }
            new_qnode.expression = true; 
            this.insert_node(new_qnode);
            this.parents = append(this.parents,new_qnode); 
            this.curr_node.value = new_qnode;
            this.curr_node.has_value = true; /* detected as non-optional */
          }
          if  c == (123) {
            this.curr_node.value.(*CodeNode).is_block_node = true; 
          }
          this.i = 1 + this.i; 
          this.parse();
          continue;
        }
      }
      sp = this.i; 
      ep = this.i; 
      fc = s[this.i]; 
      if  (((fc == 45) && ((s[(this.i + 1)]) >= 46)) && ((s[(this.i + 1)]) <= 57)) || ((fc >= 48) && (fc <= 57)) {
        var is_double bool = false;
        sp = this.i; 
        this.i = 1 + this.i; 
        c = s[this.i]; 
        for (this.i < this.__len) && ((((c >= 48) && (c <= 57)) || (c == (46))) || ((this.i == sp) && ((c == (43)) || (c == (45))))) {
          if  c == (46) {
            is_double = true; 
          }
          this.i = 1 + this.i; 
          c = s[this.i]; 
        }
        ep = this.i; 
        var new_num_node *CodeNode = CreateNew_CodeNode(this.code.value.(*SourceCode), sp, ep);
        if  is_double {
          new_num_node.parsed_type = 2; 
          new_num_node.value_type = 2; 
          new_num_node.double_value = (r_str_2_d64((fmt.Sprintf("%s", s[sp:ep])))).value.(float64); 
        } else {
          new_num_node.parsed_type = 3; 
          new_num_node.value_type = 3; 
          new_num_node.int_value = (r_str_2_i64((fmt.Sprintf("%s", s[sp:ep])))).value.(int64); 
        }
        this.insert_node(new_num_node);
        continue;
      }
      if  fc == 34 {
        sp = this.i + 1; 
        ep = sp; 
        c = s[this.i]; 
        var must_encode bool = false;
        for this.i < this.__len {
          this.i = 1 + this.i; 
          c = s[this.i]; 
          if  c == 34 {
            break;
          }
          if  c == 92 {
            this.i = 1 + this.i; 
            if  this.i < this.__len {
              must_encode = true; 
              c = s[this.i]; 
            } else {
              break;
            }
          }
        }
        ep = this.i; 
        if  this.i < this.__len {
          var encoded_str string = "";
          if  must_encode {
            var orig_str []byte = []byte((fmt.Sprintf("%s", s[sp:ep])));
            var str_length int64 = int64(len(orig_str));
            var ii int64 = 0;
            for ii < str_length {
              var cc byte = orig_str[ii];
              if  cc == 92 {
                var next_ch byte = orig_str[(ii + 1)];
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
                    ii = ii + 4; 
                  default: 
                }
                ii = ii + 2; 
              } else {
                encoded_str = strings.Join([]string{ encoded_str,(fmt.Sprintf("%s", orig_str[ii:(1 + ii)])) }, ""); 
                ii = ii + 1; 
              }
            }
          }
          var new_str_node *CodeNode = CreateNew_CodeNode(this.code.value.(*SourceCode), sp, ep);
          new_str_node.parsed_type = 4; 
          new_str_node.value_type = 4; 
          if  must_encode {
            new_str_node.string_value = encoded_str; 
          } else {
            new_str_node.string_value = fmt.Sprintf("%s", s[sp:ep]); 
          }
          this.insert_node(new_str_node);
          this.i = 1 + this.i; 
          continue;
        }
      }
      if  (((fc == (116)) && ((s[(this.i + 1)]) == (114))) && ((s[(this.i + 2)]) == (117))) && ((s[(this.i + 3)]) == (101)) {
        var new_true_node *CodeNode = CreateNew_CodeNode(this.code.value.(*SourceCode), sp, sp + 4);
        new_true_node.value_type = 5; 
        new_true_node.parsed_type = 5; 
        new_true_node.boolean_value = true; 
        this.insert_node(new_true_node);
        this.i = this.i + 4; 
        continue;
      }
      if  ((((fc == (102)) && ((s[(this.i + 1)]) == (97))) && ((s[(this.i + 2)]) == (108))) && ((s[(this.i + 3)]) == (115))) && ((s[(this.i + 4)]) == (101)) {
        var new_f_node *CodeNode = CreateNew_CodeNode(this.code.value.(*SourceCode), sp, sp + 5);
        new_f_node.value_type = 5; 
        new_f_node.parsed_type = 5; 
        new_f_node.boolean_value = false; 
        this.insert_node(new_f_node);
        this.i = this.i + 5; 
        continue;
      }
      if  fc == (64) {
        this.i = this.i + 1; 
        sp = this.i; 
        ep = this.i; 
        c = s[this.i]; 
        for ((((this.i < this.__len) && ((s[this.i]) > 32)) && (c != 40)) && (c != 41)) && (c != (125)) {
          this.i = 1 + this.i; 
          c = s[this.i]; 
        }
        ep = this.i; 
        if  (this.i < this.__len) && (ep > sp) {
          var a_node2 *CodeNode = CreateNew_CodeNode(this.code.value.(*SourceCode), sp, ep);
          var a_name string = fmt.Sprintf("%s", s[sp:ep]);
          a_node2.expression = true; 
          this.curr_node.value = a_node2;
          this.curr_node.has_value = true; /* detected as non-optional */
          this.parents = append(this.parents,a_node2); 
          this.i = this.i + 1; 
          this.paren_cnt = this.paren_cnt + 1; 
          this.parse();
          var use_first bool = false;
          if  1 == (int64(len(a_node2.children))) {
            var ch1 *CodeNode = a_node2.children[0];
            use_first = ch1.isPrimitive(); 
          }
          if  use_first {
            var theNode *CodeNode
            
            // array_extract operator 
            var theNode_1 []*CodeNode
            theNode , theNode_1 = r_m_arr_CodeNode_extract(a_node2.children, 0);
            a_node2.children = theNode_1; 
            
            this.curr_node.value.(*CodeNode).props[a_name] = theNode
          } else {
            this.curr_node.value.(*CodeNode).props[a_name] = a_node2
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
      if  (((((this.i < this.__len) && ((s[this.i]) > 32)) && (c != 58)) && (c != 40)) && (c != 41)) && (c != (125)) {
        if  this.curr_node.value.(*CodeNode).is_block_node == true {
          var new_expr_node *CodeNode = CreateNew_CodeNode(this.code.value.(*SourceCode), sp, ep);
          new_expr_node.parent.value = this.curr_node.value;
          new_expr_node.parent.has_value = false; 
          if new_expr_node.parent.value != nil {
            new_expr_node.parent.has_value = true
          }
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
      op_c = this.getOperator(); 
      var last_was_newline bool = false;
      if  op_c > 0 {
      } else {
        for (((((this.i < this.__len) && ((s[this.i]) > 32)) && (c != 58)) && (c != 40)) && (c != 41)) && (c != (125)) {
          if  this.i > sp {
            var is_opchar int64 = this.isOperator();
            if  is_opchar > 0 {
              break;
            }
          }
          this.i = 1 + this.i; 
          c = s[this.i]; 
          if  (c == 10) || (c == 13) {
            last_was_newline = true; 
            break;
          }
          if  c == (46) {
            ns_list = append(ns_list,fmt.Sprintf("%s", s[last_ns:this.i])); 
            last_ns = this.i + 1; 
            ns_cnt = 1 + ns_cnt; 
          }
          if  (this.i > vref_end) && (c == (64)) {
            vref_had_type_ann = true; 
            vref_end = this.i; 
            vref_ann_node.value = this.parse_raw_annotation();
            vref_ann_node.has_value = true; /* detected as non-optional */
            c = s[this.i]; 
            break;
          }
        }
      }
      ep = this.i; 
      if  vref_had_type_ann {
        ep = vref_end; 
      }
      ns_list = append(ns_list,fmt.Sprintf("%s", s[last_ns:ep])); 
      c = s[this.i]; 
      for ((this.i < this.__len) && (c <= 32)) && (false == last_was_newline) {
        this.i = 1 + this.i; 
        c = s[this.i]; 
        if  is_block_parent && ((c == 10) || (c == 13)) {
          this.i = this.i - 1; 
          c = s[this.i]; 
          had_lf = true; 
          break;
        }
      }
      if  c == 58 {
        this.i = this.i + 1; 
        for (this.i < this.__len) && ((s[this.i]) <= 32) {
          this.i = 1 + this.i; 
        }
        var vt_sp int64 = this.i;
        var vt_ep int64 = this.i;
        c = s[this.i]; 
        if  c == (40) {
          var vann_arr2 *CodeNode = this.parse_raw_annotation();
          vann_arr2.expression = true; 
          var new_expr_node_1 *CodeNode = CreateNew_CodeNode(this.code.value.(*SourceCode), sp, vt_ep);
          new_expr_node_1.vref = fmt.Sprintf("%s", s[sp:ep]); 
          new_expr_node_1.ns = ns_list; 
          new_expr_node_1.expression_value.value = vann_arr2;
          new_expr_node_1.expression_value.has_value = true; /* detected as non-optional */
          new_expr_node_1.parsed_type = 15; 
          new_expr_node_1.value_type = 15; 
          if  vref_had_type_ann {
            new_expr_node_1.vref_annotation.value = vref_ann_node.value;
            new_expr_node_1.vref_annotation.has_value = false; 
            if new_expr_node_1.vref_annotation.value != nil {
              new_expr_node_1.vref_annotation.has_value = true
            }
            new_expr_node_1.has_vref_annotation = true; 
          }
          this.curr_node.value.(*CodeNode).children = append(this.curr_node.value.(*CodeNode).children,new_expr_node_1); 
          continue;
        }
        if  c == (91) {
          this.i = this.i + 1; 
          vt_sp = this.i; 
          var hash_sep int64 = 0;
          var had_array_type_ann bool = false;
          c = s[this.i]; 
          for ((this.i < this.__len) && (c > 32)) && (c != 93) {
            this.i = 1 + this.i; 
            c = s[this.i]; 
            if  c == (58) {
              hash_sep = this.i; 
            }
            if  c == (64) {
              had_array_type_ann = true; 
              break;
            }
          }
          vt_ep = this.i; 
          if  hash_sep > 0 {
            vt_ep = this.i; 
            var type_name string = fmt.Sprintf("%s", s[(1 + hash_sep):vt_ep]);
            var key_type_name string = fmt.Sprintf("%s", s[vt_sp:hash_sep]);
            var new_hash_node *CodeNode = CreateNew_CodeNode(this.code.value.(*SourceCode), sp, vt_ep);
            new_hash_node.vref = fmt.Sprintf("%s", s[sp:ep]); 
            new_hash_node.ns = ns_list; 
            new_hash_node.parsed_type = 7; 
            new_hash_node.value_type = 7; 
            new_hash_node.array_type = type_name; 
            new_hash_node.key_type = key_type_name; 
            if  vref_had_type_ann {
              new_hash_node.vref_annotation.value = vref_ann_node.value;
              new_hash_node.vref_annotation.has_value = false; 
              if new_hash_node.vref_annotation.value != nil {
                new_hash_node.vref_annotation.has_value = true
              }
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
            new_hash_node.parent.has_value = false; 
            if new_hash_node.parent.value != nil {
              new_hash_node.parent.has_value = true
            }
            this.curr_node.value.(*CodeNode).children = append(this.curr_node.value.(*CodeNode).children,new_hash_node); 
            this.i = 1 + this.i; 
            continue;
          } else {
            vt_ep = this.i; 
            var type_name_1 string = fmt.Sprintf("%s", s[vt_sp:vt_ep]);
            var new_arr_node *CodeNode = CreateNew_CodeNode(this.code.value.(*SourceCode), sp, vt_ep);
            new_arr_node.vref = fmt.Sprintf("%s", s[sp:ep]); 
            new_arr_node.ns = ns_list; 
            new_arr_node.parsed_type = 6; 
            new_arr_node.value_type = 6; 
            new_arr_node.array_type = type_name_1; 
            new_arr_node.parent.value = this.curr_node.value;
            new_arr_node.parent.has_value = false; 
            if new_arr_node.parent.value != nil {
              new_arr_node.parent.has_value = true
            }
            this.curr_node.value.(*CodeNode).children = append(this.curr_node.value.(*CodeNode).children,new_arr_node); 
            if  vref_had_type_ann {
              new_arr_node.vref_annotation.value = vref_ann_node.value;
              new_arr_node.vref_annotation.has_value = false; 
              if new_arr_node.vref_annotation.value != nil {
                new_arr_node.vref_annotation.has_value = true
              }
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
        for ((((((this.i < this.__len) && ((s[this.i]) > 32)) && (c != 58)) && (c != 40)) && (c != 41)) && (c != (125))) && (c != (44)) {
          this.i = 1 + this.i; 
          c = s[this.i]; 
          if  c == (64) {
            had_type_ann = true; 
            break;
          }
        }
        if  this.i < this.__len {
          vt_ep = this.i; 
          /** unused:  type_name_2*/
          var new_ref_node *CodeNode = CreateNew_CodeNode(this.code.value.(*SourceCode), sp, ep);
          new_ref_node.vref = fmt.Sprintf("%s", s[sp:ep]); 
          new_ref_node.ns = ns_list; 
          new_ref_node.parsed_type = 9; 
          new_ref_node.value_type = 9; 
          new_ref_node.type_name = fmt.Sprintf("%s", s[vt_sp:vt_ep]); 
          new_ref_node.parent.value = this.curr_node.value;
          new_ref_node.parent.has_value = false; 
          if new_ref_node.parent.value != nil {
            new_ref_node.parent.has_value = true
          }
          if  vref_had_type_ann {
            new_ref_node.vref_annotation.value = vref_ann_node.value;
            new_ref_node.vref_annotation.has_value = false; 
            if new_ref_node.vref_annotation.value != nil {
              new_ref_node.vref_annotation.has_value = true
            }
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
        if  (this.i < this.__len) && (ep > sp) {
          var new_vref_node *CodeNode = CreateNew_CodeNode(this.code.value.(*SourceCode), sp, ep);
          new_vref_node.vref = fmt.Sprintf("%s", s[sp:ep]); 
          new_vref_node.parsed_type = 9; 
          new_vref_node.value_type = 9; 
          new_vref_node.ns = ns_list; 
          new_vref_node.parent.value = this.curr_node.value;
          new_vref_node.parent.has_value = false; 
          if new_vref_node.parent.value != nil {
            new_vref_node.parent.has_value = true
          }
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
              pTarget.has_value = false; 
              if pTarget.value != nil {
                pTarget.has_value = true
              }
            } else {
              var rn *GoNullable = new(GoNullable); 
              rn.value = iNode.value.(*CodeNode).right_node.value;
              rn.has_value = iNode.value.(*CodeNode).right_node.has_value;
              new_vref_node.parent.value = rn.value;
              new_vref_node.parent.has_value = false; 
              if new_vref_node.parent.value != nil {
                new_vref_node.parent.has_value = true
              }
              pTarget.value = rn.value;
              pTarget.has_value = false; 
              if pTarget.value != nil {
                pTarget.has_value = true
              }
            }
          }
          pTarget.value.(*CodeNode).children = append(pTarget.value.(*CodeNode).children,new_vref_node); 
          if  vref_had_type_ann {
            new_vref_node.vref_annotation.value = vref_ann_node.value;
            new_vref_node.vref_annotation.has_value = false; 
            if new_vref_node.vref_annotation.value != nil {
              new_vref_node.vref_annotation.has_value = true
            }
            new_vref_node.has_vref_annotation = true; 
          }
          if  (this.i + 1) < this.__len {
            if  ((s[(this.i + 1)]) == (40)) || ((s[(this.i + 0)]) == (40)) {
              if  ((0 == op_pred) && this.curr_node.value.(*CodeNode).infix_operator) && (1 == (int64(len(this.curr_node.value.(*CodeNode).children)))) {
              }
            }
          }
          if  ((op_pred > 0) && this.curr_node.value.(*CodeNode).infix_operator) || ((op_pred > 0) && ((int64(len(this.curr_node.value.(*CodeNode).children))) >= 2)) {
            if  (op_pred == 3) && (2 == (int64(len(this.curr_node.value.(*CodeNode).children)))) {
              var n_ch *CodeNode
              
              // array_extract operator 
              var n_ch_2 []*CodeNode
              n_ch , n_ch_2 = r_m_arr_CodeNode_extract(this.curr_node.value.(*CodeNode).children, 0);
              this.curr_node.value.(*CodeNode).children = n_ch_2; 
              
              this.curr_node.value.(*CodeNode).children = append(this.curr_node.value.(*CodeNode).children,n_ch); 
            } else {
              if  false == this.curr_node.value.(*CodeNode).infix_operator {
                var if_node *CodeNode = CreateNew_CodeNode(this.code.value.(*SourceCode), sp, ep);
                this.curr_node.value.(*CodeNode).infix_node.value = if_node;
                this.curr_node.value.(*CodeNode).infix_node.has_value = true; /* detected as non-optional */
                this.curr_node.value.(*CodeNode).infix_operator = true; 
                if_node.infix_subnode = true; 
                this.curr_node.value.(*CodeNode).value_type = 0; 
                this.curr_node.value.(*CodeNode).expression = true; 
                if_node.expression = true; 
                var ch_cnt int64 = int64(len(this.curr_node.value.(*CodeNode).children));
                var ii_1 int64 = 0;
                var start_from int64 = ch_cnt - 2;
                var keep_nodes *CodeNode = CreateNew_CodeNode(this.code.value.(*SourceCode), sp, ep);
                for ch_cnt > 0 {
                  var n_ch_1 *CodeNode
                  
                  // array_extract operator 
                  var n_ch_4 []*CodeNode
                  n_ch_1 , n_ch_4 = r_m_arr_CodeNode_extract(this.curr_node.value.(*CodeNode).children, 0);
                  this.curr_node.value.(*CodeNode).children = n_ch_4; 
                  
                  var p_target *CodeNode = if_node;
                  if  (ii_1 < start_from) || n_ch_1.infix_subnode {
                    p_target = keep_nodes; 
                  }
                  p_target.children = append(p_target.children,n_ch_1); 
                  ch_cnt = ch_cnt - 1; 
                  ii_1 = 1 + ii_1; 
                }
                var i_1 int64 = 0;  
                for ; i_1 < int64(len(keep_nodes.children)) ; i_1++ {
                  keep := keep_nodes.children[i_1];
                  this.curr_node.value.(*CodeNode).children = append(this.curr_node.value.(*CodeNode).children,keep); 
                }
                this.curr_node.value.(*CodeNode).children = append(this.curr_node.value.(*CodeNode).children,if_node); 
              }
              var ifNode *GoNullable = new(GoNullable); 
              ifNode.value = this.curr_node.value.(*CodeNode).infix_node.value;
              ifNode.has_value = this.curr_node.value.(*CodeNode).infix_node.has_value;
              var new_op_node *CodeNode = CreateNew_CodeNode(this.code.value.(*SourceCode), sp, ep);
              new_op_node.expression = true; 
              new_op_node.parent.value = ifNode.value;
              new_op_node.parent.has_value = false; 
              if new_op_node.parent.value != nil {
                new_op_node.parent.has_value = true
              }
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
                var op_node_1 []*CodeNode
                op_node , op_node_1 = r_m_arr_CodeNode_extract(ifNode.value.(*CodeNode).children, until_index);
                ifNode.value.(*CodeNode).children = op_node_1; 
                
                var last_value *CodeNode
                
                // array_extract operator 
                var last_value_1 []*CodeNode
                last_value , last_value_1 = r_m_arr_CodeNode_extract(ifNode.value.(*CodeNode).children, (until_index - 1));
                ifNode.value.(*CodeNode).children = last_value_1; 
                
                new_op_node.children = append(new_op_node.children,op_node); 
                new_op_node.children = append(new_op_node.children,last_value); 
              } else {
                if  false == just_continue {
                  for until_index > 0 {
                    var what_to_add *CodeNode
                    
                    // array_extract operator 
                    var what_to_add_1 []*CodeNode
                    what_to_add , what_to_add_1 = r_m_arr_CodeNode_extract(ifNode.value.(*CodeNode).children, 0);
                    ifNode.value.(*CodeNode).children = what_to_add_1; 
                    
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
      if  (c == 41) || (c == (125)) {
        if  ((c == (125)) && is_block_parent) && ((int64(len(this.curr_node.value.(*CodeNode).children))) > 0) {
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
          this.curr_node.has_value = false; 
          if this.curr_node.value != nil {
            this.curr_node.has_value = true
          }
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
func (this *RangerLispParser) Get___len() int64 {
  return this.__len
}
// setter for variable len
func (this *RangerLispParser) Set___len( value int64)  {
  this.__len = value 
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
  /** unused:  fc*/
  var missed_args []string = make([]string, 0);
  var all_matched bool = true;
  if  ((int64(len(args.children))) == 0) && ((int64(len(callArgs.children))) > 1) {
    return false;
  }
  var lastArg *GoNullable = new(GoNullable); 
  var i int64 = 0;  
  for ; i < int64(len(callArgs.children)) ; i++ {
    callArg := callArgs.children[i];
    if  i == 0 {
      continue;
    }
    var arg_index int64 = i - 1;
    if  arg_index < (int64(len(args.children))) {
      lastArg.value = args.children[arg_index];
      lastArg.has_value = true; /* detected as non-optional */
    }
    var arg *CodeNode = lastArg.value.(*CodeNode);
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
        var pa_1 *GoNullable = new(GoNullable); 
        pa_1.value = callArg.paramDesc.value;
        pa_1.has_value = callArg.paramDesc.has_value;
        var b_1 bool = pa_1.value.(IFACE_RangerAppParamDesc).Get_nameNode().value.(*CodeNode).hasFlag("optional");
        if  b_1 == false {
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
    var s string = (r_get_string_string(this.matched, tplKeyword)).value.(string);
    if  this.areEqualTypes(s, typeName, ctx) {
      return true;
    }
    if  s == typeName {
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
    var t_name string = arg.type_name;
    switch (t_name ) { 
      case "expression" : 
        return node.expression;
      case "block" : 
        return node.expression;
      case "arguments" : 
        return node.expression;
      case "keyword" : 
        return node.eval_type == 9;
      case "T.name" : 
        return node.eval_type_name == t_name;
    }
    return eq;
  }
  if  (arg.value_type == 6) && (node.eval_type == 6) {
    var same_arrays bool = this.areEqualTypes(arg.array_type, node.array_type, ctx);
    return same_arrays;
  }
  if  (arg.value_type == 7) && (node.eval_type == 7) {
    var same_arrays_1 bool = this.areEqualTypes(arg.array_type, node.array_type, ctx);
    var same_keys bool = this.areEqualTypes(arg.key_type, node.key_type, ctx);
    return same_arrays_1 && same_keys;
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
    var eq bool = this.areEqualTypes(arg.type_name, node.eval_type_name, ctx);
    var t_name string = arg.type_name;
    switch (t_name ) { 
      case "expression" : 
        return node.expression;
      case "block" : 
        return node.expression;
      case "arguments" : 
        return node.expression;
      case "keyword" : 
        return node.eval_type == 9;
      case "T.name" : 
        return node.eval_type_name == t_name;
    }
    return eq;
  }
  if  (arg.value_type == 6) && (node.eval_type == 6) {
    var same_arrays bool = this.areEqualTypes(arg.array_type, node.eval_array_type, ctx);
    return same_arrays;
  }
  if  (arg.value_type == 7) && (node.eval_type == 7) {
    var same_arrays_1 bool = this.areEqualTypes(arg.array_type, node.eval_array_type, ctx);
    var same_keys bool = this.areEqualTypes(arg.key_type, node.eval_key_type, ctx);
    return same_arrays_1 && same_keys;
  }
  return false;
}
func (this *RangerArgMatch) areEqualTypes (type1 string, type2 string, ctx *RangerAppWriterContext) bool {
  var t_name string = type1;
  if  r_has_key_string_string(this.matched, type1) {
    t_name = (r_get_string_string(this.matched, type1)).value.(string); 
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
  }
  if  ctx.isDefinedClass(t_name) && ctx.isDefinedClass(type2) {
    var c1 *RangerAppClassDesc = ctx.findClass(t_name);
    var c2 *RangerAppClassDesc = ctx.findClass(type2);
    if  c1.isSameOrParentClass(type2, ctx) {
      return true;
    }
    if  c2.isSameOrParentClass(t_name, ctx) {
      return true;
    }
  } else {
    if  ctx.isDefinedClass(t_name) {
      var c1_1 *RangerAppClassDesc = ctx.findClass(t_name);
      if  c1_1.isSameOrParentClass(type2, ctx) {
        return true;
      }
    }
  }
  return t_name == type2;
}
func (this *RangerArgMatch) getTypeName (n string) string {
  var t_name string = n;
  if  r_has_key_string_string(this.matched, t_name) {
    t_name = (r_get_string_string(this.matched, t_name)).value.(string); 
  }
  if  0 == (int64(len(t_name))) {
    return "";
  }
  return t_name;
}
func (this *RangerArgMatch) getType (n string) int64 {
  var t_name string = n;
  if  r_has_key_string_string(this.matched, t_name) {
    t_name = (r_get_string_string(this.matched, t_name)).value.(string); 
  }
  if  0 == (int64(len(t_name))) {
    return 0;
  }
  switch (t_name ) { 
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
type ClassJoinPoint struct { 
  class_def *GoNullable
  node *GoNullable
}
type IFACE_ClassJoinPoint interface { 
  Get_class_def() *GoNullable
  Set_class_def(value *GoNullable) 
  Get_node() *GoNullable
  Set_node(value *GoNullable) 
}

func CreateNew_ClassJoinPoint() *ClassJoinPoint {
  me := new(ClassJoinPoint)
  me.class_def = new(GoNullable);
  me.node = new(GoNullable);
  return me;
}
// getter for variable class_def
func (this *ClassJoinPoint) Get_class_def() *GoNullable {
  return this.class_def
}
// setter for variable class_def
func (this *ClassJoinPoint) Set_class_def( value *GoNullable)  {
  this.class_def = value 
}
// getter for variable node
func (this *ClassJoinPoint) Get_node() *GoNullable {
  return this.node
}
// setter for variable node
func (this *ClassJoinPoint) Set_node( value *GoNullable)  {
  this.node = value 
}
type RangerFlowParser struct { 
  stdCommands *GoNullable
  lastProcessedNode *GoNullable
  collectWalkAtEnd []*CodeNode /**  unused  **/ 
  walkAlso []*CodeNode
  serializedClasses []*RangerAppClassDesc
  classesWithTraits []*ClassJoinPoint
  collectedIntefaces []*RangerAppClassDesc
  definedInterfaces map[string]bool /**  unused  **/ 
}
type IFACE_RangerFlowParser interface { 
  Get_stdCommands() *GoNullable
  Set_stdCommands(value *GoNullable) 
  Get_lastProcessedNode() *GoNullable
  Set_lastProcessedNode(value *GoNullable) 
  Get_collectWalkAtEnd() []*CodeNode
  Set_collectWalkAtEnd(value []*CodeNode) 
  Get_walkAlso() []*CodeNode
  Set_walkAlso(value []*CodeNode) 
  Get_serializedClasses() []*RangerAppClassDesc
  Set_serializedClasses(value []*RangerAppClassDesc) 
  Get_classesWithTraits() []*ClassJoinPoint
  Set_classesWithTraits(value []*ClassJoinPoint) 
  Get_collectedIntefaces() []*RangerAppClassDesc
  Set_collectedIntefaces(value []*RangerAppClassDesc) 
  Get_definedInterfaces() map[string]bool
  Set_definedInterfaces(value map[string]bool) 
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
  transformParams(list []*CodeNode, fnArgs []IFACE_RangerAppParamDesc, ctx *RangerAppWriterContext) []*CodeNode
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
  StartWalk(node *CodeNode, ctx *RangerAppWriterContext, wr *CodeWriter) ()
  WalkNode(node *CodeNode, ctx *RangerAppWriterContext, wr *CodeWriter) bool
  mergeImports(node *CodeNode, ctx *RangerAppWriterContext, wr *CodeWriter) ()
  CollectMethods(node *CodeNode, ctx *RangerAppWriterContext, wr *CodeWriter) ()
  WalkCollectMethods(node *CodeNode, ctx *RangerAppWriterContext, wr *CodeWriter) ()
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
  me.collectWalkAtEnd = make([]*CodeNode,0)
  me.walkAlso = make([]*CodeNode,0)
  me.serializedClasses = make([]*RangerAppClassDesc,0)
  me.classesWithTraits = make([]*ClassJoinPoint,0)
  me.collectedIntefaces = make([]*RangerAppClassDesc,0)
  me.definedInterfaces = make(map[string]bool)
  me.stdCommands = new(GoNullable);
  me.lastProcessedNode = new(GoNullable);
  return me;
}
func (this *RangerFlowParser) cmdEnum (node *CodeNode, ctx *RangerAppWriterContext, wr *CodeWriter) () {
  var fNameNode *CodeNode = node.children[1];
  var enumList *CodeNode = node.children[2];
  var new_enum *RangerAppEnum = CreateNew_RangerAppEnum();
  var i int64 = 0;  
  for ; i < int64(len(enumList.children)) ; i++ {
    item := enumList.children[i];
    new_enum.add(item.vref);
  }
  ctx.definedEnums[fNameNode.vref] = new_enum
}
func (this *RangerFlowParser) initStdCommands () () {
}
func (this *RangerFlowParser) findLanguageOper (details *CodeNode, ctx *RangerAppWriterContext) *GoNullable {
  var langName string = ctx.getTargetLang();
  var i int64 = 0;  
  for ; i < int64(len(details.children)) ; i++ {
    det := details.children[i];
    if  (int64(len(det.children))) > 0 {
      var fc *CodeNode = det.children[0];
      if  fc.vref == "templates" {
        var tplList *CodeNode = det.children[1];
        var i_1 int64 = 0;  
        for ; i_1 < int64(len(tplList.children)) ; i_1++ {
          tpl := tplList.children[i_1];
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
  var none *GoNullable = new(GoNullable); 
  return none;
}
func (this *RangerFlowParser) buildMacro (langOper *GoNullable, args *CodeNode, ctx *RangerAppWriterContext) *CodeNode {
  var subCtx *RangerAppWriterContext = ctx.fork();
  var wr *CodeWriter = CreateNew_CodeWriter();
  var lcc *LiveCompiler = CreateNew_LiveCompiler();
  lcc.langWriter.value = CreateNew_RangerRangerClassWriter();
  lcc.langWriter.has_value = true; /* detected as non-optional */
  lcc.langWriter.value.(IFACE_RangerGenericClassWriter).Get_compiler().value = lcc;
  lcc.langWriter.value.(IFACE_RangerGenericClassWriter).Get_compiler().has_value = true; /* detected as non-optional */
  subCtx.targetLangName = "ranger"; 
  subCtx.restartExpressionLevel();
  var macroNode *CodeNode = langOper.value.(*CodeNode);
  var cmdList *CodeNode = macroNode.getSecond();
  lcc.walkCommandList(cmdList, args, subCtx, wr);
  var lang_str string = wr.getCode();
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
  var cmds *GoNullable = new(GoNullable); 
  cmds.value = this.stdCommands.value;
  cmds.has_value = this.stdCommands.has_value;
  var some_matched bool = false;
  /** unused:  found_fn*/
  /** unused:  missed_args*/
  var ctx *RangerAppWriterContext = inCtx.fork();
  /** unused:  lang_name*/
  var expects_error bool = false;
  var err_cnt int64 = inCtx.getErrorCount();
  if  callArgs.hasBooleanProperty("error") {
    expects_error = true; 
  }
  var main_index int64 = 0;  
  for ; main_index < int64(len(cmds.value.(*CodeNode).children)) ; main_index++ {
    ch := cmds.value.(*CodeNode).children[main_index];
    var fc *CodeNode = ch.getFirst();
    var nameNode *CodeNode = ch.getSecond();
    var args *CodeNode = ch.getThird();
    if  callFnName.vref == fc.vref {
      /** unused:  line_index*/
      var callerArgCnt int64 = (int64(len(callArgs.children))) - 1;
      var fnArgCnt int64 = int64(len(args.children));
      var has_eval_ctx bool = false;
      var is_macro bool = false;
      if  nameNode.hasFlag("newcontext") {
        ctx = inCtx.fork(); 
        has_eval_ctx = true; 
      }
      var expanding_node bool = nameNode.hasFlag("expands");
      if  (callerArgCnt == fnArgCnt) || expanding_node {
        var details_list *CodeNode = ch.children[3];
        var langOper *GoNullable = new(GoNullable); 
        langOper = this.findLanguageOper(details_list, ctx);
        if  !langOper.has_value  {
          continue;
        }
        if  langOper.value.(*CodeNode).hasBooleanProperty("macro") {
          is_macro = true; 
        }
        var match *RangerArgMatch = CreateNew_RangerArgMatch();
        var last_walked int64 = 0;
        var i int64 = 0;  
        for ; i < int64(len(args.children)) ; i++ {
          arg := args.children[i];
          var callArg *CodeNode = callArgs.children[(i + 1)];
          if  arg.hasFlag("define") {
            var p IFACE_RangerAppParamDesc = CreateNew_RangerAppParamDesc();
            p.Set_name(callArg.vref); 
            p.Set_value_type(arg.value_type); 
            p.Get_node().value = callArg;
            p.Get_node().has_value = true; /* detected as non-optional */
            p.Get_nameNode().value = callArg;
            p.Get_nameNode().has_value = true; /* detected as non-optional */
            p.Set_is_optional(false); 
            p.Set_init_cnt(1); 
            ctx.defineVariable(p.Get_name(), p);
            callArg.hasParamDesc = true; 
            callArg.ownParamDesc.value = p;
            callArg.ownParamDesc.has_value = true; /* detected as non-optional */
            callArg.paramDesc.value = p;
            callArg.paramDesc.has_value = true; /* detected as non-optional */
            if  (int64(len(callArg.type_name))) == 0 {
              callArg.type_name = arg.type_name; 
              callArg.value_type = arg.value_type; 
            }
            callArg.eval_type = arg.value_type; 
            callArg.eval_type_name = arg.type_name; 
          }
          if  arg.hasFlag("ignore") {
            continue;
          }
          ctx.setInExpr();
          last_walked = i + 1; 
          this.WalkNode(callArg, ctx, wr);
          ctx.unsetInExpr();
        }
        if  expanding_node {
          var i2 int64 = 0;  
          for ; i2 < int64(len(callArgs.children)) ; i2++ {
            caCh := callArgs.children[i2];
            if  i2 > last_walked {
              ctx.setInExpr();
              this.WalkNode(caCh, ctx, wr);
              ctx.unsetInExpr();
            }
          }
        }
        var all_matched bool = match.matchArguments(args, callArgs, ctx, 1);
        if  all_matched {
          if  is_macro {
            var macroNode *CodeNode = this.buildMacro(langOper, callArgs, ctx);
            var arg_len int64 = int64(len(callArgs.children));
            for arg_len > 0 {
              callArgs.children = callArgs.children[:len(callArgs.children)-1]; 
              arg_len = arg_len - 1; 
            }
            callArgs.children = append(callArgs.children,macroNode); 
            macroNode.parent.value = callArgs;
            macroNode.parent.has_value = true; /* detected as non-optional */
            this.WalkNode(macroNode, ctx, wr);
            match.setRvBasedOn(nameNode, callArgs);
            return true;
          }
          if  nameNode.hasFlag("moves") {
            var moves_opt *GoNullable = new(GoNullable); 
            moves_opt = nameNode.getFlag("moves");
            var moves *CodeNode = moves_opt.value.(*CodeNode);
            var ann *GoNullable = new(GoNullable); 
            ann.value = moves.vref_annotation.value;
            ann.has_value = moves.vref_annotation.has_value;
            var from *CodeNode = ann.value.(*CodeNode).getFirst();
            var to *CodeNode = ann.value.(*CodeNode).getSecond();
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
                  if  activeFn.nameNode.value.(*CodeNode).ifNoTypeSetToEvalTypeOf(returnedValue) {
                  } else {
                    ctx.addError(returnedValue, "invalid return value type!!!");
                  }
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
                var pp_1 *GoNullable = new(GoNullable); 
                pp_1.value = returnedValue.paramDesc.value;
                pp_1.has_value = returnedValue.paramDesc.has_value;
                if  pp_1.has_value {
                  pp_1.value.(IFACE_RangerAppParamDesc).moveRefTo(callArgs, activeFn, ctx);
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
            arg_1 := args.children[arg_index];
            if  arg_1.has_vref_annotation {
              var anns *GoNullable = new(GoNullable); 
              anns.value = arg_1.vref_annotation.value;
              anns.has_value = arg_1.vref_annotation.has_value;
              var i_1 int64 = 0;  
              for ; i_1 < int64(len(anns.value.(*CodeNode).children)) ; i_1++ {
                ann_1 := anns.value.(*CodeNode).children[i_1];
                if  ann_1.vref == "mutates" {
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
    var cnt_now_1 int64 = ctx.getErrorCount();
    if  cnt_now_1 > err_cnt {
      ctx.addParserError(callArgs, strings.Join([]string{ (strings.Join([]string{ (strings.Join([]string{ "LANGUAGE_PARSER_ERROR: did not expect generated error, err counts : ",strconv.FormatInt(err_cnt, 10) }, ""))," : " }, "")),strconv.FormatInt(cnt_now_1, 10) }, ""));
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
    var e *RangerAppEnum = ee.value.(*RangerAppEnum);
    if  r_has_key_string_int64(e.values, enumName) {
      node.eval_type = 11; 
      node.eval_type_name = rootObjName; 
      node.int_value = (r_get_string_int64(e.values, enumName)).value.(int64); 
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
  if  ctx.isCapturing() {
    if  ctx.isVarDefined(rootObjName) {
      if  ctx.isLocalToCapture(rootObjName) == false {
        var captDef IFACE_RangerAppParamDesc = ctx.getVariableDef(rootObjName);
        var cd_1 *GoNullable = new(GoNullable); 
        cd_1 = ctx.getCurrentClass();
        cd_1.value.(*RangerAppClassDesc).capturedLocals = append(cd_1.value.(*RangerAppClassDesc).capturedLocals,captDef); 
        captDef.Set_is_captured(true); 
        ctx.addCapturedVariable(rootObjName);
      }
    }
  }
  if  (rootObjName == "this") || ctx.isVarDefined(rootObjName) {
    /** unused:  vDef2*/
    /** unused:  activeFn*/
    var vDef *GoNullable = new(GoNullable); 
    vDef = this.findParamDesc(node, ctx, wr);
    if  vDef.has_value {
      node.hasParamDesc = true; 
      node.ownParamDesc.value = vDef.value;
      node.ownParamDesc.has_value = false; 
      if node.ownParamDesc.value != nil {
        node.ownParamDesc.has_value = true
      }
      node.paramDesc.value = vDef.value;
      node.paramDesc.has_value = false; 
      if node.paramDesc.value != nil {
        node.paramDesc.has_value = true
      }
      vDef.value.(IFACE_RangerAppParamDesc).Set_ref_cnt(1 + vDef.value.(IFACE_RangerAppParamDesc).Get_ref_cnt()); 
      var vNameNode *GoNullable = new(GoNullable); 
      vNameNode.value = vDef.value.(IFACE_RangerAppParamDesc).Get_nameNode().value;
      vNameNode.has_value = vDef.value.(IFACE_RangerAppParamDesc).Get_nameNode().has_value;
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
  var udesc *GoNullable = new(GoNullable); 
  udesc = ctx.getCurrentClass();
  var desc *RangerAppClassDesc = udesc.value.(*RangerAppClassDesc);
  var m *GoNullable = new(GoNullable); 
  m.value = desc.constructor_fn.value;
  m.has_value = desc.constructor_fn.has_value;
  var subCtx *RangerAppWriterContext = m.value.(*RangerAppFunctionDesc).fnCtx.value.(*RangerAppWriterContext);
  subCtx.is_function = true; 
  subCtx.currentMethod.value = m.value;
  subCtx.currentMethod.has_value = false; 
  if subCtx.currentMethod.value != nil {
    subCtx.currentMethod.has_value = true
  }
  subCtx.setInMethod();
  var i int64 = 0;  
  for ; i < int64(len(m.value.(*RangerAppFunctionDesc).params)) ; i++ {
    v := m.value.(*RangerAppFunctionDesc).params[i];
    subCtx.defineVariable(v.Get_name(), v);
  }
  this.WalkNodeChildren(fnBody, subCtx, wr);
  subCtx.unsetInMethod();
  if  fnBody.didReturnAtIndex >= 0 {
    ctx.addError(node, "constructor should not return any values!");
  }
  var i_1 int64 = 0;  
  for ; i_1 < int64(len(subCtx.localVarNames)) ; i_1++ {
    n := subCtx.localVarNames[i_1];
    var p *GoNullable = new(GoNullable); 
    p = r_get_string_IFACE_RangerAppParamDesc(subCtx.localVariables, n);
    if  p.value.(IFACE_RangerAppParamDesc).Get_set_cnt() > 0 {
      var defNode *GoNullable = new(GoNullable); 
      defNode.value = p.value.(IFACE_RangerAppParamDesc).Get_node().value;
      defNode.has_value = p.value.(IFACE_RangerAppParamDesc).Get_node().has_value;
      defNode.value.(*CodeNode).setFlag("mutable");
      var nNode *GoNullable = new(GoNullable); 
      nNode.value = p.value.(IFACE_RangerAppParamDesc).Get_nameNode().value;
      nNode.has_value = p.value.(IFACE_RangerAppParamDesc).Get_nameNode().has_value;
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
  var root *RangerAppWriterContext = ctx.getRoot();
  var cn *CodeNode = tpl.getSecond();
  var newName *CodeNode = node.getSecond();
  var tplArgs *GoNullable = new(GoNullable); 
  tplArgs.value = cn.vref_annotation.value;
  tplArgs.has_value = cn.vref_annotation.has_value;
  var givenArgs *GoNullable = new(GoNullable); 
  givenArgs.value = newName.vref_annotation.value;
  givenArgs.has_value = newName.vref_annotation.has_value;
  var sign string = strings.Join([]string{ cn.vref,givenArgs.value.(*CodeNode).getCode() }, "");
  if  r_has_key_string_string(root.classSignatures, sign) {
    return;
  }
  fmt.Println( strings.Join([]string{ "could build generic class... ",cn.vref }, "") )
  var match *RangerArgMatch = CreateNew_RangerArgMatch();
  var i int64 = 0;  
  for ; i < int64(len(tplArgs.value.(*CodeNode).children)) ; i++ {
    arg := tplArgs.value.(*CodeNode).children[i];
    var given *CodeNode = givenArgs.value.(*CodeNode).children[i];
    fmt.Println( strings.Join([]string{ (strings.Join([]string{ (strings.Join([]string{ " setting ",arg.vref }, ""))," => " }, "")),given.vref }, "") )
    if  false == match.add(arg.vref, given.vref, ctx) {
      fmt.Println( "set failed!" )
    } else {
      fmt.Println( "set OK" )
    }
    fmt.Println( strings.Join([]string{ " T == ",match.getTypeName(arg.vref) }, "") )
  }
  fmt.Println( strings.Join([]string{ " T == ",match.getTypeName("T") }, "") )
  var newClassNode *CodeNode = tpl.rebuildWithType(match, false);
  fmt.Println( "build done" )
  fmt.Println( newClassNode.getCode() )
  var sign_2 string = strings.Join([]string{ cn.vref,givenArgs.value.(*CodeNode).getCode() }, "");
  fmt.Println( strings.Join([]string{ "signature ==> ",sign_2 }, "") )
  var cName *CodeNode = newClassNode.getSecond();
  var friendlyName string = root.createSignature(cn.vref, sign_2);
  fmt.Println( strings.Join([]string{ "class common name => ",friendlyName }, "") )
  cName.vref = friendlyName; 
  cName.has_vref_annotation = false; 
  fmt.Println( newClassNode.getCode() )
  this.WalkCollectMethods(newClassNode, ctx, wr);
  this.WalkNode(newClassNode, root, wr);
  fmt.Println( "the class collected the methods..." )
}
func (this *RangerFlowParser) cmdNew (node *CodeNode, ctx *RangerAppWriterContext, wr *CodeWriter) () {
  if  (int64(len(node.children))) < 2 {
    ctx.addError(node, "the new operator expects at lest two arguments");
    return;
  }
  if  (int64(len(node.children))) < 3 {
    var expr *CodeNode = CreateNew_CodeNode(node.code.value.(*SourceCode), node.sp, node.ep);
    expr.expression = true; 
    node.children = append(node.children,expr); 
  }
  var obj *CodeNode = node.getSecond();
  var params *CodeNode = node.getThird();
  var currC *GoNullable = new(GoNullable); 
  var b_template bool = false;
  var expects_error bool = false;
  var err_cnt int64 = ctx.getErrorCount();
  if  node.hasBooleanProperty("error") {
    expects_error = true; 
  }
  if  ctx.hasTemplateNode(obj.vref) {
    fmt.Println( " ==> template class" )
    b_template = true; 
    var tpl *CodeNode = ctx.findTemplateNode(obj.vref);
    if  obj.has_vref_annotation {
      fmt.Println( "generic class OK" )
      this.buildGenericClass(tpl, node, ctx, wr);
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
  var i int64 = 0;  
  for ; i < int64(len(params.children)) ; i++ {
    arg := params.children[i];
    ctx.setInExpr();
    this.WalkNode(arg, ctx, wr);
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
  node.clDesc.has_value = false; 
  if node.clDesc.value != nil {
    node.clDesc.has_value = true
  }
  var fnDescr *GoNullable = new(GoNullable); 
  fnDescr.value = currC.value.(*RangerAppClassDesc).constructor_fn.value;
  fnDescr.has_value = currC.value.(*RangerAppClassDesc).constructor_fn.has_value;
  if  fnDescr.has_value {
    var i_1 int64 = 0;  
    for ; i_1 < int64(len(fnDescr.value.(*RangerAppFunctionDesc).params)) ; i_1++ {
      param := fnDescr.value.(*RangerAppFunctionDesc).params[i_1];
      var has_default bool = false;
      if  param.Get_nameNode().value.(*CodeNode).hasFlag("default") {
        has_default = true; 
      }
      if  (int64(len(params.children))) <= i_1 {
        if  has_default {
          continue;
        }
        ctx.addError(node, "Missing arguments for function");
        ctx.addError(param.Get_nameNode().value.(*CodeNode), "To fix the previous error: Check original function declaration");
      }
      var argNode *CodeNode = params.children[i_1];
      if  false == this.areEqualTypes((param.Get_nameNode().value.(*CodeNode)), argNode, ctx) {
        ctx.addError(argNode, strings.Join([]string{ (strings.Join([]string{ "ERROR, invalid argument type for ",currC.value.(*RangerAppClassDesc).name }, ""))," constructor " }, ""));
      }
      var pNode *CodeNode = param.Get_nameNode().value.(*CodeNode);
      if  pNode.hasFlag("optional") {
        if  false == argNode.hasFlag("optional") {
          ctx.addError(node, strings.Join([]string{ "new parameter optionality does not match, expected optional parameter",argNode.getCode() }, ""));
        }
      }
      if  argNode.hasFlag("optional") {
        if  false == pNode.hasFlag("optional") {
          ctx.addError(node, strings.Join([]string{ "new parameter optionality does not match, expected non-optional, optional given",argNode.getCode() }, ""));
        }
      }
    }
  }
  if  expects_error {
    var cnt_now int64 = ctx.getErrorCount();
    if  cnt_now == err_cnt {
      ctx.addParserError(node, strings.Join([]string{ (strings.Join([]string{ (strings.Join([]string{ "LANGUAGE_PARSER_ERROR: expected generated error, err counts : ",strconv.FormatInt(err_cnt, 10) }, ""))," : " }, "")),strconv.FormatInt(cnt_now, 10) }, ""));
    }
  } else {
    var cnt_now_1 int64 = ctx.getErrorCount();
    if  cnt_now_1 > err_cnt {
      ctx.addParserError(node, strings.Join([]string{ (strings.Join([]string{ (strings.Join([]string{ "LANGUAGE_PARSER_ERROR: did not expect generated error, err counts : ",strconv.FormatInt(err_cnt, 10) }, ""))," : " }, "")),strconv.FormatInt(cnt_now_1, 10) }, ""));
    }
  }
}
func (this *RangerFlowParser) transformParams (list []*CodeNode, fnArgs []IFACE_RangerAppParamDesc, ctx *RangerAppWriterContext) []*CodeNode {
  var res []*CodeNode = make([]*CodeNode, 0);
  var i int64 = 0;  
  for ; i < int64(len(list)) ; i++ {
    item := list[i];
    if  item.is_block_node {
      /** unused:  newNode*/
      var fnArg IFACE_RangerAppParamDesc = fnArgs[i];
      var nn *GoNullable = new(GoNullable); 
      nn.value = fnArg.Get_nameNode().value;
      nn.has_value = fnArg.Get_nameNode().has_value;
      if  !nn.value.(*CodeNode).expression_value.has_value  {
        ctx.addError(item, "Parameter is not lambda expression");
        break;
      }
      var fnDef *CodeNode = nn.value.(*CodeNode).expression_value.value.(*CodeNode);
      var match *RangerArgMatch = CreateNew_RangerArgMatch();
      var copyOf *CodeNode = fnDef.rebuildWithType(match, false);
      var fc *CodeNode = copyOf.children[0];
      fc.vref = "fun"; 
      var itemCopy *CodeNode = item.rebuildWithType(match, false);
      copyOf.children = append(copyOf.children,itemCopy); 
      var cnt int64 = int64(len(item.children));
      for cnt > 0 {
        item.children = item.children[:len(item.children)-1]; 
        cnt = cnt - 1; 
      }
      var i_1 int64 = 0;  
      for ; i_1 < int64(len(copyOf.children)) ; i_1++ {
        ch := copyOf.children[i_1];
        item.children = append(item.children,ch); 
      }
    }
    res = append(res,item); 
  }
  return res;
}
func (this *RangerFlowParser) cmdLocalCall (node *CodeNode, ctx *RangerAppWriterContext, wr *CodeWriter) bool {
  var fnNode *CodeNode = node.getFirst();
  var udesc *GoNullable = new(GoNullable); 
  udesc = ctx.getCurrentClass();
  var desc *RangerAppClassDesc = udesc.value.(*RangerAppClassDesc);
  var expects_error bool = false;
  var err_cnt int64 = ctx.getErrorCount();
  if  node.hasBooleanProperty("error") {
    expects_error = true; 
  }
  if  (int64(len(fnNode.ns))) > 1 {
    var rootName string = fnNode.ns[0];
    var vDef2 IFACE_RangerAppParamDesc = ctx.getVariableDef(rootName);
    if  ((rootName != "this") && (vDef2.Get_init_cnt() == 0)) && (vDef2.Get_set_cnt() == 0) {
      if  (vDef2.Get_is_class_variable() == false) && (ctx.isDefinedClass(rootName) == false) {
        ctx.addError(node, strings.Join([]string{ "Call to uninitialized object ",rootName }, ""));
      }
    }
    var vFnDef *GoNullable = new(GoNullable); 
    vFnDef = this.findFunctionDesc(fnNode, ctx, wr);
    if  vFnDef.has_value {
      vFnDef.value.(*RangerAppFunctionDesc).ref_cnt = vFnDef.value.(*RangerAppFunctionDesc).ref_cnt + 1; 
      var subCtx *RangerAppWriterContext = ctx.fork();
      node.hasFnCall = true; 
      node.fnDesc.value = vFnDef.value;
      node.fnDesc.has_value = false; 
      if node.fnDesc.value != nil {
        node.fnDesc.has_value = true
      }
      var p IFACE_RangerAppParamDesc = CreateNew_RangerAppParamDesc();
      p.Set_name(fnNode.vref); 
      p.Set_value_type(fnNode.value_type); 
      p.Get_node().value = fnNode;
      p.Get_node().has_value = true; /* detected as non-optional */
      p.Get_nameNode().value = fnNode;
      p.Get_nameNode().has_value = true; /* detected as non-optional */
      p.Set_varType(10); 
      subCtx.defineVariable(p.Get_name(), p);
      this.WalkNode(fnNode, subCtx, wr);
      var callParams *CodeNode = node.children[1];
      var nodeList []*CodeNode = this.transformParams(callParams.children, vFnDef.value.(*RangerAppFunctionDesc).params, subCtx);
      var i int64 = 0;  
      for ; i < int64(len(nodeList)) ; i++ {
        arg := nodeList[i];
        ctx.setInExpr();
        this.WalkNode(arg, subCtx, wr);
        ctx.unsetInExpr();
        var fnArg IFACE_RangerAppParamDesc = vFnDef.value.(*RangerAppFunctionDesc).params[i];
        var callArgP *GoNullable = new(GoNullable); 
        callArgP.value = arg.paramDesc.value;
        callArgP.has_value = arg.paramDesc.has_value;
        if  callArgP.has_value {
          callArgP.value.(IFACE_RangerAppParamDesc).moveRefTo(node, fnArg, ctx);
        }
      }
      var cp_len int64 = int64(len(callParams.children));
      if  cp_len > (int64(len(vFnDef.value.(*RangerAppFunctionDesc).params))) {
        var lastCallParam *CodeNode = callParams.children[(cp_len - 1)];
        ctx.addError(lastCallParam, "Too many arguments for function");
        ctx.addError(vFnDef.value.(*RangerAppFunctionDesc).nameNode.value.(*CodeNode), "NOTE: To fix the previous error: Check original function declaration which was");
      }
      var i_1 int64 = 0;  
      for ; i_1 < int64(len(vFnDef.value.(*RangerAppFunctionDesc).params)) ; i_1++ {
        param := vFnDef.value.(*RangerAppFunctionDesc).params[i_1];
        if  (int64(len(callParams.children))) <= i_1 {
          if  param.Get_nameNode().value.(*CodeNode).hasFlag("default") {
            continue;
          }
          ctx.addError(node, "Missing arguments for function");
          ctx.addError(param.Get_nameNode().value.(*CodeNode), "NOTE: To fix the previous error: Check original function declaration which was");
          break;
        }
        var argNode *CodeNode = callParams.children[i_1];
        if  false == this.areEqualTypes((param.Get_nameNode().value.(*CodeNode)), argNode, ctx) {
          ctx.addError(argNode, strings.Join([]string{ "ERROR, invalid argument type for method ",vFnDef.value.(*RangerAppFunctionDesc).name }, ""));
        }
        var pNode *CodeNode = param.Get_nameNode().value.(*CodeNode);
        if  pNode.hasFlag("optional") {
          if  false == argNode.hasFlag("optional") {
            ctx.addError(node, strings.Join([]string{ "function parameter optionality does not match, consider making parameter optional ",argNode.getCode() }, ""));
          }
        }
        if  argNode.hasFlag("optional") {
          if  false == pNode.hasFlag("optional") {
            ctx.addError(node, strings.Join([]string{ "function parameter optionality does not match, consider unwrapping ",argNode.getCode() }, ""));
          }
        }
      }
      var nn *GoNullable = new(GoNullable); 
      nn.value = vFnDef.value.(*RangerAppFunctionDesc).nameNode.value;
      nn.has_value = vFnDef.value.(*RangerAppFunctionDesc).nameNode.has_value;
      node.eval_type = nn.value.(*CodeNode).typeNameAsType(ctx); 
      node.eval_type_name = nn.value.(*CodeNode).type_name; 
      node.eval_array_type = nn.value.(*CodeNode).array_type; 
      node.eval_key_type = nn.value.(*CodeNode).key_type; 
      if  nn.value.(*CodeNode).hasFlag("optional") {
        node.setFlag("optional");
      }
      if  expects_error {
        var cnt_now int64 = ctx.getErrorCount();
        if  cnt_now == err_cnt {
          ctx.addParserError(node, strings.Join([]string{ (strings.Join([]string{ (strings.Join([]string{ "LANGUAGE_PARSER_ERROR: expected generated error, err counts : ",strconv.FormatInt(err_cnt, 10) }, ""))," : " }, "")),strconv.FormatInt(cnt_now, 10) }, ""));
        }
      } else {
        var cnt_now_1 int64 = ctx.getErrorCount();
        if  cnt_now_1 > err_cnt {
          ctx.addParserError(node, strings.Join([]string{ (strings.Join([]string{ (strings.Join([]string{ "LANGUAGE_PARSER_ERROR: did not expect generated error, err counts : ",strconv.FormatInt(err_cnt, 10) }, ""))," : " }, "")),strconv.FormatInt(cnt_now_1, 10) }, ""));
        }
      }
      return true;
    } else {
      ctx.addError(node, "Called Object or Property was not defined");
    }
  }
  if  desc.hasMethod(fnNode.vref) {
    var fnDescr *GoNullable = new(GoNullable); 
    fnDescr = desc.findMethod(fnNode.vref);
    var subCtx_1 *RangerAppWriterContext = ctx.fork();
    node.hasFnCall = true; 
    node.fnDesc.value = fnDescr.value;
    node.fnDesc.has_value = false; 
    if node.fnDesc.value != nil {
      node.fnDesc.has_value = true
    }
    var p_1 IFACE_RangerAppParamDesc = CreateNew_RangerAppParamDesc();
    p_1.Set_name(fnNode.vref); 
    p_1.Set_value_type(fnNode.value_type); 
    p_1.Get_node().value = fnNode;
    p_1.Get_node().has_value = true; /* detected as non-optional */
    p_1.Get_nameNode().value = fnNode;
    p_1.Get_nameNode().has_value = true; /* detected as non-optional */
    p_1.Set_varType(10); 
    subCtx_1.defineVariable(p_1.Get_name(), p_1);
    this.WriteThisVar(fnNode, subCtx_1, wr);
    this.WalkNode(fnNode, subCtx_1, wr);
    var i_2 int64 = 0;  
    for ; i_2 < int64(len(node.children)) ; i_2++ {
      arg_1 := node.children[i_2];
      if  i_2 < 1 {
        continue;
      }
      ctx.setInExpr();
      this.WalkNode(arg_1, subCtx_1, wr);
      ctx.unsetInExpr();
    }
    var i_3 int64 = 0;  
    for ; i_3 < int64(len(fnDescr.value.(*RangerAppFunctionDesc).params)) ; i_3++ {
      param_1 := fnDescr.value.(*RangerAppFunctionDesc).params[i_3];
      if  (int64(len(node.children))) <= (i_3 + 1) {
        ctx.addError(node, "Argument was not defined");
        break;
      }
      var argNode_1 *CodeNode = node.children[(i_3 + 1)];
      if  false == this.areEqualTypes((param_1.Get_nameNode().value.(*CodeNode)), argNode_1, ctx) {
        ctx.addError(argNode_1, strings.Join([]string{ (strings.Join([]string{ (strings.Join([]string{ "ERROR, invalid argument type for ",desc.name }, ""))," method " }, "")),fnDescr.value.(*RangerAppFunctionDesc).name }, ""));
      }
    }
    var nn_1 *GoNullable = new(GoNullable); 
    nn_1.value = fnDescr.value.(*RangerAppFunctionDesc).nameNode.value;
    nn_1.has_value = fnDescr.value.(*RangerAppFunctionDesc).nameNode.has_value;
    nn_1.value.(*CodeNode).defineNodeTypeTo(node, ctx);
    if  expects_error {
      var cnt_now_2 int64 = ctx.getErrorCount();
      if  cnt_now_2 == err_cnt {
        ctx.addParserError(node, strings.Join([]string{ (strings.Join([]string{ (strings.Join([]string{ "LANGUAGE_PARSER_ERROR: expected generated error, err counts : ",strconv.FormatInt(err_cnt, 10) }, ""))," : " }, "")),strconv.FormatInt(cnt_now_2, 10) }, ""));
      }
    } else {
      var cnt_now_3 int64 = ctx.getErrorCount();
      if  cnt_now_3 > err_cnt {
        ctx.addParserError(node, strings.Join([]string{ (strings.Join([]string{ (strings.Join([]string{ "LANGUAGE_PARSER_ERROR: did not expect generated error, err counts : ",strconv.FormatInt(err_cnt, 10) }, ""))," : " }, "")),strconv.FormatInt(cnt_now_3, 10) }, ""));
      }
    }
    return true;
  }
  if  ctx.isVarDefined(fnNode.vref) {
    var d IFACE_RangerAppParamDesc = ctx.getVariableDef(fnNode.vref);
    d.Set_ref_cnt(1 + d.Get_ref_cnt()); 
    if  d.Get_nameNode().value.(*CodeNode).value_type == 15 {
      /** unused:  lambdaDefArgs*/
      var callParams_1 *CodeNode = node.children[1];
      var i_4 int64 = 0;  
      for ; i_4 < int64(len(callParams_1.children)) ; i_4++ {
        arg_2 := callParams_1.children[i_4];
        ctx.setInExpr();
        this.WalkNode(arg_2, ctx, wr);
        ctx.unsetInExpr();
      }
      var lambdaDef *CodeNode = d.Get_nameNode().value.(*CodeNode).expression_value.value.(*CodeNode).children[0];
      /** unused:  lambdaArgs*/
      node.has_lambda_call = true; 
      node.eval_type = lambdaDef.typeNameAsType(ctx); 
      node.eval_type_name = lambdaDef.type_name; 
      node.eval_array_type = lambdaDef.array_type; 
      node.eval_key_type = lambdaDef.key_type; 
      return true;
    }
  }
  ctx.addError(node, strings.Join([]string{ (strings.Join([]string{ (strings.Join([]string{ "ERROR, could not find class ",desc.name }, ""))," method " }, "")),fnNode.vref }, ""));
  ctx.addError(node, strings.Join([]string{ "definition : ",node.getCode() }, ""));
  if  expects_error {
    var cnt_now_4 int64 = ctx.getErrorCount();
    if  cnt_now_4 == err_cnt {
      ctx.addParserError(node, strings.Join([]string{ (strings.Join([]string{ (strings.Join([]string{ "LANGUAGE_PARSER_ERROR: expected generated error, err counts : ",strconv.FormatInt(err_cnt, 10) }, ""))," : " }, "")),strconv.FormatInt(cnt_now_4, 10) }, ""));
    }
  } else {
    var cnt_now_5 int64 = ctx.getErrorCount();
    if  cnt_now_5 > err_cnt {
      ctx.addParserError(node, strings.Join([]string{ (strings.Join([]string{ (strings.Join([]string{ "LANGUAGE_PARSER_ERROR: did not expect generated error, err counts : ",strconv.FormatInt(err_cnt, 10) }, ""))," : " }, "")),strconv.FormatInt(cnt_now_5, 10) }, ""));
    }
  }
  return false;
}
func (this *RangerFlowParser) cmdReturn (node *CodeNode, ctx *RangerAppWriterContext, wr *CodeWriter) () {
  node.has_operator = true; 
  node.op_index = 5; 
  fmt.Println( "cmdReturn" )
  if  (int64(len(node.children))) > 1 {
    var fc *CodeNode = node.getSecond();
    if  fc.vref == "_" {
    } else {
      ctx.setInExpr();
      this.WalkNode(fc, ctx, wr);
      ctx.unsetInExpr();
      /** unused:  activeFn*/
      if  fc.hasParamDesc {
        fc.paramDesc.value.(IFACE_RangerAppParamDesc).Set_return_cnt(1 + fc.paramDesc.value.(IFACE_RangerAppParamDesc).Get_return_cnt()); 
        fc.paramDesc.value.(IFACE_RangerAppParamDesc).Set_ref_cnt(1 + fc.paramDesc.value.(IFACE_RangerAppParamDesc).Get_ref_cnt()); 
      }
      var currFn *RangerAppFunctionDesc = ctx.getCurrentMethod();
      if  fc.hasParamDesc {
        fmt.Println( "cmdReturn move-->" )
        var pp *GoNullable = new(GoNullable); 
        pp.value = fc.paramDesc.value;
        pp.has_value = fc.paramDesc.has_value;
        pp.value.(IFACE_RangerAppParamDesc).moveRefTo(node, currFn, ctx);
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
  if  node.hasBooleanProperty("trait") {
    return;
  }
  var cn *CodeNode = node.children[1];
  var cBody *CodeNode = node.children[2];
  var desc *RangerAppClassDesc = ctx.findClass(cn.vref);
  if  cn.has_vref_annotation {
    fmt.Println( "--> generic class, not processed" )
    return;
  }
  var subCtx *RangerAppWriterContext = desc.ctx.value.(*RangerAppWriterContext);
  subCtx.setCurrentClass(desc);
  subCtx.class_level_context = true; 
  var i int64 = 0;  
  for ; i < int64(len(desc.variables)) ; i++ {
    p := desc.variables[i];
    var vNode *GoNullable = new(GoNullable); 
    vNode.value = p.Get_node().value;
    vNode.has_value = p.Get_node().has_value;
    if  (int64(len(vNode.value.(*CodeNode).children))) > 2 {
      var value *CodeNode = vNode.value.(*CodeNode).children[2];
      ctx.setInExpr();
      this.WalkNode(value, ctx, wr);
      ctx.unsetInExpr();
    }
    p.Set_is_class_variable(true); 
    p.Get_nameNode().value.(*CodeNode).eval_type = p.Get_nameNode().value.(*CodeNode).typeNameAsType(ctx); 
    p.Get_nameNode().value.(*CodeNode).eval_type_name = p.Get_nameNode().value.(*CodeNode).type_name; 
  }
  var i_1 int64 = 0;  
  for ; i_1 < int64(len(cBody.children)) ; i_1++ {
    fNode := cBody.children[i_1];
    if  fNode.isFirstVref("fn") || fNode.isFirstVref("Constructor") {
      this.WalkNode(fNode, subCtx, wr);
    }
  }
  var i_2 int64 = 0;  
  for ; i_2 < int64(len(cBody.children)) ; i_2++ {
    fNode_1 := cBody.children[i_2];
    if  fNode_1.isFirstVref("fn") || fNode_1.isFirstVref("PublicMethod") {
      this.WalkNode(fNode_1, subCtx, wr);
    }
  }
  var staticCtx *RangerAppWriterContext = ctx.fork();
  staticCtx.setCurrentClass(desc);
  var i_3 int64 = 0;  
  for ; i_3 < int64(len(cBody.children)) ; i_3++ {
    fNode_2 := cBody.children[i_3];
    if  fNode_2.isFirstVref("sfn") || fNode_2.isFirstVref("StaticMethod") {
      this.WalkNode(fNode_2, staticCtx, wr);
    }
  }
  node.hasClassDescription = true; 
  node.clDesc.value = desc;
  node.clDesc.has_value = true; /* detected as non-optional */
  desc.classNode.value = node;
  desc.classNode.has_value = true; /* detected as non-optional */
}
func (this *RangerFlowParser) EnterMethod (node *CodeNode, ctx *RangerAppWriterContext, wr *CodeWriter) () {
  this.shouldHaveChildCnt(4, node, ctx, "Method expexts four arguments");
  var cn *CodeNode = node.children[1];
  var fnBody *CodeNode = node.children[3];
  var udesc *GoNullable = new(GoNullable); 
  udesc = ctx.getCurrentClass();
  var desc *RangerAppClassDesc = udesc.value.(*RangerAppClassDesc);
  var um *GoNullable = new(GoNullable); 
  um = desc.findMethod(cn.vref);
  var m *RangerAppFunctionDesc = um.value.(*RangerAppFunctionDesc);
  var subCtx *RangerAppWriterContext = m.fnCtx.value.(*RangerAppWriterContext);
  subCtx.function_level_context = true; 
  subCtx.currentMethod.value = m;
  subCtx.currentMethod.has_value = true; /* detected as non-optional */
  var i int64 = 0;  
  for ; i < int64(len(m.params)) ; i++ {
    v := m.params[i];
    v.Get_nameNode().value.(*CodeNode).eval_type = v.Get_nameNode().value.(*CodeNode).typeNameAsType(subCtx); 
    v.Get_nameNode().value.(*CodeNode).eval_type_name = v.Get_nameNode().value.(*CodeNode).type_name; 
    ctx.hadValidType(v.Get_nameNode().value.(*CodeNode));
  }
  subCtx.setInMethod();
  this.WalkNodeChildren(fnBody, subCtx, wr);
  subCtx.unsetInMethod();
  if  fnBody.didReturnAtIndex == -1 {
    if  cn.type_name != "void" {
      ctx.addError(node, "Function does not return any values!");
    }
  }
  var i_1 int64 = 0;  
  for ; i_1 < int64(len(subCtx.localVarNames)) ; i_1++ {
    n := subCtx.localVarNames[i_1];
    var p *GoNullable = new(GoNullable); 
    p = r_get_string_IFACE_RangerAppParamDesc(subCtx.localVariables, n);
    if  p.value.(IFACE_RangerAppParamDesc).Get_set_cnt() > 0 {
      var defNode *GoNullable = new(GoNullable); 
      defNode.value = p.value.(IFACE_RangerAppParamDesc).Get_node().value;
      defNode.has_value = p.value.(IFACE_RangerAppParamDesc).Get_node().has_value;
      defNode.value.(*CodeNode).setFlag("mutable");
      var nNode *GoNullable = new(GoNullable); 
      nNode.value = p.value.(IFACE_RangerAppParamDesc).Get_nameNode().value;
      nNode.has_value = p.value.(IFACE_RangerAppParamDesc).Get_nameNode().has_value;
      nNode.value.(*CodeNode).setFlag("mutable");
    }
  }
}
func (this *RangerFlowParser) EnterStaticMethod (node *CodeNode, ctx *RangerAppWriterContext, wr *CodeWriter) () {
  this.shouldHaveChildCnt(4, node, ctx, "Method expexts four arguments");
  var cn *CodeNode = node.children[1];
  var fnBody *CodeNode = node.children[3];
  var udesc *GoNullable = new(GoNullable); 
  udesc = ctx.getCurrentClass();
  var desc *RangerAppClassDesc = udesc.value.(*RangerAppClassDesc);
  var subCtx *RangerAppWriterContext = ctx.fork();
  subCtx.is_function = true; 
  var um *GoNullable = new(GoNullable); 
  um = desc.findStaticMethod(cn.vref);
  var m *RangerAppFunctionDesc = um.value.(*RangerAppFunctionDesc);
  subCtx.currentMethod.value = m;
  subCtx.currentMethod.has_value = true; /* detected as non-optional */
  subCtx.in_static_method = true; 
  m.fnCtx.value = subCtx;
  m.fnCtx.has_value = true; /* detected as non-optional */
  if  cn.hasFlag("weak") {
    m.changeStrength(0, 1, node);
  } else {
    m.changeStrength(1, 1, node);
  }
  subCtx.setInMethod();
  var i int64 = 0;  
  for ; i < int64(len(m.params)) ; i++ {
    v := m.params[i];
    subCtx.defineVariable(v.Get_name(), v);
    v.Get_nameNode().value.(*CodeNode).eval_type = v.Get_nameNode().value.(*CodeNode).typeNameAsType(ctx); 
    v.Get_nameNode().value.(*CodeNode).eval_type_name = v.Get_nameNode().value.(*CodeNode).type_name; 
  }
  this.WalkNodeChildren(fnBody, subCtx, wr);
  subCtx.unsetInMethod();
  subCtx.in_static_method = false; 
  subCtx.function_level_context = true; 
  if  fnBody.didReturnAtIndex == -1 {
    if  cn.type_name != "void" {
      ctx.addError(node, "Function does not return any values!");
    }
  }
  var i_1 int64 = 0;  
  for ; i_1 < int64(len(subCtx.localVarNames)) ; i_1++ {
    n := subCtx.localVarNames[i_1];
    var p *GoNullable = new(GoNullable); 
    p = r_get_string_IFACE_RangerAppParamDesc(subCtx.localVariables, n);
    if  p.value.(IFACE_RangerAppParamDesc).Get_set_cnt() > 0 {
      var defNode *GoNullable = new(GoNullable); 
      defNode.value = p.value.(IFACE_RangerAppParamDesc).Get_node().value;
      defNode.has_value = p.value.(IFACE_RangerAppParamDesc).Get_node().has_value;
      defNode.value.(*CodeNode).setFlag("mutable");
      var nNode *GoNullable = new(GoNullable); 
      nNode.value = p.value.(IFACE_RangerAppParamDesc).Get_nameNode().value;
      nNode.has_value = p.value.(IFACE_RangerAppParamDesc).Get_nameNode().has_value;
      nNode.value.(*CodeNode).setFlag("mutable");
    }
  }
}
func (this *RangerFlowParser) EnterLambdaMethod (node *CodeNode, ctx *RangerAppWriterContext, wr *CodeWriter) () {
  var args *CodeNode = node.children[1];
  var body *CodeNode = node.children[2];
  var subCtx *RangerAppWriterContext = ctx.fork();
  subCtx.is_capturing = true; 
  var cn *CodeNode = node.children[0];
  var m *RangerAppFunctionDesc = CreateNew_RangerAppFunctionDesc();
  m.name = "lambda"; 
  m.node.value = node;
  m.node.has_value = true; /* detected as non-optional */
  m.nameNode.value = node.children[0];
  m.nameNode.has_value = true; /* detected as non-optional */
  subCtx.is_function = true; 
  subCtx.currentMethod.value = m;
  subCtx.currentMethod.has_value = true; /* detected as non-optional */
  if  cn.hasFlag("weak") {
    m.changeStrength(0, 1, node);
  } else {
    m.changeStrength(1, 1, node);
  }
  m.fnBody.value = node.children[2];
  m.fnBody.has_value = true; /* detected as non-optional */
  var ii int64 = 0;  
  for ; ii < int64(len(args.children)) ; ii++ {
    arg := args.children[ii];
    var p2 IFACE_RangerAppParamDesc = CreateNew_RangerAppParamDesc();
    p2.Set_name(arg.vref); 
    p2.Set_value_type(arg.value_type); 
    p2.Get_node().value = arg;
    p2.Get_node().has_value = true; /* detected as non-optional */
    p2.Get_nameNode().value = arg;
    p2.Get_nameNode().has_value = true; /* detected as non-optional */
    p2.Set_init_cnt(1); 
    p2.Set_refType(1); 
    p2.Set_initRefType(1); 
    if  args.hasBooleanProperty("strong") {
      p2.Set_refType(2); 
      p2.Set_initRefType(2); 
    }
    p2.Set_varType(4); 
    m.params = append(m.params,p2); 
    arg.hasParamDesc = true; 
    arg.paramDesc.value = p2;
    arg.paramDesc.has_value = true; /* detected as non-optional */
    arg.eval_type = arg.value_type; 
    arg.eval_type_name = arg.type_name; 
    if  arg.hasFlag("strong") {
      p2.changeStrength(1, 1, p2.Get_nameNode().value.(*CodeNode));
    } else {
      arg.setFlag("lives");
      p2.changeStrength(0, 1, p2.Get_nameNode().value.(*CodeNode));
    }
    subCtx.defineVariable(p2.Get_name(), p2);
  }
  /** unused:  cnt*/
  var i int64 = 0;  
  for ; i < int64(len(body.children)) ; i++ {
    item := body.children[i];
    this.WalkNode(item, subCtx, wr);
    if  i == ((int64(len(body.children))) - 1) {
      if  (int64(len(item.children))) > 0 {
        var fc *CodeNode = item.getFirst();
        if  fc.vref != "return" {
          cn.type_name = "void"; 
        }
      }
    }
  }
  node.has_lambda = true; 
  node.lambda_ctx.value = subCtx;
  node.lambda_ctx.has_value = true; /* detected as non-optional */
  node.eval_type = 15; 
  node.eval_function.value = node;
  node.eval_function.has_value = true; /* detected as non-optional */
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
    var cn *CodeNode = node.children[1];
    var p IFACE_RangerAppParamDesc = CreateNew_RangerAppParamDesc();
    var defaultArg *GoNullable = new(GoNullable); 
    if  (int64(len(node.children))) == 2 {
      if  (cn.value_type != 6) && (cn.value_type != 7) {
        cn.setFlag("optional");
      }
    }
    if  (int64(len(cn.vref))) == 0 {
      ctx.addError(node, "invalid variable definition");
    }
    if  cn.hasFlag("weak") {
      p.changeStrength(0, 1, node);
    } else {
      p.changeStrength(1, 1, node);
    }
    node.hasVarDef = true; 
    if  cn.value_type == 15 {
      fmt.Println( "Expression node..." )
    }
    if  (int64(len(node.children))) > 2 {
      p.Set_init_cnt(1); 
      p.Get_def_value().value = node.children[2];
      p.Get_def_value().has_value = true; /* detected as non-optional */
      p.Set_is_optional(false); 
      defaultArg.value = node.children[2];
      defaultArg.has_value = true; /* detected as non-optional */
      ctx.setInExpr();
      this.WalkNode(defaultArg.value.(*CodeNode), ctx, wr);
      ctx.unsetInExpr();
      if  defaultArg.value.(*CodeNode).hasFlag("optional") {
        cn.setFlag("optional");
      }
      if  defaultArg.value.(*CodeNode).eval_type == 6 {
        node.op_index = 1; 
      }
      if  cn.value_type == 11 {
        cn.eval_type_name = defaultArg.value.(*CodeNode).ns[0]; 
      }
      if  cn.value_type == 12 {
        if  (defaultArg.value.(*CodeNode).eval_type != 3) && (defaultArg.value.(*CodeNode).eval_type != 12) {
          ctx.addError(defaultArg.value.(*CodeNode), strings.Join([]string{ "Char should be assigned char or integer value --> ",defaultArg.value.(*CodeNode).getCode() }, ""));
        } else {
          defaultArg.value.(*CodeNode).eval_type = 12; 
        }
      }
    } else {
      if  ((cn.value_type != 7) && (cn.value_type != 6)) && (false == cn.hasFlag("optional")) {
        cn.setFlag("optional");
      }
    }
    if  (int64(len(node.children))) > 2 {
      if  ((int64(len(cn.type_name))) == 0) && ((int64(len(cn.array_type))) == 0) {
        var nodeValue *CodeNode = node.children[2];
        if  nodeValue.eval_type == 15 {
          if  !node.expression_value.has_value  {
            var copyOf *CodeNode = nodeValue.rebuildWithType(CreateNew_RangerArgMatch(), false);
            copyOf.children = copyOf.children[:len(copyOf.children)-1]; 
            cn.expression_value.value = copyOf;
            cn.expression_value.has_value = true; /* detected as non-optional */
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
    p.Set_name(cn.vref); 
    if  p.Get_value_type() == 0 {
      if  (0 == (int64(len(cn.type_name)))) && (defaultArg.has_value) {
        p.Set_value_type(defaultArg.value.(*CodeNode).eval_type); 
        cn.type_name = defaultArg.value.(*CodeNode).eval_type_name; 
        cn.eval_type_name = defaultArg.value.(*CodeNode).eval_type_name; 
        cn.value_type = defaultArg.value.(*CodeNode).eval_type; 
      }
    } else {
      p.Set_value_type(cn.value_type); 
    }
    p.Get_node().value = node;
    p.Get_node().has_value = true; /* detected as non-optional */
    p.Get_nameNode().value = cn;
    p.Get_nameNode().has_value = true; /* detected as non-optional */
    p.Set_varType(5); 
    if  cn.has_vref_annotation {
      ctx.log(node, "ann", "At a variable -> Found has_vref_annotation annotated reference ");
      var ann *GoNullable = new(GoNullable); 
      ann.value = cn.vref_annotation.value;
      ann.has_value = cn.vref_annotation.has_value;
      if  (int64(len(ann.value.(*CodeNode).children))) > 0 {
        var fc *CodeNode = ann.value.(*CodeNode).children[0];
        ctx.log(node, "ann", strings.Join([]string{ (strings.Join([]string{ (strings.Join([]string{ "value of first annotation ",fc.vref }, ""))," and variable name " }, "")),cn.vref }, ""));
      }
    }
    if  cn.has_type_annotation {
      ctx.log(node, "ann", "At a variable -> Found annotated reference ");
      var ann_1 *GoNullable = new(GoNullable); 
      ann_1.value = cn.type_annotation.value;
      ann_1.has_value = cn.type_annotation.has_value;
      if  (int64(len(ann_1.value.(*CodeNode).children))) > 0 {
        var fc_1 *CodeNode = ann_1.value.(*CodeNode).children[0];
        ctx.log(node, "ann", strings.Join([]string{ (strings.Join([]string{ (strings.Join([]string{ "value of first annotation ",fc_1.vref }, ""))," and variable name " }, "")),cn.vref }, ""));
      }
    }
    cn.hasParamDesc = true; 
    cn.ownParamDesc.value = p;
    cn.ownParamDesc.has_value = true; /* detected as non-optional */
    cn.paramDesc.value = p;
    cn.paramDesc.has_value = true; /* detected as non-optional */
    node.hasParamDesc = true; 
    node.paramDesc.value = p;
    node.paramDesc.has_value = true; /* detected as non-optional */
    cn.eval_type = cn.typeNameAsType(ctx); 
    cn.eval_type_name = cn.type_name; 
    if  (int64(len(node.children))) > 2 {
      if  cn.eval_type != defaultArg.value.(*CodeNode).eval_type {
        if  ((cn.eval_type == 12) && (defaultArg.value.(*CodeNode).eval_type == 3)) || ((cn.eval_type == 3) && (defaultArg.value.(*CodeNode).eval_type == 12)) {
        } else {
          ctx.addError(node, strings.Join([]string{ (strings.Join([]string{ (strings.Join([]string{ "Variable was assigned an incompatible type. Types were ",strconv.FormatInt(cn.eval_type, 10) }, ""))," vs " }, "")),strconv.FormatInt(defaultArg.value.(*CodeNode).eval_type, 10) }, ""));
        }
      }
    } else {
      p.Set_is_optional(true); 
    }
    ctx.defineVariable(p.Get_name(), p);
    this.DefineVar(node, ctx, wr);
    if  (int64(len(node.children))) > 2 {
      this.shouldBeEqualTypes(cn, p.Get_def_value().value.(*CodeNode), ctx, "Variable was assigned an incompatible type.");
    }
  } else {
    var cn_1 *CodeNode = node.children[1];
    cn_1.eval_type = cn_1.typeNameAsType(ctx); 
    cn_1.eval_type_name = cn_1.type_name; 
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
    var i int64 = 0;  
    for ; i < int64(len(node.children)) ; i++ {
      item := node.children[i];
      item.parent.value = node;
      item.parent.has_value = true; /* detected as non-optional */
      this.WalkNode(item, ctx, wr);
      node.copyEvalResFrom(item);
    }
  }
}
func (this *RangerFlowParser) matchNode (node *CodeNode, ctx *RangerAppWriterContext, wr *CodeWriter) bool {
  if  0 == (int64(len(node.children))) {
    return false;
  }
  var fc *CodeNode = node.getFirst();
  this.stdCommands.value = ctx.getStdCommands();
  this.stdCommands.has_value = true; /* detected as non-optional */
  var i int64 = 0;  
  for ; i < int64(len(this.stdCommands.value.(*CodeNode).children)) ; i++ {
    cmd := this.stdCommands.value.(*CodeNode).children[i];
    var cmdName *CodeNode = cmd.getFirst();
    if  cmdName.vref == fc.vref {
      this.stdParamMatch(node, ctx, wr);
      if  node.parent.has_value {
        node.parent.value.(*CodeNode).copyEvalResFrom(node);
      }
      return true;
    }
  }
  return false;
}
func (this *RangerFlowParser) StartWalk (node *CodeNode, ctx *RangerAppWriterContext, wr *CodeWriter) () {
  this.WalkNode(node, ctx, wr);
  var i int64 = 0;  
  for ; i < int64(len(this.walkAlso)) ; i++ {
    ch := this.walkAlso[i];
    this.WalkNode(ch, ctx, wr);
  }
}
func (this *RangerFlowParser) WalkNode (node *CodeNode, ctx *RangerAppWriterContext, wr *CodeWriter) bool {
  /** unused:  line_index*/
  if  node.flow_done {
    return true;
  }
  node.flow_done = true; 
  this.lastProcessedNode.value = node;
  this.lastProcessedNode.has_value = true; /* detected as non-optional */
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
  if  node.isFirstVref("fun") {
    this.EnterLambdaMethod(node, ctx, wr);
    return true;
  }
  if  node.isFirstVref("fn") {
    if  ctx.isInMethod() {
      this.EnterLambdaMethod(node, ctx, wr);
      return true;
    }
  }
  if  node.isFirstVref("Extends") {
    return true;
  }
  if  node.isFirstVref("extension") {
    this.EnterClass(node, ctx, wr);
    return true;
  }
  if  node.isFirstVref("operators") {
    return true;
  }
  if  node.isFirstVref("systemclass") {
    return true;
  }
  if  node.isFirstVref("systemunion") {
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
  if  node.isFirstVref("trait") {
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
    var fc *CodeNode = node.children[0];
    if  fc.value_type == 9 {
      var was_called bool = true;
      switch (fc.vref ) { 
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
    var i int64 = 0;  
    for ; i < int64(len(node.children)) ; i++ {
      item := node.children[i];
      item.parent.value = node;
      item.parent.has_value = true; /* detected as non-optional */
      this.WalkNode(item, ctx, wr);
      node.copyEvalResFrom(item);
    }
    return true;
  }
  ctx.addError(node, "Could not understand this part");
  return true;
}
func (this *RangerFlowParser) mergeImports (node *CodeNode, ctx *RangerAppWriterContext, wr *CodeWriter) () {
  if  node.isFirstVref("Import") {
    var fNameNode *CodeNode = node.children[1];
    var import_file string = fNameNode.string_value;
    if  r_has_key_string_bool(ctx.already_imported, import_file) {
      return;
    }
    ctx.already_imported[import_file] = true
    var c *GoNullable = new(GoNullable); 
    c = r_io_read_file(".", import_file);
    var code *SourceCode = CreateNew_SourceCode(c.value.(string));
    code.filename = import_file; 
    var parser *RangerLispParser = CreateNew_RangerLispParser(code);
    parser.parse();
    node.expression = true; 
    node.vref = ""; 
    node.children = node.children[:len(node.children)-1]; 
    node.children = node.children[:len(node.children)-1]; 
    var rn *CodeNode = parser.rootNode.value.(*CodeNode);
    this.mergeImports(rn, ctx, wr);
    node.children = append(node.children,rn); 
  } else {
    var i int64 = 0;  
    for ; i < int64(len(node.children)) ; i++ {
      item := node.children[i];
      this.mergeImports(item, ctx, wr);
    }
  }
}
func (this *RangerFlowParser) CollectMethods (node *CodeNode, ctx *RangerAppWriterContext, wr *CodeWriter) () {
  this.WalkCollectMethods(node, ctx, wr);
  var i int64 = 0;  
  for ; i < int64(len(this.classesWithTraits)) ; i++ {
    point := this.classesWithTraits[i];
    var cl *RangerAppClassDesc = point.class_def.value.(*RangerAppClassDesc);
    /** unused:  joinPoint*/
    var traitClassDef *CodeNode = point.node.value.(*CodeNode).children[1];
    var name string = traitClassDef.vref;
    var t *RangerAppClassDesc = ctx.findClass(name);
    if  (int64(len(t.extends_classes))) > 0 {
      ctx.addError(point.node.value.(*CodeNode), strings.Join([]string{ (strings.Join([]string{ "Can not join class ",name }, ""))," because it is inherited. Currently on base classes can be used as traits." }, ""));
      continue;
    }
    if  t.has_constructor {
      ctx.addError(point.node.value.(*CodeNode), strings.Join([]string{ (strings.Join([]string{ "Can not join class ",name }, ""))," because it has a constructor function" }, ""));
    } else {
      var origBody *CodeNode = cl.node.value.(*CodeNode).children[2];
      var match *RangerArgMatch = CreateNew_RangerArgMatch();
      var params *GoNullable = new(GoNullable); 
      params = t.node.value.(*CodeNode).getExpressionProperty("params");
      var initParams *GoNullable = new(GoNullable); 
      initParams = point.node.value.(*CodeNode).getExpressionProperty("params");
      if  (params.has_value) && (initParams.has_value) {
        var i_1 int64 = 0;  
        for ; i_1 < int64(len(params.value.(*CodeNode).children)) ; i_1++ {
          typeName := params.value.(*CodeNode).children[i_1];
          var pArg *CodeNode = initParams.value.(*CodeNode).children[i_1];
          match.add(typeName.vref, pArg.vref, ctx);
        }
      } else {
        match.add("T", cl.name, ctx);
      }
      ctx.setCurrentClass(cl);
      var traitClass *RangerAppClassDesc = ctx.findClass(traitClassDef.vref);
      var i_2 int64 = 0;  
      for ; i_2 < int64(len(traitClass.variables)) ; i_2++ {
        pvar := traitClass.variables[i_2];
        var ccopy *CodeNode = pvar.Get_node().value.(*CodeNode).rebuildWithType(match, true);
        this.WalkCollectMethods(ccopy, ctx, wr);
        origBody.children = append(origBody.children,ccopy); 
      }
      var i_3 int64 = 0;  
      for ; i_3 < int64(len(traitClass.defined_variants)) ; i_3++ {
        fnVar := traitClass.defined_variants[i_3];
        var mVs *GoNullable = new(GoNullable); 
        mVs = r_get_string_RangerAppMethodVariants(traitClass.method_variants, fnVar);
        var i_4 int64 = 0;  
        for ; i_4 < int64(len(mVs.value.(*RangerAppMethodVariants).variants)) ; i_4++ {
          variant := mVs.value.(*RangerAppMethodVariants).variants[i_4];
          var ccopy_1 *CodeNode = variant.node.value.(*CodeNode).rebuildWithType(match, true);
          this.WalkCollectMethods(ccopy_1, ctx, wr);
          origBody.children = append(origBody.children,ccopy_1); 
        }
      }
    }
  }
  var i_5 int64 = 0;  
  for ; i_5 < int64(len(this.serializedClasses)) ; i_5++ {
    cl_1 := this.serializedClasses[i_5];
    cl_1.is_serialized = true; 
    var ser *RangerSerializeClass = CreateNew_RangerSerializeClass();
    var extWr *CodeWriter = CreateNew_CodeWriter();
    ser.createJSONSerializerFn(cl_1, cl_1.ctx.value.(*RangerAppWriterContext), extWr);
    var theCode string = extWr.getCode();
    var code *SourceCode = CreateNew_SourceCode(theCode);
    code.filename = strings.Join([]string{ "extension ",ctx.currentClass.value.(*RangerAppClassDesc).name }, ""); 
    var parser *RangerLispParser = CreateNew_RangerLispParser(code);
    parser.parse();
    var rn *CodeNode = parser.rootNode.value.(*CodeNode);
    this.WalkCollectMethods(rn, cl_1.ctx.value.(*RangerAppWriterContext), wr);
    this.walkAlso = append(this.walkAlso,rn); 
  }
}
func (this *RangerFlowParser) WalkCollectMethods (node *CodeNode, ctx *RangerAppWriterContext, wr *CodeWriter) () {
  var find_more bool = true;
  if  node.isFirstVref("systemunion") {
    var nameNode *CodeNode = node.getSecond();
    var instances *CodeNode = node.getThird();
    var new_class *RangerAppClassDesc = CreateNew_RangerAppClassDesc();
    new_class.name = nameNode.vref; 
    new_class.nameNode.value = nameNode;
    new_class.nameNode.has_value = true; /* detected as non-optional */
    ctx.addClass(nameNode.vref, new_class);
    new_class.is_system_union = true; 
    var i int64 = 0;  
    for ; i < int64(len(instances.children)) ; i++ {
      ch := instances.children[i];
      new_class.is_union_of = append(new_class.is_union_of,ch.vref); 
    }
    nameNode.clDesc.value = new_class;
    nameNode.clDesc.has_value = true; /* detected as non-optional */
    return;
  }
  if  node.isFirstVref("systemclass") {
    var nameNode_1 *CodeNode = node.getSecond();
    var instances_1 *CodeNode = node.getThird();
    var new_class_1 *RangerAppClassDesc = CreateNew_RangerAppClassDesc();
    new_class_1.name = nameNode_1.vref; 
    new_class_1.nameNode.value = nameNode_1;
    new_class_1.nameNode.has_value = true; /* detected as non-optional */
    ctx.addClass(nameNode_1.vref, new_class_1);
    new_class_1.is_system = true; 
    var i_1 int64 = 0;  
    for ; i_1 < int64(len(instances_1.children)) ; i_1++ {
      ch_1 := instances_1.children[i_1];
      var langName *CodeNode = ch_1.getFirst();
      var langClassName *CodeNode = ch_1.getSecond();
      new_class_1.systemNames[langName.vref] = langClassName.vref
    }
    nameNode_1.is_system_class = true; 
    nameNode_1.clDesc.value = new_class_1;
    nameNode_1.clDesc.has_value = true; /* detected as non-optional */
    return;
  }
  if  node.isFirstVref("Extends") {
    var extList *CodeNode = node.children[1];
    var currC *GoNullable = new(GoNullable); 
    currC.value = ctx.currentClass.value;
    currC.has_value = ctx.currentClass.has_value;
    var ii int64 = 0;  
    for ; ii < int64(len(extList.children)) ; ii++ {
      ee := extList.children[ii];
      currC.value.(*RangerAppClassDesc).addParentClass(ee.vref);
      var ParentClass *RangerAppClassDesc = ctx.findClass(ee.vref);
      ParentClass.is_inherited = true; 
    }
  }
  if  node.isFirstVref("Constructor") {
    var currC_1 *GoNullable = new(GoNullable); 
    currC_1.value = ctx.currentClass.value;
    currC_1.has_value = ctx.currentClass.has_value;
    var subCtx *RangerAppWriterContext = currC_1.value.(*RangerAppClassDesc).ctx.value.(*RangerAppWriterContext).fork();
    currC_1.value.(*RangerAppClassDesc).has_constructor = true; 
    currC_1.value.(*RangerAppClassDesc).constructor_node.value = node;
    currC_1.value.(*RangerAppClassDesc).constructor_node.has_value = true; /* detected as non-optional */
    var m *RangerAppFunctionDesc = CreateNew_RangerAppFunctionDesc();
    m.name = "Constructor"; 
    m.node.value = node;
    m.node.has_value = true; /* detected as non-optional */
    m.nameNode.value = node.children[0];
    m.nameNode.has_value = true; /* detected as non-optional */
    m.fnBody.value = node.children[2];
    m.fnBody.has_value = true; /* detected as non-optional */
    m.fnCtx.value = subCtx;
    m.fnCtx.has_value = true; /* detected as non-optional */
    var args *CodeNode = node.children[1];
    var ii_1 int64 = 0;  
    for ; ii_1 < int64(len(args.children)) ; ii_1++ {
      arg := args.children[ii_1];
      var p IFACE_RangerAppParamDesc = CreateNew_RangerAppParamDesc();
      p.Set_name(arg.vref); 
      p.Set_value_type(arg.value_type); 
      p.Get_node().value = arg;
      p.Get_node().has_value = true; /* detected as non-optional */
      p.Get_nameNode().value = arg;
      p.Get_nameNode().has_value = true; /* detected as non-optional */
      p.Set_refType(1); 
      p.Set_varType(4); 
      m.params = append(m.params,p); 
      arg.hasParamDesc = true; 
      arg.paramDesc.value = p;
      arg.paramDesc.has_value = true; /* detected as non-optional */
      arg.eval_type = arg.value_type; 
      arg.eval_type_name = arg.type_name; 
      subCtx.defineVariable(p.Get_name(), p);
    }
    currC_1.value.(*RangerAppClassDesc).constructor_fn.value = m;
    currC_1.value.(*RangerAppClassDesc).constructor_fn.has_value = true; /* detected as non-optional */
    find_more = false; 
  }
  if  node.isFirstVref("trait") {
    var s string = node.getVRefAt(1);
    var classNameNode *CodeNode = node.getSecond();
    var new_class_2 *RangerAppClassDesc = CreateNew_RangerAppClassDesc();
    new_class_2.name = s; 
    var subCtx_1 *RangerAppWriterContext = ctx.fork();
    ctx.setCurrentClass(new_class_2);
    subCtx_1.setCurrentClass(new_class_2);
    new_class_2.ctx.value = subCtx_1;
    new_class_2.ctx.has_value = true; /* detected as non-optional */
    new_class_2.nameNode.value = classNameNode;
    new_class_2.nameNode.has_value = true; /* detected as non-optional */
    ctx.addClass(s, new_class_2);
    new_class_2.classNode.value = node;
    new_class_2.classNode.has_value = true; /* detected as non-optional */
    new_class_2.node.value = node;
    new_class_2.node.has_value = true; /* detected as non-optional */
    new_class_2.is_trait = true; 
  }
  if  node.isFirstVref("CreateClass") || node.isFirstVref("class") {
    var s_1 string = node.getVRefAt(1);
    var classNameNode_1 *CodeNode = node.getSecond();
    if  classNameNode_1.has_vref_annotation {
      fmt.Println( "%% vref_annotation" )
      var ann *GoNullable = new(GoNullable); 
      ann.value = classNameNode_1.vref_annotation.value;
      ann.has_value = classNameNode_1.vref_annotation.has_value;
      fmt.Println( strings.Join([]string{ (strings.Join([]string{ classNameNode_1.vref," : " }, "")),ann.value.(*CodeNode).getCode() }, "") )
      ctx.addTemplateClass(classNameNode_1.vref, node);
      find_more = false; 
    } else {
      var new_class_3 *RangerAppClassDesc = CreateNew_RangerAppClassDesc();
      new_class_3.name = s_1; 
      var subCtx_2 *RangerAppWriterContext = ctx.fork();
      ctx.setCurrentClass(new_class_3);
      subCtx_2.setCurrentClass(new_class_3);
      new_class_3.ctx.value = subCtx_2;
      new_class_3.ctx.has_value = true; /* detected as non-optional */
      new_class_3.nameNode.value = classNameNode_1;
      new_class_3.nameNode.has_value = true; /* detected as non-optional */
      ctx.addClass(s_1, new_class_3);
      new_class_3.classNode.value = node;
      new_class_3.classNode.has_value = true; /* detected as non-optional */
      new_class_3.node.value = node;
      new_class_3.node.has_value = true; /* detected as non-optional */
      if  node.hasBooleanProperty("trait") {
        new_class_3.is_trait = true; 
      }
    }
  }
  if  node.isFirstVref("TemplateClass") {
    var s_2 string = node.getVRefAt(1);
    ctx.addTemplateClass(s_2, node);
    find_more = false; 
  }
  if  node.isFirstVref("Extends") {
    var list *CodeNode = node.children[1];
    var i_2 int64 = 0;  
    for ; i_2 < int64(len(list.children)) ; i_2++ {
      cname := list.children[i_2];
      var extC *RangerAppClassDesc = ctx.findClass(cname.vref);
      var i_3 int64 = 0;  
      for ; i_3 < int64(len(extC.variables)) ; i_3++ {
        vv := extC.variables[i_3];
        var currC_2 *GoNullable = new(GoNullable); 
        currC_2.value = ctx.currentClass.value;
        currC_2.has_value = ctx.currentClass.has_value;
        var subCtx_3 *GoNullable = new(GoNullable); 
        subCtx_3.value = currC_2.value.(*RangerAppClassDesc).ctx.value;
        subCtx_3.has_value = currC_2.value.(*RangerAppClassDesc).ctx.has_value;
        subCtx_3.value.(*RangerAppWriterContext).defineVariable(vv.Get_name(), vv);
      }
    }
    find_more = false; 
  }
  if  node.isFirstVref("def") || node.isFirstVref("let") {
    var s_3 string = node.getVRefAt(1);
    var vDef *CodeNode = node.children[1];
    var p_1 IFACE_RangerAppParamDesc = CreateNew_RangerAppParamDesc();
    if  s_3 != ctx.transformWord(s_3) {
      ctx.addError(node, strings.Join([]string{ (strings.Join([]string{ "Can not use reserved word ",s_3 }, ""))," as class propery" }, ""));
    }
    p_1.Set_name(s_3); 
    p_1.Set_value_type(vDef.value_type); 
    p_1.Get_node().value = node;
    p_1.Get_node().has_value = true; /* detected as non-optional */
    p_1.Set_is_class_variable(true); 
    p_1.Set_varType(8); 
    p_1.Get_node().value = node;
    p_1.Get_node().has_value = true; /* detected as non-optional */
    p_1.Get_nameNode().value = vDef;
    p_1.Get_nameNode().has_value = true; /* detected as non-optional */
    vDef.hasParamDesc = true; 
    vDef.ownParamDesc.value = p_1;
    vDef.ownParamDesc.has_value = true; /* detected as non-optional */
    vDef.paramDesc.value = p_1;
    vDef.paramDesc.has_value = true; /* detected as non-optional */
    node.hasParamDesc = true; 
    node.paramDesc.value = p_1;
    node.paramDesc.has_value = true; /* detected as non-optional */
    if  vDef.hasFlag("weak") {
      p_1.changeStrength(0, 2, p_1.Get_nameNode().value.(*CodeNode));
    } else {
      p_1.changeStrength(2, 2, p_1.Get_nameNode().value.(*CodeNode));
    }
    if  (int64(len(node.children))) > 2 {
      p_1.Set_set_cnt(1); 
      p_1.Set_init_cnt(1); 
      p_1.Get_def_value().value = node.children[2];
      p_1.Get_def_value().has_value = true; /* detected as non-optional */
      p_1.Set_is_optional(false); 
      if  p_1.Get_def_value().value.(*CodeNode).value_type == 4 {
        vDef.type_name = "string"; 
      }
      if  p_1.Get_def_value().value.(*CodeNode).value_type == 3 {
        vDef.type_name = "int"; 
      }
      if  p_1.Get_def_value().value.(*CodeNode).value_type == 2 {
        vDef.type_name = "double"; 
      }
      if  p_1.Get_def_value().value.(*CodeNode).value_type == 5 {
        vDef.type_name = "boolean"; 
      }
    } else {
      p_1.Set_is_optional(true); 
      if  false == ((vDef.value_type == 6) || (vDef.value_type == 7)) {
        vDef.setFlag("optional");
      }
    }
    var currC_3 *GoNullable = new(GoNullable); 
    currC_3.value = ctx.currentClass.value;
    currC_3.has_value = ctx.currentClass.has_value;
    currC_3.value.(*RangerAppClassDesc).addVariable(p_1);
    var subCtx_4 *GoNullable = new(GoNullable); 
    subCtx_4.value = currC_3.value.(*RangerAppClassDesc).ctx.value;
    subCtx_4.has_value = currC_3.value.(*RangerAppClassDesc).ctx.has_value;
    subCtx_4.value.(*RangerAppWriterContext).defineVariable(p_1.Get_name(), p_1);
    p_1.Set_is_class_variable(true); 
  }
  if  node.isFirstVref("operators") {
    var listOf *CodeNode = node.getSecond();
    var i_4 int64 = 0;  
    for ; i_4 < int64(len(listOf.children)) ; i_4++ {
      item := listOf.children[i_4];
      ctx.createOperator(item);
    }
    find_more = false; 
  }
  if  node.isFirstVref("Import") || node.isFirstVref("import") {
    var fNameNode *CodeNode = node.children[1];
    var import_file string = fNameNode.string_value;
    if  r_has_key_string_bool(ctx.already_imported, import_file) {
      return;
    } else {
      ctx.already_imported[import_file] = true
    }
    var c *GoNullable = new(GoNullable); 
    c = r_io_read_file(".", import_file);
    var code *SourceCode = CreateNew_SourceCode(c.value.(string));
    code.filename = import_file; 
    var parser *RangerLispParser = CreateNew_RangerLispParser(code);
    parser.parse();
    var rnode *GoNullable = new(GoNullable); 
    rnode.value = parser.rootNode.value;
    rnode.has_value = parser.rootNode.has_value;
    this.WalkCollectMethods(rnode.value.(*CodeNode), ctx, wr);
    find_more = false; 
  }
  if  node.isFirstVref("does") {
    var defName *CodeNode = node.getSecond();
    var currC_4 *GoNullable = new(GoNullable); 
    currC_4.value = ctx.currentClass.value;
    currC_4.has_value = ctx.currentClass.has_value;
    currC_4.value.(*RangerAppClassDesc).consumes_traits = append(currC_4.value.(*RangerAppClassDesc).consumes_traits,defName.vref); 
    var joinPoint *ClassJoinPoint = CreateNew_ClassJoinPoint();
    joinPoint.class_def.value = currC_4.value;
    joinPoint.class_def.has_value = false; 
    if joinPoint.class_def.value != nil {
      joinPoint.class_def.has_value = true
    }
    joinPoint.node.value = node;
    joinPoint.node.has_value = true; /* detected as non-optional */
    this.classesWithTraits = append(this.classesWithTraits,joinPoint); 
  }
  if  node.isFirstVref("StaticMethod") || node.isFirstVref("sfn") {
    var s_4 string = node.getVRefAt(1);
    var currC_5 *GoNullable = new(GoNullable); 
    currC_5.value = ctx.currentClass.value;
    currC_5.has_value = ctx.currentClass.has_value;
    var m_1 *RangerAppFunctionDesc = CreateNew_RangerAppFunctionDesc();
    m_1.name = s_4; 
    m_1.compiledName = ctx.transformWord(s_4); 
    m_1.node.value = node;
    m_1.node.has_value = true; /* detected as non-optional */
    m_1.is_static = true; 
    m_1.nameNode.value = node.children[1];
    m_1.nameNode.has_value = true; /* detected as non-optional */
    m_1.nameNode.value.(*CodeNode).ifNoTypeSetToVoid();
    var args_1 *CodeNode = node.children[2];
    m_1.fnBody.value = node.children[3];
    m_1.fnBody.has_value = true; /* detected as non-optional */
    var ii_2 int64 = 0;  
    for ; ii_2 < int64(len(args_1.children)) ; ii_2++ {
      arg_1 := args_1.children[ii_2];
      var p_2 IFACE_RangerAppParamDesc = CreateNew_RangerAppParamDesc();
      p_2.Set_name(arg_1.vref); 
      p_2.Set_value_type(arg_1.value_type); 
      p_2.Get_node().value = arg_1;
      p_2.Get_node().has_value = true; /* detected as non-optional */
      p_2.Set_init_cnt(1); 
      p_2.Get_nameNode().value = arg_1;
      p_2.Get_nameNode().has_value = true; /* detected as non-optional */
      p_2.Set_refType(1); 
      p_2.Set_varType(4); 
      m_1.params = append(m_1.params,p_2); 
      arg_1.hasParamDesc = true; 
      arg_1.paramDesc.value = p_2;
      arg_1.paramDesc.has_value = true; /* detected as non-optional */
      arg_1.eval_type = arg_1.value_type; 
      arg_1.eval_type_name = arg_1.type_name; 
      if  arg_1.hasFlag("strong") {
        p_2.changeStrength(1, 1, p_2.Get_nameNode().value.(*CodeNode));
      } else {
        arg_1.setFlag("lives");
        p_2.changeStrength(0, 1, p_2.Get_nameNode().value.(*CodeNode));
      }
    }
    currC_5.value.(*RangerAppClassDesc).addStaticMethod(m_1);
    find_more = false; 
  }
  if  node.isFirstVref("extension") {
    var s_5 string = node.getVRefAt(1);
    var old_class *RangerAppClassDesc = ctx.findClass(s_5);
    ctx.setCurrentClass(old_class);
    fmt.Println( strings.Join([]string{ "extension for ",s_5 }, "") )
  }
  if  node.isFirstVref("PublicMethod") || node.isFirstVref("fn") {
    var cn *CodeNode = node.getSecond();
    var s_6 string = node.getVRefAt(1);
    cn.ifNoTypeSetToVoid();
    var currC_6 *GoNullable = new(GoNullable); 
    currC_6.value = ctx.currentClass.value;
    currC_6.has_value = ctx.currentClass.has_value;
    if  currC_6.value.(*RangerAppClassDesc).hasOwnMethod(s_6) {
      ctx.addError(node, "Error: method of same name declared earlier. Overriding function declarations is not currently allowed!");
      return;
    }
    if  cn.hasFlag("main") {
      ctx.addError(node, "Error: dynamic method declared as @(main). Use static 'sfn' instead of 'fn'.");
      return;
    }
    var m_2 *RangerAppFunctionDesc = CreateNew_RangerAppFunctionDesc();
    m_2.name = s_6; 
    m_2.compiledName = ctx.transformWord(s_6); 
    m_2.node.value = node;
    m_2.node.has_value = true; /* detected as non-optional */
    m_2.nameNode.value = node.children[1];
    m_2.nameNode.has_value = true; /* detected as non-optional */
    if  node.hasBooleanProperty("strong") {
      m_2.refType = 2; 
    } else {
      m_2.refType = 1; 
    }
    var subCtx_5 *RangerAppWriterContext = currC_6.value.(*RangerAppClassDesc).ctx.value.(*RangerAppWriterContext).fork();
    subCtx_5.is_function = true; 
    subCtx_5.currentMethod.value = m_2;
    subCtx_5.currentMethod.has_value = true; /* detected as non-optional */
    m_2.fnCtx.value = subCtx_5;
    m_2.fnCtx.has_value = true; /* detected as non-optional */
    if  cn.hasFlag("weak") {
      m_2.changeStrength(0, 1, node);
    } else {
      m_2.changeStrength(1, 1, node);
    }
    var args_2 *CodeNode = node.children[2];
    m_2.fnBody.value = node.children[3];
    m_2.fnBody.has_value = true; /* detected as non-optional */
    var ii_3 int64 = 0;  
    for ; ii_3 < int64(len(args_2.children)) ; ii_3++ {
      arg_2 := args_2.children[ii_3];
      var p2 IFACE_RangerAppParamDesc = CreateNew_RangerAppParamDesc();
      p2.Set_name(arg_2.vref); 
      p2.Set_value_type(arg_2.value_type); 
      p2.Get_node().value = arg_2;
      p2.Get_node().has_value = true; /* detected as non-optional */
      p2.Get_nameNode().value = arg_2;
      p2.Get_nameNode().has_value = true; /* detected as non-optional */
      p2.Set_init_cnt(1); 
      p2.Set_refType(1); 
      p2.Set_initRefType(1); 
      p2.Set_debugString("--> collected "); 
      if  args_2.hasBooleanProperty("strong") {
        p2.Set_debugString("--> collected as STRONG"); 
        ctx.log(node, "memory5", "strong param should move local ownership to call ***");
        p2.Set_refType(2); 
        p2.Set_initRefType(2); 
      }
      p2.Set_varType(4); 
      m_2.params = append(m_2.params,p2); 
      arg_2.hasParamDesc = true; 
      arg_2.paramDesc.value = p2;
      arg_2.paramDesc.has_value = true; /* detected as non-optional */
      arg_2.eval_type = arg_2.value_type; 
      arg_2.eval_type_name = arg_2.type_name; 
      if  arg_2.hasFlag("strong") {
        p2.changeStrength(1, 1, p2.Get_nameNode().value.(*CodeNode));
      } else {
        arg_2.setFlag("lives");
        p2.changeStrength(0, 1, p2.Get_nameNode().value.(*CodeNode));
      }
      subCtx_5.defineVariable(p2.Get_name(), p2);
    }
    currC_6.value.(*RangerAppClassDesc).addMethod(m_2);
    find_more = false; 
  }
  if  find_more {
    var i_5 int64 = 0;  
    for ; i_5 < int64(len(node.children)) ; i_5++ {
      item_1 := node.children[i_5];
      this.WalkCollectMethods(item_1, ctx, wr);
    }
  }
  if  node.hasBooleanProperty("serialize") {
    this.serializedClasses = append(this.serializedClasses,ctx.currentClass.value.(*RangerAppClassDesc)); 
  }
}
func (this *RangerFlowParser) FindWeakRefs (node *CodeNode, ctx *RangerAppWriterContext, wr *CodeWriter) () {
  var list []*RangerAppClassDesc = ctx.getClasses();
  var i int64 = 0;  
  for ; i < int64(len(list)) ; i++ {
    classDesc := list[i];
    var i2 int64 = 0;  
    for ; i2 < int64(len(classDesc.variables)) ; i2++ {
      varD := classDesc.variables[i2];
      if  varD.Get_refType() == 1 {
        if  varD.isArray() {
          /** unused:  nn*/
        }
        if  varD.isHash() {
          /** unused:  nn_1*/
        }
        if  varD.isObject() {
          /** unused:  nn_2*/
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
      var cnt int64 = int64(len(obj.ns));
      var classRefDesc *GoNullable = new(GoNullable); 
      var classDesc *GoNullable = new(GoNullable); 
      var i int64 = 0;  
      for ; i < int64(len(obj.ns)) ; i++ {
        strname := obj.ns[i];
        if  i == 0 {
          if  strname == this.getThisName() {
            classDesc.value = ctx.getCurrentClass().value;
            classDesc.has_value = false; 
            if classDesc.value != nil {
              classDesc.has_value = true
            }
          } else {
            if  ctx.isDefinedClass(strname) {
              classDesc.value = ctx.findClass(strname);
              classDesc.has_value = true; /* detected as non-optional */
              continue;
            }
            classRefDesc.value = ctx.getVariableDef(strname);
            classRefDesc.has_value = true; /* detected as non-optional */
            if  (!classRefDesc.has_value ) || (!classRefDesc.value.(IFACE_RangerAppParamDesc).Get_nameNode().has_value ) {
              ctx.addError(obj, strings.Join([]string{ "Error, no description for called object: ",strname }, ""));
              break;
            }
            classRefDesc.value.(IFACE_RangerAppParamDesc).Set_ref_cnt(1 + classRefDesc.value.(IFACE_RangerAppParamDesc).Get_ref_cnt()); 
            classDesc.value = ctx.findClass(classRefDesc.value.(IFACE_RangerAppParamDesc).Get_nameNode().value.(*CodeNode).type_name);
            classDesc.has_value = true; /* detected as non-optional */
            if  !classDesc.has_value  {
              return varFnDesc;
            }
          }
        } else {
          if  !classDesc.has_value  {
            return varFnDesc;
          }
          if  i < (cnt - 1) {
            varDesc.value = classDesc.value.(*RangerAppClassDesc).findVariable(strname).value;
            varDesc.has_value = false; 
            if varDesc.value != nil {
              varDesc.has_value = true
            }
            if  !varDesc.has_value  {
              ctx.addError(obj, strings.Join([]string{ "Error, no description for refenced obj: ",strname }, ""));
            }
            var subClass string = varDesc.value.(IFACE_RangerAppParamDesc).getTypeName();
            classDesc.value = ctx.findClass(subClass);
            classDesc.has_value = true; /* detected as non-optional */
            continue;
          }
          if  classDesc.has_value {
            varFnDesc.value = classDesc.value.(*RangerAppClassDesc).findMethod(strname).value;
            varFnDesc.has_value = false; 
            if varFnDesc.value != nil {
              varFnDesc.has_value = true
            }
            if  !varFnDesc.has_value  {
              varFnDesc.value = classDesc.value.(*RangerAppClassDesc).findStaticMethod(strname).value;
              varFnDesc.has_value = false; 
              if varFnDesc.value != nil {
                varFnDesc.has_value = true
              }
              if  !varFnDesc.has_value  {
                ctx.addError(obj, strings.Join([]string{ " function variable not found ",strname }, ""));
              }
            }
          }
        }
      }
      return varFnDesc;
    }
    var udesc *GoNullable = new(GoNullable); 
    udesc = ctx.getCurrentClass();
    var currClass *RangerAppClassDesc = udesc.value.(*RangerAppClassDesc);
    varFnDesc.value = currClass.findMethod(obj.vref).value;
    varFnDesc.has_value = false; 
    if varFnDesc.value != nil {
      varFnDesc.has_value = true
    }
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
  var varDesc *GoNullable = new(GoNullable); 
  var set_nsp bool = false;
  var classDesc *GoNullable = new(GoNullable); 
  if  0 == (int64(len(obj.nsp))) {
    set_nsp = true; 
  }
  if  obj.vref != this.getThisName() {
    if  (int64(len(obj.ns))) > 1 {
      var cnt int64 = int64(len(obj.ns));
      var classRefDesc *GoNullable = new(GoNullable); 
      var i int64 = 0;  
      for ; i < int64(len(obj.ns)) ; i++ {
        strname := obj.ns[i];
        if  i == 0 {
          if  strname == this.getThisName() {
            classDesc.value = ctx.getCurrentClass().value;
            classDesc.has_value = false; 
            if classDesc.value != nil {
              classDesc.has_value = true
            }
            if  set_nsp {
              obj.nsp = append(obj.nsp,classDesc.value.(*RangerAppClassDesc)); 
            }
          } else {
            if  ctx.isDefinedClass(strname) {
              classDesc.value = ctx.findClass(strname);
              classDesc.has_value = true; /* detected as non-optional */
              if  set_nsp {
                obj.nsp = append(obj.nsp,classDesc.value.(*RangerAppClassDesc)); 
              }
              continue;
            }
            classRefDesc.value = ctx.getVariableDef(strname);
            classRefDesc.has_value = true; /* detected as non-optional */
            if  !classRefDesc.has_value  {
              ctx.addError(obj, strings.Join([]string{ "Error, no description for called object: ",strname }, ""));
              break;
            }
            if  set_nsp {
              obj.nsp = append(obj.nsp,classRefDesc.value.(IFACE_RangerAppParamDesc)); 
            }
            classRefDesc.value.(IFACE_RangerAppParamDesc).Set_ref_cnt(1 + classRefDesc.value.(IFACE_RangerAppParamDesc).Get_ref_cnt()); 
            classDesc.value = ctx.findClass(classRefDesc.value.(IFACE_RangerAppParamDesc).Get_nameNode().value.(*CodeNode).type_name);
            classDesc.has_value = true; /* detected as non-optional */
          }
        } else {
          if  i < (cnt - 1) {
            varDesc.value = classDesc.value.(*RangerAppClassDesc).findVariable(strname).value;
            varDesc.has_value = false; 
            if varDesc.value != nil {
              varDesc.has_value = true
            }
            if  !varDesc.has_value  {
              ctx.addError(obj, strings.Join([]string{ "Error, no description for refenced obj: ",strname }, ""));
            }
            var subClass string = varDesc.value.(IFACE_RangerAppParamDesc).getTypeName();
            classDesc.value = ctx.findClass(subClass);
            classDesc.has_value = true; /* detected as non-optional */
            if  set_nsp {
              obj.nsp = append(obj.nsp,varDesc.value.(IFACE_RangerAppParamDesc)); 
            }
            continue;
          }
          if  classDesc.has_value {
            varDesc.value = classDesc.value.(*RangerAppClassDesc).findVariable(strname).value;
            varDesc.has_value = false; 
            if varDesc.value != nil {
              varDesc.has_value = true
            }
            if  !varDesc.has_value  {
              var classMethod *GoNullable = new(GoNullable); 
              classMethod = classDesc.value.(*RangerAppClassDesc).findMethod(strname);
              if  !classMethod.has_value  {
                classMethod.value = classDesc.value.(*RangerAppClassDesc).findStaticMethod(strname).value;
                classMethod.has_value = false; 
                if classMethod.value != nil {
                  classMethod.has_value = true
                }
                if  !classMethod.has_value  {
                  ctx.addError(obj, strings.Join([]string{ "variable not found ",strname }, ""));
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
              obj.nsp = append(obj.nsp,varDesc.value.(IFACE_RangerAppParamDesc)); 
            }
          }
        }
      }
      return varDesc;
    }
    varDesc.value = ctx.getVariableDef(obj.vref);
    varDesc.has_value = true; /* detected as non-optional */
    if  varDesc.value.(IFACE_RangerAppParamDesc).Get_nameNode().has_value {
    } else {
      fmt.Println( strings.Join([]string{ "findParamDesc : description not found for ",obj.vref }, "") )
      if  varDesc.has_value {
        fmt.Println( strings.Join([]string{ "Vardesc was found though...",varDesc.value.(IFACE_RangerAppParamDesc).Get_name() }, "") )
      }
      ctx.addError(obj, strings.Join([]string{ "Error, no description for called object: ",obj.vref }, ""));
    }
    return varDesc;
  }
  var cc *GoNullable = new(GoNullable); 
  cc = ctx.getCurrentClass();
  return cc;
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
        var c1 *RangerAppClassDesc = ctx.findClass(n1.eval_type_name);
        var c2 *RangerAppClassDesc = ctx.findClass(n2.eval_type_name);
        if  c1.isSameOrParentClass(n2.eval_type_name, ctx) {
          return true;
        }
        if  c2.isSameOrParentClass(n1.eval_type_name, ctx) {
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
      var b_ok bool = false;
      if  ctx.isEnumDefined(n1.eval_type_name) && (n2.eval_type_name == "int") {
        b_ok = true; 
      }
      if  ctx.isEnumDefined(n2.eval_type_name) && (n1.eval_type_name == "int") {
        b_ok = true; 
      }
      if  ctx.isDefinedClass(n2.eval_type_name) {
        var cc *RangerAppClassDesc = ctx.findClass(n2.eval_type_name);
        if  cc.isSameOrParentClass(n1.eval_type_name, ctx) {
          b_ok = true; 
        }
      }
      if  (n1.eval_type_name == "char") && (n2.eval_type_name == "int") {
        b_ok = true; 
      }
      if  (n1.eval_type_name == "int") && (n2.eval_type_name == "char") {
        b_ok = true; 
      }
      if  b_ok == false {
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
      var b_ok bool = false;
      if  ctx.isEnumDefined(n1.eval_type_name) && (type_name == "int") {
        b_ok = true; 
      }
      if  ctx.isEnumDefined(type_name) && (n1.eval_type_name == "int") {
        b_ok = true; 
      }
      if  (n1.eval_type_name == "char") && (type_name == "int") {
        b_ok = true; 
      }
      if  (n1.eval_type_name == "int") && (type_name == "char") {
        b_ok = true; 
      }
      if  b_ok == false {
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
// getter for variable lastProcessedNode
func (this *RangerFlowParser) Get_lastProcessedNode() *GoNullable {
  return this.lastProcessedNode
}
// setter for variable lastProcessedNode
func (this *RangerFlowParser) Set_lastProcessedNode( value *GoNullable)  {
  this.lastProcessedNode = value 
}
// getter for variable collectWalkAtEnd
func (this *RangerFlowParser) Get_collectWalkAtEnd() []*CodeNode {
  return this.collectWalkAtEnd
}
// setter for variable collectWalkAtEnd
func (this *RangerFlowParser) Set_collectWalkAtEnd( value []*CodeNode)  {
  this.collectWalkAtEnd = value 
}
// getter for variable walkAlso
func (this *RangerFlowParser) Get_walkAlso() []*CodeNode {
  return this.walkAlso
}
// setter for variable walkAlso
func (this *RangerFlowParser) Set_walkAlso( value []*CodeNode)  {
  this.walkAlso = value 
}
// getter for variable serializedClasses
func (this *RangerFlowParser) Get_serializedClasses() []*RangerAppClassDesc {
  return this.serializedClasses
}
// setter for variable serializedClasses
func (this *RangerFlowParser) Set_serializedClasses( value []*RangerAppClassDesc)  {
  this.serializedClasses = value 
}
// getter for variable classesWithTraits
func (this *RangerFlowParser) Get_classesWithTraits() []*ClassJoinPoint {
  return this.classesWithTraits
}
// setter for variable classesWithTraits
func (this *RangerFlowParser) Set_classesWithTraits( value []*ClassJoinPoint)  {
  this.classesWithTraits = value 
}
// getter for variable collectedIntefaces
func (this *RangerFlowParser) Get_collectedIntefaces() []*RangerAppClassDesc {
  return this.collectedIntefaces
}
// setter for variable collectedIntefaces
func (this *RangerFlowParser) Set_collectedIntefaces( value []*RangerAppClassDesc)  {
  this.collectedIntefaces = value 
}
// getter for variable definedInterfaces
func (this *RangerFlowParser) Get_definedInterfaces() map[string]bool {
  return this.definedInterfaces
}
// setter for variable definedInterfaces
func (this *RangerFlowParser) Set_definedInterfaces( value map[string]bool)  {
  this.definedInterfaces = value 
}
type NodeEvalState struct { 
  ctx *GoNullable /**  unused  **/ 
  is_running bool /**  unused  **/ 
  child_index int64 /**  unused  **/ 
  cmd_index int64 /**  unused  **/ 
  is_ready bool /**  unused  **/ 
  is_waiting bool /**  unused  **/ 
  exit_after bool /**  unused  **/ 
  expand_args bool /**  unused  **/ 
  ask_expand bool /**  unused  **/ 
  eval_rest bool /**  unused  **/ 
  exec_cnt int64 /**  unused  **/ 
  b_debugger bool /**  unused  **/ 
  b_top_node bool /**  unused  **/ 
  ask_eval bool /**  unused  **/ 
  param_eval_on bool /**  unused  **/ 
  eval_index int64 /**  unused  **/ 
  eval_end_index int64 /**  unused  **/ 
  ask_eval_start int64 /**  unused  **/ 
  ask_eval_end int64 /**  unused  **/ 
  evaluating_cmd *GoNullable /**  unused  **/ 
}
type IFACE_NodeEvalState interface { 
  Get_ctx() *GoNullable
  Set_ctx(value *GoNullable) 
  Get_is_running() bool
  Set_is_running(value bool) 
  Get_child_index() int64
  Set_child_index(value int64) 
  Get_cmd_index() int64
  Set_cmd_index(value int64) 
  Get_is_ready() bool
  Set_is_ready(value bool) 
  Get_is_waiting() bool
  Set_is_waiting(value bool) 
  Get_exit_after() bool
  Set_exit_after(value bool) 
  Get_expand_args() bool
  Set_expand_args(value bool) 
  Get_ask_expand() bool
  Set_ask_expand(value bool) 
  Get_eval_rest() bool
  Set_eval_rest(value bool) 
  Get_exec_cnt() int64
  Set_exec_cnt(value int64) 
  Get_b_debugger() bool
  Set_b_debugger(value bool) 
  Get_b_top_node() bool
  Set_b_top_node(value bool) 
  Get_ask_eval() bool
  Set_ask_eval(value bool) 
  Get_param_eval_on() bool
  Set_param_eval_on(value bool) 
  Get_eval_index() int64
  Set_eval_index(value int64) 
  Get_eval_end_index() int64
  Set_eval_end_index(value int64) 
  Get_ask_eval_start() int64
  Set_ask_eval_start(value int64) 
  Get_ask_eval_end() int64
  Set_ask_eval_end(value int64) 
  Get_evaluating_cmd() *GoNullable
  Set_evaluating_cmd(value *GoNullable) 
}

func CreateNew_NodeEvalState() *NodeEvalState {
  me := new(NodeEvalState)
  me.is_running = false
  me.child_index = -1
  me.cmd_index = -1
  me.is_ready = false
  me.is_waiting = false
  me.exit_after = false
  me.expand_args = false
  me.ask_expand = false
  me.eval_rest = false
  me.exec_cnt = 0
  me.b_debugger = false
  me.b_top_node = false
  me.ask_eval = false
  me.param_eval_on = false
  me.eval_index = -1
  me.eval_end_index = -1
  me.ask_eval_start = 0
  me.ask_eval_end = 0
  me.ctx = new(GoNullable);
  me.evaluating_cmd = new(GoNullable);
  return me;
}
// getter for variable ctx
func (this *NodeEvalState) Get_ctx() *GoNullable {
  return this.ctx
}
// setter for variable ctx
func (this *NodeEvalState) Set_ctx( value *GoNullable)  {
  this.ctx = value 
}
// getter for variable is_running
func (this *NodeEvalState) Get_is_running() bool {
  return this.is_running
}
// setter for variable is_running
func (this *NodeEvalState) Set_is_running( value bool)  {
  this.is_running = value 
}
// getter for variable child_index
func (this *NodeEvalState) Get_child_index() int64 {
  return this.child_index
}
// setter for variable child_index
func (this *NodeEvalState) Set_child_index( value int64)  {
  this.child_index = value 
}
// getter for variable cmd_index
func (this *NodeEvalState) Get_cmd_index() int64 {
  return this.cmd_index
}
// setter for variable cmd_index
func (this *NodeEvalState) Set_cmd_index( value int64)  {
  this.cmd_index = value 
}
// getter for variable is_ready
func (this *NodeEvalState) Get_is_ready() bool {
  return this.is_ready
}
// setter for variable is_ready
func (this *NodeEvalState) Set_is_ready( value bool)  {
  this.is_ready = value 
}
// getter for variable is_waiting
func (this *NodeEvalState) Get_is_waiting() bool {
  return this.is_waiting
}
// setter for variable is_waiting
func (this *NodeEvalState) Set_is_waiting( value bool)  {
  this.is_waiting = value 
}
// getter for variable exit_after
func (this *NodeEvalState) Get_exit_after() bool {
  return this.exit_after
}
// setter for variable exit_after
func (this *NodeEvalState) Set_exit_after( value bool)  {
  this.exit_after = value 
}
// getter for variable expand_args
func (this *NodeEvalState) Get_expand_args() bool {
  return this.expand_args
}
// setter for variable expand_args
func (this *NodeEvalState) Set_expand_args( value bool)  {
  this.expand_args = value 
}
// getter for variable ask_expand
func (this *NodeEvalState) Get_ask_expand() bool {
  return this.ask_expand
}
// setter for variable ask_expand
func (this *NodeEvalState) Set_ask_expand( value bool)  {
  this.ask_expand = value 
}
// getter for variable eval_rest
func (this *NodeEvalState) Get_eval_rest() bool {
  return this.eval_rest
}
// setter for variable eval_rest
func (this *NodeEvalState) Set_eval_rest( value bool)  {
  this.eval_rest = value 
}
// getter for variable exec_cnt
func (this *NodeEvalState) Get_exec_cnt() int64 {
  return this.exec_cnt
}
// setter for variable exec_cnt
func (this *NodeEvalState) Set_exec_cnt( value int64)  {
  this.exec_cnt = value 
}
// getter for variable b_debugger
func (this *NodeEvalState) Get_b_debugger() bool {
  return this.b_debugger
}
// setter for variable b_debugger
func (this *NodeEvalState) Set_b_debugger( value bool)  {
  this.b_debugger = value 
}
// getter for variable b_top_node
func (this *NodeEvalState) Get_b_top_node() bool {
  return this.b_top_node
}
// setter for variable b_top_node
func (this *NodeEvalState) Set_b_top_node( value bool)  {
  this.b_top_node = value 
}
// getter for variable ask_eval
func (this *NodeEvalState) Get_ask_eval() bool {
  return this.ask_eval
}
// setter for variable ask_eval
func (this *NodeEvalState) Set_ask_eval( value bool)  {
  this.ask_eval = value 
}
// getter for variable param_eval_on
func (this *NodeEvalState) Get_param_eval_on() bool {
  return this.param_eval_on
}
// setter for variable param_eval_on
func (this *NodeEvalState) Set_param_eval_on( value bool)  {
  this.param_eval_on = value 
}
// getter for variable eval_index
func (this *NodeEvalState) Get_eval_index() int64 {
  return this.eval_index
}
// setter for variable eval_index
func (this *NodeEvalState) Set_eval_index( value int64)  {
  this.eval_index = value 
}
// getter for variable eval_end_index
func (this *NodeEvalState) Get_eval_end_index() int64 {
  return this.eval_end_index
}
// setter for variable eval_end_index
func (this *NodeEvalState) Set_eval_end_index( value int64)  {
  this.eval_end_index = value 
}
// getter for variable ask_eval_start
func (this *NodeEvalState) Get_ask_eval_start() int64 {
  return this.ask_eval_start
}
// setter for variable ask_eval_start
func (this *NodeEvalState) Set_ask_eval_start( value int64)  {
  this.ask_eval_start = value 
}
// getter for variable ask_eval_end
func (this *NodeEvalState) Get_ask_eval_end() int64 {
  return this.ask_eval_end
}
// setter for variable ask_eval_end
func (this *NodeEvalState) Set_ask_eval_end( value int64)  {
  this.ask_eval_end = value 
}
// getter for variable evaluating_cmd
func (this *NodeEvalState) Get_evaluating_cmd() *GoNullable {
  return this.evaluating_cmd
}
// setter for variable evaluating_cmd
func (this *NodeEvalState) Set_evaluating_cmd( value *GoNullable)  {
  this.evaluating_cmd = value 
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
  CreateLambdaCall(node *CodeNode, ctx *RangerAppWriterContext, wr *CodeWriter) ()
  CreateLambda(node *CodeNode, ctx *RangerAppWriterContext, wr *CodeWriter) ()
  writeFnCall(node *CodeNode, ctx *RangerAppWriterContext, wr *CodeWriter) ()
  writeNewCall(node *CodeNode, ctx *RangerAppWriterContext, wr *CodeWriter) ()
  writeInterface(cl *RangerAppClassDesc, ctx *RangerAppWriterContext, wr *CodeWriter) ()
  disabledVarDef(node *CodeNode, ctx *RangerAppWriterContext, wr *CodeWriter) ()
  writeClass(node *CodeNode, ctx *RangerAppWriterContext, wr *CodeWriter) ()
}

func CreateNew_RangerGenericClassWriter() *RangerGenericClassWriter {
  me := new(RangerGenericClassWriter)
  me.compiler = new(GoNullable);
  return me;
}
func (this *RangerGenericClassWriter) EncodeString (node *CodeNode, ctx *RangerAppWriterContext, wr *CodeWriter) string {
  /** unused:  encoded_str*/
  var str_length int64 = int64(len(node.string_value));
  var encoded_str_2 string = "";
  var ii int64 = 0;
  for ii < str_length {
    var cc int64 = int64(node.string_value[ii]);
    switch (cc ) { 
      case 8 : 
        encoded_str_2 = strings.Join([]string{ (strings.Join([]string{ encoded_str_2,(string([] byte{byte(92)})) }, "")),(string([] byte{byte(98)})) }, ""); 
      case 9 : 
        encoded_str_2 = strings.Join([]string{ (strings.Join([]string{ encoded_str_2,(string([] byte{byte(92)})) }, "")),(string([] byte{byte(116)})) }, ""); 
      case 10 : 
        encoded_str_2 = strings.Join([]string{ (strings.Join([]string{ encoded_str_2,(string([] byte{byte(92)})) }, "")),(string([] byte{byte(110)})) }, ""); 
      case 12 : 
        encoded_str_2 = strings.Join([]string{ (strings.Join([]string{ encoded_str_2,(string([] byte{byte(92)})) }, "")),(string([] byte{byte(102)})) }, ""); 
      case 13 : 
        encoded_str_2 = strings.Join([]string{ (strings.Join([]string{ encoded_str_2,(string([] byte{byte(92)})) }, "")),(string([] byte{byte(114)})) }, ""); 
      case 34 : 
        encoded_str_2 = strings.Join([]string{ (strings.Join([]string{ encoded_str_2,(string([] byte{byte(92)})) }, "")),(string([] byte{byte(34)})) }, ""); 
      case 92 : 
        encoded_str_2 = strings.Join([]string{ (strings.Join([]string{ encoded_str_2,(string([] byte{byte(92)})) }, "")),(string([] byte{byte(92)})) }, ""); 
      default: 
        encoded_str_2 = strings.Join([]string{ encoded_str_2,(string([] byte{byte(cc)})) }, ""); 
    }
    ii = ii + 1; 
  }
  return encoded_str_2;
}
func (this *RangerGenericClassWriter) CustomOperator (node *CodeNode, ctx *RangerAppWriterContext, wr *CodeWriter) () {
}
func (this *RangerGenericClassWriter) WriteSetterVRef (node *CodeNode, ctx *RangerAppWriterContext, wr *CodeWriter) () {
}
func (this *RangerGenericClassWriter) writeArrayTypeDef (node *CodeNode, ctx *RangerAppWriterContext, wr *CodeWriter) () {
}
func (this *RangerGenericClassWriter) WriteEnum (node *CodeNode, ctx *RangerAppWriterContext, wr *CodeWriter) () {
  if  node.eval_type == 11 {
    var rootObjName string = node.ns[0];
    var e *GoNullable = new(GoNullable); 
    e = ctx.getEnum(rootObjName);
    if  e.has_value {
      var enumName string = node.ns[1];
      wr.out(strings.Join([]string{ "",strconv.FormatInt(((r_get_string_int64(e.value.(*RangerAppEnum).values, enumName)).value.(int64)), 10) }, ""), false);
    } else {
      if  node.hasParamDesc {
        var pp *GoNullable = new(GoNullable); 
        pp.value = node.paramDesc.value;
        pp.has_value = node.paramDesc.has_value;
        var nn *GoNullable = new(GoNullable); 
        nn.value = pp.value.(IFACE_RangerAppParamDesc).Get_nameNode().value;
        nn.has_value = pp.value.(IFACE_RangerAppParamDesc).Get_nameNode().has_value;
        this.WriteVRef(nn.value.(*CodeNode), ctx, wr);
      }
    }
  }
}
func (this *RangerGenericClassWriter) WriteScalarValue (node *CodeNode, ctx *RangerAppWriterContext, wr *CodeWriter) () {
  switch (node.value_type ) { 
    case 2 : 
      wr.out(strings.Join([]string{ "",strconv.FormatFloat(node.double_value,'f', 6, 64) }, ""), false);
    case 4 : 
      var s string = this.EncodeString(node, ctx, wr);
      wr.out(strings.Join([]string{ (strings.Join([]string{ "\"",s }, "")),"\"" }, ""), false);
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
  var i int64 = 0;  
  for ; i < int64(len(ctx.localVarNames)) ; i++ {
    n := ctx.localVarNames[i];
    var p *GoNullable = new(GoNullable); 
    p = r_get_string_IFACE_RangerAppParamDesc(ctx.localVariables, n);
    if  p.value.(IFACE_RangerAppParamDesc).Get_ref_cnt() == 0 {
      continue;
    }
    if  p.value.(IFACE_RangerAppParamDesc).isAllocatedType() {
      if  1 == p.value.(IFACE_RangerAppParamDesc).getStrength() {
        if  p.value.(IFACE_RangerAppParamDesc).Get_nameNode().value.(*CodeNode).eval_type == 7 {
        }
        if  p.value.(IFACE_RangerAppParamDesc).Get_nameNode().value.(*CodeNode).eval_type == 6 {
        }
        if  (p.value.(IFACE_RangerAppParamDesc).Get_nameNode().value.(*CodeNode).eval_type != 6) && (p.value.(IFACE_RangerAppParamDesc).Get_nameNode().value.(*CodeNode).eval_type != 7) {
        }
      }
      if  0 == p.value.(IFACE_RangerAppParamDesc).getStrength() {
        if  p.value.(IFACE_RangerAppParamDesc).Get_nameNode().value.(*CodeNode).eval_type == 7 {
        }
        if  p.value.(IFACE_RangerAppParamDesc).Get_nameNode().value.(*CodeNode).eval_type == 6 {
        }
        if  (p.value.(IFACE_RangerAppParamDesc).Get_nameNode().value.(*CodeNode).eval_type != 6) && (p.value.(IFACE_RangerAppParamDesc).Get_nameNode().value.(*CodeNode).eval_type != 7) {
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
      var rootObjName string = node.ns[0];
      var enumName string = node.ns[1];
      var e *GoNullable = new(GoNullable); 
      e = ctx.getEnum(rootObjName);
      if  e.has_value {
        wr.out(strings.Join([]string{ "",strconv.FormatInt(((r_get_string_int64(e.value.(*RangerAppEnum).values, enumName)).value.(int64)), 10) }, ""), false);
        return;
      }
    }
  }
  if  (int64(len(node.nsp))) > 0 {
    var i int64 = 0;  
    for ; i < int64(len(node.nsp)) ; i++ {
      p := node.nsp[i];
      if  i > 0 {
        wr.out(".", false);
      }
      if  (int64(len(p.Get_compiledName()))) > 0 {
        wr.out(this.adjustType(p.Get_compiledName()), false);
      } else {
        if  (int64(len(p.Get_name()))) > 0 {
          wr.out(this.adjustType(p.Get_name()), false);
        } else {
          wr.out(this.adjustType((node.ns[i])), false);
        }
      }
    }
    return;
  }
  var i_1 int64 = 0;  
  for ; i_1 < int64(len(node.ns)) ; i_1++ {
    part := node.ns[i_1];
    if  i_1 > 0 {
      wr.out(".", false);
    }
    wr.out(this.adjustType(part), false);
  }
}
func (this *RangerGenericClassWriter) writeVarDef (node *CodeNode, ctx *RangerAppWriterContext, wr *CodeWriter) () {
  if  node.hasParamDesc {
    var p *GoNullable = new(GoNullable); 
    p.value = node.paramDesc.value;
    p.has_value = node.paramDesc.has_value;
    if  p.value.(IFACE_RangerAppParamDesc).Get_set_cnt() > 0 {
      wr.out(strings.Join([]string{ "var ",p.value.(IFACE_RangerAppParamDesc).Get_name() }, ""), false);
    } else {
      wr.out(strings.Join([]string{ "const ",p.value.(IFACE_RangerAppParamDesc).Get_name() }, ""), false);
    }
    if  (int64(len(node.children))) > 2 {
      wr.out(" = ", false);
      ctx.setInExpr();
      var value *CodeNode = node.getThird();
      this.WalkNode(value, ctx, wr);
      ctx.unsetInExpr();
      wr.out(";", true);
    } else {
      wr.out(";", true);
    }
  }
}
func (this *RangerGenericClassWriter) CreateLambdaCall (node *CodeNode, ctx *RangerAppWriterContext, wr *CodeWriter) () {
  var fName *CodeNode = node.children[0];
  var args *CodeNode = node.children[1];
  this.WriteVRef(fName, ctx, wr);
  wr.out("(", false);
  var i int64 = 0;  
  for ; i < int64(len(args.children)) ; i++ {
    arg := args.children[i];
    if  i > 0 {
      wr.out(", ", false);
    }
    this.WalkNode(arg, ctx, wr);
  }
  wr.out(")", false);
  if  ctx.expressionLevel() == 0 {
    wr.out(";", true);
  }
}
func (this *RangerGenericClassWriter) CreateLambda (node *CodeNode, ctx *RangerAppWriterContext, wr *CodeWriter) () {
  var lambdaCtx *RangerAppWriterContext = node.lambda_ctx.value.(*RangerAppWriterContext);
  var args *CodeNode = node.children[1];
  var body *CodeNode = node.children[2];
  wr.out("(", false);
  var i int64 = 0;  
  for ; i < int64(len(args.children)) ; i++ {
    arg := args.children[i];
    if  i > 0 {
      wr.out(", ", false);
    }
    this.WalkNode(arg, lambdaCtx, wr);
  }
  wr.out(")", false);
  wr.out(" => { ", true);
  wr.indent(1);
  lambdaCtx.restartExpressionLevel();
  var i_1 int64 = 0;  
  for ; i_1 < int64(len(body.children)) ; i_1++ {
    item := body.children[i_1];
    this.WalkNode(item, lambdaCtx, wr);
  }
  wr.newline();
  wr.indent(-1);
  wr.out("}", true);
}
func (this *RangerGenericClassWriter) writeFnCall (node *CodeNode, ctx *RangerAppWriterContext, wr *CodeWriter) () {
  if  node.hasFnCall {
    var fc *CodeNode = node.getFirst();
    this.WriteVRef(fc, ctx, wr);
    wr.out("(", false);
    var givenArgs *CodeNode = node.getSecond();
    ctx.setInExpr();
    var i int64 = 0;  
    for ; i < int64(len(node.fnDesc.value.(*RangerAppFunctionDesc).params)) ; i++ {
      arg := node.fnDesc.value.(*RangerAppFunctionDesc).params[i];
      if  i > 0 {
        wr.out(", ", false);
      }
      if  (int64(len(givenArgs.children))) <= i {
        var defVal *GoNullable = new(GoNullable); 
        defVal = arg.Get_nameNode().value.(*CodeNode).getFlag("default");
        if  defVal.has_value {
          var fc_1 *CodeNode = defVal.value.(*CodeNode).vref_annotation.value.(*CodeNode).getFirst();
          this.WalkNode(fc_1, ctx, wr);
        } else {
          ctx.addError(node, "Default argument was missing");
        }
        continue;
      }
      var n *CodeNode = givenArgs.children[i];
      this.WalkNode(n, ctx, wr);
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
    var cl *GoNullable = new(GoNullable); 
    cl.value = node.clDesc.value;
    cl.has_value = node.clDesc.has_value;
    /** unused:  fc*/
    wr.out(strings.Join([]string{ "new ",node.clDesc.value.(*RangerAppClassDesc).name }, ""), false);
    wr.out("(", false);
    var constr *GoNullable = new(GoNullable); 
    constr.value = cl.value.(*RangerAppClassDesc).constructor_fn.value;
    constr.has_value = cl.value.(*RangerAppClassDesc).constructor_fn.has_value;
    var givenArgs *CodeNode = node.getThird();
    if  constr.has_value {
      var i int64 = 0;  
      for ; i < int64(len(constr.value.(*RangerAppFunctionDesc).params)) ; i++ {
        arg := constr.value.(*RangerAppFunctionDesc).params[i];
        var n *CodeNode = givenArgs.children[i];
        if  i > 0 {
          wr.out(", ", false);
        }
        if  true || (arg.Get_nameNode().has_value) {
          this.WalkNode(n, ctx, wr);
        }
      }
    }
    wr.out(")", false);
  }
}
func (this *RangerGenericClassWriter) writeInterface (cl *RangerAppClassDesc, ctx *RangerAppWriterContext, wr *CodeWriter) () {
}
func (this *RangerGenericClassWriter) disabledVarDef (node *CodeNode, ctx *RangerAppWriterContext, wr *CodeWriter) () {
}
func (this *RangerGenericClassWriter) writeClass (node *CodeNode, ctx *RangerAppWriterContext, wr *CodeWriter) () {
  var cl *GoNullable = new(GoNullable); 
  cl.value = node.clDesc.value;
  cl.has_value = node.clDesc.has_value;
  if  !cl.has_value  {
    return;
  }
  wr.out(strings.Join([]string{ (strings.Join([]string{ "class ",cl.value.(*RangerAppClassDesc).name }, ""))," { " }, ""), true);
  wr.indent(1);
  var i int64 = 0;  
  for ; i < int64(len(cl.value.(*RangerAppClassDesc).variables)) ; i++ {
    pvar := cl.value.(*RangerAppClassDesc).variables[i];
    wr.out(strings.Join([]string{ (strings.Join([]string{ (strings.Join([]string{ (strings.Join([]string{ "/* var ",pvar.Get_name() }, ""))," => " }, "")),pvar.Get_nameNode().value.(*CodeNode).parent.value.(*CodeNode).getCode() }, ""))," */ " }, ""), true);
  }
  var i_1 int64 = 0;  
  for ; i_1 < int64(len(cl.value.(*RangerAppClassDesc).static_methods)) ; i_1++ {
    pvar_1 := cl.value.(*RangerAppClassDesc).static_methods[i_1];
    wr.out(strings.Join([]string{ (strings.Join([]string{ "/* static ",pvar_1.name }, ""))," */ " }, ""), true);
  }
  var i_2 int64 = 0;  
  for ; i_2 < int64(len(cl.value.(*RangerAppClassDesc).defined_variants)) ; i_2++ {
    fnVar := cl.value.(*RangerAppClassDesc).defined_variants[i_2];
    var mVs *GoNullable = new(GoNullable); 
    mVs = r_get_string_RangerAppMethodVariants(cl.value.(*RangerAppClassDesc).method_variants, fnVar);
    var i_3 int64 = 0;  
    for ; i_3 < int64(len(mVs.value.(*RangerAppMethodVariants).variants)) ; i_3++ {
      variant := mVs.value.(*RangerAppMethodVariants).variants[i_3];
      wr.out(strings.Join([]string{ (strings.Join([]string{ "function ",variant.name }, "")),"() {" }, ""), true);
      wr.indent(1);
      wr.newline();
      var subCtx *RangerAppWriterContext = ctx.fork();
      this.WalkNode(variant.fnBody.value.(*CodeNode), subCtx, wr);
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
  signatures map[string]int64
  signature_cnt int64
  iface_created map[string]bool
  // inherited from parent class RangerGenericClassWriter
}
type IFACE_RangerJava7ClassWriter interface { 
  Get_compiler() *GoNullable
  Set_compiler(value *GoNullable) 
  Get_signatures() map[string]int64
  Set_signatures(value map[string]int64) 
  Get_signature_cnt() int64
  Set_signature_cnt(value int64) 
  Get_iface_created() map[string]bool
  Set_iface_created(value map[string]bool) 
  getSignatureInterface(s string) string
  adjustType(tn string) string
  getObjectTypeString(type_string string, ctx *RangerAppWriterContext) string
  getTypeString(type_string string) string
  writeTypeDef(node *CodeNode, ctx *RangerAppWriterContext, wr *CodeWriter) ()
  WriteVRef(node *CodeNode, ctx *RangerAppWriterContext, wr *CodeWriter) ()
  disabledVarDef(node *CodeNode, ctx *RangerAppWriterContext, wr *CodeWriter) ()
  writeVarDef(node *CodeNode, ctx *RangerAppWriterContext, wr *CodeWriter) ()
  writeArgsDef(fnDesc *RangerAppFunctionDesc, ctx *RangerAppWriterContext, wr *CodeWriter) ()
  CustomOperator(node *CodeNode, ctx *RangerAppWriterContext, wr *CodeWriter) ()
  buildLambdaSignature(node *CodeNode) string
  CreateLambdaCall(node *CodeNode, ctx *RangerAppWriterContext, wr *CodeWriter) ()
  CreateLambda(node *CodeNode, ctx *RangerAppWriterContext, wr *CodeWriter) ()
  writeClass(node *CodeNode, ctx *RangerAppWriterContext, orig_wr *CodeWriter) ()
}

func CreateNew_RangerJava7ClassWriter() *RangerJava7ClassWriter {
  me := new(RangerJava7ClassWriter)
  me.signatures = make(map[string]int64)
  me.signature_cnt = 0
  me.iface_created = make(map[string]bool)
  me.compiler = new(GoNullable);
  me.compiler = new(GoNullable);
  return me;
}
func (this *RangerJava7ClassWriter) getSignatureInterface (s string) string {
  var idx *GoNullable = new(GoNullable); 
  idx = r_get_string_int64(this.signatures, s);
  if  idx.has_value {
    return strings.Join([]string{ "LambdaSignature",strconv.FormatInt((idx.value.(int64)), 10) }, "");
  }
  this.signature_cnt = this.signature_cnt + 1; 
  this.signatures[s] = this.signature_cnt
  return strings.Join([]string{ "LambdaSignature",strconv.FormatInt(this.signature_cnt, 10) }, "");
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
    case "charbuffer" : 
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
func (this *RangerJava7ClassWriter) getTypeString (type_string string) string {
  switch (type_string ) { 
    case "int" : 
      return "int";
    case "string" : 
      return "String";
    case "charbuffer" : 
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
func (this *RangerJava7ClassWriter) writeTypeDef (node *CodeNode, ctx *RangerAppWriterContext, wr *CodeWriter) () {
  var v_type int64 = node.value_type;
  var t_name string = node.type_name;
  var a_name string = node.array_type;
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
      a_name = node.eval_array_type; 
    }
    if  (int64(len(node.eval_key_type))) > 0 {
      k_name = node.eval_key_type; 
    }
  }
  if  node.hasFlag("optional") {
    wr.addImport("java.util.Optional");
    wr.out("Optional<", false);
    switch (v_type ) { 
      case 15 : 
        var sig string = this.buildLambdaSignature((node.expression_value.value.(*CodeNode)));
        var iface_name string = this.getSignatureInterface(sig);
        wr.out(iface_name, false);
        if  (r_has_key_string_bool(this.iface_created, iface_name)) == false {
          var fnNode *CodeNode = node.expression_value.value.(*CodeNode).children[0];
          var args *CodeNode = node.expression_value.value.(*CodeNode).children[1];
          this.iface_created[iface_name] = true
          var utilWr *CodeWriter = wr.getFileWriter(".", (strings.Join([]string{ iface_name,".java" }, "")));
          utilWr.out(strings.Join([]string{ (strings.Join([]string{ "public interface ",iface_name }, ""))," { " }, ""), true);
          utilWr.indent(1);
          utilWr.out("public ", false);
          this.writeTypeDef(fnNode, ctx, utilWr);
          utilWr.out(" run(", false);
          var i int64 = 0;  
          for ; i < int64(len(args.children)) ; i++ {
            arg := args.children[i];
            if  i > 0 {
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
        wr.out("byte", false);
      case 13 : 
        wr.out("byte[]", false);
      case 7 : 
        wr.out(strings.Join([]string{ (strings.Join([]string{ (strings.Join([]string{ (strings.Join([]string{ "HashMap<",this.getObjectTypeString(k_name, ctx) }, "")),"," }, "")),this.getObjectTypeString(a_name, ctx) }, "")),">" }, ""), false);
        wr.addImport("java.util.*");
      case 6 : 
        wr.out(strings.Join([]string{ (strings.Join([]string{ "ArrayList<",this.getObjectTypeString(a_name, ctx) }, "")),">" }, ""), false);
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
      case 15 : 
        var sig_1 string = this.buildLambdaSignature((node.expression_value.value.(*CodeNode)));
        var iface_name_1 string = this.getSignatureInterface(sig_1);
        wr.out(iface_name_1, false);
        if  (r_has_key_string_bool(this.iface_created, iface_name_1)) == false {
          var fnNode_1 *CodeNode = node.expression_value.value.(*CodeNode).children[0];
          var args_1 *CodeNode = node.expression_value.value.(*CodeNode).children[1];
          this.iface_created[iface_name_1] = true
          var utilWr_1 *CodeWriter = wr.getFileWriter(".", (strings.Join([]string{ iface_name_1,".java" }, "")));
          utilWr_1.out(strings.Join([]string{ (strings.Join([]string{ "public interface ",iface_name_1 }, ""))," { " }, ""), true);
          utilWr_1.indent(1);
          utilWr_1.out("public ", false);
          this.writeTypeDef(fnNode_1, ctx, utilWr_1);
          utilWr_1.out(" run(", false);
          var i_1 int64 = 0;  
          for ; i_1 < int64(len(args_1.children)) ; i_1++ {
            arg_1 := args_1.children[i_1];
            if  i_1 > 0 {
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
        wr.out(strings.Join([]string{ (strings.Join([]string{ (strings.Join([]string{ (strings.Join([]string{ "HashMap<",this.getObjectTypeString(k_name, ctx) }, "")),"," }, "")),this.getObjectTypeString(a_name, ctx) }, "")),">" }, ""), false);
        wr.addImport("java.util.*");
      case 6 : 
        wr.out(strings.Join([]string{ (strings.Join([]string{ "ArrayList<",this.getObjectTypeString(a_name, ctx) }, "")),">" }, ""), false);
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
      var rootObjName string = node.ns[0];
      var enumName string = node.ns[1];
      var e *GoNullable = new(GoNullable); 
      e = ctx.getEnum(rootObjName);
      if  e.has_value {
        wr.out(strings.Join([]string{ "",strconv.FormatInt(((r_get_string_int64(e.value.(*RangerAppEnum).values, enumName)).value.(int64)), 10) }, ""), false);
        return;
      }
    }
  }
  var max_len int64 = int64(len(node.ns));
  if  (int64(len(node.nsp))) > 0 {
    var i int64 = 0;  
    for ; i < int64(len(node.nsp)) ; i++ {
      p := node.nsp[i];
      if  i == 0 {
        var part string = node.ns[0];
        if  part == "this" {
          wr.out("this", false);
          continue;
        }
      }
      if  i > 0 {
        wr.out(".", false);
      }
      if  (int64(len(p.Get_compiledName()))) > 0 {
        wr.out(this.adjustType(p.Get_compiledName()), false);
      } else {
        if  (int64(len(p.Get_name()))) > 0 {
          wr.out(this.adjustType(p.Get_name()), false);
        } else {
          wr.out(this.adjustType((node.ns[i])), false);
        }
      }
      if  i < (max_len - 1) {
        if  p.Get_nameNode().value.(*CodeNode).hasFlag("optional") {
          wr.out(".get()", false);
        }
      }
    }
    return;
  }
  if  node.hasParamDesc {
    var p_1 *GoNullable = new(GoNullable); 
    p_1.value = node.paramDesc.value;
    p_1.has_value = node.paramDesc.has_value;
    wr.out(p_1.value.(IFACE_RangerAppParamDesc).Get_compiledName(), false);
    return;
  }
  var i_1 int64 = 0;  
  for ; i_1 < int64(len(node.ns)) ; i_1++ {
    part_1 := node.ns[i_1];
    if  i_1 > 0 {
      wr.out(".", false);
    }
    wr.out(this.adjustType(part_1), false);
  }
}
func (this *RangerJava7ClassWriter) disabledVarDef (node *CodeNode, ctx *RangerAppWriterContext, wr *CodeWriter) () {
  if  node.hasParamDesc {
    var nn *CodeNode = node.children[1];
    var p *GoNullable = new(GoNullable); 
    p.value = nn.paramDesc.value;
    p.has_value = nn.paramDesc.has_value;
    if  (p.value.(IFACE_RangerAppParamDesc).Get_ref_cnt() == 0) && (p.value.(IFACE_RangerAppParamDesc).Get_is_class_variable() == false) {
      wr.out("/** unused:  ", false);
    }
    wr.out(p.value.(IFACE_RangerAppParamDesc).Get_compiledName(), false);
    if  (int64(len(node.children))) > 2 {
      wr.out(" = ", false);
      ctx.setInExpr();
      var value *CodeNode = node.getThird();
      this.WalkNode(value, ctx, wr);
      ctx.unsetInExpr();
    } else {
      var b_was_set bool = false;
      if  nn.value_type == 6 {
        wr.out(" = new ", false);
        this.writeTypeDef(p.value.(IFACE_RangerAppParamDesc).Get_nameNode().value.(*CodeNode), ctx, wr);
        wr.out("()", false);
        b_was_set = true; 
      }
      if  nn.value_type == 7 {
        wr.out(" = new ", false);
        this.writeTypeDef(p.value.(IFACE_RangerAppParamDesc).Get_nameNode().value.(*CodeNode), ctx, wr);
        wr.out("()", false);
        b_was_set = true; 
      }
      if  (b_was_set == false) && nn.hasFlag("optional") {
        wr.out(" = Optional.empty()", false);
      }
    }
    if  (p.value.(IFACE_RangerAppParamDesc).Get_ref_cnt() == 0) && (p.value.(IFACE_RangerAppParamDesc).Get_is_class_variable() == true) {
      wr.out("     /** note: unused */", false);
    }
    if  (p.value.(IFACE_RangerAppParamDesc).Get_ref_cnt() == 0) && (p.value.(IFACE_RangerAppParamDesc).Get_is_class_variable() == false) {
      wr.out("   **/ ;", true);
    } else {
      wr.out(";", false);
      wr.newline();
    }
  }
}
func (this *RangerJava7ClassWriter) writeVarDef (node *CodeNode, ctx *RangerAppWriterContext, wr *CodeWriter) () {
  if  node.hasParamDesc {
    var nn *CodeNode = node.children[1];
    var p *GoNullable = new(GoNullable); 
    p.value = nn.paramDesc.value;
    p.has_value = nn.paramDesc.has_value;
    if  (p.value.(IFACE_RangerAppParamDesc).Get_ref_cnt() == 0) && (p.value.(IFACE_RangerAppParamDesc).Get_is_class_variable() == false) {
      wr.out("/** unused:  ", false);
    }
    if  (p.value.(IFACE_RangerAppParamDesc).Get_set_cnt() > 0) || p.value.(IFACE_RangerAppParamDesc).Get_is_class_variable() {
      wr.out("", false);
    } else {
      wr.out("final ", false);
    }
    this.writeTypeDef(p.value.(IFACE_RangerAppParamDesc).Get_nameNode().value.(*CodeNode), ctx, wr);
    wr.out(" ", false);
    wr.out(p.value.(IFACE_RangerAppParamDesc).Get_compiledName(), false);
    if  (int64(len(node.children))) > 2 {
      wr.out(" = ", false);
      ctx.setInExpr();
      var value *CodeNode = node.getThird();
      this.WalkNode(value, ctx, wr);
      ctx.unsetInExpr();
    } else {
      var b_was_set bool = false;
      if  nn.value_type == 6 {
        wr.out(" = new ", false);
        this.writeTypeDef(p.value.(IFACE_RangerAppParamDesc).Get_nameNode().value.(*CodeNode), ctx, wr);
        wr.out("()", false);
        b_was_set = true; 
      }
      if  nn.value_type == 7 {
        wr.out(" = new ", false);
        this.writeTypeDef(p.value.(IFACE_RangerAppParamDesc).Get_nameNode().value.(*CodeNode), ctx, wr);
        wr.out("()", false);
        b_was_set = true; 
      }
      if  (b_was_set == false) && nn.hasFlag("optional") {
        wr.out(" = Optional.empty()", false);
      }
    }
    if  (p.value.(IFACE_RangerAppParamDesc).Get_ref_cnt() == 0) && (p.value.(IFACE_RangerAppParamDesc).Get_is_class_variable() == true) {
      wr.out("     /** note: unused */", false);
    }
    if  (p.value.(IFACE_RangerAppParamDesc).Get_ref_cnt() == 0) && (p.value.(IFACE_RangerAppParamDesc).Get_is_class_variable() == false) {
      wr.out("   **/ ;", true);
    } else {
      wr.out(";", false);
      wr.newline();
    }
  }
}
func (this *RangerJava7ClassWriter) writeArgsDef (fnDesc *RangerAppFunctionDesc, ctx *RangerAppWriterContext, wr *CodeWriter) () {
  var i int64 = 0;  
  for ; i < int64(len(fnDesc.params)) ; i++ {
    arg := fnDesc.params[i];
    if  i > 0 {
      wr.out(",", false);
    }
    wr.out(" ", false);
    this.writeTypeDef(arg.Get_nameNode().value.(*CodeNode), ctx, wr);
    wr.out(strings.Join([]string{ (strings.Join([]string{ " ",arg.Get_name() }, ""))," " }, ""), false);
  }
}
func (this *RangerJava7ClassWriter) CustomOperator (node *CodeNode, ctx *RangerAppWriterContext, wr *CodeWriter) () {
  var fc *CodeNode = node.getFirst();
  var cmd string = fc.vref;
  if  cmd == "return" {
    wr.newline();
    if  (int64(len(node.children))) > 1 {
      var value *CodeNode = node.getSecond();
      if  value.hasParamDesc {
        var nn *CodeNode = value.paramDesc.value.(IFACE_RangerAppParamDesc).Get_nameNode().value.(*CodeNode);
        if  ctx.isDefinedClass(nn.type_name) {
          /** unused:  cl*/
          var activeFn *RangerAppFunctionDesc = ctx.getCurrentMethod();
          var fnNameNode *CodeNode = activeFn.nameNode.value.(*CodeNode);
          if  fnNameNode.hasFlag("optional") {
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
func (this *RangerJava7ClassWriter) buildLambdaSignature (node *CodeNode) string {
  var exp *CodeNode = node;
  var exp_s string = "";
  var fc *CodeNode = exp.getFirst();
  var args *CodeNode = exp.getSecond();
  exp_s = strings.Join([]string{ exp_s,fc.buildTypeSignature() }, ""); 
  exp_s = strings.Join([]string{ exp_s,"(" }, ""); 
  var i int64 = 0;  
  for ; i < int64(len(args.children)) ; i++ {
    arg := args.children[i];
    exp_s = strings.Join([]string{ exp_s,arg.buildTypeSignature() }, ""); 
    exp_s = strings.Join([]string{ exp_s,"," }, ""); 
  }
  exp_s = strings.Join([]string{ exp_s,")" }, ""); 
  return exp_s;
}
func (this *RangerJava7ClassWriter) CreateLambdaCall (node *CodeNode, ctx *RangerAppWriterContext, wr *CodeWriter) () {
  var fName *CodeNode = node.children[0];
  var givenArgs *CodeNode = node.children[1];
  this.WriteVRef(fName, ctx, wr);
  var param IFACE_RangerAppParamDesc = ctx.getVariableDef(fName.vref);
  var args *CodeNode = param.Get_nameNode().value.(*CodeNode).expression_value.value.(*CodeNode).children[1];
  wr.out(".run(", false);
  var i int64 = 0;  
  for ; i < int64(len(args.children)) ; i++ {
    arg := args.children[i];
    var n *CodeNode = givenArgs.children[i];
    if  i > 0 {
      wr.out(", ", false);
    }
    if  arg.value_type != 0 {
      this.WalkNode(n, ctx, wr);
    }
  }
  if  ctx.expressionLevel() == 0 {
    wr.out(");", true);
  } else {
    wr.out(")", false);
  }
}
func (this *RangerJava7ClassWriter) CreateLambda (node *CodeNode, ctx *RangerAppWriterContext, wr *CodeWriter) () {
  var lambdaCtx *RangerAppWriterContext = node.lambda_ctx.value.(*RangerAppWriterContext);
  var fnNode *CodeNode = node.children[0];
  var args *CodeNode = node.children[1];
  var body *CodeNode = node.children[2];
  var sig string = this.buildLambdaSignature(node);
  var iface_name string = this.getSignatureInterface(sig);
  if  (r_has_key_string_bool(this.iface_created, iface_name)) == false {
    this.iface_created[iface_name] = true
    var utilWr *CodeWriter = wr.getFileWriter(".", (strings.Join([]string{ iface_name,".java" }, "")));
    utilWr.out(strings.Join([]string{ (strings.Join([]string{ "public interface ",iface_name }, ""))," { " }, ""), true);
    utilWr.indent(1);
    utilWr.out("public ", false);
    this.writeTypeDef(fnNode, ctx, utilWr);
    utilWr.out(" run(", false);
    var i int64 = 0;  
    for ; i < int64(len(args.children)) ; i++ {
      arg := args.children[i];
      if  i > 0 {
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
  wr.out(strings.Join([]string{ (strings.Join([]string{ "new ",iface_name }, "")),"() { " }, ""), true);
  wr.indent(1);
  wr.out("public ", false);
  this.writeTypeDef(fnNode, ctx, wr);
  wr.out(" run(", false);
  var i_1 int64 = 0;  
  for ; i_1 < int64(len(args.children)) ; i_1++ {
    arg_1 := args.children[i_1];
    if  i_1 > 0 {
      wr.out(", ", false);
    }
    this.writeTypeDef(arg_1, lambdaCtx, wr);
    wr.out(" ", false);
    wr.out(arg_1.vref, false);
  }
  wr.out(") {", true);
  wr.indent(1);
  lambdaCtx.restartExpressionLevel();
  var i_2 int64 = 0;  
  for ; i_2 < int64(len(body.children)) ; i_2++ {
    item := body.children[i_2];
    this.WalkNode(item, lambdaCtx, wr);
  }
  wr.newline();
  var i_3 int64 = 0;  
  for ; i_3 < int64(len(lambdaCtx.captured_variables)) ; i_3++ {
    cname := lambdaCtx.captured_variables[i_3];
    wr.out(strings.Join([]string{ "// captured var ",cname }, ""), true);
  }
  wr.indent(-1);
  wr.out("}", true);
  wr.indent(-1);
  wr.out("}", false);
}
func (this *RangerJava7ClassWriter) writeClass (node *CodeNode, ctx *RangerAppWriterContext, orig_wr *CodeWriter) () {
  var cl *GoNullable = new(GoNullable); 
  cl.value = node.clDesc.value;
  cl.has_value = node.clDesc.has_value;
  if  !cl.has_value  {
    return;
  }
  var declaredVariable map[string]bool = make(map[string]bool);
  if  (int64(len(cl.value.(*RangerAppClassDesc).extends_classes))) > 0 {
    var i int64 = 0;  
    for ; i < int64(len(cl.value.(*RangerAppClassDesc).extends_classes)) ; i++ {
      pName := cl.value.(*RangerAppClassDesc).extends_classes[i];
      var pC *RangerAppClassDesc = ctx.findClass(pName);
      var i_1 int64 = 0;  
      for ; i_1 < int64(len(pC.variables)) ; i_1++ {
        pvar := pC.variables[i_1];
        declaredVariable[pvar.Get_name()] = true
      }
    }
  }
  var wr *CodeWriter = orig_wr.getFileWriter(".", (strings.Join([]string{ cl.value.(*RangerAppClassDesc).name,".java" }, "")));
  var importFork *CodeWriter = wr.fork();
  var i_2 int64 = 0;  
  for ; i_2 < int64(len(cl.value.(*RangerAppClassDesc).capturedLocals)) ; i_2++ {
    dd := cl.value.(*RangerAppClassDesc).capturedLocals[i_2];
    if  dd.Get_is_class_variable() == false {
      wr.out(strings.Join([]string{ "// local captured ",dd.Get_name() }, ""), true);
      fmt.Println( "java captured" )
      fmt.Println( dd.Get_node().value.(*CodeNode).getLineAsString() )
      dd.Get_node().value.(*CodeNode).disabled_node = true; 
      cl.value.(*RangerAppClassDesc).addVariable(dd);
      var csubCtx *GoNullable = new(GoNullable); 
      csubCtx.value = cl.value.(*RangerAppClassDesc).ctx.value;
      csubCtx.has_value = cl.value.(*RangerAppClassDesc).ctx.has_value;
      csubCtx.value.(*RangerAppWriterContext).defineVariable(dd.Get_name(), dd);
      dd.Set_is_class_variable(true); 
    }
  }
  wr.out("", true);
  wr.out(strings.Join([]string{ "class ",cl.value.(*RangerAppClassDesc).name }, ""), false);
  var parentClass *GoNullable = new(GoNullable); 
  if  (int64(len(cl.value.(*RangerAppClassDesc).extends_classes))) > 0 {
    wr.out(" extends ", false);
    var i_3 int64 = 0;  
    for ; i_3 < int64(len(cl.value.(*RangerAppClassDesc).extends_classes)) ; i_3++ {
      pName_1 := cl.value.(*RangerAppClassDesc).extends_classes[i_3];
      wr.out(pName_1, false);
      parentClass.value = ctx.findClass(pName_1);
      parentClass.has_value = true; /* detected as non-optional */
    }
  }
  wr.out(" { ", true);
  wr.indent(1);
  wr.createTag("utilities");
  var i_4 int64 = 0;  
  for ; i_4 < int64(len(cl.value.(*RangerAppClassDesc).variables)) ; i_4++ {
    pvar_1 := cl.value.(*RangerAppClassDesc).variables[i_4];
    if  r_has_key_string_bool(declaredVariable, pvar_1.Get_name()) {
      continue;
    }
    wr.out("public ", false);
    this.writeVarDef(pvar_1.Get_node().value.(*CodeNode), ctx, wr);
  }
  if  cl.value.(*RangerAppClassDesc).has_constructor {
    var constr *GoNullable = new(GoNullable); 
    constr.value = cl.value.(*RangerAppClassDesc).constructor_fn.value;
    constr.has_value = cl.value.(*RangerAppClassDesc).constructor_fn.has_value;
    wr.out("", true);
    wr.out(strings.Join([]string{ cl.value.(*RangerAppClassDesc).name,"(" }, ""), false);
    this.writeArgsDef(constr.value.(*RangerAppFunctionDesc), ctx, wr);
    wr.out(" ) {", true);
    wr.indent(1);
    wr.newline();
    var subCtx *RangerAppWriterContext = constr.value.(*RangerAppFunctionDesc).fnCtx.value.(*RangerAppWriterContext);
    subCtx.is_function = true; 
    this.WalkNode(constr.value.(*RangerAppFunctionDesc).fnBody.value.(*CodeNode), subCtx, wr);
    wr.newline();
    wr.indent(-1);
    wr.out("}", true);
  }
  var i_5 int64 = 0;  
  for ; i_5 < int64(len(cl.value.(*RangerAppClassDesc).static_methods)) ; i_5++ {
    variant := cl.value.(*RangerAppClassDesc).static_methods[i_5];
    wr.out("", true);
    if  variant.nameNode.value.(*CodeNode).hasFlag("main") && (variant.nameNode.value.(*CodeNode).code.value.(*SourceCode).filename != ctx.getRootFile()) {
      continue;
    }
    if  variant.nameNode.value.(*CodeNode).hasFlag("main") {
      wr.out("public static void main(String [] args ) {", true);
    } else {
      wr.out("public static ", false);
      this.writeTypeDef(variant.nameNode.value.(*CodeNode), ctx, wr);
      wr.out(" ", false);
      wr.out(strings.Join([]string{ variant.compiledName,"(" }, ""), false);
      this.writeArgsDef(variant, ctx, wr);
      wr.out(") {", true);
    }
    wr.indent(1);
    wr.newline();
    var subCtx_1 *RangerAppWriterContext = variant.fnCtx.value.(*RangerAppWriterContext);
    subCtx_1.is_function = true; 
    this.WalkNode(variant.fnBody.value.(*CodeNode), subCtx_1, wr);
    wr.newline();
    wr.indent(-1);
    wr.out("}", true);
  }
  var i_6 int64 = 0;  
  for ; i_6 < int64(len(cl.value.(*RangerAppClassDesc).defined_variants)) ; i_6++ {
    fnVar := cl.value.(*RangerAppClassDesc).defined_variants[i_6];
    var mVs *GoNullable = new(GoNullable); 
    mVs = r_get_string_RangerAppMethodVariants(cl.value.(*RangerAppClassDesc).method_variants, fnVar);
    var i_7 int64 = 0;  
    for ; i_7 < int64(len(mVs.value.(*RangerAppMethodVariants).variants)) ; i_7++ {
      variant_1 := mVs.value.(*RangerAppMethodVariants).variants[i_7];
      wr.out("", true);
      wr.out("public ", false);
      this.writeTypeDef(variant_1.nameNode.value.(*CodeNode), ctx, wr);
      wr.out(" ", false);
      wr.out(strings.Join([]string{ variant_1.compiledName,"(" }, ""), false);
      this.writeArgsDef(variant_1, ctx, wr);
      wr.out(") {", true);
      wr.indent(1);
      wr.newline();
      var subCtx_2 *RangerAppWriterContext = variant_1.fnCtx.value.(*RangerAppWriterContext);
      subCtx_2.is_function = true; 
      this.WalkNode(variant_1.fnBody.value.(*CodeNode), subCtx_2, wr);
      wr.newline();
      wr.indent(-1);
      wr.out("}", true);
    }
  }
  wr.indent(-1);
  wr.out("}", true);
  var import_list []string = wr.getImports();
  var i_8 int64 = 0;  
  for ; i_8 < int64(len(import_list)) ; i_8++ {
    codeStr := import_list[i_8];
    importFork.out(strings.Join([]string{ (strings.Join([]string{ "import ",codeStr }, "")),";" }, ""), true);
  }
}
// inherited methods from parent class RangerGenericClassWriter
func (this *RangerJava7ClassWriter) EncodeString (node *CodeNode, ctx *RangerAppWriterContext, wr *CodeWriter) string {
  /** unused:  encoded_str*/
  var str_length int64 = int64(len(node.string_value));
  var encoded_str_2 string = "";
  var ii int64 = 0;
  for ii < str_length {
    var cc int64 = int64(node.string_value[ii]);
    switch (cc ) { 
      case 8 : 
        encoded_str_2 = strings.Join([]string{ (strings.Join([]string{ encoded_str_2,(string([] byte{byte(92)})) }, "")),(string([] byte{byte(98)})) }, ""); 
      case 9 : 
        encoded_str_2 = strings.Join([]string{ (strings.Join([]string{ encoded_str_2,(string([] byte{byte(92)})) }, "")),(string([] byte{byte(116)})) }, ""); 
      case 10 : 
        encoded_str_2 = strings.Join([]string{ (strings.Join([]string{ encoded_str_2,(string([] byte{byte(92)})) }, "")),(string([] byte{byte(110)})) }, ""); 
      case 12 : 
        encoded_str_2 = strings.Join([]string{ (strings.Join([]string{ encoded_str_2,(string([] byte{byte(92)})) }, "")),(string([] byte{byte(102)})) }, ""); 
      case 13 : 
        encoded_str_2 = strings.Join([]string{ (strings.Join([]string{ encoded_str_2,(string([] byte{byte(92)})) }, "")),(string([] byte{byte(114)})) }, ""); 
      case 34 : 
        encoded_str_2 = strings.Join([]string{ (strings.Join([]string{ encoded_str_2,(string([] byte{byte(92)})) }, "")),(string([] byte{byte(34)})) }, ""); 
      case 92 : 
        encoded_str_2 = strings.Join([]string{ (strings.Join([]string{ encoded_str_2,(string([] byte{byte(92)})) }, "")),(string([] byte{byte(92)})) }, ""); 
      default: 
        encoded_str_2 = strings.Join([]string{ encoded_str_2,(string([] byte{byte(cc)})) }, ""); 
    }
    ii = ii + 1; 
  }
  return encoded_str_2;
}
func (this *RangerJava7ClassWriter) WriteSetterVRef (node *CodeNode, ctx *RangerAppWriterContext, wr *CodeWriter) () {
}
func (this *RangerJava7ClassWriter) writeArrayTypeDef (node *CodeNode, ctx *RangerAppWriterContext, wr *CodeWriter) () {
}
func (this *RangerJava7ClassWriter) WriteEnum (node *CodeNode, ctx *RangerAppWriterContext, wr *CodeWriter) () {
  if  node.eval_type == 11 {
    var rootObjName string = node.ns[0];
    var e *GoNullable = new(GoNullable); 
    e = ctx.getEnum(rootObjName);
    if  e.has_value {
      var enumName string = node.ns[1];
      wr.out(strings.Join([]string{ "",strconv.FormatInt(((r_get_string_int64(e.value.(*RangerAppEnum).values, enumName)).value.(int64)), 10) }, ""), false);
    } else {
      if  node.hasParamDesc {
        var pp *GoNullable = new(GoNullable); 
        pp.value = node.paramDesc.value;
        pp.has_value = node.paramDesc.has_value;
        var nn *GoNullable = new(GoNullable); 
        nn.value = pp.value.(IFACE_RangerAppParamDesc).Get_nameNode().value;
        nn.has_value = pp.value.(IFACE_RangerAppParamDesc).Get_nameNode().has_value;
        this.WriteVRef(nn.value.(*CodeNode), ctx, wr);
      }
    }
  }
}
func (this *RangerJava7ClassWriter) WriteScalarValue (node *CodeNode, ctx *RangerAppWriterContext, wr *CodeWriter) () {
  switch (node.value_type ) { 
    case 2 : 
      wr.out(strings.Join([]string{ "",strconv.FormatFloat(node.double_value,'f', 6, 64) }, ""), false);
    case 4 : 
      var s string = this.EncodeString(node, ctx, wr);
      wr.out(strings.Join([]string{ (strings.Join([]string{ "\"",s }, "")),"\"" }, ""), false);
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
  var i int64 = 0;  
  for ; i < int64(len(ctx.localVarNames)) ; i++ {
    n := ctx.localVarNames[i];
    var p *GoNullable = new(GoNullable); 
    p = r_get_string_IFACE_RangerAppParamDesc(ctx.localVariables, n);
    if  p.value.(IFACE_RangerAppParamDesc).Get_ref_cnt() == 0 {
      continue;
    }
    if  p.value.(IFACE_RangerAppParamDesc).isAllocatedType() {
      if  1 == p.value.(IFACE_RangerAppParamDesc).getStrength() {
        if  p.value.(IFACE_RangerAppParamDesc).Get_nameNode().value.(*CodeNode).eval_type == 7 {
        }
        if  p.value.(IFACE_RangerAppParamDesc).Get_nameNode().value.(*CodeNode).eval_type == 6 {
        }
        if  (p.value.(IFACE_RangerAppParamDesc).Get_nameNode().value.(*CodeNode).eval_type != 6) && (p.value.(IFACE_RangerAppParamDesc).Get_nameNode().value.(*CodeNode).eval_type != 7) {
        }
      }
      if  0 == p.value.(IFACE_RangerAppParamDesc).getStrength() {
        if  p.value.(IFACE_RangerAppParamDesc).Get_nameNode().value.(*CodeNode).eval_type == 7 {
        }
        if  p.value.(IFACE_RangerAppParamDesc).Get_nameNode().value.(*CodeNode).eval_type == 6 {
        }
        if  (p.value.(IFACE_RangerAppParamDesc).Get_nameNode().value.(*CodeNode).eval_type != 6) && (p.value.(IFACE_RangerAppParamDesc).Get_nameNode().value.(*CodeNode).eval_type != 7) {
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
    var fc *CodeNode = node.getFirst();
    this.WriteVRef(fc, ctx, wr);
    wr.out("(", false);
    var givenArgs *CodeNode = node.getSecond();
    ctx.setInExpr();
    var i int64 = 0;  
    for ; i < int64(len(node.fnDesc.value.(*RangerAppFunctionDesc).params)) ; i++ {
      arg := node.fnDesc.value.(*RangerAppFunctionDesc).params[i];
      if  i > 0 {
        wr.out(", ", false);
      }
      if  (int64(len(givenArgs.children))) <= i {
        var defVal *GoNullable = new(GoNullable); 
        defVal = arg.Get_nameNode().value.(*CodeNode).getFlag("default");
        if  defVal.has_value {
          var fc_1 *CodeNode = defVal.value.(*CodeNode).vref_annotation.value.(*CodeNode).getFirst();
          this.WalkNode(fc_1, ctx, wr);
        } else {
          ctx.addError(node, "Default argument was missing");
        }
        continue;
      }
      var n *CodeNode = givenArgs.children[i];
      this.WalkNode(n, ctx, wr);
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
    var cl *GoNullable = new(GoNullable); 
    cl.value = node.clDesc.value;
    cl.has_value = node.clDesc.has_value;
    /** unused:  fc*/
    wr.out(strings.Join([]string{ "new ",node.clDesc.value.(*RangerAppClassDesc).name }, ""), false);
    wr.out("(", false);
    var constr *GoNullable = new(GoNullable); 
    constr.value = cl.value.(*RangerAppClassDesc).constructor_fn.value;
    constr.has_value = cl.value.(*RangerAppClassDesc).constructor_fn.has_value;
    var givenArgs *CodeNode = node.getThird();
    if  constr.has_value {
      var i int64 = 0;  
      for ; i < int64(len(constr.value.(*RangerAppFunctionDesc).params)) ; i++ {
        arg := constr.value.(*RangerAppFunctionDesc).params[i];
        var n *CodeNode = givenArgs.children[i];
        if  i > 0 {
          wr.out(", ", false);
        }
        if  true || (arg.Get_nameNode().has_value) {
          this.WalkNode(n, ctx, wr);
        }
      }
    }
    wr.out(")", false);
  }
}
func (this *RangerJava7ClassWriter) writeInterface (cl *RangerAppClassDesc, ctx *RangerAppWriterContext, wr *CodeWriter) () {
}
// getter for variable compiler
func (this *RangerJava7ClassWriter) Get_compiler() *GoNullable {
  return this.compiler
}
// setter for variable compiler
func (this *RangerJava7ClassWriter) Set_compiler( value *GoNullable)  {
  this.compiler = value 
}
// getter for variable signatures
func (this *RangerJava7ClassWriter) Get_signatures() map[string]int64 {
  return this.signatures
}
// setter for variable signatures
func (this *RangerJava7ClassWriter) Set_signatures( value map[string]int64)  {
  this.signatures = value 
}
// getter for variable signature_cnt
func (this *RangerJava7ClassWriter) Get_signature_cnt() int64 {
  return this.signature_cnt
}
// setter for variable signature_cnt
func (this *RangerJava7ClassWriter) Set_signature_cnt( value int64)  {
  this.signature_cnt = value 
}
// getter for variable iface_created
func (this *RangerJava7ClassWriter) Get_iface_created() map[string]bool {
  return this.iface_created
}
// setter for variable iface_created
func (this *RangerJava7ClassWriter) Set_iface_created( value map[string]bool)  {
  this.iface_created = value 
}
// inherited getters and setters from the parent class RangerGenericClassWriter
type RangerSwift3ClassWriter struct { 
  compiler *GoNullable /**  unused  **/ 
  header_created bool
  // inherited from parent class RangerGenericClassWriter
}
type IFACE_RangerSwift3ClassWriter interface { 
  Get_compiler() *GoNullable
  Set_compiler(value *GoNullable) 
  Get_header_created() bool
  Set_header_created(value bool) 
  adjustType(tn string) string
  getObjectTypeString(type_string string, ctx *RangerAppWriterContext) string
  getTypeString(type_string string) string
  writeTypeDef(node *CodeNode, ctx *RangerAppWriterContext, wr *CodeWriter) ()
  WriteEnum(node *CodeNode, ctx *RangerAppWriterContext, wr *CodeWriter) ()
  WriteVRef(node *CodeNode, ctx *RangerAppWriterContext, wr *CodeWriter) ()
  writeVarDef(node *CodeNode, ctx *RangerAppWriterContext, wr *CodeWriter) ()
  writeArgsDef(fnDesc *RangerAppFunctionDesc, ctx *RangerAppWriterContext, wr *CodeWriter) ()
  writeFnCall(node *CodeNode, ctx *RangerAppWriterContext, wr *CodeWriter) ()
  CreateLambdaCall(node *CodeNode, ctx *RangerAppWriterContext, wr *CodeWriter) ()
  CreateLambda(node *CodeNode, ctx *RangerAppWriterContext, wr *CodeWriter) ()
  writeNewCall(node *CodeNode, ctx *RangerAppWriterContext, wr *CodeWriter) ()
  haveSameSig(fn1 *RangerAppFunctionDesc, fn2 *RangerAppFunctionDesc, ctx *RangerAppWriterContext) bool
  writeClass(node *CodeNode, ctx *RangerAppWriterContext, wr *CodeWriter) ()
}

func CreateNew_RangerSwift3ClassWriter() *RangerSwift3ClassWriter {
  me := new(RangerSwift3ClassWriter)
  me.header_created = false
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
    case "charbuffer" : 
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
    case "charbuffer" : 
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
func (this *RangerSwift3ClassWriter) writeTypeDef (node *CodeNode, ctx *RangerAppWriterContext, wr *CodeWriter) () {
  var v_type int64 = node.value_type;
  var t_name string = node.type_name;
  var a_name string = node.array_type;
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
      a_name = node.eval_array_type; 
    }
    if  (int64(len(node.eval_key_type))) > 0 {
      k_name = node.eval_key_type; 
    }
  }
  switch (v_type ) { 
    case 15 : 
      var rv *CodeNode = node.expression_value.value.(*CodeNode).children[0];
      var sec *CodeNode = node.expression_value.value.(*CodeNode).children[1];
      /** unused:  fc*/
      wr.out("(", false);
      var i int64 = 0;  
      for ; i < int64(len(sec.children)) ; i++ {
        arg := sec.children[i];
        if  i > 0 {
          wr.out(", ", false);
        }
        wr.out(" _ : ", false);
        this.writeTypeDef(arg, ctx, wr);
      }
      wr.out(") -> ", false);
      this.writeTypeDef(rv, ctx, wr);
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
      wr.out(strings.Join([]string{ (strings.Join([]string{ (strings.Join([]string{ (strings.Join([]string{ "[",this.getObjectTypeString(k_name, ctx) }, "")),":" }, "")),this.getObjectTypeString(a_name, ctx) }, "")),"]" }, ""), false);
    case 6 : 
      wr.out(strings.Join([]string{ (strings.Join([]string{ "[",this.getObjectTypeString(a_name, ctx) }, "")),"]" }, ""), false);
    default: 
      if  t_name == "void" {
        wr.out("Void", false);
        return;
      }
      wr.out(this.getTypeString(t_name), false);
  }
  if  node.hasFlag("optional") {
    wr.out("?", false);
  }
}
func (this *RangerSwift3ClassWriter) WriteEnum (node *CodeNode, ctx *RangerAppWriterContext, wr *CodeWriter) () {
  if  node.eval_type == 11 {
    var rootObjName string = node.ns[0];
    var e *GoNullable = new(GoNullable); 
    e = ctx.getEnum(rootObjName);
    if  e.has_value {
      var enumName string = node.ns[1];
      wr.out(strings.Join([]string{ "",strconv.FormatInt(((r_get_string_int64(e.value.(*RangerAppEnum).values, enumName)).value.(int64)), 10) }, ""), false);
    } else {
      if  node.hasParamDesc {
        var pp *GoNullable = new(GoNullable); 
        pp.value = node.paramDesc.value;
        pp.has_value = node.paramDesc.has_value;
        var nn *GoNullable = new(GoNullable); 
        nn.value = pp.value.(IFACE_RangerAppParamDesc).Get_nameNode().value;
        nn.has_value = pp.value.(IFACE_RangerAppParamDesc).Get_nameNode().has_value;
        wr.out(nn.value.(*CodeNode).vref, false);
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
      var rootObjName string = node.ns[0];
      var enumName string = node.ns[1];
      var e *GoNullable = new(GoNullable); 
      e = ctx.getEnum(rootObjName);
      if  e.has_value {
        wr.out(strings.Join([]string{ "",strconv.FormatInt(((r_get_string_int64(e.value.(*RangerAppEnum).values, enumName)).value.(int64)), 10) }, ""), false);
        return;
      }
    }
  }
  var max_len int64 = int64(len(node.ns));
  if  (int64(len(node.nsp))) > 0 {
    var i int64 = 0;  
    for ; i < int64(len(node.nsp)) ; i++ {
      p := node.nsp[i];
      if  i == 0 {
        var part string = node.ns[0];
        if  part == "this" {
          wr.out("self", false);
          continue;
        }
      }
      if  i > 0 {
        wr.out(".", false);
      }
      if  (int64(len(p.Get_compiledName()))) > 0 {
        wr.out(this.adjustType(p.Get_compiledName()), false);
      } else {
        if  (int64(len(p.Get_name()))) > 0 {
          wr.out(this.adjustType(p.Get_name()), false);
        } else {
          wr.out(this.adjustType((node.ns[i])), false);
        }
      }
      if  i < (max_len - 1) {
        if  p.Get_nameNode().value.(*CodeNode).hasFlag("optional") {
          wr.out("!", false);
        }
      }
    }
    return;
  }
  if  node.hasParamDesc {
    var p_1 *GoNullable = new(GoNullable); 
    p_1.value = node.paramDesc.value;
    p_1.has_value = node.paramDesc.has_value;
    wr.out(p_1.value.(IFACE_RangerAppParamDesc).Get_compiledName(), false);
    return;
  }
  var i_1 int64 = 0;  
  for ; i_1 < int64(len(node.ns)) ; i_1++ {
    part_1 := node.ns[i_1];
    if  i_1 > 0 {
      wr.out(".", false);
    }
    wr.out(this.adjustType(part_1), false);
  }
}
func (this *RangerSwift3ClassWriter) writeVarDef (node *CodeNode, ctx *RangerAppWriterContext, wr *CodeWriter) () {
  if  node.hasParamDesc {
    var nn *CodeNode = node.children[1];
    var p *GoNullable = new(GoNullable); 
    p.value = nn.paramDesc.value;
    p.has_value = nn.paramDesc.has_value;
    if  (p.value.(IFACE_RangerAppParamDesc).Get_ref_cnt() == 0) && (p.value.(IFACE_RangerAppParamDesc).Get_is_class_variable() == false) {
      wr.out("/** unused:  ", false);
    }
    if  (p.value.(IFACE_RangerAppParamDesc).Get_set_cnt() > 0) || p.value.(IFACE_RangerAppParamDesc).Get_is_class_variable() {
      wr.out(strings.Join([]string{ (strings.Join([]string{ "var ",p.value.(IFACE_RangerAppParamDesc).Get_compiledName() }, ""))," : " }, ""), false);
    } else {
      wr.out(strings.Join([]string{ (strings.Join([]string{ "let ",p.value.(IFACE_RangerAppParamDesc).Get_compiledName() }, ""))," : " }, ""), false);
    }
    this.writeTypeDef(p.value.(IFACE_RangerAppParamDesc).Get_nameNode().value.(*CodeNode), ctx, wr);
    if  (int64(len(node.children))) > 2 {
      wr.out(" = ", false);
      ctx.setInExpr();
      var value *CodeNode = node.getThird();
      this.WalkNode(value, ctx, wr);
      ctx.unsetInExpr();
    } else {
      if  nn.value_type == 6 {
        wr.out(" = ", false);
        this.writeTypeDef(p.value.(IFACE_RangerAppParamDesc).Get_nameNode().value.(*CodeNode), ctx, wr);
        wr.out("()", false);
      }
      if  nn.value_type == 7 {
        wr.out(" = ", false);
        this.writeTypeDef(p.value.(IFACE_RangerAppParamDesc).Get_nameNode().value.(*CodeNode), ctx, wr);
        wr.out("()", false);
      }
    }
    if  (p.value.(IFACE_RangerAppParamDesc).Get_ref_cnt() == 0) && (p.value.(IFACE_RangerAppParamDesc).Get_is_class_variable() == true) {
      wr.out("     /** note: unused */", false);
    }
    if  (p.value.(IFACE_RangerAppParamDesc).Get_ref_cnt() == 0) && (p.value.(IFACE_RangerAppParamDesc).Get_is_class_variable() == false) {
      wr.out("   **/ ", true);
    } else {
      wr.newline();
    }
  }
}
func (this *RangerSwift3ClassWriter) writeArgsDef (fnDesc *RangerAppFunctionDesc, ctx *RangerAppWriterContext, wr *CodeWriter) () {
  var i int64 = 0;  
  for ; i < int64(len(fnDesc.params)) ; i++ {
    arg := fnDesc.params[i];
    if  i > 0 {
      wr.out(", ", false);
    }
    wr.out(strings.Join([]string{ arg.Get_name()," : " }, ""), false);
    this.writeTypeDef(arg.Get_nameNode().value.(*CodeNode), ctx, wr);
  }
}
func (this *RangerSwift3ClassWriter) writeFnCall (node *CodeNode, ctx *RangerAppWriterContext, wr *CodeWriter) () {
  if  node.hasFnCall {
    var fc *CodeNode = node.getFirst();
    var fnName *GoNullable = new(GoNullable); 
    fnName.value = node.fnDesc.value.(*RangerAppFunctionDesc).nameNode.value;
    fnName.has_value = node.fnDesc.value.(*RangerAppFunctionDesc).nameNode.has_value;
    if  ctx.expressionLevel() == 0 {
      if  fnName.value.(*CodeNode).type_name != "void" {
        wr.out("_ = ", false);
      }
    }
    this.WriteVRef(fc, ctx, wr);
    wr.out("(", false);
    ctx.setInExpr();
    var givenArgs *CodeNode = node.getSecond();
    var i int64 = 0;  
    for ; i < int64(len(node.fnDesc.value.(*RangerAppFunctionDesc).params)) ; i++ {
      arg := node.fnDesc.value.(*RangerAppFunctionDesc).params[i];
      if  i > 0 {
        wr.out(", ", false);
      }
      if  (int64(len(givenArgs.children))) <= i {
        var defVal *GoNullable = new(GoNullable); 
        defVal = arg.Get_nameNode().value.(*CodeNode).getFlag("default");
        if  defVal.has_value {
          var fc_1 *CodeNode = defVal.value.(*CodeNode).vref_annotation.value.(*CodeNode).getFirst();
          this.WalkNode(fc_1, ctx, wr);
        } else {
          ctx.addError(node, "Default argument was missing");
        }
        continue;
      }
      var n *CodeNode = givenArgs.children[i];
      wr.out(strings.Join([]string{ arg.Get_name()," : " }, ""), false);
      this.WalkNode(n, ctx, wr);
    }
    ctx.unsetInExpr();
    wr.out(")", false);
    if  ctx.expressionLevel() == 0 {
      wr.newline();
    }
  }
}
func (this *RangerSwift3ClassWriter) CreateLambdaCall (node *CodeNode, ctx *RangerAppWriterContext, wr *CodeWriter) () {
  var fName *CodeNode = node.children[0];
  var givenArgs *CodeNode = node.children[1];
  this.WriteVRef(fName, ctx, wr);
  var param IFACE_RangerAppParamDesc = ctx.getVariableDef(fName.vref);
  var args *CodeNode = param.Get_nameNode().value.(*CodeNode).expression_value.value.(*CodeNode).children[1];
  wr.out("(", false);
  var i int64 = 0;  
  for ; i < int64(len(args.children)) ; i++ {
    arg := args.children[i];
    var n *CodeNode = givenArgs.children[i];
    if  i > 0 {
      wr.out(", ", false);
    }
    if  arg.value_type != 0 {
      this.WalkNode(n, ctx, wr);
    }
  }
  wr.out(")", false);
  if  ctx.expressionLevel() == 0 {
    wr.out("", true);
  }
}
func (this *RangerSwift3ClassWriter) CreateLambda (node *CodeNode, ctx *RangerAppWriterContext, wr *CodeWriter) () {
  var lambdaCtx *RangerAppWriterContext = node.lambda_ctx.value.(*RangerAppWriterContext);
  var fnNode *CodeNode = node.children[0];
  var args *CodeNode = node.children[1];
  var body *CodeNode = node.children[2];
  wr.out("{ (", false);
  var i int64 = 0;  
  for ; i < int64(len(args.children)) ; i++ {
    arg := args.children[i];
    if  i > 0 {
      wr.out(", ", false);
    }
    wr.out(arg.vref, false);
  }
  wr.out(") ->  ", false);
  this.writeTypeDef(fnNode, lambdaCtx, wr);
  wr.out(" in ", true);
  wr.indent(1);
  lambdaCtx.restartExpressionLevel();
  var i_1 int64 = 0;  
  for ; i_1 < int64(len(body.children)) ; i_1++ {
    item := body.children[i_1];
    this.WalkNode(item, lambdaCtx, wr);
  }
  wr.newline();
  var i_2 int64 = 0;  
  for ; i_2 < int64(len(lambdaCtx.captured_variables)) ; i_2++ {
    cname := lambdaCtx.captured_variables[i_2];
    wr.out(strings.Join([]string{ "// captured var ",cname }, ""), true);
  }
  wr.indent(-1);
  wr.out("}", false);
}
func (this *RangerSwift3ClassWriter) writeNewCall (node *CodeNode, ctx *RangerAppWriterContext, wr *CodeWriter) () {
  if  node.hasNewOper {
    var cl *GoNullable = new(GoNullable); 
    cl.value = node.clDesc.value;
    cl.has_value = node.clDesc.has_value;
    /** unused:  fc*/
    wr.out(node.clDesc.value.(*RangerAppClassDesc).name, false);
    wr.out("(", false);
    var constr *GoNullable = new(GoNullable); 
    constr.value = cl.value.(*RangerAppClassDesc).constructor_fn.value;
    constr.has_value = cl.value.(*RangerAppClassDesc).constructor_fn.has_value;
    var givenArgs *CodeNode = node.getThird();
    if  constr.has_value {
      var i int64 = 0;  
      for ; i < int64(len(constr.value.(*RangerAppFunctionDesc).params)) ; i++ {
        arg := constr.value.(*RangerAppFunctionDesc).params[i];
        var n *CodeNode = givenArgs.children[i];
        if  i > 0 {
          wr.out(", ", false);
        }
        wr.out(strings.Join([]string{ arg.Get_name()," : " }, ""), false);
        this.WalkNode(n, ctx, wr);
      }
    }
    wr.out(")", false);
  }
}
func (this *RangerSwift3ClassWriter) haveSameSig (fn1 *RangerAppFunctionDesc, fn2 *RangerAppFunctionDesc, ctx *RangerAppWriterContext) bool {
  if  fn1.name != fn2.name {
    return false;
  }
  var match *RangerArgMatch = CreateNew_RangerArgMatch();
  var n1 *CodeNode = fn1.nameNode.value.(*CodeNode);
  var n2 *CodeNode = fn1.nameNode.value.(*CodeNode);
  if  match.doesDefsMatch(n1, n2, ctx) == false {
    return false;
  }
  if  (int64(len(fn1.params))) != (int64(len(fn2.params))) {
    return false;
  }
  var i int64 = 0;  
  for ; i < int64(len(fn1.params)) ; i++ {
    p := fn1.params[i];
    var p2 IFACE_RangerAppParamDesc = fn2.params[i];
    if  match.doesDefsMatch((p.Get_nameNode().value.(*CodeNode)), (p2.Get_nameNode().value.(*CodeNode)), ctx) == false {
      return false;
    }
  }
  return true;
}
func (this *RangerSwift3ClassWriter) writeClass (node *CodeNode, ctx *RangerAppWriterContext, wr *CodeWriter) () {
  var cl *GoNullable = new(GoNullable); 
  cl.value = node.clDesc.value;
  cl.has_value = node.clDesc.has_value;
  if  !cl.has_value  {
    return;
  }
  var declaredVariable map[string]bool = make(map[string]bool);
  var declaredFunction map[string]bool = make(map[string]bool);
  if  (int64(len(cl.value.(*RangerAppClassDesc).extends_classes))) > 0 {
    var i int64 = 0;  
    for ; i < int64(len(cl.value.(*RangerAppClassDesc).extends_classes)) ; i++ {
      pName := cl.value.(*RangerAppClassDesc).extends_classes[i];
      var pC *RangerAppClassDesc = ctx.findClass(pName);
      var i_1 int64 = 0;  
      for ; i_1 < int64(len(pC.variables)) ; i_1++ {
        pvar := pC.variables[i_1];
        declaredVariable[pvar.Get_name()] = true
      }
      var i_2 int64 = 0;  
      for ; i_2 < int64(len(pC.defined_variants)) ; i_2++ {
        fnVar := pC.defined_variants[i_2];
        var mVs *GoNullable = new(GoNullable); 
        mVs = r_get_string_RangerAppMethodVariants(pC.method_variants, fnVar);
        var i_3 int64 = 0;  
        for ; i_3 < int64(len(mVs.value.(*RangerAppMethodVariants).variants)) ; i_3++ {
          variant := mVs.value.(*RangerAppMethodVariants).variants[i_3];
          declaredFunction[variant.compiledName] = true
        }
      }
    }
  }
  if  this.header_created == false {
    wr.createTag("utilities");
    this.header_created = true; 
  }
  wr.out(strings.Join([]string{ (strings.Join([]string{ (strings.Join([]string{ (strings.Join([]string{ "func ==(l: ",cl.value.(*RangerAppClassDesc).name }, "")),", r: " }, "")),cl.value.(*RangerAppClassDesc).name }, "")),") -> Bool {" }, ""), true);
  wr.indent(1);
  wr.out("return l == r", true);
  wr.indent(-1);
  wr.out("}", true);
  wr.out(strings.Join([]string{ "class ",cl.value.(*RangerAppClassDesc).name }, ""), false);
  var parentClass *GoNullable = new(GoNullable); 
  if  (int64(len(cl.value.(*RangerAppClassDesc).extends_classes))) > 0 {
    wr.out(" : ", false);
    var i_4 int64 = 0;  
    for ; i_4 < int64(len(cl.value.(*RangerAppClassDesc).extends_classes)) ; i_4++ {
      pName_1 := cl.value.(*RangerAppClassDesc).extends_classes[i_4];
      wr.out(pName_1, false);
      parentClass.value = ctx.findClass(pName_1);
      parentClass.has_value = true; /* detected as non-optional */
    }
  } else {
    wr.out(" : Equatable ", false);
  }
  wr.out(" { ", true);
  wr.indent(1);
  var i_5 int64 = 0;  
  for ; i_5 < int64(len(cl.value.(*RangerAppClassDesc).variables)) ; i_5++ {
    pvar_1 := cl.value.(*RangerAppClassDesc).variables[i_5];
    if  r_has_key_string_bool(declaredVariable, pvar_1.Get_name()) {
      wr.out(strings.Join([]string{ "// WAS DECLARED : ",pvar_1.Get_name() }, ""), true);
      continue;
    }
    this.writeVarDef(pvar_1.Get_node().value.(*CodeNode), ctx, wr);
  }
  if  cl.value.(*RangerAppClassDesc).has_constructor {
    var constr *GoNullable = new(GoNullable); 
    constr.value = cl.value.(*RangerAppClassDesc).constructor_fn.value;
    constr.has_value = cl.value.(*RangerAppClassDesc).constructor_fn.has_value;
    var b_must_override bool = false;
    if ( parentClass.has_value) {
      if  (int64(len(constr.value.(*RangerAppFunctionDesc).params))) == 0 {
        b_must_override = true; 
      } else {
        if  parentClass.value.(*RangerAppClassDesc).has_constructor {
          var p_constr *RangerAppFunctionDesc = parentClass.value.(*RangerAppClassDesc).constructor_fn.value.(*RangerAppFunctionDesc);
          if  this.haveSameSig((constr.value.(*RangerAppFunctionDesc)), p_constr, ctx) {
            b_must_override = true; 
          }
        }
      }
    }
    if  b_must_override {
      wr.out("override ", false);
    }
    wr.out("init(", false);
    this.writeArgsDef(constr.value.(*RangerAppFunctionDesc), ctx, wr);
    wr.out(" ) {", true);
    wr.indent(1);
    if ( parentClass.has_value) {
      wr.out("super.init()", true);
    }
    wr.newline();
    var subCtx *RangerAppWriterContext = constr.value.(*RangerAppFunctionDesc).fnCtx.value.(*RangerAppWriterContext);
    subCtx.is_function = true; 
    this.WalkNode(constr.value.(*RangerAppFunctionDesc).fnBody.value.(*CodeNode), subCtx, wr);
    wr.newline();
    wr.indent(-1);
    wr.out("}", true);
  }
  var i_6 int64 = 0;  
  for ; i_6 < int64(len(cl.value.(*RangerAppClassDesc).static_methods)) ; i_6++ {
    variant_1 := cl.value.(*RangerAppClassDesc).static_methods[i_6];
    if  variant_1.nameNode.value.(*CodeNode).hasFlag("main") {
      continue;
    }
    wr.out(strings.Join([]string{ (strings.Join([]string{ "static func ",variant_1.compiledName }, "")),"(" }, ""), false);
    this.writeArgsDef(variant_1, ctx, wr);
    wr.out(") -> ", false);
    this.writeTypeDef(variant_1.nameNode.value.(*CodeNode), ctx, wr);
    wr.out(" {", true);
    wr.indent(1);
    wr.newline();
    var subCtx_1 *RangerAppWriterContext = variant_1.fnCtx.value.(*RangerAppWriterContext);
    subCtx_1.is_function = true; 
    this.WalkNode(variant_1.fnBody.value.(*CodeNode), subCtx_1, wr);
    wr.newline();
    wr.indent(-1);
    wr.out("}", true);
  }
  var i_7 int64 = 0;  
  for ; i_7 < int64(len(cl.value.(*RangerAppClassDesc).defined_variants)) ; i_7++ {
    fnVar_1 := cl.value.(*RangerAppClassDesc).defined_variants[i_7];
    var mVs_1 *GoNullable = new(GoNullable); 
    mVs_1 = r_get_string_RangerAppMethodVariants(cl.value.(*RangerAppClassDesc).method_variants, fnVar_1);
    var i_8 int64 = 0;  
    for ; i_8 < int64(len(mVs_1.value.(*RangerAppMethodVariants).variants)) ; i_8++ {
      variant_2 := mVs_1.value.(*RangerAppMethodVariants).variants[i_8];
      if  r_has_key_string_bool(declaredFunction, variant_2.name) {
        wr.out("override ", false);
      }
      wr.out(strings.Join([]string{ (strings.Join([]string{ "func ",variant_2.compiledName }, "")),"(" }, ""), false);
      this.writeArgsDef(variant_2, ctx, wr);
      wr.out(") -> ", false);
      this.writeTypeDef(variant_2.nameNode.value.(*CodeNode), ctx, wr);
      wr.out(" {", true);
      wr.indent(1);
      wr.newline();
      var subCtx_2 *RangerAppWriterContext = variant_2.fnCtx.value.(*RangerAppWriterContext);
      subCtx_2.is_function = true; 
      this.WalkNode(variant_2.fnBody.value.(*CodeNode), subCtx_2, wr);
      wr.newline();
      wr.indent(-1);
      wr.out("}", true);
    }
  }
  wr.indent(-1);
  wr.out("}", true);
  var i_9 int64 = 0;  
  for ; i_9 < int64(len(cl.value.(*RangerAppClassDesc).static_methods)) ; i_9++ {
    variant_3 := cl.value.(*RangerAppClassDesc).static_methods[i_9];
    if  variant_3.nameNode.value.(*CodeNode).hasFlag("main") && (variant_3.nameNode.value.(*CodeNode).code.value.(*SourceCode).filename == ctx.getRootFile()) {
      wr.newline();
      wr.out("func __main__swift() {", true);
      wr.indent(1);
      var subCtx_3 *RangerAppWriterContext = variant_3.fnCtx.value.(*RangerAppWriterContext);
      subCtx_3.is_function = true; 
      this.WalkNode(variant_3.fnBody.value.(*CodeNode), subCtx_3, wr);
      wr.newline();
      wr.indent(-1);
      wr.out("}", true);
      wr.out("// call the main function", true);
      wr.out("__main__swift()", true);
    }
  }
}
// inherited methods from parent class RangerGenericClassWriter
func (this *RangerSwift3ClassWriter) EncodeString (node *CodeNode, ctx *RangerAppWriterContext, wr *CodeWriter) string {
  /** unused:  encoded_str*/
  var str_length int64 = int64(len(node.string_value));
  var encoded_str_2 string = "";
  var ii int64 = 0;
  for ii < str_length {
    var cc int64 = int64(node.string_value[ii]);
    switch (cc ) { 
      case 8 : 
        encoded_str_2 = strings.Join([]string{ (strings.Join([]string{ encoded_str_2,(string([] byte{byte(92)})) }, "")),(string([] byte{byte(98)})) }, ""); 
      case 9 : 
        encoded_str_2 = strings.Join([]string{ (strings.Join([]string{ encoded_str_2,(string([] byte{byte(92)})) }, "")),(string([] byte{byte(116)})) }, ""); 
      case 10 : 
        encoded_str_2 = strings.Join([]string{ (strings.Join([]string{ encoded_str_2,(string([] byte{byte(92)})) }, "")),(string([] byte{byte(110)})) }, ""); 
      case 12 : 
        encoded_str_2 = strings.Join([]string{ (strings.Join([]string{ encoded_str_2,(string([] byte{byte(92)})) }, "")),(string([] byte{byte(102)})) }, ""); 
      case 13 : 
        encoded_str_2 = strings.Join([]string{ (strings.Join([]string{ encoded_str_2,(string([] byte{byte(92)})) }, "")),(string([] byte{byte(114)})) }, ""); 
      case 34 : 
        encoded_str_2 = strings.Join([]string{ (strings.Join([]string{ encoded_str_2,(string([] byte{byte(92)})) }, "")),(string([] byte{byte(34)})) }, ""); 
      case 92 : 
        encoded_str_2 = strings.Join([]string{ (strings.Join([]string{ encoded_str_2,(string([] byte{byte(92)})) }, "")),(string([] byte{byte(92)})) }, ""); 
      default: 
        encoded_str_2 = strings.Join([]string{ encoded_str_2,(string([] byte{byte(cc)})) }, ""); 
    }
    ii = ii + 1; 
  }
  return encoded_str_2;
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
      var s string = this.EncodeString(node, ctx, wr);
      wr.out(strings.Join([]string{ (strings.Join([]string{ "\"",s }, "")),"\"" }, ""), false);
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
  var i int64 = 0;  
  for ; i < int64(len(ctx.localVarNames)) ; i++ {
    n := ctx.localVarNames[i];
    var p *GoNullable = new(GoNullable); 
    p = r_get_string_IFACE_RangerAppParamDesc(ctx.localVariables, n);
    if  p.value.(IFACE_RangerAppParamDesc).Get_ref_cnt() == 0 {
      continue;
    }
    if  p.value.(IFACE_RangerAppParamDesc).isAllocatedType() {
      if  1 == p.value.(IFACE_RangerAppParamDesc).getStrength() {
        if  p.value.(IFACE_RangerAppParamDesc).Get_nameNode().value.(*CodeNode).eval_type == 7 {
        }
        if  p.value.(IFACE_RangerAppParamDesc).Get_nameNode().value.(*CodeNode).eval_type == 6 {
        }
        if  (p.value.(IFACE_RangerAppParamDesc).Get_nameNode().value.(*CodeNode).eval_type != 6) && (p.value.(IFACE_RangerAppParamDesc).Get_nameNode().value.(*CodeNode).eval_type != 7) {
        }
      }
      if  0 == p.value.(IFACE_RangerAppParamDesc).getStrength() {
        if  p.value.(IFACE_RangerAppParamDesc).Get_nameNode().value.(*CodeNode).eval_type == 7 {
        }
        if  p.value.(IFACE_RangerAppParamDesc).Get_nameNode().value.(*CodeNode).eval_type == 6 {
        }
        if  (p.value.(IFACE_RangerAppParamDesc).Get_nameNode().value.(*CodeNode).eval_type != 6) && (p.value.(IFACE_RangerAppParamDesc).Get_nameNode().value.(*CodeNode).eval_type != 7) {
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
func (this *RangerSwift3ClassWriter) writeInterface (cl *RangerAppClassDesc, ctx *RangerAppWriterContext, wr *CodeWriter) () {
}
func (this *RangerSwift3ClassWriter) disabledVarDef (node *CodeNode, ctx *RangerAppWriterContext, wr *CodeWriter) () {
}
// getter for variable compiler
func (this *RangerSwift3ClassWriter) Get_compiler() *GoNullable {
  return this.compiler
}
// setter for variable compiler
func (this *RangerSwift3ClassWriter) Set_compiler( value *GoNullable)  {
  this.compiler = value 
}
// getter for variable header_created
func (this *RangerSwift3ClassWriter) Get_header_created() bool {
  return this.header_created
}
// setter for variable header_created
func (this *RangerSwift3ClassWriter) Set_header_created( value bool)  {
  this.header_created = value 
}
// inherited getters and setters from the parent class RangerGenericClassWriter
type RangerCppClassWriter struct { 
  compiler *GoNullable /**  unused  **/ 
  header_created bool
  // inherited from parent class RangerGenericClassWriter
}
type IFACE_RangerCppClassWriter interface { 
  Get_compiler() *GoNullable
  Set_compiler(value *GoNullable) 
  Get_header_created() bool
  Set_header_created(value bool) 
  adjustType(tn string) string
  WriteScalarValue(node *CodeNode, ctx *RangerAppWriterContext, wr *CodeWriter) ()
  getObjectTypeString(type_string string, ctx *RangerAppWriterContext) string
  getTypeString2(type_string string, ctx *RangerAppWriterContext) string
  writePtr(node *CodeNode, ctx *RangerAppWriterContext, wr *CodeWriter) ()
  writeTypeDef(node *CodeNode, ctx *RangerAppWriterContext, wr *CodeWriter) ()
  WriteVRef(node *CodeNode, ctx *RangerAppWriterContext, wr *CodeWriter) ()
  writeVarDef(node *CodeNode, ctx *RangerAppWriterContext, wr *CodeWriter) ()
  disabledVarDef(node *CodeNode, ctx *RangerAppWriterContext, wr *CodeWriter) ()
  CustomOperator(node *CodeNode, ctx *RangerAppWriterContext, wr *CodeWriter) ()
  CreateLambdaCall(node *CodeNode, ctx *RangerAppWriterContext, wr *CodeWriter) ()
  CreateLambda(node *CodeNode, ctx *RangerAppWriterContext, wr *CodeWriter) ()
  writeCppHeaderVar(node *CodeNode, ctx *RangerAppWriterContext, wr *CodeWriter, do_initialize bool) ()
  writeArgsDef(fnDesc *RangerAppFunctionDesc, ctx *RangerAppWriterContext, wr *CodeWriter) ()
  writeFnCall(node *CodeNode, ctx *RangerAppWriterContext, wr *CodeWriter) ()
  writeNewCall(node *CodeNode, ctx *RangerAppWriterContext, wr *CodeWriter) ()
  writeClassHeader(node *CodeNode, ctx *RangerAppWriterContext, wr *CodeWriter) ()
  writeClass(node *CodeNode, ctx *RangerAppWriterContext, orig_wr *CodeWriter) ()
}

func CreateNew_RangerCppClassWriter() *RangerCppClassWriter {
  me := new(RangerCppClassWriter)
  me.header_created = false
  me.compiler = new(GoNullable);
  me.compiler = new(GoNullable);
  return me;
}
func (this *RangerCppClassWriter) adjustType (tn string) string {
  if  tn == "this" {
    return "this";
  }
  return tn;
}
func (this *RangerCppClassWriter) WriteScalarValue (node *CodeNode, ctx *RangerAppWriterContext, wr *CodeWriter) () {
  switch (node.value_type ) { 
    case 2 : 
      wr.out(strings.Join([]string{ "",strconv.FormatFloat(node.double_value,'f', 6, 64) }, ""), false);
    case 4 : 
      var s string = this.EncodeString(node, ctx, wr);
      wr.out(strings.Join([]string{ (strings.Join([]string{ "std::string(",(strings.Join([]string{ (strings.Join([]string{ "\"",s }, "")),"\"" }, "")) }, "")),")" }, ""), false);
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
func (this *RangerCppClassWriter) getObjectTypeString (type_string string, ctx *RangerAppWriterContext) string {
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
  }
  if  ctx.isEnumDefined(type_string) {
    return "int";
  }
  if  ctx.isDefinedClass(type_string) {
    return strings.Join([]string{ (strings.Join([]string{ "std::shared_ptr<",type_string }, "")),">" }, "");
  }
  return type_string;
}
func (this *RangerCppClassWriter) getTypeString2 (type_string string, ctx *RangerAppWriterContext) string {
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
  }
  if  ctx.isEnumDefined(type_string) {
    return "int";
  }
  return type_string;
}
func (this *RangerCppClassWriter) writePtr (node *CodeNode, ctx *RangerAppWriterContext, wr *CodeWriter) () {
  if  node.type_name == "void" {
    return;
  }
}
func (this *RangerCppClassWriter) writeTypeDef (node *CodeNode, ctx *RangerAppWriterContext, wr *CodeWriter) () {
  var v_type int64 = node.value_type;
  var t_name string = node.type_name;
  var a_name string = node.array_type;
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
      a_name = node.eval_array_type; 
    }
    if  (int64(len(node.eval_key_type))) > 0 {
      k_name = node.eval_key_type; 
    }
  }
  switch (v_type ) { 
    case 15 : 
      var rv *CodeNode = node.expression_value.value.(*CodeNode).children[0];
      var sec *CodeNode = node.expression_value.value.(*CodeNode).children[1];
      /** unused:  fc*/
      wr.out("std::function<", false);
      this.writeTypeDef(rv, ctx, wr);
      wr.out("(", false);
      var i int64 = 0;  
      for ; i < int64(len(sec.children)) ; i++ {
        arg := sec.children[i];
        if  i > 0 {
          wr.out(", ", false);
        }
        this.writeTypeDef(arg, ctx, wr);
      }
      wr.out(")>", false);
    case 11 : 
      wr.out("int", false);
    case 3 : 
      if  node.hasFlag("optional") {
        wr.out(" r_optional_primitive<int> ", false);
      } else {
        wr.out("int", false);
      }
    case 12 : 
      wr.out("char", false);
    case 13 : 
      wr.out("const char*", false);
    case 2 : 
      if  node.hasFlag("optional") {
        wr.out(" r_optional_primitive<double> ", false);
      } else {
        wr.out("double", false);
      }
    case 4 : 
      wr.addImport("<string>");
      wr.out("std::string", false);
    case 5 : 
      wr.out("bool", false);
    case 7 : 
      wr.out(strings.Join([]string{ (strings.Join([]string{ (strings.Join([]string{ (strings.Join([]string{ "std::map<",this.getObjectTypeString(k_name, ctx) }, "")),"," }, "")),this.getObjectTypeString(a_name, ctx) }, "")),">" }, ""), false);
      wr.addImport("<map>");
    case 6 : 
      wr.out(strings.Join([]string{ (strings.Join([]string{ "std::vector<",this.getObjectTypeString(a_name, ctx) }, "")),">" }, ""), false);
      wr.addImport("<vector>");
    default: 
      if  node.type_name == "void" {
        wr.out("void", false);
        return;
      }
      if  ctx.isDefinedClass(t_name) {
        var cc *RangerAppClassDesc = ctx.findClass(t_name);
        wr.out("std::shared_ptr<", false);
        wr.out(cc.name, false);
        wr.out(">", false);
        return;
      }
      if  node.hasFlag("optional") {
        wr.out("std::shared_ptr<std::vector<", false);
        wr.out(this.getTypeString2(t_name, ctx), false);
        wr.out(">", false);
        return;
      }
      wr.out(this.getTypeString2(t_name, ctx), false);
  }
}
func (this *RangerCppClassWriter) WriteVRef (node *CodeNode, ctx *RangerAppWriterContext, wr *CodeWriter) () {
  if  node.vref == "this" {
    wr.out("shared_from_this()", false);
    return;
  }
  if  node.eval_type == 11 {
    var rootObjName string = node.ns[0];
    if  (int64(len(node.ns))) > 1 {
      var enumName string = node.ns[1];
      var e *GoNullable = new(GoNullable); 
      e = ctx.getEnum(rootObjName);
      if  e.has_value {
        wr.out(strings.Join([]string{ "",strconv.FormatInt(((r_get_string_int64(e.value.(*RangerAppEnum).values, enumName)).value.(int64)), 10) }, ""), false);
        return;
      }
    }
  }
  var had_static bool = false;
  if  (int64(len(node.nsp))) > 0 {
    var i int64 = 0;  
    for ; i < int64(len(node.nsp)) ; i++ {
      p := node.nsp[i];
      if  i > 0 {
        if  had_static {
          wr.out("::", false);
        } else {
          wr.out("->", false);
        }
      }
      if  i == 0 {
        var part string = node.ns[0];
        if  part == "this" {
          wr.out("this", false);
          continue;
        }
      }
      if  (int64(len(p.Get_compiledName()))) > 0 {
        wr.out(this.adjustType(p.Get_compiledName()), false);
      } else {
        if  (int64(len(p.Get_name()))) > 0 {
          wr.out(this.adjustType(p.Get_name()), false);
        } else {
          wr.out(this.adjustType((node.ns[i])), false);
        }
      }
      if  p.isClass() {
        had_static = true; 
      }
    }
    return;
  }
  if  node.hasParamDesc {
    var p_1 *GoNullable = new(GoNullable); 
    p_1.value = node.paramDesc.value;
    p_1.has_value = node.paramDesc.has_value;
    wr.out(p_1.value.(IFACE_RangerAppParamDesc).Get_compiledName(), false);
    return;
  }
  var i_1 int64 = 0;  
  for ; i_1 < int64(len(node.ns)) ; i_1++ {
    part_1 := node.ns[i_1];
    if  i_1 > 0 {
      if  had_static {
        wr.out("::", false);
      } else {
        wr.out("->", false);
      }
    }
    if  ctx.hasClass(part_1) {
      had_static = true; 
    } else {
      had_static = false; 
    }
    wr.out(this.adjustType(part_1), false);
  }
}
func (this *RangerCppClassWriter) writeVarDef (node *CodeNode, ctx *RangerAppWriterContext, wr *CodeWriter) () {
  if  node.hasParamDesc {
    var nn *CodeNode = node.children[1];
    var p *GoNullable = new(GoNullable); 
    p.value = nn.paramDesc.value;
    p.has_value = nn.paramDesc.has_value;
    if  (p.value.(IFACE_RangerAppParamDesc).Get_ref_cnt() == 0) && (p.value.(IFACE_RangerAppParamDesc).Get_is_class_variable() == false) {
      wr.out("/** unused:  ", false);
    }
    if  (p.value.(IFACE_RangerAppParamDesc).Get_set_cnt() > 0) || p.value.(IFACE_RangerAppParamDesc).Get_is_class_variable() {
      wr.out("", false);
    } else {
      wr.out("", false);
    }
    this.writeTypeDef(p.value.(IFACE_RangerAppParamDesc).Get_nameNode().value.(*CodeNode), ctx, wr);
    wr.out(" ", false);
    wr.out(p.value.(IFACE_RangerAppParamDesc).Get_compiledName(), false);
    if  (int64(len(node.children))) > 2 {
      wr.out(" = ", false);
      ctx.setInExpr();
      var value *CodeNode = node.getThird();
      this.WalkNode(value, ctx, wr);
      ctx.unsetInExpr();
    } else {
    }
    if  (p.value.(IFACE_RangerAppParamDesc).Get_ref_cnt() == 0) && (p.value.(IFACE_RangerAppParamDesc).Get_is_class_variable() == true) {
      wr.out("     /** note: unused */", false);
    }
    if  (p.value.(IFACE_RangerAppParamDesc).Get_ref_cnt() == 0) && (p.value.(IFACE_RangerAppParamDesc).Get_is_class_variable() == false) {
      wr.out("   **/ ;", true);
    } else {
      wr.out(";", false);
      wr.newline();
    }
  }
}
func (this *RangerCppClassWriter) disabledVarDef (node *CodeNode, ctx *RangerAppWriterContext, wr *CodeWriter) () {
  if  node.hasParamDesc {
    var nn *CodeNode = node.children[1];
    var p *GoNullable = new(GoNullable); 
    p.value = nn.paramDesc.value;
    p.has_value = nn.paramDesc.has_value;
    if  (p.value.(IFACE_RangerAppParamDesc).Get_set_cnt() > 0) || p.value.(IFACE_RangerAppParamDesc).Get_is_class_variable() {
      wr.out("", false);
    } else {
      wr.out("", false);
    }
    wr.out(p.value.(IFACE_RangerAppParamDesc).Get_compiledName(), false);
    if  (int64(len(node.children))) > 2 {
      wr.out(" = ", false);
      ctx.setInExpr();
      var value *CodeNode = node.getThird();
      this.WalkNode(value, ctx, wr);
      ctx.unsetInExpr();
    } else {
    }
    wr.out(";", false);
    wr.newline();
  }
}
func (this *RangerCppClassWriter) CustomOperator (node *CodeNode, ctx *RangerAppWriterContext, wr *CodeWriter) () {
  var fc *CodeNode = node.getFirst();
  var cmd string = fc.vref;
  if  cmd == "return" {
    if  ctx.isInMain() {
      wr.out("return 0;", true);
    } else {
      wr.out("return;", true);
    }
    return;
  }
  if  cmd == "switch" {
    var condition *CodeNode = node.getSecond();
    var case_nodes *CodeNode = node.getThird();
    wr.newline();
    var p IFACE_RangerAppParamDesc = CreateNew_RangerAppParamDesc();
    p.Set_name("caseMatched"); 
    p.Set_value_type(5); 
    ctx.defineVariable(p.Get_name(), p);
    wr.out(strings.Join([]string{ (strings.Join([]string{ "bool ",p.Get_compiledName() }, ""))," = false;" }, ""), true);
    var i int64 = 0;  
    for ; i < int64(len(case_nodes.children)) ; i++ {
      ch := case_nodes.children[i];
      var blockName *CodeNode = ch.getFirst();
      if  blockName.vref == "default" {
        var defBlock *CodeNode = ch.getSecond();
        wr.out("if( ! ", false);
        wr.out(p.Get_compiledName(), false);
        wr.out(") {", true);
        wr.indent(1);
        this.WalkNode(defBlock, ctx, wr);
        wr.indent(-1);
        wr.out("}", true);
      } else {
        var caseValue *CodeNode = ch.getSecond();
        var caseBlock *CodeNode = ch.getThird();
        wr.out("if( ", false);
        this.WalkNode(condition, ctx, wr);
        wr.out(" == ", false);
        this.WalkNode(caseValue, ctx, wr);
        wr.out(") {", true);
        wr.indent(1);
        wr.out(strings.Join([]string{ p.Get_compiledName()," = true;" }, ""), true);
        this.WalkNode(caseBlock, ctx, wr);
        wr.indent(-1);
        wr.out("}", true);
      }
    }
  }
}
func (this *RangerCppClassWriter) CreateLambdaCall (node *CodeNode, ctx *RangerAppWriterContext, wr *CodeWriter) () {
  var fName *CodeNode = node.children[0];
  var givenArgs *CodeNode = node.children[1];
  this.WriteVRef(fName, ctx, wr);
  var param IFACE_RangerAppParamDesc = ctx.getVariableDef(fName.vref);
  var args *CodeNode = param.Get_nameNode().value.(*CodeNode).expression_value.value.(*CodeNode).children[1];
  wr.out("(", false);
  var i int64 = 0;  
  for ; i < int64(len(args.children)) ; i++ {
    arg := args.children[i];
    var n *CodeNode = givenArgs.children[i];
    if  i > 0 {
      wr.out(", ", false);
    }
    if  arg.value_type != 0 {
      this.WalkNode(n, ctx, wr);
    }
  }
  wr.out(")", false);
  if  ctx.expressionLevel() == 0 {
    wr.out(";", true);
  }
}
func (this *RangerCppClassWriter) CreateLambda (node *CodeNode, ctx *RangerAppWriterContext, wr *CodeWriter) () {
  var lambdaCtx *RangerAppWriterContext = node.lambda_ctx.value.(*RangerAppWriterContext);
  /** unused:  fnNode*/
  var args *CodeNode = node.children[1];
  var body *CodeNode = node.children[2];
  wr.out("[this", false);
  wr.out("](", false);
  var i int64 = 0;  
  for ; i < int64(len(args.children)) ; i++ {
    arg := args.children[i];
    if  i > 0 {
      wr.out(", ", false);
    }
    this.writeTypeDef(arg, ctx, wr);
    wr.out(" ", false);
    wr.out(arg.vref, false);
  }
  wr.out(") mutable { ", true);
  wr.indent(1);
  lambdaCtx.restartExpressionLevel();
  var i_1 int64 = 0;  
  for ; i_1 < int64(len(body.children)) ; i_1++ {
    item := body.children[i_1];
    this.WalkNode(item, lambdaCtx, wr);
  }
  wr.newline();
  wr.indent(-1);
  wr.out("}", false);
}
func (this *RangerCppClassWriter) writeCppHeaderVar (node *CodeNode, ctx *RangerAppWriterContext, wr *CodeWriter, do_initialize bool) () {
  if  node.hasParamDesc {
    var nn *CodeNode = node.children[1];
    var p *GoNullable = new(GoNullable); 
    p.value = nn.paramDesc.value;
    p.has_value = nn.paramDesc.has_value;
    if  (p.value.(IFACE_RangerAppParamDesc).Get_ref_cnt() == 0) && (p.value.(IFACE_RangerAppParamDesc).Get_is_class_variable() == false) {
      wr.out("/** unused:  ", false);
    }
    if  (p.value.(IFACE_RangerAppParamDesc).Get_set_cnt() > 0) || p.value.(IFACE_RangerAppParamDesc).Get_is_class_variable() {
      wr.out("", false);
    } else {
      wr.out("", false);
    }
    this.writeTypeDef(p.value.(IFACE_RangerAppParamDesc).Get_nameNode().value.(*CodeNode), ctx, wr);
    wr.out(" ", false);
    wr.out(p.value.(IFACE_RangerAppParamDesc).Get_compiledName(), false);
    if  (p.value.(IFACE_RangerAppParamDesc).Get_ref_cnt() == 0) && (p.value.(IFACE_RangerAppParamDesc).Get_is_class_variable() == true) {
      wr.out("     /** note: unused */", false);
    }
    if  (p.value.(IFACE_RangerAppParamDesc).Get_ref_cnt() == 0) && (p.value.(IFACE_RangerAppParamDesc).Get_is_class_variable() == false) {
      wr.out("   **/ ;", true);
    } else {
      wr.out(";", false);
      wr.newline();
    }
  }
}
func (this *RangerCppClassWriter) writeArgsDef (fnDesc *RangerAppFunctionDesc, ctx *RangerAppWriterContext, wr *CodeWriter) () {
  var i int64 = 0;  
  for ; i < int64(len(fnDesc.params)) ; i++ {
    arg := fnDesc.params[i];
    if  i > 0 {
      wr.out(",", false);
    }
    wr.out(" ", false);
    this.writeTypeDef(arg.Get_nameNode().value.(*CodeNode), ctx, wr);
    wr.out(strings.Join([]string{ (strings.Join([]string{ " ",arg.Get_name() }, ""))," " }, ""), false);
  }
}
func (this *RangerCppClassWriter) writeFnCall (node *CodeNode, ctx *RangerAppWriterContext, wr *CodeWriter) () {
  if  node.hasFnCall {
    var fc *CodeNode = node.getFirst();
    this.WriteVRef(fc, ctx, wr);
    wr.out("(", false);
    ctx.setInExpr();
    var givenArgs *CodeNode = node.getSecond();
    var i int64 = 0;  
    for ; i < int64(len(node.fnDesc.value.(*RangerAppFunctionDesc).params)) ; i++ {
      arg := node.fnDesc.value.(*RangerAppFunctionDesc).params[i];
      if  i > 0 {
        wr.out(", ", false);
      }
      if  i >= (int64(len(givenArgs.children))) {
        var defVal *GoNullable = new(GoNullable); 
        defVal = arg.Get_nameNode().value.(*CodeNode).getFlag("default");
        if  defVal.has_value {
          var fc_1 *CodeNode = defVal.value.(*CodeNode).vref_annotation.value.(*CodeNode).getFirst();
          this.WalkNode(fc_1, ctx, wr);
        } else {
          ctx.addError(node, "Default argument was missing");
        }
        continue;
      }
      var n *CodeNode = givenArgs.children[i];
      this.WalkNode(n, ctx, wr);
    }
    ctx.unsetInExpr();
    wr.out(")", false);
    if  ctx.expressionLevel() == 0 {
      wr.out(";", true);
    }
  }
}
func (this *RangerCppClassWriter) writeNewCall (node *CodeNode, ctx *RangerAppWriterContext, wr *CodeWriter) () {
  if  node.hasNewOper {
    var cl *GoNullable = new(GoNullable); 
    cl.value = node.clDesc.value;
    cl.has_value = node.clDesc.has_value;
    /** unused:  fc*/
    wr.out(" std::make_shared<", false);
    wr.out(node.clDesc.value.(*RangerAppClassDesc).name, false);
    wr.out(">(", false);
    var constr *GoNullable = new(GoNullable); 
    constr.value = cl.value.(*RangerAppClassDesc).constructor_fn.value;
    constr.has_value = cl.value.(*RangerAppClassDesc).constructor_fn.has_value;
    var givenArgs *CodeNode = node.getThird();
    if  constr.has_value {
      var i int64 = 0;  
      for ; i < int64(len(constr.value.(*RangerAppFunctionDesc).params)) ; i++ {
        arg := constr.value.(*RangerAppFunctionDesc).params[i];
        var n *CodeNode = givenArgs.children[i];
        if  i > 0 {
          wr.out(", ", false);
        }
        if  true || (arg.Get_nameNode().has_value) {
          this.WalkNode(n, ctx, wr);
        }
      }
    }
    wr.out(")", false);
  }
}
func (this *RangerCppClassWriter) writeClassHeader (node *CodeNode, ctx *RangerAppWriterContext, wr *CodeWriter) () {
  var cl *GoNullable = new(GoNullable); 
  cl.value = node.clDesc.value;
  cl.has_value = node.clDesc.has_value;
  if  !cl.has_value  {
    return;
  }
  wr.out(strings.Join([]string{ "class ",cl.value.(*RangerAppClassDesc).name }, ""), false);
  var parentClass *GoNullable = new(GoNullable); 
  if  (int64(len(cl.value.(*RangerAppClassDesc).extends_classes))) > 0 {
    wr.out(" : ", false);
    var i int64 = 0;  
    for ; i < int64(len(cl.value.(*RangerAppClassDesc).extends_classes)) ; i++ {
      pName := cl.value.(*RangerAppClassDesc).extends_classes[i];
      wr.out("public ", false);
      wr.out(pName, false);
      parentClass.value = ctx.findClass(pName);
      parentClass.has_value = true; /* detected as non-optional */
    }
  } else {
    wr.out(strings.Join([]string{ (strings.Join([]string{ " : public std::enable_shared_from_this<",cl.value.(*RangerAppClassDesc).name }, "")),"> " }, ""), false);
  }
  wr.out(" { ", true);
  wr.indent(1);
  wr.out("public :", true);
  wr.indent(1);
  var i_1 int64 = 0;  
  for ; i_1 < int64(len(cl.value.(*RangerAppClassDesc).variables)) ; i_1++ {
    pvar := cl.value.(*RangerAppClassDesc).variables[i_1];
    this.writeCppHeaderVar(pvar.Get_node().value.(*CodeNode), ctx, wr, false);
  }
  wr.out("/* class constructor */ ", true);
  wr.out(strings.Join([]string{ cl.value.(*RangerAppClassDesc).name,"(" }, ""), false);
  if  cl.value.(*RangerAppClassDesc).has_constructor {
    var constr *GoNullable = new(GoNullable); 
    constr.value = cl.value.(*RangerAppClassDesc).constructor_fn.value;
    constr.has_value = cl.value.(*RangerAppClassDesc).constructor_fn.has_value;
    this.writeArgsDef(constr.value.(*RangerAppFunctionDesc), ctx, wr);
  }
  wr.out(" );", true);
  var i_2 int64 = 0;  
  for ; i_2 < int64(len(cl.value.(*RangerAppClassDesc).static_methods)) ; i_2++ {
    variant := cl.value.(*RangerAppClassDesc).static_methods[i_2];
    if  i_2 == 0 {
      wr.out("/* static methods */ ", true);
    }
    wr.out("static ", false);
    this.writeTypeDef(variant.nameNode.value.(*CodeNode), ctx, wr);
    wr.out(strings.Join([]string{ (strings.Join([]string{ " ",variant.compiledName }, "")),"(" }, ""), false);
    this.writeArgsDef(variant, ctx, wr);
    wr.out(");", true);
  }
  var i_3 int64 = 0;  
  for ; i_3 < int64(len(cl.value.(*RangerAppClassDesc).defined_variants)) ; i_3++ {
    fnVar := cl.value.(*RangerAppClassDesc).defined_variants[i_3];
    if  i_3 == 0 {
      wr.out("/* instance methods */ ", true);
    }
    var mVs *GoNullable = new(GoNullable); 
    mVs = r_get_string_RangerAppMethodVariants(cl.value.(*RangerAppClassDesc).method_variants, fnVar);
    var i_4 int64 = 0;  
    for ; i_4 < int64(len(mVs.value.(*RangerAppMethodVariants).variants)) ; i_4++ {
      variant_1 := mVs.value.(*RangerAppMethodVariants).variants[i_4];
      if  cl.value.(*RangerAppClassDesc).is_inherited {
        wr.out("virtual ", false);
      }
      this.writeTypeDef(variant_1.nameNode.value.(*CodeNode), ctx, wr);
      wr.out(strings.Join([]string{ (strings.Join([]string{ " ",variant_1.compiledName }, "")),"(" }, ""), false);
      this.writeArgsDef(variant_1, ctx, wr);
      wr.out(");", true);
    }
  }
  wr.indent(-1);
  wr.indent(-1);
  wr.out("};", true);
}
func (this *RangerCppClassWriter) writeClass (node *CodeNode, ctx *RangerAppWriterContext, orig_wr *CodeWriter) () {
  var cl *GoNullable = new(GoNullable); 
  cl.value = node.clDesc.value;
  cl.has_value = node.clDesc.has_value;
  var wr *CodeWriter = orig_wr;
  if  !cl.has_value  {
    return;
  }
  if  this.header_created == false {
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
  var classWriter *CodeWriter = orig_wr.getTag("c++ClassDefs");
  var headerWriter *CodeWriter = orig_wr.getTag("c++Header");
  /** unused:  projectName*/
  var i int64 = 0;  
  for ; i < int64(len(cl.value.(*RangerAppClassDesc).capturedLocals)) ; i++ {
    dd := cl.value.(*RangerAppClassDesc).capturedLocals[i];
    if  dd.Get_is_class_variable() == false {
      wr.out(strings.Join([]string{ "// local captured ",dd.Get_name() }, ""), true);
      dd.Get_node().value.(*CodeNode).disabled_node = true; 
      cl.value.(*RangerAppClassDesc).addVariable(dd);
      var csubCtx *GoNullable = new(GoNullable); 
      csubCtx.value = cl.value.(*RangerAppClassDesc).ctx.value;
      csubCtx.has_value = cl.value.(*RangerAppClassDesc).ctx.has_value;
      csubCtx.value.(*RangerAppWriterContext).defineVariable(dd.Get_name(), dd);
      dd.Set_is_class_variable(true); 
    }
  }
  classWriter.out(strings.Join([]string{ (strings.Join([]string{ "class ",cl.value.(*RangerAppClassDesc).name }, "")),";" }, ""), true);
  this.writeClassHeader(node, ctx, headerWriter);
  wr.out("", true);
  wr.out(strings.Join([]string{ (strings.Join([]string{ (strings.Join([]string{ cl.value.(*RangerAppClassDesc).name,"::" }, "")),cl.value.(*RangerAppClassDesc).name }, "")),"(" }, ""), false);
  if  cl.value.(*RangerAppClassDesc).has_constructor {
    var constr *GoNullable = new(GoNullable); 
    constr.value = cl.value.(*RangerAppClassDesc).constructor_fn.value;
    constr.has_value = cl.value.(*RangerAppClassDesc).constructor_fn.has_value;
    this.writeArgsDef(constr.value.(*RangerAppFunctionDesc), ctx, wr);
  }
  wr.out(" ) ", false);
  if  (int64(len(cl.value.(*RangerAppClassDesc).extends_classes))) > 0 {
    var i_1 int64 = 0;  
    for ; i_1 < int64(len(cl.value.(*RangerAppClassDesc).extends_classes)) ; i_1++ {
      pName := cl.value.(*RangerAppClassDesc).extends_classes[i_1];
      var pcc *RangerAppClassDesc = ctx.findClass(pName);
      if  pcc.has_constructor {
        wr.out(strings.Join([]string{ (strings.Join([]string{ " : ",pcc.name }, "")),"(" }, ""), false);
        var constr_1 *GoNullable = new(GoNullable); 
        constr_1.value = cl.value.(*RangerAppClassDesc).constructor_fn.value;
        constr_1.has_value = cl.value.(*RangerAppClassDesc).constructor_fn.has_value;
        var i_2 int64 = 0;  
        for ; i_2 < int64(len(constr_1.value.(*RangerAppFunctionDesc).params)) ; i_2++ {
          arg := constr_1.value.(*RangerAppFunctionDesc).params[i_2];
          if  i_2 > 0 {
            wr.out(",", false);
          }
          wr.out(" ", false);
          wr.out(strings.Join([]string{ (strings.Join([]string{ " ",arg.Get_name() }, ""))," " }, ""), false);
        }
        wr.out(")", false);
      }
    }
  }
  wr.out("{", true);
  wr.indent(1);
  var i_3 int64 = 0;  
  for ; i_3 < int64(len(cl.value.(*RangerAppClassDesc).variables)) ; i_3++ {
    pvar := cl.value.(*RangerAppClassDesc).variables[i_3];
    var nn *CodeNode = pvar.Get_node().value.(*CodeNode);
    if  pvar.Get_is_captured() {
      continue;
    }
    if  (int64(len(nn.children))) > 2 {
      var valueNode *CodeNode = nn.children[2];
      wr.out(strings.Join([]string{ (strings.Join([]string{ "this->",pvar.Get_compiledName() }, ""))," = " }, ""), false);
      this.WalkNode(valueNode, ctx, wr);
      wr.out(";", true);
    }
  }
  if  cl.value.(*RangerAppClassDesc).has_constructor {
    var constr_2 *RangerAppFunctionDesc = cl.value.(*RangerAppClassDesc).constructor_fn.value.(*RangerAppFunctionDesc);
    wr.newline();
    var subCtx *RangerAppWriterContext = constr_2.fnCtx.value.(*RangerAppWriterContext);
    subCtx.is_function = true; 
    this.WalkNode(constr_2.fnBody.value.(*CodeNode), subCtx, wr);
    wr.newline();
  }
  wr.indent(-1);
  wr.out("}", true);
  var i_4 int64 = 0;  
  for ; i_4 < int64(len(cl.value.(*RangerAppClassDesc).static_methods)) ; i_4++ {
    variant := cl.value.(*RangerAppClassDesc).static_methods[i_4];
    if  variant.nameNode.value.(*CodeNode).hasFlag("main") {
      continue;
    }
    wr.out("", true);
    this.writeTypeDef(variant.nameNode.value.(*CodeNode), ctx, wr);
    wr.out(" ", false);
    wr.out(strings.Join([]string{ (strings.Join([]string{ " ",cl.value.(*RangerAppClassDesc).name }, "")),"::" }, ""), false);
    wr.out(strings.Join([]string{ variant.compiledName,"(" }, ""), false);
    this.writeArgsDef(variant, ctx, wr);
    wr.out(") {", true);
    wr.indent(1);
    wr.newline();
    var subCtx_1 *RangerAppWriterContext = variant.fnCtx.value.(*RangerAppWriterContext);
    subCtx_1.is_function = true; 
    this.WalkNode(variant.fnBody.value.(*CodeNode), subCtx_1, wr);
    wr.newline();
    wr.indent(-1);
    wr.out("}", true);
  }
  var i_5 int64 = 0;  
  for ; i_5 < int64(len(cl.value.(*RangerAppClassDesc).defined_variants)) ; i_5++ {
    fnVar := cl.value.(*RangerAppClassDesc).defined_variants[i_5];
    var mVs *GoNullable = new(GoNullable); 
    mVs = r_get_string_RangerAppMethodVariants(cl.value.(*RangerAppClassDesc).method_variants, fnVar);
    var i_6 int64 = 0;  
    for ; i_6 < int64(len(mVs.value.(*RangerAppMethodVariants).variants)) ; i_6++ {
      variant_1 := mVs.value.(*RangerAppMethodVariants).variants[i_6];
      wr.out("", true);
      this.writeTypeDef(variant_1.nameNode.value.(*CodeNode), ctx, wr);
      wr.out(" ", false);
      wr.out(strings.Join([]string{ (strings.Join([]string{ " ",cl.value.(*RangerAppClassDesc).name }, "")),"::" }, ""), false);
      wr.out(strings.Join([]string{ variant_1.compiledName,"(" }, ""), false);
      this.writeArgsDef(variant_1, ctx, wr);
      wr.out(") {", true);
      wr.indent(1);
      wr.newline();
      var subCtx_2 *RangerAppWriterContext = variant_1.fnCtx.value.(*RangerAppWriterContext);
      subCtx_2.is_function = true; 
      this.WalkNode(variant_1.fnBody.value.(*CodeNode), subCtx_2, wr);
      wr.newline();
      wr.indent(-1);
      wr.out("}", true);
    }
  }
  var i_7 int64 = 0;  
  for ; i_7 < int64(len(cl.value.(*RangerAppClassDesc).static_methods)) ; i_7++ {
    variant_2 := cl.value.(*RangerAppClassDesc).static_methods[i_7];
    if  variant_2.nameNode.value.(*CodeNode).hasFlag("main") && (variant_2.nameNode.value.(*CodeNode).code.value.(*SourceCode).filename == ctx.getRootFile()) {
      wr.out("", true);
      wr.out("int main(int argc, char* argv[]) {", true);
      wr.indent(1);
      wr.newline();
      var subCtx_3 *RangerAppWriterContext = variant_2.fnCtx.value.(*RangerAppWriterContext);
      subCtx_3.in_main = true; 
      subCtx_3.is_function = true; 
      this.WalkNode(variant_2.fnBody.value.(*CodeNode), subCtx_3, wr);
      wr.newline();
      wr.out("return 0;", true);
      wr.indent(-1);
      wr.out("}", true);
    }
  }
}
// inherited methods from parent class RangerGenericClassWriter
func (this *RangerCppClassWriter) EncodeString (node *CodeNode, ctx *RangerAppWriterContext, wr *CodeWriter) string {
  /** unused:  encoded_str*/
  var str_length int64 = int64(len(node.string_value));
  var encoded_str_2 string = "";
  var ii int64 = 0;
  for ii < str_length {
    var cc int64 = int64(node.string_value[ii]);
    switch (cc ) { 
      case 8 : 
        encoded_str_2 = strings.Join([]string{ (strings.Join([]string{ encoded_str_2,(string([] byte{byte(92)})) }, "")),(string([] byte{byte(98)})) }, ""); 
      case 9 : 
        encoded_str_2 = strings.Join([]string{ (strings.Join([]string{ encoded_str_2,(string([] byte{byte(92)})) }, "")),(string([] byte{byte(116)})) }, ""); 
      case 10 : 
        encoded_str_2 = strings.Join([]string{ (strings.Join([]string{ encoded_str_2,(string([] byte{byte(92)})) }, "")),(string([] byte{byte(110)})) }, ""); 
      case 12 : 
        encoded_str_2 = strings.Join([]string{ (strings.Join([]string{ encoded_str_2,(string([] byte{byte(92)})) }, "")),(string([] byte{byte(102)})) }, ""); 
      case 13 : 
        encoded_str_2 = strings.Join([]string{ (strings.Join([]string{ encoded_str_2,(string([] byte{byte(92)})) }, "")),(string([] byte{byte(114)})) }, ""); 
      case 34 : 
        encoded_str_2 = strings.Join([]string{ (strings.Join([]string{ encoded_str_2,(string([] byte{byte(92)})) }, "")),(string([] byte{byte(34)})) }, ""); 
      case 92 : 
        encoded_str_2 = strings.Join([]string{ (strings.Join([]string{ encoded_str_2,(string([] byte{byte(92)})) }, "")),(string([] byte{byte(92)})) }, ""); 
      default: 
        encoded_str_2 = strings.Join([]string{ encoded_str_2,(string([] byte{byte(cc)})) }, ""); 
    }
    ii = ii + 1; 
  }
  return encoded_str_2;
}
func (this *RangerCppClassWriter) WriteSetterVRef (node *CodeNode, ctx *RangerAppWriterContext, wr *CodeWriter) () {
}
func (this *RangerCppClassWriter) writeArrayTypeDef (node *CodeNode, ctx *RangerAppWriterContext, wr *CodeWriter) () {
}
func (this *RangerCppClassWriter) WriteEnum (node *CodeNode, ctx *RangerAppWriterContext, wr *CodeWriter) () {
  if  node.eval_type == 11 {
    var rootObjName string = node.ns[0];
    var e *GoNullable = new(GoNullable); 
    e = ctx.getEnum(rootObjName);
    if  e.has_value {
      var enumName string = node.ns[1];
      wr.out(strings.Join([]string{ "",strconv.FormatInt(((r_get_string_int64(e.value.(*RangerAppEnum).values, enumName)).value.(int64)), 10) }, ""), false);
    } else {
      if  node.hasParamDesc {
        var pp *GoNullable = new(GoNullable); 
        pp.value = node.paramDesc.value;
        pp.has_value = node.paramDesc.has_value;
        var nn *GoNullable = new(GoNullable); 
        nn.value = pp.value.(IFACE_RangerAppParamDesc).Get_nameNode().value;
        nn.has_value = pp.value.(IFACE_RangerAppParamDesc).Get_nameNode().has_value;
        this.WriteVRef(nn.value.(*CodeNode), ctx, wr);
      }
    }
  }
}
func (this *RangerCppClassWriter) getTypeString (type_string string) string {
  return type_string;
}
func (this *RangerCppClassWriter) import_lib (lib_name string, ctx *RangerAppWriterContext, wr *CodeWriter) () {
  wr.addImport(lib_name);
}
func (this *RangerCppClassWriter) release_local_vars (node *CodeNode, ctx *RangerAppWriterContext, wr *CodeWriter) () {
  var i int64 = 0;  
  for ; i < int64(len(ctx.localVarNames)) ; i++ {
    n := ctx.localVarNames[i];
    var p *GoNullable = new(GoNullable); 
    p = r_get_string_IFACE_RangerAppParamDesc(ctx.localVariables, n);
    if  p.value.(IFACE_RangerAppParamDesc).Get_ref_cnt() == 0 {
      continue;
    }
    if  p.value.(IFACE_RangerAppParamDesc).isAllocatedType() {
      if  1 == p.value.(IFACE_RangerAppParamDesc).getStrength() {
        if  p.value.(IFACE_RangerAppParamDesc).Get_nameNode().value.(*CodeNode).eval_type == 7 {
        }
        if  p.value.(IFACE_RangerAppParamDesc).Get_nameNode().value.(*CodeNode).eval_type == 6 {
        }
        if  (p.value.(IFACE_RangerAppParamDesc).Get_nameNode().value.(*CodeNode).eval_type != 6) && (p.value.(IFACE_RangerAppParamDesc).Get_nameNode().value.(*CodeNode).eval_type != 7) {
        }
      }
      if  0 == p.value.(IFACE_RangerAppParamDesc).getStrength() {
        if  p.value.(IFACE_RangerAppParamDesc).Get_nameNode().value.(*CodeNode).eval_type == 7 {
        }
        if  p.value.(IFACE_RangerAppParamDesc).Get_nameNode().value.(*CodeNode).eval_type == 6 {
        }
        if  (p.value.(IFACE_RangerAppParamDesc).Get_nameNode().value.(*CodeNode).eval_type != 6) && (p.value.(IFACE_RangerAppParamDesc).Get_nameNode().value.(*CodeNode).eval_type != 7) {
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
func (this *RangerCppClassWriter) WalkNode (node *CodeNode, ctx *RangerAppWriterContext, wr *CodeWriter) () {
  this.compiler.value.(*LiveCompiler).WalkNode(node, ctx, wr);
}
func (this *RangerCppClassWriter) writeRawTypeDef (node *CodeNode, ctx *RangerAppWriterContext, wr *CodeWriter) () {
  this.writeTypeDef(node, ctx, wr);
}
func (this *RangerCppClassWriter) writeInterface (cl *RangerAppClassDesc, ctx *RangerAppWriterContext, wr *CodeWriter) () {
}
// getter for variable compiler
func (this *RangerCppClassWriter) Get_compiler() *GoNullable {
  return this.compiler
}
// setter for variable compiler
func (this *RangerCppClassWriter) Set_compiler( value *GoNullable)  {
  this.compiler = value 
}
// getter for variable header_created
func (this *RangerCppClassWriter) Get_header_created() bool {
  return this.header_created
}
// setter for variable header_created
func (this *RangerCppClassWriter) Set_header_created( value bool)  {
  this.header_created = value 
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
      var s string = this.EncodeString(node, ctx, wr);
      wr.out(strings.Join([]string{ (strings.Join([]string{ "\"",s }, "")),"\"" }, ""), false);
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
  var v_type int64 = node.value_type;
  if  node.eval_type != 0 {
    v_type = node.eval_type; 
  }
  switch (v_type ) { 
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
      var rootObjName string = node.ns[0];
      var enumName string = node.ns[1];
      var e *GoNullable = new(GoNullable); 
      e = ctx.getEnum(rootObjName);
      if  e.has_value {
        wr.out(strings.Join([]string{ "",strconv.FormatInt(((r_get_string_int64(e.value.(*RangerAppEnum).values, enumName)).value.(int64)), 10) }, ""), false);
        return;
      }
    }
  }
  if  (int64(len(node.nsp))) > 0 {
    var i int64 = 0;  
    for ; i < int64(len(node.nsp)) ; i++ {
      p := node.nsp[i];
      if  i > 0 {
        wr.out(".", false);
      }
      if  (int64(len(p.Get_compiledName()))) > 0 {
        wr.out(this.adjustType(p.Get_compiledName()), false);
      } else {
        if  (int64(len(p.Get_name()))) > 0 {
          wr.out(this.adjustType(p.Get_name()), false);
        } else {
          wr.out(this.adjustType((node.ns[i])), false);
        }
      }
      if  i == 0 {
        if  p.Get_nameNode().value.(*CodeNode).hasFlag("optional") {
          wr.out("!!", false);
        }
      }
    }
    return;
  }
  if  node.hasParamDesc {
    var p_1 *GoNullable = new(GoNullable); 
    p_1.value = node.paramDesc.value;
    p_1.has_value = node.paramDesc.has_value;
    wr.out(p_1.value.(IFACE_RangerAppParamDesc).Get_compiledName(), false);
    return;
  }
  var i_1 int64 = 0;  
  for ; i_1 < int64(len(node.ns)) ; i_1++ {
    part := node.ns[i_1];
    if  i_1 > 0 {
      wr.out(".", false);
    }
    wr.out(this.adjustType(part), false);
  }
}
func (this *RangerKotlinClassWriter) writeVarDef (node *CodeNode, ctx *RangerAppWriterContext, wr *CodeWriter) () {
  if  node.hasParamDesc {
    var nn *CodeNode = node.children[1];
    var p *GoNullable = new(GoNullable); 
    p.value = nn.paramDesc.value;
    p.has_value = nn.paramDesc.has_value;
    if  (p.value.(IFACE_RangerAppParamDesc).Get_ref_cnt() == 0) && (p.value.(IFACE_RangerAppParamDesc).Get_is_class_variable() == false) {
      wr.out("/** unused:  ", false);
    }
    if  (p.value.(IFACE_RangerAppParamDesc).Get_set_cnt() > 0) || p.value.(IFACE_RangerAppParamDesc).Get_is_class_variable() {
      wr.out("var ", false);
    } else {
      wr.out("val ", false);
    }
    wr.out(p.value.(IFACE_RangerAppParamDesc).Get_compiledName(), false);
    wr.out(" : ", false);
    this.writeTypeDef(p.value.(IFACE_RangerAppParamDesc).Get_nameNode().value.(*CodeNode), ctx, wr);
    wr.out(" ", false);
    if  (int64(len(node.children))) > 2 {
      wr.out(" = ", false);
      ctx.setInExpr();
      var value *CodeNode = node.getThird();
      this.WalkNode(value, ctx, wr);
      ctx.unsetInExpr();
    } else {
      if  nn.value_type == 6 {
        wr.out(" = arrayListOf()", false);
      }
      if  nn.value_type == 7 {
        wr.out(" = hashMapOf()", false);
      }
    }
    if  (p.value.(IFACE_RangerAppParamDesc).Get_ref_cnt() == 0) && (p.value.(IFACE_RangerAppParamDesc).Get_is_class_variable() == true) {
      wr.out("     /** note: unused */", false);
    }
    if  (p.value.(IFACE_RangerAppParamDesc).Get_ref_cnt() == 0) && (p.value.(IFACE_RangerAppParamDesc).Get_is_class_variable() == false) {
      wr.out("   **/ ;", true);
    } else {
      wr.out(";", false);
      wr.newline();
    }
  }
}
func (this *RangerKotlinClassWriter) writeArgsDef (fnDesc *RangerAppFunctionDesc, ctx *RangerAppWriterContext, wr *CodeWriter) () {
  var i int64 = 0;  
  for ; i < int64(len(fnDesc.params)) ; i++ {
    arg := fnDesc.params[i];
    if  i > 0 {
      wr.out(",", false);
    }
    wr.out(" ", false);
    wr.out(strings.Join([]string{ arg.Get_name()," : " }, ""), false);
    this.writeTypeDef(arg.Get_nameNode().value.(*CodeNode), ctx, wr);
  }
}
func (this *RangerKotlinClassWriter) writeFnCall (node *CodeNode, ctx *RangerAppWriterContext, wr *CodeWriter) () {
  if  node.hasFnCall {
    var fc *CodeNode = node.getFirst();
    this.WriteVRef(fc, ctx, wr);
    wr.out("(", false);
    var givenArgs *CodeNode = node.getSecond();
    var i int64 = 0;  
    for ; i < int64(len(node.fnDesc.value.(*RangerAppFunctionDesc).params)) ; i++ {
      arg := node.fnDesc.value.(*RangerAppFunctionDesc).params[i];
      if  i > 0 {
        wr.out(", ", false);
      }
      if  (int64(len(givenArgs.children))) <= i {
        var defVal *GoNullable = new(GoNullable); 
        defVal = arg.Get_nameNode().value.(*CodeNode).getFlag("default");
        if  defVal.has_value {
          var fc_1 *CodeNode = defVal.value.(*CodeNode).vref_annotation.value.(*CodeNode).getFirst();
          this.WalkNode(fc_1, ctx, wr);
        } else {
          ctx.addError(node, "Default argument was missing");
        }
        continue;
      }
      var n *CodeNode = givenArgs.children[i];
      this.WalkNode(n, ctx, wr);
    }
    wr.out(")", false);
    if  ctx.expressionLevel() == 0 {
      wr.out(";", true);
    }
  }
}
func (this *RangerKotlinClassWriter) writeNewCall (node *CodeNode, ctx *RangerAppWriterContext, wr *CodeWriter) () {
  if  node.hasNewOper {
    var cl *GoNullable = new(GoNullable); 
    cl.value = node.clDesc.value;
    cl.has_value = node.clDesc.has_value;
    /** unused:  fc*/
    wr.out(" ", false);
    wr.out(node.clDesc.value.(*RangerAppClassDesc).name, false);
    wr.out("(", false);
    var constr *GoNullable = new(GoNullable); 
    constr.value = cl.value.(*RangerAppClassDesc).constructor_fn.value;
    constr.has_value = cl.value.(*RangerAppClassDesc).constructor_fn.has_value;
    var givenArgs *CodeNode = node.getThird();
    if  constr.has_value {
      var i int64 = 0;  
      for ; i < int64(len(constr.value.(*RangerAppFunctionDesc).params)) ; i++ {
        arg := constr.value.(*RangerAppFunctionDesc).params[i];
        var n *CodeNode = givenArgs.children[i];
        if  i > 0 {
          wr.out(", ", false);
        }
        if  true || (arg.Get_nameNode().has_value) {
          this.WalkNode(n, ctx, wr);
        }
      }
    }
    wr.out(")", false);
  }
}
func (this *RangerKotlinClassWriter) writeClass (node *CodeNode, ctx *RangerAppWriterContext, orig_wr *CodeWriter) () {
  var cl *GoNullable = new(GoNullable); 
  cl.value = node.clDesc.value;
  cl.has_value = node.clDesc.has_value;
  if  !cl.has_value  {
    return;
  }
  var wr *CodeWriter = orig_wr;
  /** unused:  importFork*/
  wr.out("", true);
  wr.out(strings.Join([]string{ "class ",cl.value.(*RangerAppClassDesc).name }, ""), false);
  if  cl.value.(*RangerAppClassDesc).has_constructor {
    var constr *RangerAppFunctionDesc = cl.value.(*RangerAppClassDesc).constructor_fn.value.(*RangerAppFunctionDesc);
    wr.out("(", false);
    this.writeArgsDef(constr, ctx, wr);
    wr.out(" ) ", true);
  }
  wr.out(" {", true);
  wr.indent(1);
  var i int64 = 0;  
  for ; i < int64(len(cl.value.(*RangerAppClassDesc).variables)) ; i++ {
    pvar := cl.value.(*RangerAppClassDesc).variables[i];
    this.writeVarDef(pvar.Get_node().value.(*CodeNode), ctx, wr);
  }
  if  cl.value.(*RangerAppClassDesc).has_constructor {
    var constr_1 *GoNullable = new(GoNullable); 
    constr_1.value = cl.value.(*RangerAppClassDesc).constructor_fn.value;
    constr_1.has_value = cl.value.(*RangerAppClassDesc).constructor_fn.has_value;
    wr.out("", true);
    wr.out("init {", true);
    wr.indent(1);
    wr.newline();
    var subCtx *RangerAppWriterContext = constr_1.value.(*RangerAppFunctionDesc).fnCtx.value.(*RangerAppWriterContext);
    subCtx.is_function = true; 
    this.WalkNode(constr_1.value.(*RangerAppFunctionDesc).fnBody.value.(*CodeNode), subCtx, wr);
    wr.newline();
    wr.indent(-1);
    wr.out("}", true);
  }
  if  (int64(len(cl.value.(*RangerAppClassDesc).static_methods))) > 0 {
    wr.out("companion object {", true);
    wr.indent(1);
  }
  var i_1 int64 = 0;  
  for ; i_1 < int64(len(cl.value.(*RangerAppClassDesc).static_methods)) ; i_1++ {
    variant := cl.value.(*RangerAppClassDesc).static_methods[i_1];
    wr.out("", true);
    if  variant.nameNode.value.(*CodeNode).hasFlag("main") {
      continue;
    }
    wr.out("fun ", false);
    wr.out(" ", false);
    wr.out(strings.Join([]string{ variant.name,"(" }, ""), false);
    this.writeArgsDef(variant, ctx, wr);
    wr.out(") : ", false);
    this.writeTypeDef(variant.nameNode.value.(*CodeNode), ctx, wr);
    wr.out(" {", true);
    wr.indent(1);
    wr.newline();
    var subCtx_1 *RangerAppWriterContext = variant.fnCtx.value.(*RangerAppWriterContext);
    subCtx_1.is_function = true; 
    this.WalkNode(variant.fnBody.value.(*CodeNode), subCtx_1, wr);
    wr.newline();
    wr.indent(-1);
    wr.out("}", true);
  }
  if  (int64(len(cl.value.(*RangerAppClassDesc).static_methods))) > 0 {
    wr.indent(-1);
    wr.out("}", true);
  }
  var i_2 int64 = 0;  
  for ; i_2 < int64(len(cl.value.(*RangerAppClassDesc).defined_variants)) ; i_2++ {
    fnVar := cl.value.(*RangerAppClassDesc).defined_variants[i_2];
    var mVs *GoNullable = new(GoNullable); 
    mVs = r_get_string_RangerAppMethodVariants(cl.value.(*RangerAppClassDesc).method_variants, fnVar);
    var i_3 int64 = 0;  
    for ; i_3 < int64(len(mVs.value.(*RangerAppMethodVariants).variants)) ; i_3++ {
      variant_1 := mVs.value.(*RangerAppMethodVariants).variants[i_3];
      wr.out("", true);
      wr.out("fun ", false);
      wr.out(" ", false);
      wr.out(strings.Join([]string{ variant_1.name,"(" }, ""), false);
      this.writeArgsDef(variant_1, ctx, wr);
      wr.out(") : ", false);
      this.writeTypeDef(variant_1.nameNode.value.(*CodeNode), ctx, wr);
      wr.out(" {", true);
      wr.indent(1);
      wr.newline();
      var subCtx_2 *RangerAppWriterContext = variant_1.fnCtx.value.(*RangerAppWriterContext);
      subCtx_2.is_function = true; 
      this.WalkNode(variant_1.fnBody.value.(*CodeNode), subCtx_2, wr);
      wr.newline();
      wr.indent(-1);
      wr.out("}", true);
    }
  }
  wr.indent(-1);
  wr.out("}", true);
  var i_4 int64 = 0;  
  for ; i_4 < int64(len(cl.value.(*RangerAppClassDesc).static_methods)) ; i_4++ {
    variant_2 := cl.value.(*RangerAppClassDesc).static_methods[i_4];
    wr.out("", true);
    if  variant_2.nameNode.value.(*CodeNode).hasFlag("main") && (variant_2.nameNode.value.(*CodeNode).code.value.(*SourceCode).filename == ctx.getRootFile()) {
      wr.out("fun main(args : Array<String>) {", true);
      wr.indent(1);
      wr.newline();
      var subCtx_3 *RangerAppWriterContext = variant_2.fnCtx.value.(*RangerAppWriterContext);
      subCtx_3.is_function = true; 
      this.WalkNode(variant_2.fnBody.value.(*CodeNode), subCtx_3, wr);
      wr.newline();
      wr.indent(-1);
      wr.out("}", true);
    }
  }
}
// inherited methods from parent class RangerGenericClassWriter
func (this *RangerKotlinClassWriter) EncodeString (node *CodeNode, ctx *RangerAppWriterContext, wr *CodeWriter) string {
  /** unused:  encoded_str*/
  var str_length int64 = int64(len(node.string_value));
  var encoded_str_2 string = "";
  var ii int64 = 0;
  for ii < str_length {
    var cc int64 = int64(node.string_value[ii]);
    switch (cc ) { 
      case 8 : 
        encoded_str_2 = strings.Join([]string{ (strings.Join([]string{ encoded_str_2,(string([] byte{byte(92)})) }, "")),(string([] byte{byte(98)})) }, ""); 
      case 9 : 
        encoded_str_2 = strings.Join([]string{ (strings.Join([]string{ encoded_str_2,(string([] byte{byte(92)})) }, "")),(string([] byte{byte(116)})) }, ""); 
      case 10 : 
        encoded_str_2 = strings.Join([]string{ (strings.Join([]string{ encoded_str_2,(string([] byte{byte(92)})) }, "")),(string([] byte{byte(110)})) }, ""); 
      case 12 : 
        encoded_str_2 = strings.Join([]string{ (strings.Join([]string{ encoded_str_2,(string([] byte{byte(92)})) }, "")),(string([] byte{byte(102)})) }, ""); 
      case 13 : 
        encoded_str_2 = strings.Join([]string{ (strings.Join([]string{ encoded_str_2,(string([] byte{byte(92)})) }, "")),(string([] byte{byte(114)})) }, ""); 
      case 34 : 
        encoded_str_2 = strings.Join([]string{ (strings.Join([]string{ encoded_str_2,(string([] byte{byte(92)})) }, "")),(string([] byte{byte(34)})) }, ""); 
      case 92 : 
        encoded_str_2 = strings.Join([]string{ (strings.Join([]string{ encoded_str_2,(string([] byte{byte(92)})) }, "")),(string([] byte{byte(92)})) }, ""); 
      default: 
        encoded_str_2 = strings.Join([]string{ encoded_str_2,(string([] byte{byte(cc)})) }, ""); 
    }
    ii = ii + 1; 
  }
  return encoded_str_2;
}
func (this *RangerKotlinClassWriter) CustomOperator (node *CodeNode, ctx *RangerAppWriterContext, wr *CodeWriter) () {
}
func (this *RangerKotlinClassWriter) WriteSetterVRef (node *CodeNode, ctx *RangerAppWriterContext, wr *CodeWriter) () {
}
func (this *RangerKotlinClassWriter) writeArrayTypeDef (node *CodeNode, ctx *RangerAppWriterContext, wr *CodeWriter) () {
}
func (this *RangerKotlinClassWriter) WriteEnum (node *CodeNode, ctx *RangerAppWriterContext, wr *CodeWriter) () {
  if  node.eval_type == 11 {
    var rootObjName string = node.ns[0];
    var e *GoNullable = new(GoNullable); 
    e = ctx.getEnum(rootObjName);
    if  e.has_value {
      var enumName string = node.ns[1];
      wr.out(strings.Join([]string{ "",strconv.FormatInt(((r_get_string_int64(e.value.(*RangerAppEnum).values, enumName)).value.(int64)), 10) }, ""), false);
    } else {
      if  node.hasParamDesc {
        var pp *GoNullable = new(GoNullable); 
        pp.value = node.paramDesc.value;
        pp.has_value = node.paramDesc.has_value;
        var nn *GoNullable = new(GoNullable); 
        nn.value = pp.value.(IFACE_RangerAppParamDesc).Get_nameNode().value;
        nn.has_value = pp.value.(IFACE_RangerAppParamDesc).Get_nameNode().has_value;
        this.WriteVRef(nn.value.(*CodeNode), ctx, wr);
      }
    }
  }
}
func (this *RangerKotlinClassWriter) import_lib (lib_name string, ctx *RangerAppWriterContext, wr *CodeWriter) () {
  wr.addImport(lib_name);
}
func (this *RangerKotlinClassWriter) release_local_vars (node *CodeNode, ctx *RangerAppWriterContext, wr *CodeWriter) () {
  var i int64 = 0;  
  for ; i < int64(len(ctx.localVarNames)) ; i++ {
    n := ctx.localVarNames[i];
    var p *GoNullable = new(GoNullable); 
    p = r_get_string_IFACE_RangerAppParamDesc(ctx.localVariables, n);
    if  p.value.(IFACE_RangerAppParamDesc).Get_ref_cnt() == 0 {
      continue;
    }
    if  p.value.(IFACE_RangerAppParamDesc).isAllocatedType() {
      if  1 == p.value.(IFACE_RangerAppParamDesc).getStrength() {
        if  p.value.(IFACE_RangerAppParamDesc).Get_nameNode().value.(*CodeNode).eval_type == 7 {
        }
        if  p.value.(IFACE_RangerAppParamDesc).Get_nameNode().value.(*CodeNode).eval_type == 6 {
        }
        if  (p.value.(IFACE_RangerAppParamDesc).Get_nameNode().value.(*CodeNode).eval_type != 6) && (p.value.(IFACE_RangerAppParamDesc).Get_nameNode().value.(*CodeNode).eval_type != 7) {
        }
      }
      if  0 == p.value.(IFACE_RangerAppParamDesc).getStrength() {
        if  p.value.(IFACE_RangerAppParamDesc).Get_nameNode().value.(*CodeNode).eval_type == 7 {
        }
        if  p.value.(IFACE_RangerAppParamDesc).Get_nameNode().value.(*CodeNode).eval_type == 6 {
        }
        if  (p.value.(IFACE_RangerAppParamDesc).Get_nameNode().value.(*CodeNode).eval_type != 6) && (p.value.(IFACE_RangerAppParamDesc).Get_nameNode().value.(*CodeNode).eval_type != 7) {
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
func (this *RangerKotlinClassWriter) CreateLambdaCall (node *CodeNode, ctx *RangerAppWriterContext, wr *CodeWriter) () {
  var fName *CodeNode = node.children[0];
  var args *CodeNode = node.children[1];
  this.WriteVRef(fName, ctx, wr);
  wr.out("(", false);
  var i int64 = 0;  
  for ; i < int64(len(args.children)) ; i++ {
    arg := args.children[i];
    if  i > 0 {
      wr.out(", ", false);
    }
    this.WalkNode(arg, ctx, wr);
  }
  wr.out(")", false);
  if  ctx.expressionLevel() == 0 {
    wr.out(";", true);
  }
}
func (this *RangerKotlinClassWriter) CreateLambda (node *CodeNode, ctx *RangerAppWriterContext, wr *CodeWriter) () {
  var lambdaCtx *RangerAppWriterContext = node.lambda_ctx.value.(*RangerAppWriterContext);
  var args *CodeNode = node.children[1];
  var body *CodeNode = node.children[2];
  wr.out("(", false);
  var i int64 = 0;  
  for ; i < int64(len(args.children)) ; i++ {
    arg := args.children[i];
    if  i > 0 {
      wr.out(", ", false);
    }
    this.WalkNode(arg, lambdaCtx, wr);
  }
  wr.out(")", false);
  wr.out(" => { ", true);
  wr.indent(1);
  lambdaCtx.restartExpressionLevel();
  var i_1 int64 = 0;  
  for ; i_1 < int64(len(body.children)) ; i_1++ {
    item := body.children[i_1];
    this.WalkNode(item, lambdaCtx, wr);
  }
  wr.newline();
  wr.indent(-1);
  wr.out("}", true);
}
func (this *RangerKotlinClassWriter) writeInterface (cl *RangerAppClassDesc, ctx *RangerAppWriterContext, wr *CodeWriter) () {
}
func (this *RangerKotlinClassWriter) disabledVarDef (node *CodeNode, ctx *RangerAppWriterContext, wr *CodeWriter) () {
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
  var v_type int64 = node.value_type;
  if  node.eval_type != 0 {
    v_type = node.eval_type; 
  }
  switch (v_type ) { 
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
      var rootObjName string = node.ns[0];
      var enumName string = node.ns[1];
      var e *GoNullable = new(GoNullable); 
      e = ctx.getEnum(rootObjName);
      if  e.has_value {
        wr.out(strings.Join([]string{ "",strconv.FormatInt(((r_get_string_int64(e.value.(*RangerAppEnum).values, enumName)).value.(int64)), 10) }, ""), false);
        return;
      }
    }
  }
  if  (int64(len(node.nsp))) > 0 {
    var i int64 = 0;  
    for ; i < int64(len(node.nsp)) ; i++ {
      p := node.nsp[i];
      if  i > 0 {
        wr.out(".", false);
      }
      if  i == 0 {
        if  p.Get_nameNode().value.(*CodeNode).hasFlag("optional") {
        }
      }
      if  (int64(len(p.Get_compiledName()))) > 0 {
        wr.out(this.adjustType(p.Get_compiledName()), false);
      } else {
        if  (int64(len(p.Get_name()))) > 0 {
          wr.out(this.adjustType(p.Get_name()), false);
        } else {
          wr.out(this.adjustType((node.ns[i])), false);
        }
      }
    }
    return;
  }
  if  node.hasParamDesc {
    var p_1 *GoNullable = new(GoNullable); 
    p_1.value = node.paramDesc.value;
    p_1.has_value = node.paramDesc.has_value;
    wr.out(p_1.value.(IFACE_RangerAppParamDesc).Get_compiledName(), false);
    return;
  }
  var i_1 int64 = 0;  
  for ; i_1 < int64(len(node.ns)) ; i_1++ {
    part := node.ns[i_1];
    if  i_1 > 0 {
      wr.out(".", false);
    }
    wr.out(this.adjustType(part), false);
  }
}
func (this *RangerCSharpClassWriter) writeVarDef (node *CodeNode, ctx *RangerAppWriterContext, wr *CodeWriter) () {
  if  node.hasParamDesc {
    var nn *CodeNode = node.children[1];
    var p *GoNullable = new(GoNullable); 
    p.value = nn.paramDesc.value;
    p.has_value = nn.paramDesc.has_value;
    if  (p.value.(IFACE_RangerAppParamDesc).Get_ref_cnt() == 0) && (p.value.(IFACE_RangerAppParamDesc).Get_is_class_variable() == false) {
      wr.out("/** unused:  ", false);
    }
    if  (p.value.(IFACE_RangerAppParamDesc).Get_set_cnt() > 0) || p.value.(IFACE_RangerAppParamDesc).Get_is_class_variable() {
      wr.out("", false);
    } else {
      wr.out("const ", false);
    }
    this.writeTypeDef(p.value.(IFACE_RangerAppParamDesc).Get_nameNode().value.(*CodeNode), ctx, wr);
    wr.out(" ", false);
    wr.out(p.value.(IFACE_RangerAppParamDesc).Get_compiledName(), false);
    if  (int64(len(node.children))) > 2 {
      wr.out(" = ", false);
      ctx.setInExpr();
      var value *CodeNode = node.getThird();
      this.WalkNode(value, ctx, wr);
      ctx.unsetInExpr();
    } else {
      if  nn.value_type == 6 {
        wr.out(" = new ", false);
        this.writeTypeDef(p.value.(IFACE_RangerAppParamDesc).Get_nameNode().value.(*CodeNode), ctx, wr);
        wr.out("()", false);
      }
      if  nn.value_type == 7 {
        wr.out(" = new ", false);
        this.writeTypeDef(p.value.(IFACE_RangerAppParamDesc).Get_nameNode().value.(*CodeNode), ctx, wr);
        wr.out("()", false);
      }
    }
    if  (p.value.(IFACE_RangerAppParamDesc).Get_ref_cnt() == 0) && (p.value.(IFACE_RangerAppParamDesc).Get_is_class_variable() == true) {
      wr.out("     /** note: unused */", false);
    }
    if  (p.value.(IFACE_RangerAppParamDesc).Get_ref_cnt() == 0) && (p.value.(IFACE_RangerAppParamDesc).Get_is_class_variable() == false) {
      wr.out("   **/ ;", true);
    } else {
      wr.out(";", false);
      wr.newline();
    }
  }
}
func (this *RangerCSharpClassWriter) writeArgsDef (fnDesc *RangerAppFunctionDesc, ctx *RangerAppWriterContext, wr *CodeWriter) () {
  var i int64 = 0;  
  for ; i < int64(len(fnDesc.params)) ; i++ {
    arg := fnDesc.params[i];
    if  i > 0 {
      wr.out(",", false);
    }
    wr.out(" ", false);
    this.writeTypeDef(arg.Get_nameNode().value.(*CodeNode), ctx, wr);
    wr.out(strings.Join([]string{ (strings.Join([]string{ " ",arg.Get_name() }, ""))," " }, ""), false);
  }
}
func (this *RangerCSharpClassWriter) writeClass (node *CodeNode, ctx *RangerAppWriterContext, orig_wr *CodeWriter) () {
  var cl *GoNullable = new(GoNullable); 
  cl.value = node.clDesc.value;
  cl.has_value = node.clDesc.has_value;
  if  !cl.has_value  {
    return;
  }
  var wr *CodeWriter = orig_wr.getFileWriter(".", (strings.Join([]string{ cl.value.(*RangerAppClassDesc).name,".cs" }, "")));
  var importFork *CodeWriter = wr.fork();
  wr.out("", true);
  wr.out(strings.Join([]string{ (strings.Join([]string{ "class ",cl.value.(*RangerAppClassDesc).name }, ""))," {" }, ""), true);
  wr.indent(1);
  var i int64 = 0;  
  for ; i < int64(len(cl.value.(*RangerAppClassDesc).variables)) ; i++ {
    pvar := cl.value.(*RangerAppClassDesc).variables[i];
    wr.out("public ", false);
    this.writeVarDef(pvar.Get_node().value.(*CodeNode), ctx, wr);
  }
  if  cl.value.(*RangerAppClassDesc).has_constructor {
    var constr *RangerAppFunctionDesc = cl.value.(*RangerAppClassDesc).constructor_fn.value.(*RangerAppFunctionDesc);
    wr.out("", true);
    wr.out(strings.Join([]string{ cl.value.(*RangerAppClassDesc).name,"(" }, ""), false);
    this.writeArgsDef(constr, ctx, wr);
    wr.out(" ) {", true);
    wr.indent(1);
    wr.newline();
    var subCtx *RangerAppWriterContext = constr.fnCtx.value.(*RangerAppWriterContext);
    subCtx.is_function = true; 
    this.WalkNode(constr.fnBody.value.(*CodeNode), subCtx, wr);
    wr.newline();
    wr.indent(-1);
    wr.out("}", true);
  }
  var i_1 int64 = 0;  
  for ; i_1 < int64(len(cl.value.(*RangerAppClassDesc).static_methods)) ; i_1++ {
    variant := cl.value.(*RangerAppClassDesc).static_methods[i_1];
    wr.out("", true);
    if  variant.nameNode.value.(*CodeNode).hasFlag("main") && (variant.nameNode.value.(*CodeNode).code.value.(*SourceCode).filename != ctx.getRootFile()) {
      continue;
    }
    if  variant.nameNode.value.(*CodeNode).hasFlag("main") {
      wr.out("static int Main( string [] args ) {", true);
    } else {
      wr.out("public static ", false);
      this.writeTypeDef(variant.nameNode.value.(*CodeNode), ctx, wr);
      wr.out(" ", false);
      wr.out(strings.Join([]string{ variant.name,"(" }, ""), false);
      this.writeArgsDef(variant, ctx, wr);
      wr.out(") {", true);
    }
    wr.indent(1);
    wr.newline();
    var subCtx_1 *RangerAppWriterContext = variant.fnCtx.value.(*RangerAppWriterContext);
    subCtx_1.is_function = true; 
    this.WalkNode(variant.fnBody.value.(*CodeNode), subCtx_1, wr);
    wr.newline();
    wr.indent(-1);
    wr.out("}", true);
  }
  var i_2 int64 = 0;  
  for ; i_2 < int64(len(cl.value.(*RangerAppClassDesc).defined_variants)) ; i_2++ {
    fnVar := cl.value.(*RangerAppClassDesc).defined_variants[i_2];
    var mVs *GoNullable = new(GoNullable); 
    mVs = r_get_string_RangerAppMethodVariants(cl.value.(*RangerAppClassDesc).method_variants, fnVar);
    var i_3 int64 = 0;  
    for ; i_3 < int64(len(mVs.value.(*RangerAppMethodVariants).variants)) ; i_3++ {
      variant_1 := mVs.value.(*RangerAppMethodVariants).variants[i_3];
      wr.out("", true);
      wr.out("public ", false);
      this.writeTypeDef(variant_1.nameNode.value.(*CodeNode), ctx, wr);
      wr.out(" ", false);
      wr.out(strings.Join([]string{ variant_1.name,"(" }, ""), false);
      this.writeArgsDef(variant_1, ctx, wr);
      wr.out(") {", true);
      wr.indent(1);
      wr.newline();
      var subCtx_2 *RangerAppWriterContext = variant_1.fnCtx.value.(*RangerAppWriterContext);
      subCtx_2.is_function = true; 
      this.WalkNode(variant_1.fnBody.value.(*CodeNode), subCtx_2, wr);
      wr.newline();
      wr.indent(-1);
      wr.out("}", true);
    }
  }
  wr.indent(-1);
  wr.out("}", true);
  var import_list []string = wr.getImports();
  var i_4 int64 = 0;  
  for ; i_4 < int64(len(import_list)) ; i_4++ {
    codeStr := import_list[i_4];
    importFork.out(strings.Join([]string{ (strings.Join([]string{ "using ",codeStr }, "")),";" }, ""), true);
  }
}
// inherited methods from parent class RangerGenericClassWriter
func (this *RangerCSharpClassWriter) EncodeString (node *CodeNode, ctx *RangerAppWriterContext, wr *CodeWriter) string {
  /** unused:  encoded_str*/
  var str_length int64 = int64(len(node.string_value));
  var encoded_str_2 string = "";
  var ii int64 = 0;
  for ii < str_length {
    var cc int64 = int64(node.string_value[ii]);
    switch (cc ) { 
      case 8 : 
        encoded_str_2 = strings.Join([]string{ (strings.Join([]string{ encoded_str_2,(string([] byte{byte(92)})) }, "")),(string([] byte{byte(98)})) }, ""); 
      case 9 : 
        encoded_str_2 = strings.Join([]string{ (strings.Join([]string{ encoded_str_2,(string([] byte{byte(92)})) }, "")),(string([] byte{byte(116)})) }, ""); 
      case 10 : 
        encoded_str_2 = strings.Join([]string{ (strings.Join([]string{ encoded_str_2,(string([] byte{byte(92)})) }, "")),(string([] byte{byte(110)})) }, ""); 
      case 12 : 
        encoded_str_2 = strings.Join([]string{ (strings.Join([]string{ encoded_str_2,(string([] byte{byte(92)})) }, "")),(string([] byte{byte(102)})) }, ""); 
      case 13 : 
        encoded_str_2 = strings.Join([]string{ (strings.Join([]string{ encoded_str_2,(string([] byte{byte(92)})) }, "")),(string([] byte{byte(114)})) }, ""); 
      case 34 : 
        encoded_str_2 = strings.Join([]string{ (strings.Join([]string{ encoded_str_2,(string([] byte{byte(92)})) }, "")),(string([] byte{byte(34)})) }, ""); 
      case 92 : 
        encoded_str_2 = strings.Join([]string{ (strings.Join([]string{ encoded_str_2,(string([] byte{byte(92)})) }, "")),(string([] byte{byte(92)})) }, ""); 
      default: 
        encoded_str_2 = strings.Join([]string{ encoded_str_2,(string([] byte{byte(cc)})) }, ""); 
    }
    ii = ii + 1; 
  }
  return encoded_str_2;
}
func (this *RangerCSharpClassWriter) CustomOperator (node *CodeNode, ctx *RangerAppWriterContext, wr *CodeWriter) () {
}
func (this *RangerCSharpClassWriter) WriteSetterVRef (node *CodeNode, ctx *RangerAppWriterContext, wr *CodeWriter) () {
}
func (this *RangerCSharpClassWriter) writeArrayTypeDef (node *CodeNode, ctx *RangerAppWriterContext, wr *CodeWriter) () {
}
func (this *RangerCSharpClassWriter) WriteEnum (node *CodeNode, ctx *RangerAppWriterContext, wr *CodeWriter) () {
  if  node.eval_type == 11 {
    var rootObjName string = node.ns[0];
    var e *GoNullable = new(GoNullable); 
    e = ctx.getEnum(rootObjName);
    if  e.has_value {
      var enumName string = node.ns[1];
      wr.out(strings.Join([]string{ "",strconv.FormatInt(((r_get_string_int64(e.value.(*RangerAppEnum).values, enumName)).value.(int64)), 10) }, ""), false);
    } else {
      if  node.hasParamDesc {
        var pp *GoNullable = new(GoNullable); 
        pp.value = node.paramDesc.value;
        pp.has_value = node.paramDesc.has_value;
        var nn *GoNullable = new(GoNullable); 
        nn.value = pp.value.(IFACE_RangerAppParamDesc).Get_nameNode().value;
        nn.has_value = pp.value.(IFACE_RangerAppParamDesc).Get_nameNode().has_value;
        this.WriteVRef(nn.value.(*CodeNode), ctx, wr);
      }
    }
  }
}
func (this *RangerCSharpClassWriter) WriteScalarValue (node *CodeNode, ctx *RangerAppWriterContext, wr *CodeWriter) () {
  switch (node.value_type ) { 
    case 2 : 
      wr.out(strings.Join([]string{ "",strconv.FormatFloat(node.double_value,'f', 6, 64) }, ""), false);
    case 4 : 
      var s string = this.EncodeString(node, ctx, wr);
      wr.out(strings.Join([]string{ (strings.Join([]string{ "\"",s }, "")),"\"" }, ""), false);
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
  var i int64 = 0;  
  for ; i < int64(len(ctx.localVarNames)) ; i++ {
    n := ctx.localVarNames[i];
    var p *GoNullable = new(GoNullable); 
    p = r_get_string_IFACE_RangerAppParamDesc(ctx.localVariables, n);
    if  p.value.(IFACE_RangerAppParamDesc).Get_ref_cnt() == 0 {
      continue;
    }
    if  p.value.(IFACE_RangerAppParamDesc).isAllocatedType() {
      if  1 == p.value.(IFACE_RangerAppParamDesc).getStrength() {
        if  p.value.(IFACE_RangerAppParamDesc).Get_nameNode().value.(*CodeNode).eval_type == 7 {
        }
        if  p.value.(IFACE_RangerAppParamDesc).Get_nameNode().value.(*CodeNode).eval_type == 6 {
        }
        if  (p.value.(IFACE_RangerAppParamDesc).Get_nameNode().value.(*CodeNode).eval_type != 6) && (p.value.(IFACE_RangerAppParamDesc).Get_nameNode().value.(*CodeNode).eval_type != 7) {
        }
      }
      if  0 == p.value.(IFACE_RangerAppParamDesc).getStrength() {
        if  p.value.(IFACE_RangerAppParamDesc).Get_nameNode().value.(*CodeNode).eval_type == 7 {
        }
        if  p.value.(IFACE_RangerAppParamDesc).Get_nameNode().value.(*CodeNode).eval_type == 6 {
        }
        if  (p.value.(IFACE_RangerAppParamDesc).Get_nameNode().value.(*CodeNode).eval_type != 6) && (p.value.(IFACE_RangerAppParamDesc).Get_nameNode().value.(*CodeNode).eval_type != 7) {
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
func (this *RangerCSharpClassWriter) CreateLambdaCall (node *CodeNode, ctx *RangerAppWriterContext, wr *CodeWriter) () {
  var fName *CodeNode = node.children[0];
  var args *CodeNode = node.children[1];
  this.WriteVRef(fName, ctx, wr);
  wr.out("(", false);
  var i int64 = 0;  
  for ; i < int64(len(args.children)) ; i++ {
    arg := args.children[i];
    if  i > 0 {
      wr.out(", ", false);
    }
    this.WalkNode(arg, ctx, wr);
  }
  wr.out(")", false);
  if  ctx.expressionLevel() == 0 {
    wr.out(";", true);
  }
}
func (this *RangerCSharpClassWriter) CreateLambda (node *CodeNode, ctx *RangerAppWriterContext, wr *CodeWriter) () {
  var lambdaCtx *RangerAppWriterContext = node.lambda_ctx.value.(*RangerAppWriterContext);
  var args *CodeNode = node.children[1];
  var body *CodeNode = node.children[2];
  wr.out("(", false);
  var i int64 = 0;  
  for ; i < int64(len(args.children)) ; i++ {
    arg := args.children[i];
    if  i > 0 {
      wr.out(", ", false);
    }
    this.WalkNode(arg, lambdaCtx, wr);
  }
  wr.out(")", false);
  wr.out(" => { ", true);
  wr.indent(1);
  lambdaCtx.restartExpressionLevel();
  var i_1 int64 = 0;  
  for ; i_1 < int64(len(body.children)) ; i_1++ {
    item := body.children[i_1];
    this.WalkNode(item, lambdaCtx, wr);
  }
  wr.newline();
  wr.indent(-1);
  wr.out("}", true);
}
func (this *RangerCSharpClassWriter) writeFnCall (node *CodeNode, ctx *RangerAppWriterContext, wr *CodeWriter) () {
  if  node.hasFnCall {
    var fc *CodeNode = node.getFirst();
    this.WriteVRef(fc, ctx, wr);
    wr.out("(", false);
    var givenArgs *CodeNode = node.getSecond();
    ctx.setInExpr();
    var i int64 = 0;  
    for ; i < int64(len(node.fnDesc.value.(*RangerAppFunctionDesc).params)) ; i++ {
      arg := node.fnDesc.value.(*RangerAppFunctionDesc).params[i];
      if  i > 0 {
        wr.out(", ", false);
      }
      if  (int64(len(givenArgs.children))) <= i {
        var defVal *GoNullable = new(GoNullable); 
        defVal = arg.Get_nameNode().value.(*CodeNode).getFlag("default");
        if  defVal.has_value {
          var fc_1 *CodeNode = defVal.value.(*CodeNode).vref_annotation.value.(*CodeNode).getFirst();
          this.WalkNode(fc_1, ctx, wr);
        } else {
          ctx.addError(node, "Default argument was missing");
        }
        continue;
      }
      var n *CodeNode = givenArgs.children[i];
      this.WalkNode(n, ctx, wr);
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
    var cl *GoNullable = new(GoNullable); 
    cl.value = node.clDesc.value;
    cl.has_value = node.clDesc.has_value;
    /** unused:  fc*/
    wr.out(strings.Join([]string{ "new ",node.clDesc.value.(*RangerAppClassDesc).name }, ""), false);
    wr.out("(", false);
    var constr *GoNullable = new(GoNullable); 
    constr.value = cl.value.(*RangerAppClassDesc).constructor_fn.value;
    constr.has_value = cl.value.(*RangerAppClassDesc).constructor_fn.has_value;
    var givenArgs *CodeNode = node.getThird();
    if  constr.has_value {
      var i int64 = 0;  
      for ; i < int64(len(constr.value.(*RangerAppFunctionDesc).params)) ; i++ {
        arg := constr.value.(*RangerAppFunctionDesc).params[i];
        var n *CodeNode = givenArgs.children[i];
        if  i > 0 {
          wr.out(", ", false);
        }
        if  true || (arg.Get_nameNode().has_value) {
          this.WalkNode(n, ctx, wr);
        }
      }
    }
    wr.out(")", false);
  }
}
func (this *RangerCSharpClassWriter) writeInterface (cl *RangerAppClassDesc, ctx *RangerAppWriterContext, wr *CodeWriter) () {
}
func (this *RangerCSharpClassWriter) disabledVarDef (node *CodeNode, ctx *RangerAppWriterContext, wr *CodeWriter) () {
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
  var v_type int64 = node.value_type;
  if  node.eval_type != 0 {
    v_type = node.eval_type; 
  }
  switch (v_type ) { 
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
  var v_type int64 = node.value_type;
  if  node.eval_type != 0 {
    v_type = node.eval_type; 
  }
  switch (v_type ) { 
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
      var rootObjName string = node.ns[0];
      var enumName string = node.ns[1];
      var e *GoNullable = new(GoNullable); 
      e = ctx.getEnum(rootObjName);
      if  e.has_value {
        wr.out(strings.Join([]string{ "",strconv.FormatInt(((r_get_string_int64(e.value.(*RangerAppEnum).values, enumName)).value.(int64)), 10) }, ""), false);
        return;
      }
    }
  }
  if  (int64(len(node.nsp))) > 0 {
    var i int64 = 0;  
    for ; i < int64(len(node.nsp)) ; i++ {
      p := node.nsp[i];
      if  i > 0 {
        wr.out(".", false);
      }
      if  (int64(len(p.Get_compiledName()))) > 0 {
        wr.out(this.adjustType(p.Get_compiledName()), false);
      } else {
        if  (int64(len(p.Get_name()))) > 0 {
          wr.out(this.adjustType(p.Get_name()), false);
        } else {
          wr.out(this.adjustType((node.ns[i])), false);
        }
      }
      if  i == 0 {
        if  p.Get_nameNode().value.(*CodeNode).hasFlag("optional") {
          wr.out(".get", false);
        }
      }
    }
    return;
  }
  if  node.hasParamDesc {
    var p_1 *GoNullable = new(GoNullable); 
    p_1.value = node.paramDesc.value;
    p_1.has_value = node.paramDesc.has_value;
    wr.out(p_1.value.(IFACE_RangerAppParamDesc).Get_compiledName(), false);
    return;
  }
  var i_1 int64 = 0;  
  for ; i_1 < int64(len(node.ns)) ; i_1++ {
    part := node.ns[i_1];
    if  i_1 > 0 {
      wr.out(".", false);
    }
    wr.out(this.adjustType(part), false);
  }
}
func (this *RangerScalaClassWriter) writeVarDef (node *CodeNode, ctx *RangerAppWriterContext, wr *CodeWriter) () {
  if  node.hasParamDesc {
    var p *GoNullable = new(GoNullable); 
    p.value = node.paramDesc.value;
    p.has_value = node.paramDesc.has_value;
    /** unused:  nn*/
    if  (p.value.(IFACE_RangerAppParamDesc).Get_ref_cnt() == 0) && (p.value.(IFACE_RangerAppParamDesc).Get_is_class_variable() == false) {
      wr.out("/** unused ", false);
    }
    if  (p.value.(IFACE_RangerAppParamDesc).Get_set_cnt() > 0) || p.value.(IFACE_RangerAppParamDesc).Get_is_class_variable() {
      wr.out(strings.Join([]string{ (strings.Join([]string{ "var ",p.value.(IFACE_RangerAppParamDesc).Get_compiledName() }, ""))," : " }, ""), false);
    } else {
      wr.out(strings.Join([]string{ (strings.Join([]string{ "val ",p.value.(IFACE_RangerAppParamDesc).Get_compiledName() }, ""))," : " }, ""), false);
    }
    this.writeTypeDef(p.value.(IFACE_RangerAppParamDesc).Get_nameNode().value.(*CodeNode), ctx, wr);
    if  (int64(len(node.children))) > 2 {
      wr.out(" = ", false);
      ctx.setInExpr();
      var value *CodeNode = node.getThird();
      this.WalkNode(value, ctx, wr);
      ctx.unsetInExpr();
    } else {
      var b_inited bool = false;
      if  p.value.(IFACE_RangerAppParamDesc).Get_nameNode().value.(*CodeNode).value_type == 6 {
        b_inited = true; 
        wr.out("= new collection.mutable.ArrayBuffer()", false);
      }
      if  p.value.(IFACE_RangerAppParamDesc).Get_nameNode().value.(*CodeNode).value_type == 7 {
        b_inited = true; 
        wr.out("= new collection.mutable.HashMap()", false);
      }
      if  p.value.(IFACE_RangerAppParamDesc).Get_nameNode().value.(*CodeNode).hasFlag("optional") {
        wr.out(" = Option.empty[", false);
        this.writeTypeDefNoOption(p.value.(IFACE_RangerAppParamDesc).Get_nameNode().value.(*CodeNode), ctx, wr);
        wr.out("]", false);
      } else {
        if  b_inited == false {
          wr.out(" = _", false);
        }
      }
    }
    if  (p.value.(IFACE_RangerAppParamDesc).Get_ref_cnt() == 0) && (p.value.(IFACE_RangerAppParamDesc).Get_is_class_variable() == false) {
      wr.out("**/ ", true);
    } else {
      wr.newline();
    }
  }
}
func (this *RangerScalaClassWriter) writeArgsDef (fnDesc *RangerAppFunctionDesc, ctx *RangerAppWriterContext, wr *CodeWriter) () {
  var i int64 = 0;  
  for ; i < int64(len(fnDesc.params)) ; i++ {
    arg := fnDesc.params[i];
    if  i > 0 {
      wr.out(",", false);
    }
    wr.out(" ", false);
    wr.out(strings.Join([]string{ arg.Get_name()," : " }, ""), false);
    this.writeTypeDef(arg.Get_nameNode().value.(*CodeNode), ctx, wr);
  }
}
func (this *RangerScalaClassWriter) writeClass (node *CodeNode, ctx *RangerAppWriterContext, orig_wr *CodeWriter) () {
  var cl *GoNullable = new(GoNullable); 
  cl.value = node.clDesc.value;
  cl.has_value = node.clDesc.has_value;
  if  !cl.has_value  {
    return;
  }
  var wr *CodeWriter = orig_wr.getFileWriter(".", (strings.Join([]string{ cl.value.(*RangerAppClassDesc).name,".scala" }, "")));
  var importFork *CodeWriter = wr.fork();
  wr.out("", true);
  wr.out(strings.Join([]string{ (strings.Join([]string{ "class ",cl.value.(*RangerAppClassDesc).name }, ""))," " }, ""), false);
  if  cl.value.(*RangerAppClassDesc).has_constructor {
    wr.out("(", false);
    var constr *RangerAppFunctionDesc = cl.value.(*RangerAppClassDesc).constructor_fn.value.(*RangerAppFunctionDesc);
    var i int64 = 0;  
    for ; i < int64(len(constr.params)) ; i++ {
      arg := constr.params[i];
      if  i > 0 {
        wr.out(", ", false);
      }
      wr.out(strings.Join([]string{ arg.Get_name()," : " }, ""), false);
      this.writeTypeDef(arg.Get_nameNode().value.(*CodeNode), ctx, wr);
    }
    wr.out(")", false);
  }
  wr.out(" {", true);
  wr.indent(1);
  var i_1 int64 = 0;  
  for ; i_1 < int64(len(cl.value.(*RangerAppClassDesc).variables)) ; i_1++ {
    pvar := cl.value.(*RangerAppClassDesc).variables[i_1];
    this.writeVarDef(pvar.Get_node().value.(*CodeNode), ctx, wr);
  }
  if  cl.value.(*RangerAppClassDesc).has_constructor {
    var constr_1 *GoNullable = new(GoNullable); 
    constr_1.value = cl.value.(*RangerAppClassDesc).constructor_fn.value;
    constr_1.has_value = cl.value.(*RangerAppClassDesc).constructor_fn.has_value;
    wr.newline();
    var subCtx *RangerAppWriterContext = constr_1.value.(*RangerAppFunctionDesc).fnCtx.value.(*RangerAppWriterContext);
    subCtx.is_function = true; 
    this.WalkNode(constr_1.value.(*RangerAppFunctionDesc).fnBody.value.(*CodeNode), subCtx, wr);
    wr.newline();
  }
  var i_2 int64 = 0;  
  for ; i_2 < int64(len(cl.value.(*RangerAppClassDesc).defined_variants)) ; i_2++ {
    fnVar := cl.value.(*RangerAppClassDesc).defined_variants[i_2];
    var mVs *GoNullable = new(GoNullable); 
    mVs = r_get_string_RangerAppMethodVariants(cl.value.(*RangerAppClassDesc).method_variants, fnVar);
    var i_3 int64 = 0;  
    for ; i_3 < int64(len(mVs.value.(*RangerAppMethodVariants).variants)) ; i_3++ {
      variant := mVs.value.(*RangerAppMethodVariants).variants[i_3];
      wr.out("", true);
      wr.out("def ", false);
      wr.out(" ", false);
      wr.out(strings.Join([]string{ variant.name,"(" }, ""), false);
      this.writeArgsDef(variant, ctx, wr);
      wr.out(") : ", false);
      this.writeTypeDef(variant.nameNode.value.(*CodeNode), ctx, wr);
      wr.out(" = {", true);
      wr.indent(1);
      wr.newline();
      var subCtx_1 *RangerAppWriterContext = variant.fnCtx.value.(*RangerAppWriterContext);
      subCtx_1.is_function = true; 
      this.WalkNode(variant.fnBody.value.(*CodeNode), subCtx_1, wr);
      wr.newline();
      wr.indent(-1);
      wr.out("}", true);
    }
  }
  wr.indent(-1);
  wr.out("}", true);
  var b_had_app bool = false;
  var app_obj *GoNullable = new(GoNullable); 
  if  (int64(len(cl.value.(*RangerAppClassDesc).static_methods))) > 0 {
    wr.out("", true);
    wr.out(strings.Join([]string{ "// companion object for static methods of ",cl.value.(*RangerAppClassDesc).name }, ""), true);
    wr.out(strings.Join([]string{ (strings.Join([]string{ "object ",cl.value.(*RangerAppClassDesc).name }, ""))," {" }, ""), true);
    wr.indent(1);
  }
  var i_4 int64 = 0;  
  for ; i_4 < int64(len(cl.value.(*RangerAppClassDesc).static_methods)) ; i_4++ {
    variant_1 := cl.value.(*RangerAppClassDesc).static_methods[i_4];
    if  variant_1.nameNode.value.(*CodeNode).hasFlag("main") {
      b_had_app = true; 
      app_obj.value = variant_1;
      app_obj.has_value = true; /* detected as non-optional */
      continue;
    }
    wr.out("", true);
    wr.out("def ", false);
    wr.out(" ", false);
    wr.out(strings.Join([]string{ variant_1.name,"(" }, ""), false);
    this.writeArgsDef(variant_1, ctx, wr);
    wr.out(") : ", false);
    this.writeTypeDef(variant_1.nameNode.value.(*CodeNode), ctx, wr);
    wr.out(" = {", true);
    wr.indent(1);
    wr.newline();
    var subCtx_2 *RangerAppWriterContext = variant_1.fnCtx.value.(*RangerAppWriterContext);
    subCtx_2.is_function = true; 
    this.WalkNode(variant_1.fnBody.value.(*CodeNode), subCtx_2, wr);
    wr.newline();
    wr.indent(-1);
    wr.out("}", true);
  }
  if  (int64(len(cl.value.(*RangerAppClassDesc).static_methods))) > 0 {
    wr.newline();
    wr.indent(-1);
    wr.out("}", true);
  }
  if  b_had_app {
    var variant_2 *GoNullable = new(GoNullable); 
    variant_2.value = app_obj.value;
    variant_2.has_value = app_obj.has_value;
    wr.out("", true);
    wr.out(strings.Join([]string{ "// application main function for ",cl.value.(*RangerAppClassDesc).name }, ""), true);
    wr.out(strings.Join([]string{ (strings.Join([]string{ "object App",cl.value.(*RangerAppClassDesc).name }, ""))," extends App {" }, ""), true);
    wr.indent(1);
    wr.indent(1);
    wr.newline();
    var subCtx_3 *RangerAppWriterContext = variant_2.value.(*RangerAppFunctionDesc).fnCtx.value.(*RangerAppWriterContext);
    subCtx_3.is_function = true; 
    this.WalkNode(variant_2.value.(*RangerAppFunctionDesc).fnBody.value.(*CodeNode), subCtx_3, wr);
    wr.newline();
    wr.indent(-1);
    wr.out("}", true);
  }
  var import_list []string = wr.getImports();
  var i_5 int64 = 0;  
  for ; i_5 < int64(len(import_list)) ; i_5++ {
    codeStr := import_list[i_5];
    importFork.out(strings.Join([]string{ (strings.Join([]string{ "import ",codeStr }, "")),";" }, ""), true);
  }
}
// inherited methods from parent class RangerGenericClassWriter
func (this *RangerScalaClassWriter) EncodeString (node *CodeNode, ctx *RangerAppWriterContext, wr *CodeWriter) string {
  /** unused:  encoded_str*/
  var str_length int64 = int64(len(node.string_value));
  var encoded_str_2 string = "";
  var ii int64 = 0;
  for ii < str_length {
    var cc int64 = int64(node.string_value[ii]);
    switch (cc ) { 
      case 8 : 
        encoded_str_2 = strings.Join([]string{ (strings.Join([]string{ encoded_str_2,(string([] byte{byte(92)})) }, "")),(string([] byte{byte(98)})) }, ""); 
      case 9 : 
        encoded_str_2 = strings.Join([]string{ (strings.Join([]string{ encoded_str_2,(string([] byte{byte(92)})) }, "")),(string([] byte{byte(116)})) }, ""); 
      case 10 : 
        encoded_str_2 = strings.Join([]string{ (strings.Join([]string{ encoded_str_2,(string([] byte{byte(92)})) }, "")),(string([] byte{byte(110)})) }, ""); 
      case 12 : 
        encoded_str_2 = strings.Join([]string{ (strings.Join([]string{ encoded_str_2,(string([] byte{byte(92)})) }, "")),(string([] byte{byte(102)})) }, ""); 
      case 13 : 
        encoded_str_2 = strings.Join([]string{ (strings.Join([]string{ encoded_str_2,(string([] byte{byte(92)})) }, "")),(string([] byte{byte(114)})) }, ""); 
      case 34 : 
        encoded_str_2 = strings.Join([]string{ (strings.Join([]string{ encoded_str_2,(string([] byte{byte(92)})) }, "")),(string([] byte{byte(34)})) }, ""); 
      case 92 : 
        encoded_str_2 = strings.Join([]string{ (strings.Join([]string{ encoded_str_2,(string([] byte{byte(92)})) }, "")),(string([] byte{byte(92)})) }, ""); 
      default: 
        encoded_str_2 = strings.Join([]string{ encoded_str_2,(string([] byte{byte(cc)})) }, ""); 
    }
    ii = ii + 1; 
  }
  return encoded_str_2;
}
func (this *RangerScalaClassWriter) CustomOperator (node *CodeNode, ctx *RangerAppWriterContext, wr *CodeWriter) () {
}
func (this *RangerScalaClassWriter) WriteSetterVRef (node *CodeNode, ctx *RangerAppWriterContext, wr *CodeWriter) () {
}
func (this *RangerScalaClassWriter) writeArrayTypeDef (node *CodeNode, ctx *RangerAppWriterContext, wr *CodeWriter) () {
}
func (this *RangerScalaClassWriter) WriteEnum (node *CodeNode, ctx *RangerAppWriterContext, wr *CodeWriter) () {
  if  node.eval_type == 11 {
    var rootObjName string = node.ns[0];
    var e *GoNullable = new(GoNullable); 
    e = ctx.getEnum(rootObjName);
    if  e.has_value {
      var enumName string = node.ns[1];
      wr.out(strings.Join([]string{ "",strconv.FormatInt(((r_get_string_int64(e.value.(*RangerAppEnum).values, enumName)).value.(int64)), 10) }, ""), false);
    } else {
      if  node.hasParamDesc {
        var pp *GoNullable = new(GoNullable); 
        pp.value = node.paramDesc.value;
        pp.has_value = node.paramDesc.has_value;
        var nn *GoNullable = new(GoNullable); 
        nn.value = pp.value.(IFACE_RangerAppParamDesc).Get_nameNode().value;
        nn.has_value = pp.value.(IFACE_RangerAppParamDesc).Get_nameNode().has_value;
        this.WriteVRef(nn.value.(*CodeNode), ctx, wr);
      }
    }
  }
}
func (this *RangerScalaClassWriter) WriteScalarValue (node *CodeNode, ctx *RangerAppWriterContext, wr *CodeWriter) () {
  switch (node.value_type ) { 
    case 2 : 
      wr.out(strings.Join([]string{ "",strconv.FormatFloat(node.double_value,'f', 6, 64) }, ""), false);
    case 4 : 
      var s string = this.EncodeString(node, ctx, wr);
      wr.out(strings.Join([]string{ (strings.Join([]string{ "\"",s }, "")),"\"" }, ""), false);
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
  var i int64 = 0;  
  for ; i < int64(len(ctx.localVarNames)) ; i++ {
    n := ctx.localVarNames[i];
    var p *GoNullable = new(GoNullable); 
    p = r_get_string_IFACE_RangerAppParamDesc(ctx.localVariables, n);
    if  p.value.(IFACE_RangerAppParamDesc).Get_ref_cnt() == 0 {
      continue;
    }
    if  p.value.(IFACE_RangerAppParamDesc).isAllocatedType() {
      if  1 == p.value.(IFACE_RangerAppParamDesc).getStrength() {
        if  p.value.(IFACE_RangerAppParamDesc).Get_nameNode().value.(*CodeNode).eval_type == 7 {
        }
        if  p.value.(IFACE_RangerAppParamDesc).Get_nameNode().value.(*CodeNode).eval_type == 6 {
        }
        if  (p.value.(IFACE_RangerAppParamDesc).Get_nameNode().value.(*CodeNode).eval_type != 6) && (p.value.(IFACE_RangerAppParamDesc).Get_nameNode().value.(*CodeNode).eval_type != 7) {
        }
      }
      if  0 == p.value.(IFACE_RangerAppParamDesc).getStrength() {
        if  p.value.(IFACE_RangerAppParamDesc).Get_nameNode().value.(*CodeNode).eval_type == 7 {
        }
        if  p.value.(IFACE_RangerAppParamDesc).Get_nameNode().value.(*CodeNode).eval_type == 6 {
        }
        if  (p.value.(IFACE_RangerAppParamDesc).Get_nameNode().value.(*CodeNode).eval_type != 6) && (p.value.(IFACE_RangerAppParamDesc).Get_nameNode().value.(*CodeNode).eval_type != 7) {
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
func (this *RangerScalaClassWriter) CreateLambdaCall (node *CodeNode, ctx *RangerAppWriterContext, wr *CodeWriter) () {
  var fName *CodeNode = node.children[0];
  var args *CodeNode = node.children[1];
  this.WriteVRef(fName, ctx, wr);
  wr.out("(", false);
  var i int64 = 0;  
  for ; i < int64(len(args.children)) ; i++ {
    arg := args.children[i];
    if  i > 0 {
      wr.out(", ", false);
    }
    this.WalkNode(arg, ctx, wr);
  }
  wr.out(")", false);
  if  ctx.expressionLevel() == 0 {
    wr.out(";", true);
  }
}
func (this *RangerScalaClassWriter) CreateLambda (node *CodeNode, ctx *RangerAppWriterContext, wr *CodeWriter) () {
  var lambdaCtx *RangerAppWriterContext = node.lambda_ctx.value.(*RangerAppWriterContext);
  var args *CodeNode = node.children[1];
  var body *CodeNode = node.children[2];
  wr.out("(", false);
  var i int64 = 0;  
  for ; i < int64(len(args.children)) ; i++ {
    arg := args.children[i];
    if  i > 0 {
      wr.out(", ", false);
    }
    this.WalkNode(arg, lambdaCtx, wr);
  }
  wr.out(")", false);
  wr.out(" => { ", true);
  wr.indent(1);
  lambdaCtx.restartExpressionLevel();
  var i_1 int64 = 0;  
  for ; i_1 < int64(len(body.children)) ; i_1++ {
    item := body.children[i_1];
    this.WalkNode(item, lambdaCtx, wr);
  }
  wr.newline();
  wr.indent(-1);
  wr.out("}", true);
}
func (this *RangerScalaClassWriter) writeFnCall (node *CodeNode, ctx *RangerAppWriterContext, wr *CodeWriter) () {
  if  node.hasFnCall {
    var fc *CodeNode = node.getFirst();
    this.WriteVRef(fc, ctx, wr);
    wr.out("(", false);
    var givenArgs *CodeNode = node.getSecond();
    ctx.setInExpr();
    var i int64 = 0;  
    for ; i < int64(len(node.fnDesc.value.(*RangerAppFunctionDesc).params)) ; i++ {
      arg := node.fnDesc.value.(*RangerAppFunctionDesc).params[i];
      if  i > 0 {
        wr.out(", ", false);
      }
      if  (int64(len(givenArgs.children))) <= i {
        var defVal *GoNullable = new(GoNullable); 
        defVal = arg.Get_nameNode().value.(*CodeNode).getFlag("default");
        if  defVal.has_value {
          var fc_1 *CodeNode = defVal.value.(*CodeNode).vref_annotation.value.(*CodeNode).getFirst();
          this.WalkNode(fc_1, ctx, wr);
        } else {
          ctx.addError(node, "Default argument was missing");
        }
        continue;
      }
      var n *CodeNode = givenArgs.children[i];
      this.WalkNode(n, ctx, wr);
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
    var cl *GoNullable = new(GoNullable); 
    cl.value = node.clDesc.value;
    cl.has_value = node.clDesc.has_value;
    /** unused:  fc*/
    wr.out(strings.Join([]string{ "new ",node.clDesc.value.(*RangerAppClassDesc).name }, ""), false);
    wr.out("(", false);
    var constr *GoNullable = new(GoNullable); 
    constr.value = cl.value.(*RangerAppClassDesc).constructor_fn.value;
    constr.has_value = cl.value.(*RangerAppClassDesc).constructor_fn.has_value;
    var givenArgs *CodeNode = node.getThird();
    if  constr.has_value {
      var i int64 = 0;  
      for ; i < int64(len(constr.value.(*RangerAppFunctionDesc).params)) ; i++ {
        arg := constr.value.(*RangerAppFunctionDesc).params[i];
        var n *CodeNode = givenArgs.children[i];
        if  i > 0 {
          wr.out(", ", false);
        }
        if  true || (arg.Get_nameNode().has_value) {
          this.WalkNode(n, ctx, wr);
        }
      }
    }
    wr.out(")", false);
  }
}
func (this *RangerScalaClassWriter) writeInterface (cl *RangerAppClassDesc, ctx *RangerAppWriterContext, wr *CodeWriter) () {
}
func (this *RangerScalaClassWriter) disabledVarDef (node *CodeNode, ctx *RangerAppWriterContext, wr *CodeWriter) () {
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
  CreateLambdaCall(node *CodeNode, ctx *RangerAppWriterContext, wr *CodeWriter) ()
  CreateLambda(node *CodeNode, ctx *RangerAppWriterContext, wr *CodeWriter) ()
  CustomOperator(node *CodeNode, ctx *RangerAppWriterContext, wr *CodeWriter) ()
  writeInterface(cl *RangerAppClassDesc, ctx *RangerAppWriterContext, wr *CodeWriter) ()
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
      var s string = this.EncodeString(node, ctx, wr);
      wr.out(strings.Join([]string{ (strings.Join([]string{ "\"",s }, "")),"\"" }, ""), false);
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
    var cc *RangerAppClassDesc = ctx.findClass(type_string);
    if  cc.doesInherit() {
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
  var v_type int64 = node.value_type;
  var a_name string = node.array_type;
  if  ((v_type == 8) || (v_type == 9)) || (v_type == 0) {
    v_type = node.typeNameAsType(ctx); 
  }
  if  node.eval_type != 0 {
    v_type = node.eval_type; 
    if  (int64(len(node.eval_array_type))) > 0 {
      a_name = node.eval_array_type; 
    }
  }
  switch (v_type ) { 
    case 7 : 
      if  ctx.isDefinedClass(a_name) {
        var cc *RangerAppClassDesc = ctx.findClass(a_name);
        if  cc.doesInherit() {
          wr.out(strings.Join([]string{ "IFACE_",this.getTypeString2(a_name, ctx) }, ""), false);
          return;
        }
      }
      if  ctx.isPrimitiveType(a_name) == false {
        wr.out("*", false);
      }
      wr.out(strings.Join([]string{ this.getObjectTypeString(a_name, ctx),"" }, ""), false);
    case 6 : 
      if  ctx.isDefinedClass(a_name) {
        var cc_1 *RangerAppClassDesc = ctx.findClass(a_name);
        if  cc_1.doesInherit() {
          wr.out(strings.Join([]string{ "IFACE_",this.getTypeString2(a_name, ctx) }, ""), false);
          return;
        }
      }
      if  (this.write_raw_type == false) && (ctx.isPrimitiveType(a_name) == false) {
        wr.out("*", false);
      }
      wr.out(strings.Join([]string{ this.getObjectTypeString(a_name, ctx),"" }, ""), false);
    default: 
  }
}
func (this *RangerGolangClassWriter) writeTypeDef2 (node *CodeNode, ctx *RangerAppWriterContext, wr *CodeWriter) () {
  var v_type int64 = node.value_type;
  var t_name string = node.type_name;
  var a_name string = node.array_type;
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
      a_name = node.eval_array_type; 
    }
    if  (int64(len(node.eval_key_type))) > 0 {
      k_name = node.eval_key_type; 
    }
  }
  switch (v_type ) { 
    case 15 : 
      var rv *CodeNode = node.expression_value.value.(*CodeNode).children[0];
      var sec *CodeNode = node.expression_value.value.(*CodeNode).children[1];
      /** unused:  fc*/
      wr.out("func(", false);
      var i int64 = 0;  
      for ; i < int64(len(sec.children)) ; i++ {
        arg := sec.children[i];
        if  i > 0 {
          wr.out(", ", false);
        }
        this.writeTypeDef2(arg, ctx, wr);
      }
      wr.out(") ", false);
      this.writeTypeDef2(rv, ctx, wr);
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
        wr.out(strings.Join([]string{ this.getObjectTypeString(a_name, ctx),"" }, ""), false);
      } else {
        wr.out(strings.Join([]string{ (strings.Join([]string{ "map[",this.getObjectTypeString(k_name, ctx) }, "")),"]" }, ""), false);
        if  ctx.isDefinedClass(a_name) {
          var cc *RangerAppClassDesc = ctx.findClass(a_name);
          if  cc.doesInherit() {
            wr.out(strings.Join([]string{ "IFACE_",this.getTypeString2(a_name, ctx) }, ""), false);
            return;
          }
        }
        if  (this.write_raw_type == false) && (ctx.isPrimitiveType(a_name) == false) {
          wr.out("*", false);
        }
        wr.out(strings.Join([]string{ this.getObjectTypeString(a_name, ctx),"" }, ""), false);
      }
    case 6 : 
      if  false == this.write_raw_type {
        wr.out("[]", false);
      }
      if  ctx.isDefinedClass(a_name) {
        var cc_1 *RangerAppClassDesc = ctx.findClass(a_name);
        if  cc_1.doesInherit() {
          wr.out(strings.Join([]string{ "IFACE_",this.getTypeString2(a_name, ctx) }, ""), false);
          return;
        }
      }
      if  (this.write_raw_type == false) && (ctx.isPrimitiveType(a_name) == false) {
        wr.out("*", false);
      }
      wr.out(strings.Join([]string{ this.getObjectTypeString(a_name, ctx),"" }, ""), false);
    default: 
      if  node.type_name == "void" {
        wr.out("()", false);
        return;
      }
      var b_iface bool = false;
      if  ctx.isDefinedClass(t_name) {
        var cc_2 *RangerAppClassDesc = ctx.findClass(t_name);
        b_iface = cc_2.is_interface; 
      }
      if  ctx.isDefinedClass(t_name) {
        var cc_3 *RangerAppClassDesc = ctx.findClass(t_name);
        if  cc_3.doesInherit() {
          wr.out(strings.Join([]string{ "IFACE_",this.getTypeString2(t_name, ctx) }, ""), false);
          return;
        }
      }
      if  ((this.write_raw_type == false) && (node.isPrimitiveType() == false)) && (b_iface == false) {
        wr.out("*", false);
      }
      wr.out(this.getTypeString2(t_name, ctx), false);
  }
}
func (this *RangerGolangClassWriter) WriteVRef (node *CodeNode, ctx *RangerAppWriterContext, wr *CodeWriter) () {
  if  node.vref == "this" {
    wr.out(this.thisName, false);
    return;
  }
  if  node.eval_type == 11 {
    if  (int64(len(node.ns))) > 1 {
      var rootObjName string = node.ns[0];
      var enumName string = node.ns[1];
      var e *GoNullable = new(GoNullable); 
      e = ctx.getEnum(rootObjName);
      if  e.has_value {
        wr.out(strings.Join([]string{ "",strconv.FormatInt(((r_get_string_int64(e.value.(*RangerAppEnum).values, enumName)).value.(int64)), 10) }, ""), false);
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
    var i int64 = 0;  
    for ; i < int64(len(node.nsp)) ; i++ {
      p := node.nsp[i];
      if  next_is_gs {
        if  p.isProperty() {
          wr.out(".Get_", false);
          needs_par = true; 
        } else {
          needs_par = false; 
        }
        next_is_gs = false; 
      }
      if  needs_par == false {
        if  i > 0 {
          if  had_static {
            wr.out("_static_", false);
          } else {
            wr.out(".", false);
          }
        }
      }
      if  (p.Get_nameNode().has_value) && ctx.isDefinedClass(p.Get_nameNode().value.(*CodeNode).type_name) {
        var c *RangerAppClassDesc = ctx.findClass(p.Get_nameNode().value.(*CodeNode).type_name);
        if  c.doesInherit() {
          next_is_gs = true; 
        }
      }
      if  i == 0 {
        var part string = node.ns[0];
        if  part == "this" {
          wr.out(this.thisName, false);
          continue;
        }
        if  (part != this.thisName) && ctx.isMemberVariable(part) {
          var cc *GoNullable = new(GoNullable); 
          cc = ctx.getCurrentClass();
          var currC *RangerAppClassDesc = cc.value.(*RangerAppClassDesc);
          var up *GoNullable = new(GoNullable); 
          up = currC.findVariable(part);
          if  up.has_value {
            /** unused:  p3*/
            wr.out(strings.Join([]string{ this.thisName,"." }, ""), false);
          }
        }
      }
      if  (int64(len(p.Get_compiledName()))) > 0 {
        wr.out(this.adjustType(p.Get_compiledName()), false);
      } else {
        if  (int64(len(p.Get_name()))) > 0 {
          wr.out(this.adjustType(p.Get_name()), false);
        } else {
          wr.out(this.adjustType((node.ns[i])), false);
        }
      }
      if  needs_par {
        wr.out("()", false);
        needs_par = false; 
      }
      if  ((p.Get_nameNode().has_value) && p.Get_nameNode().value.(*CodeNode).hasFlag("optional")) && (i != ns_last) {
        wr.out(".value.(", false);
        this.writeTypeDef(p.Get_nameNode().value.(*CodeNode), ctx, wr);
        wr.out(")", false);
      }
      if  p.isClass() {
        had_static = true; 
      }
    }
    return;
  }
  if  node.hasParamDesc {
    var part_1 string = node.ns[0];
    if  (part_1 != this.thisName) && ctx.isMemberVariable(part_1) {
      var cc_1 *GoNullable = new(GoNullable); 
      cc_1 = ctx.getCurrentClass();
      var currC_1 *RangerAppClassDesc = cc_1.value.(*RangerAppClassDesc);
      var up_1 *GoNullable = new(GoNullable); 
      up_1 = currC_1.findVariable(part_1);
      if  up_1.has_value {
        /** unused:  p3_1*/
        wr.out(strings.Join([]string{ this.thisName,"." }, ""), false);
      }
    }
    var p_1 *GoNullable = new(GoNullable); 
    p_1.value = node.paramDesc.value;
    p_1.has_value = node.paramDesc.has_value;
    wr.out(p_1.value.(IFACE_RangerAppParamDesc).Get_compiledName(), false);
    return;
  }
  var b_was_static bool = false;
  var i_1 int64 = 0;  
  for ; i_1 < int64(len(node.ns)) ; i_1++ {
    part_2 := node.ns[i_1];
    if  i_1 > 0 {
      if  (i_1 == 1) && b_was_static {
        wr.out("_static_", false);
      } else {
        wr.out(".", false);
      }
    }
    if  i_1 == 0 {
      if  part_2 == "this" {
        wr.out(this.thisName, false);
        continue;
      }
      if  ctx.hasClass(part_2) {
        b_was_static = true; 
      }
      if  (part_2 != "this") && ctx.isMemberVariable(part_2) {
        var cc_2 *GoNullable = new(GoNullable); 
        cc_2 = ctx.getCurrentClass();
        var currC_2 *RangerAppClassDesc = cc_2.value.(*RangerAppClassDesc);
        var up_2 *GoNullable = new(GoNullable); 
        up_2 = currC_2.findVariable(part_2);
        if  up_2.has_value {
          /** unused:  p3_2*/
          wr.out(strings.Join([]string{ this.thisName,"." }, ""), false);
        }
      }
    }
    wr.out(this.adjustType(part_2), false);
  }
}
func (this *RangerGolangClassWriter) WriteSetterVRef (node *CodeNode, ctx *RangerAppWriterContext, wr *CodeWriter) () {
  if  node.vref == "this" {
    wr.out(this.thisName, false);
    return;
  }
  if  node.eval_type == 11 {
    var rootObjName string = node.ns[0];
    var enumName string = node.ns[1];
    var e *GoNullable = new(GoNullable); 
    e = ctx.getEnum(rootObjName);
    if  e.has_value {
      wr.out(strings.Join([]string{ "",strconv.FormatInt(((r_get_string_int64(e.value.(*RangerAppEnum).values, enumName)).value.(int64)), 10) }, ""), false);
      return;
    }
  }
  var next_is_gs bool = false;
  /** unused:  last_was_setter*/
  var needs_par bool = false;
  var ns_len int64 = (int64(len(node.ns))) - 1;
  if  (int64(len(node.nsp))) > 0 {
    var had_static bool = false;
    var i int64 = 0;  
    for ; i < int64(len(node.nsp)) ; i++ {
      p := node.nsp[i];
      if  next_is_gs {
        if  p.isProperty() {
          wr.out(".Get_", false);
          needs_par = true; 
        } else {
          needs_par = false; 
        }
        next_is_gs = false; 
      }
      if  needs_par == false {
        if  i > 0 {
          if  had_static {
            wr.out("_static_", false);
          } else {
            wr.out(".", false);
          }
        }
      }
      if  ctx.isDefinedClass(p.Get_nameNode().value.(*CodeNode).type_name) {
        var c *RangerAppClassDesc = ctx.findClass(p.Get_nameNode().value.(*CodeNode).type_name);
        if  c.doesInherit() {
          next_is_gs = true; 
        }
      }
      if  i == 0 {
        var part string = node.ns[0];
        if  part == "this" {
          wr.out(this.thisName, false);
          continue;
        }
        if  (part != this.thisName) && ctx.isMemberVariable(part) {
          var cc *GoNullable = new(GoNullable); 
          cc = ctx.getCurrentClass();
          var currC *RangerAppClassDesc = cc.value.(*RangerAppClassDesc);
          var up *GoNullable = new(GoNullable); 
          up = currC.findVariable(part);
          if  up.has_value {
            /** unused:  p3*/
            wr.out(strings.Join([]string{ this.thisName,"." }, ""), false);
          }
        }
      }
      if  (int64(len(p.Get_compiledName()))) > 0 {
        wr.out(this.adjustType(p.Get_compiledName()), false);
      } else {
        if  (int64(len(p.Get_name()))) > 0 {
          wr.out(this.adjustType(p.Get_name()), false);
        } else {
          wr.out(this.adjustType((node.ns[i])), false);
        }
      }
      if  needs_par {
        wr.out("()", false);
        needs_par = false; 
      }
      if  i < ns_len {
        if  p.Get_nameNode().value.(*CodeNode).hasFlag("optional") {
          wr.out(".value.(", false);
          this.writeTypeDef(p.Get_nameNode().value.(*CodeNode), ctx, wr);
          wr.out(")", false);
        }
      }
      if  p.isClass() {
        had_static = true; 
      }
    }
    return;
  }
  if  node.hasParamDesc {
    var part_1 string = node.ns[0];
    if  (part_1 != this.thisName) && ctx.isMemberVariable(part_1) {
      var cc_1 *GoNullable = new(GoNullable); 
      cc_1 = ctx.getCurrentClass();
      var currC_1 *RangerAppClassDesc = cc_1.value.(*RangerAppClassDesc);
      var up_1 *GoNullable = new(GoNullable); 
      up_1 = currC_1.findVariable(part_1);
      if  up_1.has_value {
        /** unused:  p3_1*/
        wr.out(strings.Join([]string{ this.thisName,"." }, ""), false);
      }
    }
    var p_1 *GoNullable = new(GoNullable); 
    p_1.value = node.paramDesc.value;
    p_1.has_value = node.paramDesc.has_value;
    wr.out(p_1.value.(IFACE_RangerAppParamDesc).Get_compiledName(), false);
    return;
  }
  var b_was_static bool = false;
  var i_1 int64 = 0;  
  for ; i_1 < int64(len(node.ns)) ; i_1++ {
    part_2 := node.ns[i_1];
    if  i_1 > 0 {
      if  (i_1 == 1) && b_was_static {
        wr.out("_static_", false);
      } else {
        wr.out(".", false);
      }
    }
    if  i_1 == 0 {
      if  part_2 == "this" {
        wr.out(this.thisName, false);
        continue;
      }
      if  ctx.hasClass(part_2) {
        b_was_static = true; 
      }
      if  (part_2 != "this") && ctx.isMemberVariable(part_2) {
        var cc_2 *GoNullable = new(GoNullable); 
        cc_2 = ctx.getCurrentClass();
        var currC_2 *RangerAppClassDesc = cc_2.value.(*RangerAppClassDesc);
        var up_2 *GoNullable = new(GoNullable); 
        up_2 = currC_2.findVariable(part_2);
        if  up_2.has_value {
          /** unused:  p3_2*/
          wr.out(strings.Join([]string{ this.thisName,"." }, ""), false);
        }
      }
    }
    wr.out(this.adjustType(part_2), false);
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
  var a_len int64 = (int64(len(left.ns))) - 1;
  /** unused:  last_part*/
  var next_is_gs bool = false;
  var last_was_setter bool = false;
  var needs_par bool = false;
  var b_was_static bool = false;
  var i int64 = 0;  
  for ; i < int64(len(left.ns)) ; i++ {
    part := left.ns[i];
    if  next_is_gs {
      if  i == a_len {
        wr.out(".Set_", false);
        last_was_setter = true; 
      } else {
        wr.out(".Get_", false);
        needs_par = true; 
        next_is_gs = false; 
        last_was_setter = false; 
      }
    }
    if  (last_was_setter == false) && (needs_par == false) {
      if  i > 0 {
        if  (i == 1) && b_was_static {
          wr.out("_static_", false);
        } else {
          wr.out(".", false);
        }
      }
    }
    if  i == 0 {
      if  part == "this" {
        wr.out(this.thisName, false);
        continue;
      }
      if  ctx.hasClass(part) {
        b_was_static = true; 
      }
      var partDef IFACE_RangerAppParamDesc = ctx.getVariableDef(part);
      if  partDef.Get_nameNode().has_value {
        if  ctx.isDefinedClass(partDef.Get_nameNode().value.(*CodeNode).type_name) {
          var c *RangerAppClassDesc = ctx.findClass(partDef.Get_nameNode().value.(*CodeNode).type_name);
          if  c.doesInherit() {
            next_is_gs = true; 
          }
        }
      }
      if  (part != "this") && ctx.isMemberVariable(part) {
        var cc *GoNullable = new(GoNullable); 
        cc = ctx.getCurrentClass();
        var currC *RangerAppClassDesc = cc.value.(*RangerAppClassDesc);
        var up *GoNullable = new(GoNullable); 
        up = currC.findVariable(part);
        if  up.has_value {
          /** unused:  p3*/
          wr.out(strings.Join([]string{ this.thisName,"." }, ""), false);
        }
      }
    }
    if  (int64(len(left.nsp))) > 0 {
      var p_1 IFACE_RangerAppParamDesc = left.nsp[i];
      wr.out(this.adjustType(p_1.Get_compiledName()), false);
    } else {
      if  left.hasParamDesc {
        wr.out(left.paramDesc.value.(IFACE_RangerAppParamDesc).Get_compiledName(), false);
      } else {
        wr.out(this.adjustType(part), false);
      }
    }
    if  needs_par {
      wr.out("()", false);
      needs_par = false; 
    }
    if  (int64(len(left.nsp))) >= (i + 1) {
      var pp IFACE_RangerAppParamDesc = left.nsp[i];
      if  pp.Get_nameNode().value.(*CodeNode).hasFlag("optional") {
        wr.out(".value.(", false);
        this.writeTypeDef(pp.Get_nameNode().value.(*CodeNode), ctx, wr);
        wr.out(")", false);
      }
    }
  }
  if  last_was_setter {
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
    var nn *CodeNode = node.children[1];
    var p *GoNullable = new(GoNullable); 
    p.value = nn.paramDesc.value;
    p.has_value = nn.paramDesc.has_value;
    wr.out(strings.Join([]string{ p.value.(IFACE_RangerAppParamDesc).Get_compiledName()," " }, ""), false);
    if  p.value.(IFACE_RangerAppParamDesc).Get_nameNode().value.(*CodeNode).hasFlag("optional") {
      wr.out("*GoNullable", false);
    } else {
      this.writeTypeDef(p.value.(IFACE_RangerAppParamDesc).Get_nameNode().value.(*CodeNode), ctx, wr);
    }
    if  p.value.(IFACE_RangerAppParamDesc).Get_ref_cnt() == 0 {
      wr.out(" /**  unused  **/ ", false);
    }
    wr.out("", true);
    if  p.value.(IFACE_RangerAppParamDesc).Get_nameNode().value.(*CodeNode).hasFlag("optional") {
    }
  }
}
func (this *RangerGolangClassWriter) writeVarDef (node *CodeNode, ctx *RangerAppWriterContext, wr *CodeWriter) () {
  if  node.hasParamDesc {
    var nn *CodeNode = node.children[1];
    var p *GoNullable = new(GoNullable); 
    p.value = nn.paramDesc.value;
    p.has_value = nn.paramDesc.has_value;
    var b_not_used bool = false;
    if  (p.value.(IFACE_RangerAppParamDesc).Get_ref_cnt() == 0) && (p.value.(IFACE_RangerAppParamDesc).Get_is_class_variable() == false) {
      wr.out(strings.Join([]string{ (strings.Join([]string{ "/** unused:  ",p.value.(IFACE_RangerAppParamDesc).Get_compiledName() }, "")),"*/" }, ""), true);
      b_not_used = true; 
      return;
    }
    var map_or_hash bool = (nn.value_type == 6) || (nn.value_type == 7);
    if  nn.hasFlag("optional") {
      wr.out(strings.Join([]string{ (strings.Join([]string{ "var ",p.value.(IFACE_RangerAppParamDesc).Get_compiledName() }, ""))," *GoNullable = new(GoNullable); " }, ""), true);
      if  (int64(len(node.children))) > 2 {
        var value *CodeNode = node.children[2];
        if  value.hasParamDesc {
          var pnn *GoNullable = new(GoNullable); 
          pnn.value = value.paramDesc.value.(IFACE_RangerAppParamDesc).Get_nameNode().value;
          pnn.has_value = value.paramDesc.value.(IFACE_RangerAppParamDesc).Get_nameNode().has_value;
          if  pnn.value.(*CodeNode).hasFlag("optional") {
            wr.out(strings.Join([]string{ p.value.(IFACE_RangerAppParamDesc).Get_compiledName(),".value = " }, ""), false);
            ctx.setInExpr();
            var value_1 *CodeNode = node.getThird();
            this.WalkNode(value_1, ctx, wr);
            ctx.unsetInExpr();
            wr.out(".value;", true);
            wr.out(strings.Join([]string{ p.value.(IFACE_RangerAppParamDesc).Get_compiledName(),".has_value = " }, ""), false);
            ctx.setInExpr();
            var value_2 *CodeNode = node.getThird();
            this.WalkNode(value_2, ctx, wr);
            ctx.unsetInExpr();
            wr.out(".has_value;", true);
            return;
          } else {
            wr.out(strings.Join([]string{ p.value.(IFACE_RangerAppParamDesc).Get_compiledName(),".value = " }, ""), false);
            ctx.setInExpr();
            var value_3 *CodeNode = node.getThird();
            this.WalkNode(value_3, ctx, wr);
            ctx.unsetInExpr();
            wr.out(";", true);
            wr.out(strings.Join([]string{ p.value.(IFACE_RangerAppParamDesc).Get_compiledName(),".has_value = true;" }, ""), true);
            return;
          }
        } else {
          wr.out(strings.Join([]string{ p.value.(IFACE_RangerAppParamDesc).Get_compiledName()," = " }, ""), false);
          ctx.setInExpr();
          var value_4 *CodeNode = node.getThird();
          this.WalkNode(value_4, ctx, wr);
          ctx.unsetInExpr();
          wr.out(";", true);
          return;
        }
      }
      return;
    } else {
      if  ((p.value.(IFACE_RangerAppParamDesc).Get_set_cnt() > 0) || p.value.(IFACE_RangerAppParamDesc).Get_is_class_variable()) || map_or_hash {
        wr.out(strings.Join([]string{ (strings.Join([]string{ "var ",p.value.(IFACE_RangerAppParamDesc).Get_compiledName() }, ""))," " }, ""), false);
      } else {
        wr.out(strings.Join([]string{ (strings.Join([]string{ "var ",p.value.(IFACE_RangerAppParamDesc).Get_compiledName() }, ""))," " }, ""), false);
      }
    }
    this.writeTypeDef2(p.value.(IFACE_RangerAppParamDesc).Get_nameNode().value.(*CodeNode), ctx, wr);
    if  (int64(len(node.children))) > 2 {
      var value_5 *CodeNode = node.getThird();
      if  value_5.expression && ((int64(len(value_5.children))) > 1) {
        var fc *CodeNode = value_5.children[0];
        if  fc.vref == "array_extract" {
          this.goExtractAssign(value_5, p.value.(IFACE_RangerAppParamDesc), ctx, wr);
          return;
        }
      }
      wr.out(" = ", false);
      ctx.setInExpr();
      this.WalkNode(value_5, ctx, wr);
      ctx.unsetInExpr();
    } else {
      if  nn.value_type == 6 {
        wr.out(" = make(", false);
        this.writeTypeDef(p.value.(IFACE_RangerAppParamDesc).Get_nameNode().value.(*CodeNode), ctx, wr);
        wr.out(", 0)", false);
      }
      if  nn.value_type == 7 {
        wr.out(" = make(", false);
        this.writeTypeDef(p.value.(IFACE_RangerAppParamDesc).Get_nameNode().value.(*CodeNode), ctx, wr);
        wr.out(")", false);
      }
    }
    wr.out(";", false);
    if  (p.value.(IFACE_RangerAppParamDesc).Get_ref_cnt() == 0) && (p.value.(IFACE_RangerAppParamDesc).Get_is_class_variable() == true) {
      wr.out("     /** note: unused */", false);
    }
    if  (p.value.(IFACE_RangerAppParamDesc).Get_ref_cnt() == 0) && (p.value.(IFACE_RangerAppParamDesc).Get_is_class_variable() == false) {
      wr.out("   **/ ", true);
    } else {
      wr.newline();
    }
    if  b_not_used == false {
      if  nn.hasFlag("optional") {
        wr.addImport("errors");
      }
    }
  }
}
func (this *RangerGolangClassWriter) writeArgsDef (fnDesc *RangerAppFunctionDesc, ctx *RangerAppWriterContext, wr *CodeWriter) () {
  var i int64 = 0;  
  for ; i < int64(len(fnDesc.params)) ; i++ {
    arg := fnDesc.params[i];
    if  i > 0 {
      wr.out(", ", false);
    }
    wr.out(strings.Join([]string{ arg.Get_name()," " }, ""), false);
    if  arg.Get_nameNode().value.(*CodeNode).hasFlag("optional") {
      wr.out("*GoNullable", false);
    } else {
      this.writeTypeDef(arg.Get_nameNode().value.(*CodeNode), ctx, wr);
    }
  }
}
func (this *RangerGolangClassWriter) writeNewCall (node *CodeNode, ctx *RangerAppWriterContext, wr *CodeWriter) () {
  if  node.hasNewOper {
    var cl *GoNullable = new(GoNullable); 
    cl.value = node.clDesc.value;
    cl.has_value = node.clDesc.has_value;
    /** unused:  fc*/
    wr.out(strings.Join([]string{ (strings.Join([]string{ "CreateNew_",node.clDesc.value.(*RangerAppClassDesc).name }, "")),"(" }, ""), false);
    var constr *GoNullable = new(GoNullable); 
    constr.value = cl.value.(*RangerAppClassDesc).constructor_fn.value;
    constr.has_value = cl.value.(*RangerAppClassDesc).constructor_fn.has_value;
    var givenArgs *CodeNode = node.getThird();
    if  constr.has_value {
      var i int64 = 0;  
      for ; i < int64(len(constr.value.(*RangerAppFunctionDesc).params)) ; i++ {
        arg := constr.value.(*RangerAppFunctionDesc).params[i];
        var n *CodeNode = givenArgs.children[i];
        if  i > 0 {
          wr.out(", ", false);
        }
        if  true || (arg.Get_nameNode().has_value) {
          this.WalkNode(n, ctx, wr);
        }
      }
    }
    wr.out(")", false);
  }
}
func (this *RangerGolangClassWriter) CreateLambdaCall (node *CodeNode, ctx *RangerAppWriterContext, wr *CodeWriter) () {
  var fName *CodeNode = node.children[0];
  var args *CodeNode = node.children[1];
  this.WriteVRef(fName, ctx, wr);
  wr.out("(", false);
  var i int64 = 0;  
  for ; i < int64(len(args.children)) ; i++ {
    arg := args.children[i];
    if  i > 0 {
      wr.out(", ", false);
    }
    if  arg.value_type != 0 {
      this.WalkNode(arg, ctx, wr);
    }
  }
  wr.out(")", false);
  if  ctx.expressionLevel() == 0 {
    wr.out(";", true);
  }
}
func (this *RangerGolangClassWriter) CreateLambda (node *CodeNode, ctx *RangerAppWriterContext, wr *CodeWriter) () {
  var lambdaCtx *RangerAppWriterContext = node.lambda_ctx.value.(*RangerAppWriterContext);
  var fnNode *CodeNode = node.children[0];
  var args *CodeNode = node.children[1];
  var body *CodeNode = node.children[2];
  wr.out("func (", false);
  var i int64 = 0;  
  for ; i < int64(len(args.children)) ; i++ {
    arg := args.children[i];
    if  i > 0 {
      wr.out(", ", false);
    }
    this.WalkNode(arg, lambdaCtx, wr);
    wr.out(" ", false);
    if  arg.hasFlag("optional") {
      wr.out("*GoNullable", false);
    } else {
      this.writeTypeDef(arg, lambdaCtx, wr);
    }
  }
  wr.out(") ", false);
  if  fnNode.hasFlag("optional") {
    wr.out("*GoNullable", false);
  } else {
    this.writeTypeDef(fnNode, lambdaCtx, wr);
  }
  wr.out(" {", true);
  wr.indent(1);
  lambdaCtx.restartExpressionLevel();
  var i_1 int64 = 0;  
  for ; i_1 < int64(len(body.children)) ; i_1++ {
    item := body.children[i_1];
    this.WalkNode(item, lambdaCtx, wr);
  }
  wr.newline();
  wr.indent(-1);
  wr.out("}", false);
}
func (this *RangerGolangClassWriter) CustomOperator (node *CodeNode, ctx *RangerAppWriterContext, wr *CodeWriter) () {
  var fc *CodeNode = node.getFirst();
  var cmd string = fc.vref;
  if  ((cmd == "=") || (cmd == "push")) || (cmd == "removeLast") {
    var left *CodeNode = node.getSecond();
    var right *CodeNode = left;
    if  (cmd == "=") || (cmd == "push") {
      right = node.getThird(); 
    }
    wr.newline();
    var b_was_static bool = false;
    if  left.hasParamDesc {
      var a_len int64 = (int64(len(left.ns))) - 1;
      /** unused:  last_part*/
      var next_is_gs bool = false;
      var last_was_setter bool = false;
      var needs_par bool = false;
      var i int64 = 0;  
      for ; i < int64(len(left.ns)) ; i++ {
        part := left.ns[i];
        if  next_is_gs {
          if  i == a_len {
            wr.out(".Set_", false);
            last_was_setter = true; 
          } else {
            wr.out(".Get_", false);
            needs_par = true; 
            next_is_gs = false; 
            last_was_setter = false; 
          }
        }
        if  (last_was_setter == false) && (needs_par == false) {
          if  i > 0 {
            if  (i == 1) && b_was_static {
              wr.out("_static_", false);
            } else {
              wr.out(".", false);
            }
          }
        }
        if  i == 0 {
          if  part == "this" {
            wr.out(this.thisName, false);
            continue;
          }
          if  ctx.hasClass(part) {
            b_was_static = true; 
          }
          if  (part != "this") && ctx.isMemberVariable(part) {
            var cc *GoNullable = new(GoNullable); 
            cc = ctx.getCurrentClass();
            var currC *RangerAppClassDesc = cc.value.(*RangerAppClassDesc);
            var up *GoNullable = new(GoNullable); 
            up = currC.findVariable(part);
            if  up.has_value {
              /** unused:  p3*/
              wr.out(strings.Join([]string{ this.thisName,"." }, ""), false);
            }
          }
        }
        var partDef IFACE_RangerAppParamDesc = ctx.getVariableDef(part);
        if  (int64(len(left.nsp))) > i {
          partDef = left.nsp[i]; 
        }
        if  partDef.Get_nameNode().has_value {
          if  ctx.isDefinedClass(partDef.Get_nameNode().value.(*CodeNode).type_name) {
            var c *RangerAppClassDesc = ctx.findClass(partDef.Get_nameNode().value.(*CodeNode).type_name);
            if  c.doesInherit() {
              next_is_gs = true; 
            }
          }
        }
        if  (int64(len(left.nsp))) > 0 {
          var p IFACE_RangerAppParamDesc = left.nsp[i];
          wr.out(this.adjustType(p.Get_compiledName()), false);
        } else {
          if  left.hasParamDesc {
            wr.out(left.paramDesc.value.(IFACE_RangerAppParamDesc).Get_compiledName(), false);
          } else {
            wr.out(this.adjustType(part), false);
          }
        }
        if  needs_par {
          wr.out("()", false);
          needs_par = false; 
        }
        if  (int64(len(left.nsp))) >= (i + 1) {
          var pp IFACE_RangerAppParamDesc = left.nsp[i];
          if  pp.Get_nameNode().value.(*CodeNode).hasFlag("optional") {
            wr.out(".value.(", false);
            this.writeTypeDef(pp.Get_nameNode().value.(*CodeNode), ctx, wr);
            wr.out(")", false);
          }
        }
      }
      if  cmd == "removeLast" {
        if  last_was_setter {
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
      if  cmd == "push" {
        if  last_was_setter {
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
      if  last_was_setter {
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
func (this *RangerGolangClassWriter) writeInterface (cl *RangerAppClassDesc, ctx *RangerAppWriterContext, wr *CodeWriter) () {
  wr.out(strings.Join([]string{ (strings.Join([]string{ "type ",cl.name }, ""))," interface { " }, ""), true);
  wr.indent(1);
  var i int64 = 0;  
  for ; i < int64(len(cl.defined_variants)) ; i++ {
    fnVar := cl.defined_variants[i];
    var mVs *GoNullable = new(GoNullable); 
    mVs = r_get_string_RangerAppMethodVariants(cl.method_variants, fnVar);
    var i_1 int64 = 0;  
    for ; i_1 < int64(len(mVs.value.(*RangerAppMethodVariants).variants)) ; i_1++ {
      variant := mVs.value.(*RangerAppMethodVariants).variants[i_1];
      wr.out(strings.Join([]string{ variant.compiledName,"(" }, ""), false);
      this.writeArgsDef(variant, ctx, wr);
      wr.out(") ", false);
      if  variant.nameNode.value.(*CodeNode).hasFlag("optional") {
        wr.out("*GoNullable", false);
      } else {
        this.writeTypeDef(variant.nameNode.value.(*CodeNode), ctx, wr);
      }
      wr.out("", true);
    }
  }
  wr.indent(-1);
  wr.out("}", true);
}
func (this *RangerGolangClassWriter) writeClass (node *CodeNode, ctx *RangerAppWriterContext, orig_wr *CodeWriter) () {
  var cl *GoNullable = new(GoNullable); 
  cl.value = node.clDesc.value;
  cl.has_value = node.clDesc.has_value;
  if  !cl.has_value  {
    return;
  }
  var wr *CodeWriter = orig_wr;
  if  this.did_write_nullable == false {
    wr.raw("\r\ntype GoNullable struct { \r\n  value interface{}\r\n  has_value bool\r\n}\r\n", true);
    wr.createTag("utilities");
    this.did_write_nullable = true; 
  }
  var declaredVariable map[string]bool = make(map[string]bool);
  wr.out(strings.Join([]string{ (strings.Join([]string{ "type ",cl.value.(*RangerAppClassDesc).name }, ""))," struct { " }, ""), true);
  wr.indent(1);
  var i int64 = 0;  
  for ; i < int64(len(cl.value.(*RangerAppClassDesc).variables)) ; i++ {
    pvar := cl.value.(*RangerAppClassDesc).variables[i];
    this.writeStructField(pvar.Get_node().value.(*CodeNode), ctx, wr);
    declaredVariable[pvar.Get_name()] = true
  }
  if  (int64(len(cl.value.(*RangerAppClassDesc).extends_classes))) > 0 {
    var i_1 int64 = 0;  
    for ; i_1 < int64(len(cl.value.(*RangerAppClassDesc).extends_classes)) ; i_1++ {
      pName := cl.value.(*RangerAppClassDesc).extends_classes[i_1];
      var pC *RangerAppClassDesc = ctx.findClass(pName);
      wr.out(strings.Join([]string{ "// inherited from parent class ",pName }, ""), true);
      var i_2 int64 = 0;  
      for ; i_2 < int64(len(pC.variables)) ; i_2++ {
        pvar_1 := pC.variables[i_2];
        if  r_has_key_string_bool(declaredVariable, pvar_1.Get_name()) {
          continue;
        }
        this.writeStructField(pvar_1.Get_node().value.(*CodeNode), ctx, wr);
      }
    }
  }
  wr.indent(-1);
  wr.out("}", true);
  wr.out(strings.Join([]string{ (strings.Join([]string{ "type IFACE_",cl.value.(*RangerAppClassDesc).name }, ""))," interface { " }, ""), true);
  wr.indent(1);
  var i_3 int64 = 0;  
  for ; i_3 < int64(len(cl.value.(*RangerAppClassDesc).variables)) ; i_3++ {
    p := cl.value.(*RangerAppClassDesc).variables[i_3];
    wr.out("Get_", false);
    wr.out(strings.Join([]string{ p.Get_compiledName(),"() " }, ""), false);
    if  p.Get_nameNode().value.(*CodeNode).hasFlag("optional") {
      wr.out("*GoNullable", false);
    } else {
      this.writeTypeDef(p.Get_nameNode().value.(*CodeNode), ctx, wr);
    }
    wr.out("", true);
    wr.out("Set_", false);
    wr.out(strings.Join([]string{ p.Get_compiledName(),"(value " }, ""), false);
    if  p.Get_nameNode().value.(*CodeNode).hasFlag("optional") {
      wr.out("*GoNullable", false);
    } else {
      this.writeTypeDef(p.Get_nameNode().value.(*CodeNode), ctx, wr);
    }
    wr.out(") ", true);
  }
  var i_4 int64 = 0;  
  for ; i_4 < int64(len(cl.value.(*RangerAppClassDesc).defined_variants)) ; i_4++ {
    fnVar := cl.value.(*RangerAppClassDesc).defined_variants[i_4];
    var mVs *GoNullable = new(GoNullable); 
    mVs = r_get_string_RangerAppMethodVariants(cl.value.(*RangerAppClassDesc).method_variants, fnVar);
    var i_5 int64 = 0;  
    for ; i_5 < int64(len(mVs.value.(*RangerAppMethodVariants).variants)) ; i_5++ {
      variant := mVs.value.(*RangerAppMethodVariants).variants[i_5];
      wr.out(strings.Join([]string{ variant.compiledName,"(" }, ""), false);
      this.writeArgsDef(variant, ctx, wr);
      wr.out(") ", false);
      if  variant.nameNode.value.(*CodeNode).hasFlag("optional") {
        wr.out("*GoNullable", false);
      } else {
        this.writeTypeDef(variant.nameNode.value.(*CodeNode), ctx, wr);
      }
      wr.out("", true);
    }
  }
  wr.indent(-1);
  wr.out("}", true);
  this.thisName = "me"; 
  wr.out("", true);
  wr.out(strings.Join([]string{ (strings.Join([]string{ "func CreateNew_",cl.value.(*RangerAppClassDesc).name }, "")),"(" }, ""), false);
  if  cl.value.(*RangerAppClassDesc).has_constructor {
    var constr *GoNullable = new(GoNullable); 
    constr.value = cl.value.(*RangerAppClassDesc).constructor_fn.value;
    constr.has_value = cl.value.(*RangerAppClassDesc).constructor_fn.has_value;
    var i_6 int64 = 0;  
    for ; i_6 < int64(len(constr.value.(*RangerAppFunctionDesc).params)) ; i_6++ {
      arg := constr.value.(*RangerAppFunctionDesc).params[i_6];
      if  i_6 > 0 {
        wr.out(", ", false);
      }
      wr.out(strings.Join([]string{ arg.Get_name()," " }, ""), false);
      this.writeTypeDef(arg.Get_nameNode().value.(*CodeNode), ctx, wr);
    }
  }
  wr.out(strings.Join([]string{ (strings.Join([]string{ ") *",cl.value.(*RangerAppClassDesc).name }, ""))," {" }, ""), true);
  wr.indent(1);
  wr.newline();
  wr.out(strings.Join([]string{ (strings.Join([]string{ "me := new(",cl.value.(*RangerAppClassDesc).name }, "")),")" }, ""), true);
  var i_7 int64 = 0;  
  for ; i_7 < int64(len(cl.value.(*RangerAppClassDesc).variables)) ; i_7++ {
    pvar_2 := cl.value.(*RangerAppClassDesc).variables[i_7];
    var nn *CodeNode = pvar_2.Get_node().value.(*CodeNode);
    if  (int64(len(nn.children))) > 2 {
      var valueNode *CodeNode = nn.children[2];
      wr.out(strings.Join([]string{ (strings.Join([]string{ "me.",pvar_2.Get_compiledName() }, ""))," = " }, ""), false);
      this.WalkNode(valueNode, ctx, wr);
      wr.out("", true);
    } else {
      var pNameN *GoNullable = new(GoNullable); 
      pNameN.value = pvar_2.Get_nameNode().value;
      pNameN.has_value = pvar_2.Get_nameNode().has_value;
      if  pNameN.value.(*CodeNode).value_type == 6 {
        wr.out(strings.Join([]string{ (strings.Join([]string{ "me.",pvar_2.Get_compiledName() }, ""))," = " }, ""), false);
        wr.out("make(", false);
        this.writeTypeDef(pvar_2.Get_nameNode().value.(*CodeNode), ctx, wr);
        wr.out(",0)", true);
      }
      if  pNameN.value.(*CodeNode).value_type == 7 {
        wr.out(strings.Join([]string{ (strings.Join([]string{ "me.",pvar_2.Get_compiledName() }, ""))," = " }, ""), false);
        wr.out("make(", false);
        this.writeTypeDef(pvar_2.Get_nameNode().value.(*CodeNode), ctx, wr);
        wr.out(")", true);
      }
    }
  }
  var i_8 int64 = 0;  
  for ; i_8 < int64(len(cl.value.(*RangerAppClassDesc).variables)) ; i_8++ {
    pvar_3 := cl.value.(*RangerAppClassDesc).variables[i_8];
    if  pvar_3.Get_nameNode().value.(*CodeNode).hasFlag("optional") {
      wr.out(strings.Join([]string{ (strings.Join([]string{ "me.",pvar_3.Get_compiledName() }, ""))," = new(GoNullable);" }, ""), true);
    }
  }
  if  (int64(len(cl.value.(*RangerAppClassDesc).extends_classes))) > 0 {
    var i_9 int64 = 0;  
    for ; i_9 < int64(len(cl.value.(*RangerAppClassDesc).extends_classes)) ; i_9++ {
      pName_1 := cl.value.(*RangerAppClassDesc).extends_classes[i_9];
      var pC_1 *RangerAppClassDesc = ctx.findClass(pName_1);
      var i_10 int64 = 0;  
      for ; i_10 < int64(len(pC_1.variables)) ; i_10++ {
        pvar_4 := pC_1.variables[i_10];
        var nn_1 *CodeNode = pvar_4.Get_node().value.(*CodeNode);
        if  (int64(len(nn_1.children))) > 2 {
          var valueNode_1 *CodeNode = nn_1.children[2];
          wr.out(strings.Join([]string{ (strings.Join([]string{ "me.",pvar_4.Get_compiledName() }, ""))," = " }, ""), false);
          this.WalkNode(valueNode_1, ctx, wr);
          wr.out("", true);
        } else {
          var pNameN_1 *CodeNode = pvar_4.Get_nameNode().value.(*CodeNode);
          if  pNameN_1.value_type == 6 {
            wr.out(strings.Join([]string{ (strings.Join([]string{ "me.",pvar_4.Get_compiledName() }, ""))," = " }, ""), false);
            wr.out("make(", false);
            this.writeTypeDef(pvar_4.Get_nameNode().value.(*CodeNode), ctx, wr);
            wr.out(",0)", true);
          }
          if  pNameN_1.value_type == 7 {
            wr.out(strings.Join([]string{ (strings.Join([]string{ "me.",pvar_4.Get_compiledName() }, ""))," = " }, ""), false);
            wr.out("make(", false);
            this.writeTypeDef(pvar_4.Get_nameNode().value.(*CodeNode), ctx, wr);
            wr.out(")", true);
          }
        }
      }
      var i_11 int64 = 0;  
      for ; i_11 < int64(len(pC_1.variables)) ; i_11++ {
        pvar_5 := pC_1.variables[i_11];
        if  pvar_5.Get_nameNode().value.(*CodeNode).hasFlag("optional") {
          wr.out(strings.Join([]string{ (strings.Join([]string{ "me.",pvar_5.Get_compiledName() }, ""))," = new(GoNullable);" }, ""), true);
        }
      }
      if  pC_1.has_constructor {
        var constr_1 *GoNullable = new(GoNullable); 
        constr_1.value = pC_1.constructor_fn.value;
        constr_1.has_value = pC_1.constructor_fn.has_value;
        var subCtx *RangerAppWriterContext = constr_1.value.(*RangerAppFunctionDesc).fnCtx.value.(*RangerAppWriterContext);
        subCtx.is_function = true; 
        this.WalkNode(constr_1.value.(*RangerAppFunctionDesc).fnBody.value.(*CodeNode), subCtx, wr);
      }
    }
  }
  if  cl.value.(*RangerAppClassDesc).has_constructor {
    var constr_2 *GoNullable = new(GoNullable); 
    constr_2.value = cl.value.(*RangerAppClassDesc).constructor_fn.value;
    constr_2.has_value = cl.value.(*RangerAppClassDesc).constructor_fn.has_value;
    var subCtx_1 *RangerAppWriterContext = constr_2.value.(*RangerAppFunctionDesc).fnCtx.value.(*RangerAppWriterContext);
    subCtx_1.is_function = true; 
    this.WalkNode(constr_2.value.(*RangerAppFunctionDesc).fnBody.value.(*CodeNode), subCtx_1, wr);
  }
  wr.out("return me;", true);
  wr.indent(-1);
  wr.out("}", true);
  this.thisName = "this"; 
  var i_12 int64 = 0;  
  for ; i_12 < int64(len(cl.value.(*RangerAppClassDesc).static_methods)) ; i_12++ {
    variant_1 := cl.value.(*RangerAppClassDesc).static_methods[i_12];
    if  variant_1.nameNode.value.(*CodeNode).hasFlag("main") {
      continue;
    }
    wr.newline();
    wr.out(strings.Join([]string{ (strings.Join([]string{ (strings.Join([]string{ (strings.Join([]string{ "func ",cl.value.(*RangerAppClassDesc).name }, "")),"_static_" }, "")),variant_1.compiledName }, "")),"(" }, ""), false);
    this.writeArgsDef(variant_1, ctx, wr);
    wr.out(") ", false);
    this.writeTypeDef(variant_1.nameNode.value.(*CodeNode), ctx, wr);
    wr.out(" {", true);
    wr.indent(1);
    wr.newline();
    var subCtx_2 *RangerAppWriterContext = variant_1.fnCtx.value.(*RangerAppWriterContext);
    subCtx_2.is_function = true; 
    this.WalkNode(variant_1.fnBody.value.(*CodeNode), subCtx_2, wr);
    wr.newline();
    wr.indent(-1);
    wr.out("}", true);
  }
  var declaredFn map[string]bool = make(map[string]bool);
  var i_13 int64 = 0;  
  for ; i_13 < int64(len(cl.value.(*RangerAppClassDesc).defined_variants)) ; i_13++ {
    fnVar_1 := cl.value.(*RangerAppClassDesc).defined_variants[i_13];
    var mVs_1 *GoNullable = new(GoNullable); 
    mVs_1 = r_get_string_RangerAppMethodVariants(cl.value.(*RangerAppClassDesc).method_variants, fnVar_1);
    var i_14 int64 = 0;  
    for ; i_14 < int64(len(mVs_1.value.(*RangerAppMethodVariants).variants)) ; i_14++ {
      variant_2 := mVs_1.value.(*RangerAppMethodVariants).variants[i_14];
      declaredFn[variant_2.name] = true
      wr.out(strings.Join([]string{ (strings.Join([]string{ (strings.Join([]string{ (strings.Join([]string{ "func (this *",cl.value.(*RangerAppClassDesc).name }, "")),") " }, "")),variant_2.compiledName }, ""))," (" }, ""), false);
      this.writeArgsDef(variant_2, ctx, wr);
      wr.out(") ", false);
      if  variant_2.nameNode.value.(*CodeNode).hasFlag("optional") {
        wr.out("*GoNullable", false);
      } else {
        this.writeTypeDef(variant_2.nameNode.value.(*CodeNode), ctx, wr);
      }
      wr.out(" {", true);
      wr.indent(1);
      wr.newline();
      var subCtx_3 *RangerAppWriterContext = variant_2.fnCtx.value.(*RangerAppWriterContext);
      subCtx_3.is_function = true; 
      this.WalkNode(variant_2.fnBody.value.(*CodeNode), subCtx_3, wr);
      wr.newline();
      wr.indent(-1);
      wr.out("}", true);
    }
  }
  if  (int64(len(cl.value.(*RangerAppClassDesc).extends_classes))) > 0 {
    var i_15 int64 = 0;  
    for ; i_15 < int64(len(cl.value.(*RangerAppClassDesc).extends_classes)) ; i_15++ {
      pName_2 := cl.value.(*RangerAppClassDesc).extends_classes[i_15];
      var pC_2 *RangerAppClassDesc = ctx.findClass(pName_2);
      wr.out(strings.Join([]string{ "// inherited methods from parent class ",pName_2 }, ""), true);
      var i_16 int64 = 0;  
      for ; i_16 < int64(len(pC_2.defined_variants)) ; i_16++ {
        fnVar_2 := pC_2.defined_variants[i_16];
        var mVs_2 *GoNullable = new(GoNullable); 
        mVs_2 = r_get_string_RangerAppMethodVariants(pC_2.method_variants, fnVar_2);
        var i_17 int64 = 0;  
        for ; i_17 < int64(len(mVs_2.value.(*RangerAppMethodVariants).variants)) ; i_17++ {
          variant_3 := mVs_2.value.(*RangerAppMethodVariants).variants[i_17];
          if  r_has_key_string_bool(declaredFn, variant_3.name) {
            continue;
          }
          wr.out(strings.Join([]string{ (strings.Join([]string{ (strings.Join([]string{ (strings.Join([]string{ "func (this *",cl.value.(*RangerAppClassDesc).name }, "")),") " }, "")),variant_3.compiledName }, ""))," (" }, ""), false);
          this.writeArgsDef(variant_3, ctx, wr);
          wr.out(") ", false);
          if  variant_3.nameNode.value.(*CodeNode).hasFlag("optional") {
            wr.out("*GoNullable", false);
          } else {
            this.writeTypeDef(variant_3.nameNode.value.(*CodeNode), ctx, wr);
          }
          wr.out(" {", true);
          wr.indent(1);
          wr.newline();
          var subCtx_4 *RangerAppWriterContext = variant_3.fnCtx.value.(*RangerAppWriterContext);
          subCtx_4.is_function = true; 
          this.WalkNode(variant_3.fnBody.value.(*CodeNode), subCtx_4, wr);
          wr.newline();
          wr.indent(-1);
          wr.out("}", true);
        }
      }
    }
  }
  var declaredGetter map[string]bool = make(map[string]bool);
  var i_18 int64 = 0;  
  for ; i_18 < int64(len(cl.value.(*RangerAppClassDesc).variables)) ; i_18++ {
    p_1 := cl.value.(*RangerAppClassDesc).variables[i_18];
    declaredGetter[p_1.Get_name()] = true
    wr.newline();
    wr.out(strings.Join([]string{ "// getter for variable ",p_1.Get_name() }, ""), true);
    wr.out(strings.Join([]string{ (strings.Join([]string{ "func (this *",cl.value.(*RangerAppClassDesc).name }, "")),") " }, ""), false);
    wr.out("Get_", false);
    wr.out(strings.Join([]string{ p_1.Get_compiledName(),"() " }, ""), false);
    if  p_1.Get_nameNode().value.(*CodeNode).hasFlag("optional") {
      wr.out("*GoNullable", false);
    } else {
      this.writeTypeDef(p_1.Get_nameNode().value.(*CodeNode), ctx, wr);
    }
    wr.out(" {", true);
    wr.indent(1);
    wr.out(strings.Join([]string{ "return this.",p_1.Get_compiledName() }, ""), true);
    wr.indent(-1);
    wr.out("}", true);
    wr.newline();
    wr.out(strings.Join([]string{ "// setter for variable ",p_1.Get_name() }, ""), true);
    wr.out(strings.Join([]string{ (strings.Join([]string{ "func (this *",cl.value.(*RangerAppClassDesc).name }, "")),") " }, ""), false);
    wr.out("Set_", false);
    wr.out(strings.Join([]string{ p_1.Get_compiledName(),"( value " }, ""), false);
    if  p_1.Get_nameNode().value.(*CodeNode).hasFlag("optional") {
      wr.out("*GoNullable", false);
    } else {
      this.writeTypeDef(p_1.Get_nameNode().value.(*CodeNode), ctx, wr);
    }
    wr.out(") ", false);
    wr.out(" {", true);
    wr.indent(1);
    wr.out(strings.Join([]string{ (strings.Join([]string{ "this.",p_1.Get_compiledName() }, ""))," = value " }, ""), true);
    wr.indent(-1);
    wr.out("}", true);
  }
  if  (int64(len(cl.value.(*RangerAppClassDesc).extends_classes))) > 0 {
    var i_19 int64 = 0;  
    for ; i_19 < int64(len(cl.value.(*RangerAppClassDesc).extends_classes)) ; i_19++ {
      pName_3 := cl.value.(*RangerAppClassDesc).extends_classes[i_19];
      var pC_3 *RangerAppClassDesc = ctx.findClass(pName_3);
      wr.out(strings.Join([]string{ "// inherited getters and setters from the parent class ",pName_3 }, ""), true);
      var i_20 int64 = 0;  
      for ; i_20 < int64(len(pC_3.variables)) ; i_20++ {
        p_2 := pC_3.variables[i_20];
        if  r_has_key_string_bool(declaredGetter, p_2.Get_name()) {
          continue;
        }
        wr.newline();
        wr.out(strings.Join([]string{ "// getter for variable ",p_2.Get_name() }, ""), true);
        wr.out(strings.Join([]string{ (strings.Join([]string{ "func (this *",cl.value.(*RangerAppClassDesc).name }, "")),") " }, ""), false);
        wr.out("Get_", false);
        wr.out(strings.Join([]string{ p_2.Get_compiledName(),"() " }, ""), false);
        if  p_2.Get_nameNode().value.(*CodeNode).hasFlag("optional") {
          wr.out("*GoNullable", false);
        } else {
          this.writeTypeDef(p_2.Get_nameNode().value.(*CodeNode), ctx, wr);
        }
        wr.out(" {", true);
        wr.indent(1);
        wr.out(strings.Join([]string{ "return this.",p_2.Get_compiledName() }, ""), true);
        wr.indent(-1);
        wr.out("}", true);
        wr.newline();
        wr.out(strings.Join([]string{ "// getter for variable ",p_2.Get_name() }, ""), true);
        wr.out(strings.Join([]string{ (strings.Join([]string{ "func (this *",cl.value.(*RangerAppClassDesc).name }, "")),") " }, ""), false);
        wr.out("Set_", false);
        wr.out(strings.Join([]string{ p_2.Get_compiledName(),"( value " }, ""), false);
        if  p_2.Get_nameNode().value.(*CodeNode).hasFlag("optional") {
          wr.out("*GoNullable", false);
        } else {
          this.writeTypeDef(p_2.Get_nameNode().value.(*CodeNode), ctx, wr);
        }
        wr.out(") ", false);
        wr.out(" {", true);
        wr.indent(1);
        wr.out(strings.Join([]string{ (strings.Join([]string{ "this.",p_2.Get_compiledName() }, ""))," = value " }, ""), true);
        wr.indent(-1);
        wr.out("}", true);
      }
    }
  }
  var i_21 int64 = 0;  
  for ; i_21 < int64(len(cl.value.(*RangerAppClassDesc).static_methods)) ; i_21++ {
    variant_4 := cl.value.(*RangerAppClassDesc).static_methods[i_21];
    if  variant_4.nameNode.value.(*CodeNode).hasFlag("main") && (variant_4.nameNode.value.(*CodeNode).code.value.(*SourceCode).filename == ctx.getRootFile()) {
      wr.out("func main() {", true);
      wr.indent(1);
      wr.newline();
      var subCtx_5 *RangerAppWriterContext = variant_4.fnCtx.value.(*RangerAppWriterContext);
      subCtx_5.is_function = true; 
      this.WalkNode(variant_4.fnBody.value.(*CodeNode), subCtx_5, wr);
      wr.newline();
      wr.indent(-1);
      wr.out("}", true);
    }
  }
}
// inherited methods from parent class RangerGenericClassWriter
func (this *RangerGolangClassWriter) EncodeString (node *CodeNode, ctx *RangerAppWriterContext, wr *CodeWriter) string {
  /** unused:  encoded_str*/
  var str_length int64 = int64(len(node.string_value));
  var encoded_str_2 string = "";
  var ii int64 = 0;
  for ii < str_length {
    var cc int64 = int64(node.string_value[ii]);
    switch (cc ) { 
      case 8 : 
        encoded_str_2 = strings.Join([]string{ (strings.Join([]string{ encoded_str_2,(string([] byte{byte(92)})) }, "")),(string([] byte{byte(98)})) }, ""); 
      case 9 : 
        encoded_str_2 = strings.Join([]string{ (strings.Join([]string{ encoded_str_2,(string([] byte{byte(92)})) }, "")),(string([] byte{byte(116)})) }, ""); 
      case 10 : 
        encoded_str_2 = strings.Join([]string{ (strings.Join([]string{ encoded_str_2,(string([] byte{byte(92)})) }, "")),(string([] byte{byte(110)})) }, ""); 
      case 12 : 
        encoded_str_2 = strings.Join([]string{ (strings.Join([]string{ encoded_str_2,(string([] byte{byte(92)})) }, "")),(string([] byte{byte(102)})) }, ""); 
      case 13 : 
        encoded_str_2 = strings.Join([]string{ (strings.Join([]string{ encoded_str_2,(string([] byte{byte(92)})) }, "")),(string([] byte{byte(114)})) }, ""); 
      case 34 : 
        encoded_str_2 = strings.Join([]string{ (strings.Join([]string{ encoded_str_2,(string([] byte{byte(92)})) }, "")),(string([] byte{byte(34)})) }, ""); 
      case 92 : 
        encoded_str_2 = strings.Join([]string{ (strings.Join([]string{ encoded_str_2,(string([] byte{byte(92)})) }, "")),(string([] byte{byte(92)})) }, ""); 
      default: 
        encoded_str_2 = strings.Join([]string{ encoded_str_2,(string([] byte{byte(cc)})) }, ""); 
    }
    ii = ii + 1; 
  }
  return encoded_str_2;
}
func (this *RangerGolangClassWriter) WriteEnum (node *CodeNode, ctx *RangerAppWriterContext, wr *CodeWriter) () {
  if  node.eval_type == 11 {
    var rootObjName string = node.ns[0];
    var e *GoNullable = new(GoNullable); 
    e = ctx.getEnum(rootObjName);
    if  e.has_value {
      var enumName string = node.ns[1];
      wr.out(strings.Join([]string{ "",strconv.FormatInt(((r_get_string_int64(e.value.(*RangerAppEnum).values, enumName)).value.(int64)), 10) }, ""), false);
    } else {
      if  node.hasParamDesc {
        var pp *GoNullable = new(GoNullable); 
        pp.value = node.paramDesc.value;
        pp.has_value = node.paramDesc.has_value;
        var nn *GoNullable = new(GoNullable); 
        nn.value = pp.value.(IFACE_RangerAppParamDesc).Get_nameNode().value;
        nn.has_value = pp.value.(IFACE_RangerAppParamDesc).Get_nameNode().has_value;
        this.WriteVRef(nn.value.(*CodeNode), ctx, wr);
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
  var i int64 = 0;  
  for ; i < int64(len(ctx.localVarNames)) ; i++ {
    n := ctx.localVarNames[i];
    var p *GoNullable = new(GoNullable); 
    p = r_get_string_IFACE_RangerAppParamDesc(ctx.localVariables, n);
    if  p.value.(IFACE_RangerAppParamDesc).Get_ref_cnt() == 0 {
      continue;
    }
    if  p.value.(IFACE_RangerAppParamDesc).isAllocatedType() {
      if  1 == p.value.(IFACE_RangerAppParamDesc).getStrength() {
        if  p.value.(IFACE_RangerAppParamDesc).Get_nameNode().value.(*CodeNode).eval_type == 7 {
        }
        if  p.value.(IFACE_RangerAppParamDesc).Get_nameNode().value.(*CodeNode).eval_type == 6 {
        }
        if  (p.value.(IFACE_RangerAppParamDesc).Get_nameNode().value.(*CodeNode).eval_type != 6) && (p.value.(IFACE_RangerAppParamDesc).Get_nameNode().value.(*CodeNode).eval_type != 7) {
        }
      }
      if  0 == p.value.(IFACE_RangerAppParamDesc).getStrength() {
        if  p.value.(IFACE_RangerAppParamDesc).Get_nameNode().value.(*CodeNode).eval_type == 7 {
        }
        if  p.value.(IFACE_RangerAppParamDesc).Get_nameNode().value.(*CodeNode).eval_type == 6 {
        }
        if  (p.value.(IFACE_RangerAppParamDesc).Get_nameNode().value.(*CodeNode).eval_type != 6) && (p.value.(IFACE_RangerAppParamDesc).Get_nameNode().value.(*CodeNode).eval_type != 7) {
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
    var fc *CodeNode = node.getFirst();
    this.WriteVRef(fc, ctx, wr);
    wr.out("(", false);
    var givenArgs *CodeNode = node.getSecond();
    ctx.setInExpr();
    var i int64 = 0;  
    for ; i < int64(len(node.fnDesc.value.(*RangerAppFunctionDesc).params)) ; i++ {
      arg := node.fnDesc.value.(*RangerAppFunctionDesc).params[i];
      if  i > 0 {
        wr.out(", ", false);
      }
      if  (int64(len(givenArgs.children))) <= i {
        var defVal *GoNullable = new(GoNullable); 
        defVal = arg.Get_nameNode().value.(*CodeNode).getFlag("default");
        if  defVal.has_value {
          var fc_1 *CodeNode = defVal.value.(*CodeNode).vref_annotation.value.(*CodeNode).getFirst();
          this.WalkNode(fc_1, ctx, wr);
        } else {
          ctx.addError(node, "Default argument was missing");
        }
        continue;
      }
      var n *CodeNode = givenArgs.children[i];
      this.WalkNode(n, ctx, wr);
    }
    ctx.unsetInExpr();
    wr.out(")", false);
    if  ctx.expressionLevel() == 0 {
      wr.out(";", true);
    }
  }
}
func (this *RangerGolangClassWriter) disabledVarDef (node *CodeNode, ctx *RangerAppWriterContext, wr *CodeWriter) () {
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
  EncodeString(node *CodeNode, ctx *RangerAppWriterContext, wr *CodeWriter) string
  WriteScalarValue(node *CodeNode, ctx *RangerAppWriterContext, wr *CodeWriter) ()
  WriteVRef(node *CodeNode, ctx *RangerAppWriterContext, wr *CodeWriter) ()
  writeVarInitDef(node *CodeNode, ctx *RangerAppWriterContext, wr *CodeWriter) ()
  writeVarDef(node *CodeNode, ctx *RangerAppWriterContext, wr *CodeWriter) ()
  disabledVarDef(node *CodeNode, ctx *RangerAppWriterContext, wr *CodeWriter) ()
  CreateLambdaCall(node *CodeNode, ctx *RangerAppWriterContext, wr *CodeWriter) ()
  CreateLambda(node *CodeNode, ctx *RangerAppWriterContext, wr *CodeWriter) ()
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
func (this *RangerPHPClassWriter) EncodeString (node *CodeNode, ctx *RangerAppWriterContext, wr *CodeWriter) string {
  /** unused:  encoded_str*/
  var str_length int64 = int64(len(node.string_value));
  var encoded_str_2 string = "";
  var ii int64 = 0;
  for ii < str_length {
    var cc int64 = int64(node.string_value[ii]);
    switch (cc ) { 
      case 8 : 
        encoded_str_2 = strings.Join([]string{ (strings.Join([]string{ encoded_str_2,(string([] byte{byte(92)})) }, "")),(string([] byte{byte(98)})) }, ""); 
      case 9 : 
        encoded_str_2 = strings.Join([]string{ (strings.Join([]string{ encoded_str_2,(string([] byte{byte(92)})) }, "")),(string([] byte{byte(116)})) }, ""); 
      case 10 : 
        encoded_str_2 = strings.Join([]string{ (strings.Join([]string{ encoded_str_2,(string([] byte{byte(92)})) }, "")),(string([] byte{byte(110)})) }, ""); 
      case 12 : 
        encoded_str_2 = strings.Join([]string{ (strings.Join([]string{ encoded_str_2,(string([] byte{byte(92)})) }, "")),(string([] byte{byte(102)})) }, ""); 
      case 13 : 
        encoded_str_2 = strings.Join([]string{ (strings.Join([]string{ encoded_str_2,(string([] byte{byte(92)})) }, "")),(string([] byte{byte(114)})) }, ""); 
      case 34 : 
        encoded_str_2 = strings.Join([]string{ (strings.Join([]string{ encoded_str_2,(string([] byte{byte(92)})) }, "")),(string([] byte{byte(34)})) }, ""); 
      case 36 : 
        encoded_str_2 = strings.Join([]string{ (strings.Join([]string{ encoded_str_2,(string([] byte{byte(92)})) }, "")),(string([] byte{byte(34)})) }, ""); 
      case 92 : 
        encoded_str_2 = strings.Join([]string{ (strings.Join([]string{ encoded_str_2,(string([] byte{byte(92)})) }, "")),(string([] byte{byte(92)})) }, ""); 
      default: 
        encoded_str_2 = strings.Join([]string{ encoded_str_2,(string([] byte{byte(cc)})) }, ""); 
    }
    ii = ii + 1; 
  }
  return encoded_str_2;
}
func (this *RangerPHPClassWriter) WriteScalarValue (node *CodeNode, ctx *RangerAppWriterContext, wr *CodeWriter) () {
  switch (node.value_type ) { 
    case 2 : 
      wr.out(strings.Join([]string{ "",strconv.FormatFloat(node.double_value,'f', 6, 64) }, ""), false);
    case 4 : 
      var s string = this.EncodeString(node, ctx, wr);
      wr.out(strings.Join([]string{ (strings.Join([]string{ "\"",s }, "")),"\"" }, ""), false);
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
func (this *RangerPHPClassWriter) WriteVRef (node *CodeNode, ctx *RangerAppWriterContext, wr *CodeWriter) () {
  if  node.vref == "this" {
    wr.out("$this", false);
    return;
  }
  if  node.eval_type == 11 {
    if  (int64(len(node.ns))) > 1 {
      var rootObjName string = node.ns[0];
      var enumName string = node.ns[1];
      var e *GoNullable = new(GoNullable); 
      e = ctx.getEnum(rootObjName);
      if  e.has_value {
        wr.out(strings.Join([]string{ "",strconv.FormatInt(((r_get_string_int64(e.value.(*RangerAppEnum).values, enumName)).value.(int64)), 10) }, ""), false);
        return;
      }
    }
  }
  if  (int64(len(node.nsp))) > 0 {
    var i int64 = 0;  
    for ; i < int64(len(node.nsp)) ; i++ {
      p := node.nsp[i];
      if  i == 0 {
        var part string = node.ns[0];
        if  part == "this" {
          wr.out("$this", false);
          continue;
        }
      }
      if  i > 0 {
        wr.out("->", false);
      }
      if  i == 0 {
        wr.out("$", false);
        if  p.Get_nameNode().value.(*CodeNode).hasFlag("optional") {
        }
        var part_1 string = node.ns[0];
        if  (part_1 != "this") && ctx.hasCurrentClass() {
          var uc *GoNullable = new(GoNullable); 
          uc = ctx.getCurrentClass();
          var currC *RangerAppClassDesc = uc.value.(*RangerAppClassDesc);
          var up *GoNullable = new(GoNullable); 
          up = currC.findVariable(part_1);
          if  up.has_value {
            if  false == ctx.isInStatic() {
              wr.out(strings.Join([]string{ this.thisName,"->" }, ""), false);
            }
          }
        }
      }
      if  (int64(len(p.Get_compiledName()))) > 0 {
        wr.out(this.adjustType(p.Get_compiledName()), false);
      } else {
        if  (int64(len(p.Get_name()))) > 0 {
          wr.out(this.adjustType(p.Get_name()), false);
        } else {
          wr.out(this.adjustType((node.ns[i])), false);
        }
      }
    }
    return;
  }
  if  node.hasParamDesc {
    wr.out("$", false);
    var part_2 string = node.ns[0];
    if  (part_2 != "this") && ctx.hasCurrentClass() {
      var uc_1 *GoNullable = new(GoNullable); 
      uc_1 = ctx.getCurrentClass();
      var currC_1 *RangerAppClassDesc = uc_1.value.(*RangerAppClassDesc);
      var up_1 *GoNullable = new(GoNullable); 
      up_1 = currC_1.findVariable(part_2);
      if  up_1.has_value {
        if  false == ctx.isInStatic() {
          wr.out(strings.Join([]string{ this.thisName,"->" }, ""), false);
        }
      }
    }
    var p_1 *GoNullable = new(GoNullable); 
    p_1.value = node.paramDesc.value;
    p_1.has_value = node.paramDesc.has_value;
    wr.out(p_1.value.(IFACE_RangerAppParamDesc).Get_compiledName(), false);
    return;
  }
  var b_was_static bool = false;
  var i_1 int64 = 0;  
  for ; i_1 < int64(len(node.ns)) ; i_1++ {
    part_3 := node.ns[i_1];
    if  i_1 > 0 {
      if  (i_1 == 1) && b_was_static {
        wr.out("::", false);
      } else {
        wr.out("->", false);
      }
    }
    if  i_1 == 0 {
      if  ctx.hasClass(part_3) {
        b_was_static = true; 
      } else {
        wr.out("$", false);
      }
      if  (part_3 != "this") && ctx.hasCurrentClass() {
        var uc_2 *GoNullable = new(GoNullable); 
        uc_2 = ctx.getCurrentClass();
        var currC_2 *RangerAppClassDesc = uc_2.value.(*RangerAppClassDesc);
        var up_2 *GoNullable = new(GoNullable); 
        up_2 = currC_2.findVariable(part_3);
        if  up_2.has_value {
          if  false == ctx.isInStatic() {
            wr.out(strings.Join([]string{ this.thisName,"->" }, ""), false);
          }
        }
      }
    }
    wr.out(this.adjustType(part_3), false);
  }
}
func (this *RangerPHPClassWriter) writeVarInitDef (node *CodeNode, ctx *RangerAppWriterContext, wr *CodeWriter) () {
  if  node.hasParamDesc {
    var nn *CodeNode = node.children[1];
    var p *GoNullable = new(GoNullable); 
    p.value = nn.paramDesc.value;
    p.has_value = nn.paramDesc.has_value;
    if  (p.value.(IFACE_RangerAppParamDesc).Get_ref_cnt() == 0) && (p.value.(IFACE_RangerAppParamDesc).Get_is_class_variable() == false) {
      wr.out("/** unused:  ", false);
    }
    wr.out(strings.Join([]string{ "$this->",p.value.(IFACE_RangerAppParamDesc).Get_compiledName() }, ""), false);
    if  (int64(len(node.children))) > 2 {
      wr.out(" = ", false);
      ctx.setInExpr();
      var value *CodeNode = node.getThird();
      this.WalkNode(value, ctx, wr);
      ctx.unsetInExpr();
    } else {
      if  nn.value_type == 6 {
        wr.out(" = array()", false);
      }
      if  nn.value_type == 7 {
        wr.out(" = array()", false);
      }
    }
    if  (p.value.(IFACE_RangerAppParamDesc).Get_ref_cnt() == 0) && (p.value.(IFACE_RangerAppParamDesc).Get_is_class_variable() == false) {
      wr.out("   **/", true);
      return;
    }
    wr.out(";", false);
    if  (p.value.(IFACE_RangerAppParamDesc).Get_ref_cnt() == 0) && (p.value.(IFACE_RangerAppParamDesc).Get_is_class_variable() == true) {
      wr.out("     /** note: unused */", false);
    }
    wr.newline();
  }
}
func (this *RangerPHPClassWriter) writeVarDef (node *CodeNode, ctx *RangerAppWriterContext, wr *CodeWriter) () {
  if  node.hasParamDesc {
    var nn *CodeNode = node.children[1];
    var p *GoNullable = new(GoNullable); 
    p.value = nn.paramDesc.value;
    p.has_value = nn.paramDesc.has_value;
    if  (p.value.(IFACE_RangerAppParamDesc).Get_ref_cnt() == 0) && (p.value.(IFACE_RangerAppParamDesc).Get_is_class_variable() == false) {
      wr.out("/** unused:  ", false);
    }
    wr.out(strings.Join([]string{ "$",p.value.(IFACE_RangerAppParamDesc).Get_compiledName() }, ""), false);
    if  (int64(len(node.children))) > 2 {
      wr.out(" = ", false);
      ctx.setInExpr();
      var value *CodeNode = node.getThird();
      this.WalkNode(value, ctx, wr);
      ctx.unsetInExpr();
    } else {
      if  nn.value_type == 6 {
        wr.out(" = array()", false);
      }
      if  nn.value_type == 7 {
        wr.out(" = array()", false);
      }
    }
    if  (p.value.(IFACE_RangerAppParamDesc).Get_ref_cnt() == 0) && (p.value.(IFACE_RangerAppParamDesc).Get_is_class_variable() == true) {
      wr.out("     /** note: unused */", false);
    }
    if  (p.value.(IFACE_RangerAppParamDesc).Get_ref_cnt() == 0) && (p.value.(IFACE_RangerAppParamDesc).Get_is_class_variable() == false) {
      wr.out("   **/ ;", true);
    } else {
      wr.out(";", false);
      wr.newline();
    }
  }
}
func (this *RangerPHPClassWriter) disabledVarDef (node *CodeNode, ctx *RangerAppWriterContext, wr *CodeWriter) () {
  if  node.hasParamDesc {
    var nn *CodeNode = node.children[1];
    var p *GoNullable = new(GoNullable); 
    p.value = nn.paramDesc.value;
    p.has_value = nn.paramDesc.has_value;
    wr.out(strings.Join([]string{ "$this->",p.value.(IFACE_RangerAppParamDesc).Get_compiledName() }, ""), false);
    if  (int64(len(node.children))) > 2 {
      wr.out(" = ", false);
      ctx.setInExpr();
      var value *CodeNode = node.getThird();
      this.WalkNode(value, ctx, wr);
      ctx.unsetInExpr();
    } else {
      if  nn.value_type == 6 {
        wr.out(" = array()", false);
      }
      if  nn.value_type == 7 {
        wr.out(" = array()", false);
      }
    }
    wr.out(";", false);
    wr.newline();
  }
}
func (this *RangerPHPClassWriter) CreateLambdaCall (node *CodeNode, ctx *RangerAppWriterContext, wr *CodeWriter) () {
  var fName *CodeNode = node.children[0];
  var givenArgs *CodeNode = node.children[1];
  this.WriteVRef(fName, ctx, wr);
  var param IFACE_RangerAppParamDesc = ctx.getVariableDef(fName.vref);
  var args *CodeNode = param.Get_nameNode().value.(*CodeNode).expression_value.value.(*CodeNode).children[1];
  wr.out("(", false);
  var i int64 = 0;  
  for ; i < int64(len(args.children)) ; i++ {
    arg := args.children[i];
    var n *CodeNode = givenArgs.children[i];
    if  i > 0 {
      wr.out(", ", false);
    }
    if  arg.value_type != 0 {
      this.WalkNode(n, ctx, wr);
    }
  }
  if  ctx.expressionLevel() == 0 {
    wr.out(");", true);
  } else {
    wr.out(")", false);
  }
}
func (this *RangerPHPClassWriter) CreateLambda (node *CodeNode, ctx *RangerAppWriterContext, wr *CodeWriter) () {
  var lambdaCtx *RangerAppWriterContext = node.lambda_ctx.value.(*RangerAppWriterContext);
  /** unused:  fnNode*/
  var args *CodeNode = node.children[1];
  var body *CodeNode = node.children[2];
  wr.out("function (", false);
  var i int64 = 0;  
  for ; i < int64(len(args.children)) ; i++ {
    arg := args.children[i];
    if  i > 0 {
      wr.out(", ", false);
    }
    this.WalkNode(arg, lambdaCtx, wr);
  }
  wr.out(") ", false);
  var had_capture bool = false;
  if  had_capture {
    wr.out(")", false);
  }
  wr.out(" {", true);
  wr.indent(1);
  lambdaCtx.restartExpressionLevel();
  var i_1 int64 = 0;  
  for ; i_1 < int64(len(body.children)) ; i_1++ {
    item := body.children[i_1];
    this.WalkNode(item, lambdaCtx, wr);
  }
  wr.newline();
  var i_2 int64 = 0;  
  for ; i_2 < int64(len(lambdaCtx.captured_variables)) ; i_2++ {
    cname := lambdaCtx.captured_variables[i_2];
    wr.out(strings.Join([]string{ "// captured var ",cname }, ""), true);
  }
  wr.indent(-1);
  wr.out("}", true);
}
func (this *RangerPHPClassWriter) writeClassVarDef (node *CodeNode, ctx *RangerAppWriterContext, wr *CodeWriter) () {
  if  node.hasParamDesc {
    var nn *CodeNode = node.children[1];
    var p *GoNullable = new(GoNullable); 
    p.value = nn.paramDesc.value;
    p.has_value = nn.paramDesc.has_value;
    wr.out(strings.Join([]string{ (strings.Join([]string{ "var $",p.value.(IFACE_RangerAppParamDesc).Get_compiledName() }, "")),";" }, ""), true);
  }
}
func (this *RangerPHPClassWriter) writeArgsDef (fnDesc *RangerAppFunctionDesc, ctx *RangerAppWriterContext, wr *CodeWriter) () {
  var i int64 = 0;  
  for ; i < int64(len(fnDesc.params)) ; i++ {
    arg := fnDesc.params[i];
    if  i > 0 {
      wr.out(",", false);
    }
    wr.out(strings.Join([]string{ (strings.Join([]string{ " $",arg.Get_name() }, ""))," " }, ""), false);
  }
}
func (this *RangerPHPClassWriter) writeFnCall (node *CodeNode, ctx *RangerAppWriterContext, wr *CodeWriter) () {
  if  node.hasFnCall {
    var fc *CodeNode = node.getFirst();
    this.WriteVRef(fc, ctx, wr);
    wr.out("(", false);
    var givenArgs *CodeNode = node.getSecond();
    ctx.setInExpr();
    var i int64 = 0;  
    for ; i < int64(len(node.fnDesc.value.(*RangerAppFunctionDesc).params)) ; i++ {
      arg := node.fnDesc.value.(*RangerAppFunctionDesc).params[i];
      if  i > 0 {
        wr.out(", ", false);
      }
      if  (int64(len(givenArgs.children))) <= i {
        var defVal *GoNullable = new(GoNullable); 
        defVal = arg.Get_nameNode().value.(*CodeNode).getFlag("default");
        if  defVal.has_value {
          var fc_1 *CodeNode = defVal.value.(*CodeNode).vref_annotation.value.(*CodeNode).getFirst();
          this.WalkNode(fc_1, ctx, wr);
        } else {
          ctx.addError(node, "Default argument was missing");
        }
        continue;
      }
      var n *CodeNode = givenArgs.children[i];
      this.WalkNode(n, ctx, wr);
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
    var cl *GoNullable = new(GoNullable); 
    cl.value = node.clDesc.value;
    cl.has_value = node.clDesc.has_value;
    /** unused:  fc*/
    wr.out(" new ", false);
    wr.out(node.clDesc.value.(*RangerAppClassDesc).name, false);
    wr.out("(", false);
    var constr *GoNullable = new(GoNullable); 
    constr.value = cl.value.(*RangerAppClassDesc).constructor_fn.value;
    constr.has_value = cl.value.(*RangerAppClassDesc).constructor_fn.has_value;
    var givenArgs *CodeNode = node.getThird();
    if  constr.has_value {
      var i int64 = 0;  
      for ; i < int64(len(constr.value.(*RangerAppFunctionDesc).params)) ; i++ {
        arg := constr.value.(*RangerAppFunctionDesc).params[i];
        var n *CodeNode = givenArgs.children[i];
        if  i > 0 {
          wr.out(", ", false);
        }
        if  true || (arg.Get_nameNode().has_value) {
          this.WalkNode(n, ctx, wr);
        }
      }
    }
    wr.out(")", false);
  }
}
func (this *RangerPHPClassWriter) writeClass (node *CodeNode, ctx *RangerAppWriterContext, orig_wr *CodeWriter) () {
  var cl *GoNullable = new(GoNullable); 
  cl.value = node.clDesc.value;
  cl.has_value = node.clDesc.has_value;
  if  !cl.has_value  {
    return;
  }
  var wr *CodeWriter = orig_wr;
  /** unused:  importFork*/
  var i int64 = 0;  
  for ; i < int64(len(cl.value.(*RangerAppClassDesc).capturedLocals)) ; i++ {
    dd := cl.value.(*RangerAppClassDesc).capturedLocals[i];
    if  dd.Get_is_class_variable() == false {
      wr.out(strings.Join([]string{ "// local captured ",dd.Get_name() }, ""), true);
      dd.Get_node().value.(*CodeNode).disabled_node = true; 
      cl.value.(*RangerAppClassDesc).addVariable(dd);
      var csubCtx *GoNullable = new(GoNullable); 
      csubCtx.value = cl.value.(*RangerAppClassDesc).ctx.value;
      csubCtx.has_value = cl.value.(*RangerAppClassDesc).ctx.has_value;
      csubCtx.value.(*RangerAppWriterContext).defineVariable(dd.Get_name(), dd);
      dd.Set_is_class_variable(true); 
    }
  }
  if  this.wrote_header == false {
    wr.out("<? ", true);
    wr.out("", true);
    this.wrote_header = true; 
  }
  wr.out(strings.Join([]string{ "class ",cl.value.(*RangerAppClassDesc).name }, ""), false);
  var parentClass *GoNullable = new(GoNullable); 
  if  (int64(len(cl.value.(*RangerAppClassDesc).extends_classes))) > 0 {
    wr.out(" extends ", false);
    var i_1 int64 = 0;  
    for ; i_1 < int64(len(cl.value.(*RangerAppClassDesc).extends_classes)) ; i_1++ {
      pName := cl.value.(*RangerAppClassDesc).extends_classes[i_1];
      wr.out(pName, false);
      parentClass.value = ctx.findClass(pName);
      parentClass.has_value = true; /* detected as non-optional */
    }
  }
  wr.out(" { ", true);
  wr.indent(1);
  var i_2 int64 = 0;  
  for ; i_2 < int64(len(cl.value.(*RangerAppClassDesc).variables)) ; i_2++ {
    pvar := cl.value.(*RangerAppClassDesc).variables[i_2];
    this.writeClassVarDef(pvar.Get_node().value.(*CodeNode), ctx, wr);
  }
  wr.out("", true);
  wr.out("function __construct(", false);
  if  cl.value.(*RangerAppClassDesc).has_constructor {
    var constr *RangerAppFunctionDesc = cl.value.(*RangerAppClassDesc).constructor_fn.value.(*RangerAppFunctionDesc);
    this.writeArgsDef(constr, ctx, wr);
  }
  wr.out(" ) {", true);
  wr.indent(1);
  if ( parentClass.has_value) {
    wr.out("parent::__construct();", true);
  }
  var i_3 int64 = 0;  
  for ; i_3 < int64(len(cl.value.(*RangerAppClassDesc).variables)) ; i_3++ {
    pvar_1 := cl.value.(*RangerAppClassDesc).variables[i_3];
    this.writeVarInitDef(pvar_1.Get_node().value.(*CodeNode), ctx, wr);
  }
  if  cl.value.(*RangerAppClassDesc).has_constructor {
    var constr_1 *GoNullable = new(GoNullable); 
    constr_1.value = cl.value.(*RangerAppClassDesc).constructor_fn.value;
    constr_1.has_value = cl.value.(*RangerAppClassDesc).constructor_fn.has_value;
    wr.newline();
    var subCtx *RangerAppWriterContext = constr_1.value.(*RangerAppFunctionDesc).fnCtx.value.(*RangerAppWriterContext);
    subCtx.is_function = true; 
    this.WalkNode(constr_1.value.(*RangerAppFunctionDesc).fnBody.value.(*CodeNode), subCtx, wr);
  }
  wr.newline();
  wr.indent(-1);
  wr.out("}", true);
  var i_4 int64 = 0;  
  for ; i_4 < int64(len(cl.value.(*RangerAppClassDesc).static_methods)) ; i_4++ {
    variant := cl.value.(*RangerAppClassDesc).static_methods[i_4];
    wr.out("", true);
    if  variant.nameNode.value.(*CodeNode).hasFlag("main") {
      continue;
    } else {
      wr.out("public static function ", false);
      wr.out(strings.Join([]string{ variant.compiledName,"(" }, ""), false);
      this.writeArgsDef(variant, ctx, wr);
      wr.out(") {", true);
    }
    wr.indent(1);
    wr.newline();
    var subCtx_1 *RangerAppWriterContext = variant.fnCtx.value.(*RangerAppWriterContext);
    subCtx_1.is_function = true; 
    subCtx_1.in_static_method = true; 
    this.WalkNode(variant.fnBody.value.(*CodeNode), subCtx_1, wr);
    wr.newline();
    wr.indent(-1);
    wr.out("}", true);
  }
  var i_5 int64 = 0;  
  for ; i_5 < int64(len(cl.value.(*RangerAppClassDesc).defined_variants)) ; i_5++ {
    fnVar := cl.value.(*RangerAppClassDesc).defined_variants[i_5];
    var mVs *GoNullable = new(GoNullable); 
    mVs = r_get_string_RangerAppMethodVariants(cl.value.(*RangerAppClassDesc).method_variants, fnVar);
    var i_6 int64 = 0;  
    for ; i_6 < int64(len(mVs.value.(*RangerAppMethodVariants).variants)) ; i_6++ {
      variant_1 := mVs.value.(*RangerAppMethodVariants).variants[i_6];
      wr.out("", true);
      wr.out(strings.Join([]string{ (strings.Join([]string{ "function ",variant_1.compiledName }, "")),"(" }, ""), false);
      this.writeArgsDef(variant_1, ctx, wr);
      wr.out(") {", true);
      wr.indent(1);
      wr.newline();
      var subCtx_2 *RangerAppWriterContext = variant_1.fnCtx.value.(*RangerAppWriterContext);
      subCtx_2.is_function = true; 
      this.WalkNode(variant_1.fnBody.value.(*CodeNode), subCtx_2, wr);
      wr.newline();
      wr.indent(-1);
      wr.out("}", true);
    }
  }
  wr.indent(-1);
  wr.out("}", true);
  var i_7 int64 = 0;  
  for ; i_7 < int64(len(cl.value.(*RangerAppClassDesc).static_methods)) ; i_7++ {
    variant_2 := cl.value.(*RangerAppClassDesc).static_methods[i_7];
    ctx.disableCurrentClass();
    ctx.in_static_method = true; 
    wr.out("", true);
    if  variant_2.nameNode.value.(*CodeNode).hasFlag("main") && (variant_2.nameNode.value.(*CodeNode).code.value.(*SourceCode).filename == ctx.getRootFile()) {
      wr.out("/* static PHP main routine */", false);
      wr.newline();
      this.WalkNode(variant_2.fnBody.value.(*CodeNode), ctx, wr);
      wr.newline();
    }
  }
}
// inherited methods from parent class RangerGenericClassWriter
func (this *RangerPHPClassWriter) CustomOperator (node *CodeNode, ctx *RangerAppWriterContext, wr *CodeWriter) () {
}
func (this *RangerPHPClassWriter) WriteSetterVRef (node *CodeNode, ctx *RangerAppWriterContext, wr *CodeWriter) () {
}
func (this *RangerPHPClassWriter) writeArrayTypeDef (node *CodeNode, ctx *RangerAppWriterContext, wr *CodeWriter) () {
}
func (this *RangerPHPClassWriter) WriteEnum (node *CodeNode, ctx *RangerAppWriterContext, wr *CodeWriter) () {
  if  node.eval_type == 11 {
    var rootObjName string = node.ns[0];
    var e *GoNullable = new(GoNullable); 
    e = ctx.getEnum(rootObjName);
    if  e.has_value {
      var enumName string = node.ns[1];
      wr.out(strings.Join([]string{ "",strconv.FormatInt(((r_get_string_int64(e.value.(*RangerAppEnum).values, enumName)).value.(int64)), 10) }, ""), false);
    } else {
      if  node.hasParamDesc {
        var pp *GoNullable = new(GoNullable); 
        pp.value = node.paramDesc.value;
        pp.has_value = node.paramDesc.has_value;
        var nn *GoNullable = new(GoNullable); 
        nn.value = pp.value.(IFACE_RangerAppParamDesc).Get_nameNode().value;
        nn.has_value = pp.value.(IFACE_RangerAppParamDesc).Get_nameNode().has_value;
        this.WriteVRef(nn.value.(*CodeNode), ctx, wr);
      }
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
  var i int64 = 0;  
  for ; i < int64(len(ctx.localVarNames)) ; i++ {
    n := ctx.localVarNames[i];
    var p *GoNullable = new(GoNullable); 
    p = r_get_string_IFACE_RangerAppParamDesc(ctx.localVariables, n);
    if  p.value.(IFACE_RangerAppParamDesc).Get_ref_cnt() == 0 {
      continue;
    }
    if  p.value.(IFACE_RangerAppParamDesc).isAllocatedType() {
      if  1 == p.value.(IFACE_RangerAppParamDesc).getStrength() {
        if  p.value.(IFACE_RangerAppParamDesc).Get_nameNode().value.(*CodeNode).eval_type == 7 {
        }
        if  p.value.(IFACE_RangerAppParamDesc).Get_nameNode().value.(*CodeNode).eval_type == 6 {
        }
        if  (p.value.(IFACE_RangerAppParamDesc).Get_nameNode().value.(*CodeNode).eval_type != 6) && (p.value.(IFACE_RangerAppParamDesc).Get_nameNode().value.(*CodeNode).eval_type != 7) {
        }
      }
      if  0 == p.value.(IFACE_RangerAppParamDesc).getStrength() {
        if  p.value.(IFACE_RangerAppParamDesc).Get_nameNode().value.(*CodeNode).eval_type == 7 {
        }
        if  p.value.(IFACE_RangerAppParamDesc).Get_nameNode().value.(*CodeNode).eval_type == 6 {
        }
        if  (p.value.(IFACE_RangerAppParamDesc).Get_nameNode().value.(*CodeNode).eval_type != 6) && (p.value.(IFACE_RangerAppParamDesc).Get_nameNode().value.(*CodeNode).eval_type != 7) {
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
func (this *RangerPHPClassWriter) writeInterface (cl *RangerAppClassDesc, ctx *RangerAppWriterContext, wr *CodeWriter) () {
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
      var rootObjName string = node.ns[0];
      var enumName string = node.ns[1];
      var e *GoNullable = new(GoNullable); 
      e = ctx.getEnum(rootObjName);
      if  e.has_value {
        wr.out(strings.Join([]string{ "",strconv.FormatInt(((r_get_string_int64(e.value.(*RangerAppEnum).values, enumName)).value.(int64)), 10) }, ""), false);
        return;
      }
    }
  }
  if  (int64(len(node.nsp))) > 0 {
    var i int64 = 0;  
    for ; i < int64(len(node.nsp)) ; i++ {
      p := node.nsp[i];
      if  i > 0 {
        wr.out(".", false);
      }
      if  i == 0 {
        var part string = node.ns[0];
        if  (part != "this") && ctx.isMemberVariable(part) {
          var uc *GoNullable = new(GoNullable); 
          uc = ctx.getCurrentClass();
          var currC *RangerAppClassDesc = uc.value.(*RangerAppClassDesc);
          var up *GoNullable = new(GoNullable); 
          up = currC.findVariable(part);
          if  up.has_value {
            wr.out("this.", false);
          }
        }
        if  part == "this" {
          wr.out("this", false);
          continue;
        }
      }
      if  (int64(len(p.Get_compiledName()))) > 0 {
        wr.out(this.adjustType(p.Get_compiledName()), false);
      } else {
        if  (int64(len(p.Get_name()))) > 0 {
          wr.out(this.adjustType(p.Get_name()), false);
        } else {
          wr.out(this.adjustType((node.ns[i])), false);
        }
      }
    }
    return;
  }
  if  node.hasParamDesc {
    var part_1 string = node.ns[0];
    if  (part_1 != "this") && ctx.isMemberVariable(part_1) {
      var uc_1 *GoNullable = new(GoNullable); 
      uc_1 = ctx.getCurrentClass();
      var currC_1 *RangerAppClassDesc = uc_1.value.(*RangerAppClassDesc);
      var up_1 *GoNullable = new(GoNullable); 
      up_1 = currC_1.findVariable(part_1);
      if  up_1.has_value {
        wr.out("this.", false);
      }
    }
    var p_1 *GoNullable = new(GoNullable); 
    p_1.value = node.paramDesc.value;
    p_1.has_value = node.paramDesc.has_value;
    wr.out(p_1.value.(IFACE_RangerAppParamDesc).Get_compiledName(), false);
    return;
  }
  var b_was_static bool = false;
  var i_1 int64 = 0;  
  for ; i_1 < int64(len(node.ns)) ; i_1++ {
    part_2 := node.ns[i_1];
    if  i_1 > 0 {
      if  (i_1 == 1) && b_was_static {
        wr.out(".", false);
      } else {
        wr.out(".", false);
      }
    }
    if  i_1 == 0 {
      if  ctx.hasClass(part_2) {
        b_was_static = true; 
      } else {
        wr.out("", false);
      }
      if  (part_2 != "this") && ctx.isMemberVariable(part_2) {
        var uc_2 *GoNullable = new(GoNullable); 
        uc_2 = ctx.getCurrentClass();
        var currC_2 *RangerAppClassDesc = uc_2.value.(*RangerAppClassDesc);
        var up_2 *GoNullable = new(GoNullable); 
        up_2 = currC_2.findVariable(part_2);
        if  up_2.has_value {
          wr.out("this.", false);
        }
      }
    }
    wr.out(this.adjustType(part_2), false);
  }
}
func (this *RangerJavaScriptClassWriter) writeVarInitDef (node *CodeNode, ctx *RangerAppWriterContext, wr *CodeWriter) () {
  if  node.hasParamDesc {
    var nn *CodeNode = node.children[1];
    var p *GoNullable = new(GoNullable); 
    p.value = nn.paramDesc.value;
    p.has_value = nn.paramDesc.has_value;
    var remove_unused bool = ctx.hasCompilerFlag("remove-unused-class-vars");
    if  (p.value.(IFACE_RangerAppParamDesc).Get_ref_cnt() == 0) && (remove_unused || (p.value.(IFACE_RangerAppParamDesc).Get_is_class_variable() == false)) {
      return;
    }
    var was_set bool = false;
    if  (int64(len(node.children))) > 2 {
      wr.out(strings.Join([]string{ (strings.Join([]string{ "this.",p.value.(IFACE_RangerAppParamDesc).Get_compiledName() }, ""))," = " }, ""), false);
      ctx.setInExpr();
      var value *CodeNode = node.getThird();
      this.WalkNode(value, ctx, wr);
      ctx.unsetInExpr();
      was_set = true; 
    } else {
      if  nn.value_type == 6 {
        wr.out(strings.Join([]string{ "this.",p.value.(IFACE_RangerAppParamDesc).Get_compiledName() }, ""), false);
        wr.out(" = []", false);
        was_set = true; 
      }
      if  nn.value_type == 7 {
        wr.out(strings.Join([]string{ "this.",p.value.(IFACE_RangerAppParamDesc).Get_compiledName() }, ""), false);
        wr.out(" = {}", false);
        was_set = true; 
      }
    }
    if  was_set {
      wr.out(";", false);
      if  (p.value.(IFACE_RangerAppParamDesc).Get_ref_cnt() == 0) && (p.value.(IFACE_RangerAppParamDesc).Get_is_class_variable() == true) {
        wr.out("     /** note: unused */", false);
      }
      wr.newline();
    }
  }
}
func (this *RangerJavaScriptClassWriter) writeVarDef (node *CodeNode, ctx *RangerAppWriterContext, wr *CodeWriter) () {
  if  node.hasParamDesc {
    var nn *CodeNode = node.children[1];
    var p *GoNullable = new(GoNullable); 
    p.value = nn.paramDesc.value;
    p.has_value = nn.paramDesc.has_value;
    /** unused:  opt_js*/
    if  (p.value.(IFACE_RangerAppParamDesc).Get_ref_cnt() == 0) && (p.value.(IFACE_RangerAppParamDesc).Get_is_class_variable() == false) {
      wr.out("/** unused:  ", false);
    }
    var has_value bool = false;
    if  (int64(len(node.children))) > 2 {
      has_value = true; 
    }
    if  ((p.value.(IFACE_RangerAppParamDesc).Get_set_cnt() > 0) || p.value.(IFACE_RangerAppParamDesc).Get_is_class_variable()) || (has_value == false) {
      wr.out(strings.Join([]string{ "let ",p.value.(IFACE_RangerAppParamDesc).Get_compiledName() }, ""), false);
    } else {
      wr.out(strings.Join([]string{ "const ",p.value.(IFACE_RangerAppParamDesc).Get_compiledName() }, ""), false);
    }
    if  (int64(len(node.children))) > 2 {
      wr.out(" = ", false);
      ctx.setInExpr();
      var value *CodeNode = node.getThird();
      this.WalkNode(value, ctx, wr);
      ctx.unsetInExpr();
    } else {
      if  nn.value_type == 6 {
        wr.out(" = []", false);
      }
      if  nn.value_type == 7 {
        wr.out(" = {}", false);
      }
    }
    if  (p.value.(IFACE_RangerAppParamDesc).Get_ref_cnt() == 0) && (p.value.(IFACE_RangerAppParamDesc).Get_is_class_variable() == true) {
      wr.out("     /** note: unused */", false);
    }
    if  (p.value.(IFACE_RangerAppParamDesc).Get_ref_cnt() == 0) && (p.value.(IFACE_RangerAppParamDesc).Get_is_class_variable() == false) {
      wr.out("   **/ ", true);
    } else {
      wr.out(";", false);
      wr.newline();
    }
  }
}
func (this *RangerJavaScriptClassWriter) writeClassVarDef (node *CodeNode, ctx *RangerAppWriterContext, wr *CodeWriter) () {
}
func (this *RangerJavaScriptClassWriter) writeArgsDef (fnDesc *RangerAppFunctionDesc, ctx *RangerAppWriterContext, wr *CodeWriter) () {
  var i int64 = 0;  
  for ; i < int64(len(fnDesc.params)) ; i++ {
    arg := fnDesc.params[i];
    if  i > 0 {
      wr.out(", ", false);
    }
    wr.out(arg.Get_name(), false);
  }
}
func (this *RangerJavaScriptClassWriter) writeClass (node *CodeNode, ctx *RangerAppWriterContext, orig_wr *CodeWriter) () {
  var cl *GoNullable = new(GoNullable); 
  cl.value = node.clDesc.value;
  cl.has_value = node.clDesc.has_value;
  if  cl.value.(*RangerAppClassDesc).is_interface {
    orig_wr.out(strings.Join([]string{ "// interface : ",cl.value.(*RangerAppClassDesc).name }, ""), true);
    return;
  }
  if  !cl.has_value  {
    return;
  }
  var wr *CodeWriter = orig_wr;
  /** unused:  importFork*/
  if  this.wrote_header == false {
    wr.out("", true);
    this.wrote_header = true; 
  }
  var b_extd bool = false;
  wr.out(strings.Join([]string{ (strings.Join([]string{ "class ",cl.value.(*RangerAppClassDesc).name }, ""))," " }, ""), false);
  var i int64 = 0;  
  for ; i < int64(len(cl.value.(*RangerAppClassDesc).extends_classes)) ; i++ {
    pName := cl.value.(*RangerAppClassDesc).extends_classes[i];
    if  i == 0 {
      wr.out(" extends ", false);
    }
    wr.out(pName, false);
    b_extd = true; 
  }
  wr.out(" {", true);
  wr.indent(1);
  var i_1 int64 = 0;  
  for ; i_1 < int64(len(cl.value.(*RangerAppClassDesc).variables)) ; i_1++ {
    pvar := cl.value.(*RangerAppClassDesc).variables[i_1];
    this.writeClassVarDef(pvar.Get_node().value.(*CodeNode), ctx, wr);
  }
  wr.out("constructor(", false);
  if  cl.value.(*RangerAppClassDesc).has_constructor {
    var constr *RangerAppFunctionDesc = cl.value.(*RangerAppClassDesc).constructor_fn.value.(*RangerAppFunctionDesc);
    this.writeArgsDef(constr, ctx, wr);
  }
  wr.out(") {", true);
  wr.indent(1);
  if  b_extd {
    wr.out("super()", true);
  }
  var i_2 int64 = 0;  
  for ; i_2 < int64(len(cl.value.(*RangerAppClassDesc).variables)) ; i_2++ {
    pvar_1 := cl.value.(*RangerAppClassDesc).variables[i_2];
    this.writeVarInitDef(pvar_1.Get_node().value.(*CodeNode), ctx, wr);
  }
  if  cl.value.(*RangerAppClassDesc).has_constructor {
    var constr_1 *GoNullable = new(GoNullable); 
    constr_1.value = cl.value.(*RangerAppClassDesc).constructor_fn.value;
    constr_1.has_value = cl.value.(*RangerAppClassDesc).constructor_fn.has_value;
    wr.newline();
    var subCtx *RangerAppWriterContext = constr_1.value.(*RangerAppFunctionDesc).fnCtx.value.(*RangerAppWriterContext);
    subCtx.is_function = true; 
    this.WalkNode(constr_1.value.(*RangerAppFunctionDesc).fnBody.value.(*CodeNode), subCtx, wr);
  }
  wr.newline();
  wr.indent(-1);
  wr.out("}", true);
  var i_3 int64 = 0;  
  for ; i_3 < int64(len(cl.value.(*RangerAppClassDesc).defined_variants)) ; i_3++ {
    fnVar := cl.value.(*RangerAppClassDesc).defined_variants[i_3];
    var mVs *GoNullable = new(GoNullable); 
    mVs = r_get_string_RangerAppMethodVariants(cl.value.(*RangerAppClassDesc).method_variants, fnVar);
    var i_4 int64 = 0;  
    for ; i_4 < int64(len(mVs.value.(*RangerAppMethodVariants).variants)) ; i_4++ {
      variant := mVs.value.(*RangerAppMethodVariants).variants[i_4];
      wr.out(strings.Join([]string{ (strings.Join([]string{ "",variant.compiledName }, ""))," (" }, ""), false);
      this.writeArgsDef(variant, ctx, wr);
      wr.out(") {", true);
      wr.indent(1);
      wr.newline();
      var subCtx_1 *RangerAppWriterContext = variant.fnCtx.value.(*RangerAppWriterContext);
      subCtx_1.is_function = true; 
      this.WalkNode(variant.fnBody.value.(*CodeNode), subCtx_1, wr);
      wr.newline();
      wr.indent(-1);
      wr.out("}", true);
    }
  }
  wr.indent(-1);
  wr.out("}", true);
  var i_5 int64 = 0;  
  for ; i_5 < int64(len(cl.value.(*RangerAppClassDesc).static_methods)) ; i_5++ {
    variant_1 := cl.value.(*RangerAppClassDesc).static_methods[i_5];
    if  variant_1.nameNode.value.(*CodeNode).hasFlag("main") {
      continue;
    } else {
      wr.out(strings.Join([]string{ (strings.Join([]string{ (strings.Join([]string{ cl.value.(*RangerAppClassDesc).name,"." }, "")),variant_1.compiledName }, ""))," = function(" }, ""), false);
      this.writeArgsDef(variant_1, ctx, wr);
      wr.out(") {", true);
    }
    wr.indent(1);
    wr.newline();
    var subCtx_2 *RangerAppWriterContext = variant_1.fnCtx.value.(*RangerAppWriterContext);
    subCtx_2.is_function = true; 
    this.WalkNode(variant_1.fnBody.value.(*CodeNode), subCtx_2, wr);
    wr.newline();
    wr.indent(-1);
    wr.out("}", true);
  }
  var i_6 int64 = 0;  
  for ; i_6 < int64(len(cl.value.(*RangerAppClassDesc).static_methods)) ; i_6++ {
    variant_2 := cl.value.(*RangerAppClassDesc).static_methods[i_6];
    ctx.disableCurrentClass();
    if  variant_2.nameNode.value.(*CodeNode).hasFlag("main") && (variant_2.nameNode.value.(*CodeNode).code.value.(*SourceCode).filename == ctx.getRootFile()) {
      wr.out("/* static JavaSript main routine */", false);
      wr.newline();
      wr.out("function __js_main() {", true);
      wr.indent(1);
      this.WalkNode(variant_2.fnBody.value.(*CodeNode), ctx, wr);
      wr.newline();
      wr.indent(-1);
      wr.out("}", true);
      wr.out("__js_main();", true);
    }
  }
}
// inherited methods from parent class RangerGenericClassWriter
func (this *RangerJavaScriptClassWriter) EncodeString (node *CodeNode, ctx *RangerAppWriterContext, wr *CodeWriter) string {
  /** unused:  encoded_str*/
  var str_length int64 = int64(len(node.string_value));
  var encoded_str_2 string = "";
  var ii int64 = 0;
  for ii < str_length {
    var cc int64 = int64(node.string_value[ii]);
    switch (cc ) { 
      case 8 : 
        encoded_str_2 = strings.Join([]string{ (strings.Join([]string{ encoded_str_2,(string([] byte{byte(92)})) }, "")),(string([] byte{byte(98)})) }, ""); 
      case 9 : 
        encoded_str_2 = strings.Join([]string{ (strings.Join([]string{ encoded_str_2,(string([] byte{byte(92)})) }, "")),(string([] byte{byte(116)})) }, ""); 
      case 10 : 
        encoded_str_2 = strings.Join([]string{ (strings.Join([]string{ encoded_str_2,(string([] byte{byte(92)})) }, "")),(string([] byte{byte(110)})) }, ""); 
      case 12 : 
        encoded_str_2 = strings.Join([]string{ (strings.Join([]string{ encoded_str_2,(string([] byte{byte(92)})) }, "")),(string([] byte{byte(102)})) }, ""); 
      case 13 : 
        encoded_str_2 = strings.Join([]string{ (strings.Join([]string{ encoded_str_2,(string([] byte{byte(92)})) }, "")),(string([] byte{byte(114)})) }, ""); 
      case 34 : 
        encoded_str_2 = strings.Join([]string{ (strings.Join([]string{ encoded_str_2,(string([] byte{byte(92)})) }, "")),(string([] byte{byte(34)})) }, ""); 
      case 92 : 
        encoded_str_2 = strings.Join([]string{ (strings.Join([]string{ encoded_str_2,(string([] byte{byte(92)})) }, "")),(string([] byte{byte(92)})) }, ""); 
      default: 
        encoded_str_2 = strings.Join([]string{ encoded_str_2,(string([] byte{byte(cc)})) }, ""); 
    }
    ii = ii + 1; 
  }
  return encoded_str_2;
}
func (this *RangerJavaScriptClassWriter) CustomOperator (node *CodeNode, ctx *RangerAppWriterContext, wr *CodeWriter) () {
}
func (this *RangerJavaScriptClassWriter) WriteSetterVRef (node *CodeNode, ctx *RangerAppWriterContext, wr *CodeWriter) () {
}
func (this *RangerJavaScriptClassWriter) writeArrayTypeDef (node *CodeNode, ctx *RangerAppWriterContext, wr *CodeWriter) () {
}
func (this *RangerJavaScriptClassWriter) WriteEnum (node *CodeNode, ctx *RangerAppWriterContext, wr *CodeWriter) () {
  if  node.eval_type == 11 {
    var rootObjName string = node.ns[0];
    var e *GoNullable = new(GoNullable); 
    e = ctx.getEnum(rootObjName);
    if  e.has_value {
      var enumName string = node.ns[1];
      wr.out(strings.Join([]string{ "",strconv.FormatInt(((r_get_string_int64(e.value.(*RangerAppEnum).values, enumName)).value.(int64)), 10) }, ""), false);
    } else {
      if  node.hasParamDesc {
        var pp *GoNullable = new(GoNullable); 
        pp.value = node.paramDesc.value;
        pp.has_value = node.paramDesc.has_value;
        var nn *GoNullable = new(GoNullable); 
        nn.value = pp.value.(IFACE_RangerAppParamDesc).Get_nameNode().value;
        nn.has_value = pp.value.(IFACE_RangerAppParamDesc).Get_nameNode().has_value;
        this.WriteVRef(nn.value.(*CodeNode), ctx, wr);
      }
    }
  }
}
func (this *RangerJavaScriptClassWriter) WriteScalarValue (node *CodeNode, ctx *RangerAppWriterContext, wr *CodeWriter) () {
  switch (node.value_type ) { 
    case 2 : 
      wr.out(strings.Join([]string{ "",strconv.FormatFloat(node.double_value,'f', 6, 64) }, ""), false);
    case 4 : 
      var s string = this.EncodeString(node, ctx, wr);
      wr.out(strings.Join([]string{ (strings.Join([]string{ "\"",s }, "")),"\"" }, ""), false);
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
  var i int64 = 0;  
  for ; i < int64(len(ctx.localVarNames)) ; i++ {
    n := ctx.localVarNames[i];
    var p *GoNullable = new(GoNullable); 
    p = r_get_string_IFACE_RangerAppParamDesc(ctx.localVariables, n);
    if  p.value.(IFACE_RangerAppParamDesc).Get_ref_cnt() == 0 {
      continue;
    }
    if  p.value.(IFACE_RangerAppParamDesc).isAllocatedType() {
      if  1 == p.value.(IFACE_RangerAppParamDesc).getStrength() {
        if  p.value.(IFACE_RangerAppParamDesc).Get_nameNode().value.(*CodeNode).eval_type == 7 {
        }
        if  p.value.(IFACE_RangerAppParamDesc).Get_nameNode().value.(*CodeNode).eval_type == 6 {
        }
        if  (p.value.(IFACE_RangerAppParamDesc).Get_nameNode().value.(*CodeNode).eval_type != 6) && (p.value.(IFACE_RangerAppParamDesc).Get_nameNode().value.(*CodeNode).eval_type != 7) {
        }
      }
      if  0 == p.value.(IFACE_RangerAppParamDesc).getStrength() {
        if  p.value.(IFACE_RangerAppParamDesc).Get_nameNode().value.(*CodeNode).eval_type == 7 {
        }
        if  p.value.(IFACE_RangerAppParamDesc).Get_nameNode().value.(*CodeNode).eval_type == 6 {
        }
        if  (p.value.(IFACE_RangerAppParamDesc).Get_nameNode().value.(*CodeNode).eval_type != 6) && (p.value.(IFACE_RangerAppParamDesc).Get_nameNode().value.(*CodeNode).eval_type != 7) {
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
func (this *RangerJavaScriptClassWriter) CreateLambdaCall (node *CodeNode, ctx *RangerAppWriterContext, wr *CodeWriter) () {
  var fName *CodeNode = node.children[0];
  var args *CodeNode = node.children[1];
  this.WriteVRef(fName, ctx, wr);
  wr.out("(", false);
  var i int64 = 0;  
  for ; i < int64(len(args.children)) ; i++ {
    arg := args.children[i];
    if  i > 0 {
      wr.out(", ", false);
    }
    this.WalkNode(arg, ctx, wr);
  }
  wr.out(")", false);
  if  ctx.expressionLevel() == 0 {
    wr.out(";", true);
  }
}
func (this *RangerJavaScriptClassWriter) CreateLambda (node *CodeNode, ctx *RangerAppWriterContext, wr *CodeWriter) () {
  var lambdaCtx *RangerAppWriterContext = node.lambda_ctx.value.(*RangerAppWriterContext);
  var args *CodeNode = node.children[1];
  var body *CodeNode = node.children[2];
  wr.out("(", false);
  var i int64 = 0;  
  for ; i < int64(len(args.children)) ; i++ {
    arg := args.children[i];
    if  i > 0 {
      wr.out(", ", false);
    }
    this.WalkNode(arg, lambdaCtx, wr);
  }
  wr.out(")", false);
  wr.out(" => { ", true);
  wr.indent(1);
  lambdaCtx.restartExpressionLevel();
  var i_1 int64 = 0;  
  for ; i_1 < int64(len(body.children)) ; i_1++ {
    item := body.children[i_1];
    this.WalkNode(item, lambdaCtx, wr);
  }
  wr.newline();
  wr.indent(-1);
  wr.out("}", true);
}
func (this *RangerJavaScriptClassWriter) writeFnCall (node *CodeNode, ctx *RangerAppWriterContext, wr *CodeWriter) () {
  if  node.hasFnCall {
    var fc *CodeNode = node.getFirst();
    this.WriteVRef(fc, ctx, wr);
    wr.out("(", false);
    var givenArgs *CodeNode = node.getSecond();
    ctx.setInExpr();
    var i int64 = 0;  
    for ; i < int64(len(node.fnDesc.value.(*RangerAppFunctionDesc).params)) ; i++ {
      arg := node.fnDesc.value.(*RangerAppFunctionDesc).params[i];
      if  i > 0 {
        wr.out(", ", false);
      }
      if  (int64(len(givenArgs.children))) <= i {
        var defVal *GoNullable = new(GoNullable); 
        defVal = arg.Get_nameNode().value.(*CodeNode).getFlag("default");
        if  defVal.has_value {
          var fc_1 *CodeNode = defVal.value.(*CodeNode).vref_annotation.value.(*CodeNode).getFirst();
          this.WalkNode(fc_1, ctx, wr);
        } else {
          ctx.addError(node, "Default argument was missing");
        }
        continue;
      }
      var n *CodeNode = givenArgs.children[i];
      this.WalkNode(n, ctx, wr);
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
    var cl *GoNullable = new(GoNullable); 
    cl.value = node.clDesc.value;
    cl.has_value = node.clDesc.has_value;
    /** unused:  fc*/
    wr.out(strings.Join([]string{ "new ",node.clDesc.value.(*RangerAppClassDesc).name }, ""), false);
    wr.out("(", false);
    var constr *GoNullable = new(GoNullable); 
    constr.value = cl.value.(*RangerAppClassDesc).constructor_fn.value;
    constr.has_value = cl.value.(*RangerAppClassDesc).constructor_fn.has_value;
    var givenArgs *CodeNode = node.getThird();
    if  constr.has_value {
      var i int64 = 0;  
      for ; i < int64(len(constr.value.(*RangerAppFunctionDesc).params)) ; i++ {
        arg := constr.value.(*RangerAppFunctionDesc).params[i];
        var n *CodeNode = givenArgs.children[i];
        if  i > 0 {
          wr.out(", ", false);
        }
        if  true || (arg.Get_nameNode().has_value) {
          this.WalkNode(n, ctx, wr);
        }
      }
    }
    wr.out(")", false);
  }
}
func (this *RangerJavaScriptClassWriter) writeInterface (cl *RangerAppClassDesc, ctx *RangerAppWriterContext, wr *CodeWriter) () {
}
func (this *RangerJavaScriptClassWriter) disabledVarDef (node *CodeNode, ctx *RangerAppWriterContext, wr *CodeWriter) () {
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
  var v_type int64 = node.value_type;
  var t_name string = node.type_name;
  var a_name string = node.array_type;
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
      a_name = node.eval_array_type; 
    }
    if  (int64(len(node.eval_key_type))) > 0 {
      k_name = node.eval_key_type; 
    }
  }
  if  v_type == 7 {
    wr.out(strings.Join([]string{ (strings.Join([]string{ (strings.Join([]string{ (strings.Join([]string{ "[",k_name }, "")),":" }, "")),a_name }, "")),"]" }, ""), false);
    return;
  }
  if  v_type == 6 {
    wr.out(strings.Join([]string{ (strings.Join([]string{ "[",a_name }, "")),"]" }, ""), false);
    return;
  }
  wr.out(t_name, false);
}
func (this *RangerRangerClassWriter) WriteVRef (node *CodeNode, ctx *RangerAppWriterContext, wr *CodeWriter) () {
  wr.out(node.vref, false);
}
func (this *RangerRangerClassWriter) WriteVRefWithOpt (node *CodeNode, ctx *RangerAppWriterContext, wr *CodeWriter) () {
  wr.out(node.vref, false);
  var flags []string = []string{"optional","weak","strong","temp","lives","returns","returnvalue"};
  var some_set bool = false;
  var i int64 = 0;  
  for ; i < int64(len(flags)) ; i++ {
    flag := flags[i];
    if  node.hasFlag(flag) {
      if  false == some_set {
        wr.out("@(", false);
        some_set = true; 
      } else {
        wr.out(" ", false);
      }
      wr.out(flag, false);
    }
  }
  if  some_set {
    wr.out(")", false);
  }
}
func (this *RangerRangerClassWriter) writeVarDef (node *CodeNode, ctx *RangerAppWriterContext, wr *CodeWriter) () {
  if  node.hasParamDesc {
    var nn *CodeNode = node.children[1];
    var p *GoNullable = new(GoNullable); 
    p.value = nn.paramDesc.value;
    p.has_value = nn.paramDesc.has_value;
    wr.out("def ", false);
    this.WriteVRefWithOpt(nn, ctx, wr);
    wr.out(":", false);
    this.writeTypeDef(p.value.(IFACE_RangerAppParamDesc).Get_nameNode().value.(*CodeNode), ctx, wr);
    if  (int64(len(node.children))) > 2 {
      wr.out(" ", false);
      ctx.setInExpr();
      var value *CodeNode = node.getThird();
      this.WalkNode(value, ctx, wr);
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
    var fc *CodeNode = node.getFirst();
    this.WriteVRef(fc, ctx, wr);
    wr.out("(", false);
    var givenArgs *CodeNode = node.getSecond();
    ctx.setInExpr();
    var i int64 = 0;  
    for ; i < int64(len(node.fnDesc.value.(*RangerAppFunctionDesc).params)) ; i++ {
      arg := node.fnDesc.value.(*RangerAppFunctionDesc).params[i];
      if  i > 0 {
        wr.out(", ", false);
      }
      if  (int64(len(givenArgs.children))) <= i {
        var defVal *GoNullable = new(GoNullable); 
        defVal = arg.Get_nameNode().value.(*CodeNode).getFlag("default");
        if  defVal.has_value {
          var fc_1 *CodeNode = defVal.value.(*CodeNode).vref_annotation.value.(*CodeNode).getFirst();
          this.WalkNode(fc_1, ctx, wr);
        } else {
          ctx.addError(node, "Default argument was missing");
        }
        continue;
      }
      var n *CodeNode = givenArgs.children[i];
      this.WalkNode(n, ctx, wr);
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
    var cl *GoNullable = new(GoNullable); 
    cl.value = node.clDesc.value;
    cl.has_value = node.clDesc.has_value;
    /** unused:  fc*/
    wr.out(strings.Join([]string{ "(new ",node.clDesc.value.(*RangerAppClassDesc).name }, ""), false);
    wr.out("(", false);
    var constr *GoNullable = new(GoNullable); 
    constr.value = cl.value.(*RangerAppClassDesc).constructor_fn.value;
    constr.has_value = cl.value.(*RangerAppClassDesc).constructor_fn.has_value;
    var givenArgs *CodeNode = node.getThird();
    if  constr.has_value {
      var i int64 = 0;  
      for ; i < int64(len(constr.value.(*RangerAppFunctionDesc).params)) ; i++ {
        arg := constr.value.(*RangerAppFunctionDesc).params[i];
        var n *CodeNode = givenArgs.children[i];
        if  i > 0 {
          wr.out(" ", false);
        }
        if  true || (arg.Get_nameNode().has_value) {
          this.WalkNode(n, ctx, wr);
        }
      }
    }
    wr.out("))", false);
  }
}
func (this *RangerRangerClassWriter) writeArgsDef (fnDesc *RangerAppFunctionDesc, ctx *RangerAppWriterContext, wr *CodeWriter) () {
  var i int64 = 0;  
  for ; i < int64(len(fnDesc.params)) ; i++ {
    arg := fnDesc.params[i];
    if  i > 0 {
      wr.out(",", false);
    }
    wr.out(" ", false);
    this.WriteVRefWithOpt(arg.Get_nameNode().value.(*CodeNode), ctx, wr);
    wr.out(":", false);
    this.writeTypeDef(arg.Get_nameNode().value.(*CodeNode), ctx, wr);
  }
}
func (this *RangerRangerClassWriter) writeClass (node *CodeNode, ctx *RangerAppWriterContext, orig_wr *CodeWriter) () {
  var cl *GoNullable = new(GoNullable); 
  cl.value = node.clDesc.value;
  cl.has_value = node.clDesc.has_value;
  if  !cl.has_value  {
    return;
  }
  var wr *CodeWriter = orig_wr;
  var importFork *CodeWriter = wr.fork();
  wr.out("", true);
  wr.out(strings.Join([]string{ "class ",cl.value.(*RangerAppClassDesc).name }, ""), false);
  var parentClass *GoNullable = new(GoNullable); 
  wr.out(" { ", true);
  wr.indent(1);
  if  (int64(len(cl.value.(*RangerAppClassDesc).extends_classes))) > 0 {
    wr.out("Extends(", false);
    var i int64 = 0;  
    for ; i < int64(len(cl.value.(*RangerAppClassDesc).extends_classes)) ; i++ {
      pName := cl.value.(*RangerAppClassDesc).extends_classes[i];
      wr.out(pName, false);
      parentClass.value = ctx.findClass(pName);
      parentClass.has_value = true; /* detected as non-optional */
    }
    wr.out(")", true);
  }
  wr.createTag("utilities");
  var i_1 int64 = 0;  
  for ; i_1 < int64(len(cl.value.(*RangerAppClassDesc).variables)) ; i_1++ {
    pvar := cl.value.(*RangerAppClassDesc).variables[i_1];
    this.writeVarDef(pvar.Get_node().value.(*CodeNode), ctx, wr);
  }
  if  cl.value.(*RangerAppClassDesc).has_constructor {
    var constr *GoNullable = new(GoNullable); 
    constr.value = cl.value.(*RangerAppClassDesc).constructor_fn.value;
    constr.has_value = cl.value.(*RangerAppClassDesc).constructor_fn.has_value;
    wr.out("", true);
    wr.out("Constructor (", false);
    this.writeArgsDef(constr.value.(*RangerAppFunctionDesc), ctx, wr);
    wr.out(" ) {", true);
    wr.indent(1);
    wr.newline();
    var subCtx *RangerAppWriterContext = constr.value.(*RangerAppFunctionDesc).fnCtx.value.(*RangerAppWriterContext);
    subCtx.is_function = true; 
    this.WalkNode(constr.value.(*RangerAppFunctionDesc).fnBody.value.(*CodeNode), subCtx, wr);
    wr.newline();
    wr.indent(-1);
    wr.out("}", true);
  }
  var i_2 int64 = 0;  
  for ; i_2 < int64(len(cl.value.(*RangerAppClassDesc).static_methods)) ; i_2++ {
    variant := cl.value.(*RangerAppClassDesc).static_methods[i_2];
    wr.out("", true);
    if  variant.nameNode.value.(*CodeNode).hasFlag("main") {
      wr.out("sfn m@(main):void () {", true);
    } else {
      wr.out("sfn ", false);
      this.WriteVRefWithOpt(variant.nameNode.value.(*CodeNode), ctx, wr);
      wr.out(":", false);
      this.writeTypeDef(variant.nameNode.value.(*CodeNode), ctx, wr);
      wr.out(" (", false);
      this.writeArgsDef(variant, ctx, wr);
      wr.out(") {", true);
    }
    wr.indent(1);
    wr.newline();
    var subCtx_1 *RangerAppWriterContext = variant.fnCtx.value.(*RangerAppWriterContext);
    subCtx_1.is_function = true; 
    this.WalkNode(variant.fnBody.value.(*CodeNode), subCtx_1, wr);
    wr.newline();
    wr.indent(-1);
    wr.out("}", true);
  }
  var i_3 int64 = 0;  
  for ; i_3 < int64(len(cl.value.(*RangerAppClassDesc).defined_variants)) ; i_3++ {
    fnVar := cl.value.(*RangerAppClassDesc).defined_variants[i_3];
    var mVs *GoNullable = new(GoNullable); 
    mVs = r_get_string_RangerAppMethodVariants(cl.value.(*RangerAppClassDesc).method_variants, fnVar);
    var i_4 int64 = 0;  
    for ; i_4 < int64(len(mVs.value.(*RangerAppMethodVariants).variants)) ; i_4++ {
      variant_1 := mVs.value.(*RangerAppMethodVariants).variants[i_4];
      wr.out("", true);
      wr.out("fn ", false);
      this.WriteVRefWithOpt(variant_1.nameNode.value.(*CodeNode), ctx, wr);
      wr.out(":", false);
      this.writeTypeDef(variant_1.nameNode.value.(*CodeNode), ctx, wr);
      wr.out(" ", false);
      wr.out("(", false);
      this.writeArgsDef(variant_1, ctx, wr);
      wr.out(") {", true);
      wr.indent(1);
      wr.newline();
      var subCtx_2 *RangerAppWriterContext = variant_1.fnCtx.value.(*RangerAppWriterContext);
      subCtx_2.is_function = true; 
      this.WalkNode(variant_1.fnBody.value.(*CodeNode), subCtx_2, wr);
      wr.newline();
      wr.indent(-1);
      wr.out("}", true);
    }
  }
  wr.indent(-1);
  wr.out("}", true);
  var import_list []string = wr.getImports();
  var i_5 int64 = 0;  
  for ; i_5 < int64(len(import_list)) ; i_5++ {
    codeStr := import_list[i_5];
    importFork.out(strings.Join([]string{ (strings.Join([]string{ "Import \"",codeStr }, "")),"\"" }, ""), true);
  }
}
// inherited methods from parent class RangerGenericClassWriter
func (this *RangerRangerClassWriter) EncodeString (node *CodeNode, ctx *RangerAppWriterContext, wr *CodeWriter) string {
  /** unused:  encoded_str*/
  var str_length int64 = int64(len(node.string_value));
  var encoded_str_2 string = "";
  var ii int64 = 0;
  for ii < str_length {
    var cc int64 = int64(node.string_value[ii]);
    switch (cc ) { 
      case 8 : 
        encoded_str_2 = strings.Join([]string{ (strings.Join([]string{ encoded_str_2,(string([] byte{byte(92)})) }, "")),(string([] byte{byte(98)})) }, ""); 
      case 9 : 
        encoded_str_2 = strings.Join([]string{ (strings.Join([]string{ encoded_str_2,(string([] byte{byte(92)})) }, "")),(string([] byte{byte(116)})) }, ""); 
      case 10 : 
        encoded_str_2 = strings.Join([]string{ (strings.Join([]string{ encoded_str_2,(string([] byte{byte(92)})) }, "")),(string([] byte{byte(110)})) }, ""); 
      case 12 : 
        encoded_str_2 = strings.Join([]string{ (strings.Join([]string{ encoded_str_2,(string([] byte{byte(92)})) }, "")),(string([] byte{byte(102)})) }, ""); 
      case 13 : 
        encoded_str_2 = strings.Join([]string{ (strings.Join([]string{ encoded_str_2,(string([] byte{byte(92)})) }, "")),(string([] byte{byte(114)})) }, ""); 
      case 34 : 
        encoded_str_2 = strings.Join([]string{ (strings.Join([]string{ encoded_str_2,(string([] byte{byte(92)})) }, "")),(string([] byte{byte(34)})) }, ""); 
      case 92 : 
        encoded_str_2 = strings.Join([]string{ (strings.Join([]string{ encoded_str_2,(string([] byte{byte(92)})) }, "")),(string([] byte{byte(92)})) }, ""); 
      default: 
        encoded_str_2 = strings.Join([]string{ encoded_str_2,(string([] byte{byte(cc)})) }, ""); 
    }
    ii = ii + 1; 
  }
  return encoded_str_2;
}
func (this *RangerRangerClassWriter) CustomOperator (node *CodeNode, ctx *RangerAppWriterContext, wr *CodeWriter) () {
}
func (this *RangerRangerClassWriter) WriteSetterVRef (node *CodeNode, ctx *RangerAppWriterContext, wr *CodeWriter) () {
}
func (this *RangerRangerClassWriter) writeArrayTypeDef (node *CodeNode, ctx *RangerAppWriterContext, wr *CodeWriter) () {
}
func (this *RangerRangerClassWriter) WriteEnum (node *CodeNode, ctx *RangerAppWriterContext, wr *CodeWriter) () {
  if  node.eval_type == 11 {
    var rootObjName string = node.ns[0];
    var e *GoNullable = new(GoNullable); 
    e = ctx.getEnum(rootObjName);
    if  e.has_value {
      var enumName string = node.ns[1];
      wr.out(strings.Join([]string{ "",strconv.FormatInt(((r_get_string_int64(e.value.(*RangerAppEnum).values, enumName)).value.(int64)), 10) }, ""), false);
    } else {
      if  node.hasParamDesc {
        var pp *GoNullable = new(GoNullable); 
        pp.value = node.paramDesc.value;
        pp.has_value = node.paramDesc.has_value;
        var nn *GoNullable = new(GoNullable); 
        nn.value = pp.value.(IFACE_RangerAppParamDesc).Get_nameNode().value;
        nn.has_value = pp.value.(IFACE_RangerAppParamDesc).Get_nameNode().has_value;
        this.WriteVRef(nn.value.(*CodeNode), ctx, wr);
      }
    }
  }
}
func (this *RangerRangerClassWriter) WriteScalarValue (node *CodeNode, ctx *RangerAppWriterContext, wr *CodeWriter) () {
  switch (node.value_type ) { 
    case 2 : 
      wr.out(strings.Join([]string{ "",strconv.FormatFloat(node.double_value,'f', 6, 64) }, ""), false);
    case 4 : 
      var s string = this.EncodeString(node, ctx, wr);
      wr.out(strings.Join([]string{ (strings.Join([]string{ "\"",s }, "")),"\"" }, ""), false);
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
  var i int64 = 0;  
  for ; i < int64(len(ctx.localVarNames)) ; i++ {
    n := ctx.localVarNames[i];
    var p *GoNullable = new(GoNullable); 
    p = r_get_string_IFACE_RangerAppParamDesc(ctx.localVariables, n);
    if  p.value.(IFACE_RangerAppParamDesc).Get_ref_cnt() == 0 {
      continue;
    }
    if  p.value.(IFACE_RangerAppParamDesc).isAllocatedType() {
      if  1 == p.value.(IFACE_RangerAppParamDesc).getStrength() {
        if  p.value.(IFACE_RangerAppParamDesc).Get_nameNode().value.(*CodeNode).eval_type == 7 {
        }
        if  p.value.(IFACE_RangerAppParamDesc).Get_nameNode().value.(*CodeNode).eval_type == 6 {
        }
        if  (p.value.(IFACE_RangerAppParamDesc).Get_nameNode().value.(*CodeNode).eval_type != 6) && (p.value.(IFACE_RangerAppParamDesc).Get_nameNode().value.(*CodeNode).eval_type != 7) {
        }
      }
      if  0 == p.value.(IFACE_RangerAppParamDesc).getStrength() {
        if  p.value.(IFACE_RangerAppParamDesc).Get_nameNode().value.(*CodeNode).eval_type == 7 {
        }
        if  p.value.(IFACE_RangerAppParamDesc).Get_nameNode().value.(*CodeNode).eval_type == 6 {
        }
        if  (p.value.(IFACE_RangerAppParamDesc).Get_nameNode().value.(*CodeNode).eval_type != 6) && (p.value.(IFACE_RangerAppParamDesc).Get_nameNode().value.(*CodeNode).eval_type != 7) {
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
func (this *RangerRangerClassWriter) CreateLambdaCall (node *CodeNode, ctx *RangerAppWriterContext, wr *CodeWriter) () {
  var fName *CodeNode = node.children[0];
  var args *CodeNode = node.children[1];
  this.WriteVRef(fName, ctx, wr);
  wr.out("(", false);
  var i int64 = 0;  
  for ; i < int64(len(args.children)) ; i++ {
    arg := args.children[i];
    if  i > 0 {
      wr.out(", ", false);
    }
    this.WalkNode(arg, ctx, wr);
  }
  wr.out(")", false);
  if  ctx.expressionLevel() == 0 {
    wr.out(";", true);
  }
}
func (this *RangerRangerClassWriter) CreateLambda (node *CodeNode, ctx *RangerAppWriterContext, wr *CodeWriter) () {
  var lambdaCtx *RangerAppWriterContext = node.lambda_ctx.value.(*RangerAppWriterContext);
  var args *CodeNode = node.children[1];
  var body *CodeNode = node.children[2];
  wr.out("(", false);
  var i int64 = 0;  
  for ; i < int64(len(args.children)) ; i++ {
    arg := args.children[i];
    if  i > 0 {
      wr.out(", ", false);
    }
    this.WalkNode(arg, lambdaCtx, wr);
  }
  wr.out(")", false);
  wr.out(" => { ", true);
  wr.indent(1);
  lambdaCtx.restartExpressionLevel();
  var i_1 int64 = 0;  
  for ; i_1 < int64(len(body.children)) ; i_1++ {
    item := body.children[i_1];
    this.WalkNode(item, lambdaCtx, wr);
  }
  wr.newline();
  wr.indent(-1);
  wr.out("}", true);
}
func (this *RangerRangerClassWriter) writeInterface (cl *RangerAppClassDesc, ctx *RangerAppWriterContext, wr *CodeWriter) () {
}
func (this *RangerRangerClassWriter) disabledVarDef (node *CodeNode, ctx *RangerAppWriterContext, wr *CodeWriter) () {
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
  lastProcessedNode *GoNullable
  repeat_index int64
}
type IFACE_LiveCompiler interface { 
  Get_langWriter() *GoNullable
  Set_langWriter(value *GoNullable) 
  Get_hasCreatedPolyfill() map[string]bool
  Set_hasCreatedPolyfill(value map[string]bool) 
  Get_lastProcessedNode() *GoNullable
  Set_lastProcessedNode(value *GoNullable) 
  Get_repeat_index() int64
  Set_repeat_index(value int64) 
  initWriter(ctx *RangerAppWriterContext) ()
  EncodeString(node *CodeNode, ctx *RangerAppWriterContext, wr *CodeWriter) string
  WriteScalarValue(node *CodeNode, ctx *RangerAppWriterContext, wr *CodeWriter) ()
  adjustType(tn string) string
  WriteVRef(node *CodeNode, ctx *RangerAppWriterContext, wr *CodeWriter) ()
  writeTypeDef(node *CodeNode, ctx *RangerAppWriterContext, wr *CodeWriter) ()
  CreateLambdaCall(node *CodeNode, ctx *RangerAppWriterContext, wr *CodeWriter) ()
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
  me.repeat_index = 0
  me.langWriter = new(GoNullable);
  me.lastProcessedNode = new(GoNullable);
  return me;
}
func (this *LiveCompiler) initWriter (ctx *RangerAppWriterContext) () {
  if  this.langWriter.has_value {
    return;
  }
  var root *RangerAppWriterContext = ctx.getRoot();
  switch (root.targetLangName ) { 
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
    case "cpp" : 
      this.langWriter.value = CreateNew_RangerCppClassWriter();
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
  /** unused:  encoded_str*/
  var str_length int64 = int64(len(node.string_value));
  var encoded_str_2 string = "";
  var ii int64 = 0;
  for ii < str_length {
    var ch int64 = int64(node.string_value[ii]);
    var cc int64 = ch;
    switch (cc ) { 
      case 8 : 
        encoded_str_2 = strings.Join([]string{ (strings.Join([]string{ encoded_str_2,(string([] byte{byte(92)})) }, "")),(string([] byte{byte(98)})) }, ""); 
      case 9 : 
        encoded_str_2 = strings.Join([]string{ (strings.Join([]string{ encoded_str_2,(string([] byte{byte(92)})) }, "")),(string([] byte{byte(116)})) }, ""); 
      case 10 : 
        encoded_str_2 = strings.Join([]string{ (strings.Join([]string{ encoded_str_2,(string([] byte{byte(92)})) }, "")),(string([] byte{byte(110)})) }, ""); 
      case 12 : 
        encoded_str_2 = strings.Join([]string{ (strings.Join([]string{ encoded_str_2,(string([] byte{byte(92)})) }, "")),(string([] byte{byte(102)})) }, ""); 
      case 13 : 
        encoded_str_2 = strings.Join([]string{ (strings.Join([]string{ encoded_str_2,(string([] byte{byte(92)})) }, "")),(string([] byte{byte(114)})) }, ""); 
      case 34 : 
        encoded_str_2 = strings.Join([]string{ (strings.Join([]string{ encoded_str_2,(string([] byte{byte(92)})) }, "")),(string([] byte{byte(34)})) }, ""); 
      case 92 : 
        encoded_str_2 = strings.Join([]string{ (strings.Join([]string{ encoded_str_2,(string([] byte{byte(92)})) }, "")),(string([] byte{byte(92)})) }, ""); 
      default: 
        encoded_str_2 = strings.Join([]string{ encoded_str_2,(string([] byte{byte(ch)})) }, ""); 
    }
    ii = ii + 1; 
  }
  return encoded_str_2;
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
func (this *LiveCompiler) CreateLambdaCall (node *CodeNode, ctx *RangerAppWriterContext, wr *CodeWriter) () {
  this.langWriter.value.(IFACE_RangerGenericClassWriter).CreateLambdaCall(node, ctx, wr);
}
func (this *LiveCompiler) CreateLambda (node *CodeNode, ctx *RangerAppWriterContext, wr *CodeWriter) () {
  this.langWriter.value.(IFACE_RangerGenericClassWriter).CreateLambda(node, ctx, wr);
}
func (this *LiveCompiler) getTypeString (str string, ctx *RangerAppWriterContext) string {
  return "";
}
func (this *LiveCompiler) findOpCode (op *CodeNode, node *CodeNode, ctx *RangerAppWriterContext, wr *CodeWriter) () {
  var fnName *CodeNode = op.children[1];
  var args *CodeNode = op.children[2];
  if  (int64(len(op.children))) > 3 {
    var details *CodeNode = op.children[3];
    var i int64 = 0;  
    for ; i < int64(len(details.children)) ; i++ {
      det := details.children[i];
      if  (int64(len(det.children))) > 0 {
        var fc *CodeNode = det.children[0];
        if  fc.vref == "code" {
          var match *RangerArgMatch = CreateNew_RangerArgMatch();
          var all_matched bool = match.matchArguments(args, node, ctx, 1);
          if  all_matched == false {
            return;
          }
          var origCode *CodeNode = det.children[1];
          var theCode *CodeNode = origCode.rebuildWithType(match, true);
          var appCtx *RangerAppWriterContext = ctx.getRoot();
          var stdFnName string = appCtx.createSignature(fnName.vref, (strings.Join([]string{ fnName.vref,theCode.getCode() }, "")));
          var stdClass *RangerAppClassDesc = ctx.findClass("RangerStaticMethods");
          var runCtx *RangerAppWriterContext = appCtx.fork();
          var b_failed bool = false;
          if  false == (r_has_key_string_bool(stdClass.defined_static_methods, stdFnName)) {
            runCtx.setInMethod();
            var m *RangerAppFunctionDesc = CreateNew_RangerAppFunctionDesc();
            m.name = stdFnName; 
            m.node.value = op;
            m.node.has_value = true; /* detected as non-optional */
            m.is_static = true; 
            m.nameNode.value = fnName;
            m.nameNode.has_value = true; /* detected as non-optional */
            m.fnBody.value = theCode;
            m.fnBody.has_value = true; /* detected as non-optional */
            var ii int64 = 0;  
            for ; ii < int64(len(args.children)) ; ii++ {
              arg := args.children[ii];
              var p IFACE_RangerAppParamDesc = CreateNew_RangerAppParamDesc();
              p.Set_name(arg.vref); 
              p.Set_value_type(arg.value_type); 
              p.Get_node().value = arg;
              p.Get_node().has_value = true; /* detected as non-optional */
              p.Get_nameNode().value = arg;
              p.Get_nameNode().has_value = true; /* detected as non-optional */
              p.Set_refType(1); 
              p.Set_varType(4); 
              m.params = append(m.params,p); 
              arg.hasParamDesc = true; 
              arg.paramDesc.value = p;
              arg.paramDesc.has_value = true; /* detected as non-optional */
              arg.eval_type = arg.value_type; 
              arg.eval_type_name = arg.type_name; 
              runCtx.defineVariable(p.Get_name(), p);
            }
            stdClass.addStaticMethod(m);
            var err_cnt int64 = int64(len(ctx.compilerErrors));
            var flowParser *RangerFlowParser = CreateNew_RangerFlowParser();
            var TmpWr *CodeWriter = CreateNew_CodeWriter();
            flowParser.WalkNode(theCode, runCtx, TmpWr);
            runCtx.unsetInMethod();
            var err_delta int64 = (int64(len(ctx.compilerErrors))) - err_cnt;
            if  err_delta > 0 {
              b_failed = true; 
              fmt.Println( "Had following compiler errors:" )
              var i_1 int64 = 0;  
              for ; i_1 < int64(len(ctx.compilerErrors)) ; i_1++ {
                e := ctx.compilerErrors[i_1];
                if  i_1 < err_cnt {
                  continue;
                }
                var line_index int64 = e.node.value.(*CodeNode).getLine();
                fmt.Println( strings.Join([]string{ (strings.Join([]string{ e.node.value.(*CodeNode).getFilename()," Line: " }, "")),strconv.FormatInt(line_index, 10) }, "") )
                fmt.Println( e.description )
                fmt.Println( e.node.value.(*CodeNode).getLineString(line_index) )
              }
            } else {
              fmt.Println( "no errors found" )
            }
          }
          if  b_failed {
            wr.out("/* custom operator compilation failed */ ", false);
          } else {
            wr.out(strings.Join([]string{ (strings.Join([]string{ "RangerStaticMethods.",stdFnName }, "")),"(" }, ""), false);
            var i_2 int64 = 0;  
            for ; i_2 < int64(len(node.children)) ; i_2++ {
              cc := node.children[i_2];
              if  i_2 == 0 {
                continue;
              }
              if  i_2 > 1 {
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
func (this *LiveCompiler) findOpTemplate (op *CodeNode, node *CodeNode, ctx *RangerAppWriterContext, wr *CodeWriter) *GoNullable {
  /** unused:  fnName*/
  /** unused:  root*/
  var langName string = ctx.getTargetLang();
  if  (int64(len(op.children))) > 3 {
    var details *CodeNode = op.children[3];
    var i int64 = 0;  
    for ; i < int64(len(details.children)) ; i++ {
      det := details.children[i];
      if  (int64(len(det.children))) > 0 {
        var fc *CodeNode = det.children[0];
        if  fc.vref == "templates" {
          var tplList *CodeNode = det.children[1];
          var i_1 int64 = 0;  
          for ; i_1 < int64(len(tplList.children)) ; i_1++ {
            tpl := tplList.children[i_1];
            var tplName *CodeNode = tpl.getFirst();
            var tplImpl *GoNullable = new(GoNullable); 
            tplImpl.value = tpl.getSecond();
            tplImpl.has_value = true; /* detected as non-optional */
            if  (tplName.vref != "*") && (tplName.vref != langName) {
              continue;
            }
            if  tplName.hasFlag("mutable") {
              if  false == node.hasFlag("mutable") {
                continue;
              }
            }
            return tplImpl;
          }
        }
      }
    }
  }
  var non *GoNullable = new(GoNullable); 
  return non;
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
    if  node.disabled_node {
      this.langWriter.value.(IFACE_RangerGenericClassWriter).disabledVarDef(node, ctx, wr);
    } else {
      this.langWriter.value.(IFACE_RangerGenericClassWriter).writeVarDef(node, ctx, wr);
    }
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
  this.lastProcessedNode.value = node;
  this.lastProcessedNode.has_value = true; /* detected as non-optional */
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
      /** unused:  fc*/
      var tplImpl *GoNullable = new(GoNullable); 
      tplImpl = this.findOpTemplate(op, node, ctx, wr);
      var evalCtx *RangerAppWriterContext = ctx;
      if  node.evalCtx.has_value {
        evalCtx = node.evalCtx.value.(*RangerAppWriterContext); 
      }
      if  tplImpl.has_value {
        var opName *CodeNode = op.getSecond();
        if  opName.hasFlag("returns") {
          this.langWriter.value.(IFACE_RangerGenericClassWriter).release_local_vars(node, evalCtx, wr);
        }
        this.walkCommandList(tplImpl.value.(*CodeNode), node, evalCtx, wr);
      } else {
        this.findOpCode(op, node, evalCtx, wr);
      }
      return;
    }
    if  node.has_lambda {
      this.CreateLambda(node, ctx, wr);
      return;
    }
    if  node.has_lambda_call {
      this.CreateLambdaCall(node, ctx, wr);
      return;
    }
    if  (int64(len(node.children))) > 1 {
      if  this.localCall(node, ctx, wr) {
        return;
      }
    }
    /** unused:  fc_1*/
  }
  if  node.expression {
    var i int64 = 0;  
    for ; i < int64(len(node.children)) ; i++ {
      item := node.children[i];
      if  (node.didReturnAtIndex >= 0) && (node.didReturnAtIndex < i) {
        break;
      }
      this.WalkNode(item, ctx, wr);
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
  var i int64 = 0;  
  for ; i < int64(len(cmd.children)) ; i++ {
    c := cmd.children[i];
    this.walkCommand(c, node, ctx, wr);
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
    if  (int64(len(cmd.children))) < 2 {
      ctx.addError(node, "Invalid command");
      ctx.addError(cmd, "Invalid command");
      return;
    }
    var cmdE *CodeNode = cmd.getFirst();
    var cmdArg *CodeNode = cmd.getSecond();
    switch (cmdE.vref ) { 
      case "str" : 
        var idx int64 = cmdArg.int_value;
        if  (int64(len(node.children))) > idx {
          var arg *CodeNode = node.children[idx];
          wr.out(arg.string_value, false);
        }
      case "block" : 
        var idx_1 int64 = cmdArg.int_value;
        if  (int64(len(node.children))) > idx_1 {
          var arg_1 *CodeNode = node.children[idx_1];
          this.WalkNode(arg_1, ctx, wr);
        }
      case "varname" : 
        if  ctx.isVarDefined(cmdArg.vref) {
          var p IFACE_RangerAppParamDesc = ctx.getVariableDef(cmdArg.vref);
          wr.out(p.Get_compiledName(), false);
        }
      case "defvar" : 
        var p_1 IFACE_RangerAppParamDesc = CreateNew_RangerAppParamDesc();
        p_1.Set_name(cmdArg.vref); 
        p_1.Set_value_type(cmdArg.value_type); 
        p_1.Get_node().value = cmdArg;
        p_1.Get_node().has_value = true; /* detected as non-optional */
        p_1.Get_nameNode().value = cmdArg;
        p_1.Get_nameNode().has_value = true; /* detected as non-optional */
        p_1.Set_is_optional(false); 
        ctx.defineVariable(p_1.Get_name(), p_1);
      case "cc" : 
        var idx_2 int64 = cmdArg.int_value;
        if  (int64(len(node.children))) > idx_2 {
          var arg_2 *CodeNode = node.children[idx_2];
          var cc byte = []byte(arg_2.string_value)[0];
          wr.out(strings.Join([]string{ "",strconv.FormatInt((int64(cc)), 10) }, ""), false);
        }
      case "java_case" : 
        var idx_3 int64 = cmdArg.int_value;
        if  (int64(len(node.children))) > idx_3 {
          var arg_3 *CodeNode = node.children[idx_3];
          this.WalkNode(arg_3, ctx, wr);
          if  arg_3.didReturnAtIndex < 0 {
            wr.newline();
            wr.out("break;", true);
          }
        }
      case "e" : 
        var idx_4 int64 = cmdArg.int_value;
        if  (int64(len(node.children))) > idx_4 {
          var arg_4 *CodeNode = node.children[idx_4];
          ctx.setInExpr();
          this.WalkNode(arg_4, ctx, wr);
          ctx.unsetInExpr();
        }
      case "goset" : 
        var idx_5 int64 = cmdArg.int_value;
        if  (int64(len(node.children))) > idx_5 {
          var arg_5 *CodeNode = node.children[idx_5];
          ctx.setInExpr();
          this.langWriter.value.(IFACE_RangerGenericClassWriter).WriteSetterVRef(arg_5, ctx, wr);
          ctx.unsetInExpr();
        }
      case "pe" : 
        var idx_6 int64 = cmdArg.int_value;
        if  (int64(len(node.children))) > idx_6 {
          var arg_6 *CodeNode = node.children[idx_6];
          this.WalkNode(arg_6, ctx, wr);
        }
      case "ptr" : 
        var idx_7 int64 = cmdArg.int_value;
        if  (int64(len(node.children))) > idx_7 {
          var arg_7 *CodeNode = node.children[idx_7];
          if  arg_7.hasParamDesc {
            if  arg_7.paramDesc.value.(IFACE_RangerAppParamDesc).Get_nameNode().value.(*CodeNode).isAPrimitiveType() == false {
              wr.out("*", false);
            }
          } else {
            if  arg_7.isAPrimitiveType() == false {
              wr.out("*", false);
            }
          }
        }
      case "ptrsrc" : 
        var idx_8 int64 = cmdArg.int_value;
        if  (int64(len(node.children))) > idx_8 {
          var arg_8 *CodeNode = node.children[idx_8];
          if  (arg_8.isPrimitiveType() == false) && (arg_8.isPrimitive() == false) {
            wr.out("&", false);
          }
        }
      case "nameof" : 
        var idx_9 int64 = cmdArg.int_value;
        if  (int64(len(node.children))) > idx_9 {
          var arg_9 *CodeNode = node.children[idx_9];
          wr.out(arg_9.vref, false);
        }
      case "list" : 
        var idx_10 int64 = cmdArg.int_value;
        if  (int64(len(node.children))) > idx_10 {
          var arg_10 *CodeNode = node.children[idx_10];
          var i int64 = 0;  
          for ; i < int64(len(arg_10.children)) ; i++ {
            ch := arg_10.children[i];
            if  i > 0 {
              wr.out(" ", false);
            }
            ctx.setInExpr();
            this.WalkNode(ch, ctx, wr);
            ctx.unsetInExpr();
          }
        }
      case "repeat_from" : 
        var idx_11 int64 = cmdArg.int_value;
        this.repeat_index = idx_11; 
        if  (int64(len(node.children))) >= idx_11 {
          var cmdToRepeat *CodeNode = cmd.getThird();
          var i_1 int64 = idx_11;
          for i_1 < (int64(len(node.children))) {
            if  i_1 >= idx_11 {
              var ii int64 = 0;  
              for ; ii < int64(len(cmdToRepeat.children)) ; ii++ {
                cc_1 := cmdToRepeat.children[ii];
                if  (int64(len(cc_1.children))) > 0 {
                  var fc *CodeNode = cc_1.getFirst();
                  if  fc.vref == "e" {
                    var dc *CodeNode = cc_1.getSecond();
                    dc.int_value = i_1; 
                  }
                  if  fc.vref == "block" {
                    var dc_1 *CodeNode = cc_1.getSecond();
                    dc_1.int_value = i_1; 
                  }
                }
              }
              this.walkCommandList(cmdToRepeat, node, ctx, wr);
              if  (i_1 + 1) < (int64(len(node.children))) {
                wr.out(",", false);
              }
            }
            i_1 = i_1 + 1; 
          }
        }
      case "comma" : 
        var idx_12 int64 = cmdArg.int_value;
        if  (int64(len(node.children))) > idx_12 {
          var arg_11 *CodeNode = node.children[idx_12];
          var i_2 int64 = 0;  
          for ; i_2 < int64(len(arg_11.children)) ; i_2++ {
            ch_1 := arg_11.children[i_2];
            if  i_2 > 0 {
              wr.out(",", false);
            }
            ctx.setInExpr();
            this.WalkNode(ch_1, ctx, wr);
            ctx.unsetInExpr();
          }
        }
      case "swift_rc" : 
        var idx_13 int64 = cmdArg.int_value;
        if  (int64(len(node.children))) > idx_13 {
          var arg_12 *CodeNode = node.children[idx_13];
          if  arg_12.hasParamDesc {
            if  arg_12.paramDesc.value.(IFACE_RangerAppParamDesc).Get_ref_cnt() == 0 {
              wr.out("_", false);
            } else {
              var p_2 IFACE_RangerAppParamDesc = ctx.getVariableDef(arg_12.vref);
              wr.out(p_2.Get_compiledName(), false);
            }
          } else {
            wr.out(arg_12.vref, false);
          }
        }
      case "r_ktype" : 
        var idx_14 int64 = cmdArg.int_value;
        if  (int64(len(node.children))) > idx_14 {
          var arg_13 *CodeNode = node.children[idx_14];
          if  arg_13.hasParamDesc {
            var ss string = this.langWriter.value.(IFACE_RangerGenericClassWriter).getObjectTypeString(arg_13.paramDesc.value.(IFACE_RangerAppParamDesc).Get_nameNode().value.(*CodeNode).key_type, ctx);
            wr.out(ss, false);
          } else {
            var ss_1 string = this.langWriter.value.(IFACE_RangerGenericClassWriter).getObjectTypeString(arg_13.key_type, ctx);
            wr.out(ss_1, false);
          }
        }
      case "r_atype" : 
        var idx_15 int64 = cmdArg.int_value;
        if  (int64(len(node.children))) > idx_15 {
          var arg_14 *CodeNode = node.children[idx_15];
          if  arg_14.hasParamDesc {
            var ss_2 string = this.langWriter.value.(IFACE_RangerGenericClassWriter).getObjectTypeString(arg_14.paramDesc.value.(IFACE_RangerAppParamDesc).Get_nameNode().value.(*CodeNode).array_type, ctx);
            wr.out(ss_2, false);
          } else {
            var ss_3 string = this.langWriter.value.(IFACE_RangerGenericClassWriter).getObjectTypeString(arg_14.array_type, ctx);
            wr.out(ss_3, false);
          }
        }
      case "custom" : 
        this.langWriter.value.(IFACE_RangerGenericClassWriter).CustomOperator(node, ctx, wr);
      case "arraytype" : 
        var idx_16 int64 = cmdArg.int_value;
        if  (int64(len(node.children))) > idx_16 {
          var arg_15 *CodeNode = node.children[idx_16];
          if  arg_15.hasParamDesc {
            this.langWriter.value.(IFACE_RangerGenericClassWriter).writeArrayTypeDef(arg_15.paramDesc.value.(IFACE_RangerAppParamDesc).Get_nameNode().value.(*CodeNode), ctx, wr);
          } else {
            this.langWriter.value.(IFACE_RangerGenericClassWriter).writeArrayTypeDef(arg_15, ctx, wr);
          }
        }
      case "rawtype" : 
        var idx_17 int64 = cmdArg.int_value;
        if  (int64(len(node.children))) > idx_17 {
          var arg_16 *CodeNode = node.children[idx_17];
          if  arg_16.hasParamDesc {
            this.langWriter.value.(IFACE_RangerGenericClassWriter).writeRawTypeDef(arg_16.paramDesc.value.(IFACE_RangerAppParamDesc).Get_nameNode().value.(*CodeNode), ctx, wr);
          } else {
            this.langWriter.value.(IFACE_RangerGenericClassWriter).writeRawTypeDef(arg_16, ctx, wr);
          }
        }
      case "macro" : 
        var p_write *CodeWriter = wr.getTag("utilities");
        var newWriter *CodeWriter = CreateNew_CodeWriter();
        var testCtx *RangerAppWriterContext = ctx.fork();
        testCtx.restartExpressionLevel();
        this.walkCommandList(cmdArg, node, testCtx, newWriter);
        var p_str string = newWriter.getCode();
        /** unused:  root*/
        if  (r_has_key_string_bool(p_write.compiledTags, p_str)) == false {
          p_write.compiledTags[p_str] = true
          var mCtx *RangerAppWriterContext = ctx.fork();
          mCtx.restartExpressionLevel();
          this.walkCommandList(cmdArg, node, mCtx, p_write);
        }
      case "create_polyfill" : 
        var p_write_1 *CodeWriter = wr.getTag("utilities");
        var p_str_1 string = cmdArg.string_value;
        if  (r_has_key_string_bool(p_write_1.compiledTags, p_str_1)) == false {
          p_write_1.raw(p_str_1, true);
          p_write_1.compiledTags[p_str_1] = true
        }
      case "typeof" : 
        var idx_18 int64 = cmdArg.int_value;
        if  (int64(len(node.children))) >= idx_18 {
          var arg_17 *CodeNode = node.children[idx_18];
          if  arg_17.hasParamDesc {
            this.writeTypeDef(arg_17.paramDesc.value.(IFACE_RangerAppParamDesc).Get_nameNode().value.(*CodeNode), ctx, wr);
          } else {
            this.writeTypeDef(arg_17, ctx, wr);
          }
        }
      case "imp" : 
        this.langWriter.value.(IFACE_RangerGenericClassWriter).import_lib(cmdArg.string_value, ctx, wr);
      case "atype" : 
        var idx_19 int64 = cmdArg.int_value;
        if  (int64(len(node.children))) >= idx_19 {
          var arg_18 *CodeNode = node.children[idx_19];
          var p_3 *GoNullable = new(GoNullable); 
          p_3 = this.findParamDesc(arg_18, ctx, wr);
          var nameNode *CodeNode = p_3.value.(IFACE_RangerAppParamDesc).Get_nameNode().value.(*CodeNode);
          var tn string = nameNode.array_type;
          wr.out(this.getTypeString(tn, ctx), false);
        }
    }
  } else {
    if  cmd.value_type == 9 {
      switch (cmd.vref ) { 
        case "nl" : 
          wr.newline();
        case "space" : 
          wr.out(" ", false);
        case "I" : 
          wr.indent(1);
        case "i" : 
          wr.indent(-1);
        case "op" : 
          var fc_1 *CodeNode = node.getFirst();
          wr.out(fc_1.vref, false);
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
  var varDesc *GoNullable = new(GoNullable); 
  var set_nsp bool = false;
  var classDesc *GoNullable = new(GoNullable); 
  if  0 == (int64(len(obj.nsp))) {
    set_nsp = true; 
  }
  if  obj.vref != "this" {
    if  (int64(len(obj.ns))) > 1 {
      var cnt int64 = int64(len(obj.ns));
      var classRefDesc *GoNullable = new(GoNullable); 
      var i int64 = 0;  
      for ; i < int64(len(obj.ns)) ; i++ {
        strname := obj.ns[i];
        if  i == 0 {
          if  strname == "this" {
            classDesc.value = ctx.getCurrentClass().value;
            classDesc.has_value = false; 
            if classDesc.value != nil {
              classDesc.has_value = true
            }
            if  set_nsp {
              obj.nsp = append(obj.nsp,classDesc.value.(*RangerAppClassDesc)); 
            }
          } else {
            if  ctx.isDefinedClass(strname) {
              classDesc.value = ctx.findClass(strname);
              classDesc.has_value = true; /* detected as non-optional */
              if  set_nsp {
                obj.nsp = append(obj.nsp,classDesc.value.(*RangerAppClassDesc)); 
              }
              continue;
            }
            classRefDesc.value = ctx.getVariableDef(strname);
            classRefDesc.has_value = true; /* detected as non-optional */
            if  !classRefDesc.has_value  {
              ctx.addError(obj, strings.Join([]string{ "Error, no description for called object: ",strname }, ""));
              break;
            }
            if  set_nsp {
              obj.nsp = append(obj.nsp,classRefDesc.value.(IFACE_RangerAppParamDesc)); 
            }
            classRefDesc.value.(IFACE_RangerAppParamDesc).Set_ref_cnt(1 + classRefDesc.value.(IFACE_RangerAppParamDesc).Get_ref_cnt()); 
            classDesc.value = ctx.findClass(classRefDesc.value.(IFACE_RangerAppParamDesc).Get_nameNode().value.(*CodeNode).type_name);
            classDesc.has_value = true; /* detected as non-optional */
          }
        } else {
          if  i < (cnt - 1) {
            varDesc.value = classDesc.value.(*RangerAppClassDesc).findVariable(strname).value;
            varDesc.has_value = false; 
            if varDesc.value != nil {
              varDesc.has_value = true
            }
            if  !varDesc.has_value  {
              ctx.addError(obj, strings.Join([]string{ "Error, no description for refenced obj: ",strname }, ""));
            }
            var subClass string = varDesc.value.(IFACE_RangerAppParamDesc).getTypeName();
            classDesc.value = ctx.findClass(subClass);
            classDesc.has_value = true; /* detected as non-optional */
            if  set_nsp {
              obj.nsp = append(obj.nsp,varDesc.value.(IFACE_RangerAppParamDesc)); 
            }
            continue;
          }
          if  classDesc.has_value {
            varDesc.value = classDesc.value.(*RangerAppClassDesc).findVariable(strname).value;
            varDesc.has_value = false; 
            if varDesc.value != nil {
              varDesc.has_value = true
            }
            if  !varDesc.has_value  {
              var classMethod *GoNullable = new(GoNullable); 
              classMethod = classDesc.value.(*RangerAppClassDesc).findMethod(strname);
              if  !classMethod.has_value  {
                classMethod.value = classDesc.value.(*RangerAppClassDesc).findStaticMethod(strname).value;
                classMethod.has_value = false; 
                if classMethod.value != nil {
                  classMethod.has_value = true
                }
                if  !classMethod.has_value  {
                  ctx.addError(obj, strings.Join([]string{ "variable not found ",strname }, ""));
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
              obj.nsp = append(obj.nsp,varDesc.value.(IFACE_RangerAppParamDesc)); 
            }
          }
        }
      }
      return varDesc;
    }
    varDesc.value = ctx.getVariableDef(obj.vref);
    varDesc.has_value = true; /* detected as non-optional */
    if  varDesc.value.(IFACE_RangerAppParamDesc).Get_nameNode().has_value {
    } else {
      fmt.Println( strings.Join([]string{ "findParamDesc : description not found for ",obj.vref }, "") )
      if  varDesc.has_value {
        fmt.Println( strings.Join([]string{ "Vardesc was found though...",varDesc.value.(IFACE_RangerAppParamDesc).Get_name() }, "") )
      }
      ctx.addError(obj, strings.Join([]string{ "Error, no description for called object: ",obj.vref }, ""));
    }
    return varDesc;
  }
  var cc *GoNullable = new(GoNullable); 
  cc = ctx.getCurrentClass();
  return cc;
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
// getter for variable lastProcessedNode
func (this *LiveCompiler) Get_lastProcessedNode() *GoNullable {
  return this.lastProcessedNode
}
// setter for variable lastProcessedNode
func (this *LiveCompiler) Set_lastProcessedNode( value *GoNullable)  {
  this.lastProcessedNode = value 
}
// getter for variable repeat_index
func (this *LiveCompiler) Get_repeat_index() int64 {
  return this.repeat_index
}
// setter for variable repeat_index
func (this *LiveCompiler) Set_repeat_index( value int64)  {
  this.repeat_index = value 
}
type ColorConsole struct { 
}
type IFACE_ColorConsole interface { 
  out(color string, str string) ()
}

func CreateNew_ColorConsole() *ColorConsole {
  me := new(ColorConsole)
  return me;
}
func (this *ColorConsole) out (color string, str string) () {
  fmt.Println( str )
}
type DictNode struct { 
  is_property bool
  is_property_value bool
  vref string
  value_type int64
  double_value float64
  int_value int64
  string_value string
  boolean_value bool
  object_value *GoNullable
  children []*DictNode
  objects map[string]*DictNode
  keys []string
}
type IFACE_DictNode interface { 
  Get_is_property() bool
  Set_is_property(value bool) 
  Get_is_property_value() bool
  Set_is_property_value(value bool) 
  Get_vref() string
  Set_vref(value string) 
  Get_value_type() int64
  Set_value_type(value int64) 
  Get_double_value() float64
  Set_double_value(value float64) 
  Get_int_value() int64
  Set_int_value(value int64) 
  Get_string_value() string
  Set_string_value(value string) 
  Get_boolean_value() bool
  Set_boolean_value(value bool) 
  Get_object_value() *GoNullable
  Set_object_value(value *GoNullable) 
  Get_children() []*DictNode
  Set_children(value []*DictNode) 
  Get_objects() map[string]*DictNode
  Set_objects(value map[string]*DictNode) 
  Get_keys() []string
  Set_keys(value []string) 
  EncodeString(orig_str string) string
  addString(key string, value string) ()
  addDouble(key string, value float64) ()
  addInt(key string, value int64) ()
  addBoolean(key string, value bool) ()
  addObject(key string) *GoNullable
  setObject(key string, value *DictNode) ()
  addArray(key string) *GoNullable
  push(obj *DictNode) ()
  getDoubleAt(index int64) float64
  getStringAt(index int64) string
  getIntAt(index int64) int64
  getBooleanAt(index int64) bool
  getString(key string) *GoNullable
  getDouble(key string) *GoNullable
  getInt(key string) *GoNullable
  getBoolean(key string) *GoNullable
  getArray(key string) *GoNullable
  getArrayAt(index int64) *GoNullable
  getObject(key string) *GoNullable
  getObjectAt(index int64) *GoNullable
  stringify() string
}

func CreateNew_DictNode() *DictNode {
  me := new(DictNode)
  me.is_property = false
  me.is_property_value = false
  me.vref = ""
  me.value_type = 6
  me.double_value = 0.0
  me.int_value = 0
  me.string_value = ""
  me.boolean_value = false
  me.children = make([]*DictNode,0)
  me.objects = make(map[string]*DictNode)
  me.keys = make([]string,0)
  me.object_value = new(GoNullable);
  return me;
}
func DictNode_static_createEmptyObject() *DictNode {
  var v *DictNode = CreateNew_DictNode();
  v.value_type = 6; 
  return v;
}
func (this *DictNode) EncodeString (orig_str string) string {
  var encoded_str string = "";
  /** unused:  str_length*/
  var ii int64 = 0;
  var buff []byte = []byte(orig_str);
  var cb_len int64 = int64(len(buff));
  for ii < cb_len {
    var cc byte = buff[ii];
    switch (cc ) { 
      case 8 : 
        encoded_str = strings.Join([]string{ (strings.Join([]string{ encoded_str,(string([] byte{byte(92)})) }, "")),(string([] byte{byte(98)})) }, ""); 
      case 9 : 
        encoded_str = strings.Join([]string{ (strings.Join([]string{ encoded_str,(string([] byte{byte(92)})) }, "")),(string([] byte{byte(116)})) }, ""); 
      case 10 : 
        encoded_str = strings.Join([]string{ (strings.Join([]string{ encoded_str,(string([] byte{byte(92)})) }, "")),(string([] byte{byte(110)})) }, ""); 
      case 12 : 
        encoded_str = strings.Join([]string{ (strings.Join([]string{ encoded_str,(string([] byte{byte(92)})) }, "")),(string([] byte{byte(102)})) }, ""); 
      case 13 : 
        encoded_str = strings.Join([]string{ (strings.Join([]string{ encoded_str,(string([] byte{byte(92)})) }, "")),(string([] byte{byte(114)})) }, ""); 
      case 34 : 
        encoded_str = strings.Join([]string{ (strings.Join([]string{ encoded_str,(string([] byte{byte(92)})) }, "")),"\"" }, ""); 
      case 92 : 
        encoded_str = strings.Join([]string{ (strings.Join([]string{ encoded_str,(string([] byte{byte(92)})) }, "")),(string([] byte{byte(92)})) }, ""); 
      case 47 : 
        encoded_str = strings.Join([]string{ (strings.Join([]string{ encoded_str,(string([] byte{byte(92)})) }, "")),(string([] byte{byte(47)})) }, ""); 
      default: 
        encoded_str = strings.Join([]string{ encoded_str,(string([] byte{byte(cc)})) }, ""); 
    }
    ii = 1 + ii; 
  }
  return encoded_str;
}
func (this *DictNode) addString (key string, value string) () {
  if  this.value_type == 6 {
    var v *DictNode = CreateNew_DictNode();
    v.string_value = value; 
    v.value_type = 3; 
    v.vref = key; 
    v.is_property = true; 
    this.keys = append(this.keys,key); 
    this.objects[key] = v
  }
}
func (this *DictNode) addDouble (key string, value float64) () {
  if  this.value_type == 6 {
    var v *DictNode = CreateNew_DictNode();
    v.double_value = value; 
    v.value_type = 1; 
    v.vref = key; 
    v.is_property = true; 
    this.keys = append(this.keys,key); 
    this.objects[key] = v
  }
}
func (this *DictNode) addInt (key string, value int64) () {
  if  this.value_type == 6 {
    var v *DictNode = CreateNew_DictNode();
    v.int_value = value; 
    v.value_type = 2; 
    v.vref = key; 
    v.is_property = true; 
    this.keys = append(this.keys,key); 
    this.objects[key] = v
  }
}
func (this *DictNode) addBoolean (key string, value bool) () {
  if  this.value_type == 6 {
    var v *DictNode = CreateNew_DictNode();
    v.boolean_value = value; 
    v.value_type = 4; 
    v.vref = key; 
    v.is_property = true; 
    this.keys = append(this.keys,key); 
    this.objects[key] = v
  }
}
func (this *DictNode) addObject (key string) *GoNullable {
  var v *GoNullable = new(GoNullable); 
  if  this.value_type == 6 {
    var p *DictNode = CreateNew_DictNode();
    v.value = CreateNew_DictNode();
    v.has_value = true; /* detected as non-optional */
    p.value_type = 6; 
    p.vref = key; 
    p.is_property = true; 
    v.value.(*DictNode).value_type = 6; 
    v.value.(*DictNode).vref = key; 
    v.value.(*DictNode).is_property_value = true; 
    p.object_value.value = v.value;
    p.object_value.has_value = false; 
    if p.object_value.value != nil {
      p.object_value.has_value = true
    }
    this.keys = append(this.keys,key); 
    this.objects[key] = p
    return v;
  }
  return v;
}
func (this *DictNode) setObject (key string, value *DictNode) () {
  if  this.value_type == 6 {
    var p *DictNode = CreateNew_DictNode();
    p.value_type = 6; 
    p.vref = key; 
    p.is_property = true; 
    value.is_property_value = true; 
    value.vref = key; 
    p.object_value.value = value;
    p.object_value.has_value = true; /* detected as non-optional */
    this.keys = append(this.keys,key); 
    this.objects[key] = p
  }
}
func (this *DictNode) addArray (key string) *GoNullable {
  var v *GoNullable = new(GoNullable); 
  if  this.value_type == 6 {
    v.value = CreateNew_DictNode();
    v.has_value = true; /* detected as non-optional */
    v.value.(*DictNode).value_type = 5; 
    v.value.(*DictNode).vref = key; 
    v.value.(*DictNode).is_property = true; 
    this.keys = append(this.keys,key); 
    this.objects[key] = v.value.(*DictNode)
    return v;
  }
  return v;
}
func (this *DictNode) push (obj *DictNode) () {
  if  this.value_type == 5 {
    this.children = append(this.children,obj); 
  }
}
func (this *DictNode) getDoubleAt (index int64) float64 {
  if  index < (int64(len(this.children))) {
    var k *DictNode = this.children[index];
    return k.double_value;
  }
  return 0.0;
}
func (this *DictNode) getStringAt (index int64) string {
  if  index < (int64(len(this.children))) {
    var k *DictNode = this.children[index];
    return k.string_value;
  }
  return "";
}
func (this *DictNode) getIntAt (index int64) int64 {
  if  index < (int64(len(this.children))) {
    var k *DictNode = this.children[index];
    return k.int_value;
  }
  return 0;
}
func (this *DictNode) getBooleanAt (index int64) bool {
  if  index < (int64(len(this.children))) {
    var k *DictNode = this.children[index];
    return k.boolean_value;
  }
  return false;
}
func (this *DictNode) getString (key string) *GoNullable {
  var res *GoNullable = new(GoNullable); 
  if  r_has_key_string_DictNode(this.objects, key) {
    var k *GoNullable = new(GoNullable); 
    k = r_get_string_DictNode(this.objects, key);
    res.value = k.value.(*DictNode).string_value;
    res.has_value = true; /* detected as non-optional */
  }
  return res;
}
func (this *DictNode) getDouble (key string) *GoNullable {
  var res *GoNullable = new(GoNullable); 
  if  r_has_key_string_DictNode(this.objects, key) {
    var k *GoNullable = new(GoNullable); 
    k = r_get_string_DictNode(this.objects, key);
    res.value = k.value.(*DictNode).double_value;
    res.has_value = true; /* detected as non-optional */
  }
  return res;
}
func (this *DictNode) getInt (key string) *GoNullable {
  var res *GoNullable = new(GoNullable); 
  if  r_has_key_string_DictNode(this.objects, key) {
    var k *GoNullable = new(GoNullable); 
    k = r_get_string_DictNode(this.objects, key);
    res.value = k.value.(*DictNode).int_value;
    res.has_value = true; /* detected as non-optional */
  }
  return res;
}
func (this *DictNode) getBoolean (key string) *GoNullable {
  var res *GoNullable = new(GoNullable); 
  if  r_has_key_string_DictNode(this.objects, key) {
    var k *GoNullable = new(GoNullable); 
    k = r_get_string_DictNode(this.objects, key);
    res.value = k.value.(*DictNode).boolean_value;
    res.has_value = true; /* detected as non-optional */
  }
  return res;
}
func (this *DictNode) getArray (key string) *GoNullable {
  var res *GoNullable = new(GoNullable); 
  if  r_has_key_string_DictNode(this.objects, key) {
    var obj *GoNullable = new(GoNullable); 
    obj = r_get_string_DictNode(this.objects, key);
    if  obj.value.(*DictNode).is_property {
      res.value = obj.value.(*DictNode).object_value.value;
      res.has_value = false; 
      if res.value != nil {
        res.has_value = true
      }
    }
  }
  return res;
}
func (this *DictNode) getArrayAt (index int64) *GoNullable {
  var res *GoNullable = new(GoNullable); 
  if  index < (int64(len(this.children))) {
    res.value = this.children[index];
    res.has_value = true; /* detected as non-optional */
  }
  return res;
}
func (this *DictNode) getObject (key string) *GoNullable {
  var res *GoNullable = new(GoNullable); 
  if  r_has_key_string_DictNode(this.objects, key) {
    var obj *GoNullable = new(GoNullable); 
    obj = r_get_string_DictNode(this.objects, key);
    if  obj.value.(*DictNode).is_property {
      res.value = obj.value.(*DictNode).object_value.value;
      res.has_value = false; 
      if res.value != nil {
        res.has_value = true
      }
    }
  }
  return res;
}
func (this *DictNode) getObjectAt (index int64) *GoNullable {
  var res *GoNullable = new(GoNullable); 
  if  index < (int64(len(this.children))) {
    res.value = this.children[index];
    res.has_value = true; /* detected as non-optional */
  }
  return res;
}
func (this *DictNode) stringify () string {
  if  this.is_property {
    if  this.value_type == 7 {
      return strings.Join([]string{ (strings.Join([]string{ (strings.Join([]string{ "\"",this.vref }, "")),"\"" }, "")),":null" }, "");
    }
    if  this.value_type == 4 {
      if  this.boolean_value {
        return strings.Join([]string{ (strings.Join([]string{ (strings.Join([]string{ (strings.Join([]string{ "\"",this.vref }, "")),"\"" }, "")),":" }, "")),"true" }, "");
      } else {
        return strings.Join([]string{ (strings.Join([]string{ (strings.Join([]string{ (strings.Join([]string{ "\"",this.vref }, "")),"\"" }, "")),":" }, "")),"false" }, "");
      }
    }
    if  this.value_type == 1 {
      return strings.Join([]string{ (strings.Join([]string{ (strings.Join([]string{ (strings.Join([]string{ "\"",this.vref }, "")),"\"" }, "")),":" }, "")),strconv.FormatFloat(this.double_value,'f', 6, 64) }, "");
    }
    if  this.value_type == 2 {
      return strings.Join([]string{ (strings.Join([]string{ (strings.Join([]string{ (strings.Join([]string{ "\"",this.vref }, "")),"\"" }, "")),":" }, "")),strconv.FormatInt(this.int_value, 10) }, "");
    }
    if  this.value_type == 3 {
      return strings.Join([]string{ (strings.Join([]string{ (strings.Join([]string{ (strings.Join([]string{ (strings.Join([]string{ (strings.Join([]string{ "\"",this.vref }, "")),"\"" }, "")),":" }, "")),"\"" }, "")),this.EncodeString(this.string_value) }, "")),"\"" }, "");
    }
  } else {
    if  this.value_type == 7 {
      return "null";
    }
    if  this.value_type == 1 {
      return strings.Join([]string{ "",strconv.FormatFloat(this.double_value,'f', 6, 64) }, "");
    }
    if  this.value_type == 2 {
      return strings.Join([]string{ "",strconv.FormatInt(this.int_value, 10) }, "");
    }
    if  this.value_type == 3 {
      return strings.Join([]string{ (strings.Join([]string{ "\"",this.EncodeString(this.string_value) }, "")),"\"" }, "");
    }
    if  this.value_type == 4 {
      if  this.boolean_value {
        return "true";
      } else {
        return "false";
      }
    }
  }
  if  this.value_type == 5 {
    var str string = "";
    if  this.is_property {
      str = strings.Join([]string{ (strings.Join([]string{ (strings.Join([]string{ "\"",this.vref }, "")),"\"" }, "")),":[" }, ""); 
    } else {
      str = "["; 
    }
    var i int64 = 0;  
    for ; i < int64(len(this.children)) ; i++ {
      item := this.children[i];
      if  i > 0 {
        str = strings.Join([]string{ str,"," }, ""); 
      }
      str = strings.Join([]string{ str,item.stringify() }, ""); 
    }
    str = strings.Join([]string{ str,"]" }, ""); 
    return str;
  }
  if  this.value_type == 6 {
    var str_1 string = "";
    if  this.is_property {
      return strings.Join([]string{ (strings.Join([]string{ (strings.Join([]string{ (strings.Join([]string{ "\"",this.vref }, "")),"\"" }, "")),":" }, "")),this.object_value.value.(*DictNode).stringify() }, "");
    } else {
      str_1 = "{"; 
      var i_1 int64 = 0;  
      for ; i_1 < int64(len(this.keys)) ; i_1++ {
        key := this.keys[i_1];
        if  i_1 > 0 {
          str_1 = strings.Join([]string{ str_1,"," }, ""); 
        }
        var item_1 *GoNullable = new(GoNullable); 
        item_1 = r_get_string_DictNode(this.objects, key);
        str_1 = strings.Join([]string{ str_1,item_1.value.(*DictNode).stringify() }, ""); 
      }
      str_1 = strings.Join([]string{ str_1,"}" }, ""); 
      return str_1;
    }
  }
  return "";
}
// getter for variable is_property
func (this *DictNode) Get_is_property() bool {
  return this.is_property
}
// setter for variable is_property
func (this *DictNode) Set_is_property( value bool)  {
  this.is_property = value 
}
// getter for variable is_property_value
func (this *DictNode) Get_is_property_value() bool {
  return this.is_property_value
}
// setter for variable is_property_value
func (this *DictNode) Set_is_property_value( value bool)  {
  this.is_property_value = value 
}
// getter for variable vref
func (this *DictNode) Get_vref() string {
  return this.vref
}
// setter for variable vref
func (this *DictNode) Set_vref( value string)  {
  this.vref = value 
}
// getter for variable value_type
func (this *DictNode) Get_value_type() int64 {
  return this.value_type
}
// setter for variable value_type
func (this *DictNode) Set_value_type( value int64)  {
  this.value_type = value 
}
// getter for variable double_value
func (this *DictNode) Get_double_value() float64 {
  return this.double_value
}
// setter for variable double_value
func (this *DictNode) Set_double_value( value float64)  {
  this.double_value = value 
}
// getter for variable int_value
func (this *DictNode) Get_int_value() int64 {
  return this.int_value
}
// setter for variable int_value
func (this *DictNode) Set_int_value( value int64)  {
  this.int_value = value 
}
// getter for variable string_value
func (this *DictNode) Get_string_value() string {
  return this.string_value
}
// setter for variable string_value
func (this *DictNode) Set_string_value( value string)  {
  this.string_value = value 
}
// getter for variable boolean_value
func (this *DictNode) Get_boolean_value() bool {
  return this.boolean_value
}
// setter for variable boolean_value
func (this *DictNode) Set_boolean_value( value bool)  {
  this.boolean_value = value 
}
// getter for variable object_value
func (this *DictNode) Get_object_value() *GoNullable {
  return this.object_value
}
// setter for variable object_value
func (this *DictNode) Set_object_value( value *GoNullable)  {
  this.object_value = value 
}
// getter for variable children
func (this *DictNode) Get_children() []*DictNode {
  return this.children
}
// setter for variable children
func (this *DictNode) Set_children( value []*DictNode)  {
  this.children = value 
}
// getter for variable objects
func (this *DictNode) Get_objects() map[string]*DictNode {
  return this.objects
}
// setter for variable objects
func (this *DictNode) Set_objects( value map[string]*DictNode)  {
  this.objects = value 
}
// getter for variable keys
func (this *DictNode) Get_keys() []string {
  return this.keys
}
// setter for variable keys
func (this *DictNode) Set_keys( value []string)  {
  this.keys = value 
}
type RangerSerializeClass struct { 
}
type IFACE_RangerSerializeClass interface { 
  isSerializedClass(cName string, ctx *RangerAppWriterContext) bool
  createWRWriter(pvar IFACE_RangerAppParamDesc, nn *CodeNode, ctx *RangerAppWriterContext, wr *CodeWriter) ()
  createJSONSerializerFn(cl *RangerAppClassDesc, ctx *RangerAppWriterContext, wr *CodeWriter) ()
}

func CreateNew_RangerSerializeClass() *RangerSerializeClass {
  me := new(RangerSerializeClass)
  return me;
}
func (this *RangerSerializeClass) isSerializedClass (cName string, ctx *RangerAppWriterContext) bool {
  if  ctx.hasClass(cName) {
    var clDecl *RangerAppClassDesc = ctx.findClass(cName);
    if  clDecl.is_serialized {
      return true;
    }
  }
  return false;
}
func (this *RangerSerializeClass) createWRWriter (pvar IFACE_RangerAppParamDesc, nn *CodeNode, ctx *RangerAppWriterContext, wr *CodeWriter) () {
  wr.out("def key@(lives):DictNode (new DictNode())", true);
  wr.out(strings.Join([]string{ (strings.Join([]string{ "key.addString(\"n\" \"",pvar.Get_name() }, "")),"\")" }, ""), true);
  if  nn.value_type == 6 {
    if  this.isSerializedClass(nn.array_type, ctx) {
      wr.out(strings.Join([]string{ (strings.Join([]string{ "def values:DictNode (keys.addArray(\"",pvar.Get_compiledName() }, "")),"\"))" }, ""), true);
      wr.out(strings.Join([]string{ (strings.Join([]string{ (strings.Join([]string{ (strings.Join([]string{ "for this.",pvar.Get_compiledName() }, ""))," item:" }, "")),nn.array_type }, ""))," i {" }, ""), true);
      wr.indent(1);
      wr.out("def obj@(lives):DictNode (item.serializeToDict())", true);
      wr.out("values.push( obj )", true);
      wr.indent(-1);
      wr.out("}", true);
    }
    return;
  }
  if  nn.value_type == 7 {
    if  this.isSerializedClass(nn.array_type, ctx) {
      wr.out(strings.Join([]string{ (strings.Join([]string{ "def values:DictNode (keys.addObject(\"",pvar.Get_compiledName() }, "")),"\"))" }, ""), true);
      wr.out(strings.Join([]string{ (strings.Join([]string{ "for this.",pvar.Get_compiledName() }, ""))," keyname {" }, ""), true);
      wr.indent(1);
      wr.out(strings.Join([]string{ (strings.Join([]string{ "def item:DictNode (unwrap (get this.",pvar.Get_compiledName() }, ""))," keyname))" }, ""), true);
      wr.out("def obj@(lives):DictNode (item.serializeToDict())", true);
      wr.out("values.setObject( obj )", true);
      wr.indent(-1);
      wr.out("}", true);
    }
    if  nn.key_type == "string" {
      wr.out(strings.Join([]string{ (strings.Join([]string{ "def values:DictNode (keys.addObject(\"",pvar.Get_compiledName() }, "")),"\"))" }, ""), true);
      wr.out(strings.Join([]string{ (strings.Join([]string{ "for this.",pvar.Get_compiledName() }, ""))," keyname {" }, ""), true);
      wr.indent(1);
      if  nn.array_type == "string" {
        wr.out(strings.Join([]string{ (strings.Join([]string{ "values.addString(keyname (unwrap (get this.",pvar.Get_compiledName() }, ""))," keyname)))" }, ""), true);
      }
      if  nn.array_type == "int" {
        wr.out(strings.Join([]string{ (strings.Join([]string{ "values.addInt(keyname (unwrap (get this.",pvar.Get_compiledName() }, ""))," keyname)))" }, ""), true);
      }
      if  nn.array_type == "boolean" {
        wr.out(strings.Join([]string{ (strings.Join([]string{ "values.addBoolean(keyname (unwrap (get this.",pvar.Get_compiledName() }, ""))," keyname)))" }, ""), true);
      }
      if  nn.array_type == "double" {
        wr.out(strings.Join([]string{ (strings.Join([]string{ "values.addDouble(keyname (unwrap (get this.",pvar.Get_compiledName() }, ""))," keyname)))" }, ""), true);
      }
      wr.indent(-1);
      wr.out("}", true);
      return;
    }
    return;
  }
  if  nn.type_name == "string" {
    wr.out(strings.Join([]string{ (strings.Join([]string{ (strings.Join([]string{ (strings.Join([]string{ "keys.addString(\"",pvar.Get_compiledName() }, "")),"\" (this." }, "")),pvar.Get_compiledName() }, "")),"))" }, ""), true);
    return;
  }
  if  nn.type_name == "double" {
    wr.out(strings.Join([]string{ (strings.Join([]string{ (strings.Join([]string{ (strings.Join([]string{ "keys.addDouble(\"",pvar.Get_compiledName() }, "")),"\" (this." }, "")),pvar.Get_compiledName() }, "")),"))" }, ""), true);
    return;
  }
  if  nn.type_name == "int" {
    wr.out(strings.Join([]string{ (strings.Join([]string{ (strings.Join([]string{ (strings.Join([]string{ "keys.addInt(\"",pvar.Get_compiledName() }, "")),"\" (this." }, "")),pvar.Get_compiledName() }, "")),"))" }, ""), true);
    return;
  }
  if  nn.type_name == "boolean" {
    wr.out(strings.Join([]string{ (strings.Join([]string{ (strings.Join([]string{ (strings.Join([]string{ "keys.addBoolean(\"",pvar.Get_compiledName() }, "")),"\" (this." }, "")),pvar.Get_compiledName() }, "")),"))" }, ""), true);
    return;
  }
  if  this.isSerializedClass(nn.type_name, ctx) {
    wr.out(strings.Join([]string{ (strings.Join([]string{ "def value@(lives):DictNode (this.",pvar.Get_compiledName() }, "")),".serializeToDict())" }, ""), true);
    wr.out(strings.Join([]string{ (strings.Join([]string{ "keys.setObject(\"",pvar.Get_compiledName() }, "")),"\" value)" }, ""), true);
  }
}
func (this *RangerSerializeClass) createJSONSerializerFn (cl *RangerAppClassDesc, ctx *RangerAppWriterContext, wr *CodeWriter) () {
  var declaredVariable map[string]bool = make(map[string]bool);
  wr.out("Import \"ng_DictNode.clj\"", true);
  wr.out(strings.Join([]string{ (strings.Join([]string{ "extension ",cl.name }, ""))," {" }, ""), true);
  wr.indent(1);
  wr.out(strings.Join([]string{ (strings.Join([]string{ "fn unserializeFromDict@(strong):",cl.name }, ""))," (dict:DictNode) {" }, ""), true);
  wr.indent(1);
  wr.out(strings.Join([]string{ (strings.Join([]string{ (strings.Join([]string{ (strings.Join([]string{ "def obj:",cl.name }, ""))," (new " }, "")),cl.name }, "")),"())" }, ""), true);
  wr.out("return obj", true);
  wr.indent(-1);
  wr.out("}", true);
  wr.newline();
  wr.out("fn serializeToDict:DictNode () {", true);
  wr.indent(1);
  wr.out("def res:DictNode (new DictNode ())", true);
  wr.out(strings.Join([]string{ (strings.Join([]string{ "res.addString(\"n\" \"",cl.name }, "")),"\")" }, ""), true);
  wr.out("def keys:DictNode (res.addObject(\"data\"))", true);
  if  (int64(len(cl.extends_classes))) > 0 {
    var i int64 = 0;  
    for ; i < int64(len(cl.extends_classes)) ; i++ {
      pName := cl.extends_classes[i];
      var pC *RangerAppClassDesc = ctx.findClass(pName);
      var i_1 int64 = 0;  
      for ; i_1 < int64(len(pC.variables)) ; i_1++ {
        pvar := pC.variables[i_1];
        declaredVariable[pvar.Get_name()] = true
        var nn *CodeNode = pvar.Get_nameNode().value.(*CodeNode);
        if  nn.isPrimitive() {
          wr.out("; extended ", true);
          wr.out("def key@(lives):DictNode (new DictNode())", true);
          wr.out(strings.Join([]string{ (strings.Join([]string{ "key.addString(\"n\" \"",pvar.Get_name() }, "")),"\")" }, ""), true);
          wr.out(strings.Join([]string{ (strings.Join([]string{ "key.addString(\"t\" \"",strconv.FormatInt(pvar.Get_value_type(), 10) }, "")),"\")" }, ""), true);
          wr.out("keys.push(key)", true);
        }
      }
    }
  }
  var i_2 int64 = 0;  
  for ; i_2 < int64(len(cl.variables)) ; i_2++ {
    pvar_1 := cl.variables[i_2];
    if  r_has_key_string_bool(declaredVariable, pvar_1.Get_name()) {
      continue;
    }
    var nn_1 *CodeNode = pvar_1.Get_nameNode().value.(*CodeNode);
    if  nn_1.hasFlag("optional") {
      wr.out("; optional variable", true);
      wr.out(strings.Join([]string{ (strings.Join([]string{ "if (!null? this.",pvar_1.Get_name() }, "")),") {" }, ""), true);
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
type CompilerInterface struct { 
}
type IFACE_CompilerInterface interface { 
}

func CreateNew_CompilerInterface() *CompilerInterface {
  me := new(CompilerInterface)
  return me;
}
func CompilerInterface_static_displayCompilerErrors(appCtx *RangerAppWriterContext) () {
  var cons *ColorConsole = CreateNew_ColorConsole();
  var i_3 int64 = 0;  
  for ; i_3 < int64(len(appCtx.compilerErrors)) ; i_3++ {
    e := appCtx.compilerErrors[i_3];
    var line_index int64 = e.node.value.(*CodeNode).getLine();
    cons.out("gray", strings.Join([]string{ (strings.Join([]string{ e.node.value.(*CodeNode).getFilename()," Line: " }, "")),strconv.FormatInt((1 + line_index), 10) }, ""));
    cons.out("gray", e.description);
    cons.out("gray", e.node.value.(*CodeNode).getLineString(line_index));
    cons.out("", strings.Join([]string{ e.node.value.(*CodeNode).getColStartString(),"^-------" }, ""));
  }
}
func CompilerInterface_static_displayParserErrors(appCtx *RangerAppWriterContext) () {
  if  (int64(len(appCtx.parserErrors))) == 0 {
    fmt.Println( "no language test errors" )
    return;
  }
  fmt.Println( "LANGUAGE TEST ERRORS:" )
  var i_4 int64 = 0;  
  for ; i_4 < int64(len(appCtx.parserErrors)) ; i_4++ {
    e_1 := appCtx.parserErrors[i_4];
    var line_index_1 int64 = e_1.node.value.(*CodeNode).getLine();
    fmt.Println( strings.Join([]string{ (strings.Join([]string{ e_1.node.value.(*CodeNode).getFilename()," Line: " }, "")),strconv.FormatInt((1 + line_index_1), 10) }, "") )
    fmt.Println( e_1.description )
    fmt.Println( e_1.node.value.(*CodeNode).getLineString(line_index_1) )
  }
}
func main() {
  var allowed_languages []string = []string{"es6","go","scala","java7","swift3","cpp","php","ranger"};
  if  (int64( len( os.Args) - 1 )) < 5 {
    fmt.Println( "Ranger compiler, version 2.0.8" )
    fmt.Println( "usage <file> <language-file> <language> <directory> <targetfile>" )
    fmt.Println( strings.Join([]string{ "allowed languages: ",(strings.Join(allowed_languages, " ")) }, "") )
    return;
  }
  var the_file string = os.Args[0 + 1];
  var the_lang_file string = os.Args[1 + 1];
  var the_lang string = os.Args[2 + 1];
  var the_target_dir string = os.Args[3 + 1];
  var the_target string = os.Args[4 + 1];
  fmt.Println( strings.Join([]string{ "language == ",the_lang }, "") )
  if  (r_indexof_arr_string(allowed_languages, the_lang)) < 0 {
    fmt.Println( strings.Join([]string{ "Invalid language : ",the_lang }, "") )
    /** unused:  s*/
    fmt.Println( strings.Join([]string{ "allowed languages: ",(strings.Join(allowed_languages, " ")) }, "") )
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
  var c *GoNullable = new(GoNullable); 
  c = r_io_read_file(".", the_file);
  var code *SourceCode = CreateNew_SourceCode(c.value.(string));
  code.filename = the_file; 
  var parser *RangerLispParser = CreateNew_RangerLispParser(code);
  parser.parse();
  var lcc *LiveCompiler = CreateNew_LiveCompiler();
  var node *CodeNode = parser.rootNode.value.(*CodeNode);
  var flowParser *RangerFlowParser = CreateNew_RangerFlowParser();
  var appCtx *RangerAppWriterContext = CreateNew_RangerAppWriterContext();
  var wr *CodeWriter = CreateNew_CodeWriter();
  for {
    _start := time.Now()
    flowParser.mergeImports(node, appCtx, wr);
    var lang_str *GoNullable = new(GoNullable); 
    lang_str = r_io_read_file(".", the_lang_file);
    var lang_code *SourceCode = CreateNew_SourceCode(lang_str.value.(string));
    lang_code.filename = the_lang_file; 
    var lang_parser *RangerLispParser = CreateNew_RangerLispParser(lang_code);
    lang_parser.parse();
    appCtx.langOperators.value = lang_parser.rootNode.value.(*CodeNode);
    appCtx.langOperators.has_value = true; /* detected as non-optional */
    appCtx.setRootFile(the_file);
    fmt.Println( "1. Collecting available methods." )
    flowParser.CollectMethods(node, appCtx, wr);
    if  (int64(len(appCtx.compilerErrors))) > 0 {
      CompilerInterface_static_displayCompilerErrors(appCtx);
      return;
    }
    fmt.Println( "2. Analyzing the code." )
    appCtx.targetLangName = the_lang; 
    fmt.Println( strings.Join([]string{ "selected language is ",appCtx.targetLangName }, "") )
    flowParser.StartWalk(node, appCtx, wr);
    if  (int64(len(appCtx.compilerErrors))) > 0 {
      CompilerInterface_static_displayCompilerErrors(appCtx);
      return;
    }
    fmt.Println( "3. Compiling the source code." )
    var fileSystem *CodeFileSystem = CreateNew_CodeFileSystem();
    var file *CodeFile = fileSystem.getFile(".", the_target);
    var wr_1 *GoNullable = new(GoNullable); 
    wr_1 = file.getWriter();
    var staticMethods *GoNullable = new(GoNullable); 
    var importFork *CodeWriter = wr_1.value.(*CodeWriter).fork();
    var i int64 = 0;  
    for ; i < int64(len(appCtx.definedClassList)) ; i++ {
      cName := appCtx.definedClassList[i];
      if  cName == "RangerStaticMethods" {
        staticMethods.value = r_get_string_RangerAppClassDesc(appCtx.definedClasses, cName).value;
        staticMethods.has_value = false; 
        if staticMethods.value != nil {
          staticMethods.has_value = true
        }
        continue;
      }
      var cl *GoNullable = new(GoNullable); 
      cl = r_get_string_RangerAppClassDesc(appCtx.definedClasses, cName);
      if  cl.value.(*RangerAppClassDesc).is_trait {
        continue;
      }
      if  cl.value.(*RangerAppClassDesc).is_system {
        continue;
      }
      if  cl.value.(*RangerAppClassDesc).is_system_union {
        continue;
      }
      lcc.WalkNode(cl.value.(*RangerAppClassDesc).classNode.value.(*CodeNode), appCtx, wr_1.value.(*CodeWriter));
    }
    if  staticMethods.has_value {
      lcc.WalkNode(staticMethods.value.(*RangerAppClassDesc).classNode.value.(*CodeNode), appCtx, wr_1.value.(*CodeWriter));
    }
    var i_1 int64 = 0;  
    for ; i_1 < int64(len(flowParser.collectedIntefaces)) ; i_1++ {
      ifDesc := flowParser.collectedIntefaces[i_1];
      fmt.Println( strings.Join([]string{ "should define also interface ",ifDesc.name }, "") )
      lcc.langWriter.value.(IFACE_RangerGenericClassWriter).writeInterface(ifDesc, appCtx, wr_1.value.(*CodeWriter));
    }
    var import_list []string = wr_1.value.(*CodeWriter).getImports();
    if  appCtx.targetLangName == "go" {
      importFork.out("package main", true);
      importFork.newline();
      importFork.out("import (", true);
      importFork.indent(1);
    }
    var i_2 int64 = 0;  
    for ; i_2 < int64(len(import_list)) ; i_2++ {
      codeStr := import_list[i_2];
      switch (appCtx.targetLangName ) { 
        case "go" : 
          if  (int64(codeStr[0])) == (int64(([]byte("_")[0]))) {
            importFork.out(strings.Join([]string{ (strings.Join([]string{ " _ \"",(codeStr[1:(int64(len(codeStr)))]) }, "")),"\"" }, ""), true);
          } else {
            importFork.out(strings.Join([]string{ (strings.Join([]string{ "\"",codeStr }, "")),"\"" }, ""), true);
          }
        case "rust" : 
          importFork.out(strings.Join([]string{ (strings.Join([]string{ "use ",codeStr }, "")),";" }, ""), true);
        case "cpp" : 
          importFork.out(strings.Join([]string{ (strings.Join([]string{ "#include  ",codeStr }, "")),"" }, ""), true);
        default: 
          importFork.out(strings.Join([]string{ (strings.Join([]string{ "import ",codeStr }, "")),"" }, ""), true);
      }
    }
    if  appCtx.targetLangName == "go" {
      importFork.indent(-1);
      importFork.out(")", true);
    }
    fileSystem.saveTo(the_target_dir);
    fmt.Println( "Ready." )
    CompilerInterface_static_displayCompilerErrors(appCtx);
    fmt.Println("Total time", time.Since(_start) )
    break;
  }
}
