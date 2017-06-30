import java.util.Optional;
import java.util.*;
import java.io.*;

class RangerAppParamDesc { 
  public String name = "";
  public Optional<RangerAppValue> value = Optional.empty()     /** note: unused */;
  public String compiledName = "";
  public String debugString = "";
  public int ref_cnt = 0;
  public int init_cnt = 0;
  public int set_cnt = 0;
  public int return_cnt = 0;
  public int prop_assign_cnt = 0     /** note: unused */;
  public int value_type = 0;
  public boolean has_default = false     /** note: unused */;
  public Optional<CodeNode> def_value = Optional.empty();
  public Optional<RangerNodeValue> default_value = Optional.empty()     /** note: unused */;
  public boolean isThis = false     /** note: unused */;
  public Optional<RangerAppClassDesc> classDesc = Optional.empty()     /** note: unused */;
  public Optional<RangerAppFunctionDesc> fnDesc = Optional.empty()     /** note: unused */;
  public ArrayList<RangerRefForce> ownerHistory = new ArrayList<RangerRefForce>();
  public int varType = 0;
  public int refType = 0;
  public int initRefType = 0;
  public Optional<Boolean> isParam = Optional.empty()     /** note: unused */;
  public int paramIndex = 0     /** note: unused */;
  public boolean is_optional = false;
  public boolean is_mutating = false     /** note: unused */;
  public boolean is_set = false     /** note: unused */;
  public boolean is_class_variable = false;
  public Optional<CodeNode> node = Optional.empty();
  public Optional<CodeNode> nameNode = Optional.empty();
  public String description = ""     /** note: unused */;
  public String git_doc = ""     /** note: unused */;
  public boolean has_events = false;
  public Optional<RangerParamEventMap> eMap = Optional.empty();
  
  public void addEvent( String name , RangerParamEventHandler e ) {
    if ( has_events == false ) {
      eMap = Optional.of(new RangerParamEventMap());
      has_events = true;
    }
    eMap.get().addEvent(name, e);
  }
  
  public void changeStrength( int newStrength , int lifeTime , CodeNode changer ) {
    final RangerRefForce entry = new RangerRefForce();
    entry.strength = newStrength;
    entry.lifetime = lifeTime;
    entry.changer = Optional.of(changer);
    ownerHistory.add(entry);
  }
  
  public boolean isProperty() {
    return true;
  }
  
  public boolean isClass() {
    return false;
  }
  
  public boolean doesInherit() {
    return false;
  }
  
  public boolean isAllocatedType() {
    if ( nameNode.isPresent() ) {
      if ( nameNode.get().eval_type != 0 ) {
        if ( nameNode.get().eval_type == 6 ) {
          return true;
        }
        if ( nameNode.get().eval_type == 7 ) {
          return true;
        }
        if ( (((((nameNode.get().eval_type == 13) || (nameNode.get().eval_type == 12)) || (nameNode.get().eval_type == 4)) || (nameNode.get().eval_type == 2)) || (nameNode.get().eval_type == 5)) || (nameNode.get().eval_type == 3) ) {
          return false;
        }
        if ( nameNode.get().eval_type == 11 ) {
          return false;
        }
        return true;
      }
      if ( nameNode.get().eval_type == 11 ) {
        return false;
      }
      if ( nameNode.get().value_type == 9 ) {
        if ( false == nameNode.get().isPrimitive() ) {
          return true;
        }
      }
      if ( nameNode.get().value_type == 6 ) {
        return true;
      }
      if ( nameNode.get().value_type == 7 ) {
        return true;
      }
    }
    return false;
  }
  
  public void moveRefTo( CodeNode node , RangerAppParamDesc target , RangerAppWriterContext ctx ) {
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
    final int other_s = target.getStrength();
    final int my_s = this.getStrength();
    int my_lifetime = this.getLifetime();
    final int other_lifetime = target.getLifetime();
    boolean a_lives = false;
    boolean b_lives = false;
    final boolean tmp_var = nameNode.get().hasFlag("temp");
    if ( target.nameNode.isPresent() ) {
      if ( target.nameNode.get().hasFlag("lives") ) {
        my_lifetime = 2;
        b_lives = true;
      }
    }
    if ( nameNode.isPresent() ) {
      if ( nameNode.get().hasFlag("lives") ) {
        my_lifetime = 2;
        a_lives = true;
      }
    }
    if ( other_s > 0 ) {
      if ( my_s == 1 ) {
        int lt = my_lifetime;
        if ( other_lifetime > my_lifetime ) {
          lt = other_lifetime;
        }
        this.changeStrength(0, lt, node);
      } else {
        if ( my_s == 0 ) {
          if ( tmp_var == false ) {
            ctx.addError(node, "Can not move a weak reference to a strong target, at " + node.getCode());
            System.out.println(String.valueOf( "can not move weak refs to strong target:" ) );
            this.debugRefChanges();
          }
        } else {
          ctx.addError(node, "Can not move immutable reference to a strong target, evald type " + nameNode.get().eval_type_name);
        }
      }
    } else {
      if ( a_lives || b_lives ) {
      } else {
        if ( (my_lifetime < other_lifetime) && (return_cnt == 0) ) {
          if ( nameNode.get().hasFlag("returnvalue") == false ) {
            ctx.addError(node, "Can not create a weak reference if target has longer lifetime than original, current lifetime == " + my_lifetime);
          }
        }
      }
    }
  }
  
  public int originalStrength() {
    final int len = ownerHistory.size();
    if ( len > 0 ) {
      final RangerRefForce firstEntry = ownerHistory.get(0);
      return firstEntry.strength;
    }
    return 1;
  }
  
  public int getLifetime() {
    final int len_4 = ownerHistory.size();
    if ( len_4 > 0 ) {
      final RangerRefForce lastEntry = ownerHistory.get((len_4 - 1));
      return lastEntry.lifetime;
    }
    return 1;
  }
  
  public int getStrength() {
    final int len_6 = ownerHistory.size();
    if ( len_6 > 0 ) {
      final RangerRefForce lastEntry_4 = ownerHistory.get((len_6 - 1));
      return lastEntry_4.strength;
    }
    return 1;
  }
  
  public void debugRefChanges() {
    System.out.println(String.valueOf( ("variable " + name) + " ref history : " ) );
    for ( int i_2 = 0; i_2 < ownerHistory.size(); i_2++) {
      RangerRefForce h = ownerHistory.get(i_2);
      System.out.println(String.valueOf( ((" => change to " + h.strength) + " by ") + h.changer.get().getCode() ) );
    }
  }
  
  public boolean pointsToObject( RangerAppWriterContext ctx ) {
    if ( nameNode.isPresent() ) {
      boolean is_primitive = false;
      switch (nameNode.get().array_type ) { 
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
      if ( (nameNode.get().value_type == 6) || (nameNode.get().value_type == 7) ) {
        boolean is_object = true;
        switch (nameNode.get().array_type ) { 
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
      if ( nameNode.get().value_type == 9 ) {
        boolean is_object_8 = true;
        switch (nameNode.get().type_name ) { 
          case "string" : 
            is_object_8 = false;
            break;
          case "int" : 
            is_object_8 = false;
            break;
          case "boolean" : 
            is_object_8 = false;
            break;
          case "double" : 
            is_object_8 = false;
            break;
        }
        if ( ctx.isEnumDefined(nameNode.get().type_name) ) {
          return false;
        }
        return is_object_8;
      }
    }
    return false;
  }
  
  public boolean isObject() {
    if ( nameNode.isPresent() ) {
      if ( nameNode.get().value_type == 9 ) {
        if ( false == nameNode.get().isPrimitive() ) {
          return true;
        }
      }
    }
    return false;
  }
  
  public boolean isArray() {
    if ( nameNode.isPresent() ) {
      if ( nameNode.get().value_type == 6 ) {
        return true;
      }
    }
    return false;
  }
  
  public boolean isHash() {
    if ( nameNode.isPresent() ) {
      if ( nameNode.get().value_type == 7 ) {
        return true;
      }
    }
    return false;
  }
  
  public boolean isPrimitive() {
    if ( nameNode.isPresent() ) {
      return nameNode.get().isPrimitive();
    }
    return false;
  }
  
  public String getRefTypeName() {
    switch (refType ) { 
      case 0 : 
        return "NoType";
      case 1 : 
        return "Weak";
    }
    return "";
  }
  
  public String getVarTypeName() {
    switch (refType ) { 
      case 0 : 
        return "NoType";
      case 1 : 
        return "This";
    }
    return "";
  }
  
  public String getTypeName() {
    final String s = nameNode.get().type_name;
    return s;
  }
}
