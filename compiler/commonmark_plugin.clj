
Import "ng_Compiler.clj"

flag npm (
  name "ranger-markdown"
  version "0.0.7"
  description "Markdown output plugin for Ranger Compiler"
  author "Tero Tolonen"
  license "MIT"
)

plugin.file 'README.md' "

# Markdown plugin for Ranger Compiler

Simple commonmark markdown syntax generator for Ranger.

## Usage

Install ranger compiler

`npm install -g ranger-compiler`

Install this package 

`npm install ranger-markdown`

Create a file with slides, for example `test.ranger`

```
plugin.md 'README.md' {
    ## Hello World
    table {
        tr 1 2 3 
        tr 4 5 6 
        tr 7 8 9 
    }
    code.javascript `
    function foo() {

    }
    `
}

```

And then run the compiler with command:

`ranger-compiler -plugins=ranger-markdown test.ranger`

The results will be saved in `bin/README.md`

"

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
                case "h1" {
                    cmd = "#"
                }
                case "h2" {
                    cmd = "##"
                }
                case "h3" {
                    cmd = "###"
                }
                case "slide" {
                    cmd = "section"
                }
                case "quote" {
                    cmd = "blockquote"
                }
            }

            def heads ([] "#" "##" "###" "####")
            if( (indexOf heads cmd) >= 0 ) {
                wr.out("" true)                    
                wr.out((cmd + ' ') false)
                node.children.forEach({
                    if(index > 0 ) {
                        this.WalkHTML( item ctx wr)
                    }
                })
                wr.newline()            
                wr.out("" true)                    
                  
                return  
            }

            def simpleTags ([] "p" "b" "i" "u" "h1" "h2" "h3" "h4" "h5" "ul" "li" "ol" "blockquote")
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
                case "section" {
                    node.children.forEach({
                        if(index > 0 ) {
                            this.WalkHTML( item ctx wr)
                        }
                    })                    
                }
                case "code" {
                    ; code.javascript

                    wr.out("" true)                    
                    def linkRef (node.getSecond())
                    def tags ""
                    if(node.hasBooleanProperty("noescape")) {
                        tags = tags + 'data-noescape'
                    }
                    def lang_name ""
                    if( (array_length fc.ns) > 1) {
                        lang_name = (itemAt fc.ns 1)
                    }
                    wr.out("```" false)
                    if( (strlen lang_name) > 0) {
                        wr.out(lang_name false)
                    }
                    wr.newline()
                    this.WalkHTML( linkRef ctx wr )
                    wr.newline()
                    wr.out("" true)                    
                    wr.out("```" true)
                    wr.out("" true)

                    
                }
                case "a" {
                    def linkAddr (node.getSecond())
                    def linkTxt (node.getThird())

                    ; <a href="../html-link.htm#generator">
                    wr.out('[' false)
                    this.WalkHTML( linkTxt ctx wr)
                    wr.out("](" false)
                    this.WalkHTML(linkAddr ctx wr)
                    if( node.hasStringProperty('title')) {
                        wr.out( (' ' + (node.getStringProperty('title')) ) false )
                    }
                    wr.out(')' false)
                }
                case "pre" {
                    wr.out("" true)                    
                    wr.out("```" true)
                    node.children.forEach({
                        if(index > 0 ) {
                            this.WalkHTML( item ctx wr)
                        }
                    })
                    wr.newline()
                    wr.out("```" true)
                    wr.out("" true)
                }
                case "thead" {
                    wr.out('<thead>' false)
                    wr.out('<tr>' false)
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
                    wr.out('</tr>' false)
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
                        wr.out('<tr >' false)
                    } {
                        wr.out('<tr>' false)
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
                    wr.out('</tr>' false)                    
                }
                case "table" {
                    wr.out('<table>' , false)                    
                    wr.indent(1)
                    def body (node.getSecond())
                    body.children.forEach({
                        this.WalkHTML(item ctx wr)
                    })                                        
                    wr.indent(-1)
                    wr.out('</table>' true)
                    wr.out("" true)

                }
                default {
                    node.children.forEach({
                        this.WalkHTML( item ctx wr)
                    })
                }
            }
        }
    }

    fn postprocess (root:CodeNode ctx:RangerAppWriterContext wr:CodeWriter) {
        try {
            def nodes (ctx.getPluginNodes("markdown"))
            nodes.forEach({
                def fileName (item.getSecond())
                def fileContents (item.getThird())
                def pageWriter (wr.getFileWriter("." (fileName.string_value )))
                this.WalkHTML( fileContents ctx pageWriter )
            })            
            def nodes (ctx.getPluginNodes("md"))
            nodes.forEach({
                def fileName (item.getSecond())
                def fileContents (item.getThird())
                def pageWriter (wr.getFileWriter("." (fileName.string_value )))
                this.WalkHTML( fileContents ctx pageWriter )
            })            
        } {
            print (error_msg)
        }
    }
}