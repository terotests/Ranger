
class AndroidPageWriter {

  def classWriter:RangerGenericClassWriter

  fn BuildAST:CodeNode ( code_string:string ) {
      def lang_code:SourceCode (new SourceCode ( code_string ) )
      lang_code.filename = "<AST>"
      def lang_parser:RangerLispParser (new RangerLispParser (lang_code))
      lang_parser.parse(false)
      def node@(lives):CodeNode (unwrap lang_parser.rootNode)
      return node
  }

;  fn CreateLetDef@(optional):CodeNode ( parser:RangerFlowParser node:CodeNode ctx:RangerAppWriterContext wr:CodeWriter) {
;    def res:CodeNode
;    def nameNode (node.getChild(1))
;    def valueNode (node.getChild(2))
;
;    if( (null? nameNode) || (null? valueNode) ) {
;      return res
;    }
;
;    return res
;  }


  fn CreatePage (parser:RangerFlowParser node:CodeNode ctx:RangerAppWriterContext orig_wr:CodeWriter) {

    def sc (node.getSecond())
    def pageName sc.vref
    ; generic page writer follows now the android page writing rules...
    def wr:CodeWriter (orig_wr.getFileWriter("." (pageName + ".java")))
    wr.out("// created by AndroidPageWriter " true)

    def package_name (ctx.getCompilerSetting("package"))
    if( (strlen package_name) > 0) {
      wr.out("package " + package_name + ";" , true)
    }
    def importFork:CodeWriter (wr.fork())
    
    ; TODO: how to import the necessary view libraries ? 
    classWriter.import_lib("android.content.Context" ctx wr)
    classWriter.import_lib("android.support.v7.app.AppCompatActivity" ctx wr)
    classWriter.import_lib("android.widget.LinearLayout" ctx wr)
    classWriter.import_lib("android.view.LayoutInflater" ctx wr)
    classWriter.import_lib("android.os.Bundle" ctx wr)
    classWriter.import_lib("android.support.v4.app.Fragment" ctx wr)
    classWriter.import_lib("android.view.ViewGroup" ctx wr)
    classWriter.import_lib("android.view.View" ctx wr)

    def package_name (ctx.getCompilerSetting("package"))
    
    if( classWriter.isPackaged(ctx) ) {
      classWriter.import_lib( (package_name + ".interfaces.*") ctx wr)
      classWriter.import_lib( (package_name + ".operators.*") ctx wr)
      classWriter.import_lib( (package_name + ".immutables.*") ctx wr)
    }

    wr.out('public class ' + pageName + ' extends Fragment  {' , true)
    wr.indent(1)

    wr.out("public JinxProcess mainProcess; " true)
    wr.out('@Override ' true)
    wr.out('public void onDestroyView() { ' true)
      wr.indent(1)
      wr.out("super.onDestroyView(); " true)
      wr.out("if( mainProcess != null) mainProcess.abort();" true)
      wr.indent(-1)
    wr.out("}" true)
    
    wr.out("@Override" true)
    wr.out( 'public View onCreateView(final LayoutInflater inflater, final ViewGroup container, final Bundle savedInstanceState) {' true)
    wr.indent(1)
      ; wr.out("super.onCreate(savedInstanceState);" true)
      ; the page code should come about here...
      wr.out('final View view = inflater.inflate(R.layout.activity_' + pageName + ', container, false);' , true)


      ; walk the body
      def fnBody:CodeNode (itemAt node.children 2)
      def subCtx:RangerAppWriterContext (ctx.fork())
      subCtx.is_function = true
;    subCtx.currentMethod = m
      subCtx.in_static_method = true
      subCtx.setInMethod()

      def rootCtx (subCtx.getRoot())
      def errCnt (array_length rootCtx.compilerErrors)

      def copyOf (fnBody.copy())

      parser.WalkNodeChildren(fnBody subCtx wr)
      subCtx.unsetInMethod()
      subCtx.in_static_method = false
      subCtx.function_level_context = true


      def errCnt2 (array_length rootCtx.compilerErrors)
      ; print "Android Page Writer error cnt, after first walk : " + (errCnt2 - errCnt)
      def cnt (errCnt2 - errCnt)

      while( cnt > 0 ) {
        removeLast rootCtx.compilerErrors
        cnt = cnt - 1
      }

      def preBody (fnBody.newExpressionNode())
      def mainBody (fnBody.newExpressionNode())
      def newBody (fnBody.newExpressionNode())

      def stdCode@(temp) (fnBody.newExpressionNode()) 
      def stdBody (fnBody.newExpressionNode())
      def in_stdCode false
      def pushed_std false
      def first_lines true

      def pRef (fnBody.newVRefNode("process"))
      def pName (fnBody.newStringNode(pageName))

      push newBody.children pRef
      push newBody.children pName

;      push prDefine.children newBody

      if( pageName != "notme" ) {
        fnBody.children.forEach({

          if( (item.isFirstVref("ui")) || ( (item.eval_type_name == "JinxProcess")) ) {
            if in_stdCode {
              push newBody.children stdCode
              in_stdCode = false
            }            
            first_lines = false
          }

          if(item.isFirstVref("ui")) {
            first_lines = false            
            def taskNode (itemAt copyOf.children index)
            def codeToRun (taskNode.getSecond())
            ;codeToRun.is_block_node = true
            ; codeToRun.expression = false
            def uiNode (r.op "task.call" (r.block 
              (r.op "def" (r.vref "uictx") (r.op "unwrap" (r.op "get" (r.vref "ctx.anyValues") (r.value "uicontext"))))
              (r.op "print" (r.value "after this should be ui_thread"))              
              (r.op "case" (r.vref "uictx") (r.vref "c" "UIContextHandle") (r.block
                  ; (r.op "print" (r.value "after this should be ui_thread"))
                  (r.op "ui_thread" (r.vref "c") 
                    ; and here..
                    codeToRun
                    ; (r.op "print" (r.value "The last line of the page is here...."))
                  )
                )
              )
            ))
            push newBody.children uiNode
            return            
          }

          ; if(item.isFirstVref("def")) {
          ;  print "!!!! def found"
          ;  print (item.getLineAsString())
          ;}

          if(item.eval_type_name == "JinxProcess") {
            def taskNode (itemAt copyOf.children index)
            push newBody.children taskNode
          } {
            if( first_lines ) {
              def tt (itemAt copyOf.children index)
              push preBody.children tt
            } {
              if(in_stdCode == false) {
                stdCode = (fnBody.newExpressionNode())
               push stdCode.children (fnBody.newVRefNode("task.call"))

                def callBody (fnBody.newExpressionNode())
                callBody.is_block_node = true

                def tryC (fnBody.newExpressionNode())
                ; tryC.is_block_node = true
                def catchC (fnBody.newExpressionNode())
                catchC.is_block_node = true
                push tryC.children (fnBody.newVRefNode("try"))

                stdBody = (fnBody.newExpressionNode())
                stdBody.is_block_node = true
                push tryC.children stdBody
                push tryC.children catchC
                push callBody.children tryC
                push stdCode.children callBody
                in_stdCode = true
                pushed_std = false
              }   
              def taskNode (itemAt copyOf.children index)
              push stdBody.children taskNode
            }
          }
        })
      }
      if in_stdCode {
        push newBody.children stdCode
      }

      def ast (this.BuildAST('
 def ctx (new JinxProcessCtx)
 ctx.anyValues = (set ctx.anyValues \"view\" view)
 ctx.anyValues = (set ctx.anyValues \"uicontext\" (getUIContext))
 ctx.anyValues = (set ctx.anyValues \"process\" mainProcess)
 mainProcess.start(ctx)
      '))
      ast.children.forEach({
        def n@(temp) item
        push mainBody.children n
      })

      def mainPN@(lives) (fnBody.newVRefNode("mainProcess"))
      mainPN.type_name = "JinxProcess"
      def p@(lives):RangerAppParamDesc (new RangerAppParamDesc ())
      p.name = "mainProcess"
      p.compiledName = "mainProcess"
      p.value_type = RangerNodeType.VRef
      p.node = mainPN
      p.nameNode = mainPN
      p.is_optional = false
      p.init_cnt = 1
      subCtx.defineVariable(p.name p)

      def mainPN@(lives) (fnBody.newVRefNode("view"))
      mainPN.type_name = "View"
      def p@(lives):RangerAppParamDesc (new RangerAppParamDesc ())
      p.name = "view"
      p.compiledName = "view"
      p.value_type = RangerNodeType.VRef
      p.node = mainPN
      p.nameNode = mainPN
      p.is_optional = false
      p.init_cnt = 1
      subCtx.defineVariable(p.name p)

      def mainPN@(lives) (fnBody.newVRefNode("ctx"))
      mainPN.type_name = "JinxProcessCtx"
      def p@(lives):RangerAppParamDesc (new RangerAppParamDesc ())
      p.name = "ctx"
      p.compiledName = "ctx"
      p.value_type = RangerNodeType.VRef
      p.node = mainPN
      p.nameNode = mainPN
      p.is_optional = false
      p.init_cnt = 1
      subCtx.defineVariable(p.name p)

      ; TODO: also operators for defining variables into the context easier
      ; 

      ; example of how to create AST node...
      ; push mainBody.children (r.op "print" (r.value "The last line of the page is here...."))


      subCtx.is_function = true
;    subCtx.currentMethod = m
      subCtx.in_static_method = true
      subCtx.setInMethod()
      parser.WalkNode(preBody subCtx wr)
      parser.WalkNode(newBody subCtx wr)
      parser.WalkNode(mainBody subCtx wr)
      subCtx.unsetInMethod()
      subCtx.in_static_method = false
      subCtx.function_level_context = true

;       wr.out("JinxProcessCtx ctx = new JinxProcessCtx();" true)0
      classWriter.WalkNode( preBody subCtx wr )
      wr.out("mainProcess = (" false)
      subCtx.setInExpr()  
      classWriter.WalkNode( newBody subCtx wr )
      subCtx.unsetInExpr()
      wr.out(");" true);

      classWriter.WalkNode( mainBody subCtx wr )

;       wr.out("ctx = ctx.set_anyValues()" true)

;      wr.out("mainProcess.start(ctx);" true)

      wr.out("return view;" true)
    wr.indent(-1)
    wr.out("}" true)

    wr.indent(-1)
    wr.out("}" true)

    def import_list:[string] (wr.getImports())
    for import_list codeStr:string i {
      importFork.out(("import " + codeStr + ";") true)
    }    

  }
    
}