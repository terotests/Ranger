import java.util.Optional;
import java.util.*;
import java.io.*;

class RangerAppWriterContext { 
  public Optional<CodeNode> langOperators = Optional.empty();
  public Optional<CodeNode> stdCommands = Optional.empty();
  public Optional<CodeNode> reservedWords = Optional.empty();
  public int intRootCounter = 1     /** note: unused */;
  public String targetLangName = "";
  public Optional<RangerAppWriterContext> parent = Optional.empty();
  public ArrayList<String> defined_imports = new ArrayList<String>()     /** note: unused */;
  public HashMap<String,Boolean> already_imported = new HashMap<String,Boolean>();
  public Optional<CodeFileSystem> fileSystem = Optional.empty();
  public boolean is_function = false;
  public boolean class_level_context = false;
  public boolean function_level_context = false;
  public boolean in_main = false;
  public boolean is_block = false     /** note: unused */;
  public boolean is_capturing = false;
  public ArrayList<String> captured_variables = new ArrayList<String>();
  public boolean has_block_exited = false     /** note: unused */;
  public boolean in_expression = false     /** note: unused */;
  public ArrayList<Boolean> expr_stack = new ArrayList<Boolean>();
  public boolean expr_restart = false;
  public boolean in_method = false     /** note: unused */;
  public ArrayList<Boolean> method_stack = new ArrayList<Boolean>();
  public ArrayList<String> typeNames = new ArrayList<String>()     /** note: unused */;
  public HashMap<String,RangerTypeClass> typeClasses = new HashMap<String,RangerTypeClass>()     /** note: unused */;
  public Optional<String> currentClassName = Optional.empty()     /** note: unused */;
  public boolean in_class = false;
  public boolean in_static_method = false;
  public Optional<RangerAppClassDesc> currentClass = Optional.empty();
  public Optional<RangerAppFunctionDesc> currentMethod = Optional.empty();
  public String thisName = "this";
  public HashMap<String,RangerAppEnum> definedEnums = new HashMap<String,RangerAppEnum>();
  public HashMap<String,RangerAppClassDesc> definedInterfaces = new HashMap<String,RangerAppClassDesc>()     /** note: unused */;
  public ArrayList<String> definedInterfaceList = new ArrayList<String>()     /** note: unused */;
  public HashMap<String,RangerAppClassDesc> definedClasses = new HashMap<String,RangerAppClassDesc>();
  public ArrayList<String> definedClassList = new ArrayList<String>();
  public HashMap<String,CodeNode> templateClassNodes = new HashMap<String,CodeNode>();
  public ArrayList<String> templateClassList = new ArrayList<String>();
  public HashMap<String,String> classSignatures = new HashMap<String,String>();
  public HashMap<String,String> classToSignature = new HashMap<String,String>();
  public HashMap<String,RangerAppClassDesc> templateClasses = new HashMap<String,RangerAppClassDesc>()     /** note: unused */;
  public HashMap<String,CodeWriter> classStaticWriters = new HashMap<String,CodeWriter>();
  public HashMap<String,RangerAppParamDesc> localVariables = new HashMap<String,RangerAppParamDesc>();
  public ArrayList<String> localVarNames = new ArrayList<String>();
  public HashMap<String,Boolean> compilerFlags = new HashMap<String,Boolean>();
  public HashMap<String,String> compilerSettings = new HashMap<String,String>();
  public ArrayList<RangerCompilerMessage> parserErrors = new ArrayList<RangerCompilerMessage>();
  public ArrayList<RangerCompilerMessage> compilerErrors = new ArrayList<RangerCompilerMessage>();
  public ArrayList<RangerCompilerMessage> compilerMessages = new ArrayList<RangerCompilerMessage>();
  public HashMap<String,RangerCompilerMessage> compilerLog = new HashMap<String,RangerCompilerMessage>()     /** note: unused */;
  public ArrayList<RangerAppTodo> todoList = new ArrayList<RangerAppTodo>();
  public HashMap<String,Boolean> definedMacro = new HashMap<String,Boolean>()     /** note: unused */;
  public HashMap<String,Integer> defCounts = new HashMap<String,Integer>();
  public HashMap<String,String> refTransform = new HashMap<String,String>();
  public String rootFile = "--not-defined--";
  
  public boolean isCapturing() {
    if ( is_capturing ) {
      return true;
    }
    if ( parent.isPresent()) {
      return parent.get().isCapturing();
    }
    return false;
  }
  
  public boolean isLocalToCapture( String name ) {
    if ( localVariables.containsKey(name) ) {
      return true;
    }
    if ( is_capturing ) {
      return false;
    }
    if ( parent.isPresent()) {
      return parent.get().isLocalToCapture(name);
    }
    return false;
  }
  
  public void addCapturedVariable( String name ) {
    if ( is_capturing ) {
      if ( (captured_variables.indexOf(name)) < 0 ) {
        captured_variables.add(name);
      }
      return;
    }
    if ( parent.isPresent()) {
      parent.get().addCapturedVariable(name);
    }
  }
  
  public ArrayList<String> getCapturedVariables() {
    if ( is_capturing ) {
      return captured_variables;
    }
    if ( parent.isPresent()) {
      final ArrayList<String> r = parent.get().getCapturedVariables();
      return r;
    }
    final ArrayList<String> res = new ArrayList<String>();
    return res;
  }
  
  public String transformWord( String input_word ) {
    final RangerAppWriterContext root = this.getRoot();
    root.initReservedWords();
    if ( refTransform.containsKey(input_word) ) {
      return (Optional.ofNullable(refTransform.get(input_word))).get();
    }
    return input_word;
  }
  
  public boolean initReservedWords() {
    if ( reservedWords.isPresent() ) {
      return true;
    }
    final Optional<CodeNode> main = langOperators;
    Optional<CodeNode> lang = Optional.empty();
    for ( int i = 0; i < main.get().children.size(); i++) {
      CodeNode m = main.get().children.get(i);
      final CodeNode fc = m.getFirst();
      if ( fc.vref.equals("language") ) {
        lang = Optional.of(m);
      }
    }
    /** unused:  final Optional<CodeNode> cmds = Optional.empty()   **/ ;
    final CodeNode langNodes = lang.get().children.get(1);
    for ( int i_1 = 0; i_1 < langNodes.children.size(); i_1++) {
      CodeNode lch = langNodes.children.get(i_1);
      final CodeNode fc_1 = lch.getFirst();
      if ( fc_1.vref.equals("reserved_words") ) {
        /** unused:  final CodeNode n = lch.getSecond()   **/ ;
        reservedWords = Optional.of(lch.getSecond());
        for ( int i_2 = 0; i_2 < reservedWords.get().children.size(); i_2++) {
          CodeNode ch = reservedWords.get().children.get(i_2);
          final CodeNode word = ch.getFirst();
          final CodeNode transform = ch.getSecond();
          refTransform.put(word.vref, transform.vref);
        }
      }
    }
    return true;
  }
  
  public boolean initStdCommands() {
    if ( stdCommands.isPresent() ) {
      return true;
    }
    if ( !langOperators.isPresent() ) {
      return true;
    }
    final Optional<CodeNode> main = langOperators;
    Optional<CodeNode> lang = Optional.empty();
    for ( int i = 0; i < main.get().children.size(); i++) {
      CodeNode m = main.get().children.get(i);
      final CodeNode fc = m.getFirst();
      if ( fc.vref.equals("language") ) {
        lang = Optional.of(m);
      }
    }
    /** unused:  final Optional<CodeNode> cmds = Optional.empty()   **/ ;
    final CodeNode langNodes = lang.get().children.get(1);
    for ( int i_1 = 0; i_1 < langNodes.children.size(); i_1++) {
      CodeNode lch = langNodes.children.get(i_1);
      final CodeNode fc_1 = lch.getFirst();
      if ( fc_1.vref.equals("commands") ) {
        /** unused:  final CodeNode n = lch.getSecond()   **/ ;
        stdCommands = Optional.of(lch.getSecond());
      }
    }
    return true;
  }
  
  public String transformTypeName( String typeName ) {
    if ( this.isPrimitiveType(typeName) ) {
      return typeName;
    }
    if ( this.isEnumDefined(typeName) ) {
      return typeName;
    }
    if ( this.isDefinedClass(typeName) ) {
      final RangerAppClassDesc cl = this.findClass(typeName);
      if ( cl.is_system ) {
        return (Optional.ofNullable(cl.systemNames.get(this.getTargetLang()))).get();
      }
    }
    return typeName;
  }
  
  public boolean isPrimitiveType( String typeName ) {
    if ( (((((typeName.equals("double")) || (typeName.equals("string"))) || (typeName.equals("int"))) || (typeName.equals("char"))) || (typeName.equals("charbuffer"))) || (typeName.equals("boolean")) ) {
      return true;
    }
    return false;
  }
  
  public boolean isDefinedType( String typeName ) {
    if ( (((((typeName.equals("double")) || (typeName.equals("string"))) || (typeName.equals("int"))) || (typeName.equals("char"))) || (typeName.equals("charbuffer"))) || (typeName.equals("boolean")) ) {
      return true;
    }
    if ( this.isEnumDefined(typeName) ) {
      return true;
    }
    if ( this.isDefinedClass(typeName) ) {
      return true;
    }
    return false;
  }
  
  public boolean hadValidType( CodeNode node ) {
    if ( node.isPrimitiveType() || node.isPrimitive() ) {
      return true;
    }
    if ( node.value_type == 6 ) {
      if ( this.isDefinedType(node.array_type) ) {
        return true;
      } else {
        this.addError(node, "Unknown type for array values: " + node.array_type);
        return false;
      }
    }
    if ( node.value_type == 7 ) {
      if ( this.isDefinedType(node.array_type) && this.isPrimitiveType(node.key_type) ) {
        return true;
      } else {
        if ( this.isDefinedType(node.array_type) == false ) {
          this.addError(node, "Unknown type for map values: " + node.array_type);
        }
        if ( this.isDefinedType(node.array_type) == false ) {
          this.addError(node, "Unknown type for map keys: " + node.key_type);
        }
        return false;
      }
    }
    if ( this.isDefinedType(node.type_name) ) {
      return true;
    } else {
      if ( node.value_type == 15 ) {
      } else {
        this.addError(node, (("Unknown type: " + node.type_name) + " type ID : ") + node.value_type);
      }
    }
    return false;
  }
  
  public String getTargetLang() {
    if ( (targetLangName.length()) > 0 ) {
      return targetLangName;
    }
    if ( parent.isPresent()) {
      return parent.get().getTargetLang();
    }
    return "ranger";
  }
  
  public CodeNode findOperator( CodeNode node ) {
    final RangerAppWriterContext root = this.getRoot();
    root.initStdCommands();
    return root.stdCommands.get().children.get(node.op_index);
  }
  
  public CodeNode getStdCommands() {
    final RangerAppWriterContext root = this.getRoot();
    root.initStdCommands();
    return root.stdCommands.get();
  }
  
  public RangerAppClassDesc findClassWithSign( CodeNode node ) {
    final RangerAppWriterContext root = this.getRoot();
    final Optional<CodeNode> tplArgs = node.vref_annotation;
    final String sign = node.vref + tplArgs.get().getCode();
    final Optional<String> theName = Optional.ofNullable(root.classSignatures.get(sign));
    return this.findClass((theName.get()));
  }
  
  public String createSignature( String origClass , String classSig ) {
    if ( classSignatures.containsKey(classSig) ) {
      return (Optional.ofNullable(classSignatures.get(classSig))).get();
    }
    int ii = 1;
    String sigName = (origClass + "V") + ii;
    while (classToSignature.containsKey(sigName)) {
      ii = ii + 1;
      sigName = (origClass + "V") + ii;
    }
    classToSignature.put(sigName, classSig);
    classSignatures.put(classSig, sigName);
    return sigName;
  }
  
  public void createOperator( CodeNode fromNode ) {
    final RangerAppWriterContext root = this.getRoot();
    if ( root.initStdCommands() ) {
      root.stdCommands.get().children.add(fromNode);
      /** unused:  final CodeNode fc = fromNode.children.get(0)   **/ ;
    }
  }
  
  public CodeWriter getFileWriter( String path , String fileName ) {
    final RangerAppWriterContext root = this.getRoot();
    final Optional<CodeFileSystem> fs = root.fileSystem;
    final CodeFile file = fs.get().getFile(path, fileName);
    Optional<CodeWriter> wr = Optional.empty();
    wr = file.getWriter();
    return wr.get();
  }
  
  public void addTodo( CodeNode node , String descr ) {
    final RangerAppTodo e = new RangerAppTodo();
    e.description = descr;
    e.todonode = Optional.of(node);
    final RangerAppWriterContext root = this.getRoot();
    root.todoList.add(e);
  }
  
  public void setThisName( String the_name ) {
    final RangerAppWriterContext root = this.getRoot();
    root.thisName = the_name;
  }
  
  public String getThisName() {
    final RangerAppWriterContext root = this.getRoot();
    return root.thisName;
  }
  
  public void printLogs( String logName ) {
  }
  
  public void log( CodeNode node , String logName , String descr ) {
  }
  
  public void addMessage( CodeNode node , String descr ) {
    final RangerCompilerMessage e = new RangerCompilerMessage();
    e.description = descr;
    e.node = Optional.of(node);
    final RangerAppWriterContext root = this.getRoot();
    root.compilerMessages.add(e);
  }
  
  public void addError( CodeNode targetnode , String descr ) {
    final RangerCompilerMessage e = new RangerCompilerMessage();
    e.description = descr;
    e.node = Optional.of(targetnode);
    final RangerAppWriterContext root = this.getRoot();
    root.compilerErrors.add(e);
  }
  
  public void addParserError( CodeNode targetnode , String descr ) {
    final RangerCompilerMessage e = new RangerCompilerMessage();
    e.description = descr;
    e.node = Optional.of(targetnode);
    final RangerAppWriterContext root = this.getRoot();
    root.parserErrors.add(e);
  }
  
  public void addTemplateClass( String name , CodeNode node ) {
    final RangerAppWriterContext root = this.getRoot();
    root.templateClassList.add(name);
    root.templateClassNodes.put(name, node);
  }
  
  public boolean hasTemplateNode( String name ) {
    final RangerAppWriterContext root = this.getRoot();
    return root.templateClassNodes.containsKey(name);
  }
  
  public CodeNode findTemplateNode( String name ) {
    final RangerAppWriterContext root = this.getRoot();
    return (Optional.ofNullable(root.templateClassNodes.get(name))).get();
  }
  
  public void setStaticWriter( String className , CodeWriter writer ) {
    final RangerAppWriterContext root = this.getRoot();
    root.classStaticWriters.put(className, writer);
  }
  
  public CodeWriter getStaticWriter( String className ) {
    final RangerAppWriterContext root = this.getRoot();
    return (Optional.ofNullable(root.classStaticWriters.get(className))).get();
  }
  
  public boolean isEnumDefined( String n ) {
    if ( definedEnums.containsKey(n) ) {
      return true;
    }
    if ( !parent.isPresent() ) {
      return false;
    }
    return parent.get().isEnumDefined(n);
  }
  
  public Optional<RangerAppEnum> getEnum( String n ) {
    if ( definedEnums.containsKey(n) ) {
      return Optional.ofNullable(definedEnums.get(n));
    }
    if ( parent.isPresent() ) {
      return parent.get().getEnum(n);
    }
    final Optional<RangerAppEnum> none = Optional.empty();
    return Optional.ofNullable((none.isPresent() ? (RangerAppEnum)none.get() : null ) );
  }
  
  public boolean isVarDefined( String name ) {
    if ( localVariables.containsKey(name) ) {
      return true;
    }
    if ( !parent.isPresent() ) {
      return false;
    }
    return parent.get().isVarDefined(name);
  }
  
  public void setCompilerFlag( String name , boolean value ) {
    compilerFlags.put(name, value);
  }
  
  public boolean hasCompilerFlag( String s_name ) {
    if ( compilerFlags.containsKey(s_name) ) {
      return (Optional.ofNullable(compilerFlags.get(s_name))).get();
    }
    if ( !parent.isPresent() ) {
      return false;
    }
    return parent.get().hasCompilerFlag(s_name);
  }
  
  public String getCompilerSetting( String s_name ) {
    if ( compilerSettings.containsKey(s_name) ) {
      return (Optional.ofNullable(compilerSettings.get(s_name))).get();
    }
    if ( !parent.isPresent() ) {
      return "";
    }
    return parent.get().getCompilerSetting(s_name);
  }
  
  public boolean hasCompilerSetting( String s_name ) {
    if ( compilerSettings.containsKey(s_name) ) {
      return true;
    }
    if ( !parent.isPresent() ) {
      return false;
    }
    return parent.get().hasCompilerSetting(s_name);
  }
  
  public RangerAppParamDesc getVariableDef( String name ) {
    if ( localVariables.containsKey(name) ) {
      return (Optional.ofNullable(localVariables.get(name))).get();
    }
    if ( !parent.isPresent() ) {
      final RangerAppParamDesc tmp = new RangerAppParamDesc();
      return tmp;
    }
    return parent.get().getVariableDef(name);
  }
  
  public RangerAppWriterContext findFunctionCtx() {
    if ( is_function ) {
      return this;
    }
    if ( !parent.isPresent() ) {
      return this;
    }
    return parent.get().findFunctionCtx();
  }
  
  public int getFnVarCnt( String name ) {
    final RangerAppWriterContext fnCtx = this.findFunctionCtx();
    int ii = 0;
    if ( fnCtx.defCounts.containsKey(name) ) {
      ii = (Optional.ofNullable(fnCtx.defCounts.get(name))).get();
      ii = 1 + ii;
    } else {
      fnCtx.defCounts.put(name, ii);
      return 0;
    }
    boolean scope_has = this.isVarDefined(((name + "_") + ii));
    while (scope_has) {
      ii = 1 + ii;
      scope_has = this.isVarDefined(((name + "_") + ii));
    }
    fnCtx.defCounts.put(name, ii);
    return ii;
  }
  
  public void debugVars() {
    System.out.println(String.valueOf( "--- context vars ---" ) );
    for ( int i = 0; i < localVarNames.size(); i++) {
      String na = localVarNames.get(i);
      System.out.println(String.valueOf( "var => " + na ) );
    }
    if ( parent.isPresent() ) {
      parent.get().debugVars();
    }
  }
  
  public int getVarTotalCnt( String name ) {
    final RangerAppWriterContext fnCtx = this;
    int ii = 0;
    if ( fnCtx.defCounts.containsKey(name) ) {
      ii = (Optional.ofNullable(fnCtx.defCounts.get(name))).get();
    }
    if ( fnCtx.parent.isPresent() ) {
      ii = ii + fnCtx.parent.get().getVarTotalCnt(name);
    }
    if ( this.isVarDefined(name) ) {
      ii = ii + 1;
    }
    return ii;
  }
  
  public int getFnVarCnt2( String name ) {
    final RangerAppWriterContext fnCtx = this;
    int ii = 0;
    if ( fnCtx.defCounts.containsKey(name) ) {
      ii = (Optional.ofNullable(fnCtx.defCounts.get(name))).get();
      ii = 1 + ii;
      fnCtx.defCounts.put(name, ii);
    } else {
      fnCtx.defCounts.put(name, 1);
    }
    if ( fnCtx.parent.isPresent() ) {
      ii = ii + fnCtx.parent.get().getFnVarCnt2(name);
    }
    final boolean scope_has = this.isVarDefined(name);
    if ( scope_has ) {
      ii = 1 + ii;
    }
    boolean scope_has_2 = this.isVarDefined(((name + "_") + ii));
    while (scope_has_2) {
      ii = 1 + ii;
      scope_has_2 = this.isVarDefined(((name + "_") + ii));
    }
    return ii;
  }
  
  public int getFnVarCnt3( String name ) {
    final Optional<RangerAppWriterContext> classLevel = this.findMethodLevelContext();
    final RangerAppWriterContext fnCtx = this;
    int ii = 0;
    if ( fnCtx.defCounts.containsKey(name) ) {
      ii = (Optional.ofNullable(fnCtx.defCounts.get(name))).get();
      fnCtx.defCounts.put(name, ii + 1);
    } else {
      fnCtx.defCounts.put(name, 1);
    }
    if ( classLevel.get().isVarDefined(name) ) {
      ii = ii + 1;
    }
    boolean scope_has = this.isVarDefined(((name + "_") + ii));
    while (scope_has) {
      ii = 1 + ii;
      scope_has = this.isVarDefined(((name + "_") + ii));
    }
    return ii;
  }
  
  public boolean isMemberVariable( String name ) {
    if ( this.isVarDefined(name) ) {
      final RangerAppParamDesc vDef = this.getVariableDef(name);
      if ( vDef.varType == 8 ) {
        return true;
      }
    }
    return false;
  }
  
  public void defineVariable( String name , RangerAppParamDesc desc ) {
    int cnt = 0;
    final Optional<RangerAppWriterContext> fnLevel = this.findMethodLevelContext();
    if ( false == (((desc.varType == 8) || (desc.varType == 4)) || (desc.varType == 10)) ) {
      cnt = fnLevel.get().getFnVarCnt3(name);
    }
    if ( 0 == cnt ) {
      if ( name.equals("len") ) {
        desc.compiledName = "__len";
      } else {
        desc.compiledName = name;
      }
    } else {
      desc.compiledName = (name + "_") + cnt;
    }
    localVariables.put(name, desc);
    localVarNames.add(name);
  }
  
  public boolean isDefinedClass( String name ) {
    if ( definedClasses.containsKey(name) ) {
      return true;
    } else {
      if ( parent.isPresent() ) {
        return parent.get().isDefinedClass(name);
      }
    }
    return false;
  }
  
  public RangerAppWriterContext getRoot() {
    if ( !parent.isPresent() ) {
      return this;
    }
    return parent.get().getRoot();
  }
  
  public ArrayList<RangerAppClassDesc> getClasses() {
    ArrayList<RangerAppClassDesc> list = new ArrayList<RangerAppClassDesc>();
    for ( int i = 0; i < definedClassList.size(); i++) {
      String n = definedClassList.get(i);
      list.add((Optional.ofNullable(definedClasses.get(n))).get());
    }
    return list;
  }
  
  public void addClass( String name , RangerAppClassDesc desc ) {
    final RangerAppWriterContext root = this.getRoot();
    if ( root.definedClasses.containsKey(name) ) {
    } else {
      root.definedClasses.put(name, desc);
      root.definedClassList.add(name);
    }
  }
  
  public RangerAppClassDesc findClass( String name ) {
    final RangerAppWriterContext root = this.getRoot();
    return (Optional.ofNullable(root.definedClasses.get(name))).get();
  }
  
  public boolean hasClass( String name ) {
    final RangerAppWriterContext root = this.getRoot();
    return root.definedClasses.containsKey(name);
  }
  
  public RangerAppFunctionDesc getCurrentMethod() {
    if ( currentMethod.isPresent() ) {
      return currentMethod.get();
    }
    if ( parent.isPresent() ) {
      return parent.get().getCurrentMethod();
    }
    return new RangerAppFunctionDesc();
  }
  
  public void setCurrentClass( RangerAppClassDesc cc ) {
    in_class = true;
    currentClass = Optional.of(cc);
  }
  
  public void disableCurrentClass() {
    if ( in_class ) {
      in_class = false;
    }
    if ( parent.isPresent() ) {
      parent.get().disableCurrentClass();
    }
  }
  
  public boolean hasCurrentClass() {
    if ( in_class && (currentClass.isPresent()) ) {
      return true;
    }
    if ( parent.isPresent() ) {
      return parent.get().hasCurrentClass();
    }
    return false;
  }
  
  public Optional<RangerAppClassDesc> getCurrentClass() {
    if ( in_class && (currentClass.isPresent()) ) {
      return Optional.ofNullable((currentClass.isPresent() ? (RangerAppClassDesc)currentClass.get() : null ) );
    }
    if ( parent.isPresent() ) {
      return parent.get().getCurrentClass();
    }
    final Optional<RangerAppClassDesc> non = Optional.empty();
    return Optional.ofNullable((non.isPresent() ? (RangerAppClassDesc)non.get() : null ) );
  }
  
  public void restartExpressionLevel() {
    expr_restart = true;
  }
  
  public boolean isInExpression() {
    if ( (expr_stack.size()) > 0 ) {
      return true;
    }
    if ( (parent.isPresent()) && (expr_restart == false) ) {
      return parent.get().isInExpression();
    }
    return false;
  }
  
  public int expressionLevel() {
    final int level = expr_stack.size();
    if ( (parent.isPresent()) && (expr_restart == false) ) {
      return level + parent.get().expressionLevel();
    }
    return level;
  }
  
  public void setInExpr() {
    expr_stack.add(true);
  }
  
  public void unsetInExpr() {
    expr_stack.remove(expr_stack.size() - 1);
  }
  
  public int getErrorCount() {
    int cnt = compilerErrors.size();
    if ( parent.isPresent()) {
      cnt = cnt + parent.get().getErrorCount();
    }
    return cnt;
  }
  
  public boolean isInStatic() {
    if ( in_static_method ) {
      return true;
    }
    if ( parent.isPresent()) {
      return parent.get().isInStatic();
    }
    return false;
  }
  
  public boolean isInMain() {
    if ( in_main ) {
      return true;
    }
    if ( parent.isPresent()) {
      return parent.get().isInMain();
    }
    return false;
  }
  
  public boolean isInMethod() {
    if ( (method_stack.size()) > 0 ) {
      return true;
    }
    if ( parent.isPresent() ) {
      return parent.get().isInMethod();
    }
    return false;
  }
  
  public void setInMethod() {
    method_stack.add(true);
  }
  
  public void unsetInMethod() {
    method_stack.remove(method_stack.size() - 1);
  }
  
  public Optional<RangerAppWriterContext> findMethodLevelContext() {
    Optional<RangerAppWriterContext> res = Optional.empty();
    if ( function_level_context ) {
      res = Optional.of(this);
      return Optional.ofNullable((res.isPresent() ? (RangerAppWriterContext)res.get() : null ) );
    }
    if ( parent.isPresent()) {
      return parent.get().findMethodLevelContext();
    }
    res = Optional.of(this);
    return Optional.ofNullable((res.isPresent() ? (RangerAppWriterContext)res.get() : null ) );
  }
  
  public Optional<RangerAppWriterContext> findClassLevelContext() {
    Optional<RangerAppWriterContext> res = Optional.empty();
    if ( class_level_context ) {
      res = Optional.of(this);
      return Optional.ofNullable((res.isPresent() ? (RangerAppWriterContext)res.get() : null ) );
    }
    if ( parent.isPresent()) {
      return parent.get().findClassLevelContext();
    }
    res = Optional.of(this);
    return Optional.ofNullable((res.isPresent() ? (RangerAppWriterContext)res.get() : null ) );
  }
  
  public RangerAppWriterContext fork() {
    final RangerAppWriterContext new_ctx = new RangerAppWriterContext();
    new_ctx.parent = Optional.of(this);
    return new_ctx;
  }
  
  public String getRootFile() {
    final RangerAppWriterContext root = this.getRoot();
    return root.rootFile;
  }
  
  public void setRootFile( String file_name ) {
    final RangerAppWriterContext root = this.getRoot();
    root.rootFile = file_name;
  }
}
