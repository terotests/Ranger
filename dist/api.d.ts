type union_Any = CmdParams | test_cmdparams | InputFSFolder | InputFSFile | InputEnv | test_input_filesystem | RangerAppTodo | RangerCompilerMessage | RangerParamEventHandler | RangerParamEventList | RangerParamEventMap | RangerAppArrayValue | RangerAppHashValue | RangerAppValue | RangerRefForce | RangerAppParamDesc | RangerAppFunctionDesc | RangerAppMethodVariants | RangerAppInterfaceImpl | RangerTraitParams | RangerAppClassDesc | RangerTypeClass | SourceCode | CodeNodeLiteral | CodeNode | TTypeRegistry | TypeCounts | RangerNodeValue | RangerBackReference | RangerAppEnum | OpFindResult | RangerOperatorList | RangerNodeList | ContextTransaction | ContextTransactionMutation | RangerRegisteredPlugin | RangerAppWriterContext | SourceMapEntry | SourceMapBuilder | CodeFile | CodeFileSystem | CodeSlice | CodeWriter | RangerLispParser | TTypes | RangerArgMatch | DictNode | RangerSerializeClass | RangerImmutableExtension | RangerProcessLifecycle | RangerProcessClass | RangerProcessProcSend | RangerProcessProcStartCheck | RangerProcessCodegen | RangerServiceBuilder | RangerAppOperatorDesc | TFiles | ClassJoinPoint | WalkLater | RangerFlowParser | TFactory | CallChain | NodeEvalState | RangerGenericClassWriter | AndroidPageWriter | RangerJava7ClassWriter | RangerSwift3ClassWriter | RangerSwift6ClassWriter | RangerCppClassWriter | MethodCallList | RangerRustClassWriter | RangerKotlinClassWriter | RangerCSharpClassWriter | RangerScalaClassWriter | RangerGolangClassWriter | RangerGolangHttpServerWriter | RangerPHPClassWriter | RangerPythonClassWriter | WebPageWriter | RangerJavaScriptClassWriter | RangerRangerClassWriter | LowIRUtil | LowIRParam | LowIRInstr | LowIRBlock | LowIRFunction | LowIRField | LowIRTypeFieldDesc | LowIRTypeDesc | LowIRStruct | LowIRStringGlobal | LowIRExternDecl | LowIRModule | LowIRSession | LowIRBuilder | LowIRRuntimeGen | LowIRTarget | LowIRLowerContext | LambdaCaptureInfo | LowIRBuilderPass | LLVMIRWriter | WATWriter | RangerLLVMPipeline | RangerLLVMClassWriter | OpList | RangerActiveOperators | LiveCompiler | ColorConsole | CLIProgress | RangerDocGenerator | StaticAnalyzer | viewbuilder_Android | viewbuilder_Web | CompilerResults | VirtualCompiler | CompilerInterface | number | string | boolean | number;
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
    getParam(name: string): string | undefined;
    collect(): void;
    toDictionary(): Record<string, any>;
    static fromDictionary(dict: Record<string, any>): CmdParams;
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
    toDictionary(): Record<string, any>;
    static fromDictionary(dict: Record<string, any>): InputFSFolder;
}
export declare class InputFSFile {
    name: string;
    data: string;
    is_folder: boolean;
    base64bin: boolean;
    constructor();
    toDictionary(): Record<string, any>;
    static fromDictionary(dict: Record<string, any>): InputFSFile;
}
export declare class InputEnv {
    use_real: boolean;
    filesystem?: InputFSFolder;
    envVars: {
        [key: string]: string;
    };
    commandLine?: CmdParams;
    constructor();
    setEnv(name: string, value: string): void;
    toDictionary(): Record<string, any>;
    static fromDictionary(dict: Record<string, any>): InputEnv;
}
export declare class test_input_filesystem {
    constructor();
}
export declare class RangerAppTodo {
    description: string;
    todonode?: CodeNode;
    constructor();
}
export declare class RangerCompilerMessage {
    error_level: number;
    code_line: number;
    fileName: string;
    description: string;
    node?: CodeNode;
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
    arr?: RangerAppArrayValue;
    hash?: RangerAppHashValue;
    constructor();
}
export declare class RangerRefForce {
    strength: number;
    lifetime: number;
    changer?: CodeNode;
    constructor();
}
export declare class RangerAppParamDesc {
    name: string;
    value?: RangerAppValue;
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
    def_value?: CodeNode;
    default_value?: RangerNodeValue;
    isThis: boolean;
    classDesc?: RangerAppClassDesc;
    is_immutable: boolean;
    is_static: boolean;
    propertyClass?: RangerAppClassDesc;
    fnDesc?: RangerAppFunctionDesc;
    ownerHistory: Array<RangerRefForce>;
    varType: number;
    refType: number;
    initRefType: number;
    isParam?: boolean;
    paramIndex: number;
    is_optional: boolean;
    is_mutating: boolean;
    is_set: boolean;
    is_class_variable: boolean;
    is_captured: boolean;
    mutation_count: number;
    read_count: number;
    is_assigned_from_member: boolean;
    source_member_name: string;
    escapes_function: boolean;
    needs_cpp_reference: boolean;
    rust_borrow_type: number;
    rust_assigned_to_weak: boolean;
    rust_needs_rc_wrap: boolean;
    rust_assigned_to_field: boolean;
    ownership_kind: number;
    ownership_resolved: boolean;
    escapes_via: string;
    escape_owners: Array<string>;
    escape_via_call: boolean;
    ownership_read_only: boolean;
    node?: CodeNode;
    nameNode?: CodeNode;
    fnBody?: CodeNode;
    params: Array<RangerAppParamDesc>;
    return_value?: RangerAppParamDesc;
    description: string;
    git_doc: string;
    has_events: boolean;
    eMap?: RangerParamEventMap;
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
    node?: CodeNode;
    nameNode?: CodeNode;
    fnBody?: CodeNode;
    params: Array<RangerAppParamDesc>;
    return_value?: RangerAppParamDesc;
    is_method: boolean;
    is_static: boolean;
    is_lambda: boolean;
    is_unsed: boolean;
    is_called_from_main: boolean;
    container_class?: RangerAppClassDesc;
    refType: number;
    fnCtx?: RangerAppWriterContext;
    insideFn?: RangerAppFunctionDesc;
    call_graph_done: boolean;
    isCalling: Array<RangerAppFunctionDesc>;
    isCalledBy: Array<RangerAppFunctionDesc>;
    isUsingClasses: Array<RangerAppClassDesc>;
    isDirectlyUsingClasses: Array<RangerAppClassDesc>;
    myLambdas: Array<RangerAppFunctionDesc>;
    returns_member_field: boolean;
    returned_member_name: string;
    all_paths_return: boolean;
    mutates_self: boolean;
    static_analysis_done: boolean;
    rust_uses_self: boolean;
    rust_passes_self_to_weak: boolean;
    rust_can_be_static: boolean;
    mutation_analysis_done: boolean;
    mutation_analysis_in_progress: boolean;
    directly_mutates_self: boolean;
    transitively_mutates_self: boolean;
    mutates_param_indices: Array<number>;
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
    typeParams?: CodeNode;
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
    systemInfo?: CodeNode;
    is_interface: boolean;
    is_system_union: boolean;
    is_template: boolean;
    is_serialized: boolean;
    is_process: boolean;
    process_path: string;
    is_singleton: boolean;
    is_trait: boolean;
    is_record: boolean;
    is_operator_class: boolean;
    is_generic_instance: boolean;
    is_union: boolean;
    is_used_by_main: boolean;
    is_not_used: boolean;
    generic_params?: CodeNode;
    ctx?: RangerAppWriterContext;
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
    is_collected: boolean;
    constructor_node?: CodeNode;
    constructor_fn?: RangerAppFunctionDesc;
    has_destructor: boolean;
    destructor_node?: CodeNode;
    destructor_fn?: RangerAppFunctionDesc;
    extends_classes: Array<string>;
    implements_interfaces: Array<string>;
    consumes_traits: Array<string>;
    trait_params: {
        [key: string]: RangerTraitParams;
    };
    is_union_of: Array<string>;
    nameNode?: CodeNode;
    classNode?: CodeNode;
    contr_writers: Array<CodeWriter>;
    is_inherited: boolean;
    is_extended_by_children: boolean;
    child_classes: Array<string>;
    constructor();
    isClass(): boolean;
    isProperty(): boolean;
    doesInherit(): boolean;
    isNormalClass(): boolean;
    getSystemclassType(): string;
    isSystemclassType(typeName: string): boolean;
    hasTrait(class_name: string, ctx: RangerAppWriterContext): RangerAppClassDesc | undefined;
    isSameOrParentClass(class_name: string, ctx: RangerAppWriterContext): boolean;
    hasOwnMethod(m_name: string): boolean;
    methodParamSignature(fnDesc: RangerAppFunctionDesc): string;
    hasDuplicateMethodSignature(fnDesc: RangerAppFunctionDesc): boolean;
    hasMethod(m_name: string): boolean;
    findMethod(f_name: string): RangerAppFunctionDesc | undefined;
    findMethodByCompiledName(compiled: string): RangerAppFunctionDesc | undefined;
    isSingletonClass(): boolean;
    buildSingletonAccessor(): RangerAppFunctionDesc | undefined;
    hasStaticMethod(m_name: string): boolean;
    findStaticMethod(f_name: string): RangerAppFunctionDesc | undefined;
    findVariable(f_name: string): RangerAppParamDesc | undefined;
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
    arrayType?: RangerTypeClass;
    keyType?: RangerTypeClass;
    implements_traits: Array<RangerTypeClass>;
    implements_interfaces: Array<RangerTypeClass>;
    extends_classes: Array<RangerTypeClass>;
    belongs_to_union: Array<RangerTypeClass>;
    description?: union_Any;
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
    nameNode?: CodeNode;
    templateParams?: CodeNode;
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
    vref_annotation?: CodeNodeLiteral;
    has_type_annotation: boolean;
    type_annotation?: CodeNodeLiteral;
    parsed_type: number;
    value_type: number;
    double_value: number;
    string_value: string;
    int_value: number;
    boolean_value: boolean;
    expression_value?: CodeNodeLiteral;
    props: {
        [key: string]: CodeNodeLiteral;
    };
    prop_keys: Array<string>;
    comments: Array<CodeNodeLiteral>;
    children: Array<CodeNodeLiteral>;
    attrs: Array<CodeNodeLiteral>;
    constructor();
    toDictionary(): Record<string, any>;
    static fromDictionary(dict: Record<string, any>): CodeNodeLiteral;
}
export declare class CodeNode {
    code?: SourceCode;
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
    infix_node?: CodeNode;
    infix_subnode: boolean;
    has_lambda: boolean;
    has_lambda_call: boolean;
    has_call: boolean;
    rust_needs_preevaluate: boolean;
    rust_preevaluated_args: Array<CodeNode>;
    rust_use_tmpvar: string;
    operator_pred: number;
    to_the_right: boolean;
    right_node?: CodeNode;
    type_type: string;
    type_name: string;
    key_type: string;
    array_type: string;
    ns: Array<string>;
    has_vref_annotation: boolean;
    vref_annotation?: CodeNode;
    has_type_annotation: boolean;
    type_annotation?: CodeNode;
    parsed_type: number;
    value_type: number;
    ref_type: number;
    ref_need_assign: number;
    double_value: number;
    string_value: string;
    int_value: number;
    boolean_value: boolean;
    expression_value?: CodeNode;
    props: {
        [key: string]: CodeNode;
    };
    prop_keys: Array<string>;
    comments: Array<CodeNode>;
    children: Array<CodeNode>;
    parent?: CodeNode;
    attrs: Array<CodeNode>;
    appGUID: string;
    register_name: string;
    register_expressions: Array<CodeNode>;
    after_expression: Array<CodeNode>;
    definedTypeClass?: RangerTypeClass;
    evalTypeClass?: RangerTypeClass;
    lambda_ctx?: RangerAppWriterContext;
    nsp: Array<RangerAppParamDesc>;
    eval_type: number;
    eval_type_name: string;
    eval_key_type: string;
    eval_array_type: string;
    eval_function?: CodeNode;
    flow_done: boolean;
    ref_change_done: boolean;
    eval_type_node?: CodeNode;
    didReturnAtIndex: number;
    hasVarDef: boolean;
    hasClassDescription: boolean;
    hasNewOper: boolean;
    clDesc?: RangerAppClassDesc;
    hasFnCall: boolean;
    fnDesc?: RangerAppFunctionDesc;
    lambdaFnDesc?: RangerAppFunctionDesc;
    hasParamDesc: boolean;
    paramDesc?: RangerAppParamDesc;
    ownParamDesc?: RangerAppParamDesc;
    evalCtx?: RangerAppWriterContext;
    evalState?: NodeEvalState;
    operator_node?: CodeNode;
    flow_ctx?: RangerAppWriterContext;
    is_part_of_chain: boolean;
    methodChain: Array<CallChain>;
    chainTarget?: CodeNode;
    register_set: boolean;
    did_walk: boolean;
    reg_compiled_name: string;
    tag: string;
    matched_type: string;
    constructor(source: SourceCode, start: number, end: number);
    childCnt(): number;
    getChild(index: number): CodeNode | undefined;
    chlen(): number;
    forTree(callback: (item: CodeNode, i: number) => void): Promise<void>;
    parallelTree(otherTree: CodeNode, callback: (left: CodeNode, right: CodeNode, i: number) => void): void;
    walkTreeUntil(callback: (item: CodeNode, i: number) => boolean): void;
    getParsedString(): string;
    getFilename(): string;
    getFlag(flagName: string): CodeNode | undefined;
    hasFlag(flagName: string): boolean;
    setFlag(flagName: string): void;
    getFlagInt(flagName: string, paramName: string, defaultValue: number): number;
    getFlagFirstString(flagName: string, defaultValue: string): string;
    getFlagSiblingString(flagName: string, defaultValue: string): string;
    hasFlagParam(flagName: string, paramName: string): boolean;
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
    getExpressionProperty(name: string): CodeNode | undefined;
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
    finalizeAsCallChainRoot(): void;
    tryDesugarNewMethodChain(): boolean;
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
export declare class TTypeRegistry {
    constructor();
    static scalarPrimitiveNames(): Array<string>;
    static isIntAlias(typeName: string): boolean;
    static isFloatAlias(typeName: string): boolean;
    static canonicalScalar(typeName: string): string;
    static bufferTypeNames(): Array<string>;
    static isScalarPrimitive(typeName: string): boolean;
    static isBufferType(typeName: string): boolean;
    static isPrimitiveTypeName(typeName: string): boolean;
    static isKnownTypeName(typeName: string): boolean;
    static nameToNodeType(name: string): number;
    static nodeTypeToName(valueType: number): string;
    static isNodePrimitive(valueType: number): boolean;
    static targetTypeString(lang: string, typeName: string): string;
    static listContains(list: Array<string>, value: string): boolean;
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
    double_value?: number;
    string_value?: string;
    int_value?: number;
    boolean_value?: boolean;
    expression_value?: CodeNode;
    constructor();
}
export declare class RangerBackReference {
    from_class?: string;
    var_name?: string;
    ref_type?: string;
    constructor();
}
export declare class RangerAppEnum {
    name: string;
    cnt: number;
    values: {
        [key: string]: number;
    };
    node?: CodeNode;
    constructor();
    add(n: string): void;
}
export declare class OpFindResult {
    did_find: boolean;
    node?: CodeNode;
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
    ctx?: RangerAppWriterContext;
    mutations: Array<ContextTransactionMutation>;
    parent?: ContextTransaction;
    children: Array<ContextTransaction>;
    constructor();
}
export declare class ContextTransactionMutation {
    sourceNode?: CodeNode;
    targetNode?: CodeNode;
    addedNode?: CodeNode;
    constructor();
}
export declare class RangerRegisteredPlugin {
    name: string;
    features: Array<string>;
    constructor();
}
export declare class RangerAppWriterContext {
    langOperators?: CodeNode;
    stdCommands?: CodeNode;
    operators?: RangerActiveOperators;
    op_list: {
        [key: string]: RangerOperatorList;
    };
    reservedWords?: CodeNode;
    intRootCounter: number;
    targetLangName: string;
    parent?: RangerAppWriterContext;
    defined_imports: Array<string>;
    active_macros: {
        [key: string]: boolean;
    };
    macro_expansion_depth: number;
    already_imported: {
        [key: string]: boolean;
    };
    fileSystem?: CodeFileSystem;
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
    in_lhs_of_assignment: boolean;
    in_method: boolean;
    method_stack: Array<boolean>;
    typeNames: Array<string>;
    typeClasses: {
        [key: string]: RangerTypeClass;
    };
    currentClassName?: string;
    in_class: boolean;
    in_static_method: boolean;
    currentClass?: RangerAppClassDesc;
    currentMethod?: RangerAppFunctionDesc;
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
    parser?: RangerFlowParser;
    compiler?: LiveCompiler;
    pluginNodes: {
        [key: string]: RangerNodeList;
    };
    typedNodes: {
        [key: string]: RangerNodeList;
    };
    registered_plugins: Array<RangerRegisteredPlugin>;
    operatorFunction?: (name: string) => CodeNode;
    lastBlockOp?: CodeNode;
    opFnsList: {
        [key: string]: CodeNode;
    };
    test_compile: Array<boolean>;
    activeTransaction: Array<ContextTransaction>;
    transactions: Array<ContextTransaction>;
    env?: InputEnv;
    rust_moved_vars: {
        [key: string]: boolean;
    };
    rust_usage_count: {
        [key: string]: number;
    };
    rust_temp_counter: number;
    rootFile: string;
    constructor();
    rustMarkMoved(varName: string): void;
    rustIsMoved(varName: string): boolean;
    rustClearMoved(varName: string): void;
    rustIncUsage(varName: string): void;
    rustGetUsageCount(varName: string): number;
    rustNeedsClone(varName: string): boolean;
    rustGetTempVar(): string;
    getEnv(): InputEnv | undefined;
    setTestCompile(): void;
    unsetTestCompile(): void;
    isTestCompile(): boolean;
    addOpFn(name: string, code: CodeNode): void;
    getOpFns(name: string): Promise<Array<CodeNode>>;
    getLastBlockOp(): CodeNode | undefined;
    removePluginOp(name: string): void;
    isPluginOp(node: CodeNode): boolean;
    addPlugin(p: RangerRegisteredPlugin): void;
    findPluginsFor(featureName: string): Array<string>;
    addTypeClass(name: string): RangerTypeClass;
    getTypeClass(name: string): RangerTypeClass | undefined;
    getParser(): RangerFlowParser | undefined;
    getCompiler(): LiveCompiler | undefined;
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
    getViewClass(s_name: string): CodeNode | undefined;
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
    isDefinedCollectionType(typeName: string): boolean;
    hadValidType(node: CodeNode): boolean;
    findOperator(node: CodeNode): CodeNode;
    getStdCommands(): CodeNode;
    findOperatorsWithName(name: string): Promise<Array<CodeNode>>;
    findClassWithSign(node: CodeNode): RangerAppClassDesc;
    createSignature(origClass: string, classSig: string): string;
    createStaticMethod(withName: string, currC: RangerAppClassDesc, nameNode: CodeNode, argsNode: CodeNode, fnBody: CodeNode, parser: RangerFlowParser, wr: CodeWriter): Promise<RangerAppFunctionDesc>;
    canUseTypeInference(nameNode: CodeNode): boolean;
    createOpStaticClass(name: string): RangerAppClassDesc;
    createTraitInstanceClass(traitName: string, instanceName: string, initParams: CodeNode, flowParser: RangerFlowParser, wr: CodeWriter): Promise<RangerAppClassDesc> | undefined;
    createOperator(fromNode: CodeNode): void;
    findClassMethod(cname: string, fname: string): RangerAppFunctionDesc | undefined;
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
    getEnum(n: string): RangerAppEnum | undefined;
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
    assignParamCompiledName(p: RangerAppParamDesc): void;
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
    getCurrentClass(): RangerAppClassDesc | undefined;
    restartExpressionLevel(): void;
    newBlock(): void;
    isInExpression(): boolean;
    expressionLevel(): number;
    setInExpr(): void;
    unsetInExpr(): void;
    setInLhs(): void;
    unsetInLhs(): void;
    isInLhs(): boolean;
    getErrorCount(): number;
    isInStatic(): boolean;
    isInMain(): boolean;
    isInMethod(): boolean;
    setInMethod(): void;
    unsetInMethod(): void;
    findMethodLevelContext(): RangerAppWriterContext | undefined;
    findClassLevelContext(): RangerAppWriterContext | undefined;
    fork(): RangerAppWriterContext;
    getRootFile(): string;
    setRootFile(file_name: string): void;
}
export declare class SourceMapEntry {
    genLine: number;
    genCol: number;
    sourceIdx: number;
    origLine: number;
    origCol: number;
    nameIdx: number;
    constructor();
}
export declare class SourceMapBuilder {
    mappings: Array<SourceMapEntry>;
    sources: Array<string>;
    sourceToIdx: {
        [key: string]: number;
    };
    sourcesContent: Array<string>;
    names: Array<string>;
    nameToIdx: {
        [key: string]: number;
    };
    outputFile: string;
    constructor();
    isSyntheticSource(sourceFile: string): boolean;
    registerSourceIdx(sourceFile: string, sourceContent: string): number;
    registerNameIdx(name: string): number;
    addMapping(genLine: number, genCol: number, sourceFile: string, sourceContent: string, origLine: number, origCol: number, name: string): void;
    addMappingFromNode(genLine: number, genCol: number, node: CodeNode, name: string): void;
    vlqBase64Chars(): string;
    encodeVLQUnsigned(value: number): string;
    encodeSignedVLQ(value: number): string;
    buildMappingsString(): string;
    jsonEscape(value: string): string;
    jsonStringArray(items: Array<string>): string;
    toJSON(fileName: string): string;
    hasMappings(): boolean;
}
export declare class CodeFile {
    path_name: string;
    name: string;
    writer?: CodeWriter;
    import_list: {
        [key: string]: string;
    };
    import_names: Array<string>;
    fileSystem?: CodeFileSystem;
    sourceMapBuilder?: SourceMapBuilder;
    constructor(filePath: string, fileName: string);
    initSourceMapsIfNeeded(): void;
    addImport(import_name: string): void;
    rewrite(newString: string): void;
    testCreateWriter(): CodeWriter;
    getImports(): Array<string>;
    getWriter(): CodeWriter | undefined;
    getCode(): string;
}
export declare class CodeFileSystem {
    files: Array<CodeFile>;
    sourceMapsEnabled: boolean;
    constructor();
    enableSourceMaps(): void;
    shouldWriteSourceMaps(): boolean;
    getFile(path: string, name: string): CodeFile;
    mkdir(path: string): void;
    isJsOutputFile(fileName: string): boolean;
    saveTo(path: string, verbose: boolean): void;
}
export declare class CodeSlice {
    code: string;
    writer?: CodeWriter;
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
    columnNumber: number;
    indentAmount: number;
    compiledTags: {
        [key: string]: boolean;
    };
    tags: {
        [key: string]: number;
    };
    slices: Array<CodeSlice>;
    current_slice?: CodeSlice;
    ownerFile?: CodeFile;
    forks: Array<CodeWriter>;
    tagOffset: number;
    parent?: CodeWriter;
    had_nl: boolean;
    sourceMapsEnabled: boolean;
    sourceMapBuilder?: SourceMapBuilder;
    mappingNodeStack: Array<CodeNode>;
    mappingNameStack: Array<string>;
    walkNodeStack: Array<CodeNode>;
    constructor();
    rewrite(newString: string): void;
    enableSourceMaps(builder: SourceMapBuilder): void;
    getActiveSourceMapBuilder(): SourceMapBuilder | undefined;
    pushMappingNode(node: CodeNode, name: string): void;
    popMappingNode(): void;
    getCurrentMappingNode(): CodeNode | undefined;
    getCurrentMappingName(): string;
    pushWalkNode(node: CodeNode): void;
    popWalkNode(): void;
    getCurrentWalkNode(): CodeNode | undefined;
    recordCurrentMapping(): void;
    outMapped(str: string, node: CodeNode, newLine: boolean, name: string): void;
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
    advanceColumnForString(str: string): void;
    syncColumnFromCurrentLine(): void;
    writeSlice(str: string, newLine: boolean): void;
    out(str: string, newLine: boolean): void;
    raw(str: string, newLine: boolean): void;
    getCode(): string;
    static emptyWithFS(): CodeWriter;
}
export declare class RangerLispParser {
    code?: SourceCode;
    buff?: string;
    __len: number;
    i: number;
    last_line_start: number;
    current_line_index: number;
    parents: Array<CodeNode>;
    next?: CodeNode;
    paren_cnt: number;
    get_op_pred: number;
    rootNode?: CodeNode;
    curr_node?: CodeNode;
    had_error: boolean;
    disableOperators: boolean;
    constructor(code_module: SourceCode);
    joo(cm: SourceCode): void;
    parse_raw_annotation(): CodeNode;
    skip_space(is_block_parent: boolean): boolean;
    end_expression(consumeCurrent: boolean): boolean;
    getOperator(disabled: boolean): number;
    isOperator(disabled: boolean): number;
    getOperatorPred(str: string, disabled: boolean): number;
    isComparisonOpPred(pred: number): boolean;
    isDotVRef(n: CodeNode): boolean;
    isDotCallPairOnNode(node: CodeNode): boolean;
    foldDotCallPairToGroup(node: CodeNode): void;
    tryCloseCallArgParenBeforeInfix(): boolean;
    insert_node(p_node: CodeNode): void;
    parse_attributes(): boolean;
    parseXML(): void;
    parse(disable_ops: boolean): void;
    static normalizeLineEndings(src: string): string;
}
export declare class TTypes {
    constructor();
    static nameToValue(name: string): number;
    static isPrimitive(valueType: number): boolean;
    static valueAsString(valueType: number): string;
    static baseTypeAsEval(node: CodeNode, ctx: RangerAppWriterContext, wr: CodeWriter): void;
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
    areEqualTypes(type1o: string, type2o: string, ctx: RangerAppWriterContext): boolean;
    areEqualATypes(type1i: string, type2i: string, ctx: RangerAppWriterContext): boolean;
    getTypeName(n: string): string;
    getType(n: string): number;
    setRvBasedOn(arg: CodeNode, node: CodeNode): boolean;
    nodeTypeString(node: CodeNode): string;
    isCollectionTypeString(s: string): boolean;
    applyTypeStringToNode(node: CodeNode, typeStr: string): void;
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
    object_value?: DictNode;
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
    addObject(key: string): DictNode | undefined;
    setObject(key: string, value: DictNode): void;
    addArray(key: string): DictNode | undefined;
    push(obj: DictNode): void;
    getDoubleAt(index: number): number;
    getStringAt(index: number): string;
    getIntAt(index: number): number;
    getBooleanAt(index: number): boolean;
    getString(key: string): string | undefined;
    getDouble(key: string): number | undefined;
    getInt(key: string): number | undefined;
    getBoolean(key: string): boolean | undefined;
    getArray(key: string): DictNode | undefined;
    getArrayAt(index: number): DictNode | undefined;
    getObject(key: string): DictNode | undefined;
    getObjectAt(index: number): DictNode | undefined;
    stringify(): string;
    static createEmptyObject(): DictNode;
}
export declare class RangerSerializeClass {
    constructor();
    isSerializedClass(cName: string, ctx: RangerAppWriterContext): boolean;
    canSerializeClass(cName: string, ctx: RangerAppWriterContext): boolean;
    missesSerializeSupport(cName: string, ctx: RangerAppWriterContext): boolean;
    describeFieldType(nn: CodeNode): string;
    validateSerializedClass(cl: RangerAppClassDesc, ctx: RangerAppWriterContext): boolean;
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
export declare class RangerProcessLifecycle {
    constructor();
    emitInvokeMethods(cl: RangerAppClassDesc, ctx: RangerAppWriterContext, wr: CodeWriter, regName: string): void;
    emitStopSubtree(cl: RangerAppClassDesc, wr: CodeWriter, regName: string): void;
}
export declare class RangerProcessClass {
    constructor();
    emitAssignProcessId(wr: CodeWriter): void;
    createProcessExtension(cl: RangerAppClassDesc, ctx: RangerAppWriterContext, wr: CodeWriter, typeId: number): void;
    emitStaticHelpers(cl: RangerAppClassDesc, typeId: number, wr: CodeWriter, regName: string): void;
    emitProcessNameRegistryExtension(processClasses: Array<RangerAppClassDesc>, wr: CodeWriter): void;
    emitProcessRuntimeExtension(processClasses: Array<RangerAppClassDesc>, wr: CodeWriter): void;
    emitProcessTypeScriptHelpers(processClasses: Array<RangerAppClassDesc>, wr: CodeWriter): void;
}
export declare class RangerProcessProcSend {
    constructor();
    static isReservedHandler(name: string): boolean;
    static collectProcessClasses(ctx: RangerAppWriterContext): Array<RangerAppClassDesc>;
    static findClassByPath(pathLit: string, processClasses: Array<RangerAppClassDesc>): RangerAppClassDesc | undefined;
    static resolveTargetClass(parser: RangerFlowParser, target: CodeNode, processClasses: Array<RangerAppClassDesc>, ctx: RangerAppWriterContext, wr: CodeWriter, errNode: CodeNode): Promise<RangerAppClassDesc> | undefined;
    static matchHandler(parser: RangerFlowParser, recvClass: RangerAppClassDesc, methodName: string, argNodes: Array<CodeNode>, ctx: RangerAppWriterContext, wr: CodeWriter, errNode: CodeNode): Promise<RangerAppFunctionDesc> | undefined;
    static buildLiveGuard(targetVref: string): CodeNode;
    static buildHandlerCall(targetVref: string, handlerName: string, argNodes: Array<CodeNode>): CodeNode;
    static buildFindRootExpr(targetVref: string): CodeNode;
    static buildDispatchTurnBoundary(opName: string, rootExpr: CodeNode): CodeNode;
    static transform(parser: RangerFlowParser, node: CodeNode, ctx: RangerAppWriterContext, wr: CodeWriter): Promise<boolean>;
}
export declare class RangerProcessProcStartCheck {
    constructor();
    static validate(parser: RangerFlowParser, node: CodeNode, ctx: RangerAppWriterContext, wr: CodeWriter): Promise<boolean>;
}
export declare class RangerProcessCodegen {
    constructor();
    validateProcessNewSite(node: CodeNode, newCl: RangerAppClassDesc, ctx: RangerAppWriterContext): void;
    shouldWrapProcessNew(procNewNode: CodeNode, procNewCtx: RangerAppWriterContext): boolean;
    hasParentRegister(procNewCtx: RangerAppWriterContext): boolean;
    writeNewArgs(node: CodeNode, ctx: RangerAppWriterContext, wr: CodeWriter, writer: RangerGenericClassWriter): Promise<void>;
    writeProcessInstanceRegisterCall(wr: CodeWriter, lang: string): void;
    shouldUseProcessInstanceRegister(procNewCtx: RangerAppWriterContext, newCl: RangerAppClassDesc): boolean;
    writeRegisterCall(procNewCtx: RangerAppWriterContext, wr: CodeWriter, lang: string, newCl: RangerAppClassDesc): void;
    writeWrappedNewCallEs6(node: CodeNode, ctx: RangerAppWriterContext, wr: CodeWriter, writer: RangerGenericClassWriter): Promise<void>;
    writeWrappedNewCallKotlin(node: CodeNode, ctx: RangerAppWriterContext, wr: CodeWriter, writer: RangerGenericClassWriter): Promise<void>;
    writeWrappedNewCallSwift6(node: CodeNode, ctx: RangerAppWriterContext, wr: CodeWriter, writer: RangerGenericClassWriter): Promise<void>;
    writeWrappedNewCall(node: CodeNode, ctx: RangerAppWriterContext, wr: CodeWriter, lang: string, writer: RangerGenericClassWriter): Promise<void>;
    static isNamedProcess(cl: RangerAppClassDesc): boolean;
    static isInProcessInstanceMethod(ctx: RangerAppWriterContext): boolean;
    static isBootstrapSite(ctx: RangerAppWriterContext): boolean;
    static isInsideNamedProcessMethod(ctx: RangerAppWriterContext): boolean;
}
export declare class RangerServiceBuilder {
    constructor();
    createOpStaticClass(ctx: RangerAppWriterContext, name: string): RangerAppClassDesc;
    CreateServices(parser: RangerFlowParser, ctx: RangerAppWriterContext, orig_wr: CodeWriter): Promise<void>;
}
export declare class RangerAppOperatorDesc extends RangerAppParamDesc {
    name: string;
    ref_cnt: number;
    node?: CodeNode;
    nameNode?: CodeNode;
    fnBody?: CodeNode;
    op_params: Array<CodeNode>;
    firstArg?: CodeNode;
    constructor();
    isOperator(): boolean;
    isProperty(): boolean;
}
export declare class TFiles {
    constructor();
    static searchEnv(env: InputEnv, paths: Array<string>, fileName: string): string;
    static search(paths: Array<string>, fileName: string): string;
}
export declare class ClassJoinPoint {
    class_def?: RangerAppClassDesc;
    node?: CodeNode;
    constructor();
}
export declare class WalkLater {
    arg?: CodeNode;
    callArg?: CodeNode;
    constructor();
}
export declare class RangerFlowParser {
    hasRootPath: boolean;
    rootPath: string;
    _debug: boolean;
    stdCommands?: CodeNode;
    lastProcessedNode?: CodeNode;
    collectWalkAtEnd: Array<CodeNode>;
    walkAlso: Array<CodeNode>;
    serializedClasses: Array<RangerAppClassDesc>;
    immutableClasses: Array<RangerAppClassDesc>;
    processClasses: Array<RangerAppClassDesc>;
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
    fixExpressionAssignmentChains(node: CodeNode): void;
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
    normalizeNewArgList(node: CodeNode): void;
    cmdNew(node: CodeNode, ctx: RangerAppWriterContext, wr: CodeWriter): Promise<void>;
    transformParams(list: Array<CodeNode>, fnArgs: Array<RangerAppParamDesc>, ctx: RangerAppWriterContext): Array<CodeNode>;
    transformParams2(list: Array<CodeNode>, fnArgs: Array<CodeNode>, ctx: RangerAppWriterContext): Array<CodeNode>;
    CreateCTTI(node: CodeNode, ctx: RangerAppWriterContext, orig_wr: CodeWriter): Promise<void>;
    CreateRTTI(node: CodeNode, ctx: RangerAppWriterContext, orig_wr: CodeWriter): Promise<void>;
    SolveAsyncFuncs(node: CodeNode, ctx: RangerAppWriterContext, wr: CodeWriter): Promise<void>;
    matchMethodCall(cl: RangerAppClassDesc, methodName: string, callArgs: CodeNode, ctx: RangerAppWriterContext, wr: CodeWriter, errNode: CodeNode): Promise<RangerAppFunctionDesc> | undefined;
    cmdCall(node: CodeNode, ctx: RangerAppWriterContext, wr: CodeWriter): Promise<boolean>;
    matchLambdaArgs(n1: CodeNode, n2: CodeNode, ctx: RangerAppWriterContext, wr: CodeWriter): Promise<boolean>;
    testLambdaCallArgs(lambda_expression: CodeNode, callParams: CodeNode, ctx: RangerAppWriterContext, wr: CodeWriter): Promise<boolean>;
    cmdLocalCall(node: CodeNode, ctx: RangerAppWriterContext, wr: CodeWriter): Promise<boolean>;
    transformImmutableAssigment(node: CodeNode): CodeNode;
    transformDotMethodCallExpr(node: CodeNode, ctx: RangerAppWriterContext, wr: CodeWriter): Promise<boolean>;
    repairUnaryMinusExpr(node: CodeNode): void;
    repairAssignUnaryMinusRhs(node: CodeNode): void;
    repairAssignMethodCallRhs(node: CodeNode): void;
    checkInitializedObjectReceiver(receiverName: string, node: CodeNode, ctx: RangerAppWriterContext): void;
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
    registerLangSystemClasses(node: CodeNode, ctx: RangerAppWriterContext, wr: CodeWriter): void;
    walkLangDefinitions(node: CodeNode, ctx: RangerAppWriterContext): void;
    registerSystemClassFromNode(node: CodeNode, ctx: RangerAppWriterContext): void;
    registerSystemUnionFromNode(node: CodeNode, ctx: RangerAppWriterContext): void;
    finalizeRecordClasses(ctx: RangerAppWriterContext, wr: CodeWriter): Promise<void>;
    expandRecordCtorArgsIfNeeded(cl: RangerAppClassDesc, fnDescr: RangerAppFunctionDesc, params: CodeNode, node: CodeNode): void;
    buildRecordConstructor(cl: RangerAppClassDesc, ctx: RangerAppWriterContext, wr: CodeWriter): Promise<void>;
    mergeImports(node: CodeNode, ctx: RangerAppWriterContext, wr: CodeWriter): Promise<void>;
    CollectMethods(node: CodeNode, ctx: RangerAppWriterContext, wr: CodeWriter): Promise<void>;
    defineFunctionParam(method: RangerAppFunctionDesc, arg: CodeNode, ctx: RangerAppWriterContext, wr: CodeWriter): Promise<void>;
    spliceFunctionBody(startIndex: number, node: CodeNode, ctx: RangerAppWriterContext, wr: CodeWriter): CodeNode;
    CreateFunctionObject(orig_node: CodeNode, ctx: RangerAppWriterContext, wr: CodeWriter): Promise<RangerAppFunctionDesc>;
    WalkCollectMethods(node: CodeNode, ctx: RangerAppWriterContext, wr: CodeWriter): Promise<void>;
    varShadowsSystemType(strname: string, ctx: RangerAppWriterContext): boolean;
    findFunctionDesc(obj: CodeNode, ctx: RangerAppWriterContext, wr: CodeWriter): RangerAppFunctionDesc | undefined;
    findParamDesc(obj: CodeNode, ctx: RangerAppWriterContext, wr: CodeWriter): RangerAppParamDesc | undefined;
    convertToUnion(unionName: string, node: CodeNode, ctx: RangerAppWriterContext, wr: CodeWriter): Promise<void>;
    transformMethodToLambda(node: CodeNode, vFnDef: RangerAppFunctionDesc, ctx: RangerAppWriterContext, wr: CodeWriter): Promise<void>;
    areEqualTypes(n1: CodeNode, n2: CodeNode, ctx: RangerAppWriterContext, wr: CodeWriter): Promise<boolean>;
    shouldBeEqualTypes(n1: CodeNode, n2: CodeNode, ctx: RangerAppWriterContext, msg: string): void;
    shouldBeExpression(n1: CodeNode, ctx: RangerAppWriterContext, msg: string): void;
    shouldHaveChildCnt(cnt: number, n1: CodeNode, ctx: RangerAppWriterContext, msg: string): void;
    readProcessPathFromClassTree(root: CodeNode): string;
    applyProcessClassMeta(cl: RangerAppClassDesc, classNameNode: CodeNode, node: CodeNode, ctx: RangerAppWriterContext): void;
    resolveProcessPathFromFields(cl: RangerAppClassDesc): void;
    validateProcessPaths(processClasses: Array<RangerAppClassDesc>, ctx: RangerAppWriterContext): void;
    isValidProcessPath(pathStr: string): boolean;
    findLanguageOper(details: CodeNode, ctx: RangerAppWriterContext, opDef: CodeNode): Promise<CodeNode> | undefined;
    buildMacro(langOper: CodeNode, args: CodeNode, ctx: RangerAppWriterContext): Promise<CodeNode>;
    operandIsNonOptionalForNullCheck(node: CodeNode): boolean;
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
    method?: CodeNode;
    args?: CodeNode;
    constructor();
}
export declare class NodeEvalState {
    ctx?: RangerAppWriterContext;
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
    evaluating_cmd?: CodeNode;
    constructor();
}
export declare class RangerGenericClassWriter {
    compiler?: LiveCompiler;
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
    defValueHasSideEffects(value: CodeNode): boolean;
    writeSideEffectOnlyStmt(value: CodeNode, ctx: RangerAppWriterContext, wr: CodeWriter): Promise<void>;
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
    walkNewArgForProcess(n: CodeNode, ctx: RangerAppWriterContext, wr: CodeWriter): Promise<void>;
    tryWriteProcessNewCall(procNewNode: CodeNode, procNewCtx: RangerAppWriterContext, outWr: CodeWriter): Promise<boolean>;
    writeNewCall(node: CodeNode, ctx: RangerAppWriterContext, wr: CodeWriter): Promise<void>;
    writeInterface(cl: RangerAppClassDesc, ctx: RangerAppWriterContext, wr: CodeWriter): Promise<void>;
    disabledVarDef(node: CodeNode, ctx: RangerAppWriterContext, wr: CodeWriter): Promise<void>;
    writeArrayLiteral(node: CodeNode, ctx: RangerAppWriterContext, wr: CodeWriter): Promise<void>;
    writeClass(node: CodeNode, ctx: RangerAppWriterContext, wr: CodeWriter): Promise<void>;
}
export declare class AndroidPageWriter {
    classWriter?: RangerGenericClassWriter;
    constructor();
    BuildAST(code_string: string): CodeNode;
    CreatePage(parser: RangerFlowParser, node: CodeNode, ctx: RangerAppWriterContext, orig_wr: CodeWriter): Promise<void>;
}
export declare class RangerJava7ClassWriter extends RangerGenericClassWriter {
    compiler?: LiveCompiler;
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
    compiler?: LiveCompiler;
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
export declare class RangerSwift6ClassWriter extends RangerGenericClassWriter {
    compiler?: LiveCompiler;
    header_created: boolean;
    constructor();
    adjustType(tn: string): string;
    getObjectTypeString(type_string: string, ctx: RangerAppWriterContext): string;
    collectionTypeStringToSwift(type_string: string, ctx: RangerAppWriterContext): string;
    getTypeString(type_string: string): string;
    writeTypeDef(node: CodeNode, ctx: RangerAppWriterContext, wr: CodeWriter): Promise<void>;
    WriteEnum(node: CodeNode, ctx: RangerAppWriterContext, wr: CodeWriter): Promise<void>;
    WriteVRef(node: CodeNode, ctx: RangerAppWriterContext, wr: CodeWriter): Promise<void>;
    writeVarDef(node: CodeNode, ctx: RangerAppWriterContext, wr: CodeWriter): Promise<void>;
    writeArgsDef(fnDesc: RangerAppFunctionDesc, ctx: RangerAppWriterContext, wr: CodeWriter): Promise<void>;
    writeArgsDefWithLocals(fnDesc: RangerAppFunctionDesc, localFnDesc: RangerAppFunctionDesc, ctx: RangerAppWriterContext, wr: CodeWriter): Promise<void>;
    resolveCallReceiverClassName(obj: CodeNode, ctx: RangerAppWriterContext): string;
    isSimpleClassCallReceiver(obj: CodeNode, ctx: RangerAppWriterContext): boolean;
    CreateCallExpression(node: CodeNode, ctx: RangerAppWriterContext, wr: CodeWriter): Promise<void>;
    writeFnCall(node: CodeNode, ctx: RangerAppWriterContext, wr: CodeWriter): Promise<void>;
    CreateLambdaCall(node: CodeNode, ctx: RangerAppWriterContext, wr: CodeWriter): Promise<void>;
    CreateLambda(node: CodeNode, ctx: RangerAppWriterContext, wr: CodeWriter): Promise<void>;
    writeNewCall(node: CodeNode, ctx: RangerAppWriterContext, wr: CodeWriter): Promise<void>;
    haveSameSig(fn1: RangerAppFunctionDesc, fn2: RangerAppFunctionDesc, ctx: RangerAppWriterContext): boolean;
    CustomOperator(node: CodeNode, ctx: RangerAppWriterContext, wr: CodeWriter): Promise<void>;
    writeClass(node: CodeNode, ctx: RangerAppWriterContext, wr: CodeWriter): Promise<void>;
    resolveMethodFnDesc(methodNode: CodeNode, ctx: RangerAppWriterContext): RangerAppFunctionDesc | undefined;
    CreateMethodCall(node: CodeNode, ctx: RangerAppWriterContext, wr: CodeWriter): Promise<void>;
}
export declare class RangerCppClassWriter extends RangerGenericClassWriter {
    compiler?: LiveCompiler;
    header_created: boolean;
    buf_ret_seen: boolean;
    buf_ret_all_safe: boolean;
    constructor();
    lineEnding(): string;
    adjustType(tn: string): string;
    WriteScalarValue(node: CodeNode, ctx: RangerAppWriterContext, wr: CodeWriter): void;
    getObjectTypeString(type_string: string, ctx: RangerAppWriterContext): string;
    collectionTypeStringToCpp(type_string: string, ctx: RangerAppWriterContext): string;
    getTypeString2(type_string: string, ctx: RangerAppWriterContext): string;
    writePtr(node: CodeNode, ctx: RangerAppWriterContext, wr: CodeWriter): void;
    writeTypeDef(node: CodeNode, ctx: RangerAppWriterContext, wr: CodeWriter): Promise<void>;
    cppMemberPathOf(node: CodeNode): string;
    cppReturnIsSafeBufferLvalue(retValue: CodeNode): boolean;
    cppScanBufferReturns(node: CodeNode): void;
    cppBufferReturnByRef(variant: RangerAppFunctionDesc, ctx: RangerAppWriterContext): boolean;
    writeReturnTypeDef(variant: RangerAppFunctionDesc, ctx: RangerAppWriterContext, wr: CodeWriter): Promise<void>;
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
    cppReadonlyValueParam(arg: RangerAppParamDesc): boolean;
    writeArgsDef(fnDesc: RangerAppFunctionDesc, ctx: RangerAppWriterContext, wr: CodeWriter): Promise<void>;
    writeFnCall(node: CodeNode, ctx: RangerAppWriterContext, wr: CodeWriter): Promise<void>;
    writeNewCall(node: CodeNode, ctx: RangerAppWriterContext, wr: CodeWriter): Promise<void>;
    writeArrayLiteral(node: CodeNode, ctx: RangerAppWriterContext, wr: CodeWriter): Promise<void>;
    writeClassHeader(node: CodeNode, ctx: RangerAppWriterContext, wr: CodeWriter): Promise<void>;
    CreateUnions(parser: RangerFlowParser, ctx: RangerAppWriterContext, wr: CodeWriter): Promise<void>;
    writeClass(node: CodeNode, ctx: RangerAppWriterContext, orig_wr: CodeWriter): Promise<void>;
}
export declare class MethodCallList {
    calls: Array<string>;
    constructor();
    add(methodName: string): void;
}
export declare class RangerRustClassWriter extends RangerGenericClassWriter {
    compiler?: LiveCompiler;
    thisName: string;
    fileHeaderWritten: boolean;
    constructor();
    lineEnding(): string;
    adjustType(tn: string): string;
    WriteScalarValue(node: CodeNode, ctx: RangerAppWriterContext, wr: CodeWriter): void;
    getObjectTypeString(type_string: string, ctx: RangerAppWriterContext): string;
    getTypeString(type_string: string): string;
    writeTypeDef(node: CodeNode, ctx: RangerAppWriterContext, wr: CodeWriter): Promise<void>;
    WriteVRef(node: CodeNode, ctx: RangerAppWriterContext, wr: CodeWriter): Promise<void>;
    writeStructField(node: CodeNode, ctx: RangerAppWriterContext, wr: CodeWriter): Promise<void>;
    writeVarDef(node: CodeNode, ctx: RangerAppWriterContext, wr: CodeWriter): Promise<void>;
    writeArgsDef(fnDesc: RangerAppFunctionDesc, ctx: RangerAppWriterContext, wr: CodeWriter): Promise<void>;
    containsSelfReference(node: CodeNode): boolean;
    fnBodyUsesThis(node: CodeNode, ctx: RangerAppWriterContext): boolean;
    accessesFieldOf(node: CodeNode, varName: string): boolean;
    getArgRootVar(node: CodeNode): string;
    hasMutRefConflict(node: CodeNode, fnDesc: RangerAppFunctionDesc, argIdx: number, givenArgs: CodeNode): boolean;
    collectSelfMethodCalls(node: CodeNode, ctx: RangerAppWriterContext, calls: Array<string>): void;
    fnBodyDirectlyMutatesThis(node: CodeNode, ctx: RangerAppWriterContext): boolean;
    buildClassMutationGraph(cl: RangerAppClassDesc, ctx: RangerAppWriterContext, directMutations: {
        [key: string]: boolean;
    }, callGraph: {
        [key: string]: MethodCallList;
    }): void;
    methodTransitivelyMutates(methodName: string, directMutations: {
        [key: string]: boolean;
    }, callGraph: {
        [key: string]: MethodCallList;
    }, visited: Array<string>): boolean;
    methodMutatesThis(methodName: string, directMutations: {
        [key: string]: boolean;
    }, callGraph: {
        [key: string]: MethodCallList;
    }): boolean;
    fnBodyMutatesThis(node: CodeNode, ctx: RangerAppWriterContext): boolean;
    CreateCallExpression(node: CodeNode, ctx: RangerAppWriterContext, wr: CodeWriter): Promise<void>;
    CreateMethodCall(node: CodeNode, ctx: RangerAppWriterContext, wr: CodeWriter): Promise<void>;
    isSelfMethodCall(node: CodeNode): boolean;
    findSelfCallInArgs(node: CodeNode): number;
    writeFnCall(node: CodeNode, ctx: RangerAppWriterContext, wr: CodeWriter): Promise<void>;
    writeNewCall(node: CodeNode, ctx: RangerAppWriterContext, wr: CodeWriter): Promise<void>;
    writeArrayLiteral(node: CodeNode, ctx: RangerAppWriterContext, wr: CodeWriter): Promise<void>;
    writeClass(node: CodeNode, ctx: RangerAppWriterContext, orig_wr: CodeWriter): Promise<void>;
    CustomOperator(node: CodeNode, ctx: RangerAppWriterContext, wr: CodeWriter): Promise<void>;
}
export declare class RangerKotlinClassWriter extends RangerGenericClassWriter {
    compiler?: LiveCompiler;
    constructor();
    WriteScalarValue(node: CodeNode, ctx: RangerAppWriterContext, wr: CodeWriter): void;
    adjustType(tn: string): string;
    getObjectTypeString(type_string: string, ctx: RangerAppWriterContext): string;
    collectionTypeStringToKotlin(type_string: string, ctx: RangerAppWriterContext): string;
    getTypeString(type_string: string): string;
    writeTypeDef(node: CodeNode, ctx: RangerAppWriterContext, wr: CodeWriter): Promise<void>;
    WriteVRef(node: CodeNode, ctx: RangerAppWriterContext, wr: CodeWriter): Promise<void>;
    writeVarDef(node: CodeNode, ctx: RangerAppWriterContext, wr: CodeWriter): Promise<void>;
    paramEmitName(arg: RangerAppParamDesc, ctx: RangerAppWriterContext): string;
    writeArgsDef(fnDesc: RangerAppFunctionDesc, ctx: RangerAppWriterContext, wr: CodeWriter): Promise<void>;
    writeFnCall(node: CodeNode, ctx: RangerAppWriterContext, wr: CodeWriter): Promise<void>;
    writeNewCall(node: CodeNode, ctx: RangerAppWriterContext, wr: CodeWriter): Promise<void>;
    writeClass(node: CodeNode, ctx: RangerAppWriterContext, orig_wr: CodeWriter): Promise<void>;
}
export declare class RangerCSharpClassWriter extends RangerGenericClassWriter {
    compiler?: LiveCompiler;
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
    compiler?: LiveCompiler;
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
    compiler?: LiveCompiler;
    thisName: string;
    write_raw_type: boolean;
    did_write_nullable: boolean;
    did_write_sseclient: boolean;
    httpServerWriter: RangerGolangHttpServerWriter;
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
    CreateCallExpression(node: CodeNode, ctx: RangerAppWriterContext, wr: CodeWriter): Promise<void>;
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
export declare class RangerGolangHttpServerWriter {
    didWriteSSEClient: boolean;
    didWriteHttpTypes: boolean;
    constructor();
    isHttpServerClass(cl: RangerAppClassDesc): boolean;
    getServerPort(cl: RangerAppClassDesc): number;
    getRouteMethod(fnDesc: RangerAppFunctionDesc): string;
    getRoutePath(fnDesc: RangerAppFunctionDesc): string;
    writeSSEClientStruct(wr: CodeWriter): void;
    addHttpImports(wr: CodeWriter): void;
    writeServerStart(serverArg: CodeNode, node: CodeNode, ctx: RangerAppWriterContext, wr: CodeWriter, writer: RangerGolangClassWriter): void;
    writeStartMethod(cl: RangerAppClassDesc, ctx: RangerAppWriterContext, wr: CodeWriter): void;
    writeStopMethod(cl: RangerAppClassDesc, ctx: RangerAppWriterContext, wr: CodeWriter): void;
    writeHttpServerClass(cl: RangerAppClassDesc, ctx: RangerAppWriterContext, wr: CodeWriter): void;
}
export declare class RangerPHPClassWriter extends RangerGenericClassWriter {
    compiler?: LiveCompiler;
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
export declare class RangerPythonClassWriter extends RangerGenericClassWriter {
    compiler?: LiveCompiler;
    thisName: string;
    wrote_header: boolean;
    constructor();
    adjustType(tn: string): string;
    EncodeString(node: CodeNode, ctx: RangerAppWriterContext, wr: CodeWriter): string;
    WriteScalarValue(node: CodeNode, ctx: RangerAppWriterContext, wr: CodeWriter): void;
    WriteVRef(node: CodeNode, ctx: RangerAppWriterContext, wr: CodeWriter): Promise<void>;
    writeVarInitDef(node: CodeNode, ctx: RangerAppWriterContext, wr: CodeWriter): Promise<void>;
    writeVarDef(node: CodeNode, ctx: RangerAppWriterContext, wr: CodeWriter): Promise<void>;
    CreateMethodCall(node: CodeNode, ctx: RangerAppWriterContext, wr: CodeWriter): Promise<void>;
    CreatePropertyGet(node: CodeNode, ctx: RangerAppWriterContext, wr: CodeWriter): Promise<void>;
    CreateLambdaCall(node: CodeNode, ctx: RangerAppWriterContext, wr: CodeWriter): Promise<void>;
    CreateLambda(node: CodeNode, ctx: RangerAppWriterContext, wr: CodeWriter): Promise<void>;
    getPythonTypeName(node: CodeNode, ctx: RangerAppWriterContext): string;
    writeTypeDef(node: CodeNode, ctx: RangerAppWriterContext, wr: CodeWriter): Promise<void>;
    writeClassVarDef(node: CodeNode, ctx: RangerAppWriterContext, wr: CodeWriter): void;
    writeArgsDef(fnDesc: RangerAppFunctionDesc, ctx: RangerAppWriterContext, wr: CodeWriter): void;
    writeArrayLiteral(node: CodeNode, ctx: RangerAppWriterContext, wr: CodeWriter): Promise<void>;
    writeFnCall(node: CodeNode, ctx: RangerAppWriterContext, wr: CodeWriter): Promise<void>;
    writeNewCall(node: CodeNode, ctx: RangerAppWriterContext, wr: CodeWriter): Promise<void>;
    CreateCallExpression(node: CodeNode, ctx: RangerAppWriterContext, wr: CodeWriter): Promise<void>;
    writeClass(node: CodeNode, ctx: RangerAppWriterContext, orig_wr: CodeWriter): Promise<void>;
}
export declare class WebPageWriter {
    classWriter?: RangerGenericClassWriter;
    constructor();
    CreatePage(parser: RangerFlowParser, node: CodeNode, ctx: RangerAppWriterContext, orig_wr: CodeWriter): Promise<void>;
}
export declare class RangerJavaScriptClassWriter extends RangerGenericClassWriter {
    compiler?: LiveCompiler;
    thisName: string;
    wrote_header: boolean;
    target_flow: boolean;
    target_typescript: boolean;
    target_esm: boolean;
    constructor();
    lineEnding(): string;
    writeTsOptionalReturnSuffix(variant: RangerAppFunctionDesc, wr: CodeWriter): void;
    adjustType(tn: string): string;
    CreateTsUnions(parser: RangerFlowParser, ctx: RangerAppWriterContext, wr: CodeWriter): Promise<void>;
    isOptionalReference(node: CodeNode): boolean;
    writeFnCall(node: CodeNode, ctx: RangerAppWriterContext, wr: CodeWriter): Promise<void>;
    CreateCallExpression(node: CodeNode, ctx: RangerAppWriterContext, wr: CodeWriter): Promise<void>;
    getObjectTypeString(type_string: string, ctx: RangerAppWriterContext): string;
    collectionTypeStringToTs(type_string: string, ctx: RangerAppWriterContext): string;
    getTypeString(type_string: string): string;
    writeTypeDef(node: CodeNode, ctx: RangerAppWriterContext, wr: CodeWriter): Promise<void>;
    WriteVRef(node: CodeNode, ctx: RangerAppWriterContext, wr: CodeWriter): Promise<void>;
    writeVarInitDef(node: CodeNode, ctx: RangerAppWriterContext, wr: CodeWriter): Promise<void>;
    writeVarDef(node: CodeNode, ctx: RangerAppWriterContext, wr: CodeWriter): Promise<void>;
    writeClassVarDef(p: RangerAppParamDesc, ctx: RangerAppWriterContext, wr: CodeWriter): Promise<void>;
    writeNewCall(node: CodeNode, ctx: RangerAppWriterContext, wr: CodeWriter): Promise<void>;
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
    compiler?: LiveCompiler;
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
export declare class LowIRUtil {
    constructor();
    static typeFromRanger(typeName: string): string;
    static isSupportedPrimitive(typeName: string): boolean;
    static isStringType(typeName: string): boolean;
    static isArrayTypeName(typeName: string): boolean;
    static isBufferTypeName(typeName: string): boolean;
    static isSupportedParam(typeName: string): boolean;
    static fieldIrType(typeName: string): string;
    static mangleMethod(className: string, methodName: string): string;
    static structPtrType(className: string): string;
    static structType(className: string): string;
    static moduleUsesHeap(module: LowIRModule): boolean;
}
export declare class LowIRParam {
    name: string;
    irType: string;
    constructor();
}
export declare class LowIRInstr {
    op: string;
    dest: string;
    irType: string;
    arg1: string;
    arg2: string;
    arg3: string;
    pred: string;
    fnName: string;
    callArgs: Array<string>;
    callTypes: Array<string>;
    callSig: string;
    structName: string;
    fieldIndex: number;
    structSize: number;
    constructor();
}
export declare class LowIRBlock {
    label: string;
    instrs: Array<LowIRInstr>;
    termKind: string;
    termType: string;
    termValue: string;
    termTarget: string;
    termIfTrue: string;
    termIfFalse: string;
    constructor();
}
export declare class LowIRFunction {
    name: string;
    exportFn: boolean;
    isMain: boolean;
    returnType: string;
    params: Array<LowIRParam>;
    blocks: Array<LowIRBlock>;
    constructor();
}
export declare class LowIRField {
    name: string;
    irType: string;
    isPtrArray: boolean;
    isBool: boolean;
    isString: boolean;
    isBuffer: boolean;
    isObject: boolean;
    constructor();
}
export declare class LowIRTypeFieldDesc {
    offset: number;
    kind: number;
    owned: number;
    constructor();
}
export declare class LowIRTypeDesc {
    className: string;
    size: number;
    fields: Array<LowIRTypeFieldDesc>;
    constructor();
}
export declare class LowIRStruct {
    name: string;
    fields: Array<LowIRField>;
    constructor();
}
export declare class LowIRStringGlobal {
    name: string;
    text: string;
    byteLen: number;
    withNewline: boolean;
    constructor();
}
export declare class LowIRExternDecl {
    fnName: string;
    retType: string;
    paramTypes: Array<string>;
    isVararg: boolean;
    declSig: string;
    constructor();
}
export declare class LowIRModule {
    name: string;
    triple: string;
    ptrType: string;
    useLibcHeap: boolean;
    useFreeListHeap: boolean;
    structs: Array<LowIRStruct>;
    typeDescs: Array<LowIRTypeDesc>;
    functions: Array<LowIRFunction>;
    stringGlobals: Array<LowIRStringGlobal>;
    externDecls: Array<LowIRExternDecl>;
    singletonClasses: Array<string>;
    lambdaTableFuncs: Array<string>;
    lambdaSigs: Array<string>;
    constructor();
}
export declare class LowIRSession {
    module: LowIRModule;
    constructor();
    beginModule(moduleName: string): void;
    static current(): LowIRSession;
    static __singleton_instance: LowIRSession | null;
    static __singleton(): LowIRSession;
}
export declare class LowIRBuilder {
    irModule?: LowIRModule;
    tempCounter: number;
    blockCounter: number;
    blocks: Array<LowIRBlock>;
    currentBlock?: LowIRBlock;
    constructor(module: LowIRModule);
    freshTemp(prefix: string): string;
    freshLabel(prefix: string): string;
    reset(): void;
    startBlock(label: string): string;
    emit(instr: LowIRInstr): LowIRInstr;
    emitToEntry(instr: LowIRInstr): LowIRInstr;
    emitConst(irType: string, value: string): string;
    emitBin(kind: string, irType: string, lhs: string, rhs: string): string;
    emitIcmp(pred: string, lhs: string, rhs: string): string;
    emitIcmpTyped(pred: string, operandType: string, lhs: string, rhs: string): string;
    emitPtrToInt(ptr: string): string;
    emitCall(fnName: string, retType: string, args: Array<string>, argTypes: Array<string>): string;
    emitComment(text: string): void;
    emitCallWithSig(fnName: string, retType: string, callSig: string, args: Array<string>, argTypes: Array<string>): string;
    emitAllocaStruct(className: string, slotName: string, fieldCount: number): string;
    emitGep(className: string, structPtr: string, fieldIndex: number): string;
    emitAlloca(irType: string, slotName: string): string;
    emitZeroInitToEntry(irType: string, slotName: string): void;
    emitLoad(irType: string, slotName: string): string;
    emitStore(irType: string, value: string, slotName: string): void;
    emitHeapAlloc(byteCount: string): string;
    emitIntToI8Ptr(addr: string, addrType: string): string;
    emitIntToStructPtr(className: string, addr: string): string;
    emitCast(castOp: string, destType: string, srcType: string, value: string): string;
    emitZextI1ToI32(v: string): string;
    emitZextI32ToPtr(v: string): string;
    emitPtrLoad(ptr: string): string;
    emitPtrLoadTyped(ptr: string, valueType: string): string;
    emitPtrStore(ptr: string, value: string): void;
    emitPtrStoreTyped(ptr: string, value: string, valueType: string): void;
    emitPtrLoad8(ptr: string): string;
    emitPtrStore8(ptr: string, value: string): void;
    emitMemSize(): string;
    emitMemGrow(pages: string): string;
    emitGlobalGet(name: string): string;
    emitGlobalSet(name: string, value: string): void;
    emitFuncRef(name: string): string;
    emitCallIndirect(retType: string, callSig: string, args: Array<string>, argTypes: Array<string>, selector: string): string;
    emitI32At(base: string, byteOff: number): string;
    emitStoreI32At(base: string, byteOff: number, value: string): void;
    emitLoadI32At(base: string, byteOff: number): string;
    emitStrPtr(globalName: string, byteLen: number): string;
    emitTypeDescPtr(className: string): string;
    terminateRet(retType: string, value: string): void;
    terminateBr(target: string): void;
    terminateBrIf(cond: string, ifTrue: string, ifFalse: string): void;
    terminateUnreachable(): void;
    finishFunction(name: string, retType: string, params: Array<LowIRParam>, exportFn: boolean, isMain: boolean): string;
}
export declare class LowIRRuntimeGen {
    constructor();
    static hasFunction(module: LowIRModule, name: string): boolean;
    static ensureArrayRuntime(module: LowIRModule): void;
    static ensureMapRuntime(module: LowIRModule): void;
    static finishFn(builder: LowIRBuilder, module: LowIRModule, name: string, retType: string, params: Array<LowIRParam>, exportFn: boolean): void;
    static buildRtArraySet(module: LowIRModule): void;
    static arrayLenOff(module: LowIRModule): number;
    static arrayCapOff(module: LowIRModule): number;
    static arrayDescBytes(module: LowIRModule): number;
    static mapValsOff(module: LowIRModule): number;
    static mapCapOff(module: LowIRModule): number;
    static mapSizeOff(module: LowIRModule): number;
    static mapDescBytes(module: LowIRModule): number;
    static emitDescLoad(builder: LowIRBuilder, module: LowIRModule, desc: string, byteOff: number): string;
    static emitKeysPtr(builder: LowIRBuilder, module: LowIRModule, desc: string): string;
    static emitValsPtr(builder: LowIRBuilder, module: LowIRModule, desc: string): string;
    static emitCap(builder: LowIRBuilder, module: LowIRModule, desc: string): string;
    static emitSize(builder: LowIRBuilder, module: LowIRModule, desc: string): string;
    static emitSlotAddr(builder: LowIRBuilder, module: LowIRModule, base: string, slot: string): string;
    static emitFreePtr(builder: LowIRBuilder, module: LowIRModule, ptr: string): void;
    static buildRtMapNew(module: LowIRModule): void;
    static buildRtMapGrow(module: LowIRModule): void;
    static buildRtMapFree(module: LowIRModule): void;
    static buildRtMapHashSlot(module: LowIRModule): void;
    static buildRtMapPutAt(module: LowIRModule): void;
    static buildRtMapPut(module: LowIRModule): void;
    static buildRtMapGetAt(module: LowIRModule): void;
    static buildRtMapGet(module: LowIRModule): void;
    static buildRtMapHas(module: LowIRModule): void;
    static ptrBytes(module: LowIRModule): number;
    static descMetaOff(module: LowIRModule): number;
    static ensurePtrArrayRuntime(module: LowIRModule): void;
    static buildRtPtrArrayNew(module: LowIRModule): void;
    static buildRtPtrArrayLen(module: LowIRModule): void;
    static buildRtPtrArrayGet(module: LowIRModule): void;
    static buildRtPtrArraySet(module: LowIRModule): void;
    static buildRtPtrArrayPush(module: LowIRModule): void;
}
export declare class LowIRTarget {
    arch: string;
    env: string;
    triple: string;
    ptrType: string;
    usesLibc: boolean;
    ioFn: string;
    ioFnRet: string;
    ioFnVararg: boolean;
    constructor();
    memoryModel(): string;
    isManualMemory(): boolean;
    static resolve(ctx: RangerAppWriterContext): LowIRTarget;
    static applyName(t: LowIRTarget, name: string): void;
    static applyExplicitTriple(t: LowIRTarget, triple: string): void;
    static applyNameKnown(t: LowIRTarget, name: string): void;
}
export declare class LowIRLowerContext {
    ctx?: RangerAppWriterContext;
    builder?: LowIRBuilder;
    target?: LowIRTarget;
    ptrType: string;
    slots: {
        [key: string]: string;
    };
    slotTypes: {
        [key: string]: string;
    };
    objectSlots: {
        [key: string]: string;
    };
    collectionSlots: {
        [key: string]: string;
    };
    ptrArrayElemTypes: {
        [key: string]: string;
    };
    ownedObjectLocals: Array<string>;
    ownedCollectionLocals: Array<string>;
    ownedStringLocals: Array<string>;
    pendingStringTemps: Array<string>;
    pendingObjectTemps: Array<string>;
    boxedCandidates: {
        [key: string]: number;
    };
    boxedLocals: {
        [key: string]: number;
    };
    escapedLocals: {
        [key: string]: string;
    };
    currentRetType: string;
    llvmRetType: string;
    className: string;
    selfPtr: string;
    constructor();
}
export declare class LambdaCaptureInfo {
    names: Array<string>;
    irTypes: Array<string>;
    kinds: Array<number>;
    objClasses: Array<string>;
    offsets: Array<number>;
    totalBytes: number;
    hasOwned: boolean;
    tdName: string;
    constructor();
}
export declare class LowIRBuilderPass {
    irModule: LowIRModule;
    usedMapRuntime: boolean;
    usedArrayRuntime: boolean;
    usedPtrArrayRuntime: boolean;
    usedMemRuntime: boolean;
    lambdaSigMap: {
        [key: string]: string;
    };
    lambdaByName: {
        [key: string]: RangerAppFunctionDesc;
    };
    lambdaNames: Array<string>;
    lambdaCounter: number;
    lambdaCaptures: {
        [key: string]: LambdaCaptureInfo;
    };
    constructor();
    isLambdaTypeNode(node: CodeNode): boolean;
    canLowerFunction(fnDesc: RangerAppFunctionDesc, ctx: RangerAppWriterContext): boolean;
    canLowerMethod(fnDesc: RangerAppFunctionDesc): boolean;
    canLowerInstanceMethod(fnDesc: RangerAppFunctionDesc, ctx: RangerAppWriterContext): boolean;
    isMainEntry(fnDesc: RangerAppFunctionDesc, ctx: RangerAppWriterContext): boolean;
    shouldExport(fnDesc: RangerAppFunctionDesc, ctx: RangerAppWriterContext): boolean;
    lowerModule(appCtx: RangerAppWriterContext): LowIRModule;
    ensureExternDecl(fnName: string, retType: string, paramTypes: Array<string>, isVararg: boolean): void;
    ensureLibcExtern(target: LowIRTarget): void;
    ensureBufferExtern(target: LowIRTarget): void;
    ensureMemExtern(target: LowIRTarget): void;
    memEnabled(lctx: LowIRLowerContext): boolean;
    objRcEnabled(lctx: LowIRLowerContext): boolean;
    wasmStrEnabled(lctx: LowIRLowerContext): boolean;
    isLowerableParamType(typeName: string): boolean;
    llvmTypeForRanger(typeName: string, ptrType: string): string;
    varTypeName(nameNode: CodeNode): string;
    exprIsObjectPtr(node: CodeNode, lctx: LowIRLowerContext): boolean;
    isObjectTypeName(typeName: string): boolean;
    exprIsString(node: CodeNode): boolean;
    exprMightBeString(node: CodeNode, lctx: LowIRLowerContext): boolean;
    lowerConcatOperand(node: CodeNode, isStr: boolean, lctx: LowIRLowerContext): string;
    emitStrdupExpr(strPtr: string, lctx: LowIRLowerContext): string;
    lowerStringConcat(aNode: CodeNode, bNode: CodeNode, lctx: LowIRLowerContext): string;
    hasExternDecl(fnName: string): boolean;
    internStringGlobal(text: string, withNewline: boolean): string;
    utf8ByteLen(text: string): number;
    stringGlobalByteLen(gname: string): number;
    printTextFromNode(node: CodeNode): string;
    emitIoString(text: string, withNewline: boolean, lctx: LowIRLowerContext): void;
    emitPrintfFmt(fmt: string, args: Array<string>, argTypes: Array<string>, lctx: LowIRLowerContext): void;
    lowerPrint(node: CodeNode, lctx: LowIRLowerContext): void;
    lowerWrite(node: CodeNode, lctx: LowIRLowerContext): void;
    lowerExit(node: CodeNode, lctx: LowIRLowerContext): void;
    lowerSleepMs(node: CodeNode, lctx: LowIRLowerContext): void;
    lowerTerminalEsc(text: string, lctx: LowIRLowerContext): void;
    emitTermVoidCall(fnName: string, lctx: LowIRLowerContext): void;
    lowerClearScreen(node: CodeNode, lctx: LowIRLowerContext): void;
    lowerHideCursor(node: CodeNode, lctx: LowIRLowerContext): void;
    lowerShowCursor(node: CodeNode, lctx: LowIRLowerContext): void;
    lowerMoveCursor(node: CodeNode, lctx: LowIRLowerContext): void;
    forIndexName(idxNode: CodeNode): string;
    resolveItemClass(itemNode: CodeNode): string;
    lowerPollKeypress(lctx: LowIRLowerContext): string;
    lowerOnKeypress(node: CodeNode, lctx: LowIRLowerContext): void;
    lowerShellArgCnt(lctx: LowIRLowerContext): string;
    lowerShellArg(node: CodeNode, lctx: LowIRLowerContext): string;
    lowerReadFile(node: CodeNode, lctx: LowIRLowerContext): string;
    lowerBufferAlloc(node: CodeNode, lctx: LowIRLowerContext): string;
    lowerBufferLength(node: CodeNode, lctx: LowIRLowerContext): string;
    lowerBufferGet(node: CodeNode, lctx: LowIRLowerContext): string;
    lowerBufferSet(node: CodeNode, lctx: LowIRLowerContext): string;
    lowerBufferReadFile(node: CodeNode, lctx: LowIRLowerContext): string;
    lowerBufferWriteFile(node: CodeNode, lctx: LowIRLowerContext): string;
    lowerIntBufferAlloc(node: CodeNode, lctx: LowIRLowerContext): string;
    lowerIntBufferGet(node: CodeNode, lctx: LowIRLowerContext): string;
    lowerIntBufferSet(node: CodeNode, lctx: LowIRLowerContext): string;
    exprIsF64(node: CodeNode): boolean;
    promoteToF64(node: CodeNode, val: string, lctx: LowIRLowerContext): string;
    lowerToDouble(node: CodeNode, lctx: LowIRLowerContext): string;
    lowerToInt(node: CodeNode, lctx: LowIRLowerContext): string;
    lowerStr2Double(node: CodeNode, lctx: LowIRLowerContext): string;
    lowerStr2Int(node: CodeNode, lctx: LowIRLowerContext): string;
    lowerIntBufferFill(node: CodeNode, lctx: LowIRLowerContext): string;
    lowerCharAt(node: CodeNode, lctx: LowIRLowerContext): string;
    lowerSubstring(node: CodeNode, lctx: LowIRLowerContext): string;
    lowerAtArgs(textNode: CodeNode, posNode: CodeNode, lctx: LowIRLowerContext): string;
    lowerAt(node: CodeNode, lctx: LowIRLowerContext): string;
    lowerAtCall(argsNode: CodeNode, lctx: LowIRLowerContext): string;
    lowerPtrIsNull(ptr: string, lctx: LowIRLowerContext): string;
    lowerPtrIsNotNull(ptr: string, lctx: LowIRLowerContext): string;
    loadArrayDescExpr(arrNode: CodeNode, lctx: LowIRLowerContext): string;
    pushItemNeedsWiden(itemNode: CodeNode, lctx: LowIRLowerContext): boolean;
    arrayElemTypeName(arrNode: CodeNode, lctx: LowIRLowerContext): string;
    lowerPush(node: CodeNode, lctx: LowIRLowerContext): void;
    lowerFor(node: CodeNode, lctx: LowIRLowerContext): void;
    emitStrcmpEq(lhs: string, rhs: string, ctx: LowIRLowerContext): string;
    lowerToString(node: CodeNode, lctx: LowIRLowerContext): string;
    lowerStrFromCode(node: CodeNode, fnName: string, lctx: LowIRLowerContext): string;
    lowerStrlen(node: CodeNode, lctx: LowIRLowerContext): string;
    isIntArrayTypeNode(node: CodeNode): boolean;
    isIntIntMapTypeNode(node: CodeNode): boolean;
    isObjectPtrArrayTypeNode(node: CodeNode): boolean;
    isStringArrayTypeNode(node: CodeNode): boolean;
    emitPtrArrayNewEmpty(lctx: LowIRLowerContext, elemKind: number): string;
    bindPtrArraySlot(varName: string, desc: string, lctx: LowIRLowerContext, owned: boolean): void;
    wasmCollectionRcEnabled(lctx: LowIRLowerContext): boolean;
    collectionKind(varName: string, lctx: LowIRLowerContext): string;
    arrayLenOff(lctx: LowIRLowerContext): number;
    arrayCapOff(lctx: LowIRLowerContext): number;
    arrayDescBytes(lctx: LowIRLowerContext): number;
    ptrArrayOwnedOff(lctx: LowIRLowerContext): number;
    bindCollectionSlot(varName: string, kind: string, desc: string, lctx: LowIRLowerContext): void;
    loadCollectionDesc(varName: string, lctx: LowIRLowerContext): string;
    emitDescLoad(desc: string, byteOff: number, lctx: LowIRLowerContext): string;
    emitRtArrayNewEmpty(lctx: LowIRLowerContext): string;
    emitRtArrayNewSized(cap: string, lctx: LowIRLowerContext): string;
    emitRtArrayGet(desc: string, idx: string, lctx: LowIRLowerContext): string;
    emitRtArraySet(desc: string, idx: string, val: string, lctx: LowIRLowerContext): void;
    emitRtArrayLen(desc: string, lctx: LowIRLowerContext): string;
    emitRtMapNew(cap: string, lctx: LowIRLowerContext): string;
    emitRtMapPut(desc: string, key: string, val: string, lctx: LowIRLowerContext): void;
    emitRtMapGet(desc: string, key: string, lctx: LowIRLowerContext): string;
    emitRtMapHas(desc: string, key: string, lctx: LowIRLowerContext): string;
    lowerCollectionMake(node: CodeNode, lctx: LowIRLowerContext): string;
    lowerCollectionGet(node: CodeNode, lctx: LowIRLowerContext): string;
    lowerCollectionLen(node: CodeNode, lctx: LowIRLowerContext): string;
    lowerCollectionHas(node: CodeNode, lctx: LowIRLowerContext): string;
    lowerCollectionSet(node: CodeNode, lctx: LowIRLowerContext): void;
    lowerStruct(cl: RangerAppClassDesc, ctx: RangerAppWriterContext): void;
    lowerTypeDesc(st: LowIRStruct, target: LowIRTarget): void;
    fieldByteOffset(className: string, fieldIndex: number, module: LowIRModule): number;
    bindSlot(varName: string, irType: string, value: string, lctx: LowIRLowerContext): void;
    loadSlot(varName: string, irType: string, lctx: LowIRLowerContext): string;
    fieldIrTypeFor(className: string, fieldName: string): string;
    fieldIsPtrArraySlot(className: string, fieldName: string): boolean;
    fieldIsObjectSlot(className: string, fieldName: string): boolean;
    fieldIsStringSlot(className: string, fieldName: string): boolean;
    fieldIsBufferSlot(className: string, fieldName: string): boolean;
    fieldIsBoolSlot(className: string, fieldName: string): boolean;
    ptrArrayDescFromVref(vref: string, lctx: LowIRLowerContext): string;
    loadPtrArrayDescExpr(arrNode: CodeNode, lctx: LowIRLowerContext): string;
    emitPtrArrayLen(desc: string, lctx: LowIRLowerContext): string;
    fieldArrayElemType(className: string, fieldName: string, lctx: LowIRLowerContext): string;
    ptrArrayElemIsInt(arrNode: CodeNode, lctx: LowIRLowerContext): boolean;
    lowerItemAt(node: CodeNode, lctx: LowIRLowerContext): string;
    emitPtrArrayElemGet(desc: string, idx: string, arrNode: CodeNode, lctx: LowIRLowerContext): string;
    emitPtrArrayElemSet(desc: string, idx: string, val: string, arrNode: CodeNode, lctx: LowIRLowerContext): void;
    emitFieldLoadOn(className: string, structPtr: string, fieldName: string, lctx: LowIRLowerContext): string;
    emitReleaseFieldValue(className: string, fieldName: string, rawVal: string, lctx: LowIRLowerContext): void;
    emitFieldStoreOn(className: string, structPtr: string, fieldName: string, value: string, lctx: LowIRLowerContext): void;
    emitFieldStoreOnEx(className: string, structPtr: string, fieldName: string, value: string, srcIsFresh: boolean, lctx: LowIRLowerContext): void;
    emitObjRetainPtr(ptr: string, lctx: LowIRLowerContext): void;
    emitObjReleasePtr(ptr: string, lctx: LowIRLowerContext): void;
    emitFieldLoad(fieldName: string, lctx: LowIRLowerContext): string;
    emitFieldStore(fieldName: string, value: string, lctx: LowIRLowerContext): void;
    fieldObjectClassName(className: string, fieldName: string, lctx: LowIRLowerContext): string;
    resolveObjectPtr(varName: string, className: string, lctx: LowIRLowerContext): string;
    joinDotPrefix(parts: Array<string>, count: number): string;
    resolveObjectClassChain(varName: string, lctx: LowIRLowerContext): string;
    resolveObjectPtrChain(varName: string, className: string, lctx: LowIRLowerContext): string;
    resolveObjectClass(varName: string, lctx: LowIRLowerContext): string;
    resolveFieldPtrExpr(vref: string, lctx: LowIRLowerContext): string;
    isObjectArrayField(v: RangerAppParamDesc): boolean;
    newTargetClassName(node: CodeNode, lctx: LowIRLowerContext): string;
    emitFieldDefault(className: string, objPtr: string, fieldName: string, valNode: CodeNode, lctx: LowIRLowerContext): void;
    initFieldDefaultsInObject(className: string, objPtr: string, lctx: LowIRLowerContext): void;
    initFieldDefaultsInConstructor(className: string, lctx: LowIRLowerContext): void;
    initArrayFieldsInObject(className: string, objPtr: string, lctx: LowIRLowerContext): void;
    initArrayFieldsInConstructor(className: string, lctx: LowIRLowerContext): void;
    structByteSize(className: string, module: LowIRModule): number;
    classHasOwnedFields(className: string): boolean;
    lowerNewObject(className: string, argsNode: CodeNode, lctx: LowIRLowerContext): string;
    findFieldIndex(className: string, fieldName: string, module: LowIRModule): number;
    isClassField(fieldName: string, className: string, module: LowIRModule): boolean;
    structFieldCount(className: string, module: LowIRModule): number;
    lowerFunction(fnDesc: RangerAppFunctionDesc, className: string, appCtx: RangerAppWriterContext, exportFn: boolean, isMain: boolean, isInstance: boolean): void;
    lowerSingletonAccessor(cl: RangerAppClassDesc, appCtx: RangerAppWriterContext): void;
    collectLambdas(appCtx: RangerAppWriterContext): void;
    collectMethodLambdas(m: RangerAppFunctionDesc, pt: string): void;
    lambdaCallSig(lam: RangerAppFunctionDesc, pt: string): string;
    addLambdaSig(sig: string): void;
    lowerLambdaBodies(appCtx: RangerAppWriterContext): void;
    lowerLambdaFunction(lam: RangerAppFunctionDesc, fnName: string, appCtx: RangerAppWriterContext): void;
    lambdaTableIndex(name: string): number;
    nodeAssignsToName(node: CodeNode, name: string): boolean;
    computeBoxedCandidates(fnDesc: RangerAppFunctionDesc, lctx: LowIRLowerContext): void;
    collectBoxedCandidates(m: RangerAppFunctionDesc, lctx: LowIRLowerContext): void;
    computeLambdaCaptures(node: CodeNode, lam: RangerAppFunctionDesc, lctx: LowIRLowerContext): LambdaCaptureInfo;
    lowerLambdaValue(node: CodeNode, lctx: LowIRLowerContext): string;
    lowerLambdaCall(node: CodeNode, lctx: LowIRLowerContext): string;
    isOwnedObjectLocal(varName: string, lctx: LowIRLowerContext): boolean;
    releaseOwnedLocal(varName: string, lctx: LowIRLowerContext): void;
    isOwnedStringLocal(varName: string, lctx: LowIRLowerContext): boolean;
    registerFreshStringTemp(tmp: string, lctx: LowIRLowerContext): void;
    claimStringTemp(tmp: string, lctx: LowIRLowerContext): void;
    flushStringTempsFrom(mark: number, lctx: LowIRLowerContext): void;
    registerFreshObjectTemp(tmp: string, lctx: LowIRLowerContext): void;
    claimObjectTemp(tmp: string, lctx: LowIRLowerContext): void;
    flushObjectTempsFrom(mark: number, lctx: LowIRLowerContext): void;
    emitStrReleasePtr(ptr: string, lctx: LowIRLowerContext): void;
    releaseOwnedString(varName: string, lctx: LowIRLowerContext): void;
    releaseOwnedCollectionLocal(varName: string, lctx: LowIRLowerContext): void;
    emitOwnedStringInit(varName: string, valNode: CodeNode, strPtr: string, lctx: LowIRLowerContext): string;
    emitOwnedStringReassign(varName: string, valNode: CodeNode, strPtr: string, lctx: LowIRLowerContext): string;
    strictOwnershipEnabled(lctx: LowIRLowerContext): boolean;
    emitOwnershipSummary(lctx: LowIRLowerContext): void;
    emitReleaseOwnedLocals(lctx: LowIRLowerContext): void;
    lowerBlock(block: CodeNode, lctx: LowIRLowerContext): void;
    isAssignNode(node: CodeNode): boolean;
    lowerStmt(node: CodeNode, lctx: LowIRLowerContext): void;
    lowerStmtDispatch(node: CodeNode, lctx: LowIRLowerContext): void;
    lowerVarDef(node: CodeNode, lctx: LowIRLowerContext): void;
    assignTargetFieldClass(varName: string, lctx: LowIRLowerContext): string;
    lowerAssign(node: CodeNode, lctx: LowIRLowerContext): void;
    lowerReturn(node: CodeNode, lctx: LowIRLowerContext): void;
    isCompareOp(op: string): boolean;
    unwrapInfixExpr(node: CodeNode): CodeNode;
    unwrapCondExpr(node: CodeNode): CodeNode;
    exprProducesI1(node: CodeNode, lctx: LowIRLowerContext): boolean;
    condVref(node: CodeNode): string;
    lowerCond(node: CodeNode, lctx: LowIRLowerContext): string;
    lowerIf(node: CodeNode, lctx: LowIRLowerContext): void;
    lowerWhile(node: CodeNode, lctx: LowIRLowerContext): void;
    releaseLoopBodyOwned(ownedBefore: number, ownedStrBefore: number, ownedCollBefore: number, lctx: LowIRLowerContext): void;
    lowerExpr(node: CodeNode, lctx: LowIRLowerContext): string;
    operatorReturnsString(op: string): boolean;
    exprIsFreshString(node: CodeNode, lctx: LowIRLowerContext): boolean;
    exprIsStringish(node: CodeNode, lctx: LowIRLowerContext): boolean;
    lowerStringCompare(aNode: CodeNode, bNode: CodeNode, pred: string, lctx: LowIRLowerContext): string;
    lowerCompareI32(aNode: CodeNode, bNode: CodeNode, pred: string, lctx: LowIRLowerContext): string;
    lowerArithF64OrI32(intKind: string, fpKind: string, node: CodeNode, lctx: LowIRLowerContext): string;
    lowerBinaryOp(opName: string, node: CodeNode, lctx: LowIRLowerContext): string;
    tryLowerIntrinsic(fnName: string, argsNode: CodeNode, lctx: LowIRLowerContext): string;
    finishObjectCall(rv: string): string;
    lowerCall(node: CodeNode, lctx: LowIRLowerContext): string;
    tryLowerObjectCall(node: CodeNode, lctx: LowIRLowerContext): string;
    fieldReceiverClass(recvName: string, lctx: LowIRLowerContext): string;
    callArgsNode(node: CodeNode): CodeNode;
    resolveMethodName(node: CodeNode, defaultName: string): string;
    argIrType(arg: CodeNode, lctx: LowIRLowerContext): string;
    paramIrTypeFromDesc(paramIndex: number, fnDesc: RangerAppFunctionDesc, lctx: LowIRLowerContext): string;
    lowerInstanceCallOn(node: CodeNode, receiverName: string, recvNode: CodeNode, methodName: string, lctx: LowIRLowerContext): string;
    lowerInstanceCall(node: CodeNode, lctx: LowIRLowerContext): string;
    resolveCalleeName(callee: CodeNode): string;
}
export declare class LLVMIRWriter {
    varargNames: Array<string>;
    varargSigs: Array<string>;
    constructor();
    collectVarargFns(module: LowIRModule): void;
    varargSigFor(fnName: string): string;
    llTy(t: string): string;
    normalizeDoubleLit(lit: string): string;
    hexDigit(d: number): string;
    hexByte(b: number): string;
    llvmEscapeCString(text: string): string;
    writeModule(module: LowIRModule, wr: CodeWriter): void;
    writeTypeDescs(module: LowIRModule, wr: CodeWriter): void;
    writeOneTypeDesc(td: LowIRTypeDesc, wr: CodeWriter): void;
    writeStruct(st: LowIRStruct, wr: CodeWriter): void;
    writeFunction(fn: LowIRFunction, wr: CodeWriter): void;
    writeInstr(ins: LowIRInstr, wr: CodeWriter): void;
    writeTerminator(bb: LowIRBlock, wr: CodeWriter): void;
}
export declare class WATWriter {
    strAddrs: {
        [key: string]: number;
    };
    typeDescAddrs: {
        [key: string]: number;
    };
    lambdaFuncs: Array<string>;
    constructor();
    lambdaFuncIndex(name: string): number;
    sigTypeName(callSig: string): string;
    sigTypeDecl(callSig: string): string;
    utf8Encode(text: string): Array<number>;
    hexDigit(d: number): string;
    hexByte(b: number): string;
    dataEscape(bytes: Array<number>): string;
    leWord(v: number): string;
    align4(a: number): number;
    fieldOwnedFlag(fd: LowIRTypeFieldDesc): number;
    descHasOwned(td: LowIRTypeDesc): boolean;
    moduleHasOwnedTypeDescs(module: LowIRModule): boolean;
    emitStaticData(module: LowIRModule, wr: CodeWriter): void;
    wasmName(llvmName: string): string;
    isGepTemp(name: string): boolean;
    moduleUsesHeap(module: LowIRModule): boolean;
    watType(irType: string): string;
    localTypeMap(fn: LowIRFunction): {
        [key: string]: string;
    };
    localTypeOf(m: {
        [key: string]: string;
    }, wn: string): string;
    writeModule(module: LowIRModule, wr: CodeWriter): void;
    findBlockIdx(fn: LowIRFunction, label: string): number;
    isWhileHeader(fn: LowIRFunction, condIdx: number): boolean;
    collectLocals(fn: LowIRFunction): Array<string>;
    writeBlockInstrs(bb: LowIRBlock, wr: CodeWriter): void;
    writeFunction(fn: LowIRFunction, wr: CodeWriter, doExport: boolean): void;
    markVisited(label: string, visited: {
        [key: string]: boolean;
    }): void;
    isVisited(label: string, visited: {
        [key: string]: boolean;
    }): boolean;
    emitRegion(fn: LowIRFunction, startIdx: number, boundIdx: number, wr: CodeWriter, visited: {
        [key: string]: boolean;
    }): string;
    emitIf(fn: LowIRFunction, headerIdx: number, wr: CodeWriter, visited: {
        [key: string]: boolean;
    }): string;
    emitWhile(fn: LowIRFunction, condIdx: number, wr: CodeWriter, visited: {
        [key: string]: boolean;
    }): string;
    writeGet(llvmRef: string, wr: CodeWriter): void;
    writeInstr(ins: LowIRInstr, wr: CodeWriter): void;
}
export declare class RangerLLVMPipeline {
    constructor();
    generateModule(appCtx: RangerAppWriterContext, wr: CodeWriter): void;
}
export declare class RangerLLVMClassWriter extends RangerGenericClassWriter {
    compiler?: LiveCompiler;
    constructor();
    writeClass(node: CodeNode, ctx: RangerAppWriterContext, wr: CodeWriter): Promise<void>;
}
export declare class OpList {
    list: Array<CodeNode>;
    constructor();
}
export declare class RangerActiveOperators {
    stdCommands?: CodeNode;
    parent?: RangerActiveOperators;
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
    parser?: RangerFlowParser;
    langWriter?: RangerGenericClassWriter;
    hasCreatedPolyfill: {
        [key: string]: boolean;
    };
    lastProcessedNode?: CodeNode;
    repeat_index: number;
    installedFile: {
        [key: string]: boolean;
    };
    constructor();
    treeReferencesVRef(node: CodeNode, name: string): boolean;
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
    createPolyfill(location: string, code: string, ctx: RangerAppWriterContext, wr: CodeWriter): void;
    createPolyfillLegacy(code: string, ctx: RangerAppWriterContext, wr: CodeWriter): void;
    installFile(filename: string, ctx: RangerAppWriterContext, wr: CodeWriter): Promise<void>;
    findOpCode(op: CodeNode, node: CodeNode, ctx: RangerAppWriterContext, wr: CodeWriter): Promise<void>;
    findOpTemplate(op: CodeNode, node: CodeNode, ctx: RangerAppWriterContext, wr: CodeWriter): Promise<CodeNode> | undefined;
    localCall(node: CodeNode, ctx: RangerAppWriterContext, wr: CodeWriter): Promise<boolean>;
    finishWalkNode(wr: CodeWriter): void;
    WalkNode(node: CodeNode, in_ctx: RangerAppWriterContext, wr: CodeWriter): Promise<void>;
    walkCommandList(cmd: CodeNode, node: CodeNode, ctx: RangerAppWriterContext, wr: CodeWriter): Promise<void>;
    walkCommand(cmd: CodeNode, node: CodeNode, ctx: RangerAppWriterContext, wr: CodeWriter): Promise<void>;
    compile(node: CodeNode, ctx: RangerAppWriterContext, wr: CodeWriter): void;
    findParamDesc(obj: CodeNode, ctx: RangerAppWriterContext, wr: CodeWriter): RangerAppParamDesc | undefined;
}
export declare class ColorConsole {
    constructor();
    out(color: string, str: string): void;
}
export declare class CLIProgress {
    useColors: boolean;
    totalSteps: number;
    currentStep: number;
    startTime: number;
    stepStartTime: number;
    inputFile: string;
    outputFile: string;
    targetLanguage: string;
    compilerVersion: string;
    constructor();
    setUseColors(use: boolean): void;
    setCompilationInfo(input: string, output: string, target: string): void;
    checkMark(): string;
    crossMark(): string;
    arrowRight(): string;
    bullet(): string;
    lightning(): string;
    green(text: string): string;
    red(text: string): string;
    yellow(text: string): string;
    cyan(text: string): string;
    blue(text: string): string;
    magenta(text: string): string;
    gray(text: string): string;
    dim(text: string): string;
    bold(text: string): string;
    boldCyan(text: string): string;
    boldGreen(text: string): string;
    boldRed(text: string): string;
    success(msg: string): string;
    error(msg: string): string;
    warning(msg: string): string;
    info(msg: string): string;
    divider(): string;
    shortDivider(): string;
    padRight(text: string, width: number): string;
    padLeft(text: string, width: number): string;
    printHeader(): void;
    printCompilationInfo(): void;
    getTargetDisplay(lang: string): string;
    step(stepNum: number, stepName: string): void;
    stepWithDetail(stepNum: number, stepName: string, detail: string): void;
    printSuccess(outputPath: string): void;
    printFailure(errorCount: number): void;
    printCompilerError(filename: string, lineNum: number, colNum: number, description: string, lineContent: string, prevLine: string, nextLine: string): void;
    printSimpleError(filename: string, lineNum: number, description: string, lineContent: string): void;
    printHelpHeader(): void;
    printOption(option: string, description: string): void;
    printFlag(flag: string, description: string): void;
    printSection(title: string): void;
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
export declare class StaticAnalyzer {
    ctx?: RangerAppWriterContext;
    currentFunction?: RangerAppFunctionDesc;
    currentClass?: RangerAppClassDesc;
    debug: boolean;
    mutatingOps: {
        [key: string]: boolean;
    };
    constructor();
    initMutatingOps(): void;
    isMutatingOperator(opName: string): boolean;
    isMutatingNode(node: CodeNode): boolean;
    getRootVarName(node: CodeNode): string;
    isMemberAccess(node: CodeNode): boolean;
    getMemberPath(node: CodeNode): string;
    markVarAsMutated(varName: string, fnCtx: RangerAppWriterContext): void;
    analyzeVarDef(node: CodeNode): void;
    walkForFieldAssignments(node: CodeNode, fnCtx: RangerAppWriterContext): void;
    walkForMutations(node: CodeNode, fnCtx: RangerAppWriterContext): void;
    walkForReturns(node: CodeNode): void;
    isSelfAssignment(node: CodeNode): boolean;
    usesSelf(node: CodeNode): boolean;
    walkForSelfAnalysis(node: CodeNode): void;
    isWeakField(fieldName: string): boolean;
    walkForWeakAssignments(node: CodeNode, fnCtx: RangerAppWriterContext): void;
    walkForTransitiveWeak(node: CodeNode, fnCtx: RangerAppWriterContext): void;
    containsSelfMethodCall(node: CodeNode): boolean;
    collectSelfMethodCallArgs(node: CodeNode, results: Array<CodeNode>): void;
    walkForRustBorrowConflicts(node: CodeNode): void;
    analyzeFunction(fn: RangerAppFunctionDesc): void;
    analyzeClass(cl: RangerAppClassDesc): void;
    analyzeTransitiveWeak(fn: RangerAppFunctionDesc): void;
    analyzeClassTransitiveWeak(cl: RangerAppClassDesc): void;
    propagateArgMutRef(calledParam: RangerAppParamDesc, arg: CodeNode, fnCtx: RangerAppWriterContext, changedParams: Array<string>): void;
    walkForTransitiveMutBorrow(node: CodeNode, fnCtx: RangerAppWriterContext, fn: RangerAppFunctionDesc, changedParams: Array<string>): void;
    analyzeTransitiveMutBorrow(fn: RangerAppFunctionDesc, changedParams: Array<string>): void;
    analyzeClassTransitiveMutBorrow(cl: RangerAppClassDesc, changedParams: Array<string>): void;
    checkDirectSelfMutation(fn: RangerAppFunctionDesc): boolean;
    nodeDirectlyMutatesSelf(node: CodeNode): boolean;
    analyzeMethodMutation(fn: RangerAppFunctionDesc): boolean;
    checkTransitiveMutation(node: CodeNode, fn: RangerAppFunctionDesc): boolean;
    analyzeClassMutation(cl: RangerAppClassDesc): void;
    doesMethodMutate(typeName: string, methodName: string): boolean;
    analyzeParamMethodCalls(node: CodeNode, fnCtx: RangerAppWriterContext, fn: RangerAppFunctionDesc): void;
    analyzeMethodParamMutations(fn: RangerAppFunctionDesc): void;
    analyzeClassParamMutations(cl: RangerAppClassDesc): void;
    ownershipKindName(kind: number): string;
    ownerPathOf(node: CodeNode): string;
    targetOutlivesScope(target: CodeNode, fnCtx: RangerAppWriterContext): boolean;
    isPrimitiveTypeName(name: string): boolean;
    isHeapOwnedParam(p: RangerAppParamDesc): boolean;
    recordEscape(valueName: string, ownerPath: string, via: string, fnCtx: RangerAppWriterContext): void;
    walkForEscapes(node: CodeNode, fnCtx: RangerAppWriterContext): void;
    ownerSuffix(param: RangerAppParamDesc): string;
    finalizeOwnership(fn: RangerAppFunctionDesc, strict: boolean): void;
    analyzeOwnership(fn: RangerAppFunctionDesc, strict: boolean): void;
    analyzeOwnershipClass(cl: RangerAppClassDesc, strict: boolean): void;
    analyzeOwnershipAll(strict: boolean): void;
    analyzeAll(): void;
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
    ctx?: RangerAppWriterContext;
    fileSystem?: CodeFileSystem;
    target_dir: string;
    hasErrors: boolean;
    errorMessage: string;
    constructor();
}
export declare class VirtualCompiler {
    envObj?: InputEnv;
    constructor();
    getEnvVar(name: string): string;
    possiblePaths(envVarName: string): Array<string>;
    searchLib(paths: Array<string>, libname: string): string;
    fillStr(cnt: number): string;
    detectLanguageFromExtension(filename: string): string;
    isTypeScriptExtension(filename: string): boolean;
    run(env: InputEnv): Promise<CompilerResults>;
    static create_env(): Promise<void>;
    static displayCompilerErrorsWithCLI(appCtx: RangerAppWriterContext, cli: CLIProgress): void;
    static displayCompilerErrors(appCtx: RangerAppWriterContext): void;
    static displayParserErrors(appCtx: RangerAppWriterContext): void;
}
export declare class CompilerInterface {
    constructor();
    static create_env(): InputEnv;
}
export {};
