import java.util.*;
import java.util.Optional;

class RangerSerializeClass { 
  
  public boolean isSerializedClass( String cName , RangerAppWriterContext ctx ) {
    if ( ctx.hasClass(cName) ) {
      final RangerAppClassDesc clDecl = ctx.findClass(cName);
      if ( clDecl.is_serialized ) {
        return true;
      }
    }
    return false;
  }
  
  public void createWRWriter( RangerAppParamDesc pvar , CodeNode nn , RangerAppWriterContext ctx , CodeWriter wr ) {
    wr.out("def key@(lives):DictNode (new DictNode())", true);
    wr.out(("key.addString(\"n\" \"" + pvar.name) + "\")", true);
    if ( nn.value_type == 6 ) {
      if ( this.isSerializedClass(nn.array_type, ctx) ) {
        wr.out(("def values:DictNode (keys.addArray(\"" + pvar.compiledName) + "\"))", true);
        wr.out(((("for this." + pvar.compiledName) + " item:") + nn.array_type) + " i {", true);
        wr.indent(1);
        wr.out("def obj@(lives):DictNode (item.serializeToDict())", true);
        wr.out("values.push( obj )", true);
        wr.indent(-1);
        wr.out("}", true);
      }
      return;
    }
    if ( nn.value_type == 7 ) {
      if ( this.isSerializedClass(nn.array_type, ctx) ) {
        wr.out(("def values:DictNode (keys.addObject(\"" + pvar.compiledName) + "\"))", true);
        wr.out(("for this." + pvar.compiledName) + " keyname {", true);
        wr.indent(1);
        wr.out(("def item:DictNode (unwrap (get this." + pvar.compiledName) + " keyname))", true);
        wr.out("def obj@(lives):DictNode (item.serializeToDict())", true);
        wr.out("values.setObject( obj )", true);
        wr.indent(-1);
        wr.out("}", true);
      }
      if ( nn.key_type.equals("string") ) {
        wr.out(("def values:DictNode (keys.addObject(\"" + pvar.compiledName) + "\"))", true);
        wr.out(("for this." + pvar.compiledName) + " keyname {", true);
        wr.indent(1);
        if ( nn.array_type.equals("string") ) {
          wr.out(("values.addString(keyname (unwrap (get this." + pvar.compiledName) + " keyname)))", true);
        }
        if ( nn.array_type.equals("int") ) {
          wr.out(("values.addInt(keyname (unwrap (get this." + pvar.compiledName) + " keyname)))", true);
        }
        if ( nn.array_type.equals("boolean") ) {
          wr.out(("values.addBoolean(keyname (unwrap (get this." + pvar.compiledName) + " keyname)))", true);
        }
        if ( nn.array_type.equals("double") ) {
          wr.out(("values.addDouble(keyname (unwrap (get this." + pvar.compiledName) + " keyname)))", true);
        }
        wr.indent(-1);
        wr.out("}", true);
        return;
      }
      return;
    }
    if ( nn.type_name.equals("string") ) {
      wr.out(((("keys.addString(\"" + pvar.compiledName) + "\" (this.") + pvar.compiledName) + "))", true);
      return;
    }
    if ( nn.type_name.equals("double") ) {
      wr.out(((("keys.addDouble(\"" + pvar.compiledName) + "\" (this.") + pvar.compiledName) + "))", true);
      return;
    }
    if ( nn.type_name.equals("int") ) {
      wr.out(((("keys.addInt(\"" + pvar.compiledName) + "\" (this.") + pvar.compiledName) + "))", true);
      return;
    }
    if ( nn.type_name.equals("boolean") ) {
      wr.out(((("keys.addBoolean(\"" + pvar.compiledName) + "\" (this.") + pvar.compiledName) + "))", true);
      return;
    }
    if ( this.isSerializedClass(nn.type_name, ctx) ) {
      wr.out(("def value@(lives):DictNode (this." + pvar.compiledName) + ".serializeToDict())", true);
      wr.out(("keys.setObject(\"" + pvar.compiledName) + "\" value)", true);
    }
  }
  
  public void createJSONSerializerFn( RangerAppClassDesc cl , RangerAppWriterContext ctx , CodeWriter wr ) {
    HashMap<String,Boolean> declaredVariable = new HashMap<String,Boolean>();
    wr.out("Import \"ng_DictNode.clj\"", true);
    wr.out(("extension " + cl.name) + " {", true);
    wr.indent(1);
    wr.out(("fn unserializeFromDict@(strong):" + cl.name) + " (dict:DictNode) {", true);
    wr.indent(1);
    wr.out(((("def obj:" + cl.name) + " (new ") + cl.name) + "())", true);
    wr.out("return obj", true);
    wr.indent(-1);
    wr.out("}", true);
    wr.newline();
    wr.out("fn serializeToDict:DictNode () {", true);
    wr.indent(1);
    wr.out("def res:DictNode (new DictNode ())", true);
    wr.out(("res.addString(\"n\" \"" + cl.name) + "\")", true);
    wr.out("def keys:DictNode (res.addObject(\"data\"))", true);
    if ( (cl.extends_classes.size()) > 0 ) {
      for ( int i = 0; i < cl.extends_classes.size(); i++) {
        String pName = cl.extends_classes.get(i);
        final RangerAppClassDesc pC = ctx.findClass(pName);
        for ( int i_1 = 0; i_1 < pC.variables.size(); i_1++) {
          RangerAppParamDesc pvar = pC.variables.get(i_1);
          declaredVariable.put(pvar.name, true);
          final CodeNode nn = pvar.nameNode.get();
          if ( nn.isPrimitive() ) {
            wr.out("; extended ", true);
            wr.out("def key@(lives):DictNode (new DictNode())", true);
            wr.out(("key.addString(\"n\" \"" + pvar.name) + "\")", true);
            wr.out(("key.addString(\"t\" \"" + pvar.value_type) + "\")", true);
            wr.out("keys.push(key)", true);
          }
        }
      }
    }
    for ( int i_2 = 0; i_2 < cl.variables.size(); i_2++) {
      RangerAppParamDesc pvar_1 = cl.variables.get(i_2);
      if ( declaredVariable.containsKey(pvar_1.name) ) {
        continue;
      }
      final CodeNode nn_1 = pvar_1.nameNode.get();
      if ( nn_1.hasFlag("optional") ) {
        wr.out("; optional variable", true);
        wr.out(("if (!null? this." + pvar_1.name) + ") {", true);
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
}
