import java.util.Optional;
import java.util.*;
import java.io.*;

class LiveCompiler { 
  public Optional<RangerGenericClassWriter> langWriter = Optional.empty();
  public HashMap<String,Boolean> hasCreatedPolyfill = new HashMap<String,Boolean>()     /** note: unused */;
  public Optional<CodeNode> lastProcessedNode = Optional.empty();
  
  public void initWriter( RangerAppWriterContext ctx ) {
    if ( langWriter.isPresent() ) {
      return;
    }
    final RangerAppWriterContext root_21 = ctx.getRoot();
    switch (root_21.targetLangName ) { 
      case "go" : 
        langWriter = Optional.of(new RangerGolangClassWriter());
        break;
      case "scala" : 
        langWriter = Optional.of(new RangerScalaClassWriter());
        break;
      case "java7" : 
        langWriter = Optional.of(new RangerJava7ClassWriter());
        break;
      case "swift3" : 
        langWriter = Optional.of(new RangerSwift3ClassWriter());
        break;
      case "kotlin" : 
        langWriter = Optional.of(new RangerKotlinClassWriter());
        break;
      case "php" : 
        langWriter = Optional.of(new RangerPHPClassWriter());
        break;
      case "cpp" : 
        langWriter = Optional.of(new RangerCppClassWriter());
        break;
      case "csharp" : 
        langWriter = Optional.of(new RangerCSharpClassWriter());
        break;
      case "es6" : 
        langWriter = Optional.of(new RangerJavaScriptClassWriter());
        break;
      case "ranger" : 
        langWriter = Optional.of(new RangerRangerClassWriter());
        break;
    }
    if ( langWriter.isPresent() ) {
      langWriter.get().compiler = Optional.of(this);
    } else {
      langWriter = Optional.of(new RangerGenericClassWriter());
      langWriter.get().compiler = Optional.of(this);
    }
  }
  
  public String EncodeString( CodeNode node , RangerAppWriterContext ctx , CodeWriter wr ) {
    /** unused:  final String encoded_str_6 = ""   **/ ;
    final int str_length_4 = node.string_value.length();
    String encoded_str_12 = "";
    int ii_13 = 0;
    while (ii_13 < str_length_4) {
      final int ch_6 = (int)node.string_value.charAt(ii_13);
      final int cc_21 = ch_6;
      switch (cc_21 ) { 
        case 8 : 
          encoded_str_12 = (encoded_str_12 + ((new String( Character.toChars(92))))) + ((new String( Character.toChars(98))));
          break;
        case 9 : 
          encoded_str_12 = (encoded_str_12 + ((new String( Character.toChars(92))))) + ((new String( Character.toChars(116))));
          break;
        case 10 : 
          encoded_str_12 = (encoded_str_12 + ((new String( Character.toChars(92))))) + ((new String( Character.toChars(110))));
          break;
        case 12 : 
          encoded_str_12 = (encoded_str_12 + ((new String( Character.toChars(92))))) + ((new String( Character.toChars(102))));
          break;
        case 13 : 
          encoded_str_12 = (encoded_str_12 + ((new String( Character.toChars(92))))) + ((new String( Character.toChars(114))));
          break;
        case 34 : 
          encoded_str_12 = (encoded_str_12 + ((new String( Character.toChars(92))))) + ((new String( Character.toChars(34))));
          break;
        case 92 : 
          encoded_str_12 = (encoded_str_12 + ((new String( Character.toChars(92))))) + ((new String( Character.toChars(92))));
          break;
        default: 
          encoded_str_12 = encoded_str_12 + ((new String( Character.toChars(ch_6))));
          break;
      }
      ii_13 = ii_13 + 1;
    }
    return encoded_str_12;
  }
  
  public void WriteScalarValue( CodeNode node , RangerAppWriterContext ctx , CodeWriter wr ) {
    langWriter.get().WriteScalarValue(node, ctx, wr);
  }
  
  public String adjustType( String tn ) {
    if ( tn.equals("this") ) {
      return "self";
    }
    return tn;
  }
  
  public void WriteVRef( CodeNode node , RangerAppWriterContext ctx , CodeWriter wr ) {
    langWriter.get().WriteVRef(node, ctx, wr);
  }
  
  public void writeTypeDef( CodeNode node , RangerAppWriterContext ctx , CodeWriter wr ) {
    langWriter.get().writeTypeDef(node, ctx, wr);
  }
  
  public void CreateLambda( CodeNode node , RangerAppWriterContext ctx , CodeWriter wr ) {
    final CodeNode args_6 = node.children.get(2);
    final CodeNode body_2 = node.children.get(3);
    wr.out("(", false);
    for ( int i_198 = 0; i_198 < args_6.children.size(); i_198++) {
      CodeNode arg_37 = args_6.children.get(i_198);
      if ( i_198 > 0 ) {
        wr.out(", ", false);
      }
      wr.out(arg_37.vref, false);
    }
    wr.out(")", false);
    wr.out(" => { ", true);
    wr.indent(1);
    wr.out("// body ", true);
    for ( int i_203 = 0; i_203 < body_2.children.size(); i_203++) {
      CodeNode item_9 = body_2.children.get(i_203);
      this.WalkNode(item_9, ctx, wr);
    }
    wr.newline();
    wr.indent(-1);
    wr.out("}", true);
  }
  
  public String getTypeString( String str , RangerAppWriterContext ctx ) {
    return "";
  }
  
  public void findOpCode( CodeNode op , CodeNode node , RangerAppWriterContext ctx , CodeWriter wr ) {
    final CodeNode fnName_2 = op.children.get(1);
    final CodeNode args_9 = op.children.get(2);
    if ( (op.children.size()) > 3 ) {
      final CodeNode details = op.children.get(3);
      for ( int i_203 = 0; i_203 < details.children.size(); i_203++) {
        CodeNode det_2 = details.children.get(i_203);
        if ( (det_2.children.size()) > 0 ) {
          final CodeNode fc_42 = det_2.children.get(0);
          if ( fc_42.vref.equals("code") ) {
            final RangerArgMatch match_4 = new RangerArgMatch();
            final boolean all_matched_3 = match_4.matchArguments(args_9, node, ctx, 1);
            if ( all_matched_3 == false ) {
              return;
            }
            final CodeNode origCode = det_2.children.get(1);
            final CodeNode theCode = origCode.rebuildWithType(match_4, true);
            final RangerAppWriterContext appCtx = ctx.getRoot();
            final String stdFnName = appCtx.createSignature(fnName_2.vref, (fnName_2.vref + theCode.getCode()));
            final RangerAppClassDesc stdClass = ctx.findClass("RangerStaticMethods");
            final RangerAppWriterContext runCtx = appCtx.fork();
            boolean b_failed = false;
            if ( false == (stdClass.defined_static_methods.containsKey(stdFnName)) ) {
              runCtx.setInMethod();
              final RangerAppFunctionDesc m_11 = new RangerAppFunctionDesc();
              m_11.name = stdFnName;
              m_11.node = Optional.of(op);
              m_11.is_static = true;
              m_11.nameNode = Optional.of(fnName_2);
              m_11.fnBody = Optional.of(theCode);
              for ( int ii_16 = 0; ii_16 < args_9.children.size(); ii_16++) {
                CodeNode arg_40 = args_9.children.get(ii_16);
                final RangerAppParamDesc p_58 = new RangerAppParamDesc();
                p_58.name = arg_40.vref;
                p_58.value_type = arg_40.value_type;
                p_58.node = Optional.of(arg_40);
                p_58.nameNode = Optional.of(arg_40);
                p_58.refType = 1;
                p_58.varType = 4;
                m_11.params.add(p_58);
                arg_40.hasParamDesc = true;
                arg_40.paramDesc = Optional.of(p_58);
                arg_40.eval_type = arg_40.value_type;
                arg_40.eval_type_name = arg_40.type_name;
                runCtx.defineVariable(p_58.name, p_58);
              }
              stdClass.addStaticMethod(m_11);
              final int err_cnt_4 = ctx.compilerErrors.size();
              final RangerFlowParser flowParser = new RangerFlowParser();
              final CodeWriter TmpWr = new CodeWriter();
              flowParser.WalkNode(theCode, runCtx, TmpWr);
              runCtx.unsetInMethod();
              final int err_delta = (ctx.compilerErrors.size()) - err_cnt_4;
              if ( err_delta > 0 ) {
                b_failed = true;
                System.out.println(String.valueOf( "Had following compiler errors:" ) );
                for ( int i_217 = 0; i_217 < ctx.compilerErrors.size(); i_217++) {
                  RangerCompilerMessage e_21 = ctx.compilerErrors.get(i_217);
                  if ( i_217 < err_cnt_4 ) {
                    continue;
                  }
                  final int line_index_3 = e_21.node.get().getLine();
                  System.out.println(String.valueOf( (e_21.node.get().getFilename() + " Line: ") + line_index_3 ) );
                  System.out.println(String.valueOf( e_21.description ) );
                  System.out.println(String.valueOf( e_21.node.get().getLineString(line_index_3) ) );
                }
              } else {
                System.out.println(String.valueOf( "no errors found" ) );
              }
            }
            if ( b_failed ) {
              wr.out("/* custom operator compilation failed */ ", false);
            } else {
              wr.out(("RangerStaticMethods." + stdFnName) + "(", false);
              for ( int i_225 = 0; i_225 < node.children.size(); i_225++) {
                CodeNode cc_24 = node.children.get(i_225);
                if ( i_225 == 0 ) {
                  continue;
                }
                if ( i_225 > 1 ) {
                  wr.out(", ", false);
                }
                this.WalkNode(cc_24, ctx, wr);
              }
              wr.out(")", false);
            }
            return;
          }
        }
      }
    }
  }
  
  public Optional<CodeNode> findOpTemplate( CodeNode op , CodeNode node , RangerAppWriterContext ctx , CodeWriter wr ) {
    /** unused:  final CodeNode fnName_5 = op.children.get(1)   **/ ;
    /** unused:  final RangerAppWriterContext root_24 = ctx.getRoot()   **/ ;
    final String langName_3 = ctx.getTargetLang();
    if ( (op.children.size()) > 3 ) {
      final CodeNode details_4 = op.children.get(3);
      for ( int i_209 = 0; i_209 < details_4.children.size(); i_209++) {
        CodeNode det_5 = details_4.children.get(i_209);
        if ( (det_5.children.size()) > 0 ) {
          final CodeNode fc_45 = det_5.children.get(0);
          if ( fc_45.vref.equals("templates") ) {
            final CodeNode tplList_2 = det_5.children.get(1);
            for ( int i_221 = 0; i_221 < tplList_2.children.size(); i_221++) {
              CodeNode tpl_3 = tplList_2.children.get(i_221);
              final CodeNode tplName_2 = tpl_3.getFirst();
              Optional<CodeNode> tplImpl_2 = Optional.empty();
              tplImpl_2 = Optional.of(tpl_3.getSecond());
              if ( (!tplName_2.vref.equals("*")) && (!tplName_2.vref.equals(langName_3)) ) {
                continue;
              }
              if ( tplName_2.hasFlag("mutable") ) {
                if ( false == node.hasFlag("mutable") ) {
                  continue;
                }
              }
              return Optional.ofNullable((tplImpl_2.isPresent() ? (CodeNode)tplImpl_2.get() : null ) );
            }
          }
        }
      }
    }
    final Optional<CodeNode> non_2 = Optional.empty();
    return Optional.ofNullable((non_2.isPresent() ? (CodeNode)non_2.get() : null ) );
  }
  
  public boolean localCall( CodeNode node , RangerAppWriterContext ctx , CodeWriter wr ) {
    if ( node.hasFnCall ) {
      if ( langWriter.isPresent() ) {
        langWriter.get().writeFnCall(node, ctx, wr);
        return true;
      }
    }
    if ( node.hasNewOper ) {
      langWriter.get().writeNewCall(node, ctx, wr);
      return true;
    }
    if ( node.hasVarDef ) {
      langWriter.get().writeVarDef(node, ctx, wr);
      return true;
    }
    if ( node.hasClassDescription ) {
      langWriter.get().writeClass(node, ctx, wr);
      return true;
    }
    return false;
  }
  
  public void WalkNode( CodeNode node , RangerAppWriterContext ctx , CodeWriter wr ) {
    this.initWriter(ctx);
    if ( node.isPrimitive() ) {
      this.WriteScalarValue(node, ctx, wr);
      return;
    }
    this.lastProcessedNode = Optional.of(node);
    if ( node.value_type == 9 ) {
      this.WriteVRef(node, ctx, wr);
      return;
    }
    if ( node.value_type == 16 ) {
      this.WriteVRef(node, ctx, wr);
      return;
    }
    if ( (node.children.size()) > 0 ) {
      if ( node.has_operator ) {
        final CodeNode op = ctx.findOperator(node);
        /** unused:  final CodeNode fc_47 = op.getFirst()   **/ ;
        final Optional<CodeNode> tplImpl_5 = this.findOpTemplate(op, node, ctx, wr);
        RangerAppWriterContext evalCtx = ctx;
        if ( node.evalCtx.isPresent() ) {
          evalCtx = node.evalCtx.get();
        }
        if ( tplImpl_5.isPresent() ) {
          final CodeNode opName = op.getSecond();
          if ( opName.hasFlag("returns") ) {
            langWriter.get().release_local_vars(node, evalCtx, wr);
          }
          this.walkCommandList(tplImpl_5.get(), node, evalCtx, wr);
        } else {
          this.findOpCode(op, node, evalCtx, wr);
        }
        return;
      }
      if ( node.isFirstVref("lambda") ) {
        this.CreateLambda(node, ctx, wr);
        return;
      }
      if ( (node.children.size()) > 1 ) {
        if ( this.localCall(node, ctx, wr) ) {
          return;
        }
      }
      /** unused:  final CodeNode fc_53 = node.getFirst()   **/ ;
    }
    if ( node.expression ) {
      for ( int i_213 = 0; i_213 < node.children.size(); i_213++) {
        CodeNode item_12 = node.children.get(i_213);
        if ( (node.didReturnAtIndex >= 0) && (node.didReturnAtIndex < i_213) ) {
          break;
        }
        this.WalkNode(item_12, ctx, wr);
      }
    } else {
    }
  }
  
  public void walkCommandList( CodeNode cmd , CodeNode node , RangerAppWriterContext ctx , CodeWriter wr ) {
    if ( ctx.expressionLevel() == 0 ) {
      wr.newline();
    }
    if ( ctx.expressionLevel() > 1 ) {
      wr.out("(", false);
    }
    for ( int i_215 = 0; i_215 < cmd.children.size(); i_215++) {
      CodeNode c_12 = cmd.children.get(i_215);
      this.walkCommand(c_12, node, ctx, wr);
    }
    if ( ctx.expressionLevel() > 1 ) {
      wr.out(")", false);
    }
    if ( ctx.expressionLevel() == 0 ) {
      wr.newline();
    }
  }
  
  public void walkCommand( CodeNode cmd , CodeNode node , RangerAppWriterContext ctx , CodeWriter wr ) {
    if ( cmd.expression ) {
      final CodeNode cmdE = cmd.getFirst();
      final CodeNode cmdArg = cmd.getSecond();
      switch (cmdE.vref ) { 
        case "str" : 
          final int idx_8 = cmdArg.int_value;
          if ( (node.children.size()) > idx_8 ) {
            final CodeNode arg_42 = node.children.get(idx_8);
            wr.out(arg_42.string_value, false);
          }
          break;
        case "block" : 
          final int idx_17 = cmdArg.int_value;
          if ( (node.children.size()) > idx_17 ) {
            final CodeNode arg_50 = node.children.get(idx_17);
            this.WalkNode(arg_50, ctx, wr);
          }
          break;
        case "varname" : 
          if ( ctx.isVarDefined(cmdArg.vref) ) {
            final RangerAppParamDesc p_61 = ctx.getVariableDef(cmdArg.vref);
            wr.out(p_61.compiledName, false);
          }
          break;
        case "defvar" : 
          final RangerAppParamDesc p_69 = new RangerAppParamDesc();
          p_69.name = cmdArg.vref;
          p_69.value_type = cmdArg.value_type;
          p_69.node = Optional.of(cmdArg);
          p_69.nameNode = Optional.of(cmdArg);
          p_69.is_optional = false;
          ctx.defineVariable(p_69.name, p_69);
          break;
        case "cc" : 
          final int idx_22 = cmdArg.int_value;
          if ( (node.children.size()) > idx_22 ) {
            final CodeNode arg_55 = node.children.get(idx_22);
            final byte cc_26 = ((arg_55.string_value.getBytes())[0]);
            wr.out("" + (cc_26), false);
          }
          break;
        case "java_case" : 
          final int idx_27 = cmdArg.int_value;
          if ( (node.children.size()) > idx_27 ) {
            final CodeNode arg_60 = node.children.get(idx_27);
            this.WalkNode(arg_60, ctx, wr);
            if ( arg_60.didReturnAtIndex < 0 ) {
              wr.newline();
              wr.out("break;", true);
            }
          }
          break;
        case "e" : 
          final int idx_32 = cmdArg.int_value;
          if ( (node.children.size()) > idx_32 ) {
            final CodeNode arg_65 = node.children.get(idx_32);
            ctx.setInExpr();
            this.WalkNode(arg_65, ctx, wr);
            ctx.unsetInExpr();
          }
          break;
        case "goset" : 
          final int idx_37 = cmdArg.int_value;
          if ( (node.children.size()) > idx_37 ) {
            final CodeNode arg_70 = node.children.get(idx_37);
            ctx.setInExpr();
            langWriter.get().WriteSetterVRef(arg_70, ctx, wr);
            ctx.unsetInExpr();
          }
          break;
        case "pe" : 
          final int idx_42 = cmdArg.int_value;
          if ( (node.children.size()) > idx_42 ) {
            final CodeNode arg_75 = node.children.get(idx_42);
            this.WalkNode(arg_75, ctx, wr);
          }
          break;
        case "ptr" : 
          final int idx_47 = cmdArg.int_value;
          if ( (node.children.size()) > idx_47 ) {
            final CodeNode arg_80 = node.children.get(idx_47);
            if ( arg_80.hasParamDesc ) {
              if ( arg_80.paramDesc.get().nameNode.get().isAPrimitiveType() == false ) {
                wr.out("*", false);
              }
            } else {
              if ( arg_80.isAPrimitiveType() == false ) {
                wr.out("*", false);
              }
            }
          }
          break;
        case "ptrsrc" : 
          final int idx_52 = cmdArg.int_value;
          if ( (node.children.size()) > idx_52 ) {
            final CodeNode arg_85 = node.children.get(idx_52);
            if ( (arg_85.isPrimitiveType() == false) && (arg_85.isPrimitive() == false) ) {
              wr.out("&", false);
            }
          }
          break;
        case "nameof" : 
          final int idx_57 = cmdArg.int_value;
          if ( (node.children.size()) > idx_57 ) {
            final CodeNode arg_90 = node.children.get(idx_57);
            wr.out(arg_90.vref, false);
          }
          break;
        case "list" : 
          final int idx_62 = cmdArg.int_value;
          if ( (node.children.size()) > idx_62 ) {
            final CodeNode arg_95 = node.children.get(idx_62);
            for ( int i_217 = 0; i_217 < arg_95.children.size(); i_217++) {
              CodeNode ch_9 = arg_95.children.get(i_217);
              if ( i_217 > 0 ) {
                wr.out(" ", false);
              }
              ctx.setInExpr();
              this.WalkNode(ch_9, ctx, wr);
              ctx.unsetInExpr();
            }
          }
          break;
        case "comma" : 
          final int idx_67 = cmdArg.int_value;
          if ( (node.children.size()) > idx_67 ) {
            final CodeNode arg_100 = node.children.get(idx_67);
            for ( int i_225 = 0; i_225 < arg_100.children.size(); i_225++) {
              CodeNode ch_17 = arg_100.children.get(i_225);
              if ( i_225 > 0 ) {
                wr.out(",", false);
              }
              ctx.setInExpr();
              this.WalkNode(ch_17, ctx, wr);
              ctx.unsetInExpr();
            }
          }
          break;
        case "swift_rc" : 
          final int idx_72 = cmdArg.int_value;
          if ( (node.children.size()) > idx_72 ) {
            final CodeNode arg_105 = node.children.get(idx_72);
            if ( arg_105.hasParamDesc ) {
              if ( arg_105.paramDesc.get().ref_cnt == 0 ) {
                wr.out("_", false);
              } else {
                wr.out(arg_105.vref, false);
              }
            } else {
              wr.out(arg_105.vref, false);
            }
          }
          break;
        case "r_ktype" : 
          final int idx_77 = cmdArg.int_value;
          if ( (node.children.size()) > idx_77 ) {
            final CodeNode arg_110 = node.children.get(idx_77);
            if ( arg_110.hasParamDesc ) {
              final String ss = langWriter.get().getObjectTypeString(arg_110.paramDesc.get().nameNode.get().key_type, ctx);
              wr.out(ss, false);
            } else {
              final String ss_17 = langWriter.get().getObjectTypeString(arg_110.key_type, ctx);
              wr.out(ss_17, false);
            }
          }
          break;
        case "r_atype" : 
          final int idx_82 = cmdArg.int_value;
          if ( (node.children.size()) > idx_82 ) {
            final CodeNode arg_115 = node.children.get(idx_82);
            if ( arg_115.hasParamDesc ) {
              final String ss_15 = langWriter.get().getObjectTypeString(arg_115.paramDesc.get().nameNode.get().array_type, ctx);
              wr.out(ss_15, false);
            } else {
              final String ss_27 = langWriter.get().getObjectTypeString(arg_115.array_type, ctx);
              wr.out(ss_27, false);
            }
          }
          break;
        case "custom" : 
          langWriter.get().CustomOperator(node, ctx, wr);
          break;
        case "arraytype" : 
          final int idx_87 = cmdArg.int_value;
          if ( (node.children.size()) > idx_87 ) {
            final CodeNode arg_120 = node.children.get(idx_87);
            if ( arg_120.hasParamDesc ) {
              langWriter.get().writeArrayTypeDef(arg_120.paramDesc.get().nameNode.get(), ctx, wr);
            } else {
              langWriter.get().writeArrayTypeDef(arg_120, ctx, wr);
            }
          }
          break;
        case "rawtype" : 
          final int idx_92 = cmdArg.int_value;
          if ( (node.children.size()) > idx_92 ) {
            final CodeNode arg_125 = node.children.get(idx_92);
            if ( arg_125.hasParamDesc ) {
              langWriter.get().writeRawTypeDef(arg_125.paramDesc.get().nameNode.get(), ctx, wr);
            } else {
              langWriter.get().writeRawTypeDef(arg_125, ctx, wr);
            }
          }
          break;
        case "macro" : 
          final CodeWriter p_write = wr.getTag("utilities");
          final CodeWriter newWriter = new CodeWriter();
          final RangerAppWriterContext testCtx = ctx.fork();
          testCtx.restartExpressionLevel();
          this.walkCommandList(cmdArg, node, testCtx, newWriter);
          final String p_str = newWriter.getCode();
          /** unused:  final RangerAppWriterContext root_26 = ctx.getRoot()   **/ ;
          if ( (p_write.compiledTags.containsKey(p_str)) == false ) {
            p_write.compiledTags.put(p_str, true);
            final RangerAppWriterContext mCtx = ctx.fork();
            mCtx.restartExpressionLevel();
            this.walkCommandList(cmdArg, node, mCtx, p_write);
          }
          break;
        case "create_polyfill" : 
          final CodeWriter p_write_10 = wr.getTag("utilities");
          final String p_str_10 = cmdArg.string_value;
          if ( (p_write_10.compiledTags.containsKey(p_str_10)) == false ) {
            p_write_10.raw(p_str_10, true);
            p_write_10.compiledTags.put(p_str_10, true);
          }
          break;
        case "typeof" : 
          final int idx_97 = cmdArg.int_value;
          if ( (node.children.size()) >= idx_97 ) {
            final CodeNode arg_130 = node.children.get(idx_97);
            if ( arg_130.hasParamDesc ) {
              this.writeTypeDef(arg_130.paramDesc.get().nameNode.get(), ctx, wr);
            } else {
              this.writeTypeDef(arg_130, ctx, wr);
            }
          }
          break;
        case "imp" : 
          langWriter.get().import_lib(cmdArg.string_value, ctx, wr);
          break;
        case "atype" : 
          final int idx_102 = cmdArg.int_value;
          if ( (node.children.size()) >= idx_102 ) {
            final CodeNode arg_135 = node.children.get(idx_102);
            final Optional<RangerAppParamDesc> p_74 = this.findParamDesc(arg_135, ctx, wr);
            final CodeNode nameNode_3 = p_74.get().nameNode.get();
            final String tn_3 = nameNode_3.array_type;
            wr.out(this.getTypeString(tn_3, ctx), false);
          }
          break;
      }
    } else {
      if ( cmd.value_type == 9 ) {
        switch (cmd.vref ) { 
          case "nl" : 
            wr.newline();
            break;
          case "I" : 
            wr.indent(1);
            break;
          case "i" : 
            wr.indent(-1);
            break;
          case "op" : 
            final CodeNode fc_51 = node.getFirst();
            wr.out(fc_51.vref, false);
            break;
        }
      } else {
        if ( cmd.value_type == 4 ) {
          wr.out(cmd.string_value, false);
        }
      }
    }
  }
  
  public void compile( CodeNode node , RangerAppWriterContext ctx , CodeWriter wr ) {
  }
  
  public Optional<RangerAppParamDesc> findParamDesc( CodeNode obj , RangerAppWriterContext ctx , CodeWriter wr ) {
    Optional<RangerAppParamDesc> varDesc_3 = Optional.empty();
    boolean set_nsp_2 = false;
    Optional<RangerAppClassDesc> classDesc_4 = Optional.empty();
    if ( 0 == (obj.nsp.size()) ) {
      set_nsp_2 = true;
    }
    if ( !obj.vref.equals("this") ) {
      if ( (obj.ns.size()) > 1 ) {
        final int cnt_6 = obj.ns.size();
        Optional<RangerAppParamDesc> classRefDesc_3 = Optional.empty();
        for ( int i_221 = 0; i_221 < obj.ns.size(); i_221++) {
          String strname_3 = obj.ns.get(i_221);
          if ( i_221 == 0 ) {
            if ( strname_3.equals("this") ) {
              classDesc_4 = ctx.getCurrentClass();
              if ( set_nsp_2 ) {
                obj.nsp.add(classDesc_4.get());
              }
            } else {
              if ( ctx.isDefinedClass(strname_3) ) {
                classDesc_4 = Optional.of(ctx.findClass(strname_3));
                if ( set_nsp_2 ) {
                  obj.nsp.add(classDesc_4.get());
                }
                continue;
              }
              classRefDesc_3 = Optional.of(ctx.getVariableDef(strname_3));
              if ( !classRefDesc_3.isPresent() ) {
                ctx.addError(obj, "Error, no description for called object: " + strname_3);
                break;
              }
              if ( set_nsp_2 ) {
                obj.nsp.add(classRefDesc_3.get());
              }
              classRefDesc_3.get().ref_cnt = 1 + classRefDesc_3.get().ref_cnt;
              classDesc_4 = Optional.of(ctx.findClass(classRefDesc_3.get().nameNode.get().type_name));
            }
          } else {
            if ( i_221 < (cnt_6 - 1) ) {
              varDesc_3 = classDesc_4.get().findVariable(strname_3);
              if ( !varDesc_3.isPresent() ) {
                ctx.addError(obj, "Error, no description for refenced obj: " + strname_3);
              }
              final String subClass_3 = varDesc_3.get().getTypeName();
              classDesc_4 = Optional.of(ctx.findClass(subClass_3));
              if ( set_nsp_2 ) {
                obj.nsp.add(varDesc_3.get());
              }
              continue;
            }
            if ( classDesc_4.isPresent() ) {
              varDesc_3 = classDesc_4.get().findVariable(strname_3);
              if ( !varDesc_3.isPresent() ) {
                Optional<RangerAppFunctionDesc> classMethod_2 = classDesc_4.get().findMethod(strname_3);
                if ( !classMethod_2.isPresent() ) {
                  classMethod_2 = classDesc_4.get().findStaticMethod(strname_3);
                  if ( !classMethod_2.isPresent() ) {
                    ctx.addError(obj, "variable not found " + strname_3);
                  }
                }
                if ( classMethod_2.isPresent() ) {
                  if ( set_nsp_2 ) {
                    obj.nsp.add(classMethod_2.get());
                  }
                  return Optional.ofNullable((classMethod_2.isPresent() ? (RangerAppParamDesc)classMethod_2.get() : null ) );
                }
              }
              if ( set_nsp_2 ) {
                obj.nsp.add(varDesc_3.get());
              }
            }
          }
        }
        return Optional.ofNullable((varDesc_3.isPresent() ? (RangerAppParamDesc)varDesc_3.get() : null ) );
      }
      varDesc_3 = Optional.of(ctx.getVariableDef(obj.vref));
      if ( varDesc_3.get().nameNode.isPresent() ) {
      } else {
        System.out.println(String.valueOf( "findParamDesc : description not found for " + obj.vref ) );
        if ( varDesc_3.isPresent() ) {
          System.out.println(String.valueOf( "Vardesc was found though..." + varDesc_3.get().name ) );
        }
        ctx.addError(obj, "Error, no description for called object: " + obj.vref);
      }
      return Optional.ofNullable((varDesc_3.isPresent() ? (RangerAppParamDesc)varDesc_3.get() : null ) );
    }
    final Optional<RangerAppClassDesc> cc_28 = ctx.getCurrentClass();
    return Optional.ofNullable((cc_28.isPresent() ? (RangerAppParamDesc)cc_28.get() : null ) );
  }
}
