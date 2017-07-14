import java.util.*;
import java.util.Optional;
import java.io.*;

class RangerArgMatch { 
  public HashMap<String,String> matched = new HashMap<String,String>();
  
  public boolean matchArguments( CodeNode args , CodeNode callArgs , RangerAppWriterContext ctx , int firstArgIndex ) {
    /** unused:  final CodeNode fc = callArgs.children.get(0)   **/ ;
    ArrayList<String> missed_args = new ArrayList<String>();
    boolean all_matched = true;
    if ( ((args.children.size()) == 0) && ((callArgs.children.size()) > 1) ) {
      return false;
    }
    Optional<CodeNode> lastArg = Optional.empty();
    for ( int i = 0; i < callArgs.children.size(); i++) {
      CodeNode callArg = callArgs.children.get(i);
      if ( i == 0 ) {
        continue;
      }
      final int arg_index = i - 1;
      if ( arg_index < (args.children.size()) ) {
        lastArg = Optional.of(args.children.get(arg_index));
      }
      final CodeNode arg = lastArg.get();
      if ( arg.hasFlag("ignore") ) {
        continue;
      }
      if ( arg.hasFlag("mutable") ) {
        if ( callArg.hasParamDesc ) {
          final Optional<RangerAppParamDesc> pa = callArg.paramDesc;
          final boolean b = pa.get().nameNode.get().hasFlag("mutable");
          if ( b == false ) {
            missed_args.add("was mutable");
            all_matched = false;
          }
        } else {
          all_matched = false;
        }
      }
      if ( arg.hasFlag("optional") ) {
        if ( callArg.hasParamDesc ) {
          final Optional<RangerAppParamDesc> pa_1 = callArg.paramDesc;
          final boolean b_1 = pa_1.get().nameNode.get().hasFlag("optional");
          if ( b_1 == false ) {
            missed_args.add("optional was missing");
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
          all_matched = false;
        }
      }
      if ( (arg.value_type != 7) && (arg.value_type != 6) ) {
        if ( callArg.eval_type == 11 ) {
          if ( arg.type_name.equals("enum") ) {
            continue;
          }
        }
        if ( false == this.add(arg.type_name, callArg.eval_type_name, ctx) ) {
          all_matched = false;
          return all_matched;
        }
      }
      if ( arg.value_type == 6 ) {
        if ( false == this.add(arg.array_type, callArg.eval_array_type, ctx) ) {
          System.out.println(String.valueOf( "--> Failed to add the argument  " ) );
          all_matched = false;
        }
      }
      if ( arg.value_type == 7 ) {
        if ( false == this.add(arg.key_type, callArg.eval_key_type, ctx) ) {
          System.out.println(String.valueOf( "--> Failed to add the key argument  " ) );
          all_matched = false;
        }
        if ( false == this.add(arg.array_type, callArg.eval_array_type, ctx) ) {
          System.out.println(String.valueOf( "--> Failed to add the key argument  " ) );
          all_matched = false;
        }
      }
      boolean did_match = false;
      if ( this.doesMatch(arg, callArg, ctx) ) {
        did_match = true;
      } else {
        missed_args.add((("matching arg " + arg.vref) + " faileg against ") + callArg.vref);
      }
      if ( false == did_match ) {
        all_matched = false;
      }
    }
    return all_matched;
  }
  
  public boolean add( String tplKeyword , String typeName , RangerAppWriterContext ctx ) {
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
    if ( (tplKeyword.length()) > 1 ) {
      return true;
    }
    if ( matched.containsKey(tplKeyword) ) {
      final String s = (Optional.ofNullable(matched.get(tplKeyword))).get();
      if ( this.areEqualTypes(s, typeName, ctx) ) {
        return true;
      }
      if ( s.equals(typeName) ) {
        return true;
      } else {
        return false;
      }
    }
    matched.put(tplKeyword, typeName);
    return true;
  }
  
  public boolean doesDefsMatch( CodeNode arg , CodeNode node , RangerAppWriterContext ctx ) {
    if ( node.value_type == 11 ) {
      if ( arg.type_name.equals("enum") ) {
        return true;
      } else {
        return false;
      }
    }
    if ( (arg.value_type != 7) && (arg.value_type != 6) ) {
      final boolean eq = this.areEqualTypes(arg.type_name, node.type_name, ctx);
      final String t_name = arg.type_name;
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
          return node.eval_type_name.equals(t_name);
      }
      return eq;
    }
    if ( (arg.value_type == 6) && (node.eval_type == 6) ) {
      final boolean same_arrays = this.areEqualTypes(arg.array_type, node.array_type, ctx);
      return same_arrays;
    }
    if ( (arg.value_type == 7) && (node.eval_type == 7) ) {
      final boolean same_arrays_1 = this.areEqualTypes(arg.array_type, node.array_type, ctx);
      final boolean same_keys = this.areEqualTypes(arg.key_type, node.key_type, ctx);
      return same_arrays_1 && same_keys;
    }
    return false;
  }
  
  public boolean doesMatch( CodeNode arg , CodeNode node , RangerAppWriterContext ctx ) {
    if ( node.value_type == 11 ) {
      if ( arg.type_name.equals("enum") ) {
        return true;
      } else {
        return false;
      }
    }
    if ( (arg.value_type != 7) && (arg.value_type != 6) ) {
      final boolean eq = this.areEqualTypes(arg.type_name, node.eval_type_name, ctx);
      final String t_name = arg.type_name;
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
          return node.eval_type_name.equals(t_name);
      }
      return eq;
    }
    if ( (arg.value_type == 6) && (node.eval_type == 6) ) {
      final boolean same_arrays = this.areEqualTypes(arg.array_type, node.eval_array_type, ctx);
      return same_arrays;
    }
    if ( (arg.value_type == 7) && (node.eval_type == 7) ) {
      final boolean same_arrays_1 = this.areEqualTypes(arg.array_type, node.eval_array_type, ctx);
      final boolean same_keys = this.areEqualTypes(arg.key_type, node.eval_key_type, ctx);
      return same_arrays_1 && same_keys;
    }
    return false;
  }
  
  public boolean areEqualTypes( String type1 , String type2 , RangerAppWriterContext ctx ) {
    String t_name = type1;
    if ( matched.containsKey(type1) ) {
      t_name = (Optional.ofNullable(matched.get(type1))).get();
    }
    switch (t_name ) { 
      case "string" : 
        return type2.equals("string");
      case "int" : 
        return type2.equals("int");
      case "double" : 
        return type2.equals("double");
      case "boolean" : 
        return type2.equals("boolean");
      case "enum" : 
        return type2.equals("enum");
      case "char" : 
        return type2.equals("char");
      case "charbuffer" : 
        return type2.equals("charbuffer");
    }
    if ( ctx.isDefinedClass(t_name) && ctx.isDefinedClass(type2) ) {
      final RangerAppClassDesc c1 = ctx.findClass(t_name);
      final RangerAppClassDesc c2 = ctx.findClass(type2);
      if ( c1.isSameOrParentClass(type2, ctx) ) {
        return true;
      }
      if ( c2.isSameOrParentClass(t_name, ctx) ) {
        return true;
      }
    } else {
      if ( ctx.isDefinedClass(t_name) ) {
        final RangerAppClassDesc c1_1 = ctx.findClass(t_name);
        if ( c1_1.isSameOrParentClass(type2, ctx) ) {
          return true;
        }
      }
    }
    return t_name.equals(type2);
  }
  
  public String getTypeName( String n ) {
    String t_name = n;
    if ( matched.containsKey(t_name) ) {
      t_name = (Optional.ofNullable(matched.get(t_name))).get();
    }
    if ( 0 == (t_name.length()) ) {
      return "";
    }
    return t_name;
  }
  
  public int getType( String n ) {
    String t_name = n;
    if ( matched.containsKey(t_name) ) {
      t_name = (Optional.ofNullable(matched.get(t_name))).get();
    }
    if ( 0 == (t_name.length()) ) {
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
  
  public boolean setRvBasedOn( CodeNode arg , CodeNode node ) {
    if ( arg.hasFlag("optional") ) {
      node.setFlag("optional");
    }
    if ( (arg.value_type != 7) && (arg.value_type != 6) ) {
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
  }
}
