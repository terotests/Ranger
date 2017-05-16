(
    (Import "writer.clj")
    (Import "RangerAppWriterContext.clj")
    (Import "RangerAllocations.clj")
    (Import "parser.clj")

(gitdoc "README.md"

"
# Komentojen synktasi

## muuttujien määrittely

```
(def x:double)
(def len:int 10)
```

## heikot ja vahvat referenssit

Joskus referenssi olioon on määriteltävä heikoksi, jotta sitä ei vapauteta kun funktiosta poistutaan
tai kun kyseinen olio itsessään vapautetaan.

```
(def obj:myClass @weak(true))
```

## muuttujien sijoittaminen

```
(def x:double 20)
(def y:double 10)
(= x y )          ; x is now 10
(= x (+ x 5))     ; x is now 15
```

## komentojen lisp -tyyppinen syntaksi

Komennot noudattavat lisp -tyyppistä syntaksia:

```
(+ 10 5)     ; 15
(== 5 12)    ; false
(> 7 3)      ; true
(&& (== 4 4) true)  ; true
(&& (== 4 4) false) ; false

(call myObj hello ()) ; calls object myObj funtion hello
```


"
)
    ( CreateClass RangerCommonWriter 
        (

            (PublicMethod getWriterLang:string ()
                (
                    (return "common")
                )
            )    

            (PublicMethod EncodeString:string (orig_str:string)
                (
                    (def encoded_str:string "")
                    (def str_length:int (strlen orig_str))
                    (def ii:int 0)

                    ; a bit slow algorithm, could be improved much faster by copying
                    ; longer slices 
                    (while (< ii str_length)
                        (
                            (def cc:char (charAt orig_str ii))

                            (switch cc
                                (case 8 
                                    ( = encoded_str (+ encoded_str (strfromcode 92 ) (strfromcode 98 ) ) ) 
                                )    
                                (case 9 
                                    ( = encoded_str (+ encoded_str (strfromcode 92 ) (strfromcode 116 ) ) ) 
                                )    
                                (case 10 
                                    ( = encoded_str (+ encoded_str (strfromcode 92 ) (strfromcode 110 ) ) ) 
                                )    
                                (case 12 
                                    ( = encoded_str (+ encoded_str (strfromcode 92 ) (strfromcode 102 ) ) ) 
                                )    
                                (case 13 
                                    ( = encoded_str (+ encoded_str (strfromcode 92 ) (strfromcode 114 ) ) ) 
                                )

                                (case 34 
                                    ( = encoded_str (+ encoded_str (strfromcode 92 ) (strfromcode 34 ) ) ) 
                                )  
                                (case 92 
                                    ( = encoded_str (+ encoded_str (strfromcode 92 ) (strfromcode 92 ) ) ) 
                                )
                                (case 47 
                                    ( = encoded_str (+ encoded_str (strfromcode 92 ) (strfromcode 47 ) ) ) 
                                )                                    
                                    
                                (default
                                    ( = encoded_str (+ encoded_str (strfromcode cc) ) ) 
                                )
                            )   
                            (= ii (+ 1 ii))
                        )
                    )
                    (return encoded_str)   
                )
            )

(gitdoc "README.md"

"
## Enumeraatiot

Enumeraatiot ovat tyyppiä int
```
    (Enum Fruits:int
        (
            Banana
            Orange
            Apple
            Pineapple
        )
    )
``` 

Huom! Tällä hetkellä tyyppitarkastukset enumeroiduista tyypeistä eivät osaa tarkastaa virhellisiä
enumeroituja tyyppejä vaan konvertoivat kaikki tyyppiin `int`. Tällöin on mahdollista sijoittaa
muuttujaan jossa on tyyppiä

"
)
            ; (def definedEnums:[string:RangerAppEnum])
            (PublicMethod cmdEnum:void (node:CodeNode ctx:RangerAppWriterContext wr:CodeWriter)
                (
                    (def fNameNode:CodeNode (itemAt node.children 1))
                    (def enumList:CodeNode (itemAt node.children 2))
                    (def new_enum:RangerAppEnum (new RangerAppEnum ()))

                    (for enumList.children item:CodeNode i
                        (
                            (call new_enum add (item.vref))
                        )
                    )
                    (set ctx.definedEnums fNameNode.vref new_enum)
                )
            )

            (PublicMethod findParamDesc:RangerAppParamDesc (obj:CodeNode ctx:RangerAppWriterContext wr:CodeWriter)
                (

                    (def varDesc:RangerAppParamDesc)    
                    ; (print "findParamDesc")
                    (if (== obj.vref (getThisName _))
                        (
                            ; call to "this"
                            (= varDesc (new RangerAppParamDesc ()))
                            ; TODO: set the this variable description 
                            (return varDesc)
                        )
                        (
                            ; reference of type obj.foo
                            (if (> (array_length obj.ns) 1)
                                (
                                    ; (print "--> has ns")
                                    (def cnt:int (array_length obj.ns))
                                    (def classRefDesc:RangerAppParamDesc)                                        

                                    (for obj.ns strname:string i
                                        (if (== i 0)
                                            (
                                                (= classRefDesc (call ctx getVariableDef (strname)))   
                                                (if (null? classRefDesc)
                                                    (
                                                        (call ctx addError (obj ( + "Error, no description for called object: " strname ) ))
                                                        (break _)
                                                    )
                                                )
                                                (def classDesc:RangerAppClassDesc)
                                                (= classDesc (call ctx findClass (classRefDesc.nameNode.type_name)))
                                                ; (print (+ " looking for class " classRefDesc.nameNode.type_name))                     
                                            )
                                            (
                                                (if (< i (- cnt 1))
                                                    (
                                                        (= varDesc (call classDesc findVariable (strname)))
                                                        (if (null? varDesc)
                                                            (call ctx addError (obj ( + "Error, no description for refenced obj: " strname ) ))                                                    
                                                        )
                                                        (def subClass:string (call varDesc getTypeName ()))
                                                        (= classDesc (call ctx findClass (subClass)))
                                                        (continue _) 
                                                                                                               
                                                        ; the variable type name
                                                    )
                                                )
                                                
                                                ; TODO: consider if methods should be checed too
                                                (if (!null? classDesc) 
                                                    (
                                                        (= varDesc (call classDesc findVariable (strname)))
                                                        (if (null? varDesc)
                                                            (call ctx addError (obj ( + "variable not found " strname ) ))                                   
                                                        )
                                                    )
                                                )       
                                                ; (print (+ "ns variable type " varDesc.nameNode.type_name))                                                                                             
                                            )
                                        )                                        
                                    )
                                    (return varDesc)
                                    ; (= varDesc (call subCtx getVariableDef (obj.vref)))      
                                )
                            )

                            (= varDesc (call ctx getVariableDef (obj.vref)))
                            ; (= varDesc (call this findParamDesc (obj ctx wr)))
                            (if (!null? varDesc.nameNode)
                                (
                                    ; OK, here is what to expect:
                                    ; (print (+ varDesc.nameNode.vref ":" varDesc.nameNode.type_name) )
                                )
                                (
                                    (print (+ "findParamDesc : description not found for " obj.vref ))
                                    (if (!null? varDesc)
                                        (print (+ "Vardesc was found though..." varDesc.name))
                                    )
                                    (call ctx addError (obj ( + "Error, no description for called object: " obj.vref ) ))
                                )
                            )
                            (return varDesc)
                        )
                    )
                )
            )


            (PublicMethod areEqualTypes:boolean (n1:CodeNode n2:CodeNode ctx:RangerAppWriterContext )
                (

                    (if (null? n1)
                        (
                            (if (!null? n2)
                                (call ctx addError (n2 "Internal error: shouldBeEqualTypes called with n2 == null "  ) )                            
                            )
                            (return false)
                        )
                    )

                    (if (null? n2)
                        (
                            (if (!null? n1)
                                (call ctx addError (n1 "Internal error: shouldBeEqualTypes called with n1 == null "  ) )                            
                            )                            
                            (return false)
                        )
                    )
                    

                    ; (print (+ n1.eval_type_name " vs " n2.eval_type_name))
                    (if ( && (!= n1.eval_type RangerNodeType.NoType)
                             (!= n2.eval_type RangerNodeType.NoType) 
                             (> (strlen n1.eval_type_name) 0)
                             (> (strlen n2.eval_type_name) 0)
                             )
                        (
                            ; (print "had eval def")
                            (if (== n1.eval_type_name n2.eval_type_name)
                                (
                                    ; positively evaluated assigment value...
                                    ; (print (+ "Equals == " n1.eval_type_name))
                                    ; (call ctx addError (node "OK assigment " ))

                                )
                                (
                                    ; check if this is int => enum
                                    (def b_ok:boolean false)
                                    (if ( && (call ctx isEnumDefined (n1.eval_type_name))
                                        ( == n2.eval_type_name "int") )
                                        (
                                            (= b_ok true)
                                        )
                                    )                                    
                                    (if ( && (call ctx isEnumDefined (n2.eval_type_name))
                                        ( == n1.eval_type_name "int") )
                                        (
                                            (= b_ok true)
                                        )
                                    )

                                    ; TODO: fix this comparision to be more reasonable
                                    ; TODO: could be also a warning
                                    (if ( && ( == n1.eval_type_name "char")
                                             ( == n2.eval_type_name "int") )
                                        (
                                            (= b_ok true)
                                        )
                                    )

                                    (if ( && ( == n1.eval_type_name "int")
                                        ( == n2.eval_type_name "char") )
                                        (
                                            (= b_ok true)
                                        )
                                    )
                                                                        
                                    (if (== b_ok false)
                                        (return false)
                                    )
                                )
                            )
                        )
                    )           

                    (return true)

                )
            )



            (PublicMethod shouldBeEqualTypes:void (n1:CodeNode n2:CodeNode ctx:RangerAppWriterContext msg:string)
                (

                    (if (null? n1)
                        (
                            (if (!null? n2)
                                (call ctx addError (n2 "Internal error: shouldBeEqualTypes called with n2 == null "  ) )                            
                            )
                            (return _)
                        )
                    )

                    (if (null? n2)
                        (
                            (if (!null? n1)
                                (call ctx addError (n1 "Internal error: shouldBeEqualTypes called with n1 == null "  ) )                            
                            )                            
                            (return _)
                        )
                    )
                    

                    ; (print (+ n1.eval_type_name " vs " n2.eval_type_name))
                    (if ( && (!= n1.eval_type RangerNodeType.NoType)
                             (!= n2.eval_type RangerNodeType.NoType) 
                             (> (strlen n1.eval_type_name) 0)
                             (> (strlen n2.eval_type_name) 0)
                             )
                        (
                            ; (print "had eval def")
                            (if (== n1.eval_type_name n2.eval_type_name)
                                (
                                    ; positively evaluated assigment value...
                                    ; (print (+ "Equals == " n1.eval_type_name))
                                    ; (call ctx addError (node "OK assigment " ))

                                )
                                (
                                    ; check if this is int => enum
                                    (def b_ok:boolean false)
                                    (if ( && (call ctx isEnumDefined (n1.eval_type_name))
                                        ( == n2.eval_type_name "int") )
                                        (
                                            (= b_ok true)
                                        )
                                    )                                    
                                    (if ( && (call ctx isEnumDefined (n2.eval_type_name))
                                        ( == n1.eval_type_name "int") )
                                        (
                                            (= b_ok true)
                                        )
                                    )

                                    (if (call ctx isDefinedClass (n2.eval_type_name))
                                        (
                                            (def cc:RangerAppClassDesc (call ctx findClass (n2.eval_type_name)))
                                            (if ( >= (indexOf cc.extends_classes n1.eval_type_name) 0)
                                                (
                                                   (= b_ok true) 
                                                )
                                            )
                                        )
                                    )

                                    ; TODO: fix this comparision to be more reasonable
                                    ; TODO: could be also a warning
                                    (if ( && ( == n1.eval_type_name "char")
                                             ( == n2.eval_type_name "int") )
                                        (
                                            (= b_ok true)
                                        )
                                    )

                                    (if ( && ( == n1.eval_type_name "int")
                                        ( == n2.eval_type_name "char") )
                                        (
                                            (= b_ok true)
                                        )
                                    )
                                                                        
                                    (if (== b_ok false)
                                        (call ctx addError (n1 ( + "Type mismatch " n2.eval_type_name " <> " n1.eval_type_name ". " msg )))                                
                                    )
                                )
                            )
                        )
                    )           

                )
            )


           (PublicMethod shouldBeExpression:void (n1:CodeNode ctx:RangerAppWriterContext msg:string)
                (
                    (if (== n1.expression false)
                        (call ctx addError (n1 ( + msg)))                                
                    )
                )
            )            

           (PublicMethod shouldHaveChildCnt:void (cnt:int n1:CodeNode ctx:RangerAppWriterContext msg:string)
                (
                    (if (!= (array_length n1.children) cnt)
                        (call ctx addError (n1 ( + msg)))                                
                    )
                )
            )            

           (PublicMethod shouldBeNumeric:void (n1:CodeNode ctx:RangerAppWriterContext msg:string)
                (
                    (if ( && (!= n1.eval_type RangerNodeType.NoType)
                             (> (strlen n1.eval_type_name) 0)
                             )
                        (
                            (if (== false (|| (== n1.eval_type_name "double") (== n1.eval_type_name "int") ))
                                (
                                    (call ctx addError (n1 ( + "Not numeric: " n1.eval_type_name ". " msg )))                                
                                )
                            )
                        )
                    )           
                )
            )
            
           (PublicMethod shouldBeArray:void (n1:CodeNode ctx:RangerAppWriterContext msg:string)
                (
                    ;(!= n1.eval_type RangerNodeType.NoType) )
                    (if (!= n1.eval_type RangerNodeType.Array)
                        (
;                             (print (+ " Type is " n1.eval_type))
                            (call ctx addError (n1 ( + "Expecting array. " msg )))                                
                        )
                    )           
                )
            )


           (PublicMethod shouldBeType:void (type_name:string n1:CodeNode ctx:RangerAppWriterContext msg:string)
                (
                    ; (print (+ n1.eval_type_name " vs " n2.eval_type_name))
                    (if ( && (!= n1.eval_type RangerNodeType.NoType)
                             (> (strlen n1.eval_type_name) 0)
                             )
                        (
                            (if (== n1.eval_type_name type_name)
                                (
                                )
                                (
                                    ; check if this is int => enum
                                    (def b_ok:boolean false)
                                    (if ( && (call ctx isEnumDefined (n1.eval_type_name))
                                        ( == type_name "int") )
                                        (
                                            (= b_ok true)
                                        )
                                    )                                    
                                    (if ( && (call ctx isEnumDefined (type_name))
                                        ( == n1.eval_type_name "int") )
                                        (
                                            (= b_ok true)
                                        )
                                    )

                                    ; TODO: fix this comparision to be more reasonable
                                    ; TODO: could be also a warning
                                    (if ( && ( == n1.eval_type_name "char")
                                             ( == type_name "int") )
                                        (
                                            (= b_ok true)
                                        )
                                    )

                                    (if ( && ( == n1.eval_type_name "int")
                                        ( == type_name "char") )
                                        (
                                            (= b_ok true)
                                        )
                                    )
                                                                        
                                    (if (== b_ok false)
                                        (call ctx addError (n1 ( + "Type mismatch " type_name " <> " n1.eval_type_name ". " msg )))                                
                                    )
                                )
                            )
                        )
                    )           

                )
            )


(gitdoc "README.md"

"
## Import

Lähdekoodin uudelleenkäyttäminen ja importointi, jossa haetaan tiedoston luokkamääritykset:

```
    (Import \"sourcefile.ext\")
``` 

"
)

            (PublicMethod cmdImport:boolean (node:CodeNode ctx:RangerAppWriterContext wr:CodeWriter)
                (

                    (def fNameNode:CodeNode (itemAt node.children 1))
                    (def import_file:string fNameNode.string_value)

                    @onError(
                        (throw (+ "ERROR: import failed, possibly invalid Import filename: " import_file))
                    )

                    (if (has ctx.already_imported import_file)
                        (return false)
                        (
                            (set ctx.already_imported import_file true)
                        )
                    )

                    ; read the file contents
                    (def c:string (file_read "." import_file))                    
                    (def code:SourceCode (new SourceCode (c)))
                    (= code.filename import_file)
                    (def parser:RangerLispParser (new RangerLispParser (code)))
                    (call parser parse ())

                    ; (def appCtx:RangerAppWriterContext (new RangerAppWriterContext()))
                    ; test using the JS writer
                    ; (def cwr:RangerJavaScriptWriter (new RangerJavaScriptWriter ()))
                    (def rnode:CodeNode parser.rootNode)
                    ; (def wr:CodeWriter (new CodeWriter ()))

                    (call this CollectMethods (rnode ctx wr))
                    (call this StartCodeWriting (rnode ctx wr))
        
                    (return true)
                )           
            )

(gitdoc "README.md"

"
## Luokan luominen

```
    (CreateClass myClass 
        (
            (PublicMethod hello:void ()
                (
                    (print \"\Hello World!\")
                )
            )
        )
    )
    (def obj:myClass (new myClass ()))
    (call obj hello ())
``` 

## Metodin määrittely luominen

```
    (PublicMethod hello:string (arg1:int arg2:string)
``` 

```
    (StaticMethod hello:string (arg1:int arg2:string)
``` 


```
    (CreateClass myClass 
        (
            (PublicMethod hello:string (arg1:int arg2:string)
                (
                )
            )
        )
    )
``` 


## Periyttäminen

Periyttäminen voidaan tehdä `Extends` komennolla luokan bodyn sisällä.

```
    (CreateClass childClass 
        (
            (Extends (myClass))
        )
    )

    ; usage:
    (def obj:childClass (new childClass ()))
    (call obj hello ())
    
``` 

## Heikot ja vanhvat paluuarvot

Tällä hetkellä pohdinnassa syntaksi:
```
    (PublicMethod hello:myClass @strong(true) (arg1:int arg2:string)
``` 

Toinen vaihtoehto:
```
    (PublicMethod hello@(weak):myClass  (arg1:int arg2:string)
``` 

## Heikot ja vanhvat argumentit

Tällä hetkellä pohdinnassa syntaksi:
```
    (PublicMethod hello:myClass (arg1@(strong):someClass)
``` 
Missä `arg1` on vahva argumentti ja siirtää variable omistuksen funktioon, minkä jälkeen
kutsuja käsittelee annettua parametria weak -referenssinä ja funktio joka vastaanotti
parametrin käsittelee argumenttia vahvana referenssinä.

"
)

            (PublicMethod CreateClass (node:CodeNode ctx:RangerAppWriterContext wr:CodeWriter)
                (
                    (call wr out ("----Create class is not defined---- :(" true))
                )
            )

            (PublicMethod getThisName:string ()
                (
                    (return "this")
                )
            )

            (PublicMethod WriteThisVar:void (node:CodeNode ctx:RangerAppWriterContext wr:CodeWriter)
                (
                    (call wr out ((getThisName _) false))
                )
            )

            (PublicMethod WriteVRef:void (node:CodeNode ctx:RangerAppWriterContext wr:CodeWriter)
                (
                   (if (== node.vref "_")
                       (return _)
                   )

                   (call RangerAllocations WriteVRef (node ctx wr))
                   
                   (if node.has_vref_annotation 
                    (
                        (call ctx log ( node "ann" "Found annotated reference " ))   
                        (def ann:CodeNode node.vref_annotation)
                        (if (> (array_length ann.children) 0)
                            (
                                (def fc:CodeNode (itemAt ann.children 0))
                                (call ctx log ( node "ann" (+ "value of first " fc.vref )))   
                            )
                        )                                            
                    )
                   )

                   ; test if vref is enum type
                   (def rootObjName:string (itemAt node.ns 0))
                   ; (print rootObjName)

@todo("Riittääkö tässä metodissa se, että löydetään variable definition ?
- mietittävä pitäisikö myös this variablelle olla oma var def ?
- melkein se se variablen määrittely on se mikä tässäkin haetaan
- toisaalta kontekstissa voi olla jotain päivitettyä tietoa aiheesta ?
")

                   (if (call ctx isEnumDefined (rootObjName))
                       (
                           (def enumName:string (itemAt node.ns 1))
                           (def e:RangerAppEnum (call ctx getEnum (rootObjName)))

                           ; (get e.values enumName)

                           (if (has e.values enumName)
                               (
                                   (call wr out ((+ (get e.values enumName) "") false)) 
                               )
                               (
                                    (call ctx addError (node (+ "Undefined Enum " rootObjName "." enumName  )))                                   
                               )
                           )

                           (return 1)
                       )
                   )

                   (if (== node.vref (getThisName _))
                       (
                           ; 
                           (call wr out ( node.vref false ))
                           (= node.ref_type RangerNodeRefType.StrongImmutable)                                    
                           ( return _ )                   
                       )
                   )


                   ; (print (+ "ns[0] = " rootObjName))
                   (if (call ctx isVarDefined (rootObjName))
                       (
                           (def vDef:RangerAppParamDesc (call ctx getVariableDef (rootObjName)))                
                           (def activeFn:RangerAppFunctionDesc (call ctx getCurrentMethod ()))



                           ; TODO:
                           ;  think about moving the ownership from the node which previously holded the reference
                           ;  to the current node if possible ? 
                           ;  (call node getInstancesFrom (fc))

                           ; (print (+ "=> Defined variable " rootObjName " type " vDef.value_type))
                           (if vDef.is_class_variable 
                                (
                                    ; (print "Is class variable")
                                    (call this WriteThisVar (node ctx wr))
                                    (call wr out ("." false))
                                    (call wr out ( node.vref false ))

                                    ; TODO: missing support for more than two levels
                                    ; obj.foo works but obj.foo.x does not work, should be quite easy to change
                                    (if (> (array_length node.ns) 1)
                                        (
                                            (def pointedClass:RangerAppClassDesc (call ctx findClass (vDef.nameNode.type_name)))
                                            (if (null? pointedClass)
                                                (
                                                    (call ctx addError (node (+ "Could not find class " vDef.nameNode.type_name)))
                                                    (return _)
                                                )
                                            )
                                            (def vName:string (itemAt node.ns 1))
                                            (= vDef (call pointedClass findVariable (vName)))
                                        )
                                    )

                                    ; for exaple this.obj.parent or similar is usually weak
                                    (if (call vDef.node getBooleanProperty ("weak"))
                                        (
                                            (= node.ref_type RangerNodeRefType.Weak)
                                        )
                                    )
                                    
                                    
                                    (def vNameNode:CodeNode vDef.nameNode)
                                    (= node.eval_type vNameNode.value_type)
                                    (= node.eval_type_name vNameNode.type_name)                                    
                                    
                                    (return 1)
                                )
                            )

                            (= vDef (call this findParamDesc (node ctx wr)))        

                            (if (!null? vDef)
                                (
                                    ; for exaple node.parent or similar is usually weak
                                    (if (call vDef.node getBooleanProperty ("weak"))
                                        (
                                            (= node.ref_type RangerNodeRefType.Weak)
                                        )
                                    )

                                    (def vNameNode:CodeNode vDef.nameNode)
                                    (if ( && (!null? vNameNode) (!null? vNameNode.type_name) )
                                        (
                                            ; (if (== n1.eval_type_name n2.eval_type_name)
                                            (= node.eval_type vNameNode.value_type)
                                            (= node.eval_type_name vNameNode.type_name)                                    
                                        )
                                        ; (print (+ "type name: " vNameNode.type_name))                                    
                                        ; (print ( + "!!!!!!!!!!!!!!!!!!!!!!!!!!!! Had no type name : " rootObjName))
                                    )

                                )
                            )                        

                           ; is_class_variable
                       )
                       (
                            (def class_or_this:boolean (== rootObjName (getThisName _)))

                            (if (call ctx isDefinedClass (rootObjName))
                                (= class_or_this true)
                            )

                            (if class_or_this
                                (

                                )
                                (
                                    (def desc:RangerAppClassDesc (call ctx getCurrentClass ()))        
                                    (call ctx addError (node (+ "Undefined variable " rootObjName " in class " desc.name)))
                                )
                            )
                        
                            ; (print "-------==============")

                            (call wr out ( node.vref false ))
                            (return _)
                         
                       )
                   )
                   ; desc.compiledName

                   (for node.ns nns:string i 
                        (
                            (if (> i 0)
                                (
                                    (call wr out ( "." false ))
                                    (call wr out ( nns false))
                                )
                                (
                                    (def varDef:RangerAppParamDesc (call ctx getVariableDef (nns)))
                                    (call wr out ( varDef.compiledName false))
                                )   
                            )
                        )
                    )

                   ; (call wr out ( node.vref false ))
                )
            )

(gitdoc "README.md"

"
## Luokan rakentaja

```
    (CreateClass myClass 
        (
            (Constructor (str:string)
                (
                    (print (+ \"Hello !\" str))
                )
            )
        )
    )
``` 

Käyttö: `(new myClass (\"World\"))`

"
)
            
            (PublicMethod Constructor (node:CodeNode ctx:RangerAppWriterContext wr:CodeWriter)
                (
                   
                   (def subCtx:RangerAppWriterContext (call ctx fork ()))
                   ; (call wr out ( node.vref false ))
                   (def cw:CodeWriter (call wr getTag ("constructor")))

                   (def cParams:CodeNode (itemAt node.children 1))

                   (for cParams.children cn:CodeNode i
                    (
                        (def p:RangerAppParamDesc (new RangerAppParamDesc ()))
                        (= p.name cn.vref)
                        (= p.value_type cn.value_type)
                        (= p.node cn)
                        (= p.nameNode cn)
                        (= p.varType RangerContextVarType.FunctionParameter)
                        (= p.is_optional false)
                        (call subCtx defineVariable (p.name p))                        
                    )
                   )

                   (def cBody:CodeNode (call node getThird ()))
                   (call ctx setInMethod ())
                   (call this WalkNode (cBody subCtx cw))
                   (call ctx unsetInMethod ())
                )
            )


            (PublicMethod WriteScalarValue (node:CodeNode ctx:RangerAppWriterContext wr:CodeWriter)
                (
                    (= node.eval_type node.value_type)
                    (switch node.value_type
                        (case RangerNodeType.Double
                            (
                                (call wr out ( ( + "" node.double_value ) false ))
                                (= node.eval_type_name "double")                    
                            )
                        )
                        (case RangerNodeType.String
                            (
                                (call wr out  ( (+ (strfromcode 34) (call this EncodeString (node.string_value)) (strfromcode 34)) false) )
                                (= node.eval_type_name "string")
                            )
                        )
                        (case RangerNodeType.Integer
                            (
                                (call wr out (( + "" node.int_value) false))
                                (= node.eval_type_name "int")
                            )
                        )
                        (case RangerNodeType.Boolean
                            (
                                (if node.boolean_value
                                    (call wr out ("true" false))
                                    (call wr out ("false" false))
                                )
                                (= node.eval_type_name "boolean")                                
                            )   
                        )       
                    )             
                )
            )

(gitdoc "README.md"

"
## new -operaattori

```
    (def obj:myClass (new myClass (\"World\")))
``` 

"
)
            ;( new ClassName (...params))
            (PublicMethod cmdNew:void (node:CodeNode ctx:RangerAppWriterContext wr:CodeWriter)
                (

                    (call this shouldHaveChildCnt (3 node ctx "new expexts three arguments"))
                    ;    (call ctx addError (node ( + "ERROR, invalid argument types for " currC.name " constructor "  ) ))                                                                            

                    (def obj:CodeNode (call node getSecond ()))
                    (def params:CodeNode (call node getThird ()))

                    (if ( > (call ctx expressionLevel ()) 1 )
                        (call wr out ("(" false))
                    )

                    (call wr out ("new " false))    
                    (call ctx setInExpr ())
                    (call this WalkNode (obj ctx wr))
                    
                    (call wr out ("(" false))
                    (for params.children arg:CodeNode i
                        (
                            (if (> i 0)
                                (call wr out ("," false))
                            )
                            (call this WalkNode (arg ctx wr))
                        )
                    )
                    (call wr out (")" false))
                    (call ctx unsetInExpr ())
 
                    (if ( > (call ctx expressionLevel ()) 1 )
                        (call wr out (")" false))
                    )
                    (if ( == (call ctx expressionLevel ()) 0 )
                        (call wr newline ())
                    )

                    ; evaluated object type
                    (= node.eval_type RangerNodeType.Object)
                    (= node.eval_type_name obj.vref)

                   (def currC:RangerAppClassDesc (call ctx findClass (obj.vref)))
                   (def fnDescr:RangerAppFunctionDesc currC.constructor_fn)

                    ; check constructor params
                   (if (!null? fnDescr)
                        (for fnDescr.params param:RangerAppParamDesc i
                            (
                                (def argNode:CodeNode (itemAt params.children i))
                                (if (null? argNode)
                                    (
                                        (call ctx addError (node "Argument was not defined"))                                                     
                                    )
                                )
                                (if (call this areEqualTypes ( param.nameNode argNode ctx))
                                    (

                                    )
                                    (
                                        ; error
                                        (call ctx addError (node ( + "ERROR, invalid argument types for " currC.name " constructor "  ) ))                                                                            
                                    )
                                )
                            )
                        )         
                   )

                   (call RangerAllocations cmdNew (node ctx wr))

                )
            )

(gitdoc "README.md"

"
## Luokan funktioiden kutsuminen

Oliota, johon on olemassa referenssi voidaan kutsua `call` operaattorilla

```
  (call obj hello ())
```

Luokan metodit voivat kutsua oman luokan metodeja joko

```
  ; käyttäen suoraan this referenssiä
  (call this say (\"Hello World\")) 

  ; tai suoraan funktion nimellä
  (say \"Hello World\")

```

Esimerkki:

```
    (CreateClass myClass 
        (
            (PublicMethod hello:void ()
                (
                    ; call function say
                    (say \"Hello World!\")
                )
            )
            (PublicMethod say:void (msg:string)
                (
                    (print msg)
                )
            )

        )
    )
``` 

"
)


            ; test if this expression is a call...
            (PublicMethod cmdLocalCall:boolean (node:CodeNode ctx:RangerAppWriterContext wr:CodeWriter)
                (
                    (def fnNode:CodeNode (call node getFirst ()))
                    (def desc:RangerAppClassDesc (call ctx getCurrentClass ()))    

                    (if (call desc hasMethod (fnNode.vref))
                        (
                            (def fnDescr:RangerAppFunctionDesc (call desc findMethod (fnNode.vref)))
                            (def subCtx:RangerAppWriterContext (call ctx fork ()))

                            (def p:RangerAppParamDesc (new RangerAppParamDesc ()))
                            (= p.name fnNode.vref)
                            (= p.value_type fnNode.value_type)
                            (= p.node fnNode)
                            (= p.nameNode fnNode)
                            (= p.varType RangerContextVarType.Function)
                            (call subCtx defineVariable (p.name p))     
                            
                            (call subCtx setInExpr ())
                            (call this WriteThisVar (fnNode subCtx wr))
                            (call wr out ("." false))
                            (call this WalkNode (fnNode subCtx wr))                            
                            (call wr out ("(" false))

                            (for node.children arg:CodeNode i
                                (
                                    (if (< i 1)
                                        (continue _)
                                    )                                    
                                    (if (> i 1)
                                        (call wr out ("," false))
                                    )
                                    (call this WalkNode (arg subCtx wr))
                                )
                            )

                            (call wr out (")" false))
                            (call ctx unsetInExpr ())
                            (if ( == (call ctx expressionLevel ()) 0 )
                                (call wr newline ())
                            )

                            (for fnDescr.params param:RangerAppParamDesc i
                                (
                                    (def argNode:CodeNode (itemAt node.children (+ i 1)))
                                    (if (null? argNode)
                                        (
                                            (call ctx addError (node "Argument was not defined"))                                                     
                                        )
                                    )
                                    (if (call this areEqualTypes ( param.nameNode argNode ctx))
                                        (

                                        )
                                        (
                                            ; error
                                            (call ctx addError (node ( + "ERROR, invalid argument types for " desc.name " method " fnDescr.name ) ))                                    
                                            
                                        )
                                    )

;                                    (call ctx addError (obj ( + "ERROR, could not find class " className " method " method.vref ) ))                                    

                                )
                            )
                            

                            (return true)
                        )
                        (                            
                            (call ctx addError (node ( + "ERROR, could not find class " desc.name " method " fnNode.vref ) ))                                    
                            (return false)
                        )
                    )     
                    (return false)
                )
            )            


            (PublicMethod cmdCall:void (node:CodeNode ctx:RangerAppWriterContext wr:CodeWriter)
                (
                    (def obj:CodeNode (call node getSecond ()))
                    (def method:CodeNode (call node getThird ()))
                    (def fnDescr:RangerAppFunctionDesc ) 
                    (def has_fn_desc:boolean false)  
                    (def subCtx:RangerAppWriterContext (call ctx fork ()))

                    (def p:RangerAppParamDesc (new RangerAppParamDesc ()))
                    (= p.name method.vref)
                    (= p.value_type method.value_type)
                    (= p.node method)
                    (= p.varType RangerContextVarType.Function)
                    (= p.nameNode method)
                    (call subCtx defineVariable (p.name p))     

                    ; what is the object to be called ? 
                    (def varDesc:RangerAppParamDesc)

                    (if (== obj.vref (getThisName _))
                        (
                            ; call to "this"
                            (def classDesc:RangerAppClassDesc (call ctx getCurrentClass ()))
                            ; (print (+ "call " varDesc.nameNode.vref ":" varDesc.nameNode.type_name " method->" method.vref) )

                            (if (!null? classDesc)
                                (
                                    (= fnDescr (call classDesc findMethod (method.vref)))   
                                    (if (null? fnDescr)
                                        (
                                            (call ctx addError (obj ( + "ERROR, could not find this." method.vref " from class " classDesc.name ) ))                                    
                                        )
                                        (
                                            (= has_fn_desc true)                
                                        )
                                    )
                                )
                                (
                                    (call ctx addError (obj "ERROR, could not find class for this "  ))                                    
                                )                             
                            )
                        )
                        (

                            ; test if this is a static method call
                            (def possibleClass:string (itemAt obj.ns 0))

                            (if (call ctx hasClass (possibleClass))
                                (
                                    (def classDesc:RangerAppClassDesc (call ctx findClass (possibleClass)))
                                    (= fnDescr (call classDesc findStaticMethod (method.vref)))   
                                    (if (null? fnDescr)
                                        (
                                            (call ctx addError (obj ( + "ERROR, could not find class " possibleClass " static method " method.vref ) ))                                    
                                        )
                                        (
                                            (= has_fn_desc true)                
                                        )
                                    )

                                )
                                (

                                    ; (= varDesc (call subCtx getVariableDef (obj.vref)))
                                    (= varDesc (call this findParamDesc (obj subCtx wr)))

                                    (if (!null? varDesc)
                                        (
                                            ; OK, here is what to expect:
                                            (def className:string varDesc.nameNode.type_name)
                                            (def classDesc:RangerAppClassDesc (call ctx findClass (className)))
                                            ; (print (+ "call " varDesc.nameNode.vref ":" varDesc.nameNode.type_name " method->" method.vref) )

                                            (if (!null? classDesc)
                                                (
                                                    (= fnDescr (call classDesc findMethod (method.vref)))   
                                                    (if (null? fnDescr)
                                                        (
                                                            (call ctx addError (obj ( + "ERROR, could not find class " className " method " method.vref ) ))                                    
                                                        )
                                                        (
                                                            (= has_fn_desc true)                
                                                        )
                                                    )
                                                )
                                                (
                                                    (call ctx addError (obj ( + "ERROR, could not find class " className ) ))                                    
                                                )                             
                                            )

                                        )
                                        (
                                            (print (+ "description not found for " obj.vref ))
                                            (if (!null? varDesc)
                                                (print (+ "Vardesc was found though..." varDesc.name))
                                            )
                                            (call ctx addError (obj ( + "Error, no description for called object: " obj.vref ) ))
                                        )
                                    )

                                )
                            )


                        )
                    )

                    ; (print varDesc.node)
                    ; might check if there are any required params etc...

                    (if ( == (call subCtx expressionLevel ()) 0 )
                        (call wr newline ())
                    )

                    (if ( > (call subCtx expressionLevel ()) 1 )
                        (call wr out ("(" false))
                    )

                    (if has_fn_desc
                        (
                            ; fnDescr.nameNode
                            (def nn:CodeNode fnDescr.nameNode)
                            (= node.eval_type nn.value_type)
                            (= node.eval_type_name nn.type_name)
                        )
                    )
                    

                    (if (> (array_length node.children) 3)
                        (
                            (def params:CodeNode (itemAt node.children (3)))
                            (call subCtx setInExpr ())
                            (call this WalkNode (obj subCtx wr))
                            (call wr out ("." false))
                            (call this WalkNode (method subCtx wr))
                            
                            (call wr out ("(" false))
                            (for params.children arg:CodeNode i
                                (
                                    ; (if ( == arg.value_type RangerNodeType.NoType)
                                    ;     (call ctx addError (arg ( + "No value defined for argument " arg.vref ) ))
                                    ; )
                                    (if (> i 0)
                                        (call wr out ("," false))
                                    )
                                    (call this WalkNode (arg subCtx wr))
                                )
                            )
                            (call wr out (")" false))
                            (call subCtx unsetInExpr ())

                            ; check that the call arguments match the function prototype arguments

                            (if has_fn_desc
                                (
                                    ; fnDescr.nameNode
                                    (for fnDescr.params param:RangerAppParamDesc i
                                        (
                                            (if (== fnDescr.name "addVariable")
                                                (call ctx log ( node "memory5" (+ "addVariable " param.name " " param.debugString) ))                                           
                                            )
                                            (def argNode:CodeNode (itemAt params.children i))
                                            (if (null? argNode)
                                                (
                                                    (call ctx addError (node "Argument was not defined"))
                                                    (continue _)                                                     
                                                )
                                            )

                                            ; move ownership of the called node...
                                            ; params.children

                                            (def paramNameNode:CodeNode param.nameNode)

                                            (if (== fnDescr.name "addVariable")
                                                (call ctx log ( node "memory5" (+ "comparing to strong --> " param.refType " " param.debugString) ))                                           
                                            )

                                            (if (== param.initRefType RangerNodeRefType.Strong)
                                                (
                                                    (call ctx log ( node "memory4" "*** should move local ownership to call ***") )
                                                    (call RangerAllocations moveOwnership (params argNode ctx wr))
                                                )
                                                (
                                                    ; (call ctx log ( node "memory5" "weak param") )
                                                    
                                                )
                                            )

                                            (if (== false (call paramNameNode isPrimitiveType ()))
                                                (
                                                    @todo("the call parameter ownership change should be optional and most likely weak by default")
                                                    ; (call ctx log ( node "memory4" "*** should move local ownership to call ***") )                                    
                                                    ; (call RangerAllocations moveOwnership ( paramNameNode argNode ctx wr ))
                                                )
                                            )

                                            (if (call this areEqualTypes ( param.nameNode argNode ctx))
                                                (

                                                )
                                                (
                                                    ; error
                                                    (call ctx addError (node ( + "ERROR, invalid argument types for " className " method " method.vref ) ))                                    
                                                    
                                                )
                                            )
                                        )
                                    )
                                )
                            )


                        )
                        (
                            (call subCtx setInExpr ())
                            (call this WalkNode (obj subCtx wr))
                            (call wr out ("." false))
                            (call this WalkNode (method subCtx wr))
                            
                            (call wr out ("()" false))
                            
                            (call subCtx unsetInExpr ())
                        )
                    )

                    (if ( > (call subCtx expressionLevel ()) 1 )
                        (call wr out (")" false))
                    )
                    (if ( == (call subCtx expressionLevel ()) 0 )
                        (call wr newline ())
                    )

                )
            )

(gitdoc "README.md"

"
## join

Joins array of strings into a single string
```
  (def list:[string] (strsplit \"list,of,items\"))
  (def str:string (join list \":\")) ; list:of:items
```

"
)
            (PublicMethod cmdJoin:void (node:CodeNode ctx:RangerAppWriterContext wr:CodeWriter)
                (
                    (def n1:CodeNode (call node getSecond ()))
                    (def n2:CodeNode (call node getThird ()))

                    (call ctx setInExpr ())
                    (call this WalkNode (n1 ctx wr))
                    (call ctx unsetInExpr ())
                    (call wr out (".join(" false))
                    (call this WalkNode (n2 ctx wr))
                    (call wr out (")" false))

                    ; TODO: add array check
                    (call this shouldBeType ("string" n2 ctx "join expects a string as the second parameter."))

                )
            )

(gitdoc "README.md"

"
## strsplit

Spits string into array of strings
```
  (def list:[string] (strsplit \"list,of,items\"))
  (def str:string (join list \":\")) ; list:of:items
```

"
)
            

            (PublicMethod cmdSplit:void (node:CodeNode ctx:RangerAppWriterContext wr:CodeWriter)
                (
                    (def n1:CodeNode (call node getSecond ()))
                    (def n2:CodeNode (call node getThird ()))

                    (call ctx setInExpr ())
                    (call this WalkNode (n1 ctx wr))
                    (call ctx unsetInExpr ())
                    (call wr out (".split(" false))
                    (call this WalkNode (n2 ctx wr))
                    (call wr out (")" false))

                    (call this shouldBeType ("string" n1 ctx "strsplit expects a string as the first parameter."))
                    (call this shouldBeType ("string" n2 ctx "strsplit expects a string as the second parameter."))

                )
            )

(gitdoc "README.md"

"
## trim

Remove whitespace around the string
```
  (def str:string (trim \"  abba   \")) ; \"abba\"
```

"
)
            

            (PublicMethod cmdTrim:void (node:CodeNode ctx:RangerAppWriterContext wr:CodeWriter)
                (
                    (def n1:CodeNode (call node getSecond ()))
                    (call ctx setInExpr ())
                    (call this WalkNode (n1 ctx wr))
                    (call ctx unsetInExpr ())
                    (call wr out (".trim()" false))

                    (call this shouldBeType ("string" n1 ctx "Trim expects a string as the first parameter."))
                    
                )
            )

(gitdoc "README.md"

"
## strlen

Return length of a  string
```
  (def len:int (strlen \"abcdef\")) ; 6
```

"
)

            (PublicMethod cmdStrlen:void (node:CodeNode ctx:RangerAppWriterContext wr:CodeWriter)
                (
                    (def n1:CodeNode (call node getSecond ()))
                    (call ctx setInExpr ())
                    (call this WalkNode (n1 ctx wr))
                    (call ctx unsetInExpr ())
                    (call wr out (".length" false))

                    (call this shouldBeType ("string" n1 ctx "strlen expects a string as the first parameter."))

                )
            )

(gitdoc "README.md"

"
## substring

Return copy of the string 
```
  (def s:string (substring \"abcdef\" 2 5)) ; \"cde\"
```

"
)

            (PublicMethod cmdSubstring:void (node:CodeNode ctx:RangerAppWriterContext wr:CodeWriter)
                (
                    (def n1:CodeNode (call node getSecond ()))
                    (def start:CodeNode (itemAt node.children 2))
                    (def end:CodeNode (itemAt node.children 3))

                    (call ctx setInExpr ())
                    (call this WalkNode (n1 ctx wr))
                    (call wr out (".substring(" false))
                    (call this WalkNode (start ctx wr))
                    (call wr out (", " false))
                    (call this WalkNode (end ctx wr))
                    (call wr out (")" false))
                    (call ctx unsetInExpr ())

                    (call this shouldBeType ("string" n1 ctx "substring expects a string as the first parameter."))
                    (call this shouldBeType ("int" start ctx "substring expects an integer as the second parameter."))
                    (call this shouldBeType ("int" end ctx "substring expects an integer as the third parameter."))
                    
                )
            )

(gitdoc "README.md"

"
## charcode

Return ASCII code of a character
```
  (def code:int (charcode \"A\")) ; <ASCII code of A>
```

"
)

            ; getting the character code for some 
            (PublicMethod cmdCharcode:void (node:CodeNode ctx:RangerAppWriterContext wr:CodeWriter)
                (
                    (def n1:CodeNode (call node getSecond ()))

                    (call ctx setInExpr ())
                    (call this WalkNode (n1 ctx wr))
                    (call wr out (".charCodeAt(0)" false))
                    (call ctx unsetInExpr ())

                    (call this shouldBeType ("string" n1 ctx "charcode expects a string as the first parameter."))
                    
                )
            )             

(gitdoc "README.md"

"
## strfromcode

```
  (def str:string (strfromcode 65)) ; A
```

"
)

            (PublicMethod cmdStrfromcode:void (node:CodeNode ctx:RangerAppWriterContext wr:CodeWriter)
                (
                    (def n1:CodeNode (call node getSecond ()))
                    (call ctx setInExpr ())
                    (call wr out ("String.fromCharCode(" false))
                    (call this WalkNode (n1 ctx wr))
                    (call wr out (")" false))
                    (call ctx unsetInExpr ())

                    (call this shouldBeType ("int" n1 ctx "strfromcode expects an integer as the first parameter."))
                    
                )
            )   

(gitdoc "README.md"

"
## charAt
Get ASCII code of character at position
```
  (def code:int (charAt \"DAA\" 1)) ; 65
```

")

            (PublicMethod cmdCharAt:void (node:CodeNode ctx:RangerAppWriterContext wr:CodeWriter)
                (
                    (def n1:CodeNode (call node getSecond ()))
                    (def index:CodeNode (itemAt node.children 2))

                    (call ctx setInExpr ())
                    (call this WalkNode (n1 ctx wr))
                    (call wr out (".charCodeAt(" false))
                    (call this WalkNode (index ctx wr))
                    (call wr out (")" false))
                    (call ctx unsetInExpr ())

                    (call this shouldBeType ("string" n1 ctx "charAt expects a string as the first parameter."))                    
                    (call this shouldBeType ("int" index ctx "charAt expects an integer as the second parameter."))                    
                    
                )
            )    

(gitdoc "README.md"

"
## str2int
Convert string value to integer
```
  (def value:int (str2int \"456\" )) ; 456
```

")            

            ;cmdStr2Int     
            (PublicMethod cmdStr2Int:void (node:CodeNode ctx:RangerAppWriterContext wr:CodeWriter)
                (
                    (def n1:CodeNode (call node getSecond ()))

                    (call ctx setInExpr ())
                    (call wr out ("parseInt(" false))
                    (call this WalkNode (n1 ctx wr))
                    (call ctx unsetInExpr ())

                    (call wr out (")" false))

                    (call this shouldBeType ("string" n1 ctx "str2int expects a string as the first parameter."))                    
 
                )
            )      

(gitdoc "README.md"

"
## str2double
Convert string value to double
```
  (def value:double (str2double \"3.14\" )) ; 3.14
```

")            

            (PublicMethod cmdStr2Double:void (node:CodeNode ctx:RangerAppWriterContext wr:CodeWriter)
                (
                    (def n1:CodeNode (call node getSecond ()))

                    (call ctx setInExpr ())
                    (call wr out ("parseFloat(" false))
                    (call this WalkNode (n1 ctx wr))
                    (call ctx unsetInExpr ())

                    (call wr out (")" false))

                    (call this shouldBeType ("string" n1 ctx "str2double expects a string as the first parameter."))                    
                    
                )
            )                      

 
(gitdoc "README.md"

"
## double2str
Convert double value to string
```
  (def value:string (double2str 3.14 )) ; \"3.14\"
```

")                               

            (PublicMethod cmdDouble2Str:void (node:CodeNode ctx:RangerAppWriterContext wr:CodeWriter)
                (
                    (def n1:CodeNode (call node getSecond ()))

                    (call ctx setInExpr ())
                    (call wr out ("(" (strfromcode 34) (strfromcode 34)  " + " false))
                    (call this WalkNode (n1 ctx wr))
                    (call ctx unsetInExpr ())

                    (call wr out (")" false))

                    (call this shouldBeType ("double" n1 ctx "double2str expects a double as the first parameter."))                    
                    
                )
            )            


(gitdoc "README.md"

"
## array_length
Return the length of array as integer
```
  (def value:int (array_length someArray )) ; length of the someArray
```

")                        

            (PublicMethod cmdArrayLength:void (node:CodeNode ctx:RangerAppWriterContext wr:CodeWriter)
                (
                    (def n1:CodeNode (call node getSecond ()))
                    (call ctx setInExpr ())
                    (call this WalkNode (n1 ctx wr))
                    (call ctx unsetInExpr ())
                    (call wr out (".length" false))

                    (= node.eval_type RangerNodeType.Integer)
                    (= node.eval_type_name "int")

                )
            )


            ; logging should be enabled only if compiler setting "log" is enabled
            ; ; (dbglog "memory1" "")
            (PublicMethod cmdLog:void (node:CodeNode ctx:RangerAppWriterContext wr:CodeWriter)
                (
                    (return _)

                    ; log_group
                    (if (call ctx hasCompilerSetting ("log_group"))
                        (
                            (def gName:string (call ctx getCompilerSetting ("log_group")))

                            (def n1:CodeNode (call node getSecond ()))
                            (def n2:CodeNode (call node getThird ()))

                            (if (== n1.string_value gName)
                                (
                                    (call wr newline ())
                                    (call wr out ( (+ "console.log(\"[" gName "] \" +"  ) false))
                                    (call ctx setInExpr ())
                                    (call this WalkNode (n2 ctx wr))
                                    (call ctx unsetInExpr ())
                                    (call wr out (");" true))
                                )
                            )

                        )
                    )


                )
            )

(gitdoc "README.md"

"
## print
Prints some output to the console
```
  (print \"This is fine.\")
```

")                        
            

            (PublicMethod cmdPrint:void (node:CodeNode ctx:RangerAppWriterContext wr:CodeWriter)
                (
                    (def n1:CodeNode (call node getSecond ()))
                    (call wr newline ())
                    (call wr out ("console.log(" false))
                    (call ctx setInExpr ())
                    (call this WalkNode (n1 ctx wr))
                    (call ctx unsetInExpr ())
                    (call wr out (");" true))

                    (call this shouldBeType ("string" n1 ctx "print expects a string as the first parameter."))                    

                )
            )

            (PublicMethod cmdDoc:void (node:CodeNode ctx:RangerAppWriterContext wr:CodeWriter)
                (
                    (call wr newline ())
                    (call wr out ("/**" false))
                    (if (> (array_length node.children) 1)
                        (
                            (def fc:CodeNode (call node getSecond ()))
                            (call this WalkNode (fc ctx wr))    
                        )
                    )
                    (call wr out ("*/" true))                    
                )
            )
                        

            (PublicMethod cmdGitDoc:void (node:CodeNode ctx:RangerAppWriterContext wr:CodeWriter)
                (                   
(gitdoc "README.md"
"
## Tuki ( gitdoc *file* *text* ) -komennolle

Ohjelmakoodin sisällä voidaan luoda git-dokumentaatioon lisää entryjä komennolla

```
   (gitdoc \"README.md\" \"# Hello Git!\")
```

Tämä dokumentaatio on luotu käyttäen tätä synktaksia.

"

)                    

                    (def cn:CodeNode (itemAt node.children 1))                    
                    (def doc:CodeNode (itemAt node.children 2))                    

                    (def classWriter:CodeWriter (call ctx getFileWriter ("." cn.string_value)))
                    ; (call this WalkNode (doc ctx classWriter))
                    (call classWriter raw (doc.string_value true))
                )
            )                    


(gitdoc "README.md"

"
## continue
for, while loop continue statement
```
  (continue _)
```

")            

            (PublicMethod cmdContinue:void (node:CodeNode ctx:RangerAppWriterContext wr:CodeWriter)
                (
                    (call wr newline ())
                    (call wr out ("continue;" true))
                )
            )  

(gitdoc "README.md"

"
## break
for, while loop break statement
```
  (break _)
```

")            

            (PublicMethod cmdBreak:void (node:CodeNode ctx:RangerAppWriterContext wr:CodeWriter)
                (
                    (call wr newline ())
                    (call wr out ("break;" true))
                )
            )            

(gitdoc "README.md"

"
## throw

Throws exception
```
  (throw \"Something went wrong\")
```

Virheiden käsittelijä on vielä työn alla. Koska tavoite on pystyä kääntämään myös Golang kielelle
missä ei ole normaalia try... catch... käsittelijää ainakin toistaiseksi virhekäsittelijä on 
funktiokohtainen annotaatio `@onError()` jonka sisällä oleva expression sisältää komennot jotka
ajetaan virheen tapahtumisen jälkeen.

```
@onError(
    (print \"Got exception.\")
)
```

Virhekäsittelijästä puuttuu vielä kyky lähettää eri tyyppisiä virheilmoituksia esimerkiksi 
enumeroituina Exceptioneina tai erillistettyinä Exception -luokkina. Lisäksi on pohdittava
miten virhekäsittelijä suhtautuu paikallisiin variableihin, onko niiden käyttäminen 
sallittua ja missä määrin.


")            

            (PublicMethod cmdThrow:void (node:CodeNode ctx:RangerAppWriterContext wr:CodeWriter)
                (                    

                    (call wr newline ())
                    (call wr out ("throw " false))
                    (if (> (array_length node.children) 1)
                        (
                            (def fc:CodeNode (call node getSecond ()))

                            (if (== fc.vref "_")
                                ()
                                (
                                    (call wr out (" " false))
                                    (call ctx setInExpr ())
                                    (call this WalkNode (fc ctx wr))    
                                    (call ctx unsetInExpr ())    
                                )
                            )
                        )
                    )
                    (call wr out (";" true))                    
                )
            )

(gitdoc "README.md"

"
## return

Return from function with or without value
```
  (return _)           ; <- nothing to return
  (return value)       ; <- has return value
```

")            


            (PublicMethod cmdReturn:void (node:CodeNode ctx:RangerAppWriterContext wr:CodeWriter)
                (
                    (call wr out ("return" false))
                    (if (> (array_length node.children) 1)
                        (
                            (def fc:CodeNode (call node getSecond ()))

                            (if (== fc.vref "_")
                                ()
                                (
                                    (call wr out (" " false))
                                    (call ctx setInExpr ())
                                    (call this WalkNode (fc ctx wr))    
                                    (call ctx unsetInExpr ())    

                                    @todo("Voidaanko paluuarvon tyypistä sanoa, että sen pitäisi olla strong?")

                                    ; (= m.refType RangerNodeRefType RangerNodeRefType.Strong)
                                    (def currFn:RangerAppFunctionDesc (call ctx getCurrentMethod ()))

                                    ; (def p:RangerAppParamDesc (call RangerAllocations findParamDesc (fc ctx wr)))

                                    (if fc.hasParamDesc
                                        (
                                            (def p:RangerAppParamDesc fc.paramDesc)
                                            (if (== currFn.refType RangerNodeRefType.Strong)
                                                (
                                                    (call ctx log (node  "memory4" ">>>>>>>>> ----------- returning strong variable possibly here"))                                        
                                                            
                                                )
                                                (
                                                    (if (!null? p)
                                                        (if (== p.refType RangerNodeRefType.Strong) (
                                                            (def type_found:boolean false)
                                                            (if (== p.varType RangerContextVarType.LocalVariable)    
                                                                (
                                                                    (= type_found true)
                                                                    (call ctx log (node  "memory4" "<<<<< ERROR >>>> returning strong but function is not strong"))                                                                                
                                                                    
                                                                    (call ctx log (node  "memory4" "RETURNING LocalVariable, problem because deallocated after return"))        
                                                                )   
                                                            ) 
                                                            (if (== p.varType RangerContextVarType.NewObject)    
                                                                (
                                                                    (= type_found true)
                                                                    (call ctx log (node  "memory4" "<<<<< ERROR >>>> returning NEW Object which is STRONG but function is weak"))                                                                                
                                                                )   
                                                            )
                                                                  

                                                            (if (== p.varType RangerContextVarType.Property)    
                                                                (
                                                                    (= type_found true)
                                                                    (call ctx log (node  "memory4" "RETURNING Property => should be a weak return, OK"))        
                                                                )   
                                                            )
                                                            (if (== false type_found)
                                                                (call ctx log (node  "memory4" "<<<<< ERROR >>>> TYPE NOT FOUND && returning strong but function is not strong"))                                                                                
                                                            )                                                                 

                                                        ))
                                                    )
                                                )
                                            )       
                                        )
                                    )
                                    ; then move the owned instances of possible return value to a "returned values"
                                    ; (call node getInstancesFrom (fc))
                                    ; (call node moveOwnedToReturned ())

                                )
                            )
                        )
                    )
                    (call wr out (";" true))                    
                )
            )

(gitdoc "README.md"

"
## remove_index

Removes item from array without returning it
```
  (remove_index someArray 10)     
```

")            

            ; remove item from array
            ; (remove_index arr index)
            (PublicMethod cmdRemoveIndex:void (node:CodeNode ctx:RangerAppWriterContext wr:CodeWriter)
                (
                    (def arrayObj:CodeNode (call node getSecond ()))
                    (def indexNode:CodeNode (call node getThird ()))

                    ; TODO: check that the item is the same type as the array type
                    (call wr newline ())
                    
                    (call ctx setInExpr ())
                    (call this WalkNode (arrayObj ctx wr))
                    (call wr out (".splice(" false))
                    (call this WalkNode (indexNode ctx wr))
                    (call ctx unsetInExpr ())                    

                    (call wr out (", 1)" true))

                    (call this shouldBeType ("int" indexNode ctx "indexOf expects an interger as the second parameter."))                    
                    ; TODO: handling array and hash types...
                    (call this shouldBeArray (arrayObj ctx "remove expects an array as the first parameter."))                    
                )
            )

(gitdoc "README.md"

"
## indexOf

Get index of item in array or -1 if not found
```
  (def idx:index (indexOf someArray item))     
```

")            

            ; (indexOf arr item)
            (PublicMethod cmdIndexOf:void (node:CodeNode ctx:RangerAppWriterContext wr:CodeWriter)
                (
                    (def arrayObj:CodeNode (call node getSecond ()))
                    (def itemObj:CodeNode (call node getThird ()))

                    ; TODO: check that this call is inside expression
                    ; TODO: check that the item is the same type as the array type

                    (call ctx setInExpr ())
                    (call this WalkNode (arrayObj ctx wr))
               
                    (call wr out (".indexOf(" false))
                    (call this WalkNode (itemObj ctx wr))
                    (call ctx unsetInExpr ())                    
                    (call wr out (")" false))

                    ; TODO: handling array and hash types...
                    (call this shouldBeArray (arrayObj ctx "remove expects an array as the first parameter."))                    
                )
            )

(gitdoc "README.md"

"
## array_extract

Gets and removes item from array at some index 
```
  (def item:ItemType (array_extract someArray 0))     
```

")            

            ; (removeLast arr value)
            (PublicMethod cmdExtractArray:void (node:CodeNode ctx:RangerAppWriterContext wr:CodeWriter)
                (
                    (def obj:CodeNode (call node getSecond ()))
                    (def index:CodeNode (call node getThird ()))
 
                    (call ctx setInExpr ())
                    (call this WalkNode (obj ctx wr))
                    (call ctx unsetInExpr ())                    
                    (call wr out (".splice(" false))
                    (call this WalkNode (index ctx wr))
                    (call wr out (",1).pop()" false))

                    (if (== false (call obj isPrimitiveType ()))
                        (
                            ; same code as when creating a new object
                            (def p:RangerAppParamDesc (new RangerAppParamDesc ()))
                            (= p.varType RangerContextVarType.NewObject)
                            (= p.refType RangerNodeRefType.Strong)

                            (def obj:CodeNode (call node getSecond ()))
                            (= p.node node)
                            (= p.nameNode obj)

                            (= node.hasParamDesc true)
                            (= node.paramDesc p)
                            
                        )
                    )

                    (call this shouldBeArray (obj ctx "array_extract expects an array as the first parameter."))                    
                    (call this shouldBeType ("int" index ctx "array_extract expects an int as the second parameter."))                    

                )
            )

(gitdoc "README.md"

"
## removeLast 

Removes the last element from the array without returning it
```
  (removeLast someArray )     
```

")            
            

            ; (removeLast arr value)
            (PublicMethod cmdRemoveLast:void (node:CodeNode ctx:RangerAppWriterContext wr:CodeWriter)
                (
                    (def obj:CodeNode (call node getSecond ()))
 
                    (call wr newline ())
                    
                    (call ctx setInExpr ())
                    (call this WalkNode (obj ctx wr))
                    (call ctx unsetInExpr ())                    
                    (call wr out (".pop()" true))

                    (call this shouldBeArray (obj ctx "removeLast expects an array as the first parameter."))                    
                )
            )

(gitdoc "README.md"

"
## push 

Append item as last element of array
```
  (push someArray item)     
```

")            

            ; (push arr value)
            (PublicMethod cmdPush:void (node:CodeNode ctx:RangerAppWriterContext wr:CodeWriter)
                (
                    (def obj:CodeNode (call node getSecond ()))
                    (def value:CodeNode (call node getThird ()))
 
                    (call wr newline ())
                    
                    (call ctx setInExpr ())
                    (call this WalkNode (obj ctx wr))
                    (call wr out (".push(" false))
                    (call this WalkNode (value ctx wr))
                    (call ctx unsetInExpr ())                    
                    (call wr out (");" true))

                    (call RangerAllocations moveOwnership (obj value ctx wr))

                    (call this shouldBeArray (obj ctx "push expects an array as the first parameter."))                    

                )
            )

(gitdoc "README.md"

"
## itemAt 

Returns item from array without removing it
```
  (def item:itemType (itemAt someArray 3)) ; get item from index 3     
```

")            
            

            ; (itemAt arr index)
            (PublicMethod cmdItemAt:void (node:CodeNode ctx:RangerAppWriterContext wr:CodeWriter)
                (
                    (def obj:CodeNode (call node getSecond ()))
                    (def index:CodeNode (call node getThird ()))
                     
                    (call ctx setInExpr ())
                    (call this WalkNode (obj ctx wr))
                    (call wr out ("[" false))
                    (call this WalkNode (index ctx wr))
                    (call ctx unsetInExpr ())                    
                    (call wr out ("]" false))

                    
                    (call this shouldBeArray (obj ctx "itemAt expects an array as the first parameter."))                    
                    (call this shouldBeType ("int" index ctx "charAt expects an interger as the second parameter."))                    

                )
            )


(gitdoc "README.md"

"
## has 

Returns true if map has a key
```
  (has someMap someKey) ; returns true if map has defined key \"someKey\"
```

")            

            ; (has obj key)
            (PublicMethod cmdHas:void (node:CodeNode ctx:RangerAppWriterContext wr:CodeWriter)
                (
                    (def obj:CodeNode (call node getSecond ()))
                    (def key:CodeNode (call node getThird ()))
 
                    (if ( > (call ctx expressionLevel ()) 1 )
                        (call wr out ("(" false))
                    )
                    (call wr out ("typeof(" false))
                    (call ctx setInExpr ())
                    (call this WalkNode (obj ctx wr))
                    (call wr out ("[" false))
                    (call this WalkNode (key ctx wr))
                    (call wr out ("]" false))
                    (call ctx unsetInExpr ())
                    (call wr out ((+ ") != " (strfromcode 34) "undefined" (strfromcode 34) ) false))
                    (if ( > (call ctx expressionLevel ()) 1 )
                        (call wr out (")" false))
                    )

                    ; TODO: check hash type
                    (call this shouldBeType ("string" key ctx "has expects a string as the second parameter."))
                )
            )

(gitdoc "README.md"

"
## set 

Set a map key to some value
```
  (def someMap:[string:string])
  (set someMap \"foo\" \"bar\") ; map has now key-value pair foo:bar
```

")            


            ; (set obj key value)
            (PublicMethod cmdSet:void (node:CodeNode ctx:RangerAppWriterContext wr:CodeWriter)
                (
                    (def obj:CodeNode (call node getSecond ()))
                    (def key:CodeNode (call node getThird ()))
                    (def value:CodeNode (itemAt node.children (3)))
 
                    (call wr newline ())
                    
                    (call ctx setInExpr ())
                    (call this WalkNode (obj ctx wr))
                    (call wr out ("[" false))
                    (call this WalkNode (key ctx wr))
                    (call wr out ("] = " false))
                    (call this WalkNode (value ctx wr))
                    (call ctx unsetInExpr ())
                    (call wr out (";" true))

                    (call RangerAllocations moveOwnership (obj value ctx wr))

                )
            )

(gitdoc "README.md"

"
## get 

Get a value associated to a key 
```
  (def someMap:[string:string])
  (set someMap \"foo\" \"bar\") ; map has now key-value pair foo:bar

  (def value:string (get someMap \"foo\")) ; \"bar\"
```

")            

            ; (get obj key)
            (PublicMethod cmdGet:void (node:CodeNode ctx:RangerAppWriterContext wr:CodeWriter)
                (
                    (def obj:CodeNode (call node getSecond ()))
                    (def key:CodeNode (call node getThird ()))
 
                    (if ( > (call ctx expressionLevel ()) 1 )
                        (call wr out ("(" false))
                    )
                    (call ctx setInExpr ())
                    (call this WalkNode (obj ctx wr))
                    (call wr out ("[" false))
                    (call this WalkNode (key ctx wr))
                    (call wr out ("]" false))
                    (call ctx unsetInExpr ())
                    (if ( > (call ctx expressionLevel ()) 1 )
                        (call wr out (")" false))
                    )

                    ; (def currFn:RangerAppFunctionDesc (call ctx getCurrentMethod ()))
                    @todo("get should fetch a weak reference")
                )
            )

(gitdoc "README.md"

"
## null? 

Returns true if value is null
```
  (null? value)
```

")            
            

            ; test for null (null? <value>)
            (PublicMethod cmdIsNull:void (node:CodeNode ctx:RangerAppWriterContext wr:CodeWriter)
                (
                    (def n1:CodeNode (call node getSecond ()))
 
                    (if ( > (call ctx expressionLevel ()) 1 )
                        (call wr out ("(" false))
                    )
                    (call ctx setInExpr ())
                    (call this WalkNode (n1 ctx wr))
                    (call ctx unsetInExpr ())
                    (call wr out (" == null " false))
                    (if ( > (call ctx expressionLevel ()) 1 )
                        (call wr out (")" false))
                    )
                )
            )

(gitdoc "README.md"

"
## !null? 

Returns true if value is not null
```
  (!null? value)
```

")            

            ; test for not null (!null? <value>)
            (PublicMethod cmdNotNull:void (node:CodeNode ctx:RangerAppWriterContext wr:CodeWriter)
                (
                    (def n1:CodeNode (call node getSecond ()))
 
                    (if ( > (call ctx expressionLevel ()) 1 )
                        (call wr out ("(" false))
                    )
                    (call ctx setInExpr ())
                    (call this WalkNode (n1 ctx wr))
                    (call ctx unsetInExpr ())
                    (call wr out (" != null " false))
                    (if ( > (call ctx expressionLevel ()) 1 )
                        (call wr out (")" false))
                    )
                )
            )

            ; assigment = operator
            (PublicMethod cmdAssign:void (node:CodeNode ctx:RangerAppWriterContext wr:CodeWriter)
                (
                    (call wr newline ())
                    (def n1:CodeNode (call node getSecond ()))
                    (def n2:CodeNode (call node getThird ()))
                    (call this WalkNode (n1 ctx wr))
                    (call wr out (" = " false))
                    (call ctx setInExpr ())
                    (call this WalkNode (n2 ctx wr))
                    (call ctx unsetInExpr ())
                    (call wr out (";" true)) 

                    (call RangerAllocations cmdAssign (node ctx wr))


@todo("Pitäisikö tämä cmdAssign siirtää CodeNoden funktioksi, joka siirtää referenssin nodesta A nodeen B?
- Kaikissa nodeissa ei ole mitään siirrettävää data, osa on scalar arvoja, esim. true, 1, string etc.
- Jotkut nodet sisältävät ihan uusia arvoja, jotka luotu new -operaattorilla ja ne siirtyvät ekaa kertaa ctxiin
- Jotkut siirtävät dataa vaikkapa arraystä, esim. (= foo (get myHash name))
- Joissain asetetaan esim. this, (= foo.parent this)
- Toiset nodet pitäisi olla asetttuja jonkun referenssin arvoon, esim. (= foo this.current_obj)

? mitä variantteja noden referenssin arvolla voi olla - WriteVRef on toinen avainfunktio 
")

                    (if (== n1.ref_type RangerNodeRefType.Weak)
                        (
                            
                        )
                        (
                            (def is_strong:boolean true)
                            ; not a weak reference...
                            (if (== n2.ref_type RangerNodeRefType.StrongImmutable)
                                (
                                    (call ctx log (node  "memory3"  (+ "ERROR: strong immutable can not be assigned to non-weak " n1.vref)))    
                                    (= is_strong false)                                          
                                )
                            )

                            (if (== n2.ref_type RangerNodeRefType.Weak)
                                (
                                    (call ctx log (node  "memory3"  (+ "ERROR: Weak -> Strong assigment for " n2.vref)))    
                                    (= is_strong false)                                              
                                )
                            )

                        )
                    )        

                    ; can you detect if the assigment is weak ? 
                    
                    (call this shouldBeEqualTypes (n1 n2 ctx "Assigment expects both sides to be equal."))
                )
            )

            ; override in child classes
            (PublicMethod mathLibCalled:void (node:CodeNode ctx:RangerAppWriterContext wr:CodeWriter)
                ()
            )


(gitdoc "README.md"

"
## Math library functions

Following standard math library functions are defined from double values
```
  (sin value)
  (cos value)
  (tan value)
  (atan value)
  (log value)
  (abs value)
  (acos value)
  (asin value)
  (floor value)
  (round value)
  (sqrt value)
```

")  
            ;  "sin", "cos", "tan", "atan", "log", "abs", "acos", "asin", "floor", "round", "sqrt"
            (PublicMethod cmdMathLibOp:void (node:CodeNode ctx:RangerAppWriterContext wr:CodeWriter)
                (
                    (def op:CodeNode (call node getFirst ()))
                    (def n1:CodeNode (call node getSecond ()))

                    (call wr out ("Math." false))
                    (call wr out (op.vref false))
                    (call wr out ("(" false))
                    
                    (call ctx setInExpr ())
                    (call this WalkNode (n1 ctx wr))
                    (call ctx unsetInExpr ())
                    (call wr out (")" false))
                
                    (call this mathLibCalled (node ctx wr))

                    (if ( && (!= n1.eval_type RangerNodeType.NoType)
                             (!= n1.eval_type_name "double") )
                        (
                            (call ctx addError (n1 ( + "Math operator Math." op.vref " called with invalid value type: " n1.eval_type_name) ))
                        )
                    )
                             
                        
                    
                )
            )

(gitdoc "README.md"

"
## Boolean comparision operators

Following standard boolean operators are defined
```
  (== value1 value2)  ; equal values
  (< value1 value2)   ; less than
  (> value1 value2)   ; greater than
  (!= value1 value2)  ; not equal
  (>= value1 value2)  ; greater or equal
  (<= value1 value2)  ; less or equal
```
The result value of comparision operator is boolean

")  
            ; operators "==", "<", ">", "!=", ">=", "<="
            (PublicMethod cmdComparisionOp:void (node:CodeNode ctx:RangerAppWriterContext wr:CodeWriter)
                (
                    (def op:CodeNode (call node getFirst ()))
                    (def n1:CodeNode (call node getSecond ()))
                    (def n2:CodeNode (call node getThird ()))

                    (= node.eval_type RangerNodeType.Boolean)
                    (= node.eval_type_name "boolean")
    
                    (if ( > (call ctx expressionLevel ()) 1 )
                        (call wr out ("(" false))
                    )
                    (call ctx setInExpr ())
                    (call this WalkNode (n1 ctx wr))
                    (call wr out (op.vref false))
                    (call this WalkNode (n2 ctx wr))
                    (call ctx unsetInExpr ())
                    (if ( > (call ctx expressionLevel ()) 1 )
                        (call wr out (")" false))
                    )
                    (call this shouldBeEqualTypes (n1 n2 ctx "Can not compare values of different types."))       
                )
            )

(gitdoc "README.md"

"
## Boolean logic operators

Following standard boolean operators are defined for boolean values
```
  (&& value1 value2 value3 ...)   ; logical AND
  (|| value1 value2 value3 ...)   ; logical OR
```
The result value of comparision operator is boolean

")  

            ; operators "&&", "||"
            (PublicMethod cmdLogicOp:void (node:CodeNode ctx:RangerAppWriterContext wr:CodeWriter)
                (
                    (def op:CodeNode (call node getFirst ()))

                    (= node.eval_type RangerNodeType.Boolean)
                    (= node.eval_type_name "boolean")

                    (def firstChild:CodeNode (call node getSecond ()))

                    (if ( > (call ctx expressionLevel ()) 1 )
                        (call wr out ("(" false))
                    )
                    ;(&& a b c d)
                    (for node.children item:CodeNode i
                        (if (> i 0)
                            (
                                (if (> i 1)
                                    (call wr out ( (+ " " op.vref " ") false))
                                )
                                (call ctx setInExpr ())
                                (call this WalkNode (item ctx wr))
                                (call ctx unsetInExpr ())
                            )
                        )
                    )
                    (if ( > (call ctx expressionLevel ()) 1 )
                        (call wr out (")" false))
                    )

                    (call this shouldBeType ("boolean" firstChild ctx "Logical operator expects boolean as the first parameter."))
                    (for node.children ch:CodeNode i
                        (
                            (if (> i 1)
                                 (call this shouldBeEqualTypes (firstChild ch ctx "Logic operator expects boolean arguments."))                                                   
                            )
                        )
                    )
                    
                )
            )

(gitdoc "README.md"

"
## + add operator

Addition is defined for numbers and strings. If the first parameter is string then
numbers are atomatically converted to string. If first parameter is numeric then
rest of the parameters are assumed to be numeric too.

```
(def age:int 26)
(= x (+ x 1))
(print (+ \"Your age is now \" age))
```

HUOM! Tyyppitarkastukset numeroille eivät vielä noudata tätä speksiä. Tarkastettava että ei
tule JS tyyppisiä outouksia konversiosta.

")  

            ; operator "+"
            (PublicMethod cmdPlusOp:void (node:CodeNode ctx:RangerAppWriterContext wr:CodeWriter)
                (
                    (def op:CodeNode (call node getFirst ()))

                    (if ( > (call ctx expressionLevel ()) 1 )
                        (call wr out ("(" false))
                    )
                    ;(&& a b c d)
                    (for node.children item:CodeNode i
                        (if (> i 0)
                            (
                                (if (> i 1)
                                    (call wr out ( (+ " " op.vref " ") false))
                                )
                                (call ctx setInExpr ())
                                (call this WalkNode (item ctx wr))
                                (call ctx unsetInExpr ())
                            )
                        )
                    )
                    (if ( > (call ctx expressionLevel ()) 1 )
                        (call wr out (")" false))
                    )
                )
            )

(gitdoc "README.md"

"
## Mathematical operators

```
(* 10 20) ; 200
(/ 9 2)   ; 4.5
(- 50 10) ; 40
(% 5 2)   ; 1
```

")  
            

            ; operators "*", -", "/", "%"
            (PublicMethod cmdNumericOp:void (node:CodeNode ctx:RangerAppWriterContext wr:CodeWriter)
                (
                    (def op:CodeNode (call node getFirst ()))

                    (if ( > (call ctx expressionLevel ()) 1 )
                        (call wr out ("(" false))
                    )
                    ;(&& a b c d)
                    (for node.children item:CodeNode i
                        (if (> i 0)
                            (
                                (if (> i 1)
                                    (call wr out ( (+ " " op.vref " ") false))
                                )
                                (call ctx setInExpr ())
                                (call this WalkNode (item ctx wr))
                                (call ctx unsetInExpr ())
                                (call this shouldBeNumeric (item ctx (+ "Operator " op.vref "expects numberic arguments")))
                            )
                        )
                    )
                    (if ( > (call ctx expressionLevel ()) 1 )
                        (call wr out (")" false))
                    )
                )
            )

(gitdoc "README.md"

"
## if

```
(if condition
    (
        ; then statements
    )
    (
        ; else statements
    )
)
```

")  
            

            (PublicMethod cmdIf:void (node:CodeNode ctx:RangerAppWriterContext wr:CodeWriter)
                (
                    (call wr newline ())
                    (def n1:CodeNode (call node getSecond ()))
                    (def n2:CodeNode (call node getThird ()))

                    ; 
                    (call wr out ("if(" false))
                        (call ctx setInExpr ())
                        (call this WalkNode (n1 ctx wr))
                        (call ctx unsetInExpr ())
                    (call wr out (") {" true))
                        (call wr indent (1))

                        (call this shouldBeExpression (n2 ctx "The second parameter of if statement should be expression"))

                        (call this WalkNode (n2 ctx wr))

                        (call wr newline ())
                        (call wr indent (-1))
                    (if (> (array_length node.children) 3)
                        (
                            (def elseb:CodeNode (itemAt node.children 3))
                            (call wr out ("} else {" true))
                            (call wr indent (1))
                            (call this WalkNode (elseb ctx wr))
                            (call wr newline ())
                            (call wr indent (-1))
                        )
                    )
                    (call wr out ("}" true))

                   (call this shouldBeType ("boolean" n1 ctx "if expects a boolean as the first parameter."))
                     
                )
            )

(gitdoc "README.md"

"
## for

```
(for someArray item:itemType i
    (
        ; loop expressions
    )
)
```

")  

            ;(for list node indexname loop)
            (PublicMethod cmdFor:void (node:CodeNode ctx:RangerAppWriterContext wr:CodeWriter)
                (
                    (call wr newline ())
                    (def listField:CodeNode (itemAt node.children (1)))
                    (def nodeField:CodeNode (itemAt node.children (2)))
                    (def indexField:CodeNode (itemAt node.children (3)))
                    (def loopField:CodeNode (itemAt node.children (4)))

                    ; 

                    (def subCtx:RangerAppWriterContext (call ctx fork ()))
                    
                    (def p:RangerAppParamDesc (new RangerAppParamDesc ()))
                    (= p.name indexField.vref)
                    (= p.value_type indexField.value_type)
                    (= p.node indexField)
                    (= p.nameNode indexField)
                    (= p.is_optional false)
                    (call subCtx defineVariable (p.name p))     

                    (def p2:RangerAppParamDesc (new RangerAppParamDesc ()))
                    (= p2.name nodeField.vref)
                    (= p2.value_type nodeField.value_type)
                    (= p2.node nodeField)
                    (= p2.nameNode nodeField)
                    (= p2.is_optional false)

;                     (print (+ "defines for var " p2.name))
                    (call subCtx defineVariable (p2.name p2))   

                    (call wr out ("for( var " false))
                    (call this WalkNode (indexField subCtx wr))
                    (call wr out ("= 0; " false))
                    (call this WalkNode (indexField subCtx wr))
                    (call wr out ("< " false))
                        (call this WriteVRef (listField ctx wr))
                        ; (call wr out (listField.vref false))
                        (call wr out (".length; " false))
                        (call this WalkNode (indexField subCtx wr))
                        (call wr out ("++) { " true))
                        (call wr indent (1))
                        (call wr out ("/* new version of for loop */ " true))
                        (call wr out ("var " false))
                        (call this WalkNode (nodeField subCtx wr))
                        (call wr out ("= " false))
                        (call this WriteVRef (listField ctx wr))
                        ; (call wr out (listField.vref false))
                        (call wr out ("[" false))
                        (call this WalkNode (indexField subCtx wr))
                        (call wr out ("];" true))
                        
                        (call this WalkNode (loopField subCtx wr))
                        (call wr newline ())
                        (call wr indent (-1))
                    (call wr out ("}" true))

                    (call this shouldBeExpression (loopField ctx "For loop requires expression to evaluate."))
                )
            )

(gitdoc "README.md"

"
## while

```
(while condition
    (
        ; loop expressions
    )
)
```

")  

            (PublicMethod cmdWhile:void (node:CodeNode ctx:RangerAppWriterContext wr:CodeWriter)
                (
                    (call wr newline ())
                    (def n1:CodeNode (call node getSecond ()))
                    (def n2:CodeNode (call node getThird ()))

                    ; 
                    (call wr out ("while(" false))
                        (call ctx setInExpr ())
                        (call this WalkNode (n1 ctx wr))
                        (call ctx unsetInExpr ())
                    (call wr out (") {" true))
                        (call wr indent (1))
                        (call this WalkNode (n2 ctx wr))
                        (call wr newline ())
                        (call wr indent (-1))
                    (call wr out ("}" true))

                    (call this shouldBeType ("boolean" n1 ctx "while expects a string as the first parameter."))
                    
                )
            )

(gitdoc "README.md"

"
## switch case

Switch-case statement can multiple case statements having one or more matching arguments.

```
(switch condition
    (case value
        (
            ; case expressions
        )
    )
    (case (value1 value2 value2) ; multiple values
        (

        )
    )
    (default (
        ; default expressions
    ))
)
```

")  

            (PublicMethod cmdDefault:void (node:CodeNode ctx:RangerAppWriterContext wr:CodeWriter)
                (
                    (call wr newline ())
                    (def n1:CodeNode (call node getSecond ()))

                    (call wr out ("default: " true))
                    (call wr indent (1))
                    (call this WalkNode (n1 ctx wr))
                    (call wr newline ())
                    (call wr out ("break;" true))
                    (call wr indent (-1))
                )
            )

            (PublicMethod cmdCase:void (node:CodeNode ctx:RangerAppWriterContext wr:CodeWriter)
                (
                    (call wr newline ())
                    (def n1:CodeNode (call node getSecond ()))
                    (def n2:CodeNode (call node getThird ()))

                    (if n1.expression
                        (
                            ; (call this shouldBeEqualTypes (cItem n1 ctx))  
                            (for n1.children item:CodeNode i
                                (
                                    (call wr out ("case " false))
                                    (call ctx setInExpr ())
                                    (call this WalkNode (item ctx wr))

                                    (call this shouldBeEqualTypes (item (itemAt n1.children 0) ctx "case statement expects arguments to be of the same type."))

                                    (= node.eval_type item.eval_type)
                                    (= node.eval_type_name item.eval_type_name)     

                                    (call ctx unsetInExpr ())
                                    (call wr out (":" true))
                                )
                            )
                        )
                        (
                            (call wr out ("case " false))
                            (call ctx setInExpr ())
                            (call this WalkNode (n1 ctx wr))

                            (= node.eval_type n1.eval_type)
                            (= node.eval_type_name n1.eval_type_name)

                            ; (print (+ "Case type " n1.value_type " type name " n1.type_name))

                            (call ctx unsetInExpr ())
                            (call wr out (":" true))
                        )
                    )
                    (call wr indent (1))
                    (call this WalkNode (n2 ctx wr))
                    (call wr newline ())
                    (call wr out ("break;" true))
                    (call wr indent (-1))
                )
            )

            (PublicMethod cmdSwitch:void (node:CodeNode ctx:RangerAppWriterContext wr:CodeWriter)
                (
                    (call wr newline ())
                    (def n1:CodeNode (call node getSecond ()))
                    ; 
                    (call wr out ("switch(" false))
                        (call ctx setInExpr ())
                        (call this WalkNode (n1 ctx wr))
                        (call ctx unsetInExpr ())
                    (call wr out (") {" true))
                        (call wr indent (1))
                        (for node.children cItem:CodeNode i
                            (if (>= i 2)
                                (
                                 (call this WalkNode (cItem ctx wr))       
                                 (call this shouldBeEqualTypes (cItem n1 ctx "switch statement expects argument and case have same type."))                 
                                )
                            )
                        )
                        (call wr newline ())
                        (call wr indent (-1))
                    (call wr out ("}" true))
                )
            )


(gitdoc "README.md"

"
# IO operators


## file_read

TODO: pohdittava pitäisikö olla verbi `read_file`

```
(def contents:string (file_read pathName fileName))
```

")  


            (PublicMethod cmdFileRead:void (node:CodeNode ctx:RangerAppWriterContext wr:CodeWriter)
                (
                )
            )

(gitdoc "README.md"

"
## file_write

TODO: pohdittava pitäisikö olla verbi `write_file`

```
(file_write pathName fileName contentStr)
```

")  
            (PublicMethod cmdFileWrite:void (node:CodeNode ctx:RangerAppWriterContext wr:CodeWriter)
                (
                )
            )

(gitdoc "README.md"

"
## dir_exists

```
(if (dir_exists pathName)
    (
        ; do something
    )
)
```

")  


            (PublicMethod cmdIsDir:void (node:CodeNode ctx:RangerAppWriterContext wr:CodeWriter)
                (
                )
            )

(gitdoc "README.md"

"
## file_exists

```
(if (file_exists pathName fileName)
    (
        ; do something
    )
)
```

")  

            (PublicMethod cmdIsFile:void (node:CodeNode ctx:RangerAppWriterContext wr:CodeWriter)
                (
                )
            )            

(gitdoc "README.md"

"
## dir_create

```
(dir_create pathName)
```

")  

            (PublicMethod cmdCreateDir:void (node:CodeNode ctx:RangerAppWriterContext wr:CodeWriter)
                (
                )
            )                                           

(gitdoc "README.md"

"
# Environment functions

## shell_arg
```
(def value:string (shell_arg 0)) ; first shell argument as string
```

")  

            (PublicMethod cmdArgv:void (node:CodeNode ctx:RangerAppWriterContext wr:CodeWriter)
                (
                )
            )

(gitdoc "README.md"

"

## shell_arg_cnt
```
(def cnt:int (shell_arg_cnt _)) ; number of given shell arguments
```

")  

            (PublicMethod cmdArgvCnt:void (node:CodeNode ctx:RangerAppWriterContext wr:CodeWriter)
                (
                )
            )                


            (PublicMethod PublicMethod:void (node:CodeNode ctx:RangerAppWriterContext wr:CodeWriter)
                (
                )
            )

            (PublicMethod StaticMethod:void (node:CodeNode ctx:RangerAppWriterContext wr:CodeWriter)
                (
                )
            )
            

            (PublicMethod WriteComment:void (node:CodeNode ctx:RangerAppWriterContext wr:CodeWriter)
                (
                    ; (call wr out ("// " false))                    
                    ; (call wr out (node.string_value true))
                )
            )

            (PublicMethod EnterTemplateClass:void (node:CodeNode ctx:RangerAppWriterContext wr:CodeWriter)
                (
                    (print "at template class")
                    (def nameNode:CodeNode (itemAt node.children 1))
                    ;(call ctx addTemplateClass (nameNode.vref node))
                    (call ctx log (node "memory4" (+ "[entering Template class node definition " nameNode.vref "]")))
                )
            )

            ; When starting at new class declaration...
            (PublicMethod EnterClass:void (node:CodeNode ctx:RangerAppWriterContext wr:CodeWriter)
                (
                    ; ctx.currentClass
                    ; 
                    ; ctx.findClass
                    (def cn:CodeNode (itemAt node.children 1))
                    (def desc:RangerAppClassDesc (call ctx findClass (cn.vref)))
                    (def subCtx:RangerAppWriterContext (call ctx fork ()))

                   (def classWriter:CodeWriter (call ctx getFileWriter ("." "classdoc.md")))
                   (call classWriter out (( + "# " cn.vref) true))

                   (if cn.has_vref_annotation 
                    (
                        (call ctx log ( node "ann" "EnterClass Found annotated reference " ))   
                        (def ann:CodeNode cn.vref_annotation)
                        (if (> (array_length ann.children) 0)
                            (
                                (def fc:CodeNode (itemAt ann.children 0))
                                (call ctx log ( node "ann" (+ "value of first " fc.vref )))   
                            )
                        )                                            
                    )
                   )


                    (= subCtx.currentClass desc)

                    (for desc.variables p:RangerAppParamDesc i
                        (
                            ; TODO: check that the class definition sets the optional values
                            (call subCtx defineVariable (p.name p))
                        )
                    )

                    @todo("Class variables are not available in the static methods! So this maybe wrong place to initialize class vars")
                    (call this CreateClass (node subCtx wr))                     
                )
            )
            
            ; When starting at new method
            (PublicMethod EnterMethod:void (node:CodeNode ctx:RangerAppWriterContext wr:CodeWriter)
                (                   

                    (call this shouldHaveChildCnt (4 node ctx "Method expexts four arguments"))

                    (def cn:CodeNode (itemAt node.children 1))                    
                    (def fnBody:CodeNode (itemAt node.children 3))                    
                    (def desc:RangerAppClassDesc (call ctx getCurrentClass ()))        

                    (def classWriter:CodeWriter (call ctx getFileWriter ("." "classdoc.md")))
                    (call classWriter out (( + " - **" cn.vref "** (") false))
                    
                    ; (print (+ "Entering " desc.name "::" cn.vref))

                    (def subCtx:RangerAppWriterContext (call ctx fork ()))
                    (= subCtx.is_function true)

                    ; get method description
                    (def m:RangerAppFunctionDesc (call desc findMethod (cn.vref)))

                    (= subCtx.currentMethod m) 

                    (for m.params v:RangerAppParamDesc i 
                        (
                            (call subCtx defineVariable (v.name v))
                            (call classWriter out (( + "*" v.name "* ") false))
                            
                        )
                    )
                    (call classWriter out (( + ") : " cn.type_name " ") true))
                    
                    (call this PublicMethod (node subCtx wr))        
                )
            )


            (PublicMethod EnterStaticMethod:void (node:CodeNode ctx:RangerAppWriterContext wr:CodeWriter)
                (                   
 
                    (call this shouldHaveChildCnt (4 node ctx "StaticMethod expexts four arguments"))

                    (def cn:CodeNode (itemAt node.children 1))                    
                    (def fnBody:CodeNode (itemAt node.children 3))                    
                    (def desc:RangerAppClassDesc (call ctx getCurrentClass ()))        

                    (call ctx log (node "memory4" (+ "[creating static method " cn.vref "]")))


                    ; (print (+ "Entering " desc.name "::" cn.vref))

                    (def subCtx:RangerAppWriterContext (call ctx fork ()))
                    (= subCtx.is_function true)

                    ; get method description
                    (def m:RangerAppFunctionDesc (call desc findStaticMethod (cn.vref)))

                    (= subCtx.currentMethod m) 

                    (for m.params v:RangerAppParamDesc i 
                        (
                            ; (print (+ "param:" v.name))
                            ; defineVariable
                            (call subCtx defineVariable (v.name v))
                        )
                    )                    
                    (call this StaticMethod (node subCtx wr))        

                )
            )

            ; set the local variable definition
            (PublicMethod EnterVarDef:void (node:CodeNode ctx:RangerAppWriterContext wr:CodeWriter)
                (   

                    (if (call ctx isInMethod ())
                        (
                            ; (def n:Type <initializer>)
                            (def cn:CodeNode (itemAt node.children 1))                    
                            (def desc:RangerAppClassDesc (call ctx getCurrentClass ()))         
                                    
                            ; (print (+ "Defining variable " cn.vref))
                            (def p:RangerAppParamDesc (new RangerAppParamDesc ()))
                            (= p.name cn.vref)
                            (= p.value_type cn.value_type)
                            (= p.node node)
                            (= p.nameNode cn)
                            (= p.varType RangerContextVarType.LocalVariable)

                            (if cn.has_vref_annotation 
                                (
                                    (call ctx log ( node "ann" "At a variable -> Found has_vref_annotation annotated reference " ))   
                                    (def ann:CodeNode cn.vref_annotation)
                                    (if (> (array_length ann.children) 0)
                                        (
                                            (def fc:CodeNode (itemAt ann.children 0))
                                            (call ctx log ( node "ann" (+ "value of first annotation " fc.vref " and variable name " cn.vref)))   
                                        )
                                    )                                            
                                )
                            ) 
                            ; test if var has type annotaion...
                            (if cn.has_type_annotation 
                                (
                                    (call ctx log ( node "ann" "At a variable -> Found annotated reference " ))   
                                    (def ann:CodeNode cn.type_annotation)
                                    (if (> (array_length ann.children) 0)
                                        (
                                            (def fc:CodeNode (itemAt ann.children 0))
                                            (call ctx log ( node "ann" (+ "value of first annotation " fc.vref " and variable name " cn.vref)))   
                                        )
                                    )                                            
                                )
                            )                            

                            ; set param desc to the node
                            (= cn.hasParamDesc true)
                            (= cn.paramDesc p)

                            (= cn.eval_type cn.value_type)
                            (= cn.eval_type_name cn.type_name)

                            (if (> (array_length node.children) 2)
                                (
                                    (= p.set_cnt 1)
                                    (= p.def_value (itemAt node.children 2))
                                    (= p.is_optional false)
                                )
                                (
                                    (= p.is_optional true)
                                )
                            )
                            (call ctx defineVariable (p.name p))
                            (call this DefineVar (node ctx wr))      

                            (if (> (array_length node.children) 2)
                                (
                                    (call this shouldBeEqualTypes (cn p.def_value ctx "Variable was assigned an incompatible type."))
                                    (def valueNode:CodeNode p.def_value)
                                    (if (> (array_length valueNode.ownedInstances) 0)
                                        (
                                            ; (print "defined variable which now holds new instance")
                                            (call node getInstancesFrom (valueNode))
                                            ; (dbglog "memory3" "--> moved ownership of instances to the current node")
                                        )
                                    )
                                        
                                )
                            )

                            (call RangerAllocations EnterVarDef (node ctx wr))
           
                        )
                        (

                            (def cn:CodeNode (itemAt node.children 1))                    
                            (= cn.eval_type cn.value_type)
                            (= cn.eval_type_name cn.type_name)

                            ;(def p:RangerAppParamDesc (new RangerAppParamDesc ()))
                            ;(= p.name cn.vref)
                            ;(= p.value_type cn.value_type)
                            ;(= p.node node)
                            ;(= p.nameNode cn)

                            ;(= p.varType RangerContextVarType.ThisProperty)

                           ; (= cn.hasParamDesc true)
                           ; (= cn.paramDesc p)


                            ; Note: no need for defineVariable call because the class variable is
                            ; defined when entering the class
                            (call this DefineVar (node ctx wr))                     
                            (if (> (array_length node.children) 2)
                                (
                                    (call this shouldBeEqualTypes ((itemAt node.children 1) (itemAt node.children 2) ctx "Variable was assigned an incompatible type."))    
                                )
                            )           

                        )
                    )     
                )
            )
            

            (PublicMethod WalkNodeChildren:boolean (node:CodeNode ctx:RangerAppWriterContext wr:CodeWriter)
                (
                    (if (call node hasStringProperty ("todo")) 
                        (
                            (call ctx addTodo ( node (call node getStringProperty ("todo"))))
                        )
                    )
                    
                    (if node.expression
                        (
                            (for node.children item:CodeNode i
                                (
                                    (call this WalkNode (item ctx wr))
                                )
                            )
                        )
                    )
                    ; (if (call node isFirstVref ("Extends"))                                      
                )
            )             

            (PublicMethod WalkNode:boolean (node:CodeNode ctx:RangerAppWriterContext wr:CodeWriter)
                (
                    (if (null? node)
                        (return false)
                    )

                    (if (call node hasStringProperty ("todo")) 
                        (
                            (call ctx addTodo ( node (call node getStringProperty ("todo"))))
                        )
                    )

                    (if (call node isPrimitive ())
                        (
                            (call this WriteScalarValue(node ctx wr))
                            (return true)
                        )
                    )
                    (if (== node.value_type RangerNodeType.VRef)
                        (
                            (call this WriteVRef(node ctx wr))
                            (return true)                            
                        )
                    )
                    (if (== node.value_type RangerNodeType.Comment)
                        (
                            (call this WriteComment(node ctx wr))
                            (return true)                            
                        )
                    )
                    (if (call node isFirstVref ("Extends")) ( (return true) ) )                    

                    (if (call node isFirstVref ("Import")) ((call this cmdImport (node ctx wr)) (return true) ) )                    
                    (if (call node isFirstVref ("def")) ((call this EnterVarDef (node ctx wr)) (return true) ) )                    
                    (if (call node isFirstVref ("TemplateClass")) ( (call this EnterTemplateClass (node ctx wr)) (return true) ) )
                    (if (call node isFirstVref ("CreateClass")) ( (call this EnterClass (node ctx wr)) (return true) ) )
                    (if (call node isFirstVref ("PublicMethod")) ( (call this EnterMethod (node ctx wr)) (return true) ) )
                    (if (call node isFirstVref ("StaticMethod")) ( (call this EnterStaticMethod (node ctx wr)) (return true) ) )
                    (if (call node isFirstVref ("Constructor")) ( (call this Constructor (node ctx wr)) (return true) ) )

                    ; check if this is a function call...
                    (if (> (array_length node.children) 0)
                        (
                            (def fc:CodeNode (itemAt node.children 0))
                            (if ( && (!null? fc) (== fc.value_type RangerNodeType.VRef) )
                                (
                                    (def was_called:boolean true)
                                    (switch fc.vref

                                        (case "Enum" (call this cmdEnum (node ctx wr)) )
                                   
                                        (case "if" (call this cmdIf (node ctx wr)) )
                                        (case "while" (call this cmdWhile (node ctx wr)) )
                                        (case "for" (call this cmdFor (node ctx wr)) )
                                        (case "break" (call this cmdBreak (node ctx wr)) )
                                        (case "continue" (call this cmdContinue (node ctx wr)) )

                                        (case "dbglog" (call this cmdLog (node ctx wr)) )

                                        (case "throw" (call this cmdThrow (node ctx wr)) )
                 
                                        (case "switch" (call this cmdSwitch (node ctx wr)) )
                                        (case "case" (call this cmdCase (node ctx wr)) )
                                        (case "default" (call this cmdDefault (node ctx wr)) )
                                        
                                        (case "return" (call this cmdReturn (node ctx wr)) )
                                        (case "call" (call this cmdCall (node ctx wr)) )
                                        (case "new" (call this cmdNew (node ctx wr)) )

                                        (case "doc" (call this cmdDoc (node ctx wr)) )

                                        (case "gitdoc" (call this cmdGitDoc (node ctx wr)) )
                                        
                                        (case "print" (call this cmdPrint (node ctx wr)) )

                                        (case "has" (call this cmdHas (node ctx wr)) )
                                        (case "get" (call this cmdGet (node ctx wr)) )
                                        (case "set" (call this cmdSet (node ctx wr)) )

                                        (case "null?" (call this cmdIsNull (node ctx wr)) )
                                        (case "!null?" (call this cmdNotNull (node ctx wr)) )
                                        (case "trim" (call this cmdTrim (node ctx wr)))
                                        (case "join" (call this cmdJoin (node ctx wr)))
                                        (case "strsplit" (call this cmdSplit (node ctx wr)))
                                        (case "strlen" (call this cmdStrlen (node ctx wr)))

                                        (case "charAt" (call this cmdCharAt (node ctx wr)))
                                        (case "substring" (call this cmdSubstring (node ctx wr)))
                                        (case "charcode" (call this cmdCharcode (node ctx wr)))
                                        (case "strfromcode" (call this cmdStrfromcode (node ctx wr)))
                                        (case "double2str" (call this cmdDouble2Str (node ctx wr)))
                                        (case "str2int" (call this cmdStr2Int (node ctx wr)))
                                        (case "str2double" (call this cmdStr2Double (node ctx wr)))

                                        (case "array_length" (call this cmdArrayLength (node ctx wr)))
                                        (case "array_extract" (call this cmdExtractArray (node ctx wr)))
                                        (case "itemAt" (call this cmdItemAt (node ctx wr)) )
                                        (case "indexOf" (call this cmdIndexOf (node ctx wr)) )
                                        (case "remove_index" (call this cmdRemoveIndex (node ctx wr)) )

                                        (case "push" (call this cmdPush (node ctx wr)) )
                                        (case "removeLast" (call this cmdRemoveLast (node ctx wr)) )

                                        (case "shell_arg_cnt" (call this cmdArgvCnt (node ctx wr)))
                                        (case "shell_arg" (call this cmdArgv (node ctx wr)))

                                        (case "file_read" (call this cmdFileRead (node ctx wr)))
                                        (case "file_write" (call this cmdFileWrite (node ctx wr)))
                                        (case "file_exists" (call this cmdIsFile (node ctx wr)))
                                        (case "dir_exists" (call this cmdIsDir (node ctx wr)))
                                        (case "dir_create" (call this cmdCreateDir (node ctx wr)))

                                        (case "+" (call this cmdPlusOp (node ctx wr)) )
                                        (case "=" (call this cmdAssign (node ctx wr)) )
                                        (case ("sin" "cos" "tan" "atan" "log" "abs" "acos" "asin" "floor" "round" "sqrt")
                                              (call this cmdMathLibOp (node ctx wr))
                                        )
                                        (case ("==" "<" ">" "!=" ">=" "<=")
                                              (call this cmdComparisionOp (node ctx wr))
                                        )
                                        (case ("&&" "||")
                                              (call this cmdLogicOp (node ctx wr))
                                        )
                                        (case ("*" "-" "/" "%")
                                              (call this cmdNumericOp (node ctx wr))
                                        )

                                        (default 
                                            (
                                                (= was_called false)
                                            )
                                        )
                                    )
                                    (if was_called
                                        (return true)
                                    )
                                    ; the variable type should be checked
                                    ; (print ( + "Possible call to " fc.vref))
                                    (if (call this cmdLocalCall (node ctx wr))
                                        (return true)
                                    )
                                )
                            )
                        )
                    )


                    (if node.expression
                        (
                            (for node.children item:CodeNode i
                                (
                                    (WalkNode item ctx wr)
                                )
                            )
                        )
                    )
                    ; (if (call node isFirstVref ("Extends"))                                      
                )
            )   


            (PublicMethod StartCodeWriting (node:CodeNode ctx:RangerAppWriterContext wr:CodeWriter)
                (
                    (call this FindWeakRefs (node ctx wr))

                    ; at this point all the information for building the classes should be collected
                    ; using the CollectMethods function. 
                    (call this WalkNode (node ctx wr))

                    ; after writing write native code
                    ; @javascript
                    ; getStringProperty
                    (def lang:string (call this getWriterLang ()))
                    (if (call node hasStringProperty (lang))
                        (
                            (call wr newline ())
                            (call wr out ( (call node getStringProperty (lang))  true))
                        )
                    )
                    
                )
            )       

            (PublicMethod FindWeakRefs:void (node:CodeNode ctx:RangerAppWriterContext wr:CodeWriter)
                (
                    ; list classes etc...
                    (def list:[RangerAppClassDesc] (call ctx getClasses ()))
                    (for list classDesc:RangerAppClassDesc i
                        (
                            ; (call ctx log (node "memory4" (+ "class =>" classDesc.name " ")))      

                            (for classDesc.variables varD:RangerAppParamDesc i2
                                (
                                    (if ( == varD.refType RangerNodeRefType.Weak)
                                        (
                                            ; (call ctx log (node "memory4" (+ "/* Weak variable : "  varD.name "*/" ) ))
                                            (if (call varD isArray ())
                                                (
                                                    (def nn:CodeNode varD.nameNode)
                                                    ;(call ctx log (node "memory4" (+ "/* Weak ARRAY variable : "  varD.name " in class " classDesc.name " => " nn.array_type "*/" )))
                                                )
                                            )
                                            (if (call varD isHash ())
                                                (
                                                    (def nn:CodeNode varD.nameNode)
                                                    ;(call ctx log (node "memory4" (+ "/* Weak HASH variable : "  varD.name " in class " classDesc.name " => " nn.array_type "*/" )))
                                                )
                                            )
                                            (if (call varD isObject ())
                                                (
                                                    (def nn:CodeNode varD.nameNode)
                                                    ;(call ctx log (node "memory4" (+ "/* Weak OBJECT variable : "  varD.name " in class " classDesc.name " to " nn.type_name "*/" )))
                                                )
                                            )
                                        
                                        )
                                    )
                                )
                            )
                        )
                    )
                    ; (call ctx log (node "memory4" (+ "[creating static method " cn.vref "]")))
                    
                )
            )

            (PublicMethod CollectMethods:void (node:CodeNode ctx:RangerAppWriterContext wr:CodeWriter)
                (
                    (def find_more:boolean true)

                    (if (call node isFirstVref ("Extends"))
                        (
                            (def extList:CodeNode (itemAt node.children 1))
                            (def currC:RangerAppClassDesc ctx.currentClass)

                            (for extList.children ee:CodeNode ii
                                (
                                    ; (print (+ "Extending --> "  ee.vref))
                                    (call currC addParentClass (ee.vref))                                   
                                )
                            )
                        )
                    )
                
                    (if (call node isFirstVref ("Constructor"))
                        (
                            (def currC:RangerAppClassDesc ctx.currentClass)
                            (= currC.has_constructor true)
                            (= currC.constructor_node node)

                            (def m:RangerAppFunctionDesc (new RangerAppFunctionDesc ()))
                            (= m.name "Constructor")
                            (= m.node node)
                            (= m.nameNode (itemAt node.children 0))

                            ; parse arguments...
                            (def args:CodeNode (itemAt node.children 1))
                            ; (print (array_length args.children))
                            (for args.children arg:CodeNode ii 
                                (
                                    ; (print arg.vref)
                                    (def p:RangerAppParamDesc (new RangerAppParamDesc ()))
                                    (= p.name arg.vref)
                                    (= p.value_type arg.value_type)
                                    (= p.node arg)
                                    (= p.nameNode arg)

                                    @todo("reftype of constructor function param could be strong or weak")
                                    (= p.refType RangerNodeRefType.Weak)
                                    (= p.varType RangerContextVarType.FunctionParameter)
                                    (= arg.hasParamDesc true)                                
                                    (= arg.paramDesc p)
                                    

                                    (= arg.eval_type arg.value_type)
                                    (= arg.eval_type_name arg.type_name)
                        
                                    (push m.params p)
                                )
                            )
                            (= currC.constructor_fn m)

                        )
                    )                    

                    (if (call node isFirstVref ("CreateClass"))
                        (
                            (def s:string (call node getVRefAt (1)))
                            ; (print (+ "Found class " s))

                            (def new_class:RangerAppClassDesc (new RangerAppClassDesc ()))
                            (= new_class.name s)
                            (= ctx.currentClass new_class)
                            (= new_class.ctx ctx)
                            (call ctx addClass (s new_class))
                        )
                    )

                    (if (call node isFirstVref ("TemplateClass"))
                        (
                            (def s:string (call node getVRefAt (1)))
                            ; (print (+ "Found class " s))

                            ;(def new_class:RangerAppClassDesc (new RangerAppClassDesc ()))
                            ;(= new_class.name s)
                            ;(= ctx.currentClass new_class)
                            ;(= new_class.ctx ctx)
                            (call ctx addTemplateClass (s node))

                            (= find_more false)
                            
                        )
                    )
                    
                    (if (call node isFirstVref ("def"))
                        (
                            (def s:string (call node getVRefAt (1)))
                            ; (print (+ "DEF " s ))
                            
                            ; --
                            (def vDef:CodeNode (itemAt node.children 1))

                            ; add new variable with name
                            (def p:RangerAppParamDesc (new RangerAppParamDesc ()))
                            (= p.name s)
                            (= p.value_type vDef.value_type)
                            (= p.node node)            
                            (= p.is_class_variable true)            
                            (= p.varType RangerContextVarType.Property)
                            (= p.nameNode vDef)

                            (= vDef.hasParamDesc true)                                
                            (= vDef.paramDesc p)

                            (if (call node hasBooleanProperty ("weak"))
                                (
                                    (= p.refType RangerNodeRefType.Weak)
                                )
                                (
                                    (= p.refType RangerNodeRefType.Strong)
                                )
                            )

                            (if (> (array_length node.children) 2)
                                (
                                    (= p.set_cnt 1)
                                    (= p.def_value (itemAt node.children 2))
                                    (= p.is_optional false)
                                )
                                (
                                    (= p.is_optional true)
                                )
                            )

                            (def currC:RangerAppClassDesc ctx.currentClass)
                            (call currC addVariable (p))
                        )
                    )

                    (if (call node isFirstVref ("StaticMethod"))
                        (
                            (def s:string (call node getVRefAt (1)))
                            (def currC:RangerAppClassDesc ctx.currentClass)
                            ; (print (+ "--> " s "::" currC.name))
                            ; collecting the method data
                            (def m:RangerAppFunctionDesc (new RangerAppFunctionDesc ()))
                            (= m.name s)
                            (= m.node node)
                            (= m.is_static true)
                            (= m.nameNode (itemAt node.children 1))

                            ; parse arguments...
                            (def args:CodeNode (itemAt node.children 2))
                            ; (print (array_length args.children))
                            (for args.children arg:CodeNode ii 
                                (
                                    ; (print arg.vref)
                                    (def p:RangerAppParamDesc (new RangerAppParamDesc ()))
                                    (= p.name arg.vref)
                                    (= p.value_type arg.value_type)
                                    (= p.node arg)
                                    (= p.nameNode arg)

                                    @todo("reftype of function param could be strong or weak")
                                    (= p.refType RangerNodeRefType.Weak)
                                    (= p.varType RangerContextVarType.FunctionParameter)
                                    (= arg.hasParamDesc true)                                
                                    (= arg.paramDesc p)

                                    (= arg.eval_type arg.value_type)
                                    (= arg.eval_type_name arg.type_name)
                                
                                    (push m.params p)
                                )
                            )

                            ; return_value

                            (call currC addStaticMethod (m))
                            (= find_more false)
                        )
                    )
                    
                    (if (call node isFirstVref ("PublicMethod"))
                        (
                            (def s:string (call node getVRefAt (1)))
                            (def currC:RangerAppClassDesc ctx.currentClass)
                            ; (print (+ "--> " s "::" currC.name))
                            ; collecting the method data
                            (def m:RangerAppFunctionDesc (new RangerAppFunctionDesc ()))
                            (= m.name s)
                            (= m.node node)
                            (= m.nameNode (itemAt node.children 1))

                            ; set function refType to correct value
                            (if (call node hasBooleanProperty ("strong"))
                                (= m.refType RangerNodeRefType.Strong)
                                (= m.refType RangerNodeRefType.Weak)
                            )

                            ; parse arguments...
                            (def args:CodeNode (itemAt node.children 2))
                            ; (print (array_length args.children))
                            (for args.children arg:CodeNode ii 
                                (
                                    ; (print arg.vref)
                                    (def p2:RangerAppParamDesc (new RangerAppParamDesc ()))
                                    (= p2.name arg.vref)
                                    (= p2.value_type arg.value_type)
                                    (= p2.node arg)
                                    (= p2.nameNode arg)

                                    @todo("reftype of function param could be strong or weak")
                                    (= p2.refType RangerNodeRefType.Weak)
                                    (= p2.initRefType RangerNodeRefType.Weak)
                                    (= p2.debugString "--> collected ")
                                    (if (call args hasBooleanProperty ("strong"))
                                        (
                                            (= p2.debugString "--> collected as STRONG")
                                            (call ctx log ( node "memory5" "strong param should move local ownership to call ***") )
                                            (= p2.refType RangerNodeRefType.Strong)       
                                            (= p2.initRefType RangerNodeRefType.Strong)                                 
                                        )
                                    )
                                   
                                    (= p2.varType RangerContextVarType.FunctionParameter)
                                    (= arg.hasParamDesc true)                                
                                    (= arg.paramDesc p2)

                                    (= arg.eval_type arg.value_type)
                                    (= arg.eval_type_name arg.type_name)
                                    

                                    (push m.params p2)
                                )
                            )

                            ; return_value

                            (call currC addMethod (m))
                            (= find_more false)
                        )
                    )

                    (if find_more
                        (for node.children item:CodeNode i
                            (
                                (call this CollectMethods (item ctx wr))
                            )
                        )         
                    )           
                )
            )                  

            (PublicMethod DefineVar (node:CodeNode ctx:RangerAppWriterContext wr:CodeWriter)
                (
                    (print "ERROR: DefineVar not implemented!")
                )
            )


        )
    )
    
)