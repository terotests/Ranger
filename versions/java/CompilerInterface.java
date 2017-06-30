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
    if ( (allowed_languages.indexOf(the_lang)) < 0 ) {
      System.out.println(String.valueOf( "Invalid language : " + the_lang ) );
      /** unused:  final String s_23 = ""   **/ ;
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
    final Optional<String> c_13 = Optional.of(readFile("." + "/" + the_file , StandardCharsets.UTF_8 ));
    final SourceCode code_3 = new SourceCode(c_13.get());
    code_3.filename = the_file;
    final RangerLispParser parser_3 = new RangerLispParser(code_3);
    parser_3.parse();
    final LiveCompiler lcc_2 = new LiveCompiler();
    final CodeNode node_2 = parser_3.rootNode.get();
    final RangerFlowParser flowParser_2 = new RangerFlowParser();
    final RangerAppWriterContext appCtx_2 = new RangerAppWriterContext();
    final CodeWriter wr_14 = new CodeWriter();
    long startTime = System.nanoTime();
    try {
      flowParser_2.mergeImports(node_2, appCtx_2, wr_14);
      final Optional<String> lang_str_2 = Optional.of(readFile("." + "/" + the_lang_file , StandardCharsets.UTF_8 ));
      final SourceCode lang_code_2 = new SourceCode(lang_str_2.get());
      lang_code_2.filename = the_lang_file;
      final RangerLispParser lang_parser_2 = new RangerLispParser(lang_code_2);
      lang_parser_2.parse();
      appCtx_2.langOperators = Optional.of(lang_parser_2.rootNode.get());
      System.out.println(String.valueOf( "1. Collecting available methods." ) );
      flowParser_2.CollectMethods(node_2, appCtx_2, wr_14);
      if ( (appCtx_2.compilerErrors.size()) > 0 ) {
        CompilerInterface.displayCompilerErrors(appCtx_2);
        return;
      }
      System.out.println(String.valueOf( "2. Analyzing the code." ) );
      appCtx_2.targetLangName = the_lang;
      flowParser_2.WalkNode(node_2, appCtx_2, wr_14);
      if ( (appCtx_2.compilerErrors.size()) > 0 ) {
        CompilerInterface.displayCompilerErrors(appCtx_2);
        CompilerInterface.displayParserErrors(appCtx_2);
        return;
      }
      System.out.println(String.valueOf( "3. Compiling the source code." ) );
      final CodeFileSystem fileSystem = new CodeFileSystem();
      final CodeFile file_5 = fileSystem.getFile(".", the_target);
      final Optional<CodeWriter> wr_22 = file_5.getWriter();
      Optional<RangerAppClassDesc> staticMethods = Optional.empty();
      final CodeWriter importFork_8 = wr_22.get().fork();
      for ( int i_210 = 0; i_210 < appCtx_2.definedClassList.size(); i_210++) {
        String cName_2 = appCtx_2.definedClassList.get(i_210);
        if ( cName_2.equals("RangerStaticMethods") ) {
          staticMethods = Optional.ofNullable(appCtx_2.definedClasses.get(cName_2));
          continue;
        }
        final Optional<RangerAppClassDesc> cl_22 = Optional.ofNullable(appCtx_2.definedClasses.get(cName_2));
        if ( cl_22.get().is_system ) {
          System.out.println(String.valueOf( ("--> system class " + cl_22.get().name) + ", skipping" ) );
          continue;
        }
        lcc_2.WalkNode(cl_22.get().classNode.get(), appCtx_2, wr_22.get());
      }
      if ( staticMethods.isPresent() ) {
        lcc_2.WalkNode(staticMethods.get().classNode.get(), appCtx_2, wr_22.get());
      }
      final ArrayList<String> import_list_5 = wr_22.get().getImports();
      if ( appCtx_2.targetLangName.equals("go") ) {
        importFork_8.out("package main", true);
        importFork_8.newline();
        importFork_8.out("import (", true);
        importFork_8.indent(1);
      }
      for ( int i_219 = 0; i_219 < import_list_5.size(); i_219++) {
        String codeStr_5 = import_list_5.get(i_219);
        switch (appCtx_2.targetLangName ) { 
          case "go" : 
            if ( ((int)codeStr_5.charAt(0)) == (((("_".getBytes())[0]))) ) {
              importFork_8.out((" _ \"" + (codeStr_5.substring(1, (codeStr_5.length()) ))) + "\"", true);
            } else {
              importFork_8.out(("\"" + codeStr_5) + "\"", true);
            }
            break;
          case "rust" : 
            importFork_8.out(("use " + codeStr_5) + ";", true);
            break;
          case "cpp" : 
            importFork_8.out(("#include  " + codeStr_5) + "", true);
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
      CompilerInterface.displayCompilerErrors(appCtx_2);
      CompilerInterface.displayParserErrors(appCtx_2);
    } catch( Exception e) {
      if ( lcc_2.lastProcessedNode.isPresent()) {
        System.out.println(String.valueOf( "Got compiler error close to" ) );
        System.out.println(String.valueOf( lcc_2.lastProcessedNode.get().getLineAsString() ) );
        return;
      }
      if ( flowParser_2.lastProcessedNode.isPresent()) {
        System.out.println(String.valueOf( "Got compiler error close to" ) );
        System.out.println(String.valueOf( flowParser_2.lastProcessedNode.get().getLineAsString() ) );
        return;
      }
      System.out.println(String.valueOf( "Got unknown compiler error" ) );
      return;
    }
    long elapsedTime = System.nanoTime() - startTime;
    System.out.println( "Total time"+ String.valueOf((double)elapsedTime / 1000000000.0));
  }
  
  public static void displayCompilerErrors( RangerAppWriterContext appCtx ) {
    for ( int i_215 = 0; i_215 < appCtx.compilerErrors.size(); i_215++) {
      RangerCompilerMessage e_22 = appCtx.compilerErrors.get(i_215);
      final int line_index_4 = e_22.node.get().getLine();
      System.out.println(String.valueOf( (e_22.node.get().getFilename() + " Line: ") + (1 + line_index_4) ) );
      System.out.println(String.valueOf( e_22.description ) );
      System.out.println(String.valueOf( e_22.node.get().getLineString(line_index_4) ) );
    }
  }
  
  public static void displayParserErrors( RangerAppWriterContext appCtx ) {
    if ( (appCtx.parserErrors.size()) == 0 ) {
      System.out.println(String.valueOf( "no language test errors" ) );
      return;
    }
    System.out.println(String.valueOf( "LANGUAGE TEST ERRORS:" ) );
    for ( int i_217 = 0; i_217 < appCtx.parserErrors.size(); i_217++) {
      RangerCompilerMessage e_25 = appCtx.parserErrors.get(i_217);
      final int line_index_7 = e_25.node.get().getLine();
      System.out.println(String.valueOf( (e_25.node.get().getFilename() + " Line: ") + (1 + line_index_7) ) );
      System.out.println(String.valueOf( e_25.description ) );
      System.out.println(String.valueOf( e_25.node.get().getLineString(line_index_7) ) );
    }
  }
}
