import java.util.*;
import java.io.*;
import java.lang.StringBuilder;
import java.io.File;
import java.util.Optional;
import java.nio.file.Paths;
import java.nio.file.Files;
import java.nio.charset.Charset;
import java.nio.charset.StandardCharsets;

class CompilerInterface { 
  
  static String joinStrings(ArrayList<String> list, String delimiter) 
  {
      StringBuilder b = new StringBuilder();
      for(int i=0; i < list.size() ; i++) {
          if( i > 0 ) {
              b.append(delimiter);
          }
          b.append(list.get(i));
      }
      return b.toString();
  }    
      
  
  static String readFile(String path, Charset encoding) 
  {
    try {
      byte[] encoded = Files.readAllBytes(Paths.get(path));
      return new String(encoded, encoding);
    } catch(IOException e) { 
      return "";
    }
  }    
      
  
  public static void main(String [] args ) {
    final ArrayList<String> allowed_languages = new ArrayList<String>(Arrays.asList("es6","go","scala","java7","swift3","cpp","php","ranger")) ;
    if ( (args.length) < 5 ) {
      System.out.println(String.valueOf( "Ranger compiler, version 2.0.8" ) );
      System.out.println(String.valueOf( "usage <file> <language-file> <language> <directory> <targetfile>" ) );
      System.out.println(String.valueOf( "allowed languages: " + (joinStrings(allowed_languages, " ")) ) );
      return;
    }
    final String the_file = args[0];
    final String the_lang_file = args[1];
    final String the_lang = args[2];
    final String the_target_dir = args[3];
    final String the_target = args[4];
    System.out.println(String.valueOf( "language == " + the_lang ) );
    if ( (allowed_languages.indexOf(the_lang)) < 0 ) {
      System.out.println(String.valueOf( "Invalid language : " + the_lang ) );
      /** unused:  final String s = ""   **/ ;
      System.out.println(String.valueOf( "allowed languages: " + (joinStrings(allowed_languages, " ")) ) );
      return;
    }
    if ( (new File("." + '/' + the_file).exists()) == false ) {
      System.out.println(String.valueOf( "Could not compile." ) );
      System.out.println(String.valueOf( "File not found: " + the_file ) );
      return;
    }
    if ( (new File("." + '/' + the_lang_file).exists()) == false ) {
      System.out.println(String.valueOf( ("language file " + the_lang_file) + " not found!" ) );
      System.out.println(String.valueOf( "download: https://raw.githubusercontent.com/terotests/Ranger/master/compiler/Lang.clj" ) );
      return;
    }
    System.out.println(String.valueOf( "File to be compiled: " + the_file ) );
    final Optional<String> c = Optional.of(readFile("." + "/" + the_file , StandardCharsets.UTF_8 ));
    final SourceCode code = new SourceCode(c.get());
    code.filename = the_file;
    final RangerLispParser parser = new RangerLispParser(code);
    parser.parse();
    final LiveCompiler lcc = new LiveCompiler();
    final CodeNode node = parser.rootNode.get();
    final RangerFlowParser flowParser = new RangerFlowParser();
    final RangerAppWriterContext appCtx = new RangerAppWriterContext();
    final CodeWriter wr = new CodeWriter();
    long startTime = System.nanoTime();
    try {
      flowParser.mergeImports(node, appCtx, wr);
      final Optional<String> lang_str = Optional.of(readFile("." + "/" + the_lang_file , StandardCharsets.UTF_8 ));
      final SourceCode lang_code = new SourceCode(lang_str.get());
      lang_code.filename = the_lang_file;
      final RangerLispParser lang_parser = new RangerLispParser(lang_code);
      lang_parser.parse();
      appCtx.langOperators = Optional.of(lang_parser.rootNode.get());
      appCtx.setRootFile(the_file);
      System.out.println(String.valueOf( "1. Collecting available methods." ) );
      flowParser.CollectMethods(node, appCtx, wr);
      if ( (appCtx.compilerErrors.size()) > 0 ) {
        CompilerInterface.displayCompilerErrors(appCtx);
        return;
      }
      System.out.println(String.valueOf( "2. Analyzing the code." ) );
      appCtx.targetLangName = the_lang;
      System.out.println(String.valueOf( "selected language is " + appCtx.targetLangName ) );
      flowParser.StartWalk(node, appCtx, wr);
      if ( (appCtx.compilerErrors.size()) > 0 ) {
        CompilerInterface.displayCompilerErrors(appCtx);
        return;
      }
      System.out.println(String.valueOf( "3. Compiling the source code." ) );
      final CodeFileSystem fileSystem = new CodeFileSystem();
      final CodeFile file = fileSystem.getFile(".", the_target);
      final Optional<CodeWriter> wr_1 = file.getWriter();
      Optional<RangerAppClassDesc> staticMethods = Optional.empty();
      final CodeWriter importFork = wr_1.get().fork();
      for ( int i = 0; i < appCtx.definedClassList.size(); i++) {
        String cName = appCtx.definedClassList.get(i);
        if ( cName.equals("RangerStaticMethods") ) {
          staticMethods = Optional.ofNullable(appCtx.definedClasses.get(cName));
          continue;
        }
        final Optional<RangerAppClassDesc> cl = Optional.ofNullable(appCtx.definedClasses.get(cName));
        if ( cl.get().is_trait ) {
          continue;
        }
        if ( cl.get().is_system ) {
          continue;
        }
        if ( cl.get().is_system_union ) {
          continue;
        }
        lcc.WalkNode(cl.get().classNode.get(), appCtx, wr_1.get());
      }
      if ( staticMethods.isPresent() ) {
        lcc.WalkNode(staticMethods.get().classNode.get(), appCtx, wr_1.get());
      }
      for ( int i_1 = 0; i_1 < flowParser.collectedIntefaces.size(); i_1++) {
        RangerAppClassDesc ifDesc = flowParser.collectedIntefaces.get(i_1);
        System.out.println(String.valueOf( "should define also interface " + ifDesc.name ) );
        lcc.langWriter.get().writeInterface(ifDesc, appCtx, wr_1.get());
      }
      final ArrayList<String> import_list = wr_1.get().getImports();
      if ( appCtx.targetLangName.equals("go") ) {
        importFork.out("package main", true);
        importFork.newline();
        importFork.out("import (", true);
        importFork.indent(1);
      }
      for ( int i_2 = 0; i_2 < import_list.size(); i_2++) {
        String codeStr = import_list.get(i_2);
        switch (appCtx.targetLangName ) { 
          case "go" : 
            if ( ((int)codeStr.charAt(0)) == (((("_".getBytes())[0]))) ) {
              importFork.out((" _ \"" + (codeStr.substring(1, (codeStr.length()) ))) + "\"", true);
            } else {
              importFork.out(("\"" + codeStr) + "\"", true);
            }
            break;
          case "rust" : 
            importFork.out(("use " + codeStr) + ";", true);
            break;
          case "cpp" : 
            importFork.out(("#include  " + codeStr) + "", true);
            break;
          default: 
            importFork.out(("import " + codeStr) + "", true);
            break;
        }
      }
      if ( appCtx.targetLangName.equals("go") ) {
        importFork.indent(-1);
        importFork.out(")", true);
      }
      fileSystem.saveTo(the_target_dir);
      System.out.println(String.valueOf( "Ready." ) );
      CompilerInterface.displayCompilerErrors(appCtx);
    } catch( Exception e) {
      if ( lcc.lastProcessedNode.isPresent()) {
        System.out.println(String.valueOf( "Got compiler error close to" ) );
        System.out.println(String.valueOf( lcc.lastProcessedNode.get().getLineAsString() ) );
        return;
      }
      if ( flowParser.lastProcessedNode.isPresent()) {
        System.out.println(String.valueOf( "Got compiler error close to" ) );
        System.out.println(String.valueOf( flowParser.lastProcessedNode.get().getLineAsString() ) );
        return;
      }
      System.out.println(String.valueOf( "Got unknown compiler error" ) );
      return;
    }
    long elapsedTime = System.nanoTime() - startTime;
    System.out.println( "Total time"+ String.valueOf((double)elapsedTime / 1000000000.0));
  }
  
  public static void displayCompilerErrors( RangerAppWriterContext appCtx ) {
    final ColorConsole cons = new ColorConsole();
    for ( int i_3 = 0; i_3 < appCtx.compilerErrors.size(); i_3++) {
      RangerCompilerMessage e = appCtx.compilerErrors.get(i_3);
      final int line_index = e.node.get().getLine();
      cons.out("gray", (e.node.get().getFilename() + " Line: ") + (1 + line_index));
      cons.out("gray", e.description);
      cons.out("gray", e.node.get().getLineString(line_index));
      cons.out("", e.node.get().getColStartString() + "^-------");
    }
  }
  
  public static void displayParserErrors( RangerAppWriterContext appCtx ) {
    if ( (appCtx.parserErrors.size()) == 0 ) {
      System.out.println(String.valueOf( "no language test errors" ) );
      return;
    }
    System.out.println(String.valueOf( "LANGUAGE TEST ERRORS:" ) );
    for ( int i_4 = 0; i_4 < appCtx.parserErrors.size(); i_4++) {
      RangerCompilerMessage e_1 = appCtx.parserErrors.get(i_4);
      final int line_index_1 = e_1.node.get().getLine();
      System.out.println(String.valueOf( (e_1.node.get().getFilename() + " Line: ") + (1 + line_index_1) ) );
      System.out.println(String.valueOf( e_1.description ) );
      System.out.println(String.valueOf( e_1.node.get().getLineString(line_index_1) ) );
    }
  }
}
