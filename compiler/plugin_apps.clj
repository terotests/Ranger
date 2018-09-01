
Import "ng_Compiler.clj"

class Plugin {

    ; return ([] "import_loader" "postprocess" "random" "generate_ast")
    fn features:[string] () {
        return ([] "apps")
    }

    fn apps (root:CodeNode ctx:RangerAppWriterContext wr:CodeWriter) {
        print 'apps plugin called'
        def nodes (ctx.getPluginNodes("apps"))
        nodes.forEach({
            def block (item.getSecond())
            block.children.forEach({
                if(item.isFirstVref("page")) {
                    def nameNode (item.getSecond())
                    print "--------------------------------------------------------"
                    print "--- application plugin found page " + nameNode.vref + "----"
                }
            })
        })
        
    }

}