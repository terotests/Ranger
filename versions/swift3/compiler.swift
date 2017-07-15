import Foundation
import CoreFoundation

func r_index_of ( arr:[String] , elem: String) -> Int { 
  if let idx = arr.index(of: elem) { 
      return idx 
  } else { 
        return -1 
  }  
}

func r_dir_exists ( dirName:String ) -> Bool {
    let fileManager = FileManager.default
    var isDir : ObjCBool = false
    if fileManager.fileExists(atPath: dirName, isDirectory:&isDir) {
        if isDir.boolValue {
            return true
        } else {
            return false
        }
    } else {
        return false
    }    
}
    

func r_write_file ( dirName:String, dataToWrite:String ) {
    do {
        let fileManager = FileManager.default
        let url = NSURL(fileURLWithPath: fileManager.currentDirectoryPath)
        let path = url.appendingPathComponent(dirName)
        try dataToWrite.write(to:path!, atomically: false, encoding: String.Encoding.utf8)
    } catch {

    }
}
    

func r_index_of ( arr:[CodeNode] , elem: CodeNode) -> Int { 
  if let idx = arr.index(of: elem) { 
      return idx 
  } else { 
        return -1 
  }  
}

func r_read_file ( dirName:String ) -> String? {
    let res: String?
    do {
        res = try String(contentsOfFile:dirName)
    } catch {
        res = nil
    }
    return res
}
    

func r_file_exists ( fileName:String ) -> Bool {
    let fileManager = FileManager.default
    var isDir : ObjCBool = false
    if fileManager.fileExists(atPath: fileName, isDirectory:&isDir) {
        if isDir.boolValue {
            return false
        } else {
            return true
        }
    } else {
        return false
    }    
}
    
func ==(l: RangerAppTodo, r: RangerAppTodo) -> Bool {
  return l === r
}
class RangerAppTodo : Equatable  { 
  var description : String = ""
  var todonode : CodeNode?
}
func ==(l: RangerCompilerMessage, r: RangerCompilerMessage) -> Bool {
  return l === r
}
class RangerCompilerMessage : Equatable  { 
  var error_level : Int = 0     /** note: unused */
  var code_line : Int = 0     /** note: unused */
  var fileName : String = ""     /** note: unused */
  var description : String = ""
  var node : CodeNode?
}
func ==(l: RangerParamEventHandler, r: RangerParamEventHandler) -> Bool {
  return l === r
}
class RangerParamEventHandler : Equatable  { 
  func callback(param : RangerAppParamDesc) -> Void {
  }
}
func ==(l: RangerParamEventList, r: RangerParamEventList) -> Bool {
  return l === r
}
class RangerParamEventList : Equatable  { 
  var list : [RangerParamEventHandler] = [RangerParamEventHandler]()
}
func ==(l: RangerParamEventMap, r: RangerParamEventMap) -> Bool {
  return l === r
}
class RangerParamEventMap : Equatable  { 
  var events : [String:RangerParamEventList] = [String:RangerParamEventList]()
  func clearAllEvents() -> Void {
  }
  func addEvent(name : String, e : RangerParamEventHandler) -> Void {
    if ( (events[name] != nil) == false ) {
      events[name] = RangerParamEventList()
    }
    let list : RangerParamEventList = (events[name])!
    list.list.append(e)
  }
  func fireEvent(name : String, from : RangerAppParamDesc) -> Void {
    if ( events[name] != nil ) {
      let list : RangerParamEventList = (events[name])!
      for ( _ , ev ) in list.list.enumerated() {
        ev.callback(param : from)
      }
    }
  }
}
func ==(l: RangerAppArrayValue, r: RangerAppArrayValue) -> Bool {
  return l === r
}
class RangerAppArrayValue : Equatable  { 
  var value_type : Int = 0     /** note: unused */
  var value_type_name : String = ""     /** note: unused */
  var values : [RangerAppValue] = [RangerAppValue]()     /** note: unused */
}
func ==(l: RangerAppHashValue, r: RangerAppHashValue) -> Bool {
  return l === r
}
class RangerAppHashValue : Equatable  { 
  var value_type : Int = 0     /** note: unused */
  var key_type_name : String = ""     /** note: unused */
  var value_type_name : String = ""     /** note: unused */
  var s_values : [String:RangerAppValue] = [String:RangerAppValue]()     /** note: unused */
  var i_values : [Int:RangerAppValue] = [Int:RangerAppValue]()     /** note: unused */
  var b_values : [Bool:RangerAppValue] = [Bool:RangerAppValue]()     /** note: unused */
  var d_values : [Double:RangerAppValue] = [Double:RangerAppValue]()     /** note: unused */
}
func ==(l: RangerAppValue, r: RangerAppValue) -> Bool {
  return l === r
}
class RangerAppValue : Equatable  { 
  var double_value : Double = 0.0     /** note: unused */
  var string_value : String = ""     /** note: unused */
  var int_value : Int = 0     /** note: unused */
  var boolean_value : Bool = false     /** note: unused */
  var arr : RangerAppArrayValue?     /** note: unused */
  var hash : RangerAppHashValue?     /** note: unused */
}
func ==(l: RangerRefForce, r: RangerRefForce) -> Bool {
  return l === r
}
class RangerRefForce : Equatable  { 
  var strength : Int = 0
  var lifetime : Int = 1
  var changer : CodeNode?
}
func ==(l: RangerAppParamDesc, r: RangerAppParamDesc) -> Bool {
  return l === r
}
class RangerAppParamDesc : Equatable  { 
  var name : String = ""
  var value : RangerAppValue?     /** note: unused */
  var compiledName : String = ""
  var debugString : String = ""
  var ref_cnt : Int = 0
  var init_cnt : Int = 0
  var set_cnt : Int = 0
  var return_cnt : Int = 0
  var prop_assign_cnt : Int = 0     /** note: unused */
  var value_type : Int = 0
  var has_default : Bool = false     /** note: unused */
  var def_value : CodeNode?
  var default_value : RangerNodeValue?     /** note: unused */
  var isThis : Bool = false     /** note: unused */
  var classDesc : RangerAppClassDesc?     /** note: unused */
  var fnDesc : RangerAppFunctionDesc?     /** note: unused */
  var ownerHistory : [RangerRefForce] = [RangerRefForce]()
  var varType : Int = 0
  var refType : Int = 0
  var initRefType : Int = 0
  var isParam : Bool?     /** note: unused */
  var paramIndex : Int = 0     /** note: unused */
  var is_optional : Bool = false
  var is_mutating : Bool = false     /** note: unused */
  var is_set : Bool = false     /** note: unused */
  var is_class_variable : Bool = false
  var is_captured : Bool = false
  var node : CodeNode?
  var nameNode : CodeNode?
  var description : String = ""     /** note: unused */
  var git_doc : String = ""     /** note: unused */
  var has_events : Bool = false
  var eMap : RangerParamEventMap?
  func addEvent(name : String, e : RangerParamEventHandler) -> Void {
    if ( has_events == false ) {
      eMap = RangerParamEventMap();
      has_events = true;
    }
    eMap!.addEvent(name : name, e : e)
  }
  func changeStrength(newStrength : Int, lifeTime : Int, changer : CodeNode) -> Void {
    let entry : RangerRefForce = RangerRefForce()
    entry.strength = newStrength;
    entry.lifetime = lifeTime;
    entry.changer = changer;
    ownerHistory.append(entry)
  }
  func isProperty() -> Bool {
    return true;
  }
  func isClass() -> Bool {
    return false;
  }
  func doesInherit() -> Bool {
    return false;
  }
  func isAllocatedType() -> Bool {
    if ( nameNode != nil  ) {
      if ( nameNode!.eval_type != 0 ) {
        if ( nameNode!.eval_type == 6 ) {
          return true;
        }
        if ( nameNode!.eval_type == 7 ) {
          return true;
        }
        if ( (((((nameNode!.eval_type == 13) || (nameNode!.eval_type == 12)) || (nameNode!.eval_type == 4)) || (nameNode!.eval_type == 2)) || (nameNode!.eval_type == 5)) || (nameNode!.eval_type == 3) ) {
          return false;
        }
        if ( nameNode!.eval_type == 11 ) {
          return false;
        }
        return true;
      }
      if ( nameNode!.eval_type == 11 ) {
        return false;
      }
      if ( nameNode!.value_type == 9 ) {
        if ( false == nameNode!.isPrimitive() ) {
          return true;
        }
      }
      if ( nameNode!.value_type == 6 ) {
        return true;
      }
      if ( nameNode!.value_type == 7 ) {
        return true;
      }
    }
    return false;
  }
  func moveRefTo(node : CodeNode, target : RangerAppParamDesc, ctx : RangerAppWriterContext) -> Void {
    if ( node.ref_change_done ) {
      return;
    }
    if ( false == target.isAllocatedType() ) {
      return;
    }
    if ( false == self.isAllocatedType() ) {
      return;
    }
    node.ref_change_done = true;
    let other_s : Int = target.getStrength()
    let my_s : Int = self.getStrength()
    var my_lifetime : Int = self.getLifetime()
    let other_lifetime : Int = target.getLifetime()
    var a_lives : Bool = false
    var b_lives : Bool = false
    let tmp_var : Bool = nameNode!.hasFlag(flagName : "temp")
    if ( target.nameNode != nil  ) {
      if ( target.nameNode!.hasFlag(flagName : "lives") ) {
        my_lifetime = 2;
        b_lives = true;
      }
    }
    if ( nameNode != nil  ) {
      if ( nameNode!.hasFlag(flagName : "lives") ) {
        my_lifetime = 2;
        a_lives = true;
      }
    }
    if ( other_s > 0 ) {
      if ( my_s == 1 ) {
        var lt : Int = my_lifetime
        if ( other_lifetime > my_lifetime ) {
          lt = other_lifetime;
        }
        self.changeStrength(newStrength : 0, lifeTime : lt, changer : node)
      } else {
        if ( my_s == 0 ) {
          if ( tmp_var == false ) {
            ctx.addError(targetnode : node, descr : "Can not move a weak reference to a strong target, at " + node.getCode())
            print("can not move weak refs to strong target:")
            self.debugRefChanges()
          }
        } else {
          ctx.addError(targetnode : node, descr : "Can not move immutable reference to a strong target, evald type " + nameNode!.eval_type_name)
        }
      }
    } else {
      if ( a_lives || b_lives ) {
      } else {
        if ( (my_lifetime < other_lifetime) && (return_cnt == 0) ) {
          if ( nameNode!.hasFlag(flagName : "returnvalue") == false ) {
            ctx.addError(targetnode : node, descr : "Can not create a weak reference if target has longer lifetime than original, current lifetime == " + String(my_lifetime))
          }
        }
      }
    }
  }
  func originalStrength() -> Int {
    let __len : Int = ownerHistory.count
    if ( __len > 0 ) {
      let firstEntry : RangerRefForce = ownerHistory[0]
      return firstEntry.strength;
    }
    return 1;
  }
  func getLifetime() -> Int {
    let __len : Int = ownerHistory.count
    if ( __len > 0 ) {
      let lastEntry : RangerRefForce = ownerHistory[(__len - 1)]
      return lastEntry.lifetime;
    }
    return 1;
  }
  func getStrength() -> Int {
    let __len : Int = ownerHistory.count
    if ( __len > 0 ) {
      let lastEntry : RangerRefForce = ownerHistory[(__len - 1)]
      return lastEntry.strength;
    }
    return 1;
  }
  func debugRefChanges() -> Void {
    print(("variable " + name) + " ref history : ")
    for ( _ , h ) in ownerHistory.enumerated() {
      print(((" => change to " + String(h.strength)) + " by ") + h.changer!.getCode())
    }
  }
  func pointsToObject(ctx : RangerAppWriterContext) -> Bool {
    if ( nameNode != nil  ) {
      var is_primitive : Bool = false
      switch (nameNode!.array_type) {
        case "string" : 
          is_primitive = true;
        case "int" : 
          is_primitive = true;
        case "boolean" : 
          is_primitive = true;
        case "double" : 
          is_primitive = true;
        default :
          break
      }
      if ( is_primitive ) {
        return false;
      }
      if ( (nameNode!.value_type == 6) || (nameNode!.value_type == 7) ) {
        var is_object : Bool = true
        switch (nameNode!.array_type) {
          case "string" : 
            is_object = false;
          case "int" : 
            is_object = false;
          case "boolean" : 
            is_object = false;
          case "double" : 
            is_object = false;
          default :
            break
        }
        return is_object;
      }
      if ( nameNode!.value_type == 9 ) {
        var is_object_1 : Bool = true
        switch (nameNode!.type_name) {
          case "string" : 
            is_object_1 = false;
          case "int" : 
            is_object_1 = false;
          case "boolean" : 
            is_object_1 = false;
          case "double" : 
            is_object_1 = false;
          default :
            break
        }
        if ( ctx.isEnumDefined(n : nameNode!.type_name) ) {
          return false;
        }
        return is_object_1;
      }
    }
    return false;
  }
  func isObject() -> Bool {
    if ( nameNode != nil  ) {
      if ( nameNode!.value_type == 9 ) {
        if ( false == nameNode!.isPrimitive() ) {
          return true;
        }
      }
    }
    return false;
  }
  func isArray() -> Bool {
    if ( nameNode != nil  ) {
      if ( nameNode!.value_type == 6 ) {
        return true;
      }
    }
    return false;
  }
  func isHash() -> Bool {
    if ( nameNode != nil  ) {
      if ( nameNode!.value_type == 7 ) {
        return true;
      }
    }
    return false;
  }
  func isPrimitive() -> Bool {
    if ( nameNode != nil  ) {
      return nameNode!.isPrimitive();
    }
    return false;
  }
  func getRefTypeName() -> String {
    switch (refType) {
      case 0 : 
        return "NoType";
      case 1 : 
        return "Weak";
      default :
        break
    }
    return "";
  }
  func getVarTypeName() -> String {
    switch (refType) {
      case 0 : 
        return "NoType";
      case 1 : 
        return "This";
      default :
        break
    }
    return "";
  }
  func getTypeName() -> String {
    let s : String = nameNode!.type_name
    return s;
  }
}
func ==(l: RangerAppFunctionDesc, r: RangerAppFunctionDesc) -> Bool {
  return l === r
}
class RangerAppFunctionDesc : RangerAppParamDesc { 
  // WAS DECLARED : name
  // WAS DECLARED : ref_cnt
  // WAS DECLARED : node
  // WAS DECLARED : nameNode
  var fnBody : CodeNode?
  var params : [RangerAppParamDesc] = [RangerAppParamDesc]()
  var return_value : RangerAppParamDesc?     /** note: unused */
  var is_method : Bool = false     /** note: unused */
  var is_static : Bool = false
  var container_class : RangerAppClassDesc?     /** note: unused */
  // WAS DECLARED : refType
  var fnCtx : RangerAppWriterContext?
  override func isClass() -> Bool {
    return false;
  }
  override func isProperty() -> Bool {
    return false;
  }
}
func ==(l: RangerAppMethodVariants, r: RangerAppMethodVariants) -> Bool {
  return l === r
}
class RangerAppMethodVariants : Equatable  { 
  var name : String = ""     /** note: unused */
  var variants : [RangerAppFunctionDesc] = [RangerAppFunctionDesc]()
}
func ==(l: RangerAppInterfaceImpl, r: RangerAppInterfaceImpl) -> Bool {
  return l === r
}
class RangerAppInterfaceImpl : Equatable  { 
  var name : String = ""     /** note: unused */
  var typeParams : CodeNode?     /** note: unused */
}
func ==(l: RangerAppClassDesc, r: RangerAppClassDesc) -> Bool {
  return l === r
}
class RangerAppClassDesc : RangerAppParamDesc { 
  // WAS DECLARED : name
  var is_system : Bool = false
  // WAS DECLARED : compiledName
  var systemNames : [String:String] = [String:String]()
  var systemInfo : CodeNode?     /** note: unused */
  var is_interface : Bool = false
  var is_system_union : Bool = false
  var is_template : Bool = false
  var is_serialized : Bool = false
  var is_trait : Bool = false
  var generic_params : CodeNode?     /** note: unused */
  var ctx : RangerAppWriterContext?
  var variables : [RangerAppParamDesc] = [RangerAppParamDesc]()
  var capturedLocals : [RangerAppParamDesc] = [RangerAppParamDesc]()
  var methods : [RangerAppFunctionDesc] = [RangerAppFunctionDesc]()
  var defined_methods : [String:Bool] = [String:Bool]()
  var static_methods : [RangerAppFunctionDesc] = [RangerAppFunctionDesc]()
  var defined_static_methods : [String:Bool] = [String:Bool]()
  var defined_variants : [String] = [String]()
  var method_variants : [String:RangerAppMethodVariants] = [String:RangerAppMethodVariants]()
  var has_constructor : Bool = false
  var constructor_node : CodeNode?
  var constructor_fn : RangerAppFunctionDesc?
  var has_destructor : Bool = false     /** note: unused */
  var destructor_node : CodeNode?     /** note: unused */
  var destructor_fn : RangerAppFunctionDesc?     /** note: unused */
  var extends_classes : [String] = [String]()
  var implements_interfaces : [String] = [String]()
  var consumes_traits : [String] = [String]()
  var is_union_of : [String] = [String]()
  // WAS DECLARED : nameNode
  var classNode : CodeNode?
  var contr_writers : [CodeWriter] = [CodeWriter]()     /** note: unused */
  var is_inherited : Bool = false
  override func isClass() -> Bool {
    return true;
  }
  override func isProperty() -> Bool {
    return false;
  }
  override func doesInherit() -> Bool {
    return is_inherited;
  }
  func isSameOrParentClass(class_name : String, ctx : RangerAppWriterContext) -> Bool {
    if ( ctx.isPrimitiveType(typeName : class_name) ) {
      if ( (r_index_of(arr:is_union_of, elem:class_name)) >= 0 ) {
        return true;
      }
      return false;
    }
    if ( class_name == name ) {
      return true;
    }
    if ( (r_index_of(arr:extends_classes, elem:class_name)) >= 0 ) {
      return true;
    }
    if ( (r_index_of(arr:consumes_traits, elem:class_name)) >= 0 ) {
      return true;
    }
    if ( (r_index_of(arr:implements_interfaces, elem:class_name)) >= 0 ) {
      return true;
    }
    if ( (r_index_of(arr:is_union_of, elem:class_name)) >= 0 ) {
      return true;
    }
    for ( _ , c_name ) in extends_classes.enumerated() {
      let c : RangerAppClassDesc = ctx.findClass(name : c_name)
      if ( c.isSameOrParentClass(class_name : class_name, ctx : ctx) ) {
        return true;
      }
    }
    for ( _ , c_name_1 ) in consumes_traits.enumerated() {
      let c_1 : RangerAppClassDesc = ctx.findClass(name : c_name_1)
      if ( c_1.isSameOrParentClass(class_name : class_name, ctx : ctx) ) {
        return true;
      }
    }
    for ( _ , i_name ) in implements_interfaces.enumerated() {
      let c_2 : RangerAppClassDesc = ctx.findClass(name : i_name)
      if ( c_2.isSameOrParentClass(class_name : class_name, ctx : ctx) ) {
        return true;
      }
    }
    for ( _ , i_name_1 ) in is_union_of.enumerated() {
      if ( self.isSameOrParentClass(class_name : i_name_1, ctx : ctx) ) {
        return true;
      }
      if ( ctx.isDefinedClass(name : i_name_1) ) {
        let c_3 : RangerAppClassDesc = ctx.findClass(name : i_name_1)
        if ( c_3.isSameOrParentClass(class_name : class_name, ctx : ctx) ) {
          return true;
        }
      } else {
        print("did not find union class " + i_name_1)
      }
    }
    return false;
  }
  func hasOwnMethod(m_name : String) -> Bool {
    if ( defined_methods[m_name] != nil ) {
      return true;
    }
    return false;
  }
  func hasMethod(m_name : String) -> Bool {
    if ( defined_methods[m_name] != nil ) {
      return true;
    }
    for ( _ , cname ) in extends_classes.enumerated() {
      let cDesc : RangerAppClassDesc = ctx!.findClass(name : cname)
      if ( cDesc.hasMethod(m_name : m_name) ) {
        return cDesc.hasMethod(m_name : m_name);
      }
    }
    return false;
  }
  func findMethod(f_name : String) -> RangerAppFunctionDesc? {
    var res : RangerAppFunctionDesc?
    for ( _ , m ) in methods.enumerated() {
      if ( m.name == f_name ) {
        res = m;
        return res;
      }
    }
    for ( _ , cname ) in extends_classes.enumerated() {
      let cDesc : RangerAppClassDesc = ctx!.findClass(name : cname)
      if ( cDesc.hasMethod(m_name : f_name) ) {
        return cDesc.findMethod(f_name : f_name);
      }
    }
    return res;
  }
  func hasStaticMethod(m_name : String) -> Bool {
    return defined_static_methods[m_name] != nil;
  }
  func findStaticMethod(f_name : String) -> RangerAppFunctionDesc? {
    var e : RangerAppFunctionDesc?
    for ( _ , m ) in static_methods.enumerated() {
      if ( m.name == f_name ) {
        e = m;
        return e;
      }
    }
    for ( _ , cname ) in extends_classes.enumerated() {
      let cDesc : RangerAppClassDesc = ctx!.findClass(name : cname)
      if ( cDesc.hasStaticMethod(m_name : f_name) ) {
        return cDesc.findStaticMethod(f_name : f_name);
      }
    }
    return e;
  }
  func findVariable(f_name : String) -> RangerAppParamDesc? {
    var e : RangerAppParamDesc?
    for ( _ , m ) in variables.enumerated() {
      if ( m.name == f_name ) {
        e = m;
        return e;
      }
    }
    for ( _ , cname ) in extends_classes.enumerated() {
      let cDesc : RangerAppClassDesc = ctx!.findClass(name : cname)
      return cDesc.findVariable(f_name : f_name);
    }
    return e;
  }
  func addParentClass(p_name : String) -> Void {
    extends_classes.append(p_name)
  }
  func addVariable(desc : RangerAppParamDesc) -> Void {
    variables.append(desc)
  }
  func addMethod(desc : RangerAppFunctionDesc) -> Void {
    defined_methods[desc.name] = true
    methods.append(desc)
    let defVs : RangerAppMethodVariants? = method_variants[desc.name]
    if ( defVs == nil ) {
      let new_v : RangerAppMethodVariants = RangerAppMethodVariants()
      method_variants[desc.name] = new_v
      defined_variants.append(desc.name)
      new_v.variants.append(desc)
    } else {
      let new_v2 : RangerAppMethodVariants = defVs!
      new_v2.variants.append(desc)
    }
  }
  func addStaticMethod(desc : RangerAppFunctionDesc) -> Void {
    defined_static_methods[desc.name] = true
    static_methods.append(desc)
  }
}
func ==(l: RangerTypeClass, r: RangerTypeClass) -> Bool {
  return l === r
}
class RangerTypeClass : Equatable  { 
  var name : String = ""     /** note: unused */
  var compiledName : String = ""     /** note: unused */
  var value_type : Int = 0     /** note: unused */
  var type_name : String?     /** note: unused */
  var key_type : String?     /** note: unused */
  var array_type : String?     /** note: unused */
  var is_primitive : Bool = false     /** note: unused */
  var is_mutable : Bool = false     /** note: unused */
  var is_optional : Bool = false     /** note: unused */
  var is_generic : Bool = false     /** note: unused */
  var is_lambda : Bool = false     /** note: unused */
  var nameNode : CodeNode?     /** note: unused */
  var templateParams : CodeNode?     /** note: unused */
}
func ==(l: SourceCode, r: SourceCode) -> Bool {
  return l === r
}
class SourceCode : Equatable  { 
  var code : String = ""
  var lines : [String] = [String]()
  var filename : String = ""
  init(code_str : String ) {
    code = code_str;
    lines = code_str.components( separatedBy : "\n");
  }
  func getLineString(line_index : Int) -> String {
    if ( (lines.count) > line_index ) {
      return lines[line_index];
    }
    return "";
  }
  func getLine(sp : Int) -> Int {
    var cnt : Int = 0
    for ( i , str ) in lines.enumerated() {
      cnt = cnt + ((str.characters.count) + 1);
      if ( cnt > sp ) {
        return i;
      }
    }
    return -1;
  }
  func getColumnStr(sp : Int) -> String {
    var cnt : Int = 0
    var last : Int = 0
    for ( _ , str ) in lines.enumerated() {
      cnt = cnt + ((str.characters.count) + 1);
      if ( cnt > sp ) {
        var ll : Int = sp - last
        var ss : String = ""
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
  func getColumn(sp : Int) -> Int {
    var cnt : Int = 0
    var last : Int = 0
    for ( _ , str ) in lines.enumerated() {
      cnt = cnt + ((str.characters.count) + 1);
      if ( cnt > sp ) {
        return sp - last;
      }
      last = cnt;
    }
    return -1;
  }
}
func ==(l: CodeNode, r: CodeNode) -> Bool {
  return l === r
}
class CodeNode : Equatable  { 
  var code : SourceCode?
  var sp : Int = 0
  var ep : Int = 0
  var has_operator : Bool = false
  var disabled_node : Bool = false
  var op_index : Int = 0
  var is_system_class : Bool = false
  var mutable_def : Bool = false
  var expression : Bool = false
  var vref : String = ""
  var is_block_node : Bool = false
  var infix_operator : Bool = false
  var infix_node : CodeNode?
  var infix_subnode : Bool = false
  var has_lambda : Bool = false
  var has_lambda_call : Bool = false
  var operator_pred : Int = 0
  var to_the_right : Bool = false
  var right_node : CodeNode?
  var type_type : String = ""
  var type_name : String = ""
  var key_type : String = ""
  var array_type : String = ""
  var ns : [String] = [String]()
  var has_vref_annotation : Bool = false
  var vref_annotation : CodeNode?
  var has_type_annotation : Bool = false
  var type_annotation : CodeNode?
  var parsed_type : Int = 0
  var value_type : Int = 0
  var ref_type : Int = 0
  var ref_need_assign : Int = 0     /** note: unused */
  var double_value : Double = 0.0
  var string_value : String = ""
  var int_value : Int = 0
  var boolean_value : Bool = false
  var expression_value : CodeNode?
  var props : [String:CodeNode] = [String:CodeNode]()
  var prop_keys : [String] = [String]()
  var comments : [CodeNode] = [CodeNode]()
  var children : [CodeNode] = [CodeNode]()
  var parent : CodeNode?
  var typeClass : RangerTypeClass?
  var lambda_ctx : RangerAppWriterContext?
  var nsp : [RangerAppParamDesc] = [RangerAppParamDesc]()
  var eval_type : Int = 0
  var eval_type_name : String = ""
  var eval_key_type : String = ""
  var eval_array_type : String = ""
  var eval_function : CodeNode?
  var flow_done : Bool = false
  var ref_change_done : Bool = false
  var eval_type_node : CodeNode?     /** note: unused */
  var didReturnAtIndex : Int = -1
  var hasVarDef : Bool = false
  var hasClassDescription : Bool = false
  var hasNewOper : Bool = false
  var clDesc : RangerAppClassDesc?
  var hasFnCall : Bool = false
  var fnDesc : RangerAppFunctionDesc?
  var hasParamDesc : Bool = false
  var paramDesc : RangerAppParamDesc?
  var ownParamDesc : RangerAppParamDesc?
  var evalCtx : RangerAppWriterContext?
  var evalState : NodeEvalState?     /** note: unused */
  init(source : SourceCode, start : Int, end : Int ) {
    sp = start;
    ep = end;
    code = source;
  }
  func getParsedString() -> String {
    return code!.code[code!.code.index(code!.code.startIndex, offsetBy:sp)..<code!.code.index(code!.code.startIndex, offsetBy:ep)];
  }
  func getFilename() -> String {
    return code!.filename;
  }
  func getFlag(flagName : String) -> CodeNode? {
    var res : CodeNode?
    if ( false == has_vref_annotation ) {
      return res;
    }
    for ( _ , ch ) in vref_annotation!.children.enumerated() {
      if ( ch.vref == flagName ) {
        res = ch;
        return res;
      }
    }
    return res;
  }
  func hasFlag(flagName : String) -> Bool {
    if ( false == has_vref_annotation ) {
      return false;
    }
    for ( _ , ch ) in vref_annotation!.children.enumerated() {
      if ( ch.vref == flagName ) {
        return true;
      }
    }
    return false;
  }
  func setFlag(flagName : String) -> Void {
    if ( false == has_vref_annotation ) {
      vref_annotation = CodeNode(source : code!, start : sp, end : ep);
    }
    if ( self.hasFlag(flagName : flagName) ) {
      return;
    }
    let flag : CodeNode = CodeNode(source : code!, start : sp, end : ep)
    flag.vref = flagName;
    flag.value_type = 9;
    vref_annotation!.children.append(flag)
    has_vref_annotation = true;
  }
  func getTypeInformationString() -> String {
    var s : String = ""
    if ( (vref.characters.count) > 0 ) {
      s = ((s + "<vref:") + vref) + ">";
    } else {
      s = s + "<no.vref>";
    }
    if ( (type_name.characters.count) > 0 ) {
      s = ((s + "<type_name:") + type_name) + ">";
    } else {
      s = s + "<no.type_name>";
    }
    if ( (array_type.characters.count) > 0 ) {
      s = ((s + "<array_type:") + array_type) + ">";
    } else {
      s = s + "<no.array_type>";
    }
    if ( (key_type.characters.count) > 0 ) {
      s = ((s + "<key_type:") + key_type) + ">";
    } else {
      s = s + "<no.key_type>";
    }
    switch (value_type) {
      case 5 : 
        s = s + "<value_type=Boolean>";
      case 4 : 
        s = s + "<value_type=String>";
      default :
        break
    }
    return s;
  }
  func getLine() -> Int {
    return code!.getLine(sp : sp);
  }
  func getLineString(line_index : Int) -> String {
    return code!.getLineString(line_index : line_index);
  }
  func getColStartString() -> String {
    return code!.getColumnStr(sp : sp);
  }
  func getLineAsString() -> String {
    let idx : Int = self.getLine()
    let line_name_idx : Int = idx + 1
    return (((self.getFilename() + ", line ") + String(line_name_idx)) + " : ") + code!.getLineString(line_index : idx);
  }
  func getPositionalString() -> String {
    if ( (ep > sp) && ((ep - sp) < 50) ) {
      var start : Int = sp
      var end : Int = ep
      start = start - 100;
      end = end + 50;
      if ( start < 0 ) {
        start = 0;
      }
      if ( end >= (code!.code.characters.count) ) {
        end = (code!.code.characters.count) - 1;
      }
      return code!.code[code!.code.index(code!.code.startIndex, offsetBy:start)..<code!.code.index(code!.code.startIndex, offsetBy:end)];
    }
    return "";
  }
  func isParsedAsPrimitive() -> Bool {
    if ( (((((parsed_type == 2) || (parsed_type == 4)) || (parsed_type == 3)) || (parsed_type == 12)) || (parsed_type == 13)) || (parsed_type == 5) ) {
      return true;
    }
    return false;
  }
  func isPrimitive() -> Bool {
    if ( (((((value_type == 2) || (value_type == 4)) || (value_type == 3)) || (value_type == 12)) || (value_type == 13)) || (value_type == 5) ) {
      return true;
    }
    return false;
  }
  func isPrimitiveType() -> Bool {
    let tn : String = type_name
    if ( (((((tn == "double") || (tn == "string")) || (tn == "int")) || (tn == "char")) || (tn == "charbuffer")) || (tn == "boolean") ) {
      return true;
    }
    return false;
  }
  func isAPrimitiveType() -> Bool {
    var tn : String = type_name
    if ( (value_type == 6) || (value_type == 7) ) {
      tn = array_type;
    }
    if ( (((((tn == "double") || (tn == "string")) || (tn == "int")) || (tn == "char")) || (tn == "charbuffer")) || (tn == "boolean") ) {
      return true;
    }
    return false;
  }
  func getFirst() -> CodeNode {
    return children[0];
  }
  func getSecond() -> CodeNode {
    return children[1];
  }
  func getThird() -> CodeNode {
    return children[2];
  }
  func isSecondExpr() -> Bool {
    if ( (children.count) > 1 ) {
      let second : CodeNode = children[1]
      if ( second.expression ) {
        return true;
      }
    }
    return false;
  }
  func getOperator() -> String {
    let s : String = ""
    if ( (children.count) > 0 ) {
      let fc : CodeNode = children[0]
      if ( fc.value_type == 9 ) {
        return fc.vref;
      }
    }
    return s;
  }
  func getVRefAt(idx : Int) -> String {
    let s : String = ""
    if ( (children.count) > idx ) {
      let fc : CodeNode = children[idx]
      return fc.vref;
    }
    return s;
  }
  func getStringAt(idx : Int) -> String {
    let s : String = ""
    if ( (children.count) > idx ) {
      let fc : CodeNode = children[idx]
      if ( fc.value_type == 4 ) {
        return fc.string_value;
      }
    }
    return s;
  }
  func hasExpressionProperty(name : String) -> Bool {
    let ann : CodeNode? = props[name]
    if ( ann != nil  ) {
      return ann!.expression;
    }
    return false;
  }
  func getExpressionProperty(name : String) -> CodeNode? {
    let ann : CodeNode? = props[name]
    if ( ann != nil  ) {
      return ann;
    }
    return ann;
  }
  func hasIntProperty(name : String) -> Bool {
    let ann : CodeNode? = props[name]
    if ( ann != nil  ) {
      let fc : CodeNode = ann!.children[0]
      if ( fc.value_type == 3 ) {
        return true;
      }
    }
    return false;
  }
  func getIntProperty(name : String) -> Int {
    let ann : CodeNode? = props[name]
    if ( ann != nil  ) {
      let fc : CodeNode = ann!.children[0]
      if ( fc.value_type == 3 ) {
        return fc.int_value;
      }
    }
    return 0;
  }
  func hasDoubleProperty(name : String) -> Bool {
    let ann : CodeNode? = props[name]
    if ( ann != nil  ) {
      if ( ann!.value_type == 2 ) {
        return true;
      }
    }
    return false;
  }
  func getDoubleProperty(name : String) -> Double {
    let ann : CodeNode? = props[name]
    if ( ann != nil  ) {
      if ( ann!.value_type == 2 ) {
        return ann!.double_value;
      }
    }
    return 0.0;
  }
  func hasStringProperty(name : String) -> Bool {
    if ( false == (props[name] != nil) ) {
      return false;
    }
    let ann : CodeNode? = props[name]
    if ( ann != nil  ) {
      if ( ann!.value_type == 4 ) {
        return true;
      }
    }
    return false;
  }
  func getStringProperty(name : String) -> String {
    let ann : CodeNode? = props[name]
    if ( ann != nil  ) {
      if ( ann!.value_type == 4 ) {
        return ann!.string_value;
      }
    }
    return "";
  }
  func hasBooleanProperty(name : String) -> Bool {
    let ann : CodeNode? = props[name]
    if ( ann != nil  ) {
      if ( ann!.value_type == 5 ) {
        return true;
      }
    }
    return false;
  }
  func getBooleanProperty(name : String) -> Bool {
    let ann : CodeNode? = props[name]
    if ( ann != nil  ) {
      if ( ann!.value_type == 5 ) {
        return ann!.boolean_value;
      }
    }
    return false;
  }
  func isFirstTypeVref(vrefName : String) -> Bool {
    if ( (children.count) > 0 ) {
      let fc : CodeNode = children[0]
      if ( fc.value_type == 9 ) {
        return true;
      }
    }
    return false;
  }
  func isFirstVref(vrefName : String) -> Bool {
    if ( (children.count) > 0 ) {
      let fc : CodeNode = children[0]
      if ( fc.vref == vrefName ) {
        return true;
      }
    }
    return false;
  }
  func getString() -> String {
    return code!.code[code!.code.index(code!.code.startIndex, offsetBy:sp)..<code!.code.index(code!.code.startIndex, offsetBy:ep)];
  }
  func walk() -> Void {
    switch (value_type) {
      case 2 : 
        print("Double : " + String(double_value))
      case 4 : 
        print("String : " + string_value)
      default :
        break
    }
    if ( expression ) {
      print("(")
    } else {
      print(code!.code[code!.code.index(code!.code.startIndex, offsetBy:sp)..<code!.code.index(code!.code.startIndex, offsetBy:ep)])
    }
    for ( _ , item ) in children.enumerated() {
      item.walk()
    }
    if ( expression ) {
      print(")")
    }
  }
  func writeCode(wr : CodeWriter) -> Void {
    switch (value_type) {
      case 2 : 
        wr.out(str : String(double_value), newLine : false)
      case 4 : 
        wr.out(str : (((String( Character( UnicodeScalar(34 )! )))) + string_value) + ((String( Character( UnicodeScalar(34 )! )))), newLine : false)
      case 3 : 
        wr.out(str : "" + String(int_value), newLine : false)
      case 5 : 
        if ( boolean_value ) {
          wr.out(str : "true", newLine : false)
        } else {
          wr.out(str : "false", newLine : false)
        }
      case 9 : 
        wr.out(str : vref, newLine : false)
      case 7 : 
        wr.out(str : vref, newLine : false)
        wr.out(str : (((":[" + key_type) + ":") + array_type) + "]", newLine : false)
      case 6 : 
        wr.out(str : vref, newLine : false)
        wr.out(str : (":[" + array_type) + "]", newLine : false)
      default :
        break
    }
    if ( expression ) {
      wr.out(str : "(", newLine : false)
      for ( _ , ch ) in children.enumerated() {
        ch.writeCode(wr : wr)
      }
      wr.out(str : ")", newLine : false)
    }
  }
  func getCode() -> String {
    let wr : CodeWriter = CodeWriter()
    self.writeCode(wr : wr)
    return wr.getCode();
  }
  func rebuildWithType(match : RangerArgMatch, changeVref : Bool) -> CodeNode {
    let newNode : CodeNode = CodeNode(source : code!, start : sp, end : ep)
    newNode.has_operator = has_operator;
    newNode.op_index = op_index;
    newNode.mutable_def = mutable_def;
    newNode.expression = expression;
    if ( changeVref ) {
      newNode.vref = match.getTypeName(n : vref);
    } else {
      newNode.vref = vref;
    }
    newNode.is_block_node = is_block_node;
    newNode.type_type = match.getTypeName(n : type_type);
    newNode.type_name = match.getTypeName(n : type_name);
    newNode.key_type = match.getTypeName(n : key_type);
    newNode.array_type = match.getTypeName(n : array_type);
    newNode.value_type = value_type;
    if ( has_vref_annotation ) {
      newNode.has_vref_annotation = true;
      let ann : CodeNode? = vref_annotation
      newNode.vref_annotation = ann!.rebuildWithType(match : match, changeVref : true);
    }
    if ( has_type_annotation ) {
      newNode.has_type_annotation = true;
      let t_ann : CodeNode? = type_annotation
      newNode.type_annotation = t_ann!.rebuildWithType(match : match, changeVref : true);
    }
    for ( _ , n ) in ns.enumerated() {
      if ( changeVref ) {
        let new_ns : String = match.getTypeName(n : n)
        newNode.ns.append(new_ns)
      } else {
        newNode.vref = vref;
        newNode.ns.append(n)
      }
    }
    switch (value_type) {
      case 2 : 
        newNode.double_value = double_value;
      case 4 : 
        newNode.string_value = string_value;
      case 3 : 
        newNode.int_value = int_value;
      case 5 : 
        newNode.boolean_value = boolean_value;
      case 15 : 
        if ( expression_value != nil  ) {
          newNode.expression_value = expression_value!.rebuildWithType(match : match, changeVref : changeVref);
        }
      default :
        break
    }
    for ( _ , key ) in prop_keys.enumerated() {
      newNode.prop_keys.append(key)
      let oldp : CodeNode? = props[key]
      let np : CodeNode = oldp!.rebuildWithType(match : match, changeVref : changeVref)
      newNode.props[key] = np
    }
    for ( _ , ch ) in children.enumerated() {
      let newCh : CodeNode = ch.rebuildWithType(match : match, changeVref : changeVref)
      newCh.parent = newNode;
      newNode.children.append(newCh)
    }
    return newNode;
  }
  func buildTypeSignatureUsingMatch(match : RangerArgMatch) -> String {
    let tName : String = match.getTypeName(n : type_name)
    switch (tName) {
      case "double" : 
        return "double";
      case "string" : 
        return "string";
      case "integer" : 
        return "int";
      case "boolean" : 
        return "boolean";
      default :
        break
    }
    var s : String = ""
    if ( value_type == 6 ) {
      s = s + "[";
      s = s + match.getTypeName(n : array_type);
      s = s + self.getTypeSignatureWithMatch(match : match);
      s = s + "]";
      return s;
    }
    if ( value_type == 7 ) {
      s = s + "[";
      s = s + match.getTypeName(n : key_type);
      s = s + ":";
      s = s + match.getTypeName(n : array_type);
      s = s + self.getTypeSignatureWithMatch(match : match);
      s = s + "]";
      return s;
    }
    s = match.getTypeName(n : type_name);
    s = s + self.getVRefSignatureWithMatch(match : match);
    return s;
  }
  func buildTypeSignature() -> String {
    switch (value_type) {
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
      default :
        break
    }
    var s : String = ""
    if ( value_type == 6 ) {
      s = s + "[";
      s = s + array_type;
      s = s + self.getTypeSignature();
      s = s + "]";
      return s;
    }
    if ( value_type == 7 ) {
      s = s + "[";
      s = s + key_type;
      s = s + ":";
      s = s + array_type;
      s = s + self.getTypeSignature();
      s = s + "]";
      return s;
    }
    s = type_name;
    return s;
  }
  func getVRefSignatureWithMatch(match : RangerArgMatch) -> String {
    if ( has_vref_annotation ) {
      let nn : CodeNode = vref_annotation!.rebuildWithType(match : match, changeVref : true)
      return "@" + nn.getCode();
    }
    return "";
  }
  func getVRefSignature() -> String {
    if ( has_vref_annotation ) {
      return "@" + vref_annotation!.getCode();
    }
    return "";
  }
  func getTypeSignatureWithMatch(match : RangerArgMatch) -> String {
    if ( has_type_annotation ) {
      let nn : CodeNode = type_annotation!.rebuildWithType(match : match, changeVref : true)
      return "@" + nn.getCode();
    }
    return "";
  }
  func getTypeSignature() -> String {
    if ( has_type_annotation ) {
      return "@" + type_annotation!.getCode();
    }
    return "";
  }
  func typeNameAsType(ctx : RangerAppWriterContext) -> Int {
    switch (type_name) {
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
        if ( true == expression ) {
          return 15;
        }
        if ( value_type == 9 ) {
          if ( ctx.isEnumDefined(n : type_name) ) {
            return 11;
          }
          if ( ctx.isDefinedClass(name : type_name) ) {
            return 8;
          }
        }
        break;
    }
    return value_type;
  }
  func copyEvalResFrom(node : CodeNode) -> Void {
    if ( node.hasParamDesc ) {
      hasParamDesc = node.hasParamDesc;
      paramDesc = node.paramDesc;
    }
    if ( node.typeClass != nil  ) {
      typeClass = node.typeClass;
    }
    eval_type = node.eval_type;
    eval_type_name = node.eval_type_name;
    if ( node.hasFlag(flagName : "optional") ) {
      self.setFlag(flagName : "optional")
    }
    if ( node.value_type == 7 ) {
      eval_key_type = node.eval_key_type;
      eval_array_type = node.eval_array_type;
      eval_type = 7;
    }
    if ( node.value_type == 6 ) {
      eval_key_type = node.eval_key_type;
      eval_array_type = node.eval_array_type;
      eval_type = 6;
    }
    if ( node.value_type == 15 ) {
      eval_type = 15;
      eval_function = node.eval_function;
    }
  }
  func defineNodeTypeTo(node : CodeNode, ctx : RangerAppWriterContext) -> Void {
    switch (type_name) {
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
        if ( true == expression ) {
          node.value_type = 15;
          node.eval_type = 15;
          node.expression = true;
        }
        if ( value_type == 6 ) {
          node.value_type = 6;
          node.eval_type = 6;
          node.eval_type_name = type_name;
          node.eval_array_type = array_type;
        }
        if ( value_type == 7 ) {
          node.value_type = 7;
          node.eval_type = 7;
          node.eval_type_name = type_name;
          node.eval_array_type = array_type;
          node.key_type = key_type;
        }
        if ( value_type == 11 ) {
          node.value_type = 11;
          node.eval_type = 11;
          node.eval_type_name = type_name;
        }
        if ( value_type == 9 ) {
          if ( ctx.isEnumDefined(n : type_name) ) {
            node.value_type = 11;
            node.eval_type = 11;
            node.eval_type_name = type_name;
          }
          if ( ctx.isDefinedClass(name : type_name) ) {
            node.value_type = 8;
            node.eval_type = 8;
            node.eval_type_name = type_name;
          }
        }
        break;
    }
  }
  func ifNoTypeSetToVoid() -> Void {
    if ( (((type_name.characters.count) == 0) && ((key_type.characters.count) == 0)) && ((array_type.characters.count) == 0) ) {
      type_name = "void";
    }
  }
  func ifNoTypeSetToEvalTypeOf(node : CodeNode) -> Bool {
    if ( (((type_name.characters.count) == 0) && ((key_type.characters.count) == 0)) && ((array_type.characters.count) == 0) ) {
      type_name = node.eval_type_name;
      array_type = node.eval_array_type;
      key_type = node.eval_key_type;
      value_type = node.eval_type;
      eval_type = node.eval_type;
      eval_type_name = node.eval_type_name;
      eval_array_type = node.eval_array_type;
      eval_key_type = node.eval_key_type;
      if ( node.value_type == 15 ) {
        if ( expression_value == nil ) {
          let copyOf : CodeNode = node.rebuildWithType(match : RangerArgMatch(), changeVref : false)
          copyOf.children.removeLast();
          expression_value = copyOf;
        }
      }
      return true;
    }
    return false;
  }
}
func ==(l: RangerNodeValue, r: RangerNodeValue) -> Bool {
  return l === r
}
class RangerNodeValue : Equatable  { 
  var double_value : Double?     /** note: unused */
  var string_value : String?     /** note: unused */
  var int_value : Int?     /** note: unused */
  var boolean_value : Bool?     /** note: unused */
  var expression_value : CodeNode?     /** note: unused */
}
func ==(l: RangerBackReference, r: RangerBackReference) -> Bool {
  return l === r
}
class RangerBackReference : Equatable  { 
  var from_class : String?     /** note: unused */
  var var_name : String?     /** note: unused */
  var ref_type : String?     /** note: unused */
}
func ==(l: RangerAppEnum, r: RangerAppEnum) -> Bool {
  return l === r
}
class RangerAppEnum : Equatable  { 
  var name : String = ""     /** note: unused */
  var cnt : Int = 0
  var values : [String:Int] = [String:Int]()
  var node : CodeNode?     /** note: unused */
  func add(n : String) -> Void {
    values[n] = cnt
    cnt = cnt + 1;
  }
}
func ==(l: OpFindResult, r: OpFindResult) -> Bool {
  return l === r
}
class OpFindResult : Equatable  { 
  var did_find : Bool = false     /** note: unused */
  var node : CodeNode?     /** note: unused */
}
func ==(l: RangerAppWriterContext, r: RangerAppWriterContext) -> Bool {
  return l === r
}
class RangerAppWriterContext : Equatable  { 
  var langOperators : CodeNode?
  var stdCommands : CodeNode?
  var reservedWords : CodeNode?
  var intRootCounter : Int = 1     /** note: unused */
  var targetLangName : String = ""
  var parent : RangerAppWriterContext?
  var defined_imports : [String] = [String]()     /** note: unused */
  var already_imported : [String:Bool] = [String:Bool]()
  var fileSystem : CodeFileSystem?
  var is_function : Bool = false
  var class_level_context : Bool = false
  var function_level_context : Bool = false
  var in_main : Bool = false
  var is_block : Bool = false     /** note: unused */
  var is_capturing : Bool = false
  var captured_variables : [String] = [String]()
  var has_block_exited : Bool = false     /** note: unused */
  var in_expression : Bool = false     /** note: unused */
  var expr_stack : [Bool] = [Bool]()
  var expr_restart : Bool = false
  var in_method : Bool = false     /** note: unused */
  var method_stack : [Bool] = [Bool]()
  var typeNames : [String] = [String]()     /** note: unused */
  var typeClasses : [String:RangerTypeClass] = [String:RangerTypeClass]()     /** note: unused */
  var currentClassName : String?     /** note: unused */
  var in_class : Bool = false
  var in_static_method : Bool = false
  var currentClass : RangerAppClassDesc?
  var currentMethod : RangerAppFunctionDesc?
  var thisName : String = "this"
  var definedEnums : [String:RangerAppEnum] = [String:RangerAppEnum]()
  var definedInterfaces : [String:RangerAppClassDesc] = [String:RangerAppClassDesc]()     /** note: unused */
  var definedInterfaceList : [String] = [String]()     /** note: unused */
  var definedClasses : [String:RangerAppClassDesc] = [String:RangerAppClassDesc]()
  var definedClassList : [String] = [String]()
  var templateClassNodes : [String:CodeNode] = [String:CodeNode]()
  var templateClassList : [String] = [String]()
  var classSignatures : [String:String] = [String:String]()
  var classToSignature : [String:String] = [String:String]()
  var templateClasses : [String:RangerAppClassDesc] = [String:RangerAppClassDesc]()     /** note: unused */
  var classStaticWriters : [String:CodeWriter] = [String:CodeWriter]()
  var localVariables : [String:RangerAppParamDesc] = [String:RangerAppParamDesc]()
  var localVarNames : [String] = [String]()
  var compilerFlags : [String:Bool] = [String:Bool]()
  var compilerSettings : [String:String] = [String:String]()
  var parserErrors : [RangerCompilerMessage] = [RangerCompilerMessage]()
  var compilerErrors : [RangerCompilerMessage] = [RangerCompilerMessage]()
  var compilerMessages : [RangerCompilerMessage] = [RangerCompilerMessage]()
  var compilerLog : [String:RangerCompilerMessage] = [String:RangerCompilerMessage]()     /** note: unused */
  var todoList : [RangerAppTodo] = [RangerAppTodo]()
  var definedMacro : [String:Bool] = [String:Bool]()     /** note: unused */
  var defCounts : [String:Int] = [String:Int]()
  var refTransform : [String:String] = [String:String]()
  var rootFile : String = "--not-defined--"
  func isCapturing() -> Bool {
    if ( is_capturing ) {
      return true;
    }
    if ( parent != nil ) {
      return parent!.isCapturing();
    }
    return false;
  }
  func isLocalToCapture(name : String) -> Bool {
    if ( localVariables[name] != nil ) {
      return true;
    }
    if ( is_capturing ) {
      return false;
    }
    if ( parent != nil ) {
      return parent!.isLocalToCapture(name : name);
    }
    return false;
  }
  func addCapturedVariable(name : String) -> Void {
    if ( is_capturing ) {
      if ( (r_index_of(arr:captured_variables, elem:name)) < 0 ) {
        captured_variables.append(name)
      }
      return;
    }
    if ( parent != nil ) {
      parent!.addCapturedVariable(name : name)
    }
  }
  func getCapturedVariables() -> [String] {
    if ( is_capturing ) {
      return captured_variables;
    }
    if ( parent != nil ) {
      let r : [String] = parent!.getCapturedVariables()
      return r;
    }
    let res : [String] = [String]()
    return res;
  }
  func transformWord(input_word : String) -> String {
    let root : RangerAppWriterContext = self.getRoot()
    _ = root.initReservedWords()
    if ( refTransform[input_word] != nil ) {
      return (refTransform[input_word])!;
    }
    return input_word;
  }
  func initReservedWords() -> Bool {
    if ( reservedWords != nil  ) {
      return true;
    }
    let main : CodeNode? = langOperators
    var lang : CodeNode?
    for ( _ , m ) in main!.children.enumerated() {
      let fc : CodeNode = m.getFirst()
      if ( fc.vref == "language" ) {
        lang = m;
      }
    }
    /** unused:  let cmds : CodeNode?   **/ 
    let langNodes : CodeNode = lang!.children[1]
    for ( _ , lch ) in langNodes.children.enumerated() {
      let fc_1 : CodeNode = lch.getFirst()
      if ( fc_1.vref == "reserved_words" ) {
        /** unused:  let n : CodeNode = lch.getSecond()   **/ 
        reservedWords = lch.getSecond();
        for ( _ , ch ) in reservedWords!.children.enumerated() {
          let word : CodeNode = ch.getFirst()
          let transform : CodeNode = ch.getSecond()
          refTransform[word.vref] = transform.vref
        }
      }
    }
    return true;
  }
  func initStdCommands() -> Bool {
    if ( stdCommands != nil  ) {
      return true;
    }
    if ( langOperators == nil ) {
      return true;
    }
    let main : CodeNode? = langOperators
    var lang : CodeNode?
    for ( _ , m ) in main!.children.enumerated() {
      let fc : CodeNode = m.getFirst()
      if ( fc.vref == "language" ) {
        lang = m;
      }
    }
    /** unused:  let cmds : CodeNode?   **/ 
    let langNodes : CodeNode = lang!.children[1]
    for ( _ , lch ) in langNodes.children.enumerated() {
      let fc_1 : CodeNode = lch.getFirst()
      if ( fc_1.vref == "commands" ) {
        /** unused:  let n : CodeNode = lch.getSecond()   **/ 
        stdCommands = lch.getSecond();
      }
    }
    return true;
  }
  func transformTypeName(typeName : String) -> String {
    if ( self.isPrimitiveType(typeName : typeName) ) {
      return typeName;
    }
    if ( self.isEnumDefined(n : typeName) ) {
      return typeName;
    }
    if ( self.isDefinedClass(name : typeName) ) {
      let cl : RangerAppClassDesc = self.findClass(name : typeName)
      if ( cl.is_system ) {
        return (cl.systemNames[self.getTargetLang()])!;
      }
    }
    return typeName;
  }
  func isPrimitiveType(typeName : String) -> Bool {
    if ( (((((typeName == "double") || (typeName == "string")) || (typeName == "int")) || (typeName == "char")) || (typeName == "charbuffer")) || (typeName == "boolean") ) {
      return true;
    }
    return false;
  }
  func isDefinedType(typeName : String) -> Bool {
    if ( (((((typeName == "double") || (typeName == "string")) || (typeName == "int")) || (typeName == "char")) || (typeName == "charbuffer")) || (typeName == "boolean") ) {
      return true;
    }
    if ( self.isEnumDefined(n : typeName) ) {
      return true;
    }
    if ( self.isDefinedClass(name : typeName) ) {
      return true;
    }
    return false;
  }
  func hadValidType(node : CodeNode) -> Bool {
    if ( node.isPrimitiveType() || node.isPrimitive() ) {
      return true;
    }
    if ( node.value_type == 6 ) {
      if ( self.isDefinedType(typeName : node.array_type) ) {
        return true;
      } else {
        self.addError(targetnode : node, descr : "Unknown type for array values: " + node.array_type)
        return false;
      }
    }
    if ( node.value_type == 7 ) {
      if ( self.isDefinedType(typeName : node.array_type) && self.isPrimitiveType(typeName : node.key_type) ) {
        return true;
      } else {
        if ( self.isDefinedType(typeName : node.array_type) == false ) {
          self.addError(targetnode : node, descr : "Unknown type for map values: " + node.array_type)
        }
        if ( self.isDefinedType(typeName : node.array_type) == false ) {
          self.addError(targetnode : node, descr : "Unknown type for map keys: " + node.key_type)
        }
        return false;
      }
    }
    if ( self.isEnumDefined(n : node.type_name) ) {
      return true;
    }
    if ( self.isDefinedType(typeName : node.type_name) ) {
      return true;
    } else {
      if ( node.value_type == 15 ) {
      } else {
        self.addError(targetnode : node, descr : (("Unknown type: " + node.type_name) + " type ID : ") + String(node.value_type))
      }
    }
    return false;
  }
  func getTargetLang() -> String {
    if ( (targetLangName.characters.count) > 0 ) {
      return targetLangName;
    }
    if ( parent != nil ) {
      return parent!.getTargetLang();
    }
    return "ranger";
  }
  func findOperator(node : CodeNode) -> CodeNode {
    let root : RangerAppWriterContext = self.getRoot()
    _ = root.initStdCommands()
    return root.stdCommands!.children[node.op_index];
  }
  func getStdCommands() -> CodeNode {
    let root : RangerAppWriterContext = self.getRoot()
    _ = root.initStdCommands()
    return root.stdCommands!;
  }
  func findClassWithSign(node : CodeNode) -> RangerAppClassDesc {
    let root : RangerAppWriterContext = self.getRoot()
    let tplArgs : CodeNode? = node.vref_annotation
    let sign : String = node.vref + tplArgs!.getCode()
    let theName : String? = root.classSignatures[sign]
    return self.findClass(name : (theName!));
  }
  func createSignature(origClass : String, classSig : String) -> String {
    if ( classSignatures[classSig] != nil ) {
      return (classSignatures[classSig])!;
    }
    var ii : Int = 1
    var sigName : String = (origClass + "V") + String(ii)
    while (classToSignature[sigName] != nil) {
      ii = ii + 1;
      sigName = (origClass + "V") + String(ii);
    }
    classToSignature[sigName] = classSig
    classSignatures[classSig] = sigName
    return sigName;
  }
  func createOperator(fromNode : CodeNode) -> Void {
    let root : RangerAppWriterContext = self.getRoot()
    if ( root.initStdCommands() ) {
      root.stdCommands!.children.append(fromNode)
      /** unused:  let fc : CodeNode = fromNode.children[0]   **/ 
    }
  }
  func getFileWriter(path : String, fileName : String) -> CodeWriter {
    let root : RangerAppWriterContext = self.getRoot()
    let fs : CodeFileSystem? = root.fileSystem
    let file : CodeFile = fs!.getFile(path : path, name : fileName)
    var wr : CodeWriter?
    wr = file.getWriter();
    return wr!;
  }
  func addTodo(node : CodeNode, descr : String) -> Void {
    let e : RangerAppTodo = RangerAppTodo()
    e.description = descr;
    e.todonode = node;
    let root : RangerAppWriterContext = self.getRoot()
    root.todoList.append(e)
  }
  func setThisName(the_name : String) -> Void {
    let root : RangerAppWriterContext = self.getRoot()
    root.thisName = the_name;
  }
  func getThisName() -> String {
    let root : RangerAppWriterContext = self.getRoot()
    return root.thisName;
  }
  func printLogs(logName : String) -> Void {
  }
  func log(node : CodeNode, logName : String, descr : String) -> Void {
  }
  func addMessage(node : CodeNode, descr : String) -> Void {
    let e : RangerCompilerMessage = RangerCompilerMessage()
    e.description = descr;
    e.node = node;
    let root : RangerAppWriterContext = self.getRoot()
    root.compilerMessages.append(e)
  }
  func addError(targetnode : CodeNode, descr : String) -> Void {
    let e : RangerCompilerMessage = RangerCompilerMessage()
    e.description = descr;
    e.node = targetnode;
    let root : RangerAppWriterContext = self.getRoot()
    root.compilerErrors.append(e)
  }
  func addParserError(targetnode : CodeNode, descr : String) -> Void {
    let e : RangerCompilerMessage = RangerCompilerMessage()
    e.description = descr;
    e.node = targetnode;
    let root : RangerAppWriterContext = self.getRoot()
    root.parserErrors.append(e)
  }
  func addTemplateClass(name : String, node : CodeNode) -> Void {
    let root : RangerAppWriterContext = self.getRoot()
    root.templateClassList.append(name)
    root.templateClassNodes[name] = node
  }
  func hasTemplateNode(name : String) -> Bool {
    let root : RangerAppWriterContext = self.getRoot()
    return root.templateClassNodes[name] != nil;
  }
  func findTemplateNode(name : String) -> CodeNode {
    let root : RangerAppWriterContext = self.getRoot()
    return (root.templateClassNodes[name])!;
  }
  func setStaticWriter(className : String, writer : CodeWriter) -> Void {
    let root : RangerAppWriterContext = self.getRoot()
    root.classStaticWriters[className] = writer
  }
  func getStaticWriter(className : String) -> CodeWriter {
    let root : RangerAppWriterContext = self.getRoot()
    return (root.classStaticWriters[className])!;
  }
  func isEnumDefined(n : String) -> Bool {
    if ( definedEnums[n] != nil ) {
      return true;
    }
    if ( parent == nil ) {
      return false;
    }
    return parent!.isEnumDefined(n : n);
  }
  func getEnum(n : String) -> RangerAppEnum? {
    var res : RangerAppEnum?
    if ( definedEnums[n] != nil ) {
      res = definedEnums[n];
      return res;
    }
    if ( parent != nil  ) {
      return parent!.getEnum(n : n);
    }
    return res;
  }
  func isVarDefined(name : String) -> Bool {
    if ( localVariables[name] != nil ) {
      return true;
    }
    if ( parent == nil ) {
      return false;
    }
    return parent!.isVarDefined(name : name);
  }
  func setCompilerFlag(name : String, value : Bool) -> Void {
    compilerFlags[name] = value
  }
  func hasCompilerFlag(s_name : String) -> Bool {
    if ( compilerFlags[s_name] != nil ) {
      return (compilerFlags[s_name])!;
    }
    if ( parent == nil ) {
      return false;
    }
    return parent!.hasCompilerFlag(s_name : s_name);
  }
  func getCompilerSetting(s_name : String) -> String {
    if ( compilerSettings[s_name] != nil ) {
      return (compilerSettings[s_name])!;
    }
    if ( parent == nil ) {
      return "";
    }
    return parent!.getCompilerSetting(s_name : s_name);
  }
  func hasCompilerSetting(s_name : String) -> Bool {
    if ( compilerSettings[s_name] != nil ) {
      return true;
    }
    if ( parent == nil ) {
      return false;
    }
    return parent!.hasCompilerSetting(s_name : s_name);
  }
  func getVariableDef(name : String) -> RangerAppParamDesc {
    if ( localVariables[name] != nil ) {
      return (localVariables[name])!;
    }
    if ( parent == nil ) {
      let tmp : RangerAppParamDesc = RangerAppParamDesc()
      return tmp;
    }
    return parent!.getVariableDef(name : name);
  }
  func findFunctionCtx() -> RangerAppWriterContext {
    if ( is_function ) {
      return self;
    }
    if ( parent == nil ) {
      return self;
    }
    return parent!.findFunctionCtx();
  }
  func getFnVarCnt(name : String) -> Int {
    let fnCtx : RangerAppWriterContext = self.findFunctionCtx()
    var ii : Int = 0
    if ( fnCtx.defCounts[name] != nil ) {
      ii = (fnCtx.defCounts[name])!;
      ii = 1 + ii;
    } else {
      fnCtx.defCounts[name] = ii
      return 0;
    }
    var scope_has : Bool = self.isVarDefined(name : ((name + "_") + String(ii)))
    while (scope_has) {
      ii = 1 + ii;
      scope_has = self.isVarDefined(name : ((name + "_") + String(ii)));
    }
    fnCtx.defCounts[name] = ii
    return ii;
  }
  func debugVars() -> Void {
    print("--- context vars ---")
    for ( _ , na ) in localVarNames.enumerated() {
      print("var => " + na)
    }
    if ( parent != nil  ) {
      parent!.debugVars()
    }
  }
  func getVarTotalCnt(name : String) -> Int {
    let fnCtx : RangerAppWriterContext = self
    var ii : Int = 0
    if ( fnCtx.defCounts[name] != nil ) {
      ii = (fnCtx.defCounts[name])!;
    }
    if ( fnCtx.parent != nil  ) {
      ii = ii + fnCtx.parent!.getVarTotalCnt(name : name);
    }
    if ( self.isVarDefined(name : name) ) {
      ii = ii + 1;
    }
    return ii;
  }
  func getFnVarCnt2(name : String) -> Int {
    let fnCtx : RangerAppWriterContext = self
    var ii : Int = 0
    if ( fnCtx.defCounts[name] != nil ) {
      ii = (fnCtx.defCounts[name])!;
      ii = 1 + ii;
      fnCtx.defCounts[name] = ii
    } else {
      fnCtx.defCounts[name] = 1
    }
    if ( fnCtx.parent != nil  ) {
      ii = ii + fnCtx.parent!.getFnVarCnt2(name : name);
    }
    let scope_has : Bool = self.isVarDefined(name : name)
    if ( scope_has ) {
      ii = 1 + ii;
    }
    var scope_has_2 : Bool = self.isVarDefined(name : ((name + "_") + String(ii)))
    while (scope_has_2) {
      ii = 1 + ii;
      scope_has_2 = self.isVarDefined(name : ((name + "_") + String(ii)));
    }
    return ii;
  }
  func getFnVarCnt3(name : String) -> Int {
    let classLevel : RangerAppWriterContext? = self.findMethodLevelContext()
    let fnCtx : RangerAppWriterContext = self
    var ii : Int = 0
    if ( fnCtx.defCounts[name] != nil ) {
      ii = (fnCtx.defCounts[name])!;
      fnCtx.defCounts[name] = ii + 1
    } else {
      fnCtx.defCounts[name] = 1
    }
    if ( classLevel!.isVarDefined(name : name) ) {
      ii = ii + 1;
    }
    var scope_has : Bool = self.isVarDefined(name : ((name + "_") + String(ii)))
    while (scope_has) {
      ii = 1 + ii;
      scope_has = self.isVarDefined(name : ((name + "_") + String(ii)));
    }
    return ii;
  }
  func isMemberVariable(name : String) -> Bool {
    if ( self.isVarDefined(name : name) ) {
      let vDef : RangerAppParamDesc = self.getVariableDef(name : name)
      if ( vDef.varType == 8 ) {
        return true;
      }
    }
    return false;
  }
  func defineVariable(name : String, desc : RangerAppParamDesc) -> Void {
    var cnt : Int = 0
    let fnLevel : RangerAppWriterContext? = self.findMethodLevelContext()
    if ( false == (((desc.varType == 8) || (desc.varType == 4)) || (desc.varType == 10)) ) {
      cnt = fnLevel!.getFnVarCnt3(name : name);
    }
    if ( 0 == cnt ) {
      if ( name == "len" ) {
        desc.compiledName = "__len";
      } else {
        desc.compiledName = name;
      }
    } else {
      desc.compiledName = (name + "_") + String(cnt);
    }
    localVariables[name] = desc
    localVarNames.append(name)
  }
  func isDefinedClass(name : String) -> Bool {
    if ( definedClasses[name] != nil ) {
      return true;
    } else {
      if ( parent != nil  ) {
        return parent!.isDefinedClass(name : name);
      }
    }
    return false;
  }
  func getRoot() -> RangerAppWriterContext {
    if ( parent == nil ) {
      return self;
    }
    return parent!.getRoot();
  }
  func getClasses() -> [RangerAppClassDesc] {
    var list : [RangerAppClassDesc] = [RangerAppClassDesc]()
    for ( _ , n ) in definedClassList.enumerated() {
      list.append((definedClasses[n])!)
    }
    return list;
  }
  func addClass(name : String, desc : RangerAppClassDesc) -> Void {
    let root : RangerAppWriterContext = self.getRoot()
    if ( root.definedClasses[name] != nil ) {
    } else {
      root.definedClasses[name] = desc
      root.definedClassList.append(name)
    }
  }
  func findClass(name : String) -> RangerAppClassDesc {
    let root : RangerAppWriterContext = self.getRoot()
    return (root.definedClasses[name])!;
  }
  func hasClass(name : String) -> Bool {
    let root : RangerAppWriterContext = self.getRoot()
    return root.definedClasses[name] != nil;
  }
  func getCurrentMethod() -> RangerAppFunctionDesc {
    if ( currentMethod != nil  ) {
      return currentMethod!;
    }
    if ( parent != nil  ) {
      return parent!.getCurrentMethod();
    }
    return RangerAppFunctionDesc();
  }
  func setCurrentClass(cc : RangerAppClassDesc) -> Void {
    in_class = true;
    currentClass = cc;
  }
  func disableCurrentClass() -> Void {
    if ( in_class ) {
      in_class = false;
    }
    if ( parent != nil  ) {
      parent!.disableCurrentClass()
    }
  }
  func hasCurrentClass() -> Bool {
    if ( in_class && (currentClass != nil ) ) {
      return true;
    }
    if ( parent != nil  ) {
      return parent!.hasCurrentClass();
    }
    return false;
  }
  func getCurrentClass() -> RangerAppClassDesc? {
    let non : RangerAppClassDesc? = currentClass
    if ( in_class && (non != nil ) ) {
      return non;
    }
    if ( parent != nil  ) {
      return parent!.getCurrentClass();
    }
    return non;
  }
  func restartExpressionLevel() -> Void {
    expr_restart = true;
  }
  func isInExpression() -> Bool {
    if ( (expr_stack.count) > 0 ) {
      return true;
    }
    if ( (parent != nil ) && (expr_restart == false) ) {
      return parent!.isInExpression();
    }
    return false;
  }
  func expressionLevel() -> Int {
    let level : Int = expr_stack.count
    if ( (parent != nil ) && (expr_restart == false) ) {
      return level + parent!.expressionLevel();
    }
    return level;
  }
  func setInExpr() -> Void {
    expr_stack.append(true)
  }
  func unsetInExpr() -> Void {
    expr_stack.removeLast();
  }
  func getErrorCount() -> Int {
    var cnt : Int = compilerErrors.count
    if ( parent != nil ) {
      cnt = cnt + parent!.getErrorCount();
    }
    return cnt;
  }
  func isInStatic() -> Bool {
    if ( in_static_method ) {
      return true;
    }
    if ( parent != nil ) {
      return parent!.isInStatic();
    }
    return false;
  }
  func isInMain() -> Bool {
    if ( in_main ) {
      return true;
    }
    if ( parent != nil ) {
      return parent!.isInMain();
    }
    return false;
  }
  func isInMethod() -> Bool {
    if ( (method_stack.count) > 0 ) {
      return true;
    }
    if ( parent != nil  ) {
      return parent!.isInMethod();
    }
    return false;
  }
  func setInMethod() -> Void {
    method_stack.append(true)
  }
  func unsetInMethod() -> Void {
    method_stack.removeLast();
  }
  func findMethodLevelContext() -> RangerAppWriterContext? {
    var res : RangerAppWriterContext?
    if ( function_level_context ) {
      res = self;
      return res;
    }
    if ( parent != nil ) {
      return parent!.findMethodLevelContext();
    }
    res = self;
    return res;
  }
  func findClassLevelContext() -> RangerAppWriterContext? {
    var res : RangerAppWriterContext?
    if ( class_level_context ) {
      res = self;
      return res;
    }
    if ( parent != nil ) {
      return parent!.findClassLevelContext();
    }
    res = self;
    return res;
  }
  func fork() -> RangerAppWriterContext {
    let new_ctx : RangerAppWriterContext = RangerAppWriterContext()
    new_ctx.parent = self;
    return new_ctx;
  }
  func getRootFile() -> String {
    let root : RangerAppWriterContext = self.getRoot()
    return root.rootFile;
  }
  func setRootFile(file_name : String) -> Void {
    let root : RangerAppWriterContext = self.getRoot()
    root.rootFile = file_name;
  }
}
func ==(l: CodeFile, r: CodeFile) -> Bool {
  return l === r
}
class CodeFile : Equatable  { 
  var path_name : String = ""
  var name : String = ""
  var writer : CodeWriter?
  var import_list : [String:String] = [String:String]()
  var import_names : [String] = [String]()
  var fileSystem : CodeFileSystem?
  init(filePath : String, fileName : String ) {
    name = fileName;
    path_name = filePath;
    writer = CodeWriter();
    _ = writer!.createTag(name : "imports")
  }
  func addImport(import_name : String) -> Void {
    if ( false == (import_list[import_name] != nil) ) {
      import_list[import_name] = import_name
      import_names.append(import_name)
    }
  }
  func testCreateWriter() -> CodeWriter {
    return CodeWriter();
  }
  func getImports() -> [String] {
    return import_names;
  }
  func getWriter() -> CodeWriter? {
    writer!.ownerFile = self;
    return writer;
  }
  func getCode() -> String {
    return writer!.getCode();
  }
}
func ==(l: CodeFileSystem, r: CodeFileSystem) -> Bool {
  return l === r
}
class CodeFileSystem : Equatable  { 
  var files : [CodeFile] = [CodeFile]()
  func getFile(path : String, name : String) -> CodeFile {
    for ( _ , file ) in files.enumerated() {
      if ( (file.path_name == path) && (file.name == name) ) {
        return file;
      }
    }
    let new_file : CodeFile = CodeFile(filePath : path, fileName : name)
    new_file.fileSystem = self;
    files.append(new_file)
    return new_file;
  }
  func mkdir(path : String) -> Void {
    let parts : [String] = path.components( separatedBy : "/")
    var curr_path : String = ""
    for ( _ , p ) in parts.enumerated() {
      curr_path = (curr_path + "/") + p;
      if ( false == (r_dir_exists( dirName: curr_path)) ) {
      }
    }
  }
  func saveTo(path : String) -> Void {
    for ( _ , file ) in files.enumerated() {
      let file_path : String = (path + "/") + file.path_name
      self.mkdir(path : file_path)
      print((("Writing to file " + file_path) + "/") + file.name)
      let file_content : String = file.getCode()
      if ( (file_content.characters.count) > 0 ) {
        r_write_file(dirName: file_path + "/" + file.name, dataToWrite: file_content) 
      }
    }
  }
}
func ==(l: CodeSlice, r: CodeSlice) -> Bool {
  return l === r
}
class CodeSlice : Equatable  { 
  var code : String = ""
  var writer : CodeWriter?
  func getCode() -> String {
    if ( writer == nil ) {
      return code;
    }
    return writer!.getCode();
  }
}
func ==(l: CodeWriter, r: CodeWriter) -> Bool {
  return l === r
}
class CodeWriter : Equatable  { 
  var tagName : String = ""     /** note: unused */
  var codeStr : String = ""     /** note: unused */
  var currentLine : String = ""
  var tabStr : String = "  "
  var lineNumber : Int = 1     /** note: unused */
  var indentAmount : Int = 0
  var compiledTags : [String:Bool] = [String:Bool]()
  var tags : [String:Int] = [String:Int]()
  var slices : [CodeSlice] = [CodeSlice]()
  var current_slice : CodeSlice?
  var ownerFile : CodeFile?
  var forks : [CodeWriter] = [CodeWriter]()     /** note: unused */
  var tagOffset : Int = 0     /** note: unused */
  var parent : CodeWriter?
  var had_nl : Bool = true     /** note: unused */
  init( ) {
    let new_slice : CodeSlice = CodeSlice()
    slices.append(new_slice)
    current_slice = new_slice;
  }
  func getFileWriter(path : String, fileName : String) -> CodeWriter {
    let fs : CodeFileSystem? = ownerFile!.fileSystem
    let file : CodeFile = fs!.getFile(path : path, name : fileName)
    let wr : CodeWriter? = file.getWriter()
    return wr!;
  }
  func getImports() -> [String] {
    var p : CodeWriter = self
    while ((p.ownerFile == nil) && (p.parent != nil )) {
      p = p.parent!;
    }
    if ( p.ownerFile != nil  ) {
      let f : CodeFile = p.ownerFile!
      return f.import_names;
    }
    let nothing : [String] = [String]()
    return nothing;
  }
  func addImport(name : String) -> Void {
    if ( ownerFile != nil  ) {
      ownerFile!.addImport(import_name : name)
    } else {
      if ( parent != nil  ) {
        parent!.addImport(name : name)
      }
    }
  }
  func indent(delta : Int) -> Void {
    indentAmount = indentAmount + delta;
    if ( indentAmount < 0 ) {
      indentAmount = 0;
    }
  }
  func addIndent() -> Void {
    var i : Int = 0
    if ( 0 == (currentLine.characters.count) ) {
      while (i < indentAmount) {
        currentLine = currentLine + tabStr;
        i = i + 1;
      }
    }
  }
  func createTag(name : String) -> CodeWriter {
    let new_writer : CodeWriter = CodeWriter()
    let new_slice : CodeSlice = CodeSlice()
    tags[name] = slices.count
    slices.append(new_slice)
    new_slice.writer = new_writer;
    new_writer.indentAmount = indentAmount;
    let new_active_slice : CodeSlice = CodeSlice()
    slices.append(new_active_slice)
    current_slice = new_active_slice;
    new_writer.parent = self;
    return new_writer;
  }
  func getTag(name : String) -> CodeWriter {
    if ( tags[name] != nil ) {
      let idx : Int = (tags[name])!
      let slice : CodeSlice = slices[idx]
      return slice.writer!;
    } else {
      if ( parent != nil  ) {
        return parent!.getTag(name : name);
      }
    }
    return self;
  }
  func hasTag(name : String) -> Bool {
    if ( tags[name] != nil ) {
      return true;
    } else {
      if ( parent != nil  ) {
        return parent!.hasTag(name : name);
      }
    }
    return false;
  }
  func fork() -> CodeWriter {
    let new_writer : CodeWriter = CodeWriter()
    let new_slice : CodeSlice = CodeSlice()
    slices.append(new_slice)
    new_slice.writer = new_writer;
    new_writer.indentAmount = indentAmount;
    new_writer.parent = self;
    let new_active_slice : CodeSlice = CodeSlice()
    slices.append(new_active_slice)
    current_slice = new_active_slice;
    return new_writer;
  }
  func newline() -> Void {
    if ( (currentLine.characters.count) > 0 ) {
      self.out(str : "", newLine : true)
    }
  }
  func writeSlice(str : String, newLine : Bool) -> Void {
    self.addIndent()
    currentLine = currentLine + str;
    if ( newLine ) {
      current_slice!.code = (current_slice!.code + currentLine) + "\n";
      currentLine = "";
    }
  }
  func out(str : String, newLine : Bool) -> Void {
    let lines : [String] = str.components( separatedBy : "\n")
    let rowCnt : Int = lines.count
    if ( rowCnt == 1 ) {
      self.writeSlice(str : str, newLine : newLine)
    } else {
      for ( idx , row ) in lines.enumerated() {
        self.addIndent()
        if ( idx < (rowCnt - 1) ) {
          self.writeSlice(str : row.trimmingCharacters(in: CharacterSet.whitespacesAndNewlines), newLine : true)
        } else {
          self.writeSlice(str : row, newLine : newLine)
        }
      }
    }
  }
  func raw(str : String, newLine : Bool) -> Void {
    let lines : [String] = str.components( separatedBy : "\n")
    let rowCnt : Int = lines.count
    if ( rowCnt == 1 ) {
      self.writeSlice(str : str, newLine : newLine)
    } else {
      for ( idx , row ) in lines.enumerated() {
        self.addIndent()
        if ( idx < (rowCnt - 1) ) {
          self.writeSlice(str : row, newLine : true)
        } else {
          self.writeSlice(str : row, newLine : newLine)
        }
      }
    }
  }
  func getCode() -> String {
    var res : String = ""
    for ( _ , slice ) in slices.enumerated() {
      res = res + slice.getCode();
    }
    res = res + currentLine;
    return res;
  }
}
func ==(l: RangerLispParser, r: RangerLispParser) -> Bool {
  return l === r
}
class RangerLispParser : Equatable  { 
  var code : SourceCode?
  var buff : [UInt8]?
  var __len : Int = 0
  var i : Int = 0
  var parents : [CodeNode] = [CodeNode]()
  var next : CodeNode?     /** note: unused */
  var paren_cnt : Int = 0
  var get_op_pred : Int = 0     /** note: unused */
  var rootNode : CodeNode?
  var curr_node : CodeNode?
  var had_error : Bool = false
  init(code_module : SourceCode ) {
    buff = Array(code_module.code.utf8);
    code = code_module;
    __len = (buff!).count;
    rootNode = CodeNode(source : code!, start : 0, end : 0);
    rootNode!.is_block_node = true;
    rootNode!.expression = true;
    curr_node = rootNode;
    parents.append(curr_node!)
    paren_cnt = 1;
  }
  func joo(cm : SourceCode) -> Void {
    /** unused:  let ll : Int = cm.code.characters.count   **/ 
  }
  func parse_raw_annotation() -> CodeNode {
    var sp : Int = i
    var ep : Int = i
    i = i + 1;
    sp = i;
    ep = i;
    if ( i < __len ) {
      let a_node2 : CodeNode = CodeNode(source : code!, start : sp, end : ep)
      a_node2.expression = true;
      curr_node = a_node2;
      parents.append(a_node2)
      i = i + 1;
      paren_cnt = paren_cnt + 1;
      self.parse()
      return a_node2;
    } else {
    }
    return CodeNode(source : code!, start : sp, end : ep);
  }
  func skip_space(is_block_parent : Bool) -> Bool {
    let s : [UInt8] = buff!
    var did_break : Bool = false
    if ( i >= __len ) {
      return true;
    }
    var c : UInt8 = s[i]
    /** unused:  let bb : Bool = c == (46)   **/ 
    while ((i < __len) && (c <= 32)) {
      if ( is_block_parent && ((c == 10) || (c == 13)) ) {
        _ = self.end_expression()
        did_break = true;
        break;
      }
      i = 1 + i;
      if ( i >= __len ) {
        return true;
      }
      c = s[i];
    }
    return did_break;
  }
  func end_expression() -> Bool {
    i = 1 + i;
    if ( i >= __len ) {
      return false;
    }
    paren_cnt = paren_cnt - 1;
    if ( paren_cnt < 0 ) {
      print("Parser error ) mismatch")
    }
    parents.removeLast();
    if ( curr_node != nil  ) {
      curr_node!.ep = i;
      curr_node!.infix_operator = false;
    }
    if ( (parents.count) > 0 ) {
      curr_node = parents[((parents.count) - 1)];
    } else {
      curr_node = rootNode;
    }
    curr_node!.infix_operator = false;
    return true;
  }
  func getOperator() -> Int {
    let s : [UInt8] = buff!
    if ( (i + 2) >= __len ) {
      return 0;
    }
    let c : UInt8 = s[i]
    let c2 : UInt8 = s[(i + 1)]
    switch (c) {
      case 42 : 
        i = i + 1;
        return 14;
      case 47 : 
        i = i + 1;
        return 14;
      case 43 : 
        i = i + 1;
        return 13;
      case 45 : 
        i = i + 1;
        return 13;
      case 60 : 
        if ( c2 == (61) ) {
          i = i + 2;
          return 11;
        }
        i = i + 1;
        return 11;
      case 62 : 
        if ( c2 == (61) ) {
          i = i + 2;
          return 11;
        }
        i = i + 1;
        return 11;
      case 33 : 
        if ( c2 == (61) ) {
          i = i + 2;
          return 10;
        }
        return 0;
      case 61 : 
        if ( c2 == (61) ) {
          i = i + 2;
          return 10;
        }
        i = i + 1;
        return 3;
      case 38 : 
        if ( c2 == (38) ) {
          i = i + 2;
          return 6;
        }
        return 0;
      case 124 : 
        if ( c2 == (124) ) {
          i = i + 2;
          return 5;
        }
        return 0;
      default: 
        break;
    }
    return 0;
  }
  func isOperator() -> Int {
    let s : [UInt8] = buff!
    if ( (i - 2) > __len ) {
      return 0;
    }
    let c : UInt8 = s[i]
    let c2 : UInt8 = s[(i + 1)]
    switch (c) {
      case 42 : 
        return 1;
      case 47 : 
        return 14;
      case 43 : 
        return 13;
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
    }
    return 0;
  }
  func getOperatorPred(str : String) -> Int {
    switch (str) {
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
        break;
    }
    return 0;
  }
  func insert_node(p_node : CodeNode) -> Void {
    var push_target : CodeNode? = curr_node
    if ( curr_node!.infix_operator ) {
      push_target = curr_node!.infix_node;
      if ( push_target!.to_the_right ) {
        push_target = push_target!.right_node;
        p_node.parent = push_target;
      }
    }
    push_target!.children.append(p_node)
  }
  func parse() -> Void {
    let s : [UInt8] = buff!
    var c : UInt8 = s[0]
    /** unused:  let next_c : UInt8 = 0   **/ 
    var fc : UInt8 = 0
    var new_node : CodeNode?
    var sp : Int = 0
    var ep : Int = 0
    var last_i : Int = 0
    var had_lf : Bool = false
    while (i < __len) {
      if ( had_error ) {
        break;
      }
      last_i = i;
      var is_block_parent : Bool = false
      if ( had_lf ) {
        had_lf = false;
        _ = self.end_expression()
        break;
      }
      if ( curr_node != nil  ) {
        if ( curr_node!.parent != nil  ) {
          let nodeParent : CodeNode? = curr_node!.parent
          if ( nodeParent!.is_block_node ) {
            is_block_parent = true;
          }
        }
      }
      if ( self.skip_space(is_block_parent : is_block_parent) ) {
        break;
      }
      had_lf = false;
      c = s[i];
      if ( i < __len ) {
        c = s[i];
        if ( c == 59 ) {
          sp = i + 1;
          while ((i < __len) && ((s[i]) > 31)) {
            i = 1 + i;
          }
          if ( i >= __len ) {
            break;
          }
          new_node = CodeNode(source : code!, start : sp, end : i);
          new_node!.parsed_type = 10;
          new_node!.value_type = 10;
          new_node!.string_value = String(data: Data(bytes:s[sp ..< i]), encoding: .utf8)!;
          curr_node!.comments.append(new_node!)
          continue;
        }
        if ( i < (__len - 1) ) {
          fc = s[(i + 1)];
          if ( (((c == 40) || (c == (123))) || ((c == 39) && (fc == 40))) || ((c == 96) && (fc == 40)) ) {
            paren_cnt = paren_cnt + 1;
            if ( curr_node == nil ) {
              rootNode = CodeNode(source : code!, start : i, end : i);
              curr_node = rootNode;
              if ( c == 96 ) {
                curr_node!.parsed_type = 30;
                curr_node!.value_type = 30;
              }
              if ( c == 39 ) {
                curr_node!.parsed_type = 29;
                curr_node!.value_type = 29;
              }
              curr_node!.expression = true;
              parents.append(curr_node!)
            } else {
              let new_qnode : CodeNode = CodeNode(source : code!, start : i, end : i)
              if ( c == 96 ) {
                new_qnode.value_type = 30;
              }
              if ( c == 39 ) {
                new_qnode.value_type = 29;
              }
              new_qnode.expression = true;
              self.insert_node(p_node : new_qnode)
              parents.append(new_qnode)
              curr_node = new_qnode;
            }
            if ( c == (123) ) {
              curr_node!.is_block_node = true;
            }
            i = 1 + i;
            self.parse()
            continue;
          }
        }
        sp = i;
        ep = i;
        fc = s[i];
        if ( (((fc == 45) && ((s[(i + 1)]) >= 46)) && ((s[(i + 1)]) <= 57)) || ((fc >= 48) && (fc <= 57)) ) {
          var is_double : Bool = false
          sp = i;
          i = 1 + i;
          c = s[i];
          while ((i < __len) && ((((c >= 48) && (c <= 57)) || (c == (46))) || ((i == sp) && ((c == (43)) || (c == (45)))))) {
            if ( c == (46) ) {
              is_double = true;
            }
            i = 1 + i;
            c = s[i];
          }
          ep = i;
          let new_num_node : CodeNode = CodeNode(source : code!, start : sp, end : ep)
          if ( is_double ) {
            new_num_node.parsed_type = 2;
            new_num_node.value_type = 2;
            new_num_node.double_value = (Double((String(data: Data(bytes:s[sp ..< ep]), encoding: .utf8)!)))!;
          } else {
            new_num_node.parsed_type = 3;
            new_num_node.value_type = 3;
            new_num_node.int_value = (Int((String(data: Data(bytes:s[sp ..< ep]), encoding: .utf8)!)))!;
          }
          self.insert_node(p_node : new_num_node)
          continue;
        }
        if ( fc == 34 ) {
          sp = i + 1;
          ep = sp;
          c = s[i];
          var must_encode : Bool = false
          while (i < __len) {
            i = 1 + i;
            c = s[i];
            if ( c == 34 ) {
              break;
            }
            if ( c == 92 ) {
              i = 1 + i;
              if ( i < __len ) {
                must_encode = true;
                c = s[i];
              } else {
                break;
              }
            }
          }
          ep = i;
          if ( i < __len ) {
            var encoded_str : String = ""
            if ( must_encode ) {
              let orig_str : [UInt8] = Array((String(data: Data(bytes:s[sp ..< ep]), encoding: .utf8)!).utf8)
              let str_length : Int = orig_str.count
              var ii : Int = 0
              while (ii < str_length) {
                let cc : UInt8 = orig_str[ii]
                if ( cc == 92 ) {
                  let next_ch : UInt8 = orig_str[(ii + 1)]
                  switch (next_ch) {
                    case 34 : 
                      encoded_str = encoded_str + ((String( Character( UnicodeScalar(34 )! ))));
                    case 92 : 
                      encoded_str = encoded_str + ((String( Character( UnicodeScalar(92 )! ))));
                    case 47 : 
                      encoded_str = encoded_str + ((String( Character( UnicodeScalar(47 )! ))));
                    case 98 : 
                      encoded_str = encoded_str + ((String( Character( UnicodeScalar(8 )! ))));
                    case 102 : 
                      encoded_str = encoded_str + ((String( Character( UnicodeScalar(12 )! ))));
                    case 110 : 
                      encoded_str = encoded_str + ((String( Character( UnicodeScalar(10 )! ))));
                    case 114 : 
                      encoded_str = encoded_str + ((String( Character( UnicodeScalar(13 )! ))));
                    case 116 : 
                      encoded_str = encoded_str + ((String( Character( UnicodeScalar(9 )! ))));
                    case 117 : 
                      ii = ii + 4;
                    default: 
                      break;
                  }
                  ii = ii + 2;
                } else {
                  encoded_str = encoded_str + (String(data: Data(bytes:orig_str[ii ..< (1 + ii)]), encoding: .utf8)!);
                  ii = ii + 1;
                }
              }
            }
            let new_str_node : CodeNode = CodeNode(source : code!, start : sp, end : ep)
            new_str_node.parsed_type = 4;
            new_str_node.value_type = 4;
            if ( must_encode ) {
              new_str_node.string_value = encoded_str;
            } else {
              new_str_node.string_value = String(data: Data(bytes:s[sp ..< ep]), encoding: .utf8)!;
            }
            self.insert_node(p_node : new_str_node)
            i = 1 + i;
            continue;
          }
        }
        if ( (((fc == (116)) && ((s[(i + 1)]) == (114))) && ((s[(i + 2)]) == (117))) && ((s[(i + 3)]) == (101)) ) {
          let new_true_node : CodeNode = CodeNode(source : code!, start : sp, end : sp + 4)
          new_true_node.value_type = 5;
          new_true_node.parsed_type = 5;
          new_true_node.boolean_value = true;
          self.insert_node(p_node : new_true_node)
          i = i + 4;
          continue;
        }
        if ( ((((fc == (102)) && ((s[(i + 1)]) == (97))) && ((s[(i + 2)]) == (108))) && ((s[(i + 3)]) == (115))) && ((s[(i + 4)]) == (101)) ) {
          let new_f_node : CodeNode = CodeNode(source : code!, start : sp, end : sp + 5)
          new_f_node.value_type = 5;
          new_f_node.parsed_type = 5;
          new_f_node.boolean_value = false;
          self.insert_node(p_node : new_f_node)
          i = i + 5;
          continue;
        }
        if ( fc == (64) ) {
          i = i + 1;
          sp = i;
          ep = i;
          c = s[i];
          while (((((i < __len) && ((s[i]) > 32)) && (c != 40)) && (c != 41)) && (c != (125))) {
            i = 1 + i;
            c = s[i];
          }
          ep = i;
          if ( (i < __len) && (ep > sp) ) {
            let a_node2 : CodeNode = CodeNode(source : code!, start : sp, end : ep)
            let a_name : String = String(data: Data(bytes:s[sp ..< ep]), encoding: .utf8)!
            a_node2.expression = true;
            curr_node = a_node2;
            parents.append(a_node2)
            i = i + 1;
            paren_cnt = paren_cnt + 1;
            self.parse()
            var use_first : Bool = false
            if ( 1 == (a_node2.children.count) ) {
              let ch1 : CodeNode = a_node2.children[0]
              use_first = ch1.isPrimitive();
            }
            if ( use_first ) {
              let theNode : CodeNode = a_node2.children.remove(at:0)
              curr_node!.props[a_name] = theNode
            } else {
              curr_node!.props[a_name] = a_node2
            }
            curr_node!.prop_keys.append(a_name)
            continue;
          }
        }
        var ns_list : [String] = [String]()
        var last_ns : Int = i
        var ns_cnt : Int = 1
        var vref_had_type_ann : Bool = false
        var vref_ann_node : CodeNode?
        var vref_end : Int = i
        if ( (((((i < __len) && ((s[i]) > 32)) && (c != 58)) && (c != 40)) && (c != 41)) && (c != (125)) ) {
          if ( curr_node!.is_block_node == true ) {
            let new_expr_node : CodeNode = CodeNode(source : code!, start : sp, end : ep)
            new_expr_node.parent = curr_node;
            new_expr_node.expression = true;
            curr_node!.children.append(new_expr_node)
            curr_node = new_expr_node;
            parents.append(new_expr_node)
            paren_cnt = 1 + paren_cnt;
            self.parse()
            continue;
          }
        }
        var op_c : Int = 0
        op_c = self.getOperator();
        var last_was_newline : Bool = false
        if ( op_c > 0 ) {
        } else {
          while ((((((i < __len) && ((s[i]) > 32)) && (c != 58)) && (c != 40)) && (c != 41)) && (c != (125))) {
            if ( i > sp ) {
              let is_opchar : Int = self.isOperator()
              if ( is_opchar > 0 ) {
                break;
              }
            }
            i = 1 + i;
            c = s[i];
            if ( (c == 10) || (c == 13) ) {
              last_was_newline = true;
              break;
            }
            if ( c == (46) ) {
              ns_list.append(String(data: Data(bytes:s[last_ns ..< i]), encoding: .utf8)!)
              last_ns = i + 1;
              ns_cnt = 1 + ns_cnt;
            }
            if ( (i > vref_end) && (c == (64)) ) {
              vref_had_type_ann = true;
              vref_end = i;
              vref_ann_node = self.parse_raw_annotation();
              c = s[i];
              break;
            }
          }
        }
        ep = i;
        if ( vref_had_type_ann ) {
          ep = vref_end;
        }
        ns_list.append(String(data: Data(bytes:s[last_ns ..< ep]), encoding: .utf8)!)
        c = s[i];
        while (((i < __len) && (c <= 32)) && (false == last_was_newline)) {
          i = 1 + i;
          c = s[i];
          if ( is_block_parent && ((c == 10) || (c == 13)) ) {
            i = i - 1;
            c = s[i];
            had_lf = true;
            break;
          }
        }
        if ( c == 58 ) {
          i = i + 1;
          while ((i < __len) && ((s[i]) <= 32)) {
            i = 1 + i;
          }
          var vt_sp : Int = i
          var vt_ep : Int = i
          c = s[i];
          if ( c == (40) ) {
            let vann_arr2 : CodeNode = self.parse_raw_annotation()
            vann_arr2.expression = true;
            let new_expr_node_1 : CodeNode = CodeNode(source : code!, start : sp, end : vt_ep)
            new_expr_node_1.vref = String(data: Data(bytes:s[sp ..< ep]), encoding: .utf8)!;
            new_expr_node_1.ns = ns_list;
            new_expr_node_1.expression_value = vann_arr2;
            new_expr_node_1.parsed_type = 15;
            new_expr_node_1.value_type = 15;
            if ( vref_had_type_ann ) {
              new_expr_node_1.vref_annotation = vref_ann_node;
              new_expr_node_1.has_vref_annotation = true;
            }
            curr_node!.children.append(new_expr_node_1)
            continue;
          }
          if ( c == (91) ) {
            i = i + 1;
            vt_sp = i;
            var hash_sep : Int = 0
            var had_array_type_ann : Bool = false
            c = s[i];
            while (((i < __len) && (c > 32)) && (c != 93)) {
              i = 1 + i;
              c = s[i];
              if ( c == (58) ) {
                hash_sep = i;
              }
              if ( c == (64) ) {
                had_array_type_ann = true;
                break;
              }
            }
            vt_ep = i;
            if ( hash_sep > 0 ) {
              vt_ep = i;
              let type_name : String = String(data: Data(bytes:s[(1 + hash_sep) ..< vt_ep]), encoding: .utf8)!
              let key_type_name : String = String(data: Data(bytes:s[vt_sp ..< hash_sep]), encoding: .utf8)!
              let new_hash_node : CodeNode = CodeNode(source : code!, start : sp, end : vt_ep)
              new_hash_node.vref = String(data: Data(bytes:s[sp ..< ep]), encoding: .utf8)!;
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
                let vann_hash : CodeNode = self.parse_raw_annotation()
                new_hash_node.type_annotation = vann_hash;
                new_hash_node.has_type_annotation = true;
                print("--> parsed HASH TYPE annotation")
              }
              new_hash_node.parent = curr_node;
              curr_node!.children.append(new_hash_node)
              i = 1 + i;
              continue;
            } else {
              vt_ep = i;
              let type_name_1 : String = String(data: Data(bytes:s[vt_sp ..< vt_ep]), encoding: .utf8)!
              let new_arr_node : CodeNode = CodeNode(source : code!, start : sp, end : vt_ep)
              new_arr_node.vref = String(data: Data(bytes:s[sp ..< ep]), encoding: .utf8)!;
              new_arr_node.ns = ns_list;
              new_arr_node.parsed_type = 6;
              new_arr_node.value_type = 6;
              new_arr_node.array_type = type_name_1;
              new_arr_node.parent = curr_node;
              curr_node!.children.append(new_arr_node)
              if ( vref_had_type_ann ) {
                new_arr_node.vref_annotation = vref_ann_node;
                new_arr_node.has_vref_annotation = true;
              }
              if ( had_array_type_ann ) {
                let vann_arr : CodeNode = self.parse_raw_annotation()
                new_arr_node.type_annotation = vann_arr;
                new_arr_node.has_type_annotation = true;
                print("--> parsed ARRAY TYPE annotation")
              }
              i = 1 + i;
              continue;
            }
          }
          var had_type_ann : Bool = false
          while (((((((i < __len) && ((s[i]) > 32)) && (c != 58)) && (c != 40)) && (c != 41)) && (c != (125))) && (c != (44))) {
            i = 1 + i;
            c = s[i];
            if ( c == (64) ) {
              had_type_ann = true;
              break;
            }
          }
          if ( i < __len ) {
            vt_ep = i;
            /** unused:  let type_name_2 : String = String(data: Data(bytes:s[vt_sp ..< vt_ep]), encoding: .utf8)!   **/ 
            let new_ref_node : CodeNode = CodeNode(source : code!, start : sp, end : ep)
            new_ref_node.vref = String(data: Data(bytes:s[sp ..< ep]), encoding: .utf8)!;
            new_ref_node.ns = ns_list;
            new_ref_node.parsed_type = 9;
            new_ref_node.value_type = 9;
            new_ref_node.type_name = String(data: Data(bytes:s[vt_sp ..< vt_ep]), encoding: .utf8)!;
            new_ref_node.parent = curr_node;
            if ( vref_had_type_ann ) {
              new_ref_node.vref_annotation = vref_ann_node;
              new_ref_node.has_vref_annotation = true;
            }
            curr_node!.children.append(new_ref_node)
            if ( had_type_ann ) {
              let vann : CodeNode = self.parse_raw_annotation()
              new_ref_node.type_annotation = vann;
              new_ref_node.has_type_annotation = true;
            }
            continue;
          }
        } else {
          if ( (i < __len) && (ep > sp) ) {
            let new_vref_node : CodeNode = CodeNode(source : code!, start : sp, end : ep)
            new_vref_node.vref = String(data: Data(bytes:s[sp ..< ep]), encoding: .utf8)!;
            new_vref_node.parsed_type = 9;
            new_vref_node.value_type = 9;
            new_vref_node.ns = ns_list;
            new_vref_node.parent = curr_node;
            let op_pred : Int = self.getOperatorPred(str : new_vref_node.vref)
            if ( new_vref_node.vref == "," ) {
              curr_node!.infix_operator = false;
              continue;
            }
            var pTarget : CodeNode? = curr_node
            if ( curr_node!.infix_operator ) {
              let iNode : CodeNode? = curr_node!.infix_node
              if ( (op_pred > 0) || (iNode!.to_the_right == false) ) {
                pTarget = iNode;
              } else {
                let rn : CodeNode? = iNode!.right_node
                new_vref_node.parent = rn;
                pTarget = rn;
              }
            }
            pTarget!.children.append(new_vref_node)
            if ( vref_had_type_ann ) {
              new_vref_node.vref_annotation = vref_ann_node;
              new_vref_node.has_vref_annotation = true;
            }
            if ( (i + 1) < __len ) {
              if ( ((s[(i + 1)]) == (40)) || ((s[(i + 0)]) == (40)) ) {
                if ( ((0 == op_pred) && curr_node!.infix_operator) && (1 == (curr_node!.children.count)) ) {
                }
              }
            }
            if ( ((op_pred > 0) && curr_node!.infix_operator) || ((op_pred > 0) && ((curr_node!.children.count) >= 2)) ) {
              if ( (op_pred == 3) && (2 == (curr_node!.children.count)) ) {
                let n_ch : CodeNode = curr_node!.children.remove(at:0)
                curr_node!.children.append(n_ch)
              } else {
                if ( false == curr_node!.infix_operator ) {
                  let if_node : CodeNode = CodeNode(source : code!, start : sp, end : ep)
                  curr_node!.infix_node = if_node;
                  curr_node!.infix_operator = true;
                  if_node.infix_subnode = true;
                  curr_node!.value_type = 0;
                  curr_node!.expression = true;
                  if_node.expression = true;
                  var ch_cnt : Int = curr_node!.children.count
                  var ii_1 : Int = 0
                  let start_from : Int = ch_cnt - 2
                  let keep_nodes : CodeNode = CodeNode(source : code!, start : sp, end : ep)
                  while (ch_cnt > 0) {
                    let n_ch_1 : CodeNode = curr_node!.children.remove(at:0)
                    var p_target : CodeNode = if_node
                    if ( (ii_1 < start_from) || n_ch_1.infix_subnode ) {
                      p_target = keep_nodes;
                    }
                    p_target.children.append(n_ch_1)
                    ch_cnt = ch_cnt - 1;
                    ii_1 = 1 + ii_1;
                  }
                  for ( _ , keep ) in keep_nodes.children.enumerated() {
                    curr_node!.children.append(keep)
                  }
                  curr_node!.children.append(if_node)
                }
                let ifNode : CodeNode? = curr_node!.infix_node
                let new_op_node : CodeNode = CodeNode(source : code!, start : sp, end : ep)
                new_op_node.expression = true;
                new_op_node.parent = ifNode;
                var until_index : Int = (ifNode!.children.count) - 1
                var to_right : Bool = false
                let just_continue : Bool = false
                if ( (ifNode!.operator_pred > 0) && (ifNode!.operator_pred < op_pred) ) {
                  to_right = true;
                }
                if ( (ifNode!.operator_pred > 0) && (ifNode!.operator_pred > op_pred) ) {
                  ifNode!.to_the_right = false;
                }
                if ( (ifNode!.operator_pred > 0) && (ifNode!.operator_pred == op_pred) ) {
                  to_right = ifNode!.to_the_right;
                }
                /** unused:  let opTarget : CodeNode? = ifNode   **/ 
                if ( to_right ) {
                  let op_node : CodeNode = ifNode!.children.remove(at:until_index)
                  let last_value : CodeNode = ifNode!.children.remove(at:(until_index - 1))
                  new_op_node.children.append(op_node)
                  new_op_node.children.append(last_value)
                } else {
                  if ( false == just_continue ) {
                    while (until_index > 0) {
                      let what_to_add : CodeNode = ifNode!.children.remove(at:0)
                      new_op_node.children.append(what_to_add)
                      until_index = until_index - 1;
                    }
                  }
                }
                if ( to_right || (false == just_continue) ) {
                  ifNode!.children.append(new_op_node)
                }
                if ( to_right ) {
                  ifNode!.right_node = new_op_node;
                  ifNode!.to_the_right = true;
                }
                ifNode!.operator_pred = op_pred;
                continue;
              }
            }
            continue;
          }
        }
        if ( (c == 41) || (c == (125)) ) {
          if ( ((c == (125)) && is_block_parent) && ((curr_node!.children.count) > 0) ) {
            _ = self.end_expression()
          }
          i = 1 + i;
          paren_cnt = paren_cnt - 1;
          if ( paren_cnt < 0 ) {
            break;
          }
          parents.removeLast();
          if ( curr_node != nil  ) {
            curr_node!.ep = i;
          }
          if ( (parents.count) > 0 ) {
            curr_node = parents[((parents.count) - 1)];
          } else {
            curr_node = rootNode;
          }
          break;
        }
        if ( last_i == i ) {
          i = 1 + i;
        }
      }
    }
  }
}
func ==(l: RangerArgMatch, r: RangerArgMatch) -> Bool {
  return l === r
}
class RangerArgMatch : Equatable  { 
  var matched : [String:String] = [String:String]()
  func matchArguments(args : CodeNode, callArgs : CodeNode, ctx : RangerAppWriterContext, firstArgIndex : Int) -> Bool {
    /** unused:  let fc : CodeNode = callArgs.children[0]   **/ 
    var missed_args : [String] = [String]()
    var all_matched : Bool = true
    if ( ((args.children.count) == 0) && ((callArgs.children.count) > 1) ) {
      return false;
    }
    var lastArg : CodeNode?
    for ( i , callArg ) in callArgs.children.enumerated() {
      if ( i == 0 ) {
        continue;
      }
      let arg_index : Int = i - 1
      if ( arg_index < (args.children.count) ) {
        lastArg = args.children[arg_index];
      }
      let arg : CodeNode = lastArg!
      if ( arg.hasFlag(flagName : "ignore") ) {
        continue;
      }
      if ( arg.hasFlag(flagName : "mutable") ) {
        if ( callArg.hasParamDesc ) {
          let pa : RangerAppParamDesc? = callArg.paramDesc
          let b : Bool = pa!.nameNode!.hasFlag(flagName : "mutable")
          if ( b == false ) {
            missed_args.append("was mutable")
            all_matched = false;
          }
        } else {
          all_matched = false;
        }
      }
      if ( arg.hasFlag(flagName : "optional") ) {
        if ( callArg.hasParamDesc ) {
          let pa_1 : RangerAppParamDesc? = callArg.paramDesc
          let b_1 : Bool = pa_1!.nameNode!.hasFlag(flagName : "optional")
          if ( b_1 == false ) {
            missed_args.append("optional was missing")
            all_matched = false;
          }
        } else {
          if ( callArg.hasFlag(flagName : "optional") ) {
          } else {
            all_matched = false;
          }
        }
      }
      if ( callArg.hasFlag(flagName : "optional") ) {
        if ( false == arg.hasFlag(flagName : "optional") ) {
          all_matched = false;
        }
      }
      if ( (arg.value_type != 7) && (arg.value_type != 6) ) {
        if ( callArg.eval_type == 11 ) {
          if ( arg.type_name == "enum" ) {
            continue;
          }
        }
        if ( false == self.add(tplKeyword : arg.type_name, typeName : callArg.eval_type_name, ctx : ctx) ) {
          all_matched = false;
          return all_matched;
        }
      }
      if ( arg.value_type == 6 ) {
        if ( false == self.add(tplKeyword : arg.array_type, typeName : callArg.eval_array_type, ctx : ctx) ) {
          print("--> Failed to add the argument  ")
          all_matched = false;
        }
      }
      if ( arg.value_type == 7 ) {
        if ( false == self.add(tplKeyword : arg.key_type, typeName : callArg.eval_key_type, ctx : ctx) ) {
          print("--> Failed to add the key argument  ")
          all_matched = false;
        }
        if ( false == self.add(tplKeyword : arg.array_type, typeName : callArg.eval_array_type, ctx : ctx) ) {
          print("--> Failed to add the key argument  ")
          all_matched = false;
        }
      }
      var did_match : Bool = false
      if ( self.doesMatch(arg : arg, node : callArg, ctx : ctx) ) {
        did_match = true;
      } else {
        missed_args.append((("matching arg " + arg.vref) + " faileg against ") + callArg.vref)
      }
      if ( false == did_match ) {
        all_matched = false;
      }
    }
    return all_matched;
  }
  func add(tplKeyword : String, typeName : String, ctx : RangerAppWriterContext) -> Bool {
    switch (tplKeyword) {
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
      default :
        break
    }
    if ( (tplKeyword.characters.count) > 1 ) {
      return true;
    }
    if ( matched[tplKeyword] != nil ) {
      let s : String = (matched[tplKeyword])!
      if ( self.areEqualTypes(type1 : s, type2 : typeName, ctx : ctx) ) {
        return true;
      }
      if ( s == typeName ) {
        return true;
      } else {
        return false;
      }
    }
    matched[tplKeyword] = typeName
    return true;
  }
  func doesDefsMatch(arg : CodeNode, node : CodeNode, ctx : RangerAppWriterContext) -> Bool {
    if ( node.value_type == 11 ) {
      if ( arg.type_name == "enum" ) {
        return true;
      } else {
        return false;
      }
    }
    if ( (arg.value_type != 7) && (arg.value_type != 6) ) {
      let eq : Bool = self.areEqualTypes(type1 : arg.type_name, type2 : node.type_name, ctx : ctx)
      let t_name : String = arg.type_name
      switch (t_name) {
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
        default :
          break
      }
      return eq;
    }
    if ( (arg.value_type == 6) && (node.eval_type == 6) ) {
      let same_arrays : Bool = self.areEqualTypes(type1 : arg.array_type, type2 : node.array_type, ctx : ctx)
      return same_arrays;
    }
    if ( (arg.value_type == 7) && (node.eval_type == 7) ) {
      let same_arrays_1 : Bool = self.areEqualTypes(type1 : arg.array_type, type2 : node.array_type, ctx : ctx)
      let same_keys : Bool = self.areEqualTypes(type1 : arg.key_type, type2 : node.key_type, ctx : ctx)
      return same_arrays_1 && same_keys;
    }
    return false;
  }
  func doesMatch(arg : CodeNode, node : CodeNode, ctx : RangerAppWriterContext) -> Bool {
    if ( node.value_type == 11 ) {
      if ( arg.type_name == "enum" ) {
        return true;
      } else {
        return false;
      }
    }
    if ( (arg.value_type != 7) && (arg.value_type != 6) ) {
      let eq : Bool = self.areEqualTypes(type1 : arg.type_name, type2 : node.eval_type_name, ctx : ctx)
      let t_name : String = arg.type_name
      switch (t_name) {
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
        default :
          break
      }
      return eq;
    }
    if ( (arg.value_type == 6) && (node.eval_type == 6) ) {
      let same_arrays : Bool = self.areEqualTypes(type1 : arg.array_type, type2 : node.eval_array_type, ctx : ctx)
      return same_arrays;
    }
    if ( (arg.value_type == 7) && (node.eval_type == 7) ) {
      let same_arrays_1 : Bool = self.areEqualTypes(type1 : arg.array_type, type2 : node.eval_array_type, ctx : ctx)
      let same_keys : Bool = self.areEqualTypes(type1 : arg.key_type, type2 : node.eval_key_type, ctx : ctx)
      return same_arrays_1 && same_keys;
    }
    return false;
  }
  func areEqualTypes(type1 : String, type2 : String, ctx : RangerAppWriterContext) -> Bool {
    var t_name : String = type1
    if ( matched[type1] != nil ) {
      t_name = (matched[type1])!;
    }
    switch (t_name) {
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
      default :
        break
    }
    if ( ctx.isDefinedClass(name : t_name) && ctx.isDefinedClass(name : type2) ) {
      let c1 : RangerAppClassDesc = ctx.findClass(name : t_name)
      let c2 : RangerAppClassDesc = ctx.findClass(name : type2)
      if ( c1.isSameOrParentClass(class_name : type2, ctx : ctx) ) {
        return true;
      }
      if ( c2.isSameOrParentClass(class_name : t_name, ctx : ctx) ) {
        return true;
      }
    } else {
      if ( ctx.isDefinedClass(name : t_name) ) {
        let c1_1 : RangerAppClassDesc = ctx.findClass(name : t_name)
        if ( c1_1.isSameOrParentClass(class_name : type2, ctx : ctx) ) {
          return true;
        }
      }
    }
    return t_name == type2;
  }
  func getTypeName(n : String) -> String {
    var t_name : String = n
    if ( matched[t_name] != nil ) {
      t_name = (matched[t_name])!;
    }
    if ( 0 == (t_name.characters.count) ) {
      return "";
    }
    return t_name;
  }
  func getType(n : String) -> Int {
    var t_name : String = n
    if ( matched[t_name] != nil ) {
      t_name = (matched[t_name])!;
    }
    if ( 0 == (t_name.characters.count) ) {
      return 0;
    }
    switch (t_name) {
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
      default :
        break
    }
    return 8;
  }
  func setRvBasedOn(arg : CodeNode, node : CodeNode) -> Bool {
    if ( arg.hasFlag(flagName : "optional") ) {
      node.setFlag(flagName : "optional")
    }
    if ( (arg.value_type != 7) && (arg.value_type != 6) ) {
      node.eval_type = self.getType(n : arg.type_name);
      node.eval_type_name = self.getTypeName(n : arg.type_name);
      return true;
    }
    if ( arg.value_type == 6 ) {
      node.eval_type = 6;
      node.eval_array_type = self.getTypeName(n : arg.array_type);
      return true;
    }
    if ( arg.value_type == 7 ) {
      node.eval_type = 7;
      node.eval_key_type = self.getTypeName(n : arg.key_type);
      node.eval_array_type = self.getTypeName(n : arg.array_type);
      return true;
    }
    return false;
  }
}
func ==(l: DictNode, r: DictNode) -> Bool {
  return l === r
}
class DictNode : Equatable  { 
  var is_property : Bool = false
  var is_property_value : Bool = false
  var vref : String = ""
  var value_type : Int = 6
  var double_value : Double = 0.0
  var int_value : Int = 0
  var string_value : String = ""
  var boolean_value : Bool = false
  var object_value : DictNode?
  var children : [DictNode] = [DictNode]()
  var objects : [String:DictNode] = [String:DictNode]()
  var keys : [String] = [String]()
  static func createEmptyObject() -> DictNode {
    let v : DictNode = DictNode()
    v.value_type = 6;
    return v;
  }
  func EncodeString(orig_str : String) -> String {
    var encoded_str : String = ""
    /** unused:  let str_length : Int = orig_str.characters.count   **/ 
    var ii : Int = 0
    let buff : [UInt8] = Array(orig_str.utf8)
    let cb_len : Int = buff.count
    while (ii < cb_len) {
      let cc : UInt8 = buff[ii]
      switch (cc) {
        case 8 : 
          encoded_str = (encoded_str + ((String( Character( UnicodeScalar(92 )! ))))) + ((String( Character( UnicodeScalar(98 )! ))));
        case 9 : 
          encoded_str = (encoded_str + ((String( Character( UnicodeScalar(92 )! ))))) + ((String( Character( UnicodeScalar(116 )! ))));
        case 10 : 
          encoded_str = (encoded_str + ((String( Character( UnicodeScalar(92 )! ))))) + ((String( Character( UnicodeScalar(110 )! ))));
        case 12 : 
          encoded_str = (encoded_str + ((String( Character( UnicodeScalar(92 )! ))))) + ((String( Character( UnicodeScalar(102 )! ))));
        case 13 : 
          encoded_str = (encoded_str + ((String( Character( UnicodeScalar(92 )! ))))) + ((String( Character( UnicodeScalar(114 )! ))));
        case 34 : 
          encoded_str = (encoded_str + ((String( Character( UnicodeScalar(92 )! ))))) + "\"";
        case 92 : 
          encoded_str = (encoded_str + ((String( Character( UnicodeScalar(92 )! ))))) + ((String( Character( UnicodeScalar(92 )! ))));
        case 47 : 
          encoded_str = (encoded_str + ((String( Character( UnicodeScalar(92 )! ))))) + ((String( Character( UnicodeScalar(47 )! ))));
        default: 
          encoded_str = encoded_str + ((String( Character( UnicodeScalar(cc ) ))));
          break;
      }
      ii = 1 + ii;
    }
    return encoded_str;
  }
  func addString(key : String, value : String) -> Void {
    if ( value_type == 6 ) {
      let v : DictNode = DictNode()
      v.string_value = value;
      v.value_type = 3;
      v.vref = key;
      v.is_property = true;
      keys.append(key)
      objects[key] = v
    }
  }
  func addDouble(key : String, value : Double) -> Void {
    if ( value_type == 6 ) {
      let v : DictNode = DictNode()
      v.double_value = value;
      v.value_type = 1;
      v.vref = key;
      v.is_property = true;
      keys.append(key)
      objects[key] = v
    }
  }
  func addInt(key : String, value : Int) -> Void {
    if ( value_type == 6 ) {
      let v : DictNode = DictNode()
      v.int_value = value;
      v.value_type = 2;
      v.vref = key;
      v.is_property = true;
      keys.append(key)
      objects[key] = v
    }
  }
  func addBoolean(key : String, value : Bool) -> Void {
    if ( value_type == 6 ) {
      let v : DictNode = DictNode()
      v.boolean_value = value;
      v.value_type = 4;
      v.vref = key;
      v.is_property = true;
      keys.append(key)
      objects[key] = v
    }
  }
  func addObject(key : String) -> DictNode? {
    var v : DictNode?
    if ( value_type == 6 ) {
      let p : DictNode = DictNode()
      v = DictNode();
      p.value_type = 6;
      p.vref = key;
      p.is_property = true;
      v!.value_type = 6;
      v!.vref = key;
      v!.is_property_value = true;
      p.object_value = v;
      keys.append(key)
      objects[key] = p
      return v;
    }
    return v;
  }
  func setObject(key : String, value : DictNode) -> Void {
    if ( value_type == 6 ) {
      let p : DictNode = DictNode()
      p.value_type = 6;
      p.vref = key;
      p.is_property = true;
      value.is_property_value = true;
      value.vref = key;
      p.object_value = value;
      keys.append(key)
      objects[key] = p
    }
  }
  func addArray(key : String) -> DictNode? {
    var v : DictNode?
    if ( value_type == 6 ) {
      v = DictNode();
      v!.value_type = 5;
      v!.vref = key;
      v!.is_property = true;
      keys.append(key)
      objects[key] = v!
      return v;
    }
    return v;
  }
  func push(obj : DictNode) -> Void {
    if ( value_type == 5 ) {
      children.append(obj)
    }
  }
  func getDoubleAt(index : Int) -> Double {
    if ( index < (children.count) ) {
      let k : DictNode = children[index]
      return k.double_value;
    }
    return 0.0;
  }
  func getStringAt(index : Int) -> String {
    if ( index < (children.count) ) {
      let k : DictNode = children[index]
      return k.string_value;
    }
    return "";
  }
  func getIntAt(index : Int) -> Int {
    if ( index < (children.count) ) {
      let k : DictNode = children[index]
      return k.int_value;
    }
    return 0;
  }
  func getBooleanAt(index : Int) -> Bool {
    if ( index < (children.count) ) {
      let k : DictNode = children[index]
      return k.boolean_value;
    }
    return false;
  }
  func getString(key : String) -> String? {
    var res : String?
    if ( objects[key] != nil ) {
      let k : DictNode? = objects[key]
      res = k!.string_value;
    }
    return res;
  }
  func getDouble(key : String) -> Double? {
    var res : Double?
    if ( objects[key] != nil ) {
      let k : DictNode? = objects[key]
      res = k!.double_value;
    }
    return res;
  }
  func getInt(key : String) -> Int? {
    var res : Int?
    if ( objects[key] != nil ) {
      let k : DictNode? = objects[key]
      res = k!.int_value;
    }
    return res;
  }
  func getBoolean(key : String) -> Bool? {
    var res : Bool?
    if ( objects[key] != nil ) {
      let k : DictNode? = objects[key]
      res = k!.boolean_value;
    }
    return res;
  }
  func getArray(key : String) -> DictNode? {
    var res : DictNode?
    if ( objects[key] != nil ) {
      let obj : DictNode? = objects[key]
      if ( obj!.is_property ) {
        res = obj!.object_value;
      }
    }
    return res;
  }
  func getArrayAt(index : Int) -> DictNode? {
    var res : DictNode?
    if ( index < (children.count) ) {
      res = children[index];
    }
    return res;
  }
  func getObject(key : String) -> DictNode? {
    var res : DictNode?
    if ( objects[key] != nil ) {
      let obj : DictNode? = objects[key]
      if ( obj!.is_property ) {
        res = obj!.object_value;
      }
    }
    return res;
  }
  func getObjectAt(index : Int) -> DictNode? {
    var res : DictNode?
    if ( index < (children.count) ) {
      res = children[index];
    }
    return res;
  }
  func stringify() -> String {
    if ( is_property ) {
      if ( value_type == 7 ) {
        return (("\"" + vref) + "\"") + ":null";
      }
      if ( value_type == 4 ) {
        if ( boolean_value ) {
          return ((("\"" + vref) + "\"") + ":") + "true";
        } else {
          return ((("\"" + vref) + "\"") + ":") + "false";
        }
      }
      if ( value_type == 1 ) {
        return ((("\"" + vref) + "\"") + ":") + String(double_value);
      }
      if ( value_type == 2 ) {
        return ((("\"" + vref) + "\"") + ":") + String(int_value);
      }
      if ( value_type == 3 ) {
        return ((((("\"" + vref) + "\"") + ":") + "\"") + self.EncodeString(orig_str : string_value)) + "\"";
      }
    } else {
      if ( value_type == 7 ) {
        return "null";
      }
      if ( value_type == 1 ) {
        return "" + String(double_value);
      }
      if ( value_type == 2 ) {
        return "" + String(int_value);
      }
      if ( value_type == 3 ) {
        return ("\"" + self.EncodeString(orig_str : string_value)) + "\"";
      }
      if ( value_type == 4 ) {
        if ( boolean_value ) {
          return "true";
        } else {
          return "false";
        }
      }
    }
    if ( value_type == 5 ) {
      var str : String = ""
      if ( is_property ) {
        str = (("\"" + vref) + "\"") + ":[";
      } else {
        str = "[";
      }
      for ( i , item ) in children.enumerated() {
        if ( i > 0 ) {
          str = str + ",";
        }
        str = str + item.stringify();
      }
      str = str + "]";
      return str;
    }
    if ( value_type == 6 ) {
      var str_1 : String = ""
      if ( is_property ) {
        return ((("\"" + vref) + "\"") + ":") + object_value!.stringify();
      } else {
        str_1 = "{";
        for ( i_1 , key ) in keys.enumerated() {
          if ( i_1 > 0 ) {
            str_1 = str_1 + ",";
          }
          let item_1 : DictNode? = objects[key]
          str_1 = str_1 + item_1!.stringify();
        }
        str_1 = str_1 + "}";
        return str_1;
      }
    }
    return "";
  }
}
func ==(l: RangerSerializeClass, r: RangerSerializeClass) -> Bool {
  return l === r
}
class RangerSerializeClass : Equatable  { 
  func isSerializedClass(cName : String, ctx : RangerAppWriterContext) -> Bool {
    if ( ctx.hasClass(name : cName) ) {
      let clDecl : RangerAppClassDesc = ctx.findClass(name : cName)
      if ( clDecl.is_serialized ) {
        return true;
      }
    }
    return false;
  }
  func createWRWriter(pvar : RangerAppParamDesc, nn : CodeNode, ctx : RangerAppWriterContext, wr : CodeWriter) -> Void {
    wr.out(str : "def key@(lives):DictNode (new DictNode())", newLine : true)
    wr.out(str : ("key.addString(\"n\" \"" + pvar.name) + "\")", newLine : true)
    if ( nn.value_type == 6 ) {
      if ( self.isSerializedClass(cName : nn.array_type, ctx : ctx) ) {
        wr.out(str : ("def values:DictNode (keys.addArray(\"" + pvar.compiledName) + "\"))", newLine : true)
        wr.out(str : ((("for this." + pvar.compiledName) + " item:") + nn.array_type) + " i {", newLine : true)
        wr.indent(delta : 1)
        wr.out(str : "def obj@(lives):DictNode (item.serializeToDict())", newLine : true)
        wr.out(str : "values.push( obj )", newLine : true)
        wr.indent(delta : -1)
        wr.out(str : "}", newLine : true)
      }
      return;
    }
    if ( nn.value_type == 7 ) {
      if ( self.isSerializedClass(cName : nn.array_type, ctx : ctx) ) {
        wr.out(str : ("def values:DictNode (keys.addObject(\"" + pvar.compiledName) + "\"))", newLine : true)
        wr.out(str : ("for this." + pvar.compiledName) + " keyname {", newLine : true)
        wr.indent(delta : 1)
        wr.out(str : ("def item:DictNode (unwrap (get this." + pvar.compiledName) + " keyname))", newLine : true)
        wr.out(str : "def obj@(lives):DictNode (item.serializeToDict())", newLine : true)
        wr.out(str : "values.setObject( obj )", newLine : true)
        wr.indent(delta : -1)
        wr.out(str : "}", newLine : true)
      }
      if ( nn.key_type == "string" ) {
        wr.out(str : ("def values:DictNode (keys.addObject(\"" + pvar.compiledName) + "\"))", newLine : true)
        wr.out(str : ("for this." + pvar.compiledName) + " keyname {", newLine : true)
        wr.indent(delta : 1)
        if ( nn.array_type == "string" ) {
          wr.out(str : ("values.addString(keyname (unwrap (get this." + pvar.compiledName) + " keyname)))", newLine : true)
        }
        if ( nn.array_type == "int" ) {
          wr.out(str : ("values.addInt(keyname (unwrap (get this." + pvar.compiledName) + " keyname)))", newLine : true)
        }
        if ( nn.array_type == "boolean" ) {
          wr.out(str : ("values.addBoolean(keyname (unwrap (get this." + pvar.compiledName) + " keyname)))", newLine : true)
        }
        if ( nn.array_type == "double" ) {
          wr.out(str : ("values.addDouble(keyname (unwrap (get this." + pvar.compiledName) + " keyname)))", newLine : true)
        }
        wr.indent(delta : -1)
        wr.out(str : "}", newLine : true)
        return;
      }
      return;
    }
    if ( nn.type_name == "string" ) {
      wr.out(str : ((("keys.addString(\"" + pvar.compiledName) + "\" (this.") + pvar.compiledName) + "))", newLine : true)
      return;
    }
    if ( nn.type_name == "double" ) {
      wr.out(str : ((("keys.addDouble(\"" + pvar.compiledName) + "\" (this.") + pvar.compiledName) + "))", newLine : true)
      return;
    }
    if ( nn.type_name == "int" ) {
      wr.out(str : ((("keys.addInt(\"" + pvar.compiledName) + "\" (this.") + pvar.compiledName) + "))", newLine : true)
      return;
    }
    if ( nn.type_name == "boolean" ) {
      wr.out(str : ((("keys.addBoolean(\"" + pvar.compiledName) + "\" (this.") + pvar.compiledName) + "))", newLine : true)
      return;
    }
    if ( self.isSerializedClass(cName : nn.type_name, ctx : ctx) ) {
      wr.out(str : ("def value@(lives):DictNode (this." + pvar.compiledName) + ".serializeToDict())", newLine : true)
      wr.out(str : ("keys.setObject(\"" + pvar.compiledName) + "\" value)", newLine : true)
    }
  }
  func createJSONSerializerFn(cl : RangerAppClassDesc, ctx : RangerAppWriterContext, wr : CodeWriter) -> Void {
    var declaredVariable : [String:Bool] = [String:Bool]()
    wr.out(str : "Import \"ng_DictNode.clj\"", newLine : true)
    wr.out(str : ("extension " + cl.name) + " {", newLine : true)
    wr.indent(delta : 1)
    wr.out(str : ("fn unserializeFromDict@(strong):" + cl.name) + " (dict:DictNode) {", newLine : true)
    wr.indent(delta : 1)
    wr.out(str : ((("def obj:" + cl.name) + " (new ") + cl.name) + "())", newLine : true)
    wr.out(str : "return obj", newLine : true)
    wr.indent(delta : -1)
    wr.out(str : "}", newLine : true)
    wr.newline()
    wr.out(str : "fn serializeToDict:DictNode () {", newLine : true)
    wr.indent(delta : 1)
    wr.out(str : "def res:DictNode (new DictNode ())", newLine : true)
    wr.out(str : ("res.addString(\"n\" \"" + cl.name) + "\")", newLine : true)
    wr.out(str : "def keys:DictNode (res.addObject(\"data\"))", newLine : true)
    if ( (cl.extends_classes.count) > 0 ) {
      for ( _ , pName ) in cl.extends_classes.enumerated() {
        let pC : RangerAppClassDesc = ctx.findClass(name : pName)
        for ( _ , pvar ) in pC.variables.enumerated() {
          declaredVariable[pvar.name] = true
          let nn : CodeNode = pvar.nameNode!
          if ( nn.isPrimitive() ) {
            wr.out(str : "; extended ", newLine : true)
            wr.out(str : "def key@(lives):DictNode (new DictNode())", newLine : true)
            wr.out(str : ("key.addString(\"n\" \"" + pvar.name) + "\")", newLine : true)
            wr.out(str : ("key.addString(\"t\" \"" + String(pvar.value_type)) + "\")", newLine : true)
            wr.out(str : "keys.push(key)", newLine : true)
          }
        }
      }
    }
    for ( _ , pvar_1 ) in cl.variables.enumerated() {
      if ( declaredVariable[pvar_1.name] != nil ) {
        continue;
      }
      let nn_1 : CodeNode = pvar_1.nameNode!
      if ( nn_1.hasFlag(flagName : "optional") ) {
        wr.out(str : "; optional variable", newLine : true)
        wr.out(str : ("if (!null? this." + pvar_1.name) + ") {", newLine : true)
        wr.indent(delta : 1)
        self.createWRWriter(pvar : pvar_1, nn : nn_1, ctx : ctx, wr : wr)
        wr.indent(delta : -1)
        wr.out(str : "} {", newLine : true)
        wr.indent(delta : 1)
        wr.indent(delta : -1)
        wr.out(str : "}", newLine : true)
        continue;
      }
      wr.out(str : "; not extended ", newLine : true)
      self.createWRWriter(pvar : pvar_1, nn : nn_1, ctx : ctx, wr : wr)
    }
    wr.out(str : "return res", newLine : true)
    wr.indent(delta : -1)
    wr.out(str : "}", newLine : true)
    wr.indent(delta : -1)
    wr.out(str : "}", newLine : true)
  }
}
func ==(l: ClassJoinPoint, r: ClassJoinPoint) -> Bool {
  return l === r
}
class ClassJoinPoint : Equatable  { 
  var class_def : RangerAppClassDesc?
  var node : CodeNode?
}
func ==(l: RangerFlowParser, r: RangerFlowParser) -> Bool {
  return l === r
}
class RangerFlowParser : Equatable  { 
  var stdCommands : CodeNode?
  var lastProcessedNode : CodeNode?
  var collectWalkAtEnd : [CodeNode] = [CodeNode]()     /** note: unused */
  var walkAlso : [CodeNode] = [CodeNode]()
  var serializedClasses : [RangerAppClassDesc] = [RangerAppClassDesc]()
  var classesWithTraits : [ClassJoinPoint] = [ClassJoinPoint]()
  var collectedIntefaces : [RangerAppClassDesc] = [RangerAppClassDesc]()
  var definedInterfaces : [String:Bool] = [String:Bool]()     /** note: unused */
  func cmdEnum(node : CodeNode, ctx : RangerAppWriterContext, wr : CodeWriter) -> Void {
    let fNameNode : CodeNode = node.children[1]
    let enumList : CodeNode = node.children[2]
    let new_enum : RangerAppEnum = RangerAppEnum()
    for ( _ , item ) in enumList.children.enumerated() {
      new_enum.add(n : item.vref)
    }
    ctx.definedEnums[fNameNode.vref] = new_enum
  }
  func initStdCommands() -> Void {
  }
  func findLanguageOper(details : CodeNode, ctx : RangerAppWriterContext) -> CodeNode? {
    let langName : String = ctx.getTargetLang()
    var rv : CodeNode?
    for ( _ , det ) in details.children.enumerated() {
      if ( (det.children.count) > 0 ) {
        let fc : CodeNode = det.children[0]
        if ( fc.vref == "templates" ) {
          let tplList : CodeNode = det.children[1]
          for ( _ , tpl ) in tplList.children.enumerated() {
            let tplName : CodeNode = tpl.getFirst()
            if ( (tplName.vref != "*") && (tplName.vref != langName) ) {
              continue;
            }
            rv = tpl;
            return rv;
          }
        }
      }
    }
    return rv;
  }
  func buildMacro(langOper : CodeNode?, args : CodeNode, ctx : RangerAppWriterContext) -> CodeNode {
    let subCtx : RangerAppWriterContext = ctx.fork()
    let wr : CodeWriter = CodeWriter()
    let lcc : LiveCompiler = LiveCompiler()
    lcc.langWriter = RangerRangerClassWriter();
    lcc.langWriter!.compiler = lcc;
    subCtx.targetLangName = "ranger";
    subCtx.restartExpressionLevel()
    let macroNode : CodeNode = langOper!
    let cmdList : CodeNode = macroNode.getSecond()
    lcc.walkCommandList(cmd : cmdList, node : args, ctx : subCtx, wr : wr)
    let lang_str : String = wr.getCode()
    let lang_code : SourceCode = SourceCode(code_str : lang_str)
    lang_code.filename = ("<macro " + macroNode.vref) + ">";
    let lang_parser : RangerLispParser = RangerLispParser(code_module : lang_code)
    lang_parser.parse()
    let node : CodeNode = lang_parser.rootNode!
    return node;
  }
  func stdParamMatch(callArgs : CodeNode, inCtx : RangerAppWriterContext, wr : CodeWriter) -> Bool {
    stdCommands = inCtx.getStdCommands();
    let callFnName : CodeNode = callArgs.getFirst()
    let cmds : CodeNode? = stdCommands
    var some_matched : Bool = false
    /** unused:  let found_fn : Bool = false   **/ 
    /** unused:  let missed_args : [String] = [String]()   **/ 
    var ctx : RangerAppWriterContext = inCtx.fork()
    /** unused:  let lang_name : String = ctx.getTargetLang()   **/ 
    var expects_error : Bool = false
    let err_cnt : Int = inCtx.getErrorCount()
    if ( callArgs.hasBooleanProperty(name : "error") ) {
      expects_error = true;
    }
    for ( main_index , ch ) in cmds!.children.enumerated() {
      let fc : CodeNode = ch.getFirst()
      let nameNode : CodeNode = ch.getSecond()
      let args : CodeNode = ch.getThird()
      if ( callFnName.vref == fc.vref ) {
        /** unused:  let line_index : Int = callArgs.getLine()   **/ 
        let callerArgCnt : Int = (callArgs.children.count) - 1
        let fnArgCnt : Int = args.children.count
        var has_eval_ctx : Bool = false
        var is_macro : Bool = false
        if ( nameNode.hasFlag(flagName : "newcontext") ) {
          ctx = inCtx.fork();
          has_eval_ctx = true;
        }
        let expanding_node : Bool = nameNode.hasFlag(flagName : "expands")
        if ( (callerArgCnt == fnArgCnt) || expanding_node ) {
          let details_list : CodeNode = ch.children[3]
          let langOper : CodeNode? = self.findLanguageOper(details : details_list, ctx : ctx)
          if ( langOper == nil ) {
            continue;
          }
          if ( langOper!.hasBooleanProperty(name : "macro") ) {
            is_macro = true;
          }
          let match : RangerArgMatch = RangerArgMatch()
          var last_walked : Int = 0
          for ( i , arg ) in args.children.enumerated() {
            let callArg : CodeNode = callArgs.children[(i + 1)]
            if ( arg.hasFlag(flagName : "define") ) {
              let p : RangerAppParamDesc = RangerAppParamDesc()
              p.name = callArg.vref;
              p.value_type = arg.value_type;
              p.node = callArg;
              p.nameNode = callArg;
              p.is_optional = false;
              p.init_cnt = 1;
              ctx.defineVariable(name : p.name, desc : p)
              callArg.hasParamDesc = true;
              callArg.ownParamDesc = p;
              callArg.paramDesc = p;
              if ( (callArg.type_name.characters.count) == 0 ) {
                callArg.type_name = arg.type_name;
                callArg.value_type = arg.value_type;
              }
              callArg.eval_type = arg.value_type;
              callArg.eval_type_name = arg.type_name;
            }
            if ( arg.hasFlag(flagName : "ignore") ) {
              continue;
            }
            ctx.setInExpr()
            last_walked = i + 1;
            _ = self.WalkNode(node : callArg, ctx : ctx, wr : wr)
            ctx.unsetInExpr()
          }
          if ( expanding_node ) {
            for ( i2 , caCh ) in callArgs.children.enumerated() {
              if ( i2 > last_walked ) {
                ctx.setInExpr()
                _ = self.WalkNode(node : caCh, ctx : ctx, wr : wr)
                ctx.unsetInExpr()
              }
            }
          }
          let all_matched : Bool = match.matchArguments(args : args, callArgs : callArgs, ctx : ctx, firstArgIndex : 1)
          if ( all_matched ) {
            if ( is_macro ) {
              let macroNode : CodeNode = self.buildMacro(langOper : langOper, args : callArgs, ctx : ctx)
              var arg_len : Int = callArgs.children.count
              while (arg_len > 0) {
                callArgs.children.removeLast();
                arg_len = arg_len - 1;
              }
              callArgs.children.append(macroNode)
              macroNode.parent = callArgs;
              _ = self.WalkNode(node : macroNode, ctx : ctx, wr : wr)
              _ = match.setRvBasedOn(arg : nameNode, node : callArgs)
              return true;
            }
            if ( nameNode.hasFlag(flagName : "moves") ) {
              let moves_opt : CodeNode? = nameNode.getFlag(flagName : "moves")
              let moves : CodeNode = moves_opt!
              let ann : CodeNode? = moves.vref_annotation
              let from : CodeNode = ann!.getFirst()
              let to : CodeNode = ann!.getSecond()
              let cA : CodeNode = callArgs.children[from.int_value]
              let cA2 : CodeNode = callArgs.children[to.int_value]
              if ( cA.hasParamDesc ) {
                let pp : RangerAppParamDesc? = cA.paramDesc
                let pp2 : RangerAppParamDesc? = cA2.paramDesc
                pp!.moveRefTo(node : callArgs, target : pp2!, ctx : ctx)
              }
            }
            if ( nameNode.hasFlag(flagName : "returns") ) {
              let activeFn : RangerAppFunctionDesc = ctx.getCurrentMethod()
              if ( activeFn.nameNode!.type_name != "void" ) {
                if ( (callArgs.children.count) < 2 ) {
                  ctx.addError(targetnode : callArgs, descr : " missing return value !!!")
                } else {
                  let returnedValue : CodeNode = callArgs.children[1]
                  if ( match.doesMatch(arg : (activeFn.nameNode!), node : returnedValue, ctx : ctx) == false ) {
                    if ( activeFn.nameNode!.ifNoTypeSetToEvalTypeOf(node : returnedValue) ) {
                    } else {
                      ctx.addError(targetnode : returnedValue, descr : "invalid return value type!!!")
                    }
                  }
                  let argNode : CodeNode = activeFn.nameNode!
                  if ( returnedValue.hasFlag(flagName : "optional") ) {
                    if ( false == argNode.hasFlag(flagName : "optional") ) {
                      ctx.addError(targetnode : callArgs, descr : "function return value optionality does not match, expected non-optional return value, optional given at " + argNode.getCode())
                    }
                  }
                  if ( argNode.hasFlag(flagName : "optional") ) {
                    if ( false == returnedValue.hasFlag(flagName : "optional") ) {
                      ctx.addError(targetnode : callArgs, descr : "function return value optionality does not match, expected optional return value " + argNode.getCode())
                    }
                  }
                  let pp_1 : RangerAppParamDesc? = returnedValue.paramDesc
                  if ( pp_1 != nil  ) {
                    pp_1!.moveRefTo(node : callArgs, target : activeFn, ctx : ctx)
                  }
                }
              }
              if ( callArgs.parent == nil ) {
                ctx.addError(targetnode : callArgs, descr : "did not have parent")
                print("no parent => " + callArgs.getCode())
              }
              callArgs.parent!.didReturnAtIndex = r_index_of(arr:callArgs.parent!.children, elem:callArgs);
            }
            if ( nameNode.hasFlag(flagName : "returns") == false ) {
              _ = match.setRvBasedOn(arg : nameNode, node : callArgs)
            }
            if ( has_eval_ctx ) {
              callArgs.evalCtx = ctx;
            }
            let nodeP : CodeNode? = callArgs.parent
            if ( nodeP != nil  ) {
            } else {
            }
            /** unused:  let sig : String = nameNode.buildTypeSignatureUsingMatch(match : match)   **/ 
            some_matched = true;
            callArgs.has_operator = true;
            callArgs.op_index = main_index;
            for ( arg_index , arg_1 ) in args.children.enumerated() {
              if ( arg_1.has_vref_annotation ) {
                let anns : CodeNode? = arg_1.vref_annotation
                for ( _ , ann_1 ) in anns!.children.enumerated() {
                  if ( ann_1.vref == "mutates" ) {
                    let theArg : CodeNode = callArgs.children[(arg_index + 1)]
                    if ( theArg.hasParamDesc ) {
                      theArg.paramDesc!.set_cnt = theArg.paramDesc!.set_cnt + 1;
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
      ctx.addError(targetnode : callArgs, descr : "stdMatch -> Could not match argument types for " + callFnName.vref)
    }
    if ( expects_error ) {
      let cnt_now : Int = ctx.getErrorCount()
      if ( cnt_now == err_cnt ) {
        ctx.addParserError(targetnode : callArgs, descr : (("LANGUAGE_PARSER_ERROR: expected generated error, err counts : " + String(err_cnt)) + " : ") + String(cnt_now))
      }
    } else {
      let cnt_now_1 : Int = ctx.getErrorCount()
      if ( cnt_now_1 > err_cnt ) {
        ctx.addParserError(targetnode : callArgs, descr : (("LANGUAGE_PARSER_ERROR: did not expect generated error, err counts : " + String(err_cnt)) + " : ") + String(cnt_now_1))
      }
    }
    return true;
  }
  func cmdImport(node : CodeNode, ctx : RangerAppWriterContext, wr : CodeWriter) -> Bool {
    return false;
  }
  func getThisName() -> String {
    return "this";
  }
  func WriteThisVar(node : CodeNode, ctx : RangerAppWriterContext, wr : CodeWriter) -> Void {
  }
  func WriteVRef(node : CodeNode, ctx : RangerAppWriterContext, wr : CodeWriter) -> Void {
    if ( node.vref == "_" ) {
      return;
    }
    let rootObjName : String = node.ns[0]
    if ( ctx.isInStatic() ) {
      if ( rootObjName == "this" ) {
        ctx.addError(targetnode : node, descr : "This can not be used in static context")
      }
    }
    if ( ctx.isEnumDefined(n : rootObjName) ) {
      let enumName : String = node.ns[1]
      let ee : RangerAppEnum? = ctx.getEnum(n : rootObjName)
      let e : RangerAppEnum = ee!
      if ( e.values[enumName] != nil ) {
        node.eval_type = 11;
        node.eval_type_name = rootObjName;
        node.int_value = (e.values[enumName])!;
      } else {
        ctx.addError(targetnode : node, descr : (("Undefined Enum " + rootObjName) + ".") + enumName)
        node.eval_type = 1;
      }
      return;
    }
    if ( node.vref == self.getThisName() ) {
      let cd : RangerAppClassDesc? = ctx.getCurrentClass()
      let thisClassDesc : RangerAppClassDesc? = cd
      node.eval_type = 8;
      node.eval_type_name = thisClassDesc!.name;
      node.ref_type = 4;
      return;
    }
    if ( ctx.isCapturing() ) {
      if ( ctx.isVarDefined(name : rootObjName) ) {
        if ( ctx.isLocalToCapture(name : rootObjName) == false ) {
          let captDef : RangerAppParamDesc = ctx.getVariableDef(name : rootObjName)
          let cd_1 : RangerAppClassDesc? = ctx.getCurrentClass()
          cd_1!.capturedLocals.append(captDef)
          captDef.is_captured = true;
          ctx.addCapturedVariable(name : rootObjName)
        }
      }
    }
    if ( (rootObjName == "this") || ctx.isVarDefined(name : rootObjName) ) {
      /** unused:  let vDef2 : RangerAppParamDesc = ctx.getVariableDef(name : rootObjName)   **/ 
      /** unused:  let activeFn : RangerAppFunctionDesc = ctx.getCurrentMethod()   **/ 
      let vDef : RangerAppParamDesc? = self.findParamDesc(obj : node, ctx : ctx, wr : wr)
      if ( vDef != nil  ) {
        node.hasParamDesc = true;
        node.ownParamDesc = vDef;
        node.paramDesc = vDef;
        vDef!.ref_cnt = 1 + vDef!.ref_cnt;
        let vNameNode : CodeNode? = vDef!.nameNode
        if ( vNameNode != nil  ) {
          if ( vNameNode!.hasFlag(flagName : "optional") ) {
            node.setFlag(flagName : "optional")
          }
          node.eval_type = vNameNode!.typeNameAsType(ctx : ctx);
          node.eval_type_name = vNameNode!.type_name;
          if ( vNameNode!.value_type == 6 ) {
            node.eval_type = 6;
            node.eval_array_type = vNameNode!.array_type;
          }
          if ( vNameNode!.value_type == 7 ) {
            node.eval_type = 7;
            node.eval_key_type = vNameNode!.key_type;
            node.eval_array_type = vNameNode!.array_type;
          }
        }
      }
    } else {
      var class_or_this : Bool = rootObjName == self.getThisName()
      if ( ctx.isDefinedClass(name : rootObjName) ) {
        class_or_this = true;
        node.eval_type = 23;
        node.eval_type_name = rootObjName;
      }
      if ( ctx.hasTemplateNode(name : rootObjName) ) {
        class_or_this = true;
      }
      if ( false == class_or_this ) {
        let udesc : RangerAppClassDesc? = ctx.getCurrentClass()
        let desc : RangerAppClassDesc = udesc!
        ctx.addError(targetnode : node, descr : (("Undefined variable " + rootObjName) + " in class ") + desc.name)
      }
      return;
    }
  }
  func CreateClass(node : CodeNode, ctx : RangerAppWriterContext, wr : CodeWriter) -> Void {
  }
  func DefineVar(node : CodeNode, ctx : RangerAppWriterContext, wr : CodeWriter) -> Void {
  }
  func WriteComment(node : CodeNode, ctx : RangerAppWriterContext, wr : CodeWriter) -> Void {
  }
  func cmdLog(node : CodeNode, ctx : RangerAppWriterContext, wr : CodeWriter) -> Void {
  }
  func cmdDoc(node : CodeNode, ctx : RangerAppWriterContext, wr : CodeWriter) -> Void {
  }
  func cmdGitDoc(node : CodeNode, ctx : RangerAppWriterContext, wr : CodeWriter) -> Void {
  }
  func cmdNative(node : CodeNode, ctx : RangerAppWriterContext, wr : CodeWriter) -> Void {
  }
  func LangInit(node : CodeNode, ctx : RangerAppWriterContext, wr : CodeWriter) -> Void {
  }
  func getWriterLang() -> String {
    return "_";
  }
  func StartCodeWriting(node : CodeNode, ctx : RangerAppWriterContext, wr : CodeWriter) -> Void {
  }
  func Constructor(node : CodeNode, ctx : RangerAppWriterContext, wr : CodeWriter) -> Void {
    self.shouldHaveChildCnt(cnt : 3, n1 : node, ctx : ctx, msg : "Method expexts four arguments")
    /** unused:  let cn : CodeNode = node.children[1]   **/ 
    let fnBody : CodeNode = node.children[2]
    let udesc : RangerAppClassDesc? = ctx.getCurrentClass()
    let desc : RangerAppClassDesc = udesc!
    let m : RangerAppFunctionDesc? = desc.constructor_fn
    let subCtx : RangerAppWriterContext = m!.fnCtx!
    subCtx.is_function = true;
    subCtx.currentMethod = m;
    subCtx.setInMethod()
    for ( _ , v ) in m!.params.enumerated() {
      subCtx.defineVariable(name : v.name, desc : v)
    }
    self.WalkNodeChildren(node : fnBody, ctx : subCtx, wr : wr)
    subCtx.unsetInMethod()
    if ( fnBody.didReturnAtIndex >= 0 ) {
      ctx.addError(targetnode : node, descr : "constructor should not return any values!")
    }
    for ( _ , n ) in subCtx.localVarNames.enumerated() {
      let p : RangerAppParamDesc? = subCtx.localVariables[n]
      if ( p!.set_cnt > 0 ) {
        let defNode : CodeNode? = p!.node
        defNode!.setFlag(flagName : "mutable")
        let nNode : CodeNode? = p!.nameNode
        nNode!.setFlag(flagName : "mutable")
      }
    }
  }
  func WriteScalarValue(node : CodeNode, ctx : RangerAppWriterContext, wr : CodeWriter) -> Void {
    node.eval_type = node.value_type;
    switch (node.value_type) {
      case 2 : 
        node.eval_type_name = "double";
      case 4 : 
        node.eval_type_name = "string";
      case 3 : 
        node.eval_type_name = "int";
      case 5 : 
        node.eval_type_name = "boolean";
      default :
        break
    }
  }
  func buildGenericClass(tpl : CodeNode, node : CodeNode, ctx : RangerAppWriterContext, wr : CodeWriter) -> Void {
    let root : RangerAppWriterContext = ctx.getRoot()
    let cn : CodeNode = tpl.getSecond()
    let newName : CodeNode = node.getSecond()
    let tplArgs : CodeNode? = cn.vref_annotation
    let givenArgs : CodeNode? = newName.vref_annotation
    let sign : String = cn.vref + givenArgs!.getCode()
    if ( root.classSignatures[sign] != nil ) {
      return;
    }
    print("could build generic class... " + cn.vref)
    let match : RangerArgMatch = RangerArgMatch()
    for ( i , arg ) in tplArgs!.children.enumerated() {
      let given : CodeNode = givenArgs!.children[i]
      print(((" setting " + arg.vref) + " => ") + given.vref)
      if ( false == match.add(tplKeyword : arg.vref, typeName : given.vref, ctx : ctx) ) {
        print("set failed!")
      } else {
        print("set OK")
      }
      print(" T == " + match.getTypeName(n : arg.vref))
    }
    print(" T == " + match.getTypeName(n : "T"))
    let newClassNode : CodeNode = tpl.rebuildWithType(match : match, changeVref : false)
    print("build done")
    print(newClassNode.getCode())
    let sign_2 : String = cn.vref + givenArgs!.getCode()
    print("signature ==> " + sign_2)
    let cName : CodeNode = newClassNode.getSecond()
    let friendlyName : String = root.createSignature(origClass : cn.vref, classSig : sign_2)
    print("class common name => " + friendlyName)
    cName.vref = friendlyName;
    cName.has_vref_annotation = false;
    print(newClassNode.getCode())
    self.WalkCollectMethods(node : newClassNode, ctx : ctx, wr : wr)
    _ = self.WalkNode(node : newClassNode, ctx : root, wr : wr)
    print("the class collected the methods...")
  }
  func cmdNew(node : CodeNode, ctx : RangerAppWriterContext, wr : CodeWriter) -> Void {
    if ( (node.children.count) < 2 ) {
      ctx.addError(targetnode : node, descr : "the new operator expects at lest two arguments")
      return;
    }
    if ( (node.children.count) < 3 ) {
      let expr : CodeNode = CodeNode(source : node.code!, start : node.sp, end : node.ep)
      expr.expression = true;
      node.children.append(expr)
    }
    let obj : CodeNode = node.getSecond()
    let params : CodeNode = node.getThird()
    var currC : RangerAppClassDesc?
    var b_template : Bool = false
    var expects_error : Bool = false
    let err_cnt : Int = ctx.getErrorCount()
    if ( node.hasBooleanProperty(name : "error") ) {
      expects_error = true;
    }
    if ( ctx.hasTemplateNode(name : obj.vref) ) {
      print(" ==> template class")
      b_template = true;
      let tpl : CodeNode = ctx.findTemplateNode(name : obj.vref)
      if ( obj.has_vref_annotation ) {
        print("generic class OK")
        self.buildGenericClass(tpl : tpl, node : node, ctx : ctx, wr : wr)
        currC = ctx.findClassWithSign(node : obj);
        if ( currC != nil  ) {
          print("@@ class was found " + obj.vref)
        }
      } else {
        ctx.addError(targetnode : node, descr : "generic class requires a type annotation")
        return;
      }
    }
    _ = self.WalkNode(node : obj, ctx : ctx, wr : wr)
    for ( _ , arg ) in params.children.enumerated() {
      ctx.setInExpr()
      _ = self.WalkNode(node : arg, ctx : ctx, wr : wr)
      ctx.unsetInExpr()
    }
    node.eval_type = 8;
    node.eval_type_name = obj.vref;
    if ( b_template == false ) {
      currC = ctx.findClass(name : obj.vref);
    }
    node.hasNewOper = true;
    node.clDesc = currC;
    let fnDescr : RangerAppFunctionDesc? = currC!.constructor_fn
    if ( fnDescr != nil  ) {
      for ( i_1 , param ) in fnDescr!.params.enumerated() {
        var has_default : Bool = false
        if ( param.nameNode!.hasFlag(flagName : "default") ) {
          has_default = true;
        }
        if ( (params.children.count) <= i_1 ) {
          if ( has_default ) {
            continue;
          }
          ctx.addError(targetnode : node, descr : "Missing arguments for function")
          ctx.addError(targetnode : param.nameNode!, descr : "To fix the previous error: Check original function declaration")
        }
        let argNode : CodeNode = params.children[i_1]
        if ( false == self.areEqualTypes(n1 : (param.nameNode!), n2 : argNode, ctx : ctx) ) {
          ctx.addError(targetnode : argNode, descr : ("ERROR, invalid argument type for " + currC!.name) + " constructor ")
        }
        let pNode : CodeNode = param.nameNode!
        if ( pNode.hasFlag(flagName : "optional") ) {
          if ( false == argNode.hasFlag(flagName : "optional") ) {
            ctx.addError(targetnode : node, descr : "new parameter optionality does not match, expected optional parameter" + argNode.getCode())
          }
        }
        if ( argNode.hasFlag(flagName : "optional") ) {
          if ( false == pNode.hasFlag(flagName : "optional") ) {
            ctx.addError(targetnode : node, descr : "new parameter optionality does not match, expected non-optional, optional given" + argNode.getCode())
          }
        }
      }
    }
    if ( expects_error ) {
      let cnt_now : Int = ctx.getErrorCount()
      if ( cnt_now == err_cnt ) {
        ctx.addParserError(targetnode : node, descr : (("LANGUAGE_PARSER_ERROR: expected generated error, err counts : " + String(err_cnt)) + " : ") + String(cnt_now))
      }
    } else {
      let cnt_now_1 : Int = ctx.getErrorCount()
      if ( cnt_now_1 > err_cnt ) {
        ctx.addParserError(targetnode : node, descr : (("LANGUAGE_PARSER_ERROR: did not expect generated error, err counts : " + String(err_cnt)) + " : ") + String(cnt_now_1))
      }
    }
  }
  func transformParams(list : [CodeNode], fnArgs : [RangerAppParamDesc], ctx : RangerAppWriterContext) -> [CodeNode] {
    var res : [CodeNode] = [CodeNode]()
    for ( i , item ) in list.enumerated() {
      if ( item.is_block_node ) {
        /** unused:  let newNode : CodeNode = CodeNode(source : item.code!, start : item.sp, end : item.ep)   **/ 
        let fnArg : RangerAppParamDesc = fnArgs[i]
        let nn : CodeNode? = fnArg.nameNode
        if ( nn!.expression_value == nil ) {
          ctx.addError(targetnode : item, descr : "Parameter is not lambda expression")
          break;
        }
        let fnDef : CodeNode = nn!.expression_value!
        let match : RangerArgMatch = RangerArgMatch()
        let copyOf : CodeNode = fnDef.rebuildWithType(match : match, changeVref : false)
        let fc : CodeNode = copyOf.children[0]
        fc.vref = "fun";
        let itemCopy : CodeNode = item.rebuildWithType(match : match, changeVref : false)
        copyOf.children.append(itemCopy)
        var cnt : Int = item.children.count
        while (cnt > 0) {
          item.children.removeLast();
          cnt = cnt - 1;
        }
        for ( _ , ch ) in copyOf.children.enumerated() {
          item.children.append(ch)
        }
      }
      res.append(item)
    }
    return res;
  }
  func cmdLocalCall(node : CodeNode, ctx : RangerAppWriterContext, wr : CodeWriter) -> Bool {
    let fnNode : CodeNode = node.getFirst()
    let udesc : RangerAppClassDesc? = ctx.getCurrentClass()
    let desc : RangerAppClassDesc = udesc!
    var expects_error : Bool = false
    let err_cnt : Int = ctx.getErrorCount()
    if ( node.hasBooleanProperty(name : "error") ) {
      expects_error = true;
    }
    if ( (fnNode.ns.count) > 1 ) {
      let rootName : String = fnNode.ns[0]
      let vDef2 : RangerAppParamDesc = ctx.getVariableDef(name : rootName)
      if ( ((rootName != "this") && (vDef2.init_cnt == 0)) && (vDef2.set_cnt == 0) ) {
        if ( (vDef2.is_class_variable == false) && (ctx.isDefinedClass(name : rootName) == false) ) {
          ctx.addError(targetnode : node, descr : "Call to uninitialized object " + rootName)
        }
      }
      let vFnDef : RangerAppFunctionDesc? = self.findFunctionDesc(obj : fnNode, ctx : ctx, wr : wr)
      if ( vFnDef != nil  ) {
        vFnDef!.ref_cnt = vFnDef!.ref_cnt + 1;
        let subCtx : RangerAppWriterContext = ctx.fork()
        node.hasFnCall = true;
        node.fnDesc = vFnDef;
        let p : RangerAppParamDesc = RangerAppParamDesc()
        p.name = fnNode.vref;
        p.value_type = fnNode.value_type;
        p.node = fnNode;
        p.nameNode = fnNode;
        p.varType = 10;
        subCtx.defineVariable(name : p.name, desc : p)
        _ = self.WalkNode(node : fnNode, ctx : subCtx, wr : wr)
        let callParams : CodeNode = node.children[1]
        let nodeList : [CodeNode] = self.transformParams(list : callParams.children, fnArgs : vFnDef!.params, ctx : subCtx)
        for ( i , arg ) in nodeList.enumerated() {
          ctx.setInExpr()
          _ = self.WalkNode(node : arg, ctx : subCtx, wr : wr)
          ctx.unsetInExpr()
          let fnArg : RangerAppParamDesc = vFnDef!.params[i]
          let callArgP : RangerAppParamDesc? = arg.paramDesc
          if ( callArgP != nil  ) {
            callArgP!.moveRefTo(node : node, target : fnArg, ctx : ctx)
          }
        }
        let cp_len : Int = callParams.children.count
        if ( cp_len > (vFnDef!.params.count) ) {
          let lastCallParam : CodeNode = callParams.children[(cp_len - 1)]
          ctx.addError(targetnode : lastCallParam, descr : "Too many arguments for function")
          ctx.addError(targetnode : vFnDef!.nameNode!, descr : "NOTE: To fix the previous error: Check original function declaration which was")
        }
        for ( i_1 , param ) in vFnDef!.params.enumerated() {
          if ( (callParams.children.count) <= i_1 ) {
            if ( param.nameNode!.hasFlag(flagName : "default") ) {
              continue;
            }
            ctx.addError(targetnode : node, descr : "Missing arguments for function")
            ctx.addError(targetnode : param.nameNode!, descr : "NOTE: To fix the previous error: Check original function declaration which was")
            break;
          }
          let argNode : CodeNode = callParams.children[i_1]
          if ( false == self.areEqualTypes(n1 : (param.nameNode!), n2 : argNode, ctx : ctx) ) {
            ctx.addError(targetnode : argNode, descr : "ERROR, invalid argument type for method " + vFnDef!.name)
          }
          let pNode : CodeNode = param.nameNode!
          if ( pNode.hasFlag(flagName : "optional") ) {
            if ( false == argNode.hasFlag(flagName : "optional") ) {
              ctx.addError(targetnode : node, descr : "function parameter optionality does not match, consider making parameter optional " + argNode.getCode())
            }
          }
          if ( argNode.hasFlag(flagName : "optional") ) {
            if ( false == pNode.hasFlag(flagName : "optional") ) {
              ctx.addError(targetnode : node, descr : "function parameter optionality does not match, consider unwrapping " + argNode.getCode())
            }
          }
        }
        let nn : CodeNode? = vFnDef!.nameNode
        node.eval_type = nn!.typeNameAsType(ctx : ctx);
        node.eval_type_name = nn!.type_name;
        node.eval_array_type = nn!.array_type;
        node.eval_key_type = nn!.key_type;
        if ( nn!.hasFlag(flagName : "optional") ) {
          node.setFlag(flagName : "optional")
        }
        if ( expects_error ) {
          let cnt_now : Int = ctx.getErrorCount()
          if ( cnt_now == err_cnt ) {
            ctx.addParserError(targetnode : node, descr : (("LANGUAGE_PARSER_ERROR: expected generated error, err counts : " + String(err_cnt)) + " : ") + String(cnt_now))
          }
        } else {
          let cnt_now_1 : Int = ctx.getErrorCount()
          if ( cnt_now_1 > err_cnt ) {
            ctx.addParserError(targetnode : node, descr : (("LANGUAGE_PARSER_ERROR: did not expect generated error, err counts : " + String(err_cnt)) + " : ") + String(cnt_now_1))
          }
        }
        return true;
      } else {
        ctx.addError(targetnode : node, descr : "Called Object or Property was not defined")
      }
    }
    if ( desc.hasMethod(m_name : fnNode.vref) ) {
      let fnDescr : RangerAppFunctionDesc? = desc.findMethod(f_name : fnNode.vref)
      let subCtx_1 : RangerAppWriterContext = ctx.fork()
      node.hasFnCall = true;
      node.fnDesc = fnDescr;
      let p_1 : RangerAppParamDesc = RangerAppParamDesc()
      p_1.name = fnNode.vref;
      p_1.value_type = fnNode.value_type;
      p_1.node = fnNode;
      p_1.nameNode = fnNode;
      p_1.varType = 10;
      subCtx_1.defineVariable(name : p_1.name, desc : p_1)
      self.WriteThisVar(node : fnNode, ctx : subCtx_1, wr : wr)
      _ = self.WalkNode(node : fnNode, ctx : subCtx_1, wr : wr)
      for ( i_2 , arg_1 ) in node.children.enumerated() {
        if ( i_2 < 1 ) {
          continue;
        }
        ctx.setInExpr()
        _ = self.WalkNode(node : arg_1, ctx : subCtx_1, wr : wr)
        ctx.unsetInExpr()
      }
      for ( i_3 , param_1 ) in fnDescr!.params.enumerated() {
        if ( (node.children.count) <= (i_3 + 1) ) {
          ctx.addError(targetnode : node, descr : "Argument was not defined")
          break;
        }
        let argNode_1 : CodeNode = node.children[(i_3 + 1)]
        if ( false == self.areEqualTypes(n1 : (param_1.nameNode!), n2 : argNode_1, ctx : ctx) ) {
          ctx.addError(targetnode : argNode_1, descr : (("ERROR, invalid argument type for " + desc.name) + " method ") + fnDescr!.name)
        }
      }
      let nn_1 : CodeNode? = fnDescr!.nameNode
      nn_1!.defineNodeTypeTo(node : node, ctx : ctx)
      if ( expects_error ) {
        let cnt_now_2 : Int = ctx.getErrorCount()
        if ( cnt_now_2 == err_cnt ) {
          ctx.addParserError(targetnode : node, descr : (("LANGUAGE_PARSER_ERROR: expected generated error, err counts : " + String(err_cnt)) + " : ") + String(cnt_now_2))
        }
      } else {
        let cnt_now_3 : Int = ctx.getErrorCount()
        if ( cnt_now_3 > err_cnt ) {
          ctx.addParserError(targetnode : node, descr : (("LANGUAGE_PARSER_ERROR: did not expect generated error, err counts : " + String(err_cnt)) + " : ") + String(cnt_now_3))
        }
      }
      return true;
    }
    if ( ctx.isVarDefined(name : fnNode.vref) ) {
      let d : RangerAppParamDesc = ctx.getVariableDef(name : fnNode.vref)
      d.ref_cnt = 1 + d.ref_cnt;
      if ( d.nameNode!.value_type == 15 ) {
        /** unused:  let lambdaDefArgs : CodeNode = d.nameNode!.expression_value!.children[1]   **/ 
        let callParams_1 : CodeNode = node.children[1]
        for ( _ , arg_2 ) in callParams_1.children.enumerated() {
          ctx.setInExpr()
          _ = self.WalkNode(node : arg_2, ctx : ctx, wr : wr)
          ctx.unsetInExpr()
        }
        let lambdaDef : CodeNode = d.nameNode!.expression_value!.children[0]
        /** unused:  let lambdaArgs : CodeNode = d.nameNode!.expression_value!.children[1]   **/ 
        node.has_lambda_call = true;
        node.eval_type = lambdaDef.typeNameAsType(ctx : ctx);
        node.eval_type_name = lambdaDef.type_name;
        node.eval_array_type = lambdaDef.array_type;
        node.eval_key_type = lambdaDef.key_type;
        return true;
      }
    }
    ctx.addError(targetnode : node, descr : (("ERROR, could not find class " + desc.name) + " method ") + fnNode.vref)
    ctx.addError(targetnode : node, descr : "definition : " + node.getCode())
    if ( expects_error ) {
      let cnt_now_4 : Int = ctx.getErrorCount()
      if ( cnt_now_4 == err_cnt ) {
        ctx.addParserError(targetnode : node, descr : (("LANGUAGE_PARSER_ERROR: expected generated error, err counts : " + String(err_cnt)) + " : ") + String(cnt_now_4))
      }
    } else {
      let cnt_now_5 : Int = ctx.getErrorCount()
      if ( cnt_now_5 > err_cnt ) {
        ctx.addParserError(targetnode : node, descr : (("LANGUAGE_PARSER_ERROR: did not expect generated error, err counts : " + String(err_cnt)) + " : ") + String(cnt_now_5))
      }
    }
    return false;
  }
  func cmdReturn(node : CodeNode, ctx : RangerAppWriterContext, wr : CodeWriter) -> Void {
    node.has_operator = true;
    node.op_index = 5;
    print("cmdReturn")
    if ( (node.children.count) > 1 ) {
      let fc : CodeNode = node.getSecond()
      if ( fc.vref == "_" ) {
      } else {
        ctx.setInExpr()
        _ = self.WalkNode(node : fc, ctx : ctx, wr : wr)
        ctx.unsetInExpr()
        /** unused:  let activeFn : RangerAppFunctionDesc = ctx.getCurrentMethod()   **/ 
        if ( fc.hasParamDesc ) {
          fc.paramDesc!.return_cnt = 1 + fc.paramDesc!.return_cnt;
          fc.paramDesc!.ref_cnt = 1 + fc.paramDesc!.ref_cnt;
        }
        let currFn : RangerAppFunctionDesc = ctx.getCurrentMethod()
        if ( fc.hasParamDesc ) {
          print("cmdReturn move-->")
          let pp : RangerAppParamDesc? = fc.paramDesc
          pp!.moveRefTo(node : node, target : currFn, ctx : ctx)
        } else {
          print("cmdReturn had no param desc")
        }
      }
    }
  }
  func cmdAssign(node : CodeNode, ctx : RangerAppWriterContext, wr : CodeWriter) -> Void {
    wr.newline()
    let n1 : CodeNode = node.getSecond()
    let n2 : CodeNode = node.getThird()
    _ = self.WalkNode(node : n1, ctx : ctx, wr : wr)
    ctx.setInExpr()
    _ = self.WalkNode(node : n2, ctx : ctx, wr : wr)
    ctx.unsetInExpr()
    if ( n1.hasParamDesc ) {
      n1.paramDesc!.ref_cnt = n1.paramDesc!.ref_cnt + 1;
      n1.paramDesc!.set_cnt = n1.paramDesc!.set_cnt + 1;
    }
    if ( n2.hasParamDesc ) {
      n2.paramDesc!.ref_cnt = n2.paramDesc!.ref_cnt + 1;
    }
    if ( n2.hasFlag(flagName : "optional") ) {
      if ( false == n1.hasFlag(flagName : "optional") ) {
        ctx.addError(targetnode : node, descr : "Can not assign optional to non-optional type")
      }
    }
    _ = self.stdParamMatch(callArgs : node, inCtx : ctx, wr : wr)
  }
  func EnterTemplateClass(node : CodeNode, ctx : RangerAppWriterContext, wr : CodeWriter) -> Void {
  }
  func EnterClass(node : CodeNode, ctx : RangerAppWriterContext, wr : CodeWriter) -> Void {
    if ( (node.children.count) != 3 ) {
      ctx.addError(targetnode : node, descr : "Invalid class declaration")
      return;
    }
    if ( node.hasBooleanProperty(name : "trait") ) {
      return;
    }
    let cn : CodeNode = node.children[1]
    let cBody : CodeNode = node.children[2]
    let desc : RangerAppClassDesc = ctx.findClass(name : cn.vref)
    if ( cn.has_vref_annotation ) {
      print("--> generic class, not processed")
      return;
    }
    let subCtx : RangerAppWriterContext = desc.ctx!
    subCtx.setCurrentClass(cc : desc)
    subCtx.class_level_context = true;
    for ( _ , p ) in desc.variables.enumerated() {
      let vNode : CodeNode? = p.node
      if ( (vNode!.children.count) > 2 ) {
        let value : CodeNode = vNode!.children[2]
        ctx.setInExpr()
        _ = self.WalkNode(node : value, ctx : ctx, wr : wr)
        ctx.unsetInExpr()
      }
      p.is_class_variable = true;
      p.nameNode!.eval_type = p.nameNode!.typeNameAsType(ctx : ctx);
      p.nameNode!.eval_type_name = p.nameNode!.type_name;
    }
    for ( _ , fNode ) in cBody.children.enumerated() {
      if ( (fNode.isFirstVref(vrefName : "fn") || fNode.isFirstVref(vrefName : "constructor")) || fNode.isFirstVref(vrefName : "Constructor") ) {
        _ = self.WalkNode(node : fNode, ctx : subCtx, wr : wr)
      }
    }
    for ( _ , fNode_1 ) in cBody.children.enumerated() {
      if ( fNode_1.isFirstVref(vrefName : "fn") || fNode_1.isFirstVref(vrefName : "PublicMethod") ) {
        _ = self.WalkNode(node : fNode_1, ctx : subCtx, wr : wr)
      }
    }
    let staticCtx : RangerAppWriterContext = ctx.fork()
    staticCtx.setCurrentClass(cc : desc)
    for ( _ , fNode_2 ) in cBody.children.enumerated() {
      if ( fNode_2.isFirstVref(vrefName : "sfn") || fNode_2.isFirstVref(vrefName : "StaticMethod") ) {
        _ = self.WalkNode(node : fNode_2, ctx : staticCtx, wr : wr)
      }
    }
    node.hasClassDescription = true;
    node.clDesc = desc;
    desc.classNode = node;
  }
  func EnterMethod(node : CodeNode, ctx : RangerAppWriterContext, wr : CodeWriter) -> Void {
    self.shouldHaveChildCnt(cnt : 4, n1 : node, ctx : ctx, msg : "Method expexts four arguments")
    let cn : CodeNode = node.children[1]
    let fnBody : CodeNode = node.children[3]
    let udesc : RangerAppClassDesc? = ctx.getCurrentClass()
    let desc : RangerAppClassDesc = udesc!
    let um : RangerAppFunctionDesc? = desc.findMethod(f_name : cn.vref)
    let m : RangerAppFunctionDesc = um!
    let subCtx : RangerAppWriterContext = m.fnCtx!
    subCtx.function_level_context = true;
    subCtx.currentMethod = m;
    for ( _ , v ) in m.params.enumerated() {
      v.nameNode!.eval_type = v.nameNode!.typeNameAsType(ctx : subCtx);
      v.nameNode!.eval_type_name = v.nameNode!.type_name;
      _ = ctx.hadValidType(node : v.nameNode!)
    }
    subCtx.setInMethod()
    self.WalkNodeChildren(node : fnBody, ctx : subCtx, wr : wr)
    subCtx.unsetInMethod()
    if ( fnBody.didReturnAtIndex == -1 ) {
      if ( cn.type_name != "void" ) {
        ctx.addError(targetnode : node, descr : "Function does not return any values!")
      }
    }
    for ( _ , n ) in subCtx.localVarNames.enumerated() {
      let p : RangerAppParamDesc? = subCtx.localVariables[n]
      if ( p!.set_cnt > 0 ) {
        let defNode : CodeNode? = p!.node
        defNode!.setFlag(flagName : "mutable")
        let nNode : CodeNode? = p!.nameNode
        nNode!.setFlag(flagName : "mutable")
      }
    }
  }
  func EnterStaticMethod(node : CodeNode, ctx : RangerAppWriterContext, wr : CodeWriter) -> Void {
    self.shouldHaveChildCnt(cnt : 4, n1 : node, ctx : ctx, msg : "Method expexts four arguments")
    let cn : CodeNode = node.children[1]
    let fnBody : CodeNode = node.children[3]
    let udesc : RangerAppClassDesc? = ctx.getCurrentClass()
    let desc : RangerAppClassDesc = udesc!
    let subCtx : RangerAppWriterContext = ctx.fork()
    subCtx.is_function = true;
    let um : RangerAppFunctionDesc? = desc.findStaticMethod(f_name : cn.vref)
    let m : RangerAppFunctionDesc = um!
    subCtx.currentMethod = m;
    subCtx.in_static_method = true;
    m.fnCtx = subCtx;
    if ( cn.hasFlag(flagName : "weak") ) {
      m.changeStrength(newStrength : 0, lifeTime : 1, changer : node)
    } else {
      m.changeStrength(newStrength : 1, lifeTime : 1, changer : node)
    }
    subCtx.setInMethod()
    for ( _ , v ) in m.params.enumerated() {
      subCtx.defineVariable(name : v.name, desc : v)
      v.nameNode!.eval_type = v.nameNode!.typeNameAsType(ctx : ctx);
      v.nameNode!.eval_type_name = v.nameNode!.type_name;
    }
    self.WalkNodeChildren(node : fnBody, ctx : subCtx, wr : wr)
    subCtx.unsetInMethod()
    subCtx.in_static_method = false;
    subCtx.function_level_context = true;
    if ( fnBody.didReturnAtIndex == -1 ) {
      if ( cn.type_name != "void" ) {
        ctx.addError(targetnode : node, descr : "Function does not return any values!")
      }
    }
    for ( _ , n ) in subCtx.localVarNames.enumerated() {
      let p : RangerAppParamDesc? = subCtx.localVariables[n]
      if ( p!.set_cnt > 0 ) {
        let defNode : CodeNode? = p!.node
        defNode!.setFlag(flagName : "mutable")
        let nNode : CodeNode? = p!.nameNode
        nNode!.setFlag(flagName : "mutable")
      }
    }
  }
  func EnterLambdaMethod(node : CodeNode, ctx : RangerAppWriterContext, wr : CodeWriter) -> Void {
    let args : CodeNode = node.children[1]
    let body : CodeNode = node.children[2]
    let subCtx : RangerAppWriterContext = ctx.fork()
    if ( ctx.isInStatic() ) {
      ctx.addError(targetnode : node, descr : "Lambda definitions in static context are not allowed")
    }
    subCtx.is_capturing = true;
    let cn : CodeNode = node.children[0]
    let m : RangerAppFunctionDesc = RangerAppFunctionDesc()
    m.name = "lambda";
    m.node = node;
    m.nameNode = node.children[0];
    subCtx.is_function = true;
    subCtx.currentMethod = m;
    if ( cn.hasFlag(flagName : "weak") ) {
      m.changeStrength(newStrength : 0, lifeTime : 1, changer : node)
    } else {
      m.changeStrength(newStrength : 1, lifeTime : 1, changer : node)
    }
    m.fnBody = node.children[2];
    for ( _ , arg ) in args.children.enumerated() {
      let p2 : RangerAppParamDesc = RangerAppParamDesc()
      p2.name = arg.vref;
      p2.value_type = arg.value_type;
      p2.node = arg;
      p2.nameNode = arg;
      p2.init_cnt = 1;
      p2.refType = 1;
      p2.initRefType = 1;
      if ( args.hasBooleanProperty(name : "strong") ) {
        p2.refType = 2;
        p2.initRefType = 2;
      }
      p2.varType = 4;
      m.params.append(p2)
      arg.hasParamDesc = true;
      arg.paramDesc = p2;
      arg.eval_type = arg.value_type;
      arg.eval_type_name = arg.type_name;
      if ( arg.hasFlag(flagName : "strong") ) {
        p2.changeStrength(newStrength : 1, lifeTime : 1, changer : p2.nameNode!)
      } else {
        arg.setFlag(flagName : "lives")
        p2.changeStrength(newStrength : 0, lifeTime : 1, changer : p2.nameNode!)
      }
      subCtx.defineVariable(name : p2.name, desc : p2)
    }
    /** unused:  let cnt : Int = body.children.count   **/ 
    for ( i , item ) in body.children.enumerated() {
      _ = self.WalkNode(node : item, ctx : subCtx, wr : wr)
      if ( i == ((body.children.count) - 1) ) {
        if ( (item.children.count) > 0 ) {
          let fc : CodeNode = item.getFirst()
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
  func EnterVarDef(node : CodeNode, ctx : RangerAppWriterContext, wr : CodeWriter) -> Void {
    if ( ctx.isInMethod() ) {
      if ( (node.children.count) > 3 ) {
        ctx.addError(targetnode : node, descr : "invalid variable definition")
        return;
      }
      if ( (node.children.count) < 2 ) {
        ctx.addError(targetnode : node, descr : "invalid variable definition")
        return;
      }
      let cn : CodeNode = node.children[1]
      let p : RangerAppParamDesc = RangerAppParamDesc()
      var defaultArg : CodeNode?
      if ( (node.children.count) == 2 ) {
        if ( (cn.value_type != 6) && (cn.value_type != 7) ) {
          cn.setFlag(flagName : "optional")
        }
      }
      if ( (cn.vref.characters.count) == 0 ) {
        ctx.addError(targetnode : node, descr : "invalid variable definition")
      }
      if ( cn.hasFlag(flagName : "weak") ) {
        p.changeStrength(newStrength : 0, lifeTime : 1, changer : node)
      } else {
        p.changeStrength(newStrength : 1, lifeTime : 1, changer : node)
      }
      node.hasVarDef = true;
      if ( cn.value_type == 15 ) {
        print("Expression node...")
      }
      if ( (node.children.count) > 2 ) {
        p.init_cnt = 1;
        p.def_value = node.children[2];
        p.is_optional = false;
        defaultArg = node.children[2];
        ctx.setInExpr()
        _ = self.WalkNode(node : defaultArg!, ctx : ctx, wr : wr)
        ctx.unsetInExpr()
        if ( defaultArg!.hasFlag(flagName : "optional") ) {
          cn.setFlag(flagName : "optional")
        }
        if ( defaultArg!.eval_type == 6 ) {
          node.op_index = 1;
        }
        if ( cn.value_type == 11 ) {
          cn.eval_type_name = defaultArg!.ns[0];
        }
        if ( cn.value_type == 12 ) {
          if ( (defaultArg!.eval_type != 3) && (defaultArg!.eval_type != 12) ) {
            ctx.addError(targetnode : defaultArg!, descr : "Char should be assigned char or integer value --> " + defaultArg!.getCode())
          } else {
            defaultArg!.eval_type = 12;
          }
        }
      } else {
        if ( ((cn.value_type != 7) && (cn.value_type != 6)) && (false == cn.hasFlag(flagName : "optional")) ) {
          cn.setFlag(flagName : "optional")
        }
      }
      if ( (node.children.count) > 2 ) {
        if ( ((cn.type_name.characters.count) == 0) && ((cn.array_type.characters.count) == 0) ) {
          let nodeValue : CodeNode = node.children[2]
          if ( nodeValue.eval_type == 15 ) {
            if ( node.expression_value == nil ) {
              let copyOf : CodeNode = nodeValue.rebuildWithType(match : RangerArgMatch(), changeVref : false)
              copyOf.children.removeLast();
              cn.expression_value = copyOf;
            }
          }
          cn.value_type = nodeValue.eval_type;
          cn.type_name = nodeValue.eval_type_name;
          cn.array_type = nodeValue.eval_array_type;
          cn.key_type = nodeValue.eval_key_type;
        }
      }
      _ = ctx.hadValidType(node : cn)
      cn.defineNodeTypeTo(node : cn, ctx : ctx)
      p.name = cn.vref;
      if ( p.value_type == 0 ) {
        if ( (0 == (cn.type_name.characters.count)) && (defaultArg != nil ) ) {
          p.value_type = defaultArg!.eval_type;
          cn.type_name = defaultArg!.eval_type_name;
          cn.eval_type_name = defaultArg!.eval_type_name;
          cn.value_type = defaultArg!.eval_type;
        }
      } else {
        p.value_type = cn.value_type;
      }
      p.node = node;
      p.nameNode = cn;
      p.varType = 5;
      if ( cn.has_vref_annotation ) {
        ctx.log(node : node, logName : "ann", descr : "At a variable -> Found has_vref_annotation annotated reference ")
        let ann : CodeNode? = cn.vref_annotation
        if ( (ann!.children.count) > 0 ) {
          let fc : CodeNode = ann!.children[0]
          ctx.log(node : node, logName : "ann", descr : (("value of first annotation " + fc.vref) + " and variable name ") + cn.vref)
        }
      }
      if ( cn.has_type_annotation ) {
        ctx.log(node : node, logName : "ann", descr : "At a variable -> Found annotated reference ")
        let ann_1 : CodeNode? = cn.type_annotation
        if ( (ann_1!.children.count) > 0 ) {
          let fc_1 : CodeNode = ann_1!.children[0]
          ctx.log(node : node, logName : "ann", descr : (("value of first annotation " + fc_1.vref) + " and variable name ") + cn.vref)
        }
      }
      cn.hasParamDesc = true;
      cn.ownParamDesc = p;
      cn.paramDesc = p;
      node.hasParamDesc = true;
      node.paramDesc = p;
      cn.eval_type = cn.typeNameAsType(ctx : ctx);
      cn.eval_type_name = cn.type_name;
      if ( (node.children.count) > 2 ) {
        if ( cn.eval_type != defaultArg!.eval_type ) {
          if ( ((cn.eval_type == 12) && (defaultArg!.eval_type == 3)) || ((cn.eval_type == 3) && (defaultArg!.eval_type == 12)) ) {
          } else {
            ctx.addError(targetnode : node, descr : (("Variable was assigned an incompatible type. Types were " + String(cn.eval_type)) + " vs ") + String(defaultArg!.eval_type))
          }
        }
      } else {
        p.is_optional = true;
      }
      ctx.defineVariable(name : p.name, desc : p)
      self.DefineVar(node : node, ctx : ctx, wr : wr)
      if ( (node.children.count) > 2 ) {
        self.shouldBeEqualTypes(n1 : cn, n2 : p.def_value!, ctx : ctx, msg : "Variable was assigned an incompatible type.")
      }
    } else {
      let cn_1 : CodeNode = node.children[1]
      cn_1.eval_type = cn_1.typeNameAsType(ctx : ctx);
      cn_1.eval_type_name = cn_1.type_name;
      self.DefineVar(node : node, ctx : ctx, wr : wr)
      if ( (node.children.count) > 2 ) {
        self.shouldBeEqualTypes(n1 : node.children[1], n2 : node.children[2], ctx : ctx, msg : "Variable was assigned an incompatible type.")
      }
    }
  }
  func WalkNodeChildren(node : CodeNode, ctx : RangerAppWriterContext, wr : CodeWriter) -> Void {
    if ( node.hasStringProperty(name : "todo") ) {
      ctx.addTodo(node : node, descr : node.getStringProperty(name : "todo"))
    }
    if ( node.expression ) {
      for ( _ , item ) in node.children.enumerated() {
        item.parent = node;
        _ = self.WalkNode(node : item, ctx : ctx, wr : wr)
        node.copyEvalResFrom(node : item)
      }
    }
  }
  func matchNode(node : CodeNode, ctx : RangerAppWriterContext, wr : CodeWriter) -> Bool {
    if ( 0 == (node.children.count) ) {
      return false;
    }
    let fc : CodeNode = node.getFirst()
    stdCommands = ctx.getStdCommands();
    for ( _ , cmd ) in stdCommands!.children.enumerated() {
      let cmdName : CodeNode = cmd.getFirst()
      if ( cmdName.vref == fc.vref ) {
        _ = self.stdParamMatch(callArgs : node, inCtx : ctx, wr : wr)
        if ( node.parent != nil  ) {
          node.parent!.copyEvalResFrom(node : node)
        }
        return true;
      }
    }
    return false;
  }
  func StartWalk(node : CodeNode, ctx : RangerAppWriterContext, wr : CodeWriter) -> Void {
    _ = self.WalkNode(node : node, ctx : ctx, wr : wr)
    for ( _ , ch ) in walkAlso.enumerated() {
      _ = self.WalkNode(node : ch, ctx : ctx, wr : wr)
    }
  }
  func WalkNode(node : CodeNode, ctx : RangerAppWriterContext, wr : CodeWriter) -> Bool {
    /** unused:  let line_index : Int = node.getLine()   **/ 
    if ( node.flow_done ) {
      return true;
    }
    node.flow_done = true;
    self.lastProcessedNode = node;
    if ( node.hasStringProperty(name : "todo") ) {
      ctx.addTodo(node : node, descr : node.getStringProperty(name : "todo"))
    }
    if ( node.isPrimitive() ) {
      if ( ctx.expressionLevel() == 0 ) {
        ctx.addError(targetnode : node, descr : "Primitive element at top level!")
      }
      self.WriteScalarValue(node : node, ctx : ctx, wr : wr)
      return true;
    }
    if ( node.value_type == 9 ) {
      self.WriteVRef(node : node, ctx : ctx, wr : wr)
      return true;
    }
    if ( node.value_type == 10 ) {
      self.WriteComment(node : node, ctx : ctx, wr : wr)
      return true;
    }
    if ( node.isFirstVref(vrefName : "fun") ) {
      self.EnterLambdaMethod(node : node, ctx : ctx, wr : wr)
      return true;
    }
    if ( node.isFirstVref(vrefName : "fn") ) {
      if ( ctx.isInMethod() ) {
        self.EnterLambdaMethod(node : node, ctx : ctx, wr : wr)
        return true;
      }
    }
    if ( node.isFirstVref(vrefName : "Extends") ) {
      return true;
    }
    if ( node.isFirstVref(vrefName : "extends") ) {
      return true;
    }
    if ( node.isFirstVref(vrefName : "extension") ) {
      self.EnterClass(node : node, ctx : ctx, wr : wr)
      return true;
    }
    if ( node.isFirstVref(vrefName : "operators") ) {
      return true;
    }
    if ( node.isFirstVref(vrefName : "systemclass") ) {
      return true;
    }
    if ( node.isFirstVref(vrefName : "systemunion") ) {
      return true;
    }
    if ( node.isFirstVref(vrefName : "Import") ) {
      _ = self.cmdImport(node : node, ctx : ctx, wr : wr)
      return true;
    }
    if ( node.isFirstVref(vrefName : "def") ) {
      self.EnterVarDef(node : node, ctx : ctx, wr : wr)
      return true;
    }
    if ( node.isFirstVref(vrefName : "let") ) {
      self.EnterVarDef(node : node, ctx : ctx, wr : wr)
      return true;
    }
    if ( node.isFirstVref(vrefName : "TemplateClass") ) {
      self.EnterTemplateClass(node : node, ctx : ctx, wr : wr)
      return true;
    }
    if ( node.isFirstVref(vrefName : "CreateClass") ) {
      self.EnterClass(node : node, ctx : ctx, wr : wr)
      return true;
    }
    if ( node.isFirstVref(vrefName : "class") ) {
      self.EnterClass(node : node, ctx : ctx, wr : wr)
      return true;
    }
    if ( node.isFirstVref(vrefName : "trait") ) {
      return true;
    }
    if ( node.isFirstVref(vrefName : "PublicMethod") ) {
      self.EnterMethod(node : node, ctx : ctx, wr : wr)
      return true;
    }
    if ( node.isFirstVref(vrefName : "StaticMethod") ) {
      self.EnterStaticMethod(node : node, ctx : ctx, wr : wr)
      return true;
    }
    if ( node.isFirstVref(vrefName : "fn") ) {
      self.EnterMethod(node : node, ctx : ctx, wr : wr)
      return true;
    }
    if ( node.isFirstVref(vrefName : "sfn") ) {
      self.EnterStaticMethod(node : node, ctx : ctx, wr : wr)
      return true;
    }
    if ( node.isFirstVref(vrefName : "=") ) {
      self.cmdAssign(node : node, ctx : ctx, wr : wr)
      return true;
    }
    if ( node.isFirstVref(vrefName : "Constructor") || node.isFirstVref(vrefName : "constructor") ) {
      self.Constructor(node : node, ctx : ctx, wr : wr)
      return true;
    }
    if ( node.isFirstVref(vrefName : "new") ) {
      self.cmdNew(node : node, ctx : ctx, wr : wr)
      return true;
    }
    if ( node.isFirstVref(vrefName : "enum") ) {
      return true;
    }
    if ( self.matchNode(node : node, ctx : ctx, wr : wr) ) {
      return true;
    }
    if ( (node.children.count) > 0 ) {
      let fc : CodeNode = node.children[0]
      if ( fc.value_type == 9 ) {
        var was_called : Bool = true
        switch (fc.vref) {
          case "Enum" : 
            was_called = true;
          default: 
            was_called = false;
            break;
        }
        if ( was_called ) {
          return true;
        }
        if ( (node.children.count) > 1 ) {
          if ( self.cmdLocalCall(node : node, ctx : ctx, wr : wr) ) {
            return true;
          }
        }
      }
    }
    if ( node.expression ) {
      for ( _ , item ) in node.children.enumerated() {
        item.parent = node;
        _ = self.WalkNode(node : item, ctx : ctx, wr : wr)
        node.copyEvalResFrom(node : item)
      }
      return true;
    }
    ctx.addError(targetnode : node, descr : "Could not understand this part")
    return true;
  }
  func mergeImports(node : CodeNode, ctx : RangerAppWriterContext, wr : CodeWriter) -> Void {
    if ( node.isFirstVref(vrefName : "Import") ) {
      let fNameNode : CodeNode = node.children[1]
      let import_file : String = fNameNode.string_value
      if ( ctx.already_imported[import_file] != nil ) {
        return;
      }
      ctx.already_imported[import_file] = true
      let c : String? = r_read_file(dirName: "." + "/" + import_file) 
      let code : SourceCode = SourceCode(code_str : c!)
      code.filename = import_file;
      let parser : RangerLispParser = RangerLispParser(code_module : code)
      parser.parse()
      node.expression = true;
      node.vref = "";
      node.children.removeLast();
      node.children.removeLast();
      let rn : CodeNode = parser.rootNode!
      self.mergeImports(node : rn, ctx : ctx, wr : wr)
      node.children.append(rn)
    } else {
      for ( _ , item ) in node.children.enumerated() {
        self.mergeImports(node : item, ctx : ctx, wr : wr)
      }
    }
  }
  func CollectMethods(node : CodeNode, ctx : RangerAppWriterContext, wr : CodeWriter) -> Void {
    self.WalkCollectMethods(node : node, ctx : ctx, wr : wr)
    for ( _ , point ) in classesWithTraits.enumerated() {
      let cl : RangerAppClassDesc = point.class_def!
      /** unused:  let joinPoint : CodeNode = point.node!   **/ 
      let traitClassDef : CodeNode = point.node!.children[1]
      let name : String = traitClassDef.vref
      let t : RangerAppClassDesc = ctx.findClass(name : name)
      if ( (t.extends_classes.count) > 0 ) {
        ctx.addError(targetnode : point.node!, descr : ("Can not join class " + name) + " because it is inherited. Currently on base classes can be used as traits.")
        continue;
      }
      if ( t.has_constructor ) {
        ctx.addError(targetnode : point.node!, descr : ("Can not join class " + name) + " because it has a constructor function")
      } else {
        let origBody : CodeNode = cl.node!.children[2]
        let match : RangerArgMatch = RangerArgMatch()
        let params : CodeNode? = t.node!.getExpressionProperty(name : "params")
        let initParams : CodeNode? = point.node!.getExpressionProperty(name : "params")
        if ( (params != nil ) && (initParams != nil ) ) {
          for ( i_1 , typeName ) in params!.children.enumerated() {
            let pArg : CodeNode = initParams!.children[i_1]
            _ = match.add(tplKeyword : typeName.vref, typeName : pArg.vref, ctx : ctx)
          }
        } else {
          _ = match.add(tplKeyword : "T", typeName : cl.name, ctx : ctx)
        }
        ctx.setCurrentClass(cc : cl)
        let traitClass : RangerAppClassDesc = ctx.findClass(name : traitClassDef.vref)
        for ( _ , pvar ) in traitClass.variables.enumerated() {
          let ccopy : CodeNode = pvar.node!.rebuildWithType(match : match, changeVref : true)
          self.WalkCollectMethods(node : ccopy, ctx : ctx, wr : wr)
          origBody.children.append(ccopy)
        }
        for ( _ , fnVar ) in traitClass.defined_variants.enumerated() {
          let mVs : RangerAppMethodVariants? = traitClass.method_variants[fnVar]
          for ( _ , variant ) in mVs!.variants.enumerated() {
            let ccopy_1 : CodeNode = variant.node!.rebuildWithType(match : match, changeVref : true)
            self.WalkCollectMethods(node : ccopy_1, ctx : ctx, wr : wr)
            origBody.children.append(ccopy_1)
          }
        }
      }
    }
    for ( _ , cl_1 ) in serializedClasses.enumerated() {
      cl_1.is_serialized = true;
      let ser : RangerSerializeClass = RangerSerializeClass()
      let extWr : CodeWriter = CodeWriter()
      ser.createJSONSerializerFn(cl : cl_1, ctx : cl_1.ctx!, wr : extWr)
      let theCode : String = extWr.getCode()
      let code : SourceCode = SourceCode(code_str : theCode)
      code.filename = "extension " + ctx.currentClass!.name;
      let parser : RangerLispParser = RangerLispParser(code_module : code)
      parser.parse()
      let rn : CodeNode = parser.rootNode!
      self.WalkCollectMethods(node : rn, ctx : cl_1.ctx!, wr : wr)
      walkAlso.append(rn)
    }
    for ( _ , cname ) in ctx.definedClassList.enumerated() {
      let c : RangerAppClassDesc = (ctx.definedClasses[cname])!
      if ( ((c.is_system || c.is_interface) || c.is_template) || c.is_trait ) {
        continue;
      }
      for ( _ , p ) in c.variables.enumerated() {
        _ = ctx.hadValidType(node : p.nameNode!)
      }
    }
  }
  func WalkCollectMethods(node : CodeNode, ctx : RangerAppWriterContext, wr : CodeWriter) -> Void {
    var find_more : Bool = true
    if ( node.isFirstVref(vrefName : "systemunion") ) {
      let nameNode : CodeNode = node.getSecond()
      let instances : CodeNode = node.getThird()
      let new_class : RangerAppClassDesc = RangerAppClassDesc()
      new_class.name = nameNode.vref;
      new_class.nameNode = nameNode;
      ctx.addClass(name : nameNode.vref, desc : new_class)
      new_class.is_system_union = true;
      for ( _ , ch ) in instances.children.enumerated() {
        new_class.is_union_of.append(ch.vref)
      }
      nameNode.clDesc = new_class;
      return;
    }
    if ( node.isFirstVref(vrefName : "systemclass") ) {
      let nameNode_1 : CodeNode = node.getSecond()
      let instances_1 : CodeNode = node.getThird()
      let new_class_1 : RangerAppClassDesc = RangerAppClassDesc()
      new_class_1.name = nameNode_1.vref;
      new_class_1.nameNode = nameNode_1;
      ctx.addClass(name : nameNode_1.vref, desc : new_class_1)
      new_class_1.is_system = true;
      for ( _ , ch_1 ) in instances_1.children.enumerated() {
        let langName : CodeNode = ch_1.getFirst()
        let langClassName : CodeNode = ch_1.getSecond()
        new_class_1.systemNames[langName.vref] = langClassName.vref
      }
      nameNode_1.is_system_class = true;
      nameNode_1.clDesc = new_class_1;
      return;
    }
    if ( node.isFirstVref(vrefName : "extends") ) {
      if ( (node.children.count) > 1 ) {
        let ee : CodeNode = node.getSecond()
        let currC : RangerAppClassDesc? = ctx.currentClass
        currC!.addParentClass(p_name : ee.vref)
        let ParentClass : RangerAppClassDesc = ctx.findClass(name : ee.vref)
        ParentClass.is_inherited = true;
      }
      find_more = false;
    }
    if ( node.isFirstVref(vrefName : "Extends") ) {
      let extList : CodeNode = node.children[1]
      let currC_1 : RangerAppClassDesc? = ctx.currentClass
      for ( _ , ee_1 ) in extList.children.enumerated() {
        currC_1!.addParentClass(p_name : ee_1.vref)
        let ParentClass_1 : RangerAppClassDesc = ctx.findClass(name : ee_1.vref)
        ParentClass_1.is_inherited = true;
      }
    }
    if ( node.isFirstVref(vrefName : "constructor") || node.isFirstVref(vrefName : "Constructor") ) {
      let currC_2 : RangerAppClassDesc? = ctx.currentClass
      let subCtx : RangerAppWriterContext = currC_2!.ctx!.fork()
      currC_2!.has_constructor = true;
      currC_2!.constructor_node = node;
      let m : RangerAppFunctionDesc = RangerAppFunctionDesc()
      m.name = "Constructor";
      m.node = node;
      m.nameNode = node.children[0];
      m.fnBody = node.children[2];
      m.fnCtx = subCtx;
      let args : CodeNode = node.children[1]
      for ( _ , arg ) in args.children.enumerated() {
        let p : RangerAppParamDesc = RangerAppParamDesc()
        p.name = arg.vref;
        p.value_type = arg.value_type;
        p.node = arg;
        p.nameNode = arg;
        p.refType = 1;
        p.varType = 4;
        m.params.append(p)
        arg.hasParamDesc = true;
        arg.paramDesc = p;
        arg.eval_type = arg.value_type;
        arg.eval_type_name = arg.type_name;
        subCtx.defineVariable(name : p.name, desc : p)
      }
      currC_2!.constructor_fn = m;
      find_more = false;
    }
    if ( node.isFirstVref(vrefName : "enum") ) {
      let fNameNode : CodeNode = node.children[1]
      let enumList : CodeNode = node.children[2]
      let new_enum : RangerAppEnum = RangerAppEnum()
      for ( _ , item ) in enumList.children.enumerated() {
        let fc : CodeNode = item.getFirst()
        new_enum.add(n : fc.vref)
      }
      ctx.definedEnums[fNameNode.vref] = new_enum
      find_more = false;
    }
    if ( node.isFirstVref(vrefName : "Enum") ) {
      let fNameNode_1 : CodeNode = node.children[1]
      let enumList_1 : CodeNode = node.children[2]
      let new_enum_1 : RangerAppEnum = RangerAppEnum()
      for ( _ , item_1 ) in enumList_1.children.enumerated() {
        new_enum_1.add(n : item_1.vref)
      }
      ctx.definedEnums[fNameNode_1.vref] = new_enum_1
      find_more = false;
    }
    if ( node.isFirstVref(vrefName : "trait") ) {
      let s : String = node.getVRefAt(idx : 1)
      let classNameNode : CodeNode = node.getSecond()
      let new_class_2 : RangerAppClassDesc = RangerAppClassDesc()
      new_class_2.name = s;
      let subCtx_1 : RangerAppWriterContext = ctx.fork()
      ctx.setCurrentClass(cc : new_class_2)
      subCtx_1.setCurrentClass(cc : new_class_2)
      new_class_2.ctx = subCtx_1;
      new_class_2.nameNode = classNameNode;
      ctx.addClass(name : s, desc : new_class_2)
      new_class_2.classNode = node;
      new_class_2.node = node;
      new_class_2.is_trait = true;
    }
    if ( node.isFirstVref(vrefName : "CreateClass") || node.isFirstVref(vrefName : "class") ) {
      let s_1 : String = node.getVRefAt(idx : 1)
      let classNameNode_1 : CodeNode = node.getSecond()
      if ( classNameNode_1.has_vref_annotation ) {
        print("%% vref_annotation")
        let ann : CodeNode? = classNameNode_1.vref_annotation
        print((classNameNode_1.vref + " : ") + ann!.getCode())
        ctx.addTemplateClass(name : classNameNode_1.vref, node : node)
        find_more = false;
      } else {
        let new_class_3 : RangerAppClassDesc = RangerAppClassDesc()
        new_class_3.name = s_1;
        let subCtx_2 : RangerAppWriterContext = ctx.fork()
        ctx.setCurrentClass(cc : new_class_3)
        subCtx_2.setCurrentClass(cc : new_class_3)
        new_class_3.ctx = subCtx_2;
        new_class_3.nameNode = classNameNode_1;
        ctx.addClass(name : s_1, desc : new_class_3)
        new_class_3.classNode = node;
        new_class_3.node = node;
        if ( node.hasBooleanProperty(name : "trait") ) {
          new_class_3.is_trait = true;
        }
      }
    }
    if ( node.isFirstVref(vrefName : "TemplateClass") ) {
      let s_2 : String = node.getVRefAt(idx : 1)
      ctx.addTemplateClass(name : s_2, node : node)
      find_more = false;
    }
    if ( node.isFirstVref(vrefName : "Extends") ) {
      let list : CodeNode = node.children[1]
      for ( _ , cname ) in list.children.enumerated() {
        let extC : RangerAppClassDesc = ctx.findClass(name : cname.vref)
        for ( _ , vv ) in extC.variables.enumerated() {
          let currC_3 : RangerAppClassDesc? = ctx.currentClass
          let subCtx_3 : RangerAppWriterContext? = currC_3!.ctx
          subCtx_3!.defineVariable(name : vv.name, desc : vv)
        }
      }
      find_more = false;
    }
    if ( node.isFirstVref(vrefName : "def") || node.isFirstVref(vrefName : "let") ) {
      let s_3 : String = node.getVRefAt(idx : 1)
      let vDef : CodeNode = node.children[1]
      let p_1 : RangerAppParamDesc = RangerAppParamDesc()
      if ( s_3 != ctx.transformWord(input_word : s_3) ) {
        ctx.addError(targetnode : node, descr : ("Can not use reserved word " + s_3) + " as class propery")
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
      if ( vDef.hasFlag(flagName : "weak") ) {
        p_1.changeStrength(newStrength : 0, lifeTime : 2, changer : p_1.nameNode!)
      } else {
        p_1.changeStrength(newStrength : 2, lifeTime : 2, changer : p_1.nameNode!)
      }
      if ( (node.children.count) > 2 ) {
        p_1.set_cnt = 1;
        p_1.init_cnt = 1;
        p_1.def_value = node.children[2];
        p_1.is_optional = false;
        if ( p_1.def_value!.value_type == 4 ) {
          vDef.type_name = "string";
        }
        if ( p_1.def_value!.value_type == 3 ) {
          vDef.type_name = "int";
        }
        if ( p_1.def_value!.value_type == 2 ) {
          vDef.type_name = "double";
        }
        if ( p_1.def_value!.value_type == 5 ) {
          vDef.type_name = "boolean";
        }
      } else {
        p_1.is_optional = true;
        if ( false == ((vDef.value_type == 6) || (vDef.value_type == 7)) ) {
          vDef.setFlag(flagName : "optional")
        }
      }
      let currC_4 : RangerAppClassDesc? = ctx.currentClass
      currC_4!.addVariable(desc : p_1)
      let subCtx_4 : RangerAppWriterContext? = currC_4!.ctx
      subCtx_4!.defineVariable(name : p_1.name, desc : p_1)
      p_1.is_class_variable = true;
    }
    if ( node.isFirstVref(vrefName : "operators") ) {
      let listOf : CodeNode = node.getSecond()
      for ( _ , item_2 ) in listOf.children.enumerated() {
        ctx.createOperator(fromNode : item_2)
      }
      find_more = false;
    }
    if ( node.isFirstVref(vrefName : "Import") || node.isFirstVref(vrefName : "import") ) {
      let fNameNode_2 : CodeNode = node.children[1]
      let import_file : String = fNameNode_2.string_value
      if ( ctx.already_imported[import_file] != nil ) {
        return;
      } else {
        ctx.already_imported[import_file] = true
      }
      let c : String? = r_read_file(dirName: "." + "/" + import_file) 
      let code : SourceCode = SourceCode(code_str : c!)
      code.filename = import_file;
      let parser : RangerLispParser = RangerLispParser(code_module : code)
      parser.parse()
      let rnode : CodeNode? = parser.rootNode
      self.WalkCollectMethods(node : rnode!, ctx : ctx, wr : wr)
      find_more = false;
    }
    if ( node.isFirstVref(vrefName : "does") ) {
      let defName : CodeNode = node.getSecond()
      let currC_5 : RangerAppClassDesc? = ctx.currentClass
      currC_5!.consumes_traits.append(defName.vref)
      let joinPoint : ClassJoinPoint = ClassJoinPoint()
      joinPoint.class_def = currC_5;
      joinPoint.node = node;
      classesWithTraits.append(joinPoint)
    }
    if ( node.isFirstVref(vrefName : "StaticMethod") || node.isFirstVref(vrefName : "sfn") ) {
      let s_4 : String = node.getVRefAt(idx : 1)
      let currC_6 : RangerAppClassDesc? = ctx.currentClass
      let m_1 : RangerAppFunctionDesc = RangerAppFunctionDesc()
      m_1.name = s_4;
      m_1.compiledName = ctx.transformWord(input_word : s_4);
      m_1.node = node;
      m_1.is_static = true;
      m_1.nameNode = node.children[1];
      m_1.nameNode!.ifNoTypeSetToVoid()
      let args_1 : CodeNode = node.children[2]
      m_1.fnBody = node.children[3];
      for ( _ , arg_1 ) in args_1.children.enumerated() {
        let p_2 : RangerAppParamDesc = RangerAppParamDesc()
        p_2.name = arg_1.vref;
        p_2.value_type = arg_1.value_type;
        p_2.node = arg_1;
        p_2.init_cnt = 1;
        p_2.nameNode = arg_1;
        p_2.refType = 1;
        p_2.varType = 4;
        m_1.params.append(p_2)
        arg_1.hasParamDesc = true;
        arg_1.paramDesc = p_2;
        arg_1.eval_type = arg_1.value_type;
        arg_1.eval_type_name = arg_1.type_name;
        if ( arg_1.hasFlag(flagName : "strong") ) {
          p_2.changeStrength(newStrength : 1, lifeTime : 1, changer : p_2.nameNode!)
        } else {
          arg_1.setFlag(flagName : "lives")
          p_2.changeStrength(newStrength : 0, lifeTime : 1, changer : p_2.nameNode!)
        }
      }
      currC_6!.addStaticMethod(desc : m_1)
      find_more = false;
    }
    if ( node.isFirstVref(vrefName : "extension") ) {
      let s_5 : String = node.getVRefAt(idx : 1)
      let old_class : RangerAppClassDesc = ctx.findClass(name : s_5)
      ctx.setCurrentClass(cc : old_class)
      print("extension for " + s_5)
    }
    if ( node.isFirstVref(vrefName : "PublicMethod") || node.isFirstVref(vrefName : "fn") ) {
      let cn : CodeNode = node.getSecond()
      let s_6 : String = node.getVRefAt(idx : 1)
      cn.ifNoTypeSetToVoid()
      let currC_7 : RangerAppClassDesc? = ctx.currentClass
      if ( currC_7!.hasOwnMethod(m_name : s_6) ) {
        ctx.addError(targetnode : node, descr : "Error: method of same name declared earlier. Overriding function declarations is not currently allowed!")
        return;
      }
      if ( cn.hasFlag(flagName : "main") ) {
        ctx.addError(targetnode : node, descr : "Error: dynamic method declared as @(main). Use static 'sfn' instead of 'fn'.")
        return;
      }
      let m_2 : RangerAppFunctionDesc = RangerAppFunctionDesc()
      m_2.name = s_6;
      m_2.compiledName = ctx.transformWord(input_word : s_6);
      m_2.node = node;
      m_2.nameNode = node.children[1];
      if ( node.hasBooleanProperty(name : "strong") ) {
        m_2.refType = 2;
      } else {
        m_2.refType = 1;
      }
      let subCtx_5 : RangerAppWriterContext = currC_7!.ctx!.fork()
      subCtx_5.is_function = true;
      subCtx_5.currentMethod = m_2;
      m_2.fnCtx = subCtx_5;
      if ( cn.hasFlag(flagName : "weak") ) {
        m_2.changeStrength(newStrength : 0, lifeTime : 1, changer : node)
      } else {
        m_2.changeStrength(newStrength : 1, lifeTime : 1, changer : node)
      }
      let args_2 : CodeNode = node.children[2]
      m_2.fnBody = node.children[3];
      for ( _ , arg_2 ) in args_2.children.enumerated() {
        let p2 : RangerAppParamDesc = RangerAppParamDesc()
        p2.name = arg_2.vref;
        p2.value_type = arg_2.value_type;
        p2.node = arg_2;
        p2.nameNode = arg_2;
        p2.init_cnt = 1;
        p2.refType = 1;
        p2.initRefType = 1;
        p2.debugString = "--> collected ";
        if ( args_2.hasBooleanProperty(name : "strong") ) {
          p2.debugString = "--> collected as STRONG";
          ctx.log(node : node, logName : "memory5", descr : "strong param should move local ownership to call ***")
          p2.refType = 2;
          p2.initRefType = 2;
        }
        p2.varType = 4;
        m_2.params.append(p2)
        arg_2.hasParamDesc = true;
        arg_2.paramDesc = p2;
        arg_2.eval_type = arg_2.value_type;
        arg_2.eval_type_name = arg_2.type_name;
        if ( arg_2.hasFlag(flagName : "strong") ) {
          p2.changeStrength(newStrength : 1, lifeTime : 1, changer : p2.nameNode!)
        } else {
          arg_2.setFlag(flagName : "lives")
          p2.changeStrength(newStrength : 0, lifeTime : 1, changer : p2.nameNode!)
        }
        subCtx_5.defineVariable(name : p2.name, desc : p2)
      }
      currC_7!.addMethod(desc : m_2)
      find_more = false;
    }
    if ( find_more ) {
      for ( _ , item_3 ) in node.children.enumerated() {
        self.WalkCollectMethods(node : item_3, ctx : ctx, wr : wr)
      }
    }
    if ( node.hasBooleanProperty(name : "serialize") ) {
      serializedClasses.append(ctx.currentClass!)
    }
  }
  func FindWeakRefs(node : CodeNode, ctx : RangerAppWriterContext, wr : CodeWriter) -> Void {
    let list : [RangerAppClassDesc] = ctx.getClasses()
    for ( _ , classDesc ) in list.enumerated() {
      for ( _ , varD ) in classDesc.variables.enumerated() {
        if ( varD.refType == 1 ) {
          if ( varD.isArray() ) {
            /** unused:  let nn : CodeNode? = varD.nameNode   **/ 
          }
          if ( varD.isHash() ) {
            /** unused:  let nn_1 : CodeNode? = varD.nameNode   **/ 
          }
          if ( varD.isObject() ) {
            /** unused:  let nn_2 : CodeNode? = varD.nameNode   **/ 
          }
        }
      }
    }
  }
  func findFunctionDesc(obj : CodeNode, ctx : RangerAppWriterContext, wr : CodeWriter) -> RangerAppFunctionDesc? {
    var varDesc : RangerAppParamDesc?
    var varFnDesc : RangerAppFunctionDesc?
    if ( obj.vref != self.getThisName() ) {
      if ( (obj.ns.count) > 1 ) {
        let cnt : Int = obj.ns.count
        var classRefDesc : RangerAppParamDesc?
        var classDesc : RangerAppClassDesc?
        for ( i , strname ) in obj.ns.enumerated() {
          if ( i == 0 ) {
            if ( strname == self.getThisName() ) {
              classDesc = ctx.getCurrentClass();
            } else {
              if ( ctx.isDefinedClass(name : strname) ) {
                classDesc = ctx.findClass(name : strname);
                continue;
              }
              classRefDesc = ctx.getVariableDef(name : strname);
              if ( (classRefDesc == nil) || (classRefDesc!.nameNode == nil) ) {
                ctx.addError(targetnode : obj, descr : "Error, no description for called object: " + strname)
                break;
              }
              classRefDesc!.ref_cnt = 1 + classRefDesc!.ref_cnt;
              classDesc = ctx.findClass(name : classRefDesc!.nameNode!.type_name);
              if ( classDesc == nil ) {
                return varFnDesc;
              }
            }
          } else {
            if ( classDesc == nil ) {
              return varFnDesc;
            }
            if ( i < (cnt - 1) ) {
              varDesc = classDesc!.findVariable(f_name : strname);
              if ( varDesc == nil ) {
                ctx.addError(targetnode : obj, descr : "Error, no description for refenced obj: " + strname)
              }
              let subClass : String = varDesc!.getTypeName()
              classDesc = ctx.findClass(name : subClass);
              continue;
            }
            if ( classDesc != nil  ) {
              varFnDesc = classDesc!.findMethod(f_name : strname);
              if ( varFnDesc == nil ) {
                varFnDesc = classDesc!.findStaticMethod(f_name : strname);
                if ( varFnDesc == nil ) {
                  ctx.addError(targetnode : obj, descr : " function variable not found " + strname)
                }
              }
            }
          }
        }
        return varFnDesc;
      }
      let udesc : RangerAppClassDesc? = ctx.getCurrentClass()
      let currClass : RangerAppClassDesc = udesc!
      varFnDesc = currClass.findMethod(f_name : obj.vref);
      if ( varFnDesc!.nameNode != nil  ) {
      } else {
        ctx.addError(targetnode : obj, descr : "Error, no description for called function: " + obj.vref)
      }
      return varFnDesc;
    }
    ctx.addError(targetnode : obj, descr : "Can not call 'this' like function")
    varFnDesc = RangerAppFunctionDesc();
    return varFnDesc;
  }
  func findParamDesc(obj : CodeNode, ctx : RangerAppWriterContext, wr : CodeWriter) -> RangerAppParamDesc? {
    var varDesc : RangerAppParamDesc?
    var set_nsp : Bool = false
    var classDesc : RangerAppClassDesc?
    if ( 0 == (obj.nsp.count) ) {
      set_nsp = true;
    }
    if ( obj.vref != self.getThisName() ) {
      if ( (obj.ns.count) > 1 ) {
        let cnt : Int = obj.ns.count
        var classRefDesc : RangerAppParamDesc?
        for ( i , strname ) in obj.ns.enumerated() {
          if ( i == 0 ) {
            if ( strname == self.getThisName() ) {
              classDesc = ctx.getCurrentClass();
              if ( set_nsp ) {
                obj.nsp.append(classDesc!)
              }
            } else {
              if ( ctx.isDefinedClass(name : strname) ) {
                classDesc = ctx.findClass(name : strname);
                if ( set_nsp ) {
                  obj.nsp.append(classDesc!)
                }
                continue;
              }
              classRefDesc = ctx.getVariableDef(name : strname);
              if ( classRefDesc == nil ) {
                ctx.addError(targetnode : obj, descr : "Error, no description for called object: " + strname)
                break;
              }
              if ( set_nsp ) {
                obj.nsp.append(classRefDesc!)
              }
              classRefDesc!.ref_cnt = 1 + classRefDesc!.ref_cnt;
              classDesc = ctx.findClass(name : classRefDesc!.nameNode!.type_name);
            }
          } else {
            if ( i < (cnt - 1) ) {
              varDesc = classDesc!.findVariable(f_name : strname);
              if ( varDesc == nil ) {
                ctx.addError(targetnode : obj, descr : "Error, no description for refenced obj: " + strname)
              }
              let subClass : String = varDesc!.getTypeName()
              classDesc = ctx.findClass(name : subClass);
              if ( set_nsp ) {
                obj.nsp.append(varDesc!)
              }
              continue;
            }
            if ( classDesc != nil  ) {
              varDesc = classDesc!.findVariable(f_name : strname);
              if ( varDesc == nil ) {
                var classMethod : RangerAppFunctionDesc? = classDesc!.findMethod(f_name : strname)
                if ( classMethod == nil ) {
                  classMethod = classDesc!.findStaticMethod(f_name : strname);
                  if ( classMethod == nil ) {
                    ctx.addError(targetnode : obj, descr : "variable not found " + strname)
                  }
                }
                if ( classMethod != nil  ) {
                  if ( set_nsp ) {
                    obj.nsp.append(classMethod!)
                  }
                  return classMethod;
                }
              }
              if ( set_nsp ) {
                obj.nsp.append(varDesc!)
              }
            }
          }
        }
        return varDesc;
      }
      varDesc = ctx.getVariableDef(name : obj.vref);
      if ( varDesc!.nameNode != nil  ) {
      } else {
        print("findParamDesc : description not found for " + obj.vref)
        if ( varDesc != nil  ) {
          print("Vardesc was found though..." + varDesc!.name)
        }
        ctx.addError(targetnode : obj, descr : "Error, no description for called object: " + obj.vref)
      }
      return varDesc;
    }
    let cc : RangerAppClassDesc? = ctx.getCurrentClass()
    return cc;
  }
  func areEqualTypes(n1 : CodeNode, n2 : CodeNode, ctx : RangerAppWriterContext) -> Bool {
    if ( (((n1.eval_type != 0) && (n2.eval_type != 0)) && ((n1.eval_type_name.characters.count) > 0)) && ((n2.eval_type_name.characters.count) > 0) ) {
      if ( n1.eval_type_name == n2.eval_type_name ) {
      } else {
        var b_ok : Bool = false
        if ( ctx.isEnumDefined(n : n1.eval_type_name) && (n2.eval_type_name == "int") ) {
          b_ok = true;
        }
        if ( ctx.isEnumDefined(n : n2.eval_type_name) && (n1.eval_type_name == "int") ) {
          b_ok = true;
        }
        if ( (n1.eval_type_name == "char") && (n2.eval_type_name == "int") ) {
          b_ok = true;
        }
        if ( (n1.eval_type_name == "int") && (n2.eval_type_name == "char") ) {
          b_ok = true;
        }
        if ( ctx.isDefinedClass(name : n1.eval_type_name) && ctx.isDefinedClass(name : n2.eval_type_name) ) {
          let c1 : RangerAppClassDesc = ctx.findClass(name : n1.eval_type_name)
          let c2 : RangerAppClassDesc = ctx.findClass(name : n2.eval_type_name)
          if ( c1.isSameOrParentClass(class_name : n2.eval_type_name, ctx : ctx) ) {
            return true;
          }
          if ( c2.isSameOrParentClass(class_name : n1.eval_type_name, ctx : ctx) ) {
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
  func shouldBeEqualTypes(n1 : CodeNode, n2 : CodeNode, ctx : RangerAppWriterContext, msg : String) -> Void {
    if ( (((n1.eval_type != 0) && (n2.eval_type != 0)) && ((n1.eval_type_name.characters.count) > 0)) && ((n2.eval_type_name.characters.count) > 0) ) {
      if ( n1.eval_type_name == n2.eval_type_name ) {
      } else {
        var b_ok : Bool = false
        if ( ctx.isEnumDefined(n : n1.eval_type_name) && (n2.eval_type_name == "int") ) {
          b_ok = true;
        }
        if ( ctx.isEnumDefined(n : n2.eval_type_name) && (n1.eval_type_name == "int") ) {
          b_ok = true;
        }
        if ( ctx.isDefinedClass(name : n2.eval_type_name) ) {
          let cc : RangerAppClassDesc = ctx.findClass(name : n2.eval_type_name)
          if ( cc.isSameOrParentClass(class_name : n1.eval_type_name, ctx : ctx) ) {
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
          ctx.addError(targetnode : n1, descr : (((("Type mismatch " + n2.eval_type_name) + " <> ") + n1.eval_type_name) + ". ") + msg)
        }
      }
    }
  }
  func shouldBeExpression(n1 : CodeNode, ctx : RangerAppWriterContext, msg : String) -> Void {
    if ( n1.expression == false ) {
      ctx.addError(targetnode : n1, descr : msg)
    }
  }
  func shouldHaveChildCnt(cnt : Int, n1 : CodeNode, ctx : RangerAppWriterContext, msg : String) -> Void {
    if ( (n1.children.count) != cnt ) {
      ctx.addError(targetnode : n1, descr : msg)
    }
  }
  func shouldBeNumeric(n1 : CodeNode, ctx : RangerAppWriterContext, msg : String) -> Void {
    if ( (n1.eval_type != 0) && ((n1.eval_type_name.characters.count) > 0) ) {
      if ( false == ((n1.eval_type_name == "double") || (n1.eval_type_name == "int")) ) {
        ctx.addError(targetnode : n1, descr : (("Not numeric: " + n1.eval_type_name) + ". ") + msg)
      }
    }
  }
  func shouldBeArray(n1 : CodeNode, ctx : RangerAppWriterContext, msg : String) -> Void {
    if ( n1.eval_type != 6 ) {
      ctx.addError(targetnode : n1, descr : "Expecting array. " + msg)
    }
  }
  func shouldBeType(type_name : String, n1 : CodeNode, ctx : RangerAppWriterContext, msg : String) -> Void {
    if ( (n1.eval_type != 0) && ((n1.eval_type_name.characters.count) > 0) ) {
      if ( n1.eval_type_name == type_name ) {
      } else {
        var b_ok : Bool = false
        if ( ctx.isEnumDefined(n : n1.eval_type_name) && (type_name == "int") ) {
          b_ok = true;
        }
        if ( ctx.isEnumDefined(n : type_name) && (n1.eval_type_name == "int") ) {
          b_ok = true;
        }
        if ( (n1.eval_type_name == "char") && (type_name == "int") ) {
          b_ok = true;
        }
        if ( (n1.eval_type_name == "int") && (type_name == "char") ) {
          b_ok = true;
        }
        if ( b_ok == false ) {
          ctx.addError(targetnode : n1, descr : (((("Type mismatch " + type_name) + " <> ") + n1.eval_type_name) + ". ") + msg)
        }
      }
    }
  }
}
func ==(l: NodeEvalState, r: NodeEvalState) -> Bool {
  return l === r
}
class NodeEvalState : Equatable  { 
  var ctx : RangerAppWriterContext?     /** note: unused */
  var is_running : Bool = false     /** note: unused */
  var child_index : Int = -1     /** note: unused */
  var cmd_index : Int = -1     /** note: unused */
  var is_ready : Bool = false     /** note: unused */
  var is_waiting : Bool = false     /** note: unused */
  var exit_after : Bool = false     /** note: unused */
  var expand_args : Bool = false     /** note: unused */
  var ask_expand : Bool = false     /** note: unused */
  var eval_rest : Bool = false     /** note: unused */
  var exec_cnt : Int = 0     /** note: unused */
  var b_debugger : Bool = false     /** note: unused */
  var b_top_node : Bool = false     /** note: unused */
  var ask_eval : Bool = false     /** note: unused */
  var param_eval_on : Bool = false     /** note: unused */
  var eval_index : Int = -1     /** note: unused */
  var eval_end_index : Int = -1     /** note: unused */
  var ask_eval_start : Int = 0     /** note: unused */
  var ask_eval_end : Int = 0     /** note: unused */
  var evaluating_cmd : CodeNode?     /** note: unused */
}
func ==(l: RangerGenericClassWriter, r: RangerGenericClassWriter) -> Bool {
  return l === r
}
class RangerGenericClassWriter : Equatable  { 
  var compiler : LiveCompiler?
  func EncodeString(node : CodeNode, ctx : RangerAppWriterContext, wr : CodeWriter) -> String {
    /** unused:  let encoded_str : String = ""   **/ 
    let str_length : Int = node.string_value.characters.count
    var encoded_str_2 : String = ""
    var ii : Int = 0
    while (ii < str_length) {
      let cc : Int = Int( ( node.string_value as NSString ).character( at: ii ) )
      switch (cc) {
        case 8 : 
          encoded_str_2 = (encoded_str_2 + ((String( Character( UnicodeScalar(92 )! ))))) + ((String( Character( UnicodeScalar(98 )! ))));
        case 9 : 
          encoded_str_2 = (encoded_str_2 + ((String( Character( UnicodeScalar(92 )! ))))) + ((String( Character( UnicodeScalar(116 )! ))));
        case 10 : 
          encoded_str_2 = (encoded_str_2 + ((String( Character( UnicodeScalar(92 )! ))))) + ((String( Character( UnicodeScalar(110 )! ))));
        case 12 : 
          encoded_str_2 = (encoded_str_2 + ((String( Character( UnicodeScalar(92 )! ))))) + ((String( Character( UnicodeScalar(102 )! ))));
        case 13 : 
          encoded_str_2 = (encoded_str_2 + ((String( Character( UnicodeScalar(92 )! ))))) + ((String( Character( UnicodeScalar(114 )! ))));
        case 34 : 
          encoded_str_2 = (encoded_str_2 + ((String( Character( UnicodeScalar(92 )! ))))) + ((String( Character( UnicodeScalar(34 )! ))));
        case 92 : 
          encoded_str_2 = (encoded_str_2 + ((String( Character( UnicodeScalar(92 )! ))))) + ((String( Character( UnicodeScalar(92 )! ))));
        default: 
          encoded_str_2 = encoded_str_2 + ((String( Character( UnicodeScalar(cc )! ))));
          break;
      }
      ii = ii + 1;
    }
    return encoded_str_2;
  }
  func CustomOperator(node : CodeNode, ctx : RangerAppWriterContext, wr : CodeWriter) -> Void {
  }
  func WriteSetterVRef(node : CodeNode, ctx : RangerAppWriterContext, wr : CodeWriter) -> Void {
  }
  func writeArrayTypeDef(node : CodeNode, ctx : RangerAppWriterContext, wr : CodeWriter) -> Void {
  }
  func WriteEnum(node : CodeNode, ctx : RangerAppWriterContext, wr : CodeWriter) -> Void {
    if ( node.eval_type == 11 ) {
      let rootObjName : String = node.ns[0]
      let e : RangerAppEnum? = ctx.getEnum(n : rootObjName)
      if ( e != nil  ) {
        let enumName : String = node.ns[1]
        wr.out(str : "" + String(((e!.values[enumName])!)), newLine : false)
      } else {
        if ( node.hasParamDesc ) {
          let pp : RangerAppParamDesc? = node.paramDesc
          let nn : CodeNode? = pp!.nameNode
          self.WriteVRef(node : nn!, ctx : ctx, wr : wr)
        }
      }
    }
  }
  func WriteScalarValue(node : CodeNode, ctx : RangerAppWriterContext, wr : CodeWriter) -> Void {
    switch (node.value_type) {
      case 2 : 
        wr.out(str : "" + String(node.double_value), newLine : false)
      case 4 : 
        let s : String = self.EncodeString(node : node, ctx : ctx, wr : wr)
        wr.out(str : ("\"" + s) + "\"", newLine : false)
      case 3 : 
        wr.out(str : "" + String(node.int_value), newLine : false)
      case 5 : 
        if ( node.boolean_value ) {
          wr.out(str : "true", newLine : false)
        } else {
          wr.out(str : "false", newLine : false)
        }
      default :
        break
    }
  }
  func getTypeString(type_string : String) -> String {
    return type_string;
  }
  func import_lib(lib_name : String, ctx : RangerAppWriterContext, wr : CodeWriter) -> Void {
    wr.addImport(name : lib_name)
  }
  func getObjectTypeString(type_string : String, ctx : RangerAppWriterContext) -> String {
    switch (type_string) {
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
      default :
        break
    }
    return type_string;
  }
  func release_local_vars(node : CodeNode, ctx : RangerAppWriterContext, wr : CodeWriter) -> Void {
    for ( _ , n ) in ctx.localVarNames.enumerated() {
      let p : RangerAppParamDesc? = ctx.localVariables[n]
      if ( p!.ref_cnt == 0 ) {
        continue;
      }
      if ( p!.isAllocatedType() ) {
        if ( 1 == p!.getStrength() ) {
          if ( p!.nameNode!.eval_type == 7 ) {
          }
          if ( p!.nameNode!.eval_type == 6 ) {
          }
          if ( (p!.nameNode!.eval_type != 6) && (p!.nameNode!.eval_type != 7) ) {
          }
        }
        if ( 0 == p!.getStrength() ) {
          if ( p!.nameNode!.eval_type == 7 ) {
          }
          if ( p!.nameNode!.eval_type == 6 ) {
          }
          if ( (p!.nameNode!.eval_type != 6) && (p!.nameNode!.eval_type != 7) ) {
          }
        }
      }
    }
    if ( ctx.is_function ) {
      return;
    }
    if ( ctx.parent != nil  ) {
      self.release_local_vars(node : node, ctx : ctx.parent!, wr : wr)
    }
  }
  func WalkNode(node : CodeNode, ctx : RangerAppWriterContext, wr : CodeWriter) -> Void {
    self.compiler!.WalkNode(node : node, ctx : ctx, wr : wr)
  }
  func writeTypeDef(node : CodeNode, ctx : RangerAppWriterContext, wr : CodeWriter) -> Void {
    wr.out(str : node.type_name, newLine : false)
  }
  func writeRawTypeDef(node : CodeNode, ctx : RangerAppWriterContext, wr : CodeWriter) -> Void {
    self.writeTypeDef(node : node, ctx : ctx, wr : wr)
  }
  func adjustType(tn : String) -> String {
    return tn;
  }
  func WriteVRef(node : CodeNode, ctx : RangerAppWriterContext, wr : CodeWriter) -> Void {
    if ( node.eval_type == 11 ) {
      if ( (node.ns.count) > 1 ) {
        let rootObjName : String = node.ns[0]
        let enumName : String = node.ns[1]
        let e : RangerAppEnum? = ctx.getEnum(n : rootObjName)
        if ( e != nil  ) {
          wr.out(str : "" + String(((e!.values[enumName])!)), newLine : false)
          return;
        }
      }
    }
    if ( (node.nsp.count) > 0 ) {
      for ( i , p ) in node.nsp.enumerated() {
        if ( i > 0 ) {
          wr.out(str : ".", newLine : false)
        }
        if ( (p.compiledName.characters.count) > 0 ) {
          wr.out(str : self.adjustType(tn : p.compiledName), newLine : false)
        } else {
          if ( (p.name.characters.count) > 0 ) {
            wr.out(str : self.adjustType(tn : p.name), newLine : false)
          } else {
            wr.out(str : self.adjustType(tn : (node.ns[i])), newLine : false)
          }
        }
      }
      return;
    }
    for ( i_1 , part ) in node.ns.enumerated() {
      if ( i_1 > 0 ) {
        wr.out(str : ".", newLine : false)
      }
      wr.out(str : self.adjustType(tn : part), newLine : false)
    }
  }
  func writeVarDef(node : CodeNode, ctx : RangerAppWriterContext, wr : CodeWriter) -> Void {
    if ( node.hasParamDesc ) {
      let p : RangerAppParamDesc? = node.paramDesc
      if ( p!.set_cnt > 0 ) {
        wr.out(str : "var " + p!.name, newLine : false)
      } else {
        wr.out(str : "const " + p!.name, newLine : false)
      }
      if ( (node.children.count) > 2 ) {
        wr.out(str : " = ", newLine : false)
        ctx.setInExpr()
        let value : CodeNode = node.getThird()
        self.WalkNode(node : value, ctx : ctx, wr : wr)
        ctx.unsetInExpr()
        wr.out(str : ";", newLine : true)
      } else {
        wr.out(str : ";", newLine : true)
      }
    }
  }
  func CreateLambdaCall(node : CodeNode, ctx : RangerAppWriterContext, wr : CodeWriter) -> Void {
    let fName : CodeNode = node.children[0]
    let args : CodeNode = node.children[1]
    self.WriteVRef(node : fName, ctx : ctx, wr : wr)
    wr.out(str : "(", newLine : false)
    for ( i , arg ) in args.children.enumerated() {
      if ( i > 0 ) {
        wr.out(str : ", ", newLine : false)
      }
      self.WalkNode(node : arg, ctx : ctx, wr : wr)
    }
    wr.out(str : ")", newLine : false)
    if ( ctx.expressionLevel() == 0 ) {
      wr.out(str : ";", newLine : true)
    }
  }
  func CreateLambda(node : CodeNode, ctx : RangerAppWriterContext, wr : CodeWriter) -> Void {
    let lambdaCtx : RangerAppWriterContext = node.lambda_ctx!
    let args : CodeNode = node.children[1]
    let body : CodeNode = node.children[2]
    wr.out(str : "(", newLine : false)
    for ( i , arg ) in args.children.enumerated() {
      if ( i > 0 ) {
        wr.out(str : ", ", newLine : false)
      }
      self.WalkNode(node : arg, ctx : lambdaCtx, wr : wr)
    }
    wr.out(str : ")", newLine : false)
    wr.out(str : " => { ", newLine : true)
    wr.indent(delta : 1)
    lambdaCtx.restartExpressionLevel()
    for ( _ , item ) in body.children.enumerated() {
      self.WalkNode(node : item, ctx : lambdaCtx, wr : wr)
    }
    wr.newline()
    wr.indent(delta : -1)
    wr.out(str : "}", newLine : true)
  }
  func writeFnCall(node : CodeNode, ctx : RangerAppWriterContext, wr : CodeWriter) -> Void {
    if ( node.hasFnCall ) {
      let fc : CodeNode = node.getFirst()
      self.WriteVRef(node : fc, ctx : ctx, wr : wr)
      wr.out(str : "(", newLine : false)
      let givenArgs : CodeNode = node.getSecond()
      ctx.setInExpr()
      for ( i , arg ) in node.fnDesc!.params.enumerated() {
        if ( i > 0 ) {
          wr.out(str : ", ", newLine : false)
        }
        if ( (givenArgs.children.count) <= i ) {
          let defVal : CodeNode? = arg.nameNode!.getFlag(flagName : "default")
          if ( defVal != nil  ) {
            let fc_1 : CodeNode = defVal!.vref_annotation!.getFirst()
            self.WalkNode(node : fc_1, ctx : ctx, wr : wr)
          } else {
            ctx.addError(targetnode : node, descr : "Default argument was missing")
          }
          continue;
        }
        let n : CodeNode = givenArgs.children[i]
        self.WalkNode(node : n, ctx : ctx, wr : wr)
      }
      ctx.unsetInExpr()
      wr.out(str : ")", newLine : false)
      if ( ctx.expressionLevel() == 0 ) {
        wr.out(str : ";", newLine : true)
      }
    }
  }
  func writeNewCall(node : CodeNode, ctx : RangerAppWriterContext, wr : CodeWriter) -> Void {
    if ( node.hasNewOper ) {
      let cl : RangerAppClassDesc? = node.clDesc
      /** unused:  let fc : CodeNode = node.getSecond()   **/ 
      wr.out(str : "new " + node.clDesc!.name, newLine : false)
      wr.out(str : "(", newLine : false)
      let constr : RangerAppFunctionDesc? = cl!.constructor_fn
      let givenArgs : CodeNode = node.getThird()
      if ( constr != nil  ) {
        for ( i , arg ) in constr!.params.enumerated() {
          let n : CodeNode = givenArgs.children[i]
          if ( i > 0 ) {
            wr.out(str : ", ", newLine : false)
          }
          if ( true || (arg.nameNode != nil ) ) {
            self.WalkNode(node : n, ctx : ctx, wr : wr)
          }
        }
      }
      wr.out(str : ")", newLine : false)
    }
  }
  func writeInterface(cl : RangerAppClassDesc, ctx : RangerAppWriterContext, wr : CodeWriter) -> Void {
  }
  func disabledVarDef(node : CodeNode, ctx : RangerAppWriterContext, wr : CodeWriter) -> Void {
  }
  func writeClass(node : CodeNode, ctx : RangerAppWriterContext, wr : CodeWriter) -> Void {
    let cl : RangerAppClassDesc? = node.clDesc
    if ( cl == nil ) {
      return;
    }
    wr.out(str : ("class " + cl!.name) + " { ", newLine : true)
    wr.indent(delta : 1)
    for ( _ , pvar ) in cl!.variables.enumerated() {
      wr.out(str : ((("/* var " + pvar.name) + " => ") + pvar.nameNode!.parent!.getCode()) + " */ ", newLine : true)
    }
    for ( _ , pvar_1 ) in cl!.static_methods.enumerated() {
      wr.out(str : ("/* static " + pvar_1.name) + " */ ", newLine : true)
    }
    for ( _ , fnVar ) in cl!.defined_variants.enumerated() {
      let mVs : RangerAppMethodVariants? = cl!.method_variants[fnVar]
      for ( _ , variant ) in mVs!.variants.enumerated() {
        wr.out(str : ("function " + variant.name) + "() {", newLine : true)
        wr.indent(delta : 1)
        wr.newline()
        let subCtx : RangerAppWriterContext = ctx.fork()
        self.WalkNode(node : variant.fnBody!, ctx : subCtx, wr : wr)
        wr.newline()
        wr.indent(delta : -1)
        wr.out(str : "}", newLine : true)
      }
    }
    wr.indent(delta : -1)
    wr.out(str : "}", newLine : true)
  }
}
func ==(l: RangerJava7ClassWriter, r: RangerJava7ClassWriter) -> Bool {
  return l === r
}
class RangerJava7ClassWriter : RangerGenericClassWriter { 
  // WAS DECLARED : compiler
  var signatures : [String:Int] = [String:Int]()
  var signature_cnt : Int = 0
  var iface_created : [String:Bool] = [String:Bool]()
  func getSignatureInterface(s : String) -> String {
    let idx : Int? = signatures[s]
    if ( idx != nil  ) {
      return "LambdaSignature" + String((idx!));
    }
    signature_cnt = signature_cnt + 1;
    signatures[s] = signature_cnt
    return "LambdaSignature" + String(signature_cnt);
  }
  override func adjustType(tn : String) -> String {
    if ( tn == "this" ) {
      return "this";
    }
    return tn;
  }
  override func getObjectTypeString(type_string : String, ctx : RangerAppWriterContext) -> String {
    switch (type_string) {
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
      default :
        break
    }
    return type_string;
  }
  override func getTypeString(type_string : String) -> String {
    switch (type_string) {
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
      default :
        break
    }
    return type_string;
  }
  override func writeTypeDef(node : CodeNode, ctx : RangerAppWriterContext, wr : CodeWriter) -> Void {
    var v_type : Int = node.value_type
    var t_name : String = node.type_name
    var a_name : String = node.array_type
    var k_name : String = node.key_type
    if ( ((v_type == 8) || (v_type == 9)) || (v_type == 0) ) {
      v_type = node.typeNameAsType(ctx : ctx);
    }
    if ( node.eval_type != 0 ) {
      v_type = node.eval_type;
      if ( (node.eval_type_name.characters.count) > 0 ) {
        t_name = node.eval_type_name;
      }
      if ( (node.eval_array_type.characters.count) > 0 ) {
        a_name = node.eval_array_type;
      }
      if ( (node.eval_key_type.characters.count) > 0 ) {
        k_name = node.eval_key_type;
      }
    }
    if ( node.hasFlag(flagName : "optional") ) {
      wr.addImport(name : "java.util.Optional")
      wr.out(str : "Optional<", newLine : false)
      switch (v_type) {
        case 15 : 
          let sig : String = self.buildLambdaSignature(node : (node.expression_value!))
          let iface_name : String = self.getSignatureInterface(s : sig)
          wr.out(str : iface_name, newLine : false)
          if ( (iface_created[iface_name] != nil) == false ) {
            let fnNode : CodeNode = node.expression_value!.children[0]
            let args : CodeNode = node.expression_value!.children[1]
            iface_created[iface_name] = true
            let utilWr : CodeWriter = wr.getFileWriter(path : ".", fileName : (iface_name + ".java"))
            utilWr.out(str : ("public interface " + iface_name) + " { ", newLine : true)
            utilWr.indent(delta : 1)
            utilWr.out(str : "public ", newLine : false)
            self.writeTypeDef(node : fnNode, ctx : ctx, wr : utilWr)
            utilWr.out(str : " run(", newLine : false)
            for ( i , arg ) in args.children.enumerated() {
              if ( i > 0 ) {
                utilWr.out(str : ", ", newLine : false)
              }
              self.writeTypeDef(node : arg, ctx : ctx, wr : utilWr)
              utilWr.out(str : " ", newLine : false)
              utilWr.out(str : arg.vref, newLine : false)
            }
            utilWr.out(str : ");", newLine : true)
            utilWr.indent(delta : -1)
            utilWr.out(str : "}", newLine : true)
          }
        case 11 : 
          wr.out(str : "Integer", newLine : false)
        case 3 : 
          wr.out(str : "Integer", newLine : false)
        case 2 : 
          wr.out(str : "Double", newLine : false)
        case 4 : 
          wr.out(str : "String", newLine : false)
        case 5 : 
          wr.out(str : "Boolean", newLine : false)
        case 12 : 
          wr.out(str : "byte", newLine : false)
        case 13 : 
          wr.out(str : "byte[]", newLine : false)
        case 7 : 
          wr.out(str : ((("HashMap<" + self.getObjectTypeString(type_string : k_name, ctx : ctx)) + ",") + self.getObjectTypeString(type_string : a_name, ctx : ctx)) + ">", newLine : false)
          wr.addImport(name : "java.util.*")
        case 6 : 
          wr.out(str : ("ArrayList<" + self.getObjectTypeString(type_string : a_name, ctx : ctx)) + ">", newLine : false)
          wr.addImport(name : "java.util.*")
        default: 
          if ( t_name == "void" ) {
            wr.out(str : "void", newLine : false)
          } else {
            wr.out(str : self.getObjectTypeString(type_string : t_name, ctx : ctx), newLine : false)
          }
          break;
      }
    } else {
      switch (v_type) {
        case 15 : 
          let sig_1 : String = self.buildLambdaSignature(node : (node.expression_value!))
          let iface_name_1 : String = self.getSignatureInterface(s : sig_1)
          wr.out(str : iface_name_1, newLine : false)
          if ( (iface_created[iface_name_1] != nil) == false ) {
            let fnNode_1 : CodeNode = node.expression_value!.children[0]
            let args_1 : CodeNode = node.expression_value!.children[1]
            iface_created[iface_name_1] = true
            let utilWr_1 : CodeWriter = wr.getFileWriter(path : ".", fileName : (iface_name_1 + ".java"))
            utilWr_1.out(str : ("public interface " + iface_name_1) + " { ", newLine : true)
            utilWr_1.indent(delta : 1)
            utilWr_1.out(str : "public ", newLine : false)
            self.writeTypeDef(node : fnNode_1, ctx : ctx, wr : utilWr_1)
            utilWr_1.out(str : " run(", newLine : false)
            for ( i_1 , arg_1 ) in args_1.children.enumerated() {
              if ( i_1 > 0 ) {
                utilWr_1.out(str : ", ", newLine : false)
              }
              self.writeTypeDef(node : arg_1, ctx : ctx, wr : utilWr_1)
              utilWr_1.out(str : " ", newLine : false)
              utilWr_1.out(str : arg_1.vref, newLine : false)
            }
            utilWr_1.out(str : ");", newLine : true)
            utilWr_1.indent(delta : -1)
            utilWr_1.out(str : "}", newLine : true)
          }
        case 11 : 
          wr.out(str : "int", newLine : false)
        case 3 : 
          wr.out(str : "int", newLine : false)
        case 2 : 
          wr.out(str : "double", newLine : false)
        case 12 : 
          wr.out(str : "byte", newLine : false)
        case 13 : 
          wr.out(str : "byte[]", newLine : false)
        case 4 : 
          wr.out(str : "String", newLine : false)
        case 5 : 
          wr.out(str : "boolean", newLine : false)
        case 7 : 
          wr.out(str : ((("HashMap<" + self.getObjectTypeString(type_string : k_name, ctx : ctx)) + ",") + self.getObjectTypeString(type_string : a_name, ctx : ctx)) + ">", newLine : false)
          wr.addImport(name : "java.util.*")
        case 6 : 
          wr.out(str : ("ArrayList<" + self.getObjectTypeString(type_string : a_name, ctx : ctx)) + ">", newLine : false)
          wr.addImport(name : "java.util.*")
        default: 
          if ( t_name == "void" ) {
            wr.out(str : "void", newLine : false)
          } else {
            wr.out(str : self.getTypeString(type_string : t_name), newLine : false)
          }
          break;
      }
    }
    if ( node.hasFlag(flagName : "optional") ) {
      wr.out(str : ">", newLine : false)
    }
  }
  override func WriteVRef(node : CodeNode, ctx : RangerAppWriterContext, wr : CodeWriter) -> Void {
    if ( node.vref == "this" ) {
      wr.out(str : "this", newLine : false)
      return;
    }
    if ( node.eval_type == 11 ) {
      if ( (node.ns.count) > 1 ) {
        let rootObjName : String = node.ns[0]
        let enumName : String = node.ns[1]
        let e : RangerAppEnum? = ctx.getEnum(n : rootObjName)
        if ( e != nil  ) {
          wr.out(str : "" + String(((e!.values[enumName])!)), newLine : false)
          return;
        }
      }
    }
    let max_len : Int = node.ns.count
    if ( (node.nsp.count) > 0 ) {
      for ( i , p ) in node.nsp.enumerated() {
        if ( i == 0 ) {
          let part : String = node.ns[0]
          if ( part == "this" ) {
            wr.out(str : "this", newLine : false)
            continue;
          }
        }
        if ( i > 0 ) {
          wr.out(str : ".", newLine : false)
        }
        if ( (p.compiledName.characters.count) > 0 ) {
          wr.out(str : self.adjustType(tn : p.compiledName), newLine : false)
        } else {
          if ( (p.name.characters.count) > 0 ) {
            wr.out(str : self.adjustType(tn : p.name), newLine : false)
          } else {
            wr.out(str : self.adjustType(tn : (node.ns[i])), newLine : false)
          }
        }
        if ( i < (max_len - 1) ) {
          if ( p.nameNode!.hasFlag(flagName : "optional") ) {
            wr.out(str : ".get()", newLine : false)
          }
        }
      }
      return;
    }
    if ( node.hasParamDesc ) {
      let p_1 : RangerAppParamDesc? = node.paramDesc
      wr.out(str : p_1!.compiledName, newLine : false)
      return;
    }
    for ( i_1 , part_1 ) in node.ns.enumerated() {
      if ( i_1 > 0 ) {
        wr.out(str : ".", newLine : false)
      }
      wr.out(str : self.adjustType(tn : part_1), newLine : false)
    }
  }
  override func disabledVarDef(node : CodeNode, ctx : RangerAppWriterContext, wr : CodeWriter) -> Void {
    if ( node.hasParamDesc ) {
      let nn : CodeNode = node.children[1]
      let p : RangerAppParamDesc? = nn.paramDesc
      if ( (p!.ref_cnt == 0) && (p!.is_class_variable == false) ) {
        wr.out(str : "/** unused:  ", newLine : false)
      }
      wr.out(str : p!.compiledName, newLine : false)
      if ( (node.children.count) > 2 ) {
        wr.out(str : " = ", newLine : false)
        ctx.setInExpr()
        let value : CodeNode = node.getThird()
        self.WalkNode(node : value, ctx : ctx, wr : wr)
        ctx.unsetInExpr()
      } else {
        var b_was_set : Bool = false
        if ( nn.value_type == 6 ) {
          wr.out(str : " = new ", newLine : false)
          self.writeTypeDef(node : p!.nameNode!, ctx : ctx, wr : wr)
          wr.out(str : "()", newLine : false)
          b_was_set = true;
        }
        if ( nn.value_type == 7 ) {
          wr.out(str : " = new ", newLine : false)
          self.writeTypeDef(node : p!.nameNode!, ctx : ctx, wr : wr)
          wr.out(str : "()", newLine : false)
          b_was_set = true;
        }
        if ( (b_was_set == false) && nn.hasFlag(flagName : "optional") ) {
          wr.out(str : " = Optional.empty()", newLine : false)
        }
      }
      if ( (p!.ref_cnt == 0) && (p!.is_class_variable == true) ) {
        wr.out(str : "     /** note: unused */", newLine : false)
      }
      if ( (p!.ref_cnt == 0) && (p!.is_class_variable == false) ) {
        wr.out(str : "   **/ ;", newLine : true)
      } else {
        wr.out(str : ";", newLine : false)
        wr.newline()
      }
    }
  }
  override func writeVarDef(node : CodeNode, ctx : RangerAppWriterContext, wr : CodeWriter) -> Void {
    if ( node.hasParamDesc ) {
      let nn : CodeNode = node.children[1]
      let p : RangerAppParamDesc? = nn.paramDesc
      if ( (p!.ref_cnt == 0) && (p!.is_class_variable == false) ) {
        wr.out(str : "/** unused:  ", newLine : false)
      }
      if ( (p!.set_cnt > 0) || p!.is_class_variable ) {
        wr.out(str : "", newLine : false)
      } else {
        wr.out(str : "final ", newLine : false)
      }
      self.writeTypeDef(node : p!.nameNode!, ctx : ctx, wr : wr)
      wr.out(str : " ", newLine : false)
      wr.out(str : p!.compiledName, newLine : false)
      if ( (node.children.count) > 2 ) {
        wr.out(str : " = ", newLine : false)
        ctx.setInExpr()
        let value : CodeNode = node.getThird()
        self.WalkNode(node : value, ctx : ctx, wr : wr)
        ctx.unsetInExpr()
      } else {
        var b_was_set : Bool = false
        if ( nn.value_type == 6 ) {
          wr.out(str : " = new ", newLine : false)
          self.writeTypeDef(node : p!.nameNode!, ctx : ctx, wr : wr)
          wr.out(str : "()", newLine : false)
          b_was_set = true;
        }
        if ( nn.value_type == 7 ) {
          wr.out(str : " = new ", newLine : false)
          self.writeTypeDef(node : p!.nameNode!, ctx : ctx, wr : wr)
          wr.out(str : "()", newLine : false)
          b_was_set = true;
        }
        if ( (b_was_set == false) && nn.hasFlag(flagName : "optional") ) {
          wr.out(str : " = Optional.empty()", newLine : false)
        }
      }
      if ( (p!.ref_cnt == 0) && (p!.is_class_variable == true) ) {
        wr.out(str : "     /** note: unused */", newLine : false)
      }
      if ( (p!.ref_cnt == 0) && (p!.is_class_variable == false) ) {
        wr.out(str : "   **/ ;", newLine : true)
      } else {
        wr.out(str : ";", newLine : false)
        wr.newline()
      }
    }
  }
  func writeArgsDef(fnDesc : RangerAppFunctionDesc, ctx : RangerAppWriterContext, wr : CodeWriter) -> Void {
    for ( i , arg ) in fnDesc.params.enumerated() {
      if ( i > 0 ) {
        wr.out(str : ",", newLine : false)
      }
      wr.out(str : " ", newLine : false)
      self.writeTypeDef(node : arg.nameNode!, ctx : ctx, wr : wr)
      wr.out(str : (" " + arg.name) + " ", newLine : false)
    }
  }
  override func CustomOperator(node : CodeNode, ctx : RangerAppWriterContext, wr : CodeWriter) -> Void {
    let fc : CodeNode = node.getFirst()
    let cmd : String = fc.vref
    if ( cmd == "return" ) {
      wr.newline()
      if ( (node.children.count) > 1 ) {
        let value : CodeNode = node.getSecond()
        if ( value.hasParamDesc ) {
          let nn : CodeNode = value.paramDesc!.nameNode!
          if ( ctx.isDefinedClass(name : nn.type_name) ) {
            /** unused:  let cl : RangerAppClassDesc = ctx.findClass(name : nn.type_name)   **/ 
            let activeFn : RangerAppFunctionDesc = ctx.getCurrentMethod()
            let fnNameNode : CodeNode = activeFn.nameNode!
            if ( fnNameNode.hasFlag(flagName : "optional") ) {
              wr.out(str : "return Optional.ofNullable((", newLine : false)
              self.WalkNode(node : value, ctx : ctx, wr : wr)
              wr.out(str : ".isPresent() ? (", newLine : false)
              wr.out(str : fnNameNode.type_name, newLine : false)
              wr.out(str : ")", newLine : false)
              self.WalkNode(node : value, ctx : ctx, wr : wr)
              wr.out(str : ".get() : null ) );", newLine : true)
              return;
            }
          }
        }
        wr.out(str : "return ", newLine : false)
        ctx.setInExpr()
        self.WalkNode(node : value, ctx : ctx, wr : wr)
        ctx.unsetInExpr()
        wr.out(str : ";", newLine : true)
      } else {
        wr.out(str : "return;", newLine : true)
      }
    }
  }
  func buildLambdaSignature(node : CodeNode) -> String {
    let exp : CodeNode = node
    var exp_s : String = ""
    let fc : CodeNode = exp.getFirst()
    let args : CodeNode = exp.getSecond()
    exp_s = exp_s + fc.buildTypeSignature();
    exp_s = exp_s + "(";
    for ( _ , arg ) in args.children.enumerated() {
      exp_s = exp_s + arg.buildTypeSignature();
      exp_s = exp_s + ",";
    }
    exp_s = exp_s + ")";
    return exp_s;
  }
  override func CreateLambdaCall(node : CodeNode, ctx : RangerAppWriterContext, wr : CodeWriter) -> Void {
    let fName : CodeNode = node.children[0]
    let givenArgs : CodeNode = node.children[1]
    self.WriteVRef(node : fName, ctx : ctx, wr : wr)
    let param : RangerAppParamDesc = ctx.getVariableDef(name : fName.vref)
    let args : CodeNode = param.nameNode!.expression_value!.children[1]
    wr.out(str : ".run(", newLine : false)
    for ( i , arg ) in args.children.enumerated() {
      let n : CodeNode = givenArgs.children[i]
      if ( i > 0 ) {
        wr.out(str : ", ", newLine : false)
      }
      if ( arg.value_type != 0 ) {
        self.WalkNode(node : n, ctx : ctx, wr : wr)
      }
    }
    if ( ctx.expressionLevel() == 0 ) {
      wr.out(str : ");", newLine : true)
    } else {
      wr.out(str : ")", newLine : false)
    }
  }
  override func CreateLambda(node : CodeNode, ctx : RangerAppWriterContext, wr : CodeWriter) -> Void {
    let lambdaCtx : RangerAppWriterContext = node.lambda_ctx!
    let fnNode : CodeNode = node.children[0]
    let args : CodeNode = node.children[1]
    let body : CodeNode = node.children[2]
    let sig : String = self.buildLambdaSignature(node : node)
    let iface_name : String = self.getSignatureInterface(s : sig)
    if ( (iface_created[iface_name] != nil) == false ) {
      iface_created[iface_name] = true
      let utilWr : CodeWriter = wr.getFileWriter(path : ".", fileName : (iface_name + ".java"))
      utilWr.out(str : ("public interface " + iface_name) + " { ", newLine : true)
      utilWr.indent(delta : 1)
      utilWr.out(str : "public ", newLine : false)
      self.writeTypeDef(node : fnNode, ctx : ctx, wr : utilWr)
      utilWr.out(str : " run(", newLine : false)
      for ( i , arg ) in args.children.enumerated() {
        if ( i > 0 ) {
          utilWr.out(str : ", ", newLine : false)
        }
        self.writeTypeDef(node : arg, ctx : lambdaCtx, wr : utilWr)
        utilWr.out(str : " ", newLine : false)
        utilWr.out(str : arg.vref, newLine : false)
      }
      utilWr.out(str : ");", newLine : true)
      utilWr.indent(delta : -1)
      utilWr.out(str : "}", newLine : true)
    }
    wr.out(str : ("new " + iface_name) + "() { ", newLine : true)
    wr.indent(delta : 1)
    wr.out(str : "public ", newLine : false)
    self.writeTypeDef(node : fnNode, ctx : ctx, wr : wr)
    wr.out(str : " run(", newLine : false)
    for ( i_1 , arg_1 ) in args.children.enumerated() {
      if ( i_1 > 0 ) {
        wr.out(str : ", ", newLine : false)
      }
      self.writeTypeDef(node : arg_1, ctx : lambdaCtx, wr : wr)
      wr.out(str : " ", newLine : false)
      wr.out(str : arg_1.vref, newLine : false)
    }
    wr.out(str : ") {", newLine : true)
    wr.indent(delta : 1)
    lambdaCtx.restartExpressionLevel()
    for ( _ , item ) in body.children.enumerated() {
      self.WalkNode(node : item, ctx : lambdaCtx, wr : wr)
    }
    wr.newline()
    for ( _ , cname ) in lambdaCtx.captured_variables.enumerated() {
      wr.out(str : "// captured var " + cname, newLine : true)
    }
    wr.indent(delta : -1)
    wr.out(str : "}", newLine : true)
    wr.indent(delta : -1)
    wr.out(str : "}", newLine : false)
  }
  override func writeClass(node : CodeNode, ctx : RangerAppWriterContext, wr orig_wr : CodeWriter) -> Void {
    let cl : RangerAppClassDesc? = node.clDesc
    if ( cl == nil ) {
      return;
    }
    var declaredVariable : [String:Bool] = [String:Bool]()
    if ( (cl!.extends_classes.count) > 0 ) {
      for ( _ , pName ) in cl!.extends_classes.enumerated() {
        let pC : RangerAppClassDesc = ctx.findClass(name : pName)
        for ( _ , pvar ) in pC.variables.enumerated() {
          declaredVariable[pvar.name] = true
        }
      }
    }
    let wr : CodeWriter = orig_wr.getFileWriter(path : ".", fileName : (cl!.name + ".java"))
    let importFork : CodeWriter = wr.fork()
    for ( _ , dd ) in cl!.capturedLocals.enumerated() {
      if ( dd.is_class_variable == false ) {
        wr.out(str : "// local captured " + dd.name, newLine : true)
        print("java captured")
        print(dd.node!.getLineAsString())
        dd.node!.disabled_node = true;
        cl!.addVariable(desc : dd)
        let csubCtx : RangerAppWriterContext? = cl!.ctx
        csubCtx!.defineVariable(name : dd.name, desc : dd)
        dd.is_class_variable = true;
      }
    }
    wr.out(str : "", newLine : true)
    wr.out(str : "class " + cl!.name, newLine : false)
    if ( (cl!.extends_classes.count) > 0 ) {
      wr.out(str : " extends ", newLine : false)
      for ( _ , pName_1 ) in cl!.extends_classes.enumerated() {
        wr.out(str : pName_1, newLine : false)
      }
    }
    wr.out(str : " { ", newLine : true)
    wr.indent(delta : 1)
    _ = wr.createTag(name : "utilities")
    for ( _ , pvar_1 ) in cl!.variables.enumerated() {
      if ( declaredVariable[pvar_1.name] != nil ) {
        continue;
      }
      wr.out(str : "public ", newLine : false)
      self.writeVarDef(node : pvar_1.node!, ctx : ctx, wr : wr)
    }
    if ( cl!.has_constructor ) {
      let constr : RangerAppFunctionDesc? = cl!.constructor_fn
      wr.out(str : "", newLine : true)
      wr.out(str : cl!.name + "(", newLine : false)
      self.writeArgsDef(fnDesc : constr!, ctx : ctx, wr : wr)
      wr.out(str : " ) {", newLine : true)
      wr.indent(delta : 1)
      wr.newline()
      let subCtx : RangerAppWriterContext = constr!.fnCtx!
      subCtx.is_function = true;
      self.WalkNode(node : constr!.fnBody!, ctx : subCtx, wr : wr)
      wr.newline()
      wr.indent(delta : -1)
      wr.out(str : "}", newLine : true)
    }
    for ( _ , variant ) in cl!.static_methods.enumerated() {
      wr.out(str : "", newLine : true)
      if ( variant.nameNode!.hasFlag(flagName : "main") && (variant.nameNode!.code!.filename != ctx.getRootFile()) ) {
        continue;
      }
      if ( variant.nameNode!.hasFlag(flagName : "main") ) {
        wr.out(str : "public static void main(String [] args ) {", newLine : true)
      } else {
        wr.out(str : "public static ", newLine : false)
        self.writeTypeDef(node : variant.nameNode!, ctx : ctx, wr : wr)
        wr.out(str : " ", newLine : false)
        wr.out(str : variant.compiledName + "(", newLine : false)
        self.writeArgsDef(fnDesc : variant, ctx : ctx, wr : wr)
        wr.out(str : ") {", newLine : true)
      }
      wr.indent(delta : 1)
      wr.newline()
      let subCtx_1 : RangerAppWriterContext = variant.fnCtx!
      subCtx_1.is_function = true;
      self.WalkNode(node : variant.fnBody!, ctx : subCtx_1, wr : wr)
      wr.newline()
      wr.indent(delta : -1)
      wr.out(str : "}", newLine : true)
    }
    for ( _ , fnVar ) in cl!.defined_variants.enumerated() {
      let mVs : RangerAppMethodVariants? = cl!.method_variants[fnVar]
      for ( _ , variant_1 ) in mVs!.variants.enumerated() {
        wr.out(str : "", newLine : true)
        wr.out(str : "public ", newLine : false)
        self.writeTypeDef(node : variant_1.nameNode!, ctx : ctx, wr : wr)
        wr.out(str : " ", newLine : false)
        wr.out(str : variant_1.compiledName + "(", newLine : false)
        self.writeArgsDef(fnDesc : variant_1, ctx : ctx, wr : wr)
        wr.out(str : ") {", newLine : true)
        wr.indent(delta : 1)
        wr.newline()
        let subCtx_2 : RangerAppWriterContext = variant_1.fnCtx!
        subCtx_2.is_function = true;
        self.WalkNode(node : variant_1.fnBody!, ctx : subCtx_2, wr : wr)
        wr.newline()
        wr.indent(delta : -1)
        wr.out(str : "}", newLine : true)
      }
    }
    wr.indent(delta : -1)
    wr.out(str : "}", newLine : true)
    let import_list : [String] = wr.getImports()
    for ( _ , codeStr ) in import_list.enumerated() {
      importFork.out(str : ("import " + codeStr) + ";", newLine : true)
    }
  }
}
func ==(l: RangerSwift3ClassWriter, r: RangerSwift3ClassWriter) -> Bool {
  return l === r
}
class RangerSwift3ClassWriter : RangerGenericClassWriter { 
  // WAS DECLARED : compiler
  var header_created : Bool = false
  override func adjustType(tn : String) -> String {
    if ( tn == "this" ) {
      return "self";
    }
    return tn;
  }
  override func getObjectTypeString(type_string : String, ctx : RangerAppWriterContext) -> String {
    switch (type_string) {
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
      default :
        break
    }
    return type_string;
  }
  override func getTypeString(type_string : String) -> String {
    switch (type_string) {
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
      default :
        break
    }
    return type_string;
  }
  override func writeTypeDef(node : CodeNode, ctx : RangerAppWriterContext, wr : CodeWriter) -> Void {
    var v_type : Int = node.value_type
    var t_name : String = node.type_name
    var a_name : String = node.array_type
    var k_name : String = node.key_type
    if ( ((v_type == 8) || (v_type == 9)) || (v_type == 0) ) {
      v_type = node.typeNameAsType(ctx : ctx);
    }
    if ( node.eval_type != 0 ) {
      v_type = node.eval_type;
      if ( (node.eval_type_name.characters.count) > 0 ) {
        t_name = node.eval_type_name;
      }
      if ( (node.eval_array_type.characters.count) > 0 ) {
        a_name = node.eval_array_type;
      }
      if ( (node.eval_key_type.characters.count) > 0 ) {
        k_name = node.eval_key_type;
      }
    }
    switch (v_type) {
      case 15 : 
        let rv : CodeNode = node.expression_value!.children[0]
        let sec : CodeNode = node.expression_value!.children[1]
        /** unused:  let fc : CodeNode = sec.getFirst()   **/ 
        wr.out(str : "(", newLine : false)
        for ( i , arg ) in sec.children.enumerated() {
          if ( i > 0 ) {
            wr.out(str : ", ", newLine : false)
          }
          wr.out(str : " _ : ", newLine : false)
          self.writeTypeDef(node : arg, ctx : ctx, wr : wr)
        }
        wr.out(str : ") -> ", newLine : false)
        self.writeTypeDef(node : rv, ctx : ctx, wr : wr)
      case 11 : 
        wr.out(str : "Int", newLine : false)
      case 3 : 
        wr.out(str : "Int", newLine : false)
      case 2 : 
        wr.out(str : "Double", newLine : false)
      case 4 : 
        wr.out(str : "String", newLine : false)
      case 12 : 
        wr.out(str : "UInt8", newLine : false)
      case 13 : 
        wr.out(str : "[UInt8]", newLine : false)
      case 5 : 
        wr.out(str : "Bool", newLine : false)
      case 7 : 
        wr.out(str : ((("[" + self.getObjectTypeString(type_string : k_name, ctx : ctx)) + ":") + self.getObjectTypeString(type_string : a_name, ctx : ctx)) + "]", newLine : false)
      case 6 : 
        wr.out(str : ("[" + self.getObjectTypeString(type_string : a_name, ctx : ctx)) + "]", newLine : false)
      default: 
        if ( t_name == "void" ) {
          wr.out(str : "Void", newLine : false)
          return;
        }
        wr.out(str : self.getTypeString(type_string : t_name), newLine : false)
        break;
    }
    if ( node.hasFlag(flagName : "optional") ) {
      wr.out(str : "?", newLine : false)
    }
  }
  override func WriteEnum(node : CodeNode, ctx : RangerAppWriterContext, wr : CodeWriter) -> Void {
    if ( node.eval_type == 11 ) {
      let rootObjName : String = node.ns[0]
      let e : RangerAppEnum? = ctx.getEnum(n : rootObjName)
      if ( e != nil  ) {
        let enumName : String = node.ns[1]
        wr.out(str : "" + String(((e!.values[enumName])!)), newLine : false)
      } else {
        if ( node.hasParamDesc ) {
          let pp : RangerAppParamDesc? = node.paramDesc
          let nn : CodeNode? = pp!.nameNode
          wr.out(str : nn!.vref, newLine : false)
        }
      }
    }
  }
  override func WriteVRef(node : CodeNode, ctx : RangerAppWriterContext, wr : CodeWriter) -> Void {
    if ( node.vref == "this" ) {
      wr.out(str : "self", newLine : false)
      return;
    }
    if ( node.eval_type == 11 ) {
      if ( (node.ns.count) > 1 ) {
        let rootObjName : String = node.ns[0]
        let enumName : String = node.ns[1]
        let e : RangerAppEnum? = ctx.getEnum(n : rootObjName)
        if ( e != nil  ) {
          wr.out(str : "" + String(((e!.values[enumName])!)), newLine : false)
          return;
        }
      }
    }
    let max_len : Int = node.ns.count
    if ( (node.nsp.count) > 0 ) {
      for ( i , p ) in node.nsp.enumerated() {
        if ( i == 0 ) {
          let part : String = node.ns[0]
          if ( part == "this" ) {
            wr.out(str : "self", newLine : false)
            continue;
          }
        }
        if ( i > 0 ) {
          wr.out(str : ".", newLine : false)
        }
        if ( (p.compiledName.characters.count) > 0 ) {
          wr.out(str : self.adjustType(tn : p.compiledName), newLine : false)
        } else {
          if ( (p.name.characters.count) > 0 ) {
            wr.out(str : self.adjustType(tn : p.name), newLine : false)
          } else {
            wr.out(str : self.adjustType(tn : (node.ns[i])), newLine : false)
          }
        }
        if ( i < (max_len - 1) ) {
          if ( p.nameNode!.hasFlag(flagName : "optional") ) {
            wr.out(str : "!", newLine : false)
          }
        }
      }
      return;
    }
    if ( node.hasParamDesc ) {
      let p_1 : RangerAppParamDesc? = node.paramDesc
      wr.out(str : p_1!.compiledName, newLine : false)
      return;
    }
    for ( i_1 , part_1 ) in node.ns.enumerated() {
      if ( i_1 > 0 ) {
        wr.out(str : ".", newLine : false)
      }
      wr.out(str : self.adjustType(tn : part_1), newLine : false)
    }
  }
  override func writeVarDef(node : CodeNode, ctx : RangerAppWriterContext, wr : CodeWriter) -> Void {
    if ( node.hasParamDesc ) {
      let nn : CodeNode = node.children[1]
      let p : RangerAppParamDesc? = nn.paramDesc
      if ( nn.hasFlag(flagName : "optional") ) {
        if ( ((p!.set_cnt == 1) && (p!.ref_cnt == 2)) && (p!.is_class_variable == false) ) {
          ctx.addError(targetnode : node, descr : "Optional variable is only set but never read.")
        }
      }
      if ( (p!.ref_cnt == 0) && (p!.is_class_variable == false) ) {
        wr.out(str : "/** unused:  ", newLine : false)
      }
      if ( (p!.set_cnt > 0) || p!.is_class_variable ) {
        wr.out(str : ("var " + p!.compiledName) + " : ", newLine : false)
      } else {
        wr.out(str : ("let " + p!.compiledName) + " : ", newLine : false)
      }
      self.writeTypeDef(node : p!.nameNode!, ctx : ctx, wr : wr)
      if ( (node.children.count) > 2 ) {
        wr.out(str : " = ", newLine : false)
        ctx.setInExpr()
        let value : CodeNode = node.getThird()
        self.WalkNode(node : value, ctx : ctx, wr : wr)
        ctx.unsetInExpr()
      } else {
        if ( nn.value_type == 6 ) {
          wr.out(str : " = ", newLine : false)
          self.writeTypeDef(node : p!.nameNode!, ctx : ctx, wr : wr)
          wr.out(str : "()", newLine : false)
        }
        if ( nn.value_type == 7 ) {
          wr.out(str : " = ", newLine : false)
          self.writeTypeDef(node : p!.nameNode!, ctx : ctx, wr : wr)
          wr.out(str : "()", newLine : false)
        }
      }
      if ( (p!.ref_cnt == 0) && (p!.is_class_variable == true) ) {
        wr.out(str : "     /** note: unused */", newLine : false)
      }
      if ( (p!.ref_cnt == 0) && (p!.is_class_variable == false) ) {
        wr.out(str : "   **/ ", newLine : true)
      } else {
        wr.newline()
      }
    }
  }
  func writeArgsDef(fnDesc : RangerAppFunctionDesc, ctx : RangerAppWriterContext, wr : CodeWriter) -> Void {
    for ( i , arg ) in fnDesc.params.enumerated() {
      if ( i > 0 ) {
        wr.out(str : ", ", newLine : false)
      }
      wr.out(str : arg.name + " : ", newLine : false)
      self.writeTypeDef(node : arg.nameNode!, ctx : ctx, wr : wr)
    }
  }
  func writeArgsDefWithLocals(fnDesc : RangerAppFunctionDesc, localFnDesc : RangerAppFunctionDesc, ctx : RangerAppWriterContext, wr : CodeWriter) -> Void {
    for ( i , arg ) in fnDesc.params.enumerated() {
      if ( i > 0 ) {
        wr.out(str : ", ", newLine : false)
      }
      let local : RangerAppParamDesc = localFnDesc.params[i]
      if ( local.name != arg.name ) {
        wr.out(str : arg.name + " ", newLine : false)
      }
      wr.out(str : local.name + " : ", newLine : false)
      self.writeTypeDef(node : arg.nameNode!, ctx : ctx, wr : wr)
    }
  }
  override func writeFnCall(node : CodeNode, ctx : RangerAppWriterContext, wr : CodeWriter) -> Void {
    if ( node.hasFnCall ) {
      let fc : CodeNode = node.getFirst()
      let fnName : CodeNode? = node.fnDesc!.nameNode
      if ( ctx.expressionLevel() == 0 ) {
        if ( fnName!.type_name != "void" ) {
          wr.out(str : "_ = ", newLine : false)
        }
      }
      self.WriteVRef(node : fc, ctx : ctx, wr : wr)
      wr.out(str : "(", newLine : false)
      ctx.setInExpr()
      let givenArgs : CodeNode = node.getSecond()
      for ( i , arg ) in node.fnDesc!.params.enumerated() {
        if ( i > 0 ) {
          wr.out(str : ", ", newLine : false)
        }
        if ( (givenArgs.children.count) <= i ) {
          let defVal : CodeNode? = arg.nameNode!.getFlag(flagName : "default")
          if ( defVal != nil  ) {
            let fc_1 : CodeNode = defVal!.vref_annotation!.getFirst()
            self.WalkNode(node : fc_1, ctx : ctx, wr : wr)
          } else {
            ctx.addError(targetnode : node, descr : "Default argument was missing")
          }
          continue;
        }
        let n : CodeNode = givenArgs.children[i]
        wr.out(str : arg.name + " : ", newLine : false)
        self.WalkNode(node : n, ctx : ctx, wr : wr)
      }
      ctx.unsetInExpr()
      wr.out(str : ")", newLine : false)
      if ( ctx.expressionLevel() == 0 ) {
        wr.newline()
      }
    }
  }
  override func CreateLambdaCall(node : CodeNode, ctx : RangerAppWriterContext, wr : CodeWriter) -> Void {
    let fName : CodeNode = node.children[0]
    let givenArgs : CodeNode = node.children[1]
    self.WriteVRef(node : fName, ctx : ctx, wr : wr)
    let param : RangerAppParamDesc = ctx.getVariableDef(name : fName.vref)
    let args : CodeNode = param.nameNode!.expression_value!.children[1]
    wr.out(str : "(", newLine : false)
    for ( i , arg ) in args.children.enumerated() {
      let n : CodeNode = givenArgs.children[i]
      if ( i > 0 ) {
        wr.out(str : ", ", newLine : false)
      }
      if ( arg.value_type != 0 ) {
        self.WalkNode(node : n, ctx : ctx, wr : wr)
      }
    }
    wr.out(str : ")", newLine : false)
    if ( ctx.expressionLevel() == 0 ) {
      wr.out(str : "", newLine : true)
    }
  }
  override func CreateLambda(node : CodeNode, ctx : RangerAppWriterContext, wr : CodeWriter) -> Void {
    let lambdaCtx : RangerAppWriterContext = node.lambda_ctx!
    let fnNode : CodeNode = node.children[0]
    let args : CodeNode = node.children[1]
    let body : CodeNode = node.children[2]
    wr.out(str : "{ (", newLine : false)
    for ( i , arg ) in args.children.enumerated() {
      if ( i > 0 ) {
        wr.out(str : ", ", newLine : false)
      }
      wr.out(str : arg.vref, newLine : false)
    }
    wr.out(str : ") ->  ", newLine : false)
    self.writeTypeDef(node : fnNode, ctx : lambdaCtx, wr : wr)
    wr.out(str : " in ", newLine : true)
    wr.indent(delta : 1)
    lambdaCtx.restartExpressionLevel()
    for ( _ , item ) in body.children.enumerated() {
      self.WalkNode(node : item, ctx : lambdaCtx, wr : wr)
    }
    wr.newline()
    for ( _ , cname ) in lambdaCtx.captured_variables.enumerated() {
      wr.out(str : "// captured var " + cname, newLine : true)
    }
    wr.indent(delta : -1)
    wr.out(str : "}", newLine : false)
  }
  override func writeNewCall(node : CodeNode, ctx : RangerAppWriterContext, wr : CodeWriter) -> Void {
    if ( node.hasNewOper ) {
      let cl : RangerAppClassDesc? = node.clDesc
      /** unused:  let fc : CodeNode = node.getSecond()   **/ 
      wr.out(str : node.clDesc!.name, newLine : false)
      wr.out(str : "(", newLine : false)
      let constr : RangerAppFunctionDesc? = cl!.constructor_fn
      let givenArgs : CodeNode = node.getThird()
      if ( constr != nil  ) {
        for ( i , arg ) in constr!.params.enumerated() {
          let n : CodeNode = givenArgs.children[i]
          if ( i > 0 ) {
            wr.out(str : ", ", newLine : false)
          }
          wr.out(str : arg.name + " : ", newLine : false)
          self.WalkNode(node : n, ctx : ctx, wr : wr)
        }
      }
      wr.out(str : ")", newLine : false)
    }
  }
  func haveSameSig(fn1 : RangerAppFunctionDesc, fn2 : RangerAppFunctionDesc, ctx : RangerAppWriterContext) -> Bool {
    if ( fn1.name != fn2.name ) {
      return false;
    }
    let match : RangerArgMatch = RangerArgMatch()
    let n1 : CodeNode = fn1.nameNode!
    let n2 : CodeNode = fn1.nameNode!
    if ( match.doesDefsMatch(arg : n1, node : n2, ctx : ctx) == false ) {
      return false;
    }
    if ( (fn1.params.count) != (fn2.params.count) ) {
      return false;
    }
    for ( i , p ) in fn1.params.enumerated() {
      let p2 : RangerAppParamDesc = fn2.params[i]
      if ( match.doesDefsMatch(arg : (p.nameNode!), node : (p2.nameNode!), ctx : ctx) == false ) {
        return false;
      }
    }
    return true;
  }
  override func CustomOperator(node : CodeNode, ctx : RangerAppWriterContext, wr : CodeWriter) -> Void {
    let fc : CodeNode = node.getFirst()
    let cmd : String = fc.vref
    if ( cmd == "switch" ) {
      let condition : CodeNode = node.getSecond()
      let case_nodes : CodeNode = node.getThird()
      wr.newline()
      wr.out(str : "switch (", newLine : false)
      self.WalkNode(node : condition, ctx : ctx, wr : wr)
      wr.out(str : ") {", newLine : true)
      wr.indent(delta : 1)
      var found_default : Bool = false
      for ( _ , ch ) in case_nodes.children.enumerated() {
        let blockName : CodeNode = ch.getFirst()
        if ( blockName.vref == "default" ) {
          found_default = true;
          self.WalkNode(node : ch, ctx : ctx, wr : wr)
        } else {
          self.WalkNode(node : ch, ctx : ctx, wr : wr)
        }
      }
      if ( false == found_default ) {
        wr.newline()
        wr.out(str : "default :", newLine : true)
        wr.indent(delta : 1)
        wr.out(str : "break", newLine : true)
        wr.indent(delta : -1)
      }
      wr.indent(delta : -1)
      wr.out(str : "}", newLine : true)
    }
  }
  override func writeClass(node : CodeNode, ctx : RangerAppWriterContext, wr : CodeWriter) -> Void {
    let cl : RangerAppClassDesc? = node.clDesc
    if ( cl == nil ) {
      return;
    }
    var declaredVariable : [String:Bool] = [String:Bool]()
    var declaredFunction : [String:Bool] = [String:Bool]()
    var parentFunction : [String:RangerAppFunctionDesc] = [String:RangerAppFunctionDesc]()
    if ( (cl!.extends_classes.count) > 0 ) {
      for ( _ , pName ) in cl!.extends_classes.enumerated() {
        let pC : RangerAppClassDesc = ctx.findClass(name : pName)
        for ( _ , pvar ) in pC.variables.enumerated() {
          declaredVariable[pvar.name] = true
        }
        for ( _ , fnVar ) in pC.defined_variants.enumerated() {
          let mVs : RangerAppMethodVariants? = pC.method_variants[fnVar]
          for ( _ , variant ) in mVs!.variants.enumerated() {
            declaredFunction[variant.name] = true
            parentFunction[variant.name] = variant
          }
        }
      }
    }
    if ( header_created == false ) {
      _ = wr.createTag(name : "utilities")
      header_created = true;
    }
    wr.out(str : ((("func ==(l: " + cl!.name) + ", r: ") + cl!.name) + ") -> Bool {", newLine : true)
    wr.indent(delta : 1)
    wr.out(str : "return l === r", newLine : true)
    wr.indent(delta : -1)
    wr.out(str : "}", newLine : true)
    wr.out(str : "class " + cl!.name, newLine : false)
    var parentClass : RangerAppClassDesc?
    if ( (cl!.extends_classes.count) > 0 ) {
      wr.out(str : " : ", newLine : false)
      for ( _ , pName_1 ) in cl!.extends_classes.enumerated() {
        wr.out(str : pName_1, newLine : false)
        parentClass = ctx.findClass(name : pName_1);
      }
    } else {
      wr.out(str : " : Equatable ", newLine : false)
    }
    wr.out(str : " { ", newLine : true)
    wr.indent(delta : 1)
    for ( _ , pvar_1 ) in cl!.variables.enumerated() {
      if ( declaredVariable[pvar_1.name] != nil ) {
        wr.out(str : "// WAS DECLARED : " + pvar_1.name, newLine : true)
        continue;
      }
      self.writeVarDef(node : pvar_1.node!, ctx : ctx, wr : wr)
    }
    if ( cl!.has_constructor ) {
      let constr : RangerAppFunctionDesc? = cl!.constructor_fn
      var b_must_override : Bool = false
      if ( parentClass != nil ) {
        if ( (constr!.params.count) == 0 ) {
          b_must_override = true;
        } else {
          if ( parentClass!.has_constructor ) {
            let p_constr : RangerAppFunctionDesc = parentClass!.constructor_fn!
            if ( self.haveSameSig(fn1 : (constr!), fn2 : p_constr, ctx : ctx) ) {
              b_must_override = true;
            }
          }
        }
      }
      if ( b_must_override ) {
        wr.out(str : "override ", newLine : false)
      }
      wr.out(str : "init(", newLine : false)
      self.writeArgsDef(fnDesc : constr!, ctx : ctx, wr : wr)
      wr.out(str : " ) {", newLine : true)
      wr.indent(delta : 1)
      if ( parentClass != nil ) {
        wr.out(str : "super.init()", newLine : true)
      }
      wr.newline()
      let subCtx : RangerAppWriterContext = constr!.fnCtx!
      subCtx.is_function = true;
      self.WalkNode(node : constr!.fnBody!, ctx : subCtx, wr : wr)
      wr.newline()
      wr.indent(delta : -1)
      wr.out(str : "}", newLine : true)
    }
    for ( _ , variant_1 ) in cl!.static_methods.enumerated() {
      if ( variant_1.nameNode!.hasFlag(flagName : "main") ) {
        continue;
      }
      wr.out(str : ("static func " + variant_1.compiledName) + "(", newLine : false)
      self.writeArgsDef(fnDesc : variant_1, ctx : ctx, wr : wr)
      wr.out(str : ") -> ", newLine : false)
      self.writeTypeDef(node : variant_1.nameNode!, ctx : ctx, wr : wr)
      wr.out(str : " {", newLine : true)
      wr.indent(delta : 1)
      wr.newline()
      let subCtx_1 : RangerAppWriterContext = variant_1.fnCtx!
      subCtx_1.is_function = true;
      self.WalkNode(node : variant_1.fnBody!, ctx : subCtx_1, wr : wr)
      wr.newline()
      wr.indent(delta : -1)
      wr.out(str : "}", newLine : true)
    }
    for ( _ , fnVar_1 ) in cl!.defined_variants.enumerated() {
      let mVs_1 : RangerAppMethodVariants? = cl!.method_variants[fnVar_1]
      for ( _ , variant_2 ) in mVs_1!.variants.enumerated() {
        if ( declaredFunction[variant_2.name] != nil ) {
          wr.out(str : "override ", newLine : false)
        }
        wr.out(str : ("func " + variant_2.compiledName) + "(", newLine : false)
        if ( parentFunction[variant_2.name] != nil ) {
          self.writeArgsDefWithLocals(fnDesc : (parentFunction[variant_2.name])!, localFnDesc : variant_2, ctx : ctx, wr : wr)
        } else {
          self.writeArgsDef(fnDesc : variant_2, ctx : ctx, wr : wr)
        }
        wr.out(str : ") -> ", newLine : false)
        self.writeTypeDef(node : variant_2.nameNode!, ctx : ctx, wr : wr)
        wr.out(str : " {", newLine : true)
        wr.indent(delta : 1)
        wr.newline()
        let subCtx_2 : RangerAppWriterContext = variant_2.fnCtx!
        subCtx_2.is_function = true;
        self.WalkNode(node : variant_2.fnBody!, ctx : subCtx_2, wr : wr)
        wr.newline()
        wr.indent(delta : -1)
        wr.out(str : "}", newLine : true)
      }
    }
    wr.indent(delta : -1)
    wr.out(str : "}", newLine : true)
    for ( _ , variant_3 ) in cl!.static_methods.enumerated() {
      if ( variant_3.nameNode!.hasFlag(flagName : "main") && (variant_3.nameNode!.code!.filename == ctx.getRootFile()) ) {
        wr.newline()
        wr.out(str : "func __main__swift() {", newLine : true)
        wr.indent(delta : 1)
        let subCtx_3 : RangerAppWriterContext = variant_3.fnCtx!
        subCtx_3.is_function = true;
        self.WalkNode(node : variant_3.fnBody!, ctx : subCtx_3, wr : wr)
        wr.newline()
        wr.indent(delta : -1)
        wr.out(str : "}", newLine : true)
        wr.out(str : "// call the main function", newLine : true)
        wr.out(str : "__main__swift()", newLine : true)
      }
    }
  }
}
func ==(l: RangerCppClassWriter, r: RangerCppClassWriter) -> Bool {
  return l === r
}
class RangerCppClassWriter : RangerGenericClassWriter { 
  // WAS DECLARED : compiler
  var header_created : Bool = false
  override func adjustType(tn : String) -> String {
    if ( tn == "this" ) {
      return "this";
    }
    return tn;
  }
  override func WriteScalarValue(node : CodeNode, ctx : RangerAppWriterContext, wr : CodeWriter) -> Void {
    switch (node.value_type) {
      case 2 : 
        wr.out(str : "" + String(node.double_value), newLine : false)
      case 4 : 
        let s : String = self.EncodeString(node : node, ctx : ctx, wr : wr)
        wr.out(str : ("std::string(" + (("\"" + s) + "\"")) + ")", newLine : false)
      case 3 : 
        wr.out(str : "" + String(node.int_value), newLine : false)
      case 5 : 
        if ( node.boolean_value ) {
          wr.out(str : "true", newLine : false)
        } else {
          wr.out(str : "false", newLine : false)
        }
      default :
        break
    }
  }
  override func getObjectTypeString(type_string : String, ctx : RangerAppWriterContext) -> String {
    switch (type_string) {
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
      default :
        break
    }
    if ( ctx.isEnumDefined(n : type_string) ) {
      return "int";
    }
    if ( ctx.isDefinedClass(name : type_string) ) {
      return ("std::shared_ptr<" + type_string) + ">";
    }
    return type_string;
  }
  func getTypeString2(type_string : String, ctx : RangerAppWriterContext) -> String {
    switch (type_string) {
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
      default :
        break
    }
    if ( ctx.isEnumDefined(n : type_string) ) {
      return "int";
    }
    return type_string;
  }
  func writePtr(node : CodeNode, ctx : RangerAppWriterContext, wr : CodeWriter) -> Void {
    if ( node.type_name == "void" ) {
      return;
    }
  }
  override func writeTypeDef(node : CodeNode, ctx : RangerAppWriterContext, wr : CodeWriter) -> Void {
    var v_type : Int = node.value_type
    var t_name : String = node.type_name
    var a_name : String = node.array_type
    var k_name : String = node.key_type
    if ( ((v_type == 8) || (v_type == 9)) || (v_type == 0) ) {
      v_type = node.typeNameAsType(ctx : ctx);
    }
    if ( node.eval_type != 0 ) {
      v_type = node.eval_type;
      if ( (node.eval_type_name.characters.count) > 0 ) {
        t_name = node.eval_type_name;
      }
      if ( (node.eval_array_type.characters.count) > 0 ) {
        a_name = node.eval_array_type;
      }
      if ( (node.eval_key_type.characters.count) > 0 ) {
        k_name = node.eval_key_type;
      }
    }
    switch (v_type) {
      case 15 : 
        let rv : CodeNode = node.expression_value!.children[0]
        let sec : CodeNode = node.expression_value!.children[1]
        /** unused:  let fc : CodeNode = sec.getFirst()   **/ 
        wr.out(str : "std::function<", newLine : false)
        self.writeTypeDef(node : rv, ctx : ctx, wr : wr)
        wr.out(str : "(", newLine : false)
        for ( i , arg ) in sec.children.enumerated() {
          if ( i > 0 ) {
            wr.out(str : ", ", newLine : false)
          }
          self.writeTypeDef(node : arg, ctx : ctx, wr : wr)
        }
        wr.out(str : ")>", newLine : false)
      case 11 : 
        wr.out(str : "int", newLine : false)
      case 3 : 
        if ( node.hasFlag(flagName : "optional") ) {
          wr.out(str : " r_optional_primitive<int> ", newLine : false)
        } else {
          wr.out(str : "int", newLine : false)
        }
      case 12 : 
        wr.out(str : "char", newLine : false)
      case 13 : 
        wr.out(str : "const char*", newLine : false)
      case 2 : 
        if ( node.hasFlag(flagName : "optional") ) {
          wr.out(str : " r_optional_primitive<double> ", newLine : false)
        } else {
          wr.out(str : "double", newLine : false)
        }
      case 4 : 
        wr.addImport(name : "<string>")
        wr.out(str : "std::string", newLine : false)
      case 5 : 
        wr.out(str : "bool", newLine : false)
      case 7 : 
        wr.out(str : ((("std::map<" + self.getObjectTypeString(type_string : k_name, ctx : ctx)) + ",") + self.getObjectTypeString(type_string : a_name, ctx : ctx)) + ">", newLine : false)
        wr.addImport(name : "<map>")
      case 6 : 
        wr.out(str : ("std::vector<" + self.getObjectTypeString(type_string : a_name, ctx : ctx)) + ">", newLine : false)
        wr.addImport(name : "<vector>")
      default: 
        if ( node.type_name == "void" ) {
          wr.out(str : "void", newLine : false)
          return;
        }
        if ( ctx.isDefinedClass(name : t_name) ) {
          let cc : RangerAppClassDesc = ctx.findClass(name : t_name)
          wr.out(str : "std::shared_ptr<", newLine : false)
          wr.out(str : cc.name, newLine : false)
          wr.out(str : ">", newLine : false)
          return;
        }
        if ( node.hasFlag(flagName : "optional") ) {
          wr.out(str : "std::shared_ptr<std::vector<", newLine : false)
          wr.out(str : self.getTypeString2(type_string : t_name, ctx : ctx), newLine : false)
          wr.out(str : ">", newLine : false)
          return;
        }
        wr.out(str : self.getTypeString2(type_string : t_name, ctx : ctx), newLine : false)
        break;
    }
  }
  override func WriteVRef(node : CodeNode, ctx : RangerAppWriterContext, wr : CodeWriter) -> Void {
    if ( node.vref == "this" ) {
      wr.out(str : "shared_from_this()", newLine : false)
      return;
    }
    if ( node.eval_type == 11 ) {
      let rootObjName : String = node.ns[0]
      if ( (node.ns.count) > 1 ) {
        let enumName : String = node.ns[1]
        let e : RangerAppEnum? = ctx.getEnum(n : rootObjName)
        if ( e != nil  ) {
          wr.out(str : "" + String(((e!.values[enumName])!)), newLine : false)
          return;
        }
      }
    }
    var had_static : Bool = false
    if ( (node.nsp.count) > 0 ) {
      for ( i , p ) in node.nsp.enumerated() {
        if ( i > 0 ) {
          if ( had_static ) {
            wr.out(str : "::", newLine : false)
          } else {
            wr.out(str : "->", newLine : false)
          }
        }
        if ( i == 0 ) {
          let part : String = node.ns[0]
          if ( part == "this" ) {
            wr.out(str : "this", newLine : false)
            continue;
          }
        }
        if ( (p.compiledName.characters.count) > 0 ) {
          wr.out(str : self.adjustType(tn : p.compiledName), newLine : false)
        } else {
          if ( (p.name.characters.count) > 0 ) {
            wr.out(str : self.adjustType(tn : p.name), newLine : false)
          } else {
            wr.out(str : self.adjustType(tn : (node.ns[i])), newLine : false)
          }
        }
        if ( p.isClass() ) {
          had_static = true;
        }
      }
      return;
    }
    if ( node.hasParamDesc ) {
      let p_1 : RangerAppParamDesc? = node.paramDesc
      wr.out(str : p_1!.compiledName, newLine : false)
      return;
    }
    for ( i_1 , part_1 ) in node.ns.enumerated() {
      if ( i_1 > 0 ) {
        if ( had_static ) {
          wr.out(str : "::", newLine : false)
        } else {
          wr.out(str : "->", newLine : false)
        }
      }
      if ( ctx.hasClass(name : part_1) ) {
        had_static = true;
      } else {
        had_static = false;
      }
      wr.out(str : self.adjustType(tn : part_1), newLine : false)
    }
  }
  override func writeVarDef(node : CodeNode, ctx : RangerAppWriterContext, wr : CodeWriter) -> Void {
    if ( node.hasParamDesc ) {
      let nn : CodeNode = node.children[1]
      let p : RangerAppParamDesc? = nn.paramDesc
      if ( (p!.ref_cnt == 0) && (p!.is_class_variable == false) ) {
        wr.out(str : "/** unused:  ", newLine : false)
      }
      if ( (p!.set_cnt > 0) || p!.is_class_variable ) {
        wr.out(str : "", newLine : false)
      } else {
        wr.out(str : "", newLine : false)
      }
      self.writeTypeDef(node : p!.nameNode!, ctx : ctx, wr : wr)
      wr.out(str : " ", newLine : false)
      wr.out(str : p!.compiledName, newLine : false)
      if ( (node.children.count) > 2 ) {
        wr.out(str : " = ", newLine : false)
        ctx.setInExpr()
        let value : CodeNode = node.getThird()
        self.WalkNode(node : value, ctx : ctx, wr : wr)
        ctx.unsetInExpr()
      } else {
      }
      if ( (p!.ref_cnt == 0) && (p!.is_class_variable == true) ) {
        wr.out(str : "     /** note: unused */", newLine : false)
      }
      if ( (p!.ref_cnt == 0) && (p!.is_class_variable == false) ) {
        wr.out(str : "   **/ ;", newLine : true)
      } else {
        wr.out(str : ";", newLine : false)
        wr.newline()
      }
    }
  }
  override func disabledVarDef(node : CodeNode, ctx : RangerAppWriterContext, wr : CodeWriter) -> Void {
    if ( node.hasParamDesc ) {
      let nn : CodeNode = node.children[1]
      let p : RangerAppParamDesc? = nn.paramDesc
      if ( (p!.set_cnt > 0) || p!.is_class_variable ) {
        wr.out(str : "", newLine : false)
      } else {
        wr.out(str : "", newLine : false)
      }
      wr.out(str : p!.compiledName, newLine : false)
      if ( (node.children.count) > 2 ) {
        wr.out(str : " = ", newLine : false)
        ctx.setInExpr()
        let value : CodeNode = node.getThird()
        self.WalkNode(node : value, ctx : ctx, wr : wr)
        ctx.unsetInExpr()
      } else {
      }
      wr.out(str : ";", newLine : false)
      wr.newline()
    }
  }
  override func CustomOperator(node : CodeNode, ctx : RangerAppWriterContext, wr : CodeWriter) -> Void {
    let fc : CodeNode = node.getFirst()
    let cmd : String = fc.vref
    if ( cmd == "return" ) {
      if ( ctx.isInMain() ) {
        wr.out(str : "return 0;", newLine : true)
      } else {
        wr.out(str : "return;", newLine : true)
      }
      return;
    }
    if ( cmd == "switch" ) {
      let condition : CodeNode = node.getSecond()
      let case_nodes : CodeNode = node.getThird()
      wr.newline()
      let p : RangerAppParamDesc = RangerAppParamDesc()
      p.name = "caseMatched";
      p.value_type = 5;
      ctx.defineVariable(name : p.name, desc : p)
      wr.out(str : ("bool " + p.compiledName) + " = false;", newLine : true)
      for ( _ , ch ) in case_nodes.children.enumerated() {
        let blockName : CodeNode = ch.getFirst()
        if ( blockName.vref == "default" ) {
          let defBlock : CodeNode = ch.getSecond()
          wr.out(str : "if( ! ", newLine : false)
          wr.out(str : p.compiledName, newLine : false)
          wr.out(str : ") {", newLine : true)
          wr.indent(delta : 1)
          self.WalkNode(node : defBlock, ctx : ctx, wr : wr)
          wr.indent(delta : -1)
          wr.out(str : "}", newLine : true)
        } else {
          let caseValue : CodeNode = ch.getSecond()
          let caseBlock : CodeNode = ch.getThird()
          wr.out(str : "if( ", newLine : false)
          self.WalkNode(node : condition, ctx : ctx, wr : wr)
          wr.out(str : " == ", newLine : false)
          self.WalkNode(node : caseValue, ctx : ctx, wr : wr)
          wr.out(str : ") {", newLine : true)
          wr.indent(delta : 1)
          wr.out(str : p.compiledName + " = true;", newLine : true)
          self.WalkNode(node : caseBlock, ctx : ctx, wr : wr)
          wr.indent(delta : -1)
          wr.out(str : "}", newLine : true)
        }
      }
    }
  }
  override func CreateLambdaCall(node : CodeNode, ctx : RangerAppWriterContext, wr : CodeWriter) -> Void {
    let fName : CodeNode = node.children[0]
    let givenArgs : CodeNode = node.children[1]
    self.WriteVRef(node : fName, ctx : ctx, wr : wr)
    let param : RangerAppParamDesc = ctx.getVariableDef(name : fName.vref)
    let args : CodeNode = param.nameNode!.expression_value!.children[1]
    wr.out(str : "(", newLine : false)
    for ( i , arg ) in args.children.enumerated() {
      let n : CodeNode = givenArgs.children[i]
      if ( i > 0 ) {
        wr.out(str : ", ", newLine : false)
      }
      if ( arg.value_type != 0 ) {
        self.WalkNode(node : n, ctx : ctx, wr : wr)
      }
    }
    wr.out(str : ")", newLine : false)
    if ( ctx.expressionLevel() == 0 ) {
      wr.out(str : ";", newLine : true)
    }
  }
  override func CreateLambda(node : CodeNode, ctx : RangerAppWriterContext, wr : CodeWriter) -> Void {
    let lambdaCtx : RangerAppWriterContext = node.lambda_ctx!
    /** unused:  let fnNode : CodeNode = node.children[0]   **/ 
    let args : CodeNode = node.children[1]
    let body : CodeNode = node.children[2]
    wr.out(str : "[this", newLine : false)
    wr.out(str : "](", newLine : false)
    for ( i , arg ) in args.children.enumerated() {
      if ( i > 0 ) {
        wr.out(str : ", ", newLine : false)
      }
      self.writeTypeDef(node : arg, ctx : ctx, wr : wr)
      wr.out(str : " ", newLine : false)
      wr.out(str : arg.vref, newLine : false)
    }
    wr.out(str : ") mutable { ", newLine : true)
    wr.indent(delta : 1)
    lambdaCtx.restartExpressionLevel()
    for ( _ , item ) in body.children.enumerated() {
      self.WalkNode(node : item, ctx : lambdaCtx, wr : wr)
    }
    wr.newline()
    wr.indent(delta : -1)
    wr.out(str : "}", newLine : false)
  }
  func writeCppHeaderVar(node : CodeNode, ctx : RangerAppWriterContext, wr : CodeWriter, do_initialize : Bool) -> Void {
    if ( node.hasParamDesc ) {
      let nn : CodeNode = node.children[1]
      let p : RangerAppParamDesc? = nn.paramDesc
      if ( (p!.ref_cnt == 0) && (p!.is_class_variable == false) ) {
        wr.out(str : "/** unused:  ", newLine : false)
      }
      if ( (p!.set_cnt > 0) || p!.is_class_variable ) {
        wr.out(str : "", newLine : false)
      } else {
        wr.out(str : "", newLine : false)
      }
      self.writeTypeDef(node : p!.nameNode!, ctx : ctx, wr : wr)
      wr.out(str : " ", newLine : false)
      wr.out(str : p!.compiledName, newLine : false)
      if ( (p!.ref_cnt == 0) && (p!.is_class_variable == true) ) {
        wr.out(str : "     /** note: unused */", newLine : false)
      }
      if ( (p!.ref_cnt == 0) && (p!.is_class_variable == false) ) {
        wr.out(str : "   **/ ;", newLine : true)
      } else {
        wr.out(str : ";", newLine : false)
        wr.newline()
      }
    }
  }
  func writeArgsDef(fnDesc : RangerAppFunctionDesc, ctx : RangerAppWriterContext, wr : CodeWriter) -> Void {
    for ( i , arg ) in fnDesc.params.enumerated() {
      if ( i > 0 ) {
        wr.out(str : ",", newLine : false)
      }
      wr.out(str : " ", newLine : false)
      self.writeTypeDef(node : arg.nameNode!, ctx : ctx, wr : wr)
      wr.out(str : (" " + arg.name) + " ", newLine : false)
    }
  }
  override func writeFnCall(node : CodeNode, ctx : RangerAppWriterContext, wr : CodeWriter) -> Void {
    if ( node.hasFnCall ) {
      let fc : CodeNode = node.getFirst()
      self.WriteVRef(node : fc, ctx : ctx, wr : wr)
      wr.out(str : "(", newLine : false)
      ctx.setInExpr()
      let givenArgs : CodeNode = node.getSecond()
      for ( i , arg ) in node.fnDesc!.params.enumerated() {
        if ( i > 0 ) {
          wr.out(str : ", ", newLine : false)
        }
        if ( i >= (givenArgs.children.count) ) {
          let defVal : CodeNode? = arg.nameNode!.getFlag(flagName : "default")
          if ( defVal != nil  ) {
            let fc_1 : CodeNode = defVal!.vref_annotation!.getFirst()
            self.WalkNode(node : fc_1, ctx : ctx, wr : wr)
          } else {
            ctx.addError(targetnode : node, descr : "Default argument was missing")
          }
          continue;
        }
        let n : CodeNode = givenArgs.children[i]
        self.WalkNode(node : n, ctx : ctx, wr : wr)
      }
      ctx.unsetInExpr()
      wr.out(str : ")", newLine : false)
      if ( ctx.expressionLevel() == 0 ) {
        wr.out(str : ";", newLine : true)
      }
    }
  }
  override func writeNewCall(node : CodeNode, ctx : RangerAppWriterContext, wr : CodeWriter) -> Void {
    if ( node.hasNewOper ) {
      let cl : RangerAppClassDesc? = node.clDesc
      /** unused:  let fc : CodeNode = node.getSecond()   **/ 
      wr.out(str : " std::make_shared<", newLine : false)
      wr.out(str : node.clDesc!.name, newLine : false)
      wr.out(str : ">(", newLine : false)
      let constr : RangerAppFunctionDesc? = cl!.constructor_fn
      let givenArgs : CodeNode = node.getThird()
      if ( constr != nil  ) {
        for ( i , arg ) in constr!.params.enumerated() {
          let n : CodeNode = givenArgs.children[i]
          if ( i > 0 ) {
            wr.out(str : ", ", newLine : false)
          }
          if ( true || (arg.nameNode != nil ) ) {
            self.WalkNode(node : n, ctx : ctx, wr : wr)
          }
        }
      }
      wr.out(str : ")", newLine : false)
    }
  }
  func writeClassHeader(node : CodeNode, ctx : RangerAppWriterContext, wr : CodeWriter) -> Void {
    let cl : RangerAppClassDesc? = node.clDesc
    if ( cl == nil ) {
      return;
    }
    wr.out(str : "class " + cl!.name, newLine : false)
    if ( (cl!.extends_classes.count) > 0 ) {
      wr.out(str : " : ", newLine : false)
      for ( _ , pName ) in cl!.extends_classes.enumerated() {
        wr.out(str : "public ", newLine : false)
        wr.out(str : pName, newLine : false)
      }
    } else {
      wr.out(str : (" : public std::enable_shared_from_this<" + cl!.name) + "> ", newLine : false)
    }
    wr.out(str : " { ", newLine : true)
    wr.indent(delta : 1)
    wr.out(str : "public :", newLine : true)
    wr.indent(delta : 1)
    for ( _ , pvar ) in cl!.variables.enumerated() {
      self.writeCppHeaderVar(node : pvar.node!, ctx : ctx, wr : wr, do_initialize : false)
    }
    wr.out(str : "/* class constructor */ ", newLine : true)
    wr.out(str : cl!.name + "(", newLine : false)
    if ( cl!.has_constructor ) {
      let constr : RangerAppFunctionDesc? = cl!.constructor_fn
      self.writeArgsDef(fnDesc : constr!, ctx : ctx, wr : wr)
    }
    wr.out(str : " );", newLine : true)
    for ( i_2 , variant ) in cl!.static_methods.enumerated() {
      if ( i_2 == 0 ) {
        wr.out(str : "/* static methods */ ", newLine : true)
      }
      wr.out(str : "static ", newLine : false)
      self.writeTypeDef(node : variant.nameNode!, ctx : ctx, wr : wr)
      wr.out(str : (" " + variant.compiledName) + "(", newLine : false)
      self.writeArgsDef(fnDesc : variant, ctx : ctx, wr : wr)
      wr.out(str : ");", newLine : true)
    }
    for ( i_3 , fnVar ) in cl!.defined_variants.enumerated() {
      if ( i_3 == 0 ) {
        wr.out(str : "/* instance methods */ ", newLine : true)
      }
      let mVs : RangerAppMethodVariants? = cl!.method_variants[fnVar]
      for ( _ , variant_1 ) in mVs!.variants.enumerated() {
        if ( cl!.is_inherited ) {
          wr.out(str : "virtual ", newLine : false)
        }
        self.writeTypeDef(node : variant_1.nameNode!, ctx : ctx, wr : wr)
        wr.out(str : (" " + variant_1.compiledName) + "(", newLine : false)
        self.writeArgsDef(fnDesc : variant_1, ctx : ctx, wr : wr)
        wr.out(str : ");", newLine : true)
      }
    }
    wr.indent(delta : -1)
    wr.indent(delta : -1)
    wr.out(str : "};", newLine : true)
  }
  override func writeClass(node : CodeNode, ctx : RangerAppWriterContext, wr orig_wr : CodeWriter) -> Void {
    let cl : RangerAppClassDesc? = node.clDesc
    let wr : CodeWriter = orig_wr
    if ( cl == nil ) {
      return;
    }
    if ( header_created == false ) {
      _ = wr.createTag(name : "c++Imports")
      wr.out(str : "", newLine : true)
      wr.out(str : "// define classes here to avoid compiler errors", newLine : true)
      _ = wr.createTag(name : "c++ClassDefs")
      wr.out(str : "", newLine : true)
      _ = wr.createTag(name : "utilities")
      wr.out(str : "", newLine : true)
      wr.out(str : "// header definitions", newLine : true)
      _ = wr.createTag(name : "c++Header")
      wr.out(str : "", newLine : true)
      header_created = true;
    }
    let classWriter : CodeWriter = orig_wr.getTag(name : "c++ClassDefs")
    let headerWriter : CodeWriter = orig_wr.getTag(name : "c++Header")
    /** unused:  let projectName : String = "project"   **/ 
    for ( _ , dd ) in cl!.capturedLocals.enumerated() {
      if ( dd.is_class_variable == false ) {
        wr.out(str : "// local captured " + dd.name, newLine : true)
        dd.node!.disabled_node = true;
        cl!.addVariable(desc : dd)
        let csubCtx : RangerAppWriterContext? = cl!.ctx
        csubCtx!.defineVariable(name : dd.name, desc : dd)
        dd.is_class_variable = true;
      }
    }
    classWriter.out(str : ("class " + cl!.name) + ";", newLine : true)
    self.writeClassHeader(node : node, ctx : ctx, wr : headerWriter)
    wr.out(str : "", newLine : true)
    wr.out(str : ((cl!.name + "::") + cl!.name) + "(", newLine : false)
    if ( cl!.has_constructor ) {
      let constr : RangerAppFunctionDesc? = cl!.constructor_fn
      self.writeArgsDef(fnDesc : constr!, ctx : ctx, wr : wr)
    }
    wr.out(str : " ) ", newLine : false)
    if ( (cl!.extends_classes.count) > 0 ) {
      for ( _ , pName ) in cl!.extends_classes.enumerated() {
        let pcc : RangerAppClassDesc = ctx.findClass(name : pName)
        if ( pcc.has_constructor ) {
          wr.out(str : (" : " + pcc.name) + "(", newLine : false)
          let constr_1 : RangerAppFunctionDesc? = cl!.constructor_fn
          for ( i_2 , arg ) in constr_1!.params.enumerated() {
            if ( i_2 > 0 ) {
              wr.out(str : ",", newLine : false)
            }
            wr.out(str : " ", newLine : false)
            wr.out(str : (" " + arg.name) + " ", newLine : false)
          }
          wr.out(str : ")", newLine : false)
        }
      }
    }
    wr.out(str : "{", newLine : true)
    wr.indent(delta : 1)
    for ( _ , pvar ) in cl!.variables.enumerated() {
      let nn : CodeNode = pvar.node!
      if ( pvar.is_captured ) {
        continue;
      }
      if ( (nn.children.count) > 2 ) {
        let valueNode : CodeNode = nn.children[2]
        wr.out(str : ("this->" + pvar.compiledName) + " = ", newLine : false)
        self.WalkNode(node : valueNode, ctx : ctx, wr : wr)
        wr.out(str : ";", newLine : true)
      }
    }
    if ( cl!.has_constructor ) {
      let constr_2 : RangerAppFunctionDesc = cl!.constructor_fn!
      wr.newline()
      let subCtx : RangerAppWriterContext = constr_2.fnCtx!
      subCtx.is_function = true;
      self.WalkNode(node : constr_2.fnBody!, ctx : subCtx, wr : wr)
      wr.newline()
    }
    wr.indent(delta : -1)
    wr.out(str : "}", newLine : true)
    for ( _ , variant ) in cl!.static_methods.enumerated() {
      if ( variant.nameNode!.hasFlag(flagName : "main") ) {
        continue;
      }
      wr.out(str : "", newLine : true)
      self.writeTypeDef(node : variant.nameNode!, ctx : ctx, wr : wr)
      wr.out(str : " ", newLine : false)
      wr.out(str : (" " + cl!.name) + "::", newLine : false)
      wr.out(str : variant.compiledName + "(", newLine : false)
      self.writeArgsDef(fnDesc : variant, ctx : ctx, wr : wr)
      wr.out(str : ") {", newLine : true)
      wr.indent(delta : 1)
      wr.newline()
      let subCtx_1 : RangerAppWriterContext = variant.fnCtx!
      subCtx_1.is_function = true;
      self.WalkNode(node : variant.fnBody!, ctx : subCtx_1, wr : wr)
      wr.newline()
      wr.indent(delta : -1)
      wr.out(str : "}", newLine : true)
    }
    for ( _ , fnVar ) in cl!.defined_variants.enumerated() {
      let mVs : RangerAppMethodVariants? = cl!.method_variants[fnVar]
      for ( _ , variant_1 ) in mVs!.variants.enumerated() {
        wr.out(str : "", newLine : true)
        self.writeTypeDef(node : variant_1.nameNode!, ctx : ctx, wr : wr)
        wr.out(str : " ", newLine : false)
        wr.out(str : (" " + cl!.name) + "::", newLine : false)
        wr.out(str : variant_1.compiledName + "(", newLine : false)
        self.writeArgsDef(fnDesc : variant_1, ctx : ctx, wr : wr)
        wr.out(str : ") {", newLine : true)
        wr.indent(delta : 1)
        wr.newline()
        let subCtx_2 : RangerAppWriterContext = variant_1.fnCtx!
        subCtx_2.is_function = true;
        self.WalkNode(node : variant_1.fnBody!, ctx : subCtx_2, wr : wr)
        wr.newline()
        wr.indent(delta : -1)
        wr.out(str : "}", newLine : true)
      }
    }
    for ( _ , variant_2 ) in cl!.static_methods.enumerated() {
      if ( variant_2.nameNode!.hasFlag(flagName : "main") && (variant_2.nameNode!.code!.filename == ctx.getRootFile()) ) {
        wr.out(str : "", newLine : true)
        wr.out(str : "int main(int argc, char* argv[]) {", newLine : true)
        wr.indent(delta : 1)
        wr.newline()
        let subCtx_3 : RangerAppWriterContext = variant_2.fnCtx!
        subCtx_3.in_main = true;
        subCtx_3.is_function = true;
        self.WalkNode(node : variant_2.fnBody!, ctx : subCtx_3, wr : wr)
        wr.newline()
        wr.out(str : "return 0;", newLine : true)
        wr.indent(delta : -1)
        wr.out(str : "}", newLine : true)
      }
    }
  }
}
func ==(l: RangerKotlinClassWriter, r: RangerKotlinClassWriter) -> Bool {
  return l === r
}
class RangerKotlinClassWriter : RangerGenericClassWriter { 
  // WAS DECLARED : compiler
  override func WriteScalarValue(node : CodeNode, ctx : RangerAppWriterContext, wr : CodeWriter) -> Void {
    switch (node.value_type) {
      case 2 : 
        wr.out(str : node.getParsedString(), newLine : false)
      case 4 : 
        let s : String = self.EncodeString(node : node, ctx : ctx, wr : wr)
        wr.out(str : ("\"" + s) + "\"", newLine : false)
      case 3 : 
        wr.out(str : "" + String(node.int_value), newLine : false)
      case 5 : 
        if ( node.boolean_value ) {
          wr.out(str : "true", newLine : false)
        } else {
          wr.out(str : "false", newLine : false)
        }
      default :
        break
    }
  }
  override func adjustType(tn : String) -> String {
    if ( tn == "this" ) {
      return "this";
    }
    return tn;
  }
  override func getObjectTypeString(type_string : String, ctx : RangerAppWriterContext) -> String {
    switch (type_string) {
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
      default :
        break
    }
    return type_string;
  }
  override func getTypeString(type_string : String) -> String {
    switch (type_string) {
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
      default :
        break
    }
    return type_string;
  }
  override func writeTypeDef(node : CodeNode, ctx : RangerAppWriterContext, wr : CodeWriter) -> Void {
    var v_type : Int = node.value_type
    if ( node.eval_type != 0 ) {
      v_type = node.eval_type;
    }
    switch (v_type) {
      case 11 : 
        wr.out(str : "Int", newLine : false)
      case 3 : 
        wr.out(str : "Int", newLine : false)
      case 2 : 
        wr.out(str : "Double", newLine : false)
      case 12 : 
        wr.out(str : "Char", newLine : false)
      case 13 : 
        wr.out(str : "CharArray", newLine : false)
      case 4 : 
        wr.out(str : "String", newLine : false)
      case 5 : 
        wr.out(str : "Boolean", newLine : false)
      case 7 : 
        wr.out(str : ((("MutableMap<" + self.getObjectTypeString(type_string : node.key_type, ctx : ctx)) + ",") + self.getObjectTypeString(type_string : node.array_type, ctx : ctx)) + ">", newLine : false)
      case 6 : 
        wr.out(str : ("MutableList<" + self.getObjectTypeString(type_string : node.array_type, ctx : ctx)) + ">", newLine : false)
      default: 
        if ( node.type_name == "void" ) {
          wr.out(str : "Unit", newLine : false)
        } else {
          wr.out(str : self.getTypeString(type_string : node.type_name), newLine : false)
        }
        break;
    }
    if ( node.hasFlag(flagName : "optional") ) {
      wr.out(str : "?", newLine : false)
    }
  }
  override func WriteVRef(node : CodeNode, ctx : RangerAppWriterContext, wr : CodeWriter) -> Void {
    if ( node.eval_type == 11 ) {
      if ( (node.ns.count) > 1 ) {
        let rootObjName : String = node.ns[0]
        let enumName : String = node.ns[1]
        let e : RangerAppEnum? = ctx.getEnum(n : rootObjName)
        if ( e != nil  ) {
          wr.out(str : "" + String(((e!.values[enumName])!)), newLine : false)
          return;
        }
      }
    }
    if ( (node.nsp.count) > 0 ) {
      for ( i , p ) in node.nsp.enumerated() {
        if ( i > 0 ) {
          wr.out(str : ".", newLine : false)
        }
        if ( (p.compiledName.characters.count) > 0 ) {
          wr.out(str : self.adjustType(tn : p.compiledName), newLine : false)
        } else {
          if ( (p.name.characters.count) > 0 ) {
            wr.out(str : self.adjustType(tn : p.name), newLine : false)
          } else {
            wr.out(str : self.adjustType(tn : (node.ns[i])), newLine : false)
          }
        }
        if ( i == 0 ) {
          if ( p.nameNode!.hasFlag(flagName : "optional") ) {
            wr.out(str : "!!", newLine : false)
          }
        }
      }
      return;
    }
    if ( node.hasParamDesc ) {
      let p_1 : RangerAppParamDesc? = node.paramDesc
      wr.out(str : p_1!.compiledName, newLine : false)
      return;
    }
    for ( i_1 , part ) in node.ns.enumerated() {
      if ( i_1 > 0 ) {
        wr.out(str : ".", newLine : false)
      }
      wr.out(str : self.adjustType(tn : part), newLine : false)
    }
  }
  override func writeVarDef(node : CodeNode, ctx : RangerAppWriterContext, wr : CodeWriter) -> Void {
    if ( node.hasParamDesc ) {
      let nn : CodeNode = node.children[1]
      let p : RangerAppParamDesc? = nn.paramDesc
      if ( (p!.ref_cnt == 0) && (p!.is_class_variable == false) ) {
        wr.out(str : "/** unused:  ", newLine : false)
      }
      if ( (p!.set_cnt > 0) || p!.is_class_variable ) {
        wr.out(str : "var ", newLine : false)
      } else {
        wr.out(str : "val ", newLine : false)
      }
      wr.out(str : p!.compiledName, newLine : false)
      wr.out(str : " : ", newLine : false)
      self.writeTypeDef(node : p!.nameNode!, ctx : ctx, wr : wr)
      wr.out(str : " ", newLine : false)
      if ( (node.children.count) > 2 ) {
        wr.out(str : " = ", newLine : false)
        ctx.setInExpr()
        let value : CodeNode = node.getThird()
        self.WalkNode(node : value, ctx : ctx, wr : wr)
        ctx.unsetInExpr()
      } else {
        if ( nn.value_type == 6 ) {
          wr.out(str : " = arrayListOf()", newLine : false)
        }
        if ( nn.value_type == 7 ) {
          wr.out(str : " = hashMapOf()", newLine : false)
        }
      }
      if ( (p!.ref_cnt == 0) && (p!.is_class_variable == true) ) {
        wr.out(str : "     /** note: unused */", newLine : false)
      }
      if ( (p!.ref_cnt == 0) && (p!.is_class_variable == false) ) {
        wr.out(str : "   **/ ;", newLine : true)
      } else {
        wr.out(str : ";", newLine : false)
        wr.newline()
      }
    }
  }
  func writeArgsDef(fnDesc : RangerAppFunctionDesc, ctx : RangerAppWriterContext, wr : CodeWriter) -> Void {
    for ( i , arg ) in fnDesc.params.enumerated() {
      if ( i > 0 ) {
        wr.out(str : ",", newLine : false)
      }
      wr.out(str : " ", newLine : false)
      wr.out(str : arg.name + " : ", newLine : false)
      self.writeTypeDef(node : arg.nameNode!, ctx : ctx, wr : wr)
    }
  }
  override func writeFnCall(node : CodeNode, ctx : RangerAppWriterContext, wr : CodeWriter) -> Void {
    if ( node.hasFnCall ) {
      let fc : CodeNode = node.getFirst()
      self.WriteVRef(node : fc, ctx : ctx, wr : wr)
      wr.out(str : "(", newLine : false)
      let givenArgs : CodeNode = node.getSecond()
      for ( i , arg ) in node.fnDesc!.params.enumerated() {
        if ( i > 0 ) {
          wr.out(str : ", ", newLine : false)
        }
        if ( (givenArgs.children.count) <= i ) {
          let defVal : CodeNode? = arg.nameNode!.getFlag(flagName : "default")
          if ( defVal != nil  ) {
            let fc_1 : CodeNode = defVal!.vref_annotation!.getFirst()
            self.WalkNode(node : fc_1, ctx : ctx, wr : wr)
          } else {
            ctx.addError(targetnode : node, descr : "Default argument was missing")
          }
          continue;
        }
        let n : CodeNode = givenArgs.children[i]
        self.WalkNode(node : n, ctx : ctx, wr : wr)
      }
      wr.out(str : ")", newLine : false)
      if ( ctx.expressionLevel() == 0 ) {
        wr.out(str : ";", newLine : true)
      }
    }
  }
  override func writeNewCall(node : CodeNode, ctx : RangerAppWriterContext, wr : CodeWriter) -> Void {
    if ( node.hasNewOper ) {
      let cl : RangerAppClassDesc? = node.clDesc
      /** unused:  let fc : CodeNode = node.getSecond()   **/ 
      wr.out(str : " ", newLine : false)
      wr.out(str : node.clDesc!.name, newLine : false)
      wr.out(str : "(", newLine : false)
      let constr : RangerAppFunctionDesc? = cl!.constructor_fn
      let givenArgs : CodeNode = node.getThird()
      if ( constr != nil  ) {
        for ( i , arg ) in constr!.params.enumerated() {
          let n : CodeNode = givenArgs.children[i]
          if ( i > 0 ) {
            wr.out(str : ", ", newLine : false)
          }
          if ( true || (arg.nameNode != nil ) ) {
            self.WalkNode(node : n, ctx : ctx, wr : wr)
          }
        }
      }
      wr.out(str : ")", newLine : false)
    }
  }
  override func writeClass(node : CodeNode, ctx : RangerAppWriterContext, wr orig_wr : CodeWriter) -> Void {
    let cl : RangerAppClassDesc? = node.clDesc
    if ( cl == nil ) {
      return;
    }
    let wr : CodeWriter = orig_wr
    /** unused:  let importFork : CodeWriter = wr.fork()   **/ 
    wr.out(str : "", newLine : true)
    wr.out(str : "class " + cl!.name, newLine : false)
    if ( cl!.has_constructor ) {
      let constr : RangerAppFunctionDesc = cl!.constructor_fn!
      wr.out(str : "(", newLine : false)
      self.writeArgsDef(fnDesc : constr, ctx : ctx, wr : wr)
      wr.out(str : " ) ", newLine : true)
    }
    wr.out(str : " {", newLine : true)
    wr.indent(delta : 1)
    for ( _ , pvar ) in cl!.variables.enumerated() {
      self.writeVarDef(node : pvar.node!, ctx : ctx, wr : wr)
    }
    if ( cl!.has_constructor ) {
      let constr_1 : RangerAppFunctionDesc? = cl!.constructor_fn
      wr.out(str : "", newLine : true)
      wr.out(str : "init {", newLine : true)
      wr.indent(delta : 1)
      wr.newline()
      let subCtx : RangerAppWriterContext = constr_1!.fnCtx!
      subCtx.is_function = true;
      self.WalkNode(node : constr_1!.fnBody!, ctx : subCtx, wr : wr)
      wr.newline()
      wr.indent(delta : -1)
      wr.out(str : "}", newLine : true)
    }
    if ( (cl!.static_methods.count) > 0 ) {
      wr.out(str : "companion object {", newLine : true)
      wr.indent(delta : 1)
    }
    for ( _ , variant ) in cl!.static_methods.enumerated() {
      wr.out(str : "", newLine : true)
      if ( variant.nameNode!.hasFlag(flagName : "main") ) {
        continue;
      }
      wr.out(str : "fun ", newLine : false)
      wr.out(str : " ", newLine : false)
      wr.out(str : variant.name + "(", newLine : false)
      self.writeArgsDef(fnDesc : variant, ctx : ctx, wr : wr)
      wr.out(str : ") : ", newLine : false)
      self.writeTypeDef(node : variant.nameNode!, ctx : ctx, wr : wr)
      wr.out(str : " {", newLine : true)
      wr.indent(delta : 1)
      wr.newline()
      let subCtx_1 : RangerAppWriterContext = variant.fnCtx!
      subCtx_1.is_function = true;
      self.WalkNode(node : variant.fnBody!, ctx : subCtx_1, wr : wr)
      wr.newline()
      wr.indent(delta : -1)
      wr.out(str : "}", newLine : true)
    }
    if ( (cl!.static_methods.count) > 0 ) {
      wr.indent(delta : -1)
      wr.out(str : "}", newLine : true)
    }
    for ( _ , fnVar ) in cl!.defined_variants.enumerated() {
      let mVs : RangerAppMethodVariants? = cl!.method_variants[fnVar]
      for ( _ , variant_1 ) in mVs!.variants.enumerated() {
        wr.out(str : "", newLine : true)
        wr.out(str : "fun ", newLine : false)
        wr.out(str : " ", newLine : false)
        wr.out(str : variant_1.name + "(", newLine : false)
        self.writeArgsDef(fnDesc : variant_1, ctx : ctx, wr : wr)
        wr.out(str : ") : ", newLine : false)
        self.writeTypeDef(node : variant_1.nameNode!, ctx : ctx, wr : wr)
        wr.out(str : " {", newLine : true)
        wr.indent(delta : 1)
        wr.newline()
        let subCtx_2 : RangerAppWriterContext = variant_1.fnCtx!
        subCtx_2.is_function = true;
        self.WalkNode(node : variant_1.fnBody!, ctx : subCtx_2, wr : wr)
        wr.newline()
        wr.indent(delta : -1)
        wr.out(str : "}", newLine : true)
      }
    }
    wr.indent(delta : -1)
    wr.out(str : "}", newLine : true)
    for ( _ , variant_2 ) in cl!.static_methods.enumerated() {
      wr.out(str : "", newLine : true)
      if ( variant_2.nameNode!.hasFlag(flagName : "main") && (variant_2.nameNode!.code!.filename == ctx.getRootFile()) ) {
        wr.out(str : "fun main(args : Array<String>) {", newLine : true)
        wr.indent(delta : 1)
        wr.newline()
        let subCtx_3 : RangerAppWriterContext = variant_2.fnCtx!
        subCtx_3.is_function = true;
        self.WalkNode(node : variant_2.fnBody!, ctx : subCtx_3, wr : wr)
        wr.newline()
        wr.indent(delta : -1)
        wr.out(str : "}", newLine : true)
      }
    }
  }
}
func ==(l: RangerCSharpClassWriter, r: RangerCSharpClassWriter) -> Bool {
  return l === r
}
class RangerCSharpClassWriter : RangerGenericClassWriter { 
  // WAS DECLARED : compiler
  override func adjustType(tn : String) -> String {
    if ( tn == "this" ) {
      return "this";
    }
    return tn;
  }
  override func getObjectTypeString(type_string : String, ctx : RangerAppWriterContext) -> String {
    switch (type_string) {
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
      default :
        break
    }
    return type_string;
  }
  override func getTypeString(type_string : String) -> String {
    switch (type_string) {
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
      default :
        break
    }
    return type_string;
  }
  override func writeTypeDef(node : CodeNode, ctx : RangerAppWriterContext, wr : CodeWriter) -> Void {
    var v_type : Int = node.value_type
    if ( node.eval_type != 0 ) {
      v_type = node.eval_type;
    }
    switch (v_type) {
      case 11 : 
        wr.out(str : "int", newLine : false)
      case 3 : 
        wr.out(str : "int", newLine : false)
      case 2 : 
        wr.out(str : "double", newLine : false)
      case 12 : 
        wr.out(str : "byte", newLine : false)
      case 13 : 
        wr.out(str : "byte[]", newLine : false)
      case 4 : 
        wr.out(str : "String", newLine : false)
      case 5 : 
        wr.out(str : "boolean", newLine : false)
      case 7 : 
        wr.out(str : ((("Dictionary<" + self.getObjectTypeString(type_string : node.key_type, ctx : ctx)) + ",") + self.getObjectTypeString(type_string : node.array_type, ctx : ctx)) + ">", newLine : false)
        wr.addImport(name : "System.Collections")
      case 6 : 
        wr.out(str : ("List<" + self.getObjectTypeString(type_string : node.array_type, ctx : ctx)) + ">", newLine : false)
        wr.addImport(name : "System.Collections")
      default: 
        if ( node.type_name == "void" ) {
          wr.out(str : "void", newLine : false)
        } else {
          wr.out(str : self.getTypeString(type_string : node.type_name), newLine : false)
        }
        break;
    }
    if ( node.hasFlag(flagName : "optional") ) {
      wr.out(str : "?", newLine : false)
    }
  }
  override func WriteVRef(node : CodeNode, ctx : RangerAppWriterContext, wr : CodeWriter) -> Void {
    if ( node.eval_type == 11 ) {
      if ( (node.ns.count) > 1 ) {
        let rootObjName : String = node.ns[0]
        let enumName : String = node.ns[1]
        let e : RangerAppEnum? = ctx.getEnum(n : rootObjName)
        if ( e != nil  ) {
          wr.out(str : "" + String(((e!.values[enumName])!)), newLine : false)
          return;
        }
      }
    }
    if ( (node.nsp.count) > 0 ) {
      for ( i , p ) in node.nsp.enumerated() {
        if ( i > 0 ) {
          wr.out(str : ".", newLine : false)
        }
        if ( i == 0 ) {
          if ( p.nameNode!.hasFlag(flagName : "optional") ) {
          }
        }
        if ( (p.compiledName.characters.count) > 0 ) {
          wr.out(str : self.adjustType(tn : p.compiledName), newLine : false)
        } else {
          if ( (p.name.characters.count) > 0 ) {
            wr.out(str : self.adjustType(tn : p.name), newLine : false)
          } else {
            wr.out(str : self.adjustType(tn : (node.ns[i])), newLine : false)
          }
        }
      }
      return;
    }
    if ( node.hasParamDesc ) {
      let p_1 : RangerAppParamDesc? = node.paramDesc
      wr.out(str : p_1!.compiledName, newLine : false)
      return;
    }
    for ( i_1 , part ) in node.ns.enumerated() {
      if ( i_1 > 0 ) {
        wr.out(str : ".", newLine : false)
      }
      wr.out(str : self.adjustType(tn : part), newLine : false)
    }
  }
  override func writeVarDef(node : CodeNode, ctx : RangerAppWriterContext, wr : CodeWriter) -> Void {
    if ( node.hasParamDesc ) {
      let nn : CodeNode = node.children[1]
      let p : RangerAppParamDesc? = nn.paramDesc
      if ( (p!.ref_cnt == 0) && (p!.is_class_variable == false) ) {
        wr.out(str : "/** unused:  ", newLine : false)
      }
      if ( (p!.set_cnt > 0) || p!.is_class_variable ) {
        wr.out(str : "", newLine : false)
      } else {
        wr.out(str : "const ", newLine : false)
      }
      self.writeTypeDef(node : p!.nameNode!, ctx : ctx, wr : wr)
      wr.out(str : " ", newLine : false)
      wr.out(str : p!.compiledName, newLine : false)
      if ( (node.children.count) > 2 ) {
        wr.out(str : " = ", newLine : false)
        ctx.setInExpr()
        let value : CodeNode = node.getThird()
        self.WalkNode(node : value, ctx : ctx, wr : wr)
        ctx.unsetInExpr()
      } else {
        if ( nn.value_type == 6 ) {
          wr.out(str : " = new ", newLine : false)
          self.writeTypeDef(node : p!.nameNode!, ctx : ctx, wr : wr)
          wr.out(str : "()", newLine : false)
        }
        if ( nn.value_type == 7 ) {
          wr.out(str : " = new ", newLine : false)
          self.writeTypeDef(node : p!.nameNode!, ctx : ctx, wr : wr)
          wr.out(str : "()", newLine : false)
        }
      }
      if ( (p!.ref_cnt == 0) && (p!.is_class_variable == true) ) {
        wr.out(str : "     /** note: unused */", newLine : false)
      }
      if ( (p!.ref_cnt == 0) && (p!.is_class_variable == false) ) {
        wr.out(str : "   **/ ;", newLine : true)
      } else {
        wr.out(str : ";", newLine : false)
        wr.newline()
      }
    }
  }
  func writeArgsDef(fnDesc : RangerAppFunctionDesc, ctx : RangerAppWriterContext, wr : CodeWriter) -> Void {
    for ( i , arg ) in fnDesc.params.enumerated() {
      if ( i > 0 ) {
        wr.out(str : ",", newLine : false)
      }
      wr.out(str : " ", newLine : false)
      self.writeTypeDef(node : arg.nameNode!, ctx : ctx, wr : wr)
      wr.out(str : (" " + arg.name) + " ", newLine : false)
    }
  }
  override func writeClass(node : CodeNode, ctx : RangerAppWriterContext, wr orig_wr : CodeWriter) -> Void {
    let cl : RangerAppClassDesc? = node.clDesc
    if ( cl == nil ) {
      return;
    }
    let wr : CodeWriter = orig_wr.getFileWriter(path : ".", fileName : (cl!.name + ".cs"))
    let importFork : CodeWriter = wr.fork()
    wr.out(str : "", newLine : true)
    wr.out(str : ("class " + cl!.name) + " {", newLine : true)
    wr.indent(delta : 1)
    for ( _ , pvar ) in cl!.variables.enumerated() {
      wr.out(str : "public ", newLine : false)
      self.writeVarDef(node : pvar.node!, ctx : ctx, wr : wr)
    }
    if ( cl!.has_constructor ) {
      let constr : RangerAppFunctionDesc = cl!.constructor_fn!
      wr.out(str : "", newLine : true)
      wr.out(str : cl!.name + "(", newLine : false)
      self.writeArgsDef(fnDesc : constr, ctx : ctx, wr : wr)
      wr.out(str : " ) {", newLine : true)
      wr.indent(delta : 1)
      wr.newline()
      let subCtx : RangerAppWriterContext = constr.fnCtx!
      subCtx.is_function = true;
      self.WalkNode(node : constr.fnBody!, ctx : subCtx, wr : wr)
      wr.newline()
      wr.indent(delta : -1)
      wr.out(str : "}", newLine : true)
    }
    for ( _ , variant ) in cl!.static_methods.enumerated() {
      wr.out(str : "", newLine : true)
      if ( variant.nameNode!.hasFlag(flagName : "main") && (variant.nameNode!.code!.filename != ctx.getRootFile()) ) {
        continue;
      }
      if ( variant.nameNode!.hasFlag(flagName : "main") ) {
        wr.out(str : "static int Main( string [] args ) {", newLine : true)
      } else {
        wr.out(str : "public static ", newLine : false)
        self.writeTypeDef(node : variant.nameNode!, ctx : ctx, wr : wr)
        wr.out(str : " ", newLine : false)
        wr.out(str : variant.name + "(", newLine : false)
        self.writeArgsDef(fnDesc : variant, ctx : ctx, wr : wr)
        wr.out(str : ") {", newLine : true)
      }
      wr.indent(delta : 1)
      wr.newline()
      let subCtx_1 : RangerAppWriterContext = variant.fnCtx!
      subCtx_1.is_function = true;
      self.WalkNode(node : variant.fnBody!, ctx : subCtx_1, wr : wr)
      wr.newline()
      wr.indent(delta : -1)
      wr.out(str : "}", newLine : true)
    }
    for ( _ , fnVar ) in cl!.defined_variants.enumerated() {
      let mVs : RangerAppMethodVariants? = cl!.method_variants[fnVar]
      for ( _ , variant_1 ) in mVs!.variants.enumerated() {
        wr.out(str : "", newLine : true)
        wr.out(str : "public ", newLine : false)
        self.writeTypeDef(node : variant_1.nameNode!, ctx : ctx, wr : wr)
        wr.out(str : " ", newLine : false)
        wr.out(str : variant_1.name + "(", newLine : false)
        self.writeArgsDef(fnDesc : variant_1, ctx : ctx, wr : wr)
        wr.out(str : ") {", newLine : true)
        wr.indent(delta : 1)
        wr.newline()
        let subCtx_2 : RangerAppWriterContext = variant_1.fnCtx!
        subCtx_2.is_function = true;
        self.WalkNode(node : variant_1.fnBody!, ctx : subCtx_2, wr : wr)
        wr.newline()
        wr.indent(delta : -1)
        wr.out(str : "}", newLine : true)
      }
    }
    wr.indent(delta : -1)
    wr.out(str : "}", newLine : true)
    let import_list : [String] = wr.getImports()
    for ( _ , codeStr ) in import_list.enumerated() {
      importFork.out(str : ("using " + codeStr) + ";", newLine : true)
    }
  }
}
func ==(l: RangerScalaClassWriter, r: RangerScalaClassWriter) -> Bool {
  return l === r
}
class RangerScalaClassWriter : RangerGenericClassWriter { 
  // WAS DECLARED : compiler
  override func getObjectTypeString(type_string : String, ctx : RangerAppWriterContext) -> String {
    switch (type_string) {
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
      default :
        break
    }
    return type_string;
  }
  override func getTypeString(type_string : String) -> String {
    switch (type_string) {
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
      default :
        break
    }
    return type_string;
  }
  override func writeTypeDef(node : CodeNode, ctx : RangerAppWriterContext, wr : CodeWriter) -> Void {
    if ( node.hasFlag(flagName : "optional") ) {
      wr.out(str : "Option[", newLine : false)
    }
    var v_type : Int = node.value_type
    if ( node.eval_type != 0 ) {
      v_type = node.eval_type;
    }
    switch (v_type) {
      case 11 : 
        wr.out(str : "Int", newLine : false)
      case 3 : 
        wr.out(str : "Int", newLine : false)
      case 2 : 
        wr.out(str : "Double", newLine : false)
      case 4 : 
        wr.out(str : "String", newLine : false)
      case 5 : 
        wr.out(str : "Boolean", newLine : false)
      case 12 : 
        wr.out(str : "Byte", newLine : false)
      case 13 : 
        wr.out(str : "Array[Byte]", newLine : false)
      case 7 : 
        wr.addImport(name : "scala.collection.mutable")
        wr.out(str : ((("collection.mutable.HashMap[" + self.getObjectTypeString(type_string : node.key_type, ctx : ctx)) + ", ") + self.getObjectTypeString(type_string : node.array_type, ctx : ctx)) + "]", newLine : false)
      case 6 : 
        wr.addImport(name : "scala.collection.mutable")
        wr.out(str : ("collection.mutable.ArrayBuffer[" + self.getObjectTypeString(type_string : node.array_type, ctx : ctx)) + "]", newLine : false)
      default: 
        if ( node.type_name == "void" ) {
          wr.out(str : "Unit", newLine : false)
          return;
        }
        wr.out(str : self.getTypeString(type_string : node.type_name), newLine : false)
        break;
    }
    if ( node.hasFlag(flagName : "optional") ) {
      wr.out(str : "]", newLine : false)
    }
  }
  func writeTypeDefNoOption(node : CodeNode, ctx : RangerAppWriterContext, wr : CodeWriter) -> Void {
    var v_type : Int = node.value_type
    if ( node.eval_type != 0 ) {
      v_type = node.eval_type;
    }
    switch (v_type) {
      case 11 : 
        wr.out(str : "Int", newLine : false)
      case 3 : 
        wr.out(str : "Int", newLine : false)
      case 2 : 
        wr.out(str : "Double", newLine : false)
      case 4 : 
        wr.out(str : "String", newLine : false)
      case 5 : 
        wr.out(str : "Boolean", newLine : false)
      case 12 : 
        wr.out(str : "Byte", newLine : false)
      case 13 : 
        wr.out(str : "Array[Byte]", newLine : false)
      case 7 : 
        wr.addImport(name : "scala.collection.mutable")
        wr.out(str : ((("collection.mutable.HashMap[" + self.getObjectTypeString(type_string : node.key_type, ctx : ctx)) + ", ") + self.getObjectTypeString(type_string : node.array_type, ctx : ctx)) + "]", newLine : false)
      case 6 : 
        wr.addImport(name : "scala.collection.mutable")
        wr.out(str : ("collection.mutable.ArrayBuffer[" + self.getObjectTypeString(type_string : node.array_type, ctx : ctx)) + "]", newLine : false)
      default: 
        if ( node.type_name == "void" ) {
          wr.out(str : "Unit", newLine : false)
          return;
        }
        wr.out(str : self.getTypeString(type_string : node.type_name), newLine : false)
        break;
    }
  }
  override func WriteVRef(node : CodeNode, ctx : RangerAppWriterContext, wr : CodeWriter) -> Void {
    if ( node.eval_type == 11 ) {
      if ( (node.ns.count) > 1 ) {
        let rootObjName : String = node.ns[0]
        let enumName : String = node.ns[1]
        let e : RangerAppEnum? = ctx.getEnum(n : rootObjName)
        if ( e != nil  ) {
          wr.out(str : "" + String(((e!.values[enumName])!)), newLine : false)
          return;
        }
      }
    }
    if ( (node.nsp.count) > 0 ) {
      for ( i , p ) in node.nsp.enumerated() {
        if ( i > 0 ) {
          wr.out(str : ".", newLine : false)
        }
        if ( (p.compiledName.characters.count) > 0 ) {
          wr.out(str : self.adjustType(tn : p.compiledName), newLine : false)
        } else {
          if ( (p.name.characters.count) > 0 ) {
            wr.out(str : self.adjustType(tn : p.name), newLine : false)
          } else {
            wr.out(str : self.adjustType(tn : (node.ns[i])), newLine : false)
          }
        }
        if ( i == 0 ) {
          if ( p.nameNode!.hasFlag(flagName : "optional") ) {
            wr.out(str : ".get", newLine : false)
          }
        }
      }
      return;
    }
    if ( node.hasParamDesc ) {
      let p_1 : RangerAppParamDesc? = node.paramDesc
      wr.out(str : p_1!.compiledName, newLine : false)
      return;
    }
    for ( i_1 , part ) in node.ns.enumerated() {
      if ( i_1 > 0 ) {
        wr.out(str : ".", newLine : false)
      }
      wr.out(str : self.adjustType(tn : part), newLine : false)
    }
  }
  override func writeVarDef(node : CodeNode, ctx : RangerAppWriterContext, wr : CodeWriter) -> Void {
    if ( node.hasParamDesc ) {
      let p : RangerAppParamDesc? = node.paramDesc
      /** unused:  let nn : CodeNode = node.children[1]   **/ 
      if ( (p!.ref_cnt == 0) && (p!.is_class_variable == false) ) {
        wr.out(str : "/** unused ", newLine : false)
      }
      if ( (p!.set_cnt > 0) || p!.is_class_variable ) {
        wr.out(str : ("var " + p!.compiledName) + " : ", newLine : false)
      } else {
        wr.out(str : ("val " + p!.compiledName) + " : ", newLine : false)
      }
      self.writeTypeDef(node : p!.nameNode!, ctx : ctx, wr : wr)
      if ( (node.children.count) > 2 ) {
        wr.out(str : " = ", newLine : false)
        ctx.setInExpr()
        let value : CodeNode = node.getThird()
        self.WalkNode(node : value, ctx : ctx, wr : wr)
        ctx.unsetInExpr()
      } else {
        var b_inited : Bool = false
        if ( p!.nameNode!.value_type == 6 ) {
          b_inited = true;
          wr.out(str : "= new collection.mutable.ArrayBuffer()", newLine : false)
        }
        if ( p!.nameNode!.value_type == 7 ) {
          b_inited = true;
          wr.out(str : "= new collection.mutable.HashMap()", newLine : false)
        }
        if ( p!.nameNode!.hasFlag(flagName : "optional") ) {
          wr.out(str : " = Option.empty[", newLine : false)
          self.writeTypeDefNoOption(node : p!.nameNode!, ctx : ctx, wr : wr)
          wr.out(str : "]", newLine : false)
        } else {
          if ( b_inited == false ) {
            wr.out(str : " = _", newLine : false)
          }
        }
      }
      if ( (p!.ref_cnt == 0) && (p!.is_class_variable == false) ) {
        wr.out(str : "**/ ", newLine : true)
      } else {
        wr.newline()
      }
    }
  }
  func writeArgsDef(fnDesc : RangerAppFunctionDesc, ctx : RangerAppWriterContext, wr : CodeWriter) -> Void {
    for ( i , arg ) in fnDesc.params.enumerated() {
      if ( i > 0 ) {
        wr.out(str : ",", newLine : false)
      }
      wr.out(str : " ", newLine : false)
      wr.out(str : arg.name + " : ", newLine : false)
      self.writeTypeDef(node : arg.nameNode!, ctx : ctx, wr : wr)
    }
  }
  override func writeClass(node : CodeNode, ctx : RangerAppWriterContext, wr orig_wr : CodeWriter) -> Void {
    let cl : RangerAppClassDesc? = node.clDesc
    if ( cl == nil ) {
      return;
    }
    let wr : CodeWriter = orig_wr.getFileWriter(path : ".", fileName : (cl!.name + ".scala"))
    let importFork : CodeWriter = wr.fork()
    wr.out(str : "", newLine : true)
    wr.out(str : ("class " + cl!.name) + " ", newLine : false)
    if ( cl!.has_constructor ) {
      wr.out(str : "(", newLine : false)
      let constr : RangerAppFunctionDesc = cl!.constructor_fn!
      for ( i , arg ) in constr.params.enumerated() {
        if ( i > 0 ) {
          wr.out(str : ", ", newLine : false)
        }
        wr.out(str : arg.name + " : ", newLine : false)
        self.writeTypeDef(node : arg.nameNode!, ctx : ctx, wr : wr)
      }
      wr.out(str : ")", newLine : false)
    }
    wr.out(str : " {", newLine : true)
    wr.indent(delta : 1)
    for ( _ , pvar ) in cl!.variables.enumerated() {
      self.writeVarDef(node : pvar.node!, ctx : ctx, wr : wr)
    }
    if ( cl!.has_constructor ) {
      let constr_1 : RangerAppFunctionDesc? = cl!.constructor_fn
      wr.newline()
      let subCtx : RangerAppWriterContext = constr_1!.fnCtx!
      subCtx.is_function = true;
      self.WalkNode(node : constr_1!.fnBody!, ctx : subCtx, wr : wr)
      wr.newline()
    }
    for ( _ , fnVar ) in cl!.defined_variants.enumerated() {
      let mVs : RangerAppMethodVariants? = cl!.method_variants[fnVar]
      for ( _ , variant ) in mVs!.variants.enumerated() {
        wr.out(str : "", newLine : true)
        wr.out(str : "def ", newLine : false)
        wr.out(str : " ", newLine : false)
        wr.out(str : variant.name + "(", newLine : false)
        self.writeArgsDef(fnDesc : variant, ctx : ctx, wr : wr)
        wr.out(str : ") : ", newLine : false)
        self.writeTypeDef(node : variant.nameNode!, ctx : ctx, wr : wr)
        wr.out(str : " = {", newLine : true)
        wr.indent(delta : 1)
        wr.newline()
        let subCtx_1 : RangerAppWriterContext = variant.fnCtx!
        subCtx_1.is_function = true;
        self.WalkNode(node : variant.fnBody!, ctx : subCtx_1, wr : wr)
        wr.newline()
        wr.indent(delta : -1)
        wr.out(str : "}", newLine : true)
      }
    }
    wr.indent(delta : -1)
    wr.out(str : "}", newLine : true)
    var b_had_app : Bool = false
    var app_obj : RangerAppFunctionDesc?
    if ( (cl!.static_methods.count) > 0 ) {
      wr.out(str : "", newLine : true)
      wr.out(str : "// companion object for static methods of " + cl!.name, newLine : true)
      wr.out(str : ("object " + cl!.name) + " {", newLine : true)
      wr.indent(delta : 1)
    }
    for ( _ , variant_1 ) in cl!.static_methods.enumerated() {
      if ( variant_1.nameNode!.hasFlag(flagName : "main") ) {
        b_had_app = true;
        app_obj = variant_1;
        continue;
      }
      wr.out(str : "", newLine : true)
      wr.out(str : "def ", newLine : false)
      wr.out(str : " ", newLine : false)
      wr.out(str : variant_1.name + "(", newLine : false)
      self.writeArgsDef(fnDesc : variant_1, ctx : ctx, wr : wr)
      wr.out(str : ") : ", newLine : false)
      self.writeTypeDef(node : variant_1.nameNode!, ctx : ctx, wr : wr)
      wr.out(str : " = {", newLine : true)
      wr.indent(delta : 1)
      wr.newline()
      let subCtx_2 : RangerAppWriterContext = variant_1.fnCtx!
      subCtx_2.is_function = true;
      self.WalkNode(node : variant_1.fnBody!, ctx : subCtx_2, wr : wr)
      wr.newline()
      wr.indent(delta : -1)
      wr.out(str : "}", newLine : true)
    }
    if ( (cl!.static_methods.count) > 0 ) {
      wr.newline()
      wr.indent(delta : -1)
      wr.out(str : "}", newLine : true)
    }
    if ( b_had_app ) {
      let variant_2 : RangerAppFunctionDesc? = app_obj
      wr.out(str : "", newLine : true)
      wr.out(str : "// application main function for " + cl!.name, newLine : true)
      wr.out(str : ("object App" + cl!.name) + " extends App {", newLine : true)
      wr.indent(delta : 1)
      wr.indent(delta : 1)
      wr.newline()
      let subCtx_3 : RangerAppWriterContext = variant_2!.fnCtx!
      subCtx_3.is_function = true;
      self.WalkNode(node : variant_2!.fnBody!, ctx : subCtx_3, wr : wr)
      wr.newline()
      wr.indent(delta : -1)
      wr.out(str : "}", newLine : true)
    }
    let import_list : [String] = wr.getImports()
    for ( _ , codeStr ) in import_list.enumerated() {
      importFork.out(str : ("import " + codeStr) + ";", newLine : true)
    }
  }
}
func ==(l: RangerGolangClassWriter, r: RangerGolangClassWriter) -> Bool {
  return l === r
}
class RangerGolangClassWriter : RangerGenericClassWriter { 
  // WAS DECLARED : compiler
  var thisName : String = "this"
  var write_raw_type : Bool = false
  var did_write_nullable : Bool = false
  override func WriteScalarValue(node : CodeNode, ctx : RangerAppWriterContext, wr : CodeWriter) -> Void {
    switch (node.value_type) {
      case 2 : 
        wr.out(str : node.getParsedString(), newLine : false)
      case 4 : 
        let s : String = self.EncodeString(node : node, ctx : ctx, wr : wr)
        wr.out(str : ("\"" + s) + "\"", newLine : false)
      case 3 : 
        wr.out(str : "" + String(node.int_value), newLine : false)
      case 5 : 
        if ( node.boolean_value ) {
          wr.out(str : "true", newLine : false)
        } else {
          wr.out(str : "false", newLine : false)
        }
      default :
        break
    }
  }
  override func getObjectTypeString(type_string : String, ctx : RangerAppWriterContext) -> String {
    if ( type_string == "this" ) {
      return thisName;
    }
    if ( ctx.isDefinedClass(name : type_string) ) {
      let cc : RangerAppClassDesc = ctx.findClass(name : type_string)
      if ( cc.doesInherit() ) {
        return "IFACE_" + ctx.transformTypeName(typeName : type_string);
      }
    }
    switch (type_string) {
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
      default :
        break
    }
    return ctx.transformTypeName(typeName : type_string);
  }
  func getTypeString2(type_string : String, ctx : RangerAppWriterContext) -> String {
    if ( type_string == "this" ) {
      return thisName;
    }
    switch (type_string) {
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
      default :
        break
    }
    return ctx.transformTypeName(typeName : type_string);
  }
  override func writeRawTypeDef(node : CodeNode, ctx : RangerAppWriterContext, wr : CodeWriter) -> Void {
    write_raw_type = true;
    self.writeTypeDef(node : node, ctx : ctx, wr : wr)
    write_raw_type = false;
  }
  override func writeTypeDef(node : CodeNode, ctx : RangerAppWriterContext, wr : CodeWriter) -> Void {
    self.writeTypeDef2(node : node, ctx : ctx, wr : wr)
  }
  override func writeArrayTypeDef(node : CodeNode, ctx : RangerAppWriterContext, wr : CodeWriter) -> Void {
    var v_type : Int = node.value_type
    var a_name : String = node.array_type
    if ( ((v_type == 8) || (v_type == 9)) || (v_type == 0) ) {
      v_type = node.typeNameAsType(ctx : ctx);
    }
    if ( node.eval_type != 0 ) {
      v_type = node.eval_type;
      if ( (node.eval_array_type.characters.count) > 0 ) {
        a_name = node.eval_array_type;
      }
    }
    switch (v_type) {
      case 7 : 
        if ( ctx.isDefinedClass(name : a_name) ) {
          let cc : RangerAppClassDesc = ctx.findClass(name : a_name)
          if ( cc.doesInherit() ) {
            wr.out(str : "IFACE_" + self.getTypeString2(type_string : a_name, ctx : ctx), newLine : false)
            return;
          }
        }
        if ( ctx.isPrimitiveType(typeName : a_name) == false ) {
          wr.out(str : "*", newLine : false)
        }
        wr.out(str : self.getObjectTypeString(type_string : a_name, ctx : ctx) + "", newLine : false)
      case 6 : 
        if ( ctx.isDefinedClass(name : a_name) ) {
          let cc_1 : RangerAppClassDesc = ctx.findClass(name : a_name)
          if ( cc_1.doesInherit() ) {
            wr.out(str : "IFACE_" + self.getTypeString2(type_string : a_name, ctx : ctx), newLine : false)
            return;
          }
        }
        if ( (write_raw_type == false) && (ctx.isPrimitiveType(typeName : a_name) == false) ) {
          wr.out(str : "*", newLine : false)
        }
        wr.out(str : self.getObjectTypeString(type_string : a_name, ctx : ctx) + "", newLine : false)
      default: 
        break;
    }
  }
  func writeTypeDef2(node : CodeNode, ctx : RangerAppWriterContext, wr : CodeWriter) -> Void {
    var v_type : Int = node.value_type
    var t_name : String = node.type_name
    var a_name : String = node.array_type
    var k_name : String = node.key_type
    if ( ((v_type == 8) || (v_type == 9)) || (v_type == 0) ) {
      v_type = node.typeNameAsType(ctx : ctx);
    }
    if ( node.eval_type != 0 ) {
      v_type = node.eval_type;
      if ( (node.eval_type_name.characters.count) > 0 ) {
        t_name = node.eval_type_name;
      }
      if ( (node.eval_array_type.characters.count) > 0 ) {
        a_name = node.eval_array_type;
      }
      if ( (node.eval_key_type.characters.count) > 0 ) {
        k_name = node.eval_key_type;
      }
    }
    switch (v_type) {
      case 15 : 
        let rv : CodeNode = node.expression_value!.children[0]
        let sec : CodeNode = node.expression_value!.children[1]
        /** unused:  let fc : CodeNode = sec.getFirst()   **/ 
        wr.out(str : "func(", newLine : false)
        for ( i , arg ) in sec.children.enumerated() {
          if ( i > 0 ) {
            wr.out(str : ", ", newLine : false)
          }
          self.writeTypeDef2(node : arg, ctx : ctx, wr : wr)
        }
        wr.out(str : ") ", newLine : false)
        self.writeTypeDef2(node : rv, ctx : ctx, wr : wr)
      case 11 : 
        wr.out(str : "int64", newLine : false)
      case 3 : 
        wr.out(str : "int64", newLine : false)
      case 2 : 
        wr.out(str : "float64", newLine : false)
      case 4 : 
        wr.out(str : "string", newLine : false)
      case 5 : 
        wr.out(str : "bool", newLine : false)
      case 12 : 
        wr.out(str : "byte", newLine : false)
      case 13 : 
        wr.out(str : "[]byte", newLine : false)
      case 7 : 
        if ( write_raw_type ) {
          wr.out(str : self.getObjectTypeString(type_string : a_name, ctx : ctx) + "", newLine : false)
        } else {
          wr.out(str : ("map[" + self.getObjectTypeString(type_string : k_name, ctx : ctx)) + "]", newLine : false)
          if ( ctx.isDefinedClass(name : a_name) ) {
            let cc : RangerAppClassDesc = ctx.findClass(name : a_name)
            if ( cc.doesInherit() ) {
              wr.out(str : "IFACE_" + self.getTypeString2(type_string : a_name, ctx : ctx), newLine : false)
              return;
            }
          }
          if ( (write_raw_type == false) && (ctx.isPrimitiveType(typeName : a_name) == false) ) {
            wr.out(str : "*", newLine : false)
          }
          wr.out(str : self.getObjectTypeString(type_string : a_name, ctx : ctx) + "", newLine : false)
        }
      case 6 : 
        if ( false == write_raw_type ) {
          wr.out(str : "[]", newLine : false)
        }
        if ( ctx.isDefinedClass(name : a_name) ) {
          let cc_1 : RangerAppClassDesc = ctx.findClass(name : a_name)
          if ( cc_1.doesInherit() ) {
            wr.out(str : "IFACE_" + self.getTypeString2(type_string : a_name, ctx : ctx), newLine : false)
            return;
          }
        }
        if ( (write_raw_type == false) && (ctx.isPrimitiveType(typeName : a_name) == false) ) {
          wr.out(str : "*", newLine : false)
        }
        wr.out(str : self.getObjectTypeString(type_string : a_name, ctx : ctx) + "", newLine : false)
      default: 
        if ( node.type_name == "void" ) {
          wr.out(str : "()", newLine : false)
          return;
        }
        var b_iface : Bool = false
        if ( ctx.isDefinedClass(name : t_name) ) {
          let cc_2 : RangerAppClassDesc = ctx.findClass(name : t_name)
          b_iface = cc_2.is_interface;
        }
        if ( ctx.isDefinedClass(name : t_name) ) {
          let cc_3 : RangerAppClassDesc = ctx.findClass(name : t_name)
          if ( cc_3.doesInherit() ) {
            wr.out(str : "IFACE_" + self.getTypeString2(type_string : t_name, ctx : ctx), newLine : false)
            return;
          }
        }
        if ( ((write_raw_type == false) && (node.isPrimitiveType() == false)) && (b_iface == false) ) {
          wr.out(str : "*", newLine : false)
        }
        wr.out(str : self.getTypeString2(type_string : t_name, ctx : ctx), newLine : false)
        break;
    }
  }
  override func WriteVRef(node : CodeNode, ctx : RangerAppWriterContext, wr : CodeWriter) -> Void {
    if ( node.vref == "this" ) {
      wr.out(str : thisName, newLine : false)
      return;
    }
    if ( node.eval_type == 11 ) {
      if ( (node.ns.count) > 1 ) {
        let rootObjName : String = node.ns[0]
        let enumName : String = node.ns[1]
        let e : RangerAppEnum? = ctx.getEnum(n : rootObjName)
        if ( e != nil  ) {
          wr.out(str : "" + String(((e!.values[enumName])!)), newLine : false)
          return;
        }
      }
    }
    var next_is_gs : Bool = false
    /** unused:  let last_was_setter : Bool = false   **/ 
    var needs_par : Bool = false
    let ns_last : Int = (node.ns.count) - 1
    if ( (node.nsp.count) > 0 ) {
      var had_static : Bool = false
      for ( i , p ) in node.nsp.enumerated() {
        if ( next_is_gs ) {
          if ( p.isProperty() ) {
            wr.out(str : ".Get_", newLine : false)
            needs_par = true;
          } else {
            needs_par = false;
          }
          next_is_gs = false;
        }
        if ( needs_par == false ) {
          if ( i > 0 ) {
            if ( had_static ) {
              wr.out(str : "_static_", newLine : false)
            } else {
              wr.out(str : ".", newLine : false)
            }
          }
        }
        if ( (p.nameNode != nil ) && ctx.isDefinedClass(name : p.nameNode!.type_name) ) {
          let c : RangerAppClassDesc = ctx.findClass(name : p.nameNode!.type_name)
          if ( c.doesInherit() ) {
            next_is_gs = true;
          }
        }
        if ( i == 0 ) {
          let part : String = node.ns[0]
          if ( part == "this" ) {
            wr.out(str : thisName, newLine : false)
            continue;
          }
          if ( (part != thisName) && ctx.isMemberVariable(name : part) ) {
            let cc : RangerAppClassDesc? = ctx.getCurrentClass()
            let currC : RangerAppClassDesc = cc!
            let up : RangerAppParamDesc? = currC.findVariable(f_name : part)
            if ( up != nil  ) {
              /** unused:  let p3 : RangerAppParamDesc = up!   **/ 
              wr.out(str : thisName + ".", newLine : false)
            }
          }
        }
        if ( (p.compiledName.characters.count) > 0 ) {
          wr.out(str : self.adjustType(tn : p.compiledName), newLine : false)
        } else {
          if ( (p.name.characters.count) > 0 ) {
            wr.out(str : self.adjustType(tn : p.name), newLine : false)
          } else {
            wr.out(str : self.adjustType(tn : (node.ns[i])), newLine : false)
          }
        }
        if ( needs_par ) {
          wr.out(str : "()", newLine : false)
          needs_par = false;
        }
        if ( ((p.nameNode != nil ) && p.nameNode!.hasFlag(flagName : "optional")) && (i != ns_last) ) {
          wr.out(str : ".value.(", newLine : false)
          self.writeTypeDef(node : p.nameNode!, ctx : ctx, wr : wr)
          wr.out(str : ")", newLine : false)
        }
        if ( p.isClass() ) {
          had_static = true;
        }
      }
      return;
    }
    if ( node.hasParamDesc ) {
      let part_1 : String = node.ns[0]
      if ( (part_1 != thisName) && ctx.isMemberVariable(name : part_1) ) {
        let cc_1 : RangerAppClassDesc? = ctx.getCurrentClass()
        let currC_1 : RangerAppClassDesc = cc_1!
        let up_1 : RangerAppParamDesc? = currC_1.findVariable(f_name : part_1)
        if ( up_1 != nil  ) {
          /** unused:  let p3_1 : RangerAppParamDesc = up_1!   **/ 
          wr.out(str : thisName + ".", newLine : false)
        }
      }
      let p_1 : RangerAppParamDesc? = node.paramDesc
      wr.out(str : p_1!.compiledName, newLine : false)
      return;
    }
    var b_was_static : Bool = false
    for ( i_1 , part_2 ) in node.ns.enumerated() {
      if ( i_1 > 0 ) {
        if ( (i_1 == 1) && b_was_static ) {
          wr.out(str : "_static_", newLine : false)
        } else {
          wr.out(str : ".", newLine : false)
        }
      }
      if ( i_1 == 0 ) {
        if ( part_2 == "this" ) {
          wr.out(str : thisName, newLine : false)
          continue;
        }
        if ( ctx.hasClass(name : part_2) ) {
          b_was_static = true;
        }
        if ( (part_2 != "this") && ctx.isMemberVariable(name : part_2) ) {
          let cc_2 : RangerAppClassDesc? = ctx.getCurrentClass()
          let currC_2 : RangerAppClassDesc = cc_2!
          let up_2 : RangerAppParamDesc? = currC_2.findVariable(f_name : part_2)
          if ( up_2 != nil  ) {
            /** unused:  let p3_2 : RangerAppParamDesc = up_2!   **/ 
            wr.out(str : thisName + ".", newLine : false)
          }
        }
      }
      wr.out(str : self.adjustType(tn : part_2), newLine : false)
    }
  }
  override func WriteSetterVRef(node : CodeNode, ctx : RangerAppWriterContext, wr : CodeWriter) -> Void {
    if ( node.vref == "this" ) {
      wr.out(str : thisName, newLine : false)
      return;
    }
    if ( node.eval_type == 11 ) {
      let rootObjName : String = node.ns[0]
      let enumName : String = node.ns[1]
      let e : RangerAppEnum? = ctx.getEnum(n : rootObjName)
      if ( e != nil  ) {
        wr.out(str : "" + String(((e!.values[enumName])!)), newLine : false)
        return;
      }
    }
    var next_is_gs : Bool = false
    /** unused:  let last_was_setter : Bool = false   **/ 
    var needs_par : Bool = false
    let ns_len : Int = (node.ns.count) - 1
    if ( (node.nsp.count) > 0 ) {
      var had_static : Bool = false
      for ( i , p ) in node.nsp.enumerated() {
        if ( next_is_gs ) {
          if ( p.isProperty() ) {
            wr.out(str : ".Get_", newLine : false)
            needs_par = true;
          } else {
            needs_par = false;
          }
          next_is_gs = false;
        }
        if ( needs_par == false ) {
          if ( i > 0 ) {
            if ( had_static ) {
              wr.out(str : "_static_", newLine : false)
            } else {
              wr.out(str : ".", newLine : false)
            }
          }
        }
        if ( ctx.isDefinedClass(name : p.nameNode!.type_name) ) {
          let c : RangerAppClassDesc = ctx.findClass(name : p.nameNode!.type_name)
          if ( c.doesInherit() ) {
            next_is_gs = true;
          }
        }
        if ( i == 0 ) {
          let part : String = node.ns[0]
          if ( part == "this" ) {
            wr.out(str : thisName, newLine : false)
            continue;
          }
          if ( (part != thisName) && ctx.isMemberVariable(name : part) ) {
            let cc : RangerAppClassDesc? = ctx.getCurrentClass()
            let currC : RangerAppClassDesc = cc!
            let up : RangerAppParamDesc? = currC.findVariable(f_name : part)
            if ( up != nil  ) {
              /** unused:  let p3 : RangerAppParamDesc = up!   **/ 
              wr.out(str : thisName + ".", newLine : false)
            }
          }
        }
        if ( (p.compiledName.characters.count) > 0 ) {
          wr.out(str : self.adjustType(tn : p.compiledName), newLine : false)
        } else {
          if ( (p.name.characters.count) > 0 ) {
            wr.out(str : self.adjustType(tn : p.name), newLine : false)
          } else {
            wr.out(str : self.adjustType(tn : (node.ns[i])), newLine : false)
          }
        }
        if ( needs_par ) {
          wr.out(str : "()", newLine : false)
          needs_par = false;
        }
        if ( i < ns_len ) {
          if ( p.nameNode!.hasFlag(flagName : "optional") ) {
            wr.out(str : ".value.(", newLine : false)
            self.writeTypeDef(node : p.nameNode!, ctx : ctx, wr : wr)
            wr.out(str : ")", newLine : false)
          }
        }
        if ( p.isClass() ) {
          had_static = true;
        }
      }
      return;
    }
    if ( node.hasParamDesc ) {
      let part_1 : String = node.ns[0]
      if ( (part_1 != thisName) && ctx.isMemberVariable(name : part_1) ) {
        let cc_1 : RangerAppClassDesc? = ctx.getCurrentClass()
        let currC_1 : RangerAppClassDesc = cc_1!
        let up_1 : RangerAppParamDesc? = currC_1.findVariable(f_name : part_1)
        if ( up_1 != nil  ) {
          /** unused:  let p3_1 : RangerAppParamDesc = up_1!   **/ 
          wr.out(str : thisName + ".", newLine : false)
        }
      }
      let p_1 : RangerAppParamDesc? = node.paramDesc
      wr.out(str : p_1!.compiledName, newLine : false)
      return;
    }
    var b_was_static : Bool = false
    for ( i_1 , part_2 ) in node.ns.enumerated() {
      if ( i_1 > 0 ) {
        if ( (i_1 == 1) && b_was_static ) {
          wr.out(str : "_static_", newLine : false)
        } else {
          wr.out(str : ".", newLine : false)
        }
      }
      if ( i_1 == 0 ) {
        if ( part_2 == "this" ) {
          wr.out(str : thisName, newLine : false)
          continue;
        }
        if ( ctx.hasClass(name : part_2) ) {
          b_was_static = true;
        }
        if ( (part_2 != "this") && ctx.isMemberVariable(name : part_2) ) {
          let cc_2 : RangerAppClassDesc? = ctx.getCurrentClass()
          let currC_2 : RangerAppClassDesc = cc_2!
          let up_2 : RangerAppParamDesc? = currC_2.findVariable(f_name : part_2)
          if ( up_2 != nil  ) {
            /** unused:  let p3_2 : RangerAppParamDesc = up_2!   **/ 
            wr.out(str : thisName + ".", newLine : false)
          }
        }
      }
      wr.out(str : self.adjustType(tn : part_2), newLine : false)
    }
  }
  func goExtractAssign(value : CodeNode, p : RangerAppParamDesc, ctx : RangerAppWriterContext, wr : CodeWriter) -> Void {
    let arr_node : CodeNode = value.children[1]
    wr.newline()
    wr.out(str : "", newLine : true)
    wr.out(str : "// array_extract operator ", newLine : true)
    wr.out(str : "var ", newLine : false)
    let pArr : RangerAppParamDesc = RangerAppParamDesc()
    pArr.name = "_arrTemp";
    pArr.node = arr_node;
    pArr.nameNode = arr_node;
    pArr.is_optional = false;
    ctx.defineVariable(name : p.name, desc : pArr)
    wr.out(str : pArr.compiledName, newLine : false)
    wr.out(str : " ", newLine : false)
    self.writeTypeDef(node : arr_node, ctx : ctx, wr : wr)
    wr.newline()
    wr.out(str : ((p.compiledName + " , ") + pArr.compiledName) + " = ", newLine : false)
    ctx.setInExpr()
    self.WalkNode(node : value, ctx : ctx, wr : wr)
    ctx.unsetInExpr()
    wr.out(str : ";", newLine : true)
    let left : CodeNode = arr_node
    let a_len : Int = (left.ns.count) - 1
    /** unused:  let last_part : String = left.ns[a_len]   **/ 
    var next_is_gs : Bool = false
    var last_was_setter : Bool = false
    var needs_par : Bool = false
    var b_was_static : Bool = false
    for ( i , part ) in left.ns.enumerated() {
      if ( next_is_gs ) {
        if ( i == a_len ) {
          wr.out(str : ".Set_", newLine : false)
          last_was_setter = true;
        } else {
          wr.out(str : ".Get_", newLine : false)
          needs_par = true;
          next_is_gs = false;
          last_was_setter = false;
        }
      }
      if ( (last_was_setter == false) && (needs_par == false) ) {
        if ( i > 0 ) {
          if ( (i == 1) && b_was_static ) {
            wr.out(str : "_static_", newLine : false)
          } else {
            wr.out(str : ".", newLine : false)
          }
        }
      }
      if ( i == 0 ) {
        if ( part == "this" ) {
          wr.out(str : thisName, newLine : false)
          continue;
        }
        if ( ctx.hasClass(name : part) ) {
          b_was_static = true;
        }
        let partDef : RangerAppParamDesc = ctx.getVariableDef(name : part)
        if ( partDef.nameNode != nil  ) {
          if ( ctx.isDefinedClass(name : partDef.nameNode!.type_name) ) {
            let c : RangerAppClassDesc = ctx.findClass(name : partDef.nameNode!.type_name)
            if ( c.doesInherit() ) {
              next_is_gs = true;
            }
          }
        }
        if ( (part != "this") && ctx.isMemberVariable(name : part) ) {
          let cc : RangerAppClassDesc? = ctx.getCurrentClass()
          let currC : RangerAppClassDesc = cc!
          let up : RangerAppParamDesc? = currC.findVariable(f_name : part)
          if ( up != nil  ) {
            /** unused:  let p3 : RangerAppParamDesc = up!   **/ 
            wr.out(str : thisName + ".", newLine : false)
          }
        }
      }
      if ( (left.nsp.count) > 0 ) {
        let p_1 : RangerAppParamDesc = left.nsp[i]
        wr.out(str : self.adjustType(tn : p_1.compiledName), newLine : false)
      } else {
        if ( left.hasParamDesc ) {
          wr.out(str : left.paramDesc!.compiledName, newLine : false)
        } else {
          wr.out(str : self.adjustType(tn : part), newLine : false)
        }
      }
      if ( needs_par ) {
        wr.out(str : "()", newLine : false)
        needs_par = false;
      }
      if ( (left.nsp.count) >= (i + 1) ) {
        let pp : RangerAppParamDesc = left.nsp[i]
        if ( pp.nameNode!.hasFlag(flagName : "optional") ) {
          wr.out(str : ".value.(", newLine : false)
          self.writeTypeDef(node : pp.nameNode!, ctx : ctx, wr : wr)
          wr.out(str : ")", newLine : false)
        }
      }
    }
    if ( last_was_setter ) {
      wr.out(str : "(", newLine : false)
      wr.out(str : pArr.compiledName, newLine : false)
      wr.out(str : "); ", newLine : true)
    } else {
      wr.out(str : " = ", newLine : false)
      wr.out(str : pArr.compiledName, newLine : false)
      wr.out(str : "; ", newLine : true)
    }
    wr.out(str : "", newLine : true)
  }
  func writeStructField(node : CodeNode, ctx : RangerAppWriterContext, wr : CodeWriter) -> Void {
    if ( node.hasParamDesc ) {
      let nn : CodeNode = node.children[1]
      let p : RangerAppParamDesc? = nn.paramDesc
      wr.out(str : p!.compiledName + " ", newLine : false)
      if ( p!.nameNode!.hasFlag(flagName : "optional") ) {
        wr.out(str : "*GoNullable", newLine : false)
      } else {
        self.writeTypeDef(node : p!.nameNode!, ctx : ctx, wr : wr)
      }
      if ( p!.ref_cnt == 0 ) {
        wr.out(str : " /**  unused  **/ ", newLine : false)
      }
      wr.out(str : "", newLine : true)
      if ( p!.nameNode!.hasFlag(flagName : "optional") ) {
      }
    }
  }
  override func writeVarDef(node : CodeNode, ctx : RangerAppWriterContext, wr : CodeWriter) -> Void {
    if ( node.hasParamDesc ) {
      let nn : CodeNode = node.children[1]
      let p : RangerAppParamDesc? = nn.paramDesc
      var b_not_used : Bool = false
      if ( (p!.ref_cnt == 0) && (p!.is_class_variable == false) ) {
        wr.out(str : ("/** unused:  " + p!.compiledName) + "*/", newLine : true)
        b_not_used = true;
        return;
      }
      let map_or_hash : Bool = (nn.value_type == 6) || (nn.value_type == 7)
      if ( nn.hasFlag(flagName : "optional") ) {
        wr.out(str : ("var " + p!.compiledName) + " *GoNullable = new(GoNullable); ", newLine : true)
        if ( (node.children.count) > 2 ) {
          let value : CodeNode = node.children[2]
          if ( value.hasParamDesc ) {
            let pnn : CodeNode? = value.paramDesc!.nameNode
            if ( pnn!.hasFlag(flagName : "optional") ) {
              wr.out(str : p!.compiledName + ".value = ", newLine : false)
              ctx.setInExpr()
              let value_1 : CodeNode = node.getThird()
              self.WalkNode(node : value_1, ctx : ctx, wr : wr)
              ctx.unsetInExpr()
              wr.out(str : ".value;", newLine : true)
              wr.out(str : p!.compiledName + ".has_value = ", newLine : false)
              ctx.setInExpr()
              let value_2 : CodeNode = node.getThird()
              self.WalkNode(node : value_2, ctx : ctx, wr : wr)
              ctx.unsetInExpr()
              wr.out(str : ".has_value;", newLine : true)
              return;
            } else {
              wr.out(str : p!.compiledName + ".value = ", newLine : false)
              ctx.setInExpr()
              let value_3 : CodeNode = node.getThird()
              self.WalkNode(node : value_3, ctx : ctx, wr : wr)
              ctx.unsetInExpr()
              wr.out(str : ";", newLine : true)
              wr.out(str : p!.compiledName + ".has_value = true;", newLine : true)
              return;
            }
          } else {
            wr.out(str : p!.compiledName + " = ", newLine : false)
            ctx.setInExpr()
            let value_4 : CodeNode = node.getThird()
            self.WalkNode(node : value_4, ctx : ctx, wr : wr)
            ctx.unsetInExpr()
            wr.out(str : ";", newLine : true)
            return;
          }
        }
        return;
      } else {
        if ( ((p!.set_cnt > 0) || p!.is_class_variable) || map_or_hash ) {
          wr.out(str : ("var " + p!.compiledName) + " ", newLine : false)
        } else {
          wr.out(str : ("var " + p!.compiledName) + " ", newLine : false)
        }
      }
      self.writeTypeDef2(node : p!.nameNode!, ctx : ctx, wr : wr)
      if ( (node.children.count) > 2 ) {
        let value_5 : CodeNode = node.getThird()
        if ( value_5.expression && ((value_5.children.count) > 1) ) {
          let fc : CodeNode = value_5.children[0]
          if ( fc.vref == "array_extract" ) {
            self.goExtractAssign(value : value_5, p : p!, ctx : ctx, wr : wr)
            return;
          }
        }
        wr.out(str : " = ", newLine : false)
        ctx.setInExpr()
        self.WalkNode(node : value_5, ctx : ctx, wr : wr)
        ctx.unsetInExpr()
      } else {
        if ( nn.value_type == 6 ) {
          wr.out(str : " = make(", newLine : false)
          self.writeTypeDef(node : p!.nameNode!, ctx : ctx, wr : wr)
          wr.out(str : ", 0)", newLine : false)
        }
        if ( nn.value_type == 7 ) {
          wr.out(str : " = make(", newLine : false)
          self.writeTypeDef(node : p!.nameNode!, ctx : ctx, wr : wr)
          wr.out(str : ")", newLine : false)
        }
      }
      wr.out(str : ";", newLine : false)
      if ( (p!.ref_cnt == 0) && (p!.is_class_variable == true) ) {
        wr.out(str : "     /** note: unused */", newLine : false)
      }
      if ( (p!.ref_cnt == 0) && (p!.is_class_variable == false) ) {
        wr.out(str : "   **/ ", newLine : true)
      } else {
        wr.newline()
      }
      if ( b_not_used == false ) {
        if ( nn.hasFlag(flagName : "optional") ) {
          wr.addImport(name : "errors")
        }
      }
    }
  }
  func writeArgsDef(fnDesc : RangerAppFunctionDesc, ctx : RangerAppWriterContext, wr : CodeWriter) -> Void {
    for ( i , arg ) in fnDesc.params.enumerated() {
      if ( i > 0 ) {
        wr.out(str : ", ", newLine : false)
      }
      wr.out(str : arg.name + " ", newLine : false)
      if ( arg.nameNode!.hasFlag(flagName : "optional") ) {
        wr.out(str : "*GoNullable", newLine : false)
      } else {
        self.writeTypeDef(node : arg.nameNode!, ctx : ctx, wr : wr)
      }
    }
  }
  override func writeNewCall(node : CodeNode, ctx : RangerAppWriterContext, wr : CodeWriter) -> Void {
    if ( node.hasNewOper ) {
      let cl : RangerAppClassDesc? = node.clDesc
      /** unused:  let fc : CodeNode = node.getSecond()   **/ 
      wr.out(str : ("CreateNew_" + node.clDesc!.name) + "(", newLine : false)
      let constr : RangerAppFunctionDesc? = cl!.constructor_fn
      let givenArgs : CodeNode = node.getThird()
      if ( constr != nil  ) {
        for ( i , arg ) in constr!.params.enumerated() {
          let n : CodeNode = givenArgs.children[i]
          if ( i > 0 ) {
            wr.out(str : ", ", newLine : false)
          }
          if ( true || (arg.nameNode != nil ) ) {
            self.WalkNode(node : n, ctx : ctx, wr : wr)
          }
        }
      }
      wr.out(str : ")", newLine : false)
    }
  }
  override func CreateLambdaCall(node : CodeNode, ctx : RangerAppWriterContext, wr : CodeWriter) -> Void {
    let fName : CodeNode = node.children[0]
    let args : CodeNode = node.children[1]
    self.WriteVRef(node : fName, ctx : ctx, wr : wr)
    wr.out(str : "(", newLine : false)
    for ( i , arg ) in args.children.enumerated() {
      if ( i > 0 ) {
        wr.out(str : ", ", newLine : false)
      }
      if ( arg.value_type != 0 ) {
        self.WalkNode(node : arg, ctx : ctx, wr : wr)
      }
    }
    wr.out(str : ")", newLine : false)
    if ( ctx.expressionLevel() == 0 ) {
      wr.out(str : ";", newLine : true)
    }
  }
  override func CreateLambda(node : CodeNode, ctx : RangerAppWriterContext, wr : CodeWriter) -> Void {
    let lambdaCtx : RangerAppWriterContext = node.lambda_ctx!
    let fnNode : CodeNode = node.children[0]
    let args : CodeNode = node.children[1]
    let body : CodeNode = node.children[2]
    wr.out(str : "func (", newLine : false)
    for ( i , arg ) in args.children.enumerated() {
      if ( i > 0 ) {
        wr.out(str : ", ", newLine : false)
      }
      self.WalkNode(node : arg, ctx : lambdaCtx, wr : wr)
      wr.out(str : " ", newLine : false)
      if ( arg.hasFlag(flagName : "optional") ) {
        wr.out(str : "*GoNullable", newLine : false)
      } else {
        self.writeTypeDef(node : arg, ctx : lambdaCtx, wr : wr)
      }
    }
    wr.out(str : ") ", newLine : false)
    if ( fnNode.hasFlag(flagName : "optional") ) {
      wr.out(str : "*GoNullable", newLine : false)
    } else {
      self.writeTypeDef(node : fnNode, ctx : lambdaCtx, wr : wr)
    }
    wr.out(str : " {", newLine : true)
    wr.indent(delta : 1)
    lambdaCtx.restartExpressionLevel()
    for ( _ , item ) in body.children.enumerated() {
      self.WalkNode(node : item, ctx : lambdaCtx, wr : wr)
    }
    wr.newline()
    wr.indent(delta : -1)
    wr.out(str : "}", newLine : false)
  }
  override func CustomOperator(node : CodeNode, ctx : RangerAppWriterContext, wr : CodeWriter) -> Void {
    let fc : CodeNode = node.getFirst()
    let cmd : String = fc.vref
    if ( ((cmd == "=") || (cmd == "push")) || (cmd == "removeLast") ) {
      let left : CodeNode = node.getSecond()
      var right : CodeNode = left
      if ( (cmd == "=") || (cmd == "push") ) {
        right = node.getThird();
      }
      wr.newline()
      var b_was_static : Bool = false
      if ( left.hasParamDesc ) {
        let a_len : Int = (left.ns.count) - 1
        /** unused:  let last_part : String = left.ns[a_len]   **/ 
        var next_is_gs : Bool = false
        var last_was_setter : Bool = false
        var needs_par : Bool = false
        for ( i , part ) in left.ns.enumerated() {
          if ( next_is_gs ) {
            if ( i == a_len ) {
              wr.out(str : ".Set_", newLine : false)
              last_was_setter = true;
            } else {
              wr.out(str : ".Get_", newLine : false)
              needs_par = true;
              next_is_gs = false;
              last_was_setter = false;
            }
          }
          if ( (last_was_setter == false) && (needs_par == false) ) {
            if ( i > 0 ) {
              if ( (i == 1) && b_was_static ) {
                wr.out(str : "_static_", newLine : false)
              } else {
                wr.out(str : ".", newLine : false)
              }
            }
          }
          if ( i == 0 ) {
            if ( part == "this" ) {
              wr.out(str : thisName, newLine : false)
              continue;
            }
            if ( ctx.hasClass(name : part) ) {
              b_was_static = true;
            }
            if ( (part != "this") && ctx.isMemberVariable(name : part) ) {
              let cc : RangerAppClassDesc? = ctx.getCurrentClass()
              let currC : RangerAppClassDesc = cc!
              let up : RangerAppParamDesc? = currC.findVariable(f_name : part)
              if ( up != nil  ) {
                /** unused:  let p3 : RangerAppParamDesc = up!   **/ 
                wr.out(str : thisName + ".", newLine : false)
              }
            }
          }
          var partDef : RangerAppParamDesc = ctx.getVariableDef(name : part)
          if ( (left.nsp.count) > i ) {
            partDef = left.nsp[i];
          }
          if ( partDef.nameNode != nil  ) {
            if ( ctx.isDefinedClass(name : partDef.nameNode!.type_name) ) {
              let c : RangerAppClassDesc = ctx.findClass(name : partDef.nameNode!.type_name)
              if ( c.doesInherit() ) {
                next_is_gs = true;
              }
            }
          }
          if ( (left.nsp.count) > 0 ) {
            let p : RangerAppParamDesc = left.nsp[i]
            wr.out(str : self.adjustType(tn : p.compiledName), newLine : false)
          } else {
            if ( left.hasParamDesc ) {
              wr.out(str : left.paramDesc!.compiledName, newLine : false)
            } else {
              wr.out(str : self.adjustType(tn : part), newLine : false)
            }
          }
          if ( needs_par ) {
            wr.out(str : "()", newLine : false)
            needs_par = false;
          }
          if ( (left.nsp.count) >= (i + 1) ) {
            let pp : RangerAppParamDesc = left.nsp[i]
            if ( pp.nameNode!.hasFlag(flagName : "optional") ) {
              wr.out(str : ".value.(", newLine : false)
              self.writeTypeDef(node : pp.nameNode!, ctx : ctx, wr : wr)
              wr.out(str : ")", newLine : false)
            }
          }
        }
        if ( cmd == "removeLast" ) {
          if ( last_was_setter ) {
            wr.out(str : "(", newLine : false)
            ctx.setInExpr()
            self.WalkNode(node : left, ctx : ctx, wr : wr)
            wr.out(str : "[:len(", newLine : false)
            self.WalkNode(node : left, ctx : ctx, wr : wr)
            wr.out(str : ")-1]", newLine : false)
            ctx.unsetInExpr()
            wr.out(str : "); ", newLine : true)
          } else {
            wr.out(str : " = ", newLine : false)
            ctx.setInExpr()
            self.WalkNode(node : left, ctx : ctx, wr : wr)
            wr.out(str : "[:len(", newLine : false)
            self.WalkNode(node : left, ctx : ctx, wr : wr)
            wr.out(str : ")-1]", newLine : false)
            ctx.unsetInExpr()
            wr.out(str : "; ", newLine : true)
          }
          return;
        }
        if ( cmd == "push" ) {
          if ( last_was_setter ) {
            wr.out(str : "(", newLine : false)
            ctx.setInExpr()
            wr.out(str : "append(", newLine : false)
            self.WalkNode(node : left, ctx : ctx, wr : wr)
            wr.out(str : ",", newLine : false)
            self.WalkNode(node : right, ctx : ctx, wr : wr)
            ctx.unsetInExpr()
            wr.out(str : ")); ", newLine : true)
          } else {
            wr.out(str : " = ", newLine : false)
            wr.out(str : "append(", newLine : false)
            ctx.setInExpr()
            self.WalkNode(node : left, ctx : ctx, wr : wr)
            wr.out(str : ",", newLine : false)
            self.WalkNode(node : right, ctx : ctx, wr : wr)
            ctx.unsetInExpr()
            wr.out(str : "); ", newLine : true)
          }
          return;
        }
        if ( last_was_setter ) {
          wr.out(str : "(", newLine : false)
          ctx.setInExpr()
          self.WalkNode(node : right, ctx : ctx, wr : wr)
          ctx.unsetInExpr()
          wr.out(str : "); ", newLine : true)
        } else {
          wr.out(str : " = ", newLine : false)
          ctx.setInExpr()
          self.WalkNode(node : right, ctx : ctx, wr : wr)
          ctx.unsetInExpr()
          wr.out(str : "; ", newLine : true)
        }
        return;
      }
      self.WriteSetterVRef(node : left, ctx : ctx, wr : wr)
      wr.out(str : " = ", newLine : false)
      ctx.setInExpr()
      self.WalkNode(node : right, ctx : ctx, wr : wr)
      ctx.unsetInExpr()
      wr.out(str : "; /* custom */", newLine : true)
    }
  }
  override func writeInterface(cl : RangerAppClassDesc, ctx : RangerAppWriterContext, wr : CodeWriter) -> Void {
    wr.out(str : ("type " + cl.name) + " interface { ", newLine : true)
    wr.indent(delta : 1)
    for ( _ , fnVar ) in cl.defined_variants.enumerated() {
      let mVs : RangerAppMethodVariants? = cl.method_variants[fnVar]
      for ( _ , variant ) in mVs!.variants.enumerated() {
        wr.out(str : variant.compiledName + "(", newLine : false)
        self.writeArgsDef(fnDesc : variant, ctx : ctx, wr : wr)
        wr.out(str : ") ", newLine : false)
        if ( variant.nameNode!.hasFlag(flagName : "optional") ) {
          wr.out(str : "*GoNullable", newLine : false)
        } else {
          self.writeTypeDef(node : variant.nameNode!, ctx : ctx, wr : wr)
        }
        wr.out(str : "", newLine : true)
      }
    }
    wr.indent(delta : -1)
    wr.out(str : "}", newLine : true)
  }
  override func writeClass(node : CodeNode, ctx : RangerAppWriterContext, wr orig_wr : CodeWriter) -> Void {
    let cl : RangerAppClassDesc? = node.clDesc
    if ( cl == nil ) {
      return;
    }
    let wr : CodeWriter = orig_wr
    if ( did_write_nullable == false ) {
      wr.raw(str : "\r\ntype GoNullable struct { \r\n  value interface{}\r\n  has_value bool", newLine : true)
      _ = wr.createTag(name : "utilities")
      did_write_nullable = true;
    }
    var declaredVariable : [String:Bool] = [String:Bool]()
    wr.out(str : ("type " + cl!.name) + " struct { ", newLine : true)
    wr.indent(delta : 1)
    for ( _ , pvar ) in cl!.variables.enumerated() {
      self.writeStructField(node : pvar.node!, ctx : ctx, wr : wr)
      declaredVariable[pvar.name] = true
    }
    if ( (cl!.extends_classes.count) > 0 ) {
      for ( _ , pName ) in cl!.extends_classes.enumerated() {
        let pC : RangerAppClassDesc = ctx.findClass(name : pName)
        wr.out(str : "// inherited from parent class " + pName, newLine : true)
        for ( _ , pvar_1 ) in pC.variables.enumerated() {
          if ( declaredVariable[pvar_1.name] != nil ) {
            continue;
          }
          self.writeStructField(node : pvar_1.node!, ctx : ctx, wr : wr)
        }
      }
    }
    wr.indent(delta : -1)
    wr.out(str : "}", newLine : true)
    wr.out(str : ("type IFACE_" + cl!.name) + " interface { ", newLine : true)
    wr.indent(delta : 1)
    for ( _ , p ) in cl!.variables.enumerated() {
      wr.out(str : "Get_", newLine : false)
      wr.out(str : p.compiledName + "() ", newLine : false)
      if ( p.nameNode!.hasFlag(flagName : "optional") ) {
        wr.out(str : "*GoNullable", newLine : false)
      } else {
        self.writeTypeDef(node : p.nameNode!, ctx : ctx, wr : wr)
      }
      wr.out(str : "", newLine : true)
      wr.out(str : "Set_", newLine : false)
      wr.out(str : p.compiledName + "(value ", newLine : false)
      if ( p.nameNode!.hasFlag(flagName : "optional") ) {
        wr.out(str : "*GoNullable", newLine : false)
      } else {
        self.writeTypeDef(node : p.nameNode!, ctx : ctx, wr : wr)
      }
      wr.out(str : ") ", newLine : true)
    }
    for ( _ , fnVar ) in cl!.defined_variants.enumerated() {
      let mVs : RangerAppMethodVariants? = cl!.method_variants[fnVar]
      for ( _ , variant ) in mVs!.variants.enumerated() {
        wr.out(str : variant.compiledName + "(", newLine : false)
        self.writeArgsDef(fnDesc : variant, ctx : ctx, wr : wr)
        wr.out(str : ") ", newLine : false)
        if ( variant.nameNode!.hasFlag(flagName : "optional") ) {
          wr.out(str : "*GoNullable", newLine : false)
        } else {
          self.writeTypeDef(node : variant.nameNode!, ctx : ctx, wr : wr)
        }
        wr.out(str : "", newLine : true)
      }
    }
    wr.indent(delta : -1)
    wr.out(str : "}", newLine : true)
    thisName = "me";
    wr.out(str : "", newLine : true)
    wr.out(str : ("func CreateNew_" + cl!.name) + "(", newLine : false)
    if ( cl!.has_constructor ) {
      let constr : RangerAppFunctionDesc? = cl!.constructor_fn
      for ( i_6 , arg ) in constr!.params.enumerated() {
        if ( i_6 > 0 ) {
          wr.out(str : ", ", newLine : false)
        }
        wr.out(str : arg.name + " ", newLine : false)
        self.writeTypeDef(node : arg.nameNode!, ctx : ctx, wr : wr)
      }
    }
    wr.out(str : (") *" + cl!.name) + " {", newLine : true)
    wr.indent(delta : 1)
    wr.newline()
    wr.out(str : ("me := new(" + cl!.name) + ")", newLine : true)
    for ( _ , pvar_2 ) in cl!.variables.enumerated() {
      let nn : CodeNode = pvar_2.node!
      if ( (nn.children.count) > 2 ) {
        let valueNode : CodeNode = nn.children[2]
        wr.out(str : ("me." + pvar_2.compiledName) + " = ", newLine : false)
        self.WalkNode(node : valueNode, ctx : ctx, wr : wr)
        wr.out(str : "", newLine : true)
      } else {
        let pNameN : CodeNode? = pvar_2.nameNode
        if ( pNameN!.value_type == 6 ) {
          wr.out(str : ("me." + pvar_2.compiledName) + " = ", newLine : false)
          wr.out(str : "make(", newLine : false)
          self.writeTypeDef(node : pvar_2.nameNode!, ctx : ctx, wr : wr)
          wr.out(str : ",0)", newLine : true)
        }
        if ( pNameN!.value_type == 7 ) {
          wr.out(str : ("me." + pvar_2.compiledName) + " = ", newLine : false)
          wr.out(str : "make(", newLine : false)
          self.writeTypeDef(node : pvar_2.nameNode!, ctx : ctx, wr : wr)
          wr.out(str : ")", newLine : true)
        }
      }
    }
    for ( _ , pvar_3 ) in cl!.variables.enumerated() {
      if ( pvar_3.nameNode!.hasFlag(flagName : "optional") ) {
        wr.out(str : ("me." + pvar_3.compiledName) + " = new(GoNullable);", newLine : true)
      }
    }
    if ( (cl!.extends_classes.count) > 0 ) {
      for ( _ , pName_1 ) in cl!.extends_classes.enumerated() {
        let pC_1 : RangerAppClassDesc = ctx.findClass(name : pName_1)
        for ( _ , pvar_4 ) in pC_1.variables.enumerated() {
          let nn_1 : CodeNode = pvar_4.node!
          if ( (nn_1.children.count) > 2 ) {
            let valueNode_1 : CodeNode = nn_1.children[2]
            wr.out(str : ("me." + pvar_4.compiledName) + " = ", newLine : false)
            self.WalkNode(node : valueNode_1, ctx : ctx, wr : wr)
            wr.out(str : "", newLine : true)
          } else {
            let pNameN_1 : CodeNode = pvar_4.nameNode!
            if ( pNameN_1.value_type == 6 ) {
              wr.out(str : ("me." + pvar_4.compiledName) + " = ", newLine : false)
              wr.out(str : "make(", newLine : false)
              self.writeTypeDef(node : pvar_4.nameNode!, ctx : ctx, wr : wr)
              wr.out(str : ",0)", newLine : true)
            }
            if ( pNameN_1.value_type == 7 ) {
              wr.out(str : ("me." + pvar_4.compiledName) + " = ", newLine : false)
              wr.out(str : "make(", newLine : false)
              self.writeTypeDef(node : pvar_4.nameNode!, ctx : ctx, wr : wr)
              wr.out(str : ")", newLine : true)
            }
          }
        }
        for ( _ , pvar_5 ) in pC_1.variables.enumerated() {
          if ( pvar_5.nameNode!.hasFlag(flagName : "optional") ) {
            wr.out(str : ("me." + pvar_5.compiledName) + " = new(GoNullable);", newLine : true)
          }
        }
        if ( pC_1.has_constructor ) {
          let constr_1 : RangerAppFunctionDesc? = pC_1.constructor_fn
          let subCtx : RangerAppWriterContext = constr_1!.fnCtx!
          subCtx.is_function = true;
          self.WalkNode(node : constr_1!.fnBody!, ctx : subCtx, wr : wr)
        }
      }
    }
    if ( cl!.has_constructor ) {
      let constr_2 : RangerAppFunctionDesc? = cl!.constructor_fn
      let subCtx_1 : RangerAppWriterContext = constr_2!.fnCtx!
      subCtx_1.is_function = true;
      self.WalkNode(node : constr_2!.fnBody!, ctx : subCtx_1, wr : wr)
    }
    wr.out(str : "return me;", newLine : true)
    wr.indent(delta : -1)
    wr.out(str : "}", newLine : true)
    thisName = "this";
    for ( _ , variant_1 ) in cl!.static_methods.enumerated() {
      if ( variant_1.nameNode!.hasFlag(flagName : "main") ) {
        continue;
      }
      wr.newline()
      wr.out(str : ((("func " + cl!.name) + "_static_") + variant_1.compiledName) + "(", newLine : false)
      self.writeArgsDef(fnDesc : variant_1, ctx : ctx, wr : wr)
      wr.out(str : ") ", newLine : false)
      self.writeTypeDef(node : variant_1.nameNode!, ctx : ctx, wr : wr)
      wr.out(str : " {", newLine : true)
      wr.indent(delta : 1)
      wr.newline()
      let subCtx_2 : RangerAppWriterContext = variant_1.fnCtx!
      subCtx_2.is_function = true;
      self.WalkNode(node : variant_1.fnBody!, ctx : subCtx_2, wr : wr)
      wr.newline()
      wr.indent(delta : -1)
      wr.out(str : "}", newLine : true)
    }
    var declaredFn : [String:Bool] = [String:Bool]()
    for ( _ , fnVar_1 ) in cl!.defined_variants.enumerated() {
      let mVs_1 : RangerAppMethodVariants? = cl!.method_variants[fnVar_1]
      for ( _ , variant_2 ) in mVs_1!.variants.enumerated() {
        declaredFn[variant_2.name] = true
        wr.out(str : ((("func (this *" + cl!.name) + ") ") + variant_2.compiledName) + " (", newLine : false)
        self.writeArgsDef(fnDesc : variant_2, ctx : ctx, wr : wr)
        wr.out(str : ") ", newLine : false)
        if ( variant_2.nameNode!.hasFlag(flagName : "optional") ) {
          wr.out(str : "*GoNullable", newLine : false)
        } else {
          self.writeTypeDef(node : variant_2.nameNode!, ctx : ctx, wr : wr)
        }
        wr.out(str : " {", newLine : true)
        wr.indent(delta : 1)
        wr.newline()
        let subCtx_3 : RangerAppWriterContext = variant_2.fnCtx!
        subCtx_3.is_function = true;
        self.WalkNode(node : variant_2.fnBody!, ctx : subCtx_3, wr : wr)
        wr.newline()
        wr.indent(delta : -1)
        wr.out(str : "}", newLine : true)
      }
    }
    if ( (cl!.extends_classes.count) > 0 ) {
      for ( _ , pName_2 ) in cl!.extends_classes.enumerated() {
        let pC_2 : RangerAppClassDesc = ctx.findClass(name : pName_2)
        wr.out(str : "// inherited methods from parent class " + pName_2, newLine : true)
        for ( _ , fnVar_2 ) in pC_2.defined_variants.enumerated() {
          let mVs_2 : RangerAppMethodVariants? = pC_2.method_variants[fnVar_2]
          for ( _ , variant_3 ) in mVs_2!.variants.enumerated() {
            if ( declaredFn[variant_3.name] != nil ) {
              continue;
            }
            wr.out(str : ((("func (this *" + cl!.name) + ") ") + variant_3.compiledName) + " (", newLine : false)
            self.writeArgsDef(fnDesc : variant_3, ctx : ctx, wr : wr)
            wr.out(str : ") ", newLine : false)
            if ( variant_3.nameNode!.hasFlag(flagName : "optional") ) {
              wr.out(str : "*GoNullable", newLine : false)
            } else {
              self.writeTypeDef(node : variant_3.nameNode!, ctx : ctx, wr : wr)
            }
            wr.out(str : " {", newLine : true)
            wr.indent(delta : 1)
            wr.newline()
            let subCtx_4 : RangerAppWriterContext = variant_3.fnCtx!
            subCtx_4.is_function = true;
            self.WalkNode(node : variant_3.fnBody!, ctx : subCtx_4, wr : wr)
            wr.newline()
            wr.indent(delta : -1)
            wr.out(str : "}", newLine : true)
          }
        }
      }
    }
    var declaredGetter : [String:Bool] = [String:Bool]()
    for ( _ , p_1 ) in cl!.variables.enumerated() {
      declaredGetter[p_1.name] = true
      wr.newline()
      wr.out(str : "// getter for variable " + p_1.name, newLine : true)
      wr.out(str : ("func (this *" + cl!.name) + ") ", newLine : false)
      wr.out(str : "Get_", newLine : false)
      wr.out(str : p_1.compiledName + "() ", newLine : false)
      if ( p_1.nameNode!.hasFlag(flagName : "optional") ) {
        wr.out(str : "*GoNullable", newLine : false)
      } else {
        self.writeTypeDef(node : p_1.nameNode!, ctx : ctx, wr : wr)
      }
      wr.out(str : " {", newLine : true)
      wr.indent(delta : 1)
      wr.out(str : "return this." + p_1.compiledName, newLine : true)
      wr.indent(delta : -1)
      wr.out(str : "}", newLine : true)
      wr.newline()
      wr.out(str : "// setter for variable " + p_1.name, newLine : true)
      wr.out(str : ("func (this *" + cl!.name) + ") ", newLine : false)
      wr.out(str : "Set_", newLine : false)
      wr.out(str : p_1.compiledName + "( value ", newLine : false)
      if ( p_1.nameNode!.hasFlag(flagName : "optional") ) {
        wr.out(str : "*GoNullable", newLine : false)
      } else {
        self.writeTypeDef(node : p_1.nameNode!, ctx : ctx, wr : wr)
      }
      wr.out(str : ") ", newLine : false)
      wr.out(str : " {", newLine : true)
      wr.indent(delta : 1)
      wr.out(str : ("this." + p_1.compiledName) + " = value ", newLine : true)
      wr.indent(delta : -1)
      wr.out(str : "}", newLine : true)
    }
    if ( (cl!.extends_classes.count) > 0 ) {
      for ( _ , pName_3 ) in cl!.extends_classes.enumerated() {
        let pC_3 : RangerAppClassDesc = ctx.findClass(name : pName_3)
        wr.out(str : "// inherited getters and setters from the parent class " + pName_3, newLine : true)
        for ( _ , p_2 ) in pC_3.variables.enumerated() {
          if ( declaredGetter[p_2.name] != nil ) {
            continue;
          }
          wr.newline()
          wr.out(str : "// getter for variable " + p_2.name, newLine : true)
          wr.out(str : ("func (this *" + cl!.name) + ") ", newLine : false)
          wr.out(str : "Get_", newLine : false)
          wr.out(str : p_2.compiledName + "() ", newLine : false)
          if ( p_2.nameNode!.hasFlag(flagName : "optional") ) {
            wr.out(str : "*GoNullable", newLine : false)
          } else {
            self.writeTypeDef(node : p_2.nameNode!, ctx : ctx, wr : wr)
          }
          wr.out(str : " {", newLine : true)
          wr.indent(delta : 1)
          wr.out(str : "return this." + p_2.compiledName, newLine : true)
          wr.indent(delta : -1)
          wr.out(str : "}", newLine : true)
          wr.newline()
          wr.out(str : "// getter for variable " + p_2.name, newLine : true)
          wr.out(str : ("func (this *" + cl!.name) + ") ", newLine : false)
          wr.out(str : "Set_", newLine : false)
          wr.out(str : p_2.compiledName + "( value ", newLine : false)
          if ( p_2.nameNode!.hasFlag(flagName : "optional") ) {
            wr.out(str : "*GoNullable", newLine : false)
          } else {
            self.writeTypeDef(node : p_2.nameNode!, ctx : ctx, wr : wr)
          }
          wr.out(str : ") ", newLine : false)
          wr.out(str : " {", newLine : true)
          wr.indent(delta : 1)
          wr.out(str : ("this." + p_2.compiledName) + " = value ", newLine : true)
          wr.indent(delta : -1)
          wr.out(str : "}", newLine : true)
        }
      }
    }
    for ( _ , variant_4 ) in cl!.static_methods.enumerated() {
      if ( variant_4.nameNode!.hasFlag(flagName : "main") && (variant_4.nameNode!.code!.filename == ctx.getRootFile()) ) {
        wr.out(str : "func main() {", newLine : true)
        wr.indent(delta : 1)
        wr.newline()
        let subCtx_5 : RangerAppWriterContext = variant_4.fnCtx!
        subCtx_5.is_function = true;
        self.WalkNode(node : variant_4.fnBody!, ctx : subCtx_5, wr : wr)
        wr.newline()
        wr.indent(delta : -1)
        wr.out(str : "}", newLine : true)
      }
    }
  }
}
func ==(l: RangerPHPClassWriter, r: RangerPHPClassWriter) -> Bool {
  return l === r
}
class RangerPHPClassWriter : RangerGenericClassWriter { 
  // WAS DECLARED : compiler
  var thisName : String = "this"
  var wrote_header : Bool = false
  override func adjustType(tn : String) -> String {
    if ( tn == "this" ) {
      return "this";
    }
    return tn;
  }
  override func EncodeString(node : CodeNode, ctx : RangerAppWriterContext, wr : CodeWriter) -> String {
    /** unused:  let encoded_str : String = ""   **/ 
    let str_length : Int = node.string_value.characters.count
    var encoded_str_2 : String = ""
    var ii : Int = 0
    while (ii < str_length) {
      let cc : Int = Int( ( node.string_value as NSString ).character( at: ii ) )
      switch (cc) {
        case 8 : 
          encoded_str_2 = (encoded_str_2 + ((String( Character( UnicodeScalar(92 )! ))))) + ((String( Character( UnicodeScalar(98 )! ))));
        case 9 : 
          encoded_str_2 = (encoded_str_2 + ((String( Character( UnicodeScalar(92 )! ))))) + ((String( Character( UnicodeScalar(116 )! ))));
        case 10 : 
          encoded_str_2 = (encoded_str_2 + ((String( Character( UnicodeScalar(92 )! ))))) + ((String( Character( UnicodeScalar(110 )! ))));
        case 12 : 
          encoded_str_2 = (encoded_str_2 + ((String( Character( UnicodeScalar(92 )! ))))) + ((String( Character( UnicodeScalar(102 )! ))));
        case 13 : 
          encoded_str_2 = (encoded_str_2 + ((String( Character( UnicodeScalar(92 )! ))))) + ((String( Character( UnicodeScalar(114 )! ))));
        case 34 : 
          encoded_str_2 = (encoded_str_2 + ((String( Character( UnicodeScalar(92 )! ))))) + ((String( Character( UnicodeScalar(34 )! ))));
        case 36 : 
          encoded_str_2 = (encoded_str_2 + ((String( Character( UnicodeScalar(92 )! ))))) + ((String( Character( UnicodeScalar(34 )! ))));
        case 92 : 
          encoded_str_2 = (encoded_str_2 + ((String( Character( UnicodeScalar(92 )! ))))) + ((String( Character( UnicodeScalar(92 )! ))));
        default: 
          encoded_str_2 = encoded_str_2 + ((String( Character( UnicodeScalar(cc )! ))));
          break;
      }
      ii = ii + 1;
    }
    return encoded_str_2;
  }
  override func WriteScalarValue(node : CodeNode, ctx : RangerAppWriterContext, wr : CodeWriter) -> Void {
    switch (node.value_type) {
      case 2 : 
        wr.out(str : "" + String(node.double_value), newLine : false)
      case 4 : 
        let s : String = self.EncodeString(node : node, ctx : ctx, wr : wr)
        wr.out(str : ("\"" + s) + "\"", newLine : false)
      case 3 : 
        wr.out(str : "" + String(node.int_value), newLine : false)
      case 5 : 
        if ( node.boolean_value ) {
          wr.out(str : "true", newLine : false)
        } else {
          wr.out(str : "false", newLine : false)
        }
      default :
        break
    }
  }
  override func WriteVRef(node : CodeNode, ctx : RangerAppWriterContext, wr : CodeWriter) -> Void {
    if ( node.vref == "this" ) {
      wr.out(str : "$this", newLine : false)
      return;
    }
    if ( node.eval_type == 11 ) {
      if ( (node.ns.count) > 1 ) {
        let rootObjName : String = node.ns[0]
        let enumName : String = node.ns[1]
        let e : RangerAppEnum? = ctx.getEnum(n : rootObjName)
        if ( e != nil  ) {
          wr.out(str : "" + String(((e!.values[enumName])!)), newLine : false)
          return;
        }
      }
    }
    if ( (node.nsp.count) > 0 ) {
      for ( i , p ) in node.nsp.enumerated() {
        if ( i == 0 ) {
          let part : String = node.ns[0]
          if ( part == "this" ) {
            wr.out(str : "$this", newLine : false)
            continue;
          }
        }
        if ( i > 0 ) {
          wr.out(str : "->", newLine : false)
        }
        if ( i == 0 ) {
          wr.out(str : "$", newLine : false)
          if ( p.nameNode!.hasFlag(flagName : "optional") ) {
          }
          let part_1 : String = node.ns[0]
          if ( (part_1 != "this") && ctx.isMemberVariable(name : part_1) ) {
            let uc : RangerAppClassDesc? = ctx.getCurrentClass()
            let currC : RangerAppClassDesc = uc!
            let up : RangerAppParamDesc? = currC.findVariable(f_name : part_1)
            if ( up != nil  ) {
              if ( false == ctx.isInStatic() ) {
                wr.out(str : thisName + "->", newLine : false)
              }
            }
          }
        }
        if ( (p.compiledName.characters.count) > 0 ) {
          wr.out(str : self.adjustType(tn : p.compiledName), newLine : false)
        } else {
          if ( (p.name.characters.count) > 0 ) {
            wr.out(str : self.adjustType(tn : p.name), newLine : false)
          } else {
            wr.out(str : self.adjustType(tn : (node.ns[i])), newLine : false)
          }
        }
      }
      return;
    }
    if ( node.hasParamDesc ) {
      wr.out(str : "$", newLine : false)
      let part_2 : String = node.ns[0]
      if ( (part_2 != "this") && ctx.isMemberVariable(name : part_2) ) {
        let uc_1 : RangerAppClassDesc? = ctx.getCurrentClass()
        let currC_1 : RangerAppClassDesc = uc_1!
        let up_1 : RangerAppParamDesc? = currC_1.findVariable(f_name : part_2)
        if ( up_1 != nil  ) {
          if ( false == ctx.isInStatic() ) {
            wr.out(str : thisName + "->", newLine : false)
          }
        }
      }
      let p_1 : RangerAppParamDesc? = node.paramDesc
      wr.out(str : p_1!.compiledName, newLine : false)
      return;
    }
    var b_was_static : Bool = false
    for ( i_1 , part_3 ) in node.ns.enumerated() {
      if ( i_1 > 0 ) {
        if ( (i_1 == 1) && b_was_static ) {
          wr.out(str : "::", newLine : false)
        } else {
          wr.out(str : "->", newLine : false)
        }
      }
      if ( i_1 == 0 ) {
        if ( ctx.hasClass(name : part_3) ) {
          b_was_static = true;
        } else {
          wr.out(str : "$", newLine : false)
        }
        if ( (part_3 != "this") && ctx.hasCurrentClass() ) {
          let uc_2 : RangerAppClassDesc? = ctx.getCurrentClass()
          let currC_2 : RangerAppClassDesc = uc_2!
          let up_2 : RangerAppParamDesc? = currC_2.findVariable(f_name : part_3)
          if ( up_2 != nil  ) {
            if ( false == ctx.isInStatic() ) {
              wr.out(str : thisName + "->", newLine : false)
            }
          }
        }
      }
      wr.out(str : self.adjustType(tn : part_3), newLine : false)
    }
  }
  func writeVarInitDef(node : CodeNode, ctx : RangerAppWriterContext, wr : CodeWriter) -> Void {
    if ( node.hasParamDesc ) {
      let nn : CodeNode = node.children[1]
      let p : RangerAppParamDesc? = nn.paramDesc
      if ( (p!.ref_cnt == 0) && (p!.is_class_variable == false) ) {
        wr.out(str : "/** unused:  ", newLine : false)
      }
      wr.out(str : "$this->" + p!.compiledName, newLine : false)
      if ( (node.children.count) > 2 ) {
        wr.out(str : " = ", newLine : false)
        ctx.setInExpr()
        let value : CodeNode = node.getThird()
        self.WalkNode(node : value, ctx : ctx, wr : wr)
        ctx.unsetInExpr()
      } else {
        if ( nn.value_type == 6 ) {
          wr.out(str : " = array()", newLine : false)
        }
        if ( nn.value_type == 7 ) {
          wr.out(str : " = array()", newLine : false)
        }
      }
      if ( (p!.ref_cnt == 0) && (p!.is_class_variable == false) ) {
        wr.out(str : "   **/", newLine : true)
        return;
      }
      wr.out(str : ";", newLine : false)
      if ( (p!.ref_cnt == 0) && (p!.is_class_variable == true) ) {
        wr.out(str : "     /** note: unused */", newLine : false)
      }
      wr.newline()
    }
  }
  override func writeVarDef(node : CodeNode, ctx : RangerAppWriterContext, wr : CodeWriter) -> Void {
    if ( node.hasParamDesc ) {
      let nn : CodeNode = node.children[1]
      let p : RangerAppParamDesc? = nn.paramDesc
      if ( (p!.ref_cnt == 0) && (p!.is_class_variable == false) ) {
        wr.out(str : "/** unused:  ", newLine : false)
      }
      wr.out(str : "$" + p!.compiledName, newLine : false)
      if ( (node.children.count) > 2 ) {
        wr.out(str : " = ", newLine : false)
        ctx.setInExpr()
        let value : CodeNode = node.getThird()
        self.WalkNode(node : value, ctx : ctx, wr : wr)
        ctx.unsetInExpr()
      } else {
        if ( nn.value_type == 6 ) {
          wr.out(str : " = array()", newLine : false)
        }
        if ( nn.value_type == 7 ) {
          wr.out(str : " = array()", newLine : false)
        }
      }
      if ( (p!.ref_cnt == 0) && (p!.is_class_variable == true) ) {
        wr.out(str : "     /** note: unused */", newLine : false)
      }
      if ( (p!.ref_cnt == 0) && (p!.is_class_variable == false) ) {
        wr.out(str : "   **/ ;", newLine : true)
      } else {
        wr.out(str : ";", newLine : false)
        wr.newline()
      }
    }
  }
  override func disabledVarDef(node : CodeNode, ctx : RangerAppWriterContext, wr : CodeWriter) -> Void {
    if ( node.hasParamDesc ) {
      let nn : CodeNode = node.children[1]
      let p : RangerAppParamDesc? = nn.paramDesc
      wr.out(str : "$this->" + p!.compiledName, newLine : false)
      if ( (node.children.count) > 2 ) {
        wr.out(str : " = ", newLine : false)
        ctx.setInExpr()
        let value : CodeNode = node.getThird()
        self.WalkNode(node : value, ctx : ctx, wr : wr)
        ctx.unsetInExpr()
      } else {
        if ( nn.value_type == 6 ) {
          wr.out(str : " = array()", newLine : false)
        }
        if ( nn.value_type == 7 ) {
          wr.out(str : " = array()", newLine : false)
        }
      }
      wr.out(str : ";", newLine : false)
      wr.newline()
    }
  }
  override func CreateLambdaCall(node : CodeNode, ctx : RangerAppWriterContext, wr : CodeWriter) -> Void {
    let fName : CodeNode = node.children[0]
    let givenArgs : CodeNode = node.children[1]
    self.WriteVRef(node : fName, ctx : ctx, wr : wr)
    let param : RangerAppParamDesc = ctx.getVariableDef(name : fName.vref)
    let args : CodeNode = param.nameNode!.expression_value!.children[1]
    wr.out(str : "(", newLine : false)
    for ( i , arg ) in args.children.enumerated() {
      let n : CodeNode = givenArgs.children[i]
      if ( i > 0 ) {
        wr.out(str : ", ", newLine : false)
      }
      if ( arg.value_type != 0 ) {
        self.WalkNode(node : n, ctx : ctx, wr : wr)
      }
    }
    if ( ctx.expressionLevel() == 0 ) {
      wr.out(str : ");", newLine : true)
    } else {
      wr.out(str : ")", newLine : false)
    }
  }
  override func CreateLambda(node : CodeNode, ctx : RangerAppWriterContext, wr : CodeWriter) -> Void {
    let lambdaCtx : RangerAppWriterContext = node.lambda_ctx!
    /** unused:  let fnNode : CodeNode = node.children[0]   **/ 
    let args : CodeNode = node.children[1]
    let body : CodeNode = node.children[2]
    wr.out(str : "function (", newLine : false)
    for ( i , arg ) in args.children.enumerated() {
      if ( i > 0 ) {
        wr.out(str : ", ", newLine : false)
      }
      self.WalkNode(node : arg, ctx : lambdaCtx, wr : wr)
    }
    wr.out(str : ") ", newLine : false)
    wr.out(str : " {", newLine : true)
    wr.indent(delta : 1)
    lambdaCtx.restartExpressionLevel()
    for ( _ , item ) in body.children.enumerated() {
      self.WalkNode(node : item, ctx : lambdaCtx, wr : wr)
    }
    wr.newline()
    for ( _ , cname ) in lambdaCtx.captured_variables.enumerated() {
      wr.out(str : "// captured var " + cname, newLine : true)
    }
    wr.indent(delta : -1)
    wr.out(str : "}", newLine : true)
  }
  func writeClassVarDef(node : CodeNode, ctx : RangerAppWriterContext, wr : CodeWriter) -> Void {
    if ( node.hasParamDesc ) {
      let nn : CodeNode = node.children[1]
      let p : RangerAppParamDesc? = nn.paramDesc
      wr.out(str : ("var $" + p!.compiledName) + ";", newLine : true)
    }
  }
  func writeArgsDef(fnDesc : RangerAppFunctionDesc, ctx : RangerAppWriterContext, wr : CodeWriter) -> Void {
    for ( i , arg ) in fnDesc.params.enumerated() {
      if ( i > 0 ) {
        wr.out(str : ",", newLine : false)
      }
      wr.out(str : (" $" + arg.name) + " ", newLine : false)
    }
  }
  override func writeFnCall(node : CodeNode, ctx : RangerAppWriterContext, wr : CodeWriter) -> Void {
    if ( node.hasFnCall ) {
      let fc : CodeNode = node.getFirst()
      self.WriteVRef(node : fc, ctx : ctx, wr : wr)
      wr.out(str : "(", newLine : false)
      let givenArgs : CodeNode = node.getSecond()
      ctx.setInExpr()
      for ( i , arg ) in node.fnDesc!.params.enumerated() {
        if ( i > 0 ) {
          wr.out(str : ", ", newLine : false)
        }
        if ( (givenArgs.children.count) <= i ) {
          let defVal : CodeNode? = arg.nameNode!.getFlag(flagName : "default")
          if ( defVal != nil  ) {
            let fc_1 : CodeNode = defVal!.vref_annotation!.getFirst()
            self.WalkNode(node : fc_1, ctx : ctx, wr : wr)
          } else {
            ctx.addError(targetnode : node, descr : "Default argument was missing")
          }
          continue;
        }
        let n : CodeNode = givenArgs.children[i]
        self.WalkNode(node : n, ctx : ctx, wr : wr)
      }
      ctx.unsetInExpr()
      wr.out(str : ")", newLine : false)
      if ( ctx.expressionLevel() == 0 ) {
        wr.out(str : ";", newLine : true)
      }
    }
  }
  override func writeNewCall(node : CodeNode, ctx : RangerAppWriterContext, wr : CodeWriter) -> Void {
    if ( node.hasNewOper ) {
      let cl : RangerAppClassDesc? = node.clDesc
      /** unused:  let fc : CodeNode = node.getSecond()   **/ 
      wr.out(str : " new ", newLine : false)
      wr.out(str : node.clDesc!.name, newLine : false)
      wr.out(str : "(", newLine : false)
      let constr : RangerAppFunctionDesc? = cl!.constructor_fn
      let givenArgs : CodeNode = node.getThird()
      if ( constr != nil  ) {
        for ( i , arg ) in constr!.params.enumerated() {
          let n : CodeNode = givenArgs.children[i]
          if ( i > 0 ) {
            wr.out(str : ", ", newLine : false)
          }
          if ( true || (arg.nameNode != nil ) ) {
            self.WalkNode(node : n, ctx : ctx, wr : wr)
          }
        }
      }
      wr.out(str : ")", newLine : false)
    }
  }
  override func writeClass(node : CodeNode, ctx : RangerAppWriterContext, wr orig_wr : CodeWriter) -> Void {
    let cl : RangerAppClassDesc? = node.clDesc
    if ( cl == nil ) {
      return;
    }
    let wr : CodeWriter = orig_wr
    /** unused:  let importFork : CodeWriter = wr.fork()   **/ 
    for ( _ , dd ) in cl!.capturedLocals.enumerated() {
      if ( dd.is_class_variable == false ) {
        wr.out(str : "// local captured " + dd.name, newLine : true)
        dd.node!.disabled_node = true;
        cl!.addVariable(desc : dd)
        let csubCtx : RangerAppWriterContext? = cl!.ctx
        csubCtx!.defineVariable(name : dd.name, desc : dd)
        dd.is_class_variable = true;
      }
    }
    if ( wrote_header == false ) {
      wr.out(str : "<? ", newLine : true)
      wr.out(str : "", newLine : true)
      wrote_header = true;
    }
    wr.out(str : "class " + cl!.name, newLine : false)
    var parentClass : RangerAppClassDesc?
    if ( (cl!.extends_classes.count) > 0 ) {
      wr.out(str : " extends ", newLine : false)
      for ( _ , pName ) in cl!.extends_classes.enumerated() {
        wr.out(str : pName, newLine : false)
        parentClass = ctx.findClass(name : pName);
      }
    }
    wr.out(str : " { ", newLine : true)
    wr.indent(delta : 1)
    for ( _ , pvar ) in cl!.variables.enumerated() {
      self.writeClassVarDef(node : pvar.node!, ctx : ctx, wr : wr)
    }
    wr.out(str : "", newLine : true)
    wr.out(str : "function __construct(", newLine : false)
    if ( cl!.has_constructor ) {
      let constr : RangerAppFunctionDesc = cl!.constructor_fn!
      self.writeArgsDef(fnDesc : constr, ctx : ctx, wr : wr)
    }
    wr.out(str : " ) {", newLine : true)
    wr.indent(delta : 1)
    if ( parentClass != nil ) {
      wr.out(str : "parent::__construct();", newLine : true)
    }
    for ( _ , pvar_1 ) in cl!.variables.enumerated() {
      self.writeVarInitDef(node : pvar_1.node!, ctx : ctx, wr : wr)
    }
    if ( cl!.has_constructor ) {
      let constr_1 : RangerAppFunctionDesc? = cl!.constructor_fn
      wr.newline()
      let subCtx : RangerAppWriterContext = constr_1!.fnCtx!
      subCtx.is_function = true;
      self.WalkNode(node : constr_1!.fnBody!, ctx : subCtx, wr : wr)
    }
    wr.newline()
    wr.indent(delta : -1)
    wr.out(str : "}", newLine : true)
    for ( _ , variant ) in cl!.static_methods.enumerated() {
      wr.out(str : "", newLine : true)
      if ( variant.nameNode!.hasFlag(flagName : "main") ) {
        continue;
      } else {
        wr.out(str : "public static function ", newLine : false)
        wr.out(str : variant.compiledName + "(", newLine : false)
        self.writeArgsDef(fnDesc : variant, ctx : ctx, wr : wr)
        wr.out(str : ") {", newLine : true)
      }
      wr.indent(delta : 1)
      wr.newline()
      let subCtx_1 : RangerAppWriterContext = variant.fnCtx!
      subCtx_1.is_function = true;
      subCtx_1.in_static_method = true;
      self.WalkNode(node : variant.fnBody!, ctx : subCtx_1, wr : wr)
      subCtx_1.in_static_method = false;
      wr.newline()
      wr.indent(delta : -1)
      wr.out(str : "}", newLine : true)
    }
    for ( _ , fnVar ) in cl!.defined_variants.enumerated() {
      let mVs : RangerAppMethodVariants? = cl!.method_variants[fnVar]
      for ( _ , variant_1 ) in mVs!.variants.enumerated() {
        wr.out(str : "", newLine : true)
        wr.out(str : ("function " + variant_1.compiledName) + "(", newLine : false)
        self.writeArgsDef(fnDesc : variant_1, ctx : ctx, wr : wr)
        wr.out(str : ") {", newLine : true)
        wr.indent(delta : 1)
        wr.newline()
        let subCtx_2 : RangerAppWriterContext = variant_1.fnCtx!
        subCtx_2.is_function = true;
        subCtx_2.in_static_method = false;
        self.WalkNode(node : variant_1.fnBody!, ctx : subCtx_2, wr : wr)
        wr.newline()
        wr.indent(delta : -1)
        wr.out(str : "}", newLine : true)
      }
    }
    wr.indent(delta : -1)
    wr.out(str : "}", newLine : true)
    for ( _ , variant_2 ) in cl!.static_methods.enumerated() {
      ctx.disableCurrentClass()
      ctx.in_static_method = true;
      wr.out(str : "", newLine : true)
      if ( variant_2.nameNode!.hasFlag(flagName : "main") && (variant_2.nameNode!.code!.filename == ctx.getRootFile()) ) {
        wr.out(str : "/* static PHP main routine */", newLine : false)
        wr.newline()
        self.WalkNode(node : variant_2.fnBody!, ctx : ctx, wr : wr)
        wr.newline()
      }
      ctx.in_static_method = false;
    }
  }
}
func ==(l: RangerJavaScriptClassWriter, r: RangerJavaScriptClassWriter) -> Bool {
  return l === r
}
class RangerJavaScriptClassWriter : RangerGenericClassWriter { 
  // WAS DECLARED : compiler
  var thisName : String = "this"     /** note: unused */
  var wrote_header : Bool = false
  override func adjustType(tn : String) -> String {
    if ( tn == "this" ) {
      return "this";
    }
    return tn;
  }
  override func WriteVRef(node : CodeNode, ctx : RangerAppWriterContext, wr : CodeWriter) -> Void {
    if ( node.eval_type == 11 ) {
      if ( (node.ns.count) > 1 ) {
        let rootObjName : String = node.ns[0]
        let enumName : String = node.ns[1]
        let e : RangerAppEnum? = ctx.getEnum(n : rootObjName)
        if ( e != nil  ) {
          wr.out(str : "" + String(((e!.values[enumName])!)), newLine : false)
          return;
        }
      }
    }
    if ( (node.nsp.count) > 0 ) {
      for ( i , p ) in node.nsp.enumerated() {
        if ( i > 0 ) {
          wr.out(str : ".", newLine : false)
        }
        if ( i == 0 ) {
          let part : String = node.ns[0]
          if ( (part != "this") && ctx.isMemberVariable(name : part) ) {
            let uc : RangerAppClassDesc? = ctx.getCurrentClass()
            let currC : RangerAppClassDesc = uc!
            let up : RangerAppParamDesc? = currC.findVariable(f_name : part)
            if ( up != nil  ) {
              wr.out(str : "this.", newLine : false)
            }
          }
          if ( part == "this" ) {
            wr.out(str : "this", newLine : false)
            continue;
          }
        }
        if ( (p.compiledName.characters.count) > 0 ) {
          wr.out(str : self.adjustType(tn : p.compiledName), newLine : false)
        } else {
          if ( (p.name.characters.count) > 0 ) {
            wr.out(str : self.adjustType(tn : p.name), newLine : false)
          } else {
            wr.out(str : self.adjustType(tn : (node.ns[i])), newLine : false)
          }
        }
      }
      return;
    }
    if ( node.hasParamDesc ) {
      let part_1 : String = node.ns[0]
      if ( (part_1 != "this") && ctx.isMemberVariable(name : part_1) ) {
        let uc_1 : RangerAppClassDesc? = ctx.getCurrentClass()
        let currC_1 : RangerAppClassDesc = uc_1!
        let up_1 : RangerAppParamDesc? = currC_1.findVariable(f_name : part_1)
        if ( up_1 != nil  ) {
          wr.out(str : "this.", newLine : false)
        }
      }
      let p_1 : RangerAppParamDesc? = node.paramDesc
      wr.out(str : p_1!.compiledName, newLine : false)
      return;
    }
    var b_was_static : Bool = false
    for ( i_1 , part_2 ) in node.ns.enumerated() {
      if ( i_1 > 0 ) {
        if ( (i_1 == 1) && b_was_static ) {
          wr.out(str : ".", newLine : false)
        } else {
          wr.out(str : ".", newLine : false)
        }
      }
      if ( i_1 == 0 ) {
        if ( ctx.hasClass(name : part_2) ) {
          b_was_static = true;
        } else {
          wr.out(str : "", newLine : false)
        }
        if ( (part_2 != "this") && ctx.isMemberVariable(name : part_2) ) {
          let uc_2 : RangerAppClassDesc? = ctx.getCurrentClass()
          let currC_2 : RangerAppClassDesc = uc_2!
          let up_2 : RangerAppParamDesc? = currC_2.findVariable(f_name : part_2)
          if ( up_2 != nil  ) {
            wr.out(str : "this.", newLine : false)
          }
        }
      }
      wr.out(str : self.adjustType(tn : part_2), newLine : false)
    }
  }
  func writeVarInitDef(node : CodeNode, ctx : RangerAppWriterContext, wr : CodeWriter) -> Void {
    if ( node.hasParamDesc ) {
      let nn : CodeNode = node.children[1]
      let p : RangerAppParamDesc? = nn.paramDesc
      let remove_unused : Bool = ctx.hasCompilerFlag(s_name : "remove-unused-class-vars")
      if ( (p!.ref_cnt == 0) && (remove_unused || (p!.is_class_variable == false)) ) {
        return;
      }
      var was_set : Bool = false
      if ( (node.children.count) > 2 ) {
        wr.out(str : ("this." + p!.compiledName) + " = ", newLine : false)
        ctx.setInExpr()
        let value : CodeNode = node.getThird()
        self.WalkNode(node : value, ctx : ctx, wr : wr)
        ctx.unsetInExpr()
        was_set = true;
      } else {
        if ( nn.value_type == 6 ) {
          wr.out(str : "this." + p!.compiledName, newLine : false)
          wr.out(str : " = []", newLine : false)
          was_set = true;
        }
        if ( nn.value_type == 7 ) {
          wr.out(str : "this." + p!.compiledName, newLine : false)
          wr.out(str : " = {}", newLine : false)
          was_set = true;
        }
      }
      if ( was_set ) {
        wr.out(str : ";", newLine : false)
        if ( (p!.ref_cnt == 0) && (p!.is_class_variable == true) ) {
          wr.out(str : "     /** note: unused */", newLine : false)
        }
        wr.newline()
      }
    }
  }
  override func writeVarDef(node : CodeNode, ctx : RangerAppWriterContext, wr : CodeWriter) -> Void {
    if ( node.hasParamDesc ) {
      let nn : CodeNode = node.children[1]
      let p : RangerAppParamDesc? = nn.paramDesc
      /** unused:  let opt_js : Bool = ctx.hasCompilerFlag(s_name : "optimize-js")   **/ 
      if ( (p!.ref_cnt == 0) && (p!.is_class_variable == false) ) {
        wr.out(str : "/** unused:  ", newLine : false)
      }
      var has_value : Bool = false
      if ( (node.children.count) > 2 ) {
        has_value = true;
      }
      if ( ((p!.set_cnt > 0) || p!.is_class_variable) || (has_value == false) ) {
        wr.out(str : "let " + p!.compiledName, newLine : false)
      } else {
        wr.out(str : "const " + p!.compiledName, newLine : false)
      }
      if ( (node.children.count) > 2 ) {
        wr.out(str : " = ", newLine : false)
        ctx.setInExpr()
        let value : CodeNode = node.getThird()
        self.WalkNode(node : value, ctx : ctx, wr : wr)
        ctx.unsetInExpr()
      } else {
        if ( nn.value_type == 6 ) {
          wr.out(str : " = []", newLine : false)
        }
        if ( nn.value_type == 7 ) {
          wr.out(str : " = {}", newLine : false)
        }
      }
      if ( (p!.ref_cnt == 0) && (p!.is_class_variable == true) ) {
        wr.out(str : "     /** note: unused */", newLine : false)
      }
      if ( (p!.ref_cnt == 0) && (p!.is_class_variable == false) ) {
        wr.out(str : "   **/ ", newLine : true)
      } else {
        wr.out(str : ";", newLine : false)
        wr.newline()
      }
    }
  }
  func writeClassVarDef(node : CodeNode, ctx : RangerAppWriterContext, wr : CodeWriter) -> Void {
  }
  func writeArgsDef(fnDesc : RangerAppFunctionDesc, ctx : RangerAppWriterContext, wr : CodeWriter) -> Void {
    for ( i , arg ) in fnDesc.params.enumerated() {
      if ( i > 0 ) {
        wr.out(str : ", ", newLine : false)
      }
      wr.out(str : arg.name, newLine : false)
    }
  }
  override func writeClass(node : CodeNode, ctx : RangerAppWriterContext, wr orig_wr : CodeWriter) -> Void {
    let cl : RangerAppClassDesc? = node.clDesc
    if ( cl!.is_interface ) {
      orig_wr.out(str : "// interface : " + cl!.name, newLine : true)
      return;
    }
    if ( cl == nil ) {
      return;
    }
    let wr : CodeWriter = orig_wr
    /** unused:  let importFork : CodeWriter = wr.fork()   **/ 
    if ( wrote_header == false ) {
      wr.out(str : "", newLine : true)
      wrote_header = true;
    }
    var b_extd : Bool = false
    wr.out(str : ("class " + cl!.name) + " ", newLine : false)
    for ( i , pName ) in cl!.extends_classes.enumerated() {
      if ( i == 0 ) {
        wr.out(str : " extends ", newLine : false)
      }
      wr.out(str : pName, newLine : false)
      b_extd = true;
    }
    wr.out(str : " {", newLine : true)
    wr.indent(delta : 1)
    for ( _ , pvar ) in cl!.variables.enumerated() {
      self.writeClassVarDef(node : pvar.node!, ctx : ctx, wr : wr)
    }
    wr.out(str : "constructor(", newLine : false)
    if ( cl!.has_constructor ) {
      let constr : RangerAppFunctionDesc = cl!.constructor_fn!
      self.writeArgsDef(fnDesc : constr, ctx : ctx, wr : wr)
    }
    wr.out(str : ") {", newLine : true)
    wr.indent(delta : 1)
    if ( b_extd ) {
      wr.out(str : "super()", newLine : true)
    }
    for ( _ , pvar_1 ) in cl!.variables.enumerated() {
      self.writeVarInitDef(node : pvar_1.node!, ctx : ctx, wr : wr)
    }
    if ( cl!.has_constructor ) {
      let constr_1 : RangerAppFunctionDesc? = cl!.constructor_fn
      wr.newline()
      let subCtx : RangerAppWriterContext = constr_1!.fnCtx!
      subCtx.is_function = true;
      self.WalkNode(node : constr_1!.fnBody!, ctx : subCtx, wr : wr)
    }
    wr.newline()
    wr.indent(delta : -1)
    wr.out(str : "}", newLine : true)
    for ( _ , fnVar ) in cl!.defined_variants.enumerated() {
      let mVs : RangerAppMethodVariants? = cl!.method_variants[fnVar]
      for ( _ , variant ) in mVs!.variants.enumerated() {
        wr.out(str : ("" + variant.compiledName) + " (", newLine : false)
        self.writeArgsDef(fnDesc : variant, ctx : ctx, wr : wr)
        wr.out(str : ") {", newLine : true)
        wr.indent(delta : 1)
        wr.newline()
        let subCtx_1 : RangerAppWriterContext = variant.fnCtx!
        subCtx_1.is_function = true;
        self.WalkNode(node : variant.fnBody!, ctx : subCtx_1, wr : wr)
        wr.newline()
        wr.indent(delta : -1)
        wr.out(str : "}", newLine : true)
      }
    }
    wr.indent(delta : -1)
    wr.out(str : "}", newLine : true)
    for ( _ , variant_1 ) in cl!.static_methods.enumerated() {
      if ( variant_1.nameNode!.hasFlag(flagName : "main") ) {
        continue;
      } else {
        wr.out(str : ((cl!.name + ".") + variant_1.compiledName) + " = function(", newLine : false)
        self.writeArgsDef(fnDesc : variant_1, ctx : ctx, wr : wr)
        wr.out(str : ") {", newLine : true)
      }
      wr.indent(delta : 1)
      wr.newline()
      let subCtx_2 : RangerAppWriterContext = variant_1.fnCtx!
      subCtx_2.is_function = true;
      self.WalkNode(node : variant_1.fnBody!, ctx : subCtx_2, wr : wr)
      wr.newline()
      wr.indent(delta : -1)
      wr.out(str : "}", newLine : true)
    }
    for ( _ , variant_2 ) in cl!.static_methods.enumerated() {
      ctx.disableCurrentClass()
      if ( variant_2.nameNode!.hasFlag(flagName : "main") && (variant_2.nameNode!.code!.filename == ctx.getRootFile()) ) {
        wr.out(str : "/* static JavaSript main routine */", newLine : false)
        wr.newline()
        wr.out(str : "function __js_main() {", newLine : true)
        wr.indent(delta : 1)
        self.WalkNode(node : variant_2.fnBody!, ctx : ctx, wr : wr)
        wr.newline()
        wr.indent(delta : -1)
        wr.out(str : "}", newLine : true)
        wr.out(str : "__js_main();", newLine : true)
      }
    }
  }
}
func ==(l: RangerRangerClassWriter, r: RangerRangerClassWriter) -> Bool {
  return l === r
}
class RangerRangerClassWriter : RangerGenericClassWriter { 
  // WAS DECLARED : compiler
  override func adjustType(tn : String) -> String {
    if ( tn == "this" ) {
      return "this";
    }
    return tn;
  }
  override func getObjectTypeString(type_string : String, ctx : RangerAppWriterContext) -> String {
    return type_string;
  }
  override func getTypeString(type_string : String) -> String {
    return type_string;
  }
  override func writeTypeDef(node : CodeNode, ctx : RangerAppWriterContext, wr : CodeWriter) -> Void {
    var v_type : Int = node.value_type
    var t_name : String = node.type_name
    var a_name : String = node.array_type
    var k_name : String = node.key_type
    if ( ((v_type == 8) || (v_type == 9)) || (v_type == 0) ) {
      v_type = node.typeNameAsType(ctx : ctx);
    }
    if ( node.eval_type != 0 ) {
      v_type = node.eval_type;
      if ( (node.eval_type_name.characters.count) > 0 ) {
        t_name = node.eval_type_name;
      }
      if ( (node.eval_array_type.characters.count) > 0 ) {
        a_name = node.eval_array_type;
      }
      if ( (node.eval_key_type.characters.count) > 0 ) {
        k_name = node.eval_key_type;
      }
    }
    if ( v_type == 7 ) {
      wr.out(str : ((("[" + k_name) + ":") + a_name) + "]", newLine : false)
      return;
    }
    if ( v_type == 6 ) {
      wr.out(str : ("[" + a_name) + "]", newLine : false)
      return;
    }
    wr.out(str : t_name, newLine : false)
  }
  override func WriteVRef(node : CodeNode, ctx : RangerAppWriterContext, wr : CodeWriter) -> Void {
    wr.out(str : node.vref, newLine : false)
  }
  func WriteVRefWithOpt(node : CodeNode, ctx : RangerAppWriterContext, wr : CodeWriter) -> Void {
    wr.out(str : node.vref, newLine : false)
    let flags : [String] = ["optional","weak","strong","temp","lives","returns","returnvalue"]
    var some_set : Bool = false
    for ( _ , flag ) in flags.enumerated() {
      if ( node.hasFlag(flagName : flag) ) {
        if ( false == some_set ) {
          wr.out(str : "@(", newLine : false)
          some_set = true;
        } else {
          wr.out(str : " ", newLine : false)
        }
        wr.out(str : flag, newLine : false)
      }
    }
    if ( some_set ) {
      wr.out(str : ")", newLine : false)
    }
  }
  override func writeVarDef(node : CodeNode, ctx : RangerAppWriterContext, wr : CodeWriter) -> Void {
    if ( node.hasParamDesc ) {
      let nn : CodeNode = node.children[1]
      let p : RangerAppParamDesc? = nn.paramDesc
      wr.out(str : "def ", newLine : false)
      self.WriteVRefWithOpt(node : nn, ctx : ctx, wr : wr)
      wr.out(str : ":", newLine : false)
      self.writeTypeDef(node : p!.nameNode!, ctx : ctx, wr : wr)
      if ( (node.children.count) > 2 ) {
        wr.out(str : " ", newLine : false)
        ctx.setInExpr()
        let value : CodeNode = node.getThird()
        self.WalkNode(node : value, ctx : ctx, wr : wr)
        ctx.unsetInExpr()
      }
      wr.newline()
    }
  }
  override func writeFnCall(node : CodeNode, ctx : RangerAppWriterContext, wr : CodeWriter) -> Void {
    if ( node.hasFnCall ) {
      if ( ctx.expressionLevel() > 0 ) {
        wr.out(str : "(", newLine : false)
      }
      let fc : CodeNode = node.getFirst()
      self.WriteVRef(node : fc, ctx : ctx, wr : wr)
      wr.out(str : "(", newLine : false)
      let givenArgs : CodeNode = node.getSecond()
      ctx.setInExpr()
      for ( i , arg ) in node.fnDesc!.params.enumerated() {
        if ( i > 0 ) {
          wr.out(str : ", ", newLine : false)
        }
        if ( (givenArgs.children.count) <= i ) {
          let defVal : CodeNode? = arg.nameNode!.getFlag(flagName : "default")
          if ( defVal != nil  ) {
            let fc_1 : CodeNode = defVal!.vref_annotation!.getFirst()
            self.WalkNode(node : fc_1, ctx : ctx, wr : wr)
          } else {
            ctx.addError(targetnode : node, descr : "Default argument was missing")
          }
          continue;
        }
        let n : CodeNode = givenArgs.children[i]
        self.WalkNode(node : n, ctx : ctx, wr : wr)
      }
      ctx.unsetInExpr()
      wr.out(str : ")", newLine : false)
      if ( ctx.expressionLevel() > 0 ) {
        wr.out(str : ")", newLine : false)
      }
      if ( ctx.expressionLevel() == 0 ) {
        wr.newline()
      }
    }
  }
  override func writeNewCall(node : CodeNode, ctx : RangerAppWriterContext, wr : CodeWriter) -> Void {
    if ( node.hasNewOper ) {
      let cl : RangerAppClassDesc? = node.clDesc
      /** unused:  let fc : CodeNode = node.getSecond()   **/ 
      wr.out(str : "(new " + node.clDesc!.name, newLine : false)
      wr.out(str : "(", newLine : false)
      let constr : RangerAppFunctionDesc? = cl!.constructor_fn
      let givenArgs : CodeNode = node.getThird()
      if ( constr != nil  ) {
        for ( i , arg ) in constr!.params.enumerated() {
          let n : CodeNode = givenArgs.children[i]
          if ( i > 0 ) {
            wr.out(str : " ", newLine : false)
          }
          if ( true || (arg.nameNode != nil ) ) {
            self.WalkNode(node : n, ctx : ctx, wr : wr)
          }
        }
      }
      wr.out(str : "))", newLine : false)
    }
  }
  func writeArgsDef(fnDesc : RangerAppFunctionDesc, ctx : RangerAppWriterContext, wr : CodeWriter) -> Void {
    for ( i , arg ) in fnDesc.params.enumerated() {
      if ( i > 0 ) {
        wr.out(str : ",", newLine : false)
      }
      wr.out(str : " ", newLine : false)
      self.WriteVRefWithOpt(node : arg.nameNode!, ctx : ctx, wr : wr)
      wr.out(str : ":", newLine : false)
      self.writeTypeDef(node : arg.nameNode!, ctx : ctx, wr : wr)
    }
  }
  override func writeClass(node : CodeNode, ctx : RangerAppWriterContext, wr orig_wr : CodeWriter) -> Void {
    let cl : RangerAppClassDesc? = node.clDesc
    if ( cl == nil ) {
      return;
    }
    let wr : CodeWriter = orig_wr
    let importFork : CodeWriter = wr.fork()
    wr.out(str : "", newLine : true)
    wr.out(str : "class " + cl!.name, newLine : false)
    wr.out(str : " { ", newLine : true)
    wr.indent(delta : 1)
    if ( (cl!.extends_classes.count) > 0 ) {
      wr.out(str : "Extends(", newLine : false)
      for ( _ , pName ) in cl!.extends_classes.enumerated() {
        wr.out(str : pName, newLine : false)
      }
      wr.out(str : ")", newLine : true)
    }
    _ = wr.createTag(name : "utilities")
    for ( _ , pvar ) in cl!.variables.enumerated() {
      self.writeVarDef(node : pvar.node!, ctx : ctx, wr : wr)
    }
    if ( cl!.has_constructor ) {
      let constr : RangerAppFunctionDesc? = cl!.constructor_fn
      wr.out(str : "", newLine : true)
      wr.out(str : "Constructor (", newLine : false)
      self.writeArgsDef(fnDesc : constr!, ctx : ctx, wr : wr)
      wr.out(str : " ) {", newLine : true)
      wr.indent(delta : 1)
      wr.newline()
      let subCtx : RangerAppWriterContext = constr!.fnCtx!
      subCtx.is_function = true;
      self.WalkNode(node : constr!.fnBody!, ctx : subCtx, wr : wr)
      wr.newline()
      wr.indent(delta : -1)
      wr.out(str : "}", newLine : true)
    }
    for ( _ , variant ) in cl!.static_methods.enumerated() {
      wr.out(str : "", newLine : true)
      if ( variant.nameNode!.hasFlag(flagName : "main") ) {
        wr.out(str : "sfn m@(main):void () {", newLine : true)
      } else {
        wr.out(str : "sfn ", newLine : false)
        self.WriteVRefWithOpt(node : variant.nameNode!, ctx : ctx, wr : wr)
        wr.out(str : ":", newLine : false)
        self.writeTypeDef(node : variant.nameNode!, ctx : ctx, wr : wr)
        wr.out(str : " (", newLine : false)
        self.writeArgsDef(fnDesc : variant, ctx : ctx, wr : wr)
        wr.out(str : ") {", newLine : true)
      }
      wr.indent(delta : 1)
      wr.newline()
      let subCtx_1 : RangerAppWriterContext = variant.fnCtx!
      subCtx_1.is_function = true;
      self.WalkNode(node : variant.fnBody!, ctx : subCtx_1, wr : wr)
      wr.newline()
      wr.indent(delta : -1)
      wr.out(str : "}", newLine : true)
    }
    for ( _ , fnVar ) in cl!.defined_variants.enumerated() {
      let mVs : RangerAppMethodVariants? = cl!.method_variants[fnVar]
      for ( _ , variant_1 ) in mVs!.variants.enumerated() {
        wr.out(str : "", newLine : true)
        wr.out(str : "fn ", newLine : false)
        self.WriteVRefWithOpt(node : variant_1.nameNode!, ctx : ctx, wr : wr)
        wr.out(str : ":", newLine : false)
        self.writeTypeDef(node : variant_1.nameNode!, ctx : ctx, wr : wr)
        wr.out(str : " ", newLine : false)
        wr.out(str : "(", newLine : false)
        self.writeArgsDef(fnDesc : variant_1, ctx : ctx, wr : wr)
        wr.out(str : ") {", newLine : true)
        wr.indent(delta : 1)
        wr.newline()
        let subCtx_2 : RangerAppWriterContext = variant_1.fnCtx!
        subCtx_2.is_function = true;
        self.WalkNode(node : variant_1.fnBody!, ctx : subCtx_2, wr : wr)
        wr.newline()
        wr.indent(delta : -1)
        wr.out(str : "}", newLine : true)
      }
    }
    wr.indent(delta : -1)
    wr.out(str : "}", newLine : true)
    let import_list : [String] = wr.getImports()
    for ( _ , codeStr ) in import_list.enumerated() {
      importFork.out(str : ("Import \"" + codeStr) + "\"", newLine : true)
    }
  }
}
func ==(l: LiveCompiler, r: LiveCompiler) -> Bool {
  return l === r
}
class LiveCompiler : Equatable  { 
  var langWriter : RangerGenericClassWriter?
  var hasCreatedPolyfill : [String:Bool] = [String:Bool]()     /** note: unused */
  var lastProcessedNode : CodeNode?
  var repeat_index : Int = 0
  func initWriter(ctx : RangerAppWriterContext) -> Void {
    if ( langWriter != nil  ) {
      return;
    }
    let root : RangerAppWriterContext = ctx.getRoot()
    switch (root.targetLangName) {
      case "go" : 
        langWriter = RangerGolangClassWriter();
      case "scala" : 
        langWriter = RangerScalaClassWriter();
      case "java7" : 
        langWriter = RangerJava7ClassWriter();
      case "swift3" : 
        langWriter = RangerSwift3ClassWriter();
      case "kotlin" : 
        langWriter = RangerKotlinClassWriter();
      case "php" : 
        langWriter = RangerPHPClassWriter();
      case "cpp" : 
        langWriter = RangerCppClassWriter();
      case "csharp" : 
        langWriter = RangerCSharpClassWriter();
      case "es6" : 
        langWriter = RangerJavaScriptClassWriter();
      case "ranger" : 
        langWriter = RangerRangerClassWriter();
      default :
        break
    }
    if ( langWriter != nil  ) {
      langWriter!.compiler = self;
    } else {
      langWriter = RangerGenericClassWriter();
      langWriter!.compiler = self;
    }
  }
  func EncodeString(node : CodeNode, ctx : RangerAppWriterContext, wr : CodeWriter) -> String {
    /** unused:  let encoded_str : String = ""   **/ 
    let str_length : Int = node.string_value.characters.count
    var encoded_str_2 : String = ""
    var ii : Int = 0
    while (ii < str_length) {
      let ch : Int = Int( ( node.string_value as NSString ).character( at: ii ) )
      let cc : Int = ch
      switch (cc) {
        case 8 : 
          encoded_str_2 = (encoded_str_2 + ((String( Character( UnicodeScalar(92 )! ))))) + ((String( Character( UnicodeScalar(98 )! ))));
        case 9 : 
          encoded_str_2 = (encoded_str_2 + ((String( Character( UnicodeScalar(92 )! ))))) + ((String( Character( UnicodeScalar(116 )! ))));
        case 10 : 
          encoded_str_2 = (encoded_str_2 + ((String( Character( UnicodeScalar(92 )! ))))) + ((String( Character( UnicodeScalar(110 )! ))));
        case 12 : 
          encoded_str_2 = (encoded_str_2 + ((String( Character( UnicodeScalar(92 )! ))))) + ((String( Character( UnicodeScalar(102 )! ))));
        case 13 : 
          encoded_str_2 = (encoded_str_2 + ((String( Character( UnicodeScalar(92 )! ))))) + ((String( Character( UnicodeScalar(114 )! ))));
        case 34 : 
          encoded_str_2 = (encoded_str_2 + ((String( Character( UnicodeScalar(92 )! ))))) + ((String( Character( UnicodeScalar(34 )! ))));
        case 92 : 
          encoded_str_2 = (encoded_str_2 + ((String( Character( UnicodeScalar(92 )! ))))) + ((String( Character( UnicodeScalar(92 )! ))));
        default: 
          encoded_str_2 = encoded_str_2 + ((String( Character( UnicodeScalar(ch )! ))));
          break;
      }
      ii = ii + 1;
    }
    return encoded_str_2;
  }
  func WriteScalarValue(node : CodeNode, ctx : RangerAppWriterContext, wr : CodeWriter) -> Void {
    langWriter!.WriteScalarValue(node : node, ctx : ctx, wr : wr)
  }
  func adjustType(tn : String) -> String {
    if ( tn == "this" ) {
      return "self";
    }
    return tn;
  }
  func WriteVRef(node : CodeNode, ctx : RangerAppWriterContext, wr : CodeWriter) -> Void {
    langWriter!.WriteVRef(node : node, ctx : ctx, wr : wr)
  }
  func writeTypeDef(node : CodeNode, ctx : RangerAppWriterContext, wr : CodeWriter) -> Void {
    langWriter!.writeTypeDef(node : node, ctx : ctx, wr : wr)
  }
  func CreateLambdaCall(node : CodeNode, ctx : RangerAppWriterContext, wr : CodeWriter) -> Void {
    langWriter!.CreateLambdaCall(node : node, ctx : ctx, wr : wr)
  }
  func CreateLambda(node : CodeNode, ctx : RangerAppWriterContext, wr : CodeWriter) -> Void {
    langWriter!.CreateLambda(node : node, ctx : ctx, wr : wr)
  }
  func getTypeString(str : String, ctx : RangerAppWriterContext) -> String {
    return "";
  }
  func findOpCode(op : CodeNode, node : CodeNode, ctx : RangerAppWriterContext, wr : CodeWriter) -> Void {
    let fnName : CodeNode = op.children[1]
    let args : CodeNode = op.children[2]
    if ( (op.children.count) > 3 ) {
      let details : CodeNode = op.children[3]
      for ( _ , det ) in details.children.enumerated() {
        if ( (det.children.count) > 0 ) {
          let fc : CodeNode = det.children[0]
          if ( fc.vref == "code" ) {
            let match : RangerArgMatch = RangerArgMatch()
            let all_matched : Bool = match.matchArguments(args : args, callArgs : node, ctx : ctx, firstArgIndex : 1)
            if ( all_matched == false ) {
              return;
            }
            let origCode : CodeNode = det.children[1]
            let theCode : CodeNode = origCode.rebuildWithType(match : match, changeVref : true)
            let appCtx : RangerAppWriterContext = ctx.getRoot()
            let stdFnName : String = appCtx.createSignature(origClass : fnName.vref, classSig : (fnName.vref + theCode.getCode()))
            let stdClass : RangerAppClassDesc = ctx.findClass(name : "RangerStaticMethods")
            let runCtx : RangerAppWriterContext = appCtx.fork()
            var b_failed : Bool = false
            if ( false == (stdClass.defined_static_methods[stdFnName] != nil) ) {
              runCtx.setInMethod()
              let m : RangerAppFunctionDesc = RangerAppFunctionDesc()
              m.name = stdFnName;
              m.node = op;
              m.is_static = true;
              m.nameNode = fnName;
              m.fnBody = theCode;
              for ( _ , arg ) in args.children.enumerated() {
                let p : RangerAppParamDesc = RangerAppParamDesc()
                p.name = arg.vref;
                p.value_type = arg.value_type;
                p.node = arg;
                p.nameNode = arg;
                p.refType = 1;
                p.varType = 4;
                m.params.append(p)
                arg.hasParamDesc = true;
                arg.paramDesc = p;
                arg.eval_type = arg.value_type;
                arg.eval_type_name = arg.type_name;
                runCtx.defineVariable(name : p.name, desc : p)
              }
              stdClass.addStaticMethod(desc : m)
              let err_cnt : Int = ctx.compilerErrors.count
              let flowParser : RangerFlowParser = RangerFlowParser()
              let TmpWr : CodeWriter = CodeWriter()
              _ = flowParser.WalkNode(node : theCode, ctx : runCtx, wr : TmpWr)
              runCtx.unsetInMethod()
              let err_delta : Int = (ctx.compilerErrors.count) - err_cnt
              if ( err_delta > 0 ) {
                b_failed = true;
                print("Had following compiler errors:")
                for ( i_1 , e ) in ctx.compilerErrors.enumerated() {
                  if ( i_1 < err_cnt ) {
                    continue;
                  }
                  let line_index : Int = e.node!.getLine()
                  print((e.node!.getFilename() + " Line: ") + String(line_index))
                  print(e.description)
                  print(e.node!.getLineString(line_index : line_index))
                }
              } else {
                print("no errors found")
              }
            }
            if ( b_failed ) {
              wr.out(str : "/* custom operator compilation failed */ ", newLine : false)
            } else {
              wr.out(str : ("RangerStaticMethods." + stdFnName) + "(", newLine : false)
              for ( i_2 , cc ) in node.children.enumerated() {
                if ( i_2 == 0 ) {
                  continue;
                }
                if ( i_2 > 1 ) {
                  wr.out(str : ", ", newLine : false)
                }
                self.WalkNode(node : cc, ctx : ctx, wr : wr)
              }
              wr.out(str : ")", newLine : false)
            }
            return;
          }
        }
      }
    }
  }
  func findOpTemplate(op : CodeNode, node : CodeNode, ctx : RangerAppWriterContext, wr : CodeWriter) -> CodeNode? {
    /** unused:  let fnName : CodeNode = op.children[1]   **/ 
    /** unused:  let root : RangerAppWriterContext = ctx.getRoot()   **/ 
    let langName : String = ctx.getTargetLang()
    var tplImpl : CodeNode?
    if ( (op.children.count) > 3 ) {
      let details : CodeNode = op.children[3]
      for ( _ , det ) in details.children.enumerated() {
        if ( (det.children.count) > 0 ) {
          let fc : CodeNode = det.children[0]
          if ( fc.vref == "templates" ) {
            let tplList : CodeNode = det.children[1]
            for ( _ , tpl ) in tplList.children.enumerated() {
              let tplName : CodeNode = tpl.getFirst()
              tplImpl = tpl.getSecond();
              if ( (tplName.vref != "*") && (tplName.vref != langName) ) {
                continue;
              }
              if ( tplName.hasFlag(flagName : "mutable") ) {
                if ( false == node.hasFlag(flagName : "mutable") ) {
                  continue;
                }
              }
              return tplImpl;
            }
          }
        }
      }
    }
    return tplImpl;
  }
  func localCall(node : CodeNode, ctx : RangerAppWriterContext, wr : CodeWriter) -> Bool {
    if ( node.hasFnCall ) {
      if ( langWriter != nil  ) {
        langWriter!.writeFnCall(node : node, ctx : ctx, wr : wr)
        return true;
      }
    }
    if ( node.hasNewOper ) {
      langWriter!.writeNewCall(node : node, ctx : ctx, wr : wr)
      return true;
    }
    if ( node.hasVarDef ) {
      if ( node.disabled_node ) {
        langWriter!.disabledVarDef(node : node, ctx : ctx, wr : wr)
      } else {
        langWriter!.writeVarDef(node : node, ctx : ctx, wr : wr)
      }
      return true;
    }
    if ( node.hasClassDescription ) {
      langWriter!.writeClass(node : node, ctx : ctx, wr : wr)
      return true;
    }
    return false;
  }
  func WalkNode(node : CodeNode, ctx : RangerAppWriterContext, wr : CodeWriter) -> Void {
    self.initWriter(ctx : ctx)
    if ( node.isPrimitive() ) {
      self.WriteScalarValue(node : node, ctx : ctx, wr : wr)
      return;
    }
    self.lastProcessedNode = node;
    if ( node.value_type == 9 ) {
      self.WriteVRef(node : node, ctx : ctx, wr : wr)
      return;
    }
    if ( node.value_type == 16 ) {
      self.WriteVRef(node : node, ctx : ctx, wr : wr)
      return;
    }
    if ( (node.children.count) > 0 ) {
      if ( node.has_operator ) {
        let op : CodeNode = ctx.findOperator(node : node)
        /** unused:  let fc : CodeNode = op.getFirst()   **/ 
        let tplImpl : CodeNode? = self.findOpTemplate(op : op, node : node, ctx : ctx, wr : wr)
        var evalCtx : RangerAppWriterContext = ctx
        if ( node.evalCtx != nil  ) {
          evalCtx = node.evalCtx!;
        }
        if ( tplImpl != nil  ) {
          let opName : CodeNode = op.getSecond()
          if ( opName.hasFlag(flagName : "returns") ) {
            langWriter!.release_local_vars(node : node, ctx : evalCtx, wr : wr)
          }
          self.walkCommandList(cmd : tplImpl!, node : node, ctx : evalCtx, wr : wr)
        } else {
          self.findOpCode(op : op, node : node, ctx : evalCtx, wr : wr)
        }
        return;
      }
      if ( node.has_lambda ) {
        self.CreateLambda(node : node, ctx : ctx, wr : wr)
        return;
      }
      if ( node.has_lambda_call ) {
        self.CreateLambdaCall(node : node, ctx : ctx, wr : wr)
        return;
      }
      if ( (node.children.count) > 1 ) {
        if ( self.localCall(node : node, ctx : ctx, wr : wr) ) {
          return;
        }
      }
      /** unused:  let fc_1 : CodeNode = node.getFirst()   **/ 
    }
    if ( node.expression ) {
      for ( i , item ) in node.children.enumerated() {
        if ( (node.didReturnAtIndex >= 0) && (node.didReturnAtIndex < i) ) {
          break;
        }
        self.WalkNode(node : item, ctx : ctx, wr : wr)
      }
    } else {
    }
  }
  func walkCommandList(cmd : CodeNode, node : CodeNode, ctx : RangerAppWriterContext, wr : CodeWriter) -> Void {
    if ( ctx.expressionLevel() == 0 ) {
      wr.newline()
    }
    if ( ctx.expressionLevel() > 1 ) {
      wr.out(str : "(", newLine : false)
    }
    for ( _ , c ) in cmd.children.enumerated() {
      self.walkCommand(cmd : c, node : node, ctx : ctx, wr : wr)
    }
    if ( ctx.expressionLevel() > 1 ) {
      wr.out(str : ")", newLine : false)
    }
    if ( ctx.expressionLevel() == 0 ) {
      wr.newline()
    }
  }
  func walkCommand(cmd : CodeNode, node : CodeNode, ctx : RangerAppWriterContext, wr : CodeWriter) -> Void {
    if ( cmd.expression ) {
      if ( (cmd.children.count) < 2 ) {
        ctx.addError(targetnode : node, descr : "Invalid command")
        ctx.addError(targetnode : cmd, descr : "Invalid command")
        return;
      }
      let cmdE : CodeNode = cmd.getFirst()
      let cmdArg : CodeNode = cmd.getSecond()
      switch (cmdE.vref) {
        case "str" : 
          let idx : Int = cmdArg.int_value
          if ( (node.children.count) > idx ) {
            let arg : CodeNode = node.children[idx]
            wr.out(str : arg.string_value, newLine : false)
          }
        case "block" : 
          let idx_1 : Int = cmdArg.int_value
          if ( (node.children.count) > idx_1 ) {
            let arg_1 : CodeNode = node.children[idx_1]
            self.WalkNode(node : arg_1, ctx : ctx, wr : wr)
          }
        case "varname" : 
          if ( ctx.isVarDefined(name : cmdArg.vref) ) {
            let p : RangerAppParamDesc = ctx.getVariableDef(name : cmdArg.vref)
            wr.out(str : p.compiledName, newLine : false)
          }
        case "defvar" : 
          let p_1 : RangerAppParamDesc = RangerAppParamDesc()
          p_1.name = cmdArg.vref;
          p_1.value_type = cmdArg.value_type;
          p_1.node = cmdArg;
          p_1.nameNode = cmdArg;
          p_1.is_optional = false;
          ctx.defineVariable(name : p_1.name, desc : p_1)
        case "cc" : 
          let idx_2 : Int = cmdArg.int_value
          if ( (node.children.count) > idx_2 ) {
            let arg_2 : CodeNode = node.children[idx_2]
            let cc : UInt8 = UInt8( ( arg_2.string_value as NSString ).character( at: 0 ) )
            wr.out(str : "" + String((Int(cc))), newLine : false)
          }
        case "java_case" : 
          let idx_3 : Int = cmdArg.int_value
          if ( (node.children.count) > idx_3 ) {
            let arg_3 : CodeNode = node.children[idx_3]
            self.WalkNode(node : arg_3, ctx : ctx, wr : wr)
            if ( arg_3.didReturnAtIndex < 0 ) {
              wr.newline()
              wr.out(str : "break;", newLine : true)
            }
          }
        case "e" : 
          let idx_4 : Int = cmdArg.int_value
          if ( (node.children.count) > idx_4 ) {
            let arg_4 : CodeNode = node.children[idx_4]
            ctx.setInExpr()
            self.WalkNode(node : arg_4, ctx : ctx, wr : wr)
            ctx.unsetInExpr()
          }
        case "goset" : 
          let idx_5 : Int = cmdArg.int_value
          if ( (node.children.count) > idx_5 ) {
            let arg_5 : CodeNode = node.children[idx_5]
            ctx.setInExpr()
            langWriter!.WriteSetterVRef(node : arg_5, ctx : ctx, wr : wr)
            ctx.unsetInExpr()
          }
        case "pe" : 
          let idx_6 : Int = cmdArg.int_value
          if ( (node.children.count) > idx_6 ) {
            let arg_6 : CodeNode = node.children[idx_6]
            self.WalkNode(node : arg_6, ctx : ctx, wr : wr)
          }
        case "ptr" : 
          let idx_7 : Int = cmdArg.int_value
          if ( (node.children.count) > idx_7 ) {
            let arg_7 : CodeNode = node.children[idx_7]
            if ( arg_7.hasParamDesc ) {
              if ( arg_7.paramDesc!.nameNode!.isAPrimitiveType() == false ) {
                wr.out(str : "*", newLine : false)
              }
            } else {
              if ( arg_7.isAPrimitiveType() == false ) {
                wr.out(str : "*", newLine : false)
              }
            }
          }
        case "ptrsrc" : 
          let idx_8 : Int = cmdArg.int_value
          if ( (node.children.count) > idx_8 ) {
            let arg_8 : CodeNode = node.children[idx_8]
            if ( (arg_8.isPrimitiveType() == false) && (arg_8.isPrimitive() == false) ) {
              wr.out(str : "&", newLine : false)
            }
          }
        case "nameof" : 
          let idx_9 : Int = cmdArg.int_value
          if ( (node.children.count) > idx_9 ) {
            let arg_9 : CodeNode = node.children[idx_9]
            wr.out(str : arg_9.vref, newLine : false)
          }
        case "list" : 
          let idx_10 : Int = cmdArg.int_value
          if ( (node.children.count) > idx_10 ) {
            let arg_10 : CodeNode = node.children[idx_10]
            for ( i , ch ) in arg_10.children.enumerated() {
              if ( i > 0 ) {
                wr.out(str : " ", newLine : false)
              }
              ctx.setInExpr()
              self.WalkNode(node : ch, ctx : ctx, wr : wr)
              ctx.unsetInExpr()
            }
          }
        case "repeat_from" : 
          let idx_11 : Int = cmdArg.int_value
          repeat_index = idx_11;
          if ( (node.children.count) >= idx_11 ) {
            let cmdToRepeat : CodeNode = cmd.getThird()
            var i_1 : Int = idx_11
            while (i_1 < (node.children.count)) {
              if ( i_1 >= idx_11 ) {
                for ( _ , cc_1 ) in cmdToRepeat.children.enumerated() {
                  if ( (cc_1.children.count) > 0 ) {
                    let fc : CodeNode = cc_1.getFirst()
                    if ( fc.vref == "e" ) {
                      let dc : CodeNode = cc_1.getSecond()
                      dc.int_value = i_1;
                    }
                    if ( fc.vref == "block" ) {
                      let dc_1 : CodeNode = cc_1.getSecond()
                      dc_1.int_value = i_1;
                    }
                  }
                }
                self.walkCommandList(cmd : cmdToRepeat, node : node, ctx : ctx, wr : wr)
                if ( (i_1 + 1) < (node.children.count) ) {
                  wr.out(str : ",", newLine : false)
                }
              }
              i_1 = i_1 + 1;
            }
          }
        case "comma" : 
          let idx_12 : Int = cmdArg.int_value
          if ( (node.children.count) > idx_12 ) {
            let arg_11 : CodeNode = node.children[idx_12]
            for ( i_2 , ch_1 ) in arg_11.children.enumerated() {
              if ( i_2 > 0 ) {
                wr.out(str : ",", newLine : false)
              }
              ctx.setInExpr()
              self.WalkNode(node : ch_1, ctx : ctx, wr : wr)
              ctx.unsetInExpr()
            }
          }
        case "swift_rc" : 
          let idx_13 : Int = cmdArg.int_value
          if ( (node.children.count) > idx_13 ) {
            let arg_12 : CodeNode = node.children[idx_13]
            if ( arg_12.hasParamDesc ) {
              if ( arg_12.paramDesc!.ref_cnt == 0 ) {
                wr.out(str : "_", newLine : false)
              } else {
                let p_2 : RangerAppParamDesc = ctx.getVariableDef(name : arg_12.vref)
                wr.out(str : p_2.compiledName, newLine : false)
              }
            } else {
              wr.out(str : arg_12.vref, newLine : false)
            }
          }
        case "r_ktype" : 
          let idx_14 : Int = cmdArg.int_value
          if ( (node.children.count) > idx_14 ) {
            let arg_13 : CodeNode = node.children[idx_14]
            if ( arg_13.hasParamDesc ) {
              let ss : String = langWriter!.getObjectTypeString(type_string : arg_13.paramDesc!.nameNode!.key_type, ctx : ctx)
              wr.out(str : ss, newLine : false)
            } else {
              let ss_1 : String = langWriter!.getObjectTypeString(type_string : arg_13.key_type, ctx : ctx)
              wr.out(str : ss_1, newLine : false)
            }
          }
        case "r_atype" : 
          let idx_15 : Int = cmdArg.int_value
          if ( (node.children.count) > idx_15 ) {
            let arg_14 : CodeNode = node.children[idx_15]
            if ( arg_14.hasParamDesc ) {
              let ss_2 : String = langWriter!.getObjectTypeString(type_string : arg_14.paramDesc!.nameNode!.array_type, ctx : ctx)
              wr.out(str : ss_2, newLine : false)
            } else {
              let ss_3 : String = langWriter!.getObjectTypeString(type_string : arg_14.array_type, ctx : ctx)
              wr.out(str : ss_3, newLine : false)
            }
          }
        case "custom" : 
          langWriter!.CustomOperator(node : node, ctx : ctx, wr : wr)
        case "arraytype" : 
          let idx_16 : Int = cmdArg.int_value
          if ( (node.children.count) > idx_16 ) {
            let arg_15 : CodeNode = node.children[idx_16]
            if ( arg_15.hasParamDesc ) {
              langWriter!.writeArrayTypeDef(node : arg_15.paramDesc!.nameNode!, ctx : ctx, wr : wr)
            } else {
              langWriter!.writeArrayTypeDef(node : arg_15, ctx : ctx, wr : wr)
            }
          }
        case "rawtype" : 
          let idx_17 : Int = cmdArg.int_value
          if ( (node.children.count) > idx_17 ) {
            let arg_16 : CodeNode = node.children[idx_17]
            if ( arg_16.hasParamDesc ) {
              langWriter!.writeRawTypeDef(node : arg_16.paramDesc!.nameNode!, ctx : ctx, wr : wr)
            } else {
              langWriter!.writeRawTypeDef(node : arg_16, ctx : ctx, wr : wr)
            }
          }
        case "macro" : 
          let p_write : CodeWriter = wr.getTag(name : "utilities")
          let newWriter : CodeWriter = CodeWriter()
          let testCtx : RangerAppWriterContext = ctx.fork()
          testCtx.restartExpressionLevel()
          self.walkCommandList(cmd : cmdArg, node : node, ctx : testCtx, wr : newWriter)
          let p_str : String = newWriter.getCode()
          /** unused:  let root : RangerAppWriterContext = ctx.getRoot()   **/ 
          if ( (p_write.compiledTags[p_str] != nil) == false ) {
            p_write.compiledTags[p_str] = true
            let mCtx : RangerAppWriterContext = ctx.fork()
            mCtx.restartExpressionLevel()
            self.walkCommandList(cmd : cmdArg, node : node, ctx : mCtx, wr : p_write)
          }
        case "create_polyfill" : 
          let p_write_1 : CodeWriter = wr.getTag(name : "utilities")
          let p_str_1 : String = cmdArg.string_value
          if ( (p_write_1.compiledTags[p_str_1] != nil) == false ) {
            p_write_1.raw(str : p_str_1, newLine : true)
            p_write_1.compiledTags[p_str_1] = true
          }
        case "typeof" : 
          let idx_18 : Int = cmdArg.int_value
          if ( (node.children.count) >= idx_18 ) {
            let arg_17 : CodeNode = node.children[idx_18]
            if ( arg_17.hasParamDesc ) {
              self.writeTypeDef(node : arg_17.paramDesc!.nameNode!, ctx : ctx, wr : wr)
            } else {
              self.writeTypeDef(node : arg_17, ctx : ctx, wr : wr)
            }
          }
        case "imp" : 
          langWriter!.import_lib(lib_name : cmdArg.string_value, ctx : ctx, wr : wr)
        case "atype" : 
          let idx_19 : Int = cmdArg.int_value
          if ( (node.children.count) >= idx_19 ) {
            let arg_18 : CodeNode = node.children[idx_19]
            let p_3 : RangerAppParamDesc? = self.findParamDesc(obj : arg_18, ctx : ctx, wr : wr)
            let nameNode : CodeNode = p_3!.nameNode!
            let tn : String = nameNode.array_type
            wr.out(str : self.getTypeString(str : tn, ctx : ctx), newLine : false)
          }
        default :
          break
      }
    } else {
      if ( cmd.value_type == 9 ) {
        switch (cmd.vref) {
          case "nl" : 
            wr.newline()
          case "space" : 
            wr.out(str : " ", newLine : false)
          case "I" : 
            wr.indent(delta : 1)
          case "i" : 
            wr.indent(delta : -1)
          case "op" : 
            let fc_1 : CodeNode = node.getFirst()
            wr.out(str : fc_1.vref, newLine : false)
          default :
            break
        }
      } else {
        if ( cmd.value_type == 4 ) {
          wr.out(str : cmd.string_value, newLine : false)
        }
      }
    }
  }
  func compile(node : CodeNode, ctx : RangerAppWriterContext, wr : CodeWriter) -> Void {
  }
  func findParamDesc(obj : CodeNode, ctx : RangerAppWriterContext, wr : CodeWriter) -> RangerAppParamDesc? {
    var varDesc : RangerAppParamDesc?
    var set_nsp : Bool = false
    var classDesc : RangerAppClassDesc?
    if ( 0 == (obj.nsp.count) ) {
      set_nsp = true;
    }
    if ( obj.vref != "this" ) {
      if ( (obj.ns.count) > 1 ) {
        let cnt : Int = obj.ns.count
        var classRefDesc : RangerAppParamDesc?
        for ( i , strname ) in obj.ns.enumerated() {
          if ( i == 0 ) {
            if ( strname == "this" ) {
              classDesc = ctx.getCurrentClass();
              if ( set_nsp ) {
                obj.nsp.append(classDesc!)
              }
            } else {
              if ( ctx.isDefinedClass(name : strname) ) {
                classDesc = ctx.findClass(name : strname);
                if ( set_nsp ) {
                  obj.nsp.append(classDesc!)
                }
                continue;
              }
              classRefDesc = ctx.getVariableDef(name : strname);
              if ( classRefDesc == nil ) {
                ctx.addError(targetnode : obj, descr : "Error, no description for called object: " + strname)
                break;
              }
              if ( set_nsp ) {
                obj.nsp.append(classRefDesc!)
              }
              classRefDesc!.ref_cnt = 1 + classRefDesc!.ref_cnt;
              classDesc = ctx.findClass(name : classRefDesc!.nameNode!.type_name);
            }
          } else {
            if ( i < (cnt - 1) ) {
              varDesc = classDesc!.findVariable(f_name : strname);
              if ( varDesc == nil ) {
                ctx.addError(targetnode : obj, descr : "Error, no description for refenced obj: " + strname)
              }
              let subClass : String = varDesc!.getTypeName()
              classDesc = ctx.findClass(name : subClass);
              if ( set_nsp ) {
                obj.nsp.append(varDesc!)
              }
              continue;
            }
            if ( classDesc != nil  ) {
              varDesc = classDesc!.findVariable(f_name : strname);
              if ( varDesc == nil ) {
                var classMethod : RangerAppFunctionDesc? = classDesc!.findMethod(f_name : strname)
                if ( classMethod == nil ) {
                  classMethod = classDesc!.findStaticMethod(f_name : strname);
                  if ( classMethod == nil ) {
                    ctx.addError(targetnode : obj, descr : "variable not found " + strname)
                  }
                }
                if ( classMethod != nil  ) {
                  if ( set_nsp ) {
                    obj.nsp.append(classMethod!)
                  }
                  return classMethod;
                }
              }
              if ( set_nsp ) {
                obj.nsp.append(varDesc!)
              }
            }
          }
        }
        return varDesc;
      }
      varDesc = ctx.getVariableDef(name : obj.vref);
      if ( varDesc!.nameNode != nil  ) {
      } else {
        print("findParamDesc : description not found for " + obj.vref)
        if ( varDesc != nil  ) {
          print("Vardesc was found though..." + varDesc!.name)
        }
        ctx.addError(targetnode : obj, descr : "Error, no description for called object: " + obj.vref)
      }
      return varDesc;
    }
    let cc : RangerAppClassDesc? = ctx.getCurrentClass()
    return cc;
  }
}
func ==(l: ColorConsole, r: ColorConsole) -> Bool {
  return l === r
}
class ColorConsole : Equatable  { 
  func out(color : String, str : String) -> Void {
    print(str)
  }
}
func ==(l: CompilerInterface, r: CompilerInterface) -> Bool {
  return l === r
}
class CompilerInterface : Equatable  { 
  static func displayCompilerErrors(appCtx : RangerAppWriterContext) -> Void {
    let cons : ColorConsole = ColorConsole()
    for ( _ , e ) in appCtx.compilerErrors.enumerated() {
      let line_index : Int = e.node!.getLine()
      cons.out(color : "gray", str : (e.node!.getFilename() + " Line: ") + String((1 + line_index)))
      cons.out(color : "gray", str : e.description)
      cons.out(color : "gray", str : e.node!.getLineString(line_index : line_index))
      cons.out(color : "", str : e.node!.getColStartString() + "^-------")
    }
  }
  static func displayParserErrors(appCtx : RangerAppWriterContext) -> Void {
    if ( (appCtx.parserErrors.count) == 0 ) {
      print("no language test errors")
      return;
    }
    print("LANGUAGE TEST ERRORS:")
    for ( _ , e_1 ) in appCtx.parserErrors.enumerated() {
      let line_index_1 : Int = e_1.node!.getLine()
      print((e_1.node!.getFilename() + " Line: ") + String((1 + line_index_1)))
      print(e_1.description)
      print(e_1.node!.getLineString(line_index : line_index_1))
    }
  }
}
func __main__swift() {
  let allowed_languages : [String] = ["es6","go","scala","java7","swift3","cpp","php","ranger"]
  if ( (CommandLine.arguments.count - 1) < 5 ) {
    print("Ranger compiler, version 2.0.8")
    print("usage <file> <language-file> <language> <directory> <targetfile>")
    print("allowed languages: " + (allowed_languages.joined(separator:" ")))
    return;
  }
  let the_file : String = CommandLine.arguments[0 + 1]
  let the_lang_file : String = CommandLine.arguments[1 + 1]
  let the_lang : String = CommandLine.arguments[2 + 1]
  let the_target_dir : String = CommandLine.arguments[3 + 1]
  let the_target : String = CommandLine.arguments[4 + 1]
  print("language == " + the_lang)
  if ( (r_index_of(arr:allowed_languages, elem:the_lang)) < 0 ) {
    print("Invalid language : " + the_lang)
    /** unused:  let s : String = ""   **/ 
    print("allowed languages: " + (allowed_languages.joined(separator:" ")))
    return;
  }
  if ( (r_file_exists(fileName:"." + "/" + the_file )) == false ) {
    print("Could not compile.")
    print("File not found: " + the_file)
    return;
  }
  if ( (r_file_exists(fileName:"." + "/" + the_lang_file )) == false ) {
    print(("language file " + the_lang_file) + " not found!")
    print("download: https://raw.githubusercontent.com/terotests/Ranger/master/compiler/Lang.clj")
    return;
  }
  print("File to be compiled: " + the_file)
  let c : String? = r_read_file(dirName: "." + "/" + the_file) 
  let code : SourceCode = SourceCode(code_str : c!)
  code.filename = the_file;
  let parser : RangerLispParser = RangerLispParser(code_module : code)
  parser.parse()
  let lcc : LiveCompiler = LiveCompiler()
  let node : CodeNode = parser.rootNode!
  let flowParser : RangerFlowParser = RangerFlowParser()
  let appCtx : RangerAppWriterContext = RangerAppWriterContext()
  let wr : CodeWriter = CodeWriter()
  do {
    let _start = CFAbsoluteTimeGetCurrent()
    flowParser.mergeImports(node : node, ctx : appCtx, wr : wr)
    let lang_str : String? = r_read_file(dirName: "." + "/" + the_lang_file) 
    let lang_code : SourceCode = SourceCode(code_str : lang_str!)
    lang_code.filename = the_lang_file;
    let lang_parser : RangerLispParser = RangerLispParser(code_module : lang_code)
    lang_parser.parse()
    appCtx.langOperators = lang_parser.rootNode!;
    appCtx.setRootFile(file_name : the_file)
    print("1. Collecting available methods.")
    flowParser.CollectMethods(node : node, ctx : appCtx, wr : wr)
    if ( (appCtx.compilerErrors.count) > 0 ) {
      CompilerInterface.displayCompilerErrors(appCtx : appCtx)
      return;
    }
    print("2. Analyzing the code.")
    appCtx.targetLangName = the_lang;
    print("selected language is " + appCtx.targetLangName)
    flowParser.StartWalk(node : node, ctx : appCtx, wr : wr)
    if ( (appCtx.compilerErrors.count) > 0 ) {
      CompilerInterface.displayCompilerErrors(appCtx : appCtx)
      return;
    }
    print("3. Compiling the source code.")
    let fileSystem : CodeFileSystem = CodeFileSystem()
    let file : CodeFile = fileSystem.getFile(path : ".", name : the_target)
    let wr_1 : CodeWriter? = file.getWriter()
    var staticMethods : RangerAppClassDesc?
    let importFork : CodeWriter = wr_1!.fork()
    for ( _ , cName ) in appCtx.definedClassList.enumerated() {
      if ( cName == "RangerStaticMethods" ) {
        staticMethods = appCtx.definedClasses[cName];
        continue;
      }
      let cl : RangerAppClassDesc? = appCtx.definedClasses[cName]
      if ( cl!.is_trait ) {
        continue;
      }
      if ( cl!.is_system ) {
        continue;
      }
      if ( cl!.is_system_union ) {
        continue;
      }
      lcc.WalkNode(node : cl!.classNode!, ctx : appCtx, wr : wr_1!)
    }
    if ( staticMethods != nil  ) {
      lcc.WalkNode(node : staticMethods!.classNode!, ctx : appCtx, wr : wr_1!)
    }
    for ( _ , ifDesc ) in flowParser.collectedIntefaces.enumerated() {
      print("should define also interface " + ifDesc.name)
      lcc.langWriter!.writeInterface(cl : ifDesc, ctx : appCtx, wr : wr_1!)
    }
    let import_list : [String] = wr_1!.getImports()
    if ( appCtx.targetLangName == "go" ) {
      importFork.out(str : "package main", newLine : true)
      importFork.newline()
      importFork.out(str : "import (", newLine : true)
      importFork.indent(delta : 1)
    }
    for ( _ , codeStr ) in import_list.enumerated() {
      switch (appCtx.targetLangName) {
        case "go" : 
          if ( (Int( ( codeStr as NSString ).character( at: 0 ) )) == (Int((UInt8( ( "_" as NSString ).character( at: 0 ) )))) ) {
            importFork.out(str : (" _ \"" + (codeStr[codeStr.index(codeStr.startIndex, offsetBy:1)..<codeStr.index(codeStr.startIndex, offsetBy:(codeStr.characters.count))])) + "\"", newLine : true)
          } else {
            importFork.out(str : ("\"" + codeStr) + "\"", newLine : true)
          }
        case "rust" : 
          importFork.out(str : ("use " + codeStr) + ";", newLine : true)
        case "cpp" : 
          importFork.out(str : ("#include  " + codeStr) + "", newLine : true)
        default: 
          importFork.out(str : ("import " + codeStr) + "", newLine : true)
          break;
      }
    }
    if ( appCtx.targetLangName == "go" ) {
      importFork.indent(delta : -1)
      importFork.out(str : ")", newLine : true)
    }
    fileSystem.saveTo(path : the_target_dir)
    print("Ready.")
    CompilerInterface.displayCompilerErrors(appCtx : appCtx)
    print("Total time", CFAbsoluteTimeGetCurrent() - _start )
  }
}
// call the main function
__main__swift()
