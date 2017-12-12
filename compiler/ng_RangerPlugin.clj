
systemclass RangerCompilerPlugin {
    es6 Object    
}

operators {
    load_compiler_plugin _:RangerCompilerPlugin ( name:string ) {
        templates {
            es6 ( 'require( ' (e 1) ' )' )
            * ()
        }
    }

    register_plugin _@(throws):[string] (plugin:RangerCompilerPlugin ) {
        templates {
            es6 ( '(new ' (e 1) '.Plugin () ).features()' )
            * ()
        }
    }

    call_plugin _@(throws):Any (plugin:RangerCompilerPlugin fnName:string root:CodeNode ctx:RangerAppWriterContext wr:CodeWriter ) {
        templates {
            es6 ( '( (new ' (e 1) '.Plugin () )[' (e 2) '] )( ' (e 3) ', ' (e 4) ' , ' (e 5) ' )' )
            * ()
        }
    }


    plugin_preprocess _@(throws):void (plugin:RangerCompilerPlugin root:CodeNode ctx:RangerAppWriterContext wr:CodeWriter ) {
        templates {
            es6 ( '(new ' (e 1) '.Plugin () ).preprocess( ' (e 2) ', ' (e 3) ' , ' (e 4) ' )' )
            * ()
        }
    }
    plugin_postprocess _@(throws):void (plugin:RangerCompilerPlugin root:CodeNode ctx:RangerAppWriterContext wr:CodeWriter ) {
        templates {
            es6 ( '(new ' (e 1) '.Plugin () ).postprocess( ' (e 2) ', ' (e 3) ' , ' (e 4) ' )' )
            * ()
        }
    }
}