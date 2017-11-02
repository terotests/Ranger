
class RangerServiceBuilder {

  fn createOpStaticClass@(weak):RangerAppClassDesc (ctx:RangerAppWriterContext name:string) {
    def nameWillBe name
    def str ""
    def i 0
    def len (strlen nameWillBe)
    while( i < len ) {
      def c (charAt nameWillBe i)
      if(c == (charcode ".")) {
        str = str + "_"  
      } {
        str = str + (substring nameWillBe i (i + 1))
      }
      i = i + 1
    }
    if(ctx.isDefinedClass(str)) {
      return (ctx.findClass(str))
    }
;     return 

    def tpl_code ("class " + str + " {
}")

    def code:SourceCode (new SourceCode ( tpl_code ))
    code.filename = str + ".ranger"
    def parser:RangerLispParser (new RangerLispParser (code))
    parser.parse(false)

    def classRoot@(lives) (itemAt parser.rootNode.children 0)
    def classNameNode@(lives) (classRoot.getSecond())
    classNameNode.vref = str
    def new_class@(lives):RangerAppClassDesc (new RangerAppClassDesc ())
    new_class.name = str
    new_class.is_operator_class = true
    new_class.nameNode = classNameNode
    new_class.classNode = classRoot

    def subCtx@(lives):RangerAppWriterContext (ctx.fork())
    subCtx.setCurrentClass(new_class)
    new_class.ctx = subCtx

    def root (ctx.getRoot())
    root.addClass(str new_class)
    classNameNode.clDesc = new_class
    push root.staticClassBodies classRoot
    return new_class
  }

  fn CreateServices (parser:RangerFlowParser ctx:RangerAppWriterContext orig_wr:CodeWriter) {
    if( (ctx.hasCompilerFlag("client")) || (ctx.hasCompilerSetting("client")) ) {
      print "--> could create Client services for Java here..."
      def root (ctx.getRoot())
      def cl (this.createOpStaticClass(ctx "RangerAppService"))
      print "created " + cl.name
      root.appServices.forEach({
        print " - service " + index
      })
    } 
  }
    
}