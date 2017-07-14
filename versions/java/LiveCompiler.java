import java.util.Optional;
import java.util.*;
import java.io.*;

class LiveCompiler { 
  public Optional<RangerGenericClassWriter> langWriter = Optional.empty();
  public HashMap<String,Boolean> hasCreatedPolyfill = new HashMap<String,Boolean>()     /** note: unused */;
  public Optional<CodeNode> lastProcessedNode = Optional.empty();
  public int repeat_index = 0;
  
  public void initWriter( RangerAppWriterContext ctx ) {
    if ( langWriter.isPresent() ) {
      return;
    }
    final RangerAppWriterContext root = ctx.getRoot();
    switch (root.targetLangName ) { 
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
    /** unused:  final String encoded_str = ""   **/ ;
    final int str_length = node.string_value.length();
    String encoded_str_2 = "";
    int ii = 0;
    while (ii < str_length) {
      final int ch = (int)node.string_value.charAt(ii);
      final int cc = ch;
      switch (cc ) { 
        case 8 : 
          encoded_str_2 = (encoded_str_2 + ((new String( Character.toChars(92))))) + ((new String( Character.toChars(98))));
          break;
        case 9 : 
          encoded_str_2 = (encoded_str_2 + ((new String( Character.toChars(92))))) + ((new String( Character.toChars(116))));
          break;
        case 10 : 
          encoded_str_2 = (encoded_str_2 + ((new String( Character.toChars(92))))) + ((new String( Character.toChars(110))));
          break;
        case 12 : 
          encoded_str_2 = (encoded_str_2 + ((new String( Character.toChars(92))))) + ((new String( Character.toChars(102))));
          break;
        case 13 : 
          encoded_str_2 = (encoded_str_2 + ((new String( Character.toChars(92))))) + ((new String( Character.toChars(114))));
          break;
        case 34 : 
          encoded_str_2 = (encoded_str_2 + ((new String( Character.toChars(92))))) + ((new String( Character.toChars(34))));
          break;
        case 92 : 
          encoded_str_2 = (encoded_str_2 + ((new String( Character.toChars(92))))) + ((new String( Character.toChars(92))));
          break;
        default: 
          encoded_str_2 = encoded_str_2 + ((new String( Character.toChars(ch))));
          break;
      }
      ii = ii + 1;
    }
    return encoded_str_2;
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
  
  public void CreateLambdaCall( CodeNode node , RangerAppWriterContext ctx , CodeWriter wr ) {
    langWriter.get().CreateLambdaCall(node, ctx, wr);
  }
  
  public void CreateLambda( CodeNode node , RangerAppWriterContext ctx , CodeWriter wr ) {
    langWriter.get().CreateLambda(node, ctx, wr);
  }
  
  public String getTypeString( String str , RangerAppWriterContext ctx ) {
    return "";
  }
  
  public void findOpCode( CodeNode op , CodeNode node , RangerAppWriterContext ctx , CodeWriter wr ) {
    final CodeNode fnName = op.children.get(1);
    final CodeNode args = op.children.get(2);
    if ( (op.children.size()) > 3 ) {
      final CodeNode details = op.children.get(3);
      for ( int i = 0; i < details.children.size(); i++) {
        CodeNode det = details.children.get(i);
        if ( (det.children.size()) > 0 ) {
          final CodeNode fc = det.children.get(0);
          if ( fc.vref.equals("code") ) {
            final RangerArgMatch match = new RangerArgMatch();
            final boolean all_matched = match.matchArguments(args, node, ctx, 1);
            if ( all_matched == false ) {
              return;
            }
            final CodeNode origCode = det.children.get(1);
            final CodeNode theCode = origCode.rebuildWithType(match, true);
            final RangerAppWriterContext appCtx = ctx.getRoot();
            final String stdFnName = appCtx.createSignature(fnName.vref, (fnName.vref + theCode.getCode()));
            final RangerAppClassDesc stdClass = ctx.findClass("RangerStaticMethods");
            final RangerAppWriterContext runCtx = appCtx.fork();
            boolean b_failed = false;
            if ( false == (stdClass.defined_static_methods.containsKey(stdFnName)) ) {
              runCtx.setInMethod();
              final RangerAppFunctionDesc m = new RangerAppFunctionDesc();
              m.name = stdFnName;
              m.node = Optional.of(op);
              m.is_static = true;
              m.nameNode = Optional.of(fnName);
              m.fnBody = Optional.of(theCode);
              for ( int ii = 0; ii < args.children.size(); ii++) {
                CodeNode arg = args.children.get(ii);
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
                runCtx.defineVariable(p.name, p);
              }
              stdClass.addStaticMethod(m);
              final int err_cnt = ctx.compilerErrors.size();
              final RangerFlowParser flowParser = new RangerFlowParser();
              final CodeWriter TmpWr = new CodeWriter();
              flowParser.WalkNode(theCode, runCtx, TmpWr);
              runCtx.unsetInMethod();
              final int err_delta = (ctx.compilerErrors.size()) - err_cnt;
              if ( err_delta > 0 ) {
                b_failed = true;
                System.out.println(String.valueOf( "Had following compiler errors:" ) );
                for ( int i_1 = 0; i_1 < ctx.compilerErrors.size(); i_1++) {
                  RangerCompilerMessage e = ctx.compilerErrors.get(i_1);
                  if ( i_1 < err_cnt ) {
                    continue;
                  }
                  final int line_index = e.node.get().getLine();
                  System.out.println(String.valueOf( (e.node.get().getFilename() + " Line: ") + line_index ) );
                  System.out.println(String.valueOf( e.description ) );
                  System.out.println(String.valueOf( e.node.get().getLineString(line_index) ) );
                }
              } else {
                System.out.println(String.valueOf( "no errors found" ) );
              }
            }
            if ( b_failed ) {
              wr.out("/* custom operator compilation failed */ ", false);
            } else {
              wr.out(("RangerStaticMethods." + stdFnName) + "(", false);
              for ( int i_2 = 0; i_2 < node.children.size(); i_2++) {
                CodeNode cc = node.children.get(i_2);
                if ( i_2 == 0 ) {
                  continue;
                }
                if ( i_2 > 1 ) {
                  wr.out(", ", false);
                }
                this.WalkNode(cc, ctx, wr);
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
    /** unused:  final CodeNode fnName = op.children.get(1)   **/ ;
    /** unused:  final RangerAppWriterContext root = ctx.getRoot()   **/ ;
    final String langName = ctx.getTargetLang();
    if ( (op.children.size()) > 3 ) {
      final CodeNode details = op.children.get(3);
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
              if ( tplName.hasFlag("mutable") ) {
                if ( false == node.hasFlag("mutable") ) {
                  continue;
                }
              }
              return Optional.ofNullable((tplImpl.isPresent() ? (CodeNode)tplImpl.get() : null ) );
            }
          }
        }
      }
    }
    final Optional<CodeNode> non = Optional.empty();
    return Optional.ofNullable((non.isPresent() ? (CodeNode)non.get() : null ) );
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
      if ( node.disabled_node ) {
        langWriter.get().disabledVarDef(node, ctx, wr);
      } else {
        langWriter.get().writeVarDef(node, ctx, wr);
      }
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
        /** unused:  final CodeNode fc = op.getFirst()   **/ ;
        final Optional<CodeNode> tplImpl = this.findOpTemplate(op, node, ctx, wr);
        RangerAppWriterContext evalCtx = ctx;
        if ( node.evalCtx.isPresent() ) {
          evalCtx = node.evalCtx.get();
        }
        if ( tplImpl.isPresent() ) {
          final CodeNode opName = op.getSecond();
          if ( opName.hasFlag("returns") ) {
            langWriter.get().release_local_vars(node, evalCtx, wr);
          }
          this.walkCommandList(tplImpl.get(), node, evalCtx, wr);
        } else {
          this.findOpCode(op, node, evalCtx, wr);
        }
        return;
      }
      if ( node.has_lambda ) {
        this.CreateLambda(node, ctx, wr);
        return;
      }
      if ( node.has_lambda_call ) {
        this.CreateLambdaCall(node, ctx, wr);
        return;
      }
      if ( (node.children.size()) > 1 ) {
        if ( this.localCall(node, ctx, wr) ) {
          return;
        }
      }
      /** unused:  final CodeNode fc_1 = node.getFirst()   **/ ;
    }
    if ( node.expression ) {
      for ( int i = 0; i < node.children.size(); i++) {
        CodeNode item = node.children.get(i);
        if ( (node.didReturnAtIndex >= 0) && (node.didReturnAtIndex < i) ) {
          break;
        }
        this.WalkNode(item, ctx, wr);
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
    for ( int i = 0; i < cmd.children.size(); i++) {
      CodeNode c = cmd.children.get(i);
      this.walkCommand(c, node, ctx, wr);
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
      if ( (cmd.children.size()) < 2 ) {
        ctx.addError(node, "Invalid command");
        ctx.addError(cmd, "Invalid command");
        return;
      }
      final CodeNode cmdE = cmd.getFirst();
      final CodeNode cmdArg = cmd.getSecond();
      switch (cmdE.vref ) { 
        case "str" : 
          final int idx = cmdArg.int_value;
          if ( (node.children.size()) > idx ) {
            final CodeNode arg = node.children.get(idx);
            wr.out(arg.string_value, false);
          }
          break;
        case "block" : 
          final int idx_1 = cmdArg.int_value;
          if ( (node.children.size()) > idx_1 ) {
            final CodeNode arg_1 = node.children.get(idx_1);
            this.WalkNode(arg_1, ctx, wr);
          }
          break;
        case "varname" : 
          if ( ctx.isVarDefined(cmdArg.vref) ) {
            final RangerAppParamDesc p = ctx.getVariableDef(cmdArg.vref);
            wr.out(p.compiledName, false);
          }
          break;
        case "defvar" : 
          final RangerAppParamDesc p_1 = new RangerAppParamDesc();
          p_1.name = cmdArg.vref;
          p_1.value_type = cmdArg.value_type;
          p_1.node = Optional.of(cmdArg);
          p_1.nameNode = Optional.of(cmdArg);
          p_1.is_optional = false;
          ctx.defineVariable(p_1.name, p_1);
          break;
        case "cc" : 
          final int idx_2 = cmdArg.int_value;
          if ( (node.children.size()) > idx_2 ) {
            final CodeNode arg_2 = node.children.get(idx_2);
            final byte cc = ((arg_2.string_value.getBytes())[0]);
            wr.out("" + (cc), false);
          }
          break;
        case "java_case" : 
          final int idx_3 = cmdArg.int_value;
          if ( (node.children.size()) > idx_3 ) {
            final CodeNode arg_3 = node.children.get(idx_3);
            this.WalkNode(arg_3, ctx, wr);
            if ( arg_3.didReturnAtIndex < 0 ) {
              wr.newline();
              wr.out("break;", true);
            }
          }
          break;
        case "e" : 
          final int idx_4 = cmdArg.int_value;
          if ( (node.children.size()) > idx_4 ) {
            final CodeNode arg_4 = node.children.get(idx_4);
            ctx.setInExpr();
            this.WalkNode(arg_4, ctx, wr);
            ctx.unsetInExpr();
          }
          break;
        case "goset" : 
          final int idx_5 = cmdArg.int_value;
          if ( (node.children.size()) > idx_5 ) {
            final CodeNode arg_5 = node.children.get(idx_5);
            ctx.setInExpr();
            langWriter.get().WriteSetterVRef(arg_5, ctx, wr);
            ctx.unsetInExpr();
          }
          break;
        case "pe" : 
          final int idx_6 = cmdArg.int_value;
          if ( (node.children.size()) > idx_6 ) {
            final CodeNode arg_6 = node.children.get(idx_6);
            this.WalkNode(arg_6, ctx, wr);
          }
          break;
        case "ptr" : 
          final int idx_7 = cmdArg.int_value;
          if ( (node.children.size()) > idx_7 ) {
            final CodeNode arg_7 = node.children.get(idx_7);
            if ( arg_7.hasParamDesc ) {
              if ( arg_7.paramDesc.get().nameNode.get().isAPrimitiveType() == false ) {
                wr.out("*", false);
              }
            } else {
              if ( arg_7.isAPrimitiveType() == false ) {
                wr.out("*", false);
              }
            }
          }
          break;
        case "ptrsrc" : 
          final int idx_8 = cmdArg.int_value;
          if ( (node.children.size()) > idx_8 ) {
            final CodeNode arg_8 = node.children.get(idx_8);
            if ( (arg_8.isPrimitiveType() == false) && (arg_8.isPrimitive() == false) ) {
              wr.out("&", false);
            }
          }
          break;
        case "nameof" : 
          final int idx_9 = cmdArg.int_value;
          if ( (node.children.size()) > idx_9 ) {
            final CodeNode arg_9 = node.children.get(idx_9);
            wr.out(arg_9.vref, false);
          }
          break;
        case "list" : 
          final int idx_10 = cmdArg.int_value;
          if ( (node.children.size()) > idx_10 ) {
            final CodeNode arg_10 = node.children.get(idx_10);
            for ( int i = 0; i < arg_10.children.size(); i++) {
              CodeNode ch = arg_10.children.get(i);
              if ( i > 0 ) {
                wr.out(" ", false);
              }
              ctx.setInExpr();
              this.WalkNode(ch, ctx, wr);
              ctx.unsetInExpr();
            }
          }
          break;
        case "repeat_from" : 
          final int idx_11 = cmdArg.int_value;
          repeat_index = idx_11;
          if ( (node.children.size()) >= idx_11 ) {
            final CodeNode cmdToRepeat = cmd.getThird();
            int i_1 = idx_11;
            while (i_1 < (node.children.size())) {
              if ( i_1 >= idx_11 ) {
                for ( int ii = 0; ii < cmdToRepeat.children.size(); ii++) {
                  CodeNode cc_1 = cmdToRepeat.children.get(ii);
                  if ( (cc_1.children.size()) > 0 ) {
                    final CodeNode fc = cc_1.getFirst();
                    if ( fc.vref.equals("e") ) {
                      final CodeNode dc = cc_1.getSecond();
                      dc.int_value = i_1;
                    }
                    if ( fc.vref.equals("block") ) {
                      final CodeNode dc_1 = cc_1.getSecond();
                      dc_1.int_value = i_1;
                    }
                  }
                }
                this.walkCommandList(cmdToRepeat, node, ctx, wr);
                if ( (i_1 + 1) < (node.children.size()) ) {
                  wr.out(",", false);
                }
              }
              i_1 = i_1 + 1;
            }
          }
          break;
        case "comma" : 
          final int idx_12 = cmdArg.int_value;
          if ( (node.children.size()) > idx_12 ) {
            final CodeNode arg_11 = node.children.get(idx_12);
            for ( int i_2 = 0; i_2 < arg_11.children.size(); i_2++) {
              CodeNode ch_1 = arg_11.children.get(i_2);
              if ( i_2 > 0 ) {
                wr.out(",", false);
              }
              ctx.setInExpr();
              this.WalkNode(ch_1, ctx, wr);
              ctx.unsetInExpr();
            }
          }
          break;
        case "swift_rc" : 
          final int idx_13 = cmdArg.int_value;
          if ( (node.children.size()) > idx_13 ) {
            final CodeNode arg_12 = node.children.get(idx_13);
            if ( arg_12.hasParamDesc ) {
              if ( arg_12.paramDesc.get().ref_cnt == 0 ) {
                wr.out("_", false);
              } else {
                final RangerAppParamDesc p_2 = ctx.getVariableDef(arg_12.vref);
                wr.out(p_2.compiledName, false);
              }
            } else {
              wr.out(arg_12.vref, false);
            }
          }
          break;
        case "r_ktype" : 
          final int idx_14 = cmdArg.int_value;
          if ( (node.children.size()) > idx_14 ) {
            final CodeNode arg_13 = node.children.get(idx_14);
            if ( arg_13.hasParamDesc ) {
              final String ss = langWriter.get().getObjectTypeString(arg_13.paramDesc.get().nameNode.get().key_type, ctx);
              wr.out(ss, false);
            } else {
              final String ss_1 = langWriter.get().getObjectTypeString(arg_13.key_type, ctx);
              wr.out(ss_1, false);
            }
          }
          break;
        case "r_atype" : 
          final int idx_15 = cmdArg.int_value;
          if ( (node.children.size()) > idx_15 ) {
            final CodeNode arg_14 = node.children.get(idx_15);
            if ( arg_14.hasParamDesc ) {
              final String ss_2 = langWriter.get().getObjectTypeString(arg_14.paramDesc.get().nameNode.get().array_type, ctx);
              wr.out(ss_2, false);
            } else {
              final String ss_3 = langWriter.get().getObjectTypeString(arg_14.array_type, ctx);
              wr.out(ss_3, false);
            }
          }
          break;
        case "custom" : 
          langWriter.get().CustomOperator(node, ctx, wr);
          break;
        case "arraytype" : 
          final int idx_16 = cmdArg.int_value;
          if ( (node.children.size()) > idx_16 ) {
            final CodeNode arg_15 = node.children.get(idx_16);
            if ( arg_15.hasParamDesc ) {
              langWriter.get().writeArrayTypeDef(arg_15.paramDesc.get().nameNode.get(), ctx, wr);
            } else {
              langWriter.get().writeArrayTypeDef(arg_15, ctx, wr);
            }
          }
          break;
        case "rawtype" : 
          final int idx_17 = cmdArg.int_value;
          if ( (node.children.size()) > idx_17 ) {
            final CodeNode arg_16 = node.children.get(idx_17);
            if ( arg_16.hasParamDesc ) {
              langWriter.get().writeRawTypeDef(arg_16.paramDesc.get().nameNode.get(), ctx, wr);
            } else {
              langWriter.get().writeRawTypeDef(arg_16, ctx, wr);
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
          /** unused:  final RangerAppWriterContext root = ctx.getRoot()   **/ ;
          if ( (p_write.compiledTags.containsKey(p_str)) == false ) {
            p_write.compiledTags.put(p_str, true);
            final RangerAppWriterContext mCtx = ctx.fork();
            mCtx.restartExpressionLevel();
            this.walkCommandList(cmdArg, node, mCtx, p_write);
          }
          break;
        case "create_polyfill" : 
          final CodeWriter p_write_1 = wr.getTag("utilities");
          final String p_str_1 = cmdArg.string_value;
          if ( (p_write_1.compiledTags.containsKey(p_str_1)) == false ) {
            p_write_1.raw(p_str_1, true);
            p_write_1.compiledTags.put(p_str_1, true);
          }
          break;
        case "typeof" : 
          final int idx_18 = cmdArg.int_value;
          if ( (node.children.size()) >= idx_18 ) {
            final CodeNode arg_17 = node.children.get(idx_18);
            if ( arg_17.hasParamDesc ) {
              this.writeTypeDef(arg_17.paramDesc.get().nameNode.get(), ctx, wr);
            } else {
              this.writeTypeDef(arg_17, ctx, wr);
            }
          }
          break;
        case "imp" : 
          langWriter.get().import_lib(cmdArg.string_value, ctx, wr);
          break;
        case "atype" : 
          final int idx_19 = cmdArg.int_value;
          if ( (node.children.size()) >= idx_19 ) {
            final CodeNode arg_18 = node.children.get(idx_19);
            final Optional<RangerAppParamDesc> p_3 = this.findParamDesc(arg_18, ctx, wr);
            final CodeNode nameNode = p_3.get().nameNode.get();
            final String tn = nameNode.array_type;
            wr.out(this.getTypeString(tn, ctx), false);
          }
          break;
      }
    } else {
      if ( cmd.value_type == 9 ) {
        switch (cmd.vref ) { 
          case "nl" : 
            wr.newline();
            break;
          case "space" : 
            wr.out(" ", false);
            break;
          case "I" : 
            wr.indent(1);
            break;
          case "i" : 
            wr.indent(-1);
            break;
          case "op" : 
            final CodeNode fc_1 = node.getFirst();
            wr.out(fc_1.vref, false);
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
    Optional<RangerAppParamDesc> varDesc = Optional.empty();
    boolean set_nsp = false;
    Optional<RangerAppClassDesc> classDesc = Optional.empty();
    if ( 0 == (obj.nsp.size()) ) {
      set_nsp = true;
    }
    if ( !obj.vref.equals("this") ) {
      if ( (obj.ns.size()) > 1 ) {
        final int cnt = obj.ns.size();
        Optional<RangerAppParamDesc> classRefDesc = Optional.empty();
        for ( int i = 0; i < obj.ns.size(); i++) {
          String strname = obj.ns.get(i);
          if ( i == 0 ) {
            if ( strname.equals("this") ) {
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
}
