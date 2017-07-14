import java.util.Optional;
import java.util.*;
import java.io.*;
import java.nio.file.Paths;
import java.io.File;
import java.nio.file.Files;
import java.nio.charset.Charset;
import java.nio.charset.StandardCharsets;

class RangerFlowParser { 
  
  static String readFile(String path, Charset encoding) 
  {
    try {
      byte[] encoded = Files.readAllBytes(Paths.get(path));
      return new String(encoded, encoding);
    } catch(IOException e) { 
      return "";
    }
  }    
      
  public Optional<CodeNode> stdCommands = Optional.empty();
  public Optional<CodeNode> lastProcessedNode = Optional.empty();
  public ArrayList<CodeNode> collectWalkAtEnd = new ArrayList<CodeNode>()     /** note: unused */;
  public ArrayList<CodeNode> walkAlso = new ArrayList<CodeNode>();
  public ArrayList<RangerAppClassDesc> serializedClasses = new ArrayList<RangerAppClassDesc>();
  public ArrayList<ClassJoinPoint> classesWithTraits = new ArrayList<ClassJoinPoint>();
  public ArrayList<RangerAppClassDesc> collectedIntefaces = new ArrayList<RangerAppClassDesc>();
  public HashMap<String,Boolean> definedInterfaces = new HashMap<String,Boolean>()     /** note: unused */;
  
  public void cmdEnum( CodeNode node , RangerAppWriterContext ctx , CodeWriter wr ) {
    final CodeNode fNameNode = node.children.get(1);
    final CodeNode enumList = node.children.get(2);
    final RangerAppEnum new_enum = new RangerAppEnum();
    for ( int i = 0; i < enumList.children.size(); i++) {
      CodeNode item = enumList.children.get(i);
      new_enum.add(item.vref);
    }
    ctx.definedEnums.put(fNameNode.vref, new_enum);
  }
  
  public void initStdCommands() {
  }
  
  public Optional<CodeNode> findLanguageOper( CodeNode details , RangerAppWriterContext ctx ) {
    final String langName = ctx.getTargetLang();
    for ( int i = 0; i < details.children.size(); i++) {
      CodeNode det = details.children.get(i);
      if ( (det.children.size()) > 0 ) {
        final CodeNode fc = det.children.get(0);
        if ( fc.vref.equals("templates") ) {
          final CodeNode tplList = det.children.get(1);
          for ( int i_1 = 0; i_1 < tplList.children.size(); i_1++) {
            CodeNode tpl = tplList.children.get(i_1);
            final CodeNode tplName = tpl.getFirst();
            Optional<CodeNode> tplImpl = Optional.empty();
            tplImpl = Optional.of(tpl.getSecond());
            if ( (!tplName.vref.equals("*")) && (!tplName.vref.equals(langName)) ) {
              continue;
            }
            Optional<CodeNode> rv = Optional.empty();
            rv = Optional.of(tpl);
            return Optional.ofNullable((rv.isPresent() ? (CodeNode)rv.get() : null ) );
          }
        }
      }
    }
    final Optional<CodeNode> none = Optional.empty();
    return Optional.ofNullable((none.isPresent() ? (CodeNode)none.get() : null ) );
  }
  
  public CodeNode buildMacro( Optional<CodeNode> langOper , CodeNode args , RangerAppWriterContext ctx ) {
    final RangerAppWriterContext subCtx = ctx.fork();
    final CodeWriter wr = new CodeWriter();
    final LiveCompiler lcc = new LiveCompiler();
    lcc.langWriter = Optional.of(new RangerRangerClassWriter());
    lcc.langWriter.get().compiler = Optional.of(lcc);
    subCtx.targetLangName = "ranger";
    subCtx.restartExpressionLevel();
    final CodeNode macroNode = langOper.get();
    final CodeNode cmdList = macroNode.getSecond();
    lcc.walkCommandList(cmdList, args, subCtx, wr);
    final String lang_str = wr.getCode();
    final SourceCode lang_code = new SourceCode(lang_str);
    lang_code.filename = ("<macro " + macroNode.vref) + ">";
    final RangerLispParser lang_parser = new RangerLispParser(lang_code);
    lang_parser.parse();
    final CodeNode node = lang_parser.rootNode.get();
    return node;
  }
  
  public boolean stdParamMatch( CodeNode callArgs , RangerAppWriterContext inCtx , CodeWriter wr ) {
    stdCommands = Optional.of(inCtx.getStdCommands());
    final CodeNode callFnName = callArgs.getFirst();
    final Optional<CodeNode> cmds = stdCommands;
    boolean some_matched = false;
    /** unused:  final boolean found_fn = false   **/ ;
    /** unused:  final ArrayList<String> missed_args = new ArrayList<String>()   **/ ;
    RangerAppWriterContext ctx = inCtx.fork();
    /** unused:  final String lang_name = ctx.getTargetLang()   **/ ;
    boolean expects_error = false;
    final int err_cnt = inCtx.getErrorCount();
    if ( callArgs.hasBooleanProperty("error") ) {
      expects_error = true;
    }
    for ( int main_index = 0; main_index < cmds.get().children.size(); main_index++) {
      CodeNode ch = cmds.get().children.get(main_index);
      final CodeNode fc = ch.getFirst();
      final CodeNode nameNode = ch.getSecond();
      final CodeNode args = ch.getThird();
      if ( callFnName.vref.equals(fc.vref) ) {
        /** unused:  final int line_index = callArgs.getLine()   **/ ;
        final int callerArgCnt = (callArgs.children.size()) - 1;
        final int fnArgCnt = args.children.size();
        boolean has_eval_ctx = false;
        boolean is_macro = false;
        if ( nameNode.hasFlag("newcontext") ) {
          ctx = inCtx.fork();
          has_eval_ctx = true;
        }
        final boolean expanding_node = nameNode.hasFlag("expands");
        if ( (callerArgCnt == fnArgCnt) || expanding_node ) {
          final CodeNode details_list = ch.children.get(3);
          final Optional<CodeNode> langOper = this.findLanguageOper(details_list, ctx);
          if ( !langOper.isPresent() ) {
            continue;
          }
          if ( langOper.get().hasBooleanProperty("macro") ) {
            is_macro = true;
          }
          final RangerArgMatch match = new RangerArgMatch();
          int last_walked = 0;
          for ( int i = 0; i < args.children.size(); i++) {
            CodeNode arg = args.children.get(i);
            final CodeNode callArg = callArgs.children.get((i + 1));
            if ( arg.hasFlag("define") ) {
              final RangerAppParamDesc p = new RangerAppParamDesc();
              p.name = callArg.vref;
              p.value_type = arg.value_type;
              p.node = Optional.of(callArg);
              p.nameNode = Optional.of(callArg);
              p.is_optional = false;
              p.init_cnt = 1;
              ctx.defineVariable(p.name, p);
              callArg.hasParamDesc = true;
              callArg.ownParamDesc = Optional.of(p);
              callArg.paramDesc = Optional.of(p);
              if ( (callArg.type_name.length()) == 0 ) {
                callArg.type_name = arg.type_name;
                callArg.value_type = arg.value_type;
              }
              callArg.eval_type = arg.value_type;
              callArg.eval_type_name = arg.type_name;
            }
            if ( arg.hasFlag("ignore") ) {
              continue;
            }
            ctx.setInExpr();
            last_walked = i + 1;
            this.WalkNode(callArg, ctx, wr);
            ctx.unsetInExpr();
          }
          if ( expanding_node ) {
            for ( int i2 = 0; i2 < callArgs.children.size(); i2++) {
              CodeNode caCh = callArgs.children.get(i2);
              if ( i2 > last_walked ) {
                ctx.setInExpr();
                this.WalkNode(caCh, ctx, wr);
                ctx.unsetInExpr();
              }
            }
          }
          final boolean all_matched = match.matchArguments(args, callArgs, ctx, 1);
          if ( all_matched ) {
            if ( is_macro ) {
              final CodeNode macroNode = this.buildMacro(langOper, callArgs, ctx);
              int arg_len = callArgs.children.size();
              while (arg_len > 0) {
                callArgs.children.remove(callArgs.children.size() - 1);
                arg_len = arg_len - 1;
              }
              callArgs.children.add(macroNode);
              macroNode.parent = Optional.of(callArgs);
              this.WalkNode(macroNode, ctx, wr);
              match.setRvBasedOn(nameNode, callArgs);
              return true;
            }
            if ( nameNode.hasFlag("moves") ) {
              final Optional<CodeNode> moves_opt = nameNode.getFlag("moves");
              final CodeNode moves = moves_opt.get();
              final Optional<CodeNode> ann = moves.vref_annotation;
              final CodeNode from = ann.get().getFirst();
              final CodeNode to = ann.get().getSecond();
              final CodeNode cA = callArgs.children.get(from.int_value);
              final CodeNode cA2 = callArgs.children.get(to.int_value);
              if ( cA.hasParamDesc ) {
                final Optional<RangerAppParamDesc> pp = cA.paramDesc;
                final Optional<RangerAppParamDesc> pp2 = cA2.paramDesc;
                pp.get().moveRefTo(callArgs, pp2.get(), ctx);
              }
            }
            if ( nameNode.hasFlag("returns") ) {
              final RangerAppFunctionDesc activeFn = ctx.getCurrentMethod();
              if ( !activeFn.nameNode.get().type_name.equals("void") ) {
                if ( (callArgs.children.size()) < 2 ) {
                  ctx.addError(callArgs, " missing return value !!!");
                } else {
                  final CodeNode returnedValue = callArgs.children.get(1);
                  if ( match.doesMatch((activeFn.nameNode.get()), returnedValue, ctx) == false ) {
                    if ( activeFn.nameNode.get().ifNoTypeSetToEvalTypeOf(returnedValue) ) {
                    } else {
                      ctx.addError(returnedValue, "invalid return value type!!!");
                    }
                  }
                  final CodeNode argNode = activeFn.nameNode.get();
                  if ( returnedValue.hasFlag("optional") ) {
                    if ( false == argNode.hasFlag("optional") ) {
                      ctx.addError(callArgs, "function return value optionality does not match, expected non-optional return value, optional given at " + argNode.getCode());
                    }
                  }
                  if ( argNode.hasFlag("optional") ) {
                    if ( false == returnedValue.hasFlag("optional") ) {
                      ctx.addError(callArgs, "function return value optionality does not match, expected optional return value " + argNode.getCode());
                    }
                  }
                  final Optional<RangerAppParamDesc> pp_1 = returnedValue.paramDesc;
                  if ( pp_1.isPresent() ) {
                    pp_1.get().moveRefTo(callArgs, activeFn, ctx);
                  }
                }
              }
              if ( !callArgs.parent.isPresent() ) {
                ctx.addError(callArgs, "did not have parent");
                System.out.println(String.valueOf( "no parent => " + callArgs.getCode() ) );
              }
              callArgs.parent.get().didReturnAtIndex = callArgs.parent.get().children.indexOf(callArgs);
            }
            if ( nameNode.hasFlag("returns") == false ) {
              match.setRvBasedOn(nameNode, callArgs);
            }
            if ( has_eval_ctx ) {
              callArgs.evalCtx = Optional.of(ctx);
            }
            final Optional<CodeNode> nodeP = callArgs.parent;
            if ( nodeP.isPresent() ) {
            } else {
            }
            /** unused:  final String sig = nameNode.buildTypeSignatureUsingMatch(match)   **/ ;
            some_matched = true;
            callArgs.has_operator = true;
            callArgs.op_index = main_index;
            for ( int arg_index = 0; arg_index < args.children.size(); arg_index++) {
              CodeNode arg_1 = args.children.get(arg_index);
              if ( arg_1.has_vref_annotation ) {
                final Optional<CodeNode> anns = arg_1.vref_annotation;
                for ( int i_1 = 0; i_1 < anns.get().children.size(); i_1++) {
                  CodeNode ann_1 = anns.get().children.get(i_1);
                  if ( ann_1.vref.equals("mutates") ) {
                    final CodeNode theArg = callArgs.children.get((arg_index + 1));
                    if ( theArg.hasParamDesc ) {
                      theArg.paramDesc.get().set_cnt = theArg.paramDesc.get().set_cnt + 1;
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
      ctx.addError(callArgs, "stdMatch -> Could not match argument types for " + callFnName.vref);
    }
    if ( expects_error ) {
      final int cnt_now = ctx.getErrorCount();
      if ( cnt_now == err_cnt ) {
        ctx.addParserError(callArgs, (("LANGUAGE_PARSER_ERROR: expected generated error, err counts : " + err_cnt) + " : ") + cnt_now);
      }
    } else {
      final int cnt_now_1 = ctx.getErrorCount();
      if ( cnt_now_1 > err_cnt ) {
        ctx.addParserError(callArgs, (("LANGUAGE_PARSER_ERROR: did not expect generated error, err counts : " + err_cnt) + " : ") + cnt_now_1);
      }
    }
    return true;
  }
  
  public boolean cmdImport( CodeNode node , RangerAppWriterContext ctx , CodeWriter wr ) {
    return false;
  }
  
  public String getThisName() {
    return "this";
  }
  
  public void WriteThisVar( CodeNode node , RangerAppWriterContext ctx , CodeWriter wr ) {
  }
  
  public void WriteVRef( CodeNode node , RangerAppWriterContext ctx , CodeWriter wr ) {
    if ( node.vref.equals("_") ) {
      return;
    }
    final String rootObjName = node.ns.get(0);
    if ( ctx.isInStatic() ) {
      if ( rootObjName.equals("this") ) {
        ctx.addError(node, "This can not be used in static context");
      }
    }
    if ( ctx.isEnumDefined(rootObjName) ) {
      final String enumName = node.ns.get(1);
      final Optional<RangerAppEnum> ee = ctx.getEnum(rootObjName);
      final RangerAppEnum e = ee.get();
      if ( e.values.containsKey(enumName) ) {
        node.eval_type = 11;
        node.eval_type_name = rootObjName;
        node.int_value = (Optional.ofNullable(e.values.get(enumName))).get();
      } else {
        ctx.addError(node, (("Undefined Enum " + rootObjName) + ".") + enumName);
        node.eval_type = 1;
      }
      return;
    }
    if ( node.vref.equals(this.getThisName()) ) {
      final Optional<RangerAppClassDesc> cd = ctx.getCurrentClass();
      final Optional<RangerAppClassDesc> thisClassDesc = cd;
      node.eval_type = 8;
      node.eval_type_name = thisClassDesc.get().name;
      node.ref_type = 4;
      return;
    }
    if ( ctx.isCapturing() ) {
      if ( ctx.isVarDefined(rootObjName) ) {
        if ( ctx.isLocalToCapture(rootObjName) == false ) {
          final RangerAppParamDesc captDef = ctx.getVariableDef(rootObjName);
          final Optional<RangerAppClassDesc> cd_1 = ctx.getCurrentClass();
          cd_1.get().capturedLocals.add(captDef);
          captDef.is_captured = true;
          ctx.addCapturedVariable(rootObjName);
        }
      }
    }
    if ( (rootObjName.equals("this")) || ctx.isVarDefined(rootObjName) ) {
      /** unused:  final RangerAppParamDesc vDef2 = ctx.getVariableDef(rootObjName)   **/ ;
      /** unused:  final RangerAppFunctionDesc activeFn = ctx.getCurrentMethod()   **/ ;
      final Optional<RangerAppParamDesc> vDef = this.findParamDesc(node, ctx, wr);
      if ( vDef.isPresent() ) {
        node.hasParamDesc = true;
        node.ownParamDesc = vDef;
        node.paramDesc = vDef;
        vDef.get().ref_cnt = 1 + vDef.get().ref_cnt;
        final Optional<CodeNode> vNameNode = vDef.get().nameNode;
        if ( vNameNode.isPresent() ) {
          if ( vNameNode.get().hasFlag("optional") ) {
            node.setFlag("optional");
          }
          node.eval_type = vNameNode.get().typeNameAsType(ctx);
          node.eval_type_name = vNameNode.get().type_name;
          if ( vNameNode.get().value_type == 6 ) {
            node.eval_type = 6;
            node.eval_array_type = vNameNode.get().array_type;
          }
          if ( vNameNode.get().value_type == 7 ) {
            node.eval_type = 7;
            node.eval_key_type = vNameNode.get().key_type;
            node.eval_array_type = vNameNode.get().array_type;
          }
        }
      }
    } else {
      boolean class_or_this = rootObjName.equals(this.getThisName());
      if ( ctx.isDefinedClass(rootObjName) ) {
        class_or_this = true;
        node.eval_type = 23;
        node.eval_type_name = rootObjName;
      }
      if ( ctx.hasTemplateNode(rootObjName) ) {
        class_or_this = true;
      }
      if ( false == class_or_this ) {
        final Optional<RangerAppClassDesc> udesc = ctx.getCurrentClass();
        final RangerAppClassDesc desc = udesc.get();
        ctx.addError(node, (("Undefined variable " + rootObjName) + " in class ") + desc.name);
      }
      return;
    }
  }
  
  public void CreateClass( CodeNode node , RangerAppWriterContext ctx , CodeWriter wr ) {
  }
  
  public void DefineVar( CodeNode node , RangerAppWriterContext ctx , CodeWriter wr ) {
  }
  
  public void WriteComment( CodeNode node , RangerAppWriterContext ctx , CodeWriter wr ) {
  }
  
  public void cmdLog( CodeNode node , RangerAppWriterContext ctx , CodeWriter wr ) {
  }
  
  public void cmdDoc( CodeNode node , RangerAppWriterContext ctx , CodeWriter wr ) {
  }
  
  public void cmdGitDoc( CodeNode node , RangerAppWriterContext ctx , CodeWriter wr ) {
  }
  
  public void cmdNative( CodeNode node , RangerAppWriterContext ctx , CodeWriter wr ) {
  }
  
  public void LangInit( CodeNode node , RangerAppWriterContext ctx , CodeWriter wr ) {
  }
  
  public String getWriterLang() {
    return "_";
  }
  
  public void StartCodeWriting( CodeNode node , RangerAppWriterContext ctx , CodeWriter wr ) {
  }
  
  public void Constructor( CodeNode node , RangerAppWriterContext ctx , CodeWriter wr ) {
    this.shouldHaveChildCnt(3, node, ctx, "Method expexts four arguments");
    /** unused:  final CodeNode cn = node.children.get(1)   **/ ;
    final CodeNode fnBody = node.children.get(2);
    final Optional<RangerAppClassDesc> udesc = ctx.getCurrentClass();
    final RangerAppClassDesc desc = udesc.get();
    final Optional<RangerAppFunctionDesc> m = desc.constructor_fn;
    final RangerAppWriterContext subCtx = m.get().fnCtx.get();
    subCtx.is_function = true;
    subCtx.currentMethod = m;
    subCtx.setInMethod();
    for ( int i = 0; i < m.get().params.size(); i++) {
      RangerAppParamDesc v = m.get().params.get(i);
      subCtx.defineVariable(v.name, v);
    }
    this.WalkNodeChildren(fnBody, subCtx, wr);
    subCtx.unsetInMethod();
    if ( fnBody.didReturnAtIndex >= 0 ) {
      ctx.addError(node, "constructor should not return any values!");
    }
    for ( int i_1 = 0; i_1 < subCtx.localVarNames.size(); i_1++) {
      String n = subCtx.localVarNames.get(i_1);
      final Optional<RangerAppParamDesc> p = Optional.ofNullable(subCtx.localVariables.get(n));
      if ( p.get().set_cnt > 0 ) {
        final Optional<CodeNode> defNode = p.get().node;
        defNode.get().setFlag("mutable");
        final Optional<CodeNode> nNode = p.get().nameNode;
        nNode.get().setFlag("mutable");
      }
    }
  }
  
  public void WriteScalarValue( CodeNode node , RangerAppWriterContext ctx , CodeWriter wr ) {
    node.eval_type = node.value_type;
    switch (node.value_type ) { 
      case 2 : 
        node.eval_type_name = "double";
        break;
      case 4 : 
        node.eval_type_name = "string";
        break;
      case 3 : 
        node.eval_type_name = "int";
        break;
      case 5 : 
        node.eval_type_name = "boolean";
        break;
    }
  }
  
  public void buildGenericClass( CodeNode tpl , CodeNode node , RangerAppWriterContext ctx , CodeWriter wr ) {
    final RangerAppWriterContext root = ctx.getRoot();
    final CodeNode cn = tpl.getSecond();
    final CodeNode newName = node.getSecond();
    final Optional<CodeNode> tplArgs = cn.vref_annotation;
    final Optional<CodeNode> givenArgs = newName.vref_annotation;
    final String sign = cn.vref + givenArgs.get().getCode();
    if ( root.classSignatures.containsKey(sign) ) {
      return;
    }
    System.out.println(String.valueOf( "could build generic class... " + cn.vref ) );
    final RangerArgMatch match = new RangerArgMatch();
    for ( int i = 0; i < tplArgs.get().children.size(); i++) {
      CodeNode arg = tplArgs.get().children.get(i);
      final CodeNode given = givenArgs.get().children.get(i);
      System.out.println(String.valueOf( ((" setting " + arg.vref) + " => ") + given.vref ) );
      if ( false == match.add(arg.vref, given.vref, ctx) ) {
        System.out.println(String.valueOf( "set failed!" ) );
      } else {
        System.out.println(String.valueOf( "set OK" ) );
      }
      System.out.println(String.valueOf( " T == " + match.getTypeName(arg.vref) ) );
    }
    System.out.println(String.valueOf( " T == " + match.getTypeName("T") ) );
    final CodeNode newClassNode = tpl.rebuildWithType(match, false);
    System.out.println(String.valueOf( "build done" ) );
    System.out.println(String.valueOf( newClassNode.getCode() ) );
    final String sign_2 = cn.vref + givenArgs.get().getCode();
    System.out.println(String.valueOf( "signature ==> " + sign_2 ) );
    final CodeNode cName = newClassNode.getSecond();
    final String friendlyName = root.createSignature(cn.vref, sign_2);
    System.out.println(String.valueOf( "class common name => " + friendlyName ) );
    cName.vref = friendlyName;
    cName.has_vref_annotation = false;
    System.out.println(String.valueOf( newClassNode.getCode() ) );
    this.WalkCollectMethods(newClassNode, ctx, wr);
    this.WalkNode(newClassNode, root, wr);
    System.out.println(String.valueOf( "the class collected the methods..." ) );
  }
  
  public void cmdNew( CodeNode node , RangerAppWriterContext ctx , CodeWriter wr ) {
    if ( (node.children.size()) < 2 ) {
      ctx.addError(node, "the new operator expects at lest two arguments");
      return;
    }
    if ( (node.children.size()) < 3 ) {
      final CodeNode expr = new CodeNode(node.code.get(), node.sp, node.ep);
      expr.expression = true;
      node.children.add(expr);
    }
    final CodeNode obj = node.getSecond();
    final CodeNode params = node.getThird();
    Optional<RangerAppClassDesc> currC = Optional.empty();
    boolean b_template = false;
    boolean expects_error = false;
    final int err_cnt = ctx.getErrorCount();
    if ( node.hasBooleanProperty("error") ) {
      expects_error = true;
    }
    if ( ctx.hasTemplateNode(obj.vref) ) {
      System.out.println(String.valueOf( " ==> template class" ) );
      b_template = true;
      final CodeNode tpl = ctx.findTemplateNode(obj.vref);
      if ( obj.has_vref_annotation ) {
        System.out.println(String.valueOf( "generic class OK" ) );
        this.buildGenericClass(tpl, node, ctx, wr);
        currC = Optional.of(ctx.findClassWithSign(obj));
        if ( currC.isPresent() ) {
          System.out.println(String.valueOf( "@@ class was found " + obj.vref ) );
        }
      } else {
        ctx.addError(node, "generic class requires a type annotation");
        return;
      }
    }
    this.WalkNode(obj, ctx, wr);
    for ( int i = 0; i < params.children.size(); i++) {
      CodeNode arg = params.children.get(i);
      ctx.setInExpr();
      this.WalkNode(arg, ctx, wr);
      ctx.unsetInExpr();
    }
    node.eval_type = 8;
    node.eval_type_name = obj.vref;
    if ( b_template == false ) {
      currC = Optional.of(ctx.findClass(obj.vref));
    }
    node.hasNewOper = true;
    node.clDesc = currC;
    final Optional<RangerAppFunctionDesc> fnDescr = currC.get().constructor_fn;
    if ( fnDescr.isPresent() ) {
      for ( int i_1 = 0; i_1 < fnDescr.get().params.size(); i_1++) {
        RangerAppParamDesc param = fnDescr.get().params.get(i_1);
        boolean has_default = false;
        if ( param.nameNode.get().hasFlag("default") ) {
          has_default = true;
        }
        if ( (params.children.size()) <= i_1 ) {
          if ( has_default ) {
            continue;
          }
          ctx.addError(node, "Missing arguments for function");
          ctx.addError(param.nameNode.get(), "To fix the previous error: Check original function declaration");
        }
        final CodeNode argNode = params.children.get(i_1);
        if ( false == this.areEqualTypes((param.nameNode.get()), argNode, ctx) ) {
          ctx.addError(argNode, ("ERROR, invalid argument type for " + currC.get().name) + " constructor ");
        }
        final CodeNode pNode = param.nameNode.get();
        if ( pNode.hasFlag("optional") ) {
          if ( false == argNode.hasFlag("optional") ) {
            ctx.addError(node, "new parameter optionality does not match, expected optional parameter" + argNode.getCode());
          }
        }
        if ( argNode.hasFlag("optional") ) {
          if ( false == pNode.hasFlag("optional") ) {
            ctx.addError(node, "new parameter optionality does not match, expected non-optional, optional given" + argNode.getCode());
          }
        }
      }
    }
    if ( expects_error ) {
      final int cnt_now = ctx.getErrorCount();
      if ( cnt_now == err_cnt ) {
        ctx.addParserError(node, (("LANGUAGE_PARSER_ERROR: expected generated error, err counts : " + err_cnt) + " : ") + cnt_now);
      }
    } else {
      final int cnt_now_1 = ctx.getErrorCount();
      if ( cnt_now_1 > err_cnt ) {
        ctx.addParserError(node, (("LANGUAGE_PARSER_ERROR: did not expect generated error, err counts : " + err_cnt) + " : ") + cnt_now_1);
      }
    }
  }
  
  public ArrayList<CodeNode> transformParams( ArrayList<CodeNode> list , ArrayList<RangerAppParamDesc> fnArgs , RangerAppWriterContext ctx ) {
    ArrayList<CodeNode> res = new ArrayList<CodeNode>();
    for ( int i = 0; i < list.size(); i++) {
      CodeNode item = list.get(i);
      if ( item.is_block_node ) {
        /** unused:  final CodeNode newNode = new CodeNode(item.code.get(), item.sp, item.ep)   **/ ;
        final RangerAppParamDesc fnArg = fnArgs.get(i);
        final Optional<CodeNode> nn = fnArg.nameNode;
        if ( !nn.get().expression_value.isPresent() ) {
          ctx.addError(item, "Parameter is not lambda expression");
          break;
        }
        final CodeNode fnDef = nn.get().expression_value.get();
        final RangerArgMatch match = new RangerArgMatch();
        final CodeNode copyOf = fnDef.rebuildWithType(match, false);
        final CodeNode fc = copyOf.children.get(0);
        fc.vref = "fun";
        final CodeNode itemCopy = item.rebuildWithType(match, false);
        copyOf.children.add(itemCopy);
        int cnt = item.children.size();
        while (cnt > 0) {
          item.children.remove(item.children.size() - 1);
          cnt = cnt - 1;
        }
        for ( int i_1 = 0; i_1 < copyOf.children.size(); i_1++) {
          CodeNode ch = copyOf.children.get(i_1);
          item.children.add(ch);
        }
      }
      res.add(item);
    }
    return res;
  }
  
  public boolean cmdLocalCall( CodeNode node , RangerAppWriterContext ctx , CodeWriter wr ) {
    final CodeNode fnNode = node.getFirst();
    final Optional<RangerAppClassDesc> udesc = ctx.getCurrentClass();
    final RangerAppClassDesc desc = udesc.get();
    boolean expects_error = false;
    final int err_cnt = ctx.getErrorCount();
    if ( node.hasBooleanProperty("error") ) {
      expects_error = true;
    }
    if ( (fnNode.ns.size()) > 1 ) {
      final String rootName = fnNode.ns.get(0);
      final RangerAppParamDesc vDef2 = ctx.getVariableDef(rootName);
      if ( ((!rootName.equals("this")) && (vDef2.init_cnt == 0)) && (vDef2.set_cnt == 0) ) {
        if ( (vDef2.is_class_variable == false) && (ctx.isDefinedClass(rootName) == false) ) {
          ctx.addError(node, "Call to uninitialized object " + rootName);
        }
      }
      final Optional<RangerAppFunctionDesc> vFnDef = this.findFunctionDesc(fnNode, ctx, wr);
      if ( vFnDef.isPresent() ) {
        vFnDef.get().ref_cnt = vFnDef.get().ref_cnt + 1;
        final RangerAppWriterContext subCtx = ctx.fork();
        node.hasFnCall = true;
        node.fnDesc = vFnDef;
        final RangerAppParamDesc p = new RangerAppParamDesc();
        p.name = fnNode.vref;
        p.value_type = fnNode.value_type;
        p.node = Optional.of(fnNode);
        p.nameNode = Optional.of(fnNode);
        p.varType = 10;
        subCtx.defineVariable(p.name, p);
        this.WalkNode(fnNode, subCtx, wr);
        final CodeNode callParams = node.children.get(1);
        final ArrayList<CodeNode> nodeList = this.transformParams(callParams.children, vFnDef.get().params, subCtx);
        for ( int i = 0; i < nodeList.size(); i++) {
          CodeNode arg = nodeList.get(i);
          ctx.setInExpr();
          this.WalkNode(arg, subCtx, wr);
          ctx.unsetInExpr();
          final RangerAppParamDesc fnArg = vFnDef.get().params.get(i);
          final Optional<RangerAppParamDesc> callArgP = arg.paramDesc;
          if ( callArgP.isPresent() ) {
            callArgP.get().moveRefTo(node, fnArg, ctx);
          }
        }
        final int cp_len = callParams.children.size();
        if ( cp_len > (vFnDef.get().params.size()) ) {
          final CodeNode lastCallParam = callParams.children.get((cp_len - 1));
          ctx.addError(lastCallParam, "Too many arguments for function");
          ctx.addError(vFnDef.get().nameNode.get(), "NOTE: To fix the previous error: Check original function declaration which was");
        }
        for ( int i_1 = 0; i_1 < vFnDef.get().params.size(); i_1++) {
          RangerAppParamDesc param = vFnDef.get().params.get(i_1);
          if ( (callParams.children.size()) <= i_1 ) {
            if ( param.nameNode.get().hasFlag("default") ) {
              continue;
            }
            ctx.addError(node, "Missing arguments for function");
            ctx.addError(param.nameNode.get(), "NOTE: To fix the previous error: Check original function declaration which was");
            break;
          }
          final CodeNode argNode = callParams.children.get(i_1);
          if ( false == this.areEqualTypes((param.nameNode.get()), argNode, ctx) ) {
            ctx.addError(argNode, "ERROR, invalid argument type for method " + vFnDef.get().name);
          }
          final CodeNode pNode = param.nameNode.get();
          if ( pNode.hasFlag("optional") ) {
            if ( false == argNode.hasFlag("optional") ) {
              ctx.addError(node, "function parameter optionality does not match, consider making parameter optional " + argNode.getCode());
            }
          }
          if ( argNode.hasFlag("optional") ) {
            if ( false == pNode.hasFlag("optional") ) {
              ctx.addError(node, "function parameter optionality does not match, consider unwrapping " + argNode.getCode());
            }
          }
        }
        final Optional<CodeNode> nn = vFnDef.get().nameNode;
        node.eval_type = nn.get().typeNameAsType(ctx);
        node.eval_type_name = nn.get().type_name;
        node.eval_array_type = nn.get().array_type;
        node.eval_key_type = nn.get().key_type;
        if ( nn.get().hasFlag("optional") ) {
          node.setFlag("optional");
        }
        if ( expects_error ) {
          final int cnt_now = ctx.getErrorCount();
          if ( cnt_now == err_cnt ) {
            ctx.addParserError(node, (("LANGUAGE_PARSER_ERROR: expected generated error, err counts : " + err_cnt) + " : ") + cnt_now);
          }
        } else {
          final int cnt_now_1 = ctx.getErrorCount();
          if ( cnt_now_1 > err_cnt ) {
            ctx.addParserError(node, (("LANGUAGE_PARSER_ERROR: did not expect generated error, err counts : " + err_cnt) + " : ") + cnt_now_1);
          }
        }
        return true;
      } else {
        ctx.addError(node, "Called Object or Property was not defined");
      }
    }
    if ( desc.hasMethod(fnNode.vref) ) {
      final Optional<RangerAppFunctionDesc> fnDescr = desc.findMethod(fnNode.vref);
      final RangerAppWriterContext subCtx_1 = ctx.fork();
      node.hasFnCall = true;
      node.fnDesc = fnDescr;
      final RangerAppParamDesc p_1 = new RangerAppParamDesc();
      p_1.name = fnNode.vref;
      p_1.value_type = fnNode.value_type;
      p_1.node = Optional.of(fnNode);
      p_1.nameNode = Optional.of(fnNode);
      p_1.varType = 10;
      subCtx_1.defineVariable(p_1.name, p_1);
      this.WriteThisVar(fnNode, subCtx_1, wr);
      this.WalkNode(fnNode, subCtx_1, wr);
      for ( int i_2 = 0; i_2 < node.children.size(); i_2++) {
        CodeNode arg_1 = node.children.get(i_2);
        if ( i_2 < 1 ) {
          continue;
        }
        ctx.setInExpr();
        this.WalkNode(arg_1, subCtx_1, wr);
        ctx.unsetInExpr();
      }
      for ( int i_3 = 0; i_3 < fnDescr.get().params.size(); i_3++) {
        RangerAppParamDesc param_1 = fnDescr.get().params.get(i_3);
        if ( (node.children.size()) <= (i_3 + 1) ) {
          ctx.addError(node, "Argument was not defined");
          break;
        }
        final CodeNode argNode_1 = node.children.get((i_3 + 1));
        if ( false == this.areEqualTypes((param_1.nameNode.get()), argNode_1, ctx) ) {
          ctx.addError(argNode_1, (("ERROR, invalid argument type for " + desc.name) + " method ") + fnDescr.get().name);
        }
      }
      final Optional<CodeNode> nn_1 = fnDescr.get().nameNode;
      nn_1.get().defineNodeTypeTo(node, ctx);
      if ( expects_error ) {
        final int cnt_now_2 = ctx.getErrorCount();
        if ( cnt_now_2 == err_cnt ) {
          ctx.addParserError(node, (("LANGUAGE_PARSER_ERROR: expected generated error, err counts : " + err_cnt) + " : ") + cnt_now_2);
        }
      } else {
        final int cnt_now_3 = ctx.getErrorCount();
        if ( cnt_now_3 > err_cnt ) {
          ctx.addParserError(node, (("LANGUAGE_PARSER_ERROR: did not expect generated error, err counts : " + err_cnt) + " : ") + cnt_now_3);
        }
      }
      return true;
    }
    if ( ctx.isVarDefined(fnNode.vref) ) {
      final RangerAppParamDesc d = ctx.getVariableDef(fnNode.vref);
      d.ref_cnt = 1 + d.ref_cnt;
      if ( d.nameNode.get().value_type == 15 ) {
        /** unused:  final CodeNode lambdaDefArgs = d.nameNode.get().expression_value.get().children.get(1)   **/ ;
        final CodeNode callParams_1 = node.children.get(1);
        for ( int i_4 = 0; i_4 < callParams_1.children.size(); i_4++) {
          CodeNode arg_2 = callParams_1.children.get(i_4);
          ctx.setInExpr();
          this.WalkNode(arg_2, ctx, wr);
          ctx.unsetInExpr();
        }
        final CodeNode lambdaDef = d.nameNode.get().expression_value.get().children.get(0);
        /** unused:  final CodeNode lambdaArgs = d.nameNode.get().expression_value.get().children.get(1)   **/ ;
        node.has_lambda_call = true;
        node.eval_type = lambdaDef.typeNameAsType(ctx);
        node.eval_type_name = lambdaDef.type_name;
        node.eval_array_type = lambdaDef.array_type;
        node.eval_key_type = lambdaDef.key_type;
        return true;
      }
    }
    ctx.addError(node, (("ERROR, could not find class " + desc.name) + " method ") + fnNode.vref);
    ctx.addError(node, "definition : " + node.getCode());
    if ( expects_error ) {
      final int cnt_now_4 = ctx.getErrorCount();
      if ( cnt_now_4 == err_cnt ) {
        ctx.addParserError(node, (("LANGUAGE_PARSER_ERROR: expected generated error, err counts : " + err_cnt) + " : ") + cnt_now_4);
      }
    } else {
      final int cnt_now_5 = ctx.getErrorCount();
      if ( cnt_now_5 > err_cnt ) {
        ctx.addParserError(node, (("LANGUAGE_PARSER_ERROR: did not expect generated error, err counts : " + err_cnt) + " : ") + cnt_now_5);
      }
    }
    return false;
  }
  
  public void cmdReturn( CodeNode node , RangerAppWriterContext ctx , CodeWriter wr ) {
    node.has_operator = true;
    node.op_index = 5;
    System.out.println(String.valueOf( "cmdReturn" ) );
    if ( (node.children.size()) > 1 ) {
      final CodeNode fc = node.getSecond();
      if ( fc.vref.equals("_") ) {
      } else {
        ctx.setInExpr();
        this.WalkNode(fc, ctx, wr);
        ctx.unsetInExpr();
        /** unused:  final RangerAppFunctionDesc activeFn = ctx.getCurrentMethod()   **/ ;
        if ( fc.hasParamDesc ) {
          fc.paramDesc.get().return_cnt = 1 + fc.paramDesc.get().return_cnt;
          fc.paramDesc.get().ref_cnt = 1 + fc.paramDesc.get().ref_cnt;
        }
        final RangerAppFunctionDesc currFn = ctx.getCurrentMethod();
        if ( fc.hasParamDesc ) {
          System.out.println(String.valueOf( "cmdReturn move-->" ) );
          final Optional<RangerAppParamDesc> pp = fc.paramDesc;
          pp.get().moveRefTo(node, currFn, ctx);
        } else {
          System.out.println(String.valueOf( "cmdReturn had no param desc" ) );
        }
      }
    }
  }
  
  public void cmdAssign( CodeNode node , RangerAppWriterContext ctx , CodeWriter wr ) {
    wr.newline();
    final CodeNode n1 = node.getSecond();
    final CodeNode n2 = node.getThird();
    this.WalkNode(n1, ctx, wr);
    ctx.setInExpr();
    this.WalkNode(n2, ctx, wr);
    ctx.unsetInExpr();
    if ( n1.hasParamDesc ) {
      n1.paramDesc.get().ref_cnt = n1.paramDesc.get().ref_cnt + 1;
      n1.paramDesc.get().set_cnt = n1.paramDesc.get().set_cnt + 1;
    }
    if ( n2.hasParamDesc ) {
      n2.paramDesc.get().ref_cnt = n2.paramDesc.get().ref_cnt + 1;
    }
    if ( n2.hasFlag("optional") ) {
      if ( false == n1.hasFlag("optional") ) {
        ctx.addError(node, "Can not assign optional to non-optional type");
      }
    }
    this.stdParamMatch(node, ctx, wr);
  }
  
  public void EnterTemplateClass( CodeNode node , RangerAppWriterContext ctx , CodeWriter wr ) {
  }
  
  public void EnterClass( CodeNode node , RangerAppWriterContext ctx , CodeWriter wr ) {
    if ( (node.children.size()) != 3 ) {
      ctx.addError(node, "Invalid class declaration");
      return;
    }
    if ( node.hasBooleanProperty("trait") ) {
      return;
    }
    final CodeNode cn = node.children.get(1);
    final CodeNode cBody = node.children.get(2);
    final RangerAppClassDesc desc = ctx.findClass(cn.vref);
    if ( cn.has_vref_annotation ) {
      System.out.println(String.valueOf( "--> generic class, not processed" ) );
      return;
    }
    final RangerAppWriterContext subCtx = desc.ctx.get();
    subCtx.setCurrentClass(desc);
    subCtx.class_level_context = true;
    for ( int i = 0; i < desc.variables.size(); i++) {
      RangerAppParamDesc p = desc.variables.get(i);
      final Optional<CodeNode> vNode = p.node;
      if ( (vNode.get().children.size()) > 2 ) {
        final CodeNode value = vNode.get().children.get(2);
        ctx.setInExpr();
        this.WalkNode(value, ctx, wr);
        ctx.unsetInExpr();
      }
      p.is_class_variable = true;
      p.nameNode.get().eval_type = p.nameNode.get().typeNameAsType(ctx);
      p.nameNode.get().eval_type_name = p.nameNode.get().type_name;
    }
    for ( int i_1 = 0; i_1 < cBody.children.size(); i_1++) {
      CodeNode fNode = cBody.children.get(i_1);
      if ( fNode.isFirstVref("fn") || fNode.isFirstVref("Constructor") ) {
        this.WalkNode(fNode, subCtx, wr);
      }
    }
    for ( int i_2 = 0; i_2 < cBody.children.size(); i_2++) {
      CodeNode fNode_1 = cBody.children.get(i_2);
      if ( fNode_1.isFirstVref("fn") || fNode_1.isFirstVref("PublicMethod") ) {
        this.WalkNode(fNode_1, subCtx, wr);
      }
    }
    final RangerAppWriterContext staticCtx = ctx.fork();
    staticCtx.setCurrentClass(desc);
    for ( int i_3 = 0; i_3 < cBody.children.size(); i_3++) {
      CodeNode fNode_2 = cBody.children.get(i_3);
      if ( fNode_2.isFirstVref("sfn") || fNode_2.isFirstVref("StaticMethod") ) {
        this.WalkNode(fNode_2, staticCtx, wr);
      }
    }
    node.hasClassDescription = true;
    node.clDesc = Optional.of(desc);
    desc.classNode = Optional.of(node);
  }
  
  public void EnterMethod( CodeNode node , RangerAppWriterContext ctx , CodeWriter wr ) {
    this.shouldHaveChildCnt(4, node, ctx, "Method expexts four arguments");
    final CodeNode cn = node.children.get(1);
    final CodeNode fnBody = node.children.get(3);
    final Optional<RangerAppClassDesc> udesc = ctx.getCurrentClass();
    final RangerAppClassDesc desc = udesc.get();
    final Optional<RangerAppFunctionDesc> um = desc.findMethod(cn.vref);
    final RangerAppFunctionDesc m = um.get();
    final RangerAppWriterContext subCtx = m.fnCtx.get();
    subCtx.function_level_context = true;
    subCtx.currentMethod = Optional.of(m);
    for ( int i = 0; i < m.params.size(); i++) {
      RangerAppParamDesc v = m.params.get(i);
      v.nameNode.get().eval_type = v.nameNode.get().typeNameAsType(subCtx);
      v.nameNode.get().eval_type_name = v.nameNode.get().type_name;
      ctx.hadValidType(v.nameNode.get());
    }
    subCtx.setInMethod();
    this.WalkNodeChildren(fnBody, subCtx, wr);
    subCtx.unsetInMethod();
    if ( fnBody.didReturnAtIndex == -1 ) {
      if ( !cn.type_name.equals("void") ) {
        ctx.addError(node, "Function does not return any values!");
      }
    }
    for ( int i_1 = 0; i_1 < subCtx.localVarNames.size(); i_1++) {
      String n = subCtx.localVarNames.get(i_1);
      final Optional<RangerAppParamDesc> p = Optional.ofNullable(subCtx.localVariables.get(n));
      if ( p.get().set_cnt > 0 ) {
        final Optional<CodeNode> defNode = p.get().node;
        defNode.get().setFlag("mutable");
        final Optional<CodeNode> nNode = p.get().nameNode;
        nNode.get().setFlag("mutable");
      }
    }
  }
  
  public void EnterStaticMethod( CodeNode node , RangerAppWriterContext ctx , CodeWriter wr ) {
    this.shouldHaveChildCnt(4, node, ctx, "Method expexts four arguments");
    final CodeNode cn = node.children.get(1);
    final CodeNode fnBody = node.children.get(3);
    final Optional<RangerAppClassDesc> udesc = ctx.getCurrentClass();
    final RangerAppClassDesc desc = udesc.get();
    final RangerAppWriterContext subCtx = ctx.fork();
    subCtx.is_function = true;
    final Optional<RangerAppFunctionDesc> um = desc.findStaticMethod(cn.vref);
    final RangerAppFunctionDesc m = um.get();
    subCtx.currentMethod = Optional.of(m);
    subCtx.in_static_method = true;
    m.fnCtx = Optional.of(subCtx);
    if ( cn.hasFlag("weak") ) {
      m.changeStrength(0, 1, node);
    } else {
      m.changeStrength(1, 1, node);
    }
    subCtx.setInMethod();
    for ( int i = 0; i < m.params.size(); i++) {
      RangerAppParamDesc v = m.params.get(i);
      subCtx.defineVariable(v.name, v);
      v.nameNode.get().eval_type = v.nameNode.get().typeNameAsType(ctx);
      v.nameNode.get().eval_type_name = v.nameNode.get().type_name;
    }
    this.WalkNodeChildren(fnBody, subCtx, wr);
    subCtx.unsetInMethod();
    subCtx.in_static_method = false;
    subCtx.function_level_context = true;
    if ( fnBody.didReturnAtIndex == -1 ) {
      if ( !cn.type_name.equals("void") ) {
        ctx.addError(node, "Function does not return any values!");
      }
    }
    for ( int i_1 = 0; i_1 < subCtx.localVarNames.size(); i_1++) {
      String n = subCtx.localVarNames.get(i_1);
      final Optional<RangerAppParamDesc> p = Optional.ofNullable(subCtx.localVariables.get(n));
      if ( p.get().set_cnt > 0 ) {
        final Optional<CodeNode> defNode = p.get().node;
        defNode.get().setFlag("mutable");
        final Optional<CodeNode> nNode = p.get().nameNode;
        nNode.get().setFlag("mutable");
      }
    }
  }
  
  public void EnterLambdaMethod( CodeNode node , RangerAppWriterContext ctx , CodeWriter wr ) {
    final CodeNode args = node.children.get(1);
    final CodeNode body = node.children.get(2);
    final RangerAppWriterContext subCtx = ctx.fork();
    subCtx.is_capturing = true;
    final CodeNode cn = node.children.get(0);
    final RangerAppFunctionDesc m = new RangerAppFunctionDesc();
    m.name = "lambda";
    m.node = Optional.of(node);
    m.nameNode = Optional.of(node.children.get(0));
    subCtx.is_function = true;
    subCtx.currentMethod = Optional.of(m);
    if ( cn.hasFlag("weak") ) {
      m.changeStrength(0, 1, node);
    } else {
      m.changeStrength(1, 1, node);
    }
    m.fnBody = Optional.of(node.children.get(2));
    for ( int ii = 0; ii < args.children.size(); ii++) {
      CodeNode arg = args.children.get(ii);
      final RangerAppParamDesc p2 = new RangerAppParamDesc();
      p2.name = arg.vref;
      p2.value_type = arg.value_type;
      p2.node = Optional.of(arg);
      p2.nameNode = Optional.of(arg);
      p2.init_cnt = 1;
      p2.refType = 1;
      p2.initRefType = 1;
      if ( args.hasBooleanProperty("strong") ) {
        p2.refType = 2;
        p2.initRefType = 2;
      }
      p2.varType = 4;
      m.params.add(p2);
      arg.hasParamDesc = true;
      arg.paramDesc = Optional.of(p2);
      arg.eval_type = arg.value_type;
      arg.eval_type_name = arg.type_name;
      if ( arg.hasFlag("strong") ) {
        p2.changeStrength(1, 1, p2.nameNode.get());
      } else {
        arg.setFlag("lives");
        p2.changeStrength(0, 1, p2.nameNode.get());
      }
      subCtx.defineVariable(p2.name, p2);
    }
    /** unused:  final int cnt = body.children.size()   **/ ;
    for ( int i = 0; i < body.children.size(); i++) {
      CodeNode item = body.children.get(i);
      this.WalkNode(item, subCtx, wr);
      if ( i == ((body.children.size()) - 1) ) {
        if ( (item.children.size()) > 0 ) {
          final CodeNode fc = item.getFirst();
          if ( !fc.vref.equals("return") ) {
            cn.type_name = "void";
          }
        }
      }
    }
    node.has_lambda = true;
    node.lambda_ctx = Optional.of(subCtx);
    node.eval_type = 15;
    node.eval_function = Optional.of(node);
  }
  
  public void EnterVarDef( CodeNode node , RangerAppWriterContext ctx , CodeWriter wr ) {
    if ( ctx.isInMethod() ) {
      if ( (node.children.size()) > 3 ) {
        ctx.addError(node, "invalid variable definition");
        return;
      }
      if ( (node.children.size()) < 2 ) {
        ctx.addError(node, "invalid variable definition");
        return;
      }
      final CodeNode cn = node.children.get(1);
      final RangerAppParamDesc p = new RangerAppParamDesc();
      Optional<CodeNode> defaultArg = Optional.empty();
      if ( (node.children.size()) == 2 ) {
        if ( (cn.value_type != 6) && (cn.value_type != 7) ) {
          cn.setFlag("optional");
        }
      }
      if ( (cn.vref.length()) == 0 ) {
        ctx.addError(node, "invalid variable definition");
      }
      if ( cn.hasFlag("weak") ) {
        p.changeStrength(0, 1, node);
      } else {
        p.changeStrength(1, 1, node);
      }
      node.hasVarDef = true;
      if ( cn.value_type == 15 ) {
        System.out.println(String.valueOf( "Expression node..." ) );
      }
      if ( (node.children.size()) > 2 ) {
        p.init_cnt = 1;
        p.def_value = Optional.of(node.children.get(2));
        p.is_optional = false;
        defaultArg = Optional.of(node.children.get(2));
        ctx.setInExpr();
        this.WalkNode(defaultArg.get(), ctx, wr);
        ctx.unsetInExpr();
        if ( defaultArg.get().hasFlag("optional") ) {
          cn.setFlag("optional");
        }
        if ( defaultArg.get().eval_type == 6 ) {
          node.op_index = 1;
        }
        if ( cn.value_type == 11 ) {
          cn.eval_type_name = defaultArg.get().ns.get(0);
        }
        if ( cn.value_type == 12 ) {
          if ( (defaultArg.get().eval_type != 3) && (defaultArg.get().eval_type != 12) ) {
            ctx.addError(defaultArg.get(), "Char should be assigned char or integer value --> " + defaultArg.get().getCode());
          } else {
            defaultArg.get().eval_type = 12;
          }
        }
      } else {
        if ( ((cn.value_type != 7) && (cn.value_type != 6)) && (false == cn.hasFlag("optional")) ) {
          cn.setFlag("optional");
        }
      }
      if ( (node.children.size()) > 2 ) {
        if ( ((cn.type_name.length()) == 0) && ((cn.array_type.length()) == 0) ) {
          final CodeNode nodeValue = node.children.get(2);
          if ( nodeValue.eval_type == 15 ) {
            if ( !node.expression_value.isPresent() ) {
              final CodeNode copyOf = nodeValue.rebuildWithType(new RangerArgMatch(), false);
              copyOf.children.remove(copyOf.children.size() - 1);
              cn.expression_value = Optional.of(copyOf);
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
      p.name = cn.vref;
      if ( p.value_type == 0 ) {
        if ( (0 == (cn.type_name.length())) && (defaultArg.isPresent()) ) {
          p.value_type = defaultArg.get().eval_type;
          cn.type_name = defaultArg.get().eval_type_name;
          cn.eval_type_name = defaultArg.get().eval_type_name;
          cn.value_type = defaultArg.get().eval_type;
        }
      } else {
        p.value_type = cn.value_type;
      }
      p.node = Optional.of(node);
      p.nameNode = Optional.of(cn);
      p.varType = 5;
      if ( cn.has_vref_annotation ) {
        ctx.log(node, "ann", "At a variable -> Found has_vref_annotation annotated reference ");
        final Optional<CodeNode> ann = cn.vref_annotation;
        if ( (ann.get().children.size()) > 0 ) {
          final CodeNode fc = ann.get().children.get(0);
          ctx.log(node, "ann", (("value of first annotation " + fc.vref) + " and variable name ") + cn.vref);
        }
      }
      if ( cn.has_type_annotation ) {
        ctx.log(node, "ann", "At a variable -> Found annotated reference ");
        final Optional<CodeNode> ann_1 = cn.type_annotation;
        if ( (ann_1.get().children.size()) > 0 ) {
          final CodeNode fc_1 = ann_1.get().children.get(0);
          ctx.log(node, "ann", (("value of first annotation " + fc_1.vref) + " and variable name ") + cn.vref);
        }
      }
      cn.hasParamDesc = true;
      cn.ownParamDesc = Optional.of(p);
      cn.paramDesc = Optional.of(p);
      node.hasParamDesc = true;
      node.paramDesc = Optional.of(p);
      cn.eval_type = cn.typeNameAsType(ctx);
      cn.eval_type_name = cn.type_name;
      if ( (node.children.size()) > 2 ) {
        if ( cn.eval_type != defaultArg.get().eval_type ) {
          if ( ((cn.eval_type == 12) && (defaultArg.get().eval_type == 3)) || ((cn.eval_type == 3) && (defaultArg.get().eval_type == 12)) ) {
          } else {
            ctx.addError(node, (("Variable was assigned an incompatible type. Types were " + cn.eval_type) + " vs ") + defaultArg.get().eval_type);
          }
        }
      } else {
        p.is_optional = true;
      }
      ctx.defineVariable(p.name, p);
      this.DefineVar(node, ctx, wr);
      if ( (node.children.size()) > 2 ) {
        this.shouldBeEqualTypes(cn, p.def_value.get(), ctx, "Variable was assigned an incompatible type.");
      }
    } else {
      final CodeNode cn_1 = node.children.get(1);
      cn_1.eval_type = cn_1.typeNameAsType(ctx);
      cn_1.eval_type_name = cn_1.type_name;
      this.DefineVar(node, ctx, wr);
      if ( (node.children.size()) > 2 ) {
        this.shouldBeEqualTypes(node.children.get(1), node.children.get(2), ctx, "Variable was assigned an incompatible type.");
      }
    }
  }
  
  public void WalkNodeChildren( CodeNode node , RangerAppWriterContext ctx , CodeWriter wr ) {
    if ( node.hasStringProperty("todo") ) {
      ctx.addTodo(node, node.getStringProperty("todo"));
    }
    if ( node.expression ) {
      for ( int i = 0; i < node.children.size(); i++) {
        CodeNode item = node.children.get(i);
        item.parent = Optional.of(node);
        this.WalkNode(item, ctx, wr);
        node.copyEvalResFrom(item);
      }
    }
  }
  
  public boolean matchNode( CodeNode node , RangerAppWriterContext ctx , CodeWriter wr ) {
    if ( 0 == (node.children.size()) ) {
      return false;
    }
    final CodeNode fc = node.getFirst();
    stdCommands = Optional.of(ctx.getStdCommands());
    for ( int i = 0; i < stdCommands.get().children.size(); i++) {
      CodeNode cmd = stdCommands.get().children.get(i);
      final CodeNode cmdName = cmd.getFirst();
      if ( cmdName.vref.equals(fc.vref) ) {
        this.stdParamMatch(node, ctx, wr);
        if ( node.parent.isPresent() ) {
          node.parent.get().copyEvalResFrom(node);
        }
        return true;
      }
    }
    return false;
  }
  
  public void StartWalk( CodeNode node , RangerAppWriterContext ctx , CodeWriter wr ) {
    this.WalkNode(node, ctx, wr);
    for ( int i = 0; i < walkAlso.size(); i++) {
      CodeNode ch = walkAlso.get(i);
      this.WalkNode(ch, ctx, wr);
    }
  }
  
  public boolean WalkNode( CodeNode node , RangerAppWriterContext ctx , CodeWriter wr ) {
    /** unused:  final int line_index = node.getLine()   **/ ;
    if ( node.flow_done ) {
      return true;
    }
    node.flow_done = true;
    this.lastProcessedNode = Optional.of(node);
    if ( node.hasStringProperty("todo") ) {
      ctx.addTodo(node, node.getStringProperty("todo"));
    }
    if ( node.isPrimitive() ) {
      if ( ctx.expressionLevel() == 0 ) {
        ctx.addError(node, "Primitive element at top level!");
      }
      this.WriteScalarValue(node, ctx, wr);
      return true;
    }
    if ( node.value_type == 9 ) {
      this.WriteVRef(node, ctx, wr);
      return true;
    }
    if ( node.value_type == 10 ) {
      this.WriteComment(node, ctx, wr);
      return true;
    }
    if ( node.isFirstVref("fun") ) {
      this.EnterLambdaMethod(node, ctx, wr);
      return true;
    }
    if ( node.isFirstVref("fn") ) {
      if ( ctx.isInMethod() ) {
        this.EnterLambdaMethod(node, ctx, wr);
        return true;
      }
    }
    if ( node.isFirstVref("Extends") ) {
      return true;
    }
    if ( node.isFirstVref("extension") ) {
      this.EnterClass(node, ctx, wr);
      return true;
    }
    if ( node.isFirstVref("operators") ) {
      return true;
    }
    if ( node.isFirstVref("systemclass") ) {
      return true;
    }
    if ( node.isFirstVref("systemunion") ) {
      return true;
    }
    if ( node.isFirstVref("Import") ) {
      this.cmdImport(node, ctx, wr);
      return true;
    }
    if ( node.isFirstVref("def") ) {
      this.EnterVarDef(node, ctx, wr);
      return true;
    }
    if ( node.isFirstVref("let") ) {
      this.EnterVarDef(node, ctx, wr);
      return true;
    }
    if ( node.isFirstVref("TemplateClass") ) {
      this.EnterTemplateClass(node, ctx, wr);
      return true;
    }
    if ( node.isFirstVref("CreateClass") ) {
      this.EnterClass(node, ctx, wr);
      return true;
    }
    if ( node.isFirstVref("class") ) {
      this.EnterClass(node, ctx, wr);
      return true;
    }
    if ( node.isFirstVref("trait") ) {
      return true;
    }
    if ( node.isFirstVref("PublicMethod") ) {
      this.EnterMethod(node, ctx, wr);
      return true;
    }
    if ( node.isFirstVref("StaticMethod") ) {
      this.EnterStaticMethod(node, ctx, wr);
      return true;
    }
    if ( node.isFirstVref("fn") ) {
      this.EnterMethod(node, ctx, wr);
      return true;
    }
    if ( node.isFirstVref("sfn") ) {
      this.EnterStaticMethod(node, ctx, wr);
      return true;
    }
    if ( node.isFirstVref("=") ) {
      this.cmdAssign(node, ctx, wr);
      return true;
    }
    if ( node.isFirstVref("Constructor") ) {
      this.Constructor(node, ctx, wr);
      return true;
    }
    if ( node.isFirstVref("new") ) {
      this.cmdNew(node, ctx, wr);
      return true;
    }
    if ( this.matchNode(node, ctx, wr) ) {
      return true;
    }
    if ( (node.children.size()) > 0 ) {
      final CodeNode fc = node.children.get(0);
      if ( fc.value_type == 9 ) {
        boolean was_called = true;
        switch (fc.vref ) { 
          case "Enum" : 
            this.cmdEnum(node, ctx, wr);
            break;
          default: 
            was_called = false;
            break;
        }
        if ( was_called ) {
          return true;
        }
        if ( (node.children.size()) > 1 ) {
          if ( this.cmdLocalCall(node, ctx, wr) ) {
            return true;
          }
        }
      }
    }
    if ( node.expression ) {
      for ( int i = 0; i < node.children.size(); i++) {
        CodeNode item = node.children.get(i);
        item.parent = Optional.of(node);
        this.WalkNode(item, ctx, wr);
        node.copyEvalResFrom(item);
      }
      return true;
    }
    ctx.addError(node, "Could not understand this part");
    return true;
  }
  
  public void mergeImports( CodeNode node , RangerAppWriterContext ctx , CodeWriter wr ) {
    if ( node.isFirstVref("Import") ) {
      final CodeNode fNameNode = node.children.get(1);
      final String import_file = fNameNode.string_value;
      if ( ctx.already_imported.containsKey(import_file) ) {
        return;
      }
      ctx.already_imported.put(import_file, true);
      final Optional<String> c = Optional.of(readFile("." + "/" + import_file , StandardCharsets.UTF_8 ));
      final SourceCode code = new SourceCode(c.get());
      code.filename = import_file;
      final RangerLispParser parser = new RangerLispParser(code);
      parser.parse();
      node.expression = true;
      node.vref = "";
      node.children.remove(node.children.size() - 1);
      node.children.remove(node.children.size() - 1);
      final CodeNode rn = parser.rootNode.get();
      this.mergeImports(rn, ctx, wr);
      node.children.add(rn);
    } else {
      for ( int i = 0; i < node.children.size(); i++) {
        CodeNode item = node.children.get(i);
        this.mergeImports(item, ctx, wr);
      }
    }
  }
  
  public void CollectMethods( CodeNode node , RangerAppWriterContext ctx , CodeWriter wr ) {
    this.WalkCollectMethods(node, ctx, wr);
    for ( int i = 0; i < classesWithTraits.size(); i++) {
      ClassJoinPoint point = classesWithTraits.get(i);
      final RangerAppClassDesc cl = point.class_def.get();
      /** unused:  final CodeNode joinPoint = point.node.get()   **/ ;
      final CodeNode traitClassDef = point.node.get().children.get(1);
      final String name = traitClassDef.vref;
      final RangerAppClassDesc t = ctx.findClass(name);
      if ( (t.extends_classes.size()) > 0 ) {
        ctx.addError(point.node.get(), ("Can not join class " + name) + " because it is inherited. Currently on base classes can be used as traits.");
        continue;
      }
      if ( t.has_constructor ) {
        ctx.addError(point.node.get(), ("Can not join class " + name) + " because it has a constructor function");
      } else {
        final CodeNode origBody = cl.node.get().children.get(2);
        final RangerArgMatch match = new RangerArgMatch();
        final Optional<CodeNode> params = t.node.get().getExpressionProperty("params");
        final Optional<CodeNode> initParams = point.node.get().getExpressionProperty("params");
        if ( (params.isPresent()) && (initParams.isPresent()) ) {
          for ( int i_1 = 0; i_1 < params.get().children.size(); i_1++) {
            CodeNode typeName = params.get().children.get(i_1);
            final CodeNode pArg = initParams.get().children.get(i_1);
            match.add(typeName.vref, pArg.vref, ctx);
          }
        } else {
          match.add("T", cl.name, ctx);
        }
        ctx.setCurrentClass(cl);
        final RangerAppClassDesc traitClass = ctx.findClass(traitClassDef.vref);
        for ( int i_2 = 0; i_2 < traitClass.variables.size(); i_2++) {
          RangerAppParamDesc pvar = traitClass.variables.get(i_2);
          final CodeNode ccopy = pvar.node.get().rebuildWithType(match, true);
          this.WalkCollectMethods(ccopy, ctx, wr);
          origBody.children.add(ccopy);
        }
        for ( int i_3 = 0; i_3 < traitClass.defined_variants.size(); i_3++) {
          String fnVar = traitClass.defined_variants.get(i_3);
          final Optional<RangerAppMethodVariants> mVs = Optional.ofNullable(traitClass.method_variants.get(fnVar));
          for ( int i_4 = 0; i_4 < mVs.get().variants.size(); i_4++) {
            RangerAppFunctionDesc variant = mVs.get().variants.get(i_4);
            final CodeNode ccopy_1 = variant.node.get().rebuildWithType(match, true);
            this.WalkCollectMethods(ccopy_1, ctx, wr);
            origBody.children.add(ccopy_1);
          }
        }
      }
    }
    for ( int i_5 = 0; i_5 < serializedClasses.size(); i_5++) {
      RangerAppClassDesc cl_1 = serializedClasses.get(i_5);
      cl_1.is_serialized = true;
      final RangerSerializeClass ser = new RangerSerializeClass();
      final CodeWriter extWr = new CodeWriter();
      ser.createJSONSerializerFn(cl_1, cl_1.ctx.get(), extWr);
      final String theCode = extWr.getCode();
      final SourceCode code = new SourceCode(theCode);
      code.filename = "extension " + ctx.currentClass.get().name;
      final RangerLispParser parser = new RangerLispParser(code);
      parser.parse();
      final CodeNode rn = parser.rootNode.get();
      this.WalkCollectMethods(rn, cl_1.ctx.get(), wr);
      walkAlso.add(rn);
    }
  }
  
  public void WalkCollectMethods( CodeNode node , RangerAppWriterContext ctx , CodeWriter wr ) {
    boolean find_more = true;
    if ( node.isFirstVref("systemunion") ) {
      final CodeNode nameNode = node.getSecond();
      final CodeNode instances = node.getThird();
      final RangerAppClassDesc new_class = new RangerAppClassDesc();
      new_class.name = nameNode.vref;
      new_class.nameNode = Optional.of(nameNode);
      ctx.addClass(nameNode.vref, new_class);
      new_class.is_system_union = true;
      for ( int i = 0; i < instances.children.size(); i++) {
        CodeNode ch = instances.children.get(i);
        new_class.is_union_of.add(ch.vref);
      }
      nameNode.clDesc = Optional.of(new_class);
      return;
    }
    if ( node.isFirstVref("systemclass") ) {
      final CodeNode nameNode_1 = node.getSecond();
      final CodeNode instances_1 = node.getThird();
      final RangerAppClassDesc new_class_1 = new RangerAppClassDesc();
      new_class_1.name = nameNode_1.vref;
      new_class_1.nameNode = Optional.of(nameNode_1);
      ctx.addClass(nameNode_1.vref, new_class_1);
      new_class_1.is_system = true;
      for ( int i_1 = 0; i_1 < instances_1.children.size(); i_1++) {
        CodeNode ch_1 = instances_1.children.get(i_1);
        final CodeNode langName = ch_1.getFirst();
        final CodeNode langClassName = ch_1.getSecond();
        new_class_1.systemNames.put(langName.vref, langClassName.vref);
      }
      nameNode_1.is_system_class = true;
      nameNode_1.clDesc = Optional.of(new_class_1);
      return;
    }
    if ( node.isFirstVref("Extends") ) {
      final CodeNode extList = node.children.get(1);
      final Optional<RangerAppClassDesc> currC = ctx.currentClass;
      for ( int ii = 0; ii < extList.children.size(); ii++) {
        CodeNode ee = extList.children.get(ii);
        currC.get().addParentClass(ee.vref);
        final RangerAppClassDesc ParentClass = ctx.findClass(ee.vref);
        ParentClass.is_inherited = true;
      }
    }
    if ( node.isFirstVref("Constructor") ) {
      final Optional<RangerAppClassDesc> currC_1 = ctx.currentClass;
      final RangerAppWriterContext subCtx = currC_1.get().ctx.get().fork();
      currC_1.get().has_constructor = true;
      currC_1.get().constructor_node = Optional.of(node);
      final RangerAppFunctionDesc m = new RangerAppFunctionDesc();
      m.name = "Constructor";
      m.node = Optional.of(node);
      m.nameNode = Optional.of(node.children.get(0));
      m.fnBody = Optional.of(node.children.get(2));
      m.fnCtx = Optional.of(subCtx);
      final CodeNode args = node.children.get(1);
      for ( int ii_1 = 0; ii_1 < args.children.size(); ii_1++) {
        CodeNode arg = args.children.get(ii_1);
        final RangerAppParamDesc p = new RangerAppParamDesc();
        p.name = arg.vref;
        p.value_type = arg.value_type;
        p.node = Optional.of(arg);
        p.nameNode = Optional.of(arg);
        p.refType = 1;
        p.varType = 4;
        m.params.add(p);
        arg.hasParamDesc = true;
        arg.paramDesc = Optional.of(p);
        arg.eval_type = arg.value_type;
        arg.eval_type_name = arg.type_name;
        subCtx.defineVariable(p.name, p);
      }
      currC_1.get().constructor_fn = Optional.of(m);
      find_more = false;
    }
    if ( node.isFirstVref("trait") ) {
      final String s = node.getVRefAt(1);
      final CodeNode classNameNode = node.getSecond();
      final RangerAppClassDesc new_class_2 = new RangerAppClassDesc();
      new_class_2.name = s;
      final RangerAppWriterContext subCtx_1 = ctx.fork();
      ctx.setCurrentClass(new_class_2);
      subCtx_1.setCurrentClass(new_class_2);
      new_class_2.ctx = Optional.of(subCtx_1);
      new_class_2.nameNode = Optional.of(classNameNode);
      ctx.addClass(s, new_class_2);
      new_class_2.classNode = Optional.of(node);
      new_class_2.node = Optional.of(node);
      new_class_2.is_trait = true;
    }
    if ( node.isFirstVref("CreateClass") || node.isFirstVref("class") ) {
      final String s_1 = node.getVRefAt(1);
      final CodeNode classNameNode_1 = node.getSecond();
      if ( classNameNode_1.has_vref_annotation ) {
        System.out.println(String.valueOf( "%% vref_annotation" ) );
        final Optional<CodeNode> ann = classNameNode_1.vref_annotation;
        System.out.println(String.valueOf( (classNameNode_1.vref + " : ") + ann.get().getCode() ) );
        ctx.addTemplateClass(classNameNode_1.vref, node);
        find_more = false;
      } else {
        final RangerAppClassDesc new_class_3 = new RangerAppClassDesc();
        new_class_3.name = s_1;
        final RangerAppWriterContext subCtx_2 = ctx.fork();
        ctx.setCurrentClass(new_class_3);
        subCtx_2.setCurrentClass(new_class_3);
        new_class_3.ctx = Optional.of(subCtx_2);
        new_class_3.nameNode = Optional.of(classNameNode_1);
        ctx.addClass(s_1, new_class_3);
        new_class_3.classNode = Optional.of(node);
        new_class_3.node = Optional.of(node);
        if ( node.hasBooleanProperty("trait") ) {
          new_class_3.is_trait = true;
        }
      }
    }
    if ( node.isFirstVref("TemplateClass") ) {
      final String s_2 = node.getVRefAt(1);
      ctx.addTemplateClass(s_2, node);
      find_more = false;
    }
    if ( node.isFirstVref("Extends") ) {
      final CodeNode list = node.children.get(1);
      for ( int i_2 = 0; i_2 < list.children.size(); i_2++) {
        CodeNode cname = list.children.get(i_2);
        final RangerAppClassDesc extC = ctx.findClass(cname.vref);
        for ( int i_3 = 0; i_3 < extC.variables.size(); i_3++) {
          RangerAppParamDesc vv = extC.variables.get(i_3);
          final Optional<RangerAppClassDesc> currC_2 = ctx.currentClass;
          final Optional<RangerAppWriterContext> subCtx_3 = currC_2.get().ctx;
          subCtx_3.get().defineVariable(vv.name, vv);
        }
      }
      find_more = false;
    }
    if ( node.isFirstVref("def") || node.isFirstVref("let") ) {
      final String s_3 = node.getVRefAt(1);
      final CodeNode vDef = node.children.get(1);
      final RangerAppParamDesc p_1 = new RangerAppParamDesc();
      if ( !s_3.equals(ctx.transformWord(s_3)) ) {
        ctx.addError(node, ("Can not use reserved word " + s_3) + " as class propery");
      }
      p_1.name = s_3;
      p_1.value_type = vDef.value_type;
      p_1.node = Optional.of(node);
      p_1.is_class_variable = true;
      p_1.varType = 8;
      p_1.node = Optional.of(node);
      p_1.nameNode = Optional.of(vDef);
      vDef.hasParamDesc = true;
      vDef.ownParamDesc = Optional.of(p_1);
      vDef.paramDesc = Optional.of(p_1);
      node.hasParamDesc = true;
      node.paramDesc = Optional.of(p_1);
      if ( vDef.hasFlag("weak") ) {
        p_1.changeStrength(0, 2, p_1.nameNode.get());
      } else {
        p_1.changeStrength(2, 2, p_1.nameNode.get());
      }
      if ( (node.children.size()) > 2 ) {
        p_1.set_cnt = 1;
        p_1.init_cnt = 1;
        p_1.def_value = Optional.of(node.children.get(2));
        p_1.is_optional = false;
        if ( p_1.def_value.get().value_type == 4 ) {
          vDef.type_name = "string";
        }
        if ( p_1.def_value.get().value_type == 3 ) {
          vDef.type_name = "int";
        }
        if ( p_1.def_value.get().value_type == 2 ) {
          vDef.type_name = "double";
        }
        if ( p_1.def_value.get().value_type == 5 ) {
          vDef.type_name = "boolean";
        }
      } else {
        p_1.is_optional = true;
        if ( false == ((vDef.value_type == 6) || (vDef.value_type == 7)) ) {
          vDef.setFlag("optional");
        }
      }
      final Optional<RangerAppClassDesc> currC_3 = ctx.currentClass;
      currC_3.get().addVariable(p_1);
      final Optional<RangerAppWriterContext> subCtx_4 = currC_3.get().ctx;
      subCtx_4.get().defineVariable(p_1.name, p_1);
      p_1.is_class_variable = true;
    }
    if ( node.isFirstVref("operators") ) {
      final CodeNode listOf = node.getSecond();
      for ( int i_4 = 0; i_4 < listOf.children.size(); i_4++) {
        CodeNode item = listOf.children.get(i_4);
        ctx.createOperator(item);
      }
      find_more = false;
    }
    if ( node.isFirstVref("Import") || node.isFirstVref("import") ) {
      final CodeNode fNameNode = node.children.get(1);
      final String import_file = fNameNode.string_value;
      if ( ctx.already_imported.containsKey(import_file) ) {
        return;
      } else {
        ctx.already_imported.put(import_file, true);
      }
      final Optional<String> c = Optional.of(readFile("." + "/" + import_file , StandardCharsets.UTF_8 ));
      final SourceCode code = new SourceCode(c.get());
      code.filename = import_file;
      final RangerLispParser parser = new RangerLispParser(code);
      parser.parse();
      final Optional<CodeNode> rnode = parser.rootNode;
      this.WalkCollectMethods(rnode.get(), ctx, wr);
      find_more = false;
    }
    if ( node.isFirstVref("does") ) {
      final CodeNode defName = node.getSecond();
      final Optional<RangerAppClassDesc> currC_4 = ctx.currentClass;
      currC_4.get().consumes_traits.add(defName.vref);
      final ClassJoinPoint joinPoint = new ClassJoinPoint();
      joinPoint.class_def = currC_4;
      joinPoint.node = Optional.of(node);
      classesWithTraits.add(joinPoint);
    }
    if ( node.isFirstVref("StaticMethod") || node.isFirstVref("sfn") ) {
      final String s_4 = node.getVRefAt(1);
      final Optional<RangerAppClassDesc> currC_5 = ctx.currentClass;
      final RangerAppFunctionDesc m_1 = new RangerAppFunctionDesc();
      m_1.name = s_4;
      m_1.compiledName = ctx.transformWord(s_4);
      m_1.node = Optional.of(node);
      m_1.is_static = true;
      m_1.nameNode = Optional.of(node.children.get(1));
      m_1.nameNode.get().ifNoTypeSetToVoid();
      final CodeNode args_1 = node.children.get(2);
      m_1.fnBody = Optional.of(node.children.get(3));
      for ( int ii_2 = 0; ii_2 < args_1.children.size(); ii_2++) {
        CodeNode arg_1 = args_1.children.get(ii_2);
        final RangerAppParamDesc p_2 = new RangerAppParamDesc();
        p_2.name = arg_1.vref;
        p_2.value_type = arg_1.value_type;
        p_2.node = Optional.of(arg_1);
        p_2.init_cnt = 1;
        p_2.nameNode = Optional.of(arg_1);
        p_2.refType = 1;
        p_2.varType = 4;
        m_1.params.add(p_2);
        arg_1.hasParamDesc = true;
        arg_1.paramDesc = Optional.of(p_2);
        arg_1.eval_type = arg_1.value_type;
        arg_1.eval_type_name = arg_1.type_name;
        if ( arg_1.hasFlag("strong") ) {
          p_2.changeStrength(1, 1, p_2.nameNode.get());
        } else {
          arg_1.setFlag("lives");
          p_2.changeStrength(0, 1, p_2.nameNode.get());
        }
      }
      currC_5.get().addStaticMethod(m_1);
      find_more = false;
    }
    if ( node.isFirstVref("extension") ) {
      final String s_5 = node.getVRefAt(1);
      final RangerAppClassDesc old_class = ctx.findClass(s_5);
      ctx.setCurrentClass(old_class);
      System.out.println(String.valueOf( "extension for " + s_5 ) );
    }
    if ( node.isFirstVref("PublicMethod") || node.isFirstVref("fn") ) {
      final CodeNode cn = node.getSecond();
      final String s_6 = node.getVRefAt(1);
      cn.ifNoTypeSetToVoid();
      final Optional<RangerAppClassDesc> currC_6 = ctx.currentClass;
      if ( currC_6.get().hasOwnMethod(s_6) ) {
        ctx.addError(node, "Error: method of same name declared earlier. Overriding function declarations is not currently allowed!");
        return;
      }
      if ( cn.hasFlag("main") ) {
        ctx.addError(node, "Error: dynamic method declared as @(main). Use static 'sfn' instead of 'fn'.");
        return;
      }
      final RangerAppFunctionDesc m_2 = new RangerAppFunctionDesc();
      m_2.name = s_6;
      m_2.compiledName = ctx.transformWord(s_6);
      m_2.node = Optional.of(node);
      m_2.nameNode = Optional.of(node.children.get(1));
      if ( node.hasBooleanProperty("strong") ) {
        m_2.refType = 2;
      } else {
        m_2.refType = 1;
      }
      final RangerAppWriterContext subCtx_5 = currC_6.get().ctx.get().fork();
      subCtx_5.is_function = true;
      subCtx_5.currentMethod = Optional.of(m_2);
      m_2.fnCtx = Optional.of(subCtx_5);
      if ( cn.hasFlag("weak") ) {
        m_2.changeStrength(0, 1, node);
      } else {
        m_2.changeStrength(1, 1, node);
      }
      final CodeNode args_2 = node.children.get(2);
      m_2.fnBody = Optional.of(node.children.get(3));
      for ( int ii_3 = 0; ii_3 < args_2.children.size(); ii_3++) {
        CodeNode arg_2 = args_2.children.get(ii_3);
        final RangerAppParamDesc p2 = new RangerAppParamDesc();
        p2.name = arg_2.vref;
        p2.value_type = arg_2.value_type;
        p2.node = Optional.of(arg_2);
        p2.nameNode = Optional.of(arg_2);
        p2.init_cnt = 1;
        p2.refType = 1;
        p2.initRefType = 1;
        p2.debugString = "--> collected ";
        if ( args_2.hasBooleanProperty("strong") ) {
          p2.debugString = "--> collected as STRONG";
          ctx.log(node, "memory5", "strong param should move local ownership to call ***");
          p2.refType = 2;
          p2.initRefType = 2;
        }
        p2.varType = 4;
        m_2.params.add(p2);
        arg_2.hasParamDesc = true;
        arg_2.paramDesc = Optional.of(p2);
        arg_2.eval_type = arg_2.value_type;
        arg_2.eval_type_name = arg_2.type_name;
        if ( arg_2.hasFlag("strong") ) {
          p2.changeStrength(1, 1, p2.nameNode.get());
        } else {
          arg_2.setFlag("lives");
          p2.changeStrength(0, 1, p2.nameNode.get());
        }
        subCtx_5.defineVariable(p2.name, p2);
      }
      currC_6.get().addMethod(m_2);
      find_more = false;
    }
    if ( find_more ) {
      for ( int i_5 = 0; i_5 < node.children.size(); i_5++) {
        CodeNode item_1 = node.children.get(i_5);
        this.WalkCollectMethods(item_1, ctx, wr);
      }
    }
    if ( node.hasBooleanProperty("serialize") ) {
      serializedClasses.add(ctx.currentClass.get());
    }
  }
  
  public void FindWeakRefs( CodeNode node , RangerAppWriterContext ctx , CodeWriter wr ) {
    final ArrayList<RangerAppClassDesc> list = ctx.getClasses();
    for ( int i = 0; i < list.size(); i++) {
      RangerAppClassDesc classDesc = list.get(i);
      for ( int i2 = 0; i2 < classDesc.variables.size(); i2++) {
        RangerAppParamDesc varD = classDesc.variables.get(i2);
        if ( varD.refType == 1 ) {
          if ( varD.isArray() ) {
            /** unused:  final Optional<CodeNode> nn = varD.nameNode   **/ ;
          }
          if ( varD.isHash() ) {
            /** unused:  final Optional<CodeNode> nn_1 = varD.nameNode   **/ ;
          }
          if ( varD.isObject() ) {
            /** unused:  final Optional<CodeNode> nn_2 = varD.nameNode   **/ ;
          }
        }
      }
    }
  }
  
  public Optional<RangerAppFunctionDesc> findFunctionDesc( CodeNode obj , RangerAppWriterContext ctx , CodeWriter wr ) {
    Optional<RangerAppParamDesc> varDesc = Optional.empty();
    Optional<RangerAppFunctionDesc> varFnDesc = Optional.empty();
    if ( !obj.vref.equals(this.getThisName()) ) {
      if ( (obj.ns.size()) > 1 ) {
        final int cnt = obj.ns.size();
        Optional<RangerAppParamDesc> classRefDesc = Optional.empty();
        Optional<RangerAppClassDesc> classDesc = Optional.empty();
        for ( int i = 0; i < obj.ns.size(); i++) {
          String strname = obj.ns.get(i);
          if ( i == 0 ) {
            if ( strname.equals(this.getThisName()) ) {
              classDesc = ctx.getCurrentClass();
            } else {
              if ( ctx.isDefinedClass(strname) ) {
                classDesc = Optional.of(ctx.findClass(strname));
                continue;
              }
              classRefDesc = Optional.of(ctx.getVariableDef(strname));
              if ( (!classRefDesc.isPresent()) || (!classRefDesc.get().nameNode.isPresent()) ) {
                ctx.addError(obj, "Error, no description for called object: " + strname);
                break;
              }
              classRefDesc.get().ref_cnt = 1 + classRefDesc.get().ref_cnt;
              classDesc = Optional.of(ctx.findClass(classRefDesc.get().nameNode.get().type_name));
              if ( !classDesc.isPresent() ) {
                return Optional.ofNullable((varFnDesc.isPresent() ? (RangerAppFunctionDesc)varFnDesc.get() : null ) );
              }
            }
          } else {
            if ( !classDesc.isPresent() ) {
              return Optional.ofNullable((varFnDesc.isPresent() ? (RangerAppFunctionDesc)varFnDesc.get() : null ) );
            }
            if ( i < (cnt - 1) ) {
              varDesc = classDesc.get().findVariable(strname);
              if ( !varDesc.isPresent() ) {
                ctx.addError(obj, "Error, no description for refenced obj: " + strname);
              }
              final String subClass = varDesc.get().getTypeName();
              classDesc = Optional.of(ctx.findClass(subClass));
              continue;
            }
            if ( classDesc.isPresent() ) {
              varFnDesc = classDesc.get().findMethod(strname);
              if ( !varFnDesc.isPresent() ) {
                varFnDesc = classDesc.get().findStaticMethod(strname);
                if ( !varFnDesc.isPresent() ) {
                  ctx.addError(obj, " function variable not found " + strname);
                }
              }
            }
          }
        }
        return Optional.ofNullable((varFnDesc.isPresent() ? (RangerAppFunctionDesc)varFnDesc.get() : null ) );
      }
      final Optional<RangerAppClassDesc> udesc = ctx.getCurrentClass();
      final RangerAppClassDesc currClass = udesc.get();
      varFnDesc = currClass.findMethod(obj.vref);
      if ( varFnDesc.get().nameNode.isPresent() ) {
      } else {
        ctx.addError(obj, "Error, no description for called function: " + obj.vref);
      }
      return Optional.ofNullable((varFnDesc.isPresent() ? (RangerAppFunctionDesc)varFnDesc.get() : null ) );
    }
    ctx.addError(obj, "Can not call 'this' like function");
    varFnDesc = Optional.of(new RangerAppFunctionDesc());
    return Optional.ofNullable((varFnDesc.isPresent() ? (RangerAppFunctionDesc)varFnDesc.get() : null ) );
  }
  
  public Optional<RangerAppParamDesc> findParamDesc( CodeNode obj , RangerAppWriterContext ctx , CodeWriter wr ) {
    Optional<RangerAppParamDesc> varDesc = Optional.empty();
    boolean set_nsp = false;
    Optional<RangerAppClassDesc> classDesc = Optional.empty();
    if ( 0 == (obj.nsp.size()) ) {
      set_nsp = true;
    }
    if ( !obj.vref.equals(this.getThisName()) ) {
      if ( (obj.ns.size()) > 1 ) {
        final int cnt = obj.ns.size();
        Optional<RangerAppParamDesc> classRefDesc = Optional.empty();
        for ( int i = 0; i < obj.ns.size(); i++) {
          String strname = obj.ns.get(i);
          if ( i == 0 ) {
            if ( strname.equals(this.getThisName()) ) {
              classDesc = ctx.getCurrentClass();
              if ( set_nsp ) {
                obj.nsp.add(classDesc.get());
              }
            } else {
              if ( ctx.isDefinedClass(strname) ) {
                classDesc = Optional.of(ctx.findClass(strname));
                if ( set_nsp ) {
                  obj.nsp.add(classDesc.get());
                }
                continue;
              }
              classRefDesc = Optional.of(ctx.getVariableDef(strname));
              if ( !classRefDesc.isPresent() ) {
                ctx.addError(obj, "Error, no description for called object: " + strname);
                break;
              }
              if ( set_nsp ) {
                obj.nsp.add(classRefDesc.get());
              }
              classRefDesc.get().ref_cnt = 1 + classRefDesc.get().ref_cnt;
              classDesc = Optional.of(ctx.findClass(classRefDesc.get().nameNode.get().type_name));
            }
          } else {
            if ( i < (cnt - 1) ) {
              varDesc = classDesc.get().findVariable(strname);
              if ( !varDesc.isPresent() ) {
                ctx.addError(obj, "Error, no description for refenced obj: " + strname);
              }
              final String subClass = varDesc.get().getTypeName();
              classDesc = Optional.of(ctx.findClass(subClass));
              if ( set_nsp ) {
                obj.nsp.add(varDesc.get());
              }
              continue;
            }
            if ( classDesc.isPresent() ) {
              varDesc = classDesc.get().findVariable(strname);
              if ( !varDesc.isPresent() ) {
                Optional<RangerAppFunctionDesc> classMethod = classDesc.get().findMethod(strname);
                if ( !classMethod.isPresent() ) {
                  classMethod = classDesc.get().findStaticMethod(strname);
                  if ( !classMethod.isPresent() ) {
                    ctx.addError(obj, "variable not found " + strname);
                  }
                }
                if ( classMethod.isPresent() ) {
                  if ( set_nsp ) {
                    obj.nsp.add(classMethod.get());
                  }
                  return Optional.ofNullable((classMethod.isPresent() ? (RangerAppParamDesc)classMethod.get() : null ) );
                }
              }
              if ( set_nsp ) {
                obj.nsp.add(varDesc.get());
              }
            }
          }
        }
        return Optional.ofNullable((varDesc.isPresent() ? (RangerAppParamDesc)varDesc.get() : null ) );
      }
      varDesc = Optional.of(ctx.getVariableDef(obj.vref));
      if ( varDesc.get().nameNode.isPresent() ) {
      } else {
        System.out.println(String.valueOf( "findParamDesc : description not found for " + obj.vref ) );
        if ( varDesc.isPresent() ) {
          System.out.println(String.valueOf( "Vardesc was found though..." + varDesc.get().name ) );
        }
        ctx.addError(obj, "Error, no description for called object: " + obj.vref);
      }
      return Optional.ofNullable((varDesc.isPresent() ? (RangerAppParamDesc)varDesc.get() : null ) );
    }
    final Optional<RangerAppClassDesc> cc = ctx.getCurrentClass();
    return Optional.ofNullable((cc.isPresent() ? (RangerAppParamDesc)cc.get() : null ) );
  }
  
  public boolean areEqualTypes( CodeNode n1 , CodeNode n2 , RangerAppWriterContext ctx ) {
    if ( (((n1.eval_type != 0) && (n2.eval_type != 0)) && ((n1.eval_type_name.length()) > 0)) && ((n2.eval_type_name.length()) > 0) ) {
      if ( n1.eval_type_name.equals(n2.eval_type_name) ) {
      } else {
        boolean b_ok = false;
        if ( ctx.isEnumDefined(n1.eval_type_name) && (n2.eval_type_name.equals("int")) ) {
          b_ok = true;
        }
        if ( ctx.isEnumDefined(n2.eval_type_name) && (n1.eval_type_name.equals("int")) ) {
          b_ok = true;
        }
        if ( (n1.eval_type_name.equals("char")) && (n2.eval_type_name.equals("int")) ) {
          b_ok = true;
        }
        if ( (n1.eval_type_name.equals("int")) && (n2.eval_type_name.equals("char")) ) {
          b_ok = true;
        }
        if ( ctx.isDefinedClass(n1.eval_type_name) && ctx.isDefinedClass(n2.eval_type_name) ) {
          final RangerAppClassDesc c1 = ctx.findClass(n1.eval_type_name);
          final RangerAppClassDesc c2 = ctx.findClass(n2.eval_type_name);
          if ( c1.isSameOrParentClass(n2.eval_type_name, ctx) ) {
            return true;
          }
          if ( c2.isSameOrParentClass(n1.eval_type_name, ctx) ) {
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
  
  public void shouldBeEqualTypes( CodeNode n1 , CodeNode n2 , RangerAppWriterContext ctx , String msg ) {
    if ( (((n1.eval_type != 0) && (n2.eval_type != 0)) && ((n1.eval_type_name.length()) > 0)) && ((n2.eval_type_name.length()) > 0) ) {
      if ( n1.eval_type_name.equals(n2.eval_type_name) ) {
      } else {
        boolean b_ok = false;
        if ( ctx.isEnumDefined(n1.eval_type_name) && (n2.eval_type_name.equals("int")) ) {
          b_ok = true;
        }
        if ( ctx.isEnumDefined(n2.eval_type_name) && (n1.eval_type_name.equals("int")) ) {
          b_ok = true;
        }
        if ( ctx.isDefinedClass(n2.eval_type_name) ) {
          final RangerAppClassDesc cc = ctx.findClass(n2.eval_type_name);
          if ( cc.isSameOrParentClass(n1.eval_type_name, ctx) ) {
            b_ok = true;
          }
        }
        if ( (n1.eval_type_name.equals("char")) && (n2.eval_type_name.equals("int")) ) {
          b_ok = true;
        }
        if ( (n1.eval_type_name.equals("int")) && (n2.eval_type_name.equals("char")) ) {
          b_ok = true;
        }
        if ( b_ok == false ) {
          ctx.addError(n1, (((("Type mismatch " + n2.eval_type_name) + " <> ") + n1.eval_type_name) + ". ") + msg);
        }
      }
    }
  }
  
  public void shouldBeExpression( CodeNode n1 , RangerAppWriterContext ctx , String msg ) {
    if ( n1.expression == false ) {
      ctx.addError(n1, msg);
    }
  }
  
  public void shouldHaveChildCnt( int cnt , CodeNode n1 , RangerAppWriterContext ctx , String msg ) {
    if ( (n1.children.size()) != cnt ) {
      ctx.addError(n1, msg);
    }
  }
  
  public void shouldBeNumeric( CodeNode n1 , RangerAppWriterContext ctx , String msg ) {
    if ( (n1.eval_type != 0) && ((n1.eval_type_name.length()) > 0) ) {
      if ( false == ((n1.eval_type_name.equals("double")) || (n1.eval_type_name.equals("int"))) ) {
        ctx.addError(n1, (("Not numeric: " + n1.eval_type_name) + ". ") + msg);
      }
    }
  }
  
  public void shouldBeArray( CodeNode n1 , RangerAppWriterContext ctx , String msg ) {
    if ( n1.eval_type != 6 ) {
      ctx.addError(n1, "Expecting array. " + msg);
    }
  }
  
  public void shouldBeType( String type_name , CodeNode n1 , RangerAppWriterContext ctx , String msg ) {
    if ( (n1.eval_type != 0) && ((n1.eval_type_name.length()) > 0) ) {
      if ( n1.eval_type_name.equals(type_name) ) {
      } else {
        boolean b_ok = false;
        if ( ctx.isEnumDefined(n1.eval_type_name) && (type_name.equals("int")) ) {
          b_ok = true;
        }
        if ( ctx.isEnumDefined(type_name) && (n1.eval_type_name.equals("int")) ) {
          b_ok = true;
        }
        if ( (n1.eval_type_name.equals("char")) && (type_name.equals("int")) ) {
          b_ok = true;
        }
        if ( (n1.eval_type_name.equals("int")) && (type_name.equals("char")) ) {
          b_ok = true;
        }
        if ( b_ok == false ) {
          ctx.addError(n1, (((("Type mismatch " + type_name) + " <> ") + n1.eval_type_name) + ". ") + msg);
        }
      }
    }
  }
}
