import java.util.Optional;
import java.util.*;
import java.io.*;
import java.nio.file.Paths;
import java.io.File;
import java.nio.file.Files;
import java.nio.charset.Charset;
import java.nio.charset.StandardCharsets;

class LiveCompiler { 
  
  static String readFile(String path, Charset encoding) 
  {
    try {
      byte[] encoded = Files.readAllBytes(Paths.get(path));
      return new String(encoded, encoding);
    } catch(IOException e) { 
      return "";
    }
  }    
      
  public Optional<RangerGenericClassWriter> langWriter = Optional.empty();
  public HashMap<String,Boolean> hasCreatedPolyfill = new HashMap<String,Boolean>()     /** note: unused */;
  
  public static void main(String [] args ) {
    if ( (args.length) < 4 ) {
      System.out.println(String.valueOf( "usage <file> <language> <directory> <targetfile>" ) );
      return;
    }
    final String the_file = args[0];
    final String the_lang = args[1];
    final String the_target_dir = args[2];
    final String the_target = args[3];
    System.out.println(String.valueOf( "file name " + the_file ) );
    final Optional<String> c_13 = Optional.of(readFile("." + "/" + the_file , StandardCharsets.UTF_8 ));
    final SourceCode code_3 = new SourceCode(c_13.get());
    code_3.filename = the_file;
    final RangerLispParser parser_3 = new RangerLispParser(code_3);
    parser_3.parse();
    final CodeNode node_2 = parser_3.rootNode.get();
    final RangerFlowParser flowParser_2 = new RangerFlowParser();
    final RangerAppWriterContext appCtx_2 = new RangerAppWriterContext();
    final CodeWriter wr_13 = new CodeWriter();
    long startTime = System.nanoTime();
    flowParser_2.mergeImports(node_2, appCtx_2, wr_13);
    final Optional<String> lang_str_2 = Optional.of(readFile("." + "/" + "Lang.clj" , StandardCharsets.UTF_8 ));
    final SourceCode lang_code_2 = new SourceCode(lang_str_2.get());
    lang_code_2.filename = "Lang.clj";
    final RangerLispParser lang_parser_2 = new RangerLispParser(lang_code_2);
    lang_parser_2.parse();
    appCtx_2.langOperators = Optional.of(lang_parser_2.rootNode.get());
    System.out.println(String.valueOf( "===== collecting methods ==== ---->>>" ) );
    flowParser_2.CollectMethods(node_2, appCtx_2, wr_13);
    if ( (appCtx_2.compilerErrors.size()) > 0 ) {
      LiveCompiler.displayCompilerErrors(appCtx_2);
      return;
    }
    System.out.println(String.valueOf( "----> collection done" ) );
    System.out.println(String.valueOf( "===== starting flowParser ==== " ) );
    appCtx_2.targetLangName = the_lang;
    flowParser_2.WalkNode(node_2, appCtx_2, wr_13);
    if ( (appCtx_2.compilerErrors.size()) > 0 ) {
      LiveCompiler.displayCompilerErrors(appCtx_2);
      LiveCompiler.displayParserErrors(appCtx_2);
      return;
    }
    System.out.println(String.valueOf( "--- flow done --- " ) );
    final CodeFileSystem fileSystem = new CodeFileSystem();
    final CodeFile file_5 = fileSystem.getFile(".", the_target);
    final Optional<CodeWriter> wr_20 = file_5.getWriter();
    final LiveCompiler lcc_2 = new LiveCompiler();
    Optional<RangerAppClassDesc> staticMethods = Optional.empty();
    final CodeWriter importFork_8 = wr_20.get().fork();
    for ( int i_194 = 0; i_194 < appCtx_2.definedClassList.size(); i_194++) {
      String cName_2 = appCtx_2.definedClassList.get(i_194);
      if ( cName_2.equals("RangerStaticMethods") ) {
        staticMethods = Optional.ofNullable(appCtx_2.definedClasses.get(cName_2));
        continue;
      }
      final Optional<RangerAppClassDesc> cl_19 = Optional.ofNullable(appCtx_2.definedClasses.get(cName_2));
      if ( cl_19.get().is_system ) {
        System.out.println(String.valueOf( ("--> system class " + cl_19.get().name) + ", skipping" ) );
        continue;
      }
      lcc_2.WalkNode(cl_19.get().classNode.get(), appCtx_2, wr_20.get());
    }
    if ( staticMethods.isPresent() ) {
      lcc_2.WalkNode(staticMethods.get().classNode.get(), appCtx_2, wr_20.get());
    }
    final ArrayList<String> import_list_5 = wr_20.get().getImports();
    if ( appCtx_2.targetLangName.equals("go") ) {
      importFork_8.out("package main", true);
      importFork_8.newline();
      importFork_8.out("import (", true);
      importFork_8.indent(1);
    }
    for ( int i_201 = 0; i_201 < import_list_5.size(); i_201++) {
      String codeStr_5 = import_list_5.get(i_201);
      switch (appCtx_2.targetLangName ) { 
        case "go" : 
          if ( ((int)codeStr_5.charAt(0)) == ((("_".charAt(0)))) ) {
            importFork_8.out((" _ \"" + (codeStr_5.substring(1, (codeStr_5.length()) ))) + "\"", true);
          } else {
            importFork_8.out(("\"" + codeStr_5) + "\"", true);
          }
          break;
        case "rust" : 
          importFork_8.out(("use " + codeStr_5) + ";", true);
          break;
        default: 
          importFork_8.out(("import " + codeStr_5) + "", true);
          break;
      }
    }
    if ( appCtx_2.targetLangName.equals("go") ) {
      importFork_8.indent(-1);
      importFork_8.out(")", true);
    }
    fileSystem.saveTo(the_target_dir);
    System.out.println(String.valueOf( "Ready." ) );
    LiveCompiler.displayCompilerErrors(appCtx_2);
    LiveCompiler.displayParserErrors(appCtx_2);
    long elapsedTime = System.nanoTime() - startTime;
    System.out.println( "Total time"+ String.valueOf((double)elapsedTime / 1000000000.0));
  }
  
  public static void displayCompilerErrors( RangerAppWriterContext appCtx ) {
    for ( int i_199 = 0; i_199 < appCtx.compilerErrors.size(); i_199++) {
      RangerCompilerMessage e_21 = appCtx.compilerErrors.get(i_199);
      final int line_index_4 = e_21.node.get().getLine();
      System.out.println(String.valueOf( (e_21.node.get().getFilename() + " Line: ") + (1 + line_index_4) ) );
      System.out.println(String.valueOf( e_21.description ) );
      System.out.println(String.valueOf( e_21.node.get().getLineString(line_index_4) ) );
    }
  }
  
  public static void displayParserErrors( RangerAppWriterContext appCtx ) {
    if ( (appCtx.parserErrors.size()) == 0 ) {
      System.out.println(String.valueOf( "no language test errors" ) );
      return;
    }
    System.out.println(String.valueOf( "LANGUAGE TEST ERRORS:" ) );
    for ( int i_201 = 0; i_201 < appCtx.parserErrors.size(); i_201++) {
      RangerCompilerMessage e_24 = appCtx.parserErrors.get(i_201);
      final int line_index_7 = e_24.node.get().getLine();
      System.out.println(String.valueOf( (e_24.node.get().getFilename() + " Line: ") + (1 + line_index_7) ) );
      System.out.println(String.valueOf( e_24.description ) );
      System.out.println(String.valueOf( e_24.node.get().getLineString(line_index_7) ) );
    }
  }
  
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
    /** unused:  final String encoded_str_4 = ""   **/ ;
    final int str_length_3 = node.string_value.length();
    String encoded_str_10 = "";
    int ii_12 = 0;
    while (ii_12 < str_length_3) {final int ch_6 = (int)node.string_value.charAt(ii_12);
      final int cc_19 = ch_6;
      switch (cc_19 ) { 
        case 8 : 
          encoded_str_10 = (encoded_str_10 + ((new String( Character.toChars(92))))) + ((new String( Character.toChars(98))));
          break;
        case 9 : 
          encoded_str_10 = (encoded_str_10 + ((new String( Character.toChars(92))))) + ((new String( Character.toChars(116))));
          break;
        case 10 : 
          encoded_str_10 = (encoded_str_10 + ((new String( Character.toChars(92))))) + ((new String( Character.toChars(110))));
          break;
        case 12 : 
          encoded_str_10 = (encoded_str_10 + ((new String( Character.toChars(92))))) + ((new String( Character.toChars(102))));
          break;
        case 13 : 
          encoded_str_10 = (encoded_str_10 + ((new String( Character.toChars(92))))) + ((new String( Character.toChars(114))));
          break;
        case 34 : 
          encoded_str_10 = (encoded_str_10 + ((new String( Character.toChars(92))))) + ((new String( Character.toChars(34))));
          break;
        case 92 : 
          encoded_str_10 = (encoded_str_10 + ((new String( Character.toChars(92))))) + ((new String( Character.toChars(92))));
          break;
        default: 
          encoded_str_10 = encoded_str_10 + ((new String( Character.toChars(ch_6))));
          break;
      }
      ii_12 = ii_12 + 1;
    }
    return encoded_str_10;
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
    for ( int i_182 = 0; i_182 < args_6.children.size(); i_182++) {
      CodeNode arg_34 = args_6.children.get(i_182);
      if ( i_182 > 0 ) {
        wr.out(", ", false);
      }
      wr.out(arg_34.vref, false);
    }
    wr.out(")", false);
    wr.out(" => { ", true);
    wr.indent(1);
    wr.out("// body ", true);
    for ( int i_187 = 0; i_187 < body_2.children.size(); i_187++) {
      CodeNode item_9 = body_2.children.get(i_187);
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
      for ( int i_187 = 0; i_187 < details.children.size(); i_187++) {
        CodeNode det_2 = details.children.get(i_187);
        if ( (det_2.children.size()) > 0 ) {
          final CodeNode fc_39 = det_2.children.get(0);
          if ( fc_39.vref.equals("code") ) {
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
              for ( int ii_15 = 0; ii_15 < args_9.children.size(); ii_15++) {
                CodeNode arg_37 = args_9.children.get(ii_15);
                final RangerAppParamDesc p_54 = new RangerAppParamDesc();
                p_54.name = arg_37.vref;
                p_54.value_type = arg_37.value_type;
                p_54.node = Optional.of(arg_37);
                p_54.nameNode = Optional.of(arg_37);
                p_54.refType = 1;
                p_54.varType = 4;
                m_11.params.add(p_54);
                arg_37.hasParamDesc = true;
                arg_37.paramDesc = Optional.of(p_54);
                arg_37.eval_type = arg_37.value_type;
                arg_37.eval_type_name = arg_37.type_name;
                runCtx.defineVariable(p_54.name, p_54);
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
                for ( int i_201 = 0; i_201 < ctx.compilerErrors.size(); i_201++) {
                  RangerCompilerMessage e_20 = ctx.compilerErrors.get(i_201);
                  if ( i_201 < err_cnt_4 ) {
                    continue;
                  }
                  final int line_index_3 = e_20.node.get().getLine();
                  System.out.println(String.valueOf( (e_20.node.get().getFilename() + " Line: ") + line_index_3 ) );
                  System.out.println(String.valueOf( e_20.description ) );
                  System.out.println(String.valueOf( e_20.node.get().getLineString(line_index_3) ) );
                }
              } else {
                System.out.println(String.valueOf( "no errors found" ) );
              }
            }
            if ( b_failed ) {
              wr.out("/* custom operator compilation failed */ ", false);
            } else {
              wr.out(("RangerStaticMethods." + stdFnName) + "(", false);
              for ( int i_209 = 0; i_209 < node.children.size(); i_209++) {
                CodeNode cc_22 = node.children.get(i_209);
                if ( i_209 == 0 ) {
                  continue;
                }
                if ( i_209 > 1 ) {
                  wr.out(", ", false);
                }
                this.WalkNode(cc_22, ctx, wr);
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
      for ( int i_193 = 0; i_193 < details_4.children.size(); i_193++) {
        CodeNode det_5 = details_4.children.get(i_193);
        if ( (det_5.children.size()) > 0 ) {
          final CodeNode fc_42 = det_5.children.get(0);
          if ( fc_42.vref.equals("templates") ) {
            final CodeNode tplList_2 = det_5.children.get(1);
            for ( int i_205 = 0; i_205 < tplList_2.children.size(); i_205++) {
              CodeNode tpl_3 = tplList_2.children.get(i_205);
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
        /** unused:  final CodeNode fc_44 = op.getFirst()   **/ ;
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
      /** unused:  final CodeNode fc_50 = node.getFirst()   **/ ;
    }
    if ( node.expression ) {
      for ( int i_197 = 0; i_197 < node.children.size(); i_197++) {
        CodeNode item_12 = node.children.get(i_197);
        if ( (node.didReturnAtIndex >= 0) && (node.didReturnAtIndex < i_197) ) {
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
    for ( int i_199 = 0; i_199 < cmd.children.size(); i_199++) {
      CodeNode c_12 = cmd.children.get(i_199);
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
        case "block" : 
          final int idx_8 = cmdArg.int_value;
          if ( (node.children.size()) > idx_8 ) {
            final CodeNode arg_39 = node.children.get(idx_8);
            this.WalkNode(arg_39, ctx, wr);
          }
          break;
        case "varname" : 
          if ( ctx.isVarDefined(cmdArg.vref) ) {
            final RangerAppParamDesc p_57 = ctx.getVariableDef(cmdArg.vref);
            wr.out(p_57.compiledName, false);
          }
          break;
        case "defvar" : 
          final RangerAppParamDesc p_65 = new RangerAppParamDesc();
          p_65.name = cmdArg.vref;
          p_65.value_type = cmdArg.value_type;
          p_65.node = Optional.of(cmdArg);
          p_65.nameNode = Optional.of(cmdArg);
          p_65.is_optional = false;
          ctx.defineVariable(p_65.name, p_65);
          break;
        case "cc" : 
          final int idx_17 = cmdArg.int_value;
          if ( (node.children.size()) > idx_17 ) {
            final CodeNode arg_47 = node.children.get(idx_17);
            final char cc_24 = ((arg_47.string_value.charAt(0)));
            wr.out("" + (cc_24), false);
          }
          break;
        case "java_case" : 
          final int idx_22 = cmdArg.int_value;
          if ( (node.children.size()) > idx_22 ) {
            final CodeNode arg_52 = node.children.get(idx_22);
            this.WalkNode(arg_52, ctx, wr);
            if ( arg_52.didReturnAtIndex < 0 ) {
              wr.newline();
              wr.out("break;", true);
            }
          }
          break;
        case "e" : 
          final int idx_27 = cmdArg.int_value;
          if ( (node.children.size()) > idx_27 ) {
            final CodeNode arg_57 = node.children.get(idx_27);
            ctx.setInExpr();
            this.WalkNode(arg_57, ctx, wr);
            ctx.unsetInExpr();
          }
          break;
        case "goset" : 
          final int idx_32 = cmdArg.int_value;
          if ( (node.children.size()) > idx_32 ) {
            final CodeNode arg_62 = node.children.get(idx_32);
            ctx.setInExpr();
            langWriter.get().WriteSetterVRef(arg_62, ctx, wr);
            ctx.unsetInExpr();
          }
          break;
        case "pe" : 
          final int idx_37 = cmdArg.int_value;
          if ( (node.children.size()) > idx_37 ) {
            final CodeNode arg_67 = node.children.get(idx_37);
            this.WalkNode(arg_67, ctx, wr);
          }
          break;
        case "ptr" : 
          final int idx_42 = cmdArg.int_value;
          if ( (node.children.size()) > idx_42 ) {
            final CodeNode arg_72 = node.children.get(idx_42);
            if ( arg_72.hasParamDesc ) {
              if ( arg_72.paramDesc.get().nameNode.get().isAPrimitiveType() == false ) {
                wr.out("*", false);
              }
            } else {
              if ( arg_72.isAPrimitiveType() == false ) {
                wr.out("*", false);
              }
            }
          }
          break;
        case "ptrsrc" : 
          final int idx_47 = cmdArg.int_value;
          if ( (node.children.size()) > idx_47 ) {
            final CodeNode arg_77 = node.children.get(idx_47);
            if ( (arg_77.isPrimitiveType() == false) && (arg_77.isPrimitive() == false) ) {
              wr.out("&", false);
            }
          }
          break;
        case "nameof" : 
          final int idx_52 = cmdArg.int_value;
          if ( (node.children.size()) > idx_52 ) {
            final CodeNode arg_82 = node.children.get(idx_52);
            wr.out(arg_82.vref, false);
          }
          break;
        case "list" : 
          final int idx_57 = cmdArg.int_value;
          if ( (node.children.size()) > idx_57 ) {
            final CodeNode arg_87 = node.children.get(idx_57);
            for ( int i_201 = 0; i_201 < arg_87.children.size(); i_201++) {
              CodeNode ch_9 = arg_87.children.get(i_201);
              if ( i_201 > 0 ) {
                wr.out(" ", false);
              }
              ctx.setInExpr();
              this.WalkNode(ch_9, ctx, wr);
              ctx.unsetInExpr();
            }
          }
          break;
        case "comma" : 
          final int idx_62 = cmdArg.int_value;
          if ( (node.children.size()) > idx_62 ) {
            final CodeNode arg_92 = node.children.get(idx_62);
            for ( int i_209 = 0; i_209 < arg_92.children.size(); i_209++) {
              CodeNode ch_17 = arg_92.children.get(i_209);
              if ( i_209 > 0 ) {
                wr.out(",", false);
              }
              ctx.setInExpr();
              this.WalkNode(ch_17, ctx, wr);
              ctx.unsetInExpr();
            }
          }
          break;
        case "swift_rc" : 
          final int idx_67 = cmdArg.int_value;
          if ( (node.children.size()) > idx_67 ) {
            final CodeNode arg_97 = node.children.get(idx_67);
            if ( arg_97.hasParamDesc ) {
              if ( arg_97.paramDesc.get().ref_cnt == 0 ) {
                wr.out("_", false);
              } else {
                wr.out(arg_97.vref, false);
              }
            } else {
              wr.out(arg_97.vref, false);
            }
          }
          break;
        case "r_ktype" : 
          final int idx_72 = cmdArg.int_value;
          if ( (node.children.size()) > idx_72 ) {
            final CodeNode arg_102 = node.children.get(idx_72);
            if ( arg_102.hasParamDesc ) {
              final String ss = langWriter.get().getObjectTypeString(arg_102.paramDesc.get().nameNode.get().key_type, ctx);
              wr.out(ss, false);
            } else {
              final String ss_17 = langWriter.get().getObjectTypeString(arg_102.key_type, ctx);
              wr.out(ss_17, false);
            }
          }
          break;
        case "r_atype" : 
          final int idx_77 = cmdArg.int_value;
          if ( (node.children.size()) > idx_77 ) {
            final CodeNode arg_107 = node.children.get(idx_77);
            if ( arg_107.hasParamDesc ) {
              final String ss_15 = langWriter.get().getObjectTypeString(arg_107.paramDesc.get().nameNode.get().array_type, ctx);
              wr.out(ss_15, false);
            } else {
              final String ss_27 = langWriter.get().getObjectTypeString(arg_107.array_type, ctx);
              wr.out(ss_27, false);
            }
          }
          break;
        case "custom" : 
          langWriter.get().CustomOperator(node, ctx, wr);
          break;
        case "arraytype" : 
          final int idx_82 = cmdArg.int_value;
          if ( (node.children.size()) > idx_82 ) {
            final CodeNode arg_112 = node.children.get(idx_82);
            if ( arg_112.hasParamDesc ) {
              langWriter.get().writeArrayTypeDef(arg_112.paramDesc.get().nameNode.get(), ctx, wr);
            } else {
              langWriter.get().writeArrayTypeDef(arg_112, ctx, wr);
            }
          }
          break;
        case "rawtype" : 
          final int idx_87 = cmdArg.int_value;
          if ( (node.children.size()) > idx_87 ) {
            final CodeNode arg_117 = node.children.get(idx_87);
            if ( arg_117.hasParamDesc ) {
              langWriter.get().writeRawTypeDef(arg_117.paramDesc.get().nameNode.get(), ctx, wr);
            } else {
              langWriter.get().writeRawTypeDef(arg_117, ctx, wr);
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
          final int idx_92 = cmdArg.int_value;
          if ( (node.children.size()) >= idx_92 ) {
            final CodeNode arg_122 = node.children.get(idx_92);
            if ( arg_122.hasParamDesc ) {
              this.writeTypeDef(arg_122.paramDesc.get().nameNode.get(), ctx, wr);
            } else {
              this.writeTypeDef(arg_122, ctx, wr);
            }
          }
          break;
        case "imp" : 
          langWriter.get().import_lib(cmdArg.string_value, ctx, wr);
          break;
        case "atype" : 
          final int idx_97 = cmdArg.int_value;
          if ( (node.children.size()) >= idx_97 ) {
            final CodeNode arg_127 = node.children.get(idx_97);
            final Optional<RangerAppParamDesc> p_70 = this.findParamDesc(arg_127, ctx, wr);
            final CodeNode nameNode_3 = p_70.get().nameNode.get();
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
            final CodeNode fc_48 = node.getFirst();
            wr.out(fc_48.vref, false);
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
        for ( int i_205 = 0; i_205 < obj.ns.size(); i_205++) {
          String strname_3 = obj.ns.get(i_205);
          if ( i_205 == 0 ) {
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
            if ( i_205 < (cnt_6 - 1) ) {
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
    final Optional<RangerAppClassDesc> cc_26 = ctx.getCurrentClass();
    return Optional.ofNullable((cc_26.isPresent() ? (RangerAppParamDesc)cc_26.get() : null ) );
  }
}
