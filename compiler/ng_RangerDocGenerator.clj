
class RangerDocGenerator {

    ; writing argument definitions for the documentation...

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

        ; TODO: write type definition uniformly
        ; TODO: call perhaps a language writer to create the signature just like in specific languages
        ;       the signature should be defined / the types of the languages.
        node.children.forEach({
            if( index > 0 ) {
                wr.out(' ' false)
            }
            wr.out( "`" + item.vref +  "`" , false)
            wr.out(":" false)
            this.writeTypeDef(item ctx wr)
            wr.out(' ' false)
        })        
    }

    fn createClassDoc ( node:CodeNode ctx:RangerAppWriterContext orig_wr:CodeWriter ) {

        if(ctx.hasCompilerSetting("classdoc")) {

            def b_only_documented (false == (ctx.hasCompilerFlag('allowempty')))

            def wr:CodeWriter (orig_wr.getFileWriter("." (ctx.getCompilerSetting("classdoc"))))

            if( b_only_documented == false  ) {
                wr.out('# Classes' true)
            }

            def root (ctx.getRoot())
            root.definedClasses.forEach({
                if( false == (item.isNormalClass())) {
                    return
                }
                if( b_only_documented == false  ) {
                    wr.out( ('## ' + index ) true)
                }
                def theClass item
                item.method_variants.forEach({
                    item.variants.forEach({
                        if b_only_documented {
                            if( (strlen item.git_doc) == 0 ) {
                                return
                            }
                        }
                        wr.out('#### ' false)
                        if(item.nameNode) {
                            if(item.nameNode.type_name != "void") {
                                wr.out('`' false)
                                this.writeTypeDef( (unwrap item.nameNode) ctx wr)
                                wr.out('` ' false)
                            }
                        }
                        wr.out( theClass.name + ":: " + item.name , false)
                        wr.out("(" false)
                        for item.params arg:RangerAppParamDesc i {
                            if( i > 0 ) {
                                wr.out(' ' false)
                            }
                            wr.out("`" + arg.compiledName + "`" , false)
                            wr.out(":" false)
                            this.writeTypeDef( (unwrap arg.nameNode) ctx wr)
                        }
                        wr.out(')' false)
                        wr.out("" true)
                        wr.out(item.git_doc false)
                        wr.out("" true)
                    })
                })
            })   
        
        }
    }

    fn writeOpDesc (item:CodeNode ctx:RangerAppWriterContext wr:CodeWriter) {
        def fc:CodeNode (item.getFirst())
        def nameNode:CodeNode (item.getSecond())
        def args:CodeNode (item.getThird())                        
        ;  wr.out('' false)
        wr.out('| ' false)
        def name (fc.vref)
        if( fc.vref == '||' ) {
            name = '&#124;&#124;'
        }
        if( fc.vref == '|' ) {
            name = '&#124;'
        }
        wr.out( name , false)
        wr.out(' | ' false)
        if(nameNode.type_name != "void") {
            wr.out('`' false)
            this.writeTypeDef( nameNode ctx wr)
            wr.out('` ' false)
        }
        wr.out('| ' false)
        wr.out('  (' false)
        this.writeArgDefs( args ctx wr)
        wr.out(' )' false)
        wr.out('| ' false)
        if( item.hasStringProperty("doc") ) {
            wr.out( (item.getStringProperty("doc")) false )
        }
        wr.out('| ' false)
        wr.out('' true)        
    }

    fn writeTypeDoc ( list:[RangerAppOperatorDesc] tester:(_:boolean (item:RangerAppOperatorDesc)) ctx:RangerAppWriterContext wr:CodeWriter ) {
        def www (wr.fork())
        wr.out('' true)
        wr.out('' true)
        wr.out('| operator | returns | arguments | description |' true)
        wr.out('| -------- | ------- | --------- | ------------| ' true)
        def cnt 0
        list.forEach({
                if( tester( item ) ) {
                    if(cnt > 0 ) {
                        www.out(', ' false)
                    }
                    www.out( ('  `' + item.name + '` ') false )
                    this.writeOpDesc( (unwrap item.node) ctx wr)
                    cnt = cnt + 1
                }
            }) 
    }

    ; operatordoc
    fn createOperatorDoc ( node:CodeNode ctx:RangerAppWriterContext orig_wr:CodeWriter ) {

        if(ctx.hasCompilerSetting("operatordoc")) {
            def wr:CodeWriter (orig_wr.getFileWriter("." (ctx.getCompilerSetting("operatordoc"))))

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

            def lang_statements (allOps.filter({
                if( (indexOf item.name "if_") == 0 ) {
                    return true
                }
                return false
            }))

            statements = (statements.groupBy({
                return item.name
            }))

            def operator_list (allOps.filter({
                def is_map_array false
                if(item.firstArg) {
                    is_map_array = ( (item.firstArg.value_type == RangerNodeType.Array) ||
                                      (item.firstArg.value_type == RangerNodeType.Hash) )                                       
                }
                return ( is_map_array || (item.nameNode.type_name != "void") )
            }))
            def nList (operator_list.groupBy({
                def key item.name
                def fc (item.firstArg)
                if( fc ) {
                    key = key + (":" + fc.type_name + ":" + fc.key_type + ":" + fc.array_type)
                }
                return key
            }))
            wr.out('## Statements' true)
            this.writeTypeDoc( statements {
                return true
            } ctx wr)
            wr.out( '' true)

            ; lang_statements

            wr.out('## Language switches' true)
            this.writeTypeDoc( lang_statements {
                return true
            } ctx wr)
            wr.out( '' true)

            wr.out('## Operators without arguments' true)
            this.writeTypeDoc( nList {
                return ( null? item.firstArg ) 
                } ctx wr)
            wr.out( '' true)
            wr.out('## Generic operators' true)
            this.writeTypeDoc( nList {
                if( item.firstArg ) {
                    return (item.firstArg.type_name == "T")
                }
                return false
            } ctx wr)
            wr.out( '' true)

            wr.out('## Numeric operators' true)
            this.writeTypeDoc( nList {
                if( item.firstArg ) {
                    return ( (item.firstArg.type_name == "int" || item.firstArg.type_name == "double"  )
                             && (item.nameNode.type_name == "int" || item.nameNode.type_name == "double" ) )
                }
                return false
            } ctx wr)
            wr.out( '' true)

            wr.out('## Miscellaneous operators' true)
            this.writeTypeDoc( nList {
                if( item.firstArg ) {
                    return ( (item.firstArg.type_name == "int" || item.firstArg.type_name == "double"  )
                             && (item.nameNode.type_name != "int" && item.nameNode.type_name != "double" && item.nameNode.type_name != "boolean" ) )
                }
                return false
            } ctx wr)
            wr.out( '' true)

            wr.out('## String operators' true)
            this.writeTypeDoc( nList {
                if( item.firstArg ) {
                    return (item.firstArg.type_name == "string")
                }
                return false
            } ctx wr)
            wr.out( '' true)
            wr.out( '' true)
            wr.out('## Array operators' true)
            this.writeTypeDoc( nList {
                if( item.firstArg ) {
                    return (item.firstArg.value_type == RangerNodeType.Array)
                }
                return false
            } ctx wr)
            wr.out( '' true)

            wr.out('## Map operators' true)

            this.writeTypeDoc( nList {
                if( item.firstArg ) {
                    return (item.firstArg.value_type == RangerNodeType.Hash)
                }
                return false
            } ctx wr)
            
            wr.out( '' true)

            wr.out('## Boolean / test operators' true)

            this.writeTypeDoc( nList {
                if( item.firstArg ) {
                    return (item.nameNode.type_name == "boolean")
                }
                return false
            } ctx wr)


        }
    }
}