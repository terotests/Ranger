(
    (Import "RangerCommonWriter.clj")
    ; TODO: think about creating a common writer class which has the methods
    ; implemented at the top level: most of the methods are very similar in different languages
    ; and there is almost no need at all to re-implement them, for example +, * etc. are similar in
    ; most commonly used languages

    ( CreateClass RangerES5Writer 
        (
            (Extends (RangerCommonWriter))

            ; just a test function to test inheritance
            (PublicMethod getWriterLang:string ()
                (
                    (return "JavaScript")
                )
            )       

            (PublicMethod cmdArgv:void (node:CodeNode ctx:RangerAppWriterContext wr:CodeWriter)
                (

                    (def argIndex:CodeNode (call node getSecond ()))
                
                    (call wr out ( "process.argv[ 2 + process.execArgv.length + " false))
                    (call ctx setInExpr ())
                    (call this WalkNode (argIndex ctx wr))
                    (call ctx unsetInExpr ())
                    (call wr out ( "]" false))                    
                )
            )              


            (PublicMethod cmdArgvCnt:void (node:CodeNode ctx:RangerAppWriterContext wr:CodeWriter)
                (
                    (call wr out ( "( process.argv.length - ( 2 + process.execArgv.length ) )" false))
                )
            ) 

            (PublicMethod cmdFileRead:void (node:CodeNode ctx:RangerAppWriterContext wr:CodeWriter)
                (

                    (def pathName:CodeNode (call node getSecond ()))
                    (def fileName:CodeNode (call node getThird ()))
                    ; 
                    (call wr out ( (+ "require(" (strfromcode 34) "fs" (strfromcode 34) ").readFileSync( process.cwd() + " ) false))
                    (call wr out ( (+ (strfromcode 34) "/" (strfromcode 34) " + " )  false))

                    (call ctx setInExpr ())
                    (call this WalkNode (pathName ctx wr))

                    (call wr out ( (+ " + " (strfromcode 34) "/" (strfromcode 34) " + " )  false))
                    (call this WalkNode (fileName ctx wr))
                    (call ctx unsetInExpr ())
                    (call wr out ( (+ ", " (strfromcode 34) "utf8" (strfromcode 34) ")" )  false))                   
                )
            )  

            (PublicMethod cmdFileWrite:void (node:CodeNode ctx:RangerAppWriterContext wr:CodeWriter)
                (

                    (def pathName:CodeNode (call node getSecond ()))
                    (def fileName:CodeNode (call node getThird ()))
                    (def dataToWrite:CodeNode (itemAt node.children (3)))

                    (call wr newline ()) 
                    
                    (call wr out ( (+ "require(" (strfromcode 34) "fs" (strfromcode 34) ").writeFileSync( process.cwd() + " ) false))
                    (call wr out ( (+ (strfromcode 34) "/" (strfromcode 34) " + " )  false))

                    (call ctx setInExpr ())
                    (call this WalkNode (pathName ctx wr))

                    (call wr out ( (+ " + " (strfromcode 34) "/" (strfromcode 34) " + " )  false))
                    (call this WalkNode (fileName ctx wr))
                    
                    (call wr out ( ", "  false))       

                    (call this WalkNode (dataToWrite ctx wr))   

                    (call wr out ( ");"  true))                                              

                    (call ctx unsetInExpr ())            
                )
            )  

            (PublicMethod cmdIsFile:void (node:CodeNode ctx:RangerAppWriterContext wr:CodeWriter)
                (
                    (def pathName:CodeNode (call node getSecond ()))
                    (def fileName:CodeNode (call node getThird ()))
                    ; 
                    (call wr out ( (+ "require(" (strfromcode 34) "fs" (strfromcode 34) ").existsSync( process.cwd() + " ) false))
                    (call wr out ( (+ (strfromcode 34) "/" (strfromcode 34) " + " )  false))

                    (call ctx setInExpr ())
                    (call this WalkNode (pathName ctx wr))
                    (call wr out ( (+ " + " (strfromcode 34) "/" (strfromcode 34) " + " )  false))
                    (call this WalkNode (fileName ctx wr))
                    (call ctx unsetInExpr ())
                    (call wr out ( ")"  false))  
                )
            )
            (PublicMethod cmdIsDir:void (node:CodeNode ctx:RangerAppWriterContext wr:CodeWriter)
                (
                    (def pathName:CodeNode (call node getSecond ()))
                    ; 
                    (call wr out ( (+ "require(" (strfromcode 34) "fs" (strfromcode 34) ").existsSync( process.cwd() + " ) false))
                    (call wr out ( (+ (strfromcode 34) "/" (strfromcode 34) " + " )  false))
                    (call ctx setInExpr ())
                    (call this WalkNode (pathName ctx wr))
                    (call ctx unsetInExpr ())
                    (call wr out ( ")"  false))  
                )
            )

            
            (PublicMethod cmdCreateDir:void (node:CodeNode ctx:RangerAppWriterContext wr:CodeWriter)
                (
                    ; mkdirSync


                    (def pathName:CodeNode (call node getSecond ()))
                    (call wr newline ()) 
                    
                    (call wr out ( (+ "require(" (strfromcode 34) "fs" (strfromcode 34) ").mkdirSync( process.cwd() + " ) false))
                    (call wr out ( (+ (strfromcode 34) "/" (strfromcode 34) " + " )  false))

                    (call ctx setInExpr ())
                    (call this WalkNode (pathName ctx wr))

                    (call wr out ( ");"  true))                                              

                    (call ctx unsetInExpr ())                     
                )
            )                

            (PublicMethod PublicMethod:void (node:CodeNode ctx:RangerAppWriterContext wr:CodeWriter)
                (

;  _createClass(bar, [{
;    key: "myFunc",
;    value: function myFunc(x, y) {
;      return x + y;
;    }
;  }]);

                    (def currClass:RangerAppClassDesc (call ctx getCurrentClass ()))                    
                    (def nameDef:CodeNode (call node getSecond ()))

                    (if (== false (call wr hasTag ((+ "js_class_writer" currClass.name))))
                        (
                            (call wr createTag ((+ "js_class_writer" currClass.name)))
                        )
                        (
                            (call wr out ("," true))
                        )
                    )

                    (call wr newline ())
                    (call wr out ((+ "{ key: \"" nameDef.vref "\", value: function " nameDef.vref "(") false ))

                    ; parameters
                    (def args:CodeNode (call node getThird ()))

                    (for args.children arg:CodeNode i
                        (
                            (if (> i 0)
                                (call wr out (", " false))
                            )
                            (call wr out (arg.vref false))
                        )
                    )
                    
                    (call wr out ( ") { " true ) )

                    (call ctx setInMethod ())
                    (call wr indent (1))
                    (def fnBody:CodeNode (itemAt node.children 3))

                    (def has_try_catch:boolean false)
                    (def try_catch:CodeNode)
                    ; see if there is error processing 
                    (if (call fnBody hasExpressionProperty ("onError"))
                        (
                            (= try_catch (call fnBody getExpressionProperty ("onError")))   
                            (call wr out("try {" true))
                            (call wr indent (1))    
                        )
                    )   

                    (call this WalkNodeChildren (fnBody ctx wr))
                    (call wr newline ())
                    (call wr indent (-1))
                    (if (call fnBody hasExpressionProperty ("onError"))
                        (
                            ; (call wr indent (-1))
                            (call wr out("} catch(e) {" true))
                            (call wr indent (1))
                            (call wr out ("console.log(e);" true))    
                            (call this WalkNodeChildren (try_catch ctx wr))
                            (call wr indent (-1))
                            (call wr out("}" true))
                            (call wr indent (-1))
                        )
                    )

                    (call wr newline ())
                    (call wr out ("}}" true ))
                       
                    ; (call wr out ( (+ "}") true ) )
                    (call ctx unsetInMethod ())
                    
                )
            )


            (PublicMethod StaticMethod:void (node:CodeNode ctx:RangerAppWriterContext orig_wr:CodeWriter)
                (



                    (def currClass:RangerAppClassDesc (call ctx getCurrentClass ()))                    
                    (def nameDef:CodeNode (call node getSecond ()))

                    (def wr:CodeWriter (call ctx getStaticWriter (currClass.name)))

                    (if (== false (call wr hasTag ((+ "js_class_static_writer" currClass.name))))
                        (
                            (call wr createTag ((+ "js_class_static_writer" currClass.name)))
                        )
                        (
                            (call wr out ("," true))
                        )
                    )

                    (call wr newline ())
                    (call wr out ((+ "{ key: \"" nameDef.vref "\", value: function " nameDef.vref "(") false ))

                    ; parameters
                    (def args:CodeNode (call node getThird ()))

                    (for args.children arg:CodeNode i
                        (
                            (if (> i 0)
                                (call wr out (", " false))
                            )
                            (call wr out (arg.vref false))
                        )
                    )
                    
                    (call wr out ( ") { " true ) )

                    (call ctx setInMethod ())
                    (call wr indent (1))
                    (def fnBody:CodeNode (itemAt node.children 3))

                    (def has_try_catch:boolean false)
                    (def try_catch:CodeNode)
                    ; see if there is error processing 
                    (if (call fnBody hasExpressionProperty ("onError"))
                        (
                            (= try_catch (call fnBody getExpressionProperty ("onError")))   
                            (call wr out("try {" true))
                            (call wr indent (1))    
                        )
                    )   

                    (call this WalkNodeChildren (fnBody ctx wr))
                    (call wr newline ())
                    (call wr indent (-1))
                    (if (call fnBody hasExpressionProperty ("onError"))
                        (
                            ; (call wr indent (-1))
                            (call wr out("} catch(e) {" true))
                            (call wr indent (1))
                            (call wr out ("console.log(e);" true))    
                            (call this WalkNodeChildren (try_catch ctx wr))
                            (call wr indent (-1))
                            (call wr out("}" true))
                            (call wr indent (-1))
                        )
                    )

                    (call wr newline ())
                    (call wr out ("}}" true ))
                       
                    ; (call wr out ( (+ "}") true ) )
                    (call ctx unsetInMethod ())
                    
                )
            )
            

            (PublicMethod CreateClass:void (node:CodeNode ctx:RangerAppWriterContext wr:CodeWriter)
                (
                    (def nameDef:CodeNode (call node getSecond ()))
                    (def classInfo:RangerAppClassDesc (call ctx findClass (nameDef.vref)))

                    (if (== false (call wr hasTag ("polyfill")))
                        (
                            ; insert ES5 polyfills which are the same as in babel
                            (call wr createTag ("polyfill"))
                            (call wr out ("
\"use strict\";

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if (\"value\" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError(\"this hasn't been initialised - super() hasn't been called\"); } return call && (typeof call === \"object\" || typeof call === \"function\") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== \"function\" && superClass !== null) { throw new TypeError(\"Super expression must either be null or a function, not \" + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError(\"Cannot call a class as a function\"); } }

                            " true))
                        )
                    )


                    (call wr newline ())
                    (call wr out ( (+ "var " nameDef.vref " = function( " ) false ) )

                    (def staticWriter:CodeWriter (new CodeWriter ()))
                    (call ctx setStaticWriter (nameDef.vref staticWriter))
                    ; classStaticWriters

                    (def b_extended:boolean false)

                    (if (> (array_length classInfo.extends_classes) 0)
                        (
                            (= b_extended true)        
                            (for classInfo.extends_classes pName:string i
                                (
                                    (if (> i 0)
                                        (call wr out ("," false))
                                    )
                                    (call wr out ((+ "_" pName) false))
                                )
                            )
                        )
                    )

                    (call wr out ( (+ ") { " " " ) false ) )

                    (call wr indent (1))
        
                    (if b_extended
                        (
                            (for classInfo.extends_classes pName:string i
                                (
                                    (call wr out ((+ "_inherits(" nameDef.vref ", _" pName ");") true))
                                )
                            )                            
                        )
                    )

                    ; (call wr out ( " {" true ) )

                    (call wr out ("" true))

                    (def cw:CodeWriter (call wr createTag ("constructor")))

                    (call cw out ((+ "function "nameDef.vref "(") false))

                        (if classInfo.has_constructor
                            (
                                ; (call cw out ("<cparams>" false))
                                (def constr:CodeNode classInfo.constructor_node)
                                (def cParams:CodeNode (call constr getSecond ()))
                                (for cParams.children param:CodeNode i
                                    (
                                        (if (> i 0)
                                            (call cw out (", " false))
                                        )
                                        (call cw out (param.vref false))
                                    )
                                )
                            )
                        )

                        ; for example
                        ; (Constructor (filePath:string fileName:string)


                        (call cw out (") {" true))
                        (call cw indent (1))

                        (call cw out ((+ "_classCallCheck(this, " nameDef.vref ");") true))
                        (if b_extended
                            (
;     var _this = _possibleConstructorReturn(this, (bar.__proto__ || Object.getPrototypeOf(bar)).call(this));
(call cw out ( (+ "var _this = _possibleConstructorReturn(this, (" nameDef.vref ".__proto__ || Object.getPrototypeOf(" nameDef.vref ")).call(this));" )true))
                                        
                            )
                        )

                        ; the class information...

                    (call wr newline ())
(call wr out ("" true))
(call wr out ((+ " _createClass(" nameDef.vref ", [") true) )
(call wr indent (1)) 

                        (def fnBody:CodeNode (itemAt node.children 2))
                        (call this WalkNodeChildren (fnBody ctx wr))


;                     (def wr:CodeWriter (call ctx getStaticWriter (currClass.name)))
(call wr newline ())
(call wr indent (-1))                         
(call wr out ("], [" true) )
(call wr indent (1))                         

    ; could there be a "re-write" method for the writer ...
    (call wr out ( (call staticWriter getCode ()) true))

(call wr indent (-1))                         
(call wr out ("]);" true) )
(call wr out ("" true))


                        ; (call this WalkNodeChildren (node ctx wr))

                        (if b_extended
                            (call cw out ( "return _this;" true ) )
                        )
                        ; after children have been written finalize the constructor
                        (call cw indent (-1))
                        (call cw out ("}" true))
                        (call wr indent (-1))

                        (call wr out ("" true))
                        (call wr out ( (+ "return " nameDef.vref ";") true ))

                    (call wr out ( "}(" false ) )

                    (if b_extended
                        (
                            (for classInfo.extends_classes pName:string i
                                (
                                    (if (> i 0)
                                        (call wr out ("," false))
                                    )
                                    (call wr out ( pName false))
                                )
                            )                            
                        )
                    )

                    (call wr out ( ");" true ) )
                   
                )
            )            

            ; perhaps the params should be different to support for example constructor and
            ; desctuctor variables and others

            (PublicMethod DefineVar:void (node:CodeNode ctx:RangerAppWriterContext wr:CodeWriter)
                (
                    ; (call wr out ("// var definition" true))

                    ; (call ctx setInMethod ())
                    (if (call ctx isInMethod ())
                        (
                            ; method variable declaration
                            (def v:CodeNode (call node getSecond ()))
                            (call wr out ( (+ "var " v.vref) false ))

                            (if (> (array_length node.children) 2)
                                (
                                    (call wr out ( " = " false))
                                    (call ctx setInExpr ())
                                    (call this WalkNode ((call node getThird ()) ctx wr))
                                    (call ctx unsetInExpr ())
                                )
                                (
                                    (switch v.value_type
                                        (case RangerNodeType.Hash 
                                            (call wr out ( " = {}" false))
                                        )
                                        (case RangerNodeType.Array 
                                            (call wr out ( " = []" false))
                                        )
                                        (default
                                            (call wr out ( "" false))
                                        )
                                    )
                                    
                                )                                
                                ; (call this)
                            )

                            (call wr out ( ";" true))

                        )
                        (
                            (def cw:CodeWriter (call wr getTag ("constructor")))
                            (def v:CodeNode (call node getSecond ()))
                            (call cw out ( (+ "this." v.vref) false ))

                            (if (> (array_length node.children) 2)
                                (
                                    (call cw out ( " = " false))
                                    (call ctx setInExpr ())
                                    ; (print "walking the class var init...")
                                    (call this WalkNode ((call node getThird ()) ctx cw))
                                    (call ctx unsetInExpr ())
                                )
                                (
                                    (switch v.value_type
                                        (case RangerNodeType.Hash 
                                            (call cw out ( " = {}" false))
                                        )
                                        (case RangerNodeType.Array 
                                            (call cw out ( " = []" false))
                                        )
                                        (default
                                            (call cw out ( " = undefined" false))
                                        )
                                    )
                                    
                                )
                            )

                            (call cw out ( ";" true))                            
                        )
                    )


                    ; Question: how to add callback to the constructor from the method ? 
                    ; TODO: writing to the future constructor function ??
                    
                )
            )


        )
    )
    
)