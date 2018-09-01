#!/usr/bin/env node
declare type union_Any = CmdParams | test_cmdparams | InputFSFolder | InputFSFile | InputEnv | test_input_filesystem | RangerAppTodo | RangerCompilerMessage | RangerParamEventHandler | RangerParamEventList | RangerParamEventMap | RangerAppArrayValue | RangerAppHashValue | RangerAppValue | RangerRefForce | RangerAppParamDesc | RangerAppFunctionDesc | RangerAppMethodVariants | RangerAppInterfaceImpl | RangerTraitParams | RangerAppClassDesc | RangerTypeClass | SourceCode | CodeNodeLiteral | CodeNode | TypeCounts | RangerNodeValue | RangerBackReference | RangerAppEnum | OpFindResult | RangerOperatorList | RangerNodeList | ContextTransaction | ContextTransactionMutation | RangerRegisteredPlugin | RangerAppWriterContext | CodeFile | CodeFileSystem | CodeSlice | CodeWriter | RangerLispParser | RangerArgMatch | DictNode | RangerSerializeClass | RangerImmutableExtension | RangerServiceBuilder | RangerAppOperatorDesc | TFiles | TTypes | ClassJoinPoint | WalkLater | RangerFlowParser | TFactory | CallChain | NodeEvalState | RangerGenericClassWriter | AndroidPageWriter | RangerJava7ClassWriter | RangerSwift3ClassWriter | RangerCppClassWriter | RangerKotlinClassWriter | RangerCSharpClassWriter | RangerScalaClassWriter | RangerGolangClassWriter | RangerPHPClassWriter | WebPageWriter | RangerJavaScriptClassWriter | RangerRangerClassWriter | OpList | RangerActiveOperators | LiveCompiler | ColorConsole | RangerDocGenerator | viewbuilder_Android | viewbuilder_Web | CompilerResults | VirtualCompiler | CompilerInterface | number | string | boolean | number;
export declare class CmdParams {
    flags: {
        [key: string]: boolean;
    };
    params: {
        [key: string]: string;
    };
    values: Array<string>;
    constructor();
    hasParam(name: string): boolean;
    getParam(name: string): string;
    collect(): void;
    toDictionary(): Object;
    static fromDictionary(dict: Object): Promise<CmdParams>;
}
export declare class test_cmdparams {
    constructor();
    run(): void;
}
export declare class InputFSFolder {
    name: string;
    data: string;
    is_folder: boolean;
    base64bin: boolean;
    folders: Array<InputFSFolder>;
    files: Array<InputFSFile>;
    constructor();
    forTree(cb: (item: InputFSFolder) => void): void;
    toDictionary(): Object;
    static fromDictionary(dict: Object): Promise<InputFSFolder>;
}
export declare class InputFSFile {
    name: string;
    data: string;
    is_folder: boolean;
    base64bin: boolean;
    constructor();
    toDictionary(): Object;
    static fromDictionary(dict: Object): InputFSFile;
}
export declare class InputEnv {
    use_real: boolean;
    filesystem: InputFSFolder;
    envVars: {
        [key: string]: string;
    };
    commandLine: CmdParams;
    constructor();
    setEnv(name: string, value: string): void;
    toDictionary(): Object;
    static fromDictionary(dict: Object): Promise<InputEnv>;
}
export declare class test_input_filesystem {
    constructor();
}
export declare class RangerAppTodo {
    description: string;
    todonode: CodeNode;
    constructor();
}
export declare class RangerCompilerMessage {
    error_level: number;
    code_line: number;
    fileName: string;
    description: string;
    node: CodeNode;
    constructor();
}
export declare class RangerParamEventHandler {
    constructor();
    callback(param: RangerAppParamDesc): void;
}
export declare class RangerParamEventList {
    list: Array<RangerParamEventHandler>;
    constructor();
}
export declare class RangerParamEventMap {
    events: {
        [key: string]: RangerParamEventList;
    };
    constructor();
    clearAllEvents(): void;
    addEvent(name: string, e: RangerParamEventHandler): void;
    fireEvent(name: string, from: RangerAppParamDesc): void;
}
export declare class RangerAppArrayValue {
    value_type: number;
    value_type_name: string;
    values: Array<RangerAppValue>;
    constructor();
}
export declare class RangerAppHashValue {
    value_type: number;
    key_type_name: string;
    value_type_name: string;
    s_values: {
        [key: string]: RangerAppValue;
    };
    i_values: {
        [key: string]: RangerAppValue;
    };
    b_values: {
        [key: string]: RangerAppValue;
    };
    d_values: {
        [key: string]: RangerAppValue;
    };
    constructor();
}
export declare class RangerAppValue {
    double_value: number;
    string_value: string;
    int_value: number;
    boolean_value: boolean;
    arr: RangerAppArrayValue;
    hash: RangerAppHashValue;
    constructor();
}
export declare class RangerRefForce {
    strength: number;
    lifetime: number;
    changer: CodeNode;
    constructor();
}
export declare class RangerAppParamDesc {
    name: string;
    value: RangerAppValue;
    compiledName: string;
    debugString: string;
    is_register: boolean;
    ref_cnt: number;
    init_cnt: number;
    set_cnt: number;
    return_cnt: number;
    prop_assign_cnt: number;
    value_type: number;
    has_default: boolean;
    def_value: CodeNode;
    default_value: RangerNodeValue;
    isThis: boolean;
    classDesc: RangerAppClassDesc;
    is_immutable: boolean;
    is_static: boolean;
    propertyClass: RangerAppClassDesc;
    fnDesc: RangerAppFunctionDesc;
    ownerHistory: Array<RangerRefForce>;
    varType: number;
    refType: number;
    initRefType: number;
    isParam: boolean;
    paramIndex: number;
    is_optional: boolean;
    is_mutating: boolean;
    is_set: boolean;
    is_class_variable: boolean;
    is_captured: boolean;
    node: CodeNode;
    nameNode: CodeNode;
    fnBody: CodeNode;
    params: Array<RangerAppParamDesc>;
    return_value: RangerAppParamDesc;
    description: string;
    git_doc: string;
    has_events: boolean;
    eMap: RangerParamEventMap;
    constructor();
    addEvent(name: string, e: RangerParamEventHandler): void;
    changeStrength(newStrength: number, lifeTime: number, changer: CodeNode): void;
    isFunction(): boolean;
    isProperty(): boolean;
    isClass(): boolean;
    isOperator(): boolean;
    doesInherit(): boolean;
    isAllocatedType(): boolean;
    moveRefTo(nodeToMove: CodeNode, target: RangerAppParamDesc, ctx: RangerAppWriterContext): void;
    originalStrength(): number;
    getLifetime(): number;
    getStrength(): number;
    debugRefChanges(): void;
    pointsToObject(ctx: RangerAppWriterContext): boolean;
    isObject(): boolean;
    isArray(): boolean;
    isHash(): boolean;
    isPrimitive(): boolean;
    getRefTypeName(): string;
    getVarTypeName(): string;
    getTypeName(): string;
}
export declare class RangerAppFunctionDesc extends RangerAppParamDesc {
    name: string;
    ref_cnt: number;
    node: CodeNode;
    nameNode: CodeNode;
    fnBody: CodeNode;
    params: Array<RangerAppParamDesc>;
    return_value: RangerAppParamDesc;
    is_method: boolean;
    is_static: boolean;
    is_lambda: boolean;
    is_unsed: boolean;
    is_called_from_main: boolean;
    container_class: RangerAppClassDesc;
    refType: number;
    fnCtx: RangerAppWriterContext;
    insideFn: RangerAppFunctionDesc;
    call_graph_done: boolean;
    isCalling: Array<RangerAppFunctionDesc>;
    isCalledBy: Array<RangerAppFunctionDesc>;
    isUsingClasses: Array<RangerAppClassDesc>;
    isDirectlyUsingClasses: Array<RangerAppClassDesc>;
    myLambdas: Array<RangerAppFunctionDesc>;
    constructor();
    addCallTo(m: RangerAppFunctionDesc): void;
    addIndirectClassUsage(m: RangerAppClassDesc, ctx: RangerAppWriterContext): void;
    addClassUsage(m: RangerAppClassDesc, ctx: RangerAppWriterContext): void;
    forOtherVersions(ctx: RangerAppWriterContext, cb: (item: RangerAppFunctionDesc) => void): Promise<void>;
    isFunction(): boolean;
    isClass(): boolean;
    isProperty(): boolean;
}
export declare class RangerAppMethodVariants {
    name: string;
    variants: Array<RangerAppFunctionDesc>;
    constructor();
}
export declare class RangerAppInterfaceImpl {
    name: string;
    typeParams: CodeNode;
    constructor();
}
export declare class RangerTraitParams {
    param_names: Array<string>;
    values: {
        [key: string]: string;
    };
    constructor();
}
export declare class RangerAppClassDesc extends RangerAppParamDesc {
    name: string;
    is_system: boolean;
    compiledName: string;
    systemNames: {
        [key: string]: string;
    };
    systemNodes: {
        [key: string]: CodeNode;
    };
    systemInfo: CodeNode;
    is_interface: boolean;
    is_system_union: boolean;
    is_template: boolean;
    is_serialized: boolean;
    is_trait: boolean;
    is_operator_class: boolean;
    is_generic_instance: boolean;
    is_union: boolean;
    is_used_by_main: boolean;
    is_not_used: boolean;
    generic_params: CodeNode;
    ctx: RangerAppWriterContext;
    variables: Array<RangerAppParamDesc>;
    capturedLocals: Array<RangerAppParamDesc>;
    methods: Array<RangerAppFunctionDesc>;
    defined_methods: {
        [key: string]: boolean;
    };
    static_methods: Array<RangerAppFunctionDesc>;
    defined_static_methods: {
        [key: string]: boolean;
    };
    defined_variants: Array<string>;
    method_variants: {
        [key: string]: RangerAppMethodVariants;
    };
    has_constructor: boolean;
    constructor_node: CodeNode;
    constructor_fn: RangerAppFunctionDesc;
    has_destructor: boolean;
    destructor_node: CodeNode;
    destructor_fn: RangerAppFunctionDesc;
    extends_classes: Array<string>;
    implements_interfaces: Array<string>;
    consumes_traits: Array<string>;
    trait_params: {
        [key: string]: RangerTraitParams;
    };
    is_union_of: Array<string>;
    nameNode: CodeNode;
    classNode: CodeNode;
    contr_writers: Array<CodeWriter>;
    is_inherited: boolean;
    constructor();
    isClass(): boolean;
    isProperty(): boolean;
    doesInherit(): boolean;
    isNormalClass(): boolean;
    hasTrait(class_name: string, ctx: RangerAppWriterContext): RangerAppClassDesc;
    isSameOrParentClass(class_name: string, ctx: RangerAppWriterContext): boolean;
    hasOwnMethod(m_name: string): boolean;
    hasMethod(m_name: string): boolean;
    findMethod(f_name: string): RangerAppFunctionDesc;
    hasStaticMethod(m_name: string): boolean;
    findStaticMethod(f_name: string): RangerAppFunctionDesc;
    findVariable(f_name: string): RangerAppParamDesc;
    addParentClass(p_name: string): void;
    createVariable(node: CodeNode, ctx: RangerAppWriterContext, wr: CodeWriter): Promise<void>;
    addVariable(desc: RangerAppParamDesc): void;
    addMethod(desc: RangerAppFunctionDesc): void;
    addStaticMethod(desc: RangerAppFunctionDesc): void;
}
export declare class RangerTypeClass {
    name: string;
    compiledName: string;
    value_type: number;
    arrayType: RangerTypeClass;
    keyType: RangerTypeClass;
    implements_traits: Array<RangerTypeClass>;
    implements_interfaces: Array<RangerTypeClass>;
    extends_classes: Array<RangerTypeClass>;
    belongs_to_union: Array<RangerTypeClass>;
    description: union_Any;
    is_empty: boolean;
    is_primitive: boolean;
    is_mutable: boolean;
    is_optional: boolean;
    is_union: boolean;
    is_trait: boolean;
    is_class: boolean;
    is_system: boolean;
    is_interface: boolean;
    is_generic: boolean;
    is_lambda: boolean;
    nameNode: CodeNode;
    templateParams: CodeNode;
    constructor();
}
export declare class SourceCode {
    code: string;
    lines: Array<string>;
    filename: string;
    constructor(code_str: string);
    getLineString(line_index: number): string;
    getLine(sp: number): number;
    getColumnStr(sp: number): string;
    getColumn(sp: number): number;
}
export declare class CodeNodeLiteral {
    expression: boolean;
    vref: string;
    is_block_node: boolean;
    type_name: string;
    key_type: string;
    array_type: string;
    ns: Array<string>;
    has_vref_annotation: boolean;
    vref_annotation: CodeNodeLiteral;
    has_type_annotation: boolean;
    type_annotation: CodeNodeLiteral;
    parsed_type: number;
    value_type: number;
    double_value: number;
    string_value: string;
    int_value: number;
    boolean_value: boolean;
    expression_value: CodeNodeLiteral;
    props: {
        [key: string]: CodeNodeLiteral;
    };
    prop_keys: Array<string>;
    comments: Array<CodeNodeLiteral>;
    children: Array<CodeNodeLiteral>;
    attrs: Array<CodeNodeLiteral>;
    constructor();
    toDictionary(): Object;
    static fromDictionary(dict: Object): Promise<CodeNodeLiteral>;
}
export declare class CodeNode {
    code: SourceCode;
    sp: number;
    ep: number;
    row: number;
    col: number;
    has_operator: boolean;
    disabled_node: boolean;
    op_index: number;
    is_array_literal: boolean;
    is_system_class: boolean;
    is_plugin: boolean;
    is_direct_method_call: boolean;
    mutable_def: boolean;
    expression: boolean;
    vref: string;
    is_block_node: boolean;
    infix_operator: boolean;
    infix_node: CodeNode;
    infix_subnode: boolean;
    has_lambda: boolean;
    has_lambda_call: boolean;
    has_call: boolean;
    operator_pred: number;
    to_the_right: boolean;
    right_node: CodeNode;
    type_type: string;
    type_name: string;
    key_type: string;
    array_type: string;
    ns: Array<string>;
    has_vref_annotation: boolean;
    vref_annotation: CodeNode;
    has_type_annotation: boolean;
    type_annotation: CodeNode;
    parsed_type: number;
    value_type: number;
    ref_type: number;
    ref_need_assign: number;
    double_value: number;
    string_value: string;
    int_value: number;
    boolean_value: boolean;
    expression_value: CodeNode;
    props: {
        [key: string]: CodeNode;
    };
    prop_keys: Array<string>;
    comments: Array<CodeNode>;
    children: Array<CodeNode>;
    parent: CodeNode;
    attrs: Array<CodeNode>;
    appGUID: string;
    register_name: string;
    register_expressions: Array<CodeNode>;
    after_expression: Array<CodeNode>;
    definedTypeClass: RangerTypeClass;
    evalTypeClass: RangerTypeClass;
    lambda_ctx: RangerAppWriterContext;
    nsp: Array<RangerAppParamDesc>;
    eval_type: number;
    eval_type_name: string;
    eval_key_type: string;
    eval_array_type: string;
    eval_function: CodeNode;
    flow_done: boolean;
    ref_change_done: boolean;
    eval_type_node: CodeNode;
    didReturnAtIndex: number;
    hasVarDef: boolean;
    hasClassDescription: boolean;
    hasNewOper: boolean;
    clDesc: RangerAppClassDesc;
    hasFnCall: boolean;
    fnDesc: RangerAppFunctionDesc;
    lambdaFnDesc: RangerAppFunctionDesc;
    hasParamDesc: boolean;
    paramDesc: RangerAppParamDesc;
    ownParamDesc: RangerAppParamDesc;
    evalCtx: RangerAppWriterContext;
    evalState: NodeEvalState;
    operator_node: CodeNode;
    flow_ctx: RangerAppWriterContext;
    is_part_of_chain: boolean;
    methodChain: Array<CallChain>;
    chainTarget: CodeNode;
    register_set: boolean;
    did_walk: boolean;
    reg_compiled_name: string;
    tag: string;
    matched_type: string;
    constructor(source: SourceCode, start: number, end: number);
    childCnt(): number;
    getChild(index: number): CodeNode;
    chlen(): number;
    forTree(callback: (item: CodeNode, i: number) => void): Promise<void>;
    parallelTree(otherTree: CodeNode, callback: (left: CodeNode, right: CodeNode, i: number) => void): void;
    walkTreeUntil(callback: (item: CodeNode, i: number) => boolean): void;
    getParsedString(): string;
    getFilename(): string;
    getFlag(flagName: string): CodeNode;
    hasFlag(flagName: string): boolean;
    setFlag(flagName: string): void;
    getTypeInformationString(): string;
    getLine(): number;
    getLineString(line_index: number): string;
    getColStartString(): string;
    getLineAsString(): string;
    getSource(): string;
    getPositionalString(): string;
    isPrimitive(): boolean;
    getFirst(): CodeNode;
    getSecond(): CodeNode;
    getThird(): CodeNode;
    isSecondExpr(): boolean;
    getOperator(): string;
    getVRefAt(idx: number): string;
    getStringAt(idx: number): string;
    hasExpressionProperty(name: string): boolean;
    getExpressionProperty(name: string): CodeNode;
    hasIntProperty(name: string): boolean;
    getIntProperty(name: string): number;
    hasDoubleProperty(name: string): boolean;
    getDoubleProperty(name: string): number;
    setStringProperty(name: string, value: string): void;
    hasStringProperty(name: string): boolean;
    getStringProperty(name: string): string;
    hasBooleanProperty(name: string): boolean;
    getBooleanProperty(name: string): boolean;
    isFirstTypeVref(vrefName: string): boolean;
    isFirstVref(vrefName: string): boolean;
    getString(): string;
    walk(): void;
    isParsedAsPrimitive(): boolean;
    isPrimitiveType(): boolean;
    isAPrimitiveType(): boolean;
    writeCode(wr: CodeWriter): void;
    createChainTarget(): void;
    inferDefExpressionTypeFromValue(node: CodeNode): void;
    inferDefTypeFromValue(node: CodeNode): void;
    getCode(): string;
    cleanNode(): Promise<void>;
    cleanCopy(): Promise<CodeNode>;
    copy(): CodeNode;
    clone(): CodeNode;
    push(node: CodeNode): void;
    add(node: CodeNode): void;
    newVRefNode(name: string): CodeNode;
    newStringNode(name: string): CodeNode;
    newExpressionNode(): CodeNode;
    getChildrenFrom(otherNode: CodeNode): void;
    cloneWithType(match: RangerArgMatch, changeVref: boolean): CodeNode;
    rebuildWithType(match: RangerArgMatch, changeVref: boolean): CodeNode;
    buildTypeSignatureUsingMatch(match: RangerArgMatch): string;
    buildTypeSignature(): string;
    getVRefSignatureWithMatch(match: RangerArgMatch): string;
    getVRefSignature(): string;
    getTypeSignatureWithMatch(match: RangerArgMatch): string;
    getTypeSignature(): string;
    typeNameAsType(ctx: RangerAppWriterContext): number;
    copyEvalResFrom(node: CodeNode): void;
    defineNodeTypeTo(node: CodeNode, ctx: RangerAppWriterContext): void;
    ifNoTypeSetToVoid(): void;
    ifNoTypeSetToEvalTypeOf(node: CodeNode): boolean;
    static vref1(name: string): CodeNode;
    static vref2(name: string, typeName: string): CodeNode;
    static newStr(name: string): CodeNode;
    static newBool(value: boolean): CodeNode;
    static newInt(value: number): CodeNode;
    static newDouble(value: number): CodeNode;
    static op(opName: string): CodeNode;
    static op2(opName: string, param1: CodeNode): CodeNode;
    static op3(opName: string, list: Array<CodeNode>): CodeNode;
    static fromList(list: Array<CodeNode>): CodeNode;
    static expressionNode(): CodeNode;
    static blockNode(): CodeNode;
    static blockFromList(list: Array<CodeNode>): CodeNode;
}
export declare class TypeCounts {
    b_counted: boolean;
    interface_cnt: number;
    operator_cnt: number;
    immutable_cnt: number;
    register_cnt: number;
    opfn_cnt: number;
    constructor();
}
export declare class RangerNodeValue {
    double_value: number;
    string_value: string;
    int_value: number;
    boolean_value: boolean;
    expression_value: CodeNode;
    constructor();
}
export declare class RangerBackReference {
    from_class: string;
    var_name: string;
    ref_type: string;
    constructor();
}
export declare class RangerAppEnum {
    name: string;
    cnt: number;
    values: {
        [key: string]: number;
    };
    node: CodeNode;
    constructor();
    add(n: string): void;
}
export declare class OpFindResult {
    did_find: boolean;
    node: CodeNode;
    constructor();
}
export declare class RangerOperatorList {
    items: Array<RangerAppOperatorDesc>;
    constructor();
}
export declare class RangerNodeList {
    items: Array<CodeNode>;
    constructor();
}
export declare class ContextTransaction {
    name: string;
    desc: string;
    ended: boolean;
    failed: boolean;
    ctx: RangerAppWriterContext;
    mutations: Array<ContextTransactionMutation>;
    parent: ContextTransaction;
    children: Array<ContextTransaction>;
    constructor();
}
export declare class ContextTransactionMutation {
    sourceNode: CodeNode;
    targetNode: CodeNode;
    addedNode: CodeNode;
    constructor();
}
export declare class RangerRegisteredPlugin {
    name: string;
    features: Array<string>;
    constructor();
}
export declare class RangerAppWriterContext {
    langOperators: CodeNode;
    stdCommands: CodeNode;
    operators: RangerActiveOperators;
    op_list: {
        [key: string]: RangerOperatorList;
    };
    reservedWords: CodeNode;
    intRootCounter: number;
    targetLangName: string;
    parent: RangerAppWriterContext;
    defined_imports: Array<string>;
    already_imported: {
        [key: string]: boolean;
    };
    fileSystem: CodeFileSystem;
    is_function: boolean;
    class_level_context: boolean;
    function_level_context: boolean;
    in_main: boolean;
    is_block: boolean;
    is_lambda: boolean;
    is_capturing: boolean;
    is_catch_block: boolean;
    is_try_block: boolean;
    captured_variables: Array<string>;
    has_block_exited: boolean;
    in_expression: boolean;
    expr_stack: Array<boolean>;
    expr_restart: boolean;
    expr_restart_block: boolean;
    in_method: boolean;
    method_stack: Array<boolean>;
    typeNames: Array<string>;
    typeClasses: {
        [key: string]: RangerTypeClass;
    };
    currentClassName: string;
    in_class: boolean;
    in_static_method: boolean;
    currentClass: RangerAppClassDesc;
    currentMethod: RangerAppFunctionDesc;
    thisName: string;
    definedEnums: {
        [key: string]: RangerAppEnum;
    };
    definedInterfaces: {
        [key: string]: RangerAppClassDesc;
    };
    definedInterfaceList: Array<string>;
    definedClasses: {
        [key: string]: RangerAppClassDesc;
    };
    definedClassList: Array<string>;
    definedTasks: {
        [key: string]: RangerAppFunctionDesc;
    };
    templateClassNodes: {
        [key: string]: CodeNode;
    };
    templateClassList: Array<string>;
    classSignatures: {
        [key: string]: string;
    };
    classToSignature: {
        [key: string]: string;
    };
    templateClasses: {
        [key: string]: RangerAppClassDesc;
    };
    classStaticWriters: {
        [key: string]: CodeWriter;
    };
    localVariables: {
        [key: string]: RangerAppParamDesc;
    };
    localVarNames: Array<string>;
    contextFlags: {
        [key: string]: boolean;
    };
    settings: {
        [key: string]: string;
    };
    compilerFlags: {
        [key: string]: boolean;
    };
    compilerSettings: {
        [key: string]: string;
    };
    parserErrors: Array<RangerCompilerMessage>;
    compilerErrors: Array<RangerCompilerMessage>;
    compilerMessages: Array<RangerCompilerMessage>;
    compilerLog: {
        [key: string]: RangerCompilerMessage;
    };
    todoList: Array<RangerAppTodo>;
    definedMacro: {
        [key: string]: boolean;
    };
    defCounts: {
        [key: string]: number;
    };
    refTransform: {
        [key: string]: string;
    };
    staticClassBodies: Array<CodeNode>;
    pluginSpecificOperators: {
        [key: string]: boolean;
    };
    viewClassBody: {
        [key: string]: CodeNode;
    };
    appPages: {
        [key: string]: CodeNode;
    };
    appServices: {
        [key: string]: CodeNode;
    };
    opNs: Array<string>;
    langFilePath: string;
    libraryPaths: Array<string>;
    outputPath: string;
    counters: TypeCounts;
    parser: RangerFlowParser;
    compiler: LiveCompiler;
    pluginNodes: {
        [key: string]: RangerNodeList;
    };
    typedNodes: {
        [key: string]: RangerNodeList;
    };
    registered_plugins: Array<RangerRegisteredPlugin>;
    operatorFunction: (name: string) => CodeNode;
    lastBlockOp: CodeNode;
    opFnsList: {
        [key: string]: CodeNode;
    };
    test_compile: Array<boolean>;
    activeTransaction: Array<ContextTransaction>;
    transactions: Array<ContextTransaction>;
    env: InputEnv;
    rootFile: string;
    constructor();
    getEnv(): InputEnv;
    setTestCompile(): void;
    unsetTestCompile(): void;
    isTestCompile(): boolean;
    addOpFn(name: string, code: CodeNode): void;
    getOpFns(name: string): Promise<Array<CodeNode>>;
    getLastBlockOp(): CodeNode;
    removePluginOp(name: string): void;
    isPluginOp(node: CodeNode): boolean;
    addPlugin(p: RangerRegisteredPlugin): void;
    findPluginsFor(featureName: string): Array<string>;
    addTypeClass(name: string): RangerTypeClass;
    getTypeClass(name: string): RangerTypeClass;
    getParser(): RangerFlowParser;
    getCompiler(): LiveCompiler;
    getTypedNodes(name: string): Promise<Array<CodeNode>>;
    addTypedNode(name: string, op: CodeNode): void;
    getPluginNodes(name: string): Promise<Array<CodeNode>>;
    addPluginNode(name: string, op: CodeNode): void;
    addOperator(op: RangerAppOperatorDesc): void;
    getAllOperators(): Promise<Array<RangerAppOperatorDesc>>;
    getOperatorsOf(name: string): Array<RangerAppOperatorDesc>;
    initOpList(): Promise<void>;
    incLambdaCnt(): void;
    createNewRegName(): string;
    createNewOpFnName(): string;
    isTryBlock(): boolean;
    isCatchBlock(): boolean;
    pushAndCollectAst(rootNode: CodeNode, wr: CodeWriter): Promise<void>;
    pushAndCompileAst(rootNode: CodeNode, wr: CodeWriter): Promise<void>;
    pushAst(source_code: string, node: CodeNode, wr: CodeWriter): void;
    pushAndCollectCode(source_code: string, wr: CodeWriter): Promise<void>;
    pushCode(source_code: string, wr: CodeWriter): Promise<void>;
    addViewClassBody(name: string, classDef: CodeNode): void;
    addPage(name: string, classDef: CodeNode): void;
    addService(name: string, classDef: CodeNode): void;
    getViewClass(s_name: string): CodeNode;
    addOpNs(n: string): void;
    removeOpNs(n: string): void;
    inLambda(): boolean;
    variableTypeUsage(): Promise<Array<string>>;
    writeContextVars(wr: CodeWriter): Promise<void>;
    writeContextInfo(wr: CodeWriter): Promise<void>;
    getContextInfo(): Promise<string>;
    isCapturing(): boolean;
    forkWithOps(opNode: CodeNode): RangerAppWriterContext;
    getOperatorDef(): RangerActiveOperators;
    getOperators(name: string): Promise<Array<CodeNode>>;
    isLocalToCapture(name: string): boolean;
    addCapturedVariable(name: string): void;
    getCapturedVariables(): Array<string>;
    transformOpNameWord(input_word: string): string;
    transformWord(input_word: string): string;
    initReservedWords(): boolean;
    initStdCommands(): boolean;
    transformTypeName(typeName: string): string;
    isPrimitiveType(typeName: string): boolean;
    isDefinedType(typeName: string): boolean;
    hadValidType(node: CodeNode): boolean;
    findOperator(node: CodeNode): CodeNode;
    getStdCommands(): CodeNode;
    findOperatorsWithName(name: string): Promise<Array<CodeNode>>;
    findClassWithSign(node: CodeNode): RangerAppClassDesc;
    createSignature(origClass: string, classSig: string): string;
    createStaticMethod(withName: string, currC: RangerAppClassDesc, nameNode: CodeNode, argsNode: CodeNode, fnBody: CodeNode, parser: RangerFlowParser, wr: CodeWriter): Promise<RangerAppFunctionDesc>;
    canUseTypeInference(nameNode: CodeNode): boolean;
    createOpStaticClass(name: string): RangerAppClassDesc;
    createTraitInstanceClass(traitName: string, instanceName: string, initParams: CodeNode, flowParser: RangerFlowParser, wr: CodeWriter): Promise<RangerAppClassDesc>;
    createOperator(fromNode: CodeNode): void;
    findClassMethod(cname: string, fname: string): RangerAppFunctionDesc;
    getFileWriter(path: string, fileName: string): CodeWriter;
    addTodo(node: CodeNode, descr: string): void;
    setThisName(the_name: string): void;
    getThisName(): string;
    printLogs(logName: string): void;
    log(node: CodeNode, logName: string, descr: string): void;
    addMessage(node: CodeNode, descr: string): void;
    errCnt(): number;
    addError(targetnode: CodeNode, descr: string): void;
    addParserError(targetnode: CodeNode, descr: string): void;
    addTemplateClass(name: string, node: CodeNode): void;
    hasTemplateNode(name: string): boolean;
    findTemplateNode(name: string): CodeNode;
    setStaticWriter(className: string, writer: CodeWriter): void;
    getStaticWriter(className: string): CodeWriter;
    isEnumDefined(n: string): boolean;
    getEnum(n: string): RangerAppEnum;
    isVarDefined(name: string): boolean;
    setFlag(name: string, value: boolean): void;
    getFlag(name: string): boolean;
    setSetting(name: string, value: string): void;
    hasSetting(name: string): boolean;
    getSetting(name: string): string;
    setCompilerFlag(name: string, value: boolean): void;
    hasCompilerFlag(s_name: string): boolean;
    setCompilerSetting(name: string, value: string): void;
    getCompilerSetting(s_name: string): string;
    hasCompilerSetting(s_name: string): boolean;
    getVariableDef(name: string): RangerAppParamDesc;
    findFunctionCtx(): RangerAppWriterContext;
    getFnVarCnt(name: string): number;
    debugVars(): void;
    getVarTotalCnt(name: string): number;
    getFnVarCnt2(name: string): number;
    getFnVarCnt3(name: string): number;
    isMemberVariable(name: string): boolean;
    defineVariable(name: string, desc: RangerAppParamDesc): void;
    isDefinedClass(name: string): boolean;
    getRoot(): RangerAppWriterContext;
    getClasses(): Array<RangerAppClassDesc>;
    addClass(name: string, desc: RangerAppClassDesc): void;
    findClass(name: string): RangerAppClassDesc;
    hasClass(name: string): boolean;
    getCurrentMethod(): RangerAppFunctionDesc;
    setCurrentClass(cc: RangerAppClassDesc): void;
    disableCurrentClass(): void;
    hasCurrentClass(): boolean;
    getCurrentClass(): RangerAppClassDesc;
    restartExpressionLevel(): void;
    newBlock(): void;
    isInExpression(): boolean;
    expressionLevel(): number;
    setInExpr(): void;
    unsetInExpr(): void;
    getErrorCount(): number;
    isInStatic(): boolean;
    isInMain(): boolean;
    isInMethod(): boolean;
    setInMethod(): void;
    unsetInMethod(): void;
    findMethodLevelContext(): RangerAppWriterContext;
    findClassLevelContext(): RangerAppWriterContext;
    fork(): RangerAppWriterContext;
    getRootFile(): string;
    setRootFile(file_name: string): void;
}
export declare class CodeFile {
    path_name: string;
    name: string;
    writer: CodeWriter;
    import_list: {
        [key: string]: string;
    };
    import_names: Array<string>;
    fileSystem: CodeFileSystem;
    constructor(filePath: string, fileName: string);
    addImport(import_name: string): void;
    rewrite(newString: string): void;
    testCreateWriter(): CodeWriter;
    getImports(): Array<string>;
    getWriter(): CodeWriter;
    getCode(): string;
}
export declare class CodeFileSystem {
    files: Array<CodeFile>;
    constructor();
    getFile(path: string, name: string): CodeFile;
    mkdir(path: string): void;
    saveTo(path: string, verbose: boolean): void;
}
export declare class CodeSlice {
    code: string;
    writer: CodeWriter;
    constructor();
    getCode(): string;
}
export declare class CodeWriter {
    tagName: string;
    codeStr: string;
    currentLine: string;
    tabStr: string;
    nlStr: string;
    lineNumber: number;
    indentAmount: number;
    compiledTags: {
        [key: string]: boolean;
    };
    tags: {
        [key: string]: number;
    };
    slices: Array<CodeSlice>;
    current_slice: CodeSlice;
    ownerFile: CodeFile;
    forks: Array<CodeWriter>;
    tagOffset: number;
    parent: CodeWriter;
    had_nl: boolean;
    constructor();
    rewrite(newString: string): void;
    getFilesystem(): CodeFileSystem;
    getFileWriter(path: string, fileName: string): CodeWriter;
    getImports(): Array<string>;
    addImport(name: string): void;
    indent(delta: number): void;
    addIndent(): void;
    createTag(name: string): CodeWriter;
    getTag(name: string): CodeWriter;
    hasTag(name: string): boolean;
    fork(): CodeWriter;
    newline(): void;
    line_end(str: string): void;
    writeSlice(str: string, newLine: boolean): void;
    out(str: string, newLine: boolean): void;
    raw(str: string, newLine: boolean): void;
    getCode(): string;
    static emptyWithFS(): CodeWriter;
}
export declare class RangerLispParser {
    code: SourceCode;
    buff: string;
    __len: number;
    i: number;
    last_line_start: number;
    current_line_index: number;
    parents: Array<CodeNode>;
    next: CodeNode;
    paren_cnt: number;
    get_op_pred: number;
    rootNode: CodeNode;
    curr_node: CodeNode;
    had_error: boolean;
    disableOperators: boolean;
    constructor(code_module: SourceCode);
    joo(cm: SourceCode): void;
    parse_raw_annotation(): CodeNode;
    skip_space(is_block_parent: boolean): boolean;
    end_expression(): boolean;
    getOperator(disabled: boolean): number;
    isOperator(disabled: boolean): number;
    getOperatorPred(str: string, disabled: boolean): number;
    insert_node(p_node: CodeNode): void;
    parse_attributes(): boolean;
    parseXML(): void;
    parse(disable_ops: boolean): void;
}
export declare class RangerArgMatch {
    _debug: boolean;
    matched: {
        [key: string]: string;
    };
    nodes: {
        [key: string]: CodeNode;
    };
    builtNodes: {
        [key: string]: CodeNode;
    };
    matchedLambdas: {
        [key: string]: CodeNode;
    };
    constructor();
    matchArguments(args: CodeNode, callArgs: CodeNode, ctx: RangerAppWriterContext, firstArgIndex: number): boolean;
    force_add(tplKeyword: string, typeName: string, ctx: RangerAppWriterContext): void;
    addNode(name: string, node: CodeNode): void;
    add(tplKeyword: string, typeName: string, ctx: RangerAppWriterContext): boolean;
    add_atype(tplKeyword: string, typeName: string, ctx: RangerAppWriterContext): boolean;
    doesDefsMatch(arg: CodeNode, node: CodeNode, ctx: RangerAppWriterContext): boolean;
    doesMatch(arg: CodeNode, node: CodeNode, ctx: RangerAppWriterContext): boolean;
    areEqualTypes(type1: string, type2: string, ctx: RangerAppWriterContext): boolean;
    areEqualATypes(type1: string, type2: string, ctx: RangerAppWriterContext): boolean;
    getTypeName(n: string): string;
    getType(n: string): number;
    setRvBasedOn(arg: CodeNode, node: CodeNode): boolean;
}
export declare class DictNode {
    is_property: boolean;
    is_property_value: boolean;
    vref: string;
    value_type: number;
    double_value: number;
    int_value: number;
    string_value: string;
    boolean_value: boolean;
    object_value: DictNode;
    children: Array<DictNode>;
    objects: {
        [key: string]: DictNode;
    };
    dict_keys: Array<string>;
    constructor();
    EncodeString(orig_str: string): string;
    addString(key: string, value: string): void;
    addDouble(key: string, value: number): void;
    addInt(key: string, value: number): void;
    addBoolean(key: string, value: boolean): void;
    addObject(key: string): DictNode;
    setObject(key: string, value: DictNode): void;
    addArray(key: string): DictNode;
    push(obj: DictNode): void;
    getDoubleAt(index: number): number;
    getStringAt(index: number): string;
    getIntAt(index: number): number;
    getBooleanAt(index: number): boolean;
    getString(key: string): string;
    getDouble(key: string): number;
    getInt(key: string): number;
    getBoolean(key: string): boolean;
    getArray(key: string): DictNode;
    getArrayAt(index: number): DictNode;
    getObject(key: string): DictNode;
    getObjectAt(index: number): DictNode;
    stringify(): string;
    static createEmptyObject(): DictNode;
}
export declare class RangerSerializeClass {
    constructor();
    isSerializedClass(cName: string, ctx: RangerAppWriterContext): boolean;
    createWRWriter(pvar: RangerAppParamDesc, nn: CodeNode, ctx: RangerAppWriterContext, wr: CodeWriter): void;
    createJSONSerializerFn(cl: RangerAppClassDesc, ctx: RangerAppWriterContext, wr: CodeWriter): void;
    createWRWriter2(pvar: RangerAppParamDesc, nn: CodeNode, ctx: RangerAppWriterContext, wr: CodeWriter): void;
    createWRReader2(pvar: RangerAppParamDesc, nn: CodeNode, ctx: RangerAppWriterContext, wr: CodeWriter): void;
    createJSONSerializerFn2(cl: RangerAppClassDesc, ctx: RangerAppWriterContext, wr: CodeWriter): void;
}
export declare class RangerImmutableExtension {
    constructor();
    typeDefOf(p: RangerAppParamDesc): string;
    createImmutableExtension(cl: RangerAppClassDesc, ctx: RangerAppWriterContext, wr: CodeWriter): void;
}
export declare class RangerServiceBuilder {
    constructor();
    createOpStaticClass(ctx: RangerAppWriterContext, name: string): RangerAppClassDesc;
    CreateServices(parser: RangerFlowParser, ctx: RangerAppWriterContext, orig_wr: CodeWriter): Promise<void>;
}
export declare class RangerAppOperatorDesc extends RangerAppParamDesc {
    name: string;
    ref_cnt: number;
    node: CodeNode;
    nameNode: CodeNode;
    fnBody: CodeNode;
    op_params: Array<CodeNode>;
    firstArg: CodeNode;
    constructor();
    isOperator(): boolean;
    isProperty(): boolean;
}
export declare class TFiles {
    constructor();
    static searchEnv(env: InputEnv, paths: Array<string>, fileName: string): string;
    static search(paths: Array<string>, fileName: string): string;
}
export declare class TTypes {
    constructor();
    static nameToValue(name: string): number;
    static isPrimitive(valueType: number): boolean;
    static valueAsString(valueType: number): string;
    static baseTypeAsEval(node: CodeNode, ctx: RangerAppWriterContext, wr: CodeWriter): void;
}
export declare class ClassJoinPoint {
    class_def: RangerAppClassDesc;
    node: CodeNode;
    constructor();
}
export declare class WalkLater {
    arg: CodeNode;
    callArg: CodeNode;
    constructor();
}
export declare class RangerFlowParser {
    hasRootPath: boolean;
    rootPath: string;
    _debug: boolean;
    stdCommands: CodeNode;
    lastProcessedNode: CodeNode;
    collectWalkAtEnd: Array<CodeNode>;
    walkAlso: Array<CodeNode>;
    serializedClasses: Array<RangerAppClassDesc>;
    immutableClasses: Array<RangerAppClassDesc>;
    classesWithTraits: Array<ClassJoinPoint>;
    collectedIntefaces: Array<RangerAppClassDesc>;
    definedInterfaces: {
        [key: string]: boolean;
    };
    signatureCnt: number;
    argSignatureCnt: number;
    mainCnt: number;
    isDefinedSignature: {
        [key: string]: number;
    };
    isDefinedArgSignature: {
        [key: string]: number;
    };
    extendedClasses: {
        [key: string]: string;
    };
    allNewRNodes: Array<CodeNode>;
    infinite_recursion: boolean;
    match_types: {
        [key: string]: string;
    };
    constructor();
    WalkNodeChildren(node: CodeNode, ctx: RangerAppWriterContext, wr: CodeWriter): Promise<void>;
    WalkNode(node: CodeNode, ctx: RangerAppWriterContext, wr: CodeWriter): Promise<boolean>;
    getVoidNameSignature(): string;
    getNameSignature(node: CodeNode): string;
    getArgsSignature(node: CodeNode): string;
    getThisName(): string;
    GetProperty(node: CodeNode, ctx: RangerAppWriterContext, wr: CodeWriter): Promise<void>;
    WriteVRef(node: CodeNode, ctx: RangerAppWriterContext, wr: CodeWriter): Promise<void>;
    EnterFn(node: CodeNode, ctx: RangerAppWriterContext, wr: CodeWriter, callback: (node: CodeNode, ctx: RangerAppWriterContext, wr: CodeWriter, nameNode: CodeNode, fnArgs: CodeNode, fnBody: CodeNode, desc: RangerAppClassDesc) => void): Promise<void>;
    Constructor(node: CodeNode, ctx: RangerAppWriterContext, wr: CodeWriter): Promise<void>;
    WriteScalarValue(node: CodeNode, ctx: RangerAppWriterContext, wr: CodeWriter): void;
    cmdNew(node: CodeNode, ctx: RangerAppWriterContext, wr: CodeWriter): Promise<void>;
    transformParams(list: Array<CodeNode>, fnArgs: Array<RangerAppParamDesc>, ctx: RangerAppWriterContext): Array<CodeNode>;
    transformParams2(list: Array<CodeNode>, fnArgs: Array<CodeNode>, ctx: RangerAppWriterContext): Array<CodeNode>;
    CreateCTTI(node: CodeNode, ctx: RangerAppWriterContext, orig_wr: CodeWriter): Promise<void>;
    CreateRTTI(node: CodeNode, ctx: RangerAppWriterContext, orig_wr: CodeWriter): Promise<void>;
    SolveAsyncFuncs(node: CodeNode, ctx: RangerAppWriterContext, wr: CodeWriter): Promise<void>;
    cmdCall(node: CodeNode, ctx: RangerAppWriterContext, wr: CodeWriter): Promise<boolean>;
    matchLambdaArgs(n1: CodeNode, n2: CodeNode, ctx: RangerAppWriterContext, wr: CodeWriter): Promise<boolean>;
    testLambdaCallArgs(lambda_expression: CodeNode, callParams: CodeNode, ctx: RangerAppWriterContext, wr: CodeWriter): Promise<boolean>;
    cmdLocalCall(node: CodeNode, ctx: RangerAppWriterContext, wr: CodeWriter): Promise<boolean>;
    transformImmutableAssigment(node: CodeNode): CodeNode;
    cmdAssign(node: CodeNode, ctx: RangerAppWriterContext, wr: CodeWriter): Promise<void>;
    EnterTemplateClass(node: CodeNode, ctx: RangerAppWriterContext, wr: CodeWriter): void;
    EnterClass(node: CodeNode, ctx: RangerAppWriterContext, wr: CodeWriter): Promise<void>;
    walkFunctionBody(m: RangerAppFunctionDesc, fnBody: CodeNode, ctx: RangerAppWriterContext, subCtx: RangerAppWriterContext, wr: CodeWriter): Promise<void>;
    EnterMethod(node: CodeNode, ctx: RangerAppWriterContext, wr: CodeWriter): Promise<void>;
    EnterStaticMethod(node: CodeNode, ctx: RangerAppWriterContext, wr: CodeWriter): Promise<void>;
    DefineArrowOpFn(node: CodeNode, ctx: RangerAppWriterContext, wr: CodeWriter): Promise<void>;
    DefineOpFn(node: CodeNode, ctx: RangerAppWriterContext, wr: CodeWriter): void;
    testCompile(opFn: CodeNode, node: CodeNode, ctx: RangerAppWriterContext, wr: CodeWriter): Promise<{
        [key: string]: CodeNode;
    }>;
    TransformOpFn(opFnList: Array<CodeNode>, origNode: CodeNode, ctx: RangerAppWriterContext, wr: CodeWriter): Promise<void>;
    cmdArray(node: CodeNode, ctx: RangerAppWriterContext, wr: CodeWriter): Promise<void>;
    EnterLambdaMethod(node: CodeNode, ctx: RangerAppWriterContext, wr: CodeWriter): Promise<void>;
    CheckVRefTypeAnnotationOf(node: CodeNode, ctx: RangerAppWriterContext, wr: CodeWriter): Promise<boolean>;
    CheckTypeAnnotationOf(node: CodeNode, ctx: RangerAppWriterContext, wr: CodeWriter): Promise<boolean>;
    matchNode(node: CodeNode, ctx: RangerAppWriterContext, wr: CodeWriter): Promise<boolean>;
    StartWalk(node: CodeNode, ctx: RangerAppWriterContext, wr: CodeWriter): Promise<void>;
    clearImports(node: CodeNode, ctx: RangerAppWriterContext, wr: CodeWriter): void;
    mergeImports(node: CodeNode, ctx: RangerAppWriterContext, wr: CodeWriter): Promise<void>;
    CollectMethods(node: CodeNode, ctx: RangerAppWriterContext, wr: CodeWriter): Promise<void>;
    defineFunctionParam(method: RangerAppFunctionDesc, arg: CodeNode, ctx: RangerAppWriterContext, wr: CodeWriter): Promise<void>;
    spliceFunctionBody(startIndex: number, node: CodeNode, ctx: RangerAppWriterContext, wr: CodeWriter): CodeNode;
    CreateFunctionObject(orig_node: CodeNode, ctx: RangerAppWriterContext, wr: CodeWriter): Promise<RangerAppFunctionDesc>;
    WalkCollectMethods(node: CodeNode, ctx: RangerAppWriterContext, wr: CodeWriter): Promise<void>;
    findFunctionDesc(obj: CodeNode, ctx: RangerAppWriterContext, wr: CodeWriter): RangerAppFunctionDesc;
    findParamDesc(obj: CodeNode, ctx: RangerAppWriterContext, wr: CodeWriter): RangerAppParamDesc;
    convertToUnion(unionName: string, node: CodeNode, ctx: RangerAppWriterContext, wr: CodeWriter): Promise<void>;
    transformMethodToLambda(node: CodeNode, vFnDef: RangerAppFunctionDesc, ctx: RangerAppWriterContext, wr: CodeWriter): Promise<void>;
    areEqualTypes(n1: CodeNode, n2: CodeNode, ctx: RangerAppWriterContext, wr: CodeWriter): Promise<boolean>;
    shouldBeEqualTypes(n1: CodeNode, n2: CodeNode, ctx: RangerAppWriterContext, msg: string): void;
    shouldBeExpression(n1: CodeNode, ctx: RangerAppWriterContext, msg: string): void;
    shouldHaveChildCnt(cnt: number, n1: CodeNode, ctx: RangerAppWriterContext, msg: string): void;
    findLanguageOper(details: CodeNode, ctx: RangerAppWriterContext, opDef: CodeNode): Promise<CodeNode>;
    buildMacro(langOper: CodeNode, args: CodeNode, ctx: RangerAppWriterContext): Promise<CodeNode>;
    stdParamMatch(callArgs: CodeNode, inCtx: RangerAppWriterContext, wr: CodeWriter, require_all_match: boolean): Promise<boolean>;
}
export declare class TFactory {
    constructor();
    static new_class_signature(node: CodeNode, ctx: RangerAppWriterContext, wr: CodeWriter): RangerTypeClass;
    static new_lambda_signature(node: CodeNode, ctx: RangerAppWriterContext, wr: CodeWriter): RangerTypeClass;
    static new_def_signature_from_simple_string(sig: string, ctx: RangerAppWriterContext, wr: CodeWriter): RangerTypeClass;
    static sig(sig: string, ctx: RangerAppWriterContext, wr: CodeWriter): RangerTypeClass;
    static new_def_signature(node: CodeNode, ctx: RangerAppWriterContext, wr: CodeWriter): RangerTypeClass;
    static new_scalar_signature(node: CodeNode, ctx: RangerAppWriterContext, wr: CodeWriter): RangerTypeClass;
    static type_annotation(node: CodeNode): string;
    static lambdaSignature(node: CodeNode): string;
    static baseSignature(node: CodeNode): string;
}
export declare class CallChain {
    methodName: string;
    method: CodeNode;
    args: CodeNode;
    constructor();
}
export declare class NodeEvalState {
    ctx: RangerAppWriterContext;
    is_running: boolean;
    child_index: number;
    cmd_index: number;
    is_ready: boolean;
    is_waiting: boolean;
    exit_after: boolean;
    expand_args: boolean;
    ask_expand: boolean;
    eval_rest: boolean;
    exec_cnt: number;
    b_debugger: boolean;
    b_top_node: boolean;
    ask_eval: boolean;
    param_eval_on: boolean;
    eval_index: number;
    eval_end_index: number;
    ask_eval_start: number;
    ask_eval_end: number;
    evaluating_cmd: CodeNode;
    constructor();
}
export declare class RangerGenericClassWriter {
    compiler: LiveCompiler;
    compFlags: {
        [key: string]: boolean;
    };
    constructor();
    lineEnding(): string;
    addSystemImport(cl: RangerAppClassDesc, ctx: RangerAppWriterContext, wr: CodeWriter): Promise<void>;
    EncodeString(node: CodeNode, ctx: RangerAppWriterContext, wr: CodeWriter): string;
    CustomOperator(node: CodeNode, ctx: RangerAppWriterContext, wr: CodeWriter): Promise<void>;
    WriteSetterVRef(node: CodeNode, ctx: RangerAppWriterContext, wr: CodeWriter): Promise<void>;
    writeArrayTypeDef(node: CodeNode, ctx: RangerAppWriterContext, wr: CodeWriter): void;
    WriteEnum(node: CodeNode, ctx: RangerAppWriterContext, wr: CodeWriter): Promise<void>;
    WriteScalarValue(node: CodeNode, ctx: RangerAppWriterContext, wr: CodeWriter): void;
    getTypeString(type_string: string): string;
    import_lib(lib_name: string, ctx: RangerAppWriterContext, wr: CodeWriter): void;
    getObjectTypeString(type_string: string, ctx: RangerAppWriterContext): string;
    release_local_vars(node: CodeNode, ctx: RangerAppWriterContext, wr: CodeWriter): void;
    WalkNode(node: CodeNode, ctx: RangerAppWriterContext, wr: CodeWriter): Promise<void>;
    writeTypeDef(node: CodeNode, ctx: RangerAppWriterContext, wr: CodeWriter): Promise<void>;
    writeRawTypeDef(node: CodeNode, ctx: RangerAppWriterContext, wr: CodeWriter): Promise<void>;
    adjustType(tn: string): string;
    WriteVRef(node: CodeNode, ctx: RangerAppWriterContext, wr: CodeWriter): Promise<void>;
    writeVarDef(node: CodeNode, ctx: RangerAppWriterContext, wr: CodeWriter): Promise<void>;
    CreateCallExpression(node: CodeNode, ctx: RangerAppWriterContext, wr: CodeWriter): Promise<void>;
    CreateMethodCall(node: CodeNode, ctx: RangerAppWriterContext, wr: CodeWriter): Promise<void>;
    CreatePropertyGet(node: CodeNode, ctx: RangerAppWriterContext, wr: CodeWriter): Promise<void>;
    isPackaged(ctx: RangerAppWriterContext): boolean;
    CreateUnions(parser: RangerFlowParser, ctx: RangerAppWriterContext, orig_wr: CodeWriter): Promise<void>;
    CreateServices(parser: RangerFlowParser, ctx: RangerAppWriterContext, orig_wr: CodeWriter): Promise<void>;
    CreatePages(parser: RangerFlowParser, ctx: RangerAppWriterContext, orig_wr: CodeWriter): Promise<void>;
    CreatePage(parser: RangerFlowParser, node: CodeNode, ctx: RangerAppWriterContext, orig_wr: CodeWriter): Promise<void>;
    CreateLambdaCall(node: CodeNode, ctx: RangerAppWriterContext, wr: CodeWriter): Promise<void>;
    CreateLambda(node: CodeNode, ctx: RangerAppWriterContext, wr: CodeWriter): Promise<void>;
    writeFnCall(node: CodeNode, ctx: RangerAppWriterContext, wr: CodeWriter): Promise<void>;
    writeNewCall(node: CodeNode, ctx: RangerAppWriterContext, wr: CodeWriter): Promise<void>;
    writeInterface(cl: RangerAppClassDesc, ctx: RangerAppWriterContext, wr: CodeWriter): Promise<void>;
    disabledVarDef(node: CodeNode, ctx: RangerAppWriterContext, wr: CodeWriter): Promise<void>;
    writeArrayLiteral(node: CodeNode, ctx: RangerAppWriterContext, wr: CodeWriter): Promise<void>;
    writeClass(node: CodeNode, ctx: RangerAppWriterContext, wr: CodeWriter): Promise<void>;
}
export declare class AndroidPageWriter {
    classWriter: RangerGenericClassWriter;
    constructor();
    BuildAST(code_string: string): CodeNode;
    CreatePage(parser: RangerFlowParser, node: CodeNode, ctx: RangerAppWriterContext, orig_wr: CodeWriter): Promise<void>;
}
export declare class RangerJava7ClassWriter extends RangerGenericClassWriter {
    compiler: LiveCompiler;
    signatures: {
        [key: string]: number;
    };
    signature_cnt: number;
    iface_created: {
        [key: string]: boolean;
    };
    constructor();
    getSignatureInterface(s: string): string;
    adjustType(tn: string): string;
    getObjectTypeString2(type_string: string, ctx: RangerAppWriterContext, wr: CodeWriter): Promise<string>;
    getTypeString(type_string: string): string;
    writeTypeDef(node: CodeNode, ctx: RangerAppWriterContext, wr: CodeWriter): Promise<void>;
    WriteVRef(node: CodeNode, ctx: RangerAppWriterContext, wr: CodeWriter): Promise<void>;
    disabledVarDef(node: CodeNode, ctx: RangerAppWriterContext, wr: CodeWriter): Promise<void>;
    writeVarDef(node: CodeNode, ctx: RangerAppWriterContext, wr: CodeWriter): Promise<void>;
    writeArgsDef(fnDesc: RangerAppFunctionDesc, ctx: RangerAppWriterContext, wr: CodeWriter): Promise<void>;
    CustomOperator(node: CodeNode, ctx: RangerAppWriterContext, wr: CodeWriter): Promise<void>;
    buildLambdaSignature(node: CodeNode): string;
    CreateLambdaCall(node: CodeNode, ctx: RangerAppWriterContext, wr: CodeWriter): Promise<void>;
    writeArrayLiteral(node: CodeNode, ctx: RangerAppWriterContext, wr: CodeWriter): Promise<void>;
    CreateLambda(node: CodeNode, ctx: RangerAppWriterContext, wr: CodeWriter): Promise<void>;
    getCounters(ctx: RangerAppWriterContext): TypeCounts;
    writeClass(node: CodeNode, ctx: RangerAppWriterContext, orig_wr: CodeWriter): Promise<void>;
    CreateServices(parser: RangerFlowParser, ctx: RangerAppWriterContext, orig_wr: CodeWriter): Promise<void>;
    CreatePages(parser: RangerFlowParser, ctx: RangerAppWriterContext, orig_wr: CodeWriter): Promise<void>;
    CreatePage(parser: RangerFlowParser, node: CodeNode, ctx: RangerAppWriterContext, orig_wr: CodeWriter): Promise<void>;
}
export declare class RangerSwift3ClassWriter extends RangerGenericClassWriter {
    compiler: LiveCompiler;
    header_created: boolean;
    constructor();
    adjustType(tn: string): string;
    getObjectTypeString(type_string: string, ctx: RangerAppWriterContext): string;
    getTypeString(type_string: string): string;
    writeTypeDef(node: CodeNode, ctx: RangerAppWriterContext, wr: CodeWriter): Promise<void>;
    WriteEnum(node: CodeNode, ctx: RangerAppWriterContext, wr: CodeWriter): Promise<void>;
    WriteVRef(node: CodeNode, ctx: RangerAppWriterContext, wr: CodeWriter): Promise<void>;
    writeVarDef(node: CodeNode, ctx: RangerAppWriterContext, wr: CodeWriter): Promise<void>;
    writeArgsDef(fnDesc: RangerAppFunctionDesc, ctx: RangerAppWriterContext, wr: CodeWriter): Promise<void>;
    writeArgsDefWithLocals(fnDesc: RangerAppFunctionDesc, localFnDesc: RangerAppFunctionDesc, ctx: RangerAppWriterContext, wr: CodeWriter): Promise<void>;
    CreateCallExpression(node: CodeNode, ctx: RangerAppWriterContext, wr: CodeWriter): Promise<void>;
    writeFnCall(node: CodeNode, ctx: RangerAppWriterContext, wr: CodeWriter): Promise<void>;
    CreateLambdaCall(node: CodeNode, ctx: RangerAppWriterContext, wr: CodeWriter): Promise<void>;
    CreateLambda(node: CodeNode, ctx: RangerAppWriterContext, wr: CodeWriter): Promise<void>;
    writeNewCall(node: CodeNode, ctx: RangerAppWriterContext, wr: CodeWriter): Promise<void>;
    haveSameSig(fn1: RangerAppFunctionDesc, fn2: RangerAppFunctionDesc, ctx: RangerAppWriterContext): boolean;
    CustomOperator(node: CodeNode, ctx: RangerAppWriterContext, wr: CodeWriter): Promise<void>;
    writeClass(node: CodeNode, ctx: RangerAppWriterContext, wr: CodeWriter): Promise<void>;
}
export declare class RangerCppClassWriter extends RangerGenericClassWriter {
    compiler: LiveCompiler;
    header_created: boolean;
    constructor();
    adjustType(tn: string): string;
    WriteScalarValue(node: CodeNode, ctx: RangerAppWriterContext, wr: CodeWriter): void;
    getObjectTypeString(type_string: string, ctx: RangerAppWriterContext): string;
    getTypeString2(type_string: string, ctx: RangerAppWriterContext): string;
    writePtr(node: CodeNode, ctx: RangerAppWriterContext, wr: CodeWriter): void;
    writeTypeDef(node: CodeNode, ctx: RangerAppWriterContext, wr: CodeWriter): Promise<void>;
    WriteVRef(node: CodeNode, ctx: RangerAppWriterContext, wr: CodeWriter): Promise<void>;
    writeVarDef(node: CodeNode, ctx: RangerAppWriterContext, wr: CodeWriter): Promise<void>;
    disabledVarDef(node: CodeNode, ctx: RangerAppWriterContext, wr: CodeWriter): Promise<void>;
    CreateCallExpression(node: CodeNode, ctx: RangerAppWriterContext, wr: CodeWriter): Promise<void>;
    CustomOperator(node: CodeNode, ctx: RangerAppWriterContext, wr: CodeWriter): Promise<void>;
    CreateMethodCall(node: CodeNode, ctx: RangerAppWriterContext, wr: CodeWriter): Promise<void>;
    CreatePropertyGet(node: CodeNode, ctx: RangerAppWriterContext, wr: CodeWriter): Promise<void>;
    CreateLambdaCall(node: CodeNode, ctx: RangerAppWriterContext, wr: CodeWriter): Promise<void>;
    CreateLambda(node: CodeNode, ctx: RangerAppWriterContext, wr: CodeWriter): Promise<void>;
    writeCppHeaderVar(node: CodeNode, ctx: RangerAppWriterContext, wr: CodeWriter, do_initialize: boolean): Promise<void>;
    writeArgsDef(fnDesc: RangerAppFunctionDesc, ctx: RangerAppWriterContext, wr: CodeWriter): Promise<void>;
    writeFnCall(node: CodeNode, ctx: RangerAppWriterContext, wr: CodeWriter): Promise<void>;
    writeNewCall(node: CodeNode, ctx: RangerAppWriterContext, wr: CodeWriter): Promise<void>;
    writeArrayLiteral(node: CodeNode, ctx: RangerAppWriterContext, wr: CodeWriter): Promise<void>;
    writeClassHeader(node: CodeNode, ctx: RangerAppWriterContext, wr: CodeWriter): Promise<void>;
    CreateUnions(parser: RangerFlowParser, ctx: RangerAppWriterContext, wr: CodeWriter): Promise<void>;
    writeClass(node: CodeNode, ctx: RangerAppWriterContext, orig_wr: CodeWriter): Promise<void>;
}
export declare class RangerKotlinClassWriter extends RangerGenericClassWriter {
    compiler: LiveCompiler;
    constructor();
    WriteScalarValue(node: CodeNode, ctx: RangerAppWriterContext, wr: CodeWriter): void;
    adjustType(tn: string): string;
    getObjectTypeString(type_string: string, ctx: RangerAppWriterContext): string;
    getTypeString(type_string: string): string;
    writeTypeDef(node: CodeNode, ctx: RangerAppWriterContext, wr: CodeWriter): Promise<void>;
    WriteVRef(node: CodeNode, ctx: RangerAppWriterContext, wr: CodeWriter): Promise<void>;
    writeVarDef(node: CodeNode, ctx: RangerAppWriterContext, wr: CodeWriter): Promise<void>;
    writeArgsDef(fnDesc: RangerAppFunctionDesc, ctx: RangerAppWriterContext, wr: CodeWriter): Promise<void>;
    writeFnCall(node: CodeNode, ctx: RangerAppWriterContext, wr: CodeWriter): Promise<void>;
    writeNewCall(node: CodeNode, ctx: RangerAppWriterContext, wr: CodeWriter): Promise<void>;
    writeClass(node: CodeNode, ctx: RangerAppWriterContext, orig_wr: CodeWriter): Promise<void>;
}
export declare class RangerCSharpClassWriter extends RangerGenericClassWriter {
    compiler: LiveCompiler;
    constructor();
    adjustType(tn: string): string;
    getObjectTypeString(type_string: string, ctx: RangerAppWriterContext): string;
    getTypeString(type_string: string): string;
    writeLambdaType(expression_value: CodeNode, ctx: RangerAppWriterContext, wr: CodeWriter): Promise<void>;
    writeTypeDef(node: CodeNode, ctx: RangerAppWriterContext, wr: CodeWriter): Promise<void>;
    WriteVRef(node: CodeNode, ctx: RangerAppWriterContext, wr: CodeWriter): Promise<void>;
    writeVarDef(node: CodeNode, ctx: RangerAppWriterContext, wr: CodeWriter): Promise<void>;
    CreateLambda(node: CodeNode, ctx: RangerAppWriterContext, wr: CodeWriter): Promise<void>;
    writeArgsDef(fnDesc: RangerAppFunctionDesc, ctx: RangerAppWriterContext, wr: CodeWriter): Promise<void>;
    writeArrayLiteral(node: CodeNode, ctx: RangerAppWriterContext, wr: CodeWriter): Promise<void>;
    writeClass(node: CodeNode, ctx: RangerAppWriterContext, orig_wr: CodeWriter): Promise<void>;
}
export declare class RangerScalaClassWriter extends RangerGenericClassWriter {
    compiler: LiveCompiler;
    init_done: boolean;
    constructor();
    getObjectTypeString(type_string: string, ctx: RangerAppWriterContext): string;
    getTypeString(type_string: string): string;
    writeTypeDef(node: CodeNode, ctx: RangerAppWriterContext, wr: CodeWriter): Promise<void>;
    writeTypeDefNoOption(node: CodeNode, ctx: RangerAppWriterContext, wr: CodeWriter): Promise<void>;
    WriteVRef(node: CodeNode, ctx: RangerAppWriterContext, wr: CodeWriter): Promise<void>;
    writeVarDef(node: CodeNode, ctx: RangerAppWriterContext, wr: CodeWriter): Promise<void>;
    writeArgsDef(fnDesc: RangerAppFunctionDesc, ctx: RangerAppWriterContext, wr: CodeWriter): Promise<void>;
    writeFnEnd(node: CodeNode, ctx: RangerAppWriterContext, wr: CodeWriter): Promise<void>;
    writeFnStart(node: CodeNode, ctx: RangerAppWriterContext, wr: CodeWriter): void;
    CustomOperator(node: CodeNode, ctx: RangerAppWriterContext, wr: CodeWriter): Promise<void>;
    CreateLambda(node: CodeNode, ctx: RangerAppWriterContext, wr: CodeWriter): Promise<void>;
    writeArrayLiteral(node: CodeNode, ctx: RangerAppWriterContext, wr: CodeWriter): Promise<void>;
    writeClass(node: CodeNode, ctx: RangerAppWriterContext, orig_wr: CodeWriter): Promise<void>;
}
export declare class RangerGolangClassWriter extends RangerGenericClassWriter {
    compiler: LiveCompiler;
    thisName: string;
    write_raw_type: boolean;
    did_write_nullable: boolean;
    constructor();
    WriteScalarValue(node: CodeNode, ctx: RangerAppWriterContext, wr: CodeWriter): void;
    getObjectTypeString(type_string: string, ctx: RangerAppWriterContext): string;
    getTypeString2(type_string: string, ctx: RangerAppWriterContext): string;
    writeRawTypeDef(node: CodeNode, ctx: RangerAppWriterContext, wr: CodeWriter): Promise<void>;
    writeTypeDef(node: CodeNode, ctx: RangerAppWriterContext, wr: CodeWriter): Promise<void>;
    writeArrayTypeDef(node: CodeNode, ctx: RangerAppWriterContext, wr: CodeWriter): void;
    writeTypeDef2(node: CodeNode, ctx: RangerAppWriterContext, wr: CodeWriter): void;
    WriteVRef(node: CodeNode, ctx: RangerAppWriterContext, wr: CodeWriter): Promise<void>;
    WriteSetterVRef(node: CodeNode, ctx: RangerAppWriterContext, wr: CodeWriter): Promise<void>;
    goExtractAssign(value: CodeNode, p: RangerAppParamDesc, ctx: RangerAppWriterContext, wr: CodeWriter): Promise<void>;
    writeStructField(node: CodeNode, ctx: RangerAppWriterContext, wr: CodeWriter): Promise<void>;
    writeVarDef(node: CodeNode, ctx: RangerAppWriterContext, wr: CodeWriter): Promise<void>;
    writeArgsDef(fnDesc: RangerAppFunctionDesc, ctx: RangerAppWriterContext, wr: CodeWriter): Promise<void>;
    writeNewCall(node: CodeNode, ctx: RangerAppWriterContext, wr: CodeWriter): Promise<void>;
    writeArrayLiteral(node: CodeNode, ctx: RangerAppWriterContext, wr: CodeWriter): Promise<void>;
    CreateLambdaCall(node: CodeNode, ctx: RangerAppWriterContext, wr: CodeWriter): Promise<void>;
    CreateLambda(node: CodeNode, ctx: RangerAppWriterContext, wr: CodeWriter): Promise<void>;
    CustomOperator(node: CodeNode, ctx: RangerAppWriterContext, wr: CodeWriter): Promise<void>;
    writeInterface(cl: RangerAppClassDesc, ctx: RangerAppWriterContext, wr: CodeWriter): Promise<void>;
    writeClass(node: CodeNode, ctx: RangerAppWriterContext, orig_wr: CodeWriter): Promise<void>;
}
export declare class RangerPHPClassWriter extends RangerGenericClassWriter {
    compiler: LiveCompiler;
    thisName: string;
    wrote_header: boolean;
    constructor();
    adjustType(tn: string): string;
    EncodeString(node: CodeNode, ctx: RangerAppWriterContext, wr: CodeWriter): string;
    WriteScalarValue(node: CodeNode, ctx: RangerAppWriterContext, wr: CodeWriter): void;
    WriteVRef(node: CodeNode, ctx: RangerAppWriterContext, wr: CodeWriter): Promise<void>;
    writeVarInitDef(node: CodeNode, ctx: RangerAppWriterContext, wr: CodeWriter): Promise<void>;
    writeVarDef(node: CodeNode, ctx: RangerAppWriterContext, wr: CodeWriter): Promise<void>;
    disabledVarDef(node: CodeNode, ctx: RangerAppWriterContext, wr: CodeWriter): Promise<void>;
    CreateMethodCall(node: CodeNode, ctx: RangerAppWriterContext, wr: CodeWriter): Promise<void>;
    CreatePropertyGet(node: CodeNode, ctx: RangerAppWriterContext, wr: CodeWriter): Promise<void>;
    CreateLambdaCall(node: CodeNode, ctx: RangerAppWriterContext, wr: CodeWriter): Promise<void>;
    CreateLambda(node: CodeNode, ctx: RangerAppWriterContext, wr: CodeWriter): Promise<void>;
    writeClassVarDef(node: CodeNode, ctx: RangerAppWriterContext, wr: CodeWriter): void;
    writeArgsDef(fnDesc: RangerAppFunctionDesc, ctx: RangerAppWriterContext, wr: CodeWriter): void;
    writeArrayLiteral(node: CodeNode, ctx: RangerAppWriterContext, wr: CodeWriter): Promise<void>;
    writeFnCall(node: CodeNode, ctx: RangerAppWriterContext, wr: CodeWriter): Promise<void>;
    writeNewCall(node: CodeNode, ctx: RangerAppWriterContext, wr: CodeWriter): Promise<void>;
    CreateCallExpression(node: CodeNode, ctx: RangerAppWriterContext, wr: CodeWriter): Promise<void>;
    writeClass(node: CodeNode, ctx: RangerAppWriterContext, orig_wr: CodeWriter): Promise<void>;
}
export declare class WebPageWriter {
    classWriter: RangerGenericClassWriter;
    constructor();
    CreatePage(parser: RangerFlowParser, node: CodeNode, ctx: RangerAppWriterContext, orig_wr: CodeWriter): Promise<void>;
}
export declare class RangerJavaScriptClassWriter extends RangerGenericClassWriter {
    compiler: LiveCompiler;
    thisName: string;
    wrote_header: boolean;
    target_flow: boolean;
    target_typescript: boolean;
    constructor();
    lineEnding(): string;
    adjustType(tn: string): string;
    CreateTsUnions(parser: RangerFlowParser, ctx: RangerAppWriterContext, wr: CodeWriter): Promise<void>;
    writeFnCall(node: CodeNode, ctx: RangerAppWriterContext, wr: CodeWriter): Promise<void>;
    CreateCallExpression(node: CodeNode, ctx: RangerAppWriterContext, wr: CodeWriter): Promise<void>;
    getObjectTypeString(type_string: string, ctx: RangerAppWriterContext): string;
    getTypeString(type_string: string): string;
    writeTypeDef(node: CodeNode, ctx: RangerAppWriterContext, wr: CodeWriter): Promise<void>;
    WriteVRef(node: CodeNode, ctx: RangerAppWriterContext, wr: CodeWriter): Promise<void>;
    writeVarInitDef(node: CodeNode, ctx: RangerAppWriterContext, wr: CodeWriter): Promise<void>;
    writeVarDef(node: CodeNode, ctx: RangerAppWriterContext, wr: CodeWriter): Promise<void>;
    writeClassVarDef(p: RangerAppParamDesc, ctx: RangerAppWriterContext, wr: CodeWriter): Promise<void>;
    CreateLambdaCall(node: CodeNode, ctx: RangerAppWriterContext, wr: CodeWriter): Promise<void>;
    CreateLambda(node: CodeNode, ctx: RangerAppWriterContext, wr: CodeWriter): Promise<void>;
    writeArgsDef(fnDesc: RangerAppFunctionDesc, ctx: RangerAppWriterContext, wr: CodeWriter): Promise<void>;
    writeClass(node: CodeNode, ctx: RangerAppWriterContext, orig_wr: CodeWriter): Promise<void>;
    BuildAST(code_string: string): CodeNode;
    CreateServices(parser: RangerFlowParser, ctx: RangerAppWriterContext, orig_wr: CodeWriter): Promise<void>;
    CreatePages(parser: RangerFlowParser, ctx: RangerAppWriterContext, orig_wr: CodeWriter): Promise<void>;
    CreatePage(parser: RangerFlowParser, node: CodeNode, ctx: RangerAppWriterContext, orig_wr: CodeWriter): Promise<void>;
    writeNpmPackage(node: CodeNode, ctx: RangerAppWriterContext, orig_wr: CodeWriter): Promise<void>;
}
export declare class RangerRangerClassWriter extends RangerGenericClassWriter {
    compiler: LiveCompiler;
    constructor();
    adjustType(tn: string): string;
    getObjectTypeString(type_string: string, ctx: RangerAppWriterContext): string;
    getTypeString(type_string: string): string;
    writeArrayLiteral(node: CodeNode, ctx: RangerAppWriterContext, wr: CodeWriter): Promise<void>;
    writeTypeDef(node: CodeNode, ctx: RangerAppWriterContext, wr: CodeWriter): Promise<void>;
    WriteVRef(node: CodeNode, ctx: RangerAppWriterContext, wr: CodeWriter): Promise<void>;
    WriteVRefWithOpt(node: CodeNode, ctx: RangerAppWriterContext, wr: CodeWriter): void;
    writeVarDef(node: CodeNode, ctx: RangerAppWriterContext, wr: CodeWriter): Promise<void>;
    CreateLambdaCall(node: CodeNode, ctx: RangerAppWriterContext, wr: CodeWriter): Promise<void>;
    CreateLambda(node: CodeNode, ctx: RangerAppWriterContext, wr: CodeWriter): Promise<void>;
    writeFnCall(node: CodeNode, ctx: RangerAppWriterContext, wr: CodeWriter): Promise<void>;
    writeNewCall(node: CodeNode, ctx: RangerAppWriterContext, wr: CodeWriter): Promise<void>;
    writeArgsDef(fnDesc: RangerAppFunctionDesc, ctx: RangerAppWriterContext, wr: CodeWriter): Promise<void>;
    CreateCallExpression(node: CodeNode, ctx: RangerAppWriterContext, wr: CodeWriter): Promise<void>;
    writeClass(node: CodeNode, ctx: RangerAppWriterContext, orig_wr: CodeWriter): Promise<void>;
}
export declare class OpList {
    list: Array<CodeNode>;
    constructor();
}
export declare class RangerActiveOperators {
    stdCommands: CodeNode;
    parent: RangerActiveOperators;
    opHash: {
        [key: string]: OpList;
    };
    initialized: boolean;
    constructor();
    fork(fromOperator: CodeNode): RangerActiveOperators;
    initializeOpCache(): Promise<void>;
    getOperators(name: string): Promise<Array<CodeNode>>;
    initFrom(main: CodeNode): void;
}
export declare class LiveCompiler {
    parser: RangerFlowParser;
    langWriter: RangerGenericClassWriter;
    hasCreatedPolyfill: {
        [key: string]: boolean;
    };
    lastProcessedNode: CodeNode;
    repeat_index: number;
    installedFile: {
        [key: string]: boolean;
    };
    constructor();
    initWriter(ctx: RangerAppWriterContext): void;
    EncodeString(node: CodeNode, ctx: RangerAppWriterContext, wr: CodeWriter): string;
    WriteScalarValue(node: CodeNode, ctx: RangerAppWriterContext, wr: CodeWriter): void;
    adjustType(tn: string): string;
    WriteVRef(node: CodeNode, ctx: RangerAppWriterContext, wr: CodeWriter): Promise<void>;
    writeTypeDef(node: CodeNode, ctx: RangerAppWriterContext, wr: CodeWriter): Promise<void>;
    CreateLambdaCall(node: CodeNode, ctx: RangerAppWriterContext, wr: CodeWriter): Promise<void>;
    CreateCallExpression(node: CodeNode, ctx: RangerAppWriterContext, wr: CodeWriter): Promise<void>;
    CreateLambda(node: CodeNode, ctx: RangerAppWriterContext, wr: CodeWriter): Promise<void>;
    getTypeString(str: string, ctx: RangerAppWriterContext): string;
    createPolyfill(code: string, ctx: RangerAppWriterContext, wr: CodeWriter): void;
    installFile(filename: string, ctx: RangerAppWriterContext, wr: CodeWriter): Promise<void>;
    findOpCode(op: CodeNode, node: CodeNode, ctx: RangerAppWriterContext, wr: CodeWriter): Promise<void>;
    findOpTemplate(op: CodeNode, node: CodeNode, ctx: RangerAppWriterContext, wr: CodeWriter): Promise<CodeNode>;
    localCall(node: CodeNode, ctx: RangerAppWriterContext, wr: CodeWriter): Promise<boolean>;
    WalkNode(node: CodeNode, in_ctx: RangerAppWriterContext, wr: CodeWriter): Promise<void>;
    walkCommandList(cmd: CodeNode, node: CodeNode, ctx: RangerAppWriterContext, wr: CodeWriter): Promise<void>;
    walkCommand(cmd: CodeNode, node: CodeNode, ctx: RangerAppWriterContext, wr: CodeWriter): Promise<void>;
    compile(node: CodeNode, ctx: RangerAppWriterContext, wr: CodeWriter): void;
    findParamDesc(obj: CodeNode, ctx: RangerAppWriterContext, wr: CodeWriter): RangerAppParamDesc;
}
export declare class ColorConsole {
    constructor();
    out(color: string, str: string): void;
}
export declare class RangerDocGenerator {
    constructor();
    writeTypeDef(item: CodeNode, ctx: RangerAppWriterContext, wr: CodeWriter): Promise<void>;
    writeArgDefs(node: CodeNode, ctx: RangerAppWriterContext, wr: CodeWriter): Promise<void>;
    createClassDoc(node: CodeNode, ctx: RangerAppWriterContext, orig_wr: CodeWriter): Promise<void>;
    writeOpDesc(item: CodeNode, ctx: RangerAppWriterContext, wr: CodeWriter): Promise<void>;
    writeTypeDoc(list: Array<RangerAppOperatorDesc>, tester: (item: RangerAppOperatorDesc) => boolean, ctx: RangerAppWriterContext, wr: CodeWriter): Promise<void>;
    createOperatorDoc(node: CodeNode, ctx: RangerAppWriterContext, orig_wr: CodeWriter): Promise<void>;
}
export declare class viewbuilder_Android {
    constructor();
    _attr(wr: CodeWriter, name: string, value: string): void;
    elWithText(name: string, node: CodeNode, wr: CodeWriter): Promise<void>;
    WalkNode(node: CodeNode, ctx: RangerAppWriterContext, wr: CodeWriter): Promise<void>;
    writeClass(node: CodeNode, ctx: RangerAppWriterContext, orig_wr: CodeWriter): Promise<void>;
}
export declare class viewbuilder_Web {
    constructor();
    _attr(wr: CodeWriter, name: string, value: string): void;
    tagAttrs(node: CodeNode, ctx: RangerAppWriterContext, wr: CodeWriter): Promise<void>;
    tagText(node: CodeNode, ctx: RangerAppWriterContext, wr: CodeWriter): Promise<void>;
    tag(name: string, node: CodeNode, ctx: RangerAppWriterContext, wr: CodeWriter): Promise<void>;
    WalkNode(node: CodeNode, ctx: RangerAppWriterContext, wr: CodeWriter): Promise<void>;
    CreateViews(ctx: RangerAppWriterContext, wr: CodeWriter): Promise<void>;
    writeClass(node: CodeNode, ctx: RangerAppWriterContext, wr: CodeWriter): Promise<void>;
}
export declare class CompilerResults {
    ctx: RangerAppWriterContext;
    fileSystem: CodeFileSystem;
    target_dir: string;
    constructor();
}
export declare class VirtualCompiler {
    envObj: InputEnv;
    constructor();
    getEnvVar(name: string): string;
    possiblePaths(envVarName: string): Array<string>;
    searchLib(paths: Array<string>, libname: string): string;
    fillStr(cnt: number): string;
    run(env: InputEnv): Promise<CompilerResults>;
    static create_env(): Promise<void>;
    static displayCompilerErrors(appCtx: RangerAppWriterContext): void;
    static displayParserErrors(appCtx: RangerAppWriterContext): void;
}
export declare class CompilerInterface {
    constructor();
    static create_env(): InputEnv;
}
export {};
