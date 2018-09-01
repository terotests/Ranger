
Import "ng_Compiler.clj"

flag npm (
  name "ranger-material-ui"
  version "0.0.1"
  description "Material UI plugin for Ranger Compiler"
  author "Tero Tolonen"
  license "MIT"
)


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
        return ([]  "postprocess")
    }

    fn WalkHTML (node:CodeNode ctx:RangerAppWriterContext wr:CodeWriter) {

        if(node.value_type == RangerNodeType.XMLText) {
            wr.out(node.string_value false)
            return
        }

        if(node.value_type == RangerNodeType.XMLNode) {
            wr.out('<' + node.vref + ' '  , false)
            node.attrs.forEach({
                wr.out(item.vref + '="' , false)
                wr.out(item.string_value false)
                wr.out('" ' false )
            })
            wr.out('>' false)
            node.children.forEach({
                this.WalkHTML( item ctx wr )
            })

            wr.out('</' + node.vref + '>' , false)
            return
        }

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
            def comp_id ""
            if(fc.has_vref_annotation) {
                fc.vref_annotation.children.forEach({
                    comp_id = item.vref
                })
            }            
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
                case "footer" {
                    class_string = class_string + " page-footer"
                }
            }
            def simpleTags ([] "p" "b" "i" "u" "div" "h1" "h2" "h3" "h4" "h5" "ul" "li" "ol" "section" "blockquote" "form" "footer" )
            def effects([] "fade-in" "fade-out" "zoom-in" "zoom-out" )

            def generic_attributes (fn:void (wr:CodeWriter) {
                if(node.hasStringProperty("class")) {
                    wr.out(' class="' + class_string , false)
                    wr.out( (node.getStringProperty('class')) false )
                    wr.out('" ' false)
                } {
                    wr.out(' class="' + class_string + '" ' , false)
                }                 
                if(node.hasStringProperty("id")) {
                    comp_id = (node.getStringProperty('id'))
                } 
                if( (strlen comp_id) > 0) {
                    wr.out(' id="' false)
                    wr.out( comp_id false )
                    wr.out('" ' false)                    
                }
            })

            def tag_start (fn:void( tag:string classStr:string wr:CodeWriter) {
                wr.out("<" + tag + " " , false)
                if(node.hasStringProperty("class")) {
                    wr.out(' class="' + classStr + ' ' + class_string , false)
                    wr.out( (node.getStringProperty('class')) false )
                    wr.out('" ' false)
                } {
                    wr.out(' class="' + classStr + ' ' + class_string + '" ' , false)
                }                 
                if(node.hasStringProperty("id")) {
                    wr.out(' id="' false)
                    wr.out( (node.getStringProperty('id')) false )
                    wr.out('" ' false)                    
                } 
                if( (strlen comp_id) > 0) {
                    wr.out(' data-comp-id="' false)
                    wr.out( comp_id false )
                    wr.out('" ' false)                    
                }
                wr.out('>' false )
            })
            def tag_end (fn:void ( tag:string wr:CodeWriter) {
                wr.out('</' + tag + '>' , false)
            })

            if( (indexOf simpleTags cmd) >= 0 ) {

                tag_start(cmd "" wr)
                wr.indent(1)
                node.children.forEach({
                    if(index > 0 ) {
                        this.WalkHTML( item ctx wr)
                    }
                })
                wr.newline()
                wr.indent(-1)
                tag_end(cmd wr)
                return
            }

            switch cmd {

                case "img" {
                    try {
                        def imgSrc (node.getSecond())
                        class_string = class_string + " responsive-img"
                        wr.out('<img src="' + imgSrc.string_value + '" ', false)
                        generic_attributes(wr)
                        wr.out( '>' , true)
                    } {

                    }
                }

                case "input" {
                    try {
                        def inputID (node.getSecond())
                        
                        tag_start("div" 'input-field' wr)
                        wr.out('<input id="' + inputID.vref +'" type="text" />' , true)                    
                        wr.out('<label for="' + inputID.vref +'">' , false)                    
                        node.children.forEach({
                            if(index > 1 ) {
                                this.WalkHTML( item ctx wr)
                            }
                        })
                        wr.out('</label>' true)
                        tag_end('div' wr)                    

                    } {

                    }
                }

                case "card-content" {
                    tag_start('div' 'card-content' wr)
                    node.children.forEach({
                        if(index > 0 ) {
                            this.WalkHTML( item ctx wr)
                        }
                    })
                    wr.out('</div>' true)
                }
                case "card" {
                    tag_start('div' 'card' wr)
                    ctx.setSetting("container", "card")
                    node.children.forEach({
                        if(index > 0 ) {
                            this.WalkHTML( item ctx wr)
                        }
                    })
                    wr.out('</div>' true)
                }  
                case "chip" {

                    class_string = class_string + " chip "
                    wr.out('<div ' false)
                    generic_attributes(wr)
                    ctx.setSetting("container", "card")
                    node.children.forEach({
                        if(index > 1 ) {
                            this.WalkHTML( item ctx wr)
                        }
                    })
                    wr.out('</div>' true)
                }  
                case "code" {
                    def linkRef (node.getSecond())
                    def tags ""
                    if(node.hasBooleanProperty("noescape")) {
                        tags = tags + 'data-noescape'
                    }
                    wr.out('<pre ' false)
                    generic_attributes(wr)
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
                case "navbar" {
                    try {
                        wr.out('<nav><div class="nav-wrapper">' true)
                        node.children.forEach({
                            if(index > 0 ) {
                                this.WalkHTML( item ctx wr)
                            }
                        })
                        wr.out('</div></nav>' true)
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
                case "icon" {
                    wr.out('<i class="material-icons ' + class_string + '">' , false)
                    node.children.forEach({
                        if(index > 0 ) {
                            this.WalkHTML( item ctx wr)
                        }
                    })                    
                    wr.out('</i>' false)
                }
                case "button"{
                    def title (node.getSecond())
                    def spec ""

                    fc.ns.forEach({
                        if( index > 0 ) {
                            spec = spec + "btn-" + item + " "
                        }
                    })
                    wr.out('<a class="waves-effect waves-light btn ' + spec + class_string + '">' , false)
                    this.WalkHTML( title ctx wr )
                    wr.out('</a>' true)
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

    fn initUIPreview(root:CodeNode ctx:RangerAppWriterContext wr:CodeWriter) {
        def titleNode (root.getSecond())
        wr.out(`<!doctype html>
<html>
	<head>
		<meta charset="utf-8">
		<meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
            <!-- Compiled and minified CSS -->
            <link href="https://fonts.googleapis.com/icon?family=Material+Icons" rel="stylesheet">
            <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/materialize/0.100.2/css/materialize.min.css">
            ` , true)        

        wr.createTag("head")
        wr.out(`
        <style>
        * {
        -webkit-transition: all 0.2s ease;
        -moz-transition:    all 0.2s ease;
        -ms-transition:     all 0.2s ease;
        -o-transition:      all 0.2s ease;
        }
        </style>
    </head>
    <body>
` , true)        
        wr.createTag("body")
        wr.out(`
        <script type="text/javascript" src="https://code.jquery.com/jquery-3.2.1.min.js"></script>
        <!-- Compiled and minified JavaScript -->
        <script src="https://cdnjs.cloudflare.com/ajax/libs/materialize/0.100.2/js/materialize.min.js"></script>
` , true)        
        wr.createTag("body-ends")
        wr.out(`
        
	</body>
</html>` false)
    }


    fn postprocess (root:CodeNode ctx:RangerAppWriterContext wr:CodeWriter) {
        try {
            print "** Material UI plugin called **"
            def nodes (ctx.getPluginNodes("ui"))
            nodes.forEach({
                def block (item.getSecond())
                block.children.forEach({
                    if(item.isFirstVref("page")) {
                        try {
                            def nameNode (item.getSecond())
                            if( (strlen nameNode.string_value ) == 0 ) {
                                ctx.addError(item "Please give name to the page")
                                return
                            }
                            def fileNode (item.getThird())
                            if( (strlen fileNode.string_value ) == 0 ) {
                                ctx.addError(item "Please output file give name to the page")
                                return
                            }
                            def presis (itemAt item.children 3)
                            def pageWriter (wr.getFileWriter("." (fileNode.string_value +".html")))                        
                            this.initUIPreview( item ctx pageWriter )
                            def slideWr (pageWriter.getTag("body"))
                            this.WalkHTML( presis ctx slideWr )
                            def headWr (pageWriter.getTag('body-ends'))
                            headWr.out(`<script src="`+ (ctx.getCompilerSetting('o')) + `"></script>` , false)

                        } {
                            ctx.addError( item "Invalid page")
                        }
                    }
                })
            })            
        } {
            print (error_msg)
        }
    }
}