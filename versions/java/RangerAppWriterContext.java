import java.util.Optional;
import java.util.*;
import java.io.*;

class RangerAppWriterContext { 
  public Optional<CodeNode> langOperators = Optional.empty();
  public Optional<CodeNode> stdCommands = Optional.empty();
  public int intRootCounter = 1     /** note: unused */;
  public String targetLangName = "";
  public Optional<RangerAppWriterContext> parent = Optional.empty();
  public ArrayList<String> defined_imports = new ArrayList<String>()     /** note: unused */;
  public HashMap<String,Boolean> already_imported = new HashMap<String,Boolean>();
  public Optional<CodeFileSystem> fileSystem = Optional.empty();
  public boolean is_function = false;
  public boolean is_block = false     /** note: unused */;
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
  
  public boolean initStdCommands() {
    if ( stdCommands.isPresent() ) {
      return true;
    }
    if ( !langOperators.isPresent() ) {
      return true;
    }
    final Optional<CodeNode> main = langOperators;
    Optional<CodeNode> lang = Optional.empty();
    for ( int i_17 = 0; i_17 < main.get().children.size(); i_17++) {
      CodeNode m_4 = main.get().children.get(i_17);
      final CodeNode fc_8 = m_4.getFirst();
      if ( fc_8.vref.equals("language") ) {
        lang = Optional.of(m_4);
      }
    }
    /** unused:  final Optional<CodeNode> cmds = Optional.empty()   **/ ;
    final CodeNode langNodes = lang.get().children.get(1);
    for ( int i_22 = 0; i_22 < langNodes.children.size(); i_22++) {
      CodeNode lch = langNodes.children.get(i_22);
      final CodeNode fc_13 = lch.getFirst();
      if ( fc_13.vref.equals("commands") ) {
        /** unused:  final CodeNode n_2 = lch.getSecond()   **/ ;
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
    if ( (node.value_type == 6) && this.isDefinedType(node.array_type) ) {
      return true;
    }
    if ( ((node.value_type == 7) && this.isDefinedType(node.array_type)) && this.isPrimitiveType(node.key_type) ) {
      return true;
    }
    if ( this.isDefinedType(node.type_name) ) {
      return true;
    }
    this.addError(node, (((("Invalid or missing type definition: " + node.type_name) + " ") + node.key_type) + " ") + node.array_type);
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
    final RangerAppWriterContext root_4 = this.getRoot();
    root_4.initStdCommands();
    return root_4.stdCommands.get();
  }
  
  public RangerAppClassDesc findClassWithSign( CodeNode node ) {
    final RangerAppWriterContext root_6 = this.getRoot();
    final Optional<CodeNode> tplArgs = node.vref_annotation;
    final String sign = node.vref + tplArgs.get().getCode();
    final Optional<String> theName = Optional.ofNullable(root_6.classSignatures.get(sign));
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
    final RangerAppWriterContext root_8 = this.getRoot();
    if ( root_8.initStdCommands() ) {
      root_8.stdCommands.get().children.add(fromNode);
      /** unused:  final CodeNode fc_13 = fromNode.children.get(0)   **/ ;
    }
  }
  
  public CodeWriter getFileWriter( String path , String fileName ) {
    final RangerAppWriterContext root_10 = this.getRoot();
    final Optional<CodeFileSystem> fs = root_10.fileSystem;
    final CodeFile file = fs.get().getFile(path, fileName);
    Optional<CodeWriter> wr_2 = Optional.empty();
    wr_2 = file.getWriter();
    return wr_2.get();
  }
  
  public void addTodo( CodeNode node , String descr ) {
    final RangerAppTodo e_3 = new RangerAppTodo();
    e_3.description = descr;
    e_3.todonode = Optional.of(node);
    final RangerAppWriterContext root_12 = this.getRoot();
    root_12.todoList.add(e_3);
  }
  
  public void setThisName( String the_name ) {
    final RangerAppWriterContext root_14 = this.getRoot();
    root_14.thisName = the_name;
  }
  
  public String getThisName() {
    final RangerAppWriterContext root_16 = this.getRoot();
    return root_16.thisName;
  }
  
  public void printLogs( String logName ) {
  }
  
  public void log( CodeNode node , String logName , String descr ) {
  }
  
  public void addMessage( CodeNode node , String descr ) {
    final RangerCompilerMessage e_6 = new RangerCompilerMessage();
    e_6.description = descr;
    e_6.node = Optional.of(node);
    final RangerAppWriterContext root_18 = this.getRoot();
    root_18.compilerMessages.add(e_6);
  }
  
  public void addError( CodeNode targetnode , String descr ) {
    final RangerCompilerMessage e_8 = new RangerCompilerMessage();
    e_8.description = descr;
    e_8.node = Optional.of(targetnode);
    final RangerAppWriterContext root_20 = this.getRoot();
    root_20.compilerErrors.add(e_8);
  }
  
  public void addParserError( CodeNode targetnode , String descr ) {
    final RangerCompilerMessage e_10 = new RangerCompilerMessage();
    e_10.description = descr;
    e_10.node = Optional.of(targetnode);
    final RangerAppWriterContext root_22 = this.getRoot();
    root_22.parserErrors.add(e_10);
  }
  
  public void addTemplateClass( String name , CodeNode node ) {
    final RangerAppWriterContext root_24 = this.getRoot();
    root_24.templateClassList.add(name);
    root_24.templateClassNodes.put(name, node);
  }
  
  public boolean hasTemplateNode( String name ) {
    final RangerAppWriterContext root_26 = this.getRoot();
    return root_26.templateClassNodes.containsKey(name);
  }
  
  public CodeNode findTemplateNode( String name ) {
    final RangerAppWriterContext root_28 = this.getRoot();
    return (Optional.ofNullable(root_28.templateClassNodes.get(name))).get();
  }
  
  public void setStaticWriter( String className , CodeWriter writer ) {
    final RangerAppWriterContext root_30 = this.getRoot();
    root_30.classStaticWriters.put(className, writer);
  }
  
  public CodeWriter getStaticWriter( String className ) {
    final RangerAppWriterContext root_32 = this.getRoot();
    return (Optional.ofNullable(root_32.classStaticWriters.get(className))).get();
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
    int ii_4 = 0;
    if ( fnCtx.defCounts.containsKey(name) ) {
      ii_4 = (Optional.ofNullable(fnCtx.defCounts.get(name))).get();
      ii_4 = 1 + ii_4;
    } else {
      fnCtx.defCounts.put(name, ii_4);
      return 0;
    }
    boolean scope_has = this.isVarDefined(((name + "_") + ii_4));
    while (scope_has) {
      ii_4 = 1 + ii_4;
      scope_has = this.isVarDefined(((name + "_") + ii_4));
    }
    fnCtx.defCounts.put(name, ii_4);
    return ii_4;
  }
  
  public void debugVars() {
    System.out.println(String.valueOf( "--- context vars ---" ) );
    for ( int i_22 = 0; i_22 < localVarNames.size(); i_22++) {
      String na = localVarNames.get(i_22);
      System.out.println(String.valueOf( "var => " + na ) );
    }
    if ( parent.isPresent() ) {
      parent.get().debugVars();
    }
  }
  
  public int getVarTotalCnt( String name ) {
    final RangerAppWriterContext fnCtx_4 = this;
    int ii_6 = 0;
    if ( fnCtx_4.defCounts.containsKey(name) ) {
      ii_6 = (Optional.ofNullable(fnCtx_4.defCounts.get(name))).get();
    }
    if ( fnCtx_4.parent.isPresent() ) {
      ii_6 = ii_6 + fnCtx_4.parent.get().getVarTotalCnt(name);
    }
    if ( this.isVarDefined(name) ) {
      ii_6 = ii_6 + 1;
    }
    return ii_6;
  }
  
  public int getFnVarCnt2( String name ) {
    final RangerAppWriterContext fnCtx_6 = this;
    int ii_8 = 0;
    if ( fnCtx_6.defCounts.containsKey(name) ) {
      ii_8 = (Optional.ofNullable(fnCtx_6.defCounts.get(name))).get();
      ii_8 = 1 + ii_8;
      fnCtx_6.defCounts.put(name, ii_8);
    } else {
      fnCtx_6.defCounts.put(name, 1);
    }
    if ( fnCtx_6.parent.isPresent() ) {
      ii_8 = ii_8 + fnCtx_6.parent.get().getFnVarCnt2(name);
    }
    final boolean scope_has_4 = this.isVarDefined(name);
    if ( scope_has_4 ) {
      ii_8 = 1 + ii_8;
    }
    boolean scope_has_9 = this.isVarDefined(((name + "_") + ii_8));
    while (scope_has_9) {
      ii_8 = 1 + ii_8;
      scope_has_9 = this.isVarDefined(((name + "_") + ii_8));
    }
    return ii_8;
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
    int cnt_2 = 0;
    if ( false == (((desc.varType == 8) || (desc.varType == 4)) || (desc.varType == 10)) ) {
      cnt_2 = this.getFnVarCnt2(name);
    }
    if ( 0 == cnt_2 ) {
      desc.compiledName = name;
    } else {
      desc.compiledName = (name + "_") + cnt_2;
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
    for ( int i_24 = 0; i_24 < definedClassList.size(); i_24++) {
      String n_5 = definedClassList.get(i_24);
      list.add((Optional.ofNullable(definedClasses.get(n_5))).get());
    }
    return list;
  }
  
  public void addClass( String name , RangerAppClassDesc desc ) {
    final RangerAppWriterContext root_34 = this.getRoot();
    if ( root_34.definedClasses.containsKey(name) ) {
      System.out.println(String.valueOf( ("ERROR: class " + name) + " already defined" ) );
    } else {
      root_34.definedClasses.put(name, desc);
      root_34.definedClassList.add(name);
    }
  }
  
  public RangerAppClassDesc findClass( String name ) {
    final RangerAppWriterContext root_36 = this.getRoot();
    return (Optional.ofNullable(root_36.definedClasses.get(name))).get();
  }
  
  public boolean hasClass( String name ) {
    final RangerAppWriterContext root_38 = this.getRoot();
    return root_38.definedClasses.containsKey(name);
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
    int cnt_5 = compilerErrors.size();
    if ( parent.isPresent()) {
      cnt_5 = cnt_5 + parent.get().getErrorCount();
    }
    return cnt_5;
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
  
  public RangerAppWriterContext fork() {
    final RangerAppWriterContext new_ctx = new RangerAppWriterContext();
    new_ctx.parent = Optional.of(this);
    return new_ctx;
  }
}
