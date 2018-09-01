
Import "ng_Compiler.clj"

; http://ryanogles.by/css/javascript/2017/05/25/the-state-of-css.html
; https://speakerdeck.com/vjeux/react-css-in-js

; Unity file format:
; https://docs.unity3d.com/Manual/FormatDescription.html

; --> describing a database
; ---> fields, names, types etc.

; --> describe a wordpress site and publish it to cloud
; --> how to do that ?

; USD
; https://graphics.pixar.com/usd/docs/index.html
; https://graphics.pixar.com/usd/docs/USD-Glossary.html
; https://codepen.io/MarcRay/pen/vmJBn


operator type:string all {
    fn remove_trailing:string (ch:string) {
        def parts (strsplit self ch)
        if( ( array_length parts ) == 1 ) {
            return self     
        }
        removeLast parts
        return (join parts ch)
    } 
}

class Plugin {

    def html_mode ""
    def vendor_prefixes:[string] ([] "-moz-" "-webkit-" "-o-" "-ms-")
    def prefixable:[string] ([] "borderRadius" "border-radius" )
    def transform:[string] ([] 
                                "borderRadius" "border-radius" 
                            )

    fn features:[string] () {
        return ([] "import_loader" "postprocess" "random" "generate_ast")
    }

    ; -- import command can be used by plugins to insert custom code and features
    fn import_loader:Any ( node:CodeNode ctx:RangerAppWriterContext wr:CodeWriter) {
        ; Import "somelib"
        def sc (node.getSecond())
        if(sc.string_value == "jabba") {
            return '
class jabba {
    fn jabbaTester() {

    }
}                
            '
        }
        return false
    }

    fn generate_ast (root:CodeNode ctx:RangerAppWriterContext orig_wr:CodeWriter) {
        print "-------------------------------------------------------"
        print "--> Generate AST was called in plugin"
        ctx.pushAst( `

operator type:void all {
    fn alert (str:string) {
        print "ALERT!!! " + str
    }
}

class inserted_class {
    static fn foo () {
        print "inserted_class does exist!!!"
    }
}        
        ` root orig_wr)
    }

    fn doesRequirePrefix:boolean ( cssName:string) {
        return ( (indexOf prefixable cssName) >= 0 )
    }
    fn transformName:string ( cssName:string) {
        def i (indexOf transform cssName)
        if( (i >= 0 ) && (0 == (i % 2)) ) {
            return (itemAt transform (i + 1))
        }
        return cssName
    }

    fn applyCss (cssName:string cssValue:string ctx:RangerAppWriterContext wr:CodeWriter) {
        if( (this.doesRequirePrefix(cssName))) {
            vendor_prefixes.forEach({
                wr.out( item + (this.transformName(cssName)) + ':  ' , false )
                wr.out(cssValue + ";" , true)
                
            })
        } {
            wr.out( (this.transformName(cssName)) + ':  ' , false )
            wr.out(cssValue + ";" , true)
        }
    }

    ; can be written either as color or 'color'
    fn vrefOrString:string ( node:CodeNode ) {
        if( (strlen node.vref) > 0 ) {
            return node.vref
        }
        return node.string_value + (node.value_type)
    }
    fn nodeOrigValue:string ( node:CodeNode ) {
        if(node.value_type == RangerNodeType.VRef) {
            return node.vref
        }
        if(node.value_type == RangerNodeType.Integer) {
            return ("" + node.int_value)
        }
        if(node.value_type == RangerNodeType.Double) {
            return ("" + node.double_value)
        }
        return (node.getParsedString())
    }
    fn collectValuesFromLine:string (start_index:int parentNode:CodeNode) {
        def res ""
        def cnt 0
        def last_numeric false
        def unit_values:[string] ([] "px" "dp" "em" "s")
        for parentNode.children ch:CodeNode i {
            if( i >= start_index ) {
                if( (false == last_numeric) && (cnt > 0 ) ) {
                    res = res + " "
                }
                def this_val (remove_trailing (trim (this.nodeOrigValue(ch))) ";" )
                if last_numeric {
                    if( (indexOf unit_values this_val) < 0) {
                        res = res + " "
                    } 
                }
                res = res + (this.nodeOrigValue(ch))
                cnt = cnt + 1
                last_numeric = (ch.value_type == RangerNodeType.Integer || ch.value_type == RangerNodeType.Double)
            }
        }
        return res
    }
    fn walkStyleProps (node:CodeNode ctx:RangerAppWriterContext wr:CodeWriter) {
        node.children.forEach({
            def propName (item.getFirst())
            def propValue (item.getSecond())
            def theValue (this.collectValuesFromLine( 1 item))
            def parts (strsplit theValue ";")
            theValue = (itemAt parts 0)
            this.applyCss( (this.vrefOrString(propName)) theValue ctx wr)
        })
    }

    fn walkQueryBody (node:CodeNode ctx:RangerAppWriterContext wr:CodeWriter) {
        node.children.forEach({
            if( (array_length item.children ) == 0) {
                return
            }
            def propName (item.getFirst())
            def name ""
            if( (array_length item.children ) == 1) {
                print "  ---> fetching property " + propName.vref
                return
            } 
            if( (array_length item.children ) == 2) {
                def propConnected (item.getSecond())
                print "fetching links without filtering " + propName.vref
                this.walkQueryBody( (propConnected) ctx wr)
                return
            } 
            if( (array_length item.children ) == 3) {
                def filters (item.getSecond())
                def propConnected (item.getThird())
                print "fetching links with filtering " + propName.vref
                filters.children.forEach({
                    print " ^^ filter: " + item.vref
                })
                this.walkQueryBody( (propConnected) ctx wr)
                return
            } 
        })
    }

    fn createPureCSSPage (root:CodeNode ctx:RangerAppWriterContext wr:CodeWriter) {


        def hasMenu (root.children.contains({
            return (item.isFirstVref("menu"))
        }))

        wr.out('<!doctype html>
<html lang="en">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">        
    <link rel="stylesheet" href="side-menu.css"></link>
    <link rel="stylesheet" href="https://unpkg.com/purecss@1.0.0/build/pure-min.css" integrity="sha384-nn4HPE8lTHyVtfCBi5yW9d20FjT8BJwUXyWZT9InLYax14RDjBj46LmSztkmNP9w" crossorigin="anonymous">' true)

        wr.createTag('head')
        wr.out('   
</head>
<body>
<div id="layout">' true)
        if hasMenu {
            wr.out(`
    <!-- Menu toggle -->
    <a href="#menu" id="menuLink" class="menu-link">
        <!-- Hamburger icon -->
        <span></span>
    </a>
    <div id="menu">
        <div class="pure-menu">
            ` true)
            wr.createTag('menu')
            wr.out('
                </div>
            </div>' true)    
        }
        wr.out('
    <div id="main">
        <div class="content">
' true)
        wr.createTag('content')
        wr.out('
        </div>
    </div>
    <script src="/ui.js"></script>
</body>
</html>' false)

    }

    fn WalkHTML (node:CodeNode ctx:RangerAppWriterContext wr:CodeWriter) {

        if(node.is_block_node) {
            node.children.forEach({
                this.WalkHTML( item ctx wr)
            })
            return
        }

        if(node.value_type == RangerNodeType.String) {
            wr.raw(node.string_value false)
            return
        }
        if(node.value_type == RangerNodeType.Integer) {
            wr.out( ('' + node.int_value) false)
            return
        }
        if(node.value_type == RangerNodeType.Double) {
            wr.out( (node.getParsedString()) false)
            return
        }
        if(node.value_type == RangerNodeType.Boolean) {
            if node.boolean_value {
                wr.out( 'true' false)
            } {
                wr.out( 'false' false)
            }
            return
        }
        if(node.value_type == RangerNodeType.VRef) {
            wr.out((node.vref + " ") false)
            return
        }

        if(node.expression) {
            def fc (node.getFirst())
            def cmd (itemAt fc.ns 0 )
            def class_string ""
            def ns_list (clone fc.ns)
            def bb false
            ns_list = (ns_list.filter({
                if(index > 0 ) {
                    bb = true
                }
                return (index > 0)
            }))
            class_string = (join ns_list " ")
            switch cmd {
                case "#" {
                    cmd = "h1"
                }
                case "##" {
                    cmd = "h2"
                }
                case "###" {
                    cmd = "h3"
                }
                case "slide" {
                    cmd = "section"
                }
                case "quote" {
                    cmd = "blockquote"
                }
            }

            def simpleTags ([] "p" "b" "i" "u" "h1" "h2" "h3" "h4" "h5" "ul" "li" "ol" "section" "blockquote")
            def effects([] "fade-in" "fade-out" "zoom-in" "zoom-out" )
            if( (indexOf simpleTags cmd) >= 0 ) {
                wr.out('<' + cmd  , false)
                
                effects.forEach({
                    if( (indexOf fc.ns item)  >= 0 ) {
                        wr.out(' data-transition="' + item + '" ' , false)
                    }
                })
                if(node.hasStringProperty("class")) {
                    wr.out(' class="' + class_string , false)
                    wr.out( (node.getStringProperty('class')) false )
                    wr.out('" ' false)
                } {
                    wr.out(' class="' + class_string + '" ' , false)
                }                 
                if(node.hasStringProperty("id")) {
                    wr.out(' id="' false)
                    wr.out( (node.getStringProperty('id')) false )
                    wr.out('" ' false)
                } 
                wr.out( '>' , true)
                wr.indent(1)
                node.children.forEach({
                    if(index > 0 ) {
                        this.WalkHTML( item ctx wr)
                    }
                })
                wr.newline()
                wr.indent(-1)
                wr.out('</' + cmd + '>' , true)
                return
            }

            switch cmd {
                case "code" {
                    def linkRef (node.getSecond())
                    def tags ""
                    if(node.hasBooleanProperty("noescape")) {
                        tags = tags + 'data-noescape'
                    }

                    wr.out('<pre' false)
                    wr.out(' class="' + class_string + '" ' , false)
                    wr.out('><code ' + tags + '>' , false)
                    this.WalkHTML( linkRef ctx wr )
                    wr.out('</code></pre>' true)
                    
                }
                case "menutitle" {
                    def linkRef (node.getSecond())
                    wr.out('<a class="pure-menu-heading" href="#">' false)
                    this.WalkHTML( linkRef ctx wr )
                    wr.out('</a>' true)
                    
                }
                case "menuitem" {
                    def linkRef (node.getSecond())
                    wr.out('<li class="pure-menu-item"><a class="pure-menu-link" href="' false)
                    this.WalkHTML( linkRef ctx wr )
                    wr.out('">' false)
                    node.children.forEach({
                        if(index > 1 ) {
                            this.WalkHTML( item ctx wr)
                        }
                    })
                    wr.out('</a></li>' true)                    
                }
                case "submenu" {
                    def title (node.getSecond())
                    wr.out('<ul class="pure-menu-children">' false)
                    node.children.forEach({
                        if(index > 0 ) {
                            this.WalkHTML( item ctx wr)
                        }
                    })
                    wr.out('</ul>' true)                    
                }
                case "menulist" {
                    def title (node.getSecond())
                    wr.out('<ul class="pure-menu-list">' false)
                    node.children.forEach({
                        if(index > 0 ) {
                            this.WalkHTML( item ctx wr)
                        }
                    })
                    wr.out('</ul>' true)                    
                }
                case "menu" {
                    try {
                        def menuWr (wr.getTag('menu'))
                        def menuBody (node.getSecond())
                        this.WalkHTML( menuBody ctx menuWr )
                    } {

                    }
                }
                case "a" {
                    ; <a href="../html-link.htm#generator">
                    wr.out('<a href="'  , false)
                    def link (node.getSecond())
                    this.WalkHTML(link ctx wr)
                    wr.out('" >' false)
                    node.children.forEach({
                        if(index > 1 ) {
                            this.WalkHTML( item ctx wr)
                        }
                    })
                    wr.out('</a>' false)
                }
                case "pre"{
                    def title (node.getSecond())
                    wr.out('<pre class="code">' false)
                    node.children.forEach({
                        if(index > 0 ) {
                            this.WalkHTML( item ctx wr)
                        }
                    })
                    wr.out('</pre>' true)
                }
                case "button"{
                    def title (node.getSecond())
                    wr.out('<button class="pure-button">' false)
                    this.WalkHTML( title ctx wr )
                    wr.out('</button>' true)
                }
                case "thead" {
                    wr.out('<thead>' false)
                    wr.out('<tr>' true)
                    wr.indent(1)
                    node.children.forEach({
                        if(index > 0 ) {
                            wr.out('<th>' false)
                            this.WalkHTML( item ctx wr)
                            wr.out('</th>' false)
                        }
                    })
                    wr.newline()
                    wr.indent(-1)
                    wr.out('</tr>' true)
                    wr.out('</thead>' false)
                }
                case "tr" {

                    def pIndex 1
                    try {
                        if(!null? node.parent) {
                            pIndex = (indexOf node.parent.children node)
                        }
                    } {

                    }
                    if( (pIndex % 2) == 0) {
                        wr.out('<tr class="pure-table-odd">' true)
                    } {
                        wr.out('<tr>' true)
                    }
                    wr.indent(1)
                    node.children.forEach({
                        if(index > 0 ) {
                            wr.out('<td>' false)
                            this.WalkHTML( item ctx wr)
                            wr.out('</td>' false)
                        }
                    })
                    wr.newline()
                    wr.indent(-1)
                    wr.out('</tr>' true)                    
                }
                case "table" {
                    wr.out('<table class="pure-table ' + class_string + '">' , false)                    
                    wr.indent(1)
                    def body (node.getSecond())
                    body.children.forEach({
                        this.WalkHTML(item ctx wr)
                    })                                        
                    wr.indent(-1)
                    wr.out('</table>' true)

                }
                default {
                    node.children.forEach({
                        this.WalkHTML( item ctx wr)
                    })
                }
            }
        }
    }

    fn initRevealPresentation(root:CodeNode ctx:RangerAppWriterContext wr:CodeWriter) {
        def titleNode (root.getSecond())
        wr.out(`<!doctype html>
<html>
	<head>
		<meta charset="utf-8">
		<meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
		<title>` + titleNode.string_value + `</title>
		<link rel="stylesheet" href="css/reveal.css">
		<link rel="stylesheet" href="css/theme/black.css">
		<!-- Theme used for syntax highlighting of code -->
		<link rel="stylesheet" href="lib/css/zenburn.css">
		<!-- Printing and PDF exports -->
		<script>
			var link = document.createElement( 'link' );
			link.rel = 'stylesheet';
			link.type = 'text/css';
			link.href = window.location.search.match( /print-pdf/gi ) ? 'css/print/pdf.css' : 'css/print/paper.css';
			document.getElementsByTagName( 'head' )[0].appendChild( link );
        </script>
    <style>
      mark { background-color:#ff3322;}
      .hljs { background: none; }
    </style>        
    </head>
    <body>
        <div class="reveal">
            <div class="slides">
` , true)        
        wr.createTag("slides")
        wr.out(`
 			</div>
		</div>
		<script src="lib/js/head.min.js"></script>
		<script src="js/reveal.js"></script>
		<script>
			// More info about config & dependencies:
			// - https://github.com/hakimel/reveal.js#configuration
			// - https://github.com/hakimel/reveal.js#dependencies
			Reveal.initialize({
                history:true,
				dependencies: [
					{ src: 'plugin/markdown/marked.js' },
					{ src: 'plugin/markdown/markdown.js' },
					{ src: 'plugin/notes/notes.js', async: true },
					{ src: 'plugin/highlight/highlight.js', async: true, callback: function() { hljs.initHighlightingOnLoad(); } }
				]
			});
		</script>
	</body>
</html>` false)
    }


    fn writeTypeDef (item:CodeNode ctx:RangerAppWriterContext wr:CodeWriter) {
        if(item.hasFlag("optional")) {
            wr.out('<optional>' false)
        }
        switch item.value_type {
            case RangerNodeType.Array {
                wr.out("[" + item.array_type +  "]" , false)
            }
            case RangerNodeType.Hash {
                wr.out("[" + item.key_type + ':' + item.array_type +  "]" , false)
            }
            case RangerNodeType.ExpressionType {
                wr.out('(fn:' false)
                try {
                    def rv:CodeNode (itemAt item.expression_value.children 0)
                    def args:CodeNode (itemAt item.expression_value.children 1)
                    this.writeTypeDef( rv ctx wr)
                    wr.out( ' (' false)
                    args.children.forEach({
                        if( index > 0 ) {
                            wr.out(', ' false)
                        }
                        wr.out( item.vref false)
                        wr.out(': ' false)
                        this.writeTypeDef( item ctx wr)
                    })
                    wr.out(')' false)
                } {

                }
                wr.out(')' false)  
            }
            default {
                if( (strlen item.type_name ) > 0 ) {
                    wr.out( ("" + item.type_name) false )
                }                                    
            }
        }
    }

    fn writeArgDefs (node:CodeNode ctx:RangerAppWriterContext wr:CodeWriter) {
        node.children.forEach({
            wr.out('tr ' false)
            wr.out( "`" + item.vref +  "`" , false)
            wr.out("`" false)
            this.writeTypeDef(item ctx wr)
            wr.out("`" true)
        })        
    }

    fn create_op_slides (root:CodeNode ctx:RangerAppWriterContext orig_wr:CodeWriter) {

        def wr (new CodeWriter)

wr.raw(`
plugin.slides @noinfix(true) {
    presentation "Operators " "operators_slides.html" {
` true)
        def allOps (ctx.getAllOperators())
        def statements (allOps.filter({
            def is_map_array false
            if(item.firstArg) {
                is_map_array = ( (item.firstArg.value_type == RangerNodeType.Array) ||
                                    (item.firstArg.value_type == RangerNodeType.Hash) )                                       
            }
            if( (indexOf item.name "if_") == 0 ) {
                return false
            }
            return ( (item.nameNode.type_name == "void") && (false == is_map_array) )
        }))

        statements = (statements.groupBy({
            return item.name
        }))       
        statements.forEach({

            def args:CodeNode (item.node.getThird())                        
            wr.out(`slide {` true)
            wr.indent(1)
            wr.out('h1 ' + item.name , true)

            if(item.node.hasStringProperty('doc')) {
                wr.out('p `' false)
                wr.out((item.node.getStringProperty('doc')) false)
                wr.out('`' true)                
            }

            wr.out('table {
                thead "Argument" "type"               
                ' true)
            wr.indent(1)
            this.writeArgDefs(args ctx wr)
            wr.indent(-1)
            wr.out('}' true)

            try {
                wr.out('p ' false)
                def temps (itemAt item.node.children 3)
                temps.children.forEach({
                    if(item.isFirstVref('templates')) {
                        def templateList (item.getSecond())
                        templateList.children.forEach({
                            def fc (item.getFirst())
                            def code (item.getSecond())
                            ; es 6       
                            wr.out('(b ' + fc.vref +  ') ' , false)                      
                        })
                    }
                })
                wr.newline()
            } {

            }
            wr.indent(-1)
            wr.out('}' true)

        })

        
        wr.out(`
    }
}        
        ` false) 

        ctx.pushCode((wr.getCode()) orig_wr)
    }

    fn postprocess (root:CodeNode ctx:RangerAppWriterContext wr:CodeWriter) {
        print "simplePlugin was called for postprosessing"
        ctx.definedClasses.forEach({
            print " --> " + index
        })
        try {
            print "--> starting"
            this.create_op_slides( root ctx wr )
            print " ****************** CSS plugin  running ***************************"
            def nodes (ctx.getPluginNodes("css"))
            def cssFile "style.css"
            if(ctx.hasCompilerSetting('css')) {
                cssFile = (ctx.getCompilerSetting("css"))
            }
            def cssWr (wr.getFileWriter('' cssFile) )
            nodes.forEach({
                def block (item.getSecond())
                block.children.forEach({
;                    print (item.getCode())
                    def styleName (item.getFirst())
                    cssWr.out( ( (this.vrefOrString(styleName)) + ' { ' ) true)
                    cssWr.indent(1)
                    this.walkStyleProps( (item.getSecond()) ctx cssWr )
                    cssWr.indent(-1)
                    cssWr.out( '}' true)
                })
            })

            def nodes (ctx.getPluginNodes("html"))
            nodes.forEach({
                def block (item.getSecond())
                block.children.forEach({
                    if(item.isFirstVref("page")) {
                        def nameNode (item.getSecond())
                        def pageWriter (wr.getFileWriter("." (nameNode.string_value + ".html")))
                        def content (item.getThird())
                        this.createPureCSSPage( content ctx pageWriter )
                        def wr (pageWriter.getTag("content"))
                        content.children.forEach({
                            try {
                                this.WalkHTML(item ctx wr)
                            } {

                            }
                        })
                    }
                })
            })            

            def nodes (ctx.getPluginNodes("graphql"))
            nodes.forEach({
                def block (item.getSecond())
                block.children.forEach({
                    if(item.isFirstVref("query")) {
                        def nameNode (item.getSecond())
                        print "-------------------------------------------------------------"
                        print " GraphQL " + nameNode.string_value
                        def args (item.getThird())
                        print "Arguments : " + (args.getCode())
                        def qBody (itemAt item.children 3)
                        print "Query body " + (qBody.getCode())
                        this.walkQueryBody( qBody ctx wr)
                        print "-------------------------------------------------------------"
                    }
                })
            })            

            def nodes (ctx.getPluginNodes("slides"))
            nodes.forEach({
                def block (item.getSecond())
                block.children.forEach({
                    if(item.isFirstVref("presentation")) {
                        try {
                            def nameNode (item.getSecond())
                            if( (strlen nameNode.string_value ) == 0 ) {
                                ctx.addError(item "Please give name to the presentation")
                                return
                            }
                            def fileNode (item.getThird())
                            if( (strlen fileNode.string_value ) == 0 ) {
                                ctx.addError(item "Please output file give name to the presentation")
                                return
                            }
                            def presis (itemAt item.children 3)
                            def pageWriter (wr.getFileWriter("." (fileNode.string_value )))                        
                            this.initRevealPresentation( item ctx pageWriter )
                            def slideWr (pageWriter.getTag("slides"))
                            this.WalkHTML( presis ctx slideWr )

                            ; --- create also a static page ---
                            def nameNode (item.getSecond())
                            def pageWriter (wr.getFileWriter("." ("static_" + fileNode.string_value)))
                            this.createPureCSSPage( item ctx pageWriter )
                            def wr (pageWriter.getTag("content"))
                            this.WalkHTML(presis ctx wr)

                        } {
                            ctx.addError( item "Invalid presentation")
                        }
                    }
                })
            })            

        } {
            print (error_msg)
        }
    }
}