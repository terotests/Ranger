

class RangerRefForce {
  def strength:int 0
  def lifetime:int 1
  def changer@(weak optional):CodeNode
}

class RangerAppParamDesc {
  def name:string ""
  def compiledName:string ""
  def debugString:string ""
  def ref_cnt:int 0
  def init_cnt:int 0
  def set_cnt:int 0
  def return_cnt:int 0
  def prop_assign_cnt:int 0
  def value_type:RangerNodeType RangerNodeType.NoType
  def has_default:boolean false
  def def_value:CodeNode
  def default_value:RangerNodeValue
  def isThis:boolean false
  def classDesc:RangerAppClassDesc
  def fnDesc:RangerAppFunctionDesc
  def ownerHistory:[RangerRefForce]
  def varType:RangerContextVarType RangerContextVarType.NoType
  def refType:RangerNodeRefType RangerNodeRefType.NoType
  def initRefType:RangerNodeRefType RangerNodeRefType.NoType
  def isParam:boolean
  def paramIndex:int 0
  def is_optional:boolean false
  def is_mutating:boolean false
  def is_set:boolean false
  def is_class_variable:boolean false
  def node@(weak):CodeNode
  def nameNode@(weak):CodeNode
  def description:string ""
  def git_doc:string ""
  fn changeStrength:void (newStrength:int lifeTime:int changer:CodeNode) {
    def entry:RangerRefForce (new RangerRefForce ())
    entry.strength = newStrength
    entry.lifetime = lifeTime
    entry.changer = changer
    push ownerHistory entry
  }
  fn isProperty:boolean () {
    return true
  }
  fn isClass:boolean () {
    return false
  }
  fn doesInherit:boolean () {
    return false
  }   
  fn isAllocatedType:boolean () {
    if (!null? nameNode) {
      if (nameNode.eval_type != RangerNodeType.NoType) {
        if (nameNode.eval_type == RangerNodeType.Array) {
          return true
        }
        if (nameNode.eval_type == RangerNodeType.Hash) {
          return true
        }
        if ((((nameNode.eval_type == RangerNodeType.String) || (nameNode.eval_type == RangerNodeType.Double)) || (nameNode.eval_type == RangerNodeType.Boolean)) || (nameNode.eval_type == RangerNodeType.Integer)) {
          return false
        }
        if (nameNode.eval_type == RangerNodeType.Enum) {
            return false
        }
        return true
      }
      if (nameNode.eval_type == RangerNodeType.Enum) {
          return false
      }

      if (nameNode.value_type == RangerNodeType.VRef) {
        
        if (false == (nameNode.isPrimitive())) {
          return true
        }
      }
      if (nameNode.value_type == RangerNodeType.Array) {
        return true
      }
      if (nameNode.value_type == RangerNodeType.Hash) {
        return true
      }
    }
    return false
  }
  fn moveRefTo:void (node:CodeNode target:RangerAppParamDesc ctx:RangerAppWriterContext) {
    if node.ref_change_done {
      return
    }
    if (false == (target.isAllocatedType())) {
      return
    }
    if (false == (this.isAllocatedType())) {
      return
    }
    node.ref_change_done = true
    def other_s:int (target.getStrength())
    def my_s:int (this.getStrength())
    def my_lifetime:int (this.getLifetime())
    def other_lifetime:int (target.getLifetime())
    def a_lives:boolean false
    def b_lives:boolean false
    def tmp_var:boolean (nameNode.hasFlag("temp"))
    if (!null? target.nameNode) {
      if (target.nameNode.hasFlag("lives")) {
        my_lifetime = 2
        b_lives = true
      }
    }
    if (!null? nameNode) {
      if (nameNode.hasFlag("lives")) {
        my_lifetime = 2
        a_lives = true
      }
    }
    if (other_s > 0) {
      if (my_s == 1) {
        def lt:int my_lifetime
        if (other_lifetime > my_lifetime) {
          lt = other_lifetime
        }
        this.changeStrength(0 lt node)
      } {
        if (my_s == 0) {
          if (tmp_var == false) {
            ctx.addError(node ("Can not move a weak reference to a strong target, at " + (node.getCode())))
            print "can not move weak refs to strong target:"
            this.debugRefChanges()
          }
        } {
          ctx.addError(node ("Can not move immutable reference to a strong target, evald type " + nameNode.eval_type_name))
        }
      }
    } {
      if (a_lives || b_lives) {
      } {
        if ((my_lifetime < other_lifetime) && (return_cnt == 0)) {
          if ((nameNode.hasFlag("returnvalue")) == false) {
            ctx.addError(node ("Can not create a weak reference if target has longer lifetime than original, current lifetime == " + my_lifetime))
          }
        }
      }
    }
  }
  fn originalStrength:int () {
    def len:int (array_length ownerHistory)
    if (len > 0) {
      def firstEntry:RangerRefForce (itemAt ownerHistory 0)
      return firstEntry.strength
    }
    return 1
  }
  fn getLifetime:int () {
    def len:int (array_length ownerHistory)
    if (len > 0) {
      def lastEntry:RangerRefForce (itemAt ownerHistory (len - 1))
      return lastEntry.lifetime
    }
    return 1
  }
  fn getStrength:int () {
    def len:int (array_length ownerHistory)
    if (len > 0) {
      def lastEntry:RangerRefForce (itemAt ownerHistory (len - 1))
      return lastEntry.strength
    }
    return 1
  }
  fn debugRefChanges:void () {
    print (("variable " + name) + " ref history : ")
    for ownerHistory h:RangerRefForce i {
      print (((" => change to " + h.strength) + " by ") + (h.changer.getCode()))
    }
  }
  fn pointsToObject:boolean (ctx:RangerAppWriterContext) {
    if (!null? nameNode) {
      def is_primitive:boolean false
      switch nameNode.array_type {
        case "string" {
          is_primitive = true
        }
        case "int" {
          is_primitive = true
        }
        case "boolean" {
          is_primitive = true
        }
        case "double" {
          is_primitive = true
        }
      }
      if is_primitive {
        return false
      }
      if ((nameNode.value_type == RangerNodeType.Array) || (nameNode.value_type == RangerNodeType.Hash)) {
        def is_object:boolean true
        switch nameNode.array_type {
          case "string" {
            is_object = false
          }
          case "int" {
            is_object = false
          }
          case "boolean" {
            is_object = false
          }
          case "double" {
            is_object = false
          }
        }
        return is_object
      }
      if (nameNode.value_type == RangerNodeType.VRef) {
        def is_object:boolean true
        switch nameNode.type_name {
          case "string" {
            is_object = false
          }
          case "int" {
            is_object = false
          }
          case "boolean" {
            is_object = false
          }
          case "double" {
            is_object = false
          }
        }
        if (ctx.isEnumDefined(nameNode.type_name)) {
          return false
        }
        return is_object
      }
    }
    return false
  }
  fn isObject:boolean () {
    if (!null? nameNode) {
      if (nameNode.value_type == RangerNodeType.VRef) {
        if (false == (nameNode.isPrimitive())) {
          return true
        }
      }
    }
    return false
  }
  fn isArray:boolean () {
    if (!null? nameNode) {
      if (nameNode.value_type == RangerNodeType.Array) {
        return true
      }
    }
    return false
  }
  fn isHash:boolean () {
    if (!null? nameNode) {
      if (nameNode.value_type == RangerNodeType.Hash) {
        return true
      }
    }
    return false
  }
  fn isPrimitive:boolean () {
    if (!null? nameNode) {
      return (nameNode.isPrimitive())
    }
    return false
  }
  fn getRefTypeName:string () {
    switch refType {
      case RangerNodeRefType.NoType {
        return "NoType"
      }
      case RangerNodeRefType.Weak {
        return "Weak"
      }
    }
    return ""
  }
  fn getVarTypeName:string () {
    switch refType {
      case RangerContextVarType.NoType {
        return "NoType"
      }
      case RangerContextVarType.This {
        return "This"
      }
    }
    return ""
  }
  fn getTypeName:string () {
    def s:string nameNode.type_name
    return s
  }
}
