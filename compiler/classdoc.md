#CodeFile
**addImport (*import_name* ) : void**
**testCreateWriter () : CodeWriter**
**getImports () : **
**getWriter () : CodeWriter**
**getCode () : string**
#CodeFileSystem
**getFile (*path* *name* ) : CodeFile**
**mkdir (*path* ) : void**
**saveTo (*path* ) : void**
**printFilesList () : void**
#CodeSlice
**getCode () : string**
#CodeWriter
**addImport (*name* ) : void**
**indent (*delta* ) : void**
**addIndent () : void**
**createTag (*name* ) : CodeWriter**
**getTag (*name* ) : CodeWriter**
**hasTag (*name* ) : boolean**
**fork () : CodeWriter**
**newline () : void**
**writeSlice (*str* *newLine* ) : void**
**out (*str* *newLine* ) : void**
**getCode () : string**
#CodeWriterTester
**test1 () : void**
#DictNode
**EncodeString (*orig_str* ) : string**
**createEmptyObject () : DictNode**
**addObject (*key* ) : DictNode**
**addString (*key* *value* ) : void**
**getDoubleAt (*index* ) : double**
**getDouble (*key* ) : double**
**getStringAt (*index* ) : string**
**getString (*key* ) : string**
**getArray (*key* ) : DictNode**
**getArrayAt (*index* ) : DictNode**
**getObject (*key* ) : DictNode**
**getObjectAt (*index* ) : DictNode**
**walk () : void**
**stringify () : string**
#RangerAppFunctionDesc
#RangerAppTodo
#RangerCompilerMessage
#RangerAppParamDesc
**pointsToObject (*ctx* ) : boolean**
**isObject () : boolean**
**isArray () : boolean**
**isHash () : boolean**
**isPrimitive () : boolean**
**getRefTypeName () : string**
**getVarTypeName () : string**
**getTypeName () : string**
#RangerAppClassDesc
**hasMethod (*m_name* ) : boolean**
**findMethod (*f_name* ) : RangerAppFunctionDesc**
**hasStaticMethod (*m_name* ) : boolean**
**findStaticMethod (*f_name* ) : RangerAppFunctionDesc**
**findVariable (*f_name* ) : RangerAppParamDesc**
**addParentClass (*p_name* ) : void**
**addVariable (*desc* ) : void**
**addMethod (*desc* ) : void**
**addStaticMethod (*desc* ) : void**
#RangerNodeValue
#RangerBackReference
#RangerAppEnum
**add (*n* ) : void**
#RangerAppWriterContext
**getStrongLocals () : **
**getFileWriter (*path* *fileName* ) : CodeWriter**
**addTodo (*node* *descr* ) : void**
**setThisName (*the_name* ) : void**
**getThisName () : string**
**printLogs (*logName* ) : void**
**log (*node* *logName* *descr* ) : void**
**addMessage (*node* *descr* ) : void**
**addError (*node* *descr* ) : void**
**addTemplateClass (*name* *node* ) : void**
**hasTemplateNode (*name* ) : boolean**
**findTemplateNode (*name* ) : CodeNode**
**setStaticWriter (*className* *writer* ) : void**
**getStaticWriter (*className* ) : CodeWriter**
**isEnumDefined (*n* ) : boolean**
**getEnum (*n* ) : RangerAppEnum**
**isVarDefined (*name* ) : boolean**
**hasCompilerFlag (*s_name* ) : boolean**
**getCompilerSetting (*s_name* ) : string**
**hasCompilerSetting (*s_name* ) : boolean**
**getCompilerSetting (*s_name* ) : string**
**getVariableDef (*name* ) : RangerAppParamDesc**
**findFunctionCtx () : RangerAppWriterContext**
**getFnVarCnt (*name* ) : int**
**defineVariable (*name* *desc* ) : void**
**isDefinedClass (*name* ) : boolean**
**getRoot () : RangerAppWriterContext**
**getClasses () : **
**addClass (*name* *desc* ) : void**
**findClass (*name* ) : RangerAppClassDesc**
**hasClass (*name* ) : boolean**
**getCurrentMethod () : RangerAppFunctionDesc**
**getCurrentClass () : RangerAppClassDesc**
**isInExpression () : boolean**
**expressionLevel () : int**
**setInExpr () : void**
**unsetInExpr () : void**
**isInMethod () : boolean**
**setInMethod () : void**
**unsetInMethod () : void**
**fork () : RangerAppWriterContext**
#CodeNode
**moveOwnedToReturned () : void**
**copyRefToReturn (*node* ) : void**
**getInstancesFrom (*node* ) : void**
**getFilename () : string**
**getTypeInformationString () : string**
**getLine () : int**
**getLineString (*line_index* ) : string**
**getLineAsString () : string**
**getPositionalString () : string**
**isVariableDef () : boolean**
**isFunctionDef () : boolean**
**isFunctionCall () : boolean**
**isPrimitive () : boolean**
**isPrimitiveType () : boolean**
**getFirst () : CodeNode**
**getSecond () : CodeNode**
**getThird () : CodeNode**
**isSecondExpr () : boolean**
**getOperator () : string**
**getVRefAt (*idx* ) : string**
**getStringAt (*idx* ) : string**
**hasExpressionProperty (*name* ) : boolean**
**getExpressionProperty (*name* ) : CodeNode**
**hasIntProperty (*name* ) : boolean**
**getIntProperty (*name* ) : double**
**hasDoubleProperty (*name* ) : boolean**
**getDoubleProperty (*name* ) : double**
**hasStringProperty (*name* ) : boolean**
**getStringProperty (*name* ) : string**
**hasBooleanProperty (*name* ) : boolean**
**getBooleanProperty (*name* ) : boolean**
**isFirstTypeVref (*vrefName* ) : boolean**
**isFirstVref (*vrefName* ) : boolean**
**getString () : string**
**writeCode (*wr* ) : void**
**getCode () : string**
**walk () : void**
#SourceCode
**getLineString (*line_index* ) : string**
**getLine (*sp* ) : int**
#CodeExecState
#RangerContextEvent
**fire () : void**
#RangerContextEventContainer
**fire () : void**
#RangerContext
**fork () : RangerContext**
**getTypeOf (*key* ) : int**
**isString (*key* ) : boolean**
**isDouble (*key* ) : boolean**
**isInt (*key* ) : boolean**
**isBoolean (*key* ) : boolean**
**isDefinedString (*key* ) : boolean**
**isDefinedDouble (*key* ) : boolean**
**isDefinedInt (*key* ) : boolean**
**isDefinedBoolean (*key* ) : boolean**
**defineString (*key* ) : void**
**defineInt (*key* ) : void**
**defineBoolean (*key* ) : void**
**defineDouble (*key* ) : void**
**setString (*key* *value* ) : void**
**getString (*key* ) : string**
#RangerLispParser
**getCode () : string**
**parse_raw_annotation () : CodeNode**
**parse () : void**
#RangerAllocations
#RangerCommonWriter
**getWriterLang () : string**
**EncodeString (*orig_str* ) : string**
**cmdEnum (*node* *ctx* *wr* ) : void**
**findParamDesc (*obj* *ctx* *wr* ) : RangerAppParamDesc**
**areEqualTypes (*n1* *n2* *ctx* ) : boolean**
**shouldBeEqualTypes (*n1* *n2* *ctx* *msg* ) : void**
**shouldBeExpression (*n1* *ctx* *msg* ) : void**
**shouldHaveChildCnt (*cnt* *n1* *ctx* *msg* ) : void**
**shouldBeNumeric (*n1* *ctx* *msg* ) : void**
**shouldBeArray (*n1* *ctx* *msg* ) : void**
**shouldBeType (*type_name* *n1* *ctx* *msg* ) : void**
**cmdImport (*node* *ctx* *wr* ) : boolean**
**CreateClass (*node* *ctx* *wr* ) : **
**getThisName () : string**
**WriteThisVar (*node* *ctx* *wr* ) : void**
**WriteVRef (*node* *ctx* *wr* ) : void**
**Constructor (*node* *ctx* *wr* ) : **
**WriteScalarValue (*node* *ctx* *wr* ) : **
**cmdNew (*node* *ctx* *wr* ) : void**
**cmdLocalCall (*node* *ctx* *wr* ) : boolean**
**cmdCall (*node* *ctx* *wr* ) : void**
**cmdJoin (*node* *ctx* *wr* ) : void**
**cmdSplit (*node* *ctx* *wr* ) : void**
**cmdTrim (*node* *ctx* *wr* ) : void**
**cmdStrlen (*node* *ctx* *wr* ) : void**
**cmdSubstring (*node* *ctx* *wr* ) : void**
**cmdCharcode (*node* *ctx* *wr* ) : void**
**cmdStrfromcode (*node* *ctx* *wr* ) : void**
**cmdCharAt (*node* *ctx* *wr* ) : void**
**cmdStr2Int (*node* *ctx* *wr* ) : void**
**cmdStr2Double (*node* *ctx* *wr* ) : void**
**cmdDouble2Str (*node* *ctx* *wr* ) : void**
**cmdArrayLength (*node* *ctx* *wr* ) : void**
**cmdLog (*node* *ctx* *wr* ) : void**
**cmdPrint (*node* *ctx* *wr* ) : void**
**cmdDoc (*node* *ctx* *wr* ) : void**
**cmdContinue (*node* *ctx* *wr* ) : void**
**cmdBreak (*node* *ctx* *wr* ) : void**
**cmdThrow (*node* *ctx* *wr* ) : void**
**cmdReturn (*node* *ctx* *wr* ) : void**
**cmdRemoveIndex (*node* *ctx* *wr* ) : void**
**cmdIndexOf (*node* *ctx* *wr* ) : void**
**cmdExtractArray (*node* *ctx* *wr* ) : void**
**cmdRemoveLast (*node* *ctx* *wr* ) : void**
**cmdPush (*node* *ctx* *wr* ) : void**
**cmdItemAt (*node* *ctx* *wr* ) : void**
**cmdHas (*node* *ctx* *wr* ) : void**
**cmdSet (*node* *ctx* *wr* ) : void**
**cmdGet (*node* *ctx* *wr* ) : void**
**cmdIsNull (*node* *ctx* *wr* ) : void**
**cmdNotNull (*node* *ctx* *wr* ) : void**
**cmdAssign (*node* *ctx* *wr* ) : void**
**mathLibCalled (*node* *ctx* *wr* ) : void**
**cmdMathLibOp (*node* *ctx* *wr* ) : void**
**cmdComparisionOp (*node* *ctx* *wr* ) : void**
**cmdLogicOp (*node* *ctx* *wr* ) : void**
**cmdPlusOp (*node* *ctx* *wr* ) : void**
**cmdNumericOp (*node* *ctx* *wr* ) : void**
**cmdIf (*node* *ctx* *wr* ) : void**
**cmdFor (*node* *ctx* *wr* ) : void**
**cmdWhile (*node* *ctx* *wr* ) : void**
**cmdDefault (*node* *ctx* *wr* ) : void**
**cmdCase (*node* *ctx* *wr* ) : void**
**cmdSwitch (*node* *ctx* *wr* ) : void**
**cmdFileRead (*node* *ctx* *wr* ) : void**
**cmdFileWrite (*node* *ctx* *wr* ) : void**
**cmdIsDir (*node* *ctx* *wr* ) : void**
**cmdIsFile (*node* *ctx* *wr* ) : void**
**cmdCreateDir (*node* *ctx* *wr* ) : void**
**cmdArgv (*node* *ctx* *wr* ) : void**
**cmdArgvCnt (*node* *ctx* *wr* ) : void**
**PublicMethod (*node* *ctx* *wr* ) : void**
**StaticMethod (*node* *ctx* *wr* ) : void**
**WriteComment (*node* *ctx* *wr* ) : void**
**EnterTemplateClass (*node* *ctx* *wr* ) : void**
**EnterClass (*node* *ctx* *wr* ) : void**
**EnterMethod (*node* *ctx* *wr* ) : void**
**EnterStaticMethod (*node* *ctx* *wr* ) : void**
**EnterVarDef (*node* *ctx* *wr* ) : void**
**WalkNodeChildren (*node* *ctx* *wr* ) : boolean**
**WalkNode (*node* *ctx* *wr* ) : boolean**
**StartCodeWriting (*node* *ctx* *wr* ) : **
**FindWeakRefs (*node* *ctx* *wr* ) : void**
**CollectMethods (*node* *ctx* *wr* ) : void**
**DefineVar (*node* *ctx* *wr* ) : **
#RangerJavaScriptWriter
**getWriterLang () : string**
**cmdArgv (*node* *ctx* *wr* ) : void**
**cmdArgvCnt (*node* *ctx* *wr* ) : void**
**cmdFileRead (*node* *ctx* *wr* ) : void**
**cmdFileWrite (*node* *ctx* *wr* ) : void**
**cmdIsFile (*node* *ctx* *wr* ) : void**
**cmdIsDir (*node* *ctx* *wr* ) : void**
**cmdCreateDir (*node* *ctx* *wr* ) : void**
**PublicMethod (*node* *ctx* *wr* ) : void**
**CreateClass (*node* *ctx* *wr* ) : void**
**DefineVar (*node* *ctx* *wr* ) : void**
#RangerES5Writer
**getWriterLang () : string**
**cmdArgv (*node* *ctx* *wr* ) : void**
**cmdArgvCnt (*node* *ctx* *wr* ) : void**
**cmdFileRead (*node* *ctx* *wr* ) : void**
**cmdFileWrite (*node* *ctx* *wr* ) : void**
**cmdIsFile (*node* *ctx* *wr* ) : void**
**cmdIsDir (*node* *ctx* *wr* ) : void**
**cmdCreateDir (*node* *ctx* *wr* ) : void**
**PublicMethod (*node* *ctx* *wr* ) : void**
**StaticMethod (*node* *ctx* *orig_wr* ) : void**
**CreateClass (*node* *ctx* *wr* ) : void**
**DefineVar (*node* *ctx* *wr* ) : void**
#TestCodeCompiler
**display_errors () : void**
**display_todolist () : void**
**compile (*inputFileName* *language* *outputDirectory* *logMessageGroup* ) : void**
**test1 () : void**
