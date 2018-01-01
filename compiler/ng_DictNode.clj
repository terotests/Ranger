
enum DictNodeType {
  NoType
  Double
  Integer
  String
  Boolean
  Array
  Object
  Null
}

class DictNode {
  def is_property:boolean false
  def is_property_value:boolean false
  def vref:string ""
  def value_type:DictNodeType DictNodeType.Object
  def double_value:double 0.0
  def int_value:int 0
  def string_value:string ""
  def boolean_value:boolean false
  def object_value:DictNode
  def children:[DictNode]
  def objects:[string:DictNode]
  def dict_keys:[string]
  fn EncodeString:string (orig_str:string) {
    def encoded_str:string ""
    def str_length:int (strlen orig_str)
    def ii:int 0
    def buff:charbuffer (to_charbuffer orig_str)
    def cb_len:int (length buff)
    while (ii < cb_len) {
      def cc:char (charAt buff ii)
      switch cc {
        case 8 {
          encoded_str = ((encoded_str + (strfromcode 92)) + (strfromcode 98))
        }
        case 9 {
          encoded_str = ((encoded_str + (strfromcode 92)) + (strfromcode 116))
        }
        case 10 {
          encoded_str = ((encoded_str + (strfromcode 92)) + (strfromcode 110))
        }
        case 12 {
          encoded_str = ((encoded_str + (strfromcode 92)) + (strfromcode 102))
        }
        case 13 {
          encoded_str = ((encoded_str + (strfromcode 92)) + (strfromcode 114))
        }
        case 34 {
          encoded_str = ((encoded_str + (strfromcode 92)) + "\"")
        }
        case 92 {
          encoded_str = ((encoded_str + (strfromcode 92)) + (strfromcode 92))
        }
        case 47 {
          encoded_str = ((encoded_str + (strfromcode 92)) + (strfromcode 47))
        }
        default {
          encoded_str = (encoded_str + (strfromcode cc))
        }
      }
      ii = (1 + ii)
    }
    return encoded_str
  }
  sfn createEmptyObject:DictNode () {
    def v:DictNode (new DictNode ())
    v.value_type = DictNodeType.Object
    return v
  }
  fn addString:void (key:string value:string) {
    if (value_type == DictNodeType.Object) {
      def v:DictNode (new DictNode ())
      v.string_value = value
      v.value_type = DictNodeType.String
      v.vref = key
      v.is_property = true
      push dict_keys key
      set objects key v
    }
  }
  fn addDouble:void (key:string value:double) {
    if (value_type == DictNodeType.Object) {
      def v:DictNode (new DictNode ())
      v.double_value = value
      v.value_type = DictNodeType.Double
      v.vref = key
      v.is_property = true
      push dict_keys key
      set objects key v
    }
  }  
  fn addInt:void (key:string value:int) {
    if (value_type == DictNodeType.Object) {
      def v:DictNode (new DictNode ())
      v.int_value = value
      v.value_type = DictNodeType.Integer
      v.vref = key
      v.is_property = true
      push dict_keys key
      set objects key v
    }
  }  
  fn addBoolean:void (key:string value:boolean) {
    if (value_type == DictNodeType.Object) {
      def v:DictNode (new DictNode ())
      v.boolean_value = value
      v.value_type = DictNodeType.Boolean
      v.vref = key
      v.is_property = true
      push dict_keys key
      set objects key v
    }
  }  
  fn addObject@(optional weak):DictNode (key:string) {
    def v@(lives optional):DictNode
    if (value_type == DictNodeType.Object) {
      def p:DictNode (new DictNode ())
      v =  (new DictNode ())
      p.value_type = DictNodeType.Object
      p.vref = key
      p.is_property = true
      v.value_type = DictNodeType.Object
      v.vref = key
      v.is_property_value = true
      p.object_value = v
      push dict_keys key
      set objects key p
      return v
    }
    return v
  }
  fn setObject:void (key:string value@(strong):DictNode) {
    if (value_type == DictNodeType.Object) {
      def p:DictNode (new DictNode ())
      p.value_type = DictNodeType.Object
      p.vref = key
      p.is_property = true
      value.is_property_value = true
      value.vref = key
      p.object_value = value
      push dict_keys key
      set objects key p
    }
  }
  fn addArray@(optional weak):DictNode (key:string) {
  def v@(lives optional):DictNode
   if (value_type == DictNodeType.Object) {
      v = (new DictNode ())
      v.value_type = DictNodeType.Array
      v.vref = key
      v.is_property = true
      push dict_keys key
      set objects key (unwrap v)
      return v
    }
    return v
  }
  fn push:void (obj@(strong):DictNode) {
     if(value_type == DictNodeType.Array) {
       push children obj
     }
  }
  fn getDoubleAt:double (index:int) {
    if (index < (array_length children)) {
      def k:DictNode (itemAt children index)
      return k.double_value
    }
    return 0.0
  }
  fn getStringAt:string (index:int) {
    if (index < (array_length children)) {
      def k:DictNode (itemAt children index)
      return k.string_value
    }
    return ""
  }
  fn getIntAt:int (index:int) {
    if (index < (array_length children)) {
      def k:DictNode (itemAt children index)
      return k.int_value
    }
    return 0
  }  
  fn getBooleanAt:boolean (index:int) {
    if (index < (array_length children)) {
      def k:DictNode (itemAt children index)
      return k.boolean_value
    }
    return false
  } 
  fn getString@(optional):string (key:string) {
    def res@(optional):string
    if (has objects key) {
      def k:DictNode (get objects key)
      res = k.string_value
    }
    return res
  }
  fn getDouble@(optional):double (key:string) {
    def res@(optional):double
    if (has objects key) {
      def k:DictNode (get objects key)
      res = k.double_value
    }
    return res
  }  
  fn getInt@(optional):int (key:string) {
    def res@(optional):int
    if (has objects key) {
      def k:DictNode (get objects key)
      res = k.int_value
    }
    return res
  }  
  fn getBoolean@(optional):boolean (key:string) {
    def res@(optional):boolean
    if (has objects key) {
      def k:DictNode (get objects key)
      res = k.boolean_value
    }
    return res
  }   
  fn getArray@(optional weak):DictNode (key:string) {
    def res@(weak optional):DictNode
    if (has objects key) {
      def obj:DictNode (get objects key)
      if obj.is_property {
        res = obj.object_value
      }
    }
    return res
  }
  fn getArrayAt@(weak optional):DictNode (index:int) {
    def res@(weak optional):DictNode
    if (index < (array_length children)) {
      res = (itemAt children index)
    }
    return res
  }
  fn getObject@(weak optional):DictNode (key:string) {
    def res@(weak optional):DictNode
    if (has objects key) {
      def obj:DictNode (get objects key)
      if obj.is_property {
        res = obj.object_value
      }
    }
    return res
  }
  fn getObjectAt@(weak optional):DictNode (index:int) {
    def res@(weak optional):DictNode
    if (index < (array_length children)) {
      res = (itemAt children index)
    }
    return res
  }  

  fn stringify:string () {
    if is_property {
      if (value_type == DictNodeType.Null) {
        return ((("\"" + vref) + "\"") + ":null")
      }
      if (value_type == DictNodeType.Boolean) {
        if boolean_value {
          return (((("\"" + vref) + "\"") + ":") + "true")
        } {
          return (((("\"" + vref) + "\"") + ":") + "false")
        }
      }
      if (value_type == DictNodeType.Double) {
        return (((("\"" + vref) + "\"") + ":") + double_value)
      }
      if (value_type == DictNodeType.Integer) {
        return (((("\"" + vref) + "\"") + ":") + int_value)
      }      
      if (value_type == DictNodeType.String) {
        return (((((("\"" + vref) + "\"") + ":") + "\"") + (this.EncodeString(string_value))) + "\"")
      }

    } {
      if (value_type == DictNodeType.Null) {
        return "null"
      }
      if (value_type == DictNodeType.Double) {
        return ("" + double_value)
      }
      if (value_type == DictNodeType.Integer) {
        return ("" + int_value)
      }      
      if (value_type == DictNodeType.String) {
        return (("\"" + (this.EncodeString(string_value))) + "\"")
      }
      if (value_type == DictNodeType.Boolean) {
        if boolean_value {
          return "true"
        } {
          return "false"
        }
      }
    }
    if (value_type == DictNodeType.Array) {
      def str:string ""
      if is_property {
        str = ((("\"" + vref) + "\"") + ":[")
      } {
        str = "["
      }
      for children item:DictNode i {
        if (i > 0) {
          str = (str + ",")
        }
        str = (str + (item.stringify()))
      }
      str = (str + "]")
      return str
    }
    if (value_type == DictNodeType.Object) {
      def str:string ""
      if is_property {
        return (((("\"" + vref) + "\"") + ":") + (object_value.stringify()))
      } {
        str = "{"
        for dict_keys key:string i {
          if (i > 0) {
            str = (str + ",")
          }
          def item:DictNode (get objects key)
          str = (str + (item.stringify()))
        }
        str = (str + "}")
        return str
      }
    }
    return ""
  }
  sfn tester@(main):void () {
    def oo:DictNode (DictNode.createEmptyObject())
    def fb:DictNode (oo.addObject("foobar"))
    fb.addString("key" "Somevalue")
    print (oo.stringify())
  }  

}

