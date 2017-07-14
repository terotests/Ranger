import java.util.Optional;
import java.util.*;

class DictNode { 
  public boolean is_property = false;
  public boolean is_property_value = false;
  public String vref = "";
  public int value_type = 6;
  public double double_value = 0;
  public int int_value = 0;
  public String string_value = "";
  public boolean boolean_value = false;
  public Optional<DictNode> object_value = Optional.empty();
  public ArrayList<DictNode> children = new ArrayList<DictNode>();
  public HashMap<String,DictNode> objects = new HashMap<String,DictNode>();
  public ArrayList<String> keys = new ArrayList<String>();
  
  public static DictNode createEmptyObject() {
    final DictNode v = new DictNode();
    v.value_type = 6;
    return v;
  }
  
  
  public String EncodeString( String orig_str ) {
    String encoded_str = "";
    /** unused:  final int str_length = orig_str.length()   **/ ;
    int ii = 0;
    final byte[] buff = orig_str.getBytes();
    final int cb_len = buff.length;
    while (ii < cb_len) {
      final byte cc = buff[ii];
      switch (cc ) { 
        case 8 : 
          encoded_str = (encoded_str + ((new String( Character.toChars(92))))) + ((new String( Character.toChars(98))));
          break;
        case 9 : 
          encoded_str = (encoded_str + ((new String( Character.toChars(92))))) + ((new String( Character.toChars(116))));
          break;
        case 10 : 
          encoded_str = (encoded_str + ((new String( Character.toChars(92))))) + ((new String( Character.toChars(110))));
          break;
        case 12 : 
          encoded_str = (encoded_str + ((new String( Character.toChars(92))))) + ((new String( Character.toChars(102))));
          break;
        case 13 : 
          encoded_str = (encoded_str + ((new String( Character.toChars(92))))) + ((new String( Character.toChars(114))));
          break;
        case 34 : 
          encoded_str = (encoded_str + ((new String( Character.toChars(92))))) + "\"";
          break;
        case 92 : 
          encoded_str = (encoded_str + ((new String( Character.toChars(92))))) + ((new String( Character.toChars(92))));
          break;
        case 47 : 
          encoded_str = (encoded_str + ((new String( Character.toChars(92))))) + ((new String( Character.toChars(47))));
          break;
        default: 
          encoded_str = encoded_str + ((new String( new char[] {cc })));
          break;
      }
      ii = 1 + ii;
    }
    return encoded_str;
  }
  
  public void addString( String key , String value ) {
    if ( value_type == 6 ) {
      final DictNode v = new DictNode();
      v.string_value = value;
      v.value_type = 3;
      v.vref = key;
      v.is_property = true;
      keys.add(key);
      objects.put(key, v);
    }
  }
  
  public void addDouble( String key , double value ) {
    if ( value_type == 6 ) {
      final DictNode v = new DictNode();
      v.double_value = value;
      v.value_type = 1;
      v.vref = key;
      v.is_property = true;
      keys.add(key);
      objects.put(key, v);
    }
  }
  
  public void addInt( String key , int value ) {
    if ( value_type == 6 ) {
      final DictNode v = new DictNode();
      v.int_value = value;
      v.value_type = 2;
      v.vref = key;
      v.is_property = true;
      keys.add(key);
      objects.put(key, v);
    }
  }
  
  public void addBoolean( String key , boolean value ) {
    if ( value_type == 6 ) {
      final DictNode v = new DictNode();
      v.boolean_value = value;
      v.value_type = 4;
      v.vref = key;
      v.is_property = true;
      keys.add(key);
      objects.put(key, v);
    }
  }
  
  public Optional<DictNode> addObject( String key ) {
    Optional<DictNode> v = Optional.empty();
    if ( value_type == 6 ) {
      final DictNode p = new DictNode();
      v = Optional.of(new DictNode());
      p.value_type = 6;
      p.vref = key;
      p.is_property = true;
      v.get().value_type = 6;
      v.get().vref = key;
      v.get().is_property_value = true;
      p.object_value = v;
      keys.add(key);
      objects.put(key, p);
      return Optional.ofNullable((v.isPresent() ? (DictNode)v.get() : null ) );
    }
    return Optional.ofNullable((v.isPresent() ? (DictNode)v.get() : null ) );
  }
  
  public void setObject( String key , DictNode value ) {
    if ( value_type == 6 ) {
      final DictNode p = new DictNode();
      p.value_type = 6;
      p.vref = key;
      p.is_property = true;
      value.is_property_value = true;
      value.vref = key;
      p.object_value = Optional.of(value);
      keys.add(key);
      objects.put(key, p);
    }
  }
  
  public Optional<DictNode> addArray( String key ) {
    Optional<DictNode> v = Optional.empty();
    if ( value_type == 6 ) {
      v = Optional.of(new DictNode());
      v.get().value_type = 5;
      v.get().vref = key;
      v.get().is_property = true;
      keys.add(key);
      objects.put(key, v.get());
      return Optional.ofNullable((v.isPresent() ? (DictNode)v.get() : null ) );
    }
    return Optional.ofNullable((v.isPresent() ? (DictNode)v.get() : null ) );
  }
  
  public void push( DictNode obj ) {
    if ( value_type == 5 ) {
      children.add(obj);
    }
  }
  
  public double getDoubleAt( int index ) {
    if ( index < (children.size()) ) {
      final DictNode k = children.get(index);
      return k.double_value;
    }
    return 0;
  }
  
  public String getStringAt( int index ) {
    if ( index < (children.size()) ) {
      final DictNode k = children.get(index);
      return k.string_value;
    }
    return "";
  }
  
  public int getIntAt( int index ) {
    if ( index < (children.size()) ) {
      final DictNode k = children.get(index);
      return k.int_value;
    }
    return 0;
  }
  
  public boolean getBooleanAt( int index ) {
    if ( index < (children.size()) ) {
      final DictNode k = children.get(index);
      return k.boolean_value;
    }
    return false;
  }
  
  public Optional<String> getString( String key ) {
    Optional<String> res = Optional.empty();
    if ( objects.containsKey(key) ) {
      final Optional<DictNode> k = Optional.ofNullable(objects.get(key));
      res = Optional.of(k.get().string_value);
    }
    return res;
  }
  
  public Optional<Double> getDouble( String key ) {
    Optional<Double> res = Optional.empty();
    if ( objects.containsKey(key) ) {
      final Optional<DictNode> k = Optional.ofNullable(objects.get(key));
      res = Optional.of(k.get().double_value);
    }
    return res;
  }
  
  public Optional<Integer> getInt( String key ) {
    Optional<Integer> res = Optional.empty();
    if ( objects.containsKey(key) ) {
      final Optional<DictNode> k = Optional.ofNullable(objects.get(key));
      res = Optional.of(k.get().int_value);
    }
    return res;
  }
  
  public Optional<Boolean> getBoolean( String key ) {
    Optional<Boolean> res = Optional.empty();
    if ( objects.containsKey(key) ) {
      final Optional<DictNode> k = Optional.ofNullable(objects.get(key));
      res = Optional.of(k.get().boolean_value);
    }
    return res;
  }
  
  public Optional<DictNode> getArray( String key ) {
    Optional<DictNode> res = Optional.empty();
    if ( objects.containsKey(key) ) {
      final Optional<DictNode> obj = Optional.ofNullable(objects.get(key));
      if ( obj.get().is_property ) {
        res = obj.get().object_value;
      }
    }
    return Optional.ofNullable((res.isPresent() ? (DictNode)res.get() : null ) );
  }
  
  public Optional<DictNode> getArrayAt( int index ) {
    Optional<DictNode> res = Optional.empty();
    if ( index < (children.size()) ) {
      res = Optional.of(children.get(index));
    }
    return Optional.ofNullable((res.isPresent() ? (DictNode)res.get() : null ) );
  }
  
  public Optional<DictNode> getObject( String key ) {
    Optional<DictNode> res = Optional.empty();
    if ( objects.containsKey(key) ) {
      final Optional<DictNode> obj = Optional.ofNullable(objects.get(key));
      if ( obj.get().is_property ) {
        res = obj.get().object_value;
      }
    }
    return Optional.ofNullable((res.isPresent() ? (DictNode)res.get() : null ) );
  }
  
  public Optional<DictNode> getObjectAt( int index ) {
    Optional<DictNode> res = Optional.empty();
    if ( index < (children.size()) ) {
      res = Optional.of(children.get(index));
    }
    return Optional.ofNullable((res.isPresent() ? (DictNode)res.get() : null ) );
  }
  
  public String stringify() {
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
        return ((("\"" + vref) + "\"") + ":") + double_value;
      }
      if ( value_type == 2 ) {
        return ((("\"" + vref) + "\"") + ":") + int_value;
      }
      if ( value_type == 3 ) {
        return ((((("\"" + vref) + "\"") + ":") + "\"") + this.EncodeString(string_value)) + "\"";
      }
    } else {
      if ( value_type == 7 ) {
        return "null";
      }
      if ( value_type == 1 ) {
        return "" + double_value;
      }
      if ( value_type == 2 ) {
        return "" + int_value;
      }
      if ( value_type == 3 ) {
        return ("\"" + this.EncodeString(string_value)) + "\"";
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
      String str = "";
      if ( is_property ) {
        str = (("\"" + vref) + "\"") + ":[";
      } else {
        str = "[";
      }
      for ( int i = 0; i < children.size(); i++) {
        DictNode item = children.get(i);
        if ( i > 0 ) {
          str = str + ",";
        }
        str = str + item.stringify();
      }
      str = str + "]";
      return str;
    }
    if ( value_type == 6 ) {
      String str_1 = "";
      if ( is_property ) {
        return ((("\"" + vref) + "\"") + ":") + object_value.get().stringify();
      } else {
        str_1 = "{";
        for ( int i_1 = 0; i_1 < keys.size(); i_1++) {
          String key = keys.get(i_1);
          if ( i_1 > 0 ) {
            str_1 = str_1 + ",";
          }
          final Optional<DictNode> item_1 = Optional.ofNullable(objects.get(key));
          str_1 = str_1 + item_1.get().stringify();
        }
        str_1 = str_1 + "}";
        return str_1;
      }
    }
    return "";
  }
}
