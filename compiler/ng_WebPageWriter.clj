
class WebPageWriter {

  def classWriter:RangerGenericClassWriter

  fn CreatePage (parser:RangerFlowParser node:CodeNode ctx:RangerAppWriterContext orig_wr:CodeWriter) {

    def sc (node.getSecond())
    ; generic page writer follows now the android page writing rules...
    def wr orig_wr
    wr.out("// created by WebPageWriter " true) 

    ; the import fork should be placed in some other place...

    ; TODO: return process, not view...    
    wr.out( sc.vref + " () {" , true)
    wr.indent(1)

      wr.out("var view = document.getElementById('" + sc.vref + "');" , true)

      def fnBody:CodeNode (itemAt node.children 2)
      def subCtx:RangerAppWriterContext (ctx.fork())
      subCtx.is_function = true
;    subCtx.currentMethod = m
      subCtx.in_static_method = true
      subCtx.setInMethod()
      parser.WalkNodeChildren(fnBody subCtx wr)
      subCtx.unsetInMethod()
      subCtx.in_static_method = false
      subCtx.function_level_context = true

      classWriter.WalkNode( fnBody subCtx wr )

      wr.out("return view;" true)
    wr.indent(-1)
    wr.out("}" true)
  }
    
}