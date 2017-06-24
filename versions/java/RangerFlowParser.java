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
  
  public void cmdEnum( CodeNode node , RangerAppWriterContext ctx , CodeWriter wr ) {
    final CodeNode fNameNode = node.children.get(1);
    final CodeNode enumList = node.children.get(2);
    final RangerAppEnum new_enum = new RangerAppEnum();
    for ( int i_25 = 0; i_25 < enumList.children.size(); i_25++) {
      CodeNode item_2 = enumList.children.get(i_25);
      new_enum.add(item_2.vref);
    }
    ctx.definedEnums.put(fNameNode.vref, new_enum);
  }
  
  public void initStdCommands() {
  }
  
  public Optional<CodeNode> findLanguageOper( CodeNode details , RangerAppWriterContext ctx ) {
    final String langName = ctx.getTargetLang();
    for ( int i_28 = 0; i_28 < details.children.size(); i_28++) {
      CodeNode det = details.children.get(i_28);
      if ( (det.children.size()) > 0 ) {
        final CodeNode fc_13 = det.children.get(0);
        if ( fc_13.vref.equals("templates") ) {
          final CodeNode tplList = det.children.get(1);
          for ( int i_38 = 0; i_38 < tplList.children.size(); i_38++) {
            CodeNode tpl = tplList.children.get(i_38);
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
    final Optional<CodeNode> none_2 = Optional.empty();
    return Optional.ofNullable((none_2.isPresent() ? (CodeNode)none_2.get() : null ) );
  }
  
  public CodeNode buildMacro( Optional<CodeNode> langOper , CodeNode args , RangerAppWriterContext ctx ) {
    final RangerAppWriterContext subCtx = ctx.fork();
    final CodeWriter wr_4 = new CodeWriter();
    final LiveCompiler lcc = new LiveCompiler();
    lcc.langWriter = Optional.of(new RangerRangerClassWriter());
    lcc.langWriter.get().compiler = Optional.of(lcc);
    subCtx.targetLangName = "ranger";
    final CodeNode macroNode = langOper.get();
    final CodeNode cmdList = macroNode.getSecond();
    lcc.walkCommandList(cmdList, args, subCtx, wr_4);
    final String lang_str = wr_4.getCode();
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
    final Optional<CodeNode> cmds_2 = stdCommands;
    boolean some_matched = false;
    /** unused:  final boolean found_fn = false   **/ ;
    /** unused:  final ArrayList<String> missed_args_2 = new ArrayList<String>()   **/ ;
    RangerAppWriterContext ctx = inCtx.fork();
    /** unused:  final String lang_name = ctx.getTargetLang()   **/ ;
    boolean expects_error = false;
    final int err_cnt = inCtx.getErrorCount();
    if ( callArgs.hasBooleanProperty("error") ) {
      expects_error = true;
    }
    for ( int main_index = 0; main_index < cmds_2.get().children.size(); main_index++) {
      CodeNode ch_4 = cmds_2.get().children.get(main_index);
      final CodeNode fc_16 = ch_4.getFirst();
      final CodeNode nameNode = ch_4.getSecond();
      final CodeNode args = ch_4.getThird();
      if ( callFnName.vref.equals(fc_16.vref) ) {
        /** unused:  final int line_index = callArgs.getLine()   **/ ;
        final int callerArgCnt = (callArgs.children.size()) - 1;
        final int fnArgCnt = args.children.size();
        boolean has_eval_ctx = false;
        boolean is_macro = false;
        if ( nameNode.hasFlag("newcontext") ) {
          ctx = inCtx.fork();
          has_eval_ctx = true;
        }
        if ( callerArgCnt == fnArgCnt ) {
          final CodeNode details_list = ch_4.children.get(3);
          final Optional<CodeNode> langOper = this.findLanguageOper(details_list, ctx);
          if ( !langOper.isPresent() ) {
            continue;
          }
          if ( langOper.get().hasBooleanProperty("macro") ) {
            is_macro = true;
          }
          final RangerArgMatch match = new RangerArgMatch();
          for ( int i_32 = 0; i_32 < args.children.size(); i_32++) {
            CodeNode arg_2 = args.children.get(i_32);
            final CodeNode callArg_2 = callArgs.children.get((i_32 + 1));
            if ( arg_2.hasFlag("define") ) {
              final RangerAppParamDesc p_3 = new RangerAppParamDesc();
              p_3.name = callArg_2.vref;
              p_3.value_type = arg_2.value_type;
              p_3.node = Optional.of(callArg_2);
              p_3.nameNode = Optional.of(callArg_2);
              p_3.is_optional = false;
              ctx.defineVariable(p_3.name, p_3);
              callArg_2.hasParamDesc = true;
              callArg_2.ownParamDesc = Optional.of(p_3);
              callArg_2.paramDesc = Optional.of(p_3);
              if ( (callArg_2.type_name.length()) == 0 ) {
                callArg_2.type_name = arg_2.type_name;
                callArg_2.value_type = arg_2.value_type;
              }
              callArg_2.eval_type = arg_2.value_type;
              callArg_2.eval_type_name = arg_2.type_name;
            }
            if ( arg_2.hasFlag("ignore") ) {
              continue;
            }
            ctx.setInExpr();
            this.WalkNode(callArg_2, ctx, wr);
            ctx.unsetInExpr();
          }
          final boolean all_matched_2 = match.matchArguments(args, callArgs, ctx, 1);
          if ( all_matched_2 ) {
            if ( is_macro ) {
              final CodeNode macroNode_4 = this.buildMacro(langOper, callArgs, ctx);
              int len_4 = callArgs.children.size();
              while (len_4 > 0) {
                callArgs.children.remove(callArgs.children.size() - 1);
                len_4 = len_4 - 1;
              }
              callArgs.children.add(macroNode_4);
              macroNode_4.parent = Optional.of(callArgs);
              this.WalkNode(macroNode_4, ctx, wr);
              match.setRvBasedOn(nameNode, callArgs);
              return true;
            }
            if ( nameNode.hasFlag("moves") ) {
              final Optional<CodeNode> moves_opt = nameNode.getFlag("moves");
              final CodeNode moves = moves_opt.get();
              final Optional<CodeNode> ann_12 = moves.vref_annotation;
              final CodeNode from = ann_12.get().getFirst();
              final CodeNode to = ann_12.get().getSecond();
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
                    ctx.addError(returnedValue, "invalid return value type!!!");
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
                  final Optional<RangerAppParamDesc> pp_14 = returnedValue.paramDesc;
                  if ( pp_14.isPresent() ) {
                    pp_14.get().moveRefTo(callArgs, activeFn, ctx);
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
              CodeNode arg_13 = args.children.get(arg_index);
              if ( arg_13.has_vref_annotation ) {
                final Optional<CodeNode> anns = arg_13.vref_annotation;
                for ( int i_42 = 0; i_42 < anns.get().children.size(); i_42++) {
                  CodeNode ann_25 = anns.get().children.get(i_42);
                  if ( ann_25.vref.equals("mutates") ) {
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
      final int cnt_now_9 = ctx.getErrorCount();
      if ( cnt_now_9 > err_cnt ) {
        ctx.addParserError(callArgs, (("LANGUAGE_PARSER_ERROR: did not expect generated error, err counts : " + err_cnt) + " : ") + cnt_now_9);
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
      final RangerAppEnum e_7 = ee.get();
      if ( e_7.values.containsKey(enumName) ) {
        node.eval_type = 11;
        node.eval_type_name = rootObjName;
        node.int_value = (Optional.ofNullable(e_7.values.get(enumName))).get();
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
    if ( (rootObjName.equals("this")) || ctx.isVarDefined(rootObjName) ) {
      /** unused:  final RangerAppParamDesc vDef2 = ctx.getVariableDef(rootObjName)   **/ ;
      /** unused:  final RangerAppFunctionDesc activeFn_4 = ctx.getCurrentMethod()   **/ ;
      final Optional<RangerAppParamDesc> vDef_2 = this.findParamDesc(node, ctx, wr);
      if ( vDef_2.isPresent() ) {
        node.hasParamDesc = true;
        node.ownParamDesc = vDef_2;
        node.paramDesc = vDef_2;
        vDef_2.get().ref_cnt = 1 + vDef_2.get().ref_cnt;
        final Optional<CodeNode> vNameNode = vDef_2.get().nameNode;
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
    final Optional<RangerAppClassDesc> udesc_4 = ctx.getCurrentClass();
    final RangerAppClassDesc desc_4 = udesc_4.get();
    final Optional<RangerAppFunctionDesc> m_5 = desc_4.constructor_fn;
    final RangerAppWriterContext subCtx_4 = m_5.get().fnCtx.get();
    subCtx_4.is_function = true;
    subCtx_4.currentMethod = m_5;
    subCtx_4.setInMethod();
    for ( int i_36 = 0; i_36 < m_5.get().params.size(); i_36++) {
      RangerAppParamDesc v = m_5.get().params.get(i_36);
      subCtx_4.defineVariable(v.name, v);
    }
    this.WalkNodeChildren(fnBody, subCtx_4, wr);
    subCtx_4.unsetInMethod();
    if ( fnBody.didReturnAtIndex >= 0 ) {
      ctx.addError(node, "constructor should not return any values!");
    }
    for ( int i_40 = 0; i_40 < subCtx_4.localVarNames.size(); i_40++) {
      String n_4 = subCtx_4.localVarNames.get(i_40);
      final Optional<RangerAppParamDesc> p_6 = Optional.ofNullable(subCtx_4.localVariables.get(n_4));
      if ( p_6.get().set_cnt > 0 ) {
        final Optional<CodeNode> defNode = p_6.get().node;
        defNode.get().setFlag("mutable");
        final Optional<CodeNode> nNode = p_6.get().nameNode;
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
    final RangerAppWriterContext root_20 = ctx.getRoot();
    final CodeNode cn_4 = tpl.getSecond();
    final CodeNode newName = node.getSecond();
    final Optional<CodeNode> tplArgs_2 = cn_4.vref_annotation;
    final Optional<CodeNode> givenArgs = newName.vref_annotation;
    final String sign_2 = cn_4.vref + givenArgs.get().getCode();
    if ( root_20.classSignatures.containsKey(sign_2) ) {
      return;
    }
    System.out.println(String.valueOf( "could build generic class... " + cn_4.vref ) );
    final RangerArgMatch match_4 = new RangerArgMatch();
    for ( int i_40 = 0; i_40 < tplArgs_2.get().children.size(); i_40++) {
      CodeNode arg_7 = tplArgs_2.get().children.get(i_40);
      final CodeNode given = givenArgs.get().children.get(i_40);
      System.out.println(String.valueOf( ((" setting " + arg_7.vref) + " => ") + given.vref ) );
      if ( false == match_4.add(arg_7.vref, given.vref, ctx) ) {
        System.out.println(String.valueOf( "set failed!" ) );
      } else {
        System.out.println(String.valueOf( "set OK" ) );
      }
      System.out.println(String.valueOf( " T == " + match_4.getTypeName(arg_7.vref) ) );
    }
    System.out.println(String.valueOf( " T == " + match_4.getTypeName("T") ) );
    final CodeNode newClassNode = tpl.rebuildWithType(match_4, false);
    System.out.println(String.valueOf( "build done" ) );
    System.out.println(String.valueOf( newClassNode.getCode() ) );
    final String sign_8 = cn_4.vref + givenArgs.get().getCode();
    System.out.println(String.valueOf( "signature ==> " + sign_8 ) );
    final CodeNode cName = newClassNode.getSecond();
    final String friendlyName = root_20.createSignature(cn_4.vref, sign_8);
    System.out.println(String.valueOf( "class common name => " + friendlyName ) );
    cName.vref = friendlyName;
    cName.has_vref_annotation = false;
    System.out.println(String.valueOf( newClassNode.getCode() ) );
    this.CollectMethods(newClassNode, ctx, wr);
    this.WalkNode(newClassNode, root_20, wr);
    System.out.println(String.valueOf( "the class collected the methods..." ) );
  }
  
  public void cmdNew( CodeNode node , RangerAppWriterContext ctx , CodeWriter wr ) {
    if ( (node.children.size()) < 3 ) {
      ctx.addError(node, "the new operator expects three arguments");
      return;
    }
    final CodeNode obj = node.getSecond();
    final CodeNode params = node.getThird();
    Optional<RangerAppClassDesc> currC = Optional.empty();
    boolean b_template = false;
    boolean expects_error_4 = false;
    final int err_cnt_4 = ctx.getErrorCount();
    if ( node.hasBooleanProperty("error") ) {
      expects_error_4 = true;
    }
    if ( ctx.hasTemplateNode(obj.vref) ) {
      System.out.println(String.valueOf( " ==> template class" ) );
      b_template = true;
      final CodeNode tpl_4 = ctx.findTemplateNode(obj.vref);
      if ( obj.has_vref_annotation ) {
        System.out.println(String.valueOf( "generic class OK" ) );
        this.buildGenericClass(tpl_4, node, ctx, wr);
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
    for ( int i_42 = 0; i_42 < params.children.size(); i_42++) {
      CodeNode arg_9 = params.children.get(i_42);
      ctx.setInExpr();
      this.WalkNode(arg_9, ctx, wr);
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
      for ( int i_46 = 0; i_46 < fnDescr.get().params.size(); i_46++) {
        RangerAppParamDesc param = fnDescr.get().params.get(i_46);
        boolean has_default = false;
        if ( param.nameNode.get().hasFlag("default") ) {
          has_default = true;
        }
        if ( (params.children.size()) <= i_46 ) {
          if ( has_default ) {
            continue;
          }
          ctx.addError(node, "Argument was not defined");
        }
        final CodeNode argNode_4 = params.children.get(i_46);
        if ( false == this.areEqualTypes((param.nameNode.get()), argNode_4, ctx) ) {
          ctx.addError(node, ("ERROR, invalid argument types for " + currC.get().name) + " constructor ");
        }
        final CodeNode pNode = param.nameNode.get();
        if ( pNode.hasFlag("optional") ) {
          if ( false == argNode_4.hasFlag("optional") ) {
            ctx.addError(node, "new parameter optionality does not match, expected optional parameter" + argNode_4.getCode());
          }
        }
        if ( argNode_4.hasFlag("optional") ) {
          if ( false == pNode.hasFlag("optional") ) {
            ctx.addError(node, "new parameter optionality does not match, expected non-optional, optional given" + argNode_4.getCode());
          }
        }
      }
    }
    if ( expects_error_4 ) {
      final int cnt_now_6 = ctx.getErrorCount();
      if ( cnt_now_6 == err_cnt_4 ) {
        ctx.addParserError(node, (("LANGUAGE_PARSER_ERROR: expected generated error, err counts : " + err_cnt_4) + " : ") + cnt_now_6);
      }
    } else {
      final int cnt_now_13 = ctx.getErrorCount();
      if ( cnt_now_13 > err_cnt_4 ) {
        ctx.addParserError(node, (("LANGUAGE_PARSER_ERROR: did not expect generated error, err counts : " + err_cnt_4) + " : ") + cnt_now_13);
      }
    }
  }
  
  public boolean cmdLocalCall( CodeNode node , RangerAppWriterContext ctx , CodeWriter wr ) {
    final CodeNode fnNode = node.getFirst();
    final Optional<RangerAppClassDesc> udesc_6 = ctx.getCurrentClass();
    final RangerAppClassDesc desc_6 = udesc_6.get();
    boolean expects_error_6 = false;
    final int err_cnt_6 = ctx.getErrorCount();
    if ( node.hasBooleanProperty("error") ) {
      expects_error_6 = true;
    }
    if ( (fnNode.ns.size()) > 1 ) {
      final Optional<RangerAppFunctionDesc> vFnDef = this.findFunctionDesc(fnNode, ctx, wr);
      if ( vFnDef.isPresent() ) {
        vFnDef.get().ref_cnt = vFnDef.get().ref_cnt + 1;
        final RangerAppWriterContext subCtx_6 = ctx.fork();
        node.hasFnCall = true;
        node.fnDesc = vFnDef;
        final RangerAppParamDesc p_8 = new RangerAppParamDesc();
        p_8.name = fnNode.vref;
        p_8.value_type = fnNode.value_type;
        p_8.node = Optional.of(fnNode);
        p_8.nameNode = Optional.of(fnNode);
        p_8.varType = 10;
        subCtx_6.defineVariable(p_8.name, p_8);
        this.WalkNode(fnNode, subCtx_6, wr);
        final CodeNode callParams = node.children.get(1);
        for ( int i_46 = 0; i_46 < callParams.children.size(); i_46++) {
          CodeNode arg_11 = callParams.children.get(i_46);
          ctx.setInExpr();
          this.WalkNode(arg_11, subCtx_6, wr);
          ctx.unsetInExpr();
          final RangerAppParamDesc fnArg = vFnDef.get().params.get(i_46);
          final Optional<RangerAppParamDesc> callArgP = arg_11.paramDesc;
          if ( callArgP.isPresent() ) {
            callArgP.get().moveRefTo(node, fnArg, ctx);
          }
        }
        for ( int i_54 = 0; i_54 < vFnDef.get().params.size(); i_54++) {
          RangerAppParamDesc param_4 = vFnDef.get().params.get(i_54);
          if ( (callParams.children.size()) <= i_54 ) {
            if ( param_4.nameNode.get().hasFlag("default") ) {
              continue;
            }
            ctx.addError(node, "Argument was not defined");
            break;
          }
          final CodeNode argNode_6 = callParams.children.get(i_54);
          if ( false == this.areEqualTypes((param_4.nameNode.get()), argNode_6, ctx) ) {
            ctx.addError(node, "ERROR, invalid argument types for method " + vFnDef.get().name);
          }
          final CodeNode pNode_4 = param_4.nameNode.get();
          if ( pNode_4.hasFlag("optional") ) {
            if ( false == argNode_6.hasFlag("optional") ) {
              ctx.addError(node, "function parameter optionality does not match, consider making parameter optional " + argNode_6.getCode());
            }
          }
          if ( argNode_6.hasFlag("optional") ) {
            if ( false == pNode_4.hasFlag("optional") ) {
              ctx.addError(node, "function parameter optionality does not match, consider unwrapping " + argNode_6.getCode());
            }
          }
        }
        final Optional<CodeNode> nn_3 = vFnDef.get().nameNode;
        node.eval_type = nn_3.get().typeNameAsType(ctx);
        node.eval_type_name = nn_3.get().type_name;
        if ( nn_3.get().hasFlag("optional") ) {
          node.setFlag("optional");
        }
        if ( expects_error_6 ) {
          final int cnt_now_10 = ctx.getErrorCount();
          if ( cnt_now_10 == err_cnt_6 ) {
            ctx.addParserError(node, (("LANGUAGE_PARSER_ERROR: expected generated error, err counts : " + err_cnt_6) + " : ") + cnt_now_10);
          }
        } else {
          final int cnt_now_21 = ctx.getErrorCount();
          if ( cnt_now_21 > err_cnt_6 ) {
            ctx.addParserError(node, (("LANGUAGE_PARSER_ERROR: did not expect generated error, err counts : " + err_cnt_6) + " : ") + cnt_now_21);
          }
        }
        return true;
      } else {
        ctx.addError(node, "Called Object or Property was not defined");
      }
    }
    if ( desc_6.hasMethod(fnNode.vref) ) {
      final Optional<RangerAppFunctionDesc> fnDescr_4 = desc_6.findMethod(fnNode.vref);
      final RangerAppWriterContext subCtx_10 = ctx.fork();
      node.hasFnCall = true;
      node.fnDesc = fnDescr_4;
      final RangerAppParamDesc p_12 = new RangerAppParamDesc();
      p_12.name = fnNode.vref;
      p_12.value_type = fnNode.value_type;
      p_12.node = Optional.of(fnNode);
      p_12.nameNode = Optional.of(fnNode);
      p_12.varType = 10;
      subCtx_10.defineVariable(p_12.name, p_12);
      this.WriteThisVar(fnNode, subCtx_10, wr);
      this.WalkNode(fnNode, subCtx_10, wr);
      for ( int i_53 = 0; i_53 < node.children.size(); i_53++) {
        CodeNode arg_15 = node.children.get(i_53);
        if ( i_53 < 1 ) {
          continue;
        }
        ctx.setInExpr();
        this.WalkNode(arg_15, subCtx_10, wr);
        ctx.unsetInExpr();
      }
      for ( int i_58 = 0; i_58 < fnDescr_4.get().params.size(); i_58++) {
        RangerAppParamDesc param_8 = fnDescr_4.get().params.get(i_58);
        if ( (node.children.size()) <= (i_58 + 1) ) {
          ctx.addError(node, "Argument was not defined");
          break;
        }
        final CodeNode argNode_10 = node.children.get((i_58 + 1));
        if ( false == this.areEqualTypes((param_8.nameNode.get()), argNode_10, ctx) ) {
          ctx.addError(node, (("ERROR, invalid argument types for " + desc_6.name) + " method ") + fnDescr_4.get().name);
        }
      }
      final Optional<CodeNode> nn_8 = fnDescr_4.get().nameNode;
      nn_8.get().defineNodeTypeTo(node, ctx);
      if ( expects_error_6 ) {
        final int cnt_now_17 = ctx.getErrorCount();
        if ( cnt_now_17 == err_cnt_6 ) {
          ctx.addParserError(node, (("LANGUAGE_PARSER_ERROR: expected generated error, err counts : " + err_cnt_6) + " : ") + cnt_now_17);
        }
      } else {
        final int cnt_now_25 = ctx.getErrorCount();
        if ( cnt_now_25 > err_cnt_6 ) {
          ctx.addParserError(node, (("LANGUAGE_PARSER_ERROR: did not expect generated error, err counts : " + err_cnt_6) + " : ") + cnt_now_25);
        }
      }
      return true;
    }
    ctx.addError(node, (("ERROR, could not find class " + desc_6.name) + " method ") + fnNode.vref);
    ctx.addError(node, "definition : " + node.getCode());
    if ( expects_error_6 ) {
      final int cnt_now_23 = ctx.getErrorCount();
      if ( cnt_now_23 == err_cnt_6 ) {
        ctx.addParserError(node, (("LANGUAGE_PARSER_ERROR: expected generated error, err counts : " + err_cnt_6) + " : ") + cnt_now_23);
      }
    } else {
      final int cnt_now_29 = ctx.getErrorCount();
      if ( cnt_now_29 > err_cnt_6 ) {
        ctx.addParserError(node, (("LANGUAGE_PARSER_ERROR: did not expect generated error, err counts : " + err_cnt_6) + " : ") + cnt_now_29);
      }
    }
    return false;
  }
  
  public void cmdReturn( CodeNode node , RangerAppWriterContext ctx , CodeWriter wr ) {
    node.has_operator = true;
    node.op_index = 5;
    System.out.println(String.valueOf( "cmdReturn" ) );
    if ( (node.children.size()) > 1 ) {
      final CodeNode fc_18 = node.getSecond();
      if ( fc_18.vref.equals("_") ) {
      } else {
        ctx.setInExpr();
        this.WalkNode(fc_18, ctx, wr);
        ctx.unsetInExpr();
        /** unused:  final RangerAppFunctionDesc activeFn_6 = ctx.getCurrentMethod()   **/ ;
        if ( fc_18.hasParamDesc ) {
          fc_18.paramDesc.get().return_cnt = 1 + fc_18.paramDesc.get().return_cnt;
          fc_18.paramDesc.get().ref_cnt = 1 + fc_18.paramDesc.get().ref_cnt;
        }
        final RangerAppFunctionDesc currFn = ctx.getCurrentMethod();
        if ( fc_18.hasParamDesc ) {
          System.out.println(String.valueOf( "cmdReturn move-->" ) );
          final Optional<RangerAppParamDesc> pp_6 = fc_18.paramDesc;
          pp_6.get().moveRefTo(node, currFn, ctx);
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
    final CodeNode cn_6 = node.children.get(1);
    final CodeNode cBody = node.children.get(2);
    final RangerAppClassDesc desc_8 = ctx.findClass(cn_6.vref);
    if ( cn_6.has_vref_annotation ) {
      System.out.println(String.valueOf( "--> generic class, not processed" ) );
      return;
    }
    final RangerAppWriterContext subCtx_10 = desc_8.ctx.get();
    subCtx_10.setCurrentClass(desc_8);
    for ( int i_54 = 0; i_54 < desc_8.variables.size(); i_54++) {
      RangerAppParamDesc p_12 = desc_8.variables.get(i_54);
      final Optional<CodeNode> vNode = p_12.node;
      if ( (vNode.get().children.size()) > 2 ) {
        final CodeNode value = vNode.get().children.get(2);
        ctx.setInExpr();
        this.WalkNode(value, ctx, wr);
        ctx.unsetInExpr();
      }
      p_12.is_class_variable = true;
      p_12.nameNode.get().eval_type = p_12.nameNode.get().typeNameAsType(ctx);
      p_12.nameNode.get().eval_type_name = p_12.nameNode.get().type_name;
    }
    for ( int i_58 = 0; i_58 < cBody.children.size(); i_58++) {
      CodeNode fNode = cBody.children.get(i_58);
      if ( fNode.isFirstVref("fn") || fNode.isFirstVref("Constructor") ) {
        this.WalkNode(fNode, subCtx_10, wr);
      }
    }
    for ( int i_61 = 0; i_61 < cBody.children.size(); i_61++) {
      CodeNode fNode_6 = cBody.children.get(i_61);
      if ( fNode_6.isFirstVref("fn") || fNode_6.isFirstVref("PublicMethod") ) {
        this.WalkNode(fNode_6, subCtx_10, wr);
      }
    }
    final RangerAppWriterContext staticCtx = ctx.fork();
    staticCtx.setCurrentClass(desc_8);
    for ( int i_64 = 0; i_64 < cBody.children.size(); i_64++) {
      CodeNode fNode_9 = cBody.children.get(i_64);
      if ( fNode_9.isFirstVref("sfn") || fNode_9.isFirstVref("StaticMethod") ) {
        this.WalkNode(fNode_9, staticCtx, wr);
      }
    }
    node.hasClassDescription = true;
    node.clDesc = Optional.of(desc_8);
    desc_8.classNode = Optional.of(node);
  }
  
  public void EnterMethod( CodeNode node , RangerAppWriterContext ctx , CodeWriter wr ) {
    this.shouldHaveChildCnt(4, node, ctx, "Method expexts four arguments");
    final CodeNode cn_8 = node.children.get(1);
    final CodeNode fnBody_4 = node.children.get(3);
    final Optional<RangerAppClassDesc> udesc_8 = ctx.getCurrentClass();
    final RangerAppClassDesc desc_10 = udesc_8.get();
    final Optional<RangerAppFunctionDesc> um = desc_10.findMethod(cn_8.vref);
    final RangerAppFunctionDesc m_8 = um.get();
    final RangerAppWriterContext subCtx_12 = m_8.fnCtx.get();
    subCtx_12.currentMethod = Optional.of(m_8);
    for ( int i_62 = 0; i_62 < m_8.params.size(); i_62++) {
      RangerAppParamDesc v_4 = m_8.params.get(i_62);
      v_4.nameNode.get().eval_type = v_4.nameNode.get().typeNameAsType(subCtx_12);
      v_4.nameNode.get().eval_type_name = v_4.nameNode.get().type_name;
    }
    subCtx_12.setInMethod();
    this.WalkNodeChildren(fnBody_4, subCtx_12, wr);
    subCtx_12.unsetInMethod();
    if ( fnBody_4.didReturnAtIndex == -1 ) {
      if ( !cn_8.type_name.equals("void") ) {
        ctx.addError(node, "Function does not return any values!");
      }
    }
    for ( int i_66 = 0; i_66 < subCtx_12.localVarNames.size(); i_66++) {
      String n_7 = subCtx_12.localVarNames.get(i_66);
      final Optional<RangerAppParamDesc> p_14 = Optional.ofNullable(subCtx_12.localVariables.get(n_7));
      if ( p_14.get().set_cnt > 0 ) {
        final Optional<CodeNode> defNode_4 = p_14.get().node;
        defNode_4.get().setFlag("mutable");
        final Optional<CodeNode> nNode_4 = p_14.get().nameNode;
        nNode_4.get().setFlag("mutable");
      }
    }
  }
  
  public void EnterStaticMethod( CodeNode node , RangerAppWriterContext ctx , CodeWriter wr ) {
    this.shouldHaveChildCnt(4, node, ctx, "Method expexts four arguments");
    final CodeNode cn_10 = node.children.get(1);
    final CodeNode fnBody_6 = node.children.get(3);
    final Optional<RangerAppClassDesc> udesc_10 = ctx.getCurrentClass();
    final RangerAppClassDesc desc_12 = udesc_10.get();
    final RangerAppWriterContext subCtx_14 = ctx.fork();
    subCtx_14.is_function = true;
    final Optional<RangerAppFunctionDesc> um_4 = desc_12.findStaticMethod(cn_10.vref);
    final RangerAppFunctionDesc m_10 = um_4.get();
    subCtx_14.currentMethod = Optional.of(m_10);
    subCtx_14.in_static_method = true;
    m_10.fnCtx = Optional.of(subCtx_14);
    if ( cn_10.hasFlag("weak") ) {
      m_10.changeStrength(0, 1, node);
    } else {
      m_10.changeStrength(1, 1, node);
    }
    subCtx_14.setInMethod();
    for ( int i_66 = 0; i_66 < m_10.params.size(); i_66++) {
      RangerAppParamDesc v_6 = m_10.params.get(i_66);
      subCtx_14.defineVariable(v_6.name, v_6);
      v_6.nameNode.get().eval_type = v_6.nameNode.get().typeNameAsType(ctx);
      v_6.nameNode.get().eval_type_name = v_6.nameNode.get().type_name;
    }
    this.WalkNodeChildren(fnBody_6, subCtx_14, wr);
    subCtx_14.unsetInMethod();
    subCtx_14.in_static_method = false;
    if ( fnBody_6.didReturnAtIndex == -1 ) {
      if ( !cn_10.type_name.equals("void") ) {
        ctx.addError(node, "Function does not return any values!");
      }
    }
    for ( int i_70 = 0; i_70 < subCtx_14.localVarNames.size(); i_70++) {
      String n_9 = subCtx_14.localVarNames.get(i_70);
      final Optional<RangerAppParamDesc> p_16 = Optional.ofNullable(subCtx_14.localVariables.get(n_9));
      if ( p_16.get().set_cnt > 0 ) {
        final Optional<CodeNode> defNode_6 = p_16.get().node;
        defNode_6.get().setFlag("mutable");
        final Optional<CodeNode> nNode_6 = p_16.get().nameNode;
        nNode_6.get().setFlag("mutable");
      }
    }
  }
  
  public void EnterLambdaMethod( CodeNode node , RangerAppWriterContext ctx , CodeWriter wr ) {
    System.out.println(String.valueOf( "--> found a lambda method" ) );
    node.eval_type = 16;
    final CodeNode args_4 = node.children.get(2);
    final CodeNode body = node.children.get(3);
    final RangerAppWriterContext subCtx_16 = ctx.fork();
    for ( int i_70 = 0; i_70 < args_4.children.size(); i_70++) {
      CodeNode arg_15 = args_4.children.get(i_70);
      final RangerAppParamDesc v_8 = new RangerAppParamDesc();
      v_8.name = arg_15.vref;
      v_8.node = Optional.of(arg_15);
      v_8.nameNode = Optional.of(arg_15);
      subCtx_16.defineVariable(v_8.name, v_8);
    }
    for ( int i_74 = 0; i_74 < body.children.size(); i_74++) {
      CodeNode item_5 = body.children.get(i_74);
      this.WalkNode(item_5, subCtx_16, wr);
    }
    System.out.println(String.valueOf( "--> EXITLAMBDA" ) );
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
      final CodeNode cn_12 = node.children.get(1);
      final RangerAppParamDesc p_18 = new RangerAppParamDesc();
      Optional<CodeNode> defaultArg = Optional.empty();
      if ( (node.children.size()) == 2 ) {
        if ( (cn_12.value_type != 6) && (cn_12.value_type != 7) ) {
          cn_12.setFlag("optional");
        }
      }
      ctx.hadValidType(cn_12);
      cn_12.defineNodeTypeTo(cn_12, ctx);
      if ( (cn_12.vref.length()) == 0 ) {
        ctx.addError(node, "invalid variable definition");
      }
      if ( cn_12.hasFlag("weak") ) {
        p_18.changeStrength(0, 1, node);
      } else {
        p_18.changeStrength(1, 1, node);
      }
      node.hasVarDef = true;
      if ( (node.children.size()) > 2 ) {
        p_18.init_cnt = 1;
        p_18.def_value = Optional.of(node.children.get(2));
        p_18.is_optional = false;
        defaultArg = Optional.of(node.children.get(2));
        ctx.setInExpr();
        this.WalkNode(defaultArg.get(), ctx, wr);
        ctx.unsetInExpr();
        if ( defaultArg.get().hasFlag("optional") ) {
          cn_12.setFlag("optional");
        }
        if ( defaultArg.get().eval_type == 6 ) {
          node.op_index = 1;
        }
        if ( cn_12.value_type == 11 ) {
          cn_12.eval_type_name = defaultArg.get().ns.get(0);
        }
        if ( cn_12.value_type == 12 ) {
          if ( (defaultArg.get().eval_type != 3) && (defaultArg.get().eval_type != 12) ) {
            ctx.addError(defaultArg.get(), "Char should be assigned char or integer value --> " + defaultArg.get().getCode());
          } else {
            defaultArg.get().eval_type = 12;
          }
        }
      } else {
        if ( ((cn_12.value_type != 7) && (cn_12.value_type != 6)) && (false == cn_12.hasFlag("optional")) ) {
          cn_12.setFlag("optional");
        }
      }
      p_18.name = cn_12.vref;
      if ( p_18.value_type == 0 ) {
        if ( (0 == (cn_12.type_name.length())) && (defaultArg.isPresent()) ) {
          p_18.value_type = defaultArg.get().eval_type;
          cn_12.type_name = defaultArg.get().eval_type_name;
          cn_12.eval_type_name = defaultArg.get().eval_type_name;
          cn_12.value_type = defaultArg.get().eval_type;
        }
      } else {
        p_18.value_type = cn_12.value_type;
      }
      p_18.node = Optional.of(node);
      p_18.nameNode = Optional.of(cn_12);
      p_18.varType = 5;
      if ( cn_12.has_vref_annotation ) {
        ctx.log(node, "ann", "At a variable -> Found has_vref_annotation annotated reference ");
        final Optional<CodeNode> ann_17 = cn_12.vref_annotation;
        if ( (ann_17.get().children.size()) > 0 ) {
          final CodeNode fc_20 = ann_17.get().children.get(0);
          ctx.log(node, "ann", (("value of first annotation " + fc_20.vref) + " and variable name ") + cn_12.vref);
        }
      }
      if ( cn_12.has_type_annotation ) {
        ctx.log(node, "ann", "At a variable -> Found annotated reference ");
        final Optional<CodeNode> ann_23 = cn_12.type_annotation;
        if ( (ann_23.get().children.size()) > 0 ) {
          final CodeNode fc_26 = ann_23.get().children.get(0);
          ctx.log(node, "ann", (("value of first annotation " + fc_26.vref) + " and variable name ") + cn_12.vref);
        }
      }
      cn_12.hasParamDesc = true;
      cn_12.ownParamDesc = Optional.of(p_18);
      cn_12.paramDesc = Optional.of(p_18);
      node.hasParamDesc = true;
      node.paramDesc = Optional.of(p_18);
      cn_12.eval_type = cn_12.typeNameAsType(ctx);
      cn_12.eval_type_name = cn_12.type_name;
      if ( (node.children.size()) > 2 ) {
        if ( cn_12.eval_type != defaultArg.get().eval_type ) {
          ctx.addError(node, (("Variable was assigned an incompatible type. Types were " + cn_12.eval_type) + " vs ") + defaultArg.get().eval_type);
        }
      } else {
        p_18.is_optional = true;
      }
      ctx.defineVariable(p_18.name, p_18);
      this.DefineVar(node, ctx, wr);
      if ( (node.children.size()) > 2 ) {
        this.shouldBeEqualTypes(cn_12, p_18.def_value.get(), ctx, "Variable was assigned an incompatible type.");
      }
    } else {
      final CodeNode cn_19 = node.children.get(1);
      cn_19.eval_type = cn_19.typeNameAsType(ctx);
      cn_19.eval_type_name = cn_19.type_name;
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
      for ( int i_74 = 0; i_74 < node.children.size(); i_74++) {
        CodeNode item_7 = node.children.get(i_74);
        item_7.parent = Optional.of(node);
        this.WalkNode(item_7, ctx, wr);
        node.copyEvalResFrom(item_7);
      }
    }
  }
  
  public boolean matchNode( CodeNode node , RangerAppWriterContext ctx , CodeWriter wr ) {
    if ( 0 == (node.children.size()) ) {
      return false;
    }
    final CodeNode fc_24 = node.getFirst();
    stdCommands = Optional.of(ctx.getStdCommands());
    for ( int i_76 = 0; i_76 < stdCommands.get().children.size(); i_76++) {
      CodeNode cmd = stdCommands.get().children.get(i_76);
      final CodeNode cmdName = cmd.getFirst();
      if ( cmdName.vref.equals(fc_24.vref) ) {
        this.stdParamMatch(node, ctx, wr);
        if ( node.parent.isPresent() ) {
          node.parent.get().copyEvalResFrom(node);
        }
        return true;
      }
    }
    return false;
  }
  
  public boolean WalkNode( CodeNode node , RangerAppWriterContext ctx , CodeWriter wr ) {
    /** unused:  final int line_index_4 = node.getLine()   **/ ;
    if ( node.flow_done ) {
      return true;
    }
    node.flow_done = true;
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
    if ( node.isFirstVref("lambda") ) {
      this.EnterLambdaMethod(node, ctx, wr);
      return true;
    }
    if ( node.isFirstVref("Extends") ) {
      return true;
    }
    if ( node.isFirstVref("operators") ) {
      return true;
    }
    if ( node.isFirstVref("systemclass") ) {
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
      final CodeNode fc_26 = node.children.get(0);
      if ( fc_26.value_type == 9 ) {
        boolean was_called = true;
        switch (fc_26.vref ) { 
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
      for ( int i_78 = 0; i_78 < node.children.size(); i_78++) {
        CodeNode item_9 = node.children.get(i_78);
        item_9.parent = Optional.of(node);
        this.WalkNode(item_9, ctx, wr);
        node.copyEvalResFrom(item_9);
      }
      return true;
    }
    ctx.addError(node, "Could not understand this part");
    return true;
  }
  
  public void mergeImports( CodeNode node , RangerAppWriterContext ctx , CodeWriter wr ) {
    if ( node.isFirstVref("Import") ) {
      final CodeNode fNameNode_4 = node.children.get(1);
      final String import_file = fNameNode_4.string_value;
      if ( ctx.already_imported.containsKey(import_file) ) {
        return;
      }
      ctx.already_imported.put(import_file, true);
      final Optional<String> c_6 = Optional.of(readFile("." + "/" + import_file , StandardCharsets.UTF_8 ));
      final SourceCode code = new SourceCode(c_6.get());
      code.filename = import_file;
      final RangerLispParser parser = new RangerLispParser(code);
      parser.parse();
      node.expression = true;
      node.vref = "";
      node.children.remove(node.children.size() - 1);
      node.children.remove(node.children.size() - 1);
      final CodeNode rn_2 = parser.rootNode.get();
      this.mergeImports(rn_2, ctx, wr);
      node.children.add(rn_2);
    } else {
      for ( int i_80 = 0; i_80 < node.children.size(); i_80++) {
        CodeNode item_11 = node.children.get(i_80);
        this.mergeImports(item_11, ctx, wr);
      }
    }
  }
  
  public void CollectMethods( CodeNode node , RangerAppWriterContext ctx , CodeWriter wr ) {
    boolean find_more = true;
    if ( node.isFirstVref("systemclass") ) {
      System.out.println(String.valueOf( "---------- found systemclass ------ " ) );
      final CodeNode nameNode_4 = node.getSecond();
      final CodeNode instances = node.getThird();
      final RangerAppClassDesc new_class = new RangerAppClassDesc();
      new_class.name = nameNode_4.vref;
      new_class.nameNode = Optional.of(nameNode_4);
      ctx.addClass(nameNode_4.vref, new_class);
      new_class.is_system = true;
      for ( int i_82 = 0; i_82 < instances.children.size(); i_82++) {
        CodeNode ch_7 = instances.children.get(i_82);
        final CodeNode langName_4 = ch_7.getFirst();
        final CodeNode langClassName = ch_7.getSecond();
        new_class.systemNames.put(langName_4.vref, langClassName.vref);
      }
      nameNode_4.is_system_class = true;
      nameNode_4.clDesc = Optional.of(new_class);
      return;
    }
    if ( node.isFirstVref("Extends") ) {
      final CodeNode extList = node.children.get(1);
      final Optional<RangerAppClassDesc> currC_4 = ctx.currentClass;
      for ( int ii_7 = 0; ii_7 < extList.children.size(); ii_7++) {
        CodeNode ee_4 = extList.children.get(ii_7);
        currC_4.get().addParentClass(ee_4.vref);
        final RangerAppClassDesc ParentClass = ctx.findClass(ee_4.vref);
        ParentClass.is_inherited = true;
      }
    }
    if ( node.isFirstVref("Constructor") ) {
      final Optional<RangerAppClassDesc> currC_8 = ctx.currentClass;
      final RangerAppWriterContext subCtx_18 = currC_8.get().ctx.get().fork();
      currC_8.get().has_constructor = true;
      currC_8.get().constructor_node = Optional.of(node);
      final RangerAppFunctionDesc m_12 = new RangerAppFunctionDesc();
      m_12.name = "Constructor";
      m_12.node = Optional.of(node);
      m_12.nameNode = Optional.of(node.children.get(0));
      m_12.fnBody = Optional.of(node.children.get(2));
      m_12.fnCtx = Optional.of(subCtx_18);
      final CodeNode args_6 = node.children.get(1);
      for ( int ii_12 = 0; ii_12 < args_6.children.size(); ii_12++) {
        CodeNode arg_17 = args_6.children.get(ii_12);
        final RangerAppParamDesc p_20 = new RangerAppParamDesc();
        p_20.name = arg_17.vref;
        p_20.value_type = arg_17.value_type;
        p_20.node = Optional.of(arg_17);
        p_20.nameNode = Optional.of(arg_17);
        p_20.refType = 1;
        p_20.varType = 4;
        m_12.params.add(p_20);
        arg_17.hasParamDesc = true;
        arg_17.paramDesc = Optional.of(p_20);
        arg_17.eval_type = arg_17.value_type;
        arg_17.eval_type_name = arg_17.type_name;
        subCtx_18.defineVariable(p_20.name, p_20);
      }
      currC_8.get().constructor_fn = Optional.of(m_12);
      find_more = false;
    }
    if ( node.isFirstVref("CreateClass") || node.isFirstVref("class") ) {
      final String s_13 = node.getVRefAt(1);
      final CodeNode classNameNode = node.getSecond();
      if ( classNameNode.has_vref_annotation ) {
        System.out.println(String.valueOf( "%% vref_annotation" ) );
        final Optional<CodeNode> ann_21 = classNameNode.vref_annotation;
        System.out.println(String.valueOf( (classNameNode.vref + " : ") + ann_21.get().getCode() ) );
        ctx.addTemplateClass(classNameNode.vref, node);
        find_more = false;
      } else {
        final RangerAppClassDesc new_class_6 = new RangerAppClassDesc();
        new_class_6.name = s_13;
        final RangerAppWriterContext subCtx_22 = ctx.fork();
        ctx.setCurrentClass(new_class_6);
        subCtx_22.setCurrentClass(new_class_6);
        new_class_6.ctx = Optional.of(subCtx_22);
        new_class_6.nameNode = Optional.of(classNameNode);
        ctx.addClass(s_13, new_class_6);
        new_class_6.classNode = Optional.of(node);
      }
    }
    if ( node.isFirstVref("TemplateClass") ) {
      final String s_18 = node.getVRefAt(1);
      ctx.addTemplateClass(s_18, node);
      find_more = false;
    }
    if ( node.isFirstVref("Extends") ) {
      final CodeNode list_2 = node.children.get(1);
      for ( int i_86 = 0; i_86 < list_2.children.size(); i_86++) {
        CodeNode cname_5 = list_2.children.get(i_86);
        final RangerAppClassDesc extC = ctx.findClass(cname_5.vref);
        for ( int i_95 = 0; i_95 < extC.variables.size(); i_95++) {
          RangerAppParamDesc vv = extC.variables.get(i_95);
          final Optional<RangerAppClassDesc> currC_11 = ctx.currentClass;
          final Optional<RangerAppWriterContext> subCtx_25 = currC_11.get().ctx;
          subCtx_25.get().defineVariable(vv.name, vv);
        }
      }
      find_more = false;
    }
    if ( node.isFirstVref("def") || node.isFirstVref("let") ) {
      final String s_21 = node.getVRefAt(1);
      final CodeNode vDef_5 = node.children.get(1);
      final RangerAppParamDesc p_24 = new RangerAppParamDesc();
      p_24.name = s_21;
      p_24.value_type = vDef_5.value_type;
      p_24.node = Optional.of(node);
      p_24.is_class_variable = true;
      p_24.varType = 8;
      p_24.node = Optional.of(node);
      p_24.nameNode = Optional.of(vDef_5);
      vDef_5.hasParamDesc = true;
      vDef_5.ownParamDesc = Optional.of(p_24);
      vDef_5.paramDesc = Optional.of(p_24);
      node.hasParamDesc = true;
      node.paramDesc = Optional.of(p_24);
      if ( vDef_5.hasFlag("weak") ) {
        p_24.changeStrength(0, 2, p_24.nameNode.get());
      } else {
        p_24.changeStrength(2, 2, p_24.nameNode.get());
      }
      if ( (node.children.size()) > 2 ) {
        p_24.set_cnt = 1;
        p_24.def_value = Optional.of(node.children.get(2));
        p_24.is_optional = false;
      } else {
        p_24.is_optional = true;
        if ( false == ((vDef_5.value_type == 6) || (vDef_5.value_type == 7)) ) {
          vDef_5.setFlag("optional");
        }
      }
      final Optional<RangerAppClassDesc> currC_14 = ctx.currentClass;
      currC_14.get().addVariable(p_24);
      final Optional<RangerAppWriterContext> subCtx_28 = currC_14.get().ctx;
      subCtx_28.get().defineVariable(p_24.name, p_24);
      p_24.is_class_variable = true;
    }
    if ( node.isFirstVref("operators") ) {
      final CodeNode listOf = node.getSecond();
      for ( int i_92 = 0; i_92 < listOf.children.size(); i_92++) {
        CodeNode item_13 = listOf.children.get(i_92);
        ctx.createOperator(item_13);
      }
      find_more = false;
    }
    if ( node.isFirstVref("Import") || node.isFirstVref("import") ) {
      final CodeNode fNameNode_6 = node.children.get(1);
      final String import_file_4 = fNameNode_6.string_value;
      if ( ctx.already_imported.containsKey(import_file_4) ) {
        return;
      } else {
        ctx.already_imported.put(import_file_4, true);
      }
      final Optional<String> c_9 = Optional.of(readFile("." + "/" + import_file_4 , StandardCharsets.UTF_8 ));
      final SourceCode code_4 = new SourceCode(c_9.get());
      code_4.filename = import_file_4;
      final RangerLispParser parser_4 = new RangerLispParser(code_4);
      parser_4.parse();
      final Optional<CodeNode> rnode = parser_4.rootNode;
      this.CollectMethods(rnode.get(), ctx, wr);
      find_more = false;
    }
    if ( node.isFirstVref("StaticMethod") || node.isFirstVref("sfn") ) {
      final String s_24 = node.getVRefAt(1);
      final Optional<RangerAppClassDesc> currC_17 = ctx.currentClass;
      final RangerAppFunctionDesc m_16 = new RangerAppFunctionDesc();
      m_16.name = s_24;
      m_16.node = Optional.of(node);
      m_16.is_static = true;
      m_16.nameNode = Optional.of(node.children.get(1));
      final CodeNode args_10 = node.children.get(2);
      m_16.fnBody = Optional.of(node.children.get(3));
      for ( int ii_15 = 0; ii_15 < args_10.children.size(); ii_15++) {
        CodeNode arg_21 = args_10.children.get(ii_15);
        final RangerAppParamDesc p_27 = new RangerAppParamDesc();
        p_27.name = arg_21.vref;
        p_27.value_type = arg_21.value_type;
        p_27.node = Optional.of(arg_21);
        p_27.nameNode = Optional.of(arg_21);
        p_27.refType = 1;
        p_27.varType = 4;
        m_16.params.add(p_27);
        arg_21.hasParamDesc = true;
        arg_21.paramDesc = Optional.of(p_27);
        arg_21.eval_type = arg_21.value_type;
        arg_21.eval_type_name = arg_21.type_name;
        if ( arg_21.hasFlag("strong") ) {
          p_27.changeStrength(1, 1, p_27.nameNode.get());
        } else {
          arg_21.setFlag("lives");
          p_27.changeStrength(0, 1, p_27.nameNode.get());
        }
      }
      currC_17.get().addStaticMethod(m_16);
      find_more = false;
    }
    if ( node.isFirstVref("PublicMethod") || node.isFirstVref("fn") ) {
      final CodeNode cn_16 = node.getSecond();
      final String s_27 = node.getVRefAt(1);
      final Optional<RangerAppClassDesc> currC_20 = ctx.currentClass;
      final RangerAppFunctionDesc m_19 = new RangerAppFunctionDesc();
      m_19.name = s_27;
      m_19.node = Optional.of(node);
      m_19.nameNode = Optional.of(node.children.get(1));
      if ( node.hasBooleanProperty("strong") ) {
        m_19.refType = 2;
      } else {
        m_19.refType = 1;
      }
      final RangerAppWriterContext subCtx_31 = currC_20.get().ctx.get().fork();
      subCtx_31.is_function = true;
      subCtx_31.currentMethod = Optional.of(m_19);
      m_19.fnCtx = Optional.of(subCtx_31);
      if ( cn_16.hasFlag("weak") ) {
        m_19.changeStrength(0, 1, node);
      } else {
        m_19.changeStrength(1, 1, node);
      }
      final CodeNode args_13 = node.children.get(2);
      m_19.fnBody = Optional.of(node.children.get(3));
      for ( int ii_18 = 0; ii_18 < args_13.children.size(); ii_18++) {
        CodeNode arg_24 = args_13.children.get(ii_18);
        final RangerAppParamDesc p2 = new RangerAppParamDesc();
        p2.name = arg_24.vref;
        p2.value_type = arg_24.value_type;
        p2.node = Optional.of(arg_24);
        p2.nameNode = Optional.of(arg_24);
        p2.refType = 1;
        p2.initRefType = 1;
        p2.debugString = "--> collected ";
        if ( args_13.hasBooleanProperty("strong") ) {
          p2.debugString = "--> collected as STRONG";
          ctx.log(node, "memory5", "strong param should move local ownership to call ***");
          p2.refType = 2;
          p2.initRefType = 2;
        }
        p2.varType = 4;
        m_19.params.add(p2);
        arg_24.hasParamDesc = true;
        arg_24.paramDesc = Optional.of(p2);
        arg_24.eval_type = arg_24.value_type;
        arg_24.eval_type_name = arg_24.type_name;
        if ( arg_24.hasFlag("strong") ) {
          p2.changeStrength(1, 1, p2.nameNode.get());
        } else {
          arg_24.setFlag("lives");
          p2.changeStrength(0, 1, p2.nameNode.get());
        }
        subCtx_31.defineVariable(p2.name, p2);
      }
      currC_20.get().addMethod(m_19);
      find_more = false;
    }
    if ( find_more ) {
      for ( int i_95 = 0; i_95 < node.children.size(); i_95++) {
        CodeNode item_17 = node.children.get(i_95);
        this.CollectMethods(item_17, ctx, wr);
      }
    }
  }
  
  public void FindWeakRefs( CodeNode node , RangerAppWriterContext ctx , CodeWriter wr ) {
    final ArrayList<RangerAppClassDesc> list_5 = ctx.getClasses();
    for ( int i_92 = 0; i_92 < list_5.size(); i_92++) {
      RangerAppClassDesc classDesc = list_5.get(i_92);
      for ( int i2 = 0; i2 < classDesc.variables.size(); i2++) {
        RangerAppParamDesc varD = classDesc.variables.get(i2);
        if ( varD.refType == 1 ) {
          if ( varD.isArray() ) {
            /** unused:  final Optional<CodeNode> nn_8 = varD.nameNode   **/ ;
          }
          if ( varD.isHash() ) {
            /** unused:  final Optional<CodeNode> nn_18 = varD.nameNode   **/ ;
          }
          if ( varD.isObject() ) {
            /** unused:  final Optional<CodeNode> nn_24 = varD.nameNode   **/ ;
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
        final int cnt_4 = obj.ns.size();
        Optional<RangerAppParamDesc> classRefDesc = Optional.empty();
        Optional<RangerAppClassDesc> classDesc_4 = Optional.empty();
        for ( int i_94 = 0; i_94 < obj.ns.size(); i_94++) {
          String strname = obj.ns.get(i_94);
          if ( i_94 == 0 ) {
            if ( strname.equals(this.getThisName()) ) {
              classDesc_4 = ctx.getCurrentClass();
            } else {
              if ( ctx.isDefinedClass(strname) ) {
                classDesc_4 = Optional.of(ctx.findClass(strname));
                continue;
              }
              classRefDesc = Optional.of(ctx.getVariableDef(strname));
              if ( (!classRefDesc.isPresent()) || (!classRefDesc.get().nameNode.isPresent()) ) {
                ctx.addError(obj, "Error, no description for called object: " + strname);
                break;
              }
              classRefDesc.get().ref_cnt = 1 + classRefDesc.get().ref_cnt;
              classDesc_4 = Optional.of(ctx.findClass(classRefDesc.get().nameNode.get().type_name));
              if ( !classDesc_4.isPresent() ) {
                return Optional.ofNullable((varFnDesc.isPresent() ? (RangerAppFunctionDesc)varFnDesc.get() : null ) );
              }
            }
          } else {
            if ( !classDesc_4.isPresent() ) {
              return Optional.ofNullable((varFnDesc.isPresent() ? (RangerAppFunctionDesc)varFnDesc.get() : null ) );
            }
            if ( i_94 < (cnt_4 - 1) ) {
              varDesc = classDesc_4.get().findVariable(strname);
              if ( !varDesc.isPresent() ) {
                ctx.addError(obj, "Error, no description for refenced obj: " + strname);
              }
              final String subClass = varDesc.get().getTypeName();
              classDesc_4 = Optional.of(ctx.findClass(subClass));
              continue;
            }
            if ( classDesc_4.isPresent() ) {
              varFnDesc = classDesc_4.get().findMethod(strname);
              if ( !varFnDesc.isPresent() ) {
                varFnDesc = classDesc_4.get().findStaticMethod(strname);
                if ( !varFnDesc.isPresent() ) {
                  ctx.addError(obj, " function variable not found " + strname);
                }
              }
            }
          }
        }
        return Optional.ofNullable((varFnDesc.isPresent() ? (RangerAppFunctionDesc)varFnDesc.get() : null ) );
      }
      final Optional<RangerAppClassDesc> udesc_12 = ctx.getCurrentClass();
      final RangerAppClassDesc currClass = udesc_12.get();
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
    Optional<RangerAppParamDesc> varDesc_4 = Optional.empty();
    boolean set_nsp = false;
    Optional<RangerAppClassDesc> classDesc_6 = Optional.empty();
    if ( 0 == (obj.nsp.size()) ) {
      set_nsp = true;
    }
    if ( !obj.vref.equals(this.getThisName()) ) {
      if ( (obj.ns.size()) > 1 ) {
        final int cnt_7 = obj.ns.size();
        Optional<RangerAppParamDesc> classRefDesc_4 = Optional.empty();
        for ( int i_96 = 0; i_96 < obj.ns.size(); i_96++) {
          String strname_4 = obj.ns.get(i_96);
          if ( i_96 == 0 ) {
            if ( strname_4.equals(this.getThisName()) ) {
              classDesc_6 = ctx.getCurrentClass();
              if ( set_nsp ) {
                obj.nsp.add(classDesc_6.get());
              }
            } else {
              if ( ctx.isDefinedClass(strname_4) ) {
                classDesc_6 = Optional.of(ctx.findClass(strname_4));
                if ( set_nsp ) {
                  obj.nsp.add(classDesc_6.get());
                }
                continue;
              }
              classRefDesc_4 = Optional.of(ctx.getVariableDef(strname_4));
              if ( !classRefDesc_4.isPresent() ) {
                ctx.addError(obj, "Error, no description for called object: " + strname_4);
                break;
              }
              if ( set_nsp ) {
                obj.nsp.add(classRefDesc_4.get());
              }
              classRefDesc_4.get().ref_cnt = 1 + classRefDesc_4.get().ref_cnt;
              classDesc_6 = Optional.of(ctx.findClass(classRefDesc_4.get().nameNode.get().type_name));
            }
          } else {
            if ( i_96 < (cnt_7 - 1) ) {
              varDesc_4 = classDesc_6.get().findVariable(strname_4);
              if ( !varDesc_4.isPresent() ) {
                ctx.addError(obj, "Error, no description for refenced obj: " + strname_4);
              }
              final String subClass_4 = varDesc_4.get().getTypeName();
              classDesc_6 = Optional.of(ctx.findClass(subClass_4));
              if ( set_nsp ) {
                obj.nsp.add(varDesc_4.get());
              }
              continue;
            }
            if ( classDesc_6.isPresent() ) {
              varDesc_4 = classDesc_6.get().findVariable(strname_4);
              if ( !varDesc_4.isPresent() ) {
                Optional<RangerAppFunctionDesc> classMethod = classDesc_6.get().findMethod(strname_4);
                if ( !classMethod.isPresent() ) {
                  classMethod = classDesc_6.get().findStaticMethod(strname_4);
                  if ( !classMethod.isPresent() ) {
                    ctx.addError(obj, "variable not found " + strname_4);
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
                obj.nsp.add(varDesc_4.get());
              }
            }
          }
        }
        return Optional.ofNullable((varDesc_4.isPresent() ? (RangerAppParamDesc)varDesc_4.get() : null ) );
      }
      varDesc_4 = Optional.of(ctx.getVariableDef(obj.vref));
      if ( varDesc_4.get().nameNode.isPresent() ) {
      } else {
        System.out.println(String.valueOf( "findParamDesc : description not found for " + obj.vref ) );
        if ( varDesc_4.isPresent() ) {
          System.out.println(String.valueOf( "Vardesc was found though..." + varDesc_4.get().name ) );
        }
        ctx.addError(obj, "Error, no description for called object: " + obj.vref);
      }
      return Optional.ofNullable((varDesc_4.isPresent() ? (RangerAppParamDesc)varDesc_4.get() : null ) );
    }
    final Optional<RangerAppClassDesc> cc_2 = ctx.getCurrentClass();
    return Optional.ofNullable((cc_2.isPresent() ? (RangerAppParamDesc)cc_2.get() : null ) );
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
          final RangerAppClassDesc c1_2 = ctx.findClass(n1.eval_type_name);
          final RangerAppClassDesc c2_4 = ctx.findClass(n2.eval_type_name);
          if ( c1_2.isSameOrParentClass(n2.eval_type_name, ctx) ) {
            return true;
          }
          if ( c2_4.isSameOrParentClass(n1.eval_type_name, ctx) ) {
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
        boolean b_ok_4 = false;
        if ( ctx.isEnumDefined(n1.eval_type_name) && (n2.eval_type_name.equals("int")) ) {
          b_ok_4 = true;
        }
        if ( ctx.isEnumDefined(n2.eval_type_name) && (n1.eval_type_name.equals("int")) ) {
          b_ok_4 = true;
        }
        if ( ctx.isDefinedClass(n2.eval_type_name) ) {
          final RangerAppClassDesc cc_5 = ctx.findClass(n2.eval_type_name);
          if ( cc_5.isSameOrParentClass(n1.eval_type_name, ctx) ) {
            b_ok_4 = true;
          }
        }
        if ( (n1.eval_type_name.equals("char")) && (n2.eval_type_name.equals("int")) ) {
          b_ok_4 = true;
        }
        if ( (n1.eval_type_name.equals("int")) && (n2.eval_type_name.equals("char")) ) {
          b_ok_4 = true;
        }
        if ( b_ok_4 == false ) {
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
        boolean b_ok_6 = false;
        if ( ctx.isEnumDefined(n1.eval_type_name) && (type_name.equals("int")) ) {
          b_ok_6 = true;
        }
        if ( ctx.isEnumDefined(type_name) && (n1.eval_type_name.equals("int")) ) {
          b_ok_6 = true;
        }
        if ( (n1.eval_type_name.equals("char")) && (type_name.equals("int")) ) {
          b_ok_6 = true;
        }
        if ( (n1.eval_type_name.equals("int")) && (type_name.equals("char")) ) {
          b_ok_6 = true;
        }
        if ( b_ok_6 == false ) {
          ctx.addError(n1, (((("Type mismatch " + type_name) + " <> ") + n1.eval_type_name) + ". ") + msg);
        }
      }
    }
  }
}
